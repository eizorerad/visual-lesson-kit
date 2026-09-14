const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const {JSDOM} = require('jsdom');
const root = path.join(__dirname, '../starter/js'), plain = x => JSON.parse(JSON.stringify(x));
function setup(t) {
 const dom = new JSDOM('<body></body>', {runScripts:'outside-only', pretendToBeVisual:true}), w = dom.window;
 w.matchMedia = () => ({matches:true});
 for (const name of ['lib/dom','lib/i18n','lib/num','lib/anim','lib/plot','lib/svg','lesson','film','layout']) w.eval(fs.readFileSync(path.join(root,name+'.js'),'utf8'));
 if (fs.existsSync(path.join(root,'chemistry.js'))) w.eval(fs.readFileSync(path.join(root,'chemistry.js'),'utf8'));
 const svg = w.D.dom.s('svg'); w.document.body.append(svg); t.after(() => w.close()); return {w, svg};
}
test('chemistry core exposes bounded drawing actors', t => {
 const {w} = setup(t); assert.ok(w.CH, 'CH chemistry namespace must exist');
 for (const name of ['molecule','formula','arrow','contact','presets']) assert.equal(typeof w.CH[name], 'function');
});
test('presets have explicit composition, expected formal charge, and independent data', t => {
 const {w,svg} = setup(t); assert.ok(w.CH);
 const expected = {water:[3,0],methane:[5,0],ammonium:[5,1],ammonia:[4,0],hydroxide:[2,-1],acetate:[7,-1],methylammonium:[8,1],'trimethyllysine-fragment':[17,1]};
 for (const [name,[count,charge]] of Object.entries(expected)) {
  const p=w.CH.presets(name), view=w.CH.molecule(svg,p); assert.equal(p.atoms.length,count,name);
  assert.equal(p.atoms.reduce((sum,a)=>sum+(a.charge||0),0),charge,name);
  assert.equal(view.g.querySelectorAll('[data-atom-id]').length,count);
  for (const a of p.atoms) assert.equal(view.atoms[a.id].querySelector('[data-element]').textContent,a.element);
  p.atoms[0].x=999; assert.notEqual(w.CH.presets(name).atoms[0].x,999);
 }
 const frag=w.CH.presets('trimethyllysine-fragment'); assert.equal(frag.atoms.filter(a=>a.element==='H').length,11);
 assert.equal(frag.bonds.filter(b=>b.a==='N'||b.b==='N').length,4); assert.throws(()=>w.CH.presets('guess-molecule'));
});
test('bond geometry leaves explicit atom labels clear and order is independent of emphasis', t => {
 const {w,svg}=setup(t); assert.ok(w.CH); const v=w.CH.molecule(svg,w.CH.presets('acetate'));
 const bond=v.g.querySelector('[data-bond-id="C2-O1"]'); assert.equal(bond.dataset.bondOrder,'2');
 const before=bond.outerHTML; v.focus(['O2']); assert.equal(bond.dataset.bondOrder,'2'); assert.equal(bond.querySelectorAll('line').length,3);
 assert.notEqual(v.atoms.O2.getAttribute('opacity'),v.atoms.C1.getAttribute('opacity'));
 v.focus(null); const l=bond.querySelector('line'); assert.notEqual(+l.getAttribute('x1'),v.anchors.C2[0]);
 for(const n of v.g.querySelectorAll('[stroke]')) {assert.equal(n.getAttribute('stroke-width'),'1.25');assert.equal(n.getAttribute('vector-effect'),'non-scaling-stroke');}
 assert.ok(before); assert.ok(v.atoms.O2.querySelector('[data-formal-charge]').textContent.includes('−'));
});
test('updates preserve every atom, bond, and annotation node while updating state together', t => {
 const {w,svg}=setup(t); assert.ok(w.CH); const v=w.CH.molecule(svg,w.CH.presets('ammonium'));
 const nodes=[...v.g.querySelectorAll('*')];
 v.set({positions:{H4:[95,0]},charges:{N:0},lonePairs:{N:1},bondOrders:{'N-H4':0},showLonePairs:true});
 assert.deepEqual([...v.g.querySelectorAll('*')],nodes); assert.equal(v.state.atoms.find(a=>a.id==='N').charge,0);
 assert.equal(v.state.bonds.find(b=>b.id==='N-H4').order,0); assert.equal(v.g.querySelector('[data-bond-id="N-H4"]').getAttribute('display'),'none');
 assert.deepEqual(plain(v.anchors.H4),[95,0]); assert.ok(v.bounds.x+v.bounds.width>95);
 v.place(200,300,2); assert.equal(v.g.getAttribute('transform'),'translate(200 300) scale(2)');
 assert.equal(v.state.scale,2); assert.ok(Object.isFrozen(v.state.atoms[0]));
});
test('invalid construction and mixed setters leave DOM and state unchanged', t => {
 const {w,svg}=setup(t); assert.ok(w.CH); const p=w.CH.presets('water'),v=w.CH.molecule(svg,p),before=v.g.outerHTML,state=JSON.stringify(v.state);
 for(const patch of [{positions:{O:[9,9],missing:[0,0]}},{charges:{O:.2}},{partials:{O:NaN}},{bondOrders:{'O-H1':1.5}},{showCharges:'yes'},{lonePairs:{O:5}},{positions:{O:[1,,]}},{positions:{O:[Number.MAX_VALUE,0]}}]) {
  assert.throws(()=>v.set(patch)); assert.equal(v.g.outerHTML,before); assert.equal(JSON.stringify(v.state),state);
 }
 assert.throws(()=>v.focus(['O','unknown'])); assert.equal(v.g.outerHTML,before);
 assert.throws(()=>v.place(9,2,0)); assert.equal(v.g.outerHTML,before);
 const whole=svg.innerHTML;
 for(const invalid of [{atoms:[p.atoms[0],p.atoms[0]],bonds:[]},{atoms:p.atoms,bonds:[{a:'O',b:'no'}]},{atoms:[{id:'O',element:'CH4',x:0,y:0}],bonds:[]},{atoms:p.atoms,bonds:[{a:'O',b:'O'}]}]) {assert.throws(()=>w.CH.molecule(svg,invalid));assert.equal(svg.innerHTML,whole);}
});
test('formal and partial charges retain separate, explicit annotations', t => {
 const {w,svg}=setup(t); assert.ok(w.CH); const v=w.CH.molecule(svg,{atoms:[{id:'X',element:'N',x:0,y:0,charge:1,partial:-.4,lonePairs:1}],bonds:[]});
 v.set({showCharges:true,showPartials:true,showLonePairs:true});const a=v.atoms.X;
 assert.equal(a.querySelector('[data-formal-charge]').textContent,'+');assert.equal(a.querySelector('[data-partial-charge]').textContent,'δ−');
 assert.equal(a.querySelector('[data-partial-charge]').dataset.partialCharge,'-0.4');
 v.set({charges:{X:0},partials:{X:0}});assert.equal(a.querySelector('[data-formal-charge]').getAttribute('display'),'none');assert.equal(a.querySelector('[data-partial-charge]').getAttribute('display'),'none');
});
test('arrow kinds express full, half, double, crossed and physical vector conventions', t => {
 const {w,svg}=setup(t); assert.ok(w.CH); const arrows={};
 for(const kind of ['electron-pair','electron-single','reaction','equilibrium','resonance','force','dipole-chemical','dipole-physics']) arrows[kind]=w.CH.arrow(svg,{x1:0,y1:0,x2:100,y2:0,kind});
 const head=k=>arrows[k].g.querySelector('[data-arrow-head]').getAttribute('d');
 assert.notEqual(head('electron-single'),head('electron-pair'));assert.ok(arrows['electron-pair'].g.querySelector('[data-arrow-shaft]').getAttribute('d').includes('Q'));
 assert.notEqual(arrows.equilibrium.g.querySelector('[data-arrow-shaft]').getAttribute('d'),arrows.resonance.g.querySelector('[data-arrow-shaft]').getAttribute('d'));
 assert.equal(arrows['dipole-chemical'].g.querySelector('[data-arrow-cross]').getAttribute('display'),'inline');assert.equal(arrows['dipole-physics'].g.querySelector('[data-arrow-cross]').getAttribute('display'),'none');
 const v=arrows.reaction,nodes=[...v.g.children];v.set({x2:120,y2:50,kind:'electron-single'});assert.deepEqual([...v.g.children],nodes);
 const before=v.g.outerHTML;assert.throws(()=>v.set({x2:99,kind:'movement'}));assert.equal(v.g.outerHTML,before);assert.throws(()=>v.set({x2:0,y2:0}));assert.equal(v.g.outerHTML,before);
});
test('formula text remains contractual and contacts stay noncovalent', t => {
 const {w,svg}=setup(t);assert.ok(w.CH);const f=w.CH.formula(svg,{text:'H₂O',x:10,y:20,width:150,height:50}),el=f.el;
 f.set('NH₄⁺');assert.equal(f.el,el);assert.equal(el.textContent,'NH₄⁺');assert.ok(el.dataset.layoutId);
 const c=w.CH.contact(svg,{x1:0,y1:0,x2:80,y2:0}),line=c.g.querySelector('line');assert.ok(line.getAttribute('stroke-dasharray'));
 c.set({x2:90,y2:5});assert.equal(c.g.querySelector('line'),line);assert.equal(line.getAttribute('x2'),'90');
 const before=c.g.outerHTML;assert.throws(()=>c.set({x1:20,y2:Infinity}));assert.equal(c.g.outerHTML,before);
});
test('explicitly supplied missing numeric values are rejected, rather than clearing chemistry', t => {
 const {w,svg}=setup(t),v=w.CH.molecule(svg,w.CH.presets('water')),before=v.g.outerHTML,state=JSON.stringify(v.state);
 for(const patch of [{charges:{O:undefined}},{partials:{O:null}},{lonePairs:{O:null}},{bondOrders:{'O-H1':undefined}}]) {
  assert.throws(()=>v.set(patch));assert.equal(v.g.outerHTML,before);assert.equal(JSON.stringify(v.state),state);
 }
});
test('physical force heads differ from the open reaction arrow',t=>{
 const {w,svg}=setup(t),force=w.CH.arrow(svg,{x1:0,y1:0,x2:100,y2:0,kind:'force'}),reaction=w.CH.arrow(svg,{x1:0,y1:0,x2:100,y2:0,kind:'reaction'});
 assert.notEqual(force.g.querySelector('[data-arrow-head]').getAttribute('fill'),'none');
 assert.equal(reaction.g.querySelector('[data-arrow-head]').getAttribute('fill'),'none');
});
test('declared grouped hydrogens change labels and composition without creating atom IDs',t=>{
 const {w,svg}=setup(t),data={atoms:[{id:'C',element:'C',x:-70,y:0,hydrogens:3},{id:'N',element:'N',x:70,y:0,hydrogens:3,charge:1}],bonds:[{a:'C',b:'N'}]};
 const v=w.CH.molecule(svg,data),nodes=[...v.g.querySelectorAll('*')];
 assert.equal(v.atoms.C.querySelector('[data-element]').textContent,'CH₃');assert.equal(v.atoms.N.querySelector('[data-element]').textContent,'NH₃');
 assert.deepEqual(plain(w.CH.composition(v.state)),{elements:{C:1,H:6,N:1},charge:1,remainderCount:0});
 assert.equal(v.state.atoms[0].element,'C');assert.equal(v.state.atoms.length,2);
 v.set({hydrogens:{N:2},charges:{N:0},lonePairs:{N:1}});assert.deepEqual([...v.g.querySelectorAll('*')],nodes);
 assert.equal(v.atoms.N.querySelector('[data-element]').textContent,'NH₂');assert.equal(w.CH.composition(v.state).elements.H,5);assert.equal(w.CH.composition(v.state).charge,0);
 v.set({hydrogens:{N:1}});assert.equal(v.atoms.N.querySelector('[data-element]').textContent,'NH');
 v.set({hydrogens:{N:0}});assert.equal(v.atoms.N.querySelector('[data-element]').textContent,'N');
});
test('composition counts explicit and grouped H together and keeps R remainders separate',t=>{
 const {w}=setup(t);assert.equal(typeof w.CH.composition,'function');
 const q={atoms:[{id:'R',element:'R'},{id:'C',element:'C',hydrogens:3},{id:'H',element:'H'},{id:'O',element:'O',charge:-1}]},before=JSON.stringify(q);
 assert.deepEqual(plain(w.CH.composition(q)),{elements:{C:1,H:4,O:1},charge:-1,remainderCount:1});assert.equal(JSON.stringify(q),before);
 assert.deepEqual(plain(w.CH.composition(w.CH.presets('trimethyllysine-fragment'))),{elements:{C:4,N:1,H:11},charge:1,remainderCount:1});
 assert.ok(Object.isFrozen(w.CH.composition(q).elements));
 for(const atoms of [[{id:'a',element:'C',hydrogens:5}],[{id:'a',element:'C',hydrogens:1.5}],[{id:'a',element:'R',hydrogens:1}],[{id:'a',element:'H',hydrogens:1}],[{id:'a',element:'C'},{id:'a',element:'O'}]]) assert.throws(()=>w.CH.composition({atoms}));
});
test('grouped label width changes bond clearance, charge placement, and bounds atomically',t=>{
 const {w,svg}=setup(t),v=w.CH.molecule(svg,{atoms:[{id:'C',element:'C',x:0,y:0,charge:1},{id:'O',element:'O',x:120,y:0}],bonds:[{a:'C',b:'O'}]});
 const line=v.g.querySelector('[data-bond-id] line'),end=+line.getAttribute('x1'),charge=v.atoms.C.querySelector('[data-formal-charge]'),cx=+charge.getAttribute('x'),bounds=v.bounds;
 v.set({hydrogens:{C:3}});assert.ok(+line.getAttribute('x1')>end);assert.ok(+charge.getAttribute('x')>cx);assert.ok(v.bounds.x<bounds.x);
 const labelBox=JSON.parse(v.atoms.C.querySelector('[data-element]').dataset.layoutBox);assert.ok(labelBox.width>=60);
 const before=v.g.outerHTML,state=JSON.stringify(v.state);
 for(const patch of [{hydrogens:{C:5}},{hydrogens:{C:null}},{positions:{C:[20,0]},hydrogens:{C:-1}},{hydrogens:{unknown:2}}]) {assert.throws(()=>v.set(patch));assert.equal(v.g.outerHTML,before);assert.equal(JSON.stringify(v.state),state);}
});
test('molecule read-only placement properties support inspection without native SVG geometry',t=>{
 const {w,svg}=setup(t),v=w.CH.molecule(svg,{...w.CH.presets('water'),x:100,y:200,scale:2});
 assert.equal(v.x,100);assert.equal(v.y,200);assert.equal(v.scale,2);v.place(300,400,1.5);assert.equal(v.x,300);assert.equal(v.y,400);assert.equal(v.scale,1.5);
 for(const key of ['x','y','scale']) assert.equal(Object.getOwnPropertyDescriptor(v,key).set,undefined);
});
