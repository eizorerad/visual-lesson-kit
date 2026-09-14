const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');const starter=process.env.LESSON_TEST_DIR||path.join(__dirname,'..','starter');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function env(t,url='http://localhost/lesson/'){
 const dom=new JSDOM('<!doctype html><html lang="ru"><head><title>Урок</title></head><body><div id="host"></div></body></html>',{runScripts:'outside-only',pretendToBeVisual:true,url});
 t.after(()=>dom.window.close());const w=dom.window;w.matchMedia=()=>({matches:false});w.eval(fs.readFileSync(path.join(starter,'js/lib/i18n.js'),'utf8'));
 w.D.i18n.pack('en',{label:'EN',strings:{'Урок':'Lesson','Название':'Title','Значение':'Value','Текст источника':'Source text'},patterns:[{match:new w.RegExp('^Выбрано (\\d+)$'),replace:'Selected $1'}],notes:{demo:['<p>English note</p>']},qa:{demo:[{q:'Question?',a:'Answer.'}]}});
 return w;
}
test('live text and attributes translate in place and survive dynamic paint in either language',async t=>{
 const w=env(t),i=w.D.i18n,host=w.document.querySelector('#host');host.innerHTML='<svg><text>Название</text><circle data-value="2"/></svg><label title="Значение"><span>Выбрано 2</span><input aria-label="Значение" value="2"/></label>';
 i.start();const nodes=[...host.querySelectorAll('*')],textNode=host.querySelector('text').firstChild,input=host.querySelector('input');input.focus();input.value='7';
 i.setLang('en');assert.equal(textNode.nodeValue,'Title');assert.equal(host.querySelector('span').textContent,'Selected 2');assert.equal(input.getAttribute('aria-label'),'Value');assert.equal(w.document.title,'Lesson');
 assert.deepEqual([...host.querySelectorAll('*')],nodes);assert.equal(w.document.activeElement,input);assert.equal(input.value,'7');
 host.querySelector('span').textContent='Выбрано 3';await tick();assert.equal(host.querySelector('span').textContent,'Selected 3');
 i.setLang('ru');assert.equal(textNode.nodeValue,'Название');assert.equal(host.querySelector('span').textContent,'Выбрано 3');assert.equal(input.getAttribute('aria-label'),'Значение');assert.equal(input.value,'7');assert.equal(w.document.documentElement.lang,'ru');
});
test('new dialogs translate immediately on apply; whitespace and ignored content remain faithful',async t=>{
 const w=env(t),i=w.D.i18n;i.start();i.setLang('en');const dialog=w.document.createElement('div');dialog.innerHTML='<p>  Текст источника \n</p><code>Название</code><pre>Название</pre><span data-i18n-ignore>Название</span><div contenteditable>Название</div>';w.document.body.append(dialog);await tick();
 assert.equal(dialog.querySelector('p').textContent,'  Source text \n');for(const el of dialog.querySelectorAll('code,pre,span,[contenteditable]'))assert.equal(el.textContent,'Название');i.setLang('ru');assert.equal(dialog.querySelector('p').textContent,'  Текст источника \n');
});
test('split pack registration retains notes, QA and dictionaries; fallback does not mutate source scenes',t=>{
 const w=env(t),i=w.D.i18n,scene={id:'demo',notes:['<p>Русская заметка</p>'],qa:[{q:'Вопрос?',a:'Ответ.'}]};i.pack('en',{strings:{'Ещё':'More'}});i.setLang('en');
 assert.equal(i.notes(scene)[0],'<p>English note</p>');assert.equal(i.qa(scene)[0].q,'Question?');assert.equal(i.text('Название'),'Title');assert.equal(i.text('Ещё'),'More');assert.equal(i.text('Не переведено'),'Не переведено');
 assert.equal(scene.notes[0],'<p>Русская заметка</p>');assert.equal(scene.qa[0].q,'Вопрос?');assert.equal(i.untranslated([scene]).length,0);
 assert.deepEqual(Array.from(i.untranslated([{id:'missing',notes:['a','b'],qa:[]} ])),['missing']);
});
test('URL wins over saved/default language; switching preserves hash and supports listener disposal',t=>{
 const w=env(t,'http://localhost/lesson/?lang=en&v=4#9.2'),i=w.D.i18n;w.LESSON={lang:'ru'};i.start();assert.equal(i.lang(),'en');
 let seen=0;const off=i.onChange(()=>seen++);i.setLang('ru');assert.equal(seen,1);assert.equal(w.location.hash,'#9.2');assert.equal(new w.URL(w.location.href).searchParams.get('v'),'4');assert.equal(new w.URL(w.location.href).searchParams.get('lang'),'ru');off();i.setLang('en');assert.equal(seen,1);assert.equal(w.document.documentElement.lang,'en');
});
