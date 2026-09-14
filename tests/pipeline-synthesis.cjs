const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const base = process.env.LESSON_TEST_DIR || path.join(__dirname, '..', 'starter');
const source = () => fs.readFileSync(path.join(base, 'js/recipes/pipeline-synthesis.js'), 'utf8');
test('pipeline fixture separates proposed inputs, prediction and independent evaluation', () => {
  const context = {}; vm.runInNewContext(source(), context);
  const fixture = context.PIPELINE_SYNTHESIS_EXAMPLE, model = fixture.calculate;
  for (const [shift, spread, values, mean, range] of [[0,1,[1,3],2,2],[1,1,[2,4],3,2],[2,1,[3,5],4,2],[2,0,[4,4],4,0],[4,1,[5,7],6,2]]) {
    const r = model(shift, spread);
    assert.deepEqual(Array.from(r.values), values); assert.equal(r.mean, mean); assert.equal(r.range, range);
    assert.equal(r.meanError, Math.abs(mean-4)); assert.equal(r.rangeError, Math.abs(range-2));
  }
  for (let i=0;i<=40;i++) for (let j=0;j<=10;j++) {
    const shift=i/10, spread=j/10, r=model(shift,spread), changed=model(shift,spread,[100,200]);
    assert.ok(Math.abs(r.mean-(2+shift))<1e-12); assert.ok(Math.abs(r.range-2*spread)<1e-12);
    assert.deepEqual(Array.from(changed.values),Array.from(r.values),'Reference must not enter construction');
    assert.ok(r.values.every(v=>v>=0&&v<=8));
  }
  for(const args of [[NaN,1],[5,1],[0,-1],[0,Infinity]]) assert.throws(()=>model(...args));
  assert.throws(()=>model(2,1,[])); assert.throws(()=>model(2,1,[NaN,3]));
  assert.throws(()=>model(2,1,Array(2))); assert.throws(()=>model(2,1,[Number.MAX_VALUE,-Number.MAX_VALUE]));
  assert.equal(model(2,1,[Number.MAX_VALUE,Number.MAX_VALUE]).referenceMean,Number.MAX_VALUE);
  assert.ok(Object.isFrozen(fixture.cells)); assert.ok(Object.isFrozen(fixture.cells[0]));
});

test('pipeline scenes keep cell identity, computed bars and bilingual notes through motion and controls', async t => {
  const {JSDOM}=require('jsdom'), dom=new JSDOM('<body></body>',{runScripts:'outside-only',pretendToBeVisual:true});
  t.after(()=>dom.window.close());const w=dom.window;w.matchMedia=()=>({matches:false});
  for(const name of ['lib/dom','lib/i18n','lib/num','lib/anim','lib/plot','lib/svg','lesson','interaction-regions','film','layout','motion','patterns']) w.eval(fs.readFileSync(path.join(base,'js',name+'.js'),'utf8'));
  const scenes=[];w.D.deck={register:s=>scenes.push(s),count:()=>4};w.eval(source());
  assert.deepEqual(scenes.map(s=>s.id),Array.from(w.PIPELINE_SYNTHESIS_EXAMPLE.sceneIds));
  let frames=0,states=0;
  for(const [index,scene] of scenes.entries()){
    const steps=[],disposes=[],root=scene.build({index,step:f=>steps.push(f),onDispose:f=>disposes.push(f)});w.document.body.append(root);
    const cells=[...root.querySelectorAll('[data-pipeline-cell]')],bars=[...root.querySelectorAll('[data-pipeline-bar]')];
    function check(){
      const state=JSON.parse(root.dataset.pipelineState),r=JSON.parse(root.dataset.pipelineResult);
      assert.deepEqual([...root.querySelectorAll('[data-pipeline-cell]')],cells);
      assert.deepEqual([...root.querySelectorAll('[data-pipeline-bar]')],bars);
      assert.deepEqual(cells.map(c=>[c.dataset.pipelineCell,+c.dataset.value]),[['c1',1],['c2',3]]);
      assert.ok(Math.abs(r.mean-(2+state.shift))<1e-10);assert.ok(Math.abs(r.range-2*state.spread)<1e-10);
      bars.forEach((b,i)=>{assert.ok(Math.abs(+b.getAttribute('width')-28*r.values[i])<1e-9);assert.equal(+b.dataset.value,r.values[i]);});
      assert.doesNotMatch(root.innerHTML,/="(?:NaN|Infinity|undefined)"/);
    }
    w.A.run=async paint=>{for(let i=0;i<=10;i++){paint(i/10);frames++;check();}};
    check();states++;for(const step of steps){await step();check();states++;}
    assert.equal(scene.notes.length,steps.length+1);
    const before=root.dataset.pipelineState;w.D.i18n.setLang('en');w.L.reflow(root);
    assert.equal(w.D.i18n.notes(scene).length,scene.notes.length);assert.equal(w.D.i18n.qa(scene).length,3);
    assert.equal(root.dataset.pipelineState,before,'Language change preserves current parameter state');
    if(scene.id==='pipeline-synthesis'){
      const down=root.querySelector('[data-vlk-button="pipeline-shift-down"]');
      down.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));down.dispatchEvent(new w.KeyboardEvent('keyup',{key:'Enter',bubbles:true}));
      assert.equal(JSON.parse(root.dataset.pipelineState).shift,2);check();
      const zero=root.querySelector('[data-vlk-button="pipeline-spread-zero"]');zero.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));await Promise.resolve();
      assert.equal(JSON.parse(root.dataset.pipelineResult).range,0);assert.equal(JSON.parse(root.dataset.pipelineResult).mean,4);check();
      w.D.i18n.apply(root);assert.match(root.querySelector('.film-caption').textContent,/correct mean/i);
    }
    disposes.forEach(f=>f());root.remove();w.D.i18n.setLang('ru');
  }
  assert.equal(states,13);assert.ok(frames>=99);t.diagnostic(`${states} states and ${frames} sampled driver frames preserve cell IDs and synchronized values.`);
});
