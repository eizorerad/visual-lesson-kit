/* Enlarged DNA teaching meshes. Segment positions and base rungs are
 * schematic functional fields, not a literal library sequence or atomic model.
 * Each product keeps its mesh buffers throughout all authored scene states. */
(function(global){
'use strict';
const TAU=Math.PI*2,add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]);
const mul=(a,k)=>a.map(v=>v*k),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=a=>mul(a,1/(Math.hypot(...a)||1));
let cached=null;
function tube(mesh,points,radius,sides=10){
 const start=mesh.vertices.length/8;
 let previous=[0,1,0];
 points.forEach((p,j)=>{
  const tangent=unit(sub(points[Math.min(j+1,points.length-1)],points[Math.max(0,j-1)]));
  const side=unit(sub(previous,mul(tangent,dot(previous,tangent)))),depth=cross(tangent,side);previous=side;
  for(let k=0;k<sides;k++){
   const angle=TAU*k/sides,normal=add(mul(side,Math.cos(angle)),mul(depth,Math.sin(angle)));
   mesh.vertices.push(...add(p,mul(normal,radius)),...normal,k/sides,j/(points.length-1));
  }
 });
 for(let j=0;j<points.length-1;j++)for(let k=0;k<sides;k++){
  const a=start+j*sides+k,b=start+j*sides+(k+1)%sides,c=a+sides,d=b+sides;
  mesh.indices.push(a,b,c,b,d,c);
 }
 // Separate cap normals keep the side lighting smooth at colored boundaries.
 for(const end of [0,1]){
  const j=end?points.length-1:0,normal=unit(sub(points[j],points[end?j-1:1])),center=mesh.vertices.length/8;
  mesh.vertices.push(...points[j],...normal,.5,.5);
  const rim=mesh.vertices.length/8;
  for(let k=0;k<sides;k++)mesh.vertices.push(...mesh.vertices.slice((start+j*sides+k)*8,(start+j*sides+k)*8+3),...normal,0,0);
  for(let k=0;k<sides;k++){const a=rim+k,b=rim+(k+1)%sides;mesh.indices.push(...(end?[center,a,b]:[center,b,a]));}
 }
}
function curve(t){return [-4.05+8.1*t,.12*Math.sin(TAU*t-.35),.25*Math.sin(Math.PI*t)+.08*Math.sin(TAU*t+.5)];}
function strand(t,phase=0){
 const axis=curve(t),angle=TAU*(6.4*t)+phase;
 return add(axis,[0,.13*Math.cos(angle),.13*Math.sin(angle)]);
}
function createProduct(id,feature,umi){
 const parts=Object.fromEntries(['linker','primer','umi',feature].map(role=>[role,{role,vertices:[],indices:[]}])) ;
 const segments=[[0,.045,'linker'],[.045,.255,'primer'],[.255,.285,'linker'],[.285,.465,'umi'],[.465,.495,'linker'],[.495,.955,feature],[.955,1,'linker']];
 for(const [a,b,role] of segments)for(const phase of [0,Math.PI]){
  const steps=Math.max(5,Math.ceil((b-a)*164));
  tube(parts[role],Array.from({length:steps+1},(_,j)=>strand(a+(b-a)*j/steps,phase)),role==='linker'?.046:.065);
 }
 for(let i=0;i<49;i++){
  const t=(i+.5)/49,role=segments.find(([a,b])=>t>=a&&t<=b)[2],a=strand(t),b=strand(t,Math.PI);
  tube(parts[role],[a,b],.022,7);
 }
 return {id,space:'environment',center:[0,0,0],cell:'A',umi,feature:feature==='rna'?'CD4 transcript-derived sequence':'anti-CD4 antibody barcode',parts:Object.values(parts).map(p=>({role:p.role,vertices:new Float32Array(p.vertices),indices:new Uint16Array(p.indices)}))};
}
// One reusable molecular record. Labels remain metadata: changing a barcode,
// UMI or feature does not invent a sequence-specific fold or atomic structure.
function product({id,kind,cell,umi,feature}={}){
 if(kind!=='rna'&&kind!=='adt')throw new TypeError('kind must be rna or adt.');
 if(feature===undefined)feature=kind==='rna'?'transcript-derived sequence':'antibody barcode';
 for(const [name,value] of Object.entries({id,cell,umi,feature}))if(typeof value!=='string'||!value.trim())throw new TypeError(name+' must be a nonempty string.');
 return {...createProduct(id,kind==='rna'?'rna':'tag',umi),kind,cell,feature,schematic:true};
}
function rotation(yaw,pitch){
 const a=yaw*Math.PI/180,b=pitch*Math.PI/180,ca=Math.cos(a),sa=Math.sin(a),cb=Math.cos(b),sb=Math.sin(b);
 return [ca,cb*sa,sb*sa,-sa,cb*ca,sb*ca,0,-sb,cb];
}
function pose(center,yaw,pitch,parts={}){
 const r=rotation(yaw,pitch);
 // Renderer offsets precede rotation; inverse rotation places each product at
 // its authored world-space center while it turns around its own center.
 const offset=[r[0]*center[0]+r[1]*center[1]+r[2]*center[2],r[3]*center[0]+r[4]*center[1]+r[5]*center[2],r[6]*center[0]+r[7]*center[1]+r[8]*center[2]];
 return {rotation:r,offset,opacity:1,parts};
}
function project(point,pose,camera){
 const r=pose.rotation,p=add(point,pose.offset),x=r[0]*p[0]+r[3]*p[1]+r[6]*p[2],y=r[1]*p[0]+r[4]*p[1]+r[7]*p[2],z=r[2]*p[0]+r[5]*p[1]+r[8]*p[2];
 return {x:camera.cx+camera.scale*x,y:camera.cy-camera.scale*y,depth:z};
}
function create(){
 if(cached)return cached;
 const molecules=[createProduct('rna-cd4-gct','rna','GCT'),createProduct('adt-cd4-tga','tag','TGA'),createProduct('adt-cd4-tga-pcr-copy','tag','TGA')];
 const bounds=molecules.map(m=>Object.fromEntries(m.parts.map(p=>{const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];for(let j=0;j<p.vertices.length;j+=8)for(let k=0;k<3;k++){lo[k]=Math.min(lo[k],p.vertices[j+k]);hi[k]=Math.max(hi[k],p.vertices[j+k]);}return [p.role,Array.from({length:8},(_,i)=>lo.map((v,k)=>i&(1<<k)?hi[k]:v))];})));
 const stats=molecules.reduce((s,m)=>{m.parts.forEach(p=>{s.vertices+=p.vertices.length/8;s.triangles+=p.indices.length/3;s.parts++;});return s;},{products:3,vertices:0,triangles:0,parts:0});
 cached={molecules,stats,bounds,anchors:{cell:strand(.15),umi:strand(.375),feature:strand(.725),end:strand(.99)},curve,strand};return cached;
}
global.V3=global.V3||{};
global.V3.CodesMesh={create,product,pose,project};
})(window);
