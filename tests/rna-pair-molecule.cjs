/* DOM and schematic geometry invariants; browser text/layout QA is separate. */
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const fs=require('node:fs'),path=require('node:path');
const script=path.join(__dirname,'../starter/js/rna-pair-molecule.js');
const SEQUENCE='GGACGAAACGUCC';
// Zero-based versions of the three single-stem teaching candidates.
const shapes={mfe:[[0,12],[1,11],[2,10],[3,9],[4,8]],long_loop:[[0,12],[1,11],[2,10],[3,9]],frayed:[[1,11],[2,10],[3,9],[4,8]]};
const plain=value=>JSON.parse(JSON.stringify(value));
const close=(a,b,label='coordinate')=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<1e-9,`${label}: ${a} vs ${b}`);
function setup(t){
 assert.ok(fs.existsSync(script),'reusable RNA actor exists in the starter');
 const dom=new JSDOM('<svg xmlns="http://www.w3.org/2000/svg"></svg>',{runScripts:'outside-only'}),w=dom.window;
 t.after(()=>w.close());
 w.C=Object.fromEntries(['blue','teal','gold','grey','white'].map(k=>[k,'var(--color-'+k+')']));
 for(const file of ['layout.js','rna-pair-molecule.js'])w.eval(fs.readFileSync(path.join(path.dirname(script),file),'utf8'));
 return {w,PM:w.PM,svg:w.document.querySelector('svg')};
}

test('three single-stem shapes have finite, fresh sequence-indexed coordinate factories',t=>{
 const {PM}=setup(t);
 for(const [name,pairs] of Object.entries(shapes)){
  const flat=PM.sequenceCoordinates(SEQUENCE,pairs),hairpin=PM.hairpinCoordinates(SEQUENCE,pairs),helix=PM.helixCoordinates(SEQUENCE,pairs);
  assert.deepEqual(plain(PM.coordinates(SEQUENCE,pairs)),plain(flat),name+' flat corner');
  for(const [state,expected] of [[{fold:1},hairpin],[{fold:1,depth:1},helix]]){
   PM.coordinates(SEQUENCE,pairs,state).forEach((point,i)=>point.forEach((value,axis)=>close(value,expected[i][axis],name+' morph corner')));
  }
  for(const fold of [0,.25,.5,.75,1])for(const depth of [0,.5,1])for(const variant of [0,1]){
   const a=PM.coordinates(SEQUENCE,pairs,{fold,depth,variant});
   assert.equal(a.length,SEQUENCE.length);
   assert.ok(a.every(p=>p.length===3&&p.every(Number.isFinite)));
   if(fold===0||depth===0)assert.ok(a.every(p=>p[2]===0),'spatial geometry is gated by folding');
  }
  flat[0][0]=999;assert.equal(PM.sequenceCoordinates(SEQUENCE,pairs)[0][0],-300,'fresh coordinates');
  assert.equal(PM.sequenceCoordinates(SEQUENCE,pairs,{step:20})[12][0],120);
 }
});

test('loop variants preserve paired stem and outer tails in every supported shape',t=>{
 const {PM}=setup(t);
 for(const pairs of Object.values(shapes)){
  const a=PM.helixCoordinates(SEQUENCE,pairs,{variant:0}),b=PM.helixCoordinates(SEQUENCE,pairs,{variant:1});
  const start=pairs[0][0]+pairs.length,end=pairs[0][1]-pairs.length;
  a.forEach((p,i)=>{if(i<start||i>end)assert.deepEqual(plain(p),plain(b[i]));else assert.notDeepEqual(plain(p),plain(b[i]));});
 }
});

test('both stem strands are right-handed after converting screen y to physical up',t=>{
 const {PM}=setup(t),sub=(a,b)=>a.map((v,i)=>v-b[i]);
 for(const pairs of Object.values(shapes)){
  const physical=PM.helixCoordinates(SEQUENCE,pairs).map(p=>[p[0],-p[1],p[2]]);
  for(const side of [0,1])for(let k=0;k<pairs.length-3;k++){
   const p=pairs.slice(k,k+4).map(pair=>physical[pair[side]]),a=sub(p[1],p[0]),b=sub(p[2],p[1]),c=sub(p[3],p[2]);
   const cross=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
   assert.ok(cross.reduce((sum,v,i)=>sum+v*c[i],0)>0,'positive discrete torsion');
  }
 }
});

test('all SVG identities persist through intermediate morphs, turns and reverse replay',t=>{
 const {PM,svg}=setup(t);
 for(const pairs of Object.values(shapes)){
  const actor=PM.create(svg,{sequence:SEQUENCE,pairs}),nodes=new Set(actor.g.querySelectorAll('*'));
  const bases=[...actor.nodes],links=[...actor.links],backbone=[...actor.backbone];
  for(const fold of [0,.1,.3,.7,1,.7,.3,0])for(const depth of [0,.5,1]){
   actor.paint({fold,depth,yaw:.18,pitch:-.1,variant:depth,pairProgress:1,focusPair:2});
   assert.deepEqual(new Set(actor.g.querySelectorAll('*')),nodes);
   actor.nodes.forEach((node,i)=>assert.equal(node,bases[i]));
   actor.links.forEach((link,i)=>assert.equal(link,links[i]));
   actor.backbone.forEach((segment,i)=>assert.equal(segment,backbone[i]));
   for(const node of nodes)for(const attribute of node.attributes)assert.ok(!/NaN|Infinity|undefined/.test(attribute.value),attribute.name);
   actor.positions().forEach((p,i)=>{assert.equal(p.index,i);assert.equal(p.base,SEQUENCE[i]);});
  }
  actor.dispose();actor.g.remove();
 }
});

test('local origins, parent coordinates, scale and radian camera rotations are explicit',t=>{
 const {PM,svg}=setup(t),actor=PM.create(svg,{radius:10});
 for(const state of [{fold:0,depth:1},{fold:1,depth:0},{fold:1,depth:1}]){
  actor.paint({...state,cx:420,cy:300,scale:1.5,yaw:Math.PI/2});
  const raw=PM.coordinates(SEQUENCE,shapes.mfe,state),spatial=state.fold*state.depth;
  actor.positions().forEach((p,i)=>{
   close(p.x,420+1.5*(spatial?raw[i][2]:raw[i][0]));close(p.y,300+1.5*raw[i][1]);
   close(p.z,spatial?-1.5*raw[i][0]:0);assert.equal(p.r,15);
  });
 }
 actor.paint({fold:1,depth:1,cx:0,cy:0,pitch:Math.PI/2});
 const raw=PM.helixCoordinates();actor.positions().forEach((p,i)=>{close(p.x,raw[i][0]);close(p.y,-raw[i][2]);close(p.z,raw[i][1]);});
});

test('API indices stay zero-based while visible residues and pair metadata are one-based',t=>{
 const {PM,svg}=setup(t),pairs=plain(shapes.mfe),actor=PM.create(svg,{pairs});
 assert.equal(actor.sequence,SEQUENCE);
 actor.nodes.forEach((node,i)=>{
  assert.equal(node.base,node.letter);assert.equal(node.letter.textContent,SEQUENCE[i]);assert.equal(node.index.textContent,String(i+1));
  assert.equal(node.g.dataset.baseIndex,String(i));assert.equal(node.g.dataset.basePosition,String(i+1));
 });
 assert.equal(actor.links[0].g.dataset.pair,'1,13');assert.equal(actor.links[0].g.dataset.pairIndex,'0');
 actor.paint({fold:1,pairProgress:1,focusPair:4});
 actor.nodes.forEach((node,i)=>assert.equal(node.halo.getAttribute('opacity'),[4,8].includes(i)?'1':'0'));
 pairs[0][0]=9;actor.pairs[0][0]=8;actor.positions()[0].x=999;actor.point(0).x=998;actor.bounds().x=997;
 actor.paint();assert.equal(actor.links[0].g.dataset.pair,'1,13');assert.equal(actor.point(0).x,340);assert.notEqual(actor.bounds().x,997);
 assert.equal(actor.point(-1),null);assert.equal(actor.point(13),null);assert.equal(actor.pairPoint(5),null);
});

test('pair anchors follow the displayed cubic path from arcs to attached rungs',t=>{
 const {PM,svg}=setup(t),actor=PM.create(svg);
 for(const fold of [0,.25,.7,1]){
  actor.paint({fold,depth:1,yaw:.12,pitch:.06,pairProgress:1});
  actor.pairs.forEach(([i,j],k)=>{
   const a=actor.point(i),b=actor.point(j),start=actor.pairPoint(k,0),end=actor.pairPoint(k,1);
   for(const key of ['x','y','z']){close(start[key],a[key]);close(end[key],b[key]);}
   assert.deepEqual(plain(actor.pairPoint(k,-1)),plain(start));assert.deepEqual(plain(actor.pairPoint(k,2)),plain(end));
   const path=actor.links[k].line.getAttribute('d').match(/-?\d+(?:\.\d+)?/g).map(Number),mid=actor.pairPoint(k,.5);
   for(const [axis,key] of ['x','y'].entries())assert.ok(Math.abs(mid[key]-(path[axis]+3*path[axis+2]+3*path[axis+4]+path[axis+6])/8)<.001);
   if(fold===0)assert.ok(mid.y<(a.y+b.y)/2,'sequence pair arcs bend upward');
   if(fold===1){close(mid.x,(a.x+b.x)/2);close(mid.y,(a.y+b.y)/2);}
  });
 }
});

test('current bounds cover the beads and paints reset omitted state to defaults',t=>{
 const {PM,svg}=setup(t),actor=PM.create(svg),initial=actor.g.outerHTML;
 for(const fold of [0,.1,.5,1])for(const depth of [0,.5,1]){
  actor.paint({fold,depth,variant:1,pairProgress:[1,.8,.6,.4,.2],support:[.2,.4,.6,.8,1],yaw:.2,pitch:.1,indexOpacity:.8,highlightResidues:[6]});
  const b=actor.bounds();assert.ok(Object.values(b).every(Number.isFinite));
  actor.positions().forEach(p=>{assert.ok(p.x-p.r>=b.x&&p.x+p.r<=b.x+b.width);assert.ok(p.y-p.r>=b.y&&p.y+p.r<=b.y+b.height);});
 }
 actor.paint();assert.equal(actor.g.outerHTML,initial);
});

test('disposal unregisters only owned text contracts and is idempotent',t=>{
 const {PM,svg,w}=setup(t),a=PM.create(svg),b=PM.create(svg);
 assert.equal(w.L.audit(svg,{visibleOnly:false}).contracted,52);
 const before=a.g.outerHTML,last=a.point(0);a.dispose();a.dispose();
 assert.equal(w.L.audit(svg,{visibleOnly:false}).contracted,26);assert.equal(a.g.outerHTML,before);
 assert.throws(()=>a.paint(),/disposed/);assert.deepEqual(plain(a.point(0)),plain(last));
 b.paint({fold:1});b.dispose();assert.equal(w.L.audit(svg,{visibleOnly:false}).contracted,0);
});

test('unsupported stems, invalid residues and short loops fail before creating SVG',t=>{
 const {PM,svg}=setup(t),invalid=[[],[[0,12],[2,10]],[[0,12],[1,11],[3,9]],[[0,8],[1,9]],[[0,12],[0,11]],[[0,13]],[[1.5,11]],[[0,3]],[[0,12],,[2,10]]];
 for(const pairs of invalid){
  for(const factory of ['sequenceCoordinates','hairpinCoordinates','helixCoordinates','coordinates'])assert.throws(()=>PM[factory](SEQUENCE,pairs),undefined,factory+' '+JSON.stringify(pairs));
  assert.throws(()=>PM.create(svg,{pairs}));assert.equal(svg.childElementCount,0);
 }
 for(const sequence of ['',null,'GGTC','ggac'])assert.throws(()=>PM.coordinates(sequence,shapes.mfe));
 for(const step of [0,-1,NaN,Infinity])assert.throws(()=>PM.sequenceCoordinates(SEQUENCE,shapes.mfe,{step}));
 for(const radius of [0,-1,NaN,Infinity]){assert.throws(()=>PM.create(svg,{radius}));assert.equal(svg.childElementCount,0);}
});
