#!/usr/bin/env node
'use strict';
/* Independently audit the rendered nearby callouts and spatial camera story.
 * Source positions and actual SVG transforms are inspected; this is a visual
 * continuity audit, not a molecular-dynamics or experimental-contact claim. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),pw=require('playwright');
const root=path.resolve(__dirname,'../..'),artifact=path.join(root,'dist/lesson.html');
const output=path.join(root,'qa-output/atac/local-story');fs.mkdirSync(output,{recursive:true});
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
(async()=>{
 const report={artifactSha256:crypto.createHash('sha256').update(fs.readFileSync(artifact)).digest('hex'),checks:[],frames:[],cameraSamples:[],negativeControls:[],errors:[],externalRequests:[]};
 const check=(name,fn)=>{try{const detail=fn();report.checks.push({name,pass:true,...(detail?{detail}:{})});}catch(error){report.checks.push({name,pass:false,error:error.message});}};
 const browser=await require('../trna/browser.cjs').launch(pw),page=await browser.newPage({viewport:{width:1440,height:900}});
 page.on('pageerror',e=>report.errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))report.externalRequests.push(r.url());});
 try{
  await page.goto(pathToFileURL(artifact).href+'?lang=ru&qa=local-story');await page.waitForFunction(()=>window.ATAC_FILM?.snapshot&&window.CINEMA);
  await require('./lib.cjs').assertDefaultRoute(page);
  const setup=await page.evaluate(()=>{
   CINEMA.pause();D.i18n.setLang('ru');D.appearance.set({font:'sans',background:'black',palette:'ocean'});
   const source=()=>JSON.stringify([AtacStructures,AtacHistoneCoreData,AtacData]);window.localStorySource=source();
   const actorRoots=Object.values(ATAC_FILM.actors).map(actor=>actor.g);
   window.localStoryNodes=actorRoots.flatMap(n=>[n,...n.querySelectorAll('g,path,line,circle,ellipse,rect')]);
   window.localStoryNodeSet=new Set(localStoryNodes);
   window.localStoryLandmarks=[['chromatin',ATAC_FILM.actors.chromatin.g,'[data-bio-part^="dna-strand"]'],['nucleosome',ATAC_FILM.actors.structure.g,'[data-pdb="1KX5"] [data-kind] > path:first-child'],['tn5',ATAC_FILM.actors.structure.g,'[data-pdb="1MUH"] [data-kind] > path:first-child']].flatMap(([actor,g,selector])=>{const ns=[...g.querySelectorAll(selector)];return Array.from({length:Math.min(9,ns.length)},(_,i)=>({actor,node:ns[Math.floor(i*(ns.length-1)/8)]}));});
   window.inspectLocalStory=()=>{
    const svg=ATAC_FILM.actors.chromatin.g.ownerSVGElement,inv=svg.getScreenCTM().inverse();
    const convert=(node,p)=>{const m=inv.multiply(node.getScreenCTM());return[m.a*p.x+m.c*p.y+m.e,m.b*p.x+m.d*p.y+m.f];};
    const opacity=node=>{let a=1;while(node?.nodeType===1){const s=getComputedStyle(node);if(s.display==='none'||s.visibility==='hidden')return 0;a*=+s.opacity;node=node.parentElement;}return a;};
    const bounds=node=>{const b=node.getBBox(),ps=[[b.x,b.y],[b.x+b.width,b.y],[b.x+b.width,b.y+b.height],[b.x,b.y+b.height]].map(([x,y])=>convert(node,{x,y}));return{x:Math.min(...ps.map(p=>p[0])),y:Math.min(...ps.map(p=>p[1])),width:Math.max(...ps.map(p=>p[0]))-Math.min(...ps.map(p=>p[0])),height:Math.max(...ps.map(p=>p[1]))-Math.min(...ps.map(p=>p[1]))};};
    const visibleCallouts=[...svg.querySelectorAll('[data-local-callout]')].map(n=>{
     const line=n.querySelector('[data-callout-leader]'),box=n.querySelector('[data-callout-box]');
     const texts=box?[...box.querySelectorAll('text')].filter(t=>opacity(t)>.01).flatMap(t=>t.querySelectorAll('tspan').length?[...t.querySelectorAll('tspan')]:[t]):[];
     let leader=null;
     if(line){const a=convert(line,{x:+line.getAttribute('x1'),y:+line.getAttribute('y1')}),b=convert(line,{x:+line.getAttribute('x2'),y:+line.getAttribute('y2')});leader={a,b,length:Math.hypot(a[0]-b[0],a[1]-b[1]),opacity:opacity(line)};}
     return{id:n.dataset.localCallout,text:box?.textContent||'',opacity:opacity(n),bounds:box?bounds(box):null,textBoxes:texts.map(bounds),leader,data:{...n.dataset}};
    });
    const polymerSelectors=[
     '[data-bio-part^="dna-strand"]',
     '[data-protein-cartoon] > path:first-child',
     '[data-pdb] [data-kind="protein"] > path:first-child',
     '[data-pdb] [data-kind="dna"] > path:first-child',
     '[data-pdb] path[data-kind="dna-base-spoke"]',
     '[data-pdb] path[data-kind="paired-base-centroids"]',
     '[data-bio-part="tn5-event-a"] path',
     '[data-bio-part="tn5-event-b"] path'
    ].join(',');
    const polygons=[];
    for(const node of svg.querySelectorAll(polymerSelectors)){
     const alpha=opacity(node),style=getComputedStyle(node);if(alpha<.12||style.stroke==='none')continue;
     const length=node.getTotalLength?.();if(!Number.isFinite(length)||length<=0)continue;
     const m=inv.multiply(node.getScreenCTM()),scale=Math.max(Math.hypot(m.a,m.b),Math.hypot(m.c,m.d));
     const radius=(parseFloat(style.strokeWidth)||0)*scale/2;
     const count=Math.max(1,Math.ceil(length*scale/3)),points=[];
     for(let i=0;i<=count;i++){const p=node.getPointAtLength(length*i/count),q=convert(node,p);if(q[0]>=60-radius&&q[0]<=1220+radius&&q[1]>=201-radius&&q[1]<=554+radius)points.push(q);else points.push(null);}
     polygons.push({points,radius,alpha,kind:node.dataset.bioPart||node.closest('[data-kind]')?.dataset.kind||node.closest('[data-protein-cartoon]')?.dataset.proteinCartoon||node.tagName});
    }
    const pointToBox=(p,b)=>Math.hypot(Math.max(b.x-p[0],0,p[0]-b.x-b.width),Math.max(b.y-p[1],0,p[1]-b.y-b.height));
    const overlap=[];
    for(const c of visibleCallouts){const anchor=[+c.data.anchorX,+c.data.anchorY];
     const specific=c.id==='tails'?'tail':['dna','open','dna-arc','nuc-dna','tn5-ends','loaded-end'].includes(c.id)?'dna':null;
     if(specific&&anchor.every(Number.isFinite))c.anchorTraceDistance=Math.min(...polygons.filter(p=>p.kind===specific||specific==='dna'&&String(p.kind).startsWith('dna-strand')).flatMap(p=>p.points.filter(Boolean).map(q=>Math.hypot(q[0]-anchor[0],q[1]-anchor[1]))));
    }
    for(const c of visibleCallouts){if(c.opacity<.72)continue;
     for(const b of c.textBoxes)for(const poly of polygons){
      let minimum=Infinity,at=null;for(const p of poly.points){if(!p)continue;const d=pointToBox(p,b)-poly.radius;if(d<minimum){minimum=d;at=p;}}
      if(minimum<2)overlap.push({id:c.id,text:c.text,clearance:minimum,kind:poly.kind,at,textBox:b});
     }
    }
    const labelOverlap=[];
    const visibleText=visibleCallouts.filter(c=>c.opacity>=.72);
    for(let i=0;i<visibleText.length;i++)for(let j=i+1;j<visibleText.length;j++)for(const a of visibleText[i].textBoxes)for(const b of visibleText[j].textBoxes){
     const width=Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x),height=Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y);
     if(width>0&&height>0)labelOverlap.push({a:visibleText[i].id,b:visibleText[j].id,width,height});
    }
    const landmarks=localStoryLandmarks.map(({actor,node})=>{const len=node.getTotalLength();return{actor,alpha:opacity(node),points:[0,.5,1].map(u=>convert(node,node.getPointAtLength(len*u)))};});
    const croot=ATAC_FILM.actors.chromatin.g.querySelector('[data-chromatin-camera]'),sroot=ATAC_FILM.actors.structure.g.querySelector('[data-pdb]').parentElement;
    const matrix=n=>{const m=inv.multiply(n.getScreenCTM());return{a:m.a,b:m.b,c:m.c,d:m.d,e:m.e,f:m.f};};
    const cameraNodes=[croot,sroot].map(n=>({matrix:matrix(n),opacity:opacity(n)}));
    const currentNodes=Object.values(ATAC_FILM.actors).flatMap(actor=>[actor.g,...actor.g.querySelectorAll('g,path,line,circle,ellipse,rect')]);
    return{key:ATAC_FILM.snapshot.key,cameraStory:ATAC_FILM.snapshot.cameraStory||null,zoomBridge:ATAC_FILM.snapshot.zoomBridge||null,callouts:visibleCallouts,overlap,labelOverlap,polymerCount:polygons.length,landmarks,cameraNodes,immutable:source()===localStorySource,stable:localStoryNodes.length>1000&&localStoryNodes.every(n=>n.isConnected)&&localStoryNodes.length===currentNodes.length&&currentNodes.every(n=>localStoryNodeSet.has(n)),invalid:[...svg.querySelectorAll('*')].filter(n=>['d','x','y','cx','cy','x1','x2','y1','y2','transform'].some(a=>/NaN|Infinity/.test(n.getAttribute(a)||''))).length};
   };
   return{actorCount:actorRoots.length,nodeCount:localStoryNodes.length,duration:ATAC_FILM.duration,cues:ATAC_FILM.cues.map(c=>({key:c.key,time:c.time,arrive:c.arrive,motion:c.motion,hold:c.hold})),calloutCount:D.deck.root().querySelectorAll('[data-local-callout]').length};
  });
  check('Nearby callouts exist and the 46-cue film retains its 240.6-second duration',()=>{assert(setup.calloutCount>0);assert(setup.actorCount>=6);assert(setup.nodeCount>1000);assert.equal(setup.cues.length,46);assert(Math.abs(setup.duration-240.6)<1e-6);});
  const cues=new Map(setup.cues.map(c=>[c.key,c]));
  async function frame(time){return page.evaluate(async time=>{CINEMA.seek(time);const audit=await L.ready(D.deck.root());return{time,...inspectLocalStory(),layoutIssues:audit.issues};},time);}
  const persistenceControl=await page.evaluate(()=>{
   const node=document.createElementNS('http://www.w3.org/2000/svg','g');ATAC_FILM.actors.chromatin.g.appendChild(node);
   const rejected=!inspectLocalStory().stable;node.remove();return{rejected,restored:inspectLocalStory().stable,nodeCount:localStoryNodes.length};
  });
  check('Persistent-node audit samples actual actor nodes and rejects an added node',()=>{assert(persistenceControl.rejected);assert(persistenceControl.restored);assert(persistenceControl.nodeCount>1000);return persistenceControl;});
  const keys=['chromatin','nucleosome','nucleosome-real','histone-octamer','wrapped-dna','linker','protected','tn5','tn5-real','tn5-end-dna','dock','stagger','tag-chemistry','two-events'];
  const modes=[['ru','black','sans'],['en','white','sans'],['ru','white','serif'],['en','black','serif']];
  let visibleTotal=0,maximumLeader=0;
  for(const [lang,background,font]of modes){
   await page.evaluate(([lang,background,font])=>{D.i18n.setLang(lang);D.appearance.set({font,background,palette:'ocean'});},[lang,background,font]);
   for(const key of keys){const row=await frame(cues.get(key).time);report.frames.push({lang,background,font,...row});
    check(`${lang}/${background}/${font} ${key}: nearby text fits and clears molecular strokes`,()=>{
     assert(row.immutable&&row.stable);assert.equal(row.invalid,0);assert.equal(row.layoutIssues.length,0,JSON.stringify(row.layoutIssues));assert.equal(row.labelOverlap.length,0,JSON.stringify(row.labelOverlap));assert.equal(row.overlap.length,0,JSON.stringify(row.overlap.slice(0,4)));
     for(const c of row.callouts.filter(c=>c.opacity>=.72)){
      visibleTotal++;if(c.anchorTraceDistance!==undefined)assert(Number.isFinite(c.anchorTraceDistance)&&c.anchorTraceDistance<8,c.id+' does not point to its actual rendered polymer trace');assert(c.textBoxes.length,'Callout has no rendered text: '+c.id);const b=c.bounds;
      assert(b.x>=60-.1&&b.x+b.width<=1220+.1&&b.y>=147-.1&&b.y+b.height<=610+.1,c.id+' is outside the drawing stage: '+JSON.stringify(b));
      if(c.leader&&c.leader.opacity>.01){maximumLeader=Math.max(maximumLeader,c.leader.length);assert(c.leader.length<=110.1,c.id+' leader is distant: '+c.leader.length);
       const anchor=[+c.data.anchorX,+c.data.anchorY];assert(anchor.every(Number.isFinite),c.id+' lacks a scientific anchor');assert(Math.abs(distance(c.leader.b,anchor)-8)<.1||c.leader.length<.1,c.id+' actual pointer detaches from target');
      }
     }
    });
    if(lang==='ru'&&font==='sans'&&['nucleosome','wrapped-dna','tn5-real','dock','stagger'].includes(key))await page.screenshot({path:path.join(output,key+'.png')});
   }
  }
  check('The redesigned labels actually appear in the film',()=>{assert(visibleTotal>=20,'Too few visible labels: '+visibleTotal);return{visibleLabelOccurrences:visibleTotal,maximumLeaderLength:maximumLeader};});
  // These deliberate drawing defects prove the oracle can reject both
  // regressions even if the helper's own diagnostic metadata remains valid.
  await page.evaluate(()=>{D.i18n.setLang('ru');D.appearance.set({font:'sans',background:'black',palette:'ocean'});});
  await frame(cues.get('tn5-real').time);
  const negative=await page.evaluate(()=>{
   const svg=ATAC_FILM.actors.chromatin.g.ownerSVGElement,original=inspectLocalStory();
   const c=original.callouts.find(c=>c.opacity>=.72&&c.leader?.opacity>.01);
   if(!c)return{error:'No visible local callout available for negative controls'};
   const node=svg.querySelector('[data-local-callout="'+c.id+'"]'),line=node.querySelector('[data-callout-leader]'),box=node.querySelector('[data-callout-box]');
   const x2=line.getAttribute('x2');line.setAttribute('x2',+x2+500);
   const long=inspectLocalStory().callouts.find(q=>q.id===c.id);line.setAttribute('x2',x2);
   const polymer=svg.querySelector('[data-pdb="1MUH"] [data-kind="protein"] > path:first-child');
   const p=polymer.getPointAtLength(polymer.getTotalLength()/2),screen=new DOMPoint(p.x,p.y).matrixTransform(polymer.getScreenCTM()),parentPoint=screen.matrixTransform(box.parentElement.getScreenCTM().inverse());
   const text=box.querySelector('text'),tb=text.getBBox(),textMatrix=text.getCTM(),boxMatrix=box.getCTM();
   const localTextCenter=new DOMPoint(tb.x+tb.width/2,tb.y+tb.height/2).matrixTransform(boxMatrix.inverse().multiply(textMatrix));
   const transform=box.getAttribute('transform');box.setAttribute('transform',`translate(${parentPoint.x-localTextCenter.x} ${parentPoint.y-localTextCenter.y})`);
   const collision=inspectLocalStory().overlap.filter(q=>q.id===c.id);box.setAttribute('transform',transform);
   return{overlongLeader:{id:c.id,length:long.leader.length,rejected:long.leader.length>110.1},labelOverPolymer:{id:c.id,collisions:collision.length,rejected:collision.length>0}};
  });
  report.negativeControls=negative.error?[negative]:Object.entries(negative).map(([name,result])=>({name,...result}));
  check('An overlong leader and text placed over a polymer both fail independent visual checks',()=>{assert(!negative.error,negative.error);assert(negative.overlongLeader.rejected);assert(negative.labelOverPolymer.rejected);});
  await page.evaluate(()=>{D.i18n.setLang('ru');D.appearance.set({font:'sans',background:'black',palette:'ocean'});});
  const forward=new Map();
  for(const key of ['nucleosome','linker','tn5-real','dock','stagger','two-events']){
   const c=cues.get(key);for(const u of [.0,.25,.5,.75,1]){const row=await frame(c.arrive+c.motion*u);report.cameraSamples.push(row);forward.set(key+':'+u,row);}
  }
  for(const [key,row]of [...forward.entries()].reverse()){
   const again=await frame(row.time);check(`Backseek deterministically restores the visible drawing at ${key}`,()=>{
    assert(again.immutable&&again.stable);assert.equal(again.invalid,0);
    again.landmarks.forEach((p,i)=>{const q=row.landmarks[i];assert(Math.abs(p.alpha-q.alpha)<1e-8,'Opacity changes during replay');if(Math.max(p.alpha,q.alpha)<.01)return;for(let j=0;j<p.points.length;j++)assert(distance(p.points[j],q.points[j])<1e-5,'Visible source landmark differs after replay');});
    assert.deepEqual(again.cameraNodes,row.cameraNodes);assert.deepEqual(again.cameraStory,row.cameraStory);
    const visible=cs=>cs.filter(c=>c.opacity>.01);assert.deepEqual(visible(again.callouts),visible(row.callouts));
   });
  }
  const transform=(m,p)=>[m.a*p[0]+m.c*p[1]+m.e,m.b*p[0]+m.d*p[1]+m.f];
  const boundaries={
   'nucleosome-real':[0,.12,.28,.48,.67,.78,.88,1],
   linker:[0,.12,.4,.88,1],
   'tn5-real':[0,.12,.24,.48,.67,.78,.88,1],
   dock:[0,.11,.28,.72,.74,.86,1],
   stagger:[0,.17,.58,.66,.82,1],
   'two-events':[0,.24,.3,.73,.76,.87,1]
  };
  for(const [key,phases]of Object.entries(boundaries)){
   const cue=cues.get(key);
   for(const u of phases){
    const t=cue.arrive+cue.motion*u,lo=await frame(t-.00005),hi=await frame(t+.00005);
    check(`${key} phase ${u}: actual visible molecular geometry stays continuous`,()=>{
     assert(lo.immutable&&hi.immutable&&lo.stable&&hi.stable);
     let largestMotion=0,compared=0;
     lo.landmarks.forEach((a,i)=>{const b=hi.landmarks[i];if(Math.min(a.alpha,b.alpha)<.02)return;compared++;for(let j=0;j<a.points.length;j++)largestMotion=Math.max(largestMotion,distance(a.points[j],b.points[j]));assert(Math.abs(a.alpha-b.alpha)<.01,'Visible molecular opacity jumps');});
     assert(largestMotion<.15,'Boundary jump '+largestMotion+' SVG pixels');return{landmarksCompared:compared,maximumMotion:largestMotion};
    });
   }
   for(const u of [.25,.5,.75]){
    const row=await frame(cue.arrive+cue.motion*u);report.cameraSamples.push(row);
    check(`${key} at ${u}: safe nearby labels and source registration`,()=>{
     assert(row.cameraStory,'Expected camera narrative');assert.equal(row.overlap.length,0,JSON.stringify(row.overlap.slice(0,3)));assert.equal(row.layoutIssues.length,0,JSON.stringify(row.layoutIssues));assert.equal(row.labelOverlap.length,0,JSON.stringify(row.labelOverlap));assert(row.immutable&&row.stable);
     const story=row.cameraStory;
     if(story.source&&story.destination){const a=transform(row.cameraNodes[0].matrix,story.source.center),b=transform(row.cameraNodes[1].matrix,story.destination.center);assert(distance(a,b)<.01,'Rendered camera centers disagree');assert(distance(a,story.center)<.01);}
     if((key==='nucleosome-real'||key==='tn5-real')&&u>=.28&&u<=.78)assert(row.callouts.every(c=>c.opacity<.01),'Callouts linger over moving camera');
     if((key==='linker'||key==='dock')&&u>=.12&&u<=.75)assert(row.callouts.every(c=>c.opacity<.01),'Callouts obscure the return to context');
    });
   }
  }
  for(const [key,u,referenceKey,actor]of [['linker',.4,'nucleosome-real','nucleosome'],['dock',.28,'tn5-real','tn5']]){
   const cue=cues.get(key),row=await frame(cue.arrive+cue.motion*u),reference=await frame(cues.get(referenceKey).time);
   check(`${key}: the same full complex is restored before the representation fades`,()=>{
    const a=row.landmarks.filter(q=>q.actor===actor),b=reference.landmarks.filter(q=>q.actor===actor);
    let largest=0;assert(a.some(p=>p.alpha>.5),'Full complex is already faded');
    a.forEach((p,i)=>p.points.forEach((q,j)=>largest=Math.max(largest,distance(q,b[i].points[j]))));assert(largest<.1,'Return differs from established overview by '+largest+' SVG pixels');
    assert(row.cameraStory.retreat>.999);assert(row.cameraStory.replacement<.001);return{maximumOverviewDifference:largest};
   });
  }
  const eventIn=await frame(cues.get('stagger').arrive+cues.get('stagger').motion*.66),eventOut=await frame(cues.get('two-events').arrive+cues.get('two-events').motion*.74);
  check('The local event receives a meaningful close-up and returns to context before the second event',()=>{
   assert(eventIn.cameraStory.chromatinView.scale>=2.6);assert.equal(eventIn.cameraStory.coordinatesMapped,false);
   assert(Math.abs(eventOut.cameraNodes[0].matrix.a-1)<1e-6);assert.equal(eventOut.cameraStory.secondEvent,0);
  });
  check('No browser errors or external requests',()=>{assert.deepEqual(report.errors,[]);assert.deepEqual(report.externalRequests,[]);});
 }catch(error){report.checks.push({name:'Browser execution',pass:false,error:error.stack||error.message});}
 finally{await browser.close();}
 report.ok=report.checks.every(c=>c.pass);fs.writeFileSync(path.join(root,'qa-output/atac/local-story-report.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({ok:report.ok,checks:report.checks.length,frames:report.frames.length,cameraSamples:report.cameraSamples.length,negativeControls:report.negativeControls.length,failures:report.checks.filter(c=>!c.pass),errors:report.errors},null,2));if(!report.ok)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1;});
