/* Exact teaching fixtures, immutable data and persistent SVG behavior. */
const fs = require('fs'), path = require('path'), assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const root = process.env.LESSON_TEST_DIR || path.resolve(__dirname, '../starter');
const dom = new JSDOM('<body></body>', { runScripts: 'outside-only', pretendToBeVisual: true }), w = dom.window;
w.matchMedia = () => ({ matches: false });
for (const file of ['config','lib/dom','lib/i18n','lib/num','lib/anim','lib/plot','lib/svg','lesson','film','layout','patterns']) w.eval(fs.readFileSync(path.join(root,'js',file+'.js'),'utf8'));
const helper = path.join(root,'js/statistics.js'); if (fs.existsSync(helper)) w.eval(fs.readFileSync(helper,'utf8'));
let checks=0; const ok=(v,m)=>{assert.ok(v,m);checks++;}, near=(a,b,m)=>ok(Number.isFinite(a)&&Math.abs(a-b)<1e-10,m), rejects=(fn,m)=>{assert.throws(fn,undefined,m);checks++;};
const plain=x=>JSON.parse(JSON.stringify(x));
(async()=>{
  for (const name of ['sampleSummary','exactMeanPermutation','bhAdjust','sampleSpread','permutationView','bhView']) ok(typeof w.K[name]==='function','K.'+name+' exists');
  const values=[2,3,4,7,8,9], before=JSON.stringify(values), summary=w.K.sampleSummary(values);
  near(summary.mean,5.5,'sample mean'); near(summary.sumSquares,41.5,'sum of squared residuals'); near(summary.variance,8.3,'sample denominator n-1'); near(summary.sd,Math.sqrt(8.3),'sample SD'); near(summary.sem,Math.sqrt(8.3/6),'SEM');
  near(summary.residuals.reduce((s,x)=>s+x,0),0,'residuals sum to zero');
  ok(JSON.stringify(values)===before&&Object.isFrozen(summary)&&Object.isFrozen(summary.residuals),'input unchanged, frozen summary');
  ok(w.K.sampleSummary([3]).sd===null&&w.K.sampleSummary([3]).sem===null,'singleton uncertainty undefined');
  near(w.K.sampleSummary([4,4,4]).sd,0,'constant SD zero'); near(w.K.sampleSummary([1e150,1e150]).mean,1e150,'large representable mean'); near(w.K.sampleSummary(Array(6).fill(1e308)).sd,0,'large constant sample has zero SD');
  for(const a of [[],[1,,2],[1,NaN],[Infinity,2],['2',3],[-1e308,1e308]]) rejects(()=>w.K.sampleSummary(a),'invalid/overflowing sample rejects');
  const perm=w.K.exactMeanPermutation(values,3);
  ok(perm.assignments.length===20,'all 20 balanced assignments'); near(perm.observed,-5,'signed observed contrast'); near(perm.pValue,.1,'absolute-tail exact p=0.1'); ok(perm.extremeCount===2,'two extreme assignments');
  ok(new Set(perm.assignments.map(a=>a.groupA.join(','))).size===20,'memberships unique');
  for(const a of perm.assignments){ok(a.groupA.length===3&&a.groupB.length===3,'group sizes preserved');ok([...a.groupA,...a.groupB].sort().join(',')==='0,1,2,3,4,5','each source index present once');}
  const p2=w.K.exactMeanPermutation([1,2,3,4],2); ok(JSON.stringify(p2.assignments.map(a=>a.statistic))==='[-2,-1,0,0,1,2]','small independent exact fixture'); near(p2.pValue,1/3,'small exact p');
  near(w.K.exactMeanPermutation([7,7,7,7],2).pValue,1,'tied null statistic includes equality');
  for(const n of [0,6,2.5,NaN]) rejects(()=>w.K.exactMeanPermutation(values,n),'invalid group size'); rejects(()=>w.K.exactMeanPermutation(Array(13).fill(0),6),'teaching enumeration capped at 12 observations');
  const ps=[.001,.012,.019,.041,.2,.65], bh=w.K.bhAdjust(ps,.05), expected=[.006,.036,.038,.0615,.24,.65]; expected.forEach((p,i)=>near(bh.adjusted[i],p,'BH adjusted '+i)); ok(bh.rejected.join(',')==='true,true,true,false,false,false','BH first three');
  const nonlocal=w.K.bhAdjust([.2,.029,.001,.5,.021],.05); ok(nonlocal.order.join(',')==='2,4,1,0,3','stable p ranking'); ok(nonlocal.k===3&&nonlocal.rejected[4],'BH includes rank 2 that fails its own threshold'); near(nonlocal.adjusted[4],29/600,'reverse cumulative minimum');
  ok(w.K.bhAdjust([0,0,1],0).k===2,'zero p values at q zero'); ok(w.K.bhAdjust([.1,.1,.2],.1).order.join(',')==='0,1,2','exact ties preserve source order'); ok(w.K.bhAdjust([.2,1],1).k===2,'q=1');
  for(const a of [[],[.2,,.4],[-.01],[1.1],[NaN]]) rejects(()=>w.K.bhAdjust(a),'invalid p values'); for(const q of [-1,1.1,NaN]) rejects(()=>w.K.bhAdjust(ps,q),'invalid q');
  const host=w.D.dom.s('svg');w.document.body.append(host); const observations=values.map((value,i)=>({id:'D'+(i+1),value}));
  const spreadOptions={observations,domain:[0,10],x:100,y:250,width:660,height:160};
  const spread=w.K.sampleSpread(host,spreadOptions), originalNodes=[...spread.g.querySelectorAll('[data-observation-id]')];
  spread.setProgress(.8); const snapshot=spread.snapshot(); near(snapshot.progress,.8,'spread progress snapshot'); near(snapshot.summary.mean,5.5,'spread model matches summary');
  ok(originalNodes.length===6&&originalNodes.every(n=>n.isConnected),'six persistent sample actors');
  const stable=spread.g.outerHTML; spread.setProgress(0);spread.setProgress(.8);ok(stable===spread.g.outerHTML,'deterministic sample replay');
  for(const fn of [()=>spread.setValues([1]),()=>spread.setValues([2,3,4,7,8,11]),()=>spread.setProgress(NaN)]){const html=spread.g.outerHTML;rejects(fn,'invalid sample setter');ok(html===spread.g.outerHTML,'sample setter atomic');}
  spread.setValues([1,2,3,6,7,8]);near(spread.snapshot().summary.mean,4.5,'sample input setter computes new summary');ok(originalNodes.every(n=>n.isConnected),'sample input update preserves actors');
  for(const [constructor,options] of [
    [w.K.sampleSpread,{...spreadOptions,observations:[observations[0]]}],
    [w.K.permutationView,{...spreadOptions,observations:Array.from({length:4},(_,i)=>({id:'T'+i,value:7})),groupSize:2,height:250}],
    [w.K.permutationView,{...spreadOptions,observations:Array.from({length:8},(_,i)=>({id:'T'+i,value:i+1})),groupSize:4,width:800,height:230}]
  ]){const html=host.innerHTML;rejects(()=>constructor(host,options),'unsupported singleton/crowded layout rejects explicitly');ok(html===host.innerHTML,'crowding check precedes DOM');}
  {const html=host.innerHTML;rejects(()=>w.K.sampleSpread(host,{...spreadOptions,observations:[{id:'tiny1',value:0},{id:'tiny2',value:0}],domain:[0,1e-308],height:1e308}),'overflowing derived view scale rejects');ok(html===host.innerHTML,'derived scale rejects before DOM');}
  const permutation=w.K.permutationView(host,{observations,groupSize:3,domain:[0,10],x:100,y:240,width:660,height:250});
  const permNodes=[...permutation.g.querySelectorAll('[data-observation-id]')];for(const t of [0,.13,.5,.72,1]){permutation.setProgress(t);ok(permNodes.every((n,i)=>n.isConnected&&+n.dataset.value===values[i]),'permutation movement preserves ID/value');}
  ok(permutation.snapshot().assignment===19,'last assignment reachable');near(permutation.snapshot().model.pValue,.1,'exact distribution available');
  const bhview=w.K.bhView(host,{hypotheses:ps.map((p,i)=>({id:'H'+(i+1),p})),q:.05,x:100,y:240,width:950,height:280});const bhNodes=[...bhview.g.querySelectorAll('[data-hypothesis-id]')];bhview.setPValues([.2,.012,.65,.001,.041,.019]);
  for(let frame=0;frame<=120;frame++){
    bhview.setProgress(frame/240);
    const centers=bhNodes.map(node=>{const xy=node.getAttribute('transform').match(/translate\(([-+\d.e]+)[ ,]+([-+\d.e]+)\)/);return [+xy[1],+xy[2]];});
    for(let i=0;i<centers.length;i++)for(let j=i+1;j<centers.length;j++)ok(Math.abs(centers[i][0]-centers[j][0])>=100||Math.abs(centers[i][1]-centers[j][1])>=40,'compact BH ID lanes avoid overlap');
  }
  bhview.setProgress(1);bhview.setQ(.01);ok(bhview.snapshot().model.k===1,'live q affects selection');bhview.setPValues([.2,.012,.65,.001,.041,.019]);bhview.setQ(.05);ok(bhview.snapshot().model.order.join(',')==='3,1,5,4,0,2','new inputs rerank');ok(bhNodes.every(n=>n.isConnected),'BH actors persist');
  for(const [view,fn] of [[permutation,()=>permutation.setValues([2,3,4,7,8,Infinity])],[permutation,()=>permutation.setProgress(NaN)],[bhview,()=>bhview.setQ(-1)],[bhview,()=>bhview.setPValues([0])],[bhview,()=>bhview.setProgress(NaN)]]){const html=view.g.outerHTML;rejects(fn,'invalid setter rejects');ok(html===view.g.outerHTML,'invalid setter atomic');}
  for(const [constructor,options] of [[w.K.sampleSpread,spreadOptions],[w.K.permutationView,{...spreadOptions,groupSize:3,height:250}],[w.K.bhView,{hypotheses:ps.map((p,i)=>({id:'H'+i,p})),x:100,y:240,width:950,height:280}]]) for(const patch of [{x:NaN},{width:0},{width:1e308,x:1e308},{height:-1}]){const html=host.innerHTML;rejects(()=>constructor(host,{...options,...patch}),'invalid constructor');ok(html===host.innerHTML,'constructor validates before DOM');}
  for(const n of host.querySelectorAll('*'))for(const a of n.attributes)ok(!/NaN|Infinity|undefined/.test(a.value),'finite attributes');
  const recipe=path.join(root,'js/recipes/methods-statistics.js');
  if(fs.existsSync(recipe)){
    const scenes=[];w.D.deck={register:s=>scenes.push(s),count:()=>3};w.eval(fs.readFileSync(recipe,'utf8'));ok(scenes.length===3,'three registered statistics scenes');let frames=0;
    w.A.run=async fn=>{for(let i=0;i<=24;i++){fn(i/24);frames++;}};
    for(const scene of scenes){const steps=[],dispose=[];const el=scene.build({index:0,step:fn=>steps.push(fn),onDispose:fn=>dispose.push(fn)});w.document.body.append(el);ok(scene.notes.length===steps.length+1&&scene.qa.length>=1,'notes cover each state');const ids=[...el.querySelectorAll('[data-observation-id],[data-hypothesis-id]')];for(const step of steps)await step();for(const range of el.querySelectorAll('input[type=range]')){range.value=(+range.min + +range.max)/2;range.dispatchEvent(new w.Event('input',{bubbles:true}));}ok(ids.every(n=>n.isConnected),'scene steps and manual control retain actors');ok(el.querySelectorAll('input[type=range]').length>0,'real manual control exists');for(const n of el.querySelectorAll('*'))for(const a of n.attributes)ok(!/NaN|Infinity|undefined/.test(a.value),'scene attributes finite');dispose.forEach(fn=>fn());el.remove();}
    console.log(JSON.stringify({checks,scenes:3,frames,method:'jsdom numerical, identity, setters and lifecycle; renderer QA separate'}));
  }else console.log(JSON.stringify({checks,method:'module tests; recipe not yet present'}));
  w.close();
})().catch(e=>{console.error(e.stack);w.close();process.exitCode=1;});
