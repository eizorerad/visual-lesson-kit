/* State/lifecycle behavior using the actual animation scheduler; not layout QA. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
const starter=process.env.LESSON_TEST_DIR||path.join(__dirname,'..','starter');
const settle=()=>new Promise(resolve=>setImmediate(resolve));
function fixture(t,deck=false){
 const dom=new JSDOM('<body><div id="frame"></div></body>',{runScripts:'outside-only',pretendToBeVisual:true,url:'http://localhost/lesson/'});
 t.after(()=>dom.window.close());const w=dom.window;w.matchMedia=()=>({matches:false});
 const errors=[];w.console.error=(...args)=>errors.push(args.join(' '));t.after(()=>assert.deepEqual(errors,[],'no swallowed scheduler/scene errors'));
 for(const file of ['js/lib/dom.js','js/lib/i18n.js','js/lib/touch.js','js/lib/anim.js',...(deck?['js/deck.js']:[]),'js/film.js'])w.eval(fs.readFileSync(path.join(starter,file),'utf8'));
 return w;
}
test('fields with equal endpoints stay bit-exact throughout a transition',async t=>{
 const w=fixture(t),frames=[],initial={scale:2.45,origin:137.273,large:1e308,angle:32},state={...initial,alpha:1};
 w.requestAnimationFrame=fn=>{frames.push(fn);return frames.length;};
 const values=[],driver=w.F.driver(state,()=>values.push({...state})),active=driver.to({...initial,alpha:.18},{duration:1000,ease:'linear'});
 for(let time=0;time<=1000;time+=10)frames.shift()(time);
 assert.equal((await active).completed,true);for(const row of values)for(const key of Object.keys(initial))assert.equal(row[key],initial[key],key+' must not drift when only opacity changes');
 assert.equal(state.alpha,.18);
});
test('manual input invalidates old frames and completion, without completing another driver',async t=>{
 const w=fixture(t),a={x:0},b={x:0};let completed=0;
 const one=w.F.driver(a,()=>{}),two=w.F.driver(b,()=>{});
 const old=one.to({x:10},{duration:5000,after:()=>completed++});
 const independent=two.to({x:8},{duration:5000});
 one.set({x:3});assert.equal((await old).completed,false);assert.equal(b.x,0);
 w.A.finishAll();await independent;
 assert.equal(a.x,3);assert.equal(b.x,8);assert.equal(completed,0);
});
test('a newer tween starts from current state; cancel holds position; disposed drivers reject writes',async t=>{
 const w=fixture(t),state={x:2,y:4},d=w.F.driver(state,()=>{});
 const first=d.to({x:12},{duration:5000});
 const second=d.to({y:9},{duration:5000});assert.equal((await first).completed,false);
 d.cancel();assert.equal((await second).completed,false);assert.deepEqual(state,{x:2,y:4});
 const last=d.to({x:7},{duration:5000});d.dispose();assert.equal((await last).completed,false);
 w.A.finishAll();assert.deepEqual(state,{x:2,y:4});d.dispose();
 assert.throws(()=>d.set({x:1}),/disposed/);assert.throws(()=>d.to({x:1}),/disposed/);
});
test('instant completion is exact, but an intervening action suppresses its late callback',async t=>{
 const w=fixture(t),state={x:0};let painted=0,after=0;const d=w.F.driver(state,()=>painted++);
 const first=d.to({x:10},{duration:0,after:()=>after++});assert.equal(state.x,10);
 d.set({x:7});assert.equal((await first).completed,false);assert.equal(after,0);
 w.A.setInstant(true);assert.equal((await d.to({x:4},{after:()=>after++})).completed,true);
 assert.equal(state.x,4);assert.equal(after,1);assert.equal(painted,3);
});
test('an interrupted tween restarts from the actually painted intermediate value',async t=>{
 const w=fixture(t),frames=[];w.requestAnimationFrame=callback=>{frames.push(callback);return frames.length;};
 const frame=time=>{const callback=frames.shift();assert.ok(callback,'animation scheduled a frame');callback(time);};
 const state={x:0},d=w.F.driver(state,()=>{}),first=d.to({x:10},{duration:1000});
 frame(0);frame(500);assert.equal(state.x,5);
 const second=d.to({x:20},{duration:1000});assert.equal((await first).completed,false);
 frame(600);assert.equal(state.x,5);frame(1100);assert.equal(state.x,12.5);
 w.A.finishAll();assert.equal((await second).completed,true);assert.equal(state.x,20);
});
test('a failed paint rejects the transition without reporting completion or running after',async t=>{
 const w=fixture(t);let after=0;const state={x:0},d=w.F.driver(state,()=>{throw new Error('paint failed');});
 await assert.rejects(d.to({x:1},{duration:0,after:()=>after++}),/paint failed/);
 assert.equal(after,0);
});
test('a timed paint failure invalidates later frames and permits a subsequent valid transition',async t=>{
 const w=fixture(t),frames=[];w.requestAnimationFrame=fn=>{frames.push(fn);return frames.length;};
 let fail=true,after=0;const state={x:0},d=w.F.driver(state,()=>{if(fail&&state.x>0)throw new Error('frame failed');});
 const active=d.to({x:10},{duration:1000,after:()=>after++});
 frames.shift()(0);frames.shift()(500);await assert.rejects(active,/frame failed/);
 w.A.finishAll();assert.equal(state.x,5);assert.equal(after,0);
 fail=false;assert.equal((await d.to({x:8},{duration:0})).completed,true);assert.equal(state.x,8);
});
test('invalid patches and durations do not interrupt a valid animation or mutate state',async t=>{
 const w=fixture(t),state={x:0},d=w.F.driver(state,()=>{});let after=0;
 const active=d.to({x:6},{duration:5000,after:()=>after++});
 for(const patch of [{x:NaN},{x:Infinity},{x:'2'},{missing:3},[2],null])assert.throws(()=>d.set(patch));
 for(const duration of [-1,Infinity,NaN,'2'])assert.throws(()=>d.to({x:4},{duration}));
 assert.throws(()=>w.F.driver({x:Infinity},()=>{}));assert.throws(()=>w.F.driver({x:0},null));
 assert.deepEqual(state,{x:0});w.A.finishAll();assert.equal((await active).completed,true);assert.equal(state.x,6);assert.equal(after,1);
});
test('scene disposal invalidates pending driver writes before the player finishes animations',async t=>{
 const w=fixture(t,true),state={x:0};let after=0,disposed=0;
 w.D.deck.register({id:'a',title:'A',build(ctx){const d=w.F.driver(state,()=>{});ctx.onDispose(()=>{disposed++;d.dispose();});ctx.step(()=>d.to({x:9},{duration:5000,after:()=>after++}));return w.D.dom.h('section','A');}});
 w.D.deck.register({id:'b',title:'B',build(){return w.D.dom.h('section','B');}});
 w.D.deck.show(0,0);w.D.deck.next();await settle();w.D.deck.show(1,0);await settle();
 assert.equal(state.x,0);assert.equal(after,0);assert.equal(disposed,1);assert.equal(w.D.deck.current().index,1);assert.equal(w.D.deck.root().textContent,'B');
});
test('leaving before a queued step starts suppresses that step',async t=>{
 const w=fixture(t,true);let steps=0;
 w.D.deck.register({id:'a',title:'A',build(ctx){ctx.step(()=>{steps++;});return w.D.dom.h('section','A');}});
 w.D.deck.register({id:'b',title:'B',build(){return w.D.dom.h('section','B');}});
 w.D.deck.show(0,0);w.D.deck.next();w.D.deck.show(1,0);await settle();
 assert.equal(steps,0);assert.equal(w.D.deck.current().index,1);
});
test('a superseded instant replay never executes its remaining steps or replaces the new mount',async t=>{
 const w=fixture(t,true);let steps=0,disposed=0;
 w.D.deck.register({id:'a',title:'A',build(ctx){ctx.onDispose(()=>disposed++);ctx.step(()=>{steps++;return Promise.resolve();});ctx.step(()=>{steps++;return Promise.resolve();});return w.D.dom.h('section','A');}});
 w.D.deck.register({id:'b',title:'B',build(){return w.D.dom.h('section','B');}});
 w.D.deck.show(0,2);w.D.deck.show(1,0);await settle();
 assert.equal(steps,0);assert.equal(disposed,1);assert.equal(w.D.deck.current().index,1);assert.equal(w.D.deck.current().busy,false);assert.equal(w.A.isInstant(),false);
});
