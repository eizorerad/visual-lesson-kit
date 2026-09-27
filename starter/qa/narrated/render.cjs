#!/usr/bin/env node
'use strict';
/* Render a narrated film to a silent H.264 video on the film clock. Every motion frame
 * is seeked and captured; a hold (a still pose while the narration plays) is
 * captured once and repeated, so the output is deterministic and independent of
 * wall-clock speed. Audio, subtitles and chapters are added by tools/mux.py.
 *
 *   FFMPEG=/path/to/ffmpeg node qa/narrated/render.cjs [dist/lesson.html]
 *        [--fps 30] [--scale 1.5] [--from S] [--to S] [--out media/film-silent.mp4]
 *
 * Needs Playwright (PLAYWRIGHT_CHANNEL=chrome selects the installed Chrome). */
const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process'),{pathToFileURL}=require('node:url');
const pw=require('playwright');
const root=path.resolve(__dirname,'../..'),args=process.argv.slice(2);
const opt=(name,fallback)=>{const i=args.indexOf(name);return i<0?fallback:args[i+1];};
const page0=args.find((a,i)=>!a.startsWith('--')&&!(i&&args[i-1].startsWith('--')))||'dist/lesson.html';
const fps=Number(opt('--fps',30)),scale=Number(opt('--scale',1.5)),out=path.resolve(root,opt('--out','media/film-silent.mp4'));
const ffmpeg=process.env.FFMPEG||'ffmpeg';

function write(stream,buffer){return stream.write(buffer)?Promise.resolve():new Promise(resolve=>stream.once('drain',resolve));}

(async()=>{
 fs.mkdirSync(path.dirname(out),{recursive:true});
 const browser=await pw.chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{})});
 const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:scale});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(pathToFileURL(path.resolve(root,page0)).href+'?lang=ru&record=1');
 await page.waitForFunction(()=>window.CINEMA&&window.NARRATED_FILM);
 await page.evaluate(async()=>{document.body.classList.add('narrated-record');await document.fonts.ready;D.deck.refit();CINEMA.pause();});
 const film=await page.evaluate(()=>({duration:NARRATED_FILM.duration,cues:NARRATED_FILM.cues.map(c=>({key:c.key,arrive:c.arrive,time:c.time,hold:c.hold}))}));
 const from=Number(opt('--from',0)),to=Math.min(Number(opt('--to',film.duration)),film.duration);
 const first=Math.round(from*fps),last=Math.ceil(to*fps);
 // A frame inside [cue.time, next arrive) shows the finished pose of that cue.
 const holdOf=t=>{for(let i=film.cues.length-1;i>=0;i--){const c=film.cues[i];if(t>=c.time-1e-9)return t<=c.time+c.hold+1e-9?i:-1;}return -1;};
 const snap=async t=>{await page.evaluate(async t=>{CINEMA.seek(t);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));},t);return page.screenshot({type:'jpeg',quality:92});};
 const enc=spawn(ffmpeg,['-y','-hide_banner','-loglevel','error','-f','image2pipe','-framerate',String(fps),'-c:v','mjpeg','-i','-',
  '-vf','scale=in_range=pc:out_range=tv,format=yuv420p','-c:v','libx264','-preset','medium','-crf','19','-pix_fmt','yuv420p','-color_range','tv','-movflags','+faststart',out],{stdio:['pipe','inherit','inherit']});
 const done=new Promise((resolve,reject)=>{enc.on('error',reject);enc.on('close',code=>code===0?resolve():reject(new Error('ffmpeg exited with '+code)));});
 let heldIndex=-2,heldFrame=null,captured=0;const started=Date.now();
 for(let k=first;k<last;k++){
  const t=Math.min(k/fps,film.duration),i=holdOf(t);
  let frame;
  if(i>=0){if(i!==heldIndex){heldFrame=await snap(film.cues[i].time);heldIndex=i;captured++;}frame=heldFrame;}
  else{frame=await snap(t);captured++;}
  await write(enc.stdin,frame);
  if((k-first)%900===0)process.stdout.write(`\r${((k-first)/fps/60).toFixed(1)} / ${((last-first)/fps/60).toFixed(1)} min · ${captured} captures · ${((Date.now()-started)/1000).toFixed(0)} s`);
 }
 enc.stdin.end();await done;await browser.close();
 process.stdout.write(`\n${out} · ${(last-first)} frames at ${fps} fps · ${captured} captures · ${errors.length} page errors\n`);
 errors.slice(0,5).forEach(e=>console.log('  !',e));
})().catch(e=>{console.error(e);process.exit(1);});
