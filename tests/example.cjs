/* Checks the actual standalone sample; DOM/state assertions are not a visual browser review. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'examples/mean-spread.html'),'utf8');
const settle=()=>new Promise(resolve=>setImmediate(resolve));
function strings(w,root){
 const found=[],walker=w.document.createTreeWalker(root,w.NodeFilter.SHOW_TEXT);let node;
 while((node=walker.nextNode()))if(node.nodeValue.trim()&&!node.parentElement.closest('script,style,[data-i18n-ignore]'))found.push(node.nodeValue.trim());
 return found;
}

test('standalone mean/spread example preserves data across all RU/EN states and reading modes',async t=>{
 const dom=new JSDOM(html,{runScripts:'outside-only',pretendToBeVisual:true,url:'http://localhost/mean-spread.html?lang=ru'}),w=dom.window;
 t.after(()=>w.close());w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
 const scenes=[],errors=[];w.console.error=(...args)=>errors.push(args.join(' '));await settle();
 for(const script of w.document.querySelectorAll('script')){
  if(script.type&&!/^(?:application|text)\/(?:java|ecma)script$/i.test(script.type.trim()))continue;
  w.eval(script.textContent);
  if(script.textContent.startsWith('/* js/deck.js */')){const register=w.D.deck.register;w.D.deck.register=scene=>{scenes.push(scene);register(scene);};}
 }
 await settle();w.A.setInstant(true);
 assert.equal(scenes.length,1);assert.equal(w.D.deck.count(),1);assert.equal(scenes[0].id,'mean-and-spread');
 assert.equal(scenes[0].notes.length,3);assert.equal(scenes[0].qa.length,2);
 assert.equal(w.document.querySelectorAll('#chrome>button').length,5);assert.equal(w.document.querySelectorAll('[role="tab"]').length,3);
 for(const language of ['ru','en']){
  w.D.i18n.setLang(language);await settle();
  assert.equal(w.D.i18n.notes(scenes[0]).length,3);assert.equal(w.D.i18n.qa(scenes[0]).length,2);
  for(let step=0;step<3;step++){
   w.D.deck.show(0,step);for(let i=0;i<30;i++){await settle();if(!w.D.deck.current().busy)break;}
   assert.equal(w.D.deck.current().step,step);assert.equal(w.D.deck.current().busy,false);
   const scene=w.D.deck.root(),points=Array.from(scene.querySelectorAll('circle[data-value]'));
   assert.deepEqual(points.map(p=>+p.dataset.value),[3,4,5,1,4,7]);
   assert.deepEqual(Array.from(scene.querySelectorAll('[data-displayed-mean]'),n=>+n.dataset.displayedMean),[4,4]);
   assert.deepEqual(Array.from(scene.querySelectorAll('[data-displayed-range]'),n=>+n.dataset.displayedRange),[2,6]);
   assert.deepEqual(Array.from(scene.querySelectorAll('[data-range-min]'),n=>[+n.dataset.rangeMin,+n.dataset.rangeMax]),[[3,5],[1,7]]);
   for(const node of scene.querySelectorAll('*'))for(const attr of node.attributes)assert.doesNotMatch(attr.value,/NaN|Infinity|undefined/);
   if(step===2){
    const ranges=Array.from(scene.querySelectorAll('[data-range-min]'));
    assert.equal(Math.abs(+ranges[1].getAttribute('y2')- +ranges[1].getAttribute('y1')),3*Math.abs(+ranges[0].getAttribute('y2')- +ranges[0].getAttribute('y1')));
   }
   const before=points.map(p=>[p.getAttribute('cx'),p.getAttribute('cy'),p.dataset.value]);
   w.D.i18n.toggle();await settle();w.D.i18n.toggle();await settle();
   assert.equal(w.D.deck.root(),scene);assert.deepEqual(points.map(p=>[p.getAttribute('cx'),p.getAttribute('cy'),p.dataset.value]),before);
   if(language==='en')assert.deepEqual(strings(w,scene).filter(s=>/[А-Яа-яЁё]/.test(s)),[],'English scene strings');
  }
  for(const mode of ['notes','questions','guide']){
   w.document.querySelector(`[data-action="${mode}"]`).click();await settle();
   const body=w.document.querySelector('#notesBody');assert(body.textContent.trim());
   if(language==='en')assert.deepEqual(strings(w,body).filter(s=>/[А-Яа-яЁё]/.test(s)),[],`English ${mode}`);
  }
  w.document.querySelector('.evidence-button').click();await settle();
  const evidence=w.document.querySelector('.evidence-layer');assert(evidence);assert.equal(evidence.querySelector('a'),null);
  if(language==='en')assert.deepEqual(strings(w,evidence).filter(s=>/[А-Яа-яЁё]/.test(s)),[],'English evidence');
  evidence.querySelector('.evidence-close').click();
  if(language==='en')assert.deepEqual(strings(w,w.document.body).filter(s=>/[А-Яа-яЁё]/.test(s)),[],'English shell and lesson text');
 }
 assert.deepEqual(errors,[]);
});

test('standalone example contains only its episode/pack and current embedded font assets with complete notices',()=>{
 assert.doesNotMatch(html,/<script[^>]+src=|<link[^>]+rel="stylesheet"/i);
 const readable=html.replace(/<script\b[^>]*\btype="application\/json"[^>]*>[\s\S]*?<\/script>/gi,'').replace(/\/\*[\s\S]*?\*\//g,'').replace(/data:[^\s\"')]+;base64,[A-Za-z0-9+/=]+/g,'[embedded asset]');
 assert.doesNotMatch(readable,/3b1b|3blue1brown|STIX|KaTeX|Computer Modern|CM Serif|CM Math/i);
 const noticeBlock=html.match(/<script type="application\/json" id="visual-lesson-kit-notices">([\s\S]*?)<\/script>/);
 assert(noticeBlock,'Standalone example keeps its third-party attribution');
 const notices=JSON.parse(noticeBlock[1]);
 assert.equal(notices['THIRD_PARTY_NOTICES.md'],fs.readFileSync(path.join(root,'THIRD_PARTY_NOTICES.md'),'utf8'));
 if(fs.existsSync(path.join(root,'LICENSE')))assert.equal(notices.LICENSE,fs.readFileSync(path.join(root,'LICENSE'),'utf8'));
 assert.ok(html.includes('name="generator" content="visual-lesson-kit '+fs.readFileSync(path.join(root,'VERSION'),'utf8').trim()+'"'));
 assert.deepEqual([...html.matchAll(/<script>\/\* (js\/episodes\/[^*]+) \*\//g)].map(m=>m[1]),['js/episodes/mean-spread.js']);
 assert.deepEqual([...html.matchAll(/<script>\/\* (js\/i18n\/[^*]+) \*\//g)].map(m=>m[1]),['js/i18n/mean-spread-en.js']);
 const payloads=[...html.matchAll(/url\("data:(?:font\/(?:woff2|ttf)|application\/(?:x-font-ttf|font-sfnt|octet-stream));base64,([A-Za-z0-9+/=]+)"\)/g)].map(m=>Buffer.from(m[1],'base64'));
 const hashes=payloads.map(b=>crypto.createHash('sha256').update(b).digest('hex'));
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'licenses/font-manifest.json'),'utf8'));
 assert.equal(payloads.length,manifest.fonts.length);assert.deepEqual(hashes.sort(),manifest.fonts.map(f=>f.sha256).sort());
 for(const license of manifest.licenses)assert(html.includes(fs.readFileSync(path.join(root,license.path),'utf8').replace(/\r\n/g,'\n').trim()),license.path+' complete notice');
 const css=[...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m=>m[1]).join('\n');
 const urls=[...css.matchAll(/url\(\s*(["']?)([^\)'"\s]+)\1\s*\)/g)].map(m=>m[2]);
 assert(urls.every(url=>url.startsWith('data:')||url.startsWith('#')),'all CSS assets are embedded');
});
