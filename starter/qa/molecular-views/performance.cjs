/* Real molecular overview transitions, measured separately from layout QA.
 * Usage: node qa/molecular-views/performance.cjs [built.html] [report.json]
 * Requires Playwright and an installed Chrome; no timing threshold is universal. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),os=require('node:os');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright');
const target=path.resolve(process.argv[2]||path.join(__dirname,'../../dist/lesson.html'));
const output=path.resolve(process.argv[3]||path.join(__dirname,'../../verification/molecular-performance.json'));
const repeats=Number(process.env.VLK_BENCH_RUNS||3),warmups=Number(process.env.VLK_BENCH_WARMUPS||1);
const cpuRate=Number(process.env.VLK_BENCH_CPU_RATE||1);
const mutations=process.env.VLK_BENCH_MUTATIONS!=='0';
if(!Number.isInteger(repeats)||repeats<1||!Number.isInteger(warmups)||warmups<0||!Number.isFinite(cpuRate)||cpuRate<1)throw new RangeError('Use positive integer runs, nonnegative integer warmups, and CPU rate >=1');
function stats(values){
 const xs=values.slice().sort((a,b)=>a-b),q=p=>xs[Math.min(xs.length-1,Math.ceil(xs.length*p)-1)]??null;
 return {count:xs.length,median:q(.5),p95:q(.95),max:xs.at(-1)??null,mean:xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null,over25ms:xs.filter(x=>x>25).length};
}
function summarize(run){
 return {...run,raf:stats(run.rafIntervalsMs),paint:stats(run.paintDurationMs),paintInterval:stats(run.paintStartIntervalsMs)};
}
async function main(){
 const bytes=fs.readFileSync(target),errors=[],consoleErrors=[];
 const browser=await chromium.launch({headless:true,channel:process.env.VLK_BROWSER_CHANNEL||'chrome'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'no-preference'});
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});
  const browserCdp=await browser.newBrowserCDPSession();
  const systemInfo=await browserCdp.send('SystemInfo.getInfo');
  await page.goto(pathToFileURL(target).href+'?lang=ru#1');
  await page.waitForFunction(()=>window.D?.deck?.root()?.__molecular?.view);
  await page.evaluate(async()=>{await document.fonts.ready;D.appearance.set({background:'black',font:'sans',palette:'ocean'});await L.ready(D.deck.root());});
  const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:cpuRate});
  const metadata=await page.evaluate(()=>({title:document.title,userAgent:navigator.userAgent,hardwareConcurrency:navigator.hardwareConcurrency,actorCount:D.deck.root().__molecular.view.g.querySelectorAll('[data-mv-source-bond]').length,sourceRows:D.deck.root().__molecular.view.data.traces.reduce((sum,t)=>sum+t.rows.length,0),scenes:D.deck.count(),frameShadow:getComputedStyle(document.querySelector('.slide-frame')).boxShadow,svgTransform:getComputedStyle(document.querySelector('.film-viz')).transform,svgContain:getComputedStyle(document.querySelector('.film-viz')).contain}));
  async function prepare(step){
   await page.evaluate(step=>D.deck.show(0,step-1),step);
   await page.waitForFunction(()=>!D.deck.current().busy);
   await page.evaluate(async()=>{await L.ready(D.deck.root());await new Promise(resolve=>{let n=0;const f=()=>++n<5?requestAnimationFrame(f):resolve();requestAnimationFrame(f);});});
  }
  async function measure(step,observeMutations=false){
   await prepare(step);
   return summarize(await page.evaluate(({step,observeMutations})=>new Promise((resolve,reject)=>{
    const root=D.deck.root(),view=root.__molecular.view,original=view.paint;
    const paintStarts=[],paintDurations=[],rafTimes=[];
    const mutationCounts={records:0,childList:0,added:0,removed:0,attributes:{},characterData:0};
    let observer=null,raf=0;
    if(observeMutations){observer=new MutationObserver(changes=>{for(const c of changes){mutationCounts.records++;if(c.type==='childList'){mutationCounts.childList++;mutationCounts.added+=c.addedNodes.length;mutationCounts.removed+=c.removedNodes.length;}else if(c.type==='attributes')mutationCounts.attributes[c.attributeName]=(mutationCounts.attributes[c.attributeName]||0)+1;else mutationCounts.characterData++;}});observer.observe(root,{subtree:true,attributes:true,childList:true,characterData:true});}
    view.paint=function(...args){const start=performance.now();try{return original.apply(this,args);}finally{paintStarts.push(start);paintDurations.push(performance.now()-start);}};
    const start=performance.now();
    const timeout=setTimeout(()=>{cancelAnimationFrame(raf);view.paint=original;observer?.disconnect();reject(new Error('Transition timed out'));},15000);
    const sample=ts=>{
     rafTimes.push(ts);
     if(D.deck.current().busy||!paintDurations.length){raf=requestAnimationFrame(sample);return;}
     clearTimeout(timeout);observer?.disconnect();view.paint=original;
     const diffs=xs=>xs.slice(1).map((x,i)=>x-xs[i]);
     resolve({step,kind:step===1?'rotation':'opacity-only',elapsedMs:performance.now()-start,paintSpanMs:paintStarts.at(-1)+paintDurations.at(-1)-paintStarts[0],rafIntervalsMs:diffs(rafTimes),paintDurationMs:paintDurations,paintStartIntervalsMs:diffs(paintStarts),finalDeckState:D.deck.current(),finalCameraState:JSON.parse(root.dataset.state),mutationCounts:observeMutations?mutationCounts:null});
    };
    D.deck.next();raf=requestAnimationFrame(sample);
   }),{step,observeMutations}));
  }
  const warmupResults=[],runs=[],mutationRuns=[];
  for(let i=0;i<warmups;i++)for(const step of [1,2])warmupResults.push({run:i+1,...await measure(step)});
  for(let i=0;i<repeats;i++)for(const step of [1,2])runs.push({run:i+1,...await measure(step)});
  if(mutations)for(const step of [1,2])mutationRuns.push(await measure(step,true));
  const summary=Object.fromEntries([1,2].map(step=>{const selected=runs.filter(r=>r.step===step);return [step===1?'rotation':'opacity-only',{runs:selected.length,elapsed:stats(selected.map(r=>r.elapsedMs)),raf:stats(selected.flatMap(r=>r.rafIntervalsMs)),paint:stats(selected.flatMap(r=>r.paintDurationMs)),paintInterval:stats(selected.flatMap(r=>r.paintStartIntervalsMs))}];}));
  if(!bytes.equals(fs.readFileSync(target)))throw new Error('HTML changed during measurement; rerun against an immutable build');
  const result={target,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),recordedAt:new Date().toISOString(),browser:browser.version(),node:process.version,systemInfo,host:{platform:process.platform,arch:process.arch,cpu:os.cpus()[0].model},cpuThrottlingRate:cpuRate,viewport:{width:1440,height:900},reducedMotion:'no-preference',language:'ru',appearance:{background:'black',font:'sans',palette:'ocean'},method:'D.deck.show prepares prior step; five idle RAF frames after L.ready; D.deck.next performs actual 1900ms guided transition; paint wrapper only performance.now + numeric push; independent RAF sampler; no per-frame layout audit. Mutations measured in separate runs, excluded from timing summary.',metadata,summary,warmupResults,runs,mutationRuns,errors,consoleErrors};
  fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify({output,sha256:result.sha256,browser:result.browser,cpuThrottlingRate:cpuRate,metadata,summary,errors,consoleErrors},null,2));
  if(errors.length||consoleErrors.length)process.exitCode=1;
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
