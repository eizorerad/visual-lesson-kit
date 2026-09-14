/* Real browser checks of the built artifact; no library or sibling paths. */
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),{pathToFileURL}=require('url');
const {chromium}=require('playwright');
const project=path.resolve(process.argv[2]||path.join(__dirname,'../..'));
const out=path.resolve(process.argv[3]||path.join(project,'verification/molecular-views'));
fs.mkdirSync(out,{recursive:true});
async function run(){
 const target=path.join(project,'dist/lesson.html'),errors=[],requests=[],layout=[],motion=[],interactions=[];
 const browser=await chromium.launch({headless:true,channel:process.env.VLK_BROWSER_CHANNEL||'chrome'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
  await page.goto(pathToFileURL(target).href);await page.waitForFunction(()=>window.D?.deck?.count()&&window.D?.appearance);
  await page.evaluate(()=>document.fonts.ready);
  const scenes=await page.evaluate(()=>D.deck.scenes());
  async function go(index,step){await page.evaluate(o=>D.deck.show(o.index,o.step),{index,step});await page.waitForFunction(()=>!D.deck.current().busy);await page.evaluate(()=>L.ready(D.deck.root()));}
  for(const lang of ['ru','en'])for(const font of ['sans','serif'])for(const background of ['black','white'])for(const palette of ['warm','ocean','botanical']){
   await page.evaluate(o=>{D.i18n.setLang(o.lang);D.appearance.set(o);},{lang,font,background,palette});
   for(let index=0;index<scenes.length;index++){
    await go(index,0);const steps=await page.evaluate(()=>D.deck.current().steps);
    for(let step=0;step<=steps;step++){
     await go(index,step);
     const frame=await page.evaluate(()=>{
      const root=D.deck.root(),audit=L.audit(root,{tolerance:1});
      const visible=n=>{let a=1;for(let p=n;p&&p!==root.parentElement;p=p.parentElement){const s=getComputedStyle(p);a*=+s.opacity;if(s.display==='none'||s.visibility==='hidden'||a<.05)return false;}return true;};
      const texts=[...root.querySelectorAll('svg text')].filter(n=>visible(n)&&n.textContent.trim()).map(n=>({text:n.textContent,b:n.getBoundingClientRect().toJSON()}));
      const collisions=[];for(let i=0;i<texts.length;i++)for(let j=i+1;j<texts.length;j++){const a=texts[i].b,b=texts[j].b;if(Math.min(a.right,b.right)-Math.max(a.left,b.left)>3&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>3)collisions.push([texts[i].text,texts[j].text]);}
      const nonfinite=[...root.querySelectorAll('*')].some(n=>[...n.attributes].some(a=>/\b(?:NaN|[+-]?Infinity)\b/.test(a.value)));
      const layers=[...root.querySelectorAll('[data-mv-shared-depth],[data-mv-kind="assembly"]')];
      const ordered=layers.every(layer=>{const zs=[...layer.children].filter(n=>n.dataset.mvDepth!==undefined).map(n=>+n.dataset.mvDepth);return zs.every((z,i)=>i===0||z>=zs[i-1]-1e-8);});
      return {audit,collisions,nonfinite,ordered};
     });
     layout.push({index,step,lang,font,background,palette,...frame});
     if(palette==='ocean'&&font==='sans'&&background==='black')await page.screenshot({path:path.join(out,`${lang}-${index+1}-${step}.png`)});
    }
   }
  }
  await page.emulateMedia({reducedMotion:'no-preference'});
  for(const lang of ['ru','en'])for(let index=0;index<scenes.length;index++){
   await page.evaluate(lang=>{D.i18n.setLang(lang);D.appearance.set({background:lang==='ru'?'black':'white',font:lang==='ru'?'sans':'serif',palette:'ocean'});},lang);
   await go(index,0);const steps=await page.evaluate(()=>D.deck.current().steps);
   for(let step=1;step<=steps;step++){
    await go(index,step-1);
    await page.evaluate(()=>{
     const root=D.deck.root(),view=root.__molecular.view;window.mvAudit={root,source:JSON.stringify(view.data),nodes:[...root.querySelectorAll('[data-mv-source-bond],[data-mv-part]')],frames:[],stop:false};
     const sample=()=>{const m=window.mvAudit;if(m.stop||root!==D.deck.root())return;const a=L.audit(root);m.frames.push({phase:JSON.parse(root.dataset.state).phase,issues:a.issues.length,unmeasured:a.unmeasured});requestAnimationFrame(sample);};requestAnimationFrame(sample);D.deck.next();
    });
    await page.waitForTimeout(750);await page.screenshot({path:path.join(out,`mid-${lang}-${index+1}-${step}.png`)});
    await page.waitForFunction(()=>!D.deck.current().busy);
    const sample=await page.evaluate(()=>{const m=window.mvAudit;m.stop=true;return {frames:m.frames,sourceUnchanged:m.source===JSON.stringify(m.root.__molecular.view.data),nodesRetained:m.nodes.every(n=>n.isConnected),sameRoot:m.root===D.deck.root()};});
    motion.push({index,step,lang,...sample});
   }
  }
  // Genuine range-input interruption and live language/appearance without rebuilding.
  for(let index=0;index<scenes.length;index++){
   await go(index,0);if(!await page.locator('.scene input[type=range]').count())continue;
   await page.evaluate(()=>D.deck.next());await page.waitForTimeout(180);
   await page.evaluate(()=>{
    const root=D.deck.root(),slider=root.querySelector('input[type=range]');slider.value=slider.min;slider.dispatchEvent(new Event('input',{bubbles:true}));
    window.manual={root,state:JSON.stringify(root.__molecular.rig.state),node:root.querySelector('[data-mv-source-bond],[data-mv-part]')};
    D.i18n.setLang(D.i18n.lang()==='ru'?'en':'ru');D.appearance.set({background:'white',font:'serif',palette:'botanical'});
   });
   await page.waitForTimeout(250);
   interactions.push(await page.evaluate(()=>({sameRoot:manual.root===D.deck.root(),stateRetained:manual.state===JSON.stringify(manual.root.__molecular.rig.state),nodeRetained:manual.node.isConnected,inputSynced:+manual.root.querySelector('input[type=range]').value===manual.root.__molecular.rig.state.angle})));
  }
  const failures=layout.filter(f=>f.audit.issues.length||f.audit.unmeasured||f.audit.uncontractedText?.length||f.collisions.length||f.nonfinite||!f.ordered);
  const motionFailures=motion.filter(m=>m.frames.length<2||!m.sourceUnchanged||!m.nodesRetained||!m.sameRoot||m.frames.some(f=>f.issues||f.unmeasured));
  const report={target,sha256:crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex'),browser:browser.version(),scenes,layout,failures,motion,motionFailures,interactions,errors,requests,physicalGesturesTested:false};
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
  const summary={scenes:scenes.length,layoutFrames:layout.length,layoutFailures:failures.length,motionTransitions:motion.length,motionFrames:motion.reduce((n,m)=>n+m.frames.length,0),motionFailures:motionFailures.length,interactions,errors,requests,out};console.log(JSON.stringify(summary,null,2));
  if(failures.length||motionFailures.length||errors.length||requests.length||interactions.some(x=>Object.values(x).some(v=>!v)))process.exitCode=1;
 }finally{await browser.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
