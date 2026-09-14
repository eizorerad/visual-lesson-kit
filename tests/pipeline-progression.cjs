/* Behavioral route regression. DOM checks do not replace native click/render QA. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
const starter=process.env.LESSON_TEST_DIR||path.join(__dirname,'..','starter');
function fixture(t,id){
 const dom=new JSDOM('<body></body>',{runScripts:'outside-only',pretendToBeVisual:true,url:'http://localhost/lesson/'}),w=dom.window;
 t.after(()=>w.close());w.matchMedia=()=>({matches:false});
 for(const file of ['lib/dom','lib/i18n','lib/num','lib/anim','lib/plot','lib/svg','lesson','interaction-regions','film','layout','motion','patterns'])w.eval(fs.readFileSync(path.join(starter,'js',file+'.js'),'utf8'));
 const scenes=[];w.D.deck={register:scene=>scenes.push(scene),count:()=>4};w.eval(fs.readFileSync(path.join(starter,'js/recipes/pipeline-synthesis.js'),'utf8'));
 const scene=scenes.find(s=>s.id===id),steps=[],disposes=[];assert(scene,'fixture scene exists');
 const root=scene.build({index:scenes.indexOf(scene),step:fn=>steps.push(fn),onDispose:fn=>disposes.push(fn)});w.document.body.append(root);t.after(()=>disposes.forEach(fn=>fn()));
 return {w,root,steps,scene};
}
function routePaint(root){return [...root.querySelectorAll('[data-pipeline-path]')].map(el=>({id:el.dataset.pipelinePath,el,visible:el.style.opacity!== '0'&&el.getAttribute('visibility')!=='hidden',offset:Number(el.getAttribute('stroke-dashoffset')||0)}));}
const PATHS=['proposal','sample','mean','range'];
const MANIFEST=[
 {id:'pipeline-inputs',beats:[
  {id:'inputs-known',nodes:['proposal','sample'],edges:[],revealed:[]},
  {id:'inputs-construct',nodes:['proposal','sample','construction'],edges:['proposal','sample'],revealed:['proposal','sample']},
  {id:'inputs-evaluate',nodes:['construction','reference','mean','range'],edges:['mean','range'],revealed:PATHS}
 ]},
 {id:'pipeline-shift',beats:[
  {id:'shift-question',nodes:['proposal','construction'],edges:['proposal']},
  {id:'shift-move',nodes:['proposal','construction','mean'],edges:['proposal','mean']},
  {id:'shift-check',nodes:['construction','mean','reference'],edges:['mean']}
 ]},
 {id:'pipeline-spread',beats:[
  {id:'spread-question',nodes:['sample','construction'],edges:['sample']},
  {id:'spread-collapse',nodes:['construction','range'],edges:['range']},
  {id:'spread-restore',nodes:['sample','construction','range'],edges:['sample','range']}
 ]},
 {id:'pipeline-synthesis',beats:[
  {id:'synthesis-overview',nodes:[],edges:[]},
  {id:'synthesis-mean',nodes:['proposal','construction','mean'],edges:['proposal','mean']},
  {id:'synthesis-range',nodes:['sample','construction','range'],edges:['sample','range']},
  {id:'synthesis-check',nodes:['construction','mean','reference'],edges:['mean']}
 ]}
];
MANIFEST.forEach(scene=>scene.beats.forEach(beat=>beat.revealed=beat.revealed||PATHS));
const sorted=xs=>[...xs].sort(),plain=x=>JSON.parse(JSON.stringify(x)),settle=()=>new Promise(resolve=>setImmediate(resolve));
function snapshot(root){return{
 beat:root.dataset.pipelineBeat,attention:JSON.parse(root.dataset.pipelineAttention||'null'),revealed:JSON.parse(root.dataset.pipelineRevealed||'null'),
 state:JSON.parse(root.dataset.pipelineState),result:root.dataset.pipelineResult,
 paths:routePaint(root).map(p=>({...p,progress:Number(p.el.dataset.pipelineProgress),active:p.el.dataset.pipelineActive==='true'})),
 flows:[...root.querySelectorAll('[data-pipeline-flow]')].map(el=>({id:el.dataset.pipelineFlow,progress:Number(el.dataset.pipelineProgress),el})),
 nodes:[...root.querySelectorAll('[data-pipeline-node]')].filter(el=>el.dataset.pipelineNode!=='evaluation').map(el=>({id:el.dataset.pipelineNode,active:el.dataset.pipelineActive==='true',opacity:Number(el.style.opacity||1)})),
 cells:[...root.querySelectorAll('[data-pipeline-cell]')],bars:[...root.querySelectorAll('[data-pipeline-bar]')]
};}
function endpoint(s,beat){
 assert.equal(s.beat,beat.id);assert.deepEqual(sorted(s.attention.edges),sorted(beat.edges));assert.deepEqual(sorted(s.attention.nodes),sorted(beat.nodes));
 assert.deepEqual(sorted(s.paths.map(p=>p.id)),sorted(PATHS));assert.deepEqual(sorted(s.paths.filter(p=>p.active).map(p=>p.id)),sorted(beat.edges));
 assert.deepEqual(sorted(s.flows.map(p=>p.id)),sorted(PATHS),'separate flow actors cover the same four paths');
 assert.deepEqual(sorted(s.nodes.filter(n=>n.active).map(n=>n.id)),sorted(beat.nodes));
 for(const p of s.paths){const expected=beat.revealed.includes(p.id)?1:0;assert.equal(p.progress,expected,p.id+' revealed at '+beat.id);assert.equal(s.revealed[p.id],expected,'root/path metadata agree');assert.equal(p.visible,!!expected,'actual stroke visibility agrees');assert.equal(p.offset,1-expected,'actual stroke reveal agrees');}
}
function actorIdentity(s,original){assert.deepEqual(s.paths.map(p=>p.el),original.paths.map(p=>p.el));assert.deepEqual(s.flows.map(p=>p.el),original.flows.map(p=>p.el));assert.deepEqual(s.cells,original.cells);assert.deepEqual(s.bars,original.bars);}
function manualScheduler(w){const jobs=[];w.A.run=paint=>new Promise(resolve=>jobs.push({paint,resolve}));return{
 pending:()=>jobs.length,
 async finish(root){const job=jobs.shift(),rows=[snapshot(root)];assert(job,'one animation was scheduled');for(let i=0;i<=20;i++){job.paint(i/20);rows.push(snapshot(root));}job.resolve();await settle();rows.push(snapshot(root));return rows;}
};}

test('explicit replay never erases a route that is already fully revealed',async t=>{
 const {w,root}=fixture(t,'pipeline-synthesis'),before=routePaint(root);
 assert.deepEqual(before.map(r=>r.id),['proposal','sample','mean','range']);
 assert(before.every(r=>r.visible&&r.offset===0),'precondition: four real stroke actors are fully visible');
 const values=root.dataset.pipelineResult,cells=[...root.querySelectorAll('[data-pipeline-cell]')],bars=[...root.querySelectorAll('[data-pipeline-bar]')];
 const frames=[];w.A.run=paint=>new Promise(resolve=>frames.push({paint,resolve}));
 const replay=root.querySelector('[data-vlk-button="pipeline-trace"]');assert(replay,'explicit replay control exists');
 replay.dispatchEvent(new w.MouseEvent('click',{bubbles:true,cancelable:true}));
 function intact(phase){
  const now=routePaint(root);assert.deepEqual(now.map(r=>r.el),before.map(r=>r.el),'same route actors '+phase);
  assert(now.every(r=>r.visible&&r.offset===0),'Replay must preserve already-visible strokes '+phase+'; actual: '+JSON.stringify(now.map(({id,visible,offset})=>({id,visible,offset}))));
  assert.equal(root.dataset.pipelineResult,values,'replay does not change prediction or evaluation');
  assert.deepEqual([...root.querySelectorAll('[data-pipeline-cell]')],cells);assert.deepEqual([...root.querySelectorAll('[data-pipeline-bar]')],bars);
 }
 intact('immediately after activation');assert.equal(frames.length,1,'one replay animation');
 for(let i=0;i<=20;i++){frames[0].paint(i/20);intact('at '+i+'/20');}
 frames[0].resolve();await Promise.resolve();await Promise.resolve();intact('after completion');
});

test('each scripted step accumulates paths and moves attention to its own semantic operation',async t=>{
 let states=0,frames=0;
 for(const spec of MANIFEST){
  const {w,root,steps,scene}=fixture(t,spec.id),scheduler=manualScheduler(w),initial=snapshot(root);endpoint(initial,spec.beats[0]);states++;
  assert.equal(scene.notes.length,spec.beats.length);assert.equal(steps.length,spec.beats.length-1);
  for(let i=0;i<steps.length;i++){
   const before=snapshot(root),previous=spec.beats[i],next=spec.beats[i+1],activeEdges=new Set([...previous.edges,...next.edges]),activeNodes=new Set([...previous.nodes,...next.nodes]);
   assert.notDeepEqual(sorted(previous.edges),sorted(next.edges),'every Next changes the attended path subset');
   const active=steps[i](),rows=await scheduler.finish(root);await active;
   for(const s of rows){
    actorIdentity(s,initial);assert.equal(s.beat,next.id);assert(s.attention.edges.every(id=>activeEdges.has(id)));assert(s.attention.nodes.every(id=>activeNodes.has(id)));
    for(const p of s.paths){assert(p.progress>=0&&p.progress<=1);assert(p.progress+1e-12>=before.paths.find(x=>x.id===p.id).progress,'a known path must not reset');if(!next.revealed.includes(p.id)){assert.equal(p.progress,0);assert.equal(p.active,false);}}
    assert(s.flows.every(p=>p.progress===0||activeEdges.has(p.id)),'flow must remain in the current operation');frames++;
   }
   endpoint(snapshot(root),next);states++;
  }
 }
 assert.equal(states,13);t.diagnostic(`${states} authored endpoints and ${frames} intermediate samples match the independent operation map.`);
});

test('Replay uses only revealed paths and preserves parameters, result, attention and actors at every beat',async t=>{
 for(const spec of MANIFEST){
  const {w,root,steps}=fixture(t,spec.id),scheduler=manualScheduler(w);
  for(let step=0;step<spec.beats.length;step++){
   if(step){const active=steps[step-1]();await scheduler.finish(root);await active;}
   const before=snapshot(root),replay=root.querySelector('[data-vlk-button="pipeline-trace"]');assert(replay,'every checkpoint offers explicit Replay');
   replay.dispatchEvent(new w.MouseEvent('click',{bubbles:true,cancelable:true}));
   const rows=scheduler.pending()?await scheduler.finish(root):[snapshot(root)];
   for(const s of rows){
    actorIdentity(s,before);assert.equal(s.beat,before.beat);assert.equal(s.result,before.result);assert.equal(s.state.shift,before.state.shift);assert.equal(s.state.spread,before.state.spread);
    assert.deepEqual(s.paths.map(p=>[p.id,p.progress,p.visible,p.offset]),before.paths.map(p=>[p.id,p.progress,p.visible,p.offset]),'Replay does not erase or add persistent paths');
    assert(s.flows.every(p=>p.progress===0||spec.beats[step].revealed.includes(p.id)),'Replay cannot expose a future route');
   }
   assert.deepEqual(snapshot(root).attention,before.attention,'Replay restores prior attention');endpoint(snapshot(root),spec.beats[step]);
  }
 }
});

test('native browser: real Next, Back and Replay preserve the known route and local attention',
 {skip:process.env.VLK_NATIVE_BROWSER!=='1'},async t=>{
 const {chromium}=require(process.env.VLK_PLAYWRIGHT_MODULE||'playwright'),crypto=require('node:crypto');
 const recipeHash=()=>crypto.createHash('sha256').update(fs.readFileSync(path.join(starter,'js/recipes/pipeline-synthesis.js'))).digest('hex'),sourceSha256=recipeHash();
 const browser=await chromium.launch({headless:true,...(process.env.VLK_BROWSER_EXECUTABLE?{executablePath:process.env.VLK_BROWSER_EXECUTABLE}:{})});t.after(()=>browser.close());
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[],checks=[],captures=[];
 page.on('pageerror',e=>errors.push(e.message));
 const url=process.env.VLK_SYNTHESIS_URL||'http://127.0.0.1:8172/starter/synthesis.html',response=await page.goto(url),artifactSha256=crypto.createHash('sha256').update(await response.body()).digest('hex');
 await page.waitForFunction(()=>window.D?.deck?.count()===4);
 await page.evaluate(()=>{
  window.__pipelineRemember=()=>{const root=D.deck.root();window.__pipelineOriginal={root,paths:[...root.querySelectorAll('[data-pipeline-path]')],flows:[...root.querySelectorAll('[data-pipeline-flow]')],cells:[...root.querySelectorAll('[data-pipeline-cell]')],bars:[...root.querySelectorAll('[data-pipeline-bar]')]};};
  window.__pipelineSnapshot=()=>{
   const root=D.deck.root(),old=window.__pipelineOriginal;
   function stroke(el){const c=getComputedStyle(el);let opacity=1;for(let p=el;p&&p!==root.parentElement;p=p.parentElement)opacity*=Number(getComputedStyle(p).opacity);return{opacity:opacity*Number(c.strokeOpacity),offset:Number.parseFloat(c.strokeDashoffset),visibility:c.visibility,display:c.display};}
   const paths=[...root.querySelectorAll('[data-pipeline-path]')],flows=[...root.querySelectorAll('[data-pipeline-flow]')],cells=[...root.querySelectorAll('[data-pipeline-cell]')],bars=[...root.querySelectorAll('[data-pipeline-bar]')];
   return{time:performance.now(),beat:root.dataset.pipelineBeat,attention:JSON.parse(root.dataset.pipelineAttention),revealed:JSON.parse(root.dataset.pipelineRevealed),state:JSON.parse(root.dataset.pipelineState),result:root.dataset.pipelineResult,caption:root.querySelector('.film-caption').textContent,
    paths:paths.map(p=>({id:p.dataset.pipelinePath,progress:Number(p.dataset.pipelineProgress),active:p.dataset.pipelineActive==='true',...stroke(p)})),flows:flows.map(p=>({id:p.dataset.pipelineFlow,progress:Number(p.dataset.pipelineProgress),...stroke(p)})),
    nodes:[...root.querySelectorAll('[data-pipeline-node]')].filter(p=>p.dataset.pipelineNode!=='evaluation').map(p=>({id:p.dataset.pipelineNode,active:p.dataset.pipelineActive==='true',opacity:Number(getComputedStyle(p).opacity)})),
    same:!old||root===old.root&&paths.length===old.paths.length&&flows.length===old.flows.length&&cells.length===old.cells.length&&bars.length===old.bars.length&&paths.every((p,i)=>p===old.paths[i])&&flows.every((p,i)=>p===old.flows[i])&&cells.every((p,i)=>p===old.cells[i])&&bars.every((p,i)=>p===old.bars[i]),cellIds:cells.map(p=>p.dataset.pipelineCell),barIds:bars.map(p=>p.dataset.pipelineBar)};
  };
 });
 const check=(name,ok,detail)=>checks.push({name,ok:!!ok,...(!ok?{detail}: {})}),eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b),eps=1e-6;
 async function ready(){await page.waitForFunction(()=>!D.deck.current().busy&&!A.debug().running,{},{timeout:20000});await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));}
 async function snap(){return page.evaluate(()=>__pipelineSnapshot());}
 async function click(selector){const r=await page.locator(selector).boundingBox();assert(r,selector+' is mounted');await page.mouse.click(r.x+Math.min(5,r.width/4),r.y+Math.min(5,r.height/4));}
 async function record(selector){
  await page.evaluate(()=>{window.__pipelineFrames=[__pipelineSnapshot()];window.__pipelineRecording=true;function tick(){if(!__pipelineRecording)return;__pipelineFrames.push(__pipelineSnapshot());requestAnimationFrame(tick);}requestAnimationFrame(tick);});
  await click(selector);await ready();return page.evaluate(()=>{__pipelineRecording=false;__pipelineFrames.push(__pipelineSnapshot());return __pipelineFrames;});
 }
 function checkEndpoint(name,s,beat){
  check(name+' beat',s.beat===beat.id,s);check(name+' local path attention',eq(sorted(s.attention.edges),sorted(beat.edges))&&eq(sorted(s.paths.filter(p=>p.active).map(p=>p.id)),sorted(beat.edges)),s);
  check(name+' local node attention',eq(sorted(s.attention.nodes),sorted(beat.nodes))&&eq(sorted(s.nodes.filter(n=>n.active).map(n=>n.id)),sorted(beat.nodes)),s);
  check(name+' revealed path subset',s.paths.every(p=>Math.abs(p.progress-(beat.revealed.includes(p.id)?1:0))<eps&&Math.abs(s.revealed[p.id]-p.progress)<eps),s);
  check(name+' real SVG paint agrees',s.paths.every(p=>p.progress===0?p.opacity<eps||p.offset>=1-eps:p.opacity>0&&Math.abs(p.offset)<eps&&p.visibility==='visible'&&p.display!=='none'),s);
  check(name+' current nodes have visible emphasis',s.nodes.filter(n=>n.active).every(n=>n.opacity>Math.max(0,...s.nodes.filter(x=>!x.active).map(x=>x.opacity))),s.nodes);
  check(name+' original cell IDs',eq(s.cellIds,['c1','c2'])&&eq(s.barIds,['c1','c2']),s);
 }
 async function replay(name,beat){
  const before=await snap(),rows=await record('[data-vlk-hit="pipeline-trace"]');
  check(name+' replay keeps persistent route',rows.every(s=>eq(s.paths.map(p=>[p.id,p.progress]),before.paths.map(p=>[p.id,p.progress]))),rows);
  check(name+' replay never exposes future',rows.every(s=>s.flows.every(f=>f.progress<=eps||beat.revealed.includes(f.id))),rows);
  check(name+' replay preserves result and actors',rows.every(s=>s.same&&s.result===before.result&&s.state.shift===before.state.shift&&s.state.spread===before.state.spread&&s.beat===before.beat),rows);
  check(name+' replay restores attention',eq(rows.at(-1).attention,before.attention),rows.at(-1));
  if(beat.revealed.length)check(name+' replay visibly animates a known route',rows.some(s=>s.flows.some(f=>f.progress>eps&&f.progress<1-eps&&f.opacity>0)),rows);
  checkEndpoint(name+' after Replay',rows.at(-1),beat);captures.push({name:name+' Replay',rows});
 }
 for(const [lang,font] of [['ru','sans'],['en','serif']]){
  await page.evaluate(({lang,font})=>{D.i18n.setLang(lang);D.appearance.set({font,background:lang==='ru'?'black':'white'});},{lang,font});
  for(const spec of MANIFEST){
   const name=lang+' '+spec.id;await page.evaluate(id=>D.deck.show(D.deck.scenes().findIndex(s=>s.id===id),0),spec.id);await ready();await page.evaluate(()=>__pipelineRemember());
   checkEndpoint(name+' initial',await snap(),spec.beats[0]);await replay(name+' initial',spec.beats[0]);
   for(let step=1;step<spec.beats.length;step++){
    const before=await snap(),rows=await record('[data-action="next"]'),expected=spec.beats[step],allowed=new Set([...spec.beats[step-1].edges,...expected.edges]),allowedNodes=new Set([...spec.beats[step-1].nodes,...expected.nodes]);
    check(name+' Next '+step+' retains old paths',rows.every(s=>s.same&&s.paths.every(p=>p.progress+eps>=before.paths.find(x=>x.id===p.id).progress)),rows);
    check(name+' Next '+step+' has only local flow',rows.every(s=>s.flows.every(f=>f.progress<=eps||allowed.has(f.id))),rows);
    check(name+' Next '+step+' never highlights a future operation',rows.every(s=>s.paths.every(p=>p.progress<=eps||expected.revealed.includes(p.id))&&s.nodes.every(n=>!n.active||allowedNodes.has(n.id))),rows);
    checkEndpoint(name+' Next '+step,rows.at(-1),expected);captures.push({name:name+' Next '+step,rows});
   }
   await click('[data-action="prev"]');await ready();checkEndpoint(name+' Back',await snap(),spec.beats.at(-2));await page.evaluate(()=>__pipelineRemember());
   const rows=await record('[data-action="next"]');checkEndpoint(name+' Next after Back',rows.at(-1),spec.beats.at(-1));captures.push({name:name+' Next after Back',rows});await replay(name+' final',spec.beats.at(-1));
   if(spec.id==='pipeline-synthesis'){
    const before=await snap();await click('[data-vlk-hit="pipeline-shift-down"]');await ready();const selected=await snap();
    check(name+' manual change updates actual parameter',selected.state.shift===Math.max(0,before.state.shift-1)&&selected.same,selected);
    await replay(name+' manual selection',{id:selected.beat,nodes:selected.attention.nodes,edges:selected.attention.edges,revealed:PATHS});
   }
   console.log(JSON.stringify({completed:name,checks:checks.length,failures:checks.filter(c=>!c.ok).length}));
  }
 }
 check('no browser errors',errors.length===0,errors);
 const endSourceSha256=recipeHash();check('recipe source stayed frozen during run',sourceSha256===endSourceSha256,{sourceSha256,endSourceSha256});
 const failures=checks.filter(c=>!c.ok),report={url,artifactSha256,sourceSha256,endSourceSha256,method:'Native Chrome physical blank-interior clicks; RAF snapshots of route progress, actual stroke paint and active nodes',checks:checks.length,failures,errors,sampledFrames:captures.reduce((n,c)=>n+c.rows.length,0),results:checks,captures};
 const outfile=process.env.VLK_PIPELINE_REPORT||path.join(__dirname,'../verification/0.12.1/pipeline-progression.json');fs.mkdirSync(path.dirname(outfile),{recursive:true});fs.writeFileSync(outfile,JSON.stringify(report)+'\n');
 assert.deepEqual(failures,[],'native semantic progression');t.diagnostic(`${report.checks} native checks, ${report.sampledFrames} RAF frames; report ${outfile}`);
});
