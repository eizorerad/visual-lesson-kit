/* SVG activation contracts. Native hit-testing is opt-in; JSDOM has no layout. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),test=require('node:test');
const {JSDOM}=require('jsdom');
const source=path.resolve(__dirname,'../starter/js');
const scripts=['lib/dom.js','lib/i18n.js','lesson.js','interaction-regions.js'];
function environment(t){
 const dom=new JSDOM('<body><svg xmlns="http://www.w3.org/2000/svg"></svg></body>',{runScripts:'outside-only',pretendToBeVisual:true,url:'http://localhost/lesson/'}),w=dom.window;
 for(const file of scripts)if(fs.existsSync(path.join(source,file)))w.eval(fs.readFileSync(path.join(source,file),'utf8'));
 t.after(()=>w.close());assert.equal(typeof w.T.svgButton,'function','T.svgButton must exist');return w;
}
const box={x:20,y:30,width:240,height:100};
function button(w,extra={},parent=w.document.querySelector('svg')){return w.T.svgButton(parent,{id:'tile',box,label:'Выбрать источник',onActivate(){},...extra});}
function key(w,node,type,value,extra={}){const e=new w.KeyboardEvent(type,{key:value,bubbles:true,cancelable:true,...extra});node.dispatchEvent(e);return e;}
function click(w,node){const e=new w.MouseEvent('click',{bubbles:true,cancelable:true});node.dispatchEvent(e);return e;}

test('the whole transparent rectangle is an inspectable button; updates keep node identity',t=>{
 const w=environment(t),b=button(w),g=b.g,hit=b.hit;
 assert.equal(g.getAttribute('role'),'button');assert.equal(g.getAttribute('tabindex'),'0');assert(g.hasAttribute('data-no-swipe'));
 assert.equal(g.getAttribute('data-vlk-button'),'tile');assert.equal(hit.getAttribute('data-vlk-hit'),'tile');assert.equal(hit.parentNode,g);
 assert.equal(hit.getAttribute('pointer-events'),'all');assert.equal(hit.getAttribute('fill'),'transparent');assert.equal(hit.getAttribute('stroke'),'none');
 assert.equal(g.getAttribute('aria-label'),'Выбрать источник');assert.equal(g.getAttribute('aria-disabled'),'false');assert.equal(g.hasAttribute('aria-pressed'),false);
 const next={x:35,y:40,width:200,height:80};b.setBox(next);next.width=0;
 for(const [name,value] of Object.entries({x:35,y:40,width:200,height:80}))assert.equal(+hit.getAttribute(name),value);
 assert.equal(b.g,g);assert.equal(b.hit,hit);
 const ring=g.querySelector('[data-vlk-focus="tile"]');assert.equal(ring.getAttribute('pointer-events'),'none');assert.equal(+ring.getAttribute('x'),33);assert.equal(+ring.getAttribute('width'),204);
});
test('Enter acts once on press, Space once on release; both stay inside the control',t=>{
 const w=environment(t),events=[],b=button(w,{onActivate:e=>events.push(e.type)});let parentKeys=0;
 w.document.addEventListener('keydown',()=>parentKeys++);w.document.addEventListener('keyup',()=>parentKeys++);
 assert.equal(key(w,b.g,'keydown','Enter').defaultPrevented,true);key(w,b.g,'keydown','Enter',{repeat:true});key(w,b.g,'keydown','Enter');
 assert.deepEqual(events,['keydown']);assert.equal(key(w,b.g,'keyup','Enter').defaultPrevented,true);assert.deepEqual(events,['keydown']);
 assert.equal(key(w,b.g,'keydown',' ').defaultPrevented,true);key(w,b.g,'keydown',' ',{repeat:true});assert.deepEqual(events,['keydown']);
 assert.equal(key(w,b.g,'keyup',' ').defaultPrevented,true);key(w,b.g,'keyup',' ');assert.deepEqual(events,['keydown','keyup']);assert.equal(parentKeys,0);
 assert.equal(key(w,b.g,'keydown','ArrowRight').defaultPrevented,false);assert.equal(parentKeys,1);
 key(w,b.g,'keydown','Enter');key(w,b.g,'keyup','Enter');assert.equal(events.length,3);
});
test('descendant click activates once, reentrant callbacks and held-key clicks do not duplicate',t=>{
 const w=environment(t);let count=0,parentClicks=0,b;
 b=button(w,{onActivate(){count++;click(w,b.hit);}});const text=w.D.dom.s('text',{},'Source');b.g.append(text);
 w.document.addEventListener('click',()=>parentClicks++);assert.equal(click(w,text).defaultPrevented,true);assert.equal(count,1);assert.equal(parentClicks,0);
 key(w,b.g,'keydown','Enter');click(w,b.hit);key(w,b.g,'keyup','Enter');assert.equal(count,2);
 key(w,b.g,'keydown',' ');click(w,b.hit);key(w,b.g,'keyup',' ');assert.equal(count,3);
});
test('disabled controls consume activation and cancel an in-progress Space press',t=>{
 const w=environment(t);let count=0,parentEvents=0;const b=button(w,{onActivate(){count++;}});
 for(const type of ['click','keydown','keyup'])w.document.addEventListener(type,()=>parentEvents++);
 b.g.focus();key(w,b.g,'keydown',' ');b.setDisabled(true);b.setDisabled(false);key(w,b.g,'keyup',' ');assert.equal(count,0);
 b.setDisabled(true);assert.equal(b.g.getAttribute('tabindex'),'-1');assert.equal(b.g.getAttribute('aria-disabled'),'true');assert.equal(b.hit.getAttribute('pointer-events'),'all');
 assert.equal(click(w,b.hit).defaultPrevented,true);
 for(const k of ['Enter',' '])for(const type of ['keydown','keyup'])assert.equal(key(w,b.g,type,k).defaultPrevented,true);
 assert.equal(count,0);assert.equal(parentEvents,0);assert.equal(b.g.querySelector('[data-vlk-focus]').getAttribute('visibility'),'hidden');
 b.setDisabled(false);click(w,b.hit);assert.equal(count,1);
});
test('blur cancels Space; keyboard focus and authored selection stay independent',t=>{
 const w=environment(t);let count=0;const b=button(w,{pressed:true,onActivate(){count++;}}),ring=b.g.querySelector('[data-vlk-focus]');
 assert.equal(ring.getAttribute('visibility'),'hidden');assert.equal(ring.getAttribute('stroke'),'var(--color-focus)');assert.equal(ring.getAttribute('fill'),'none');
 b.g.focus();assert.equal(w.document.activeElement,b.g);assert.equal(ring.getAttribute('visibility'),'visible');
 const hitBefore=b.hit.outerHTML,ringBefore=ring.outerHTML;b.setPressed(false);assert.equal(b.g.getAttribute('aria-pressed'),'false');assert.equal(b.hit.outerHTML,hitBefore);assert.equal(ring.outerHTML,ringBefore);
 key(w,b.g,'keydown',' ');b.g.blur();key(w,b.g,'keyup',' ');assert.equal(count,0);assert.equal(ring.getAttribute('visibility'),'hidden');
 b.setPressed(null);assert.equal(b.g.hasAttribute('aria-pressed'),false);b.setPressed(true);assert.equal(ring.getAttribute('visibility'),'hidden');
 const custom=button(w,{id:'custom-focus',focusRing:false});assert.equal(custom.g.querySelector('[data-vlk-focus]'),null);assert.equal(custom.g.style.outline,'','Custom focus authors retain browser outline as a fallback');
});
test('canonical labels translate in detached and mounted scenes without resetting interaction state',async t=>{
 const w=environment(t);w.D.i18n.pack('en',{strings:{'Выбрать источник':'Choose source','Другой источник':'Another source','Видимая подпись':'Visible label'}});w.D.i18n.start();w.D.i18n.setLang('en');
 const detached=w.D.dom.s('g'),b=button(w,{pressed:true},detached),g=b.g,hit=b.hit;
 assert.equal(g.getAttribute('aria-label'),'Choose source');w.D.i18n.setLang('ru');assert.equal(g.getAttribute('aria-label'),'Выбрать источник');
 w.document.querySelector('svg').append(detached);const label=w.D.dom.s('text',{},'Видимая подпись');g.append(label);b.setLabel('Другой источник');b.setDisabled(true);
 await new Promise(resolve=>w.setTimeout(resolve,0));w.D.i18n.setLang('en');assert.equal(g.getAttribute('aria-label'),'Another source');assert.equal(label.textContent,'Visible label');
 w.D.i18n.setLang('ru');assert.equal(g.getAttribute('aria-label'),'Другой источник');assert.equal(label.textContent,'Видимая подпись');assert.equal(g.getAttribute('aria-pressed'),'true');assert.equal(g.getAttribute('aria-disabled'),'true');assert.equal(b.g,g);assert.equal(b.hit,hit);
});
test('invalid creation and updates are atomic, including derived geometry overflow',t=>{
 const w=environment(t),svg=w.document.querySelector('svg');
 const invalid=[{box:null},{box:{...box,width:0}},{box:{...box,height:-1}},{box:{...box,x:NaN}},{box:{...box,y:Infinity}},{box:{...box,x:'20'}},{box:{...box,x:Number.MAX_VALUE,width:Number.MAX_VALUE}},{box:{...box,x:1e100,width:1}},{label:''},{id:' '},{onActivate:null},{pressed:'yes'},{disabled:1},{focusRing:'false'}];
 for(const options of invalid){assert.throws(()=>button(w,options));assert.equal(svg.childNodes.length,0);}
 assert.throws(()=>button(w,{},w.document.body));assert.equal(w.document.body.childNodes.length,1);
 const b=button(w),before=b.g.outerHTML;
 for(const action of [()=>b.setBox({...box,height:NaN}),()=>b.setBox({...box,width:0}),()=>b.setLabel(null),()=>b.setPressed(1),()=>b.setDisabled(null)]){assert.throws(action);assert.equal(b.g.outerHTML,before);}
});
test('dispose is idempotent and removes handlers and detached-language subscription',t=>{
 const w=environment(t);w.D.i18n.pack('en',{strings:{'Выбрать источник':'Choose source'}});let count=0;const b=button(w,{onActivate(){count++;}}),g=b.g;
 b.dispose();b.dispose();assert.equal(g.parentNode,null);click(w,g);key(w,g,'keydown','Enter');key(w,g,'keyup','Enter');assert.equal(count,0);
 w.D.i18n.setLang('en');assert.equal(g.getAttribute('aria-label'),'Выбрать источник');
 for(const update of [()=>b.setBox(box),()=>b.setLabel('Name'),()=>b.setPressed(false),()=>b.setDisabled(false)])assert.throws(update,/disposed/i);
});

/* Run with VLK_NATIVE_BROWSER=1 and an installed Playwright module. Optional paths
   VLK_PLAYWRIGHT_MODULE and VLK_BROWSER_EXECUTABLE avoid a project dependency. */
test('native browser: fill-none misses empty interior; helper captures it and follows palette',
 {skip:process.env.VLK_NATIVE_BROWSER!=='1'},async t=>{
 const {chromium}=require(process.env.VLK_PLAYWRIGHT_MODULE||'playwright');
 const browser=await chromium.launch({headless:true,...(process.env.VLK_BROWSER_EXECUTABLE?{executablePath:process.env.VLK_BROWSER_EXECUTABLE}:{})});t.after(()=>browser.close());
 const page=await browser.newPage({viewport:{width:900,height:500}});
 await page.setContent('<style>:root{--color-focus:rgb(210, 80, 20)}body{margin:0}svg{display:block}</style><svg width="900" height="500" viewBox="0 0 900 500"></svg>');
 for(const file of scripts)await page.addScriptTag({path:path.join(source,file)});
 await page.evaluate(()=>{
  window.counts={legacy:0,fixed:0,deck:0};document.addEventListener('keydown',()=>counts.deck++);
  const svg=document.querySelector('svg'),old=D.dom.s('g',{role:'button',tabindex:0});
  old.append(D.dom.s('rect',{x:20,y:30,width:240,height:100,fill:'none',stroke:'black'}),D.dom.s('text',{x:110,y:82},'Legacy'));
  old.addEventListener('click',()=>counts.legacy++);svg.append(old);
  window.control=T.svgButton(svg,{id:'native',box:{x:300,y:30,width:240,height:100},label:'Выбрать источник',onActivate:()=>counts.fixed++});
  control.g.append(D.dom.s('text',{x:380,y:82},'Fixed'));
 });
 await page.mouse.click(35,45);assert.equal(await page.evaluate(()=>counts.legacy),0,'Legacy blank interior must reproduce the missed click');
 const legacyText=await page.locator('text').first().boundingBox();await page.mouse.click(legacyText.x+legacyText.width/2,legacyText.y+legacyText.height/2);assert.equal(await page.evaluate(()=>counts.legacy),1);
 const r=await page.locator('[data-vlk-hit="native"]').boundingBox();
 for(const [x,y] of [[r.x+3,r.y+3],[r.x+r.width-3,r.y+3],[r.x+3,r.y+r.height-3],[r.x+r.width-3,r.y+r.height-3],[r.x+r.width/2,r.y+r.height/2]])await page.mouse.click(x,y);
 assert.equal(await page.evaluate(()=>counts.fixed),5);
 await page.locator('[data-vlk-button="native"]').focus();await page.keyboard.press('Enter');await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>counts.fixed),7);assert.equal(await page.evaluate(()=>counts.deck),0);
 assert.equal(await page.locator('[data-vlk-focus]').evaluate(el=>getComputedStyle(el).visibility),'visible');assert.equal(await page.locator('[data-vlk-focus]').evaluate(el=>getComputedStyle(el).stroke),'rgb(210, 80, 20)');
 await page.evaluate(()=>document.documentElement.style.setProperty('--color-focus','rgb(40, 90, 210)'));assert.equal(await page.locator('[data-vlk-focus]').evaluate(el=>getComputedStyle(el).stroke),'rgb(40, 90, 210)');
 await page.addScriptTag({path:path.join(source,'appearance.js')});
 for(const background of ['black','white'])for(const palette of ['warm','ocean','botanical']){
  const result=await page.evaluate(({background,palette})=>{
   D.appearance.set({background,palette,font:'serif'});
   return {stroke:getComputedStyle(document.querySelector('[data-vlk-focus]')).stroke,expected:D.appearance.presets.palettes[palette][background][2],visible:getComputedStyle(document.querySelector('[data-vlk-focus]')).visibility,same:control.g===document.activeElement};
  },{background,palette});
  const expected='rgb('+result.expected.slice(1).match(/../g).map(x=>parseInt(x,16)).join(', ')+')';
  assert.equal(result.stroke,expected,background+' '+palette);assert.equal(result.visible,'visible');assert.equal(result.same,true);
 }
 await page.evaluate(()=>control.setDisabled(true));await page.mouse.click(r.x+3,r.y+3);await page.locator('[data-vlk-button="native"]').focus();await page.keyboard.press('Enter');await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>counts.fixed),7);assert.equal(await page.evaluate(()=>counts.deck),0);
});
