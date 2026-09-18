'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require(process.env.JSDOM_MODULE||'jsdom');const root=path.resolve(__dirname,'../..');
const plain=x=>JSON.parse(JSON.stringify(x));const near=(a,b)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<1e-8,`${a} != ${b}`);
function setup(t){const dom=new JSDOM('<svg xmlns="http://www.w3.org/2000/svg"></svg>',{runScripts:'outside-only'}),w=dom.window;t.after(()=>w.close());
 w.C=Object.fromEntries(['blue','teal','gold','grey','white','purple'].map(k=>[k,'var(--color-'+k+')']));
 for(const file of ['lib/dom.js','film.js','layout.js','trna-data.js','trna-atoms.js','trna-world.js'])w.eval(fs.readFileSync(path.join(root,'js',file),'utf8'));
 return {w,W:w.TrnaWorld,T:w.TrnaAtoms,D:w.TRNA_DATA,svg:w.document.querySelector('svg')};}
test('76 persistent residues and 21 source pairs survive every representation and reverse camera',t=>{const {W,D,svg}=setup(t),a=W.create(svg),nodes=new Set(a.g.querySelectorAll('*'));
 assert.equal(a.nodes.length,76);assert.equal(a.segments.length,75);assert.equal(a.pairs.length,21);
 for(const s of [{},{seqZoom:.5},{seqZoom:1},{fold:.5},{fold:1,pairs:1},{fold:1,pairs:1,simple:1,landmarks:2},{fold:1,simple:1,model:.5},{fold:1,simple:1,model:1,angle:45},{fold:1,simple:1,model:1,zoomAnti:1},{fold:1,simple:1,model:1,atomicView:.5},{fold:1,simple:1,model:1,atomicView:1,atomReveal:1,detail:1,atomAngle:69},{fold:1,simple:1,model:1}]){
  const out=a.paint(s);assert.equal(out.points.length,76);assert.ok(out.points.flat().every(Number.isFinite));assert.deepEqual(new Set(a.g.querySelectorAll('*')),nodes);
  a.nodes.forEach((n,i)=>{assert.equal(n.dataset.trnaResidue,String(D.residues[i].id));assert.equal(n.dataset.trnaComponent,D.residues[i].component);});
 }
 assert.deepEqual(a.pairs.map(n=>n.dataset.trnaPair),D.stemPairs.map(p=>p.join('-')));
});
test('whole trace and atomic C4 anchors exactly share one camera throughout handoff and detail zoom',t=>{const {W,T,svg}=setup(t),a=W.create(svg);
 for(const atomicView of [0,.1,.25,.5,.75,1])for(const detail of [0,.5,1]){
  const out=a.paint({fold:1,simple:1,model:1,angle:45,atomicView,atomReveal:atomicView,atomAngle:38,detail});
  for(const r of T.data.residues){const p=out.points[r.id-1],q=out.atomView.atom(r.id,"C4'");p.forEach((n,i)=>near(n,q[i]));}
  const b=out.camera.basis;for(let i=0;i<3;i++)for(let j=0;j<3;j++)near(b[i].reduce((s,v,k)=>s+v*b[j][k],0),i===j?1:0);
  const [x,y,z]=b;near(x[0]*(y[1]*z[2]-y[2]*z[1])-x[1]*(y[0]*z[2]-y[2]*z[0])+x[2]*(y[0]*z[1]-y[1]*z[0]),1);
 }
});
test('grid preserves sequence order, labels outside clip are hidden and locator retains 76 positions',t=>{const {W,svg}=setup(t),a=W.create(svg);let out=a.paint({});
 out.points.forEach((p,i)=>{near(p[0],208+48*(i%19));near(p[1],225+82*Math.floor(i/19));});
 for(const n of a.segments)assert.equal(n.style.opacity,'0');
 out=a.paint({seqZoom:1});a.nodes.forEach((n,i)=>{const p=out.points[i];if(p[0]<60||p[0]>1220||p[1]<148||p[1]>610)assert.equal(n.style.display,'none');});
 out=a.paint({fold:1,simple:1,model:1,zoomAnti:1});assert.equal(out.locatorPoints.length,76);assert.ok(out.locatorPoints.every(p=>p[0]>=85&&p[0]<=285&&p[1]>=180&&p[1]<=350));
});
test('quaternion basis interpolation preserves rotation and exact endpoints',t=>{const {W,T}=setup(t),a=W.wholeBasis,b=T.basis;
 assert.deepEqual(plain(W.mixBasis(a,b,0)),plain(a));assert.deepEqual(plain(W.mixBasis(a,b,1)),plain(b));
 for(const u of [0,.1,.4,.7,1]){const q=W.mixBasis(a,b,u);for(let i=0;i<3;i++)for(let j=0;j<3;j++)near(q[i].reduce((s,v,k)=>s+v*q[j][k],0),i===j?1:0);}
});
