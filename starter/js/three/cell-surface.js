/* Procedural lymphocyte-inspired surface and shared 3D scene renderer.
 * Requires D.dom, D.appearance, F, C; anchor definitions also need V3.MoleculeMesh.
 * Geometry is schematic and rendering is demand-driven, never a simulation.
 */
(function(global){
'use strict';
const s=D.dom.s,TAU=2*Math.PI,EXTENT=1.17,TEX_W=512,TEX_H=256;
let geometryCache=null;
const unit=v=>{const l=Math.hypot(...v)||1;return v.map(x=>x/l);};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const random=i=>{const q=Math.sin(i*127.1+311.7)*43758.5453;return q-Math.floor(q);};
const mix=(a,b,t)=>a+(b-a)*t;
function hash(x,y,z){let n=Math.imul(x,374761393)+Math.imul(y,668265263)+Math.imul(z,2147483647);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;}
function noise(x,y,z){
 const i=Math.floor(x),j=Math.floor(y),k=Math.floor(z);x-=i;y-=j;z-=k;
 x=x*x*(3-2*x);y=y*y*(3-2*y);z=z*z*(3-2*z);
 return mix(mix(mix(hash(i,j,k),hash(i+1,j,k),x),mix(hash(i,j+1,k),hash(i+1,j+1,k),x),y),mix(mix(hash(i,j,k+1),hash(i+1,j,k+1),x),mix(hash(i,j+1,k+1),hash(i+1,j+1,k+1),x),y),z);
}
function radius(n){return 1+.012*Math.sin(n[0]*8+n[2]*3)*Math.sin(n[1]*7-n[2]*4)+.005*Math.sin(n[0]*17+n[1]*11+n[2]*9);}
function height(n){return radius(n)-1+.018*(noise(n[0]*21+4,n[1]*21+8,n[2]*21)-.5)+.006*(noise(n[0]*61+9,n[1]*61,n[2]*61+2)-.5);}
function sphere(u,v){const t=v*Math.PI,p=u*TAU,st=Math.sin(t);return [st*Math.cos(p),st*Math.sin(p),Math.cos(t)];}
function model(){
 if(geometryCache)return geometryCache;
 const normalPixels=new Uint8Array(TEX_W*TEX_H*4),heights=new Float32Array(TEX_W*TEX_H);
 for(let y=0;y<TEX_H;y++)for(let x=0;x<TEX_W;x++)heights[y*TEX_W+x]=height(sphere(x/TEX_W,y/(TEX_H-1)));
 for(let y=0;y<TEX_H;y++)for(let x=0;x<TEX_W;x++){
  const u=x/TEX_W,v=y/(TEX_H-1),p=u*TAU,t=v*Math.PI,n=sphere(u,v);
  const tp=[-Math.sin(p),Math.cos(p),0],tt=[Math.cos(t)*Math.cos(p),Math.cos(t)*Math.sin(p),-Math.sin(t)];
  const hp=(heights[y*TEX_W+(x+1)%TEX_W]-heights[y*TEX_W+(x+TEX_W-1)%TEX_W])/(2*TAU/TEX_W*Math.max(.08,Math.sin(t)));
  const ht=(heights[Math.min(TEX_H-1,y+1)*TEX_W+x]-heights[Math.max(0,y-1)*TEX_W+x])/(2*Math.PI/(TEX_H-1));
  const normal=unit(n.map((q,j)=>q-hp*tp[j]-ht*tt[j])),i=(y*TEX_W+x)*4;
  for(let j=0;j<3;j++)normalPixels[i+j]=Math.round((normal[j]*.5+.5)*255);
  normalPixels[i+3]=Math.round(210+35*noise(n[0]*29+9,n[1]*29+3,n[2]*29+7));
 }
 const body={vertices:[],indices:[]},lat=48,lon=80;
 for(let y=0;y<=lat;y++)for(let x=0;x<=lon;x++){
  const n=sphere(x/lon,y/lat),r=radius(n);
  body.vertices.push(n[0]*r,n[1]*r,n[2]*r,...n,x/lon,y/lat);
 }
 for(let y=0;y<lat;y++)for(let x=0;x<lon;x++){
  const a=y*(lon+1)+x,b=a+lon+1;body.indices.push(a,b,a+1,a+1,b,b+1);
 }
 const villi={vertices:[],indices:[]},features=[],rings=5,sides=5,count=2300;
 for(let i=0;i<count;i++){
  const z=1-2*random(i+3028),phi=random(i+8932)*TAU,r=Math.sqrt(1-z*z);
  let n=[r*Math.cos(phi),r*Math.sin(phi),z];
  const t=unit(cross(Math.abs(z)>.9?[1,0,0]:[0,0,1],n)),u=cross(n,t);
  n=unit(n.map((q,j)=>q+t[j]*(random(i+78)-.5)*.026+u[j]*(random(i+974)-.5)*.026));
  const h=.026+.080*Math.pow(random(i+123),1.4),bend=(random(i+788)-.5)*.064,lean=(random(i+246)-.5)*.041;
  const width=.007+.0065*random(i+985),base=radius(n)-.003,points=[];
  for(let j=0;j<rings;j++){
   const a=j/(rings-1),tip=.9*a+.1*Math.sin(a*Math.PI),radial=base+h*tip;
   points.push(n.map((q,k)=>q*radial+t[k]*(lean*a+bend*a*a)+u[k]*bend*Math.sin(a*Math.PI/2)*.65));
  }
  const start=villi.vertices.length/8;
  for(let j=0;j<rings;j++){
   const tangent=unit(points[Math.min(rings-1,j+1)].map((q,k)=>q-points[Math.max(0,j-1)][k]));
   const side=unit(cross(tangent,t)),other=cross(tangent,side),a=j/(rings-1),w=width*(j===rings-1?.20:1-.3*a);
   for(let k=0;k<sides;k++){
    const angle=k*TAU/sides,normal=unit(side.map((q,c)=>(q*Math.cos(angle)+other[c]*Math.sin(angle))*(j===rings-1?.35:1)+tangent[c]*(j===rings-1?.85:0)));
    const pos=points[j].map((q,c)=>q+normal[c]*w);
    villi.vertices.push(...pos,...normal,0,0);
   }
  }
  for(let j=0;j<rings-1;j++)for(let k=0;k<sides;k++){
   const a=start+j*sides+k,b=start+j*sides+(k+1)%sides,c=a+sides,d=b+sides;
   villi.indices.push(a,c,b,b,c,d);
  }
  const tip=start+(rings-1)*sides;
  for(let k=1;k<sides-1;k++)villi.indices.push(tip,tip+k,tip+k+1);
  features.push({n,points,width});
 }
 for(const mesh of [body,villi]){mesh.vertices=new Float32Array(mesh.vertices);mesh.indices=new Uint16Array(mesh.indices);}
 geometryCache={body,villi,normalPixels,features};return geometryCache;
}
// Identical orthographic convention to K.project3D: screen-up and depth are
// rotations of the same object coordinates; no screen-space material texture.
function rotation(view,matrix=new Float32Array(9)){
 const a=view.yaw*Math.PI/180,b=view.pitch*Math.PI/180,ca=Math.cos(a),sa=Math.sin(a),cb=Math.cos(b),sb=Math.sin(b);
 matrix[0]=ca;matrix[1]=cb*sa;matrix[2]=sb*sa;matrix[3]=-sa;matrix[4]=cb*ca;matrix[5]=sb*ca;matrix[6]=0;matrix[7]=-sb;matrix[8]=cb;
 return matrix;
}
function transform(p,m){return [m[0]*p[0]+m[3]*p[1]+m[6]*p[2],m[1]*p[0]+m[4]*p[1]+m[7]*p[2],m[2]*p[0]+m[5]*p[1]+m[8]*p[2]];}
// Cell and environment coordinates share one projection and depth buffer.
// Offsets belong to each molecule's frame; membrane receptors stay cell-fixed.
const ZERO=new Float32Array(3);
const INTERFACE_EDGE_FADE=22; // Stage pixels; only the cropped liquid interface fades.
const ROLE_COLORS={antibody:[.88,.66,.23],protein:[.63,.43,.79],tag:[.22,.72,.65],linker:[.58,.62,.67],bead:[.83,.84,.85],droplet:[.73,.79,.84],primer:[.88,.66,.23],umi:[.63,.43,.79],rna:[.35,.67,.84],polya:[.22,.72,.65]};
const clamp=v=>Math.max(0,Math.min(1,v));
// The same continuous object-space field opens body and microvilli together.
function dissolveField(x,y,z){return .5+.25*Math.sin(x*9+y*3)*Math.sin(y*8-z*4)+.15*Math.sin(z*11+x*5)+.1*Math.sin(x*19+y*13+z*17);}
function resolvedPose(out,pose,role,space,matrix,environmentMatrix){
 const fixed=role==='protein',override=pose.parts[role];
 out.matrix=override?.hasRotation?override.rotation:(!fixed&&pose.hasRotation?pose.rotation:(!fixed&&space==='environment'?environmentMatrix:matrix));
 out.offset=override?.hasOffset?override.offset:(fixed?ZERO:pose.offset);
 out.opacity=override?.hasOpacity?override.opacity:(fixed?1:pose.opacity);
 return out;
}
function allocatePose(roles){return {offset:new Float32Array(3),opacity:1,rotation:new Float32Array(9),hasRotation:false,parts:Object.fromEntries(roles.map(role=>[role,{offset:new Float32Array(3),rotation:new Float32Array(9),opacity:1,hasOffset:false,hasRotation:false,hasOpacity:false}]))};}
function updatePose(pose,input){
 let changed=false;
 function scalar(target,key,value){if(target[key]!==value){target[key]=value;changed=true;}}
 function vector(target,source){for(let j=0;j<target.length;j++){const value=source?.[j]??0;if(target[j]!==Math.fround(value)){target[j]=value;changed=true;}}}
 vector(pose.offset,input?.offset);scalar(pose,'opacity',clamp(input?.opacity??1));
 scalar(pose,'hasRotation',!!input?.rotation);if(pose.hasRotation)vector(pose.rotation,input.rotation);
 for(const role of Object.keys(pose.parts)){
  const part=pose.parts[role],next=input?.parts?.[role];
  scalar(part,'hasOffset',!!next?.offset);if(part.hasOffset)vector(part.offset,next.offset);
  scalar(part,'hasRotation',!!next?.rotation);if(part.hasRotation)vector(part.rotation,next.rotation);
  scalar(part,'hasOpacity',next?.opacity!=null);if(part.hasOpacity)scalar(part,'opacity',clamp(next.opacity));
 }
 return changed;
}
const VERTEX=`
 precision highp float;
 attribute vec3 aPosition; attribute vec3 aNormal; attribute vec2 aUv;
 uniform mediump mat3 uRotation; uniform vec4 uProjection; uniform vec3 uOffset;
 varying mediump vec3 vNormal; varying mediump vec2 vUv; varying mediump vec3 vObject;
 void main(){vec3 p=uRotation*(aPosition+uOffset);vNormal=uRotation*aNormal;vUv=aUv;vObject=aPosition;gl_Position=vec4(p.xy*uProjection.xy+uProjection.zw,-p.z/16.0,1.0);}
`;
const FRAGMENT=`
 precision mediump float;
 uniform mat3 uRotation; uniform vec3 uColor; uniform sampler2D uTexture; uniform float uMapped; uniform float uOpacity; uniform float uDissolve; uniform float uAmbient; uniform float uMaterial; uniform float uInterfacePass; uniform vec4 uInterfaceViewport;
 varying vec3 vNormal; varying vec2 vUv; varying vec3 vObject;
 void main(){
  // A transparent water/oil interface: analytic normal shading, not refraction.
  // Front and rear shells are composited around the unchanged interior scene.
  if(uMaterial>1.5){
   vec3 n=normalize(vNormal);
   float facing=abs(n.z),rim=pow(1.-facing,2.5),edge=pow(1.-facing,10.);
   float reflection=pow(max(dot(n*uInterfacePass,normalize(vec3(-.42,.60,.78))),0.),12.);
   float front=step(0.,uInterfacePass);
   float alpha=mix(.014+.072*rim+.014*edge+.018*reflection,.028+.19*rim+.040*edge+.060*reflection,front);
   vec2 margin=min(gl_FragCoord.xy,uInterfaceViewport.xy-gl_FragCoord.xy);
   vec2 edgeFade=smoothstep(vec2(0.),uInterfaceViewport.zw,margin);
   vec3 tint=mix(uColor,vec3(.94,.97,1.),reflection*.34+edge*.06);
   gl_FragColor=vec4(tint,alpha*uOpacity*edgeFade.x*edgeFade.y);return;
  }
  if(uMaterial>.5){
   vec3 n=normalize(vNormal),light=normalize(vec3(-.48,.62,.78));
   float diffuse=max(0.,dot(n,light));
   float softSpec=pow(max(dot(n,normalize(light+vec3(0.,0.,1.))),0.),7.)*.035;
   float grain=.992+.008*sin(vObject.x*153.+vObject.z*77.)*sin(vObject.y*167.-vObject.z*91.);
   float ambient=uColor.g<.5?.35:.72;
   vec3 color=uColor*(ambient+(1.-ambient)*diffuse)*grain+vec3(softSpec);
   gl_FragColor=vec4(color,uOpacity);return;
  }
  if(uDissolve>0.0){
   float opening=.5+.25*sin(vObject.x*9.+vObject.y*3.)*sin(vObject.y*8.-vObject.z*4.)+.15*sin(vObject.z*11.+vObject.x*5.)+.1*sin(vObject.x*19.+vObject.y*13.+vObject.z*17.);
   if(opening<uDissolve)discard;
  }
  vec4 material=texture2D(uTexture,vUv);
  vec3 n=normalize(mix(vNormal,uRotation*(material.rgb*2.0-1.0),uMapped));
  vec3 light=normalize(vec3(-.48,.62,.78));
  float diffuse=max(0.0,dot(n,light));
  float rim=pow(1.0-max(n.z,0.0),3.0)*.07;
  float spec=pow(max(dot(n,normalize(light+vec3(0.,0.,1.))),0.),22.0)*.20;
  float relief=mix(1.0,.85+.17*material.a,uMapped);
  vec3 color=uColor*(uAmbient+(1.03-uAmbient)*diffuse)*relief+vec3(.78,.89,1.)*(spec+rim);
  gl_FragColor=vec4(color,uOpacity);
 }
`;
function gpu(canvas,data,molecules,viewport){
 const gl=canvas.getContext('webgl',{alpha:true,depth:true,antialias:true,premultipliedAlpha:true,preserveDrawingBuffer:false,powerPreference:'low-power'});
 if(!gl)return null;
 const buffers=[],shaders=[];let program=null,texture=null,disposed=false;
 function dispose(){if(disposed)return;disposed=true;buffers.forEach(b=>gl.deleteBuffer(b));shaders.forEach(s=>gl.deleteShader(s));if(texture)gl.deleteTexture(texture);if(program)gl.deleteProgram(program);gl.getExtension('WEBGL_lose_context')?.loseContext();}
 try{
  function shader(type,source){const o=gl.createShader(type);shaders.push(o);gl.shaderSource(o,source);gl.compileShader(o);if(!gl.getShaderParameter(o,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(o));return o;}
  program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,VERTEX));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,FRAGMENT));gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));
  const locations={};for(const name of ['uRotation','uProjection','uColor','uTexture','uMapped','uOffset','uOpacity','uDissolve','uAmbient','uMaterial','uInterfacePass','uInterfaceViewport'])locations[name]=gl.getUniformLocation(program,name);
  gl.useProgram(program);
  gl.uniform4f(locations.uInterfaceViewport,canvas.width,canvas.height,INTERFACE_EDGE_FADE*canvas.width/viewport.width,INTERFACE_EDGE_FADE*canvas.height/viewport.height);
  const attrs=['aPosition','aNormal','aUv'].map(n=>gl.getAttribLocation(program,n));
  function upload(mesh){
   const vertex=gl.createBuffer(),index=gl.createBuffer();buffers.push(vertex,index);
   gl.bindBuffer(gl.ARRAY_BUFFER,vertex);gl.bufferData(gl.ARRAY_BUFFER,mesh.vertices,gl.STATIC_DRAW);
   gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,index);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,mesh.indices,gl.STATIC_DRAW);
   return {vertex,index,count:mesh.indices.length,role:mesh.role};
  }
  const cellMeshes=data?[data.body,data.villi].map(upload):[],moleculeMeshes=molecules.map(m=>m.parts.map(upload));
  const drawRecords=moleculeMeshes.flatMap((parts,i)=>parts.map(mesh=>({mesh,i,depth:0,matrix:null,offset:null,opacity:1,cull:true,mapped:0,dissolve:0})));
  const dropletRecords=drawRecords.filter(r=>r.mesh.role==='droplet');
  const contentRecords=drawRecords.filter(r=>r.mesh.role!=='droplet');
  const cellRecords=cellMeshes.map((mesh,i)=>({mesh,depth:0,matrix:null,offset:ZERO,opacity:1,cull:false,mapped:i===0?1:0,dissolve:0})),translucent=[];
  let appliedRotation=null;
  texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,data?TEX_W:1,data?TEX_H:1,0,gl.RGBA,gl.UNSIGNED_BYTE,data?data.normalPixels:new Uint8Array([128,128,255,255]));
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.clearColor(0,0,0,0);
  function selectRotation(matrix){if(appliedRotation!==matrix){gl.uniformMatrix3fv(locations.uRotation,false,matrix);appliedRotation=matrix;}}
  function drawMesh(mesh,matrix,color,offset,opacity,mapped=0,dissolve=0,interfacePass=0){
   selectRotation(matrix);
   gl.bindBuffer(gl.ARRAY_BUFFER,mesh.vertex);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,mesh.index);
   attrs.forEach((a,j)=>{gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,j===2?2:3,gl.FLOAT,false,32,[0,12,24][j]);});
   gl.uniform3fv(locations.uColor,color);gl.uniform3fv(locations.uOffset,offset);gl.uniform1f(locations.uOpacity,opacity);gl.uniform1f(locations.uMapped,mapped);gl.uniform1f(locations.uDissolve,dissolve);
   gl.uniform1f(locations.uAmbient,mesh.role==='tag'||mesh.role==='polya'?.72:.25);
   gl.uniform1f(locations.uMaterial,mesh.role==='droplet'?2:mesh.role==='bead'?1:0);gl.uniform1f(locations.uInterfacePass,interfacePass);
   gl.drawElements(gl.TRIANGLES,mesh.count,gl.UNSIGNED_SHORT,0);
  }
  function drawInterfaces(matrix,environmentMatrix,poses,colors,front){
   if(!dropletRecords.length)return;
   gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);
   gl.enable(gl.CULL_FACE);gl.frontFace(gl.CCW);gl.cullFace(front?gl.BACK:gl.FRONT);
   for(const record of dropletRecords){
    const molecule=molecules[record.i];resolvedPose(record,poses[record.i],'droplet',molecule.space,matrix,environmentMatrix);
    if(record.opacity>0)drawMesh(record.mesh,record.matrix,colors.droplet,record.offset,record.opacity,0,0,front?1:-1);
   }
   gl.depthMask(true);gl.disable(gl.BLEND);gl.disable(gl.CULL_FACE);
  }
  return {type:'webgl',dispose,draw(matrix,environmentMatrix,color,projection,poses,colors,cellOpacity=1,cellDissolve=0){
   gl.viewport(0,0,canvas.width,canvas.height);gl.depthMask(true);gl.disable(gl.BLEND);gl.disable(gl.CULL_FACE);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(program);
   appliedRotation=null;gl.uniform4fv(locations.uProjection,projection);
   gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.uniform1i(locations.uTexture,0);
   translucent.length=0;
   drawInterfaces(matrix,environmentMatrix,poses,colors,false);
   if(cellOpacity>0&&cellDissolve<1)for(const record of cellRecords){
    record.matrix=matrix;record.opacity=cellOpacity;record.color=color;record.dissolve=cellDissolve;
    if(cellOpacity>=.999)drawMesh(record.mesh,matrix,color,ZERO,1,record.mapped,cellDissolve);else translucent.push(record);
   }
   gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);gl.frontFace(gl.CCW);
   for(const record of contentRecords){
    const molecule=molecules[record.i],pose=poses[record.i],mesh=record.mesh;
    resolvedPose(record,pose,mesh.role,molecule.space,matrix,environmentMatrix);
    record.color=colors[mesh.role]||colors.linker;
    if(record.opacity>=.999)drawMesh(mesh,record.matrix,record.color,record.offset,1);
    else if(record.opacity>0){
     const p=molecule.center,o=record.offset,r=record.matrix;
     record.depth=r[2]*(p[0]+o[0])+r[5]*(p[1]+o[1])+r[8]*(p[2]+o[2]);translucent.push(record);
    }
   }
   // Translucent meshes read the shared opaque depth without writing into it.
   // Sorting by each part's actual frame also handles released ADT molecules.
   if(translucent.length){
    gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);
    translucent.sort((a,b)=>a.depth-b.depth);
    for(const r of translucent){if(r.cull)gl.enable(gl.CULL_FACE);else gl.disable(gl.CULL_FACE);drawMesh(r.mesh,r.matrix,r.color,r.offset,r.opacity,r.mapped,r.dissolve);}
    gl.depthMask(true);gl.disable(gl.BLEND);
   }
   drawInterfaces(matrix,environmentMatrix,poses,colors,true);
   gl.disable(gl.CULL_FACE);selectRotation(matrix);gl.uniform3fv(locations.uColor,color);
  }};
 }catch(error){dispose();return null;}
}
function fallback(canvas,data,molecules,viewport){
 const ctx=canvas.getContext('2d',{alpha:true}),items=data?data.features.filter((_,i)=>i%2===0):[];
 // Reuse projected vertices and triangle records from a lazily built coarse
 // 12-domain mesh; centroid occlusion approximates the cell's detailed relief.
 function projectedPart(mesh,molecule,space,cell=false){
  const projected=new Float32Array(mesh.vertices.length/8*4),triangles=[];
  for(let i=0;i<mesh.indices.length;i+=3){
   const a=mesh.indices[i],b=mesh.indices[i+1],c=mesh.indices[i+2],v=mesh.vertices;
   triangles.push({a:a*4,b:b*4,c:c*4,projected,role:mesh.role,depth:0,shade:0,opacity:1,opening:cell?dissolveField((v[a*8]+v[b*8]+v[c*8])/3,(v[a*8+1]+v[b*8+1]+v[c*8+1])/3,(v[a*8+2]+v[b*8+2]+v[c*8+2])/3):0});
  }
  return {mesh,molecule,space,projected,triangles,cell,matrix:null,offset:null,opacity:1};
 }
 const allParts=molecules.flatMap((m,i)=>m.parts.map(mesh=>projectedPart(mesh,i,m.space)));
 const parts=allParts.filter(p=>p.mesh.role!=='droplet'),droplets=allParts.filter(p=>p.mesh.role==='droplet');
 // Mask only a reused interface layer; never erase or dim the content canvas.
 // Both backing stores and their smoothstep mask are allocated once on fallback.
 const interfaceCanvas=droplets.length?document.createElement('canvas'):null,edgeMask=droplets.length?document.createElement('canvas'):null;
 let interfaceCtx=null;
 if(interfaceCanvas){
  interfaceCanvas.width=edgeMask.width=canvas.width;interfaceCanvas.height=edgeMask.height=canvas.height;
  interfaceCtx=interfaceCanvas.getContext('2d',{alpha:true});
  const mask=edgeMask.getContext('2d',{alpha:true}),w=canvas.width,h=canvas.height,fx=INTERFACE_EDGE_FADE*w/viewport.width,fy=INTERFACE_EDGE_FADE*h/viewport.height;
  mask.fillStyle='#fff';mask.fillRect(0,0,w,h);mask.globalCompositeOperation='destination-in';
  for(const points of [[0,0,fx,0],[w,0,w-fx,0],[0,0,0,fy],[0,h,0,h-fy]]){
   const gradient=mask.createLinearGradient(...points);
   // Only alpha participates in this destination-in mask; no visible color.
   for(let i=0;i<=8;i++){const t=i/8;gradient.addColorStop(t,'rgb(100% 100% 100% / '+(t*t*(3-2*t))+')');}
   mask.fillStyle=gradient;mask.fillRect(0,0,w,h);
  }
 }
 // The fallback projects each ellipsoid's 3D extent into a conic, then shades a
 // filled rear/front volume. It does not replace the interface with a ring.
 for(const part of droplets){
  const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity],v=part.mesh.vertices;
  for(let i=0;i<v.length;i+=8)for(let j=0;j<3;j++){lo[j]=Math.min(lo[j],v[i+j]);hi[j]=Math.max(hi[j],v[i+j]);}
  part.center=lo.map((x,i)=>(x+hi[i])/2);part.radii=lo.map((x,i)=>(hi[i]-x)/2);
 }
 function drawInterfaces(matrix,environmentMatrix,poses,colors,front,projection){
  if(!interfaceCtx)return;
  let hasVisibleInterface=false;
  for(const part of droplets){
   resolvedPose(part,poses[part.molecule],'droplet',part.space,matrix,environmentMatrix);
   if(part.opacity>0)hasVisibleInterface=true;
  }
  if(!hasVisibleInterface)return;
  interfaceCtx.setTransform(1,0,0,1,0,0);interfaceCtx.clearRect(0,0,canvas.width,canvas.height);
  interfaceCtx.setTransform(canvas.width*projection[0]/2,0,0,canvas.height*projection[1]/2,canvas.width*(1+projection[2])/2,canvas.height*(1-projection[3])/2);
  for(const part of droplets){
   if(part.opacity<=0)continue;
   const m=part.matrix,r=part.radii,c=transform(part.center.map((v,i)=>v+part.offset[i]),m);
   let xx=0,xy=0,yy=0;for(let i=0;i<3;i++){const x=m[i*3]*r[i],y=m[i*3+1]*r[i];xx+=x*x;xy+=x*y;yy+=y*y;}
   const disc=Math.hypot(xx-yy,2*xy),rx=Math.sqrt(Math.max(0,(xx+yy+disc)/2)),ry=Math.sqrt(Math.max(0,(xx+yy-disc)/2)),angle=.5*Math.atan2(2*xy,xx-yy);
   if(rx<=0||ry<=0)continue;
   const rgba=(rgb,alpha)=>'rgba('+rgb.map(v=>Math.round(clamp(v)*255)).join(',')+','+alpha+')';
   interfaceCtx.save();interfaceCtx.translate(c[0],-c[1]);interfaceCtx.rotate(-angle);interfaceCtx.scale(rx,ry);interfaceCtx.globalAlpha=part.opacity;
   interfaceCtx.beginPath();interfaceCtx.arc(0,0,1,0,TAU);interfaceCtx.clip();
   const fill=interfaceCtx.createRadialGradient(0,0,0,0,0,1),tint=colors.droplet;
   for(const [at,alpha] of (front?[[0,.028],[.62,.038],[.84,.08],[.96,.19],[1,.258]]:[[0,.014],[.65,.018],[.86,.03],[.97,.065],[1,.10]]))fill.addColorStop(at,rgba(tint,alpha));
   interfaceCtx.fillStyle=fill;interfaceCtx.fillRect(-1,-1,2,2);
   if(front){const highlight=interfaceCtx.createRadialGradient(-.32,-.45,.01,-.32,-.45,.57),lit=tint.map(v=>v*.34+.66);highlight.addColorStop(0,rgba(lit,.06));highlight.addColorStop(.46,rgba(lit,.026));highlight.addColorStop(1,rgba(lit,0));interfaceCtx.fillStyle=highlight;interfaceCtx.fillRect(-1,-1,2,2);}
   interfaceCtx.restore();
  }
  interfaceCtx.save();interfaceCtx.setTransform(1,0,0,1,0,0);interfaceCtx.globalCompositeOperation='destination-in';interfaceCtx.drawImage(edgeMask,0,0);interfaceCtx.restore();
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.drawImage(interfaceCanvas,0,0);ctx.restore();
 }
 const bodyPart=data?projectedPart({...data.body,role:'cell'},-1,'cell',true):null;
 // Only triangles straddling a depth plane need new vertices. Ordinary frame
 // updates keep using the persistent projection arrays and triangle records.
 function clipDepth(p,a,b,c){
  let polygon=[Array.from(p.subarray(a,a+4)),Array.from(p.subarray(b,b+4)),Array.from(p.subarray(c,c+4))];
  for(const plane of [-16,16]){
   const output=[],inside=v=>plane<0?v[2]>=plane:v[2]<=plane;
   let previous=polygon[polygon.length-1],previousInside=inside(previous);
   for(const current of polygon){
    const currentInside=inside(current);
    if(currentInside!==previousInside){const t=(plane-previous[2])/(current[2]-previous[2]);output.push(previous.map((value,i)=>mix(value,current[i],t)));}
    if(currentInside)output.push(current);
    previous=current;previousInside=currentInside;
   }
   polygon=output;if(!polygon.length)break;
  }
  return polygon;
 }
 const light=unit([-.48,.62,.78]),visible=[];
 return {type:'canvas2d',dispose(){visible.length=0;parts.length=0;droplets.length=0;if(interfaceCanvas){interfaceCanvas.width=0;edgeMask.width=0;}},draw(matrix,environmentMatrix,color,projection,poses,colors,cellOpacity=1,cellDissolve=0){
  const scaleX=canvas.width*projection[0]/2,scaleY=canvas.height*projection[1]/2;
  const centerX=canvas.width*(1+projection[2])/2,centerY=canvas.height*(1-projection[3])/2;
  const css='rgb('+color.map(x=>Math.round(x*255)).join(',')+')';
  ctx.clearRect(0,0,canvas.width,canvas.height);ctx.save();ctx.setTransform(scaleX,0,0,scaleY,centerX,centerY);ctx.lineCap='round';
  drawInterfaces(matrix,environmentMatrix,poses,colors,false,projection);
  const features=items.map(f=>({f,p:transform(f.n,matrix)})).sort((a,b)=>a.p[2]-b.p[2]);
  function drawFeature({f,p}){
   if(cellOpacity<=0||cellDissolve>=1||dissolveField(...f.n)<cellDissolve)return;
   const points=f.points.map(q=>transform(q,matrix));ctx.beginPath();points.forEach((q,j)=>ctx[j?'lineTo':'moveTo'](q[0],-q[1]));
   ctx.lineWidth=f.width*2;ctx.strokeStyle=css;ctx.stroke();
   ctx.lineWidth=Math.max(.5/Math.max(scaleX,scaleY),f.width*.55);ctx.strokeStyle='rgba('+color.map(v=>Math.round((v*.34+.66)*255)).join(',')+','+(.17+.22*Math.max(0,p[2]))+')';ctx.stroke();
  }
  ctx.globalAlpha=cellOpacity;
  features.filter(f=>f.p[2]<0).forEach(drawFeature);
  if(cellOpacity>0&&cellDissolve===0){
   const shade=ctx.createRadialGradient(-.32,-.4,.03,0,0,1.04);
   shade.addColorStop(0,'rgb('+color.map(x=>Math.round(Math.min(1,x*.8+.23)*255)).join(',')+')');shade.addColorStop(.5,css);shade.addColorStop(1,'rgb('+color.map(x=>Math.round(x*.35*255)).join(',')+')');
   ctx.fillStyle=shade;ctx.beginPath();ctx.arc(0,0,1,0,TAU);ctx.fill();
  }
  features.filter(f=>f.p[2]>=0).forEach(drawFeature);
  ctx.globalAlpha=1;
  const palette={...colors,cell:color},shades={};for(const role of Object.keys(palette)){const bead=role==='bead',ambient=bead?(palette[role][1]<.5?.35:.72):role==='tag'||role==='polya'?.72:.25;shades[role]=Array.from({length:48},(_,i)=>'rgb('+palette[role].map(v=>Math.round(Math.min(1,v*(ambient+((bead?1:1.03)-ambient)*i/47)+(bead?.035:.10)*Math.pow(i/47,bead?7:12))*255)).join(',')+')');}
  visible.length=0;
  const minX=-centerX/scaleX,maxX=(canvas.width-centerX)/scaleX,minY=(centerY-canvas.height)/scaleY,maxY=centerY/scaleY;
  const showBody=cellOpacity>0&&cellDissolve>0&&cellDissolve<1;
  for(let partIndex=0;partIndex<parts.length+(showBody?1:0);partIndex++){
   const part=partIndex<parts.length?parts[partIndex]:bodyPart;
   if(part.cell){part.matrix=matrix;part.offset=ZERO;part.opacity=cellOpacity;}
   else resolvedPose(part,poses[part.molecule],part.mesh.role,part.space,matrix,environmentMatrix);
   const {opacity,offset}=part;
   if(opacity<=0)continue;
   const vertices=part.mesh.vertices,p=part.projected,partMatrix=part.matrix;
   for(let a=0,b=0;a<vertices.length;a+=8,b+=4){
    const x=vertices[a]+offset[0],y=vertices[a+1]+offset[1],z=vertices[a+2]+offset[2];
    p[b]=partMatrix[0]*x+partMatrix[3]*y+partMatrix[6]*z;p[b+1]=partMatrix[1]*x+partMatrix[4]*y+partMatrix[7]*z;p[b+2]=partMatrix[2]*x+partMatrix[5]*y+partMatrix[8]*z;
    const nx=vertices[a+3],ny=vertices[a+4],nz=vertices[a+5];
    p[b+3]=Math.max(0,(partMatrix[0]*nx+partMatrix[3]*ny+partMatrix[6]*nz)*light[0]+(partMatrix[1]*nx+partMatrix[4]*ny+partMatrix[7]*nz)*light[1]+(partMatrix[2]*nx+partMatrix[5]*ny+partMatrix[8]*nz)*light[2]);
   }
   for(const t of part.triangles){
    const {a,b,c}=t,cx=(p[a]+p[b]+p[c])/3,cy=(p[a+1]+p[b+1]+p[c+1])/3,cz=(p[a+2]+p[b+2]+p[c+2])/3,r2=cx*cx+cy*cy;
    if(Math.max(p[a],p[b],p[c])<minX||Math.min(p[a],p[b],p[c])>maxX||Math.max(p[a+1],p[b+1],p[c+1])<minY||Math.min(p[a+1],p[b+1],p[c+1])>maxY)continue;
    const minZ=Math.min(p[a+2],p[b+2],p[c+2]),maxZ=Math.max(p[a+2],p[b+2],p[c+2]);
    if(minZ>16||maxZ< -16)continue;
    if(!part.cell&&(p[b]-p[a])*(p[c+1]-p[a+1])-(p[b+1]-p[a+1])*(p[c]-p[a])<=0)continue;
    if(part.cell&&t.opening<cellDissolve)continue;
    // A vanished membrane no longer hides the RNA or released DNA tags.
    if(!part.cell&&cellOpacity>=.999&&cellDissolve===0&&r2<1&&cz<Math.sqrt(1-r2)-.008)continue;
    t.clipped=minZ< -16||maxZ>16?clipDepth(p,a,b,c):null;
    if(t.clipped&&t.clipped.length<3)continue;
    t.depth=t.clipped?t.clipped.reduce((sum,v)=>sum+v[2],0)/t.clipped.length:cz;
    const shade=t.clipped?t.clipped.reduce((sum,v)=>sum+v[3],0)/t.clipped.length:(p[a+3]+p[b+3]+p[c+3])/3;
    t.shade=Math.max(0,Math.min(47,Math.round(shade*47)));t.opacity=opacity;visible.push(t);
   }
  }
  visible.sort((a,b)=>a.depth-b.depth);
  for(const t of visible){
   const p=t.projected;ctx.globalAlpha=t.opacity;ctx.fillStyle=(shades[t.role]||shades.linker)[t.shade];ctx.beginPath();
   if(t.clipped){ctx.moveTo(t.clipped[0][0],-t.clipped[0][1]);for(let i=1;i<t.clipped.length;i++)ctx.lineTo(t.clipped[i][0],-t.clipped[i][1]);}
   else{ctx.moveTo(p[t.a],-p[t.a+1]);ctx.lineTo(p[t.b],-p[t.b+1]);ctx.lineTo(p[t.c],-p[t.c+1]);}
   ctx.closePath();ctx.fill();
  }
  drawInterfaces(matrix,environmentMatrix,poses,colors,true,projection);
  ctx.restore();
 }};
}
function create(parent,center,{frame,molecules:definitions=[],environmentView={yaw:0,pitch:0},includeCell=true}={}){
 const data=includeCell?model():null,g=F.group(parent);g.dataset.surface='cell';g.dataset.textureSpace='object';g.dataset.surfaceIncludesCell=String(!!includeCell);
 const matrix=new Float32Array(9),environmentMatrix=rotation({yaw:environmentView.yaw??0,pitch:environmentView.pitch??0});
 const buildMolecules=detail=>definitions.map(def=>({id:def.id,space:def.space==='environment'?'environment':'cell',center:(def.center||def.anchors?.[1]||[0,0,0]).slice(),parts:def.parts||(global.V3.MoleculeMesh.create(def.anchors,{normal:def.normal,receptor:def.receptor,detail:detail??def.detail}).parts)}));
 const molecules=buildMolecules();let fallbackMolecules=null;
 function fallbackGeometry(){
  if(!fallbackMolecules){fallbackMolecules=buildMolecules('fallback');g.dataset.moleculeFallbackTriangles=String(fallbackMolecules.reduce((n,m)=>n+m.parts.reduce((a,p)=>a+p.indices.length/3,0),0));}
  return fallbackMolecules;
 }
 const rear=F.group(g),size=center.scale*EXTENT*2;
 const viewport=frame?{x:frame.x,y:frame.y,width:frame.width,height:frame.height}:{x:center.cx-size/2,y:center.cy-size/2,width:size,height:size};
 rear.dataset.surfaceLayer='rear';
 const host=s('foreignObject',{...viewport,'pointer-events':'none'});g.append(host);
 let canvas=document.createElementNS('http://www.w3.org/1999/xhtml','canvas');
 canvas.style.cssText='width:100%;height:100%;display:block;pointer-events:none;';canvas.setAttribute('aria-hidden','true');host.append(canvas);
 // Allocate once for the entire camera viewport, including close-up inspection.
 // Zoom changes the camera, never the canvas allocation or static GPU buffers.
 const density=Math.min(2,Math.max(1.5,global.devicePixelRatio||1));
 canvas.width=Math.min(2048,Math.max(1,Math.round(viewport.width*density)));
 canvas.height=Math.min(1100,Math.max(1,Math.round(viewport.height*density)));
 let renderer=gpu(canvas,data,molecules,viewport);
 if(!renderer){const replacement=canvas.cloneNode(false);canvas.replaceWith(replacement);canvas=replacement;renderer=fallback(canvas,data,fallbackGeometry(),viewport);}
 const front=F.group(g);front.dataset.surfaceLayer='front';
 const swatches={cell:C.blue,antibody:C.gold,protein:C.purple,tag:C.teal,linker:C.grey,bead:C.grey,droplet:C.white,primer:C.gold,umi:C.purple,rna:C.blue,polya:C.teal};
 for(const role of Object.keys(swatches)){const swatch=s('path',{fill:swatches[role],d:'M0 0',display:'none'});g.append(swatch);swatches[role]=swatch;}
 g.dataset.surfaceRenderer=renderer.type;g.dataset.surfaceDetail=String(data?data.features.length:0);g.dataset.surfaceFrames='0';
 g.dataset.moleculeCount=String(molecules.length);g.dataset.moleculeTriangles=String(molecules.reduce((n,m)=>n+m.parts.reduce((a,p)=>a+p.indices.length/3,0),0));
 const environmentCount=molecules.filter(m=>m.space==='environment').length;
 g.dataset.moleculeSpace=environmentCount?'cell+environment':'cell';g.dataset.moleculeEnvironmentCount=String(environmentCount);
 let view={yaw:0,pitch:0,magnification:1,panX:0,panY:0,cellOpacity:1,cellDissolve:0},disposed=false,frames=0,color=[.35,.67,.84],colors={...ROLE_COLORS};
 const poses=molecules.map(m=>allocatePose([...new Set(m.parts.map(p=>p.role))])),projection=new Float32Array(4);
 function readColor(){
  const styles=getComputedStyle(document.documentElement),names={cell:'primary',antibody:'focus',protein:'auxiliary',tag:'secondary',linker:'muted',bead:'muted',droplet:'text',primer:'focus',umi:'auxiliary',rna:'primary',polya:'secondary'};
  for(const role of Object.keys(swatches)){
   const value=styles.getPropertyValue('--color-'+names[role]).trim();let rgb;
   if(/^#[0-9a-f]{6}$/i.test(value))rgb=[1,3,5].map(i=>parseInt(value.slice(i,i+2),16)/255);
   else{const nums=getComputedStyle(swatches[role]).fill.match(/[\d.]+/g);if(nums&&nums.length>=3)rgb=nums.slice(0,3).map(Number).map(x=>x/255);}
   if(rgb){if(role==='cell')color=rgb;else colors[role]=rgb;}
  }
  // Diagram exposure follows the background, as the molecular palette does.
  // A fixed pale bead erased pale strands in dark mode. This is illustrative
  // shading, not a claim about the optical colour of an individual resin bead.
  const neutral=D.appearance.get().background==='white'?.93:.22;
  colors.bead=[neutral*.988,neutral,neutral*1.012];
  colors.droplet=colors.droplet.map((v,i)=>v*.78+color[i]*.22);
 }
 function paint(next={},force=false){
  if(disposed)return;
  let changed=force||frames===0;
  for(const field of Object.keys(view)){const value=next[field]??view[field];if(value!==view[field]){view[field]=value;changed=true;}}
  if(next.moleculePoses)poses.forEach((pose,i)=>{if(updatePose(pose,next.moleculePoses[i]))changed=true;});
  if(!changed)return;
  const m=view.magnification;
  projection[0]=2*center.scale*m/viewport.width;
  projection[1]=2*center.scale*m/viewport.height;
  projection[2]=2*(m*center.cx+view.panX-viewport.x)/viewport.width-1;
  projection[3]=1-2*(m*center.cy+view.panY-viewport.y)/viewport.height;
  if(frames===0)readColor();renderer.draw(rotation(view,matrix),environmentMatrix,color,projection,poses,colors,includeCell?view.cellOpacity:0,view.cellDissolve);g.dataset.surfaceFrames=String(++frames);
  g.dataset.surfaceMagnification=String(m);g.dataset.cellOpacity=String(view.cellOpacity);g.dataset.cellDissolve=String(view.cellDissolve);
 }
 // Observe only root semantic palette settings for procedural meshes; no images.
 function refreshMaterial(){if(!disposed){readColor();paint(view,true);}}
 const observer=new MutationObserver(refreshMaterial);
 observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-background','data-palette','style']});
 function lost(e){e.preventDefault();if(disposed)return;canvas.removeEventListener('webglcontextlost',lost);const replacement=canvas.cloneNode(false);canvas.replaceWith(replacement);canvas=replacement;renderer.dispose();renderer=fallback(canvas,data,fallbackGeometry(),viewport);g.dataset.surfaceRenderer=renderer.type;paint(view,true);}
 canvas.addEventListener('webglcontextlost',lost);
 function dispose(){if(disposed)return;disposed=true;observer.disconnect();canvas.removeEventListener('webglcontextlost',lost);renderer.dispose();}
 return {g,rear,front,paint,dispose,probe(n){const r=radius(n),p=transform(n.map(x=>x*r),rotation(view));return {x:view.magnification*(center.cx+center.scale*p[0])+view.panX,y:view.magnification*(center.cy-center.scale*p[1])+view.panY,depth:p[2]};}};
}
(global.V3=global.V3||{}).CellSurface={create,surfaceRadius:radius};
})(window);
