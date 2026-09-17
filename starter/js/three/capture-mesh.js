/* Procedural teaching geometry for bead-based molecular capture.
 * The bead is a persistent solid microparticle. Counts, size and trajectories
 * are explanatory choices; these chains are not atomic or sequence models.
 */
(function(global){
'use strict';
const TAU=2*Math.PI,CENTER=[3.85,0,0],RADIUS=2.0;
const DROPLET_CENTER=[2.1,0,0],DROPLET_RADII=[4.2,3.25,4.2];
const add=(a,b)=>a.map((v,i)=>v+b[i]);
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const mul=(a,k)=>a.map(v=>v*k);
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=a=>{const l=Math.hypot(...a);return l>1e-12?mul(a,1/l):[1,0,0];};
const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
const part=role=>({role,vertices:[],indices:[]});
function vertex(p,xyz,uv=[0,0]){const i=p.vertices.length/8;p.vertices.push(...xyz,0,0,0,...uv);return i;}
function finish(p){
 const v=p.vertices,ix=p.indices;
 for(let i=0;i<ix.length;i+=3){
  const a=ix[i]*8,b=ix[i+1]*8,c=ix[i+2]*8;
  const n=cross([v[b]-v[a],v[b+1]-v[a+1],v[b+2]-v[a+2]],[v[c]-v[a],v[c+1]-v[a+1],v[c+2]-v[a+2]]);
  for(const j of [a,b,c])for(let k=0;k<3;k++)v[j+3+k]+=n[k];
 }
 for(let i=0;i<v.length;i+=8){const n=unit(v.slice(i+3,i+6));for(let k=0;k<3;k++)v[i+3+k]=n[k];}
 if(v.length/8>=65536)throw new RangeError('Capture mesh exceeds its 16-bit vertex budget.');
 return {role:p.role,vertices:new Float32Array(v),indices:new Uint16Array(ix)};
}
function sphere(level){
 const t=(1+Math.sqrt(5))/2;
 const vertices=[[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]].map(unit);
 let faces=[[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
 for(let k=0;k<level;k++){
  const edges=new Map(),next=[];
  function middle(a,b){const key=Math.min(a,b)+':'+Math.max(a,b);if(edges.has(key))return edges.get(key);const i=vertices.length;vertices.push(unit(add(vertices[a],vertices[b])));edges.set(key,i);return i;}
  faces.forEach(([a,b,c])=>{const ab=middle(a,b),bc=middle(b,c),ca=middle(c,a);next.push([a,ab,ca],[b,bc,ab],[c,ca,bc],[ab,bc,ca]);});faces=next;
 }
 return {vertices,faces};
}
// Toyopearl resin has submicron pores, not macroscopic pits or metal craters.
// Keep the silhouette effectively smooth; the material supplies subtle grain.
function surfaceRadius(n,{radius=RADIUS}={}){
 const [x,y,z]=n;
 return radius+.00065*Math.sin(7*x+2*y-3*z)*Math.cos(8*y+4*z)+.0003*Math.sin(19*x+11*y-7*z)*Math.sin(16*y-13*z+2*x);
}
function tube(p,points,radius,sides=6){
 const start=p.vertices.length/8,tangents=points.map((v,i)=>unit(sub(points[Math.min(points.length-1,i+1)],points[Math.max(0,i-1)])));
 let previous=unit(cross(tangents[0],Math.abs(tangents[0][2])<.9?[0,0,1]:[0,1,0]));
 points.forEach((v,j)=>{
  const tangent=tangents[j],side=unit(sub(previous,mul(tangent,dot(previous,tangent)))),depth=cross(tangent,side);previous=side;
  for(let k=0;k<sides;k++){const a=TAU*k/sides;vertex(p,add(v,mul(add(mul(side,Math.cos(a)),mul(depth,Math.sin(a))),radius)),[k/sides,j/(points.length-1)]);}
 });
 for(let j=0;j<points.length-1;j++)for(let k=0;k<sides;k++){const a=start+j*sides+k,b=start+j*sides+(k+1)%sides,c=a+sides,d=b+sides;p.indices.push(a,b,c,b,d,c);}
 const a=vertex(p,points[0]),b=vertex(p,points[points.length-1]),end=start+(points.length-1)*sides;
 for(let k=0;k<sides;k++){const next=(k+1)%sides;p.indices.push(a,start+next,start+k,b,end+k,end+next);}
}
function fibonacci(i,count){const y=1-2*(i+.5)/count,r=Math.sqrt(Math.max(0,1-y*y)),a=i*Math.PI*(3-Math.sqrt(5));return [r*Math.cos(a),y,r*Math.sin(a)];}
function targetNormals(){
 // The first two targets remain separated on the visible left/front face:
 // one is reserved for the RNA callout and one for the antibody DNA callout.
 const chosen=[unit([-.79,.28,.54]),unit([-.79,-.28,.54])];
 const candidates=Array.from({length:192},(_,i)=>fibonacci(i,192)).filter(n=>Math.abs(n[1])<.78&&n[0]<.38&&n[2]>-.22);
 while(chosen.length<18){
  let best=null,score=-Infinity;
  candidates.forEach(n=>{const separation=Math.min(...chosen.map(q=>1-dot(n,q)));if(separation>score){score=separation;best=n;}});
  chosen.push(best);candidates.splice(candidates.indexOf(best),1);
 }
 return chosen;
}
function stats(defs){return defs.reduce((s,d)=>{d.parts.forEach(p=>{s.vertices+=p.vertices.length/8;s.triangles+=p.indices.length/3;s.parts++;});return s;},{vertices:0,triangles:0,parts:0});}
function create({center=CENTER,radius=RADIUS,dropletCenter=DROPLET_CENTER,dropletRadii=DROPLET_RADII,barcode='A'}={}){
 const point=(p,name)=>{if(!p||p.length!==3||Array.from(p).some(v=>!Number.isFinite(v)))throw new TypeError(name+' must be a finite 3D point.');return Array.from(p);};
 const beadCenter=point(center,'center'),liquidCenter=point(dropletCenter,'dropletCenter'),liquidRadii=point(dropletRadii,'dropletRadii');
 if(!Number.isFinite(radius)||radius<=.01)throw new RangeError('radius must be greater than .01 world units.');
 if(liquidRadii.some(v=>v<=0))throw new RangeError('dropletRadii must be positive.');
 if(typeof barcode!=='string'||!barcode.trim())throw new TypeError('barcode must be a nonempty string.');
 const beadRadius=n=>surfaceRadius(n,{radius});
 const body=part('bead'),primer=part('primer'),umi=part('umi'),linker=part('linker'),base=sphere(4);
 base.vertices.forEach(n=>vertex(body,add(beadCenter,mul(n,beadRadius(n))),[.5+Math.atan2(n[2],n[0])/TAU,Math.acos(n[1])/Math.PI]));
 base.faces.forEach(f=>body.indices.push(...f));
 const normals=targetNormals(),primers=[];
 function brush(n,index){
  const side=unit(cross(n,Math.abs(n[2])<.9?[0,0,1]:[0,1,0]));
  const depth=cross(n,side);
  const attachment=add(beadCenter,mul(n,beadRadius(n)-.003));
  const breaks=[0,.065,.17,.25,.35];
  function point(d){
   const u=Math.min(1,d/.25),envelope=d<.25?Math.sin(Math.PI*u):0;
   return add(add(attachment,mul(n,d)),add(mul(side,.036*Math.sin(TAU*u)*envelope),mul(depth,.014*envelope*envelope)));
  }
  const materials=[linker,primer,umi,linker];
  for(let k=0;k<4;k++){
   const a=breaks[k],b=breaks[k+1],radius=.007*(k===1?1.23:k===2?1.08:1);
   tube(materials[k],Array.from({length:5},(_,j)=>point(a+(b-a)*j/4)),radius,7);
  }
  primers.push({id:'capture-primer-'+index,n:n.slice(),side,attachment,handleEnd:point(breaks[1]),barcodeEnd:point(breaks[2]),umiEnd:point(breaks[3]),polyTStart:point(breaks[3]),polyTEnd:point(breaks[4]),tip:point(breaks[4]),barcode,umiIndex:index});
 }
 normals.forEach((n,i)=>brush(n,i));
 // A restrained coating of short flexible strands replaces radial spikes.
 // The 18 enlarged coloured primers above explain the molecular segments;
 // this much denser muted coating only indicates functionalized resin.
 let background=0;
 for(let i=0;background<220&&i<300;i++){
  // A coprime traversal keeps a partial candidate set spread over the whole
  // sphere instead of exhausting northern latitudes first.
  const n=fibonacci((i*137)%300,300);if(normals.some(q=>dot(n,q)>.997))continue;
  const side=unit(cross(n,Math.abs(n[2])<.9?[0,0,1]:[0,1,0])),depth=cross(n,side);
  const attachment=add(beadCenter,mul(n,beadRadius(n)-.003)),length=.035+.040*(.5+.5*Math.sin(i*2.399));
  const points=Array.from({length:4},(_,j)=>{const t=j/3,curve=Math.sin(Math.PI*t);return add(add(attachment,mul(n,length*t)),add(mul(side,.013*curve),mul(depth,.006*curve*Math.sin(Math.PI*t*.5))));});
  tube(linker,points,.0025,5);background++;
 }
 const bead={id:'capture-bead',space:'environment',center:beadCenter.slice(),parts:[body,primer,umi,linker].map(finish)};
 const shell=part('droplet');
 base.vertices.forEach(n=>vertex(shell,add(liquidCenter,n.map((v,i)=>v*liquidRadii[i])),[.5+Math.atan2(n[2],n[0])/TAU,Math.acos(n[1])/Math.PI]));
 base.faces.forEach(f=>shell.indices.push(...f));
 const droplet={id:'capture-droplet',space:'environment',center:liquidCenter.slice(),radii:liquidRadii.slice(),parts:[finish(shell)]};
 const rnas=Array.from({length:6},(_,i)=>{
  const rna=part('rna'),polya=part('polya'),phase=i*.83;
  const points=Array.from({length:27},(_,j)=>{
   const t=j/26,envelope=Math.sin(Math.PI*t);
   return [.10+(.58+i*.018)*t+.018*Math.sin(4*Math.PI*t)*envelope,.095*Math.sin(2.45*Math.PI*t+phase)*envelope,.055*Math.sin(3.7*Math.PI*t+phase)*envelope];
  });
  tube(rna,points,.010,7);
  tube(polya,[[.10,0,0],[.05,0,0],[0,0,0]],.008,7);
  return {id:'capture-rna-'+i,space:'environment',center:[0,0,0],parts:[rna,polya].map(finish),threePrime:[0,0,0],polyAStart:[.10,0,0],polyAEnd:[0,0,0],labelAnchor:points[13].slice()};
 });
 return {bead,droplet,rnas,primers,center:beadCenter.slice(),radius,coatingCount:background,rnaPrimerIndices:[0,6,7,10,11,12],adtPrimerIndices:[1,2,3,4,5,8,9,13,14,15,16,17],stats:stats([bead,...rnas,droplet]),schematic:true};
}
(global.V3=global.V3||{}).CaptureMesh={create,surfaceRadius};
})(window);
