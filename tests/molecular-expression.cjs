const {test}=require('node:test');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const fs=require('node:fs'),path=require('node:path');
function setup(){
  const dom=new JSDOM('<svg xmlns="http://www.w3.org/2000/svg"></svg>',{runScripts:'outside-only'}),w=dom.window;
  w.C=Object.fromEntries(['blue','teal','gold','purple','red','grey'].map(k=>[k,'var(--color-'+k+')']));w.K={};
  for(const name of ['molecular.js','molecular-expression.js'])w.eval(fs.readFileSync(path.join(__dirname,'../starter/js',name),'utf8'));
  return {B:w.B,s:w.document.querySelector('svg')};
}
test('expression state updates preserve molecular node identity and finite local anchors',()=>{
  const {B,s}=setup();
  for(const [name,patch] of [['ribosome',{separation:1}],['trna',{charged:1}],['mrna',{width:880,cap:.5,polyA:.2}],['transcriptionFactor',{bound:1}],['regulatoryLocus',{width:1000,contact:1}]]){
    const a=B[name](s,{scale:2.4}),nodes=[...a.g.querySelectorAll('*')];a.set(patch);
    assert.deepEqual([...a.g.querySelectorAll('*')],nodes,name+' replaces nodes');
    for(const [key,xy] of Object.entries(a.anchors))assert.ok(xy.every(Number.isFinite),name+'.'+key);
    assert.ok(a.bounds.width>0&&a.bounds.height>0);
    assert.ok(!a.g.outerHTML.includes('NaN'));
  }
});
test('invalid state patches fail atomically and do not corrupt a usable actor',()=>{
  const {B,s}=setup(),a=B.mrna(s),before=a.g.outerHTML,original=JSON.stringify(a.state);
  for(const patch of [{width:800,cap:NaN},{width:Infinity},{width:'500'},{cap:-1},{polyA:1.01},{unrecognised:1},{constructor:1}]){
    assert.throws(()=>a.set(patch));assert.equal(JSON.stringify(a.state),original);assert.equal(a.g.outerHTML,before);
  }
  for(const make of [()=>B.trna(s,{charged:true}),()=>B.ribosome(s,{separation:2}),()=>B.regulatoryLocus(s,{width:200}),()=>B.transcriptionFactor(s,{bound:null})])assert.throws(make);
});
test('focus remains visible without revealing an absent ligand or losing the protein silhouette',()=>{
  const {B,s}=setup(),a=B.trna(s,{scale:3}),arm=a.acceptorStem.querySelector('path'),other=a.dArm.querySelector('path');
  const normalWidth=+arm.getAttribute('stroke-width')*a.scale;
  B.emphasis(a,{level:'focus',part:'acceptor-stem',color:'var(--color-gold)'});
  assert.ok(+arm.getAttribute('stroke-width')*a.scale>normalWidth);
  assert.ok(+arm.getAttribute('stroke-opacity')>+other.getAttribute('stroke-opacity'));
  assert.equal(a.aminoAcid.getAttribute('opacity'),'0');
  a.set({charged:1});assert.equal(a.aminoAcid.getAttribute('opacity'),'1');
  B.emphasis(a,{level:'normal'});B.place(a,10,20,.8);
  assert.ok(Math.abs(+arm.getAttribute('stroke-width')*.8-normalWidth)<1e-9);
});
test('maps distinguish transcription start, translation region and free molecular interfaces',()=>{
  const {B,s}=setup(),r=B.ribosome(s),t=B.trna(s),m=B.mrna(s),l=B.regulatoryLocus(s);
  assert.ok(t.anchors.aminoAcid[1]<t.anchors.threePrime[1]);
  assert.ok(t.anchors.anticodon[1]>t.anchors.threePrime[1]);
  assert.equal(t.anticodon.querySelectorAll('line').length,3);
  assert.ok(m.anchors.fivePrime[0]<m.anchors.startCodon[0]&&m.anchors.startCodon[0]<m.anchors.stopCodon[0]&&m.anchors.stopCodon[0]<m.anchors.threePrime[0]);
  assert.ok(l.anchors.promoter[0]<l.anchors.tss[0]&&l.anchors.tss[0]<l.anchors.geneEnd[0]);
  assert.equal(l.contact.getAttribute('opacity'),'0');
  const oldExit=r.anchors.peptideExit[1],oldIn=r.anchors.mrnaIn[1];r.set({separation:1});
  assert.ok(r.anchors.peptideExit[1]<oldExit&&r.anchors.mrnaIn[1]>oldIn);
  assert.equal(r.g.querySelectorAll('[data-bio-actor="trna"],[data-bio-actor="mrna"]').length,0);
});
