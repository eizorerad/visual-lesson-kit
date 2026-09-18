/* Pure timeline contracts: run with node --test qa/trna/presentation-timing.cjs.
 * UI, text clearance and GPU rendering are covered by the browser checks. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
const context={
 D:{i18n:{pack(){}},deck:{register(){}}},
 F:{note:(...args)=>args,lerp:(a,b,p)=>a+(b-a)*p}
};
context.window=context;vm.createContext(context);
for(const file of ['lib/anim.js','cinema-timeline.js','trna-config.js','trna-magnesium-story.js','trna-story.js','trna-journey.js'])vm.runInContext(fs.readFileSync(path.join(root,'js',file),'utf8'),context,{filename:file});
const journey=context.TrnaJourney,plain=value=>JSON.parse(JSON.stringify(value));
const keys=['sequence','sequence-anticodon','sequence-whole','cloverleaf','pairs','simplify','anticodon','cca','spatial','rotation','anticodon-close','anticodon-return','cca-close','arms','stem','stem-camera','nucleotide','backbone','pair','pair-contacts','neighbors','stacking','stem-return','trace-return','whole-return','elbow','elbow-pair','elbow-second','elbow-stack','elbow-result','mg-charge','mg-atmosphere','mg-select','mg-water','mg-bridge','mg-return','summary','volume','finale'];
const near=(actual,expected,message)=>assert(Math.abs(actual-expected)<1e-8,message+' ('+actual+' vs '+expected+')');

test('semantic timeline follows stem chemistry, elbow contacts, hydration and the whole-molecule finale',()=>{
 assert.deepEqual(Array.from(journey.cues,c=>c.key),keys);
 assert.equal(new Set(journey.cues.map(c=>c.key)).size,39);
 assert.equal(journey.duration,398,'The default film reproduces the approved 6:38 timing');
 journey.cues.forEach((c,index)=>{
  assert.equal(c.index,index);assert(c.hold>2.2,c.key+' must offer a longer reading hold than the former 2.2 s cap');
  assert(Number.isFinite(c.time)&&Number.isFinite(c.arrive)&&Number.isFinite(c.motion),c.key+' has finite timing');
  near(c.time,c.arrive+c.motion,c.key+' endpoint follows its incoming motion');
  if(index){near(c.arrive,journey.cues[index-1].time+journey.cues[index-1].hold,c.key+' begins after the preceding hold');assert(c.motion>0);}
  else{assert.equal(c.time,0);assert.equal(c.arrive,0);assert.equal(c.motion,0);}
 });
 near(journey.duration,journey.cues.at(-1).time+journey.cues.at(-1).hold,'Duration includes the final reading hold');
});

test('every settled pose remains exactly fixed during its reading hold',()=>{
 for(const c of journey.cues){
  for(const fraction of [0,.25,.5,.99]){
   const frame=journey.sample(c.time+c.hold*fraction);
   assert.deepEqual(plain(frame.values),plain(c.target),c.key+' hold preserves all presentation values');
   assert.equal(frame.cue,c.index,c.key+' hold retains its narrative');
   assert.equal(frame.captionPhase,'detail',c.key+' settled pose has its detail caption');
  }
 }
 assert.deepEqual(plain(journey.sample(journey.duration+20).values),plain(journey.cues.at(-1).target));
});

test('incoming narrative starts on arrival while its caption waits for visible detail',()=>{
 for(const c of journey.cues.slice(1)){
  const arriving=journey.sample(c.arrive),early=journey.sample(c.arrive+c.motion*.1),complete=journey.sample(c.time);
  assert.equal(arriving.cue,c.index,c.key+' owns the narrative at arrival');
  assert.equal(early.cue,c.index,c.key+' owns the narrative during motion');
  assert.equal(early.captionPhase,'approach',c.key+' early motion uses the approach caption');
  if(c.approachRu)assert(early.captionOpacity>0,c.key+' exposes its stage introduction during motion');
  else assert.equal(early.captionOpacity,0,c.key+' leaves the lower caption clear during motion');
  assert.equal(complete.captionPhase,'detail',c.key+' endpoint uses its detail caption');
  assert.deepEqual(plain(complete.values),plain(c.target));
 }
});

test('contact captions never precede the geometry they describe',()=>{
 const readiness={
  'pair-contacts':{contacts:.9},'elbow-pair':{elbowAtoms:.9},'elbow-second':{elbowSecond:.9},
  'elbow-stack':{elbowStack:.9},'mg-water':{mgZoom:.9,mgWater:.9},'mg-bridge':{mgBridge:.9}
 };
 for(const [key,thresholds] of Object.entries(readiness)){
  const c=journey.cues.find(c=>c.key===key);assert(c,'Missing '+key);
  let details=0;
  for(let step=0;step<=100;step++){
   const frame=journey.sample(c.arrive+c.motion*step/100);
   assert(['approach','detail'].includes(frame.captionPhase));
   if(frame.captionPhase==='detail'){
    details++;
    for(const [field,minimum] of Object.entries(thresholds))assert(frame.values[field]>=minimum,key+' caption precedes visible '+field);
   }
  }
  assert(details>0,key+' must eventually show its detailed explanation');
 }
});

test('the reordered returns clear all earlier close-up states and retain the full tRNA camera',()=>{
 const get=key=>journey.cues.find(c=>c.key===key).target;
 const whole=get('whole-return'),elbow=get('elbow'),returned=get('mg-return'),finale=get('finale');
 for(const key of ['stem','atomicView','atomReveal','focus','detail','contacts','neighbors']){
  assert.equal(whole[key],0,'whole-return clears '+key);assert.equal(elbow[key],0,'elbow does not retain '+key);
 }
 for(const [key,expected] of Object.entries(context.TrnaMagnesiumStory.baseline)){
  assert.equal(returned[key],expected,'mg-return clears '+key);assert.equal(finale[key],expected,'finale clears '+key);
 }
 assert.equal(returned.model,1);assert.equal(returned.angle,15);assert.equal(returned.landmarks,2);
 assert.equal(finale.spacefill,1);assert.equal(finale.final,1);
});
