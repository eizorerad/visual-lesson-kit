#!/usr/bin/env node
'use strict';
/* Screenshots of a narrated film at cue endpoints (and optionally mid-transitions),
 * plus a text-contract audit and console errors for every frame.
 *
 *   node qa/narrated/shots.cjs [page] [--lang ru|en] [--mid] [--only key1,key2] [--out DIR]
 *
 * Needs Playwright; PLAYWRIGHT_CHANNEL=chrome selects the installed Google Chrome. */
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const pw=require('playwright');
const root=path.resolve(__dirname,'../..');
const args=process.argv.slice(2),flag=n=>args.includes(n),value=(n,d)=>{const i=args.indexOf(n);return i<0?d:args[i+1];};
const page0=args.find(a=>!a.startsWith('--')&&!['ru','en'].includes(a)&&args[args.indexOf(a)-1]!=='--only'&&args[args.indexOf(a)-1]!=='--out')||'index.html';
const lang=value('--lang','ru'),only=value('--only',''),out=path.resolve(root,value('--out','qa-output/shots'));

(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await pw.chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{})});
 const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(['error','warning'].includes(m.type()))errors.push(m.type()+': '+m.text());});
 await page.goto(pathToFileURL(path.resolve(root,page0)).href+'?lang='+lang+'&record=1');
 await page.waitForFunction(()=>window.CINEMA&&window.NARRATED_FILM);
 await page.evaluate(async()=>{document.body.classList.add('narrated-record');await document.fonts.ready;D.deck.refit();});
 const cues=await page.evaluate(()=>NARRATED_FILM.cues.map(c=>({key:c.key,arrive:c.arrive,time:c.time,motion:c.motion,hold:c.hold})));
 const wanted=only?new Set(only.split(',')):null,report=[];
 for(const [i,c] of cues.entries()){
  if(wanted&&!wanted.has(c.key))continue;
  const times=[['end',c.time+Math.min(.2,c.hold/2)]];
  if(flag('--mid')&&c.motion>0)times.unshift(['mid',c.arrive+c.motion*.5]);
  for(const [tag,t] of times){
   const audit=await page.evaluate(async t=>{CINEMA.pause();CINEMA.seek(t);await L.ready(D.deck.root());const r=L.audit(D.deck.root());return {issues:r.issues.map(x=>({id:x.id,kind:x.kind,excess:x.excess})),uncontracted:r.uncontractedText.slice(0,5)};},t);
   const file=path.join(out,String(i).padStart(3,'0')+'-'+c.key+'-'+tag+'.png');
   await page.screenshot({path:file});
   report.push({i,key:c.key,tag,t:+t.toFixed(2),...audit});
  }
 }
 const duration=await page.evaluate(()=>NARRATED_FILM.duration);
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({duration,cues:cues.length,errors,frames:report},null,1));
 const bad=report.filter(r=>r.issues.length||r.uncontracted.length);
 console.log(`${cues.length} cues · ${duration.toFixed(1)} s · ${report.length} frames · ${bad.length} with text issues · ${errors.length} console messages`);
 bad.slice(0,40).forEach(r=>console.log(' ',r.key,r.tag,JSON.stringify(r.issues.map(x=>x.id+':'+x.kind+(x.excess?':'+Object.entries(x.excess).filter(([,v])=>v>1).map(([k,v])=>k+Math.round(v)).join('/'):''))),r.uncontracted.length?'uncontracted '+JSON.stringify(r.uncontracted):''));
 errors.slice(0,20).forEach(e=>console.log('  !',e));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
