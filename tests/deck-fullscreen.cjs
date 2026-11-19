/* Presenting mode must stay leavable when the browser refuses or lacks requestFullscreen. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
const root=process.env.LESSON_TEST_DIR||path.join(__dirname,'..','starter');
function fixture(t,request){
 const dom=new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8'),{runScripts:'outside-only',pretendToBeVisual:true,url:'http://localhost/lesson/'});
 t.after(()=>dom.window.close());const w=dom.window,d=w.document;w.matchMedia=()=>({matches:false});
 for(const file of ['js/config.js','js/lib/dom.js','js/lib/i18n.js','js/i18n/en.js','js/lib/touch.js','js/lib/anim.js','js/deck.js','js/player.js'])w.eval(fs.readFileSync(path.join(root,file),'utf8'));
 w.D.deck.register({id:'one',title:'Test',chapter:'Chapter',notes:['n'],build(){return w.D.dom.h('section',{});}});
 w.D.deck.boot();
 if(request==='reject')w.Element.prototype.requestFullscreen=()=>Promise.reject(new Error('refused'));
 else delete w.Element.prototype.requestFullscreen;
 const key=k=>w.dispatchEvent(new w.KeyboardEvent('keydown',{key:k,bubbles:true,cancelable:true}));
 return {w,d,key,presenting:()=>d.body.classList.contains('is-presenting')};
}
test('F enters and a second F exits when requestFullscreen is missing',t=>{
 const {key,presenting}=fixture(t,'missing');
 key('f');assert.equal(presenting(),true);key('f');assert.equal(presenting(),false);
});
test('Escape exits presenting mode after a rejected requestFullscreen',async t=>{
 const {key,presenting}=fixture(t,'reject');
 key('F');assert.equal(presenting(),true);
 await new Promise(r=>setImmediate(r));assert.equal(presenting(),true,'rejection keeps pseudo-presenting mode');
 key('Escape');assert.equal(presenting(),false);
});
test('the More menu fullscreen action toggles like F',t=>{
 const {d,key,presenting}=fixture(t,'missing');
 const click=()=>d.querySelector('[data-action="fullscreen"]').click();
 click();assert.equal(presenting(),true);click();assert.equal(presenting(),false);
 click();key('Escape');assert.equal(presenting(),false);
});
