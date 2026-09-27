/* Runtime contracts for the compact shell. Layout pixels and native pinch need browser/device review. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
const root=process.env.LESSON_TEST_DIR||path.join(__dirname,'..','starter');
const settle=()=>new Promise(resolve=>setImmediate(resolve));
function fixture(t){
 const dom=new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8'),{runScripts:'outside-only',pretendToBeVisual:true,url:'http://localhost/lesson/'});
 t.after(()=>dom.window.close());const w=dom.window,d=w.document;w.matchMedia=()=>({matches:false});
 for(const file of ['js/config.js','js/lib/dom.js','js/lib/i18n.js','js/i18n/en.js','js/lib/touch.js','js/lib/anim.js','js/deck.js','js/player.js'])w.eval(fs.readFileSync(path.join(root,file),'utf8'));
 let builds=0,disposals=0;
 for(const [id,steps] of [['one',2],['two',7]])w.D.deck.register({id,title:'Тест',chapter:'Пример',notes:['Первый','Второй','Третий'],qa:[{q:'Вопрос?',a:'Ответ.'}],build(ctx){
  builds++;ctx.onDispose(()=>disposals++);const el=w.D.dom.h('section',{},[w.D.dom.h('input',{type:'range',value:17}),w.D.dom.h('span.film-source','Источник')]);
  for(let i=0;i<steps;i++)ctx.step(()=>{el.dataset.replayedStep=String(i+1);return Promise.resolve();});return el;
 }});
 w.D.i18n.pack('en',{strings:{'Тест':'Test','Пример':'Example'},notes:{one:['First','Second','Third'],two:['First','Second','Third']},qa:{one:[{q:'Question?',a:'Answer.'}],two:[{q:'Question?',a:'Answer.'}]}});
 w.D.deck.boot();
 return {w,d,builds:()=>builds,disposals:()=>disposals,click:action=>d.querySelector('[data-action="'+action+'"]').click(),key:(key,target=d.activeElement)=>target.dispatchEvent(new w.KeyboardEvent('keydown',{key,bubbles:true,cancelable:true}))};
}
test('exactly six persistent controls; More owns secondary settings and keeps scene/input state',async t=>{
 const {w,d,click,key,builds}=fixture(t);
 assert.deepEqual(Array.from(d.querySelectorAll('#chrome > button'),b=>b.dataset.action),['prev','overview','next','reading','labels','more']);
 for(const id of ['languageToggle','speedToggle'])assert.equal(d.getElementById(id).parentElement.id,'moreMenu');
 const original=w.D.deck.root(),input=original.querySelector('input');input.value='31';
 w.D.deck.next();await settle();const before=w.D.deck.current(),count=builds(),transform=d.querySelector('#frame').style.transform;
 click('more');assert.equal(d.querySelector('#moreMenu').hidden,false);assert.equal(d.activeElement.id,'languageToggle');
 key('ArrowRight');assert.equal(w.D.deck.current().step,before.step,'menu keyboard does not advance the scene');
 click('language');await settle();assert.equal(w.D.i18n.lang(),'en');assert.equal(d.querySelector('#languageValue').textContent,'EN');
 assert.equal(d.querySelector('#stepCount').textContent,'Step 2 / 3');
 d.querySelector('#speedToggle').click();assert.equal(d.querySelector('#speedValue').textContent,'0.5×');
 assert.equal(w.D.deck.root(),original);assert.equal(input.value,'31');assert.equal(builds(),count);
 assert.equal(w.D.deck.current().step,before.step);assert.equal(d.querySelector('#frame').style.transform,transform);
 key('Escape');assert.equal(d.querySelector('#moreMenu').hidden,true);assert.equal(d.activeElement.dataset.action,'more');
});
test('reading tabs stay open, keyboard selection is local, and close restores the book button',async t=>{
 const {w,d,click,key}=fixture(t);
 click('reading');assert.equal(d.body.classList.contains('notes-open'),true);assert.equal(d.activeElement.id,'tab-notes');
 click('notes');assert.equal(d.body.classList.contains('notes-open'),true,'selected tab does not toggle the panel closed');
 key('ArrowRight',d.querySelector('#tab-notes'));assert.equal(d.querySelector('#notes').dataset.mode,'questions');assert.equal(w.D.deck.current().step,0);
 assert.equal(d.querySelector('#tab-questions').getAttribute('aria-selected'),'true');
 click('guide');const search=d.querySelector('#qaSearch');search.value='Question';search.dispatchEvent(new w.Event('input',{bubbles:true}));
 click('language');await settle();assert.equal(d.querySelector('#qaSearch'),search);assert.equal(search.value,'Question');
 assert.equal(d.querySelectorAll('.qa-item').length,2);
 click('close-reading');assert.equal(d.body.classList.contains('notes-open'),false);assert.equal(d.activeElement.dataset.action,'reading');
 click('reading');assert.equal(d.querySelector('#notes').dataset.mode,'guide');assert.equal(d.querySelector('#qaSearch').value,'Question');
});
test('overview is exposed through scene progress and closes with visible control',t=>{
 const {d,click}=fixture(t);click('overview');
 assert.equal(d.querySelector('#overview').classList.contains('is-on'),true);
 assert.equal(d.querySelector('[data-action="overview"]').getAttribute('aria-expanded'),'true');
 click('close-overview');assert.equal(d.querySelector('#overview').classList.contains('is-on'),false);
});

test('scene entry is limited to boundary navigation and direct show remains synchronous',async t=>{
 const {w,d,click,key}=fixture(t),frame=d.querySelector('#frame');
 w.D.deck.show(0,0);const transform=frame.style.transform;assert.equal(frame.classList.contains('scene-enter'),false);
 click('next');await settle();assert.equal(w.D.deck.current().step,1);assert.equal(frame.classList.contains('scene-enter'),false,'ordinary steps do not fade the canvas');
 w.D.deck.show(0,2);await settle();const old=w.D.deck.root();click('next');
 assert.equal(w.D.deck.current().index,1);assert.equal(old.isConnected,false);assert.equal(frame.children.length,1);
 assert.equal(frame.classList.contains('scene-enter'),true);assert.equal(frame.style.transform,transform);
 w.D.deck.show(1,0);assert.equal(frame.classList.contains('scene-enter'),false,'direct show cancels the prior entry immediately');
 click('prev');assert.equal(w.D.deck.current().index,0);assert.equal(w.D.deck.current().step,2);assert.equal(frame.classList.contains('scene-enter'),true);await settle();
 w.D.deck.show(1,0);d.body.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowLeft',shiftKey:true,bubbles:true,cancelable:true}));
 assert.equal(w.D.deck.current().index,0);assert.equal(w.D.deck.current().step,0);assert.equal(frame.classList.contains('scene-enter'),true);
 d.body.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowRight',shiftKey:true,bubbles:true,cancelable:true}));
 assert.equal(w.D.deck.current().index,1);assert.equal(frame.classList.contains('scene-enter'),true);
});
test('rapid boundary changes dispose superseded mounts and cannot resume their replay',async t=>{
 const {w,d,click,disposals}=fixture(t);w.D.deck.show(1,0);const before=disposals();
 click('prev');const abandoned=w.D.deck.root();assert.equal(w.D.deck.current().busy,true,'backward boundary replays to the last state');
 w.D.deck.show(1,0);const final=w.D.deck.root();assert.equal(abandoned.isConnected,false);
 await settle();await settle();
 assert.equal(w.D.deck.root(),final);assert.equal(w.D.deck.current().index,1);assert.equal(w.D.deck.current().step,0);assert.equal(w.D.deck.current().busy,false);
 assert.equal(abandoned.dataset.replayedStep,undefined,'superseded queued steps never paint');
 assert.equal(final.dataset.replayedStep,undefined);assert.equal(disposals(),before+2);
 assert.equal(d.querySelector('#frame').classList.contains('scene-enter'),false);
});
test('reduced motion skips entry, and hash replay clears an active entry',async t=>{
 const {w,d}=fixture(t),frame=d.querySelector('#frame');
 w.matchMedia=()=>({matches:true});d.body.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowRight',shiftKey:true,bubbles:true,cancelable:true}));
 assert.equal(w.D.deck.current().index,1);assert.equal(frame.classList.contains('scene-enter'),false);
 w.matchMedia=()=>({matches:false});d.body.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowLeft',shiftKey:true,bubbles:true,cancelable:true}));
 assert.equal(frame.classList.contains('scene-enter'),true);
 w.location.hash='#2.1';w.dispatchEvent(new w.HashChangeEvent('hashchange'));await settle();
 assert.equal(w.D.deck.current().index,1);assert.equal(w.D.deck.current().step,1);assert.equal(w.D.deck.current().busy,false);assert.equal(frame.classList.contains('scene-enter'),false);
});

test('reading header switches both locales without losing disclosure, query, scroll or scene state',async t=>{
 const {w,d,click}=fixture(t);w.D.deck.show(0,1);await settle();
 const root=w.D.deck.root();click('reading');click('questions');
 const body=d.querySelector('#notesBody'),language=d.querySelector('#readingLanguageToggle');
 d.querySelector('.qa-item').open=false;body.scrollTop=137;language.focus();language.click();await settle();
 assert.equal(w.D.i18n.lang(),'en');assert.equal(d.querySelector('.qa-item').open,false);assert.equal(body.scrollTop,137);
 assert.equal(d.activeElement,language);assert.match(language.getAttribute('aria-label'),/Language: EN/);
 assert.equal(d.querySelector('#languageValue').textContent,'EN');assert.equal(d.querySelector('#readingLanguageValue').textContent,'EN');
 assert.equal(w.D.deck.root(),root);assert.equal(w.D.deck.current().step,1);
 click('guide');const input=d.querySelector('#qaSearch');input.value='Question';input.dispatchEvent(new w.Event('input',{bubbles:true}));body.scrollTop=53;
 language.focus();language.click();await settle();
 assert.equal(w.D.i18n.lang(),'ru');assert.equal(d.querySelector('#qaSearch'),input);assert.equal(input.value,'Question');assert.equal(body.scrollTop,53);
 assert.equal(d.activeElement,language);assert.match(language.getAttribute('aria-label'),/Язык: RU/);assert.equal(w.D.deck.root(),root);assert.equal(w.D.deck.current().step,1);
 const ids=Array.from(d.querySelectorAll('[id]'),el=>el.id);assert.equal(new Set(ids).size,ids.length,'reading language has no duplicate IDs');
});

test('continuous playback synchronizes notes and hash without replaying or replacing scene actors',async t=>{
 const {w,d,builds,click}=fixture(t),root=w.D.deck.root(),input=root.querySelector('input'),count=builds();
 input.value='41';
 assert.equal(typeof w.D.deck.syncPlaybackStep,'function');
 assert.equal(w.D.deck.syncPlaybackStep(2),true);
 assert.equal(w.D.deck.root(),root);assert.equal(builds(),count);assert.equal(input.value,'41');
 assert.equal(root.dataset.replayedStep,undefined,'sync must not execute ordinary step callbacks');
 assert.equal(w.D.deck.current().step,2);assert.equal(w.location.hash,'#1.2');
 assert.equal(d.querySelector('#notesBody .is-now').textContent,'3Третий');
 assert.equal(d.querySelector('#stepCount').textContent,'Шаг 3 / 3');
 assert.equal(w.D.deck.syncPlaybackStep(2),false);
 click('language');await settle();
 assert.equal(w.D.deck.root(),root);assert.equal(w.D.deck.current().step,2);
 assert.equal(d.querySelector('#notesBody .is-now').textContent,'3Third');
 assert.equal(d.querySelector('#stepCount').textContent,'Step 3 / 3');
 for(const bad of [-1,3,1.5,NaN,Infinity,'1'])assert.throws(()=>w.D.deck.syncPlaybackStep(bad),w.RangeError);
 assert.equal(w.D.deck.current().step,2);assert.equal(w.location.hash,'#1.2');
 assert.equal(w.D.deck.syncPlaybackStep(0),true);assert.equal(w.location.hash,'#1');
 root.remove();assert.equal(w.D.deck.syncPlaybackStep(1),false,'detached mount cannot publish another cue');
 assert.equal(w.D.deck.current().step,0);
});

test('cinema timeline reserve reduces fitted stage height and resets without changing normal layouts',t=>{
 const {w,d}=fixture(t);w.innerWidth=1600;w.innerHeight=900;w.D.deck.refit();
 const original=w.D.deck.scale();assert.equal(d.body.style.getPropertyValue('--toolbar-bottom-space'),'72px');
 d.body.style.setProperty('--cinema-bottom-reserve','96px');w.D.deck.refit();
 assert.equal(d.body.style.getPropertyValue('--toolbar-bottom-space'),'168px');
 assert.ok(Math.abs(w.D.deck.scale()-(900-10-168)/720)<1e-12);assert.ok(w.D.deck.scale()<original);
 for(const value of ['', '-40px', 'not-a-number', 'Infinity']){
  d.body.style.setProperty('--cinema-bottom-reserve',value);w.D.deck.refit();
  assert.equal(d.body.style.getPropertyValue('--toolbar-bottom-space'),'72px');assert.equal(w.D.deck.scale(),original);
  assert.doesNotMatch(d.querySelector('#frame').style.transform,/NaN|Infinity/);
 }
});

test('the labels button left of More hides every label and shows it again; T / Е does the same; the button speaks the current language',async t=>{
 const {w,d,click,key}=fixture(t);
 const button=d.querySelector('[data-action="labels"]');
 assert.equal(button.nextElementSibling.dataset.action,'more');
 assert.equal(button.getAttribute('aria-pressed'),'false');assert.equal(button.getAttribute('aria-label'),'Скрыть надписи');
 click('labels');
 assert.ok(d.body.classList.contains('labels-hidden'));assert.ok(d.body.classList.contains('labels-fading'),'the fade is armed around the switch');
 assert.equal(button.getAttribute('aria-pressed'),'true');assert.equal(button.getAttribute('aria-label'),'Показать надписи');assert.equal(w.D.deck.labels(),true);
 key('t',d.body);
 assert.ok(!d.body.classList.contains('labels-hidden'));assert.equal(w.D.deck.labels(),false);assert.equal(button.getAttribute('aria-label'),'Скрыть надписи');
 key('Е',d.body);assert.equal(w.D.deck.labels(),true);
 w.D.i18n.setLang('en');await settle();
 assert.equal(button.getAttribute('aria-label'),'Show labels');assert.equal(button.getAttribute('title'),'Show labels (T)');
 w.D.deck.labels(false);assert.equal(button.getAttribute('aria-label'),'Hide labels');
});
