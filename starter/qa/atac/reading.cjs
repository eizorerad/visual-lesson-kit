#!/usr/bin/env node
'use strict';
/* Independent SVG audit of the paired-end synthesis explanation. Coordinates
 * are a teaching schematic; this does not validate molecular dynamics or an
 * instrument simulation. The oracle reads rendered paths, shafts and tips. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),pw=require('playwright');
const root=path.resolve(__dirname,'../..'),artifact=path.join(root,'dist/lesson.html');
const output=path.join(root,'qa-output/atac/reading'),epsilon=2e-4;
const close=(a,b,t=epsilon)=>Math.abs(a-b)<=t;
const samePoint=(a,b)=>close(a.x,b.x)&&close(a.y,b.y);
const finite=value=>{if(typeof value==='number')assert(Number.isFinite(value),'Nonfinite geometry');else if(value&&typeof value==='object')Object.values(value).forEach(finite);};
fs.mkdirSync(output,{recursive:true});
(async()=>{
 const report={artifactSha256:crypto.createHash('sha256').update(fs.readFileSync(artifact)).digest('hex'),checks:[],frames:[],growthSamples:[],handoffSamples:[],sourceErrors:[],drawingErrors:[],errors:[],externalRequests:[]};
 const browser=await require('../trna/browser.cjs').launch(pw),page=await browser.newPage({viewport:{width:1440,height:900}});
 const check=(name,kind,fn)=>{try{const detail=fn();report.checks.push({name,pass:true,...(detail?{detail}:{})});}catch(error){const result={name,pass:false,error:error.message};report.checks.push(result);report[kind==='source'?'sourceErrors':'drawingErrors'].push(result);}};
 page.on('pageerror',error=>report.errors.push(error.message));page.on('request',req=>{if(/^https?:/.test(req.url()))report.externalRequests.push(req.url());});
 try{
  await page.goto(pathToFileURL(artifact).href+'?lang=ru&qa=reading');await page.waitForFunction(()=>window.ATAC_FILM?.actors?.reads&&window.CINEMA);
  await require('./lib.cjs').assertDefaultRoute(page);
  const setup=await page.evaluate(()=>{
   CINEMA.pause();D.i18n.setLang('ru');D.appearance.set({font:'sans',background:'black',palette:'ocean'});
   window.readSourceBefore=JSON.stringify(AtacData);
   window.readNodesBefore=[...ATAC_FILM.actors.reads.g.querySelectorAll('g,path,line,circle,ellipse,rect')];
   const opacity=node=>{let a=1;while(node?.nodeType===1){const s=getComputedStyle(node);if(s.display==='none'||s.visibility==='hidden')return 0;a*=+s.opacity;node=node.parentElement;}return a;};
   const xy=line=>({start:{x:+line.getAttribute('x1'),y:+line.getAttribute('y1')},end:{x:+line.getAttribute('x2'),y:+line.getAttribute('y2')}});
   const numbers=s=>(s.match(/[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/gi)||[]).map(Number);
   window.inspectReadDrawing=()=>{
    const actor=ATAC_FILM.actors.reads,g=actor.g,state=actor.state;
    const reads=['R1','R2'].map(id=>{
     const products=[...g.querySelectorAll('[data-read-part="synthesized-strand"][data-read-id="'+id+'"]')].filter(n=>opacity(n)>.03).sort((a,b)=>+a.dataset.segment-+b.dataset.segment).map(n=>{const body=n.querySelectorAll('path')[1],p=numbers(body.getAttribute('d'));return{index:+n.dataset.segment,start:{x:p[0],y:p[1]},end:{x:p[2],y:p[3]},opacity:opacity(n),direction:n.dataset.sequenceDirection};});
     const tip=g.querySelector('[data-read-part="growing-3-prime-tip"][data-read-id="'+id+'"]'),tipXY=numbers(tip.getAttribute('transform')||'');
     const arrow=g.querySelector('[data-read-part="summary-read"][data-read-id="'+id+'"]');
     return{id,products,tip:{x:tipXY[0],y:tipXY[1],opacity:opacity(tip)},arrow:{...xy(arrow.querySelector('line')),opacity:opacity(arrow),head:numbers(arrow.querySelector('path').getAttribute('d'))}};
    });
    const orientationArrows=[...g.querySelectorAll('g')].filter(n=>!n.dataset.readPart&&n.children.length===2&&n.children[0].tagName==='line'&&n.children[1].tagName==='path').map(n=>({...xy(n.children[0]),opacity:opacity(n)}));
    const templateStrands=[0,1].map(strand=>{
     const segments=[...g.querySelectorAll('[data-read-part="template-strand"][data-strand="'+strand+'"]')].sort((a,b)=>+a.dataset.segment-+b.dataset.segment);
     const a=numbers(segments[0].querySelectorAll('path')[1].getAttribute('d')),b=numbers(segments.at(-1).querySelectorAll('path')[1].getAttribute('d'));
     return{segments:segments.length,start:{x:a[0],y:a[1]},end:{x:b[2],y:b[3]}};
    });
    const windowNode=g.querySelector('[data-read-part="locator-window"]'),locatorNode=g.querySelector('[data-read-part="whole-insert-locator"]');
    const locator={window:Object.fromEntries(['x','y','width','height'].map(k=>[k,+windowNode.getAttribute(k)])),opacity:opacity(locatorNode)};
    const now=[...g.querySelectorAll('g,path,line,circle,ellipse,rect')];
    return{state,reads,orientationArrows,templateStrands,locator,stable:now.length===readNodesBefore.length&&readNodesBefore.every(n=>now.includes(n)),invalid:[...g.querySelectorAll('*')].filter(n=>['d','x','y','x1','x2','y1','y2','cx','cy','transform'].some(a=>/NaN|Infinity/.test(n.getAttribute(a)||''))).length};
   };
   return{duration:ATAC_FILM.duration,cues:ATAC_FILM.cues.map(c=>({key:c.key,time:c.time,arrive:c.arrive,motion:c.motion})),fragment:AtacData.fragment('F001'),synthetic:AtacData.synthetic};
  });
  const cues=new Map(setup.cues.map(c=>[c.key,c]));report.duration=setup.duration;
  check('Source example is one 88 bp insert with two 30 bp reads and a 28 bp unread gap','source',()=>{
   const f=setup.fragment;assert(setup.synthetic);assert.equal(f.id,'F001');assert.deepEqual([f.start,f.end,f.length],[490,578,88]);
   assert.deepEqual(f.reads.map(r=>[r.start,r.end,r.strand]),[[490,520,'+'],[548,578,'-']]);assert.equal(f.reads[1].start-f.reads[0].end,28);
  });
  async function sample(time){return page.evaluate(async time=>{CINEMA.seek(time);const layout=await L.ready(D.deck.root());return{time,key:ATAC_FILM.snapshot.key,...inspectReadDrawing(),layoutIssues:layout.issues};},time);}
  for(const key of ['read-orientation','read-one','read-two','paired-reads']){
   const cue=cues.get(key);assert(cue,'Missing cue '+key);const row=await sample(cue.time);report.frames.push(row);
   check(key+': finite persistent geometry, valid source interval and contracted text','drawing',()=>{
    assert(!row.state.hidden);assert(row.stable);assert.equal(row.invalid,0);assert.equal(row.layoutIssues.length,0);finite(row.state);
    assert.deepEqual([row.state.insertId,row.state.start,row.state.end,row.state.bp,row.state.readLength,row.state.unreadBp],['F001',490,578,88,30,28]);
    assert.deepEqual(row.state.reads.map(r=>r.interval),[[490,520],[548,578]]);
   });
   await page.screenshot({path:path.join(output,key+'.png')});
  }
  check('Whole-insert orientation and paired-read summary show opposite directions','drawing',()=>{
   const first=report.frames[0],last=report.frames.at(-1);assert.equal(first.state.currentRound,'orientation');assert.equal(last.state.currentRound,'summary');
   assert.equal(first.orientationArrows.length,2);const orientation=first.orientationArrows.slice().sort((a,b)=>a.start.y-b.start.y);
   assert(orientation.every(a=>a.opacity>.9));assert(orientation[0].end.x>orientation[0].start.x);assert(orientation[1].end.x<orientation[1].start.x);
   for(const [i,r]of last.reads.entries()){
    assert(r.arrow.opacity>.9);assert(i?r.arrow.end.x<r.arrow.start.x:r.arrow.end.x>r.arrow.start.x);
    assert(close(r.arrow.head[0],r.arrow.end.x)&&close(r.arrow.head[1],r.arrow.end.y),'Arrowhead must terminate at the read endpoint');
   }
  });
  check('Rendered summary preserves the 30 + 28 + 30 bp partition of the same 88 bp insert','drawing',()=>{
   const row=report.frames.at(-1),template=row.templateStrands[0],scale=(template.end.x-template.start.x)/88,[r1,r2]=row.reads.map(r=>r.arrow);
   assert(scale>0);assert(close(template.start.x,r1.start.x));assert(close(template.end.x,r2.start.x));
   assert(close((r1.end.x-r1.start.x)/scale,30));assert(close((r2.start.x-r2.end.x)/scale,30));assert(close((r2.end.x-r1.end.x)/scale,28));
   assert(row.templateStrands.every(t=>close(t.start.x,template.start.x)&&close(t.end.x,template.end.x)));return{pixelsPerBasePair:scale};
  });
  for(const [key,readIndex]of [['read-one',0],['read-two',1]]){
   const cue=cues.get(key),rows=[];
   for(let i=0;i<=24;i++){const row=await sample(cue.arrive+cue.motion*i/24);rows.push(row);report.growthSamples.push(row);}
   check(key+': actual synthesized SVG segments grow in the expected direction with one active round','drawing',()=>{
    let previousExtension=-Infinity,previousTip=null,observed=0,maximumTipError=0;
    for(const row of rows){
     assert(row.stable);assert.equal(row.invalid,0);finite(row.state);assert.equal(row.layoutIssues.length,0);
     const activeProducts=row.reads.filter(r=>r.products.length>0);assert(activeProducts.length<=1,'Both synthesized products are simultaneously visible');
     const r=row.reads[readIndex],other=row.reads[1-readIndex];
     if(!r.products.length||r.tip.opacity<.03)continue;
     assert.equal(other.products.length,0);assert(other.tip.opacity<.03,'Both growing tips are active');observed++;
     const first=r.products[0],last=r.products.at(-1),sign=readIndex?-1:1;
     assert.equal(first.index,0);r.products.forEach((p,i)=>{assert.equal(p.index,i);assert.equal(p.direction,'5to3');assert(sign*(p.end.x-p.start.x)>=-epsilon);if(i)assert(samePoint(p.start,r.products[i-1].end),'Synthesized strand has a gap');});
     const error=Math.hypot(r.tip.x-last.end.x,r.tip.y-last.end.y);maximumTipError=Math.max(maximumTipError,error);assert(error<epsilon,'Growing 3-prime tip differs from last visible segment');
     const extension=sign*(r.tip.x-first.start.x);assert(extension>0);assert(extension+epsilon>=previousExtension,'The synthesized product shortens during its read round');previousExtension=extension;
     if(previousTip!==null)assert(sign*(r.tip.x-previousTip)>=-epsilon,'The growing end reverses direction');previousTip=r.tip.x;
     const w=row.locator.window;assert(row.locator.opacity>.9);assert(w.x>=903&&w.x+w.width<=1166&&w.y>=208&&w.y+w.height<=303);
    }
    assert(observed>=8,'Insufficient visible growth samples');return{samples:rows.length,visibleGrowthSamples:observed,maximumTipError};
   });
   const midpoint=await sample(cue.arrive+cue.motion*.7);await page.screenshot({path:path.join(output,key+'-growth.png')});
   report.frames.push({capture:key+'-growth',...midpoint});
  }
  check('The final locator window selects the same left or right read interval','drawing',()=>{
   for(const [key,index]of [['read-one',0],['read-two',1]]){
    const row=report.frames.find(f=>f.key===key&&f.state.stage===index+1),f=setup.fragment,r=f.reads[index],w=row.locator.window;
    const expectedLeft=930+220*(r.start-f.start)/f.length-8,expectedRight=930+220*(r.end-f.start)/f.length+8;
    assert(close(w.x,expectedLeft));assert(close(w.x+w.width,expectedRight));assert.equal(row.state.locator.visible,1);
   }
  });
  // Two independent actors receive identical stages. Compare actual SVG shafts
  // as well as their declarative anchors at 21 positions through the handoff.
  for(let i=0;i<=20;i++){
   const row=await page.evaluate(stage=>{
    const r=ATAC_FILM.actors.reads.paint({visibility:1,stage}),s=ATAC_FILM.actors.signals.paint({visibility:1,stage});
    const drawn=inspectReadDrawing(),signals=ATAC_FILM.actors.signals.nodes.readArrows.map(a=>({start:{x:+a.shaft.getAttribute('x1'),y:+a.shaft.getAttribute('y1')},end:{x:+a.shaft.getAttribute('x2'),y:+a.shaft.getAttribute('y2')}}));
    return{stage,readAnchors:r.anchors,signalAnchors:s.anchors,drawn:drawn.reads.map(q=>q.arrow),signals,stable:drawn.stable,invalid:drawn.invalid};
   },3+i/20);report.handoffSamples.push(row);
  }
  check('3D-to-mapping handoff preserves every read endpoint and fragment anchor at 21 positions','drawing',()=>{
   let maximumCoordinateError=0;
   for(const row of report.handoffSamples){assert(row.stable);assert.equal(row.invalid,0);
    for(const key of ['fragment','read1','read2'])for(const end of ['start','end'])for(const axis of ['x','y']){
     const error=Math.abs(row.readAnchors[key][end][axis]-row.signalAnchors[key][end][axis]);maximumCoordinateError=Math.max(maximumCoordinateError,error);assert(error<epsilon,`${key}.${end}.${axis} at stage ${row.stage}`);
    }
    row.drawn.forEach((r,i)=>{assert(samePoint(r.start,row.signals[i].start)&&samePoint(r.end,row.signals[i].end),'Actual arrow shafts disagree');assert(close(r.head[0],r.end.x)&&close(r.head[1],r.end.y));});
   }
   return{samples:report.handoffSamples.length,maximumCoordinateError};
  });
  const final=await page.evaluate(()=>({immutable:readSourceBefore===JSON.stringify(AtacData),stable:inspectReadDrawing().stable,nodes:readNodesBefore.length}));
  check('AtacData is unchanged and all reading geometry retains object identity','source',()=>{assert(final.immutable);assert(final.stable);return{geometricNodes:final.nodes};});
  check('The standalone reading film produces no page errors or external requests','drawing',()=>{assert.deepEqual(report.errors,[]);assert.deepEqual(report.externalRequests,[]);});
 }catch(error){report.checks.push({name:'Browser execution',pass:false,error:error.stack||error.message});}
 finally{await browser.close();}
 report.ok=report.checks.every(c=>c.pass)&&!report.errors.length&&!report.externalRequests.length;
 fs.writeFileSync(path.join(root,'qa-output/atac/reading-report.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({ok:report.ok,checks:report.checks.length,frames:report.frames.length,growthSamples:report.growthSamples.length,handoffSamples:report.handoffSamples.length,failures:report.checks.filter(c=>!c.pass),errors:report.errors},null,2));
 if(!report.ok)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1;});
