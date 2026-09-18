/* Run: NODE_PATH=/path/to/jsdom/node_modules node --test qa/trna/atoms.cjs */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require(process.env.JSDOM_MODULE||'jsdom');
const root=path.resolve(__dirname,'../..');
const fixture=JSON.parse(fs.readFileSync(path.join(root,'assets/rna-folding/duplex-connected-1ehz.json'),'utf8'));
const plain=x=>JSON.parse(JSON.stringify(x));
const near=(a,b)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<1e-9,`${a} != ${b}`);
function setup(t){
 const dom=new JSDOM('<svg xmlns="http://www.w3.org/2000/svg"></svg>',{runScripts:'outside-only'}),w=dom.window;
 t.after(()=>w.close());w.C=Object.fromEntries(['blue','teal','gold','grey','white'].map(k=>[k,'var(--color-'+k+')']));
 for(const file of ['lib/dom.js','film.js','trna-atoms.js'])w.eval(fs.readFileSync(path.join(root,'js',file),'utf8'));
 return {w,T:w.TrnaAtoms,svg:w.document.querySelector('svg')};
}
function reference(xyz,camera={}){
 const {origin=fixture.view_origin,basis=fixture.view_basis,cx=477,cy=388,scale=11.6,angle=38,tilt=10}=camera;
 const d=xyz.map((x,i)=>x-origin[i]),a=basis.map(v=>v.reduce((sum,x,i)=>sum+x*d[i],0)),t=angle*Math.PI/180,p=tilt*Math.PI/180;
 const x=a[0]*Math.cos(t)+a[2]*Math.sin(t),z=-a[0]*Math.sin(t)+a[2]*Math.cos(t);
 return [cx+scale*x,cy-scale*(a[1]*Math.cos(p)-z*Math.sin(p)),a[1]*Math.sin(p)+z*Math.cos(p)];
}
test('embedded source is exact and retains all 299 atoms with source IDs',t=>{
 const {T}=setup(t);assert.deepEqual(plain(T.data),fixture);
 assert.equal(T.data.residues.reduce((n,r)=>n+Object.keys(r.atoms).length,0),299);
 assert.deepEqual(plain(T.origin),fixture.view_origin);assert.deepEqual(plain(T.basis),fixture.view_basis);
 assert.equal(T.data.pdb_id,'1EHZ');assert.equal(T.data.auth_asym_id,'A');assert.equal(T.data.model,1);
 assert.ok(Object.isFrozen(T.data));assert.ok(Object.isFrozen(T.data.residues[0].atoms));
});
test('projection matches original camera and full-trace shared basis, degrees, scale and y direction',t=>{
 const {T}=setup(t),identity=[[1,0,0],[0,1,0],[0,0,1]],basis=[[0,0,1],[0,1,0],[-1,0,0]];
 for(const camera of [{},{angle:8},{angle:38,tilt:10,cx:465,cy:379,scale:11.6},{angle:69,scale:20,origin:plain(T.tripleCenter)},{origin:[0,0,0],basis,cx:600,cy:340,scale:4,angle:71,tilt:-24}]){
  for(const r of fixture.residues)for(const xyz of Object.values(r.atoms))T.project(xyz,camera).forEach((n,i)=>near(n,reference(xyz,camera)[i]));
 }
 assert.deepEqual(plain(T.project([1,2,3],{origin:[0,0,0],basis:identity,cx:10,cy:20,scale:2,angle:0,tilt:0})),[12,16,3]);
 const turn=T.project([1,2,3],{origin:[0,0,0],basis:identity,cx:0,cy:0,scale:1,angle:90,tilt:0});[3,-2,-1].forEach((n,i)=>near(turn[i],n));
});
test('created chemical graph has 332 covalent links, twelve actual strand boundaries and no 7 to 66 shortcut',t=>{
 const {T,svg}=setup(t),actor=T.create(svg);assert.equal(actor.atomCount,299);
 assert.equal(actor.g.querySelectorAll('[data-connected-atom]').length,299);
 assert.equal(actor.g.querySelectorAll('[data-connected-bond],[data-connected-boundary]').length,332);
 const boundaries=[...actor.g.querySelectorAll('[data-connected-boundary]')].map(n=>n.dataset.connectedBoundary);
 assert.deepEqual(boundaries,['1-2','2-3','3-4','4-5','5-6','6-7','66-67','67-68','68-69','69-70','70-71','71-72']);
 assert.equal(actor.g.querySelectorAll('[data-connected-contact]').length,3);
 for(const r of fixture.residues)for(const n of Object.keys(r.atoms)){
  const atom=[...actor.g.querySelectorAll('[data-connected-atom]')].find(el=>el.dataset.connectedAtom===r.id+':'+n);
  assert.ok(atom);assert.equal(atom.dataset.residueId,String(r.id));assert.equal(atom.dataset.atomName,n);
 }
});
test('molecular centers use distinct base ring atoms; returned anchors share exactly the displayed camera',t=>{
 const {T,svg}=setup(t),actor=T.create(svg),camera={cx:800,cy:310,scale:16,angle:63,tilt:18};
 const out=actor.render(camera,{focus:1,detail:1,contacts:1,neighbors:1});
 for(const r of fixture.residues){
  const names=[...new Set(fixture.ring_atom_orders[r.component].flat())],center=[0,1,2].map(i=>names.reduce((s,n)=>s+r.atoms[n][i],0)/names.length);
  T.baseCenter(r.id).forEach((n,i)=>near(n,center[i]));
  out.center(r.id).forEach((n,i)=>near(n,T.project(center,camera)[i]));
  for(const [name,xyz] of Object.entries(r.atoms)){
   const el=[...actor.g.querySelectorAll('[data-connected-atom]')].find(el=>el.dataset.connectedAtom===r.id+':'+name),point=out.atom(r.id,name);
   point.forEach((n,i)=>near(n,T.project(xyz,camera)[i]));near(+el.getAttribute('cx'),point[0]);near(+el.getAttribute('cy'),point[1]);
  }
 }
 for(const [ids,key] of [[[3,70],'pairCenter'],[[3,4,5,68,69,70],'tripleCenter']])T[key].forEach((n,i)=>near(n,ids.reduce((s,id)=>s+T.baseCenter(id)[i],0)/ids.length));
});
test('reversible camera and emphasis changes preserve every DOM node and avoid reordering identical frames',t=>{
 const {T,svg,w}=setup(t),actor=T.create(svg),nodes=new Set(actor.g.querySelectorAll('*'));
 for(const angle of [8,19,38,54,69,38])for(const detail of [0,.2,.8,1,.1]){
  actor.render({angle},{focus:.8,detail,contacts:.6,neighbors:.4});assert.deepEqual(new Set(actor.g.querySelectorAll('*')),nodes);
  for(const el of nodes)for(const attr of el.attributes)assert.ok(!/NaN|Infinity|undefined/.test(attr.value));
 }
 const observer=new w.MutationObserver(()=>{});observer.observe(actor.g,{childList:true});
 actor.render({angle:38},{focus:.8,detail:.1,contacts:.6,neighbors:.4});
 assert.equal(observer.takeRecords().length,0,'no detach/reappend when depth order is unchanged');observer.disconnect();
});
test('hidden frames skip per-atom writes, keep useful camera anchors and resume correctly',t=>{
 const {T,svg,w}=setup(t),actor=T.create(svg);actor.render({angle:38});
 const observer=new w.MutationObserver(()=>{});observer.observe(actor.g,{childList:true,attributes:true,subtree:true});
 const out=actor.render({angle:69},{visible:false});assert.equal(actor.g.style.display,'none');
 assert.ok(observer.takeRecords().every(r=>r.target===actor.g),'only root is touched while hidden');
 out.atom(3,'N1').forEach((n,i)=>near(n,T.project(fixture.residues.find(r=>r.id===3).atoms.N1,{angle:69})[i]));
 actor.render({angle:69},{chemical:0});assert.equal(actor.g.style.display,'none');observer.takeRecords();
 actor.render({angle:69},{visible:true,chemical:.6});assert.equal(actor.g.style.display,'');near(+actor.g.style.opacity,.6);
 observer.disconnect();
});
test('invalid cameras and improper bases fail before changing any projected geometry',t=>{
 const {T,svg}=setup(t),actor=T.create(svg);actor.render();const previous=actor.g.outerHTML;
 for(const camera of [{scale:0},{angle:NaN},{origin:[0,0]},{basis:[[1,0,0],[0,1,0],[0,0,-1]]},{basis:[[2,0,0],[0,1,0],[0,0,1]]}]){
  assert.throws(()=>actor.render(camera));assert.equal(actor.g.outerHTML,previous);
 }
 assert.throws(()=>T.baseCenter(76));assert.throws(()=>T.project([1,2,NaN]));
});
