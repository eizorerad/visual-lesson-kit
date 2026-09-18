/* Source geometry, persistent objects and staged Mg/water/phosphate rendering.
 * NODE_PATH=<runtime node_modules> node --test qa/trna/magnesium.cjs */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require(process.env.JSDOM_MODULE||'jsdom');
const root=path.resolve(__dirname,'../..'),near=(a,b)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<1e-8,`${a} != ${b}`);
const plain=x=>JSON.parse(JSON.stringify(x)),full={mgCharge:1,mgAtmosphere:1,mgSelect:1,mgZoom:1,mgWater:1,mgBridge:1,mgTurn:0};
function setup(t){
 const file=path.join(root,'js/trna-magnesium.js');assert.ok(fs.existsSync(file),'The magnesium actor module must exist');
 const dom=new JSDOM('<svg xmlns="http://www.w3.org/2000/svg"></svg>',{runScripts:'outside-only'}),w=dom.window;t.after(()=>w.close());
 w.C=Object.fromEntries(['blue','teal','gold','grey','red','white','purple'].map(k=>[k,'var(--color-'+k+')']));
 for(const name of ['lib/dom.js','film.js','trna-atoms.js','trna-magnesium-data.js','trna-sphere-renderer.js','trna-magnesium.js'])w.eval(fs.readFileSync(path.join(root,'js',name),'utf8'));
 const data=w.TRNA_MAGNESIUM_DATA,camera={origin:data.view_origin,basis:data.view_basis,cx:640,cy:390,scale:45,angle:0,tilt:0};
 const actor=w.TrnaMagnesium.create(w.document.querySelector('svg'));t.after(actor.dispose);return {w,actor,data,camera};
}
test('all real Mg, water O and phosphate atoms retain source coordinates through rotation',t=>{
 const {w,actor,data,camera}=setup(t),records=[data.magnesium,...data.waters,...data.phosphateGroups.flatMap(p=>p.atoms)];
 assert.equal(data.waters.length,6);assert(data.waters.every(a=>a.element==='O'));assert(records.every(a=>a.element!=='H'));
 assert.deepEqual([...actor.g.querySelectorAll('[data-magnesium-atom]')].map(n=>+n.dataset.magnesiumAtom).sort((a,b)=>a-b),[...new Set(records.map(a=>a.id))].sort((a,b)=>a-b));
 for(const angle of [0,18,36,-12]){
  const c={...camera,angle},out=actor.render({...full,mgTurn:angle},c);
  for(const a of records){const actual=out.atom(a.id),expected=w.TrnaAtoms.project(a.xyz,c);actual.forEach((v,i)=>near(v,expected[i]));}
  out.mg.forEach((v,i)=>near(v,w.TrnaAtoms.project(data.magnesium.xyz,c)[i]));
  assert.equal(out.waters.length,6);assert.equal(out.phosphates.length,3);
 }
});
test('six coordination guides and three water–phosphate contacts use true deposited endpoints, with no Mg–RNA solid link',t=>{
 const {actor,data,camera}=setup(t),out=actor.render(full,camera);
 const pairs=kind=>[...actor.g.querySelectorAll(`[data-magnesium-guide="${kind}"]`)];
 const checks=[['coordination',data.coordinationLinks],['water-phosphate',data.waterPhosphateContacts],['covalent',data.phosphateGroups.flatMap(p=>p.covalentBonds.map(atomIds=>({atomIds})))]];
 for(const [kind,links] of checks){
  const nodes=pairs(kind);assert.equal(nodes.length,links.length);
  for(const link of links){const ids=plain(link.atomIds),node=nodes.find(n=>JSON.stringify(JSON.parse(n.dataset.atomIds))===JSON.stringify(ids));assert.ok(node);
   const endpoints=JSON.parse(node.dataset.endpoints);ids.forEach((id,i)=>endpoints[i].forEach((v,k)=>near(v,out.atom(id)[k])));
   if(kind==='covalent'){assert(!ids.includes(data.magnesium.id));assert(!node.hasAttribute('stroke-dasharray'));}
   else assert(node.getAttribute('stroke-dasharray'));
  }
 }
});
test('whole-view charge markers persist when the illustrative atmosphere screens the field cue',t=>{
 const {actor,camera}=setup(t),whole={...full,mgZoom:0,mgWater:0,mgBridge:0,mgAtmosphere:0};
 actor.render(whole,camera);const charges=actor.g.querySelector('[data-magnesium-charges]'),fields=actor.g.querySelector('[data-magnesium-fields]'),cloud=actor.g.querySelector('[data-magnesium-atmosphere]');
 const initialCharge=+charges.style.opacity,initialField=+fields.style.opacity;
 assert(initialCharge>0&&initialField>0);assert.equal(+cloud.style.opacity,0);assert.equal(charges.querySelectorAll('text').length,0,'Minus signs are line glyphs, not uncontracted labels');
 actor.render({...whole,mgAtmosphere:1},camera);near(+charges.style.opacity,initialCharge);assert(+fields.style.opacity<initialField);assert(+cloud.style.opacity>0);
 actor.render(full,camera);assert.equal(+cloud.style.opacity,0);assert.equal(+charges.style.opacity,0);
});
test('seeking reuses every actor and a repeated paused frame does not redraw the sphere canvas',t=>{
 const {actor,data,camera}=setup(t),source=JSON.stringify(data),nodes=new Set(actor.g.querySelectorAll('*'));
 const states=[{...full,mgZoom:0,mgWater:0,mgBridge:0},{...full,mgWater:.5,mgBridge:0},full];
 const snapshots=states.map(s=>{actor.render(s,camera);return actor.g.outerHTML;});const count=actor.renderer.frames;
 actor.render(full,camera);assert.equal(actor.renderer.frames,count);
 for(let i=states.length-1;i>=0;i--){actor.render(states[i],camera);assert.equal(actor.g.outerHTML,snapshots[i]);assert.deepEqual(new Set(actor.g.querySelectorAll('*')),nodes);}
 actor.render({},camera);assert.equal(actor.g.style.display,'none');actor.render(full,camera);assert.equal(actor.g.outerHTML,snapshots[2]);assert.equal(JSON.stringify(data),source);
 actor.dispose();const frames=actor.renderer.frames;actor.render(full,camera);assert.equal(actor.renderer.frames,frames,'Disposed renderer stays inert');
});
