/* Independent projected-bond regression, using semantic states rather than film times. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require(process.env.JSDOM_MODULE||'jsdom'),root=path.resolve(__dirname,'../..');
const full={fold:1,simple:1,model:1,angle:15,mgCharge:1,mgAtmosphere:1,mgSelect:1,mgZoom:1,mgWater:1,mgBridge:1};
function setup(t){
 const dom=new JSDOM('<svg xmlns="http://www.w3.org/2000/svg"></svg>',{runScripts:'outside-only'}),w=dom.window;t.after(()=>w.close());
 w.C=Object.fromEntries(['blue','teal','gold','grey','white','purple'].map(k=>[k,k]));
 for(const file of ['lib/dom.js','film.js','trna-data.js','trna-atoms.js','trna-magnesium-data.js','trna-magnesium-story.js','trna-world.js'])w.eval(fs.readFileSync(path.join(root,'js',file),'utf8'));
 return w;
}
function intersection(a,b,c,d){
 const x=b[0]-a[0],y=b[1]-a[1],u=d[0]-c[0],v=d[1]-c[1],det=x*v-y*u;
 if(Math.abs(det)<1e-9)return false;
 const dx=c[0]-a[0],dy=c[1]-a[1],s=(dx*v-dy*u)/det,t=(dx*y-dy*x)/det;
 return s>0&&s<1&&t>0&&t<1;
}
function crossings(w,s){
 const c=w.TrnaWorld.cameraFor(s),project=w.TrnaAtoms.projector(c),groups=w.TRNA_MAGNESIUM_DATA.phosphateGroups;
 const atoms=new Map(groups.flatMap(g=>g.atoms.map(a=>[a.id,project(a.xyz)]))),hits=[];
 for(let i=0;i<groups.length;i++)for(let j=i+1;j<groups.length;j++)for(const a of groups[i].covalentBonds)for(const b of groups[j].covalentBonds)
  if(intersection(...a.map(id=>atoms.get(id)),...b.map(id=>atoms.get(id))))hits.push({groups:[groups[i].id,groups[j].id],a:[...a],b:[...b]});
 return hits;
}
test('fully revealed Mg view keeps source phosphate fragments visually separate',t=>{
 const w=setup(t),target=w.TrnaMagnesiumStory.cues.find(c=>c[1].mgBridge===1)[1];
 assert.deepEqual(crossings(w,{...full,...target}),[],'Separate phosphate bonds must not form a joined polygon in projection');
});
test('visible phosphate reveal avoids inter-fragment crossings throughout the bridge turn',t=>{
 const w=setup(t),target=w.TrnaMagnesiumStory.cues.find(c=>c[1].mgBridge===1)[1];
 for(let i=59;i<=100;i++){
  const b=i/100;
  assert.deepEqual(crossings(w,{...full,mgBridge:b,mgTurn:target.mgTurn*b}),[],`Crossed phosphate fragments at bridge fraction ${b}`);
 }
});
test('all three narrated water–phosphate guides remain visible beyond their endpoint spheres',t=>{
 const w=setup(t),data=w.TRNA_MAGNESIUM_DATA,target=w.TrnaMagnesiumStory.cues.find(c=>c[1].mgBridge===1)[1];
 const project=w.TrnaAtoms.projector(w.TrnaWorld.cameraFor({...full,...target}));
 const atoms=new Map([...data.waters,...data.phosphateGroups.flatMap(g=>g.atoms)].map(a=>[a.id,a]));
 for(const link of data.waterPhosphateContacts){
  const [a,b]=link.atomIds.map(id=>project(atoms.get(id).xyz)),clear=Math.hypot(a[0]-b[0],a[1]-b[1])-12-5.6;
  assert.ok(clear>=18,`Contact ${link.atomIds.join('–')} needs visible dashes between spheres; available ${clear.toFixed(2)} px`);
 }
});
test('hydration, bridge and return cameras preserve handedness and keep visible atoms inside the main clip',t=>{
 const w=setup(t),data=w.TRNA_MAGNESIUM_DATA,target=w.TrnaMagnesiumStory.cues.find(c=>c[1].mgBridge===1)[1],source=JSON.stringify(data);
 const records=[data.magnesium,...data.waters,...data.phosphateGroups.flatMap(g=>g.atoms)],waterIds=new Set(data.waters.map(a=>a.id));
 const paths=[
  b=>({...full,mgBridge:0,mgZoom:b,mgWater:b,mgTurn:0}),
  b=>({...full,mgBridge:b,mgTurn:target.mgTurn*b}),
  b=>({...full,mgCharge:b,mgAtmosphere:b,mgSelect:b,mgZoom:b,mgWater:b,mgBridge:b,mgTurn:target.mgTurn*b})
 ];
 for(const [index,path] of paths.entries())for(let i=0;i<=100;i++){
  const s=path(i/100),camera=w.TrnaWorld.cameraFor(s),project=w.TrnaAtoms.projector(camera),[x,y,z]=camera.basis;
  const det=x[0]*(y[1]*z[2]-y[2]*z[1])-x[1]*(y[0]*z[2]-y[2]*z[0])+x[2]*(y[0]*z[1]-y[1]*z[0]);
  assert.ok(Math.abs(det-1)<1e-10,`Reflected camera on path ${index}, sample ${i}`);
  camera.basis.forEach((a,j)=>camera.basis.forEach((b,k)=>assert.ok(Math.abs(a.reduce((n,v,l)=>n+v*b[l],0)-(j===k?1:0))<1e-10)));
  for(const atom of records){
   const hydration=w.F.phase(s.mgWater,0,.85)*w.F.phase(s.mgZoom,.45,1),bridge=w.F.phase(s.mgBridge,.58,1)*w.F.phase(s.mgZoom,.45,1);
   const r=atom.id===data.magnesium.id?(5.5+14.5*s.mgZoom)*s.mgSelect:waterIds.has(atom.id)?12*hydration:(atom.element==='P'?8.5:5.6)*bridge;
   if(r<=0)continue;
   const [px,py]=project(atom.xyz);
   assert.ok(px-r>=328&&px+r<=934&&py-r>=188&&py+r<=610,`Clipped atom ${atom.id} on path ${index}, sample ${i}`);
  }
  if(s.mgBridge>.58&&s.mgZoom>.45)assert.deepEqual(crossings(w,s),[],`Crossed fragments on path ${index}, sample ${i}`);
 }
 assert.equal(JSON.stringify(data),source,'Camera motion must preserve source coordinates');
});
