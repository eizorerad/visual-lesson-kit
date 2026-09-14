/* Layout arithmetic and lifecycle with explicit synthetic geometry. Native font
   shaping/paint belongs to the browser specimen; jsdom cannot certify pixels. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
const source=path.resolve(__dirname,'../starter/js');
function env(t){
 const dom=new JSDOM('<body><section class="scene"><svg></svg></section></body>',{runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
 for(const file of ['lib/dom.js','lib/i18n.js'])w.eval(fs.readFileSync(path.join(source,file),'utf8'));
 if(fs.existsSync(path.join(source,'layout.js')))w.eval(fs.readFileSync(path.join(source,'layout.js'),'utf8'));
 const unit=()=>w.document.documentElement.dataset.font==='serif'?12:10;
 w.SVGElement.prototype.getComputedTextLength=function(){return this.textContent.length*unit();};
 w.SVGElement.prototype.getScreenCTM=function(){return {a:1,b:0,c:0,d:1,e:0,f:0};};
 w.SVGElement.prototype.getBBox=function(){
  const lines=this.querySelectorAll('tspan'),items=lines.length?[...lines]:[this];
  const boxes=items.map(n=>{const size=+(this.getAttribute('font-size')||20),width=n.textContent.length*unit(),x=+(n.getAttribute('x')||this.getAttribute('x')||0),y=+(n.getAttribute('y')||this.getAttribute('y')||0),anchor=this.getAttribute('text-anchor');return{x:x-(anchor==='middle'?width/2:anchor==='end'?width:0),y:y-size*.8,width,height:size*(w.layoutGlyphHeightScale||1)};});
  const x=Math.min(...boxes.map(b=>b.x)),y=Math.min(...boxes.map(b=>b.y));return{x,y,width:Math.max(...boxes.map(b=>b.x+b.width))-x,height:Math.max(...boxes.map(b=>b.y+b.height))-y};
 };
 w.D.i18n.pack('en',{strings:{'два слова':'two longer words'}});w.D.i18n.start();
 t.after(()=>w.close());return w;
}
const plain=x=>JSON.parse(JSON.stringify(x));
test('explicit padding and weighted tracks account for gaps without mutating input',t=>{
 const w=env(t);assert.ok(w.L,'shared layout API exists');const b={x:10,y:20,width:320,height:160};
 assert.deepEqual(plain(w.L.inset(b,[10,20])),{x:30,y:30,width:280,height:140});
 const cols=w.L.columns(b,2,{gap:20,padding:10,weights:[1,2]});assert.equal(cols[0].width,280/3);assert.equal(cols[1].x,20+280/3+20);assert.equal(cols[1].x+cols[1].width,320);
 assert.throws(()=>w.L.inset(b,100));assert.throws(()=>w.L.rows(b,2,{gap:-1}));assert.equal(b.width,320);
});
test('text wraps inside true inset, preserves font size, and audits the intended box',t=>{
 const w=env(t),svg=w.document.querySelector('svg');assert.ok(w.L,'shared layout API exists');
 const text=w.L.textBox(svg,{x:100,y:100,width:140,height:80,padding:10,text:'alpha beta gamma',size:20,id:'label'});text.layout();
 assert.deepEqual([...text.el.querySelectorAll('tspan')].map(n=>n.textContent),['alpha beta','gamma']);assert.equal(text.el.getAttribute('font-size'),'20');
 assert.equal(w.L.audit(svg).issues.length,0);assert.equal(w.L.audit(svg).checked,1);
 text.setText('unbreakablelongtoken');text.layout();const report=w.L.audit(svg);assert.equal(report.issues[0].kind,'overflow');assert.equal(report.issues[0].id,'label');assert.equal(text.el.textContent,'unbreakablelongtoken');
});
test('translations use the full source sentence and font changes reflow stable text actors',async t=>{
 const w=env(t),root=w.document.querySelector('section'),svg=root.querySelector('svg');assert.ok(w.L,'shared layout API exists');const disposals=[];
 const text=w.L.textBox(svg,{x:0,y:0,width:125,height:100,padding:10,text:'два слова',size:20});const el=text.el;
 w.L.watch(root,{onDispose:fn=>disposals.push(fn)});await w.L.ready(root);w.D.i18n.setLang('en');await w.L.ready(root);
 assert.equal(text.el,el);assert.equal(el.getAttribute('aria-label'),'two longer words');assert.deepEqual([...el.querySelectorAll('tspan')].map(n=>n.textContent),['two longer','words']);
 w.document.documentElement.dataset.font='serif';await w.L.ready(root);assert.equal(el,svg.querySelector('text'));assert.equal(el.getAttribute('aria-label'),'two longer words');assert.deepEqual([...el.querySelectorAll('tspan')].map(n=>n.textContent),['two','longer','words']);
 w.D.i18n.setLang('ru');await w.L.ready(root);assert.equal(el.getAttribute('aria-label'),'два слова');assert.equal(el.dataset.layoutSource,'два слова');
 disposals.forEach(fn=>fn());assert.equal(w.L.audit(root).checked,0);
});
test('font-metric reuse regression overflows its internal box while remaining in canvas',t=>{
 const w=env(t),svg=w.document.querySelector('svg');assert.ok(w.L,'shared layout API exists');
 const label=w.D.dom.s('text',{x:222.5,y:317.5},'Последовательность');svg.append(label);
 // HarfBuzz + bundled Source Serif 4 regular: advance 243.85, ink width 242
 // at size 25; this fixture is mathematical evidence, not browser measurement.
 label.getBBox=()=>({x:101.675,y:305,width:242,height:25});
 w.L.contract(label,{id:'reuse.sequence',box:{x:110,y:270,width:225,height:95},padding:12,space:svg});
 const r=w.L.audit(svg);assert.equal(r.issues[0].kind,'overflow');assert.ok(r.issues[0].excess.left>20);assert.ok(r.issues[0].excess.right>20);
});
test('audit converts transformed SVG geometry and scaled HTML to contract units',t=>{
 const w=env(t),svg=w.document.querySelector('svg'),root=w.document.querySelector('section');assert.ok(w.L,'shared layout API exists');
 const label=w.D.dom.s('text',{},'x');svg.append(label);label.getBBox=()=>({x:0,y:0,width:20,height:10});label.getScreenCTM=()=>({a:2,b:0,c:0,d:2,e:200,f:100});svg.getScreenCTM=()=>({a:2,b:0,c:0,d:2,e:0,f:0});
 w.L.contract(label,{box:{x:100,y:50,width:20,height:10},space:svg});assert.equal(w.L.audit(svg).issues.length,0);
 const html=w.document.createElement('h1');root.append(html);root.getBoundingClientRect=()=>({left:50,top:30,width:640,height:360});Object.defineProperties(root,{offsetWidth:{value:1280},offsetHeight:{value:720}});html.getBoundingClientRect=()=>({left:100,top:55,width:200,height:20});
 w.L.contract(html,{box:{x:100,y:50,width:400,height:40},space:root});assert.equal(w.L.audit(root).issues.length,0);
});
test('missing geometry is unmeasured, and hidden parents suppress visible-only checks',t=>{
 const w=env(t),svg=w.document.querySelector('svg');assert.ok(w.L,'shared layout API exists');const q=w.D.dom.s('g'),n=w.D.dom.s('text',{},'x');q.append(n);svg.append(q);n.getBBox=undefined;
 w.L.contract(n,{box:{x:0,y:0,width:20,height:20},space:svg});assert.equal(w.L.audit(svg).unmeasured,1);assert.equal(w.L.audit(svg).issues[0].kind,'unmeasured');
 q.style.opacity='0';assert.equal(w.L.audit(svg).checked,0);assert.equal(w.L.audit(svg,{visibleOnly:false}).unmeasured,1);
});
test('HTML content audit detects overflow that its fixed element rectangle hides',t=>{
 const w=env(t),root=w.document.querySelector('section'),title=w.document.createElement('h1');root.append(title);title.textContent='Long title';
 root.getBoundingClientRect=()=>({left:0,top:0,width:640,height:360});Object.defineProperties(root,{offsetWidth:{value:1280},offsetHeight:{value:720}});title.getBoundingClientRect=()=>({left:30,top:24,width:580,height:47});
 w.document.createRange=()=>({selectNodeContents(){},getBoundingClientRect:()=>({left:30,top:24,width:600,height:58})});
 w.L.contract(title,{box:{x:60,y:48,width:1160,height:94},space:root,measure:'content'});const r=w.L.audit(root);assert.equal(r.issues[0].kind,'overflow');assert.equal(r.issues[0].excess.right,40);assert.equal(r.issues[0].excess.bottom,22);
});
test('ready lays out the current translated text before waiting for its requested fonts',async t=>{
 const w=env(t),svg=w.document.querySelector('svg'),text=w.L.textBox(svg,{x:0,y:0,width:140,height:100,text:'два слова'});text.layout();w.D.i18n.setLang('en');let requested='';
 Object.defineProperty(w.document,'fonts',{value:{get ready(){requested=text.el.getAttribute('aria-label');return Promise.resolve();}}});await w.L.ready(svg);assert.equal(requested,'two longer words');
});
test('mounted paint updates text synchronously with marks and skips unchanged source',t=>{
 const w=env(t),svg=w.document.querySelector('svg'),text=w.L.textBox(svg,{x:0,y:0,width:300,height:80,text:'0.10'});text.layout();
 text.setText('0.79');assert.equal(text.el.getAttribute('aria-label'),'0.79');const line=text.el.firstChild;text.setText('0.79');assert.equal(text.el.firstChild,line);
 text.setBox({x:100,y:50,width:300,height:80});assert.equal(+text.el.firstChild.getAttribute('x'),250);
});
test('baseline stride clears measured font rectangles taller than requested line height',t=>{
 const w=env(t),svg=w.document.querySelector('svg');w.layoutGlyphHeightScale=32.7277/25;
 const text=w.L.textBox(svg,{x:0,y:0,width:140,height:110,padding:10,text:'alpha beta gamma',size:25,lineHeight:1.2});text.layout();
 const lines=[...text.el.querySelectorAll('tspan')],stride=+lines[1].getAttribute('y')-lines[0].getAttribute('y');
 assert.ok(stride>=32.7277+2-1e-9,'measured glyph height plus intentional 0.08em gap');assert.equal(w.L.audit(svg).issues.length,0);
 const generous=w.L.textBox(svg,{x:0,y:150,width:140,height:140,padding:10,text:'alpha beta gamma',size:25,lineHeight:2});generous.layout();const ys=[...generous.el.querySelectorAll('tspan')].map(n=>+n.getAttribute('y'));assert.ok(ys[1]-ys[0]>=50,'requested larger leading is never reduced');
});
test('active English construction and language changes publish localized text synchronously',t=>{
 const w=env(t),root=w.document.createElement('section'),svg=w.D.dom.s('svg');root.append(svg);w.D.i18n.setLang('en');
 const text=w.L.textBox(svg,{x:0,y:0,width:140,height:110,text:'два слова'});assert.equal(text.el.textContent,'two longer words');assert.equal(text.el.dataset.layoutSource,'два слова');assert.equal(text.el.dataset.layoutStatus,'unmeasured','detached geometry is not fabricated');
 w.L.watch(root);w.D.i18n.setLang('ru');assert.equal(text.el.textContent,'два слова');w.D.i18n.setLang('en');assert.equal(text.el.textContent,'two longer words');assert.equal(text.el.dataset.layoutStatus,'unmeasured');
 w.D.i18n.pack('en',{strings:{'новый текст':'new text'}});text.setText('новый текст');assert.equal(text.el.textContent,'new text');assert.equal(text.el.dataset.layoutSource,'новый текст');w.L.watch(root).dispose();
});
test('tracks reject sparse weights and normalize extreme finite weights without NaN',t=>{
 const w=env(t),b={x:0,y:0,width:100,height:40};
 assert.throws(()=>w.L.columns(b,2,{weights:Array(2)}));
 const cols=w.L.columns(b,2,{weights:[Number.MAX_VALUE,Number.MAX_VALUE]});assert.deepEqual(plain(cols),[{x:0,y:0,width:50,height:40},{x:50,y:0,width:50,height:40}]);
 assert.throws(()=>w.L.columns(b,2,{weights:[Number.MIN_VALUE,Number.MAX_VALUE]}),'unrepresentable positive track cannot silently become zero');
 assert.throws(()=>w.L.inset(b,[,2]));assert.throws(()=>w.L.inset({x:Number.MAX_VALUE,y:0,width:Number.MAX_VALUE,height:40},1));
});
test('overflowing transformed SVG coordinates and derived excess never pass audit',t=>{
 const w=env(t),svg=w.document.querySelector('svg'),n=w.D.dom.s('text',{},'x');svg.append(n);n.getBBox=()=>({x:0,y:0,width:50,height:20});n.getScreenCTM=()=>({a:Number.MAX_VALUE,b:0,c:0,d:Number.MAX_VALUE,e:0,f:0});
 w.L.contract(n,{box:{x:0,y:0,width:100,height:40},space:svg});let r=w.L.audit(svg);assert.equal(r.checked,0);assert.equal(r.unmeasured,1);assert.equal(r.issues[0].kind,'unmeasured');
 n.getScreenCTM=()=>({a:1,b:0,c:0,d:1,e:0,f:0});n.getBBox=()=>({x:Number.MAX_VALUE,y:0,width:20,height:20});w.L.contract(n,{box:{x:-Number.MAX_VALUE,y:0,width:50,height:40},space:svg});r=w.L.audit(svg);assert.equal(r.checked,0);assert.equal(r.issues[0].kind,'unmeasured');
});
test('overflowing HTML coordinate differences are unmeasured',t=>{
 const w=env(t),root=w.document.querySelector('section'),n=w.document.createElement('h1');root.append(n);n.textContent='x';
 root.getBoundingClientRect=()=>({left:-Number.MAX_VALUE,top:0,width:100,height:100});Object.defineProperties(root,{offsetWidth:{value:100},offsetHeight:{value:100}});n.getBoundingClientRect=()=>({left:Number.MAX_VALUE,top:0,width:50,height:20});
 w.L.contract(n,{box:{x:0,y:0,width:100,height:40},space:root});const r=w.L.audit(root);assert.equal(r.checked,0);assert.equal(r.unmeasured,1);assert.equal(r.issues[0].kind,'unmeasured');
});
