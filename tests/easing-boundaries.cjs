/* Numeric easing boundaries, plus the actual scheduler/driver/strict-model path. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const starter=process.env.LESSON_TEST_DIR||path.join(__dirname,'..','starter');
const read=name=>fs.readFileSync(path.join(starter,'js',name+'.js'),'utf8');
function easing(){const window={};vm.runInNewContext(read('lib/anim'),{window});return window.A.ease;}
const original=t=>t*t*t*(t*(t*6-15)+10);

test('smooth keeps exact endpoints and bounded monotone progress, including cancellation-prone tail',()=>{
 const {smooth}=easing();assert.equal(smooth(0),0);assert.equal(smooth(.5),.5);assert.equal(smooth(1),1);
 assert.ok(smooth(.9999999979)<=1,'the observed endpoint-adjacent progress must not overshoot');
 const probes=new Set([0,.5,1,.9999999979,Number.MIN_VALUE]);
 for(let i=0;i<=100000;i++){probes.add(i/100000);probes.add(.999999+i*1e-11);}
 for(let k=1;k<=1074;k++){probes.add(2**-k);probes.add(1-2**-k);}
 let previous=-Infinity;
 for(const t of [...probes].sort((a,b)=>a-b)){
  const value=smooth(t);assert.ok(Number.isFinite(value)&&value>=0&&value<=1,'bounded at '+t);
  assert.ok(value>=previous,'nondecreasing at '+t);previous=value;
  assert.ok(Math.abs(value-original(t))<4e-15,'same quintic curve within rounding at '+t);
 }
});
test('smooth preserves extrapolation and leaves other easing definitions intact',()=>{
 const ease=easing();
 for(const t of [-Infinity,-10,-1,-.5,-Number.MIN_VALUE,1+Number.EPSILON,1.5,2,10,Infinity,NaN])assert.equal(ease.smooth(t),original(t));
 for(const t of [-2,-.5,0,.25,.5,.75,1,1.5,2]){
  assert.equal(ease.linear(t),t);assert.equal(ease.in(t),t*t*t);assert.equal(ease.out(t),1-(1-t)*(1-t)*(1-t));
  assert.equal(ease.thereAndBack(t),ease.smooth(1-Math.abs(2*t-1)));
 }
 assert.equal(ease.thereAndBack(0),0);assert.equal(ease.thereAndBack(.5),1);assert.equal(ease.thereAndBack(1),0);
});
test('endpoint-adjacent real scheduler frames cannot reject a bounded recipe transition',async t=>{
 const {JSDOM}=require('jsdom'),dom=new JSDOM('<body></body>',{runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
 t.after(()=>w.close());w.matchMedia=()=>({matches:false});
 const frames=[],errors=[];w.requestAnimationFrame=fn=>{frames.push(fn);return frames.length;};w.console.error=(...args)=>errors.push(args.join(' '));
 for(const name of ['lib/dom','lib/anim','film','recipes/pipeline-synthesis'])w.eval(read(name));
 const state={shift:2,spread:0},painted=[],driver=w.F.driver(state,()=>{const r=w.PIPELINE_SYNTHESIS_EXAMPLE.calculate(state.shift,state.spread);painted.push({spread:state.spread,range:r.range});});
 t.after(driver.dispose);
 const active=driver.to({spread:1},{duration:1});
 const outcome=active.then(value=>({value}),error=>({error}));
 frames.shift()(0);frames.shift()(.9999999979);frames.shift()(1);
 const result=await outcome;assert.equal(result.error,undefined,'valid progress must not cause RangeError');assert.equal(result.value.completed,true);
 assert.equal(state.spread,1);assert.equal(painted.length,3);assert.ok(painted.every(p=>p.spread>=0&&p.spread<=1&&p.range>=0&&p.range<=2));assert.deepEqual(errors,[]);
});
