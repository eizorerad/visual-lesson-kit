const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
const source=path.join(__dirname,'../starter/js/chemistry-bridge-qa.js');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(fn){for(let i=0;i<300;i++){if(fn())return;await sleep(5);}throw Error('QA did not settle');}
function setup(enabled=true){
 assert.ok(fs.existsSync(source),'The optional chemistry QA implementation must exist');
 const dom=new JSDOM('<main id="frame"></main>',{url:'https://lesson.example/'+(enabled?'?qa=1':''),runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window,frame=w.document.querySelector('#frame');w.requestAnimationFrame=fn=>w.setTimeout(fn,0);
 w.eval(fs.readFileSync(path.join(__dirname,'../starter/js/layout.js'),'utf8'));
 let current={index:0,step:0};const visited=[];
 w.D={deck:{scenes:()=>[{id:'chem-first'},{id:'chem-second'}],current:()=>({...current}),root:()=>frame.firstElementChild,show(index,step=0){
  current={index,step};visited.push(index);frame.replaceChildren();
  const root=w.document.createElement('section');root.dataset.chemScene=index?'second':'first';root.dataset.sceneId=index?'chem-second':'chem-first';root.dataset.running='false';
  root.innerHTML='<svg><g data-chem-drawing="sample"><path d="M0 0L10 10"/><text>Value</text></g></svg><input type="range" min="0" max="100" step="1">';
  const input=root.querySelector('input'),text=root.querySelector('text');
  w.L.contract(text,{id:'sample-label',box:{x:0,y:0,width:100,height:50},space:root.querySelector('svg')});
  const paint=()=>{root.dataset.progress=String(Number(input.value)/100);root.dataset.metrics=JSON.stringify({value:Number(input.value)});text.replaceChildren(w.document.createElementNS('http://www.w3.org/2000/svg','tspan'));text.firstChild.textContent=input.value;};
  input.addEventListener('input',paint);input.value='0';paint();frame.append(root);
 }}};
 w.D.deck.show(0);w.eval(fs.readFileSync(source,'utf8'));return {dom,w,visited};
}
function output(w){return JSON.parse(w.document.querySelector('#chemistry-qa').textContent);}
test('chemistry QA is inert without the explicit query parameter',async()=>{
 const {dom,w}=setup(false);await sleep(20);assert.equal(w.document.querySelector('#chemistry-qa'),null);assert.equal(w.document.querySelector('[data-chemistry-qa-toolbar]'),null);dom.window.close();
});
test('sweep samples every scene, retains unmeasured results and restores scene position',async()=>{
 const {dom,w,visited}=setup();await until(()=>w.document.querySelector('#chemistry-qa')?.textContent);
 const frame25=[...w.document.querySelectorAll('button')].find(n=>n.textContent==='Frame 25%');frame25.click();await until(()=>output(w).current?.progress===.25);
 const check=[...w.document.querySelectorAll('button')].find(n=>n.textContent==='Check all scenes');check.click();await until(()=>output(w).run.status==='complete');
 const result=output(w);assert.deepEqual(result.run.frames,[0,.12,.25,.36,.45,.55,.65,.72,.76,.84,.92,1]);assert.equal(result.run.checked,24);assert.equal(w.D.deck.current().index,0);assert.equal(w.D.deck.root().dataset.progress,'0.25');
 assert.ok(result.run.issues.some(i=>i.kind==='unmeasured'),'JSDOM cannot measure SVG text and must not produce a clean visual claim');
 assert.equal(result.history.filter(x=>x.sweep).length,24);assert.ok(result.history.filter(x=>x.sweep).every(x=>x.sameNodes),'Changing text/tspan nodes does not replace scientific shapes');
 assert.deepEqual([...new Set(visited)],[0,1]);dom.window.close();
});
test('audit mutations do not cause an observer loop and shape replacements remain visible',async()=>{
 const {dom,w}=setup();let audits=0;const audit=w.L.audit;w.L.audit=(root,options)=>{audits++;root.dataset.auditWrites=String(audits);return audit(root,options);};
 await until(()=>w.document.querySelector('#chemistry-qa')?.textContent);await sleep(25);assert.ok(audits<5,'Audit-generated mutations must not reschedule themselves');
 const old=w.D.deck.root().querySelector('path');old.replaceWith(old.cloneNode(true));await until(()=>output(w).current?.sameNodes===false);
 assert.ok(output(w).current.issues.some(i=>i.kind==='shape-identity'));dom.window.close();
});
