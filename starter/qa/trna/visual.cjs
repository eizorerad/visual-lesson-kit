'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
let pw;try{pw=require('playwright');}catch{pw=require(process.env.PLAYWRIGHT_MODULE);}
const root=path.resolve(__dirname,'../..'),out=path.join(root,'qa-output/trna-film');fs.mkdirSync(path.join(out,'screenshots'),{recursive:true});
(async()=>{
 const browser=await require('./browser.cjs').launch(pw);
 const page=await browser.newPage({viewport:{width:1440,height:900}}),report={browser:browser.version(),errors:[],external:[],frames:[],failures:[]};
 page.on('pageerror',e=>report.errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))report.external.push(r.url());});
 try{
  await page.goto(pathToFileURL(path.join(root,'dist/lesson.html')).href);await page.waitForFunction(()=>window.TRNA_FILM&&window.TrnaJourney?.snapshot);
  await page.evaluate(()=>{window.originalTrnaNodes=TrnaJourney.actor.nodes.slice();});
  const focusTime=await page.evaluate(()=>TrnaJourney.cues.find(c=>c.target.focus===1).time);
  await page.evaluate(time=>{D.i18n.setLang('en');TRNA_FILM.seek(time);D.i18n.setLang('ru');},focusTime);
  assert.equal(await page.locator('.film-title').innerText(),'G3 и C70 — партнёры одной пары','paused language change must restore the main title');
  assert.equal(await page.evaluate(()=>TRNA_FILM.current().time),focusTime);
  const cues=await page.evaluate(()=>TrnaJourney.cues.map(c=>c.time));
  const modes=process.argv.includes('--quick')?[['ru','sans','black']]:['ru','en'].flatMap(l=>['sans','serif'].flatMap(f=>['black','white'].map(b=>[l,f,b])));
  for(const [lang,font,background]of modes){
   await page.evaluate(([l,f,b])=>{D.i18n.setLang(l);D.appearance.set({font:f,background:b,palette:'ocean'});},[lang,font,background]);
   const times=[...cues];if((lang==='ru'&&font==='sans'&&background==='black')||(lang==='en'&&font==='serif'&&background==='white')){
    for(let i=1;i<cues.length;i++)for(const t of [.45,.65,.85])times.push(cues[i-1]+t*(cues[i]-cues[i-1]));
   }
   times.sort((a,b)=>a-b);
   for(const time of times){
    const r=await page.evaluate(async t=>{TRNA_FILM.seek(t);const audit=await L.ready(D.deck.root());
     return{time:t,cue:TrnaJourney.snapshot.cue,contracted:audit.contracted,checked:audit.checked,issues:audit.issues,uncontracted:audit.uncontractedText,
      stable:TrnaJourney.actor.nodes.every((n,i)=>n===originalTrnaNodes[i]),count:TrnaJourney.actor.nodes.length,
      title:document.querySelector('.film-title').textContent};},time);
    r.mode=[lang,font,background];report.frames.push(r);
    if(r.issues.length||r.uncontracted.length||!r.stable||r.count!==76)report.failures.push(r);
    if(cues.includes(time)&&((lang==='ru'&&font==='sans'&&background==='black')||(lang==='en'&&font==='serif'&&background==='white')))
     await page.screenshot({path:path.join(out,'screenshots',`${lang}-${font}-${background}-${String(time).padStart(3,'0')}.png`)});
   }
  }
  report.notes=await page.evaluate(()=>({scenes:D.deck.scenes(),cues:TrnaJourney.cues.length,duration:TrnaJourney.duration,atoms:document.querySelectorAll('[data-connected-atom]').length}));
  report.ok=!report.failures.length&&!report.errors.length&&!report.external.length;
  fs.writeFileSync(path.join(out,'visual-report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({ok:report.ok,frames:report.frames.length,failures:report.failures.slice(0,8),errors:report.errors,external:report.external,notes:report.notes},null,2));
  if(!report.ok)process.exitCode=1;
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
