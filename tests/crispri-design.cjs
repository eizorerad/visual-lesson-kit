/* Independent analytic references and persistent SVG identity; browser layout is reviewed by the lesson. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const base=process.env.LESSON_TEST_DIR||path.join(__dirname,'../starter');
const plain=v=>JSON.parse(JSON.stringify(v));
function near(actual,expected,tolerance=1e-14){assert.ok(Number.isFinite(actual)&&Math.abs(actual-expected)<=tolerance,`${actual} != ${expected}`);}
function env(t){
 const dom=new JSDOM('<svg xmlns="http://www.w3.org/2000/svg"></svg>',{runScripts:'outside-only'}),w=dom.window;
 for(const name of ['lib/dom','lib/svg','lesson','film','layout'])w.eval(fs.readFileSync(path.join(base,'js',name+'.js'),'utf8'));
 const module=path.join(base,'js/crispri-design.js');if(fs.existsSync(module))w.eval(fs.readFileSync(module,'utf8'));
 t.after(()=>w.close());assert.equal(typeof w.PD,'object','PD must export the CRISPRi model and actors');
 return {w,PD:w.PD,svg:w.document.querySelector('svg')};
}
test('Poisson zero occupancy has undefined conditional probabilities',t=>{
 const {PD}=env(t);assert.deepEqual(plain(PD.poissonOccupancy(0)),{zero:1,one:0,multi:0,oneGivenPositive:null,multiGivenPositive:null});
});
test('Poisson analytic values distinguish all cells from positive cells',t=>{
 const {PD}=env(t),log2=PD.poissonOccupancy(Math.LN2),one=PD.poissonOccupancy(1);
 near(log2.zero,.5);near(log2.one,Math.LN2/2);near(log2.multi,(1-Math.LN2)/2);
 near(log2.oneGivenPositive,Math.LN2);near(log2.multiGivenPositive,1-Math.LN2);
 near(one.zero,.36787944117144233);near(one.one,.36787944117144233);near(one.multi,.26424111765711536);
 near(one.oneGivenPositive,.5819767068693265);near(one.multiGivenPositive,.41802329313067355);
});
test('Poisson probabilities remain normalized and stable at small and large MOI',t=>{
 const {PD}=env(t);
 for(const moi of [1e-200,1e-10,.03,.3,3,10,1e308]){
  const q=PD.poissonOccupancy(moi);near(q.zero+q.one+q.multi,1);near(q.oneGivenPositive+q.multiGivenPositive,1);
  for(const p of Object.values(q))assert.ok(p>=0&&p<=1);
 }
 const tiny=PD.poissonOccupancy(1e-10);near(tiny.multi/5e-21,1,1e-9);near(tiny.multiGivenPositive/5e-11,1,1e-9);
 near(PD.poissonOccupancy(1e-200).multiGivenPositive/5e-201,1,1e-14);
 assert.deepEqual(plain(PD.poissonOccupancy(1e308)),{zero:0,one:0,multi:1,oneGivenPositive:0,multiGivenPositive:1});
});
test('Poisson model rejects negative or nonfinite numeric inputs and coercion',t=>{
 const {PD}=env(t);for(const moi of [-1,NaN,Infinity,-Infinity,'1',null,undefined,{},[]])assert.throws(()=>PD.poissonOccupancy(moi));
});
test('cassette contains two distinct DNA units and two separate transcription arrows',t=>{
 const {PD,svg}=env(t),a=PD.cassette(svg);
 assert.equal(a.g.parentNode,svg);assert.equal(a.g.dataset.pdActor,'cassette');
 assert.equal(a.g.querySelectorAll('[data-guide-unit]').length,2);assert.equal(a.g.querySelectorAll('[data-transcription-arrow]').length,2);
 assert.equal(a.g.querySelectorAll('[data-dna-backbone]').length,2);
 assert.deepEqual([...a.g.querySelectorAll('[data-guide-label]')].map(n=>n.textContent),['A','B']);
 const nodes=[...a.g.querySelectorAll('*')],bounds=a.bounds,anchors=a.anchors;
 for(const patch of [{x:100,y:220},{width:360,guides:['C','D']},{colors:['var(--color-focus)','var(--color-secondary)']},{width:240,x:0,y:0,guides:['A','B']}])assert.equal(a.set(patch),a);
 assert.deepEqual([...a.g.querySelectorAll('*')],nodes);assert.equal(a.bounds,bounds);assert.equal(a.anchors,anchors);
 assert.deepEqual(plain(a.bounds),{x:0,y:-40,width:240,height:56});assert.equal(a.anchors.right[0],240);
});
test('virion has exactly two RNA genome strands and retains them during placement changes',t=>{
 const {PD,svg}=env(t),a=PD.virion(svg,{x:120,y:220,scale:1.5});
 assert.equal(a.g.dataset.pdActor,'virion');assert.equal(a.g.querySelectorAll('[data-rna-genome]').length,2);
 assert.equal(a.g.querySelectorAll('[data-envelope]').length,1);assert.equal(a.g.querySelectorAll('[data-guide-unit],[data-dna-backbone]').length,0);
 const nodes=[...a.g.querySelectorAll('*')];a.set({x:300,y:320,scale:.65,color:'var(--color-primary)'});a.set({x:120,y:220,scale:1.5});
 assert.deepEqual([...a.g.querySelectorAll('*')],nodes);assert.equal(a.g.getAttribute('transform'),'translate(120 220) scale(1.5)');
 assert.deepEqual(plain(a.bounds),{x:-46,y:-46,width:92,height:92});Object.values(a.anchors).forEach(p=>assert.ok(p.every(Number.isFinite)));
 assert.ok([...a.g.querySelectorAll('[stroke]')].every(n=>n.getAttribute('vector-effect')==='non-scaling-stroke'));
});
test('cassette switches between one and two guide units without replacing either node',t=>{
 const {PD,svg}=env(t),a=PD.cassette(svg,{guides:['A'],colors:['var(--color-primary)']});
 const nodes=[...a.g.querySelectorAll('*')],units=[...a.g.querySelectorAll('[data-guide-unit]')];
 assert.equal(units.length,2);assert.equal(units[0].getAttribute('display'),'inline');assert.equal(units[1].getAttribute('display'),'none');
 assert.equal(a.anchors.guide0[0],120);assert.equal(a.g.dataset.guideCount,'1');
 a.set({guides:['A','B'],colors:['var(--color-primary)','var(--color-secondary)']});
 assert.equal(units[1].getAttribute('display'),'inline');assert.equal(a.g.dataset.guideCount,'2');assert.ok(a.anchors.guide0[0]<a.anchors.guide1[0]);
 a.set({width:360,guides:['C'],colors:['var(--color-focus)']});
 assert.equal(a.anchors.guide0[0],180);assert.equal(units[1].getAttribute('display'),'none');
 assert.deepEqual([...a.g.querySelectorAll('*')],nodes);
 const before=a.g.outerHTML;for(const invalid of [{guides:[],colors:[]},{guides:['A','B','C'],colors:['a','b','c']},{guides:['A','B']},{colors:['a','b']}]){assert.throws(()=>a.set(invalid));assert.equal(a.g.outerHTML,before);}
});
test('actor options and state patches reject invalid geometry atomically',t=>{
 const {PD,svg}=env(t);
 for(const [name,invalid] of [['cassette',[{width:0},{width:100},{guides:['A']},{colors:[]},{width:Infinity}]],['virion',[{scale:0},{scale:-1},{scale:NaN},{color:''}]]]){
  for(const options of invalid){assert.throws(()=>PD[name](svg,options));assert.equal(svg.childNodes.length,0);}
  const a=PD[name](svg),before=a.g.outerHTML;
  for(const patch of [...invalid,null,[],1,{x:NaN},{y:Infinity},{unknown:1}]){assert.throws(()=>a.set(patch));assert.equal(a.g.outerHTML,before);}
  assert.doesNotMatch(a.g.outerHTML,/NaN|Infinity|undefined/);svg.removeChild(a.g);
 }
});
