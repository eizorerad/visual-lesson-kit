'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function api(){const ctx={};ctx.window=ctx;vm.createContext(ctx);const file=path.join(__dirname,'../starter/js/cinema-timeline.js');vm.runInContext(fs.readFileSync(file,'utf8'),ctx);return ctx.CinemaTimeline;}
const baseline={focus:0,layer:0},catalog=[
 {key:'start',motion:4,hold:8,target:{focus:0,layer:0},titleRu:'Начало',titleEn:'Start'},
 {key:'detail',motion:6,hold:5,target:{focus:1,layer:1},approachRu:'Введение',approachEn:'Introduction'},
 {key:'return',motion:4,hold:3,target:{focus:0,layer:0}}
];
const plain=x=>JSON.parse(JSON.stringify(x));
test('compile remixes semantic cues with complete targets and bilingual text',()=>{
 const t=api(),c=t.compile({baseline,catalog,route:['detail',{key:'return',motion:3,hold:7,text:{ru:{title:'Возврат'},en:{title:'Return'}}}]});
 assert.equal(c[0].time,0);assert.deepEqual(plain(t.sample(c,baseline,0).values),{focus:1,layer:1});
 assert.deepEqual(plain(c[1].target),baseline);assert.equal(c[1].arrive,5);assert.equal(c[1].time,8);assert.equal(t.duration(c),15);assert.equal(c[1].titleRu,'Возврат');assert.equal(c[1].titleEn,'Return');
});
test('compile rejects missing, duplicate, nonfinite and ambiguous author inputs',()=>{
 const t=api(),compile=options=>t.compile({baseline,catalog,...options});
 for(const route of [[],['missing'],['start','start']])assert.throws(()=>compile({route}),/route|Unknown|Duplicate/);
 for(const hold of [-1,NaN,Infinity,'3'])assert.throws(()=>compile({overrides:{detail:{hold}}}),/hold/);
 for(const motion of [-1,NaN,Infinity,'3',0])assert.throws(()=>compile({overrides:{detail:{motion}}}),/motion/);
 assert.throws(()=>compile({overrides:{start:{motion:2}}}),/first|initial/);
 assert.throws(()=>compile({overrides:{typo:{hold:2}}}),/Unknown/);
 assert.throws(()=>compile({route:[{key:'start',target:{focus:1}}]}),/Unknown/);
 assert.throws(()=>compile({overrides:{detail:{text:{de:{title:'Oops'}}}}}),/Unknown/);
 assert.throws(()=>compile({catalog:[{key:'start',target:{focus:0},hold:2}]}),/target/);
 assert.throws(()=>compile({catalog:[{key:'start',target:{focus:0,layer:Infinity},hold:2}]}),/target/);
});
test('sample preserves exact holds, bounded time and delayed detailed captions',()=>{
 const t=api(),c=t.compile({baseline,catalog});
 assert.deepEqual(plain(t.sample(c,baseline,-1).values),baseline);
 assert.deepEqual(plain(t.sample(c,baseline,7.99).values),baseline);
 const middle=t.sample(c,baseline,11);assert.equal(middle.cue,1);assert.equal(middle.captionPhase,'approach');assert.equal(middle.values.focus,.5);
 assert.equal(t.sample(c,baseline,14).captionPhase,'detail');
 assert.deepEqual(plain(t.sample(c,baseline,100).values),baseline);
 assert.throws(()=>t.sample(c,baseline,NaN),/finite/);assert.throws(()=>t.sample(c,baseline,Infinity),/finite/);
 assert.throws(()=>t.sample(c,baseline,11,()=>NaN),/eas/);
});
test('finite extreme endpoints interpolate without overflow and retain exact endpoint values',()=>{
 const t=api(),base={x:1e308},c=t.compile({baseline:base,catalog:[
  {key:'positive',motion:1,hold:1,target:{x:1e308}},
  {key:'negative',motion:2,hold:1,target:{x:-1e308}}
 ]});
 assert.equal(t.sample(c,base,2,u=>u).values.x,0);
 for(const u of [0,Number.EPSILON,.1,.25,.5,.75,.9,1-Number.EPSILON,1]){
  const value=t.sample(c,base,1+2*u,x=>x).values.x;
  assert(Number.isFinite(value),'finite sample at '+u);assert(value>=-1e308&&value<=1e308);
 }
 assert.equal(t.sample(c,base,1,()=>0).values.x,1e308);
 assert.equal(t.sample(c,base,2,()=>1).values.x,-1e308);
});
test('positive motion and holds cannot vanish when accumulated at large times',()=>{
 const t=api(),base={x:0},pose={x:0};
 const compile=(hold,motion,lastHold)=>t.compile({baseline:base,catalog:[
  {key:'start',motion:1,hold,target:pose},{key:'next',motion,hold:lastHold,target:pose}
 ]});
 assert.throws(()=>compile(1e16,1,0),/motion.*precision/);
 assert.throws(()=>compile(0,1e16,1),/hold.*precision/);
 assert.equal(t.duration(compile(0,1e16,0)),1e16,'explicit zero hold is allowed');
 assert.equal(t.duration(compile(1e16,2,2)),1e16+4,'representable positive increments remain valid');
});
