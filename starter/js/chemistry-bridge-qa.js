/* Optional browser diagnostics; ordinary viewing creates no QA UI or observers. */
(function(){'use strict';
if(new URLSearchParams(location.search).get('qa')!=='1')return;
function start(){
 if(document.getElementById('chemistry-qa'))return;
 const frame=document.getElementById('frame');if(!frame)return;
 const output=document.createElement('pre');output.id='chemistry-qa';output.hidden=true;document.body.append(output);
 const toolbar=document.createElement('div');toolbar.dataset.chemistryQaToolbar='';toolbar.dataset.noSwipe='';toolbar.setAttribute('aria-label','Chemistry verification');
 toolbar.style.cssText='position:fixed;top:3px;right:6px;z-index:2000;display:flex;flex-wrap:wrap;gap:5px;max-width:calc(100vw - 12px);font:12px sans-serif';
 const status=document.createElement('span');status.setAttribute('role','status');status.style.cssText='padding:4px;background:var(--color-bg);color:var(--color-text)';
 const frameButtons=[],identities=new WeakMap(),samples=[0,.12,.25,.36,.45,.55,.65,.72,.76,.84,.92,1];
 let current=null,history=[],droppedHistory=0,run={status:'idle',checked:0,issues:[]},pending=false,inspecting=false,sweeping=false,fontsReady=false,lastCapture=null;
 const observation={subtree:true,attributes:true,childList:true,characterData:true};
 const root=()=>window.D&&D.deck&&D.deck.root?D.deck.root():frame.querySelector('[data-chem-scene]');
 const tick=()=>new Promise(resolve=>requestAnimationFrame(resolve));
 async function settle(){if(document.fonts)await document.fonts.ready;await tick();await tick();}
 function publish(){
  output.textContent=JSON.stringify({current,history,run,droppedHistory});
  if(current){output.dataset.scene=current.scene;output.dataset.progress=String(current.progress);output.dataset.ready=String(current.unmeasured===0);}
  status.textContent=run.status==='running'?'Checking '+run.checked+' / '+run.total:run.status==='complete'?'Checked '+run.checked+' frames; '+run.issues.length+' findings':run.status==='failed'?'Check failed; inspect report':'QA: text bounds and shape identity';
 }
 function remember(result){history.push(result);if(history.length>400){history.shift();droppedHistory++;}}
 function fail(error,context={}){const issue={kind:'qa-error',message:String(error&&error.message||error),...context};run.issues.push(issue);publish();return issue;}
 function setFrame(progress){
  const active=root(),input=active&&active.querySelector('input[type="range"]');
  if(!input)throw new Error('The current scene has no chemistry progress control');
  input.value=String(Math.round(progress*100));input.dispatchEvent(new Event('input',{bubbles:true}));
 }
 function inspect(options={}){
  if(inspecting)return current;inspecting=true;observer.disconnect();
  try{
   const active=root(),scene=active&&active.dataset.sceneId||options.scene||'unknown';
   if(!active||!active.hasAttribute('data-chem-scene')){
    current={scene,progress:null,sameNodes:false,shapeCount:0,contracted:0,checked:0,unmeasured:0,uncontractedText:[],issues:[{kind:'scene-error',message:active&&active.textContent||'No chemistry scene is mounted'}],sweep:!!options.sweep};
   }else{
    const drawing=active.querySelector('[data-chem-drawing]'),shapes=drawing?[drawing,...drawing.querySelectorAll('*')].filter(n=>n.namespaceURI==='http://www.w3.org/2000/svg'&&!['text','tspan','title','desc'].includes(n.localName)):[];
    if(!identities.has(active))identities.set(active,shapes);
    const baseline=identities.get(active),sameNodes=!!drawing&&baseline.length===shapes.length&&baseline.every((n,i)=>n===shapes[i]);
    const audit=L.audit(active,{visibleOnly:true}),issues=audit.issues.slice();
    if(!sameNodes)issues.push({kind:'shape-identity',message:'The persistent scientific drawing changed its shape nodes'});
    if(!drawing)issues.push({kind:'drawing-missing',message:'The scene has no data-chem-drawing group'});
    for(const item of audit.uncontractedText)issues.push({kind:'uncontracted-text',...item});
    let metrics=null;try{metrics=JSON.parse(active.dataset.metrics||'{}');}catch(error){issues.push({kind:'metrics-json',message:String(error.message)});}
    const progress=Number(active.dataset.progress);
    if(!Number.isFinite(progress))issues.push({kind:'progress',message:'Scene progress is not finite'});
    if(options.expected!==undefined&&Math.abs(progress-options.expected)>1e-9)issues.push({kind:'progress-mismatch',expected:options.expected,actual:progress});
    current={scene,chemScene:active.dataset.chemScene,progress,running:active.dataset.running==='true',metrics,sameNodes,shapeCount:shapes.length,contracted:audit.contracted,checked:audit.checked,skipped:audit.skipped,unmeasured:audit.unmeasured,issues,uncontractedText:audit.uncontractedText,sweep:!!options.sweep,
     coverage:{fontsReady,method:'L.audit visible text contracts and persistent SVG node identity',limitations:'Text findings retain unmeasured regions and may need visual review. This check does not measure all text-to-geometry clearance, scientific correctness, physical gestures or motion trajectories.'}};
    if(current.running&&progress>.4&&progress<.6){lastCapture={scene,progress,clone:active.cloneNode(true),frameStyle:frame.style.cssText};capture.hidden=false;}
    current.captured=lastCapture?{scene:lastCapture.scene,progress:lastCapture.progress}:null;
   }
   if(options.sweep||current.issues.length)remember(current);
   publish();return current;
  }catch(error){
   current={scene:options.scene||'unknown',progress:null,sameNodes:false,shapeCount:0,checked:0,contracted:0,unmeasured:0,uncontractedText:[],issues:[{kind:'qa-error',message:String(error&&error.message||error)}],sweep:!!options.sweep};
   remember(current);publish();return current;
  }finally{observer.takeRecords();inspecting=false;observer.observe(frame,observation);}
 }
 function schedule(){
  if(pending||inspecting||sweeping||!fontsReady)return;pending=true;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{pending=false;if(!sweeping)inspect();}));
 }
 const observer=new MutationObserver(schedule);
 function button(text,action){const el=document.createElement('button');el.type='button';el.textContent=text;el.addEventListener('click',action);toolbar.append(el);return el;}
 for(const value of [0,25,50,75,100])frameButtons.push(button('Frame '+value+'%',()=>{try{setFrame(value/100);schedule();}catch(error){fail(error);}}));
 const check=button('Check all scenes',async()=>{
  if(sweeping)return;
  const deck=D.deck,saved=deck.current(),savedRoot=root(),savedProgress=savedRoot?Number(savedRoot.dataset.progress):0,savedRunning=savedRoot&&savedRoot.dataset.running==='true',savedHash=location.hash;
  if(!saved){fail(new Error('The deck has not mounted a scene'));return;}
  const scenes=deck.scenes();sweeping=true;check.disabled=true;frameButtons.forEach(b=>b.disabled=true);
  run={status:'running',checked:0,total:scenes.length*samples.length,sceneCount:scenes.length,frames:samples.slice(),issues:[],unmeasured:0,uncontractedText:0,scope:'Current language, font, background and viewport. Every finding is retained, including unmeasured text; findings require visual review.'};publish();
  try{
   for(let index=0;index<scenes.length;index++){
    deck.show(index,0);await settle();
    for(const progress of samples){
     try{setFrame(progress);await settle();}catch(error){fail(error,{scene:scenes[index].id,progress});}
     const result=inspect({sweep:true,expected:progress,scene:scenes[index].id});
     run.checked++;run.unmeasured+=result.unmeasured;run.uncontractedText+=result.uncontractedText.length;
     result.issues.forEach(issue=>run.issues.push({...issue,scene:result.scene,progress:result.progress}));publish();
    }
   }
   run.status='restoring';
  }catch(error){run.status='failed';fail(error);}
  finally{
   try{
    deck.show(saved.index,saved.step);await settle();
    if(Number.isFinite(savedProgress))setFrame(savedProgress);
    await settle();inspect();
    if(savedRunning){const play=root().querySelector('[data-vlk-button$="-play"]');if(play)play.dispatchEvent(new MouseEvent('click',{bubbles:true}));}
    if(window.history.replaceState)window.history.replaceState(null,'',location.pathname+location.search+savedHash);
   }catch(error){run.status='failed';fail(error,{stage:'restore'});}
   if(run.status!=='failed')run.status='complete';sweeping=false;check.disabled=false;frameButtons.forEach(b=>b.disabled=false);publish();
  }
 });
 const capture=button('Captured motion',()=>{
  if(!lastCapture)return;
  const existing=document.getElementById('chemistry-motion-view');if(existing)existing.remove();
  const layer=document.createElement('div');layer.id='chemistry-motion-view';layer.setAttribute('role','dialog');layer.setAttribute('aria-modal','true');layer.setAttribute('aria-label','Captured chemistry motion');layer.style.cssText='position:fixed;inset:0;background:var(--color-bg);z-index:5000';
  const capturedFrame=document.createElement('div');capturedFrame.className='slide-frame';capturedFrame.inert=true;capturedFrame.style.cssText=lastCapture.frameStyle;capturedFrame.append(lastCapture.clone.cloneNode(true));layer.append(capturedFrame);
  const close=document.createElement('button');close.type='button';close.textContent='Close captured motion';close.style.cssText='position:fixed;right:8px;top:5px';close.onclick=()=>{layer.remove();capture.focus();};layer.addEventListener('keydown',event=>{if(event.key==='Escape'){event.stopPropagation();close.click();}});layer.append(close);document.body.append(layer);close.focus();
 });capture.hidden=true;toolbar.append(status);document.body.append(toolbar);
 observer.observe(frame,observation);publish();
 Promise.resolve(document.fonts&&document.fonts.ready).then(()=>{fontsReady=true;schedule();});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
