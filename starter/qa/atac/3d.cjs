#!/usr/bin/env node
'use strict';
/* Browser-level scientific geometry checks, independent of the ordinary
 * text/layout audit. No biological dynamics or source-coordinate revalidation
 * is claimed here. Source import provenance has its own audit. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),pw=require('playwright');
const root=path.resolve(__dirname,'../..'),output=path.join(root,'qa-output/atac/3d');
const artifact=path.join(root,'dist/lesson.html'),close=(a,b,tol=1e-8)=>Math.abs(a-b)<=tol;
const edgeLengths=points=>points.slice(1).map((p,i)=>Math.hypot(...p.map((v,k)=>v-points[i][k])));
const sum=values=>values.reduce((a,b)=>a+b,0),checkFinite=value=>{
 if(typeof value==='number')assert(Number.isFinite(value),'Nonfinite geometry');
 else if(value&&typeof value==='object')Object.values(value).forEach(checkFinite);
};
const structural=['nucleosome-real','histone-octamer','wrapped-dna','tn5-real','tn5-end-dna'];
const originKeys=['short-origin','nucleosomal-origin','contour-length'];
fs.mkdirSync(output,{recursive:true});
(async()=>{
 const report={artifactSha256:crypto.createHash('sha256').update(fs.readFileSync(artifact)).digest('hex'),checks:[],frames:[],errors:[],externalRequests:[]};
 const browser=await require('../trna/browser.cjs').launch(pw),page=await browser.newPage({viewport:{width:1440,height:900}});
 const check=(name,fn)=>{try{const detail=fn();report.checks.push({name,pass:true,...(detail?{detail}:{})});}catch(error){report.checks.push({name,pass:false,error:error.message});}};
 page.on('pageerror',error=>report.errors.push(error.message));page.on('request',req=>{if(/^https?:/.test(req.url()))report.externalRequests.push(req.url());});
 try{
  await page.goto(pathToFileURL(artifact).href+'?lang=ru&qa=3d');await page.waitForFunction(()=>window.ATAC_FILM?.actors?.origin&&window.CINEMA);
  await require('./lib.cjs').assertDefaultRoute(page);
  const setup=await page.evaluate(()=>{
   CINEMA.pause();D.i18n.setLang('ru');D.appearance.set({font:'sans',background:'black',palette:'ocean'});
   window.threeSourceBefore=JSON.stringify(AtacStructures);
   window.threeNodes=Object.fromEntries(['structure','origin'].map(k=>[k,[...ATAC_FILM.actors[k].g.querySelectorAll('g,path,line,circle,ellipse,rect')]]));
   return {duration:ATAC_FILM.duration,cues:ATAC_FILM.cues.map(c=>({key:c.key,time:c.time,arrive:c.arrive,motion:c.motion})),counts:{nucleosome:AtacStructures.nucleosome.chains.length,transposome:AtacStructures.transposome.chains.length}};
  });
  check('Final film contains 46 cues and lasts 240.6 seconds',()=>{assert.equal(setup.cues.length,46);assert(close(setup.duration,240.6,1e-7));});
  report.duration=setup.duration;
  const cues=new Map(setup.cues.map(c=>[c.key,c]));
  for(const key of [...structural,...originKeys]){
   const cue=cues.get(key);assert(cue,'Missing cue '+key);
   const frame=await page.evaluate(async time=>{
    CINEMA.seek(time);const layout=await L.ready(D.deck.root());
    const opacity=node=>{let a=1;while(node?.nodeType===1){const s=getComputedStyle(node);if(s.display==='none'||s.visibility==='hidden')return 0;a*=+s.opacity;node=node.parentElement;}return a;};
    const structure=ATAC_FILM.actors.structure,origin=ATAC_FILM.actors.origin;
    const stable=Object.fromEntries(Object.entries(threeNodes).map(([key,nodes])=>{const now=[...ATAC_FILM.actors[key].g.querySelectorAll('g,path,line,circle,ellipse,rect')];return[key,now.length===nodes.length&&nodes.every(node=>now.includes(node))];}));
    const pdb=ATAC_FILM.snapshot.structure?.source;
    const model=structure.g.querySelector('[data-pdb="'+pdb+'"]');
    let pathBounds=null;
    if(model){
     const extents=[...model.querySelectorAll('path')].filter(n=>opacity(n)>.03).map(n=>{const b=n.getBBox(),w=parseFloat(getComputedStyle(n).strokeWidth)||0;return{minX:b.x-w/2,minY:b.y-w/2,maxX:b.x+b.width+w/2,maxY:b.y+b.height+w/2};});
     if(extents.length)pathBounds={minX:Math.min(...extents.map(b=>b.minX)),maxX:Math.max(...extents.map(b=>b.maxX)),minY:Math.min(...extents.map(b=>b.minY)),maxY:Math.max(...extents.map(b=>b.maxY)),paths:extents.length};
    }
    const ring=structure.g.querySelector('[data-locator="'+pdb+'"] ellipse[data-locator-region="source-focus"]');
    const locator=ring?{opacity:opacity(ring),cx:+ring.getAttribute('cx'),cy:+ring.getAttribute('cy'),rx:+ring.getAttribute('rx'),ry:+ring.getAttribute('ry'),pathCount:ring.parentElement.querySelectorAll('path').length}:null;
    const invalid=[structure.g,origin.g].flatMap(g=>[...g.querySelectorAll('*')]).filter(n=>['d','x','y','cx','cy','transform'].some(a=>/NaN|Infinity/.test(n.getAttribute(a)||''))).length;
    return {key:ATAC_FILM.snapshot.key,structure:ATAC_FILM.snapshot.structure,origin:ATAC_FILM.snapshot.origin,pathBounds,locator,stable,invalid,layoutIssues:layout.issues};
   },cue.time);
   report.frames.push({key,structure:frame.structure,pathBounds:frame.pathBounds,locator:frame.locator,stable:frame.stable,invalid:frame.invalid,layoutIssues:frame.layoutIssues});
   check(key+': persistent nodes, finite geometry and contracted text',()=>{assert(frame.stable.structure&&frame.stable.origin);assert.equal(frame.invalid,0);assert.equal(frame.layoutIssues.length,0);checkFinite(frame.structure);checkFinite(frame.origin);});
   if(['nucleosome-real','tn5-real'].includes(key))check(key+': overview trace and stroke fit the central field',()=>{
    const b=frame.pathBounds;assert(b,'No visible model paths');assert(b.minX>=351&&b.maxX<=935&&b.minY>=201&&b.maxY<=554,'Trace exceeds overview field: '+JSON.stringify(b));assert.equal(frame.structure.bounds.clipped,false);assert.equal(frame.structure.mode,'overview');return b;
   });
   if(['histone-octamer','wrapped-dna','tn5-end-dna'].includes(key))check(key+': enlarged source region remains visible with its whole-complex locator',()=>{
    const v=frame.structure,q=frame.locator,b=v.focus.bounds;
    assert.equal(v.mode,'focus');assert(v.magnification>=1.6);assert.equal(v.context.neighboringGeometryRetained,true);
    assert.equal(v.bounds.clipped,true,'A focus deliberately retains geometry past the figure edge');
    assert(q&&q.opacity>.9);assert(q.pathCount>=6);assert(q.cx-q.rx>=65&&q.cx+q.rx<=335);assert(q.cy-q.ry>=275&&q.cy+q.ry<=455);
    assert(b.minX>=351&&b.maxX<=935&&b.minY>=201&&b.maxY<=554,'The selected source region must fit: '+JSON.stringify(b));
    assert.equal(v.locator.source,v.source);assert.equal(v.locator.pathCount,v.source==='1KX5'?10:6);
    assert.deepEqual(v.context.clip,{x:60,y:201,width:1160,height:353});
    if(key==='wrapped-dna'){assert.equal(v.focus.pointCount,36);assert(v.focus.sourceIndices,'The enlarged DNA arc needs explicit source correspondence');}
    return {focus:v.focus,locator:q,magnification:v.magnification};
   });
   await page.screenshot({path:path.join(output,key+'.png')});
  }
  // Sample the full actual film transition, including its easing curve. The
  // independent oracle compares every edge to the first visible geometry,
  // not merely to the actor's self-reported total contour length.
  const cue=cues.get('contour-length'),sampleRows=[];let references=null;
  for(let i=0;i<15;i++){
   const time=cue.arrive+cue.motion*i/14;
   const row=await page.evaluate(async time=>{
    CINEMA.seek(time);const q=await L.ready(ATAC_FILM.actors.origin.g),s=ATAC_FILM.snapshot.origin;
    const core=ATAC_FILM.actors.origin.g.querySelector('[data-origin-part="histone-core"]');
    return {time,...s,coreLocalOpacity:+getComputedStyle(core).opacity,layoutIssues:q.issues};
   },time);
   if(!references)references=Object.fromEntries(row.geometry.map(g=>[g.id,edgeLengths(g.centerline)]));
   let maximumEdgeError=0,maximumTotalError=0;
   check(`Origin transition sample ${i+1}/15: DNA contour and every edge are retained`,()=>{
    assert.equal(row.geometry.length,2);checkFinite(row.geometry);assert.equal(row.layoutIssues.length,0);
    for(const g of row.geometry){
     const actual=edgeLengths(g.centerline),expected=references[g.id];assert.equal(actual.length,expected.length);
     const error=Math.max(...actual.map((n,j)=>Math.abs(n-expected[j])));maximumEdgeError=Math.max(maximumEdgeError,error);assert(error<1e-8);
     const totalError=Math.abs(sum(actual)-sum(expected));maximumTotalError=Math.max(maximumTotalError,totalError);assert(totalError<1e-8);assert(close(g.contourLength,sum(actual)));
    }
    if(row.unroll>0){assert.equal(row.coreLocalOpacity,0,'Core is visible during unrolling');assert.equal(row.geometry.find(g=>g.id==='spanning-nucleosome').proteinOpacity,0);}
   });
   sampleRows.push({time,stage:row.stage,unroll:row.unroll,coreLocalOpacity:row.coreLocalOpacity,maximumEdgeError,maximumTotalError});
   if(i===14)check('Final inserts share an origin and have one common model-unit-to-pixel scale',()=>{
    const [a,b]=row.geometry,[a0,a1]=a.endpoints,[b0,b1]=b.endpoints;
    assert(close(a0[0],335)&&close(b0[0],335));assert(close(a0[1],a1[1])&&close(b0[1],b1[1]));
    const aScale=(a1[0]-a0[0])/sum(references[a.id]),bScale=(b1[0]-b0[0])/sum(references[b.id]);assert(close(aScale,bScale));assert(close(aScale,1));return {aScale,bScale};
   });
  }
  report.originSamples=sampleRows;
  const final=await page.evaluate(()=>({immutable:threeSourceBefore===JSON.stringify(AtacStructures),stable:Object.entries(threeNodes).every(([key,nodes])=>{const now=[...ATAC_FILM.actors[key].g.querySelectorAll('g,path,line,circle,ellipse,rect')];return now.length===nodes.length&&nodes.every(n=>now.includes(n));})}));
  check('All experimental source coordinates are byte-for-byte unchanged by every seek',()=>assert(final.immutable));
  check('Both new actors retain all geometric objects across endpoint and intermediate seeks',()=>assert(final.stable));
  check('Standalone run produces no page errors or external requests',()=>{assert.deepEqual(report.errors,[]);assert.deepEqual(report.externalRequests,[]);});
 }catch(error){report.checks.push({name:'Browser execution',pass:false,error:error.stack||error.message});}
 finally{await browser.close();}
 report.ok=report.checks.every(c=>c.pass)&&!report.errors.length&&!report.externalRequests.length;
 fs.writeFileSync(path.join(root,'qa-output/atac/3d-report.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({ok:report.ok,checks:report.checks.length,frames:report.frames.length,originSamples:report.originSamples?.length,failures:report.checks.filter(c=>!c.pass),errors:report.errors},null,2));
 if(!report.ok)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1;});
