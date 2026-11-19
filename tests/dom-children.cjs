/* h()/s() treat falsy non-object second arguments as children. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
const root=process.env.LESSON_TEST_DIR||path.join(__dirname,'..','starter');
function load(t){
 const dom=new JSDOM('<!doctype html><body></body>',{runScripts:'outside-only'});
 t.after(()=>dom.window.close());
 dom.window.eval(fs.readFileSync(path.join(root,'js/lib/dom.js'),'utf8'));
 return dom.window.D.dom;
}
test('h() renders falsy-number and empty-string second arguments as children',t=>{
 const {h}=load(t);
 assert.equal(h('span',0).textContent,'0');
 assert.equal(h('td',1).textContent,'1');
 assert.equal(h('span',NaN).textContent,'NaN');
 assert.equal(h('span','').childNodes.length,0);
 assert.equal(h('span',null).childNodes.length,0);
 assert.equal(h('span',undefined).childNodes.length,0);
 assert.equal(h('span',false).childNodes.length,0);
});
test('h() still applies attrs with a children argument',t=>{
 const {h}=load(t);
 const n=h('div',{id:'x'},'t');
 assert.equal(n.id,'x');assert.equal(n.textContent,'t');
});
test('s() renders a zero second argument as a child',t=>{
 const {s}=load(t);
 assert.equal(s('text',0).textContent,'0');
 assert.equal(s('text',null).childNodes.length,0);
});
