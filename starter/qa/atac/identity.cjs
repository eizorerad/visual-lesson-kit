#!/usr/bin/env node
'use strict';
// Compare the rendered source-indexed polymer vertices, not envelopes or
// camera-registration metadata. This catches a dissolve between different
// shapes even when the two drawing bounds coincide exactly.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),pw=require('playwright');
const root=path.resolve(__dirname,'../..');
const artifact=path.resolve(process.argv[2]||path.join(root,'dist/lesson.html'));
const output=path.resolve(process.argv[3]||path.join(root,'qa-output/atac/identity'));
fs.mkdirSync(output,{recursive:true});
(async()=>{
 const report={artifact,artifactSha256:crypto.createHash('sha256').update(fs.readFileSync(artifact)).digest('hex'),checks:[],samples:[],negativeControls:[],errors:[],external:[]};
 const check=(name,fn)=>{try{const detail=fn();report.checks.push({name,pass:true,...(detail?{detail}:{})});}catch(e){report.checks.push({name,pass:false,error:e.message});}};
 const browser=await require('../trna/browser.cjs').launch(pw),page=await browser.newPage({viewport:{width:1440,height:900}});
 page.on('pageerror',e=>report.errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))report.external.push(r.url());});
 try{
  await page.goto(pathToFileURL(artifact).href+'?lang=ru&qa=nucleosome-identity');
  await page.waitForFunction(()=>window.ATAC_FILM?.snapshot&&window.CINEMA);
  await require('./lib.cjs').assertDefaultRoute(page);
  const setup=await page.evaluate(()=>{
   CINEMA.pause();D.i18n.setLang('ru');D.appearance.set({font:'sans',background:'black',palette:'ocean'});
   window.identitySources=JSON.stringify([AtacStructures,AtacHistoneCoreData,AtacData]);
   window.identityNodes=[ATAC_FILM.actors.chromatin.g,ATAC_FILM.actors.structure.g].flatMap(g=>[...g.querySelectorAll('*')]);
   window.inspectNucleosomeIdentity=()=>{
    const cg=ATAC_FILM.actors.chromatin.g,sg=ATAC_FILM.actors.structure.g;
    const svg=cg.ownerSVGElement,inv=svg.getScreenCTM().inverse();
    const convert=(node,p)=>{const m=inv.multiply(node.getScreenCTM());return[m.a*p[0]+m.c*p[1]+m.e,m.b*p[0]+m.d*p[1]+m.f];};
    const opacity=n=>{let a=1;while(n?.nodeType===1){const s=getComputedStyle(n);if(s.display==='none'||s.visibility==='hidden')return 0;a*=+s.opacity;n=n.parentElement;}return a;};
    // Drawn source paths use M/L or cubic C segments. The final coordinate
    // of each C is the retained source vertex, not its Bezier control points.
    const vertices=n=>{const result=[];for(const match of(n?.getAttribute('d')||'').matchAll(/([MLC])\s*([^MLCZ]+)/gi)){const a=match[2].match(/[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi)?.map(Number)||[];const step=match[1].toUpperCase()==='C'?6:2;for(let i=0;i+step<=a.length;i+=step)result.push(convert(n,[a[i+step-2],a[i+step-1]]));}return result;};
    const cartMap=g=>{const map={};if(g)for(const n of g.querySelectorAll('[data-histone-part]')){const key=n.dataset.histoneChain+':'+n.dataset.proteinCartoon+':'+n.dataset.histonePart;map[key]=vertices(n.querySelector('path'));}return map;};
    const overviewCore=cg.querySelector('[data-genomic-center="350"]');
    const structureCore=sg.querySelector('[data-structure-histone-cartoon]');
    const proteinA=cartMap(overviewCore),proteinB=cartMap(structureCore);
    const dnaA={},dnaB={};
    const overviewPaths=[...cg.querySelectorAll('path[data-bio-part^="dna-strand"]')].filter(n=>+n.dataset.bpStart>=276&&+n.dataset.bpEnd<=423);
    for(const n of overviewPaths){const points=vertices(n),chain=n.dataset.sourceChain;for(const [vertex,index]of JSON.parse(n.dataset.sourceVertexMap||'[]'))if(points[vertex]&&chain)dnaA[chain+':'+index]=points[vertex];}
    for(const n of sg.querySelectorAll('[data-pdb="1KX5"] g[data-kind="dna"]')){const points=vertices(n.querySelector('path'));const first=+n.dataset.startIndex;for(let i=0;i<points.length;i++)dnaB[n.dataset.chain+':'+(first+i)]=points[i];}
    const compare=(a,b,filter=()=>true)=>{let sum=0,max=0,count=0,missing=[];for(const key of Object.keys(a).filter(filter)){if(!b[key]||a[key].length!==b[key].length){missing.push(key);continue;}const ap=Array.isArray(a[key][0])?a[key]:[a[key]],bp=Array.isArray(b[key][0])?b[key]:[b[key]];for(let i=0;i<ap.length;i++){const d=Math.hypot(ap[i][0]-bp[i][0],ap[i][1]-bp[i][1]);sum+=d*d;max=Math.max(max,d);count++;}}return{count,rms:count?Math.sqrt(sum/count):null,max,missing};};
    const nearCloud=(a,b)=>{if(!a.length||!b.length)return null;const mean=(x,y)=>x.reduce((sum,p)=>sum+Math.min(...y.map(q=>(p[0]-q[0])**2+(p[1]-q[1])**2)),0)/x.length;return Math.sqrt((mean(a,b)+mean(b,a))/2);};
    const cloudA=overviewPaths.flatMap(vertices),cloudB=Object.values(dnaB);
    const protein={all:compare(proteinA,proteinB),helix:compare(proteinA,proteinB,k=>k.includes(':helix:')),tail:compare(proteinA,proteinB,k=>k.includes(':tail:'))};
    const dna=compare(dnaA,dnaB);
    const invalid=[cg,sg].flatMap(g=>[...g.querySelectorAll('*')]).filter(n=>['d','transform','x','y','cx','cy'].some(k=>/NaN|Infinity/.test(n.getAttribute(k)||''))).length;
    const immutable=identitySources===JSON.stringify([AtacStructures,AtacHistoneCoreData,AtacData]);
    const stable=identityNodes.every(n=>n.isConnected)&&identityNodes.length===[cg,sg].flatMap(g=>[...g.querySelectorAll('*')]).length;
    return{key:ATAC_FILM.snapshot.key,chromatinOpacity:opacity(cg),structureOpacity:opacity(sg),protein,dna,dnaCloudRms:nearCloud(cloudA,cloudB),cartoonPresent:!!structureCore,sourceDnaKeys:Object.keys(dnaA).length,experimentalDnaKeys:Object.keys(dnaB).length,immutable,stable,invalid,signature:JSON.stringify({proteinA,proteinB,dnaA,dnaB,ca:opacity(cg),sa:opacity(sg)})};
   };
   return{duration:ATAC_FILM.duration,cues:ATAC_FILM.cues.map(c=>({key:c.key,time:c.time,arrive:c.arrive,motion:c.motion}))};
  });
  const cues=new Map(setup.cues.map(c=>[c.key,c])),entry=cues.get('nucleosome-real'),exit=cues.get('linker');
  check('The film remains 46 cues and 240.6 seconds',()=>{assert.equal(setup.cues.length,46);assert(Math.abs(setup.duration-240.6)<1e-8);});
  async function frame(time){return page.evaluate(async time=>{CINEMA.seek(time);await L.ready(D.deck.root());return{time,...inspectNucleosomeIdentity()};},time);}
  const goodIdentity=row=>{assert(row.cartoonPresent,'Experimental close-up replaces the overview cartoon with another representation');assert(row.protein.helix.count>=72,'Missing corresponding deposited helix endpoints');assert(row.protein.tail.count>=100,'Missing corresponding terminal-chain vertices');for(const part of ['all','helix','tail']){assert.equal(row.protein[part].missing.length,0);assert(row.protein[part].rms<=.1,part+' RMS is '+row.protein[part].rms+' SVG px');assert(row.protein[part].max<=.2,part+' max mismatch is '+row.protein[part].max+' SVG px');}assert.equal(row.sourceDnaKeys,294,'Overview must contain every retained source C4-prime vertex');assert.equal(row.experimentalDnaKeys,294);assert.equal(row.dna.missing.length,0);assert.equal(row.dna.count,294);assert(row.dna.rms<=.1,'DNA RMS is '+row.dna.rms+' SVG px');assert(row.dna.max<=.2,'DNA max mismatch is '+row.dna.max+' SVG px');};
  const saved=[];
  for(const [key,cue,us]of [['entry',entry,Array.from({length:21},(_,i)=>i/20)],['return',exit,Array.from({length:13},(_,i)=>.4+i*.6/12)]])for(const u of us){
   const row=await frame(cue.arrive+cue.motion*u),signature=row.signature;delete row.signature;report.samples.push({transition:key,progress:u,...row});saved.push({time:row.time,signature});
   check(`${key} ${u.toFixed(2)}: immutable source and persistent finite drawing`,()=>{assert(row.immutable&&row.stable);assert.equal(row.invalid,0);});
   if(Math.min(row.chromatinOpacity,row.structureOpacity)>.001)check(`${key} ${u.toFixed(2)}: each visible deposited vertex preserves identity`,()=>goodIdentity(row));
  }
  for(const u of [0,.25,.5,.625,.75,1]){
   const row=await frame(entry.arrive+entry.motion*u);if(u===1)check('Final overview retains the same protein cartoon and complete source DNA',()=>{assert(row.cartoonPresent);assert.equal(row.sourceDnaKeys,294);assert.equal(row.experimentalDnaKeys,294);});
   await page.screenshot({path:path.join(output,`entry-${String(Math.round(u*1000)).padStart(4,'0')}.png`)});
  }
  for(const sample of saved.reverse()){const row=await frame(sample.time);check(`Reverse seek reproduces every drawn source vertex at ${sample.time.toFixed(3)} s`,()=>{assert(row.immutable&&row.stable);assert.equal(row.signature,sample.signature);});}
  // Deliberate drawing changes bypass all camera and registration metadata.
  // The independent DOM-vertex oracle must notice either defect.
  await frame(entry.arrive+entry.motion*.625);
  const negative=await page.evaluate(()=>{
   const sg=ATAC_FILM.actors.structure.g,n=sg.querySelector('[data-structure-histone-cartoon]');
   if(!n)return{available:false};
   const old=n.getAttribute('transform');n.setAttribute('transform',(old||'')+' translate(5 0)');const protein=inspectNucleosomeIdentity().protein.all;
   if(old===null)n.removeAttribute('transform');else n.setAttribute('transform',old);
   const path=sg.querySelector('[data-pdb="1KX5"] [data-kind="dna"][data-chain="A"][data-start-index="0"] > path:first-child'),d=path.getAttribute('d');
   path.setAttribute('d',d.replace(/^M([-+.\d]+),/,(_,x)=>'M'+(+x+10)+','));const dna=inspectNucleosomeIdentity().dna;path.setAttribute('d',d);
   return{available:true,protein:{rms:protein.rms,rejected:protein.rms>.1},dna:{rms:dna.rms,rejected:dna.rms>.1}};
  });
  report.negativeControls=negative;
  check('Independent oracle rejects a displaced protein cartoon and a displaced DNA vertex',()=>{assert(negative.available);assert(negative.protein.rejected);assert(negative.dna.rejected);});
  check('No browser errors or network requests',()=>{assert.deepEqual(report.errors,[]);assert.deepEqual(report.external,[]);});
  const contact=await browser.newPage({viewport:{width:1440,height:952}});
  const images=[0,250,500,625,750,1000].map(n=>`<article><header>${n/10}%</header><img src="data:image/png;base64,${fs.readFileSync(path.join(output,'entry-'+String(n).padStart(4,'0')+'.png')).toString('base64')}"></article>`).join('');
  await contact.setContent('<style>body{margin:0;background:#191c21;color:white;font:18px sans-serif;display:grid;grid-template-columns:1fr 1fr;gap:6px}article{min-width:0}header{padding:3px 10px}img{width:100%;display:block}</style>'+images);
  await contact.screenshot({path:path.join(output,'contact.png'),fullPage:true});await contact.close();
 }catch(error){report.checks.push({name:'Browser execution',pass:false,error:error.stack||error.message});}
 finally{await browser.close();}
 report.ok=report.checks.every(c=>c.pass);report.failureCount=report.checks.filter(c=>!c.pass).length;
 fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({ok:report.ok,checks:report.checks.length,samples:report.samples.length,failureCount:report.failureCount,failures:report.checks.filter(c=>!c.pass)},null,2));if(!report.ok)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1;});
