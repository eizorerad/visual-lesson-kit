const {test}=require('node:test');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'../starter');
function setup(){
 const dom=new JSDOM('<svg xmlns="http://www.w3.org/2000/svg"></svg>',{runScripts:'outside-only'}),w=dom.window;
 w.K={};w.C=Object.fromEntries(['blue','teal','gold','purple','red','grey'].map(k=>[k,'var(--color-'+k+')']));
 for(const p of ['lib/dom.js','film.js','perspective.js','molecular-coordinates.js'])w.eval(fs.readFileSync(path.join(root,'js',p),'utf8'));
 return {w,MC:w.MC,s:w.document.querySelector('svg')};
}
const data=()=>JSON.parse(fs.readFileSync(path.join(root,'assets/rna-folding/tertiary-v4-1hr2.json'),'utf8'));
const view={origin:[0,0,0],basis:[[1,0,0],[0,1,0],[0,0,1]]};
test('coordinate projection is rigid, uses degrees and reports unscaled depth',()=>{
 const {MC}=setup(),camera={origin:[1,2,3],cx:100,cy:200,scale:2,angle:90,pitch:0};
 const p=MC.project(view,[2,2,3],camera);
 assert.ok(Math.abs(p.x-100)<1e-9);assert.equal(p.y,200);assert.ok(Math.abs(p.depth+1)<1e-9);
 const a=[3,4,8],b=[7,-2,1];
 for(const angle of [0,15,130]){
  const c={...camera,angle,pitch:23},p=MC.project(view,a,c),q=MC.project(view,b,c);
  assert.ok(Math.abs(Math.hypot((p.x-q.x)/2,(p.y-q.y)/2,p.depth-q.depth)-Math.hypot(...a.map((n,i)=>n-b[i])))<1e-9);
 }
 assert.throws(()=>MC.project({...view,basis:[[2,0,0],[0,1,0],[0,0,1]]},a,camera),/basis/);
 assert.throws(()=>MC.project({...view,basis:[[-1,0,0],[0,1,0],[0,0,1]]},a,camera),/basis/);
});
test('source fragments keep atom identity through focus and camera motion; gaps never become bonds',()=>{
 const {MC,s}=setup(),d=data(),before=JSON.stringify(d),model=MC.rnaFragment(s,d,{focusIds:[153,223,250]});
 const camera={origin:d.origin,cx:500,cy:350,scale:8,angle:14,pitch:0};model.paint(camera);
 const nodes=new Set(model.g.querySelectorAll('*')),snapshot=JSON.stringify(model.row(153).atoms);
 for(const angle of [20,32,56])model.paint({...camera,angle},{focus:.7,detail:1});
 assert.deepEqual(new Set(model.g.querySelectorAll('*')),nodes);
 assert.equal(JSON.stringify(d),before);assert.equal(JSON.stringify(model.row(153).atoms),snapshot);
 assert.equal(model.g.querySelectorAll('[data-tertiary-covalent]').length,d.bonds.length);
 assert.equal(model.g.querySelector('[data-tertiary-covalent="158-220"]'),null);
 assert.equal(model.g.querySelector('[data-tertiary-covalent="229-245"]'),null);
 d.residues.find(r=>r.id===153).atoms.N1[0]=999;
 assert.equal(JSON.stringify(model.row(153).atoms),snapshot,'view owns an immutable coordinate snapshot');
});
test('invalid structures and paints fail before modifying the scene',()=>{
 const {MC,s}=setup();
 for(const corrupt of [d=>delete d.residues[0].atoms.N1,d=>d.bonds.push([158,999]),d=>d.residues.push(d.residues[0]),d=>d.residues[0].atoms.N1[0]=Infinity,d=>delete d.residues.at(-1).atoms["C1'"][1]]){
  const d=data();corrupt(d);assert.throws(()=>MC.rnaFragment(s,d));assert.equal(s.children.length,0);
 }
 const d=data(),m=MC.rnaFragment(s,d),c={origin:d.origin,cx:500,cy:350,scale:8,angle:0};m.paint();m.paint(c);
 const before=s.innerHTML;
 for(const change of [{scale:-1},{angle:NaN},{origin:[1,2]},{scale:1e308}]){assert.throws(()=>m.paint({...c,...change}));assert.equal(s.innerHTML,before);}
 assert.throws(()=>m.paint(c,{focus:2}));assert.equal(s.innerHTML,before);
});
test('context maps the same selected residues inside a reusable box',()=>{
 const {MC,s}=setup(),d=data(),selection=new Set([153,223,250]);
 const q=MC.context(s,d,selection,()=> 'gold',{box:{x:700,y:200,width:180,height:240},leaderX:950});
 assert.equal(q.querySelectorAll('[data-tertiary-context-residue]').length,157);
 assert.equal(q.querySelectorAll('[data-tertiary-context-bond]').length,156);
 for(const n of q.querySelectorAll('circle')){assert.ok(+n.getAttribute('cx')>=700&&+n.getAttribute('cx')<=880);assert.ok(+n.getAttribute('cy')>=200&&+n.getAttribute('cy')<=440);}
 assert.throws(()=>MC.context(s,d,new Set([999])),/selection/);
});
