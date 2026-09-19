#!/usr/bin/env node
'use strict';
/* Smoke audit for an authored route plus adversarial omissions/reordering.
 * This verifies renderer contracts, not the scientific narrative of arbitrary
 * replacement copy. Inspect that copy and actual motion before publication. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),pw=require('playwright');
const root=path.resolve(__dirname,'../..'),artifact=path.resolve(process.argv[2]||path.join(root,'dist/lesson.html')),output=path.resolve(process.argv[3]||path.join(root,'qa-output/atac/remix'));fs.mkdirSync(output,{recursive:true});
(async()=>{
 const report={artifactSha256:crypto.createHash('sha256').update(fs.readFileSync(artifact)).digest('hex'),scope:'Active route smoke check and injected remix regressions; not a scientific or visual endorsement of arbitrary author copy',checks:[],frames:[],errors:[]};
 const check=(name,fn)=>{try{fn();report.checks.push({name,pass:true});}catch(e){report.checks.push({name,pass:false,error:e.message});}};
 const browser=await require('../trna/browser.cjs').launch(pw);
 const cases=[{name:'authored-route'},
  {name:'histogram-first',config:{route:['lengths','tn5-real','nucleosome-real','paired-reads','question'],overrides:{'lengths':{hold:1,text:{ru:{title:'Распределение длин'},en:{title:'Length distribution'}}},'tn5-real':{motion:4,hold:1}}}},
  {name:'omit-origin-and-camera-source',config:{route:['peaks','lengths','tn5-end-dna','nucleosome-real','stagger','contour-length','question'],overrides:{'lengths':{motion:4,hold:1}}}}
 ];
 try{
  for(const scenario of cases){
   const page=await browser.newPage({viewport:{width:1440,height:900}});page.on('pageerror',error=>report.errors.push({scenario:scenario.name,error:error.message}));
   if(scenario.config)await page.addInitScript(config=>Object.defineProperty(window,'ATAC_FILM_CONFIG',{configurable:false,get:()=>config,set:()=>{}}),scenario.config);
   await page.goto(pathToFileURL(artifact).href+'?lang=ru&qa=remix');await page.waitForFunction(()=>window.CINEMA&&window.ATAC_FILM?.snapshot);await page.evaluate(()=>CINEMA.pause());
   const setup=await page.evaluate(()=>{
    window.remixActorNodes=()=>Object.values(ATAC_FILM.actors).flatMap(a=>[a.g,...a.g.querySelectorAll('g,path,line,circle,ellipse,rect')]);
    window.remixNodes=remixActorNodes();window.remixNodeSet=new Set(remixNodes);
    window.remixIdentity=()=>{const current=remixActorNodes();return {nodeCount:current.length,persistent:remixNodes.length>100&&current.length===remixNodes.length&&current.every(n=>n.isConnected&&remixNodeSet.has(n))&&remixNodes.every(n=>n.isConnected)};};
    const actorCounts=Object.fromEntries(Object.entries(ATAC_FILM.actors).map(([key,a])=>[key,1+a.g.querySelectorAll('g,path,line,circle,ellipse,rect').length]));
    const testRoot=ATAC_FILM.actors.chromatin.g,addition=document.createElementNS('http://www.w3.org/2000/svg','circle');testRoot.append(addition);const detectsAddition=!remixIdentity().persistent;addition.remove();
    const original=testRoot.querySelector('path'),replacement=original.cloneNode(true);original.replaceWith(replacement);const detectsReplacement=!remixIdentity().persistent;replacement.replaceWith(original);
    window.remixSources=JSON.stringify([AtacStructures,AtacHistoneCoreData,AtacData]);
    return {catalog:ATAC_FILM.catalog.length,actorCounts,nodeCount:remixNodes.length,detectsAddition,detectsReplacement,cues:ATAC_FILM.cues.map(c=>({key:c.key,time:c.time,arrive:c.arrive,motion:c.motion,target:c.target,titleRu:c.titleRu,titleEn:c.titleEn}))};
   });
   check(scenario.name+': full public catalog and selected route',()=>{assert.equal(setup.catalog,46);if(scenario.config)assert.deepEqual(setup.cues.map(c=>c.key),scenario.config.route);});
   check(scenario.name+': persistence inspects all six actual actors',()=>{assert.equal(Object.keys(setup.actorCounts).length,6);assert(Object.values(setup.actorCounts).every(n=>n>5));assert(setup.nodeCount>100);assert.equal(setup.nodeCount,Object.values(setup.actorCounts).reduce((a,b)=>a+b,0));});
   check(scenario.name+': persistence detects added and replaced geometry',()=>{assert(setup.detectsAddition);assert(setup.detectsReplacement);});
   async function frame(time,layout=false){return page.evaluate(async ({time,layout})=>{
    CINEMA.seek(time);const snap=ATAC_FILM.snapshot,svg=ATAC_FILM.actors.chromatin.g.ownerSVGElement;
    const opacityCache=new WeakMap(),alpha=node=>{if(node?.nodeType!==1)return 1;if(opacityCache.has(node))return opacityCache.get(node);const s=getComputedStyle(node),a=s.display==='none'||s.visibility==='hidden'?0:+s.opacity*alpha(node.parentElement);opacityCache.set(node,a);return a;};
    const nodes=[...svg.querySelectorAll('[d],[transform]')],allGeometry=nodes.map(n=>[n.getAttribute('d'),n.getAttribute('transform')]);
    // Hidden actors may cache their last rendering; pure-time identity is a
    // contract for the visible result, not invisible implementation caches.
    const geometry=nodes.filter(n=>alpha(n)>.001).map(n=>[n.getAttribute('d'),n.getAttribute('transform'),alpha(n)]);
    return {time,key:snap.key,values:snap.values,camera:snap.cameraStory?.kind||null,zoomBridge:!!snap.zoomBridge,signalStage:snap.signal.stage,originAlpha:alpha(ATAC_FILM.actors.origin.g),chromatinAlpha:alpha(ATAC_FILM.actors.chromatin.g),signalAlpha:alpha(ATAC_FILM.actors.signals.g),source:snap.structure.source,
     immutable:window.remixSources===JSON.stringify([AtacStructures,AtacHistoneCoreData,AtacData]),...remixIdentity(),invalid:allGeometry.some(row=>row.some(v=>/NaN|Infinity/.test(v||''))),geometry:JSON.stringify(geometry),title:document.querySelector('.film-title').textContent,layoutIssues:layout?(await L.ready(D.deck.root())).issues:[]};
   },{time,layout});}
   for(const cue of setup.cues){
    const row=await frame(cue.time,true);report.frames.push({scenario:scenario.name,...row,geometry:undefined});
    check(scenario.name+': complete endpoint '+cue.key,()=>{assert.deepEqual(row.values,cue.target);assert(row.immutable);assert(row.persistent);assert(!row.invalid);assert.equal(row.layoutIssues.length,0);assert.equal(row.title,cue.titleRu);});
   }
   if(scenario.config){
    const times=setup.cues.slice(1).flatMap(c=>[.05,.25,.5,.75,.95].map(u=>c.arrive+c.motion*u)),forward=[];
    for(const time of times){
     const row=await frame(time);forward.push(row);report.frames.push({scenario:scenario.name,...row,geometry:undefined});
     check(scenario.name+': no fabricated context at '+time.toFixed(4),()=>{
      assert(row.immutable&&row.persistent&&!row.invalid);assert.equal(row.camera,null);assert(!row.zoomBridge);
      if(row.key==='lengths'){
       assert.equal(row.originAlpha,0);
       const previous=setup.cues[setup.cues.findIndex(c=>c.key===row.key)-1];
       // A plot that was visibly on screen may fade out. A hidden stale plot
       // from an omitted scene may never become visible during the entry.
       const allowed=previous?.target.signal>0?[previous.target.signalStage,11]:[11];
       if(row.signalAlpha>.01)assert(allowed.includes(row.signalStage),'only the visible predecessor plot or the destination histogram may appear');
      }
      if(row.key==='nucleosome-real'||row.key==='tn5-real')assert.equal(row.chromatinAlpha,0);
     });
    }
    for(let i=times.length-1;i>=0;i--){const row=await frame(times[i]);check(scenario.name+': reverse seek '+times[i].toFixed(4),()=>{assert(row.persistent);assert.equal(row.nodeCount,setup.nodeCount);assert.equal(row.geometry,forward[i].geometry);assert.deepEqual(row.values,forward[i].values);});}
    await page.evaluate(()=>D.i18n.setLang('en'));const last=setup.cues.at(-1),en=await frame(last.time,true);
    check(scenario.name+': language preserves state and layout',()=>{assert.equal(en.title,last.titleEn);assert.deepEqual(en.values,last.target);assert.equal(en.layoutIssues.length,0);});
    await frame(0);await page.screenshot({path:path.join(output,scenario.name+'.png')});
   }
   await page.close();
  }
  check('No browser exceptions',()=>assert.deepEqual(report.errors,[]));
 }catch(error){report.checks.push({name:'Browser audit completed',pass:false,error:error.stack});}
 finally{await browser.close();}
 report.ok=report.checks.every(c=>c.pass);fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({ok:report.ok,checks:report.checks.length,frames:report.frames.length,failures:report.checks.filter(c=>!c.pass),errors:report.errors},null,2));if(!report.ok)process.exitCode=1;
})();
