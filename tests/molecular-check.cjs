const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
function setup(){const dom=new JSDOM('<main id="frame"></main>',{runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window,scenes=[],jobs=[];
 for(const f of ['lib/dom.js','lib/i18n.js','lesson.js','interaction-regions.js','film.js','layout.js','molecular.js','molecular-regulation.js','molecular-rna-processing.js','molecular-inspect.js'])w.eval(fs.readFileSync(path.join(__dirname,'../starter/js',f),'utf8'));
 w.D.deck={register(c){scenes.push(c);},count(){return 7;}};w.A={run(fn){let resolve;const promise=new Promise(r=>resolve=r);jobs.push({fn,resolve});return promise;}};
 w.eval(fs.readFileSync(path.join(__dirname,'../starter/js/recipes/molecular-check.js'),'utf8'));return {w,scenes,jobs};}
test('seven specimens preserve geometry identity and return exactly to their initial drawing',()=>{
 const {w,scenes}=setup();assert.equal(scenes.length,7);assert.equal(new Set(w.MOLECULAR_CHECK.specimens.map(s=>s.actor)).size,7);
 for(const spec of w.MOLECULAR_CHECK.specimens){const svg=w.document.createElementNS('http://www.w3.org/2000/svg','svg');w.document.querySelector('main').append(svg);const a=w.MOLECULAR_CHECK.createSpecimen({svg},spec);a.paint(0);
  const nodes=[...a.actor.g.querySelectorAll('g,path,line,circle,ellipse,rect')],start=nodes.map(n=>n.outerHTML);
  for(const p of [0,.25,.5,.99,1,1.5,2,2.5,3,3.5,4,0]){a.paint(p);assert.deepEqual([...a.actor.g.querySelectorAll('g,path,line,circle,ellipse,rect')],nodes);assert.ok(!a.actor.g.outerHTML.includes('NaN'));const b=a.actor.bounds,s=a.actor.scale;assert.ok(a.actor.x+b.x*s>=60);assert.ok(a.actor.x+(b.x+b.width)*s<=1220);assert.ok(a.actor.y+b.y*s>=207);assert.ok(a.actor.y+(b.y+b.height)*s<=526);}
  assert.deepEqual(nodes.map(n=>n.outerHTML),start);const before=a.actor.g.outerHTML;assert.throws(()=>a.paint(NaN));assert.equal(a.actor.g.outerHTML,before);
 }
});
test('scrub, detail and disposal cancel guided playback without late writes',async()=>{
 const {w,scenes,jobs}=setup(),dispose=[];const root=scenes[0].build({index:0,onDispose(fn){dispose.push(fn);},step(){throw new Error('Specimens use local playback, not hidden deck steps');}});w.document.querySelector('main').append(root);
 const play=root.querySelector('[data-vlk-button$="-play"]');play.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));assert.equal(jobs.length,1);jobs[0].fn(.3);const input=root.querySelector('input');input.value='25';input.dispatchEvent(new w.Event('input',{bubbles:true}));assert.equal(root.dataset.progress,'1');jobs[0].fn(.9);jobs[0].resolve();await Promise.resolve();assert.equal(root.dataset.progress,'1');
 play.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));jobs[1].fn(.2);root.querySelector('[data-molecular-inspect]').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));const frozen=root.dataset.progress;jobs[1].fn(.9);jobs[1].resolve();await Promise.resolve();assert.equal(root.dataset.progress,frozen);assert.ok(w.document.querySelector('[data-molecular-detail]'));
 w.document.querySelector('[data-molecular-detail] button').click();play.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));jobs[2].fn(.2);const atDisposal=root.dataset.progress;dispose.reverse().forEach(fn=>fn());jobs[2].fn(.9);jobs[2].resolve();await Promise.resolve();assert.equal(w.document.querySelector('[data-molecular-detail]'),null);assert.equal(root.dataset.progress,atDisposal);
});
