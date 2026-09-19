#!/usr/bin/env node
'use strict';
// Inspect independently assembled actors, not the full-film controller.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),crypto=require('node:crypto'),pw=require('playwright');
const root=path.resolve(__dirname,'../..'),artifact=path.resolve(process.argv[2]||path.join(root,'dist/lesson.html')),out=path.resolve(process.argv[3]||path.join(root,'qa-output/atac/components'));
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await require('../trna/browser.cjs').launch(pw),page=await browser.newPage({viewport:{width:1440,height:900}});
 const report={artifactSha256:crypto.createHash('sha256').update(fs.readFileSync(artifact)).digest('hex'),frames:[],disposals:[],failures:[],errors:[],external:[]};
 page.on('pageerror',e=>report.errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))report.external.push(r.url());});
 try{
  await page.goto(pathToFileURL(artifact).href+'?lang=ru&qa=1');await page.waitForFunction(()=>window.AtacComponentExamples?.active);
  const specs=await page.evaluate(()=>{
   if(window.ATAC_FILM||window.CINEMA)throw Error('Independent components must not load full-film controller');
   window.originalComponentsData=JSON.stringify([AtacStructures,AtacHistoneCoreData,AtacData]);
   return AtacComponentExamples.catalog.map(s=>({id:s.id,states:s.states.map(s=>s.pose)}));
  });assert.equal(specs.length,4);assert.equal(specs.reduce((n,s)=>n+s.states.length,0),16);
  const modes=['ru','en'].flatMap(lang=>['sans','serif'].flatMap(font=>['black','white'].map(background=>({lang,font,background}))));
  for(const mode of modes){
   await page.evaluate(m=>{D.i18n.setLang(m.lang);D.appearance.set({font:m.font,background:m.background,palette:'ocean'});},mode);
   for(let i=0;i<specs.length;i++){
    const disposal=await page.evaluate(i=>{const previous=AtacComponentExamples.active?.actor.g;D.deck.show(i,0);return previous&&previous!==AtacComponentExamples.active?.actor.g?{detached:!previous.isConnected,contracts:L.audit(previous,{visibleOnly:false}).contracted}:null;},i);if(disposal){report.disposals.push(disposal);assert(disposal.detached&&disposal.contracts===0,'Scene must release the previous actor and its text registrations');}await page.waitForFunction(id=>AtacComponentExamples.active?.id===id,specs[i].id);
    await page.evaluate(()=>{const a=AtacComponentExamples.active.actor;window.componentNodes=[a.g,...a.g.querySelectorAll('g,path,line,circle,ellipse,rect')];if(componentNodes.length<20)throw Error('Geometry audit selection is empty');});
    const frames=specs[i].states.map((pose,k)=>({pose,k,endpoint:true}));
    if(mode.lang==='ru'&&mode.font==='sans'&&mode.background==='black')for(let k=1;k<specs[i].states.length;k++)for(const u of [.25,.5,.75])frames.push({k,endpoint:false,pose:Object.fromEntries(Object.keys(specs[i].states[k]).map(key=>[key,specs[i].states[k-1][key]+(specs[i].states[k][key]-specs[i].states[k-1][key])*u]))});
    for(const f of frames){
     const result=await page.evaluate(async f=>{
      const a=AtacComponentExamples.active;a.select(f.k);Object.assign(a.state,f.pose);a.paint();
      const audit=await L.ready(D.deck.root()),alpha=node=>{let a=1;while(node?.nodeType===1){const s=getComputedStyle(node);if(s.display==='none'||s.visibility==='hidden')return 0;a*=Number(s.opacity);node=node.parentElement;}return a;};
      const texts=[...D.deck.root().querySelectorAll('[data-layout-id],.film-title,.film-caption')].filter(n=>n.textContent.trim()&&alpha(n)>.8),overlaps=[];
      for(let i=0;i<texts.length;i++)for(let j=i+1;j<texts.length;j++){if(texts[i].contains(texts[j])||texts[j].contains(texts[i]))continue;const a=texts[i].getBoundingClientRect(),b=texts[j].getBoundingClientRect();if(Math.min(a.right,b.right)-Math.max(a.left,b.left)>2&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>2)overlaps.push([texts[i].textContent,texts[j].textContent]);}
      const nodes=[a.actor.g,...a.actor.g.querySelectorAll('g,path,line,circle,ellipse,rect')];
      return {issues:audit.issues,overlaps,persistent:nodes.length===componentNodes.length&&componentNodes.every(n=>nodes.includes(n)),immutable:originalComponentsData===JSON.stringify([AtacStructures,AtacHistoneCoreData,AtacData]),invalid:nodes.some(n=>[...n.attributes].some(a=>/NaN|Infinity/.test(a.value))),title:document.querySelector('.film-title').textContent,expectedTitle:AtacComponentExamples.catalog.find(s=>s.id===a.id).states[f.k][D.i18n.lang()==='en'?'titleEn':'titleRu']};
     },f);
     const row={mode,scene:specs[i].id,state:f.k,endpoint:f.endpoint,...result};report.frames.push(row);
     if(result.issues.length||result.overlaps.length||!result.persistent||!result.immutable||result.invalid||result.title!==result.expectedTitle)report.failures.push(row);
     if(f.endpoint&&((mode.lang==='ru'&&mode.font==='sans'&&mode.background==='black')||(mode.lang==='en'&&mode.font==='serif'&&mode.background==='white')))await page.screenshot({path:path.join(out,`${mode.lang}-${mode.font}-${mode.background}-${i}-${f.k}.png`)});
    }
   }
   console.log(JSON.stringify({mode,frames:report.frames.length,failures:report.failures.length}));
  }
  // Compare retained geometry before and after real backward/forward input.
  await page.evaluate(()=>D.deck.show(0,0));await page.waitForFunction(()=>AtacComponentExamples.active?.id==='atac-source-views');
  const replay=await page.evaluate(()=>{const a=AtacComponentExamples.active,geometry=()=>JSON.stringify([...a.actor.g.querySelectorAll('path')].map(n=>n.getAttribute('d')));a.select(1);const first=geometry();a.select(0);a.select(1);return first===geometry();});assert(replay,'Reverse seek must reproduce source drawing');
 }catch(e){report.failures.push({exception:e.stack});}
 finally{await browser.close();}
 report.ok=!report.failures.length&&!report.errors.length&&!report.external.length;fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({ok:report.ok,frames:report.frames.length,failures:report.failures.slice(0,8),errors:report.errors,external:report.external},null,2));if(!report.ok)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
