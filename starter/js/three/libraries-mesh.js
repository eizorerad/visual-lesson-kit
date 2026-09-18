/* Original abstract supports and data cards for the CITE-seq lesson.
 * These stand for library membership and records, not flow cells, laboratory
 * equipment, physical containers or a simulation of molecular processing.
 * Coordinates are local and centered. The recipe owns position and opacity;
 * create() reuses the same low-poly vertex/index arrays between scene states.
 */
(function(global){
'use strict';
let cached=null;
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const dot=(a,b)=>a.reduce((sum,v,i)=>sum+v*b[i],0);
const unit=v=>{const length=Math.hypot(...v);return v.map(x=>x/length);};

// A chamfered cuboid has six broad faces, twelve bevel strips and eight
// triangular corners. Each face owns its vertices, giving exact flat normals
// and clean bevel highlights without textures or a subdivision dependency.
function box(role,size,offset=[0,0,0],bevel=.025){
 const h=size.map(v=>v/2),b=Math.min(bevel,...h.map(v=>v*.45));
 const vertices=[],indices=[];
 function face(points,normal){
  const n=unit(normal);
  if(dot(cross(sub(points[1],points[0]),sub(points[2],points[0])),n)<0)points.reverse();
  const start=vertices.length/8;
  points.forEach((p,i)=>vertices.push(...p.map((v,j)=>v+offset[j]),...n,i===1||i===2?1:0,i>=2?1:0));
  for(let i=1;i<points.length-1;i++)indices.push(start,start+i,start+i+1);
 }
 for(let axis=0;axis<3;axis++)for(const sign of [-1,1]){
  const others=[0,1,2].filter(i=>i!==axis),normal=[0,0,0];normal[axis]=sign;
  const points=[[-1,-1],[1,-1],[1,1],[-1,1]].map(signs=>{
   const p=[0,0,0];p[axis]=sign*h[axis];others.forEach((j,k)=>p[j]=signs[k]*(h[j]-b));return p;
  });
  face(points,normal);
 }
 for(let a=0;a<3;a++)for(let c=a+1;c<3;c++)for(const sa of [-1,1])for(const sc of [-1,1]){
  const along=3-a-c,normal=[0,0,0];normal[a]=sa;normal[c]=sc;
  const points=[];
  for(const [side,t] of [[0,-1],[0,1],[1,1],[1,-1]]){
   const p=[0,0,0];p[a]=sa*(h[a]-(side?b:0));p[c]=sc*(h[c]-(side?0:b));p[along]=t*(h[along]-b);points.push(p);
  }
  face(points,normal);
 }
 for(const sx of [-1,1])for(const sy of [-1,1])for(const sz of [-1,1]){
  const signs=[sx,sy,sz];
  face([0,1,2].map(axis=>h.map((v,i)=>signs[i]*(v-(i===axis?0:b)))),signs);
 }
 return {role,vertices:new Float32Array(vertices),indices:new Uint16Array(indices)};
}

function support(id,featureRole){
 // The colored back edge is the sole lip: front and both ends remain open.
 // Total extent is 7.9 × .16 × 1.7; the broad support face is at y=.066.
 // DNA can be placed above anchors.dna without hiding it behind a front wall.
 return {id,space:'environment',center:[0,0,0],kind:'abstract-library-support',
  dimensions:[7.9,.16,1.7],
  anchors:{surface:[0,.066,0],dna:[0,.28,0],label:[0,-.12,.88],rim:[0,.08,-.77],left:[-3.95,0,0],right:[3.95,0,0]},
  parts:[box('linker',[7.9,.146,1.7],[0,-.007,0],.035),box(featureRole,[7.58,.018,.12],[0,.071,-.77],.007)]};
}

function tile(id,featureRole){
 // Two small inlaid stripes identify a shared cell field and modality.
 // They are semantic marks on an abstract record card, not extra sequences.
 // The body is recessed so the complete card remains .22 deep, centered at z=0.
 return {id,space:'environment',center:[0,0,0],kind:'abstract-data-card',
  dimensions:[5.8,.72,.22],
  anchors:{label:[0,0,.125],cell:[-2.54,0,.11],feature:[2.54,0,.11],left:[-2.9,0,0],right:[2.9,0,0]},
  parts:[box('linker',[5.8,.72,.208],[0,0,-.006],.035),box('primer',[.20,.54,.016],[-2.54,0,.102],.006),box(featureRole,[.20,.54,.016],[2.54,0,.102],.006)]};
}

function marker(id,role){
 // Faceted read indicators are symbols for information moving to a record.
 // Their radius is a local drawing scale, not a molecular measurement.
 const radius=.09,top=[0,radius,0],bottom=[0,-radius,0];
 const ring=[[radius,0,0],[0,0,radius],[-radius,0,0],[0,0,-radius]],vertices=[],indices=[];
 for(let i=0;i<4;i++)for(const pole of [top,bottom]){
  const points=[pole,ring[i],ring[(i+1)%4]];
  let normal=cross(sub(points[1],points[0]),sub(points[2],points[0]));
  if(dot(normal,pole)<0){points.reverse();normal=normal.map(v=>-v);}
  normal=unit(normal);const start=vertices.length/8;
  points.forEach((p,j)=>vertices.push(...p,...normal,j===1?1:0,j===2?1:0));indices.push(start,start+1,start+2);
 }
 return {id,space:'environment',center:[0,0,0],kind:'abstract-read-marker',radius,dimensions:[radius*2,radius*2,radius*2],anchors:{label:[0,0,0]},
  parts:[{role,vertices:new Float32Array(vertices),indices:new Uint16Array(indices)}]};
}

function create(){
 if(cached)return cached;
 const libraries=[support('library-rna','rna'),support('library-adt','tag')];
 // Public ordering: RNA support, ADT support, RNA card, ADT card. Markers are
 // separate so callers can append them without changing these four indices.
 const tiles=[tile('data-rna','rna'),tile('data-adt','tag')],molecules=[...libraries,...tiles];
 const markers=[marker('read-rna','rna'),marker('read-adt','tag')],actors=[...molecules,...markers];
 const stats={molecules:molecules.length,markers:markers.length,parts:0,vertices:0,triangles:0};
 const bounds={};
 actors.forEach(m=>{
  const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
  m.parts.forEach(p=>{
   stats.parts++;stats.vertices+=p.vertices.length/8;stats.triangles+=p.indices.length/3;
   for(let i=0;i<p.vertices.length;i+=8)for(let j=0;j<3;j++){min[j]=Math.min(min[j],p.vertices[i+j]);max[j]=Math.max(max[j],p.vertices[i+j]);}
  });
  bounds[m.id]={min,max};
 });
 cached={molecules,markers,libraries,tiles,stats,bounds,anchors:Object.fromEntries(actors.map(m=>[m.id,m.anchors])),schematic:true};
 return cached;
}
(global.V3=global.V3||{}).LibrariesMesh={create};
})(window);
