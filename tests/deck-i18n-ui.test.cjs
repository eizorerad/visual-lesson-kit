/* Deck UI strings (Q&A, step counter, language button) come from i18n ui keys in every language. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
const root=process.env.LESSON_TEST_DIR||path.join(__dirname,'..','starter');
function fixture(t){
 const dom=new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8'),{runScripts:'outside-only',pretendToBeVisual:true,url:'http://localhost/lesson/?lang=ru'});
 t.after(()=>dom.window.close());const w=dom.window,d=w.document;w.matchMedia=()=>({matches:false});
 for(const file of ['js/config.js','js/lib/dom.js','js/lib/i18n.js','js/i18n/en.js','js/lib/touch.js','js/lib/anim.js','js/deck.js','js/player.js'])w.eval(fs.readFileSync(path.join(root,file),'utf8'));
 w.D.deck.register({id:'one',title:'Test',chapter:'Chapter',notes:['n'],build(){return w.D.dom.h('section',{});}});
 w.D.deck.boot();
 return {w,d};
}
const source=fs.readFileSync(path.join(root,'js/deck.js'),'utf8');
const keys=[...new Set([...source.matchAll(/\bui(?:Format)?\('(\w+)'/g)].map(m=>m[1]))];
test('every ui key used by deck.js exists in the ru and en packs',t=>{
 const {w}=fixture(t);
 assert.ok(keys.length>=10);
 for(const lang of ['ru','en']){
  w.D.i18n.setLang(lang);
  for(const key of keys)assert.ok(w.D.i18n.ui(key),`${key} missing for ${lang}`);
 }
 const en=fs.readFileSync(path.join(root,'js/i18n/en.js'),'utf8');
 for(const key of keys)assert.match(en,new RegExp(`\\b${key}:`),`${key} not defined in en.js`);
});
test('step counter, result count and language aria-label are English in en and Russian in ru',t=>{
 const {w,d}=fixture(t);
 const read=()=>({step:d.getElementById('stepCount').textContent,aria:d.querySelector('[data-action="language"]').getAttribute('aria-label')});
 w.D.i18n.setLang('ru');
 assert.match(read().step,/^Шаг 1 \/ \d+$/);assert.equal(read().aria,'Язык: RU');
 w.D.i18n.setLang('en');
 assert.match(read().step,/^Step 1 \/ \d+$/);assert.equal(read().aria,'Language: EN');
 w.dispatchEvent(new w.KeyboardEvent('keydown',{key:'g',bubbles:true,cancelable:true}));
 assert.equal(d.querySelector('.qa-result-count').textContent,'Questions found: 0');
 assert.equal(d.querySelector('.qa-guide-results .notes-empty').textContent,'No questions match this search.');
 w.D.i18n.setLang('ru');
 assert.equal(d.querySelector('.qa-result-count').textContent,'Найдено вопросов: 0');
});
