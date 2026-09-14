/* Exact ranking, persistent geometry, and authored threshold example. No browser. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),test=require('node:test');
const {JSDOM}=require('jsdom');
const starter=path.resolve(__dirname,'../starter');
const DATA=[{id:'A',score:.9,positive:true},{id:'B',score:.8,positive:false},{id:'C',score:.6,positive:true},{id:'D',score:.6,positive:false},{id:'E',score:.3,positive:true},{id:'F',score:.1,positive:false}];
function env(t){
 const dom=new JSDOM('<body></body>',{runScripts:'outside-only',pretendToBeVisual:true,url:'http://localhost/lesson/'}),w=dom.window;w.matchMedia=()=>({matches:false});
 for(const file of ['lib/dom','lib/num','lib/anim','lib/plot','lib/svg','lesson','film','patterns'])w.eval(fs.readFileSync(path.join(starter,'js',file+'.js'),'utf8'));
 const file=path.join(starter,'js/threshold.js');if(fs.existsSync(file))w.eval(fs.readFileSync(file,'utf8'));t.after(()=>w.close());return w;
}
function ranking(w,observations=DATA){assert.equal(typeof w.K.binaryRanking,'function','K.binaryRanking must exist');return w.K.binaryRanking({observations});}
function close(a,b,eps=1e-10){assert(Math.abs(a-b)<=eps,`${a} differs from ${b}`);}
test('ties enter together and AP uses right-endpoint precision',t=>{
 const w=env(t),r=ranking(w),empty=r.at(.95),tied=r.at(.6);
 assert.deepEqual([empty.selected,empty.TP,empty.FP,empty.TN,empty.FN,empty.precision,empty.recall],[0,0,0,3,3,null,0]);
 assert.deepEqual([tied.selected,tied.TP,tied.FP,tied.precision,tied.recall],[4,2,2,.5,2/3]);
 assert.equal(r.at(.60000001).selected,2);assert.equal(r.groups.length,5);close(r.averagePrecision,.7);
 const reversed=ranking(w,DATA.slice().reverse());close(reversed.averagePrecision,.7);
 assert.deepEqual(Array.from(reversed.curve,p=>[p.recall,p.precision]),Array.from(r.curve,p=>[p.recall,p.precision]));
 close(r.rectangles.reduce((a,q)=>a+(q.right-q.left)*q.precision,0),r.averagePrecision);
});
test('undefined precision/recall/AP stay null and observations are immutable copies',t=>{
 const w=env(t),input=[{id:'n',score:.2,positive:false}],r=ranking(w,input);
 assert.equal(r.averagePrecision,null);assert.equal(r.at(1).precision,null);assert.equal(r.at(1).recall,null);assert.equal(r.at(0).recall,null);assert.equal(r.at(0).precision,0);
 assert.equal(r.curve.length,0);assert.equal(r.rectangles.length,0);input[0].score=.8;assert.equal(r.observations[0].score,.2);
 assert(Object.isFrozen(r.observations));assert(Object.isFrozen(r.observations[0]));
 const p=ranking(w,[{id:'p',score:1,positive:true}]);assert.equal(p.at(1).TP,1);assert.equal(p.at(1.01).precision,null);assert.equal(p.averagePrecision,1);
});
test('invalid data and options fail before any DOM mutation',t=>{
 const w=env(t);ranking(w);const sparse=new Array(2);sparse[1]=DATA[0];
 for(const observations of [[],sparse,[{...DATA[0],score:NaN}],[{...DATA[0],positive:1}],[DATA[0],DATA[0]],[{...DATA[0],id:''}],[{...DATA[0],extra:1}]])assert.throws(()=>w.K.binaryRanking({observations}));
 assert.throws(()=>w.K.binaryRanking({observations:DATA,unknown:true}));const svg=w.D.dom.s('svg');w.document.body.append(svg);const r=ranking(w);
 const base={ranking:r,scoreDomain:[0,1],scoreFrame:{x:150,y:270,width:450,height:150},prFrame:{x:820,y:275,width:310,height:240}};
 for(const patch of [{scoreDomain:[0,.5]},{scoreDomain:[1,0]},{scoreDomain:[0,Infinity]},{scoreFrame:{x:0,y:0,width:0,height:10}},{radius:-1},{threshold:NaN},{ranking:{}},{unknown:1}]){assert.throws(()=>w.K.thresholdCurve(svg,{...base,...patch}));assert.equal(svg.childNodes.length,0);}
});
test('pixel rectangles equal AP and every PR step is axis-aligned',t=>{
 const w=env(t),r=ranking(w),svg=w.D.dom.s('svg');w.document.body.append(svg);
 const q=w.K.thresholdCurve(svg,{ranking:r,scoreDomain:[0,1],scoreFrame:{x:150,y:270,width:450,height:150},prFrame:{x:820,y:275,width:310,height:240},threshold:0});q.showPR(1);q.revealArea(1);
 const area=q.areaRects.reduce((sum,rect)=>sum+(+rect.getAttribute('width'))*(+rect.getAttribute('height')),0);close(area/(310*240),.7);
 const points=q.curve.getAttribute('d').match(/-?\d+(?:\.\d+)?(?:e[-+]?\d+)?/gi).map(Number);for(let i=2;i<points.length;i+=2)assert(points[i]===points[i-2]||points[i+1]===points[i-1],'PR steps may not be diagonal');
 close(+q.dot.getAttribute('cx'),1130);close(+q.dot.getAttribute('cy'),395);
});
test('class stacks stay separated and crowded score geometry fails before DOM mutation',t=>{
 const w=env(t),svg=w.D.dom.s('svg');w.document.body.append(svg);
 const config={scoreDomain:[0,1],scoreFrame:{x:190,y:275,width:460,height:140},prFrame:{x:840,y:275,width:300,height:240},radius:8};
 const tied=Array.from({length:6},(_,i)=>({id:'t'+i,score:.5,positive:i<3}));
 const chart=w.K.thresholdCurve(svg,{...config,ranking:ranking(w,tied)});
 const positions=chart.points.map(p=>p.getAttribute('transform').match(/-?\d+(?:\.\d+)?/g).map(Number));
 for(let i=0;i<positions.length;i++)for(let j=i+1;j<positions.length;j++)assert(Math.hypot(positions[i][0]-positions[j][0],positions[i][1]-positions[j][1])>=20,'separate markers and stroke');
 const before=svg.innerHTML;
 assert.throws(()=>w.K.thresholdCurve(svg,{...config,ranking:ranking(w,[{id:'a',score:.5,positive:true},{id:'b',score:.51,positive:true}])}),/overlap/);
 assert.equal(svg.innerHTML,before);
});
test('threshold updates retain identities, fixed scales and integer counts across samples/replay',t=>{
 const w=env(t),r=ranking(w),svg=w.D.dom.s('svg');w.document.body.append(svg);
 const q=w.K.thresholdCurve(svg,{ranking:r,scoreDomain:[0,1],scoreFrame:{x:150,y:270,width:450,height:150},prFrame:{x:820,y:275,width:310,height:240},threshold:.95}),nodes=Array.from(q.g.querySelectorAll('*')),positions=q.points.map(p=>p.getAttribute('transform'));
 q.showPR(1);for(let i=0;i<=120;i++){
  const threshold=.95*(1-i/120);q.setThreshold(threshold);q.revealArea(i/120);const st=q.stats();
  assert(Number.isInteger(st.TP)&&Number.isInteger(st.FP));assert.equal(st.selected,r.at(threshold).selected);
  assert.deepEqual(Array.from(q.g.querySelectorAll('*')),nodes);assert.deepEqual(q.points.map(p=>p.getAttribute('transform')),positions);
  for(const line of q.g.querySelectorAll('line'))for(const a of ['x1','x2'])assert(+line.getAttribute(a)>=150&&+line.getAttribute(a)<=1130);
  for(const node of q.g.querySelectorAll('path,rect,circle,line'))assert(!/NaN|Infinity/.test(node.outerHTML));
 }
 q.setThreshold(.95);const before=q.g.outerHTML;for(const v of [NaN,Infinity,-.01,1.01]){assert.throws(()=>q.setThreshold(v));assert.equal(q.g.outerHTML,before);}q.setThreshold(.6);assert.equal(q.stats().selected,4);q.setThreshold(.95);assert.equal(q.g.outerHTML,before);
});
test('no-positive renderer never draws an invented PR point or AP area',t=>{
 const w=env(t),r=ranking(w,[{id:'n',score:.5,positive:false}]),svg=w.D.dom.s('svg');w.document.body.append(svg);
 const q=w.K.thresholdCurve(svg,{ranking:r,scoreDomain:[0,1],scoreFrame:{x:150,y:270,width:450,height:150},prFrame:{x:820,y:275,width:310,height:240}});q.showPR(1);q.setThreshold(0);q.revealArea(1);
 assert.equal(q.dot.style.opacity,'0');assert.equal(q.curve.getAttribute('d'),'');assert.equal(q.areaRects.length,0);assert.equal(q.stats().recall,null);
});
test('revealed AP always has the full ranking curve even when the selected threshold changes',t=>{
 const w=env(t),r=ranking(w),svg=w.D.dom.s('svg');w.document.body.append(svg);const q=w.K.thresholdCurve(svg,{ranking:r,scoreDomain:[0,1],scoreFrame:{x:150,y:270,width:450,height:150},prFrame:{x:820,y:275,width:310,height:240},threshold:.6});
 q.revealArea(1);assert.match(q.curve.getAttribute('d'),/L1130,395$/);assert.equal(q.stats().selected,4);q.setThreshold(.95);assert.match(q.curve.getAttribute('d'),/L1130,395$/);assert.equal(q.dot.style.opacity,'0');q.revealArea(0);assert.equal(q.curve.getAttribute('d'),'');
});
function episode(w){
 let scene;w.D.deck={register:value=>scene=value,count:()=>11};const file=path.join(starter,'js/episodes/11-threshold.js');assert(fs.existsSync(file),'threshold example must exist');w.eval(fs.readFileSync(file,'utf8'));assert(scene);return scene;
}
test('example has three builds, stable evidence, sampled bounds and exact replay',async t=>{
 const w=env(t),scene=episode(w);assert.equal(scene.notes.length,4);assert.equal(scene.qa.length,2);
 const steps=[],disposes=[],root=scene.build({index:10,step:fn=>steps.push(fn),onDispose:fn=>disposes.push(fn)});w.document.body.append(root);assert.equal(steps.length,3);assert.equal(disposes.length,1);
 const identities=Array.from(root.querySelectorAll('[data-observation-id]')),rects=Array.from(root.querySelectorAll('[data-ap-rectangle]'));let frames=0;
 w.A.run=(fn)=>{for(let i=0;i<=60;i++){fn(i/60);frames++;const selected=root.querySelectorAll('[data-selected="true"]').length;assert.equal(selected,+root.dataset.selected);assert.equal(+root.dataset.tp+ +root.dataset.fp,selected);assert(Number.isInteger(+root.dataset.tp));
   assert.deepEqual(Array.from(root.querySelectorAll('[data-observation-id]')),identities);assert.deepEqual(Array.from(root.querySelectorAll('[data-ap-rectangle]')),rects);
   for(const rect of rects){assert(+rect.getAttribute('x')>=60);assert(+rect.getAttribute('x')+ +rect.getAttribute('width')<=1220);assert(+rect.getAttribute('y')>=147);assert(+rect.getAttribute('y')+ +rect.getAttribute('height')<=610);}
   assert(!/NaN|Infinity/.test(root.outerHTML));
  }return Promise.resolve();};
 await steps[0]();assert.equal(root.dataset.selected,'2');assert.equal(root.dataset.precision,'0.5');assert.equal(root.dataset.recall,String(1/3));
 await steps[1]();assert.equal(root.dataset.selected,'4');assert.equal(root.dataset.tp,'2');assert.equal(root.dataset.fp,'2');
 await steps[2]();assert.equal(root.dataset.selected,'6');assert.equal(root.dataset.ap,'0.7');assert.match(root.querySelector('.film-caption').textContent,/average precision/i);assert(frames>=183,'sample every transition');
 const replaySteps=[],replay=scene.build({index:10,step:fn=>replaySteps.push(fn),onDispose:()=>{}});w.document.body.append(replay);w.A.setInstant(true);w.A.run=fn=>{fn(1);return Promise.resolve();};for(const step of replaySteps)await step();
 assert.equal(replay.querySelector('svg').outerHTML,root.querySelector('svg').outerHTML);assert.equal(replay.querySelector('.film-caption').textContent,root.querySelector('.film-caption').textContent);
 disposes.forEach(fn=>fn());
});
test('manual threshold interrupts a build and keeps counts, ratios and caption consistent',async t=>{
 const w=env(t),scene=episode(w),steps=[],root=scene.build({index:10,step:fn=>steps.push(fn),onDispose:()=>{}});w.document.body.append(root);
 const pending=steps[0](),slider=root.querySelector('input[type="range"]');slider.value='.6';slider.dispatchEvent(new w.Event('input',{bubbles:true}));await pending;w.A.finishAll();await Promise.resolve();
 assert.equal(root.dataset.threshold,'0.6');assert.equal(root.dataset.selected,'4');assert.equal(root.dataset.tp,'2');assert.equal(root.dataset.fp,'2');assert.match(root.querySelector('.film-caption').textContent,/4/);assert.match(root.querySelector('.film-caption').textContent,/2/);
 slider.value='1';slider.dispatchEvent(new w.Event('input',{bubbles:true}));assert.equal(root.dataset.selected,'0');assert.equal(root.dataset.precision,'null');assert.match(root.querySelector('.film-caption').textContent,/не определена/);
});
