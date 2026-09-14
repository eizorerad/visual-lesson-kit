/* Inspector button handlers with injected browser geometry. jsdom verifies the
   measurements consumed and findings reported, not font shaping or native paint. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
const starter=path.resolve(__dirname,'../starter');
const rect=(x,y,width,height)=>({x,y,left:x,top:y,width,height,right:x+width,bottom:y+height});
function env(t,markup){
 const host=new JSDOM('<iframe id="lesson"></iframe><div id="status"></div><pre id="result"></pre><input id="scene" value="1"><input id="step" value="0"><button id="show"></button><button id="audit"></button><button id="sweep"></button><button id="record"></button><button id="stop"></button>',{runScripts:'outside-only'});
 const lesson=new JSDOM('<section id="root">'+markup+'</section>',{runScripts:'outside-only',pretendToBeVisual:true}),w=lesson.window,root=w.document.querySelector('#root'),ranges=new WeakMap();
 Object.defineProperty(host.window.document.querySelector('#lesson'),'contentWindow',{value:w});
 for(const file of ['lib/dom.js','lib/i18n.js','layout.js'])w.eval(fs.readFileSync(path.join(starter,'js',file),'utf8'));
 const state={index:0,step:0,steps:0,busy:false};let lang='ru',appearance={font:'sans',background:'black'};
 w.D.deck={root:()=>root,current:()=>({...state}),count:()=>1,show:(index,step)=>Object.assign(state,{index,step})};
 w.D.i18n.lang=()=>lang;w.D.i18n.setLang=value=>{lang=value;};
 w.D.appearance={get:()=>({...appearance}),set:value=>{appearance={...value};}};
 w.A={debug:()=>({running:false})};w.F={};
 w.document.createRange=()=>{let node;return{selectNodeContents:n=>{node=n;},getClientRects:()=>ranges.get(node)||[],getBoundingClientRect:()=>ranges.get(node)?.[0]||rect(0,0,0,0)};};
 function bounds(selector,box){const n=typeof selector==='string'?root.querySelector(selector):selector;n.getBoundingClientRect=()=>box;return n;}
 function textBounds(selector,boxes){const n=root.querySelector(selector),walk=w.document.createTreeWalker(n,w.NodeFilter.SHOW_TEXT);let part;while((part=walk.nextNode()))ranges.set(part,boxes);ranges.set(n,boxes);return n;}
 for(const svg of root.querySelectorAll('svg'))bounds(svg,rect(0,0,1280,720));
 host.window.eval(fs.readFileSync(path.join(starter,'build/inspect.js'),'utf8'));
 t.after(()=>{host.window.close();w.close();});
 async function run(button='audit'){await host.window.document.querySelector('#'+button).onclick();const r=JSON.parse(host.window.document.querySelector('#result').textContent);assert.equal(r.error,undefined);return r;}
 return{w,host:host.window,root,bounds,textBounds,run};
}

for(const [name,html,selector] of [
 ['caption','<div class="film-caption">Caption text</div>','.film-caption'],
 ['title','<h1 class="film-title">Heading text</h1>','.film-title'],
 ['slider label','<label class="lesson-slider"><span>Slider text</span></label>','.lesson-slider span'],
 ['slider value','<label class="lesson-slider"><output>0.75</output></label>','.lesson-slider output']
])test('reports SVG text intersecting actual HTML '+name+' content',async t=>{
 const e=env(t,'<svg><text>Drawing label</text></svg>'+html);
 e.bounds('text',rect(100,200,90,20));e.bounds(selector,rect(400,400,300,20));
 const content=e.textBounds(selector,[rect(120,205,100,20)]).textContent;
 const report=await e.run();assert.equal(report.visibleSvgTexts,1,'HTML samples do not change the SVG count');
 assert.deepEqual(report.geometry,[{kind:'text-intersection',text:['Drawing label',content],overlap:[70,15]}]);
});

test('includes range-control bounds without treating arbitrary chart shapes as collisions',async t=>{
 const e=env(t,'<svg><rect width="300" height="100"/><text>Bar value</text></svg><label class="lesson-slider"><input type="range"></label>');
 e.bounds('text',rect(100,200,90,20));e.bounds('svg rect',rect(90,190,200,40));e.bounds('input',rect(130,208,200,20));
 const report=await e.run();assert.deepEqual(report.geometry,[{kind:'text-intersection',text:['Bar value','[slider track]'],overlap:[60,12]}]);
});

test('measures nested HTML text once and ignores hidden descendants',async t=>{
 const e=env(t,'<svg><text>Label</text></svg><label class="lesson-slider"><span><span id="visible">Value</span><span id="hidden" hidden>Hidden</span></span></label>');
 e.bounds('text',rect(100,200,90,20));e.textBounds('#visible',[rect(110,200,80,20)]);e.textBounds('#hidden',[rect(110,200,80,20)]);
 const report=await e.run();assert.equal(report.geometry.length,1);assert.deepEqual(report.geometry[0].text,['Label','Value']);
});

test('does not fill whitespace between HTML lines or SVG tspan lines',async t=>{
 const e=env(t,'<svg><text id="lines"><tspan>Top</tspan><tspan>Bottom</tspan></text><text id="between">Between</text><text id="between-html">HTML gap</text></svg><div class="film-caption">Two lines</div>');
 const lines=e.root.querySelectorAll('tspan');e.bounds(lines[0],rect(100,100,100,20));e.bounds(lines[1],rect(100,160,100,20));
 e.bounds('#lines',rect(100,100,100,80));e.bounds('#between',rect(100,130,100,20));
 e.bounds('#between-html',rect(300,130,100,20));
 e.textBounds('.film-caption',[rect(300,100,100,20),rect(300,160,100,20)]);e.bounds('.film-caption',rect(300,100,100,80));
 assert.deepEqual((await e.run()).geometry,[]);
});

test('keeps intended-box overflow and missing-contract coverage separate from canvas bounds',async t=>{
 const e=env(t,'<svg><text id="boxed">Too wide</text><text id="unknown">Unknown region</text></svg>');
 const n=e.bounds('#boxed',rect(100,100,150,20)),svg=e.root.querySelector('svg');e.bounds('#unknown',rect(500,100,100,20));
 const identity=()=>({a:1,b:0,c:0,d:1,e:0,f:0});n.getScreenCTM=svg.getScreenCTM=identity;n.getBBox=()=>({x:100,y:100,width:150,height:20});
 e.w.L.contract(n,{id:'small-box',box:{x:100,y:100,width:100,height:30},space:svg});
 const report=await e.run();assert.deepEqual(report.geometry,[]);assert.equal(report.contracts.checked,1);
 assert.equal(report.contracts.issues[0].kind,'overflow');assert.equal(report.contracts.issues[0].excess.right,50);assert.equal(report.contracts.uncontractedText.length,1);
 const sweep=await e.run('sweep');assert.equal(sweep.frames,8);assert.equal(sweep.checkedContracts,8);assert.equal(sweep.uncontractedSvgTextSamples,8);assert.equal(sweep.issues.length,8);
 assert.equal(sweep.issues[0].contracts.results,undefined,'compact result format stays compatible');
});

test('record samples a mid-transition collision while the global scheduler is active',async t=>{
 const e=env(t,'<svg><text>Moving label</text></svg><div class="film-caption">Caption</div>');
 let ms=0,phase=0,playing=false;
 e.root.querySelector('text').getBoundingClientRect=()=>rect(phase===3?100:400,200,90,20);
 e.textBounds('.film-caption',[rect(100,200,90,20)]);
 e.host.performance.now=()=>ms;
 e.w.requestAnimationFrame=callback=>e.w.setTimeout(()=>{ms+=100;if(playing){phase++;if(phase===5)playing=false;}callback(ms);},0);
 e.w.D.deck.next=()=>{playing=true;phase=0;};e.w.A.debug=()=>({running:playing});
 const report=await e.run('record');
 assert.equal(report.frames,6,'five scheduler frames plus the final pose');assert.equal(report.timedOut,false);
 assert.equal(report.issues.length,1);assert.equal(report.issues[0].elapsedMs,300);
 assert.deepEqual(report.issues[0].geometry[0].text,['Moving label','Caption']);
 assert.equal(report.motionTrace.length,report.frames);assert.equal(report.motionTrace.at(-1).elapsedMs,500);
});

const hitMarkup=(id,attrs='')=>`<g data-vlk-button="${id}" ${attrs}><rect data-vlk-hit="${id}"/><text>${id}</text></g>`;
function hitEnv(t,markup){
 const e=env(t,markup);
 Object.defineProperty(e.w,'innerWidth',{value:1280});Object.defineProperty(e.w,'innerHeight',{value:720});
 // Native paint order and geometry are injected; these tests do not claim that
 // jsdom itself implements SVG hit testing or transformed browser layout.
 for(const n of e.root.querySelectorAll('svg text'))n.style.visibility='hidden';
 return e;
}

test('hit audit is opt-in and exposes a read-only inspector helper',async t=>{
 const e=hitEnv(t,'<svg><g role="button"><rect width="100" height="50"/></g></svg>');
 const report=await e.run();assert.ok(report.hitRegions,'hit-region report is separate from text geometry');
 assert.equal(report.hitRegions.marked,0);assert.equal(report.hitRegions.checked,0);assert.deepEqual(report.geometry,[]);
 assert.equal(typeof e.host.VLK_INSPECTOR.auditHitRegions,'function');
 assert.equal(e.host.VLK_INSPECTOR.auditHitRegions(e.root).marked,0);
});

test('real svgButton decorative ARIA hiding does not hide its active hit rectangle',async t=>{
 const e=hitEnv(t,'<svg></svg>');e.w.T={};
 e.w.eval(fs.readFileSync(path.join(starter,'js/interaction-regions.js'),'utf8'));
 let activated=0;
 const button=e.w.T.svgButton(e.root.querySelector('svg'),{id:'real-helper',box:{x:100,y:100,width:80,height:40},label:'Choose',onActivate:()=>activated++});
 e.bounds(button.hit,rect(100,100,80,40));e.w.document.elementFromPoint=()=>button.hit;
 assert.equal(button.hit.getAttribute('aria-hidden'),'true','exercise the actual helper metadata');
 const h=(await e.run()).hitRegions;
 assert.equal(h.checked,1);assert.equal(h.skipped,0);assert.equal(h.coveredPoints,5);assert.deepEqual(h.issues,[]);assert.equal(activated,0);
 button.g.setAttribute('aria-hidden','true');
 const hidden=(await e.run()).hitRegions;assert.equal(hidden.checked,0);assert.equal(hidden.skipped,1);
 button.dispose();
});

test('samples transformed viewport bounds at center and inset corners without activating controls',async t=>{
 const e=hitEnv(t,'<svg>'+hitMarkup('scaled')+'</svg>'),owner=e.root.querySelector('g');
 e.bounds('[data-vlk-hit]',rect(240,180,120,60));owner.setAttribute('transform','translate(100 80) scale(2)');
 let activated=0;owner.addEventListener('click',()=>activated++);owner.addEventListener('keydown',()=>activated++);
 const points=[];e.w.document.elementFromPoint=(x,y)=>{points.push([x,y]);return owner.querySelector('text');};
 const h=(await e.run()).hitRegions;
 assert.equal(h.checked,1);assert.equal(h.unmeasured,0);assert.equal(h.checkedPoints,5);assert.equal(h.coveredPoints,5);assert.equal(activated,0);
 assert.deepEqual(points,[[300,210],[252,186],[348,186],[252,234],[348,234]]);
 assert.deepEqual(h.issues,[]);
});

test('reports positive-area hit overlaps but allows touching edges and regions owned by one button',async t=>{
 const e=hitEnv(t,'<svg>'+hitMarkup('a')+hitMarkup('b')+hitMarkup('touch')+'<g data-vlk-button="one"><rect data-vlk-hit="one-a"/><rect data-vlk-hit="one-b"/></g></svg>');
 e.bounds('[data-vlk-hit="a"]',rect(100,100,100,50));e.bounds('[data-vlk-hit="b"]',rect(160,125,100,50));e.bounds('[data-vlk-hit="touch"]',rect(260,125,100,50));
 e.bounds('[data-vlk-hit="one-a"]',rect(500,100,30,30));e.bounds('[data-vlk-hit="one-b"]',rect(510,100,30,30));
 e.w.document.elementFromPoint=(x,y)=>Array.from(e.root.querySelectorAll('[data-vlk-hit]')).find(n=>{const r=n.getBoundingClientRect();return x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom;})||null;
 const h=(await e.run()).hitRegions;
 assert.deepEqual(h.issues.filter(i=>i.kind==='hit-region-overlap'),[{kind:'hit-region-overlap',ids:['a','b'],overlap:[40,25]}]);
 assert.equal(h.pairChecks,9,'same-owner pair is not treated as two controls');
});

test('reports HTML occlusion even when the SVG hit rectangle has complete geometry',async t=>{
 const e=hitEnv(t,'<svg>'+hitMarkup('covered')+'</svg><div id="overlay">HTML overlay</div>'),owner=e.root.querySelector('g');
 e.bounds('[data-vlk-hit]',rect(100,100,100,50));
 e.w.document.elementFromPoint=(x,y)=>x===150?e.root.querySelector('#overlay'):owner;
 const h=(await e.run()).hitRegions;
 assert.equal(h.checked,1);assert.equal(h.checkedPoints,5);assert.equal(h.coveredPoints,4);
 assert.equal(h.issues[0].kind,'hit-region-coverage');assert.equal(h.issues[0].id,'covered');assert.equal(h.issues[0].points.length,1);
 assert.equal(h.issues[0].points[0].name,'center');assert.equal(h.issues[0].points[0].hit,'div#overlay');
});

test('counts zero-size, missing hit-testing, invalid geometry and missing owners as unmeasured',async t=>{
 const e=hitEnv(t,'<svg>'+hitMarkup('zero')+hitMarkup('invalid')+hitMarkup('missing-api')+'<rect data-vlk-hit="orphan"/></svg>');
 e.bounds('[data-vlk-hit="zero"]',rect(100,100,0,40));e.bounds('[data-vlk-hit="invalid"]',rect(NaN,100,80,40));e.bounds('[data-vlk-hit="missing-api"]',rect(100,100,80,40));e.bounds('[data-vlk-hit="orphan"]',rect(300,100,80,40));
 const h=(await e.run()).hitRegions;
 assert.equal(h.checked,0);assert.equal(h.unmeasured,4);
 assert.deepEqual(h.issues.map(i=>i.kind),Array(4).fill('hit-region-unmeasured'));
 assert.deepEqual(h.issues.map(i=>i.reason),['zero-size','invalid-geometry','hit-testing-unavailable','missing-owner']);
});

test('marks failed native measurements as unmeasured rather than a successful hit check',async t=>{
 const e=hitEnv(t,'<svg>'+hitMarkup('no-box')+hitMarkup('failed-hit-test')+'</svg>');
 e.root.querySelector('[data-vlk-hit="no-box"]').getBoundingClientRect=()=>{throw new Error('Renderer unavailable');};
 e.bounds('[data-vlk-hit="failed-hit-test"]',rect(100,100,80,40));e.w.document.elementFromPoint=()=>{throw new Error('Hit test unavailable');};
 const h=(await e.run()).hitRegions;
 assert.equal(h.unmeasured,2);assert.equal(h.checked,0);assert.equal(h.checkedPoints,0);
 assert.deepEqual(h.issues.map(i=>i.reason),['geometry-unavailable','hit-testing-failed']);
});

test('an empty native hit is an uncovered point and detached geometry is unmeasured',async t=>{
 const e=hitEnv(t,'<svg>'+hitMarkup('empty')+'</svg>');e.bounds('[data-vlk-hit]',rect(100,100,80,40));e.w.document.elementFromPoint=()=>null;
 const h=(await e.run()).hitRegions;assert.equal(h.checked,1);assert.equal(h.checkedPoints,5);assert.equal(h.coveredPoints,0);assert.equal(h.issues[0].points.length,5);
 e.root.remove();const detached=e.host.VLK_INSPECTOR.auditHitRegions(e.root);assert.equal(detached.unmeasured,1);assert.equal(detached.checked,0);assert.equal(detached.issues[0].reason,'detached');
});

test('skips hidden, inert, disabled and off-viewport controls with explicit coverage counts',async t=>{
 const e=hitEnv(t,'<svg><g hidden>'+hitMarkup('hidden')+'</g><g inert>'+hitMarkup('inert')+'</g><g aria-hidden="true">'+hitMarkup('aria-hidden')+'</g>'+hitMarkup('disabled','aria-disabled="true"')+hitMarkup('outside')+hitMarkup('visible')+'</svg>');
 for(const n of e.root.querySelectorAll('[data-vlk-hit]'))e.bounds(n,rect(100,100,80,40));
 e.bounds('[data-vlk-hit="outside"]',rect(1300,100,80,40));const owner=e.root.querySelector('[data-vlk-button="visible"]');e.w.document.elementFromPoint=()=>owner;
 const h=(await e.run()).hitRegions;
 assert.equal(h.marked,6);assert.equal(h.checked,1);assert.equal(h.skipped,5);assert.equal(h.disabled,1);assert.equal(h.unmeasured,0);assert.equal(h.checkedPoints,5);assert.deepEqual(h.issues,[]);
});

test('clips hit samples and overlap checks to the actual lesson viewport',async t=>{
 const e=hitEnv(t,'<svg>'+hitMarkup('partial')+hitMarkup('outside-overlap')+'</svg>');
 e.bounds('[data-vlk-hit="partial"]',rect(-50,100,100,50));e.bounds('[data-vlk-hit="outside-overlap"]',rect(-70,110,60,30));
 const points=[];e.w.document.elementFromPoint=(x,y)=>{points.push([x,y]);return e.root.querySelector('[data-vlk-button="partial"]');};
 const h=(await e.run()).hitRegions;
 assert.equal(h.checked,1);assert.equal(h.skipped,1);assert.equal(h.pairChecks,0);assert.deepEqual(h.issues,[]);
 assert(points.every(([x,y])=>x>0&&x<50&&y>100&&y<150));assert.equal(points[0][0],25);
});

test('known reading-panel occlusion is skipped, without hiding a separate HTML obstruction',async t=>{
 const e=hitEnv(t,'<svg>'+hitMarkup('under-reading')+'</svg><aside id="notes" class="notes"><span>Notes</span></aside><div id="foreign-overlay"></div>');
 e.bounds('[data-vlk-hit]',rect(100,100,100,50));const owner=e.root.querySelector('g');
 e.w.document.elementFromPoint=(x,y)=>x===150?e.root.querySelector('#notes span'):x===110&&y===105?e.root.querySelector('#foreign-overlay'):owner;
 const h=(await e.run()).hitRegions;
 assert.equal(h.checked,0);assert.equal(h.skipped,1);assert.equal(h.skippedPoints,1);assert.equal(h.checkedPoints,4);assert.equal(h.coveredPoints,3);
 assert.equal(h.issues.length,1);assert.equal(h.issues[0].kind,'hit-region-coverage');assert.equal(h.issues[0].points[0].hit,'div#foreign-overlay');
});

test('sweep reports hit coverage and unmeasured regions independently of text contracts',async t=>{
 const e=hitEnv(t,'<svg>'+hitMarkup('ok')+hitMarkup('zero')+'</svg>');e.bounds('[data-vlk-hit="ok"]',rect(100,100,80,40));e.bounds('[data-vlk-hit="zero"]',rect(200,100,0,40));
 e.w.document.elementFromPoint=()=>e.root.querySelector('[data-vlk-button="ok"]');
 const r=await e.run('sweep');assert.equal(r.frames,8);assert.equal(r.checkedHitRegions,8);assert.equal(r.unmeasuredHitRegions,8);assert.equal(r.checkedHitPoints,40);assert.equal(r.issues.length,8);
 assert.equal(r.issues[0].hitRegions.results,undefined,'compact output omits per-region successes');
 assert.equal(r.issues[0].hitRegions.issues[0].kind,'hit-region-unmeasured');
});

test('record detects a hit rectangle obscured only during a transition',async t=>{
 const e=hitEnv(t,'<svg>'+hitMarkup('moving')+'</svg><div id="overlay"></div>');e.bounds('[data-vlk-hit]',rect(100,100,80,40));
 let ms=0,phase=0,playing=false;
 e.w.document.elementFromPoint=()=>phase===3?e.root.querySelector('#overlay'):e.root.querySelector('g');
 e.host.performance.now=()=>ms;e.w.requestAnimationFrame=callback=>e.w.setTimeout(()=>{ms+=100;if(playing){phase++;if(phase===5)playing=false;}callback(ms);},0);
 e.w.D.deck.next=()=>{playing=true;phase=0;};e.w.A.debug=()=>({running:playing});
 const r=await e.run('record');assert.equal(r.frames,6);assert.equal(r.checkedHitRegions,6);assert.equal(r.checkedHitPoints,30);assert.equal(r.issues.length,1);
 assert.equal(r.issues[0].elapsedMs,300);assert.equal(r.issues[0].hitRegions.issues[0].kind,'hit-region-coverage');
});
