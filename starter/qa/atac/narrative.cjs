#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),pw=require('playwright');
const root=path.resolve(__dirname,'../..'),artifact=path.resolve(process.argv[2]||path.join(root,'dist/lesson.html')),out=path.resolve(process.argv[3]||path.join(root,'qa-output/atac/narrative'));fs.mkdirSync(out,{recursive:true});
(async()=>{
 const report={artifactSha256:crypto.createHash('sha256').update(fs.readFileSync(artifact)).digest('hex'),checks:[],frames:[],errors:[]};
 const check=(name,fn)=>{try{fn();report.checks.push({name,pass:true});}catch(e){report.checks.push({name,pass:false,error:e.message});}};
 const browser=await require('../trna/browser.cjs').launch(pw),page=await browser.newPage({viewport:{width:1440,height:900}});page.on('pageerror',e=>report.errors.push(e.message));
 try{
  await page.goto(pathToFileURL(artifact).href+'?lang=ru&qa=narrative');await page.waitForFunction(()=>window.CINEMA&&window.ATAC_FILM?.actors);await page.evaluate(()=>CINEMA.pause());
  await require('./lib.cjs').assertDefaultRoute(page);
  const cues=await page.evaluate(()=>ATAC_FILM.cues.map(c=>({key:c.key,time:c.time,arrive:c.arrive,motion:c.motion}))),at=key=>cues.find(c=>c.key===key);
  async function frame(time){return page.evaluate(async t=>{
   CINEMA.seek(t);const layout=await L.ready(D.deck.root()),alpha=n=>{let a=1;while(n?.nodeType===1){a*=+getComputedStyle(n).opacity;n=n.parentElement;}return a;},signals=ATAC_FILM.actors.signals;
   return{time:t,key:ATAC_FILM.snapshot.key,issues:layout.issues,signalAlpha:alpha(signals.g),signalStage:+signals.g.dataset.stage,originAlpha:alpha(ATAC_FILM.actors.origin.g),referenceAlpha:alpha(signals.nodes.axis),histAlpha:alpha(signals.g.querySelector('[data-atac-layer="length-histogram"]')),bars:signals.nodes.histBars.map(n=>({height:+n.getAttribute('height'),alpha:alpha(n)})),fragments:signals.nodes.fragmentNodes.map(n=>({id:n.fragment.id,length:n.fragment.end-n.fragment.start,alpha:alpha(n.span)})),nucleusShapes:[...ATAC_FILM.actors.chromatin.g.querySelectorAll('[data-bio-part="nucleus-context"] ellipse')].filter(n=>alpha(n)>.01).length,visibleNucleusLabel:[...D.deck.root().querySelectorAll('[data-atac-annotation="nucleus"]')].some(n=>alpha(n)>.01),title:document.querySelector('.film-title').textContent};
  },time);}
  const initial=await frame(0);check('Film starts from DNA without nucleus icon or label',()=>{assert.equal(initial.nucleusShapes,0);assert.equal(initial.visibleNucleusLabel,false);});await page.screenshot({path:path.join(out,'opening.png')});
  let lastMass=-1;const cue=at('lengths');
  for(let i=0;i<=20;i++){
   const u=i/20,r=await frame(cue.arrive+cue.motion*u);report.frames.push(r);
   check(`Length distribution ${u}: no previous genomic track or empty handoff`,()=>{assert.equal(r.issues.length,0);assert(r.signalAlpha+r.originAlpha>.99);if(r.signalAlpha>.01){assert.equal(r.signalStage,11);assert(r.referenceAlpha<.01);assert(r.histAlpha>.01);}});
   const mass=r.bars.reduce((a,b)=>a+b.height,0);if(u>0)check(`Length distribution ${u}: bars accumulate monotonically`,()=>assert(mass+1e-6>=lastMass));lastMass=mass;
   if([0,4,10,15,20].includes(i))await page.screenshot({path:path.join(out,'lengths-'+String(i).padStart(2,'0')+'.png')});
  }
  const end=report.frames.at(-1),counts=Array(20).fill(0);end.fragments.forEach(f=>counts[Math.min(19,Math.floor(f.length/25))]++);const max=Math.ceil(Math.max(...counts)/10)*10;
  check('Final length bars are the independently counted 150 original inserts',()=>{assert.equal(end.fragments.length,150);assert(end.fragments.every(f=>f.alpha>.9));end.bars.forEach((b,i)=>assert(Math.abs(b.height-counts[i]/max*205)<1e-7));assert(end.histAlpha>.99);assert(end.originAlpha<.01);});
  for(const time of [at('frip').time,at('contour-length').time,cue.arrive+cue.motion*.5,cue.time])await frame(time);
  const repeated=await frame(cue.time);check('Histogram survives out-of-order seeking',()=>assert.deepEqual(repeated.bars,end.bars));
  await frame(at('tag-chemistry').time);
  const bonds=await page.evaluate(()=>[...document.querySelectorAll('[data-adapter-transfer]')].map(n=>({side:n.dataset.adapterTransfer,d:n.getAttribute('d')})));
  check('Adapter transfers are connected to the target 5-prime sides of both nicks',()=>{assert.equal(bonds.length,2);for(const b of bonds){const p=b.d.match(/[-+]?\d*\.?\d+/g).map(Number);if(b.side==='top')assert(p[0]>353+8.5*25);else if(b.side==='bottom')assert(p[0]<353+17.5*25);else assert.fail('Unidentified strand');}});await page.screenshot({path:path.join(out,'adapter-transfer.png')});
  check('No browser errors',()=>assert.deepEqual(report.errors,[]));
 }finally{await browser.close();}
 report.ok=report.checks.every(c=>c.pass);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({ok:report.ok,checks:report.checks.length,frames:report.frames.length,failures:report.checks.filter(c=>!c.pass),errors:report.errors},null,2));if(!report.ok)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
