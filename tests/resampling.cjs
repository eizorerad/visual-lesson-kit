/* Explicit resamples, source identity and sampled geometry; no inferential test. */
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const root=process.env.LESSON_TEST_DIR||path.resolve(__dirname,'../starter');
const dom=new JSDOM('<body></body>',{runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
w.matchMedia=()=>({matches:false});
for(const file of ['config','lib/dom','lib/num','lib/anim','lib/plot','lib/svg','lesson','film','patterns'])w.eval(fs.readFileSync(path.join(root,'js',file+'.js'),'utf8'));
const helper=path.join(root,'js/resampling.js');if(fs.existsSync(helper))w.eval(fs.readFileSync(helper,'utf8'));
let checks=0;function ok(value,message){assert.ok(value,message);checks++;}function near(a,b,message){ok(Number.isFinite(a)&&Math.abs(a-b)<1e-9,message);}
function rejects(fn,message){assert.throws(fn,undefined,message);checks++;}
(async()=>{
  ok(typeof w.K.resampleMean==='function','K.resampleMean exists');
  const host=w.D.dom.s('svg');w.document.body.append(host);
  const population=[{id:'D1',value:2},{id:'D2',value:4},{id:'D3',value:8}];
  const samples=[{id:'A',sourceIds:['D1','D1','D3']},{id:'B',sourceIds:['D2','D3']}];
  const options={population,samples,domain:[0,10],x:230,y:240,width:800,drawY:370,meanY:520};
  const chart=w.K.resampleMean(host,options);
  ok(Object.isFrozen(chart.samples)&&chart.samples.every(s=>Object.isFrozen(s)&&Object.isFrozen(s.copies)),'sample snapshots and copy lists are immutable');
  near(chart.samples[0].mean,4,'repeated source contributes twice to exact mean');near(chart.samples[1].mean,6,'unequal supplied draw lengths supported');
  ok(chart.samples[0].copies[0].g!==chart.samples[0].copies[1].g,'duplicate source IDs yield distinct copies');
  ok(chart.samples[0].copies.slice(0,2).every(c=>c.g.dataset.sourceId==='D1'),'copies retain the common source ID');
  const nodes=[...chart.originals.map(a=>a.g),...chart.samples.flatMap(s=>s.copies.map(c=>c.g)),...chart.samples.map(s=>s.meanPoint)];
  for(const t of [0,.25,.5,.75,1]){
    chart.setSample('A',{draw:t,collapse:0});
    chart.samples[0].copies.forEach(c=>ok(c.g.dataset.value===String(c.value),'animation preserves source measurement'));
    ok(nodes.every(n=>n.isConnected),'animation preserves original and copied DOM nodes');
  }
  for(const t of [0,.25,.5,.75,1])chart.setSample('A',{draw:1,collapse:t});
  near(+chart.samples[0].meanPoint.getAttribute('cx'),chart.xScale(4),'mean point uses fixed measurement scale');
  const finished=chart.g.outerHTML;chart.setSample('A',{draw:0,collapse:0});chart.setSample('A',{draw:1,collapse:1});ok(chart.g.outerHTML===finished,'absolute replay is deterministic');
  const unchanged=chart.g.outerHTML;
  for(const fn of [()=>chart.setSample('missing',{draw:1,collapse:0}),()=>chart.setSample('A',{draw:NaN,collapse:0}),()=>chart.setSample('A',{draw:.5,collapse:.5})])rejects(fn,'invalid state rejects');
  ok(chart.g.outerHTML===unchanged,'invalid state does not mutate DOM');
  for(const patch of [
    {population:[]},{population:[population[0],,population[2]]},{population:[{id:'D1',value:Infinity}]},
    {population:[population[0],population[0]]},{samples:[]},{samples:[,samples[1]]},
    {samples:[{id:'A',sourceIds:[]}]},{samples:[{id:'A',sourceIds:['D1',,'D2']}]},
    {samples:[{id:'A',sourceIds:['missing']}]},{samples:[samples[0],samples[0]]},
    {domain:[0,,]},{domain:[5,5]},{domain:[0,7]},{domain:[-1e308,1e308]},
    {x:1e308,width:1e308},{width:0},{drawY:NaN}
  ]){const before=host.innerHTML;rejects(()=>w.K.resampleMean(host,{...options,...patch}),'invalid input rejects');ok(host.innerHTML===before,'constructor validates before any DOM mutation');}
  ok(JSON.stringify(population)==='[{"id":"D1","value":2},{"id":"D2","value":4},{"id":"D3","value":8}]','caller population unchanged');
  const scenes=[];w.D.deck={register:s=>scenes.push(s),count:()=>1};
  w.eval(fs.readFileSync(path.join(root,'js/episodes/10-resampling.js'),'utf8'));
  const scene=scenes[0],steps=[];const el=scene.build({index:0,step:fn=>steps.push(fn),onDispose:()=>{}});w.document.body.append(el);
  ok(steps.length===3&&scene.notes.length===4,'three builds and four notes');ok(scene.qa.length===2,'two questions');
  let frames=0;
  w.A.run=async fn=>{for(let i=0;i<=120;i++){const t=i/120;fn(t*t*t*(t*(t*6-15)+10));frames++;
    for(const n of el.querySelectorAll('*'))for(const a of n.attributes)ok(!/NaN|Infinity|undefined/.test(a.value),'finite attributes');
    for(const n of el.querySelectorAll('[data-resample-actor]')){
      let opacity=1;for(let p=n;p&&p!==el;p=p.parentElement)opacity*=p.style.opacity===''?1:+p.style.opacity;
      if(opacity<=.01)continue;
      const m=n.getAttribute('transform').match(/translate\(([-+\d.e]+)[ ,]+([-+\d.e]+)\)/),x=+m[1],y=+m[2];
      ok(x>=70&&x<=1210&&y>=157&&y<=600,'visible actor center with radius stays in safe viewport');
      if(n.dataset.resampleActor==='copy')for(const mean of el.querySelectorAll('[data-resample-mean]'))if(+mean.style.opacity>.01&&mean.dataset.resampleMean!==n.dataset.sampleId){
        const distance=Math.hypot(x- +mean.getAttribute('cx'),y- +mean.getAttribute('cy'));
        ok(distance>=18,'moving copy does not cross a previously collected mean');
      }
    }
  }};
  for(const step of steps)await step();
  const means=[...el.querySelectorAll('[data-resample-mean]')];ok(means.length===6&&means.every(n=>Math.abs(+n.style.opacity-1)<1e-9),'all six supplied means accumulated');
  console.log(JSON.stringify({checks,frames,scenes:1,errors:0,method:'jsdom data, identity and frame geometry; no browser QA'}));w.close();
})().catch(e=>{console.error(e.stack);w.close();process.exitCode=1});
