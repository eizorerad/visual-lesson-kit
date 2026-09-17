/* Original 3D IgG teaching surface. Domain architecture, not atomic coordinates. */
(function(global){
'use strict';
const TAU=2*Math.PI;
const add=(a,b)=>a.map((q,i)=>q+b[i]);
const sub=(a,b)=>a.map((q,i)=>q-b[i]);
const mul=(a,k)=>a.map(q=>q*k);
const dot=(a,b)=>a.reduce((q,v,i)=>q+v*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=(a,fallback=[1,0,0])=>{const n=Math.hypot(...a);return n>1e-10?mul(a,1/n):fallback.slice();};
const mix=(a,b,t)=>a.map((q,i)=>q+(b[i]-q)*t);
const templates=new Map();

// Shared isotropic sphere topology avoids a polar fan and uneven tessellation.
// A separate closed surface is retained for every immunoglobulin domain.
function sphere(level){
 if(templates.has(level))return templates.get(level);
 const t=(1+Math.sqrt(5))/2;
 const vertices=[[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]].map(p=>unit(p));
 let faces=[[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
 for(let j=0;j<level;j++){
  const edges=new Map(),next=[];
  function middle(a,b){const key=Math.min(a,b)+':'+Math.max(a,b);if(edges.has(key))return edges.get(key);const i=vertices.length;vertices.push(unit(add(vertices[a],vertices[b])));edges.set(key,i);return i;}
  faces.forEach(([a,b,c])=>{const ab=middle(a,b),bc=middle(b,c),ca=middle(c,a);next.push([a,ab,ca],[b,bc,ab],[c,ca,bc],[ab,bc,ca]);});
  faces=next;
 }
 const mesh={vertices,faces};templates.set(level,mesh);return mesh;
}
function part(role){return {role,vertices:[],indices:[]};}
function vertex(mesh,p,uv=[0,0]){const index=mesh.vertices.length/8;mesh.vertices.push(...p,0,0,0,...uv);return index;}

// All shading normals come from the displaced geometry, including its grooves.
// No camera-space texture or painted lighting is embedded in these vertices.
function finish(mesh){
 const v=mesh.vertices,ix=mesh.indices;
 for(let i=0;i<ix.length;i+=3){
  const a=ix[i]*8,b=ix[i+1]*8,c=ix[i+2]*8;
  const n=cross([v[b]-v[a],v[b+1]-v[a+1],v[b+2]-v[a+2]],[v[c]-v[a],v[c+1]-v[a+1],v[c+2]-v[a+2]]);
  for(const p of [a,b,c])for(let k=0;k<3;k++)v[p+3+k]+=n[k];
 }
 for(let i=0;i<v.length;i+=8){const n=unit(v.slice(i+3,i+6));for(let k=0;k<3;k++)v[i+3+k]=n[k];}
 if(v.length/8>=65536)throw new RangeError('Molecule part exceeds the 16-bit index budget.');
 return {role:mesh.role,vertices:new Float32Array(v),indices:new Uint16Array(ix)};
}
function domain(mesh,{center,axis,side,depth,radii,seed,level,tipOffset=[0,0,0]}){
 const base=sphere(level),start=mesh.vertices.length/8;
 base.vertices.forEach(n=>{
  const [x,y,z]=n,phase=seed*1.732;
  // Rounded, uneven folds at several scales; these are illustrative protein
  // relief, not residues, secondary structure, or a solved molecular surface.
  const broad=.056*Math.sin(4.1*x+2.3*z+phase)*Math.cos(4.8*y-phase);
  const folds=.044*Math.sin(8.5*y+3.2*x+phase)*Math.sin(7.3*z-2.1*x-phase);
  const fine=.018*Math.sin(14*x-9*y+11*z+phase)*Math.cos(11*y+6*z-phase);
  const radial=1+broad+folds+fine;
  const axial=x+(1-x*x)*(.028*Math.sin(4*y+3*z+phase)+.014*Math.sin(9*z-4*y-phase));
  const taper=Math.pow(Math.max(0,x),3);
  const p=center.map((q,k)=>q+axis[k]*radii[0]*axial+side[k]*radii[1]*y*radial+depth[k]*radii[2]*z*radial-tipOffset[k]*taper);
  vertex(mesh,p,[.5+Math.atan2(z,y)/TAU,Math.acos(Math.max(-1,Math.min(1,x)))/Math.PI]);
 });
 base.faces.forEach(f=>mesh.indices.push(...f.map(i=>start+i)));
}
function tube(mesh,points,radius,sides,preferred){
 const start=mesh.vertices.length/8,tangents=points.map((p,i)=>unit(sub(points[Math.min(i+1,points.length-1)],points[Math.max(0,i-1)])));
 let previous=unit(cross(tangents[0],preferred));
 if(Math.abs(dot(previous,tangents[0]))>.01)previous=unit(cross(tangents[0],Math.abs(tangents[0][2])<.9?[0,0,1]:[0,1,0]));
 points.forEach((p,j)=>{
  const tangent=tangents[j];
  let u=unit(sub(previous,mul(tangent,dot(previous,tangent))));
  if(Math.abs(dot(u,tangent))>.01)u=unit(cross(tangent,Math.abs(tangent[2])<.9?[0,0,1]:[0,1,0]));
  const w=cross(tangent,u);previous=u;
  const t=j/(points.length-1),r=typeof radius==='function'?radius(t):radius;
  for(let k=0;k<sides;k++){
   const a=TAU*k/sides;vertex(mesh,p.map((q,i)=>q+r*(u[i]*Math.cos(a)+w[i]*Math.sin(a))),[k/sides,t]);
  }
 });
 for(let j=0;j<points.length-1;j++)for(let k=0;k<sides;k++){
  const a=start+j*sides+k,b=start+j*sides+(k+1)%sides,c=a+sides,d=b+sides;
  mesh.indices.push(a,b,c,b,d,c);
 }
 const first=vertex(mesh,points[0]),last=vertex(mesh,points[points.length-1]),end=start+(points.length-1)*sides;
 for(let k=0;k<sides;k++){const next=(k+1)%sides;mesh.indices.push(first,start+next,start+k,last,end+k,end+next);}
}
function bezier(a,b,c,d,t){const q=1-t;return a.map((v,i)=>q*q*q*v+3*q*q*t*b[i]+3*q*t*t*c[i]+t*t*t*d[i]);}
const samples=(count,fn)=>Array.from({length:count},(_,i)=>fn(i/(count-1)));

/**
 * Build once in object/world coordinates and share the camera with the cell.
 * anchors: [Fab tip, hinge, other Fab tip, Fc end, linker bend, barcode start,
 * barcode end, poly(A) end]; each is a finite [x,y,z] point.
 * normal is the outward membrane normal. A receptor, when requested, extends
 * inward from the first Fab tip by 0.075 world units. Every material part uses
 * interleaved position3/normal3/uv2 floats and outward CCW indexed triangles.
 * detail:'fallback' retains all 12 solid domains with coarser tessellation for
 * CPU triangle rendering; it does not change full/compact GPU geometry.
 */
function create(anchors,{normal=[0,0,1],receptor=false,detail='full'}={}){
 if(!Array.isArray(anchors)||anchors.length!==8)throw new TypeError('Molecule geometry expects eight 3D anchors.');
 if(anchors.some(p=>!p||p.length!==3||Array.from(p).some(q=>!Number.isFinite(q))))throw new TypeError('Molecule anchors must be finite 3D points.');
 if(!normal||normal.length!==3||Array.from(normal).some(q=>!Number.isFinite(q)))throw new TypeError('The membrane normal must be a finite 3D vector.');
 const fallback=detail==='fallback',compact=detail==='compact'||fallback;
 const level=fallback?1:compact?2:3,normalUnit=unit(normal,[0,0,1]);
 const tips=[anchors[0],anchors[2],anchors[3]],hinge=anchors[1],vectors=tips.map(p=>sub(p,hinge));
 const lengths=vectors.map(p=>Math.hypot(...p)),reference=Math.max(...lengths,.05);
 let depth=unit(cross(vectors[0],vectors[1]),unit(cross(normalUnit,Math.abs(normalUnit[2])<.9?[0,0,1]:[0,1,0])));
 // The handed frame is fixed at creation, so rotations reveal actual thickness.
 const antibody=part('antibody'),linker=part('linker'),tag=part('tag'),protein=part('protein');
 const sides=fallback?4:compact?6:9;
 vectors.forEach((v,b)=>{
  const length=Math.max(lengths[b],reference*.15),axis=unit(v,b===2?normalUnit:[1,0,0]);
  const side=unit(cross(depth,axis));
  const branchDepth=unit(cross(axis,side));
  for(let row=0;row<2;row++)for(let k=0;k<2;k++){
   const sign=k?1:-1,distal=row===1;
   const along=distal?.785:.385,axial=distal?.215:.215;
   const separation=length*(b===2?.09:.078)*sign;
   const raised=length*(b===2?.034:.028)*sign*(b===1?-1:1);
   const lateral=add(mul(side,separation),mul(branchDepth,raised));
   const center=add(add(hinge,mul(axis,length*along)),lateral);
   // Distal pairs curve toward their branch terminus. Fab caps meet the exact
   // binding anchor; Fc caps meet the illustrated connector attachment point.
   // Their axial extent stops at the anchor, preserving target-tip contact.
   const tipOffset=distal?lateral:[0,0,0];
   domain(antibody,{center,axis,side,depth:branchDepth,radii:[length*axial,length*(b===2?.111:.101),length*(b===2?.101:.089)],seed:b*4+row*2+k+1,level,tipOffset});
  }
  // Two short, curved heavy-chain connections retain a narrow flexible hinge.
  for(let k=0;k<2;k++){
   const sign=k?1:-1;
   const a=add(hinge,mul(branchDepth,sign*reference*.013));
   const end=add(add(hinge,mul(axis,length*.24)),add(mul(side,sign*length*.076),mul(branchDepth,sign*length*.027)));
   const c1=add(add(hinge,mul(axis,length*.065)),mul(side,sign*reference*.035));
   const c2=add(add(hinge,mul(axis,length*.16)),add(mul(side,sign*length*.072),mul(branchDepth,sign*reference*.021)));
   tube(antibody,samples(compact?8:14,t=>bezier(a,c1,c2,end,t)),reference*.014,sides,branchDepth);
  }
 });
 // Generic connector and one DNA strand are teaching symbols, not a claim
 // about conjugation chemistry, attachment residue, sequence or stoichiometry.
 tube(linker,samples(fallback?8:compact?14:28,t=>{
  const q=1-t;return anchors[3].map((v,i)=>q*q*v+2*q*t*anchors[4][i]+t*t*anchors[5][i]+depth[i]*reference*.035*Math.sin(Math.PI*t));
 }),reference*.009,fallback?4:compact?6:8,depth);
 const barcodeAxis=unit(sub(anchors[6],anchors[5])),barcodeSide=unit(cross(depth,barcodeAxis));
 tube(tag,samples(fallback?12:compact?20:42,t=>add(mix(anchors[5],anchors[6],t),add(mul(barcodeSide,reference*.024*Math.sin(TAU*t)),mul(depth,reference*.020*Math.sin(Math.PI*t)*Math.sin(TAU*t))))),reference*.020,fallback?4:compact?6:9,depth);
 const tailAxis=unit(sub(anchors[7],anchors[6])),tailSide=unit(cross(depth,tailAxis));
 tube(tag,samples(fallback?16:compact?26:52,t=>add(mix(anchors[6],anchors[7],t),add(mul(tailSide,reference*.045*Math.sin(TAU*2*t)*Math.sin(Math.PI*t)),mul(depth,reference*.03*Math.cos(TAU*2*t)*Math.sin(Math.PI*t))))),t=>reference*.009*(1-.35*t),fallback?4:compact?6:8,depth);
 if(receptor){
  const axis=mul(normalUnit,-1),side=unit(cross(depth,axis)),z=unit(cross(axis,side));
  const base=add(anchors[0],mul(axis,.075));
  tube(protein,samples(fallback?6:compact?7:12,t=>mix(anchors[0],base,t)),.005,fallback?4:compact?6:8,z);
  for(let i=0;i<3;i++){
   const center=add(anchors[0],mul(axis,.014+i*.023));
   domain(protein,{center,axis,side,depth:z,radii:[.014,.014+(i===1?.003:0),.012],seed:19+i,level:fallback?1:2});
  }
 }
 const parts=[antibody,protein,linker,tag].filter(p=>p.indices.length).map(finish);
 const bounds={min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]};
 let vertexCount=0,triangles=0;
 parts.forEach(p=>{vertexCount+=p.vertices.length/8;triangles+=p.indices.length/3;for(let i=0;i<p.vertices.length;i+=8)for(let k=0;k<3;k++){bounds.min[k]=Math.min(bounds.min[k],p.vertices[i+k]);bounds.max[k]=Math.max(bounds.max[k],p.vertices[i+k]);}});
 return {parts,domainCount:12,detail:fallback?'fallback':compact?'compact':'full',schematic:true,bounds,stats:{vertices:vertexCount,triangles}};
}
(global.V3=global.V3||{}).MoleculeMesh={create};
})(window);
