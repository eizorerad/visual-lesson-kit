/* Actual-browser lifecycle checks for the sphere renderer.
 * NODE_PATH=<runtime node_modules> node qa/trna/spacefill-lifecycle.cjs [index.html|trna-journey.html|dist/lesson.html]
 * PLAYWRIGHT_MODULE / PLAYWRIGHT_CHANNEL optionally select the browser runtime. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const pw=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {launch}=require('./browser.cjs');
const root=path.resolve(__dirname,'../..'),entry=path.resolve(root,process.argv[2]||'index.html'),output=path.join(root,'qa-output/trna-spacefill-lifecycle');
(async()=>{
 const browser=await launch(pw);
 const report={entry,browser:browser.version(),errors:[],contextWarnings:[]};
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
  page.on('pageerror',e=>report.errors.push(e.message));
  page.on('console',message=>{if(/too many.*(?:webgl|context)|(?:webgl|context).*limit|oldest.*context/i.test(message.text()))report.contextWarnings.push(message.text());});
  await page.goto(pathToFileURL(entry).href);
  await page.waitForFunction(()=>window.TRNA_FILM&&window.TrnaSphereRenderer&&window.TrnaSpacefill);
  report.initial=await page.evaluate(async()=>{
   TRNA_FILM.pause();await document.fonts.ready;
   const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
   svg.setAttribute('width','1280');svg.setAttribute('height','720');svg.setAttribute('viewBox','0 0 1280 720');
   svg.style.cssText='position:fixed;inset:0;z-index:9999;background:#fff;';document.body.append(svg);
   D.appearance.set({palette:'ocean',background:'white'});
   const molecule=TrnaSpacefill.create(svg),camera=TrnaWorld.cameraFor(TrnaJourney.sample(TrnaJourney.cues.at(-1).time).values);
   molecule.render(camera,1);
   function pixels(renderer){
    const canvas=renderer.canvas,gl=renderer.type==='webgl2'?canvas.getContext('webgl2'):null;
    let data;if(gl){data=new Uint8Array(canvas.width*canvas.height*4);gl.readPixels(0,0,canvas.width,canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,data);}
    else data=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
    let hash=2166136261,alphaHash=2166136261,opaquePixels=0;
    for(let i=0;i<data.length;i++){hash=Math.imul(hash^data[i],16777619);if(i%4===3){alphaHash=Math.imul(alphaHash^data[i],16777619);if(data[i])opaquePixels++;}}
    return {hash:hash>>>0,alphaHash:alphaHash>>>0,opaquePixels,width:canvas.width,height:canvas.height};
   }
   const geometry=()=>JSON.stringify(molecule.actors.map(a=>({center:a.center,radius:a.radius})));
   window.sphereLifecycle={svg,molecule,camera,pixels,geometry,initialPixels:pixels(molecule.renderer),initialGeometry:geometry(),initialFrames:molecule.renderer.frames};
   return {backend:molecule.renderer.type,frames:molecule.renderer.frames,atomCount:molecule.actors.length,pixels:sphereLifecycle.initialPixels};
  });
  assert.equal(report.initial.backend,'webgl2','Lifecycle regression requires a real WebGL2 context');
  assert.equal(report.initial.atomCount,1652);
  assert(report.initial.pixels.opaquePixels>10000,'Deposited molecule must produce visible GPU pixels');
  await page.waitForTimeout(300);
  report.retained=await page.evaluate(()=>{
   const t=sphereLifecycle;t.molecule.render(t.camera,1);const pixels=t.pixels(t.molecule.renderer);
   return {frames:t.molecule.renderer.frames,unchangedPixels:JSON.stringify(pixels)===JSON.stringify(t.initialPixels),unchangedGeometry:t.geometry()===t.initialGeometry};
  });
  assert.equal(report.retained.frames,report.initial.frames,'Paused and repeated identical views must not redraw');
  assert(report.retained.unchangedPixels,'Paused GPU pixels must survive presentation without redrawing');
  assert(report.retained.unchangedGeometry);
  await page.evaluate(()=>D.appearance.set({palette:'botanical'}));
  await page.waitForFunction(()=>sphereLifecycle.molecule.renderer.frames>sphereLifecycle.initialFrames);
  report.palette=await page.evaluate(()=>{
   const t=sphereLifecycle,pixels=t.pixels(t.molecule.renderer);
   return {frames:t.molecule.renderer.frames,pixels,changedColor:pixels.hash!==t.initialPixels.hash,unchangedSilhouette:pixels.alphaHash===t.initialPixels.alphaHash,unchangedGeometry:t.geometry()===t.initialGeometry};
  });
  assert(report.palette.changedColor,'Palette change must recolor a paused molecule');
  assert(report.palette.unchangedSilhouette&&report.palette.unchangedGeometry,'Palette change must retain molecular geometry');
  await page.evaluate(()=>{
   const t=sphereLifecycle;t.previousCanvas=t.molecule.renderer.canvas;
   const ext=t.previousCanvas.getContext('webgl2').getExtension('WEBGL_lose_context');
   if(!ext)throw new Error('Actual context-loss extension is unavailable');ext.loseContext();
  });
  await page.waitForFunction(()=>sphereLifecycle.molecule.renderer.type==='canvas-depth');
  report.fallback=await page.evaluate(()=>{
   const t=sphereLifecycle;
   return {backend:t.molecule.renderer.type,replacedCanvas:t.molecule.renderer.canvas!==t.previousCanvas,frames:t.molecule.renderer.frames,pixels:t.pixels(t.molecule.renderer),unchangedGeometry:t.geometry()===t.initialGeometry};
  });
  assert(report.fallback.replacedCanvas&&report.fallback.unchangedGeometry);
  assert(report.fallback.pixels.opaquePixels>10000,'Context loss must immediately repaint visible software pixels');
  assert.equal(report.fallback.frames,report.palette.frames+1,'Context loss must repaint the retained frame once');
  report.disposal=await page.evaluate(async()=>{
   const t=sphereLifecycle;t.molecule.dispose();t.molecule.dispose();
   const fallbackReleased=t.molecule.renderer.canvas.width===0&&t.molecule.renderer.canvas.height===0;
   t.svg.remove();
   const retained=[],spheres=[{center:[32,32,0],radius:18,color:[.9,.2,.1]}];
   for(let i=0;i<20;i++){
    const host=document.createElement('div');document.body.append(host);
    const renderer=TrnaSphereRenderer.create(host,{x:0,y:0,width:64,height:64});
    if(renderer.type!=='webgl2')throw new Error('Cycle '+i+' failed to create WebGL2');
    renderer.draw(spheres);const visible=t.pixels(renderer).opaquePixels;
    if(!visible)throw new Error('Cycle '+i+' did not render GPU pixels');
    const canvas=renderer.canvas,gl=canvas.getContext('webgl2'),frames=renderer.frames;
    renderer.dispose();renderer.dispose();renderer.draw(spheres);
    if(!gl.isContextLost())throw new Error('Cycle '+i+' retained its disposed WebGL context');
    if(renderer.frames!==frames||renderer.canvas!==canvas)throw new Error('Disposed renderer continued drawing or fell back');
    // Keep references alive: passing must not depend on garbage collection.
    retained.push({renderer,canvas,gl});host.remove();
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   }
   return {fallbackReleased,cycles:retained.length,allContextsLost:retained.every(item=>item.gl.isContextLost()),allCanvasesRetained:retained.every(item=>item.renderer.canvas===item.canvas)};
  });
  assert(report.disposal.fallbackReleased&&report.disposal.allContextsLost&&report.disposal.allCanvasesRetained);
  assert.equal(report.disposal.cycles,20);
  assert.deepEqual(report.contextWarnings,[],'Repeated lifecycle cycles must not exhaust browser context slots');
  assert.deepEqual(report.errors,[]);
  report.ok=true;
 }finally{
  fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));await browser.close();
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
