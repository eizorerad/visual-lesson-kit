/* Procedural teaching meshes: topology plus opt-in real-browser rendering QA.
 * Run browser checks with V3_BROWSER_TESTS=1 and a locally installed Playwright.
 * V3_BROWSER_CHANNEL=chrome selects an installed Chrome instead of Chromium.
 */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../starter'),scripts=['three/molecule-mesh.js','three/capture-mesh.js','three/codes-mesh.js','three/cell-surface.js'];
function meshes(){
 const scope={window:{},Float32Array,Uint16Array};
 for(const name of scripts.filter(name=>!name.endsWith('cell-surface.js'))){
  const file=path.join(root,'js',name);assert.ok(fs.existsSync(file),'Reusable V3 module exists: '+name);
  vm.runInNewContext(fs.readFileSync(file,'utf8'),scope);
 }
 assert.equal(typeof scope.window.V3?.MoleculeMesh?.create,'function');
 assert.equal(typeof scope.window.V3?.CaptureMesh?.create,'function');
 assert.equal(scope.window.CiteMoleculeMesh,undefined);return scope.window.V3;
}
const anchors=[[0,0,0],[.09,.125,0],[.24,.04,0],[.055,.295,0],[.1,.325,0],[.16,.305,0],[.26,.295,0],[.35,.305,0]];
const array=x=>Array.from(x),near=(a,b,epsilon=1e-6)=>{assert.equal(a.length,b.length);a.forEach((x,i)=>assert.ok(Math.abs(x-b[i])<epsilon,`${x} ≈ ${b[i]}`));};
function closedPart(part){
 const v=part.vertices,ix=part.indices,count=v.length/8,parents=Array.from({length:count},(_,i)=>i),edges=new Map();
 const find=i=>{while(parents[i]!==i){parents[i]=parents[parents[i]];i=parents[i];}return i;};
 assert.ok(v instanceof Float32Array);assert.ok(ix instanceof Uint16Array);
 assert.equal(v.length%8,0);assert.equal(ix.length%3,0);assert.ok(count<65536);
 assert.ok(array(v).every(Number.isFinite));
 for(let i=0;i<v.length;i+=8)assert.ok(Math.abs(Math.hypot(v[i+3],v[i+4],v[i+5])-1)<1e-6,'Unit surface normals');
 for(let i=0;i<ix.length;i+=3){
  const [a,b,c]=ix.slice(i,i+3);assert.ok(a<count&&b<count&&c<count);assert.ok(a!==b&&b!==c&&c!==a);
  const ab=[0,1,2].map(j=>v[b*8+j]-v[a*8+j]),ac=[0,1,2].map(j=>v[c*8+j]-v[a*8+j]);
  const face=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]],area=Math.hypot(...face);
  const normal=[0,1,2].map(j=>v[a*8+3+j]+v[b*8+3+j]+v[c*8+3+j]);
  assert.ok(area>1e-13,'Nondegenerate triangles');
  assert.ok(face.reduce((sum,x,j)=>sum+x*normal[j],0)/(area*Math.hypot(...normal))>.01,'Normals agree with triangle winding');
  parents[find(a)]=find(b);parents[find(b)]=find(c);
  for(const [j,k] of [[a,b],[b,c],[c,a]]){const key=Math.min(j,k)+':'+Math.max(j,k),e=edges.get(key)||[0,0];e[0]++;e[1]+=j<k?1:-1;edges.set(key,e);}
 }
 for(const e of edges.values())assert.deepEqual(e,[2,0],'Every edge joins two consistently wound triangles');
 const volumes=new Map();
 for(let i=0;i<ix.length;i+=3){
  const a=ix[i]*8,b=ix[i+1]*8,c=ix[i+2]*8,key=find(ix[i]);
  const volume=(v[a]*(v[b+1]*v[c+2]-v[b+2]*v[c+1])+v[a+1]*(v[b+2]*v[c]-v[b]*v[c+2])+v[a+2]*(v[b]*v[c+1]-v[b+1]*v[c]))/6;
  volumes.set(key,(volumes.get(key)||0)+volume);
 }
 for(const volume of volumes.values())assert.ok(volume>1e-12,'Closed components enclose positive volume');
 return volumes.size;
}
test('V3 IgG meshes retain twelve closed domains, true thickness, contact and bounded detail',()=>{
 const {MoleculeMesh}=meshes(),sizes=[];
 for(const detail of ['full','compact','fallback']){
  const mesh=MoleculeMesh.create(anchors,{normal:[0,1,0],receptor:true,detail});
  assert.equal(mesh.domainCount,12);assert.equal(mesh.schematic,true);assert.equal(mesh.parts.length,4);
  for(const part of mesh.parts){
   const components=closedPart(part);if(part.role==='antibody')assert.equal(components,18,'Twelve domains and six hinge tubes');
   const zs=array(part.vertices).filter((_,i)=>i%8===2);assert.ok(Math.max(...zs)-Math.min(...zs)>.001);
  }
  const body=mesh.parts.find(p=>p.role==='antibody').vertices;
  assert.ok(Math.min(...Array.from({length:body.length/8},(_,i)=>Math.hypot(...body.slice(i*8,i*8+3))))<1e-6,'Fab tip meets its binding anchor');
  assert.ok(mesh.stats.vertices<15000);sizes.push(mesh.stats.vertices);
 }
 assert.ok(sizes[1]<sizes[0]*.5&&sizes[2]<sizes[1]*.5);
 assert.deepEqual(MoleculeMesh.create(anchors).parts,MoleculeMesh.create(anchors).parts,'Deterministic procedural geometry');
 assert.throws(()=>MoleculeMesh.create([[1,2,3]]),/eight/i);
 assert.throws(()=>MoleculeMesh.create(anchors.map((p,i)=>i===2?[NaN,0,0]:p)),/finite/i);
});
test('V3 capture meshes are closed, use exposed primer endpoints, and enclose the bead in a droplet',()=>{
 const {CaptureMesh}=meshes(),m=CaptureMesh.create();
 assert.equal(m.schematic,true);assert.equal(m.primers.length,18);assert.equal(m.rnas.length,6);assert.equal(m.coatingCount,220);
 assert.ok(m.stats.triangles<30000);assert.equal(new Set([...m.rnaPrimerIndices,...m.adtPrimerIndices]).size,18);
 for(const d of [m.bead,...m.rnas,m.droplet])for(const part of d.parts)closedPart(part);
 for(const [i,p] of m.primers.entries()){
  assert.equal(p.id,'capture-primer-'+i);assert.equal(p.barcode,'A');
  near(p.attachment,m.center.map((v,j)=>v+p.n[j]*(CaptureMesh.surfaceRadius(p.n)-.003)),1e-10);
  near(p.polyTStart,p.attachment.map((v,j)=>v+.25*p.n[j]),1e-10);
  near(p.polyTEnd,p.polyTStart.map((v,j)=>v+.10*p.n[j]),1e-10);
 }
 for(const r of m.rnas){
  near(r.polyAEnd,[0,0,0]);near(r.threePrime,r.polyAEnd);near(r.polyAStart,[.1,0,0]);
  assert.ok(r.labelAnchor?.length===3&&array(r.labelAnchor).every(Number.isFinite),'RNA has a geometry-backed label anchor');
  assert.ok(r.labelAnchor[0]>.3,'RNA label targets its body, beyond the poly(A) tail');
  const v=r.parts.find(p=>p.role==='rna').vertices;
  assert.ok(Math.min(...Array.from({length:v.length/8},(_,i)=>Math.hypot(...r.labelAnchor.map((x,j)=>x-v[i*8+j]))))<.011,'Label anchor lies inside the actual RNA tube');
 }
 const body=m.bead.parts.find(p=>p.role==='bead').vertices;
 for(let i=0;i<body.length;i+=8){
  assert.ok(Math.abs(Math.hypot(...[0,1,2].map(j=>body[i+j]-m.center[j]))-m.radius)<.00101);
  assert.ok([0,1,2].reduce((s,j)=>s+((body[i+j]-m.droplet.center[j])/m.droplet.radii[j])**2,0)<1);
 }
 const shell=m.droplet.parts[0].vertices;
 for(let i=0;i<shell.length;i+=8){
  const xyz=[0,1,2].map(j=>shell[i+j]-m.droplet.center[j]),gradient=xyz.map((v,j)=>v/m.droplet.radii[j]**2);
  assert.ok(Math.abs(xyz.reduce((s,v,j)=>s+(v/m.droplet.radii[j])**2,0)-1)<1e-6);
  assert.ok(gradient.reduce((s,v,j)=>s+v*shell[i+3+j]/Math.hypot(...gradient),0)>.999);
 }
});
test('V3 capture placement, radius and barcode are configurable without changing primer identity',()=>{
 const {CaptureMesh}=meshes(),opts={center:[1,2,3],radius:1.2,dropletCenter:[1,2,3],dropletRadii:[3,3,3],barcode:'cell-7'},m=CaptureMesh.create(opts);
 near(m.center,opts.center);assert.equal(m.radius,1.2);near(m.droplet.center,opts.dropletCenter);near(m.droplet.radii,opts.dropletRadii);
 for(const p of m.primers){assert.equal(p.barcode,'cell-7');near(p.attachment,m.center.map((v,j)=>v+p.n[j]*(CaptureMesh.surfaceRadius(p.n,{radius:1.2})-.003)),1e-10);}
 for(const opts of [{radius:0},{radius:NaN},{center:[1,2]},{dropletRadii:[1,-1,1]},{barcode:''}])assert.throws(()=>CaptureMesh.create(opts));
});

// CodesMesh deliberately duplicates cap vertices so flat end normals do not
// affect side lighting. Weld only identical positions for the closure audit.
function closedCodesPart(part){
 const {vertices:v,indices:ix}=part,positions=new Map(),ids=[],edges=new Map();
 assert.ok(v instanceof Float32Array&&ix instanceof Uint16Array);
 assert.equal(v.length%8,0);assert.equal(ix.length%3,0);assert.ok(v.length/8<65536);
 assert.ok(array(v).every(Number.isFinite));
 for(let i=0;i<v.length;i+=8){
  assert.ok(Math.abs(Math.hypot(...v.slice(i+3,i+6))-1)<1e-6);
  const key=array(v.slice(i,i+3)).join(',');if(!positions.has(key))positions.set(key,positions.size);ids.push(positions.get(key));
 }
 let volume=0;
 for(let i=0;i<ix.length;i+=3){
  const [a,b,c]=ix.slice(i,i+3);assert.ok(a<ids.length&&b<ids.length&&c<ids.length);
  const ab=[0,1,2].map(j=>v[b*8+j]-v[a*8+j]),ac=[0,1,2].map(j=>v[c*8+j]-v[a*8+j]);
  const face=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]],area=Math.hypot(...face);
  const normal=[0,1,2].map(j=>v[a*8+3+j]+v[b*8+3+j]+v[c*8+3+j]);
  assert.ok(area>1e-12);assert.ok(face.reduce((s,x,j)=>s+x*normal[j],0)>0,'Winding agrees with side and cap normals');
  volume+=face.reduce((s,x,j)=>s+x*v[a*8+j],0)/6;
  for(const [u,w] of [[ids[a],ids[b]],[ids[b],ids[c]],[ids[c],ids[a]]]){const key=Math.min(u,w)+':'+Math.max(u,w),edge=edges.get(key)||[0,0];edge[0]++;edge[1]+=u<w?1:-1;edges.set(key,edge);}
 }
 for(const edge of edges.values())assert.deepEqual(edge,[2,0],'Position-welded tubes are closed and consistently wound');
 assert.ok(volume>0);
}
test('V3 CodesMesh default products retain closed 3D fields, stable cache, labels and anchor bounds',()=>{
 const {CodesMesh}=meshes(),m=CodesMesh.create();assert.equal(CodesMesh.create(),m);
 assert.equal(m.molecules.length,3);assert.equal(m.stats.products,3);assert.equal(m.stats.parts,12);
 let vertices=0,triangles=0;
 for(const [i,p] of m.molecules.entries()){
  assert.equal(p.space,'environment');assert.equal(p.cell,'A');
  assert.deepEqual(array(p.parts.map(p=>p.role)),['linker','primer','umi',i?'tag':'rna']);
  for(const part of p.parts){
   closedCodesPart(part);vertices+=part.vertices.length/8;triangles+=part.indices.length/3;
   const box=m.bounds[i][part.role];assert.equal(box.length,8);
   for(let j=0;j<3;j++){const lo=Math.min(...box.map(p=>p[j])),hi=Math.max(...box.map(p=>p[j]));assert.ok(hi>lo);for(let k=j;k<part.vertices.length;k+=8)assert.ok(part.vertices[k]>=lo&&part.vertices[k]<=hi);}
  }
  for(const [key,role] of [['cell','primer'],['umi','umi'],['feature',i?'tag':'rna'],['end','linker']]){
   const v=p.parts.find(p=>p.role===role).vertices,a=m.anchors[key];
   assert.ok(Math.min(...Array.from({length:v.length/8},(_,j)=>Math.hypot(...a.map((x,k)=>x-v[j*8+k]))))<.09,'Functional anchor is on its named mesh segment');
  }
 }
 assert.equal(m.stats.vertices,vertices);assert.equal(m.stats.triangles,triangles);assert.ok(vertices<25000&&triangles<40000);
 assert.equal(m.molecules[1].umi,m.molecules[2].umi);assert.equal(m.molecules[1].feature,m.molecules[2].feature);
 assert.notEqual(m.molecules[1].id,m.molecules[2].id);
 assert.deepEqual(m.molecules[1].parts,m.molecules[2].parts,'PCR-copy teaching products retain the same record fields');
});
test('V3 CodesMesh custom products preserve supplied record metadata and independent mesh ownership',()=>{
 const {CodesMesh}=meshes();assert.equal(typeof CodesMesh.product,'function');
 for(const kind of ['rna','adt']){
  const product=CodesMesh.product({id:'custom-'+kind,kind,cell:'cell-4',umi:'AAC',feature:'target-X'});
  assert.equal(product.id,'custom-'+kind);assert.equal(product.kind,kind);assert.equal(product.cell,'cell-4');assert.equal(product.umi,'AAC');assert.equal(product.feature,'target-X');assert.equal(product.schematic,true);
  assert.deepEqual(array(product.parts.map(p=>p.role)),['linker','primer','umi',kind==='rna'?'rna':'tag']);
  for(const p of product.parts)closedCodesPart(p);
  const another=CodesMesh.product({id:'second',kind,cell:'cell-9',umi:'TTG'});
  assert.ok(another.feature&&!another.feature.includes('CD4'));
  assert.deepEqual(another.parts,product.parts,'Metadata does not pretend to compute a sequence-specific molecular model');
  assert.notEqual(another.parts[0].vertices,product.parts[0].vertices);
  const defaultVertex=CodesMesh.create().molecules[0].parts[0].vertices[0];product.parts[0].vertices[0]=99;
  assert.equal(CodesMesh.create().molecules[0].parts[0].vertices[0],defaultVertex,'Custom meshes cannot mutate the cached example');
 }
 const good={id:'one',kind:'rna',cell:'A',umi:'GCT'};
 for(const bad of [{id:''},{id:5},{kind:'protein'},{kind:''},{cell:''},{cell:null},{umi:''},{feature:''}])assert.throws(()=>CodesMesh.product({...good,...bad}));
 assert.throws(()=>CodesMesh.product());
});
test('V3 CodesMesh pose keeps the product center fixed and projects rotated field anchors consistently',()=>{
 const {CodesMesh}=meshes(),center=[2,3,4],camera={cx:100,cy:200,scale:50},parts={umi:{opacity:.3}},before=JSON.stringify(parts);
 for(const [yaw,pitch] of [[0,0],[90,0],[0,90],[37,-29],[-75,50]]){
  const p=CodesMesh.pose(center,yaw,pitch,parts),r=p.rotation,origin=CodesMesh.project([0,0,0],p,camera);
  near([origin.x,origin.y,origin.depth],[200,50,4]);assert.equal(p.parts,parts);assert.equal(p.opacity,1);
  for(let i=0;i<3;i++)for(let j=0;j<3;j++)near([r.slice(i*3,i*3+3).reduce((s,x,k)=>s+x*r[j*3+k],0)],[i===j?1:0]);
  const a=CodesMesh.project([-2,.3,.1],p,camera),b=CodesMesh.project([1,-.5,.7],p,camera);
  near([Math.hypot((a.x-b.x)/50,(a.y-b.y)/50,a.depth-b.depth)],[Math.hypot(3,-.8,.6)]);
 }
 const yaw=CodesMesh.project([1,0,0],CodesMesh.pose(center,90,0),camera),pitch=CodesMesh.project([0,1,0],CodesMesh.pose(center,0,90),camera);
 near([yaw.x,yaw.y,yaw.depth],[200,0,4]);near([pitch.x,pitch.y,pitch.depth],[200,50,5]);
 assert.equal(JSON.stringify(parts),before);assert.deepEqual(center,[2,3,4]);
});

test('V3 Canvas fallback preserves viewport intersections and WebGL depth clipping', {skip:process.env.V3_BROWSER_TESTS!=='1',timeout:120000},async t=>{
 const {chromium}=require('playwright');
 const browser=await chromium.launch({headless:true,...(process.env.V3_BROWSER_CHANNEL?{channel:process.env.V3_BROWSER_CHANNEL}:{})});
 t.after(()=>browser.close());const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setContent('<!doctype html><html data-background="white"><style>:root{--color-primary:#59abd6;--color-focus:#e0a83b;--color-auxiliary:#a16ec9;--color-secondary:#38b8a6;--color-muted:#949ea8;--color-text:#ededed}</style><body><svg width="400" height="300"></svg>');
 await page.evaluate(()=>{window.C={blue:'var(--color-primary)',gold:'var(--color-focus)',purple:'var(--color-auxiliary)',teal:'var(--color-secondary)',grey:'var(--color-muted)',white:'var(--color-text)'};});
 for(const name of ['lib/dom.js','film.js','three/cell-surface.js'])await page.addScriptTag({path:path.join(root,'js',name)});
 await page.evaluate(()=>{D.appearance={get:()=>({background:'white'})};});
 async function coverage(points){
  const gpu=await page.evaluate(points=>{
   const part={role:'antibody',vertices:new Float32Array(points.flatMap(p=>[...p,0,0,1,0,0])),indices:new Uint16Array([0,1,2])};
   window.clipApi=V3.CellSurface.create(document.querySelector('svg'),{cx:200,cy:150,scale:100},{includeCell:false,frame:{x:0,y:0,width:400,height:300},molecules:[{parts:[part]}]});
   clipApi.paint();const c=clipApi.g.querySelector('canvas'),gl=c.getContext('webgl'),pixels=new Uint8Array(c.width*c.height*4);
   gl.readPixels(0,0,c.width,c.height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);let count=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]>127)count++;
   gl.getExtension('WEBGL_lose_context').loseContext();return count;
  },points);
  await page.waitForFunction(()=>clipApi.g.dataset.surfaceRenderer==='canvas2d');
  const fallback=await page.evaluate(()=>{const c=clipApi.g.querySelector('canvas'),pixels=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let count=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]>127)count++;clipApi.dispose();clipApi.g.remove();return count;});
  return {gpu,fallback};
 }
 await t.test('triangle crossing the viewport survives when its centroid is outside',async()=>{
  const result=await coverage([[1.5,-.5,0],[3.5,-.5,0],[3.5,.5,0]]);
  assert.ok(result.gpu>1000);assert.ok(Math.abs(result.fallback-result.gpu)<result.gpu*.05,JSON.stringify(result));
 });
 await t.test('near and far planes reject outside triangles and clip straddling triangles',async()=>{
  for(const depth of [-20,20]){const result=await coverage([[-.5,-.5,depth],[.5,-.5,depth],[0,.5,depth]]);assert.deepEqual(result,{gpu:0,fallback:0});}
  for(const depths of [[15,17,17],[-15,-17,-17],[-20,20,0]]){
   const result=await coverage([[-.75,-.6,depths[0]],[.75,-.6,depths[1]],[0,.6,depths[2]]]);
   assert.ok(result.gpu>1000);assert.ok(Math.abs(result.fallback-result.gpu)<result.gpu*.05,JSON.stringify({depths,...result}));
  }
 });
 assert.deepEqual(errors,[]);
});

test('V3 real WebGL, projection, pose parts, idle/disposal, theme and transparent Canvas fallback', {skip:process.env.V3_BROWSER_TESTS!=='1',timeout:120000},async t=>{
 const {chromium}=require('playwright');
 const browser=await chromium.launch({headless:true,...(process.env.V3_BROWSER_CHANNEL?{channel:process.env.V3_BROWSER_CHANNEL}:{})});
 t.after(()=>browser.close());const page=await browser.newPage({viewport:{width:800,height:600}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.setContent('<!doctype html><html data-background="white"><head><style>:root{--color-primary:#59abd6;--color-focus:#e0a83b;--color-auxiliary:#a16ec9;--color-secondary:#38b8a6;--color-muted:#949ea8;--color-text:#ededed}</style></head><body><svg width="600" height="450"></svg></body></html>');
 await page.evaluate(()=>{
  window.audit={draws:[],uploads:0,deletes:0,textureSizes:[]};const p=WebGLRenderingContext.prototype,names=new WeakMap();
  const get=p.getUniformLocation;p.getUniformLocation=function(program,name){const l=get.call(this,program,name);if(l)names.set(l,name);return l;};
  for(const method of ['uniform1f','uniform3fv','uniform4fv','uniformMatrix3fv']){const f=p[method];p[method]=function(l,...v){this.auditUniforms??={};this.auditUniforms[names.get(l)]=method==='uniform1f'?v[0]:Array.from(v.at(-1));return f.call(this,l,...v);};}
  for(const method of ['depthMask','cullFace']){const f=p[method];p[method]=function(v){this['audit'+method]=v;return f.call(this,v);};}
  const upload=p.bufferData;p.bufferData=function(...a){audit.uploads++;return upload.apply(this,a);};
  const tex=p.texImage2D;p.texImage2D=function(...a){audit.textureSizes.push([a[3],a[4]]);return tex.apply(this,a);};
  const del=p.deleteBuffer;p.deleteBuffer=function(...a){audit.deletes++;return del.apply(this,a);};
  const draw=p.drawElements;p.drawElements=function(mode,count,...a){audit.draws.push({count,...structuredClone(this.auditUniforms),depthMask:this.auditdepthMask,cull:this.auditcullFace});return draw.call(this,mode,count,...a);};
  window.C={blue:'var(--color-primary)',gold:'var(--color-focus)',purple:'var(--color-auxiliary)',teal:'var(--color-secondary)',grey:'var(--color-muted)',white:'var(--color-text)'};
 });
 for(const name of ['lib/dom.js','film.js',...scripts])await page.addScriptTag({path:path.join(root,'js',name)});
 await page.evaluate(()=>{D.appearance={get:()=>({background:document.documentElement.dataset.background})};});
 const pose=await page.evaluate(()=>{
  const svg=document.querySelector('svg');
  function part(role,count){return {role,vertices:new Float32Array([-.2,-.2,0,0,0,1,0,0,.2,-.2,0,0,0,1,0,0,0,.2,0,0,0,1,0,0]),indices:new Uint16Array(Array.from({length:count},(_,i)=>i%3))};}
  window.api=V3.CellSurface.create(svg,{cx:300,cy:225,scale:125},{includeCell:false,frame:{x:0,y:0,width:600,height:450},molecules:[{space:'environment',parts:[part('bead',3),part('primer',6)]},{parts:[part('protein',9),part('tag',12)]}]});
  const allocations={uploads:audit.uploads,texture:audit.textureSizes.at(-1),detail:api.g.dataset.surfaceDetail};
  const poses=[{offset:[.4,.5,.6],parts:{primer:{offset:[.9,.8,.7],opacity:.25,rotation:[1,0,0,0,0,1,0,-1,0]}}},{offset:[3,4,5],opacity:.8,parts:{protein:{opacity:.3}}}];
  audit.draws=[];api.paint({yaw:45,pitch:20,magnification:1.2,panX:12,panY:-8,moleculePoses:poses});const before=structuredClone(audit.draws),frames=+api.g.dataset.surfaceFrames;
  api.paint({yaw:45,pitch:20,moleculePoses:poses});const repeat=+api.g.dataset.surfaceFrames;
  audit.draws=[];api.paint({yaw:65});const after=structuredClone(audit.draws);
  const probe=api.probe([1,0,0]),n=V3.CellSurface.surfaceRadius([1,0,0]);
  return {allocations,before,after,frames,repeat,probe,n,afterUploads:audit.uploads,glError:api.g.querySelector('canvas').getContext('webgl').getError()};
 });
 assert.equal(pose.allocations.detail,'0');assert.equal(pose.allocations.uploads,8);assert.deepEqual(pose.allocations.texture,[1,1]);
 assert.equal(pose.before.length,4);const before=Object.fromEntries(pose.before.map(d=>[d.count,d])),after=Object.fromEntries(pose.after.map(d=>[d.count,d]));
 near(before[3].uRotation,[1,0,0,0,1,0,0,0,1]);near(before[6].uRotation,[1,0,0,0,0,1,0,-1,0]);
 near(before[3].uOffset,[.4,.5,.6]);near(before[6].uOffset,[.9,.8,.7]);near(before[9].uOffset,[0,0,0]);near(before[12].uOffset,[3,4,5]);
 near([before[6].uOpacity,before[9].uOpacity,before[12].uOpacity],[.25,.3,.8]);
 assert.deepEqual(after[3].uRotation,before[3].uRotation);assert.notDeepEqual(after[9].uRotation,before[9].uRotation);
 assert.ok(pose.before.every(d=>JSON.stringify(d.uProjection)===JSON.stringify(before[3].uProjection)),'All content uses one camera projection');
 near([pose.probe.x,pose.probe.y],[1.2*(300+125*pose.n*after[9].uRotation[0])+12,1.2*(225-125*pose.n*after[9].uRotation[1])-8],1e-4);
 assert.equal(pose.frames,pose.repeat);assert.equal(pose.allocations.uploads,pose.afterUploads);assert.equal(pose.glError,0);
 const idle=await page.evaluate(()=>({frames:api.g.dataset.surfaceFrames,uploads:audit.uploads}));await page.waitForTimeout(100);
 assert.deepEqual(await page.evaluate(()=>({frames:api.g.dataset.surfaceFrames,uploads:audit.uploads})),idle,'No idle draw loop');
 const disposal=await page.evaluate(()=>{api.dispose();const deletes=audit.deletes,frames=api.g.dataset.surfaceFrames;api.dispose();api.paint({yaw:10});return {deletes,again:audit.deletes,frames,after:api.g.dataset.surfaceFrames};});
 assert.equal(disposal.deletes,8);assert.equal(disposal.again,8);assert.equal(disposal.frames,disposal.after);
 const drop=await page.evaluate(()=>{
  api.g.remove();const capture=V3.CaptureMesh.create({center:[.35,0,0],radius:.42,dropletCenter:[0,0,0],dropletRadii:[1.8,1.4,1.4]});
  window.dropApi=V3.CellSurface.create(document.querySelector('svg'),{cx:300,cy:225,scale:125},{includeCell:false,frame:{x:0,y:0,width:600,height:450},molecules:[{...capture.bead,parts:capture.bead.parts.filter(p=>p.role==='bead')},capture.droplet]});
  function sample(x,y){const c=dropApi.g.querySelector('canvas'),gl=c.getContext('webgl'),p=new Uint8Array(4);gl.readPixels(Math.round((300+125*x)*c.width/600),Math.round((450-(225-125*y))*c.height/450),1,1,gl.RGBA,gl.UNSIGNED_BYTE,p);return Array.from(p);}
  audit.draws=[];dropApi.paint();return {draws:audit.draws,samples:{bead:sample(.35,0),interior:sample(-.5,0),rim:sample(-1.71,0),outside:sample(-1.9,0)},frames:dropApi.g.dataset.surfaceFrames};
 });
 assert.deepEqual(drop.draws.map(d=>d.uMaterial),[2,1,2]);assert.deepEqual(drop.draws.filter(d=>d.uMaterial===2).map(d=>[d.uInterfacePass,d.depthMask]),[[-1,false],[1,false]]);
 function translucent(samples){assert.equal(samples.bead[3],255);assert.ok(samples.interior[3]>0&&samples.interior[3]<30);assert.ok(samples.rim[3]>samples.interior[3]);assert.equal(samples.outside[3],0);}
 translucent(drop.samples);
 await page.evaluate(()=>{audit.draws=[];document.documentElement.dataset.background='black';document.documentElement.style.setProperty('--color-primary','#aa4455');});
 await page.waitForFunction(previous=>+dropApi.g.dataset.surfaceFrames>+previous,drop.frames);
 const themed=await page.evaluate(()=>audit.draws.find(d=>d.uMaterial===1).uColor);assert.ok(themed.every(x=>x<.3),'Bead exposure follows dark appearance');
 await page.evaluate(()=>dropApi.g.querySelector('canvas').getContext('webgl').getExtension('WEBGL_lose_context').loseContext());
 await page.waitForFunction(()=>dropApi.g.dataset.surfaceRenderer==='canvas2d');
 const fallback=await page.evaluate(()=>{const c=dropApi.g.querySelector('canvas'),ctx=c.getContext('2d');function sample(x,y){return Array.from(ctx.getImageData(Math.round((300+125*x)*c.width/600),Math.round((225-125*y)*c.height/450),1,1).data);}return {bead:sample(.35,0),interior:sample(-.5,0),rim:sample(-1.71,0),outside:sample(-1.9,0)};});
 translucent(fallback);
 await page.evaluate(()=>{dropApi.dispose();dropApi.g.remove();window.cellApi=V3.CellSurface.create(document.querySelector('svg'),{cx:300,cy:225,scale:125});});
 const coverage=await page.evaluate(()=>{
  function count(dissolve){cellApi.paint({cellDissolve:dissolve});const c=cellApi.g.querySelector('canvas'),gl=c.getContext('webgl'),p=new Uint8Array(c.width*c.height*4);gl.readPixels(0,0,c.width,c.height,gl.RGBA,gl.UNSIGNED_BYTE,p);let n=0;for(let i=3;i<p.length;i+=4)if(p[i])n++;return n;}
  return {detail:cellApi.g.dataset.surfaceDetail,pixels:[count(0),count(.5),count(1)]};
 });
 assert.equal(coverage.detail,'2300');assert.ok(coverage.pixels[0]>coverage.pixels[1]&&coverage.pixels[1]>0);assert.equal(coverage.pixels[2],0);
 await page.evaluate(()=>cellApi.g.querySelector('canvas').getContext('webgl').getExtension('WEBGL_lose_context').loseContext());
 await page.waitForFunction(()=>cellApi.g.dataset.surfaceRenderer==='canvas2d');
 const fallbackCoverage=await page.evaluate(()=>{function count(dissolve){cellApi.paint({cellDissolve:dissolve});const c=cellApi.g.querySelector('canvas'),p=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=3;i<p.length;i+=4)if(p[i])n++;return n;}const n=[count(0),count(.5),count(1)];cellApi.dispose();return n;});
 assert.ok(fallbackCoverage[0]>fallbackCoverage[1]&&fallbackCoverage[1]>0);assert.equal(fallbackCoverage[2],0);assert.deepEqual(errors,[]);
});
