/* DOM/numerical checks. Does not claim browser layout or animation QA. */
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..'),starter=process.env.LESSON_TEST_DIR||path.join(root,'starter');
const dom=new JSDOM('<body></body>',{runScripts:'outside-only',pretendToBeVisual:true,url:'http://localhost/lesson/'});
const w=dom.window;w.matchMedia=()=>({matches:false});
const scenes=[];
const scripts=[...fs.readFileSync(path.join(starter,'index.html'),'utf8').matchAll(/<script src="([^"]+)"/g)].map(m=>m[1]);
for(const file of scripts){
 if(/\/(player|boot)\.js$/.test(file))continue;
 w.eval(fs.readFileSync(path.join(starter,file),'utf8'));
 if(file==='js/deck.js')w.D.deck={register:s=>scenes.push(s),scale:()=>1,count:()=>scenes.length};
}
let assertions=0;
const check=(condition,msg)=>{assert.ok(condition,msg);assertions++;};
const near=(a,b,msg)=>check(Number.isFinite(+a)&&Math.abs(+a-b)<1e-8,msg+' ('+a+' vs '+b+')');
const vector=v=>JSON.stringify(Array.from(v));
(async()=>{
 check(scenes.length>=1,'At least one episode is registered');
 const svg=w.D.dom.s('svg');w.document.body.append(svg);
 const scale=w.K.linearScale([0,100],[500,100]);near(scale(25),400,'fixed units');near(scale.invert(300),50,'inverse');
 assert.throws(()=>w.K.linearScale([1,1],[0,100]));assertions++;
 const crop=w.K.sourceWindow(svg,{file:'example-matrix.svg',sourceWidth:800,sourceHeight:400,x:80,y:160,width:1000,height:420,box:{x:100,y:50,width:200,height:200}});
 for(let i=0;i<=20;i++){
  const box={x:100,y:50,width:200+i*10,height:200};crop.setBox(box);
  near(+crop.svg.getAttribute('width')/+crop.svg.getAttribute('height'),box.width/box.height,'viewport matches exact source crop');
  check(vector(crop.svg.getAttribute('viewBox').split(' ').map(Number))===vector([box.x,box.y,box.width,box.height]),'crop boundaries preserved');
 }
 crop.setFrame({x:100,y:170,width:600,height:300});check(+crop.svg.getAttribute('x')>=100,'fitted crop starts inside frame');
 assert.throws(()=>crop.setBox({x:790,y:0,width:20,height:20}));assertions++;
 const hist=w.K.histogram(svg,{values:[0,.1,.2,.3,.4,1],bins:[0,.5,1],x:100,y:200,width:600,height:250,color:w.C.gold});
 check(vector(hist.counts)==='[5,1]','bin counts include final edge');
 const original=Array.from(hist.points);hist.setProgress(.5);hist.setProgress(1);hist.setBarsProgress(1);
 check(hist.points.every((p,i)=>p===original[i]),'histogram actors retain identity');
 assert.throws(()=>w.K.histogram(svg,{values:[2],bins:[0,1],x:0,y:0,width:100,height:100}));assertions++;
 assert.throws(()=>w.K.histogram(svg,{values:[1,2],bins:[0,1,3],x:0,y:0,width:100,height:100}));assertions++;
 const reps=w.K.replicates(svg,{groups:[{label:'A',values:[1,2,3],color:w.C.blue},{label:'B',values:[8,8,8],color:w.C.teal}],domain:[0,10],x:100,y:200,width:600,height:300});
 check(vector(reps.meanValues)==='[2,8]','means use individual observations');near(reps.yScale(8),260,'replicate data use fixed domain');
 check(reps.points.length===6,'six individual measurements retained');
 w.LESSON_ASSETS={'a.svg':'data:image/svg+xml;base64,PHN2Zy8+'};
 check(w.D.assets.url('a.svg')===w.LESSON_ASSETS['a.svg'],'bundled asset resolver');
 const sourceRoot=w.document.createElement('section');w.document.body.append(sourceRoot);
 const trigger=w.T.evidence(sourceRoot,{title:'Local example',image:'a.svg',html:'<p>Example only</p>',url:''});trigger.click();
 check(w.document.querySelector('.evidence-layer a')===null,'no invented source link');
 check(w.document.querySelector('.evidence-layer img').src.startsWith('data:'),'source image works offline');
 w.document.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));check(!w.document.querySelector('.evidence-layer'),'Escape closes source dialog');
 w.A.setInstant(true);let states=0,builds=0;
 for(let i=0;i<scenes.length;i++){
  const scene=scenes[i],steps=[],disposes=[],el=scene.build({index:i,step:fn=>steps.push(fn),onDispose:fn=>disposes.push(fn)});w.document.body.append(el);
  check(scene.notes.length===steps.length+1,scene.id+' narration covers every state');
  for(let n=0;n<=steps.length;n++){
   if(n)await steps[n-1]();
   for(const node of el.querySelectorAll('*'))for(const a of node.attributes)check(!/NaN|Infinity|undefined/.test(a.value),scene.id+' valid attribute '+a.name);
   states++;
  }
  builds+=steps.length;disposes.forEach(fn=>fn());el.remove();
 }
 const report={method:'jsdom helper invariants and complete instant state replay; not browser rendering',episodes:scenes.length,states,builds,assertions,errors:0};
 fs.mkdirSync(path.join(root,'verification'),{recursive:true});fs.writeFileSync(path.join(root,'verification/runtime.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));w.close();
})().catch(e=>{console.error(e.stack);w.close();process.exitCode=1;});
