/* Reusable molecular compositions: scientific identity and lifecycle, not layout QA. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const root=path.join(__dirname,'../starter');
function setup(t){
 const dom=new JSDOM('<body><section><svg xmlns="http://www.w3.org/2000/svg"></svg></section></body>',{runScripts:'outside-only',pretendToBeVisual:true});
 t.after(()=>dom.window.close());const w=dom.window;w.matchMedia=()=>({matches:false});w.K={};
 w.C=Object.fromEntries(['blue','gold','red','grey','white','dim'].map(k=>[k,'var(--color-'+k+')']));
 for(const p of ['lib/dom.js','lib/anim.js','lesson.js','film.js','perspective.js','molecular-coordinates.js','molecular-views.js'])w.eval(fs.readFileSync(path.join(root,'js',p),'utf8'));
 return {w,MV:w.MV,MC:w.MC,s:w.document.querySelector('svg'),root:w.document.querySelector('section')};
}
const identity={pdb_id:'SYNTHETIC-TEST',model:2,coordinate_units:'Å',source_sha256:'test-only',origin:[4,5,6],basis:[[1,0,0],[0,1,0],[0,0,1]]};
const trace=()=>({...structuredClone(identity),traces:[{chain:'Z9',atom:'CA',rows:[{id:'z-1',residue:1,xyz:[-11,2,3]},{id:'z-2',residue:2,xyz:[-3,7,8]},{id:'z-8',residue:8,xyz:[23,11,-4]}],bonds:[['z-1','z-2']]},{chain:'Q',atom:'P',rows:[{id:'q-20',residue:20,xyz:[12,-3,9]},{id:'q-21',residue:21,xyz:[8,-7,3]}],bonds:[['q-20','q-21']]}]});
const fragment=()=>JSON.parse(fs.readFileSync(path.join(root,'assets/rna-folding/tertiary-v4-1hr2.json'),'utf8'));
const camera={cx:500,cy:350,scale:7,angle:18,pitch:25};
test('assembly preserves explicit source gaps, IDs, nodes and a frozen independent coordinate snapshot',t=>{
 const {MV,s}=setup(t),d=trace(),before=JSON.stringify(d),v=MV.assembly(s,d,{chains:{Z9:{color:'blue'},Q:{color:'gold',width:4}}});
 v.paint(camera);const nodes=new Set(v.g.querySelectorAll('*'));
 assert.equal(v.g.querySelectorAll('line').length,2,'never infer z-2 → z-8 across absent coordinates');
 assert.equal(v.row('Z9','z-8').residue,8);
 const atom=JSON.stringify(v.row('Z9','z-1').xyz);d.traces[0].rows[0].xyz[0]=1000;
 for(const angle of [35,75,-25])v.paint({...camera,angle},{opacity:{Z9:.2},highlight:{Q:['q-20','q-21']}});
 assert.deepEqual(new Set(v.g.querySelectorAll('*')),nodes);assert.equal(JSON.stringify(v.row('Z9','z-1').xyz),atom);
 assert.ok(Object.isFrozen(v.data.traces[0].rows[0].xyz));assert.equal(JSON.stringify(v.data),before);
 assert.equal(v.g.querySelector('[data-mv-chain="Z9"]').style.opacity,'0.2');
 assert.equal(v.g.querySelector('[data-mv-chain="Q"]').style.opacity,'1');
 const order=[...v.g.children].map(n=>+n.dataset.mvDepth);assert.deepEqual(order,[...order].sort((a,b)=>a-b));
});
test('assembly rejects invalid source/links/options before scene mutation; bad paint is atomic',t=>{
 const {MV,s}=setup(t);
 for(const corrupt of [d=>d.traces[0].bonds.push(['z-2','missing']),d=>d.traces.push(d.traces[0]),d=>d.traces[0].rows.push(d.traces[0].rows[0]),d=>d.traces[0].rows[0].xyz[2]=Infinity,d=>d.basis[0][0]=-1,d=>delete d.coordinate_units]){
  const d=trace();corrupt(d);assert.throws(()=>MV.assembly(s,d));assert.equal(s.childNodes.length,0);
 }
 assert.throws(()=>MV.assembly(s,trace(),{chains:{absent:{opacity:.2}}}));assert.equal(s.childNodes.length,0);
 const v=MV.assembly(s,trace());v.paint(camera);const before=s.innerHTML;
 for(const [c,e] of [[{...camera,scale:-1},{}],[camera,{opacity:{Q:2}}],[camera,{highlight:{Q:['absent']}}],[{...camera,cx:NaN},{}]]){assert.throws(()=>v.paint(c,e));assert.equal(s.innerHTML,before);}
});
test('fit handles asymmetric, rotated, degenerate and explicit source geometry without changing it',t=>{
 const {MV,MC}=setup(t),d=trace(),before=JSON.stringify(d),box={x:71,y:203,width:460,height:290},padding=19;
 for(const angle of [-67,0,22,90])for(const pitch of [-28,0,41]){
  const cam=MV.fit(d,{box,padding,angle,pitch}),ps=d.traces.flatMap(t=>t.rows.map(r=>MC.project(d,r.xyz,cam)));
  for(const p of ps){assert.ok(p.x>=box.x+padding-1e-8&&p.x<=box.x+box.width-padding+1e-8);assert.ok(p.y>=box.y+padding-1e-8&&p.y<=box.y+box.height-padding+1e-8);}
  assert.ok(Math.abs((Math.min(...ps.map(p=>p.x))+Math.max(...ps.map(p=>p.x)))/2-(box.x+box.width/2))<1e-8,'fit bounding box center, not centroid');
 }
 const same=MV.fit(d,{box,points:[[17,9,3],[17,9,3]]});assert.ok(Number.isFinite(same.scale)&&same.scale>0);
 const p=MC.project(d,[17,9,3],same);assert.equal(p.x,box.x+box.width/2);assert.equal(p.y,box.y+box.height/2);
 assert.equal(JSON.stringify(d),before);
 assert.throws(()=>MV.fit(d,{box,padding:400}));assert.throws(()=>MV.fit(d,{box,points:[]}));
});
test('detail composes arbitrary chain IDs on one source basis, preserving atoms and anchor identity',t=>{
 const {MV,s}=setup(t),a=fragment(),b=fragment();b.chain='X2';b.residues=b.residues.slice(0,1);b.bonds=[];
 const v=MV.detail(s,{parts:[{id:'rna',data:a,color:'gold',focusIds:[153]},{id:'partner',data:b,color:()=> 'red'}],context:{data:a,selection:new Set([153,223]),box:{x:70,y:240,width:180,height:250},leaderX:310}});
 const out=v.paint(camera,{parts:{partner:{opacity:.35}},contextOpacity:.7}),nodes=new Set(v.g.querySelectorAll('*'));
 assert.equal(out.parts.rna.row(153).id,153);assert.deepEqual(out.anchor('rna',153),v.anchor('rna',153,camera));
 assert.equal(v.g.querySelector('[data-mv-part="partner"][data-tertiary-sugar]').style.opacity,'0.35');
 const shared=v.g.querySelector('[data-mv-shared-depth]'),depths=[...shared.children].map(n=>+n.dataset.mvDepth);
 assert.deepEqual(depths,[...depths].sort((a,b)=>a-b),'depth order crosses part boundaries');
 assert.ok(new Set([...shared.children].map(n=>n.dataset.mvPart)).size===2);
 const anchor=JSON.stringify(out.anchor('rna',153));a.residues.find(r=>r.id===153).center[0]=999;
 assert.equal(JSON.stringify(out.anchor('rna',153)),anchor);
 v.paint({...camera,angle:68},{focus:.2,detail:.5});assert.deepEqual(new Set(v.g.querySelectorAll('*')),nodes);
 assert.equal(v.context.style.opacity,'1');
});
test('detail validates all parts/context/paint before touching the scene',t=>{
 const {MV,s}=setup(t);
 for(const corrupt of [d=>d.model=9,d=>d.coordinate_units='nm',d=>d.pdb_id='OTHER',d=>d.source_sha256='different',d=>d.basis=[[0,1,0],[-1,0,0],[0,0,1]],d=>delete d.residues[0].atoms.N1]){
  const a=fragment(),b=fragment();corrupt(b);assert.throws(()=>MV.detail(s,{parts:[{id:'one',data:a},{id:'two',data:b}]}));assert.equal(s.childNodes.length,0);
 }
 const d=fragment();
 for(const config of [{parts:[{id:'one',data:d},{id:'one',data:d}]},{parts:[{id:'one',data:d,focusIds:[999]}]},{parts:[{id:'one',data:d}],context:{data:d,selection:[999]}},{parts:[{id:'one',data:d}],context:{data:d,selection:[153],box:{width:-1}}}]){assert.throws(()=>MV.detail(s,config));assert.equal(s.childNodes.length,0);}
 const v=MV.detail(s,{parts:[{id:'one',data:d},{id:'two',data:d}]});v.paint(camera);const before=s.innerHTML;
 for(const e of [{parts:{two:{focus:2}}},{parts:{two:{opacity:NaN}}},{parts:{absent:{focus:1}}},{contextOpacity:2}]){assert.throws(()=>v.paint(camera,e));assert.equal(s.innerHTML,before);}
 assert.throws(()=>v.anchor('one',999,camera));assert.throws(()=>v.paint({...camera,scale:Infinity}));assert.equal(s.innerHTML,before);
});
test('detail rejects alternate-conformer mismatches before mutation and preserves legacy unknown identity',t=>{
 const {MV,s}=setup(t),small=()=>{const d=fragment();d.residues=d.residues.slice(0,1);d.bonds=[];return d;};
 for(const [left,right] of [['A','B'],['A',undefined],[undefined,'']]){
  const a=small(),b=small();if(left!==undefined)a.altloc=left;if(right!==undefined)b.altloc=right;
  assert.throws(()=>MV.detail(s,{parts:[{id:'one',data:a},{id:'two',data:b}]}),/altloc/);assert.equal(s.childNodes.length,0);
  assert.throws(()=>MV.detail(s,{parts:[{id:'one',data:a}],context:{data:b,selection:[b.residues[0].id]}}),/altloc/);assert.equal(s.childNodes.length,0);
 }
 for(const altloc of [undefined,'','A']){
  const a=small(),b=small();if(altloc!==undefined){a.altloc=altloc;b.altloc=altloc;}a.records=['ATOM'];b.records=['ATOM','HETATM'];
  const view=MV.detail(s,{parts:[{id:'one',data:a},{id:'two',data:b}]});view.paint(camera);view.g.remove();
 }
});
test('rig registers guided steps, reflects interpolation in slider and manual input cancels pending motion',async t=>{
 const {w,MV,root}=setup(t),steps=[],disposers=[],state={angle:0,focus:0};let paints=0;
 const ctx={step:fn=>steps.push(fn),onDispose:fn=>disposers.push(fn)};
 const rig=MV.rig(ctx,{state,paint:s=>{assert.equal(s,state);paints++;},steps:[{angle:40},{to:{focus:1},duration:0}],control:{root,label:'View angle',min:-60,max:60,key:'angle',x:100,y:550,width:450}});
 assert.equal(paints,1);const active=steps[0]();rig.control.input.value='17';rig.control.input.dispatchEvent(new w.Event('input'));
 assert.equal((await active).completed,false);assert.equal(state.angle,17);w.A.finishAll();assert.equal(state.angle,17);
 await steps[1]();assert.equal(state.focus,1);assert.equal(+rig.control.output.textContent,17);
 rig.driver.set({angle:27});assert.equal(+rig.control.input.value,27);assert.equal(+rig.control.output.textContent,27);
 const pending=rig.driver.to({angle:45},{duration:5000});disposers.forEach(fn=>fn());assert.equal((await pending).completed,false);
 w.A.finishAll();assert.equal(state.angle,27);assert.ok(rig.control.input.disabled);rig.control.input.value='0';rig.control.input.dispatchEvent(new w.Event('input'));assert.equal(state.angle,27);
 rig.dispose();assert.throws(()=>rig.driver.set({angle:9}),/disposed/);
});
test('rig validates the complete script and slider range before registering lifecycle or making controls',t=>{
 const {MV,root}=setup(t);let registered=0;const ctx={step:()=>registered++,onDispose:()=>registered++};
 for(const options of [{steps:[{missing:1}]},{steps:[{to:{angle:10},duration:-1}]},{control:{root,label:'Angle',min:0,max:5},steps:[{angle:10}]},{control:{root,label:'Angle',min:2,max:1}}]){
  assert.throws(()=>MV.rig(ctx,{state:{angle:0},paint:()=>{},...options}));assert.equal(registered,0);assert.equal(root.querySelector('input'),null);
 }
});
test('rig output suffix preserves numeric slider state and the empty default',t=>{
 const {MV,root}=setup(t),ctx={step(){},onDispose(){}};
 for(const suffix of [undefined,'°']){
  const state={angle:0},rig=MV.rig(ctx,{state,paint(){},control:{root,label:'Angle',min:-45,max:45,...(suffix===undefined?{}:{suffix})}});
  rig.driver.set({angle:27.25});assert.equal(+rig.control.input.value,27.25);assert.equal(state.angle,27.25);assert.equal(rig.control.output.textContent,'27.25'+(suffix||''));
  rig.control.set(18);assert.equal(+rig.control.input.value,18);assert.equal(state.angle,18);assert.equal(rig.control.output.textContent,'18'+(suffix||''));rig.dispose();
 }
});
