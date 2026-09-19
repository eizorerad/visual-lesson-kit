#!/usr/bin/env node
'use strict';
/* Independent SVG-vertex correspondence checks for compact/detail 1MUH.
 * Registration metadata alone cannot catch a replacement silhouette. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {pathToFileURL}=require('node:url'),pw=require('playwright');
const root=path.resolve(__dirname,'../..'),artifact=process.env.ATAC_ARTIFACT||path.join(root,'dist/lesson.html'),output=path.join(root,'qa-output/atac/tn5-identity');
fs.mkdirSync(output,{recursive:true});
(async()=>{
 const report={artifactSha256:crypto.createHash('sha256').update(fs.readFileSync(artifact)).digest('hex'),checks:[],frames:[],errors:[]};
 const check=(name,fn)=>{try{fn();report.checks.push({name,pass:true});}catch(e){report.checks.push({name,pass:false,error:e.message});}};
 const browser=await require('../trna/browser.cjs').launch(pw),page=await browser.newPage({viewport:{width:1440,height:900}});
 page.on('pageerror',e=>report.errors.push(e.message));
 try{
  await page.goto(pathToFileURL(artifact).href+'?lang=ru&qa=tn5-identity');await page.waitForFunction(()=>window.ATAC_FILM?.snapshot&&window.CINEMA);
  await require('./lib.cjs').assertDefaultRoute(page);
  const cues=await page.evaluate(()=>{CINEMA.pause();window.tn5SourceBefore=JSON.stringify(AtacStructures.transposome);window.tn5Nodes=[...ATAC_FILM.actors.chromatin.g.querySelectorAll('[data-tn5-trace]')];return ATAC_FILM.cues.map(c=>({key:c.key,time:c.time,arrive:c.arrive,motion:c.motion}));});
  const cueMap=new Map(cues.map(c=>[c.key,c]));
  async function frame(time){return page.evaluate(async time=>{
   CINEMA.seek(time);await L.ready(D.deck.root());const snapshot=ATAC_FILM.snapshot,chrom=ATAC_FILM.actors.chromatin.g,detail=ATAC_FILM.actors.structure.g;
   const matrixPoint=(m,p)=>[m.a*p[0]+m.c*p[1]+m.e,m.b*p[0]+m.d*p[1]+m.f];
   function endpoints(path){const tokens=path.getAttribute('d').match(/[MC]|-?\d*\.?\d+(?:e[-+]?\d+)?/ig)||[],ps=[];let i=0;while(i<tokens.length){const command=tokens[i++],count=command==='M'?2:command==='C'?6:0;if(!count)throw new Error('Unexpected source trace command '+command);const values=tokens.slice(i,i+count).map(Number);i+=count;ps.push(values.slice(-2));}return ps;}
   const compact=[...chrom.querySelectorAll('[data-bio-part="tn5-event-a"] [data-tn5-trace]')];
   const detailed=new Map([...detail.querySelectorAll('[data-pdb="1MUH"] g[data-start-index]')].map(n=>[n.dataset.chain+':'+n.dataset.startIndex,n]));
   let error=0,matched=0;
   for(const a of compact){const b=detailed.get(a.dataset.chain+':'+a.dataset.startIndex);if(!b)throw new Error('Missing detailed source segment');const ap=a.querySelector('path'),bp=b.querySelector('path'),aa=endpoints(ap),bb=endpoints(bp),am=ap.getCTM(),bm=bp.getCTM();if(aa.length!==bb.length)throw new Error('Source segment vertex count changed');for(let i=0;i<aa.length;i++){const p=matrixPoint(am,aa[i]),q=matrixPoint(bm,bb[i]);error=Math.max(error,Math.hypot(p[0]-q[0],p[1]-q[1]));matched++;}}
   const actor=chrom.querySelector('[data-bio-part="tn5-event-a"]'),actorB=chrom.querySelector('[data-bio-part="tn5-event-b"]');
   const nodes=[...chrom.querySelectorAll('[data-tn5-trace]')];
   const enzymes=snapshot.geometry.enzymes;
   return{key:snapshot.key,time,camera:snapshot.cameraStory?{kind:snapshot.cameraStory.kind,phase:snapshot.cameraStory.phase,progress:snapshot.cameraStory.progress,identity:snapshot.cameraStory.sourceIdentity}:null,maxVertexMismatch:error,matchedVertices:matched,traceCounts:[actor.querySelectorAll('[data-tn5-trace]').length,actorB.querySelectorAll('[data-tn5-trace]').length],proteinChains:[...new Set(compact.filter(n=>n.dataset.kind==='protein').map(n=>n.dataset.chain))],filledPaths:[...actor.querySelectorAll('path'),...actorB.querySelectorAll('path')].filter(n=>n.getAttribute('fill')!=='none').length,nucleusEllipses:chrom.querySelectorAll('[data-bio-part="nucleus-context"] ellipse').length,sourceImmutable:tn5SourceBefore===JSON.stringify(AtacStructures.transposome),stable:nodes.length===tn5Nodes.length&&tn5Nodes.every(n=>nodes.includes(n)),finite:[...chrom.querySelectorAll('*')].every(n=>!['d','transform'].some(a=>/NaN|Infinity/.test(n.getAttribute(a)||''))),enzymes:enzymes.map(e=>({source:e.source,proteinPointCount:e.proteinPointCount,dnaPointCount:e.dnaPointCount,containsTargetDNA:e.containsTargetDNA,containsFullAdapters:e.containsFullAdapters}))};
  },time);}
  for(const key of ['tn5','tn5-real','tn5-end-dna','dock','two-events','different-events','release']){
   const cue=cueMap.get(key);if(!cue)continue;const row=await frame(cue.time);report.frames.push(row);
   check(key+': persistent deposited geometry, no smooth blobs or nucleus icon',()=>{assert(row.stable&&row.sourceImmutable&&row.finite);assert.deepEqual(row.proteinChains.slice().sort(),['C','C-2']);assert(row.matchedVertices>=900,'every retained 1MUH vertex is drawn in the compact copy');assert(row.traceCounts.every(n=>n>=100),'trace runs remain short enough for depth sorting');assert.equal(row.filledPaths,0);assert.equal(row.nucleusEllipses,0);assert(row.enzymes.every(e=>e.source==='1MUH'&&e.proteinPointCount===910&&e.dnaPointCount===80&&!e.containsTargetDNA&&!e.containsFullAdapters));});
   await page.screenshot({path:path.join(output,key+'.png')});
  }
  for(const [key,progresses]of [['tn5-real',[0,.125,.25,.375,.5,.625,.75,.875,1]],['dock',[.28,.35,.42,.5,.58,.65,.72]]]){
   const cue=cueMap.get(key);
   for(const u of progresses){const row=await frame(cue.arrive+cue.motion*u);report.frames.push(row);check(`${key} ${u}: actual rendered Cα and DNA vertices stay matched`,()=>{assert(row.camera?.identity);assert.equal(row.camera.identity.matchedPoints,910);assert(row.camera.identity.maxRenderedError<1e-9);assert(row.matchedVertices>1000);assert(row.maxVertexMismatch<.02,'Rendered source vertices differ by '+row.maxVertexMismatch+' px');assert(row.stable&&row.sourceImmutable&&row.finite);});}
  }
  const before=await frame(cueMap.get('tn5').time);await frame(cueMap.get('two-events').time);const after=await frame(cueMap.get('tn5').time);
  check('Backseek restores exactly the same source object and no duplicate nodes',()=>assert.deepEqual(after,before));
  check('No browser exceptions',()=>assert.deepEqual(report.errors,[]));
 }finally{await browser.close();}
 fs.writeFileSync(path.join(root,'qa-output/atac/tn5-identity-report.json'),JSON.stringify(report,null,2));
 const failures=report.checks.filter(c=>!c.pass);console.log(JSON.stringify({checks:report.checks.length,failures,frames:report.frames.length,maxHandoffVertexError:Math.max(...report.frames.filter(r=>r.camera?.identity).map(r=>r.maxVertexMismatch)),artifactSha256:report.artifactSha256},null,2));if(failures.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
