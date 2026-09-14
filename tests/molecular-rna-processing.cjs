const {test}=require('node:test');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const fs=require('node:fs'),path=require('node:path');
function setup(){
 const dom=new JSDOM('<svg xmlns="http://www.w3.org/2000/svg"></svg>',{runScripts:'outside-only'}),w=dom.window;
 w.C=Object.fromEntries(['blue','teal','gold','purple','red','grey'].map(k=>[k,'var(--color-'+k+')']));w.K={};
 for(const name of ['molecular.js','molecular-rna-processing.js'])w.eval(fs.readFileSync(path.join(__dirname,'../starter/js',name),'utf8'));
 return {B:w.B,s:w.document.querySelector('svg')};
}
test('RNA processing updates preserve every molecular node and finite anchors',()=>{
 const {B,s}=setup();
 for(const [name,key] of [['cas12a','opening'],['cas13','opening'],['preMrna','spliced'],['spliceosome','separation']]){
  const a=B[name](s,{scale:2.5}),nodes=[...a.g.querySelectorAll('*')];
  for(const v of [0,.25,.5,.75,1,0]){
   a.set({[key]:v});assert.deepEqual([...a.g.querySelectorAll('*')],nodes);
   for(const xy of Object.values(a.anchors))assert.ok(xy.every(Number.isFinite));
   assert.ok(a.bounds.width>0&&a.bounds.height>0);assert.ok(!a.g.outerHTML.includes('NaN'));
  }
 }
});
test('strict finite setters reject invalid patches atomically',()=>{
 const {B,s}=setup();
 for(const [name,key] of [['cas12a','opening'],['cas13','opening'],['preMrna','spliced'],['spliceosome','separation']]){
  const a=B[name](s),before=a.g.outerHTML,old=JSON.stringify(a.state);
  for(const patch of [{[key]:NaN},{[key]:'0.5'},{[key]:null},{[key]:Infinity},{[key]:-0.01},{[key]:1.01},{[key]:.6,noSuchState:1},{constructor:1},[],null,3]){
   assert.throws(()=>a.set(patch),name+' '+JSON.stringify(patch));assert.equal(a.g.outerHTML,before);assert.equal(JSON.stringify(a.state),old);
  }
  assert.throws(()=>B[name](s,{[key]:true}));
 }
 const p=B.preMrna(s),before=p.g.outerHTML;assert.throws(()=>p.set({width:1401}));assert.throws(()=>p.set({width:299}));assert.throws(()=>p.set({width:700,spliced:NaN}));assert.equal(p.g.outerHTML,before);
});
test('two reactions preserve exons, form lariat branch, then separate intron',()=>{
 const {B,s}=setup(),a=B.preMrna(s,{width:600});
 const exons=[a.exon1,a.exon2],intron=a.intron,starts=[...a.anchors.fivePrime],end=[...a.anchors.threePrime];
 assert.deepEqual([...a.anchors.exon1End],[...a.anchors.intronStart]);assert.deepEqual([...a.anchors.intronEnd],[...a.anchors.exon2Start]);
 a.set({spliced:.5});assert.deepEqual([...a.anchors.intronStart],[...a.anchors.branchpoint]);assert.deepEqual([...a.anchors.intronEnd],[...a.anchors.exon2Start]);assert.ok(a.anchors.exon1End[0]<a.anchors.intronStart[0]);
 a.set({spliced:1});assert.deepEqual([...a.anchors.exon1End],[...a.anchors.exon2Start]);assert.ok(a.anchors.intronEnd[1]>a.anchors.exon2Start[1]+60);assert.ok(a.anchors.branchpoint[1]>60);
 assert.equal(a.exon1,exons[0]);assert.equal(a.exon2,exons[1]);assert.equal(a.intron,intron);
 const initialSpan=end[0]-starts[0],newSpan=a.anchors.threePrime[0]-a.anchors.fivePrime[0];assert.ok(newSpan<initialSpan);
});
test('Cas families have distinct protein parts and no embedded target or guide',()=>{
 const {B,s}=setup(),a=B.cas12a(s),b=B.cas13(s);
 assert.notEqual(a.recognition.querySelector('path').getAttribute('d'),b.recognition.querySelector('path').getAttribute('d'));
 assert.ok(a.g.querySelector('[data-bio-part="ruvc"]'));assert.ok(b.g.querySelector('[data-bio-part="hepn-1"]'));assert.ok(b.g.querySelector('[data-bio-part="hepn-2"]'));
 for(const c of [a,b])assert.equal(c.g.querySelectorAll('[data-bio-actor="dna"],[data-bio-actor="guide"],[data-bio-actor="mrna"]').length,0);
 assert.ok(a.anchors.dnaIn[0]<a.anchors.dnaOut[0]);assert.ok(b.anchors.rnaIn[0]<b.anchors.rnaOut[0]);
});
test('Cas13 guide and recognition anchors follow the recognition lobe in an exploded view',()=>{
 const {B,s}=setup(),a=B.cas13(s,{x:430,y:350,scale:1.7});
 const initial=Object.fromEntries(['guide','recognition'].map(key=>[key,[...a.anchors[key]]]));
 for(const opening of [0,.2,.55,1,.35,0]){
  a.set({opening});
  const movement=a.recognition.getAttribute('transform').match(/translate\(([-\d.]+) ([-\d.]+)\)/).slice(1).map(Number);
  for(const key of ['guide','recognition'])for(let axis=0;axis<2;axis++){
   assert.ok(Math.abs(a.anchors[key][axis]-initial[key][axis]-movement[axis])<1e-9,key+' axis '+axis+' at '+opening);
  }
 }
});
test('spliceosome exposes RNA and protein components with normalized emphasis',()=>{
 const {B,s}=setup(),a=B.spliceosome(s,{scale:2.8}),p=a.u6.querySelector('path'),other=a.scaffold.querySelector('path[stroke]');
 assert.ok(a.u2&&a.u5&&a.u6&&a.scaffold);const width=+p.getAttribute('stroke-width')*a.scale;
 B.emphasis(a,{level:'focus',part:'u6-snrna',color:'var(--color-gold)'});assert.ok(+p.getAttribute('stroke-opacity')>+other.getAttribute('stroke-opacity'));
 B.emphasis(a,{level:'normal'});B.place(a,400,350,.7);assert.ok(Math.abs(+p.getAttribute('stroke-width')*.7-width)<1e-9);
 const nodes=[...a.g.querySelectorAll('*')];a.set({separation:1});assert.deepEqual([...a.g.querySelectorAll('*')],nodes);
});
test('RNA actors restore state, geometry and ink after scale and emphasis round trips',()=>{
 const {B,s}=setup();
 for(const [name,key] of [['cas12a','opening'],['cas13','opening'],['preMrna','spliced'],['spliceosome','separation']]){
  const a=B[name](s,{x:420,y:330,scale:1.35}),state=a.state,nodes=[...a.g.querySelectorAll('*')];
  const initial={html:a.g.outerHTML,anchors:JSON.stringify(a.anchors),bounds:JSON.stringify(a.bounds)};
  const parts=[...a.g.querySelectorAll('[data-bio-part]')].map(n=>n.dataset.bioPart);
  for(const [index,scale] of [.35,1.75,3.1,.8].entries()){
   a.set({[key]:[.35,.5,1,.6][index],...(name==='preMrna'?{width:[300,1400,980,470][index]}:{})});
   B.place(a,50+index*40,100+index*30,scale);
   for(const part of parts)B.emphasis(a,{level:'focus',part,color:'var(--color-red)',amount:.63});
   B.emphasis(a,{level:'normal'});
   for(const n of a.g.querySelectorAll('[data-bio-width]'))assert.ok(Math.abs(+n.getAttribute('stroke-width')*scale-+n.dataset.bioWidth)<1e-9,name+' normalized stroke');
   assert.equal(a.state,state);assert.deepEqual([...a.g.querySelectorAll('*')],nodes);
  }
  a.set({[key]:0,...(name==='preMrna'?{width:600}:{})});B.place(a,420,330,1.35);B.emphasis(a,{level:'normal'});
  assert.equal(a.g.outerHTML,initial.html,name+' drawing reset');assert.equal(JSON.stringify(a.anchors),initial.anchors);assert.equal(JSON.stringify(a.bounds),initial.bounds);
 }
});
test('optional RNA atlas supplies nine bilingual states and safe persistent endpoint paints',()=>{
 const {B,s}=setup(),w=s.ownerDocument.defaultView,entries=[];
 w.F={path(parent,points,color,width){const n=w.document.createElementNS('http://www.w3.org/2000/svg','path');n.setAttribute('d',points.map((p,i)=>(i?'L':'M')+p.join(' ')).join(' '));n.setAttribute('stroke',color);n.setAttribute('stroke-width',width);parent.appendChild(n);return n;}};
 w.MOLECULAR_ATLAS={add(...args){entries.push(args);},H:{text(parent,x,y,width,height,ru,en){const n=w.document.createElementNS('http://www.w3.org/2000/svg','g');parent.appendChild(n);return n;},opacity(o,v){(o.el||o.g||o).setAttribute('opacity',v);}}};
 w.eval(fs.readFileSync(path.join(__dirname,'../starter/js/recipes/molecular-rna-atlas.js'),'utf8'));
 assert.equal(entries.length,4);assert.equal(entries.reduce((n,e)=>n+e[3].length,0),9);
 for(const entry of entries){
  const [id,ru,en,cap,enCap,notes,enNotes,url,label,draw,qa]=entry;
  assert.ok(id&&ru&&en&&url&&label);assert.equal(cap.length,enCap.length);assert.equal(cap.length,notes.length);assert.equal(cap.length,enNotes.length);assert.ok(qa.qa.length&&qa.enQa.length);
  const svg=w.document.createElementNS('http://www.w3.org/2000/svg','svg');s.appendChild(svg);const api=draw({svg}),nodes=[...svg.querySelectorAll('*')];
  for(let i=0;i<=4*(cap.length-1);i++){api.paint({p:i/4});assert.deepEqual([...svg.querySelectorAll('*')],nodes);assert.ok(!svg.outerHTML.includes('NaN'));}
 }
});
