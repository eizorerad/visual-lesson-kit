/* Verify the actual configured film, including shorter/reordered author variants.
 * node qa/trna/remix.cjs [dist/lesson.html]
 * Requires Playwright and a supported installed browser; see guide/trna-journey.md. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url'),pw=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'../..'),entry=path.resolve(root,process.argv[2]||'dist/lesson.html');
const output=path.join(root,'qa-output/trna-remix');fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await require('./browser.cjs').launch(pw),page=await browser.newPage({viewport:{width:1440,height:900}});
 const report={entry,browser:browser.version(),errors:[],external:[],frames:[],ok:false};
 page.on('pageerror',e=>report.errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))report.external.push(r.url());});
 try{
  await page.goto(pathToFileURL(entry).href);await page.waitForFunction(()=>window.TrnaJourney?.snapshot&&window.TRNA_FILM);
  const meta=await page.evaluate(async()=>{await document.fonts.ready;window.__remixNodes=TrnaJourney.actor.nodes.slice();return {duration:TrnaJourney.duration,keys:TrnaJourney.cues.map(c=>c.key),cues:TrnaJourney.cues.map(c=>({key:c.key,time:c.time,arrive:c.arrive,motion:c.motion,hold:c.hold}))};});
  Object.assign(report,meta);
  assert.equal(new Set(meta.keys).size,meta.keys.length,'Cue keys must remain unique');
  for(const [lang,background,font] of [['ru','black','sans'],['en','black','sans'],['ru','white','serif'],['en','white','serif']]){
   await page.evaluate(([lang,background,font])=>{D.i18n.setLang(lang);D.appearance.set({background,font,palette:'ocean'});},[lang,background,font]);
   for(const cue of meta.cues){
    const times=cue.motion?[cue.arrive+cue.motion*.5,cue.time]:[cue.time];
    for(const time of times){
     const result=await page.evaluate(async ({time,lang})=>{
      TRNA_FILM.seek(time);const snap=TrnaJourney.snapshot,cue=TrnaJourney.cues[snap.cue],audit=await L.ready(D.deck.root());
      const suffix=lang==='ru'?'Ru':'En',phase=snap.captionPhase;
      return {time,key:cue.key,phase,opacity:snap.captionOpacity,
       title:document.querySelector('.film-title').textContent,expectedTitle:cue['title'+suffix],
       caption:document.querySelector('.film-caption').textContent,
       expectedCaption:cue[(phase==='approach'?'approach':'caption')+suffix],
       stable:TrnaJourney.actor.nodes.length===76&&TrnaJourney.actor.nodes.every((n,i)=>n===__remixNodes[i]),
       issues:audit.issues,uncontracted:audit.uncontractedText,
       finite:Object.values(snap.values).every(Number.isFinite)};
     },{time,lang});
     report.frames.push({...result,lang,background,font});
     assert.equal(result.title,result.expectedTitle,`${cue.key} ${lang} title`);
     assert.equal(result.caption,result.expectedCaption,`${cue.key} ${lang} ${result.phase} caption`);
     assert(result.stable&&result.finite,'Persistent source actors and finite state');
     assert.deepEqual(result.issues,[],`${cue.key} text bounds`);assert.deepEqual(result.uncontracted,[],`${cue.key} text contracts`);
     if(time===cue.time&&['sequence','spatial','pair-contacts','elbow-pair','mg-bridge','summary','finale'].includes(cue.key))
      await page.screenshot({path:path.join(output,`${lang}-${background}-${cue.key}.png`)});
    }
   }
  }
  await page.evaluate(t=>TRNA_FILM.seek(t),meta.duration);
  assert.equal(await page.evaluate(()=>TRNA_FILM.current().time),meta.duration);
  assert.deepEqual(report.errors,[]);assert.deepEqual(report.external,[]);report.ok=true;
 }finally{
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));await browser.close();
 }
 console.log(JSON.stringify({ok:report.ok,duration:report.duration,cues:report.keys.length,frames:report.frames.length,errors:report.errors,external:report.external}));
})().catch(e=>{console.error(e);process.exitCode=1;});
