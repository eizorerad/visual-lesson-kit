#!/usr/bin/env node
'use strict';
/* Print the compiled cue list of a narrated film as JSON: film id and title, tone table,
 * chapters, cue timings, titles and narration text (with delivery markup). Used by
 * tools/voice.py and tools/mux.py.   node qa/narrated/cues.cjs [page] > cues.json */
const path=require('node:path'),{pathToFileURL}=require('node:url'),pw=require('playwright');
const root=path.resolve(__dirname,'../..'),page0=process.argv[2]||'index.html';
(async()=>{
 const browser=await pw.chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{})});
 const page=await browser.newPage();
 await page.goto(pathToFileURL(path.resolve(root,page0)).href+'?lang=ru');
 await page.waitForFunction(()=>window.NARRATED_FILM);
 const data=await page.evaluate(()=>{
  const V=NARRATED,title=V.meta.title;
  return {id:NARRATED_FILM.id,title:Array.isArray(title)?{ru:title[0],en:title[1]}:{ru:title||'',en:title||''},
   duration:NARRATED_FILM.duration,lead:NARRATED_FILM.lead,tones:V.TONE,chapters:V.chapters.map(c=>({ru:c.ru,en:c.en})),
   cues:NARRATED_FILM.cues.map(c=>{const src=V.cues.find(x=>x.key===c.key);return {key:c.key,shot:c.shot,chapter:c.target.chapter,arrive:c.arrive,time:c.time,motion:c.motion,hold:c.hold,titleRu:c.titleRu,titleEn:c.titleEn,voiceRu:src.voice[0],voiceEn:src.voice[1],tone:src.tone||''};})};
 });
 process.stdout.write(JSON.stringify(data,null,1));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
