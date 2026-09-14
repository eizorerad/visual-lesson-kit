const {test}=require('node:test'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom'),fs=require('node:fs'),path=require('node:path');
function setup(main=false){const d=new JSDOM('',{runScripts:'outside-only'}),w=d.window,registered=[];w.D={i18n:{pack(){}},deck:{register(x){registered.push(x);}}};w.C={};if(main)w.H={atlas:false};w.eval(fs.readFileSync(path.join(__dirname,'../starter/js/molecular-gallery.js'),'utf8'));return{w,registered};}
function add(w,id='example',enNotes=['note']){w.MOLECULAR_ATLAS.add(id,'Заголовок','Title',['Состояние'],['State'],['Пояснение'],enNotes,'https://www.rcsb.org/structure/1KNE','PDB 1KNE',()=>({paint(){}}));}
test('atlas registers its definitions; main lesson collects them without adding unwanted scenes',()=>{
 const atlas=setup(),main=setup(true);add(atlas.w);add(main.w);assert.equal(atlas.registered.length,1);assert.equal(main.registered.length,0);assert.equal(main.w.MOLECULAR_ATLAS.entries.length,1);assert.equal(main.w.MOLECULAR_ATLAS.entries[0].content.en.title,'Title');
});
test('mismatched notes and duplicate IDs are rejected before registering scenes',()=>{
 const{w,registered}=setup();assert.throws(()=>add(w,'bad',[]),/state|notes/);assert.equal(registered.length,0);add(w);assert.throws(()=>add(w),/duplicate/i);assert.equal(registered.length,1);
});
test('original twelve atlas scenes survive extraction and retain their bilingual notes',()=>{
 const{w,registered}=setup();w.eval(fs.readFileSync(path.join(__dirname,'../starter/js/recipes/molecular-atlas.js'),'utf8'));assert.equal(registered.length,12);for(const e of w.MOLECULAR_ATLAS.entries){assert.equal(e.content.notes.length,e.content.captions.length);assert.equal(e.content.en.notes.length,e.content.captions.length);}
});
test('inspection refresh follows actors and disables hidden specimens',()=>{
 const {w}=setup(true),ns='http://www.w3.org/2000/svg',actor={g:w.document.createElementNS(ns,'g')},svg=w.document.createElementNS(ns,'svg');svg.append(actor.g);
 // jsdom does not resolve SVG presentation attributes in computed styles.
 w.getComputedStyle=n=>({getPropertyValue:name=>n.style.getPropertyValue(name)||n.getAttribute(name)||''});
 let boxes=0,disabled=false,cancelled=0,options;
 w.B={inspect(parent,a,o){options=o;return {setBox(){boxes++;},trigger:{g:w.document.createElement('g'),setDisabled(v){disabled=v;}},dispose(){}};}};
 const refresh=w.MOLECULAR_ATLAS.attachInspection({svg,root:{dataset:{sceneId:'test'}}},{onDispose(){}},{inspect:[{actor}]},{cancel(){cancelled++;}});
 assert.equal(typeof refresh,'function');assert.equal(boxes,1);assert.equal(disabled,false);
 actor.g.setAttribute('opacity','0');refresh();assert.equal(disabled,true);assert.equal(boxes,2);
 actor.g.setAttribute('opacity','.4');refresh();assert.equal(disabled,false);options.onOpen();assert.equal(cancelled,1);
});
test('inspection follows rendered visibility after F.opacity and CSS changes',()=>{
 const {w}=setup(true);for(const name of ['lib/dom.js','film.js'])w.eval(fs.readFileSync(path.join(__dirname,'../starter/js',name),'utf8'));
 const svg=w.document.createElementNS('http://www.w3.org/2000/svg','svg'),group=w.document.createElementNS(svg.namespaceURI,'g'),actor={g:w.document.createElementNS(svg.namespaceURI,'g')};w.document.body.append(svg);svg.append(group);group.append(actor.g);
 let disabled;const trigger=w.document.createElementNS(svg.namespaceURI,'g');
 w.B={inspect(){return {setBox(){},trigger:{g:trigger,setDisabled(value){disabled=value;}},dispose(){}};}};
 const refresh=w.MOLECULAR_ATLAS.attachInspection({svg,root:{dataset:{}}},{onDispose(){}},{inspect:[{actor}]},{cancel(){}});
 w.F.opacity(actor.g,0);refresh();assert.equal(disabled,true,'F.opacity must disable the invisible actor');assert.equal(trigger.style.visibility,'hidden');
 w.F.opacity(actor.g,.4);refresh();assert.equal(disabled,false);
 actor.g.setAttribute('opacity','0');refresh();assert.equal(disabled,false,'inline opacity overrides the presentation attribute');
 w.F.opacity(group,0);refresh();assert.equal(disabled,true,'an invisible ancestor must disable the actor');
 w.F.opacity(group,1);const style=w.document.createElement('style');style.textContent='.absent{opacity:0}';w.document.head.append(style);group.style.removeProperty('opacity');group.classList.add('absent');refresh();assert.equal(disabled,true,'stylesheet opacity must disable the actor');
 group.classList.remove('absent');refresh();assert.equal(disabled,false);actor.g.remove();refresh();assert.equal(disabled,true,'a removed actor must lose its trigger');
});
