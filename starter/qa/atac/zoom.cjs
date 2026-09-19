#!/usr/bin/env node
'use strict';
/* Independently inspect the rendered camera transforms and the hand-off from
 * the authored nucleosome to the experimental coordinate representation. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),pw=require('playwright');
const root=path.resolve(__dirname,'../..'),artifact=path.join(root,'dist/lesson.html');
const output=path.join(root,'qa-output/atac/zoom');fs.mkdirSync(output,{recursive:true});
const near=(a,b,tolerance=1e-6)=>Math.abs(a-b)<=tolerance;
const point=(m,p)=>[m.a*p[0]+m.c*p[1]+m.e,m.b*p[0]+m.d*p[1]+m.f];
const norm=(a,b)=>Math.hypot(...a.map((n,i)=>n-b[i]));
const diagonal=(m,b)=>norm(point(m,[b.minX,b.minY]),point(m,[b.maxX,b.maxY]));
const identity=m=>[m.a,m.b,m.c,m.d,m.e,m.f].every((n,i)=>near(n,[1,0,0,1,0,0][i]));
(async()=>{
 const report={artifactSha256:crypto.createHash('sha256').update(fs.readFileSync(artifact)).digest('hex'),checks:[],samples:[],modes:[],errors:[],external:[]};
 const check=(name,fn)=>{try{fn();report.checks.push({name,pass:true});}catch(e){report.checks.push({name,pass:false,error:e.message});}};
 const browser=await require('../trna/browser.cjs').launch(pw),page=await browser.newPage({viewport:{width:1440,height:900}});
 page.on('pageerror',e=>report.errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))report.external.push(r.url());});
 try{
  await page.goto(pathToFileURL(artifact).href+'?lang=ru&qa=nucleosome-zoom');await page.waitForFunction(()=>window.ATAC_FILM?.snapshot&&window.CINEMA);
  await require('./lib.cjs').assertDefaultRoute(page);
  const setup=await page.evaluate(()=>{
   CINEMA.pause();D.i18n.setLang('ru');D.appearance.set({font:'sans',background:'black',palette:'ocean'});
   window.zoomSources=JSON.stringify(AtacStructures);
   window.zoomNodes=Object.fromEntries(['chromatin','structure'].map(k=>[k,[...ATAC_FILM.actors[k].g.querySelectorAll('g,path,line,circle,ellipse,rect')]]));
   return{duration:ATAC_FILM.duration,cues:ATAC_FILM.cues.map(c=>({key:c.key,time:c.time,arrive:c.arrive,motion:c.motion,hold:c.hold}))};
  });
  const cues=new Map(setup.cues.map(c=>[c.key,c])),cue=cues.get('nucleosome-real');
  check('The expanded camera movement preserves the 46-cue, 240.6-second film',()=>{assert.equal(setup.cues.length,46);assert(near(setup.duration,240.6));assert(near(cue.motion,3.2));assert(near(cue.hold,1.8));});
  async function frame(time){return await page.evaluate(async time=>{
   CINEMA.seek(time);const audit=await L.ready(D.deck.root()),s=ATAC_FILM.snapshot;
   const matrix=n=>{const m=n.transform.baseVal.consolidate()?.matrix||new DOMMatrix();return{a:m.a,b:m.b,c:m.c,d:m.d,e:m.e,f:m.f};};
   const opacity=n=>{let a=1;while(n?.nodeType===1){const q=getComputedStyle(n);if(q.display==='none'||q.visibility==='hidden')return 0;a*=+q.opacity;n=n.parentElement;}return a;};
   const chrom=ATAC_FILM.actors.chromatin.g,structure=ATAC_FILM.actors.structure.g;
   const molecular=structure.querySelector('[data-pdb="1KX5"]').parentElement;
   const boxes=nodes=>{const bs=nodes.map(n=>n.getBBox());return{minX:Math.min(...bs.map(b=>b.x)),maxX:Math.max(...bs.map(b=>b.x+b.width)),minY:Math.min(...bs.map(b=>b.y)),maxY:Math.max(...bs.map(b=>b.y+b.height))};};
   const authored=boxes([...chrom.querySelectorAll('path[data-bio-part^="dna-strand"]')].filter(n=>+n.dataset.bpStart>=276&&+n.dataset.bpEnd<=423));
   const experimental=boxes([...structure.querySelectorAll('[data-pdb="1KX5"] g[data-kind="dna"]')]);
   const labels=[...structure.querySelectorAll('[data-layout-id]')].map(n=>{const r=n.getBoundingClientRect();return{text:n.textContent,x:r.x,y:r.y,width:r.width,height:r.height,opacity:opacity(n),insideMolecular:molecular.contains(n)};});
   const stable=Object.entries(zoomNodes).every(([k,nodes])=>{const now=[...ATAC_FILM.actors[k].g.querySelectorAll('g,path,line,circle,ellipse,rect')];return now.length===nodes.length&&nodes.every(n=>now.includes(n));});
   const invalid=[chrom,structure].flatMap(n=>[...n.querySelectorAll('*')]).filter(n=>['d','x','y','cx','cy','transform'].some(k=>/NaN|Infinity/.test(n.getAttribute(k)||''))).length;
   const annotations=[...D.deck.root().querySelectorAll('[data-atac-annotation]')].map(n=>({id:n.dataset.atacAnnotation,opacity:opacity(n)}));
   return{time,key:s.key,bridge:s.zoomBridge,chromatinMatrix:matrix(chrom.querySelector('[data-chromatin-camera]')),structureMatrix:matrix(molecular),authoredBounds:authored,experimentalBounds:experimental,chromatinOpacity:opacity(chrom),structureOpacity:opacity(structure),annotations,labels,stable,invalid,issues:audit.issues,immutable:zoomSources===JSON.stringify(AtacStructures)};
  },time);}
  const before=await frame(cues.get('nucleosome').time);
  for(let i=0;i<17;i++){
   const row=await frame(cue.arrive+cue.motion*i/16);report.samples.push(row);
   check(`Zoom sample ${i+1}/17: persistent source geometry and safe SVG`,()=>{assert(row.stable);assert(row.immutable);assert.equal(row.invalid,0);assert.equal(row.issues.length,0);assert(row.bridge);assert.equal(row.bridge.selectedBp,350);});
   check(`Zoom sample ${i+1}/17: both envelopes share rendered center and scale`,()=>{
    const b=row.bridge,a=point(row.chromatinMatrix,b.source.center),d=point(row.structureMatrix,b.destination.center);
    assert(norm(a,d)<.002,JSON.stringify({a,d}));assert(norm(a,b.center)<.002);
    const da=diagonal(row.chromatinMatrix,b.source.bounds),dd=diagonal(row.structureMatrix,b.destination.bounds);
    assert(Math.abs(da-dd)<.01,JSON.stringify({da,dd}));
    // Independently compare the actual path envelopes. Subpixel tolerances
    // account for rounded path coordinates and PDB cubic interpolation
    // extending slightly beyond its registered source-coordinate envelope.
    const ac=point(row.chromatinMatrix,[(row.authoredBounds.minX+row.authoredBounds.maxX)/2,(row.authoredBounds.minY+row.authoredBounds.maxY)/2]);
    const dc=point(row.structureMatrix,[(row.experimentalBounds.minX+row.experimentalBounds.maxX)/2,(row.experimentalBounds.minY+row.experimentalBounds.maxY)/2]);
    const actualA=diagonal(row.chromatinMatrix,row.authoredBounds),actualD=diagonal(row.structureMatrix,row.experimentalBounds);
    row.renderedCenterError=norm(ac,dc);row.renderedDiagonalError=Math.abs(actualA-actualD);
    assert(row.renderedCenterError<.25,'Rendered DNA centers diverge by >=0.25 SVG pixel: '+row.renderedCenterError);
    assert(row.renderedDiagonalError<.75,'Rendered DNA diagonals differ by >=0.75 SVG pixel: '+row.renderedDiagonalError);
   });
   check(`Zoom sample ${i+1}/17: no empty interval and stationary delayed labels`,()=>{
    const b=row.bridge;assert(near(row.chromatinOpacity+row.structureOpacity,1,1e-5));assert(Math.max(row.chromatinOpacity,row.structureOpacity)>=.5);
    assert(row.labels.every(l=>!l.insideMolecular));
    if(b.progress<=.78)assert(row.labels.every(l=>l.opacity<.001),'Details precede completed focus');
    if(b.progress>=.28)assert(row.annotations.every(l=>l.opacity<.001),'Outgoing schematic labels remain over zoom');
    if(b.progress<.48)assert.equal(row.structureOpacity,0,'PDB dissolves before the zoom establishes focus');
   });
   if(i%4===0)await page.screenshot({path:path.join(output,`zoom-${String(i).padStart(2,'0')}.png`)});
  }
  check('Center and magnification progress monotonically without a camera cut',()=>{
   const rows=report.samples;
   for(let i=1;i<rows.length;i++){
    const a=rows[i-1].bridge,b=rows[i].bridge;
    assert(b.scale>=a.scale&&b.structureScale>=a.structureScale);assert(b.center[0]>=a.center[0]);
    assert(norm(a.center,b.center)<22);
    assert(b.replacement>=a.replacement&&b.detail>=a.detail);
   }
   const first=rows[0],last=rows.at(-1);assert(identity(first.chromatinMatrix));assert(identity(last.structureMatrix));
   assert(near(first.chromatinOpacity,1)&&near(first.structureOpacity,0));assert(near(last.chromatinOpacity,0)&&near(last.structureOpacity,1));
  });
  check('Text geometry remains fixed throughout the molecular enlargement',()=>{
   const reference=report.samples[0].labels;
   for(const row of report.samples)row.labels.forEach((l,i)=>{for(const k of ['x','y','width','height'])assert(near(l[k],reference[i][k],.01),l.text+' moved');});
  });
  for(const u of [0,.12,.28,.48,.67,.78,.88,1]){
   const t=cue.arrive+cue.motion*u,lo=await frame(t-.0001),hi=await frame(t+.0001);
   check(`Camera is continuous across phase boundary ${u}`,()=>{
    for(const [row,other,key,bounds]of [[lo,hi,'chromatinMatrix',report.samples[0].bridge.source.bounds],...(u===0?[]:[[lo,hi,'structureMatrix',report.samples[0].bridge.destination.bounds]])]){
     for(const p of [[bounds.minX,bounds.minY],[bounds.maxX,bounds.maxY]])assert(norm(point(row[key],p),point(other[key],p))<.05,'A camera discontinuity occurs at '+u);
    }
    assert(Math.abs(lo.chromatinOpacity-hi.chromatinOpacity)<.001);assert(Math.abs(lo.structureOpacity-hi.structureOpacity)<.001);
   });
  }
  // Replaying in reverse must restore even actors that are currently hidden.
  for(const time of [cues.get('histone-octamer').time,cue.arrive+cue.motion*.75,cues.get('nucleosome').time,cue.time,cue.arrive+cue.motion*.25,cues.get('nucleosome').time,cues.get('histone-octamer').time]){
   const row=await frame(time);check(`Reverse seek at ${time.toFixed(3)}s restores the requested representation`,()=>{
    assert(row.stable&&row.immutable);assert.equal(row.invalid,0);
    if(row.key!=='nucleosome-real'){assert.equal(row.bridge,null);assert(identity(row.chromatinMatrix));assert(identity(row.structureMatrix));}
    if(row.key==='nucleosome'){assert.deepEqual(row.authoredBounds,before.authoredBounds);assert(near(row.chromatinOpacity,1));assert.equal(row.structureOpacity,0);}
   });
  }
  for(const lang of ['ru','en'])for(const font of ['sans','serif'])for(const background of ['black','white']){
   await page.evaluate(([lang,font,background])=>{D.i18n.setLang(lang);D.appearance.set({font,background,palette:'ocean'});},[lang,font,background]);
   for(const u of [.25,.625,.875,1]){
    const row=await frame(cue.arrive+cue.motion*u);report.modes.push({lang,font,background,progress:u,issues:row.issues});
    check(`${lang}/${font}/${background} at ${u}: text and registration survive appearance changes`,()=>{assert.equal(row.issues.length,0);assert(row.stable&&row.immutable);assert.equal(row.invalid,0);assert(norm(point(row.chromatinMatrix,row.bridge.source.center),point(row.structureMatrix,row.bridge.destination.center))<.002);});
   }
  }
  // A reusable route may start at this representation: its first cue has
  // zero camera duration and must render the settled PDB view immediately.
  const remix=await browser.newPage({viewport:{width:1440,height:900}});
  remix.on('pageerror',e=>report.errors.push(e.message));
  await remix.addInitScript(()=>{window.ATAC_FILM_CONFIG={route:['nucleosome-real','histone-octamer']};});
  await remix.goto(pathToFileURL(artifact).href+'?lang=ru&qa=nucleosome-zero-motion');
  await remix.waitForFunction(()=>window.ATAC_FILM?.snapshot&&window.CINEMA);
  report.zeroMotion=await remix.evaluate(()=>{
   CINEMA.pause();const s=ATAC_FILM.snapshot,a=ATAC_FILM.actors.structure.g,m=a.querySelector('[data-pdb="1KX5"]').parentElement.transform.baseVal.consolidate().matrix;
   return{key:s.key,source:s.structure.source,motion:ATAC_FILM.cues[0].motion,progress:s.zoomBridge?.progress,opacity:+getComputedStyle(a).opacity,matrix:{a:m.a,b:m.b,c:m.c,d:m.d,e:m.e,f:m.f},invalid:[...D.deck.root().querySelectorAll('svg *')].filter(n=>['d','x','y','cx','cy','transform'].some(k=>/NaN|Infinity/.test(n.getAttribute(k)||''))).length};
  });
  check('A route starting at nucleosome-real handles motion=0 as a settled experimental view',()=>{
   const z=report.zeroMotion;assert.equal(z.key,'nucleosome-real');assert.equal(z.motion,0);assert.equal(z.progress,1);assert.equal(z.source,'1KX5');assert.equal(z.opacity,1);assert(identity(z.matrix));assert.equal(z.invalid,0);
  });
  await remix.close();
  check('No browser errors or external requests',()=>{assert.deepEqual(report.errors,[]);assert.deepEqual(report.external,[]);});
 }catch(error){report.checks.push({name:'Browser execution',pass:false,error:error.stack||error.message});}
 finally{await browser.close();}
 report.maximumRenderedCenterError=Math.max(...report.samples.map(r=>r.renderedCenterError||0));report.maximumRenderedDiagonalError=Math.max(...report.samples.map(r=>r.renderedDiagonalError||0));
 report.ok=report.checks.every(c=>c.pass);fs.writeFileSync(path.join(root,'qa-output/atac/zoom-report.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({ok:report.ok,checks:report.checks.length,samples:report.samples.length,appearanceFrames:report.modes.length,maximumRenderedCenterError:report.maximumRenderedCenterError,maximumRenderedDiagonalError:report.maximumRenderedDiagonalError,failures:report.checks.filter(c=>!c.pass)},null,2));if(!report.ok)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
