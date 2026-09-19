'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),pw=require('playwright');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'qa-output/atac');fs.mkdirSync(path.join(out,'screenshots'),{recursive:true});
(async()=>{
 const browser=await require('../trna/browser.cjs').launch(pw),page=await browser.newPage({viewport:{width:1440,height:900}});
 const report={artifactSha256:require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(root,'dist/lesson.html'))).digest('hex'),errors:[],external:[],failures:[],frames:[]};page.on('pageerror',e=>report.errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))report.external.push(r.url());});
 try{
  await page.goto(pathToFileURL(path.join(root,'dist/lesson.html')).href+'?qa=1');await page.waitForFunction(()=>window.ATAC_FILM?.snapshot&&window.CINEMA);
  await require('./lib.cjs').assertDefaultRoute(page);
  await page.evaluate(()=>{CINEMA.pause();window.auditActorNodes=Object.values(ATAC_FILM.actors).map(a=>[...a.g.querySelectorAll('g,path,line,circle,ellipse,rect')]);});
  assert.equal(await page.evaluate(()=>typeof RNA_STRUCTURES),'undefined');
  const cues=await page.evaluate(()=>ATAC_FILM.cues.map(c=>({key:c.key,time:c.time,arrive:c.arrive,motion:c.motion})));
  const modes=process.argv.includes('--quick')?[['ru','sans','black']]:['ru','en'].flatMap(l=>['sans','serif'].flatMap(f=>['black','white'].map(b=>[l,f,b])));
  for(const [lang,font,background]of modes){
   await page.evaluate(([lang,font,background])=>{D.i18n.setLang(lang);D.appearance.set({font,background,palette:'ocean'});},[lang,font,background]);
   const frames=cues.map(c=>({key:c.key,time:c.time,settled:true}));if(lang==='ru'&&font==='sans'&&background==='black')for(const c of cues.slice(1))for(const u of [.25,.5,.75])frames.push({key:c.key,time:c.arrive+c.motion*u,settled:false});frames.sort((a,b)=>a.time-b.time);
   for(const frame of frames){
    const r=await page.evaluate(async f=>{
     CINEMA.seek(f.time);const audit=await L.ready(D.deck.root()),alpha=el=>{let a=1;while(el?.nodeType===1){const s=getComputedStyle(el);if(s.display==='none'||s.visibility==='hidden')return 0;a*=+s.opacity;el=el.parentElement;}return a;};
     const texts=[...D.deck.root().querySelectorAll('[data-layout-id],.film-title,.film-caption')].filter(el=>alpha(el)>.8&&el.textContent.trim());const overlaps=[];
     for(let i=0;i<texts.length;i++)for(let j=i+1;j<texts.length;j++){
      if(texts[i].contains(texts[j])||texts[j].contains(texts[i]))continue;
      const a=texts[i].getBoundingClientRect(),b=texts[j].getBoundingClientRect();if(Math.min(a.right,b.right)-Math.max(a.left,b.left)>2&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>2)overlaps.push([texts[i].textContent,texts[j].textContent]);
     }
     const invalid=[...D.deck.root().querySelectorAll('svg *')].filter(el=>['x','y','cx','cy','r','x1','x2','y1','y2','d','points','transform'].some(k=>/NaN|Infinity/.test(el.getAttribute(k)||''))).length;
     const stable=Object.values(ATAC_FILM.actors).every((a,i)=>{const now=[...a.g.querySelectorAll('g,path,line,circle,ellipse,rect')];return now.length===auditActorNodes[i].length&&auditActorNodes[i].every(n=>now.includes(n));});
     return{key:ATAC_FILM.snapshot.key,time:f.time,issues:audit.issues,uncontracted:audit.uncontractedText,unmeasured:audit.unmeasured,overlaps,invalid,stable,title:document.querySelector('.film-title').textContent};
    },frame);
    r.mode=[lang,font,background];r.settled=frame.settled;report.frames.push(r);
    if(r.issues.length||r.overlaps.length||r.invalid||!r.stable)report.failures.push(r);
    if(frame.settled&&((lang==='ru'&&font==='sans'&&background==='black')||(lang==='en'&&font==='serif'&&background==='white')))await page.screenshot({path:path.join(out,'screenshots',`${lang}-${font}-${background}-${frame.key}.png`)});
   }
   console.log(JSON.stringify({mode:[lang,font,background],frames:frames.length,failures:report.failures.length}));
  }
  await page.evaluate(()=>{CINEMA.seek(0);CINEMA.play();});await page.waitForTimeout(300);const t=await page.evaluate(()=>{CINEMA.pause();return CINEMA.current().time;});assert(t>0);await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>CINEMA.current().time),t);
  await page.evaluate(()=>CINEMA.seek(ATAC_FILM.cues[15].time));const kept=await page.evaluate(()=>CINEMA.current().time);await page.evaluate(()=>D.i18n.setLang(D.i18n.lang()==='ru'?'en':'ru'));assert.equal(await page.evaluate(()=>CINEMA.current().time),kept);
  await page.evaluate(()=>CINEMA.seek(ATAC_FILM.duration));assert.equal(await page.evaluate(()=>ATAC_FILM.snapshot.key),'finale');
  report.ok=!report.errors.length&&!report.external.length&&!report.failures.length;report.duration=await page.evaluate(()=>ATAC_FILM.duration);report.cues=cues.length;
  fs.writeFileSync(path.join(out,'visual-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({ok:report.ok,cues:report.cues,duration:report.duration,frames:report.frames.length,errors:report.errors,external:report.external,failures:report.failures.slice(0,12)},null,2));if(!report.ok)process.exitCode=1;
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
