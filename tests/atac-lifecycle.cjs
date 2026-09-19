/* Resource ownership checks; jsdom is sufficient for registration/lifecycle.
 * These checks do not certify molecular geometry or rendered typography. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
function fixture(t){
 const dom=new JSDOM('<body><section><svg></svg></section></body>',{runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
 w.C={blue:'blue',teal:'teal',gold:'gold',red:'red',purple:'purple',grey:'grey',white:'white',dim:'grey'};
 for(const name of ['lib/dom.js','lib/i18n.js','layout.js','film.js','atac-extras.js','atac-callouts.js'])w.eval(fs.readFileSync(path.join(__dirname,'../starter/js',name),'utf8'));
 w.D.i18n.start();t.after(()=>w.close());return{w,root:w.document.querySelector('section'),svg:w.document.querySelector('svg')};
}
const contracts=(w,root)=>w.L.audit(root,{visibleOnly:false}).contracted;
test('extras disposal removes owned text registrations even when detached before scene cleanup',t=>{
 const {w,root,svg}=fixture(t),watch=w.L.watch(root),actor=w.AtacExtras.create(svg),retained=actor.g;
 const count=retained.querySelectorAll('text').length;assert(count>80);assert.equal(contracts(w,retained),count);
 actor.dispose();assert.equal(retained.isConnected,false);assert.equal(contracts(w,retained),0,'detached actor must not retain layout contracts');
 watch.dispose();assert.equal(contracts(w,retained),0,'scene cleanup cannot recover already detached leaked labels');
 actor.dispose();assert.equal(contracts(w,retained),0,'disposal is idempotent');
});
test('disposing extras cannot mutate on later paints or discard a sibling actor registrations',t=>{
 const {w,svg}=fixture(t),a=w.AtacExtras.create(svg),b=w.AtacExtras.create(svg),count=contracts(w,b.g);a.dispose();
 assert.equal(contracts(w,b.g),count);assert.equal(b.g.isConnected,true);b.paint({visibility:1,stage:3});assert.equal(contracts(w,b.g),count);
 assert.throws(()=>a.paint({visibility:1,stage:2}),/disposed/);b.dispose();assert.equal(contracts(w,b.g),0);
});
test('repeated extras creation and disposal leaves no retained contracts in old roots',t=>{
 const {w,svg}=fixture(t),old=[];
 for(let i=0;i<3;i++){const actor=w.AtacExtras.create(svg);old.push(actor.g);actor.dispose();}
 assert.equal(svg.childNodes.length,0);for(const root of old)assert.equal(contracts(w,root),0);
});
test('callout keys are unique per manager and duplicate input cannot orphan the first label',t=>{
 const {w,svg}=fixture(t),callouts=w.AtacCallouts.create(svg),first=callouts.add('focus','Первый','First');
 assert.equal(contracts(w,svg),1);assert.throws(()=>callouts.add('focus','Другой','Other'),/duplicate|already|unique/i);
 assert.equal(svg.childNodes.length,1);assert.equal(svg.firstChild,first);assert.equal(contracts(w,svg),1);
 assert.throws(()=>callouts.add('','Пустой','Empty'),/key/i);assert.equal(svg.childNodes.length,1);
 const second=w.AtacCallouts.create(svg);second.add('focus','Независимый','Independent');assert.equal(contracts(w,svg),2);
 callouts.dispose();assert.equal(contracts(w,first),0);assert.equal(contracts(w,svg),1);second.dispose();assert.equal(contracts(w,svg),0);
});
test('disposed callout managers release labels and reject later state changes',t=>{
 const {w,svg}=fixture(t),callouts=w.AtacCallouts.create(svg),group=callouts.add('focus','Фокус','Focus');
 callouts.begin();callouts.place('focus',{anchor:[600,350],offset:[0,30],leader:false});assert.equal(callouts.snapshots.length,1);
 callouts.dispose();callouts.dispose();assert.equal(contracts(w,group),0);assert.equal(svg.childNodes.length,0);assert.equal(callouts.snapshots.length,0);
 for(const action of [()=>callouts.add('new','Новый','New'),()=>callouts.begin(),()=>callouts.place('focus',{anchor:[600,350]}),()=>callouts.suggest('focus',{anchor:[600,350]})])assert.throws(action,/disposed/);
 assert.equal(svg.childNodes.length,0);assert.equal(contracts(w,svg),0);
});
