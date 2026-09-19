/* Persistent SVG text: synthetic geometry proves lifecycle/cache behavior;
 * real font paint remains covered by browser lesson QA. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
function fixture(t){
 const dom=new JSDOM('<body><section><svg></svg></section></body>',{runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
 const metrics={unit:10,height:20,advance:null,bbox:null,reads:0};
 const fonts=new w.EventTarget();fonts.status='loaded';fonts.ready=Promise.resolve();
 Object.defineProperty(w.document,'fonts',{value:fonts});
 w.SVGElement.prototype.getComputedTextLength=function(){metrics.reads++;return metrics.advance===null?this.textContent.length*metrics.unit:metrics.advance;};
 w.SVGElement.prototype.getScreenCTM=()=>({a:1,b:0,c:0,d:1,e:0,f:0});
 w.SVGElement.prototype.getBBox=function(){
  if(metrics.bbox)return {...metrics.bbox};
  const spans=[...this.querySelectorAll('tspan')],nodes=spans.length?spans:[this];
  const b=nodes.map(n=>{const width=n.textContent.length*metrics.unit;return{x:+(n.getAttribute('x')||this.getAttribute('x')||0)-width/2,y:+(n.getAttribute('y')||this.getAttribute('y')||0)-16,width,height:metrics.height};});
  const x=Math.min(...b.map(n=>n.x)),y=Math.min(...b.map(n=>n.y));
  return{x,y,width:Math.max(...b.map(n=>n.x+n.width))-x,height:Math.max(...b.map(n=>n.y+n.height))-y};
 };
 for(const file of ['lib/dom.js','lib/i18n.js','layout.js'])w.eval(fs.readFileSync(path.join(__dirname,'../starter/js',file),'utf8'));
 w.D.i18n.pack('en',{strings:{'два слова':'two longer words','другое':'two longer words'}});w.D.i18n.start();
 const root=w.document.querySelector('section'),svg=root.querySelector('svg');
 const label=w.L.textBox(svg,{x:20,y:30,width:140,height:130,padding:10,text:'два слова',size:20});
 t.after(()=>w.close());return{w,root,svg,label,metrics,fonts};
}
const children=label=>[...label.el.childNodes];
function sameChildren(label,nodes,message){assert.equal(label.el.childNodes.length,nodes.length,message);nodes.forEach((node,i)=>assert.equal(label.el.childNodes[i],node,message));}
test('reflow and ready retain settled line nodes without repeated advance measurement',async t=>{
 const {w,root,label,metrics}=fixture(t);await w.L.ready(root);
 const nodes=children(label),reads=metrics.reads;
 for(let i=0;i<12;i++){label.layout();w.L.reflow(root);}
 await w.L.ready(root);
 sameChildren(label,nodes);assert.equal(metrics.reads,reads);
 label.el.setAttribute('fill','red');label.el.parentElement.setAttribute('transform','translate(10 20)');w.L.reflow(root);
 sameChildren(label,nodes,'paint and world-space movement do not change local layout');
});
test('source, language, box and CSS font metrics invalidate settled lines',async t=>{
 const {w,root,label}=fixture(t);await w.L.ready(root);w.L.watch(root);
 let first=label.el.firstChild;w.D.i18n.setLang('en');assert.notEqual(label.el.firstChild,first);assert.equal(label.el.getAttribute('aria-label'),'two longer words');
 first=label.el.firstChild;label.setText('другое');assert.notEqual(label.el.firstChild,first,'source identity changes even when translation matches');
 first=label.el.firstChild;label.setBox({x:45,y:30,width:100,height:130});assert.notEqual(label.el.firstChild,first);assert.equal(+label.el.firstChild.getAttribute('x'),95);
 first=label.el.firstChild;label.el.style.letterSpacing='2px';label.layout();assert.notEqual(label.el.firstChild,first);
 first=label.el.firstChild;label.el.style.fontWeight='700';label.layout();assert.notEqual(label.el.firstChild,first);
 const nodes=children(label);label.layout();sameChildren(label,nodes);
});
test('a loaded font face invalidates unchanged family names; glyph metrics also invalidate',async t=>{
 const {w,root,label,fonts,metrics}=fixture(t);await w.L.ready(root);w.L.watch(root);
 let first=label.el.firstChild;fonts.dispatchEvent(new w.Event('loadingdone'));await w.L.ready(root);assert.notEqual(label.el.firstChild,first);
 first=label.el.firstChild;fonts.dispatchEvent(new w.Event('loadingerror'));await w.L.ready(root);assert.notEqual(label.el.firstChild,first);
 first=label.el.firstChild;metrics.unit=15;label.layout();assert.notEqual(label.el.firstChild,first,'changed measured geometry cannot reuse stale wrapping');
 assert.deepEqual([...label.el.querySelectorAll('tspan')].map(n=>n.textContent),['два','слова']);
});
test('zero, negative and nonfinite advance lengths never pass or become cached',t=>{
 const {label,metrics}=fixture(t);
 for(const bad of [0,-1,NaN,Infinity]){
  metrics.advance=bad;label.setText('bad metric '+String(bad));assert.equal(label.el.dataset.layoutStatus,'unmeasured');assert.equal(label.layout(),false);
  metrics.advance=null;assert.equal(label.layout(),true);assert.equal(label.el.dataset.layoutStatus,'fits');
 }
});
test('zero, negative, overflowing and nonfinite glyph bounds stay unmeasured until recovery',t=>{
 const {label,metrics}=fixture(t);
 for(const bad of [
  {x:0,y:0,width:0,height:20},{x:0,y:0,width:20,height:0},
  {x:0,y:0,width:-1,height:20},{x:0,y:0,width:20,height:-1},
  {x:Infinity,y:0,width:20,height:20},{x:0,y:NaN,width:20,height:20},
  {x:1e308,y:0,width:1e308,height:20}
 ]){
  metrics.bbox=bad;assert.equal(label.layout(),false,JSON.stringify(bad));assert.equal(label.el.dataset.layoutStatus,'unmeasured');
  metrics.bbox=null;assert.equal(label.layout(),true);assert.equal(label.el.dataset.layoutStatus,'fits');
 }
});
test('detaching invalidates successful cache and reattachment remeasures',async t=>{
 const {w,root,svg,label,metrics}=fixture(t);await w.L.ready(root);const nodes=children(label);svg.remove();assert.equal(label.layout(),false);assert.equal(label.el.dataset.layoutStatus,'unmeasured');
 root.append(svg);const reads=metrics.reads;assert.equal(label.layout(),true);assert.ok(metrics.reads>reads);assert.notEqual(label.el.firstChild,nodes[0]);
});
test('disposing a watched scene prevents later layout mutation and removes contracts',async t=>{
 const {w,root,label,fonts}=fixture(t);const stop=w.L.watch(root);await w.L.ready(root);const nodes=children(label);stop.dispose();
 assert.equal(label.layout(),false);label.setText('ignored after disposal');fonts.dispatchEvent(new w.Event('loadingdone'));w.D.i18n.setLang('en');await w.L.ready(root);
 sameChildren(label,nodes);assert.equal(w.L.audit(root).contracted,0);
});
/* Opt in with VLK_NATIVE_BROWSER=1; optional VLK_PLAYWRIGHT_MODULE and
 * VLK_BROWSER_EXECUTABLE use an already installed browser. No downloads. */
test('native browser: settled SVG lines retain real font geometry across reflow and face loading',
 {skip:process.env.VLK_NATIVE_BROWSER!=='1'},async t=>{
 const {pathToFileURL}=require('node:url'),os=require('node:os');
 const starter=path.resolve(__dirname,'../starter'),directory=fs.mkdtempSync(path.join(os.tmpdir(),'vlk-layout-')),file=path.join(directory,'index.html');
 t.after(()=>fs.rmSync(directory,{recursive:true,force:true}));
 fs.writeFileSync(file,'<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="'+pathToFileURL(path.join(starter,'css/fonts.css')).href+'"></head><body><section><svg width="1280" height="720" viewBox="0 0 1280 720"></svg></section></body></html>');
 const {chromium}=require(process.env.VLK_PLAYWRIGHT_MODULE||'playwright');
 const browser=await chromium.launch({headless:true,...(process.env.VLK_BROWSER_EXECUTABLE?{executablePath:process.env.VLK_BROWSER_EXECUTABLE}:{})});t.after(()=>browser.close());
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(pathToFileURL(file).href);
 for(const name of ['lib/dom.js','lib/i18n.js','layout.js'])await page.addScriptTag({path:path.join(starter,'js',name)});
 await page.evaluate(()=>{
  D.i18n.pack('en',{strings:{'Структура нуклеосомы и доступность ДНК':'Nucleosome structure and DNA accessibility'}});D.i18n.start();
  window.root=document.querySelector('section');window.label=L.textBox(root.querySelector('svg'),{x:100,y:100,width:360,height:220,padding:16,text:'Структура нуклеосомы и доступность ДНК',size:32});L.watch(root);
 });
 for(const font of ['sans','serif'])for(const lang of ['ru','en']){
  const r=await page.evaluate(async({font,lang})=>{
   document.documentElement.dataset.font=font;D.i18n.setLang(lang);await L.ready(root);const nodes=[...label.el.childNodes],markup=label.el.outerHTML;
   for(let i=0;i<30;i++){label.layout();L.reflow(root);}await L.ready(root);
   return{retained:nodes.every((n,i)=>n===label.el.childNodes[i]),unchanged:markup===label.el.outerHTML,issues:L.audit(root).issues,loaded:document.fonts.check('32px '+(font==='serif'?'"Source Serif 4"':'"Source Sans 3"'))};
  },{font,lang});
  assert.equal(r.retained,true,font+' '+lang);assert.equal(r.unchanged,true);assert.equal(r.loaded,true);assert.equal(r.issues.length,0);
 }
 const face=await page.evaluate(async url=>{
  label.el.style.fontFamily='Deferred Source, monospace';await L.ready(root);const node=label.el.firstChild;
  const face=new FontFace('Deferred Source','url('+JSON.stringify(url)+')');document.fonts.add(face);await face.load();await L.ready(root);
  return{changed:node!==label.el.firstChild,status:face.status,issues:L.audit(root).issues};
 },pathToFileURL(path.join(starter,'assets/fonts/SourceSerif4-Regular.otf.woff2')).href);
 assert.equal(face.changed,true);assert.equal(face.status,'loaded');assert.equal(face.issues.length,0);assert.deepEqual(errors,[]);
});
