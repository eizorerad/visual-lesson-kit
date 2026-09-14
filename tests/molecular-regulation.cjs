const {test}=require('node:test');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const fs=require('node:fs'),path=require('node:path');
function setup(){const dom=new JSDOM('<svg xmlns="http://www.w3.org/2000/svg"></svg>',{runScripts:'outside-only'}),w=dom.window;w.C=Object.fromEntries(['blue','teal','gold','purple','red','grey'].map(k=>[k,'var(--color-'+k+')']));w.K={};for(const name of ['molecular.js','molecular-regulation.js'])w.eval(fs.readFileSync(path.join(__dirname,'../starter/js',name),'utf8'));return{B:w.B,s:w.document.querySelector('svg'),w};}
test('H3K9 chemistry separates one peptide position, four side-chain carbons and three methyl groups',()=>{const {B,s}=setup(),a=B.histoneTail(s);assert.equal(a.residues.length,13);assert.equal(a.residues[8].dataset.residuePosition,'9');assert.equal(a.carbons.length,4);assert.equal(a.methyl.length,3);assert.equal(a.methylGroups.getAttribute('opacity'),'0');a.set({methylation:1});assert.equal(a.methylGroups.getAttribute('opacity'),'1');assert.equal(a.g.querySelectorAll('[data-methyl-index]').length,3);assert.deepEqual(Array.from(a.anchors.k9),[0,0]);assert.ok(a.anchors.nitrogen[1]<a.anchors.k9[1]);});
test('new stateful actors retain all nodes and reject invalid state patches atomically',()=>{const {B,s}=setup();for(const name of ['histoneTail','initiationComplex']){const key=name==='histoneTail'?'methylation':'assembly',a=B[name](s,{scale:2}),nodes=[...a.g.querySelectorAll('*')];a.set({[key]:1});a.set({[key]:.37});assert.deepEqual([...a.g.querySelectorAll('*')],nodes);const state=JSON.stringify(a.state),html=a.g.outerHTML;for(const p of [null,[],3,'', 'assembly', false,{[key]:NaN},{[key]:Infinity},{[key]:'1'},{[key]:-0.1},{[key]:1.1},{[key]:0,unknown:1},{constructor:1}]){assert.throws(()=>a.set(p));assert.equal(JSON.stringify(a.state),state);assert.equal(a.g.outerHTML,html);}Object.values(a.anchors).forEach(xy=>assert.ok(xy.every(Number.isFinite)));assert.ok(!html.includes('NaN'));}});
test('Mediator carries three module identities and initiation actor preserves Pol II and factor identities',()=>{const {B,s}=setup(),m=B.mediator(s),a=B.initiationComplex(s);assert.equal(m.g.querySelectorAll('[data-bio-part]').length,3);for(const p of ['mediator','pol-ii','tbp','tfiib','tfiih','other-general-factors','cooperative-contacts'])assert.ok(a.g.querySelector('[data-bio-part="'+p+'"]'));assert.equal(a.g.querySelectorAll('[data-bio-actor="polymerase"]').length,1);const start=a.anchors.polII[1];a.set({assembly:1});assert.ok(a.anchors.polII[1]<start);assert.equal(a.contacts.getAttribute('opacity'),'1');});
test('nested molecular strokes stay normalized across emphasis, assembly changes and outer scaling',()=>{const {B,s}=setup(),a=B.initiationComplex(s,{scale:2.3}),edge=a.polII.querySelector('[data-bio-width="1.25"]'),normal=+edge.getAttribute('stroke-width')*2.3*.8;assert.ok(Math.abs(normal-1.25)<1e-9);B.emphasis(a,{level:'focus',part:'pol-ii',color:'var(--color-gold)'});a.set({assembly:1});assert.ok(+edge.getAttribute('stroke-width')*2.3*.8>normal);B.place(a,100,150,.65);assert.ok(Math.abs(+edge.getAttribute('stroke-width')*.65*.8-2.2)<1e-9);B.emphasis(a,{level:'normal'});assert.ok(Math.abs(+edge.getAttribute('stroke-width')*.65*.8-normal)<1e-9);});
test('regulation actors restore their exact drawing after state, scale and emphasis round trips',()=>{
 const {B,s}=setup();
 for(const [name,key] of [['histoneTail','methylation'],['mediator',null],['initiationComplex','assembly']]){
  const a=B[name](s,{x:230,y:370,scale:1.35}),state=a.state,nodes=[...a.g.querySelectorAll('*')];
  const initial={html:a.g.outerHTML,anchors:JSON.stringify(a.anchors),bounds:JSON.stringify(a.bounds)};
  const parts=[...new Set([...a.g.querySelectorAll('[data-bio-part]')].map(n=>n.dataset.bioPart))];
  for(const [index,scale] of [.35,1.75,3.1,.8].entries()){
   if(key)a.set({[key]:[.4,1,.65,0][index]});
   B.place(a,50+index*40,100+index*30,scale);
   for(const part of parts)B.emphasis(a,{level:'focus',part,color:'var(--color-red)',amount:.63});
   B.emphasis(a,{level:'normal'});
   for(const n of a.g.querySelectorAll('[data-bio-width]')){
    let totalScale=scale;
    for(let p=n;p!==a.g;p=p.parentElement)for(const m of (p.getAttribute('transform')||'').matchAll(/scale\(\s*([\d.eE+-]+)/g))totalScale*=+m[1];
    assert.ok(Math.abs(+n.getAttribute('stroke-width')*totalScale-+n.dataset.bioWidth)<1e-9,name+' normalized stroke');
   }
   assert.equal(a.state,state);assert.deepEqual([...a.g.querySelectorAll('*')],nodes);
  }
  if(key)a.set({[key]:0});B.place(a,230,370,1.35);B.emphasis(a,{level:'normal'});
  assert.equal(a.g.outerHTML,initial.html,name+' drawing reset');assert.equal(JSON.stringify(a.anchors),initial.anchors);assert.equal(JSON.stringify(a.bounds),initial.bounds);
 }
});
test('regulation specimens register paired scientific questions with primary sources',()=>{const entries=[],sandbox={window:{MOLECULAR_ATLAS:{H:{},add(...args){entries.push(args);}}}};require('node:vm').runInNewContext(fs.readFileSync(path.join(__dirname,'../starter/js/recipes/molecular-regulation-atlas.js'),'utf8'),sandbox);assert.equal(entries.length,2);for(const e of entries){const qa=e[10];assert.equal(qa.qa.length,2);assert.equal(qa.enQa.length,2);for(const q of [...qa.qa,...qa.enQa]){assert.ok(q.q.length>10);assert.ok(q.a.startsWith('<p>'));assert.match(q.url,/^https:\/\//);}assert.equal(e[3].length,e[4].length);}});

test('histone nitrogen labels remain mutually exclusive at real transition fractions',()=>{
 const {s,w}=setup(),entries=[],NS='http://www.w3.org/2000/svg';
 const H={text(parent,x,y,width,height,ru){const g=w.document.createElementNS(NS,'g');g.dataset.testLabel=ru;g.textContent=ru;parent.append(g);return g;},opacity(g,v){(g.g||g).setAttribute('opacity',String(v));}};
 w.F={path(parent){const p=w.document.createElementNS(NS,'path');parent.append(p);return p;}};
 w.MOLECULAR_ATLAS={H,add(...args){entries.push(args);}};
 w.eval(fs.readFileSync(path.join(__dirname,'../starter/js/recipes/molecular-regulation-atlas.js'),'utf8'));
 const api=entries[0][9]({svg:s}),labels=[...s.querySelectorAll('[data-test-label]')],plain=labels.find(n=>n.dataset.testLabel==='NH₃⁺'),trimethyl=labels.find(n=>n.dataset.testLabel==='N⁺');
 for(const p of [0,.25,.49,.5,.5656,.75,1,1.5,2]){api.paint({p});const opacity=[+plain.getAttribute('opacity'),+trimethyl.getAttribute('opacity')];assert.equal(opacity.filter(v=>v>0).length,1,'overlapping or absent nitrogen labels at p='+p);assert.equal(Math.max(...opacity),1);}
 api.paint({p:0});assert.equal(plain.getAttribute('opacity'),'1');assert.equal(trimethyl.getAttribute('opacity'),'0');api.paint({p:1});assert.equal(plain.getAttribute('opacity'),'0');assert.equal(trimethyl.getAttribute('opacity'),'1');
});
