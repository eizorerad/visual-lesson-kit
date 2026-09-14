/* Behaviour contracts for the connected explanation recipe; real layout reviewed separately. */
const test=require('node:test'), assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const base=process.env.LESSON_TEST_DIR||path.join(__dirname,'..','starter');
test('connected recipe retains data through intermediate motion and has matching bilingual notes',async t=>{
 const dom=new JSDOM('<body></body>',{runScripts:'outside-only',pretendToBeVisual:true});t.after(()=>dom.window.close());const w=dom.window;w.matchMedia=()=>({matches:false});
 for(const f of ['lib/dom','lib/i18n','lib/num','lib/anim','lib/plot','lib/svg','lesson','film','layout','motion','patterns','explanation','distributions']){const p=path.join(base,'js',f+'.js');if(fs.existsSync(p))w.eval(fs.readFileSync(p,'utf8'));}
 const scenes=[];w.D.deck={register:s=>scenes.push(s),count:()=>4};const file=path.join(base,'js/recipes/explanation-bridges.js');if(fs.existsSync(file))w.eval(fs.readFileSync(file,'utf8'));
 assert.equal(scenes.length,4,'Four connected worked scenes are available');
 let frames=0;
 for(const [index,sc]of scenes.entries()){
  const steps=[],cleanups=[],root=sc.build({index,step:f=>steps.push(f),onDispose:f=>cleanups.push(f)});w.document.body.append(root);
  const original=[...root.querySelectorAll('[data-observation-id]')];const values=original.map(n=>n.dataset.value);
  w.A.run=async paint=>{for(let i=0;i<=10;i++){paint(i/10);frames++;assert.deepEqual([...root.querySelectorAll('[data-observation-id]')],original);assert.deepEqual(original.map(n=>n.dataset.value),values);assert.doesNotMatch(root.innerHTML,/="(?:NaN|Infinity|undefined)"/);const state=JSON.parse(root.dataset.motionPhase||'{}');if(sc.id==='bridge-grid'&&state.grid<.5&&Math.abs(state.u-+state.u.toFixed(3))>1e-10)assert.ok(root.textContent.includes('u ≈ '+state.u.toFixed(3)),'Rounded moving probability must be marked approximate');}};
  for(const f of steps)await f();
  assert.equal(sc.notes.length,steps.length+1);w.D.i18n.setLang('en');assert.equal(w.D.i18n.notes(sc).length,sc.notes.length);assert.equal(w.D.i18n.qa(sc).length,1);
  const input=root.querySelector('input');if(input){const value=input.value;w.D.i18n.setLang('ru');assert.equal(input.value,value);}
  if(sc.id==='bridge-distance'){
   assert.equal(+root.dataset.squared,25);assert.equal(+root.dataset.distance,5);assert.equal(+root.dataset.objective,12.5);
   const slider=root.querySelector('input');slider.value='.2';slider.dispatchEvent(new w.Event('input',{bubbles:true}));
   assert.ok(Math.abs(+root.dataset.objective-17)<1e-10);assert.doesNotMatch(root.querySelector('.film-caption').textContent,/minimum|minimu|минимум/,'A moved slider must not retain a minimum claim');
  }
  if(sc.id==='bridge-grid'){assert.equal(+root.dataset.gridSize,200);assert.equal(root.querySelectorAll('[data-grid-marker]').length,200);assert.equal(original.length,8);}
  cleanups.forEach(f=>f());root.remove();w.D.i18n.setLang('ru');
 }
 assert.ok(frames>=90);
});
