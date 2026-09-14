/* Preset integration contracts; geometry/layout has separate MV and browser checks. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const root=path.join(__dirname,'../starter/js'),bi=(ru,en)=>({ru,en});
function setup(t){
 const dom=new JSDOM('<body></body>',{runScripts:'outside-only',pretendToBeVisual:true,url:'https://example.org/lesson'});t.after(()=>dom.window.close());const w=dom.window;
 w.matchMedia=()=>({matches:false});w.K={};w.LESSON={source:{url:'https://example.org/global',label:'UNRELATED GLOBAL PAPER'}};
 for(const file of ['lib/dom.js','lib/i18n.js','i18n/en.js','lib/anim.js','lesson.js','film.js','perspective.js','molecular-coordinates.js','molecular-views.js','deck.js'])w.eval(fs.readFileSync(path.join(root,file),'utf8'));
 const scenes=[],register=w.D.deck.register;w.D.deck.register=scene=>{register(scene);scenes.push(scene);};
 // Real labels/fonts are covered by browser QA. Preserve the exact fill and source text.
 w.L={contract(){},watch(){},textBox(parent,options){const node=w.document.createElementNS('http://www.w3.org/2000/svg','text');node.dataset.testId=options.id;node.setAttribute('fill',options.color);node.textContent=options.text;parent.append(node);return node;}};
 w.eval(fs.readFileSync(path.join(root,'molecular-scenes.js'),'utf8'));
 function build(scene=scenes.at(-1)){const steps=[],disposers=[],el=scene.build({step:fn=>steps.push(fn),onDispose:fn=>disposers.push(fn)});w.document.body.append(el);return {el,steps,dispose(){disposers.forEach(fn=>fn());}};}
 return {w,scenes,build};
}
function config(){return {id:'synthetic-overview',title:bi('Тест','Test'),source:{url:'https://example.org/scene?x=1&y=2',label:'SCENE <reference> & "label"'},
 data:{pdb_id:'SYNTHETIC',source_sha256:'test-only',model:2,coordinate_units:'Å',origin:[0,0,0],basis:[[1,0,0],[0,1,0],[0,0,1]],traces:[{chain:'Z9',atom:'P',rows:[{id:'z1',xyz:[0,0,0]},{id:'z2',xyz:[2,4,7]}],bonds:[['z1','z2']]}]},
 legend:[{chain:'Z9',label:bi('Цепь','Chain'),description:bi('Трасса','Trace')}],control:false,
 states:[{caption:bi('Начало','Start'),note:bi('Описание','Description')},{camera:{angle:90},opacity:{Z9:.2},caption:bi('Поворот','Rotation'),note:bi('Второй вид','Second view')},{camera:{pitch:30},caption:bi('Продолжение','Continue'),note:bi('Третий вид','Third view')}],
 qa:[{q:bi('Вопрос','Question'),a:bi('Ответ','Answer')}]};}
test('each scene note links and labels its own source, in both languages, with escaped source text',t=>{
 const {w,scenes}=setup(t),c=config();w.MolecularScenes.overview(c);const scene=scenes[0];
 for(const lang of ['ru','en']){w.D.i18n.setLang(lang);const notes=w.D.i18n.notes(scene);const fragment=w.document.createElement('div');fragment.innerHTML=notes[0];const a=fragment.querySelector('a');
  assert.equal(a.getAttribute('href'),c.source.url);assert.equal(a.textContent,c.source.label);assert.equal(a.children.length,0);assert.equal(fragment.querySelector('p').textContent,c.states[0].note[lang]);
 }
});
test('legend resolves source-row color callbacks and default P colors; unknown chains fail before registration',t=>{
 const {w,scenes,build}=setup(t),c=config(),called=[];c.chains={Z9:{color:id=>{called.push(id);return id==='z1'?w.C.red:w.C.blue;}}};
 w.MolecularScenes.overview(c);const {el}=build();assert.equal(el.querySelector('[data-test-id$=".legend.0"]').getAttribute('fill'),w.C.red);assert.ok(called.includes('z1'));
 const fallback=config();fallback.id='default-color';w.MolecularScenes.overview(fallback);assert.equal(build().el.querySelector('[data-test-id$=".legend.0"]').getAttribute('fill'),w.C.gold);
 for(const change of [bad=>bad.legend[0].chain='absent',bad=>bad.legend[0].color=()=>undefined]){const bad=config(),count=scenes.length;change(bad);assert.throws(()=>w.MolecularScenes.overview(bad),/chain|color/);assert.equal(scenes.length,count);}
});
test('numbered and fraction-prefixed chapter labels translate with literal punctuation',t=>{
 const {w,scenes}=setup(t),c=config();c.chapter=bi('РНК (A+)','RNA (A+)');w.MolecularScenes.overview(c);w.D.i18n.setLang('en');
 assert.equal(w.D.i18n.text(scenes[0].chapter),'1 · RNA (A+)');assert.equal(w.D.i18n.text('1 / 2 · РНК (A+)'),'1 / 2 · RNA (A+)');assert.equal(w.D.i18n.text('1 · РНК (AAA)'),'1 · РНК (AAA)');
 const fallback=config();fallback.id='default-chapter';w.MolecularScenes.overview(fallback);assert.equal(w.D.i18n.text(scenes[1].chapter),'2 · Molecular structure');
});
test('control:false permits unrestricted camera states, carries opacity forward and disposes pending motion',async t=>{
 const {w,build}=setup(t),c=config();w.MolecularScenes.overview(c);const scene=build();assert.equal(scene.el.querySelector('input'),null);assert.equal(scene.el.__molecular.rig.control,null);
 w.A.setInstant(true);for(const step of scene.steps)await step();const state=JSON.parse(scene.el.dataset.state);assert.equal(state.angle,90);assert.equal(state.pitch,30);assert.equal(state.alpha0,.2);assert.equal(state.phase,2);
 w.A.setInstant(false);const pending=scene.el.__molecular.rig.driver.to({angle:120},{duration:5000});scene.dispose();assert.equal((await pending).completed,false);w.A.finishAll();assert.equal(scene.el.__molecular.rig.state.angle,90);
});
test('preset angle controls show degrees while retaining numeric input',t=>{
 const {w,build}=setup(t),c=config();c.control={min:-45,max:120};w.MolecularScenes.overview(c);const scene=build(),rig=scene.el.__molecular.rig;
 rig.driver.set({angle:38});assert.equal(+rig.control.input.value,38);assert.equal(rig.state.angle,38);assert.equal(rig.control.output.textContent,'38°');scene.dispose();
});
