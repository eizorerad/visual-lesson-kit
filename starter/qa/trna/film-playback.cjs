'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {pathToFileURL}=require('node:url');
let pw;try{pw=require('playwright');}catch{pw=require(process.env.PLAYWRIGHT_MODULE);}
const root=path.resolve(__dirname,'../..');
const {launch}=require('./browser.cjs');
(async()=>{
 const browser=await launch(pw);
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(pathToFileURL(path.join(root,'dist/lesson.html')).href);
  await page.waitForFunction(()=>window.TRNA_FILM&&TrnaJourney.snapshot);
  const cues=await page.evaluate(()=>{
   const all=TrnaJourney.cues,find=key=>{const cue=all.find(c=>c.key===key);if(!cue)throw new Error('Missing semantic cue '+key);return cue;};
   const fold=find('cloverleaf'),focus=find('pair'),contacts=find('pair-contacts');
   return {focusTime:focus.time,focusTitle:focus.titleRu,foldTime:fold.arrive+fold.motion*.55,
    contactsIndex:contacts.index,contactsTime:contacts.time,contactsMotionTime:contacts.arrive+contacts.motion*.6,
    duration:TRNA_FILM.duration,count:all.length,all:all.map(c=>({key:c.key,index:c.index,time:c.time,arrive:c.arrive,motion:c.motion}))};
  });
  await page.evaluate(time=>{D.i18n.setLang('en');TRNA_FILM.seek(time);D.i18n.setLang('ru');},cues.focusTime);
  assert.equal(await page.locator('.film-title').innerText(),cues.focusTitle);
  assert.equal(await page.evaluate(()=>TRNA_FILM.current().time),cues.focusTime);
  await page.evaluate(time=>{TRNA_FILM.seek(time);window.savedNodes=TrnaJourney.actor.nodes.slice();TRNA_FILM.play();},cues.foldTime);
  await page.waitForTimeout(320);
  const frozen=await page.evaluate(()=>{TRNA_FILM.pause();return JSON.stringify(TrnaJourney.snapshot);});
  await page.waitForTimeout(250);
  assert.equal(await page.evaluate(()=>JSON.stringify(TrnaJourney.snapshot)),frozen,'pause preserves exact camera and geometry');
  // Pause fidelity is tested above; inspect narrative at an exact mid-transition
  // time rather than assuming a heavily loaded browser advanced only 320 ms.
  await page.evaluate(time=>TRNA_FILM.seek(time),cues.foldTime);
  const narrative=await page.evaluate(()=>({visible:TrnaJourney.snapshot.cue,current:TRNA_FILM.current().index,step:D.deck.current().step,
   captionPhase:TrnaJourney.snapshot.captionPhase,captionOpacity:TrnaJourney.snapshot.captionOpacity,caption:document.querySelector('.film-caption').textContent,
   detailCaption:TrnaJourney.cues[TrnaJourney.snapshot.cue].captionRu,
   title:document.querySelector('.film-title').textContent,timeline:document.querySelector('.trna-cue-title').textContent,
   note:Number(document.querySelector('#notesBody .is-now .note-step').textContent)-1,hash:location.hash}));
  assert.equal(narrative.current,narrative.visible,'controller follows the visible incoming cue mid-transition');
  assert.equal(narrative.step,narrative.visible,'deck state follows the visible incoming cue');
  assert.equal(narrative.note,narrative.visible,'highlighted note follows the visible incoming cue');
  assert.equal(narrative.timeline,narrative.title,'timeline and main heading describe the same incoming episode');
  assert.equal(narrative.hash,'#1.'+narrative.visible);
  assert.equal(narrative.captionPhase,'approach','mid-fold caption describes the ongoing operation');
  assert(narrative.captionOpacity===0||narrative.caption!==narrative.detailCaption,'mid-fold caption does not prematurely describe a finished cloverleaf');
  const speedStart=await page.evaluate(()=>{
   TRNA_FILM.play();document.getElementById('speedToggle').click();
   return {time:TRNA_FILM.current().time,wall:performance.now()};
  });
  await page.waitForTimeout(500);
  const speedEnd=await page.evaluate(()=>{
   const result={time:TRNA_FILM.current().time,wall:performance.now(),label:document.getElementById('speedValue').textContent};
   TRNA_FILM.pause();document.getElementById('speedToggle').click();document.getElementById('speedToggle').click();return result;
  });
  const speedChange={label:speedEnd.label,filmSeconds:speedEnd.time-speedStart.time,wallMilliseconds:speedEnd.wall-speedStart.wall};
  speedChange.observedRate=speedChange.filmSeconds/(speedChange.wallMilliseconds/1000);
  assert.equal(speedChange.label,'0.5×');
  assert(speedChange.observedRate>.25&&speedChange.observedRate<.75,'changing speed during playback immediately retimes the active film');
  await page.evaluate(time=>{TRNA_FILM.play();TRNA_FILM.seek(time);},cues.contactsMotionTime);
  await page.waitForTimeout(200);
  assert.equal(await page.evaluate(()=>TRNA_FILM.current().time),cues.contactsMotionTime,'seek cancels stale film writes');
  assert(await page.evaluate(()=>TrnaJourney.actor.nodes.every((n,i)=>n===savedNodes[i])),'all 76 actors persist');
  await page.evaluate(()=>{TRNA_FILM.seek(0);A.setSpeed(30);TRNA_FILM.play();});
  await page.waitForFunction(()=>TRNA_FILM.current().time===TRNA_FILM.duration&&!TRNA_FILM.current().playing,{},{timeout:Math.ceil(cues.duration/30*1000)+10000});
  assert.equal(await page.evaluate(()=>TrnaJourney.snapshot.values.final),1);
  assert.equal(await page.evaluate(()=>D.deck.current().step),cues.count-1);
  const approachCaptions=await page.evaluate(()=>TrnaJourney.cues.slice(1).map(c=>{
   TRNA_FILM.seek(c.arrive+c.motion*.1);
   return {key:c.key,phase:TrnaJourney.snapshot.captionPhase,opacity:TrnaJourney.snapshot.captionOpacity,
    renderedOpacity:Number(getComputedStyle(document.querySelector('.film-caption')).opacity),
    caption:document.querySelector('.film-caption').textContent,approach:c.approachRu,detail:c.captionRu};
  }));
  for(const cue of approachCaptions){
   assert.equal(cue.phase,'approach',cue.key+' uses an approach caption while detail is still appearing');
   if(cue.approach){
    assert(cue.opacity>0&&cue.renderedOpacity>0,cue.key+' shows the approach caption');
    assert.equal(cue.caption,cue.approach,cue.key+' paints its approach text');
   }else assert.equal(cue.renderedOpacity,0,cue.key+' leaves space clear until its detail is ready');
  }
  const synchronizedCues=await page.evaluate(()=>TrnaJourney.cues.map(c=>{
   TRNA_FILM.seek(c.time);
   return {key:c.key,expected:c.index,cue:TrnaJourney.snapshot.cue,phase:TrnaJourney.snapshot.captionPhase,
    current:TRNA_FILM.current().index,step:D.deck.current().step,
    note:Number(document.querySelector('#notesBody .is-now .note-step').textContent)-1,
    title:document.querySelector('.film-title').textContent,timeline:document.querySelector('.trna-cue-title').textContent,
    caption:document.querySelector('.film-caption').textContent,expectedCaption:c.captionRu,
    expectedTitle:c.titleRu,hash:location.hash};
  }));
  for(const cue of synchronizedCues){
   for(const key of ['cue','current','step','note'])assert.equal(cue[key],cue.expected,cue.key+' '+key+' follows the semantic endpoint');
   assert.equal(cue.phase,'detail',cue.key+' is fully described at its endpoint');
   assert.equal(cue.caption,cue.expectedCaption,cue.key+' paints its complete detail caption');
   assert.equal(cue.title,cue.expectedTitle);assert.equal(cue.timeline,cue.title);assert.equal(cue.hash,cue.expected?'#1.'+cue.expected:'#1');
  }
  await page.evaluate(index=>{A.setSpeed(1);D.deck.show(0,index);},cues.contactsIndex);
  await page.waitForFunction(()=>!D.deck.current().busy);
  assert.equal(await page.evaluate(()=>TRNA_FILM.current().time),cues.contactsTime,'deep replay reconstructs the correct atomic frame');
  assert.equal(await page.locator('#trnaTimeline').count(),1);
  assert.equal(await page.locator('#chrome>button').count(),5);
  assert.deepEqual(errors,[]);
  const report={ok:true,viewport:[1280,720],duration:cues.duration,cueCount:cues.count,speedChange,approachCaptions,synchronizedCues,
   checks:['paused-language roundtrip','exact mid-fold pause','incoming narrative title/timeline/notes/hash synchronization','live speed change','seek cancellation during contact motion','persistent 76 actors','full accelerated playback to final frame','all-transition rendered approach captions','all-cue title/timeline/note/hash/detail-caption synchronization','atomic deep replay','single timeline and five controls'],errors};
  fs.mkdirSync(path.join(root,'qa-output/trna-film'),{recursive:true});fs.writeFileSync(path.join(root,'qa-output/trna-film/playback-report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
