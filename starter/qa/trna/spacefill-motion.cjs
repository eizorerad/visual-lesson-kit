/* Browser pixels, not SVG paint order, define a correct sphere view.
 * NODE_PATH=<runtime node_modules> node qa/trna/spacefill-motion.cjs [index.html|dist/lesson.html]
 * Optional PLAYWRIGHT_MODULE / PNGJS_MODULE resolve dependencies; SPACEFILL_MOTION_LABEL
 * preserves a named evidence set when comparing the old and new renderer.
 * SPACEFILL_SOFTWARE=1 forces the no-WebGL path. SPACEFILL_LEGACY_RENDERER=<path>
 * substitutes an archived renderer for a deliberately failing source-entry run. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const pw=require(process.env.PLAYWRIGHT_MODULE||'playwright'),{PNG}=require(process.env.PNGJS_MODULE||'pngjs');
const {launch}=require('./browser.cjs');
const root=path.resolve(__dirname,'../..'),entry=path.resolve(root,process.argv[2]||'index.html');
const label=(process.env.SPACEFILL_MOTION_LABEL||'current').replace(/[^a-zA-Z0-9_-]/g,'_');
const output=path.join(root,'qa-output/trna-spacefill-motion',label);
const legacy=process.env.SPACEFILL_LEGACY_RENDERER?path.resolve(root,process.env.SPACEFILL_LEGACY_RENDERER):null;
const forceSoftware=process.env.SPACEFILL_SOFTWARE==='1';
const softwareOnly=()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl2'?null:original.call(this,type,...args);};};
// These deposited atom pairs exchange center depth during the film's final turn.
// The angle is independently re-solved below; it is not a renderer implementation detail.
const crossings=[{ids:[612,613],residue:29,names:["C5'","C4'"]},{ids:[720,721],residue:34,names:["C5'","C4'"]},{ids:[956,957],residue:44,names:["C5'","C4'"]}];
function difference(before,after){
 const a=PNG.sync.read(before),b=PNG.sync.read(after);assert.equal(a.width,b.width);assert.equal(a.height,b.height);
 const heat=new PNG({width:a.width,height:a.height});let strongPixels=0,maxChannelDelta=0,totalChannelDelta=0;
 for(let i=0;i<a.data.length;i+=4){const d=Math.max(...[0,1,2].map(c=>Math.abs(a.data[i+c]-b.data[i+c])));if(d>=20)strongPixels++;maxChannelDelta=Math.max(maxChannelDelta,d);totalChannelDelta+=d;heat.data[i]=d;heat.data[i+1]=0;heat.data[i+2]=0;heat.data[i+3]=255;}
 return {strongPixels,maxChannelDelta,totalChannelDelta,heat:PNG.sync.write(heat)};
}
function pixel(png,x,y){const p=PNG.sync.read(png),i=(y*p.width+x)*4;return [...p.data.subarray(i,i+3)];}
(async()=>{
 fs.mkdirSync(output,{recursive:true});const browser=await launch(pw);
 const report={entry,legacy,forceSoftware,browser:browser.version(),viewport:[1280,720],crossings:[],occlusion:[],errors:[],failures:[]};
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});page.on('pageerror',e=>report.errors.push(e.message));
  if(legacy){assert.equal(path.basename(entry),'index.html','Legacy replacement is supported by the unbundled source entry');await page.route('**/trna-spacefill.js',route=>route.fulfill({contentType:'application/javascript',body:fs.readFileSync(legacy,'utf8')}));}
  if(forceSoftware)await page.addInitScript(softwareOnly);
  await page.goto(pathToFileURL(entry).href);await page.waitForFunction(()=>window.TRNA_FILM&&window.TrnaJourney?.actor);
  await page.evaluate(async()=>{TRNA_FILM.seek(TrnaJourney.cues.at(-1).time);await document.fonts.ready;});await page.addStyleTag({content:'*{animation:none!important;transition:none!important;caret-color:transparent!important}'});
  report.backend=await page.evaluate(()=>document.querySelector('[data-sphere-renderer]')?.dataset.sphereRenderer||'svg-disc');
  const sourceBefore=await page.evaluate(()=>JSON.stringify(TRNA_SPACEFILL_DATA));
  for(const crossing of crossings){
   const evidence=await page.evaluate(({ids})=>{
    const base=TrnaJourney.sample(TrnaJourney.cues.at(-1).time).values,atoms=ids.map(id=>TRNA_SPACEFILL_DATA.atoms.find(a=>a.id===id));
    if(atoms.some(a=>!a))throw new Error('Missing deposited pair');
    const project=angle=>{const camera=TrnaWorld.cameraFor({...base,surfaceAngle:angle}),p=TrnaAtoms.projector(camera);return atoms.map(atom=>p(atom.xyz));};
    let lo=0,hi=35;const sign=project(lo)[0][2]-project(lo)[1][2];
    if(sign*(project(hi)[0][2]-project(hi)[1][2])>=0)throw new Error('Pair no longer crosses within final camera turn');
    for(let i=0;i<45;i++){const mid=(lo+hi)/2,p=project(mid);if((p[0][2]-p[1][2])*sign>0)lo=mid;else hi=mid;}
    const angle=(lo+hi)/2,epsilon=.00001,before=project(angle-epsilon),after=project(angle+epsilon);
    return {angle,epsilon,atoms:atoms.map(({id,residue,name,xyz})=>({id,residue,name,xyz})),before,after,maxCenterMovement:Math.max(...before.map((p,i)=>Math.hypot(p[0]-after[i][0],p[1]-after[i][1])))};
   },crossing);
   const frames=[];for(const sign of [-1,1]){await page.evaluate(angle=>TrnaJourney.actor.paint({...TrnaJourney.sample(TrnaJourney.cues.at(-1).time).values,surfaceAngle:angle}),evidence.angle+sign*evidence.epsilon);frames.push(await page.screenshot());}
   const delta=difference(...frames),prefix='atoms-'+crossing.ids.join('-');
   fs.writeFileSync(path.join(output,prefix+'-before.png'),frames[0]);fs.writeFileSync(path.join(output,prefix+'-after.png'),frames[1]);fs.writeFileSync(path.join(output,prefix+'-difference.png'),delta.heat);
   const {heat,...metrics}=delta;report.crossings.push({...evidence,...metrics});
   if(evidence.maxCenterMovement>=.001)report.failures.push(prefix+': source centers moved too far for continuity test');
   if(delta.strongPixels>8)report.failures.push(prefix+': '+delta.strongPixels+' pixels jump by >=20 RGB levels across only 0.00002 degrees (limit 8)');
  }
  if(await page.evaluate(()=>JSON.stringify(TRNA_SPACEFILL_DATA))!==sourceBefore)report.failures.push('Camera rendering changed source atom data');
  // Synthetic regression fixture: two intersecting spheres with equal center depth.
  // Each sphere must win on its own side of their shared projected lens; drawing
  // either entire disc last is geometrically wrong and fails a channel-dominance check.
  const fixture=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});fixture.on('pageerror',e=>report.errors.push(e.message));
  await fixture.setContent('<!doctype html><html><head><style>html,body{margin:0;background:#fff}svg{display:block}:root{--color-primary:rgb(220,45,45);--color-secondary:rgb(35,70,220);--color-blue:rgb(220,45,45);--color-teal:rgb(35,70,220);--color-gold:#ba8e22;--color-grey:#888;--color-purple:#9055bb;--color-bg:#fff}</style></head><body><svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720"></svg></body></html>');
  if(forceSoftware)await fixture.evaluate(softwareOnly);
  await fixture.evaluate(()=>{
   window.C=Object.fromEntries(['blue','teal','gold','grey','purple','white'].map(name=>[name,'var(--color-'+name+')']));
   window.TRNA_SPACEFILL_DATA={radii:{C:1.7},atoms:[{id:1,residue:1,component:'TEST',name:'left',element:'C',xyz:[-.5,0,0]},{id:2,residue:10,component:'TEST',name:'right',element:'C',xyz:[.5,0,0]}]};
  });
  for(const file of ['lib/dom.js','film.js','trna-atoms.js','trna-sphere-renderer.js','trna-spacefill.js'])await fixture.addScriptTag({path:file==='trna-spacefill.js'&&legacy?legacy:path.join(root,'js',file)});
  await fixture.evaluate(()=>{window.testSpheres=TrnaSpacefill.create(document.querySelector('svg'));});
  for(const angle of [-.00001,0,.00001]){
   await fixture.evaluate(angle=>testSpheres.render({origin:[0,0,0],basis:[[1,0,0],[0,1,0],[0,0,1]],cx:640,cy:360,scale:50,angle,tilt:0},1),angle);
   const image=await fixture.screenshot(),left=pixel(image,620,360),right=pixel(image,660,360),leftRed=left[0]-left[2]>40,rightBlue=right[2]-right[0]>40;
   fs.writeFileSync(path.join(output,'two-spheres-'+String(angle).replace('.','_')+'.png'),image);
   report.occlusion.push({backend:await fixture.evaluate(()=>testSpheres.renderer?.type||'svg-disc'),angle,leftPixel:[620,360],leftRGB:left,rightPixel:[660,360],rightRGB:right,leftRed,rightBlue});
   if(!leftRed||!rightBlue)report.failures.push('Equal-depth overlapping spheres at '+angle+' degrees do not each own their nearest surface pixels');
  }
  report.ok=!report.failures.length&&!report.errors.length;
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
  assert.ok(report.ok,report.failures.concat(report.errors).join('\n'));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
