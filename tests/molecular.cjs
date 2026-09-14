const {test}=require('node:test');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const fs=require('node:fs'),path=require('node:path');
function setup(){
 const dom=new JSDOM('<svg id="s" xmlns="http://www.w3.org/2000/svg"></svg>',{runScripts:'outside-only'});
 const w=dom.window;w.C=Object.fromEntries(['blue','teal','gold','purple','red','grey'].map(k=>[k,'var(--color-'+k+')']));w.K={};
 w.eval(fs.readFileSync(path.join(__dirname,'../starter/js/molecular.js'),'utf8'));
 return {w,B:w.B,s:w.document.querySelector('svg')};
}
test('enlargement changes geometry, not apparent contour width',()=>{
 const {B,s}=setup(),cas=B.cas9(s,{scale:3});
 const edge=cas.recognition.querySelector('[stroke]');
 assert.ok(Math.abs(+edge.getAttribute('stroke-width')*3-1.25)<1e-9);
 const before=[...cas.g.querySelectorAll('*')];B.place(cas,50,100,.6);
 assert.ok(Math.abs(+edge.getAttribute('stroke-width')*.6-1.25)<1e-9);
 assert.deepEqual([...cas.g.querySelectorAll('*')],before);
});
test('part focus is stronger than context and reverses without changing biology or node identity',()=>{
 const {B,s}=setup(),a=B.guide(s,{scale:3,dual:true});a.set({joined:1,bound:.7});
 const nodes=[...a.g.querySelectorAll('*')],before=JSON.stringify(a.state),sp=a.spacerStrand,sc=a.scaffold.querySelector('path');
 const normal=+sp.getAttribute('stroke-width');
 B.emphasis(a,{level:'focus',part:'spacer',color:'var(--color-red)'});
 assert.ok(+sp.getAttribute('stroke-width')>normal);assert.ok(+sp.getAttribute('stroke-opacity')>+sc.getAttribute('stroke-opacity'));
 assert.equal(sp.getAttribute('stroke'),'var(--color-red)');assert.equal(JSON.stringify(a.state),before);
 assert.equal(a.repeat.querySelector('path').getAttribute('stroke'),'var(--color-gold)');
 B.emphasis(a,{level:'normal'});assert.equal(+sp.getAttribute('stroke-width'),normal);assert.equal(sp.getAttribute('stroke'),'var(--color-gold)');
 assert.deepEqual([...a.g.querySelectorAll('*')],nodes);
 assert.throws(()=>B.emphasis(a,{level:'focus',part:'missing'}),/part/);
});
test('backbone anchors match drawn curve endpoints, distinct from layout centers',()=>{
 const {B,s}=setup(),d=B.dna(s,{width:413,period:61,phase:.4}),n=B.nucleosome(s);
 d.set({open:1,openX:180,openWidth:180});
 const xy=d.strands[0].getAttribute('d').match(/[-\d.]+/g).map(Number);
 assert.ok(Math.abs(d.anchors.strandAEnd[1]-xy[xy.length-1])<.006);
 assert.notEqual(d.anchors.strandAEnd[1],d.anchors.right[1]);
 const paths=[...n.g.querySelectorAll('[data-bio-part^="wrapped-dna"] path')];
 const coords=paths.flatMap(p=>{const nums=p.getAttribute('d').match(/[-\d.]+/g).map(Number);return [[nums[0],nums[1]],[nums.at(-2),nums.at(-1)]];});
 for(const k of ['strandAStart','strandAEnd','strandBStart','strandBEnd'])assert.ok(coords.some(p=>Math.hypot(p[0]-n.anchors[k][0],p[1]-n.anchors[k][1])<.01));
});
test('invalid placement cannot corrupt an actor',()=>{
 const {B,s}=setup(),a=B.cas9(s);const t=a.g.getAttribute('transform');
 for(const scale of [0,-1,NaN,Infinity])assert.throws(()=>B.place(a,10,20,scale));
 assert.throws(()=>B.place(a,NaN,20,1));assert.equal(a.g.getAttribute('transform'),t);
});
test('invalid constructor placement leaves no partial actor in the scene',()=>{
 const {w,B,s}=setup();
 for(const name of ['molecular-regulation.js','molecular-rna-processing.js'])w.eval(fs.readFileSync(path.join(__dirname,'../starter/js',name),'utf8'));
 B.cas9(s,{x:90,y:120,scale:1.2});const before=s.innerHTML,nodes=[...s.querySelectorAll('*')];
 for(const name of ['dna','cas9','polymerase','nucleosome','guide','protein','transcript','histoneTail','mediator','initiationComplex','cas12a','cas13','preMrna','spliceosome']){
  for(const opts of [{scale:0},{scale:-1},{scale:NaN},{scale:Infinity},{scale:'2'},{x:NaN},{y:Infinity},{x:'12'},{y:false}]){
   assert.throws(()=>B[name](s,opts),name+' invalid placement');
   assert.equal(s.innerHTML,before,name+' must reject before creating its group');
   assert.deepEqual([...s.querySelectorAll('*')],nodes);
  }
 }
});
test('R-loop, guide assembly and histone marks preserve their physical distinctions',()=>{
 const {B,s}=setup(),d=B.dna(s,{width:400}),g=B.guide(s,{dual:true}),n=B.nucleosome(s);
 const ids=[...d.g.querySelectorAll('*')];const closed=d.strands[0].getAttribute('d');d.set({open:1});
 assert.notEqual(d.strands[0].getAttribute('d'),closed);assert.deepEqual([...d.g.querySelectorAll('*')],ids);
 assert.equal(g.join.getAttribute('opacity'),'0');g.set({joined:1});assert.equal(g.pairing.getAttribute('opacity'),'0');
 n.set({marked:1});assert.equal(n.marks.querySelectorAll('circle[stroke]').length,2);
 assert.equal(n.marks.closest('[data-bio-actor]').getAttribute('data-bio-actor'),'nucleosome');
});
