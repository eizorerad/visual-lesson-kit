const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const {JSDOM} = require('jsdom');
const root = path.join(__dirname,'../starter/js');
const plain = x => JSON.parse(JSON.stringify(x));
const near = (x,y) => assert.ok(Number.isFinite(x)&&Math.abs(x-y)<1e-9,`${x} != ${y}`);
function setup(t){
 const dom=new JSDOM('<body></body>',{runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
 w.matchMedia=()=>({matches:true});
 for(const n of ['lib/dom','lib/i18n','lib/num','lib/anim','lib/plot','lib/svg','lesson','film','layout','patterns'])w.eval(fs.readFileSync(path.join(root,n+'.js'),'utf8'));
 if(fs.existsSync(path.join(root,'geometry.js')))w.eval(fs.readFileSync(path.join(root,'geometry.js'),'utf8'));
 const svg=w.D.dom.s('svg');w.document.body.append(svg);t.after(()=>w.close());return{w,svg};
}
test('circle components are signed and stay on the circle through rotation',t=>{
 const{w}=setup(t);assert.equal(typeof w.K.circleComponents,'function');
 const a=w.K.circleComponents(4*Math.PI/3);near(a.cos,-.5);near(a.sin,-Math.sqrt(3)/2);
 for(let i=0;i<=80;i++){const q=w.K.circleComponents(i*Math.PI/40);near(q.cos*q.cos+q.sin*q.sin,1);}
 assert.throws(()=>w.K.circleComponents(NaN));
});
test('orthogonal projection keeps signed scores and decomposes squared length',t=>{
 const{w}=setup(t);assert.equal(typeof w.K.projectOnto2D,'function');
 const q=w.K.projectOnto2D([-3,4],[2,0]);near(q.score,-3);assert.deepEqual(plain(q.projected),[-3,0]);assert.deepEqual(plain(q.residual),[0,4]);near(q.squaredLength,25);near(q.projectedSquared+q.residualSquared,25);
 assert.throws(()=>w.K.projectOnto2D([1,2],[0,0]));assert.throws(()=>w.K.projectOnto2D([1,,],[1,0]));
});
test('2D PCA centers, uses sample covariance, reports tied/zero variance honestly',t=>{
 const{w}=setup(t);assert.equal(typeof w.K.pca2D,'function');
 const data=[[-2,-2],[-1,-1],[1,1],[2,2]],copy=JSON.stringify(data),q=w.K.pca2D(data);
 near(q.eigenvalues[0],20/3);near(q.eigenvalues[1],0);near(Math.abs(q.axes[0][0]),Math.SQRT1_2);assert.equal(q.axisUnique,true);assert.equal(JSON.stringify(data),copy);
 const shifted=w.K.pca2D(data.map(p=>[p[0]+8,p[1]-2]));near(shifted.eigenvalues[0],q.eigenvalues[0]);assert.deepEqual(plain(shifted.mean),[8,-2]);
 const tied=w.K.pca2D([[1,0],[-1,0],[0,1],[0,-1]]);assert.equal(tied.axisUnique,false);near(tied.explainedFraction,.5);
 const zero=w.K.pca2D([[3,4],[3,4]]);assert.equal(zero.explainedFraction,null);assert.equal(zero.axisUnique,false);
 assert.throws(()=>w.K.pca2D([[1,2]]));assert.throws(()=>w.K.pca2D([[1,2],[Infinity,3]]));
});
test('linear map separates signed determinant, area and singular collapse',t=>{
 const{w}=setup(t);assert.equal(typeof w.K.linearMap2D,'function');
 const q=w.K.linearMap2D([[2,1],[0,1]]);assert.deepEqual(plain(q.square),[[0,0],[2,0],[3,1],[1,1]]);near(q.determinant,2);near(q.area,2);
 const reflection=w.K.linearMap2D([[-1,0],[0,1]]);near(reflection.determinant,-1);near(reflection.area,1);
 const collapse=w.K.linearMap2D([[1,0],[0,0]]);near(collapse.area,0);assert.equal(collapse.orientation,0);
 assert.throws(()=>w.K.linearMap2D([[1,2],[3,Infinity]]));
});
test('circle and projection views preserve nodes and reject invalid setters atomically',t=>{
 const{w,svg}=setup(t);assert.equal(typeof w.K.unitCircleView,'function');
 const circle=w.K.unitCircleView(svg,{cx:250,cy:350,radius:130,traceFrame:{x:580,y:200,width:520,height:300}}),node=circle.point;
 for(let i=0;i<=40;i++){circle.setAngle(i*Math.PI/20);assert.equal(circle.point,node);near(Math.hypot(+node.getAttribute('cx')-250,+node.getAttribute('cy')-350),130);}
 let before=circle.g.outerHTML;assert.throws(()=>circle.setAngle(9));assert.equal(circle.g.outerHTML,before);
 const records=[{id:'a',xy:[-1,-1]},{id:'b',xy:[1,1]},{id:'c',xy:[0,1]}];
 const view=w.K.projectionView(svg,{records,cx:400,cy:360,scale:70,extent:3}),points=view.points.slice();
 view.setState({angle:Math.PI/4,progress:1});assert.ok(view.points.every((p,i)=>p===points[i]));
 const snap=view.snapshot();snap.projections.forEach(p=>near(p.residual[0]*snap.axis[0]+p.residual[1]*snap.axis[1],0));
 before=view.g.outerHTML;assert.throws(()=>view.setState({angle:NaN,progress:.3}));assert.equal(view.g.outerHTML,before);assert.equal(JSON.stringify(records),'[{"id":"a","xy":[-1,-1]},{"id":"b","xy":[1,1]},{"id":"c","xy":[0,1]}]');
 const existing=svg.innerHTML;assert.throws(()=>w.K.projectionView(svg,{records:[records[0],records[0]]}));assert.equal(svg.innerHTML,existing);
});
test('linear-map animation computes current determinant rather than tweening area labels',t=>{
 const{w,svg}=setup(t);assert.equal(typeof w.K.linearMapView,'function');
 const v=w.K.linearMapView(svg,{matrix:[[-1,0],[0,1]],extent:3,scale:40}),poly=v.square;
 v.setProgress(.5);near(v.snapshot().area,0);v.setProgress(1);near(v.snapshot().determinant,-1);near(v.snapshot().area,1);assert.equal(v.square,poly);
 const before=v.g.outerHTML;assert.throws(()=>v.setMatrix([[100,0],[0,1]]));assert.equal(v.g.outerHTML,before);
 assert.throws(()=>v.setProgress(-.2));assert.equal(v.g.outerHTML,before);
});
test('large finite covariance does not overflow its leading eigenvalue',t=>{
 const{w}=setup(t),x=Math.sqrt(5e307),q=w.K.pca2D([[-x,0],[x,0]]);
 assert.ok(Number.isFinite(q.eigenvalues[0]));assert.equal(q.eigenvalues[0],q.totalVariance);near(q.explainedFraction,1);near(q.eigenvalues[1],0);
});
test('a contracting map validates the identity starting grid as well as its target',t=>{
 const{w,svg}=setup(t),before=svg.innerHTML;
 assert.throws(()=>w.K.linearMapView(svg,{matrix:[[0,0],[0,0]],extent:.5,scale:40}));assert.equal(svg.innerHTML,before);
});
test('both extremes of every view frame must remain finite before construction',t=>{
 const{w,svg}=setup(t),before=svg.innerHTML;
 assert.throws(()=>w.K.unitCircleView(svg,{cx:-1e308,cy:0,radius:1e308}));assert.equal(svg.innerHTML,before);
 assert.throws(()=>w.K.projectionView(svg,{records:[{id:'a',xy:[0,0]},{id:'b',xy:[1,1]}],cx:-1e308,scale:1e308,extent:1.5}));assert.equal(svg.innerHTML,before);
 assert.throws(()=>w.K.linearMapView(svg,{cx:-1e308,scale:1e308,extent:1.5,matrix:[[1,0],[0,1]]}));assert.equal(svg.innerHTML,before);
});
test('guided map targets remain truthful after a manual height change; projection caption follows manual direction',async t=>{
 const{w}=setup(t),scenes=[];w.D.deck={register:s=>scenes.push(s),count:()=>3};w.eval(fs.readFileSync(path.join(root,'recipes/methods-geometry.js'),'utf8'));w.A.run=async fn=>{for(let i=0;i<=12;i++)fn(i/12);};
 const map=scenes.find(s=>s.id==='geo-linear-map'),steps=[],cleanup=[],el=map.build({index:2,step:f=>steps.push(f),onDispose:f=>cleanup.push(f)});w.document.body.append(el);
 const input=el.querySelector('input');input.value='.5';input.dispatchEvent(new w.Event('input',{bubbles:true}));await steps[0]();near(+el.querySelector('[data-linear-map]').dataset.determinant,1);await steps[1]();near(+el.querySelector('[data-linear-map]').dataset.determinant,2);cleanup.forEach(f=>f());el.remove();
 const projection=scenes.find(s=>s.id==='geo-projection'),psteps=[],pc=[],p=projection.build({index:1,step:f=>psteps.push(f),onDispose:f=>pc.push(f)});w.document.body.append(p);for(const step of psteps)await step();const slider=p.querySelector('input');slider.value='-45';slider.dispatchEvent(new w.Event('input',{bubbles:true}));assert.doesNotMatch(p.querySelector('.film-caption').textContent,/Первая главная компонента сохраняет максимум/);pc.forEach(f=>f());
});
