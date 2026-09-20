#!/usr/bin/env node
'use strict';
/* Frame review for any lesson built with this kit: films on the cinema clock and
 * stepped scenes. It renders every cue endpoint and transition midpoint (or every
 * scene step), measures what is actually on the stage and writes screenshots plus
 * contact sheets for a human or agent to look at. Nothing here judges scientific
 * meaning or composition taste; it only reports what automated checks otherwise
 * miss: an empty stage, geometry displaced outside the drawing area, sparse
 * drawings, text without a layout contract, overflowing text, dissolving
 * transitions, duration, a stage that depends on the language or on the history
 * of seeks. Findings are things to fix or to justify; notes are facts worth a
 * look (a small drawing, a close-up, a dissolve, off-frame geometry mid-motion).
 *
 *   node qa/film/review.cjs [dist/lesson.html] [--out DIR] [--lang ru,en]
 *                           [--expect-duration MIN-MAX] [--expect-cues MIN-MAX]
 *                           [--max-frames N] [--strict]
 *
 * Requires Playwright and an installed browser (PLAYWRIGHT_CHANNEL=chrome selects
 * Google Chrome). Reports go to qa-output/film-review/ by default; relative paths
 * resolve from the project root; --strict exits with code 1 on findings. */
const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
let pw;try{pw=require('playwright');}catch{pw=require(process.env.PLAYWRIGHT_MODULE||'playwright');}
const root=path.resolve(__dirname,'../..');
const args=process.argv.slice(2),option=(name,fallback)=>{const i=args.indexOf(name);return i>=0&&args[i+1]!==undefined?args[i+1]:fallback;};
const artifact=path.resolve(root,args.find(a=>!a.startsWith('--')&&!args[args.indexOf(a)-1]?.startsWith('--'))||'dist/lesson.html');
const output=path.resolve(root,option('--out','qa-output/film-review'));
const languages=option('--lang','ru,en').split(',').map(s=>s.trim()).filter(Boolean);
const maxFrames=+option('--max-frames',160)||160;
const strict=args.includes('--strict');
const range=value=>{if(!value)return null;const m=/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/.exec(value);if(!m)throw new Error('Expected MIN-MAX, got '+value);return [Number(m[1]),Number(m[2])];};
const expectDuration=range(option('--expect-duration')),expectCues=range(option('--expect-cues'));
const AREA={width:1160,height:463},SPARSE=.025,CLOSE_UP=1.5; // sparse: under 2.5% of the area; the kit films stay above 5%

async function launch(){
 const channel=process.env.PLAYWRIGHT_CHANNEL,configuration={headless:true,...(channel?{channel}:{})};
 try{return await pw.chromium.launch(configuration);}
 catch(error){if(channel||!/Executable doesn't exist at/i.test(error.message))throw error;return pw.chromium.launch({...configuration,channel:'chrome'});}
}

/* Runs inside the page: measure the current frame in stage coordinates.
 * Coverage is the share of 8-px cells of the drawing area touched by visible
 * shapes or text (a cell counts once). Filled shapes cover their box; stroked
 * outlines are sampled along their length with the stroke width, so thin lines
 * count too; text counts its box.
 * Content of <defs>, clip paths and masks is not drawing; a fill in the stage
 * background colour draws nothing visible; clip paths cut what they clip. */
function measure(){
 const root=D.deck.root(),svg=root&&root.querySelector('svg');
 const AREA={x:60,y:147,width:1160,height:463},CELL=8,COLS=Math.ceil(AREA.width/CELL),ROWS=Math.ceil(AREA.height/CELL),grid=new Uint8Array(COLS*ROWS);
 const rgb=value=>{const m=/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+))?/.exec(value||'');return m?[+m[1],+m[2],+m[3],m[4]===undefined?1:+m[4]]:null;};
 const stageBg=(()=>{for(let e=svg;e;e=e.parentElement){const c=rgb(getComputedStyle(e).backgroundColor);if(c&&c[3]>0)return c;}return [0,0,0,1];})();
 const opacity=n=>{let a=1;while(n&&n.nodeType===1){const s=getComputedStyle(n);if(s.display==='none'||s.visibility==='hidden')return 0;a*=+s.opacity;n=n.parentElement;}return a;};
 const visibleFill=value=>{if(!value||value==='none')return false;const c=rgb(value);return !c||c[3]>0&&Math.max(Math.abs(c[0]-stageBg[0]),Math.abs(c[1]-stageBg[1]),Math.abs(c[2]-stageBg[2]))>12;};
 const paint=n=>{const s=getComputedStyle(n),width=parseFloat(s.strokeWidth)||0,fillable=n.localName!=='line'&&n.localName!=='polyline';return {stroke:s.stroke&&s.stroke!=='none'&&width>0&&+s.strokeOpacity>0?width:0,fill:fillable&&+s.fillOpacity>0&&visibleFill(s.fill)};};
 const cells=(x0,y0,x1,y1)=>{const c0=Math.max(0,Math.floor((x0-AREA.x)/CELL)),c1=Math.min(COLS-1,Math.floor((x1-AREA.x)/CELL)),r0=Math.max(0,Math.floor((y0-AREA.y)/CELL)),r1=Math.min(ROWS-1,Math.floor((y1-AREA.y)/CELL));for(let r=r0;r<=r1;r++)for(let c=c0;c<=c1;c++)grid[r*COLS+c]=1;};
 const apply=(m,x,y)=>[m.a*x+m.c*y+m.e,m.b*x+m.d*y+m.f];
 const toStage=svg?svg.getScreenCTM().inverse():null;
 const matrix=n=>{try{return toStage.multiply(n.getScreenCTM());}catch(_){return null;}};
 const own=n=>{const t=n.transform&&n.transform.baseVal&&n.transform.baseVal.consolidate();return t?t.matrix:null;};
 const box=(n,m)=>{try{const b=n.getBBox();const pts=[[b.x,b.y],[b.x+b.width,b.y],[b.x,b.y+b.height],[b.x+b.width,b.y+b.height]].map(([x,y])=>apply(m,x,y));const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);return {x:Math.min(...xs),y:Math.min(...ys),width:Math.max(...xs)-Math.min(...xs),height:Math.max(...ys)-Math.min(...ys)};}catch(_){return null;}};
 const clips=new Map();
 const clipOf=el=>{ // stage-space region left by every clip-path on the ancestor chain; null when unclipped
  if(!el||el===svg)return null;if(clips.has(el))return clips.get(el);
  let u=clipOf(el.parentElement);
  const ref=/url\(["']?#([^"')]+)/.exec(getComputedStyle(el).clipPath||''),c=ref&&svg.ownerDocument.getElementById(ref[1]);
  if(c&&c.getAttribute('clipPathUnits')!=='objectBoundingBox'){const base=matrix(el);if(base){const ct=own(c),t=ct?base.multiply(ct):base;let region=null;
   for(const k of c.children){const kt=own(k),b=box(k,kt?t.multiply(kt):t);if(!b)continue;region=region?{x:Math.min(region.x,b.x),y:Math.min(region.y,b.y),x2:Math.max(region.x2,b.x+b.width),y2:Math.max(region.y2,b.y+b.height)}:{x:b.x,y:b.y,x2:b.x+b.width,y2:b.y+b.height};}
   if(region)u=u?{x:Math.max(u.x,region.x),y:Math.max(u.y,region.y),x2:Math.min(u.x2,region.x2),y2:Math.min(u.y2,region.y2)}:region;}}
  clips.set(el,u);return u;};
 const clipped=(b,u)=>{if(!b)return null;if(!u)return b;const x=Math.max(b.x,u.x),y=Math.max(b.y,u.y),x2=Math.min(b.x+b.width,u.x2),y2=Math.min(b.y+b.height,u.y2);return x2>x&&y2>y?{x,y,width:x2-x,height:y2-y}:null;};
 const outline=(n,m,width,u)=>{let total;try{total=n.getTotalLength();}catch(_){return false;}if(!isFinite(total)||total<=0)return false;
  const r=Math.max(1,width*Math.sqrt(Math.abs(m.a*m.d-m.b*m.c))/2),count=Math.min(4000,Math.ceil(total/(CELL/2)));
  for(let i=0;i<=count;i++){const p=n.getPointAtLength(total*i/count),[x,y]=apply(m,p.x,p.y);if(u&&(x<u.x||x>u.x2||y<u.y||y>u.y2))continue;cells(x-r,y-r,x+r,y+r);}return true;};
 const shapes=[],texts=[];let invalid=0;
 if(svg)for(const n of svg.querySelectorAll('path,line,circle,ellipse,rect,polygon,polyline,image,foreignObject,text')){
  if(n.closest('defs,clipPath,mask,pattern,marker,symbol'))continue;
  if(['d','x','y','cx','cy','x1','x2','y1','y2','transform','points'].some(k=>/NaN|Infinity/.test(n.getAttribute(k)||'')))invalid++;
  const a=opacity(n);if(a<=.05)continue;
  const m=matrix(n);if(!m)continue;
  const u=clipOf(n);
  if(n.localName==='text'){if(!n.textContent.trim())continue;const b=clipped(box(n,m),u);if(b){cells(b.x,b.y,b.x+b.width,b.y+b.height);texts.push({b,contracted:!!n.dataset.layoutId,text:n.textContent.trim().slice(0,40)});}continue;}
  const p=n.localName==='image'||n.localName==='foreignObject'?{stroke:0,fill:true}:paint(n);
  if(!p.stroke&&!p.fill)continue;
  const b=clipped(box(n,m),u);if(!b)continue;
  if(Math.max(b.width,b.height)<=0)continue;
  if(p.fill||!outline(n,m,p.stroke,u))cells(b.x,b.y,b.x+b.width,b.y+b.height);
  shapes.push({b});
 }
 const inside=b=>!(b.x+b.width<AREA.x||b.x>AREA.x+AREA.width||b.y+b.height<AREA.y||b.y>AREA.y+AREA.height);
 const contained=b=>b.x>=AREA.x-.5&&b.y>=AREA.y-.5&&b.x+b.width<=AREA.x+AREA.width+.5&&b.y+b.height<=AREA.y+AREA.height+.5;
 const union=list=>list.length?{x:Math.min(...list.map(s=>s.b.x)),y:Math.min(...list.map(s=>s.b.y)),x2:Math.max(...list.map(s=>s.b.x+s.b.width)),y2:Math.max(...list.map(s=>s.b.y+s.b.height))}:null;
 const u=union(shapes),coverage=grid.reduce((sum,v)=>sum+v,0)/(COLS*ROWS);
 // zoom: how far the drawing spreads beyond the area; from 1.5 the camera is close and off-frame geometry is expected.
 const zoom=u?Math.max((u.x2-u.x)/AREA.width,(u.y2-u.y)/AREA.height):0;
 const heading=root.querySelector('.film-title, .s-title'),caption=root.querySelector('.film-caption, .lesson-caption');
 return {shapes:shapes.length,outside:shapes.filter(s=>!inside(s.b)).length,partial:shapes.filter(s=>inside(s.b)&&!contained(s.b)).length,
  extents:u?{x:Math.round(u.x),y:Math.round(u.y),width:Math.round(u.x2-u.x),height:Math.round(u.y2-u.y)}:null,coverage:+coverage.toFixed(4),zoom:+zoom.toFixed(2),
  texts:texts.length,uncontractedVisible:texts.filter(t=>!t.contracted).map(t=>t.text),textsOutside:texts.filter(t=>!inside(t.b)).length,
  title:heading?heading.textContent.trim():'',caption:caption?caption.textContent.trim():'',captionVisible:!!caption&&opacity(caption)>.05,invalid};
}

async function frameAt(page,plan){
 return page.evaluate(async ({plan,measure})=>{
  const run=new Function('return ('+measure+')')();
  if(plan.kind==='film'){const C=window.CINEMA;C.pause();C.seek(plan.time);}
  else{D.deck.show(plan.scene,plan.step);}
  const audit=await L.ready(D.deck.root());
  await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  return {...run(),issues:audit.issues.filter(i=>i.kind==='overflow').map(i=>i.id),unmeasured:audit.unmeasured,uncontracted:audit.uncontractedText.length};
 },{plan,measure:measure.toString()});
}

function sheet(frames,title){
 const cells=frames.map(f=>`<figure><img src="data:image/png;base64,${fs.readFileSync(f.file).toString('base64')}"><figcaption>${f.label}</figcaption></figure>`).join('');
 return `<style>body{margin:0;background:#111;color:#eee;font:15px/1.3 sans-serif;padding:12px}h1{font-size:18px;margin:0 0 10px}main{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}figure{margin:0;min-width:0}img{width:100%;display:block;border:1px solid #333}figcaption{padding:4px 2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}</style><h1>${title}</h1><main>${cells}</main>`;
}

/* Findings ask for a fix or a justification; notes point at frames worth a look. */
function assess(report,film){
 const find=(kind,frame,detail)=>report.findings.push({kind,frame,detail}),note=(kind,frame,detail)=>report.notes.push({kind,frame,detail});
 const dissolves=new Set(((film&&film.edges)||[]).filter(e=>!e.authored).map(e=>e.from+' → '+e.to));
 const dissolveOf=f=>{const m=/^(.*) → (.*) \d+%$/.exec(f.label);return !!(m&&dissolves.has(m[1]+' → '+m[2]));};
 for(const f of report.frames){
  const where=`${f.lang} · ${f.label}`,size=f.extents?f.extents.width+'×'+f.extents.height:'none',close=f.zoom>=CLOSE_UP,endpoint=f.phase==='endpoint',primary=f.lang===report.languages[0];
  if(f.shapes===0&&f.captionVisible){
   if(dissolveOf(f))note('empty-stage',where,'the stage is empty at this point of a dissolve: the previous view has faded out and the next is not in yet');
   else find('empty-stage',where,f.texts?`caption is shown over a stage with no drawn shapes, only ${f.texts} text nodes`:'caption is shown over an empty stage');
  }else if(f.coverage<SPARSE&&f.shapes>0)find('sparse-drawing',where,`visible shapes touch ${(f.coverage*100).toFixed(1)}% of the drawing area (${f.shapes} shapes, extents ${size})`);
  if(f.outside){const detail=`${f.outside} visible shapes lie entirely outside x60–1220 / y147–610 (extents ${size})`;
   if(!close&&endpoint)find('outside-area',where,detail+' although the drawing is not a close-up');else if(primary)note('off-frame',where,detail+(close?' in a close-up':' during motion'));}
  if(f.textsOutside){const detail=`${f.textsOutside} visible text nodes outside the drawing area (extents ${size})`;if(endpoint&&!close)find('text-outside-area',where,detail);else note('text-off-frame',where,detail);}
  if(f.issues.length)find('overflow',where,'text exceeds its declared box: '+f.issues.join(', '));
  if(f.uncontractedVisible.length&&endpoint)find('uncontracted-text',where,'visible text without a layout contract: '+f.uncontractedVisible.slice(0,4).map(t=>JSON.stringify(t)).join(', '));
  if(f.invalid)find('invalid-geometry',where,`${f.invalid} nodes with NaN/Infinity`);
  if(primary&&endpoint&&f.shapes>0&&f.extents&&f.extents.width<AREA.width/2&&f.extents.height<AREA.height/2)note('small-drawing',where,`the drawing spans ${size} of the ${AREA.width}×${AREA.height} area, under half in both directions; draw larger unless this is a deliberate detail`);
 }
 // The stage must not depend on the language or on the order of seeks: captions differ, shapes do not.
 const byLabel=new Map();for(const f of report.frames)if(f.phase==='endpoint')byLabel.set(f.label,[...(byLabel.get(f.label)||[]),f]);
 for(const [label,list] of byLabel)for(const other of list.slice(1))if(other.shapes!==list[0].shapes)find('language-mismatch',label,`${list[0].lang} draws ${list[0].shapes} shapes, ${other.lang} draws ${other.shapes}: paint depends on the language or on what was shown before, look for writes without a reset branch`);
 if(report.replay){const a=report.frames[0],b=report.replay;if(a.shapes!==b.shapes||Math.abs(a.coverage-b.coverage)>.005)find('replay-mismatch',`${a.lang} · ${a.label}`,`seeking back to the first frame after the last one draws ${b.shapes} shapes (coverage ${(b.coverage*100).toFixed(1)}%) instead of ${a.shapes} (${(a.coverage*100).toFixed(1)}%): paint depends on the history of seeks, look for writes without a reset branch`);}
 for(const edge of dissolves)note('dissolve-edge',edge,'not adjacent in the authored film: the views dissolve instead of moving continuously, and the exact midpoint may be empty by design; look at the 25 % and 75 % frames');
 if(film&&expectDuration&&(film.duration<expectDuration[0]||film.duration>expectDuration[1]))find('duration','film',`${film.duration} s is outside the requested ${expectDuration[0]}–${expectDuration[1]} s`);
 if(film&&expectCues&&(film.cues.length<expectCues[0]||film.cues.length>expectCues[1]))find('cue-count','film',`${film.cues.length} cues, requested ${expectCues[0]}–${expectCues[1]}`);
 if(report.errors.length)find('page-errors','load',report.errors.slice(0,3).join(' | '));
 if(report.external.length)find('external-requests','load',report.external.slice(0,3).join(' '));
}

(async()=>{
 if(!fs.existsSync(artifact))throw new Error('Build the lesson first: no file at '+artifact);
 fs.mkdirSync(output,{recursive:true});
 const browser=await launch(),page=await browser.newPage({viewport:{width:1440,height:900}});
 const report={artifact,browser:browser.version(),mode:null,languages,errors:[],external:[],frames:[],findings:[],notes:[]};
 page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push('console: '+m.text());});
 page.on('request',r=>{if(/^https?:/.test(r.url()))report.external.push(r.url());});
 let film=null;
 try{
  await page.goto(pathToFileURL(artifact).href+'?lang='+languages[0]);
  await page.waitForFunction(()=>window.D&&D.deck&&D.deck.root(),{timeout:20000});
  await page.evaluate(()=>document.fonts.ready);
  film=await page.evaluate(()=>{const C=window.CINEMA;if(!C)return null;
   const cues=C.cues.map((c,i)=>({index:i,key:c.key,time:c.time,arrive:c.arrive!==undefined?c.arrive:c.time,motion:c.motion||0,hold:c.hold}));
   let edges=null;if(window.ATAC_FILM&&window.AtacStory&&AtacStory.authoredEdge)edges=C.cues.slice(1).map((c,i)=>({from:C.cues[i].key,to:c.key,authored:AtacStory.authoredEdge(C.cues[i],c)}));
   return {duration:C.duration,cues,edges};});
  report.mode=film?'film':'steps';
  const plans=[];
  if(film){
   report.duration=film.duration;report.cues=film.cues.map(c=>c.key);report.edges=film.edges;
   for(const cue of film.cues){plans.push({kind:'film',label:cue.key,time:cue.time,phase:'endpoint',index:cue.index});
    if(cue.index>0&&cue.motion>0)for(const u of [.25,.5,.75])plans.push({kind:'film',label:film.cues[cue.index-1].key+' → '+cue.key+' '+Math.round(u*100)+'%',time:cue.arrive+cue.motion*u,phase:u===.5?'mid':'quarter',index:cue.index});}
  }else{
   const scenes=await page.evaluate(()=>D.deck.scenes().length);
   for(let scene=0;scene<scenes;scene++){const steps=await page.evaluate(i=>{D.deck.show(i,0);return D.deck.current().steps;},scene);
    for(let step=0;step<=steps;step++)plans.push({kind:'steps',label:'scene '+(scene+1)+' step '+step,scene,step,phase:'endpoint',index:scene});}
  }
  if(plans.length>maxFrames){report.notes.push({kind:'truncated',frame:'plan',detail:`${plans.length} frames planned; reviewing the first ${maxFrames} (raise --max-frames)`});plans.length=maxFrames;}
  for(const lang of languages){
   await page.evaluate(l=>D.i18n.setLang(l),lang);
   for(const plan of plans){
    if(lang!==languages[0]&&plan.phase!=='endpoint')continue;
    const m=await frameAt(page,plan);
    const shoot=plan.phase!=='quarter';
    let file=null;
    if(shoot){file=path.join(output,`${lang}-${String(plan.index+1).padStart(2,'0')}-${plan.phase==='mid'?'mid-':''}${plan.label.replace(/[^\w.-]+/g,'_').slice(0,60)}.png`);await page.screenshot({path:file});}
    report.frames.push({lang,...plan,...m,file:file&&path.basename(file)});
   }
   if(lang===languages[0]&&plans.length>1)report.replay=await frameAt(page,plans[0]);
  }
  assess(report,film);
  // Contact sheets: twelve frames each, endpoints and mid frames in order.
  const shots=report.frames.filter(f=>f.file).map(f=>({file:path.join(output,f.file),label:`${f.lang} · ${f.label}${f.shapes===0?' · EMPTY':''}`}));
  const contact=await browser.newPage({viewport:{width:1440,height:1000}});
  for(let i=0;i<shots.length;i+=12){await contact.setContent(sheet(shots.slice(i,i+12),`${path.basename(artifact)} · frames ${i+1}–${Math.min(i+12,shots.length)} of ${shots.length}`));await contact.screenshot({path:path.join(output,`contact-${String(i/12+1).padStart(2,'0')}.png`),fullPage:true});}
  await contact.close();
 }catch(error){report.findings.push({kind:'review-failed',frame:'run',detail:error.stack||error.message});}
 finally{await browser.close();}
 report.ok=report.findings.length===0;
 fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
 const lines=[`Review of ${path.relative(root,artifact)} · mode ${report.mode}`+(report.duration!==undefined?` · ${report.cues.length} cues · ${report.duration} s`:'')+` · ${report.frames.length} frames · ${languages.join('/')}`];
 for(const f of report.frames.filter(f=>f.phase!=='quarter'&&f.lang===languages[0]))lines.push(`  ${f.label.padEnd(44).slice(0,44)} shapes ${String(f.shapes).padStart(5)}  cover ${(f.coverage*100).toFixed(1).padStart(5)}%  zoom ${f.zoom.toFixed(1)}×  extents ${f.extents?(f.extents.width+'×'+f.extents.height).padStart(9):'     none'}  outside ${f.outside}  text ${f.texts}/${f.uncontractedVisible.length}  overflow ${f.issues.length}`);
 lines.push(report.findings.length?`Findings (${report.findings.length}):`:'No findings. Look at the contact sheets anyway: a review reports what is drawn, not whether it explains.');
 for(const f of report.findings)lines.push(`  [${f.kind}] ${f.frame}: ${f.detail}`);
 if(report.notes.length){lines.push(`Notes (${report.notes.length}), to look at rather than to fix:`);for(const n of report.notes)lines.push(`  (${n.kind}) ${n.frame}: ${n.detail}`);}
 lines.push(`Frames and contact sheets: ${path.relative(root,output)}/`);
 console.log(lines.join('\n'));
 if(strict&&!report.ok)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1;});
