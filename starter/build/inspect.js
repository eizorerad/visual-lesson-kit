/* Development-only native-browser inspector. Not included in the lesson bundle.
   Measurements execute in the iframe's actual renderer, not jsdom. */
(function(){
'use strict';
const frame=document.querySelector('#lesson'),status=document.querySelector('#status'),out=document.querySelector('#result');
let stopped=false,running=false;
const W=()=>frame.contentWindow;
const tick=()=>new Promise(resolve=>W().requestAnimationFrame(resolve));
async function settled(){
 const w=W(),start=performance.now();
 while(w.D.deck.current().busy||w.A.debug().running){if(performance.now()-start>10000)throw new Error('Scene replay did not settle');await tick();}
 if(w.L)await w.L.ready(w.D.deck.root());else{await w.document.fonts.ready;await tick();}
 await Promise.resolve();
}
function visible(n){
 let a=1;for(let p=n;p&&p.nodeType===1;p=p.parentElement){const s=W().getComputedStyle(p);if(p.hidden||s.display==='none'||s.visibility==='hidden'||s.visibility==='collapse')return false;a*=Number(s.opacity||1);}return a>.08;
}
// Opt-in interaction coverage, separate from label geometry. This function only
// reads native rectangles and hit-test results: it never clicks or dispatches.
function auditHitRegions(root=W().D.deck.root()){
 const report={marked:0,checked:0,unmeasured:0,skipped:0,disabled:0,checkedPoints:0,coveredPoints:0,skippedPoints:0,pairChecks:0,results:[],issues:[]};
 if(!root)return report;
 const doc=root.ownerDocument,w=doc.defaultView,candidates=[],nodes=Array.from(root.querySelectorAll('[data-vlk-hit]'));
 const viewport={left:0,top:0,right:w.innerWidth,bottom:w.innerHeight};
 const validViewport=Number.isFinite(viewport.right)&&Number.isFinite(viewport.bottom)&&viewport.right>0&&viewport.bottom>0;
 function skipReason(n){
  let opacity=1;
  for(let p=n;p&&p.nodeType===1;p=p.parentElement){
   const style=w.getComputedStyle(p);
   // The helper's decorative hit rect is aria-hidden; its owning button is
   // accessible. Keep honoring ARIA-hidden owners/scenes and visual hiding.
   const ariaHidden=p.getAttribute('aria-hidden')==='true'&&!(p===n&&p.hasAttribute('data-vlk-hit'));
   if(p.hidden||p.hasAttribute('hidden')||ariaHidden||style.display==='none'||style.visibility==='hidden'||style.visibility==='collapse')return'hidden';
   if(p.inert||p.hasAttribute('inert'))return'inert';
   opacity*=Number(style.opacity||1);
  }
  return opacity<=.08?'hidden':null;
 }
 const describe=n=>n?n.localName+(n.id?'#'+n.id:''):'[no element]';
 function skip(result,reason){result.kind='skipped';result.reason=reason;report.skipped++;}
 function unmeasured(result,reason){result.kind='unmeasured';result.reason=reason;report.unmeasured++;report.issues.push({kind:'hit-region-unmeasured',id:result.id,reason});}
 for(const [index,n]of nodes.entries()){
  report.marked++;const id=n.getAttribute('data-vlk-hit')||'[unnamed '+(index+1)+']',result={id};report.results.push(result);
  if(!n.isConnected){unmeasured(result,'detached');continue;}
  const reason=skipReason(n);if(reason){skip(result,reason);continue;}
  const owner=n.closest('[data-vlk-button]')||(n.parentElement?.localName==='g'?n.parentElement:null);
  if(n.localName!=='rect'||!owner||owner.localName!=='g'){unmeasured(result,'missing-owner');continue;}
  if(owner.getAttribute('aria-disabled')==='true'){report.disabled++;skip(result,'disabled');continue;}
  let r;try{r=n.getBoundingClientRect();}catch(_){unmeasured(result,'geometry-unavailable');continue;}
  if(!r||!['left','top','right','bottom','width','height'].every(k=>Number.isFinite(r[k]))||r.width<0||r.height<0||r.right<r.left||r.bottom<r.top){unmeasured(result,'invalid-geometry');continue;}
  if(r.width===0||r.height===0||r.right===r.left||r.bottom===r.top){unmeasured(result,'zero-size');continue;}
  if(!validViewport){unmeasured(result,'viewport-unavailable');continue;}
  const box={left:Math.max(r.left,viewport.left),top:Math.max(r.top,viewport.top),right:Math.min(r.right,viewport.right),bottom:Math.min(r.bottom,viewport.bottom)};
  box.width=box.right-box.left;box.height=box.bottom-box.top;
  if(box.width<=0||box.height<=0){skip(result,'outside-viewport');continue;}
  result.box=box;result.clipped=r.left!==box.left||r.top!==box.top||r.right!==box.right||r.bottom!==box.bottom;
  const candidate={id,owner,box,result};candidates.push(candidate);
  if(typeof doc.elementFromPoint!=='function'){unmeasured(result,'hit-testing-unavailable');continue;}
  // Ten-percent insets remain strictly inside small or partially visible hits.
  const dx=box.width*.1,dy=box.height*.1,points=[['center',box.left+box.width/2,box.top+box.height/2],['top-left',box.left+dx,box.top+dy],['top-right',box.right-dx,box.top+dy],['bottom-left',box.left+dx,box.bottom-dy],['bottom-right',box.right-dx,box.bottom-dy]];
  const misses=[];let unavailable=false,reading=false;result.samples=[];
  for(const[name,x,y]of points){
   const sample={name,x,y};result.samples.push(sample);let hit;
   try{hit=doc.elementFromPoint(x,y);}catch(_){sample.unmeasured=true;unavailable=true;continue;}
   // The official reading surface intentionally covers the drawing in narrow
   // layouts. Do not exempt arbitrary HTML overlays or discard other samples.
   const panel=hit?.closest?.('#notes.notes');
   if(panel&&!skipReason(panel)&&!owner.contains(hit)){sample.skipped='reading-panel';report.skippedPoints++;reading=true;continue;}
   report.checkedPoints++;sample.covered=!!hit&&owner.contains(hit);sample.hit=describe(hit);
   if(sample.covered)report.coveredPoints++;else misses.push({...sample});
  }
  if(misses.length)report.issues.push({kind:'hit-region-coverage',id,points:misses});
  if(unavailable)unmeasured(result,'hit-testing-failed');
  else if(reading)skip(result,'reading-panel');
  else{result.kind='checked';report.checked++;}
  candidate.reading=reading;
 }
 for(let i=0;i<candidates.length;i++)for(let j=i+1;j<candidates.length;j++){
  const a=candidates[i],b=candidates[j];if(a.owner===b.owner||a.reading||b.reading)continue;
  report.pairChecks++;const dx=Math.min(a.box.right,b.box.right)-Math.max(a.box.left,b.box.left),dy=Math.min(a.box.bottom,b.box.bottom)-Math.max(a.box.top,b.box.top);
  if(dx>0&&dy>0)report.issues.push({kind:'hit-region-overlap',ids:[a.id,b.id],overlap:[dx,dy]});
 }
 return report;
}
window.VLK_INSPECTOR=Object.freeze({auditHitRegions});
function measure(){
 const w=W(),root=w.D.deck.root(),state=w.D.deck.current();
 if(!root||root.querySelector('.scene-error')||root.classList.contains('scene-error'))throw new Error('Scene is missing or failed to mount');
 const appearance=w.D.appearance?w.D.appearance.get():{},report={scene:state.index+1,step:state.step,lang:w.D.i18n.lang(),...appearance,contracts:w.L?w.L.audit(root,{tolerance:1}):null,hitRegions:auditHitRegions(root),geometry:[],visibleSvgTexts:0};
 report.actors=Array.from(root.querySelectorAll('[data-shared-id],[data-motion-id]')).filter(visible).map(n=>({id:n.dataset.sharedId||n.dataset.motionId,transform:n.getAttribute('transform')}));
 const nodes=Array.from(root.querySelectorAll('svg text')).filter(n=>visible(n)&&n.textContent.trim());
 const boxes=nodes.flatMap(n=>{const lines=Array.from(n.children).filter(x=>x.localName==='tspan');return(lines.length?lines:[n]).filter(x=>x.textContent.trim()).map(part=>({n,r:part.getBoundingClientRect(),text:part.textContent}));});
 report.visibleSvgTexts=nodes.length;
 // Compare drawing labels with real HTML text, not the empty space inside a
 // fixed-width caption/control. Text-node ranges avoid duplicate rectangles
 // from nested spans and keep the gaps between wrapped lines available.
 const seen=new Set();
 for(const container of root.querySelectorAll('.film-title,.film-caption,.lesson-slider span,.lesson-slider output')){
  const walk=w.document.createTreeWalker(container,w.NodeFilter.SHOW_TEXT);let part;
  while((part=walk.nextNode())){
   if(seen.has(part)||!part.textContent.trim()||!visible(part.parentElement))continue;
   seen.add(part);const range=w.document.createRange();range.selectNodeContents(part);
   for(const r of range.getClientRects())if(r.width>0&&r.height>0)boxes.push({n:part.parentElement,r,text:part.textContent});
  }
 }
 // This is the input's full interaction rectangle, not its browser-specific
 // painted rail. Arbitrary chart shapes may intentionally touch or contain text.
 for(const n of root.querySelectorAll('.lesson-slider input[type="range"]'))if(visible(n))boxes.push({n,r:n.getBoundingClientRect(),text:'[slider track]'});
 for(const {n,r,text} of boxes){
  const svg=n.closest('svg');if(!svg)continue;const b=svg.getBoundingClientRect();
  if(r.left<b.left-2||r.right>b.right+2||r.top<b.top-2||r.bottom>b.bottom+2)report.geometry.push({kind:'svg-bounds',text});
 }
 for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){
  const a=boxes[i],b=boxes[j],dx=Math.min(a.r.right,b.r.right)-Math.max(a.r.left,b.r.left),dy=Math.min(a.r.bottom,b.r.bottom)-Math.max(a.r.top,b.r.top);
  if(dx>3&&dy>3)report.geometry.push({kind:'text-intersection',text:[a.text,b.text],overlap:[+dx.toFixed(2),+dy.toFixed(2)]});
 }
 for(const n of root.querySelectorAll('.film-title,.film-caption'))if(visible(n)&&n.textContent.trim()&&(n.scrollWidth>n.clientWidth+2||n.scrollHeight>n.clientHeight+2))report.geometry.push({kind:'html-overflow',text:n.textContent});
 return report;
}
function compact(r){return{...r,contracts:r.contracts?{...r.contracts,results:undefined}:null,hitRegions:r.hitRegions?{...r.hitRegions,results:undefined}:null};}
function summary(records,extra={}){
 const hitCount=key=>records.reduce((a,r)=>a+(r.hitRegions?.[key]||0),0);
 return{...extra,frames:records.length,visibleSvgTextSamples:records.reduce((a,r)=>a+r.visibleSvgTexts,0),checkedContracts:records.reduce((a,r)=>a+(r.contracts?.checked||0),0),unmeasured:records.reduce((a,r)=>a+(r.contracts?.unmeasured||0),0),uncontractedSvgTextSamples:records.reduce((a,r)=>a+(r.contracts?.uncontractedText?.length||0),0),markedHitRegions:hitCount('marked'),checkedHitRegions:hitCount('checked'),unmeasuredHitRegions:hitCount('unmeasured'),skippedHitRegions:hitCount('skipped'),disabledHitRegions:hitCount('disabled'),checkedHitPoints:hitCount('checkedPoints'),coveredHitPoints:hitCount('coveredPoints'),skippedHitPoints:hitCount('skippedPoints'),hitRegionPairChecks:hitCount('pairChecks'),issues:records.filter(r=>r.geometry.length||r.contracts?.issues.length||r.hitRegions?.issues.length).map(compact)};
}
async function task(fn){
 if(running)return;running=true;stopped=false;
 for(const b of document.querySelectorAll('button:not(#stop)'))b.disabled=true;
 try{await fn();}catch(error){status.textContent='Inspection failed: '+error.message;out.textContent=JSON.stringify({error:error.message},null,2);}
 finally{running=false;for(const b of document.querySelectorAll('button'))b.disabled=false;}
}
document.querySelector('#show').onclick=()=>task(async()=>{
 const w=W(),scene=+document.querySelector('#scene').value-1,step=+document.querySelector('#step').value;
 if(!Number.isInteger(scene)||scene<0||scene>=w.D.deck.count()||!Number.isInteger(step)||step<0)throw new Error('Invalid scene or step');
 w.D.deck.show(scene,step);await settled();out.textContent=JSON.stringify(compact(measure()),null,2);status.textContent='Current state measured.';
});
document.querySelector('#audit').onclick=()=>task(async()=>{await settled();out.textContent=JSON.stringify(compact(measure()),null,2);status.textContent='Current state measured.';});
document.querySelector('#stop').onclick=()=>{stopped=true;status.textContent='Stopping after the current sample…';};
document.querySelector('#sweep').onclick=()=>task(async()=>{
 const w=W(),saved={state:w.D.deck.current(),lang:w.D.i18n.lang(),appearance:w.D.appearance?.get()},records=[];
 try{
  outer:for(const lang of ['ru','en'])for(const font of ['sans','serif'])for(const background of ['black','white']){
   w.D.i18n.setLang(lang);if(w.D.appearance)w.D.appearance.set({font,background});
   for(let index=0;index<w.D.deck.count();index++){
    w.D.deck.show(index,0);await settled();const steps=w.D.deck.current().steps;
    for(let step=0;step<=steps;step++){
     if(stopped)break outer;
     if(step){w.D.deck.show(index,step);await settled();}
     records.push(measure());status.textContent=`Measured ${records.length} frames · ${lang}/${font}/${background} · ${index+1}.${step}`;
    }
   }
  }
  const result=summary(records,{method:'Native browser endpoint geometry, intended-box contracts and authored hit regions',stopped});
  out.textContent=JSON.stringify(result,null,2);status.textContent=`Completed ${result.frames} frames; ${result.issues.length} frames have findings; ${result.unmeasured} unmeasured contracts; ${result.checkedHitRegions} checked / ${result.unmeasuredHitRegions} unmeasured hit regions.`;
 }finally{
  if(saved.appearance)w.D.appearance.set(saved.appearance);w.D.i18n.setLang(saved.lang);w.D.deck.show(saved.state.index,saved.state.step);await settled();
 }
});
document.querySelector('#record').onclick=()=>task(async()=>{
 const w=W();await settled();const before=w.D.deck.current(),eligibleSharedActors=w.F.motionBridge?w.F.motionBridge.capture(w.D.deck.root()).size:0,records=[],start=performance.now();let last=-Infinity,timedOut=false;
 w.D.deck.next();
 // Include the global scheduler: a bridge has no deck busy flag, and its
 // duration changes with the viewer's speed setting.
 do{
  await tick();const now=performance.now(),elapsed=now-start;
  if(now-last>=90){last=now;const sample=measure();sample.elapsedMs=Math.round(elapsed);records.push(sample);}
  if(stopped)break;
  if(elapsed>12000){timedOut=!!(w.D.deck.current().busy||w.A.debug().running);break;}
  if(elapsed>300&&!w.D.deck.current().busy&&!w.A.debug().running)break;
 }while(true);
 records.push({...measure(),elapsedMs:Math.round(performance.now()-start)});
 const result=summary(records,{method:'Native animation sampled about every 90 ms, including the final pose',from:before,stopped,timedOut,eligibleSharedActors,durationMs:Math.round(performance.now()-start),motionTrace:records.map(r=>({elapsedMs:r.elapsedMs,scene:r.scene,step:r.step,actors:r.actors}))});
 out.textContent=JSON.stringify(result,null,2);status.textContent=`${timedOut?'Timed out after':'Recorded'} ${result.frames} native samples; ${result.issues.length} samples have findings.`;
});
frame.onload=()=>{try{const w=W();if(!w.D?.deck)throw new Error('Open through the local lesson server, after building a valid index.html');status.textContent=`Ready: ${w.D.deck.count()} scenes. Scans use actual browser layout; missing contracts remain a coverage gap.`;}catch(error){status.textContent=error.message;}};
})();
