#!/usr/bin/env node
'use strict';
/* Independent source/contour regression of the assembled fragment-origin explanation. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {pathToFileURL}=require('node:url'),pw=require('playwright');
const root=path.resolve(__dirname,'../..'),artifact=path.join(root,'dist/lesson.html'),out=path.join(root,'qa-output/atac/origin');
const checks=[],check=(name,fn)=>{try{const detail=fn();checks.push({name,pass:true,...(detail?{detail}:{})});}catch(e){checks.push({name,pass:false,error:e.message});}};
const edgeLengths=p=>p.slice(1).map((q,i)=>Math.hypot(...q.map((v,k)=>v-p[i][k])));
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await require('../trna/browser.cjs').launch(pw),page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(pathToFileURL(artifact).href+'?lang=ru&qa=origin');await page.waitForFunction(()=>window.ATAC_FILM?.actors?.origin);await page.evaluate(()=>CINEMA.pause());
  await require('./lib.cjs').assertDefaultRoute(page);
  const initial=await page.evaluate(()=>{
   window.originQaActor=ATAC_FILM.actors.origin;
   window.originSourceBefore=JSON.stringify([AtacStructures,AtacHistoneCoreData]);
   window.originNodes=[...originQaActor.g.querySelectorAll('*')];
   const value=originQaActor.paint({visibility:1,stage:1,turn:0}),g=originQaActor.g,core=g.querySelector('[data-origin-part="histone-core"]');
   const visible=n=>{let a=1;while(n?.nodeType===1){const s=getComputedStyle(n);a*=+s.opacity;if(s.display==='none'||s.visibility==='hidden')return false;n=n.parentElement;}return a>.1;};
   const source=AtacStructures.nucleosome,chains=new Map(source.chains.map(c=>[c.id,c])),f=AtacHistoneCoreData.frame;
   const transform=p=>f.rotation.map((r,k)=>r.reduce((a,v,i)=>a+v*p[i],0)*f.scale+f.translation[k]);
   const expected=source.basePairs.map(pair=>[transform(chains.get(pair.chainA).points[pair.indexA]),transform(chains.get(pair.chainB).points[pair.indexB])]);
   return {value,expected,ellipses:core.querySelectorAll('ellipse').length,chains:[...new Set([...core.querySelectorAll('[data-histone-chain]')].filter(visible).map(n=>n.dataset.histoneChain))],uncertain:[...core.querySelectorAll('[data-zero-occupancy="true"] path')].filter(visible).map(n=>n.getAttribute('stroke-dasharray')),sourceEdges:[...g.querySelectorAll('[data-origin-source-chain]')].map(n=>({chain:n.dataset.originSourceChain,start:+n.dataset.sourceStartIndex,end:+n.dataset.sourceEndIndex,path:n.getAttribute('d')})),count:originNodes.length};
  });
  check('The nucleosome contains eight visible deposited histone chains and no smooth ellipse',()=>{assert.equal(initial.ellipses,0);assert.deepEqual(initial.chains.sort(),['C','D','E','F','G','H','I','J']);});
  check('Zero-occupancy terminal coordinates retain dashed uncertainty',()=>{assert(initial.uncertain.length>0);assert(initial.uncertain.every(d=>d&&/\d/.test(d)));});
  check('Both full source-indexed 1KX5 strands are present',()=>{for(const chain of ['A','B']){const edges=initial.sourceEdges.filter(e=>e.chain===chain);assert.equal(edges.length,146);assert.deepEqual([...new Set(edges.flatMap(e=>[e.start,e.end]))].sort((a,b)=>a-b),Array.from({length:147},(_,i)=>i));}});
  check('Wrapped DNA vertices match the same rigid source frame as the protein',()=>{const q=initial.value.geometry.find(x=>x.id==='spanning-nucleosome');assert.equal(q.source,'1KX5');assert.equal(q.sourcePairs,147);let max=0;for(let i=0;i<147;i++)for(let strand=0;strand<2;strand++){const a=q.sourceStrands[strand][i],b=initial.expected[i][strand];max=Math.max(max,Math.hypot(...a.map((v,k)=>v-b[k])));}assert(max<1e-8);return {maxSourceError:max};});
  check('Actual drawn C4-prime knots follow a rigid projection of the source',()=>{
   const centers=initial.expected.map(pair=>pair[0].map((v,k)=>(v+pair[1][k])/2)),unit=v=>v.map(x=>x/Math.hypot(...v));
   const first=centers[0],last=centers.at(-1),ta=unit(centers[1].map((v,k)=>v-first[k])),tb=unit(last.map((v,k)=>v-centers.at(-2)[k]));
   const points=[first.map((v,k)=>v-70*ta[k]),...centers,last.map((v,k)=>v+70*tb[k])];
   const center=[0,1,2].map(k=>(Math.min(...points.map(p=>p[k]))+Math.max(...points.map(p=>p[k])))/2);
   const project=point=>{const q=point.map((v,k)=>v-center[k]),x=-q[1],y=q[0],X=x*Math.cos(-.18)+q[2]*Math.sin(-.18),Z=-x*Math.sin(-.18)+q[2]*Math.cos(-.18),Y=-Math.cos(.3)*y+Math.sin(.3)*Z;return [875+1.35*X,405+1.35*Y];};
   let max=0;
   for(const edge of initial.sourceEdges){const v=edge.path.match(/-?\d+(?:\.\d+)?(?:e[-+]?\d+)?/gi).map(Number);for(const [index,drawn]of [[edge.start,v.slice(0,2)],[edge.end,v.slice(2,4)]]){const sourceIndex=edge.chain==='A'?index:146-index,expected=project(initial.expected[sourceIndex][edge.chain==='A'?0:1]);max=Math.max(max,Math.hypot(drawn[0]-expected[0],drawn[1]-expected[1]));}}
   assert(max<1e-7,'Rendered source error '+max);return {maximumProjectedError:max};
  });
  const early=await page.evaluate(()=>{const s=originQaActor.paint({visibility:1,stage:.15});return {s,visible:+getComputedStyle(originQaActor.g).opacity,short:+getComputedStyle(originQaActor.g.querySelector('[data-origin-molecule="short"]')).opacity};});
  check('The entering explanation retains the short insert while introducing the second example',()=>{assert(early.visible>.99);assert(early.short>.9);assert.equal(early.s.geometry.length,2);});
  let baseline=null,maxEdgeError=0;
  for(let i=0;i<=32;i++){
   const stage=1+i/32;
   const v=await page.evaluate(stage=>{const s=originQaActor.paint({visibility:1,stage});const core=originQaActor.g.querySelector('[data-origin-part="histone-core"]'),inverse=originQaActor.g.getScreenCTM().inverse(),visible=n=>{let a=1;while(n?.nodeType===1){a*=+getComputedStyle(n).opacity;n=n.parentElement;}return a>.05;},points=[...originQaActor.g.querySelectorAll('[data-origin-molecule] path')].filter(visible).flatMap(n=>{const b=n.getBBox(),m=inverse.multiply(n.getScreenCTM());return [[b.x,b.y],[b.x+b.width,b.y+b.height]].map(p=>new DOMPoint(...p).matrixTransform(m));});return {...s,coreOpacity:+getComputedStyle(core).opacity,bounds:{minX:Math.min(...points.map(p=>p.x)),maxX:Math.max(...points.map(p=>p.x)),minY:Math.min(...points.map(p=>p.y)),maxY:Math.max(...points.map(p=>p.y))}};},stage);
   if(!baseline)baseline=v.geometry.map(g=>edgeLengths(g.centerline));
   check('Contour preserved at stage '+stage.toFixed(4),()=>{assert.equal(v.geometry.length,2);v.geometry.forEach((g,j)=>{const edges=edgeLengths(g.centerline);assert.equal(edges.length,baseline[j].length);edges.forEach((n,k)=>{const error=Math.abs(n-baseline[j][k]);maxEdgeError=Math.max(maxEdgeError,error);assert(error<1e-8);});});if(v.unroll>0)assert.equal(v.coreOpacity,0);});
   check('Visible molecules fit the drawing field at stage '+stage.toFixed(4),()=>{const b=v.bounds;assert(b.minX>=60&&b.maxX<=1220&&b.minY>=201&&b.maxY<=554,JSON.stringify(b));return b;});
  }
  const final=await page.evaluate(async()=>{
   const a=originQaActor.paint({visibility:1,stage:1}),first=JSON.stringify(a);originQaActor.paint({visibility:1,stage:2});const replay=JSON.stringify(originQaActor.paint({visibility:1,stage:1}));
   const now=[...originQaActor.g.querySelectorAll('*')],layout=await L.ready(originQaActor.g);
   return {persistent:now.length===originNodes.length&&originNodes.every(n=>now.includes(n)),immutable:originSourceBefore===JSON.stringify([AtacStructures,AtacHistoneCoreData]),repeatable:first===replay,issues:layout.issues};
  });
  check('Source arrays are immutable, nodes persist, and seeking reproduces the same geometry',()=>{assert(final.persistent);assert(final.immutable);assert(final.repeatable);});
  check('Text contracts remain valid',()=>assert.deepEqual(final.issues,[]));
  for(const mode of ['ru','en']){
   await page.evaluate(async lang=>{D.i18n.setLang(lang);CINEMA.seek(ATAC_FILM.cues.find(c=>c.key==='nucleosomal-origin').time);originQaActor.paint({visibility:1,stage:1});await L.ready(D.deck.root());},mode);
   await page.screenshot({path:path.join(out,mode+'-nucleosome.png')});
  }
  check('No browser errors',()=>assert.deepEqual(errors,[]));
  const report={ok:checks.every(c=>c.pass),artifactSha256:crypto.createHash('sha256').update(fs.readFileSync(artifact)).digest('hex'),checks,maxEdgeError,errors};
  fs.writeFileSync(path.join(root,'qa-output/atac/origin-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({...report,checks:checks.length,failures:checks.filter(c=>!c.pass)},null,2));if(!report.ok)process.exitCode=1;
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
