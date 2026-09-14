/* Independent arithmetic, persistent geometry and lifecycle checks; not a browser review. */
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), { JSDOM } = require('jsdom');
const base = process.env.LESSON_TEST_DIR || path.join(__dirname, '..', 'starter');
const cells = [['c1','D1','T',1,3],['c2','D1','T',2,4],['c3','D1','B',5,0],['c4','D1','B',3,2],['c5','D2','T',4,2],['c6','D2','T',0,4],['c7','D2','B',2,2],['c8','D2','B',6,0]].map(([id,sample,stratum,...counts])=>({id,sample,stratum,counts}));
const rows = [{id:'a',counts:[1,3]},{id:'b',counts:[2,6]},{id:'c',counts:[4,4]}];
const plain = value => JSON.parse(JSON.stringify(value));
const near = (a,b) => assert.ok(Number.isFinite(a) && Math.abs(a-b)<1e-10, `${a} != ${b}`);
function env(t, recipes=false) {
 const dom=new JSDOM('<body></body>',{runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;w.matchMedia=()=>({matches:false});
 for(const f of ['lib/dom','lib/i18n','lib/num','lib/anim','lib/plot','lib/svg','lesson','film','layout','motion','patterns'])w.eval(fs.readFileSync(path.join(base,'js',f+'.js'),'utf8'));
 const file=path.join(base,'js/biology.js');if(fs.existsSync(file))w.eval(fs.readFileSync(file,'utf8'));
 const svg=w.D.dom.s('svg');w.document.body.append(svg);t.after(()=>w.close());return {w,svg};
}
test('raw pseudobulk sums preserve sample × stratum and source provenance',t=>{
 const {w}=env(t);assert.equal(typeof w.K.aggregateCounts,'function');
 const input=plain(cells),q=w.K.aggregateCounts(input,{genes:['G1','G2']});
 assert.deepEqual(plain(q.groups.map(g=>[g.sample,g.stratum,g.counts,g.sourceIds])),[['D1','T',[3,7],['c1','c2']],['D1','B',[8,2],['c3','c4']],['D2','T',[4,6],['c5','c6']],['D2','B',[8,2],['c7','c8']]]);
 assert.equal(q.cellCount,8);assert.equal(q.sampleCount,2);assert.deepEqual(plain(q.totals),[23,17]);
 assert.deepEqual(plain(q.strata),[{id:'T',sampleIds:['D1','D2'],sampleCount:2},{id:'B',sampleIds:['D1','D2'],sampleCount:2}]);
 input[0].counts[0]=99;assert.equal(q.cells[0].counts[0],1);assert.ok(Object.isFrozen(q.groups[0].counts));
 const mixed=w.K.aggregateCounts([{id:'x',sample:'a:b',stratum:'c',counts:[1]},{id:'y',sample:'a',stratum:'b:c',counts:[2]}],{genes:['g']});assert.equal(mixed.groups.length,2);
});
test('normalization has an explicit total and log1p follows scaling',t=>{
 const {w}=env(t);assert.equal(typeof w.K.normalizeCountRows,'function');const q=w.K.normalizeCountRows(rows,{targetTotal:8});
 assert.deepEqual(plain(q.rows.map(r=>r.raw)),[[1,3],[2,6],[4,4]]);assert.deepEqual(plain(q.rows.map(r=>r.normalized)),[[2,6],[2,6],[4,4]]);
 q.rows.forEach((r,i)=>{near(r.normalized.reduce((a,b)=>a+b,0),8);r.log1p.forEach((v,j)=>near(v,Math.log1p([[2,6],[2,6],[4,4]][i][j])));});
 near(q.rows[0].factor,2);assert.equal(w.K.normalizeCountRows([{id:'z',counts:[0,2]}],{targetTotal:8}).rows[0].log1p[0],0);
});
test('diploid allele counts and HWE expectations have different denominators and remain separate',t=>{
 const {w}=env(t);assert.equal(typeof w.K.alleleSummary,'function');const q=w.K.alleleSummary({AA:4,Aa:4,aa:2});
 assert.equal(q.individuals,10);assert.equal(q.copies,20);assert.equal(q.alleles.A,12);assert.equal(q.alleles.a,8);near(q.p,.6);near(q.q,.4);
 assert.deepEqual(plain(q.observed),[.4,.4,.2]);[.36,.48,.16].forEach((x,i)=>near(q.expected[i],x));[3.6,4.8,1.6].forEach((x,i)=>near(q.expectedCounts[i],x));
 near(w.K.alleleSummary({AA:2,Aa:0,aa:0}).expected[0],1);
});
test('models reject missing, duplicate, fractional, overflowing and undefined-denominator inputs',t=>{
 const {w}=env(t);assert.equal(typeof w.K.aggregateCounts,'function');
 for(const input of [[],[cells[0],cells[0]],[{...cells[0],sample:''}],[{...cells[0],stratum:null}],[{...cells[0],counts:[1,-1]}],[{...cells[0],counts:[1,.5]}],[{...cells[0],counts:[1,NaN]}],[cells[0],,cells[2]],[{...cells[0],counts:[1]}]])assert.throws(()=>w.K.aggregateCounts(input,{genes:['G1','G2']}));
 assert.throws(()=>w.K.aggregateCounts(cells,{genes:['G','G']}));
 assert.throws(()=>w.K.aggregateCounts([{...cells[0],counts:[Number.MAX_SAFE_INTEGER,1]}],{genes:['G1','G2']}));
 for(const targetTotal of [0,-1,NaN,Infinity,'8'])assert.throws(()=>w.K.normalizeCountRows(rows,{targetTotal}));
 assert.throws(()=>w.K.normalizeCountRows([{id:'z',counts:[0,0]}],{targetTotal:8}));
 for(const input of [{AA:0,Aa:0,aa:0},{AA:1,Aa:-1,aa:2},{AA:1,Aa:.5,aa:2},{AA:1,Aa:2},{AA:1,Aa:2,aa:3,missing:1},{AA:Number.MAX_SAFE_INTEGER,Aa:0,aa:0}])assert.throws(()=>w.K.alleleSummary(input));
});
test('views validate atomically and keep identity through actual geometric operations',t=>{
 const {w,svg}=env(t);for(const name of ['countAggregation','countNormalization','alleleFrequency'])assert.equal(typeof w.K[name],'function');
 assert.throws(()=>w.K.countAggregation(svg,{cells:[],genes:['G']}));assert.equal(svg.childNodes.length,0);
 const a=w.K.countAggregation(svg,{cells,genes:['G1','G2']}),aNodes=[...a.g.querySelectorAll('[data-cell-id]')],initial=aNodes.map(n=>n.getAttribute('transform'));
 for(let i=0;i<=20;i++)a.setProgress({group:i/20,sum:0});assert.notDeepEqual(aNodes.map(n=>n.getAttribute('transform')),initial);
 a.setProgress({group:1,sum:1});assert.deepEqual([...a.g.querySelectorAll('[data-cell-id]')],aNodes);assert.deepEqual(plain(a.model.totals),[23,17]);
 const aBefore=a.g.outerHTML;assert.throws(()=>a.setProgress({group:0,sum:1}));assert.equal(a.g.outerHTML,aBefore);
 const n=w.K.countNormalization(svg,{rows,targetTotal:8,maxTotal:16}),raw=[...n.g.querySelectorAll('[data-raw-value]')],rawBefore=raw.map(e=>e.outerHTML);
 n.setState({targetTotal:16,normalize:1,log:1});assert.deepEqual(raw.map(e=>e.outerHTML),rawBefore);near(n.model().rows[0].normalized[0],4);
 const nBefore=n.g.outerHTML,nModel=n.model();for(const q of [{targetTotal:0},{targetTotal:17},{normalize:.4,log:1},{log:NaN}]){assert.throws(()=>n.setState(q));assert.equal(n.g.outerHTML,nBefore);assert.equal(n.model(),nModel);}
 const h=w.K.alleleFrequency(svg,{counts:{AA:4,Aa:4,aa:2}}),obs=[...h.g.querySelectorAll('[data-observed-genotype]')],obsBefore=obs.map(e=>e.outerHTML);
 h.setProgress({count:1,expect:1});assert.deepEqual(obs.map(e=>e.outerHTML),obsBefore);near(h.model.expected[1],.48);
 const hBefore=h.g.outerHTML;assert.throws(()=>h.setProgress({count:.5,expect:1}));assert.equal(h.g.outerHTML,hBefore);
 for(const view of [a,n,h])assert.doesNotMatch(view.g.outerHTML,/NaN|Infinity|undefined/);
});
test('normalization owns a source snapshot even when caller rows are changed or removed',t=>{
 const {w,svg}=env(t),input=[{id:'a',counts:[1,3]}],view=w.K.countNormalization(svg,{rows:input,targetTotal:8,maxTotal:16});
 input[0].counts[0]=9;view.setState({normalize:1});assert.deepEqual(plain(view.model().rows[0].normalized),[2,6]);
 input.length=0;view.setState({log:1});assert.deepEqual(plain(view.model().rows[0].raw),[1,3]);
});
test('three bilingual recipes have moving geometry, manual state and cancellable driver lifecycle',async t=>{
 const {w}=env(t),scenes=[];w.D.deck={register:s=>scenes.push(s),count:()=>3};
 const recipe=path.join(base,'js/recipes/methods-biology.js');assert.ok(fs.existsSync(recipe),'biology recipes exist');w.eval(fs.readFileSync(recipe,'utf8'));assert.equal(scenes.length,3);
 for(const [index,scene] of scenes.entries()){
  const steps=[],cleanups=[],jobs=[];w.A.run=fn=>new Promise(resolve=>jobs.push({fn,resolve}));
  const root=scene.build({index,step:fn=>steps.push(fn),onDispose:fn=>cleanups.push(fn)});w.document.body.append(root);
  assert.equal(scene.notes.length,steps.length+1);assert.ok(scene.id.startsWith('bio-'));assert.equal(w.D.i18n.notes(scene,'en').length,scene.notes.length);
  const input=root.querySelector('input[type=range]');assert.ok(input);const component=root.querySelector('[data-component]'),before=component.outerHTML;
  const pending=steps[0]();jobs[0].fn(.5);assert.notEqual(component.outerHTML,before);
  input.value=input.max;input.dispatchEvent(new w.Event('input',{bubbles:true}));const manual=component.outerHTML;jobs[0].fn(1);jobs[0].resolve();await pending;assert.equal(component.outerHTML,manual);
  w.D.i18n.setLang('en');assert.equal(root.querySelector('input[type=range]'),input);assert.equal(w.D.i18n.qa(scene)[0].q.endsWith('?'),true);
  const next=steps.at(-1)();const job=jobs.at(-1);job.fn(.3);cleanups.forEach(fn=>fn());const disposed=component.outerHTML;job.fn(1);job.resolve();await next;assert.equal(component.outerHTML,disposed);root.remove();w.D.i18n.setLang('ru');
 }
});
test('guided biology steps keep each visible slider synchronized with its displayed state',async t=>{
 const {w}=env(t),scenes=[];w.D.deck={register:s=>scenes.push(s),count:()=>3};w.eval(fs.readFileSync(path.join(base,'js/recipes/methods-biology.js'),'utf8'));
 w.A.run=async fn=>{for(let i=0;i<=20;i++)fn(i/20);};
 for(const [index,scene] of scenes.entries()){
  const steps=[],cleanup=[],root=scene.build({index,step:fn=>steps.push(fn),onDispose:fn=>cleanup.push(fn)});w.document.body.append(root);
  for(const step of steps){await step();const component=root.querySelector('[data-component]'),input=root.querySelector('input[type=range]');const value=index===0?+component.dataset.sum:index===1?+component.dataset.targetTotal:+component.dataset.count + +component.dataset.expect;near(+input.value,value);near(+root.querySelector('output').textContent,value);assert.doesNotMatch(component.outerHTML,/NaN|Infinity|undefined/);}
  cleanup.forEach(fn=>fn());root.remove();
 }
});
test('an expectation step after scrubbing backward completes counting before HWE progress',async t=>{
 const {w}=env(t),scenes=[];w.D.deck={register:s=>scenes.push(s),count:()=>3};w.eval(fs.readFileSync(path.join(base,'js/recipes/methods-biology.js'),'utf8'));
 w.A.run=async fn=>{for(let i=0;i<=20;i++)fn(i/20);};const scene=scenes.find(s=>s.id==='bio-alleles'),steps=[],cleanup=[];
 const root=scene.build({index:2,step:fn=>steps.push(fn),onDispose:fn=>cleanup.push(fn)});w.document.body.append(root);await steps[0]();const input=root.querySelector('input');input.value='.2';input.dispatchEvent(new w.Event('input',{bubbles:true}));await steps[1]();
 near(+root.querySelector('[data-component]').dataset.expect,1);cleanup.forEach(fn=>fn());
});
test('interleaved donor grouping keeps readable actor lanes throughout motion',t=>{
 const{w,svg}=env(t),input=[0,4,2,6,1,5,3,7].map(i=>cells[i]);
 const view=w.K.countAggregation(svg,{cells:input,genes:['G1','G2'],frame:{x:90,y:250,width:1100,height:270}});
 for(let i=0;i<=100;i++){
  view.setProgress({group:i/100,sum:0});
  const positions=view.actors.map(a=>a.node.getAttribute('transform').match(/translate\(([-+\d.e]+)[ ,]+([-+\d.e]+)\)/).slice(1).map(Number));
  for(let a=0;a<positions.length;a++)for(let b=a+1;b<positions.length;b++)assert.ok(Math.abs(positions[a][0]-positions[b][0])>=126||Math.abs(positions[a][1]-positions[b][1])>=54,'actor text envelopes collide at '+i+'%');
 }
 assert.equal(view.g.querySelectorAll('[data-gene-label]').length,8);
});
