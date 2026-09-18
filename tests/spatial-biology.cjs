/* Standalone template rendering regression; optional Playwright/Chrome QA.
 * V3_BROWSER_TESTS=1 V3_BROWSER_CHANNEL=chrome node --test tests/spatial-biology.cjs
 * V3_BROWSER_OUTPUT optionally saves the audit JSON and representative frames.
 * Controlled A.run progress samples the real scene's midpoint deterministically.
 */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {pathToFileURL}=require('node:url');
const artifact=path.resolve(__dirname,'../examples/spatial-biology.html');

test('spatial biology standalone: 192 styled states, 42 midpoints, retained controls and offline rendering',
 {skip:process.env.V3_BROWSER_TESTS!=='1',timeout:300000},async t=>{
 const {chromium}=require('playwright');
 assert.ok(fs.existsSync(artifact),'Build examples/spatial-biology.html first');
 const artifactSha256=crypto.createHash('sha256').update(fs.readFileSync(artifact)).digest('hex');
 const output=process.env.V3_BROWSER_OUTPUT&&path.resolve(process.env.V3_BROWSER_OUTPUT);
 if(output)fs.mkdirSync(output,{recursive:true});
 const browser=await chromium.launch({headless:true,...(process.env.V3_BROWSER_CHANNEL?{channel:process.env.V3_BROWSER_CHANNEL}:{})});
 t.after(()=>browser.close());
 const page=await browser.newPage({viewport:{width:1280,height:720},reducedMotion:'reduce'});
 const errors=[],requests=[],states=[],midpoints=[],retention=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
 page.on('request',request=>{if(/^https?:/.test(request.url()))requests.push(request.url());});
 await page.goto(pathToFileURL(artifact).href);
 await page.waitForFunction(()=>window.D?.deck?.count()===3&&window.V3?.CellSurface);
 await page.evaluate(()=>document.fonts.ready);
 const scenes=await page.evaluate(()=>D.deck.scenes());
 assert.deepEqual(scenes.map(s=>[s.id,s.notes]),[['surface',12],['three-codes',6],['libraries',6]]);
 await page.evaluate(()=>{
  // Retain the real renderer API so pixels can be read immediately after paint,
  // before Chrome clears its non-preserved drawing buffer for presentation.
  const create=V3.CellSurface.create;
  V3.CellSurface.create=(...args)=>{const api=create(...args);window.spatialRenderer=api;return api;};
  window.spatialFrame=()=>{
   const root=D.deck.root(),audit=L.audit(root,{tolerance:1}),scale=D.deck.scale();
   const visible=node=>{
    let opacity=1;
    for(let p=node;p&&p!==root.parentElement;p=p.parentElement){
     const css=getComputedStyle(p);opacity*=+css.opacity;
     if(p.hidden||css.display==='none'||css.visibility==='hidden'||css.visibility==='collapse'||opacity<.05)return false;
    }
    return true;
   };
   const texts=[...root.querySelectorAll('svg text,.film-title,.film-caption,.lesson-slider>span,.lesson-slider>output')]
    .filter(node=>visible(node)&&node.textContent.trim())
    .map(node=>({text:node.textContent.trim(),box:node.getBoundingClientRect().toJSON()}));
   const collisions=[];
   for(let i=0;i<texts.length;i++)for(let j=i+1;j<texts.length;j++){
    const a=texts[i].box,b=texts[j].box;
    const width=(Math.min(a.right,b.right)-Math.max(a.left,b.left))/scale;
    const height=(Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top))/scale;
    if(width>2&&height>2)collisions.push({texts:[texts[i].text,texts[j].text],width,height});
   }
   const canvas=spatialRenderer.g.querySelector('canvas');spatialRenderer.paint({},true);
   const gl=canvas.getContext('webgl'),pixels=new Uint8Array(canvas.width*canvas.height*4);
   let nonempty=0,glError=null;
   if(gl){gl.readPixels(0,0,canvas.width,canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);glError=gl.getError();for(let i=3;i<pixels.length;i+=32)if(pixels[i]>8)nonempty++;}
   const nonfinite=[...root.querySelectorAll('*')].some(node=>[...node.attributes].some(a=>/\b(?:NaN|[+-]?Infinity)\b/.test(a.value)));
   const scene=D.deck.scenes()[D.deck.current().index],reading=D.i18n.lang()==='en'?
    [...D.i18n.notes(scene),...D.i18n.qa(scene).flatMap(q=>[q.q,q.a,q.source])]:[];
   return {
    current:D.deck.current(),audit:{checked:audit.checked,issues:audit.issues,unmeasured:audit.unmeasured,uncontractedText:audit.uncontractedText},
    collisions,cyrillic:D.i18n.lang()==='en'?[...texts.map(t=>t.text),...reading].filter(text=>/[А-Яа-яЁё]/.test(text)):[],
    nonfinite,renderer:spatialRenderer.g.dataset.surfaceRenderer,nonempty,glError,canvasCount:root.querySelectorAll('canvas').length,
    state:Object.fromEntries(Object.entries(root.dataset).filter(([key])=>/^(surface|capture|codes|libraries|freeMolecules)/.test(key)))
   };
  };
 });
 async function ready(){await page.evaluate(()=>L.ready(D.deck.root()));}
 async function go(index,step){await page.evaluate(({index,step})=>D.deck.show(index,step),{index,step});await page.waitForFunction(()=>!D.deck.current().busy);await ready();}
 async function capture(meta,collection){await ready();const frame=await page.evaluate(()=>spatialFrame());collection.push({...meta,...frame});return frame;}
 async function screenshot(name){if(output)await page.screenshot({path:path.join(output,name+'.png')});}
 for(const lang of ['ru','en'])for(const background of ['black','white'])for(const font of ['sans','serif']){
  await page.evaluate(options=>{D.i18n.setLang(options.lang);D.appearance.set({...options,palette:'ocean'});},{lang,background,font});
  for(let index=0;index<3;index++){
   await go(index,0);const steps=await page.evaluate(()=>D.deck.current().steps);
   assert.equal(steps,index===0?11:5,'All authored states are navigable');
   for(let step=0;step<=steps;step++){
    await go(index,step);await capture({lang,background,font,index,step},states);
    if((index===0&&[3,10,11].includes(step))||index>0)await screenshot(`${lang}-${background}-${font}-${index+1}-${step}`);
   }
  }
  t.diagnostic(`Checked 24 states: ${lang}/${background}/${font}`);
 }
 await page.emulateMedia({reducedMotion:'no-preference'});
 for(const [lang,background,font] of [['ru','black','sans'],['en','white','serif']]){
  await page.evaluate(options=>{D.i18n.setLang(options.lang);D.appearance.set({...options,palette:'ocean'});},{lang,background,font});
  for(let index=0;index<3;index++)for(let step=1;step<=(index===0?11:5);step++){
   await go(index,step-1);
   await page.evaluate(()=>{
    window.spatialBefore={root:D.deck.root(),canvas:spatialRenderer.g.querySelector('canvas'),state:spatialFrame().state};
    window.spatialOriginalRun=A.run;window.spatialTween=null;
    A.run=update=>new Promise(resolve=>{window.spatialTween={update,resolve};});
    D.deck.next();
   });
   await page.waitForFunction(()=>!!window.spatialTween);
   await page.evaluate(()=>spatialTween.update(.5));
   const midpoint=await capture({lang,background,font,index,step,progress:.5},midpoints);
   assert.notDeepEqual(midpoint.state,await page.evaluate(()=>spatialBefore.state),'Midpoint advances the scientific/camera state');
   assert.deepEqual(await page.evaluate(()=>({root:spatialBefore.root===D.deck.root(),canvas:spatialBefore.canvas===spatialRenderer.g.querySelector('canvas')})),{root:true,canvas:true},'A transition retains its scene and renderer');
   await screenshot(`mid-${lang}-${index+1}-${step}`);
   await page.evaluate(()=>{spatialTween.update(1);spatialTween.resolve();A.run=spatialOriginalRun;});
   await page.waitForFunction(()=>!D.deck.current().busy);
  }
 }
 // Real range input and live shell changes retain the scene, numeric state and canvas.
 for(const [index,step] of [[0,2],[1,2],[2,2]]){
  await go(index,step);
  if(index===0){
   const range=page.locator('.spatial-biology input[type=range]');
   await range.focus();await range.press('End');await ready();
   assert.equal(await page.evaluate(()=>+D.deck.root().dataset.surfaceYaw),180);
  }
  await page.evaluate(()=>{
   window.spatialRetained={root:D.deck.root(),canvas:spatialRenderer.g.querySelector('canvas'),state:spatialFrame().state,step:D.deck.current().step};
   D.i18n.setLang(D.i18n.lang()==='ru'?'en':'ru');
   const appearance=D.appearance.get();
   D.appearance.set({background:appearance.background==='black'?'white':'black',font:appearance.font==='sans'?'serif':'sans',palette:appearance.palette==='ocean'?'botanical':'ocean'});
  });
  await ready();
  retention.push(await page.evaluate(()=>({index:D.deck.current().index,sameRoot:spatialRetained.root===D.deck.root(),sameCanvas:spatialRetained.canvas===spatialRenderer.g.querySelector('canvas'),sameState:JSON.stringify(spatialRetained.state)===JSON.stringify(spatialFrame().state),sameStep:spatialRetained.step===D.deck.current().step})));
 }
 // Normal next-scene navigation uses the declared molecular identity bridge.
 await go(1,5);
 const sharedBefore=await page.evaluate(()=>[...F.motionBridge.capture(D.deck.root()).keys()]);
 assert.ok(sharedBefore.includes('cite-dna-products'),'The code scene declares the DNA products for continuity');
 await page.evaluate(()=>D.deck.next());
 await page.waitForFunction(()=>D.deck.current().index===2&&D.deck.root().dataset.motionBridgeActive==='true');
 const continuity=await page.evaluate(()=>({index:D.deck.current().index,step:D.deck.current().step,shared:[...D.deck.root().querySelectorAll('[data-shared-id]')].map(node=>node.dataset.sharedId)}));
 await page.waitForFunction(()=>!D.deck.root().dataset.motionBridgeActive);
 await ready();
 assert.equal(continuity.step,0);assert.ok(continuity.shared.includes('cite-dna-products'));
 const failures=[...states,...midpoints].filter(f=>f.audit.issues.length||f.audit.unmeasured||f.audit.uncontractedText.length||f.collisions.length||f.cyrillic.length||f.nonfinite||f.renderer!=='webgl'||f.nonempty<100||f.glError!==0||f.canvasCount!==1);
 const report={artifact:path.relative(path.resolve(__dirname,'..'),artifact),sha256:artifactSha256,browser:browser.version(),scenes,states,midpoints,retention,continuity,failures,errors,requests,physicalGesturesTested:false};
 if(output)fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
 assert.equal(states.length,192);assert.equal(midpoints.length,42);
 assert.deepEqual(retention.map(x=>[x.sameRoot,x.sameCanvas,x.sameState,x.sameStep]),[[true,true,true,true],[true,true,true,true],[true,true,true,true]]);
 assert.deepEqual(errors,[],'No JavaScript or console errors');assert.deepEqual(requests,[],'The standalone lesson makes no HTTP requests');
 assert.equal(failures.length,0,JSON.stringify(failures.map(f=>({lang:f.lang,background:f.background,font:f.font,index:f.index,step:f.step,progress:f.progress,issues:f.audit.issues,collisions:f.collisions,cyrillic:f.cyrillic,renderer:f.renderer,nonempty:f.nonempty,glError:f.glError})),null,2));
 t.diagnostic(`Chrome ${browser.version()}: 192 states, 42 deterministic midpoints, retained input/language/theme, no external requests`);
});
