/* Browser integration of the deposited Mg site with the continuous tRNA film.
 * NODE_PATH=<runtime node_modules> node qa/trna/magnesium-integration.cjs [dist/lesson.html|index.html]
 * Optional PLAYWRIGHT_MODULE / PLAYWRIGHT_CHANNEL select an existing runtime.
 * This checks depiction and lifecycle, not new molecular measurements. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {pathToFileURL}=require('node:url'),pw=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {launch}=require('./browser.cjs');
const root=path.resolve(__dirname,'../..'),entry=path.resolve(root,process.argv[2]||'dist/lesson.html');
const output=path.join(root,'qa-output/trna-magnesium-integration',path.basename(path.dirname(entry))==='dist'?'dist':'source');
const digest=value=>crypto.createHash('sha256').update(value).digest('hex');

(async()=>{
 const browser=await launch(pw);
 const report={ok:false,entry,entrySHA256:digest(fs.readFileSync(entry)),browser:browser.version(),viewport:[1280,720],
  denseIncrementSeconds:.5,errors:[],failures:[],limitations:[
   'Verifies source-preserving projection, drawn sphere centers, camera frames, contact guides and lifecycle in desktop Chromium.',
   'Does not infer hydrogen orientations, physical trajectories, ionic forces, concentrations or new structural measurements.',
   'Text layout, complete-film controls, additional themes/fonts and physical touch gestures are covered separately or not tested here.'
  ]};
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
  page.on('pageerror',error=>report.errors.push(error.message));
  // Observe the actual buffers passed to the renderer. The scene, coordinates,
  // camera code and renderer implementation remain unchanged by this wrapper.
  await page.addInitScript(()=>{
   window.__magnesiumIntegration={renderers:[]};let api;
   Object.defineProperty(window,'TrnaSphereRenderer',{configurable:true,get:()=>api,set(value){
    api=Object.freeze({...value,create(...args){
     const renderer=value.create(...args),host=args[0];
     if(host.closest('[data-trna-magnesium]')){
      const observed={host,renderer,spheres:[],draws:0},draw=renderer.draw;
      renderer.draw=function(spheres){
       observed.spheres=spheres.map(a=>({id:a.atom.id,center:a.center.slice(),radius:a.radius}));
       observed.draws++;return draw.call(renderer,spheres);
      };
      __magnesiumIntegration.renderers.push(observed);
     }
     return renderer;
    }});
   }});
  });
  await page.goto(pathToFileURL(entry).href);
  await page.waitForFunction(()=>window.TRNA_FILM&&window.TRNA_MAGNESIUM_DATA&&window.TrnaJourney?.snapshot);
  const sourceBefore=await page.evaluate(async()=>{
   TRNA_FILM.pause();await document.fonts.ready;
   if(__magnesiumIntegration.renderers.length!==1)throw new Error('Expected one persistent Mg renderer');
   const qa=__magnesiumIntegration;qa.root=document.querySelector('[data-trna-magnesium]');
   qa.nodes=[...qa.root.querySelectorAll('*')];qa.rnaNodes=TrnaJourney.actor.nodes.slice();
   qa.snapshot=()=>{
    const observed=qa.renderers[0],canvas=observed.renderer.canvas,gl=canvas.getContext('webgl2');
    let pixels;
    if(gl){pixels=new Uint8Array(canvas.width*canvas.height*4);gl.readPixels(0,0,canvas.width,canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);}
    else pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
    let hash=2166136261,opaquePixels=0;
    for(let i=0;i<pixels.length;i++){hash=Math.imul(hash^pixels[i],16777619);if(i%4===3&&pixels[i])opaquePixels++;}
    return {time:TRNA_FILM.current().time,playing:TRNA_FILM.current().playing,
     snapshot:JSON.stringify(TrnaJourney.snapshot),markup:qa.root.outerHTML,spheres:JSON.stringify(observed.spheres),
     rendererFrames:observed.renderer.frames,drawCalls:observed.draws,pixelHash:hash>>>0,opaquePixels};
   };
   return {magnesium:JSON.stringify(TRNA_MAGNESIUM_DATA),rna:JSON.stringify(TRNA_DATA),duration:TRNA_FILM.duration,
    cues:TrnaJourney.cues.map(({key,time,arrive,hold,motion})=>({key,time,arrive,hold,motion})),
    backend:qa.renderers[0].renderer.type,mgDOMNodes:qa.nodes.length,rnaDOMActors:qa.rnaNodes.length};
  });
  // Both sides use JavaScript JSON normalization, including equivalent -0/0.
  assert.equal(sourceBefore.magnesium,JSON.stringify(JSON.parse(fs.readFileSync(path.join(root,'assets/trna/magnesium-1ehz.json'),'utf8'))));
  assert.equal(sourceBefore.rna,JSON.stringify(JSON.parse(fs.readFileSync(path.join(root,'assets/trna/trna-data.json'),'utf8'))));
  report.backend=sourceBefore.backend;report.durationSeconds=sourceBefore.duration;
  report.sourceHashes={magnesiumBefore:digest(sourceBefore.magnesium),rnaBefore:digest(sourceBefore.rna)};
  report.persistentActors={magnesiumDOMNodes:sourceBefore.mgDOMNodes,rnaDOMActors:sourceBefore.rnaDOMActors};
  const byKey=new Map(sourceBefore.cues.map(c=>[c.key,c]));
  const cue=key=>{const found=byKey.get(key);assert(found,'Missing semantic cue '+key);return found;};
  const start=cue('elbow-result').time,end=cue('summary').time,water=cue('mg-water'),bridge=cue('mg-bridge'),returned=cue('mg-return');
  const magnesiumCues=['mg-charge','mg-atmosphere','mg-select','mg-water','mg-bridge','mg-return'].map(cue);
  magnesiumCues.forEach(c=>assert(c.motion>0&&c.arrive<c.time&&c.hold>0,'Mg timing metadata must describe motion and a reading hold'));
  report.denseIntervalSeconds=[start,end];report.semanticCues=magnesiumCues;
  const times=[...new Set([
   ...Array.from({length:Math.floor((end-start)/.5)+1},(_,i)=>start+i*.5),end,
   ...magnesiumCues.flatMap(c=>[c.arrive,c.arrive+c.motion*.25,c.arrive+c.motion*.5,c.arrive+c.motion*.75,c.time])
  ])].sort((a,b)=>a-b);
  report.samples=[];
  for(const time of times){
   const sample=await page.evaluate(time=>{
    const qa=__magnesiumIntegration,check=(ok,message)=>{if(!ok)throw new Error(time+' s: '+message);};
    const near=(a,b,message)=>check(Number.isFinite(a)&&Math.abs(a-b)<1e-7,message+' ('+a+' vs '+b+')');
    TRNA_FILM.seek(time);const snapshot=TrnaJourney.snapshot,s=snapshot.values,camera=snapshot.camera;
    const dot=(a,b)=>a.reduce((sum,v,i)=>sum+v*b[i],0),[a,b,c]=camera.basis;
    let basisError=0;
    for(let i=0;i<3;i++)for(let j=0;j<3;j++)basisError=Math.max(basisError,Math.abs(dot(camera.basis[i],camera.basis[j])-(i===j?1:0)));
    const determinant=a[0]*(b[1]*c[2]-b[2]*c[1])-a[1]*(b[0]*c[2]-b[2]*c[0])+a[2]*(b[0]*c[1]-b[1]*c[0]);
    check(basisError<1e-10&&Math.abs(determinant-1)<1e-10,'camera must stay orthonormal and right-handed');
    check(camera.scale>0&&Number.isFinite(camera.scale),'camera scale must remain finite and positive');
    check(snapshot.values.model===1,'Expected the same fully projected tRNA source model throughout this interval');
    TRNA_DATA.residues.forEach((r,i)=>TrnaAtoms.project(r.xyz,camera).forEach((v,k)=>near(snapshot.points[i][k],v,'RNA source projection '+r.id)));
    const nodes=[...qa.root.querySelectorAll('*')];check(nodes.length===qa.nodes.length&&nodes.every(n=>qa.nodes.includes(n)),'Mg actor nodes were replaced');
    check(TrnaJourney.actor.nodes.every((n,i)=>n===qa.rnaNodes[i]),'RNA actor nodes were replaced');
    const active=Math.max(...['mgCharge','mgAtmosphere','mgSelect','mgZoom','mgWater','mgBridge'].map(k=>s[k]));
    const records=[TRNA_MAGNESIUM_DATA.magnesium,...TRNA_MAGNESIUM_DATA.waters,...TRNA_MAGNESIUM_DATA.phosphateGroups.flatMap(g=>g.atoms)];
    const lookup=new Map(records.map(atom=>[atom.id,atom])),observed=qa.renderers[0];let sourceCenters=0,endpointChecks=0,boundsChecks=0;
    check(lookup.size===28,'Expected all 28 distinct deposited close-up atoms');
    if(active>0){
     check(qa.root.style.display!=='none','Active Mg actor unexpectedly hidden');
     check(observed.spheres.length===28,'Renderer did not receive all 28 close-up atom records');
     for(const sphere of observed.spheres){
      const atom=lookup.get(sphere.id);check(!!atom,'Renderer received an invented atom');
      const expected=TrnaAtoms.project(atom.xyz,camera),actual=sphere.center;
      near(actual[0],expected[0],'sphere x '+atom.id);near(actual[1],expected[1],'sphere y '+atom.id);
      near(actual[2],expected[2]*camera.scale,'sphere scaled depth '+atom.id);sourceCenters++;
      const marker=qa.root.querySelector('[data-magnesium-atom="'+atom.id+'"]');
      near(+marker.getAttribute('cx'),expected[0],'metadata x');near(+marker.getAttribute('cy'),expected[1],'metadata y');
      const hydration=atom.id===1658||atom.id>=1804;
      const fullyVisible=s.mgZoom===1&&s.mgWater===1&&(hydration||s.mgBridge===1);
      if(fullyVisible){
       const [x,y]=actual,r=sphere.radius;
       check(r>0,'Fully revealed source sphere has zero radius');
       check(x-r>=340&&x+r<=930&&y-r>=208&&y+r<=590,'Fully revealed sphere crosses reserved drawing bounds: '+atom.id);boundsChecks++;
      }
     }
     for(const [kind,links] of [['coordination',TRNA_MAGNESIUM_DATA.coordinationLinks],['water-phosphate',TRNA_MAGNESIUM_DATA.waterPhosphateContacts]]){
      const guides=[...qa.root.querySelectorAll('[data-magnesium-guide="'+kind+'"]')];
      check(guides.length===(kind==='coordination'?6:3),'Incorrect '+kind+' guide count');
      for(const link of links){
       const line=guides.find(n=>n.dataset.atomIds===JSON.stringify(link.atomIds));check(!!line,'Missing source endpoint reference');
       const endpoints=JSON.parse(line.dataset.endpoints);
       link.atomIds.forEach((id,i)=>TrnaAtoms.project(lookup.get(id).xyz,camera).forEach((v,k)=>near(endpoints[i][k],v,'contact endpoint')));
       for(let i=0;i<2;i++){near(+line.getAttribute('x'+(i+1)),endpoints[i][0],'drawn guide x');near(+line.getAttribute('y'+(i+1)),endpoints[i][1],'drawn guide y');}
       check(!!line.getAttribute('stroke-dasharray'),'Noncovalent guide must remain dashed');endpointChecks+=2;
      }
     }
    }else check(qa.root.style.display==='none','Inactive Mg actor leaked into another episode');
    return {time,active,basisError,determinant,sourceCenters,rnaSourceCenters:76,endpointChecks,boundsChecks,
     mgZoom:s.mgZoom,mgWater:s.mgWater,mgBridge:s.mgBridge,mgTurn:s.mgTurn};
   },time);
   report.samples.push(sample);
  }
  report.returnToWhole=await page.evaluate(time=>{
   TRNA_FILM.seek(time);const s=TrnaJourney.snapshot.values,camera=TrnaJourney.snapshot.camera;
   const zero=Object.fromEntries(Object.keys(TrnaMagnesiumStory.baseline).map(k=>[k,0]));
   const baseline=TrnaWorld.cameraFor({...TrnaJourney.baseline,model:1,angle:15,landmarks:2});
   return {time,angle:s.angle,landmarks:s.landmarks,mgStates:Object.fromEntries(Object.keys(zero).map(k=>[k,s[k]])),zero,
    cameraEqualsWholeBaseline:JSON.stringify(camera)===JSON.stringify(baseline),
    cameraEqualsMgDisabled:JSON.stringify(camera)===JSON.stringify(TrnaWorld.cameraFor({...s,...zero})),
    hidden:__magnesiumIntegration.root.style.display==='none',
    locatorOpacity:+document.querySelector('[data-trna-locator]').lastElementChild.style.opacity};
  },returned.time);
  assert.deepEqual(report.returnToWhole.mgStates,report.returnToWhole.zero,'Every Mg state is zero at the completed return');
  assert(report.returnToWhole.cameraEqualsWholeBaseline&&report.returnToWhole.cameraEqualsMgDisabled,'mg-return restores the same whole-source camera');
  assert.equal(report.returnToWhole.angle,15);assert.equal(report.returnToWhole.landmarks,2);
  assert(report.returnToWhole.hidden,'Mg actor hidden after the return');
  assert.equal(report.returnToWhole.locatorOpacity,0,'Mg locator marker is hidden after the return');
  // The former 175 s check was inside the water-to-phosphate transition.
  // Keep the freeze inside that motion even when reading holds are retimed.
  const freezeTime=bridge.arrive+bridge.motion*.35,freezeStart=Math.max(bridge.arrive,freezeTime-1);
  const seekBefore=await page.evaluate(({from,to})=>{TRNA_FILM.seek(from);TRNA_FILM.play();TRNA_FILM.seek(to);return __magnesiumIntegration.snapshot();},{from:freezeStart,to:freezeTime});
  await page.waitForTimeout(300);
  const seekAfter=await page.evaluate(()=>__magnesiumIntegration.snapshot());
  assert.deepEqual(seekAfter,seekBefore,'Seek during playback must cancel stale updates and freeze Mg exactly inside the bridge transition');
  assert.equal(seekAfter.time,freezeTime);assert.equal(seekAfter.playing,false);assert(seekAfter.opaquePixels>500,'Freeze check must observe visible Mg pixels');
  const frozenValues=JSON.parse(seekAfter.snapshot).values;
  assert(frozenValues.mgBridge>0&&frozenValues.mgBridge<1,'Freeze check must remain inside moving bridge geometry');
  await page.evaluate(()=>{TRNA_FILM.play();});await page.waitForTimeout(240);
  const pauseBefore=await page.evaluate(()=>{TRNA_FILM.pause();return __magnesiumIntegration.snapshot();});
  await page.waitForTimeout(250);
  const pauseAfter=await page.evaluate(()=>__magnesiumIntegration.snapshot());
  assert.deepEqual(pauseAfter,pauseBefore,'Pause must freeze camera, geometry, markup, GPU pixels and renderer writes');
  report.freeze={cue:'mg-bridge',motionFraction:.35,seekSeconds:seekAfter.time,seekWaitMilliseconds:300,pauseSeconds:pauseAfter.time,pauseWaitMilliseconds:250,
   opaquePixels:seekAfter.opaquePixels,seekPixelHash:seekAfter.pixelHash,pausePixelHash:pauseAfter.pixelHash,
   exactGeometryMarkupPixelsAndDrawCounts:true};
  report.final=await page.evaluate(()=>{
   TRNA_FILM.seek(TRNA_FILM.duration);const s=TrnaJourney.snapshot.values,root=__magnesiumIntegration.root;
   const effectiveOpacity=node=>{let opacity=1;for(let n=node;n;n=n.parentElement){const style=getComputedStyle(n);if(style.display==='none'||style.visibility==='hidden')return 0;opacity*=Number(style.opacity);}return opacity;};
   const visibleMgLabels=[...document.querySelectorAll('svg text')].filter(n=>/Mg²⁺|Mg–O|O···O|U8 · C11 · U12/.test(n.textContent)&&effectiveOpacity(n)>1e-8).map(n=>n.textContent);
   return {time:TRNA_FILM.current().time,hidden:root.style.display==='none',rootOpacity:+root.style.opacity,
    mgStates:Object.fromEntries(Object.keys(TrnaMagnesiumStory.baseline).map(k=>[k,s[k]])),
    spacefill:s.spacefill,final:s.final,actorCount:document.querySelectorAll('[data-trna-magnesium]').length,
    persistent:__magnesiumIntegration.nodes.every(n=>root.contains(n)),visibleMgLabels,
    locatorOpacity:+document.querySelector('[data-trna-locator]').lastElementChild.style.opacity};
  });
  assert.equal(report.final.time,sourceBefore.duration);assert(report.final.hidden&&report.final.rootOpacity===0&&report.final.persistent);
  assert.equal(report.final.actorCount,1);assert(Object.values(report.final.mgStates).every(v=>v===0));
  assert.equal(report.final.locatorOpacity,0);assert.deepEqual(report.final.visibleMgLabels,[],'No Mg annotations leak into the final scene');
  assert.equal(report.final.spacefill,1,'Final scene still reaches the original whole-tRNA space-fill view');
  const sourceAfter=await page.evaluate(()=>({magnesium:JSON.stringify(TRNA_MAGNESIUM_DATA),rna:JSON.stringify(TRNA_DATA)}));
  report.sourceHashes.magnesiumAfter=digest(sourceAfter.magnesium);report.sourceHashes.rnaAfter=digest(sourceAfter.rna);
  assert.deepEqual(sourceAfter,{magnesium:sourceBefore.magnesium,rna:sourceBefore.rna},'Camera/seek operations must not mutate either source dataset');
  fs.mkdirSync(output,{recursive:true});
  const criticalScreenshots=[water.time+Math.min(2,water.hold/2),freezeTime,bridge.time,returned.time,sourceBefore.duration];
  for(const time of criticalScreenshots){
   await page.evaluate(time=>TRNA_FILM.seek(time),time);await page.screenshot({path:path.join(output,'frame-'+time+'.png')});
  }
  report.coverage={sampledFrames:report.samples.length,sourceSphereCenters:report.samples.reduce((n,s)=>n+s.sourceCenters,0),
   rnaSourceCenters:report.samples.reduce((n,s)=>n+s.rnaSourceCenters,0),guideEndpoints:report.samples.reduce((n,s)=>n+s.endpointChecks,0),
   fullyRevealedSphereBounds:report.samples.reduce((n,s)=>n+s.boundsChecks,0),maxBasisError:Math.max(...report.samples.map(s=>s.basisError)),
   criticalScreenshots};
  assert.deepEqual(report.errors,[],'No browser errors');report.ok=true;
 }catch(error){report.failures.push(error.message);throw error;}
 finally{
  fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
  const {samples,...summary}=report;console.log(JSON.stringify({...summary,report:path.join(output,'report.json')},null,2));await browser.close();
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
