/* Reusable connected, indexed RNA schematic. API: docs/rna-pair-molecule.md
 * Promoted from the RNA prediction lesson; this file contains no atomic data.
 *
 * PM.create(svgParent, {sequence='GGACGAAACGUCC', pairs=PM.PAIRS, radius=12})
 *   returns {g, paint, nodes, links, backbone, positions, point, pairPoint,
 *            bounds, dispose, sequence, pairs}.
 *
 * paint({cx=640, cy=380, scale=1, fold=0, depth=0, yaw=0, pitch=0,
 *        pairProgress=0, focusPair=-1, support=null, variant=0,
 *        labelOpacity=1, indexOpacity=1, plateOpacity=1,
 *        highlightResidues=[], highlightColor=C.gold})
 * This is a complete synchronous paint: omitted fields use the defaults above, not
 * the previous paint. Angles are RADIANS. fold=0 is a horizontal sequence;
 * fold=1 is its hairpin. Pair arcs continuously become endpoint-attached rungs.
 * depth=1 (after fold=1) lifts the SAME bases into a coarse right-handed helix.
 * depth is multiplied by fold, so an unfolded chain remains planar. Camera
 * rotation is likewise applied only to the spatial portion. The projection is
 * orthographic. For all identities to remain readable, use yaw within +/-0.22
 * and pitch within +/-0.12; larger turns can bring different bases edge-on.
 * Base letters are 18 units and indices 12, scaled with the molecule. pairProgress may
 * be one opacity or one per supplied pair; support is an optional [0,1] array
 * controlling pair emphasis, not a calculated probability or statistical test.
 * highlightResidues is an optional array of zero-based residue indices.
 * nodes[i] exposes {g, bead, halo, base, letter, index, indexGroup}; base and
 * letter name the same SVG text actor, while sequence[i] is its base identity.
 * links[k] exposes {g,line,halo,plate}, and line is an SVG PATH, not a line.
 * focusPair is a ZERO-BASED index into pairs, or -1 for no focus. All residue
 * indices in data and API are zero-based; visible residue labels are one-based.
 * variant in [0,1] changes only unpaired loop coordinates: the paired stem and
 * pair identities remain rigid. It is a pair-compatible illustrative alternative,
 * not a second solved structure or an ensemble of predicted atomic conformers.
 *
 * positions() returns fresh [{x,y,z,r,index,base}] in original sequence order,
 * in parent SVG coordinates; +z faces the viewer. point(i) returns one record;
 * pairPoint(k,t=.5) follows the actual displayed cubic pair path (including arcs).
 * bounds() encloses displayed geometry and contracted label boxes. Call it after
 * paint. Node identities persist across paints; depth sorting only reorders them.
 * There are no timers/listeners. Call dispose() when removing a standalone
 * renderer, to unregister its text contracts (the scene may also own disposal).
 *
 * Pure factories sequenceCoordinates(sequence,pairs,options),
 * hairpinCoordinates(sequence,pairs,options), helixCoordinates(sequence,pairs,
 * {variant=0}), and coordinates(sequence,pairs,{fold,depth,variant}) all return
 * fresh [x,y,z] arrays, in sequence order, centered around the local origin.
 * Supported topology is one contiguous nested stem [a+k,b-k], with optional outer tails and >=3 loop
 * bases; any valid A/C/G/U sequence of that length may replace the teaching RNA.
 * Unsupported topology is rejected rather than silently drawn incorrectly.
 *
 * At radius=12, scale=1, cx=640, cy=380, the sampled teaching morphs and
 * modest camera turns fit conservative bounds x305..975 / y188..562,
 * including all indices and sequence arcs. Use bounds() for the current state.
 * Helical twist is an illustrative ~33 degrees per pair. Axial spacing is
 * exaggerated for readable identities; these are NOT metric A-form coordinates,
 * deposited atoms, a folding trajectory, or a physics model. Keep source-backed
 * atomic renderers and their provenance separate from this authored schematic.
 */
(function(global){
'use strict';
const SEQUENCE='GGACGAAACGUCC', PAIRS=[[0,12],[1,11],[2,10],[3,9],[4,8]];
const clamp=v=>Math.max(0,Math.min(1,v)), mix=(a,b,t)=>a+(b-a)*t;
const blend=(a,b,t)=>a.map((p,i)=>p.map((v,k)=>mix(v,b[i][k],t)));
let serial=0;
function topology(sequence=SEQUENCE,pairs=PAIRS){
 if(typeof sequence!=='string'||!sequence.length||!/^[ACGU]+$/.test(sequence))throw new TypeError('PM sequence must contain A, C, G, U');
 if(!Array.isArray(pairs)||!pairs.length)throw new TypeError('PM needs a nonempty nested pair list');
 const seen=new Set(),n=sequence.length;
 const outer=pairs[0];if(!Array.isArray(outer)||outer.length!==2)throw new RangeError('PM needs index pair records');
 const start=outer[0],end=outer[1],m=pairs.length;
 for(let k=0;k<m;k++){
  const p=pairs[k];
  if(!Array.isArray(p)||p.length!==2||!p.every(Number.isInteger)||p[0]!==start+k||p[1]!==end-k||p[0]<0||p[1]>=n||p[0]>=p[1]||seen.has(p[0])||seen.has(p[1]))throw new RangeError('PM supports one nested contiguous stem, one partner per base, pairs ordered outermost first');
  seen.add(p[0]);seen.add(p[1]);
 }
 const loop=end-start+1-2*m;
 if(loop<3)throw new RangeError('PM hairpin needs at least three unpaired loop bases');
 return {n,m,loop,start,end,loopStart:start+m,loopEnd:end-m};
}
function sequenceCoordinates(sequence=SEQUENCE,pairs=PAIRS,options={}){
 const {n}=topology(sequence,pairs),step=options.step??50;
 if(!Number.isFinite(step)||step<=0)throw new RangeError('PM sequence step must be positive');
 return Array.from({length:n},(_,i)=>[(i-(n-1)/2)*step,0,0]);
}
function hairpinCoordinates(sequence=SEQUENCE,pairs=PAIRS){
 const {n,m,loop,start,end,loopStart}=topology(sequence,pairs),points=Array(n),top=52-(m-1)*22,bottom=52+(m-1)*22;
 for(let k=0;k<m;k++){
  const y=bottom-k*44;
  points[start+k]=[-66,y,0];points[end-k]=[66,y,0];
 }
 for(let u=0;u<loop;u++){
  const angle=Math.PI-(u+1)*Math.PI/(loop+1);
  points[loopStart+u]=[66*Math.cos(angle),top-105*Math.sin(angle),0];
 }
 for(let i=0;i<start;i++){const t=start-i;points[i]=[-66-19*t,bottom+35*t,0];}
 for(let i=end+1;i<n;i++){const t=i-end;points[i]=[66+19*t,bottom+35*t,0];}
 return points;
}
function helixCoordinates(sequence=SEQUENCE,pairs=PAIRS,options={}){
 const {n,m,loop,start,end,loopStart}=topology(sequence,pairs),points=Array(n),variant=clamp(options.variant??0),twist=33*Math.PI/180;
 for(let k=0;k<m;k++){
  const angle=(k-(m-1)/2)*twist,x=70*Math.cos(angle),z=70*Math.sin(angle),y=52+(m-1)*22-k*44;
  // Physical XYZ is [x, -screenY, z]. These opposite z signs give a
  // right-handed helix about the upward axis (positive discrete torsion).
  points[start+k]=[-x,y-x*.12,z];points[end-k]=[x,y+x*.12,-z];
 }
 const a=points[loopStart-1],b=points[loopStart+loop];
 for(let u=0;u<loop;u++){
  const t=(u+1)/(loop+1),h=Math.sin(Math.PI*t);
  // The loop alone changes. Its endpoints are the same terminal stem bases.
  // A modest lateral bow leaves the unpaired beads readable in oblique views.
  // It vanishes at the two fixed terminal stem endpoints.
  points[loopStart+u]=[mix(a[0],b[0],t)+80*h*(2*t-1)+variant*38*h,
   mix(a[1],b[1],t)-112*h+variant*12*h*Math.cos(Math.PI*t),
   mix(a[2],b[2],t)-32*h+variant*76*h];
 }
 for(let i=0;i<start;i++){const t=start-i,p=points[start];points[i]=[p[0]-19*t,p[1]+35*t,p[2]];}
 for(let i=end+1;i<n;i++){const t=i-end,p=points[end];points[i]=[p[0]+19*t,p[1]+35*t,p[2]];}
 return points;
}
function coordinates(sequence=SEQUENCE,pairs=PAIRS,options={}){
 const f=clamp(options.fold??0),d=clamp(options.depth??0);
 const flat=sequenceCoordinates(sequence,pairs),folded=hairpinCoordinates(sequence,pairs),helix=helixCoordinates(sequence,pairs,options);
 return blend(flat,blend(folded,helix,d),f);
}
function create(parent,options={}){
 const sequence=options.sequence??SEQUENCE,pairs=(options.pairs??PAIRS).map(p=>p.slice()),radius=options.radius??12;
 topology(sequence,pairs);
 if(!parent||typeof parent.appendChild!=='function')throw new TypeError('PM.create needs an SVG parent');
 if(!Number.isFinite(radius)||radius<=0)throw new RangeError('PM radius must be positive');
 if(!global.L||!global.C)throw new Error('PM renderer requires L text contracts and live C palette');
 const C=global.C,SVG='http://www.w3.org/2000/svg',id='prediction-molecule-'+(++serial),unregister=[];
 function el(tag,attrs={},p=parent){const n=document.createElementNS(SVG,tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));p.appendChild(n);return n;}
 const g=el('g',{'data-prediction-molecule':id,'data-sequence':sequence,'data-pairs':JSON.stringify(pairs),'data-representation':'indexed RNA schematic'});
 const defs=el('defs',{},g),mask=el('mask',{id:id+'-clear-bases',maskUnits:'userSpaceOnUse',x:-1500,y:-1000,width:4300,height:2800},defs);
 const maskBackground=el('rect',{x:-1500,y:-1000,width:4300,height:2800,fill:'white'},mask);
 const clearBases=Array.from(sequence,()=>el('circle',{cx:0,cy:0,r:radius+1,fill:'black'},mask));
 const world=el('g',{'data-molecule-layer':'geometry'},g),labels=el('g',{'data-molecule-layer':'indices'},g);
 const backbone=Array.from({length:sequence.length-1},(_,i)=>{
  const q=el('g',{'data-backbone-segment':`${i},${i+1}`,mask:'url(#'+id+'-clear-bases)'},world);
  const under=el('path',{fill:'none',stroke:'var(--color-bg)','stroke-width':7,'stroke-linecap':'round'},q);
  const line=el('path',{fill:'none',stroke:C.blue,'stroke-width':3.4,'stroke-linecap':'round'},q);
  return {g:q,under,line};
 });
 const links=pairs.map((p,k)=>{
  const q=el('g',{'data-pair-index':k,'data-pair':p.map(i=>i+1).join(','),mask:'url(#'+id+'-clear-bases)'},world);
  const plate=el('path',{fill:C.gold,'fill-opacity':.12,stroke:C.gold,'stroke-width':.9,'stroke-opacity':.45},q);
  const halo=el('path',{fill:'none',stroke:'var(--color-bg)','stroke-width':6.5,'stroke-linecap':'round'},q);
  const line=el('path',{fill:'none',stroke:C.gold,'stroke-width':2.3,'stroke-linecap':'round'},q);
  return {g:q,plate,halo,line};
 });
 function text(p,value,size,color,box,suffix){
  const n=el('text',{x:0,y:0,'text-anchor':'middle','dominant-baseline':'central','font-family':'var(--f-text)','font-size':size,fill:color,'data-i18n-ignore':''},p);n.textContent=value;
  unregister.push(global.L.contract(n,{id:id+'-'+suffix,box,space:p}));return n;
 }
 const nodes=[...sequence].map((base,i)=>{
  const q=el('g',{'data-base-index':i,'data-base-position':i+1,'data-base':base},world);
  const halo=el('circle',{r:radius+5,fill:'none',stroke:C.gold,'stroke-width':2,opacity:0},q);
  const bead=el('circle',{r:radius,fill:'var(--color-bg)',stroke:C.blue,'stroke-width':2},q);
  const inset=el('circle',{r:radius-2,fill:C.blue,'fill-opacity':.10},q);
  const letter=text(q,base,18,C.white,{x:-14,y:-14,width:28,height:28},'base-'+i);
  const indexGroup=el('g',{'data-index-of':i},labels);
  const index=text(indexGroup,String(i+1),12,C.grey,{x:-18,y:-11,width:36,height:22},'index-'+i);
  return {g:q,bead,inset,halo,base:letter,letter,indexGroup,index};
 });
 let projected=[],pairCurves=[],currentBounds={x:0,y:0,width:0,height:0},disposed=false;
 const fmt=n=>Number(n.toFixed(3)),pstr=p=>fmt(p.x)+','+fmt(p.y);
 function cubic(a,b,c,d,t){const u=1-t;return {x:u*u*u*a.x+3*u*u*t*b.x+3*u*t*t*c.x+t*t*t*d.x,y:u*u*u*a.y+3*u*u*t*b.y+3*u*t*t*c.y+t*t*t*d.y,z:mix(a.z,d.z,t)};}
 function paint(state={}){
  if(disposed)throw new Error('PM renderer is disposed');
  const s={cx:640,cy:380,scale:1,fold:0,depth:0,yaw:0,pitch:0,pairProgress:0,focusPair:-1,support:null,variant:0,labelOpacity:1,indexOpacity:1,plateOpacity:1,highlightResidues:[],highlightColor:C.gold,...state};
  ['cx','cy','scale','fold','depth','yaw','pitch','focusPair','variant','labelOpacity','indexOpacity','plateOpacity'].forEach(k=>{if(!Number.isFinite(s[k]))throw new TypeError('PM paint '+k+' must be finite');});
  if(s.scale<=0)throw new RangeError('PM scale must be positive');
  const fold=clamp(s.fold),depth=clamp(s.depth)*fold,raw=coordinates(sequence,pairs,s),yaw=s.yaw*depth,pitch=s.pitch*depth;
  const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
  function project(p){const x=p[0]*cy+p[2]*sy,z0=-p[0]*sy+p[2]*cy,y=p[1]*cp-z0*sp,z=p[1]*sp+z0*cp;return {x:s.cx+x*s.scale,y:s.cy+y*s.scale,z:z*s.scale};}
  projected=raw.map((p,i)=>({...project(p),r:radius*s.scale,index:i,base:sequence[i]}));
  const order=[],boxes=[];
  const maskMargin=250*s.scale,maskX=Math.min(...projected.map(p=>p.x))-maskMargin,maskY=Math.min(...projected.map(p=>p.y))-maskMargin,maskW=Math.max(...projected.map(p=>p.x))-maskX+maskMargin,maskH=Math.max(...projected.map(p=>p.y))-maskY+maskMargin;
  [mask,maskBackground].forEach(n=>Object.entries({x:maskX,y:maskY,width:maskW,height:maskH}).forEach(([k,v])=>n.setAttribute(k,v)));
  clearBases.forEach((circle,i)=>{circle.setAttribute('cx',projected[i].x);circle.setAttribute('cy',projected[i].y);circle.setAttribute('r',(radius+1)*s.scale);});
  function include(x,y,w,h){boxes.push({x,y,w,h});}
  function cubicPath(a,c1,c2,b){return 'M'+pstr(a)+' C'+pstr(c1)+' '+pstr(c2)+' '+pstr(b);}
  backbone.forEach((seg,i)=>{
   const a=projected[i],b=projected[i+1],prev=projected[Math.max(0,i-1)],next=projected[Math.min(projected.length-1,i+2)],tension=.15*fold;
   const c1={x:a.x+(b.x-prev.x)*tension,y:a.y+(b.y-prev.y)*tension},c2={x:b.x-(next.x-a.x)*tension,y:b.y-(next.y-a.y)*tension};
   const d=cubicPath(a,c1,c2,b);seg.under.setAttribute('d',d);seg.line.setAttribute('d',d);
   seg.under.setAttribute('stroke-width',7*s.scale);seg.line.setAttribute('stroke-width',3.4*s.scale);
   seg.g.setAttribute('opacity',1-depth*.20*(1-clamp(((a.z+b.z)/2/s.scale+95)/190)));
   order.push({node:seg.g,z:(a.z+b.z)/2-.5});
  });
  pairCurves=pairs.map((p,k)=>{
   const a=projected[p[0]],b=projected[p[1]],arc=(1-clamp(fold/.85))*Math.abs(b.x-a.x)*.30;
   const c1={x:mix(a.x,b.x,1/3),y:mix(a.y,b.y,1/3)-arc,z:mix(a.z,b.z,1/3)},c2={x:mix(a.x,b.x,2/3),y:mix(a.y,b.y,2/3)-arc,z:mix(a.z,b.z,2/3)};
   const curve=[a,c1,c2,b],d=cubicPath(...[a,c1,c2,b]);
   const value=Array.isArray(s.pairProgress)?s.pairProgress[k]??0:s.pairProgress;
   if(!Number.isFinite(value))throw new TypeError('PM pairProgress must be finite scalar or array');
   const support=s.support==null?1:s.support[k]??0;if(!Number.isFinite(support))throw new TypeError('PM support entries must be finite');
   const focus=k===Math.round(s.focusPair),color=focus?C.gold:s.support==null?C.gold:C.teal;
   links[k].g.setAttribute('opacity',clamp(value)*(.35+.65*clamp(support))*(s.focusPair<0||focus?1:.46));
   links[k].line.setAttribute('d',d);links[k].halo.setAttribute('d',d);links[k].line.setAttribute('stroke',color);
   links[k].line.setAttribute('stroke-width',(focus?3.7:2.3)*s.scale);links[k].halo.setAttribute('stroke-width',(focus?7.5:6.5)*s.scale);
   // Broad pair planes are schematic stacked rungs; their ends touch these bases.
   const width=7*s.scale*depth,dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,nx=-dy/len*width,ny=dx/len*width;
   const plate=[{x:a.x+nx,y:a.y+ny},{x:b.x+nx,y:b.y+ny},{x:b.x-nx,y:b.y-ny},{x:a.x-nx,y:a.y-ny}];
   links[k].plate.setAttribute('d','M'+plate.map(pstr).join(' L')+' Z');links[k].plate.setAttribute('opacity',depth*clamp(s.plateOpacity));links[k].plate.setAttribute('fill',color);links[k].plate.setAttribute('stroke',color);
   order.push({node:links[k].g,z:(a.z+b.z)/2-1});
   if(clamp(value)>.01){include(Math.min(a.x,b.x)-8*s.scale,Math.min(a.y,b.y)-arc-8*s.scale,Math.abs(b.x-a.x)+16*s.scale,Math.abs(b.y-a.y)+arc+16*s.scale);}
   return curve;
  });
  nodes.forEach((node,i)=>{
   const p=projected[i],pairFocused=s.focusPair>=0&&pairs[Math.round(s.focusPair)]?.includes(i),focused=pairFocused||s.highlightResidues.includes(i),accent=pairFocused?C.gold:s.highlightColor,zshade=1-depth*.23*(1-clamp((p.z/s.scale+95)/190));
   node.g.setAttribute('transform',`translate(${fmt(p.x)} ${fmt(p.y)}) scale(${s.scale})`);node.g.setAttribute('opacity',zshade);
   node.halo.setAttribute('opacity',focused?1:0);node.halo.setAttribute('stroke',accent);node.bead.setAttribute('stroke',focused?accent:C.blue);node.inset.setAttribute('fill',focused?accent:C.blue);node.letter.setAttribute('opacity',clamp(s.labelOpacity));
   const prev=projected[Math.max(0,i-1)],next=projected[Math.min(projected.length-1,i+1)],dx=next.x-prev.x,dy=next.y-prev.y;
   let outward=Math.atan2(-dx,dy);
   // Indices clear the chain on its outward normal. During the first 12% of
   // assembly they sweep around the bead, never through its base letter.
   if(i<(sequence.length-1)/2&&outward<Math.PI/2)outward+=2*Math.PI;
   const offsetAngle=mix(Math.PI/2,outward,clamp(fold/.12));
   const ox=(radius+17)*Math.cos(offsetAngle),oy=(radius+17)*Math.sin(offsetAngle);
   const ix=p.x+ox*s.scale,iy=p.y+oy*s.scale;
   node.indexGroup.setAttribute('transform',`translate(${fmt(ix)} ${fmt(iy)}) scale(${s.scale})`);node.indexGroup.setAttribute('opacity',clamp(s.indexOpacity)*zshade);
   order.push({node:node.g,z:p.z+1});include(p.x-(radius+6)*s.scale,p.y-(radius+6)*s.scale,(radius+6)*2*s.scale,(radius+6)*2*s.scale);
   if(s.indexOpacity>.01)include(ix-18*s.scale,iy-11*s.scale,36*s.scale,22*s.scale);
  });
  // Painter's order gives near bases and continuous backbone arcs proper occlusion.
  order.sort((a,b)=>a.z-b.z).forEach(item=>world.appendChild(item.node));
  const left=Math.min(...boxes.map(b=>b.x)),top=Math.min(...boxes.map(b=>b.y)),right=Math.max(...boxes.map(b=>b.x+b.w)),bottom=Math.max(...boxes.map(b=>b.y+b.h));
  currentBounds={x:left,y:top,width:right-left,height:bottom-top};g.dataset.fold=String(fold);g.dataset.depth=String(depth);g.dataset.variant=String(clamp(s.variant));
  return api;
 }
 const api={g,nodes,links,backbone,sequence,pairs:pairs.map(p=>p.slice()),paint,
  positions:()=>projected.map(p=>({...p})),point:i=>projected[i]?({...projected[i]}):null,
  pairPoint:(k,t=.5)=>pairCurves[k]?cubic(...pairCurves[k],clamp(t)):null,
  bounds:()=>({...currentBounds}),dispose(){if(!disposed){unregister.forEach(fn=>fn());disposed=true;}}};
 paint();return api;
}
global.PM={create,sequenceCoordinates,hairpinCoordinates,helixCoordinates,coordinates,SEQUENCE,PAIRS:PAIRS.map(p=>p.slice())};
})(window);
