#!/usr/bin/env node
'use strict';
/* Detect missing rasterized text, including HTML titles/captions. A display-list
 * reset may legitimately refine antialiasing, so exact pixel differences remain
 * diagnostic; foreground must also lose spatial coverage to fail this audit. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{pathToFileURL}=require('node:url');
const pw=require('playwright'),{PNG}=require('pngjs');
const root=path.resolve(__dirname,'../..'),arg=process.argv.indexOf('--artifact');
const artifact=arg<0?path.join(root,'dist/lesson.html'):path.resolve(process.argv[arg+1]);
const out=path.join(root,'qa-output/atac/text-paint');fs.mkdirSync(out,{recursive:true});
function bounds(a,r){return{x0:Math.max(0,Math.floor(r.x)-2),x1:Math.min(a.width,Math.ceil(r.x+r.width)+2),y0:Math.max(0,Math.floor(r.y)-2),y1:Math.min(a.height,Math.ceil(r.y+r.height)+2)};}
function compare(a,b,regions,background){
 const aa=PNG.sync.read(a),bb=PNG.sync.read(b);assert.equal(aa.width,bb.width);assert.equal(aa.height,bb.height);
 const ink=(png,x,y)=>{if(x<0||y<0||x>=png.width||y>=png.height)return 0;const k=(y*png.width+x)*4;return Math.max(...background.map((v,c)=>Math.abs(png.data[k+c]-v)));};
 return regions.map(r=>{
  const box=bounds(aa,r);let different=0,pixels=0,observedInk=0,referenceInk=0,missing=0,referenceForeground=0;
  for(let y=box.y0;y<box.y1;y++)for(let x=box.x0;x<box.x1;x++){
   const k=(y*aa.width+x)*4,observed=ink(aa,x,y),reference=ink(bb,x,y);pixels++;observedInk+=observed;referenceInk+=reference;
   if(Math.max(...[0,1,2].map(c=>Math.abs(aa.data[k+c]-bb.data[k+c])))>12)different++;
   // Ignore faint antialias fringes. A small neighborhood accepts fractional
   // raster origins, but cannot substitute distant or absent glyphs.
   if(reference>=32){let nearby=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)nearby=Math.max(nearby,ink(aa,x+dx,y+dy));referenceForeground+=reference;if(nearby<Math.max(16,reference*.4))missing+=reference;}
  }
  const missingForegroundFraction=referenceForeground?missing/referenceForeground:0,inkRatio=referenceInk?observedInk/referenceInk:1;
  return {...r,different,pixels,observedInk,referenceInk,inkRatio,missingForegroundFraction,failed:different>12&&(missingForegroundFraction>.08||inkRatio<.8)};
 });
}
function altered(reference,region,background,kind){
 const source=PNG.sync.read(reference),result=PNG.sync.read(reference),b=bounds(source,region);
 for(let y=b.y0;y<b.y1;y++)for(let x=b.x0;x<b.x1;x++){
  const k=(y*source.width+x)*4;if(kind==='half'&&x>=(b.x0+b.x1)/2)continue;
  const sourceX=x-12;
  for(let c=0;c<3;c++)result.data[k+c]=kind==='shift'&&sourceX>=b.x0?source.data[(y*source.width+sourceX)*4+c]:background[c];
 }
 return PNG.sync.write(result);
}
(async()=>{
 const browser=await require('../trna/browser.cjs').launch(pw),page=await browser.newPage({viewport:{width:1440,height:900}}),report={artifact,artifactSha256:crypto.createHash('sha256').update(fs.readFileSync(artifact)).digest('hex'),frames:[],negativeControls:[],errors:[]};
 page.on('pageerror',e=>report.errors.push(e.message));
 try{
  await page.goto(pathToFileURL(artifact).href+'?lang=ru&qa=text-paint');await page.waitForFunction(()=>window.ATAC_FILM&&window.CINEMA);await page.evaluate(()=>CINEMA.pause());
  await require('./lib.cjs').assertDefaultRoute(page);
  for(const [lang,font,background]of[['ru','sans','black'],['en','serif','white']]){
   await page.evaluate(([lang,font,background])=>{D.i18n.setLang(lang);D.appearance.set({font,background,palette:'ocean'});},[lang,font,background]);
   for(const key of ['read-orientation','read-one','read-two','play-read-two','zoom-25','zoom-50','zoom-75','zoom-100']){
    if(key==='play-read-two'){
     await page.evaluate(()=>{CINEMA.seek(ATAC_FILM.cues.find(c=>c.key==='read-two').arrive+.6);CINEMA.play();});await page.waitForTimeout(1700);await page.evaluate(()=>CINEMA.pause());
    }else await page.evaluate(async key=>{const zoom=key.startsWith('zoom-'),cue=ATAC_FILM.cues.find(c=>c.key===(zoom?'nucleosome-real':key));CINEMA.seek(zoom?cue.arrive+cue.motion*Number(key.slice(5))/100:cue.time);await L.ready(D.deck.root());},key);
    await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    const textNodesRetained=await page.evaluate(async()=>{
     await L.ready(D.deck.root());
     const entries=[...D.deck.root().querySelectorAll('text[data-layout-id]')].filter(n=>{let q=n,a=1;while(q?.nodeType===1){const s=getComputedStyle(q);if(s.display==='none'||s.visibility==='hidden')return false;a*=+s.opacity;q=q.parentElement;}return a>.99&&n.children.length>0;}).map(n=>[n,[...n.children]]);
     await L.ready(D.deck.root());return entries.every(([n,children])=>children.length===n.children.length&&children.every((child,i)=>n.children[i]===child));
    });
    const regions=await page.evaluate(()=>{
     function opacity(n){let a=1;while(n?.nodeType===1){const s=getComputedStyle(n);if(s.display==='none'||s.visibility==='hidden')return 0;a*=+s.opacity;n=n.parentElement;}return a;}
     return [...D.deck.root().querySelectorAll('svg text,.film-title,.film-caption')].filter(n=>opacity(n)>.99&&n.textContent.trim()).map(n=>{const r=n.getBoundingClientRect();return{text:n.textContent,kind:n.matches('.film-title')?'title':n.matches('.film-caption')?'caption':'svg',x:r.x,y:r.y,width:r.width,height:r.height};}).filter(r=>r.width>0&&r.height>0);
    });
    const backgroundRgb=await page.evaluate(()=>getComputedStyle(document.body).backgroundColor.match(/[\d.]+/g).slice(0,3).map(Number));
    const name=[lang,font,background,key].join('-'),time=await page.evaluate(()=>CINEMA.current().time),before=await page.screenshot({path:path.join(out,name+'-before.png')});
    report.frames.push({name,time,lang,font,background,backgroundRgb,regions,before,textNodesRetained});
   }
  }
  for(const frame of report.frames){
   await page.evaluate(async frame=>{D.i18n.setLang(frame.lang);D.appearance.set({font:frame.font,background:frame.background,palette:'ocean'});CINEMA.seek(frame.time);await L.ready(D.deck.root());const root=D.deck.root(),old=root.style.display;root.style.display='none';root.getBoundingClientRect();root.style.display=old;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));},frame);
   const after=await page.screenshot({path:path.join(out,frame.name+'-reference.png')}),differences=compare(frame.before,after,frame.regions,frame.backgroundRgb);
   frame.failures=differences.filter(r=>r.failed);frame.differentPixels=differences.reduce((s,r)=>s+r.different,0);frame.pixelDiagnostics=differences;frame.regions=frame.regions.length;delete frame.before;
   if(frame.name.endsWith('zoom-75'))for(const [kind,regionKind]of[['remove','title'],['half','caption'],['shift','caption']]){
    const region=differences.find(r=>r.kind===regionKind),damaged=altered(after,region,frame.backgroundRgb,kind),result=compare(damaged,after,[region],frame.backgroundRgb)[0];
    report.negativeControls.push({name:frame.name+'-'+kind+'-'+regionKind,detected:result.failed,missingForegroundFraction:result.missingForegroundFraction,inkRatio:result.inkRatio});
   }
   console.log(JSON.stringify({name:frame.name,regions:frame.regions,failed:frame.failures.length,differentPixels:frame.differentPixels,textNodesRetained:frame.textNodesRetained}));
  }
  report.ok=!report.errors.length&&report.frames.every(f=>!f.failures.length&&f.textNodesRetained)&&report.negativeControls.length===6&&report.negativeControls.every(c=>c.detected);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({ok:report.ok,frames:report.frames.length,negativeControls:report.negativeControls}));if(!report.ok)process.exitCode=1;
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
