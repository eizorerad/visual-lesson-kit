/* Why ATAC insert length retains information about chromatin.
   Experimental 1KX5 wrapped DNA and histone cartoon, with authored linkers.
   Straightening is a pedagogical contour diagram, not molecular dynamics.
   Every centerline edge keeps its length while the representation straightens. */
(function(global){
'use strict';
const TAU=2*Math.PI,clamp=x=>Math.max(0,Math.min(1,x)),mix=(a,b,t)=>a+(b-a)*t;
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);},phase=(x,a,b)=>smooth((x-a)/(b-a));
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,k)=>a.map(v=>v*k);
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),norm=a=>mul(a,1/(Math.hypot(...a)||1));
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
let serial=0;
function model(points){
 const lengths=points.slice(1).map((p,i)=>Math.hypot(...sub(p,points[i])));
 const dirs=points.slice(1).map((p,i)=>norm(sub(p,points[i])));
 let previous=0;
 const directions=dirs.map((v,i)=>{let azimuth=Math.atan2(v[2],v[0]);if(i){while(azimuth-previous>Math.PI)azimuth-=TAU;while(azimuth-previous<-Math.PI)azimuth+=TAU;}previous=azimuth;return {azimuth,elevation:Math.atan2(v[1],Math.hypot(v[0],v[2]))};});
 const cumulative=[0];lengths.forEach(l=>cumulative.push(cumulative[cumulative.length-1]+l));
 return {points,lengths,dirs,directions,cumulative,length:cumulative[cumulative.length-1]};
}
// These are separate explanatory examples, not members of the 150-record set.
const short=model(Array.from({length:97},(_,i)=>{const u=i/96;return [226*(u-.5),-15*Math.sin(Math.PI*u),10*Math.sin(TAU*u)];}));
const source=global.AtacStructures?.nucleosome,frame=global.AtacHistoneCoreData?.frame;
if(source?.pdb!=='1KX5'||!frame)throw new Error('Fragment origin requires the verified 1KX5 nucleosome');
const sourceChains=new Map(source.chains.map(c=>[c.id,c]));
const sourceTransform=p=>frame.rotation.map((row,i)=>frame.scale*dot(row,p)+frame.translation[i]);
const sourceStrands=['A','B'].map(side=>source.basePairs.map(pair=>sourceTransform(sourceChains.get(pair['chain'+side]).points[pair['index'+side]])));
const wrapped=sourceStrands[0].map((p,i)=>mul(add(p,sourceStrands[1][i]),.5)),linkerKnots=29;
const start=wrapped[0],finish=wrapped[wrapped.length-1],ta=norm(sub(wrapped[1],start)),tb=norm(sub(finish,wrapped[wrapped.length-2]));
const long=model([...Array.from({length:linkerKnots},(_,i)=>add(start,mul(ta,-70*(1-i/linkerKnots)))),...wrapped,...Array.from({length:linkerKnots},(_,i)=>add(finish,mul(tb,70*(i+1)/linkerKnots)))]);
// Preserve the source strand separation at both joins. Only the tangent
// extensions are authored. Rodrigues rotation adds a duplex to the linkers.
function turnVector(v,axis,angle){const c=Math.cos(angle),s=Math.sin(angle);return add(add(mul(v,c),mul(cross(axis,v),s)),mul(axis,dot(axis,v)*(1-c)));}
const firstOffset=sub(sourceStrands[0][0],start),lastOffset=sub(sourceStrands[0][wrapped.length-1],finish);
long.offsets=[...Array.from({length:linkerKnots},(_,i)=>turnVector(firstOffset,ta,-TAU*70*(1-i/linkerKnots)/32)),...sourceStrands[0].map((p,i)=>sub(p,wrapped[i])),...Array.from({length:linkerKnots},(_,i)=>turnVector(lastOffset,tb,TAU*70*(i+1)/linkerKnots/32))];
function frames(points){let previous=null;return points.map((q,i)=>{const t=norm(sub(points[Math.min(i+1,points.length-1)],points[Math.max(i-1,0)]));let n=previous?sub(previous,mul(t,dot(previous,t))):cross([0,0,1],t);if(Math.hypot(...n)<.05)n=cross([0,1,0],t);n=norm(n);previous=n;return {t,n,b:norm(cross(t,n))};});}
const sourceFrames=frames(long.points);
long.offsetComponents=long.offsets.map((v,i)=>[dot(v,sourceFrames[i].t),dot(v,sourceFrames[i].n),dot(v,sourceFrames[i].b)]);
// Continuously untwist unwrapped direction angles, then reconstruct each
// original edge length. A Cartesian position morph would shrink the DNA.
function unfold(m,u){
 const p=[[0,0,0]];
 m.directions.forEach((v,i)=>{
  const az=v.azimuth*(1-u),elev=v.elevation*(1-u);
  const d=[Math.cos(az)*Math.cos(elev),Math.sin(elev),Math.sin(az)*Math.cos(elev)];
  p.push(add(p[p.length-1],mul(d,m.lengths[i])));
 });
 const center=[0,1,2].map(k=>(Math.min(...p.map(q=>q[k]))+Math.max(...p.map(q=>q[k])))/2);
 return p.map(q=>sub(q,center));
}
function create(svg){
 const {D,L,C}=global,S=D.dom.s,id='atac-origin-'+(++serial),labels=[],nodes=[];
 function el(tag,a,p){const n=S(tag,a||{});if(p)p.append(n);nodes.push(n);return n;}
 function attrs(n,a){Object.entries(a).forEach(([k,v])=>n.setAttribute(k,typeof v==='number'?String(+v.toFixed(4)):String(v)));}
 const opacity=(n,a)=>{n.style.opacity=String(clamp(a));};
 const g=el('g',{'data-atac-actor':'fragment-origin','data-representation':'1KX5-nucleosome-with-authored-linkers'},svg);
 const molecular=el('g',{},g),caption=el('g',{},g),wordGroups=[0,1,2].map(i=>el('g',{'data-origin-stage':i},caption));
 function text(p,x,y,w,h,ru,en,size=22,color=C.white){
  D.i18n.pack('en',{strings:{[ru]:en}});const b=L.textBox(p,{id:id+'-label-'+labels.length,x,y,width:w,height:h,text:ru,size,color,padding:0,lineHeight:1.18,align:'center'});labels.push(b);return b;
 }
 text(wordGroups[0],250,217,780,48,'Две близкие доступные позиции','Two nearby accessible positions',25);
 text(wordGroups[0],360,475,560,46,'Между ними — короткий участок ДНК','A short DNA interval lies between them',22,C.gold);
 text(wordGroups[1],150,220,410,75,'Короткая вставка\nбез нуклеосомы между концами','Short insert\nwithout a nucleosome between its ends',22,C.gold);
 text(wordGroups[1],674,207,476,90,'Вторая вставка охватывает\nДНК вокруг нуклеосомы','The other insert spans\nDNA wrapped around a nucleosome',23,C.blue);
 text(wordGroups[1],664,516,490,65,'Доступные места по краям,\nзащищённый участок внутри','Accessible sites at the flanks,\na protected interval inside',21,C.grey);
 text(wordGroups[2],203,220,845,48,'Длина вдоль ДНК сохраняется после удаления белка','DNA contour length remains after protein removal',25);
 text(wordGroups[2],150,293,160,43,'Короткая','Short',21,C.gold);
 text(wordGroups[2],150,426,160,43,'Длиннее','Longer',21,C.blue);
 text(wordGroups[2],375,510,620,42,'Две вставки · одна шкала длины','Two inserts · one length scale',22,C.white);
 text(wordGroups[2],247,565,860,31,'Это примеры: одна длина не доказывает наличие нуклеосомы','Illustrative examples: length alone does not establish a nucleosome',17,C.grey);
 const guide=el('line',{x1:335,x2:335,y1:304,y2:470,stroke:C.grey,'stroke-opacity':.4,'stroke-dasharray':'3 6','stroke-width':1},wordGroups[2]);
 function molecule(m,name,color,hasCore){
  const root=el('g',{'data-origin-molecule':name},molecular),depth=el('g',{},root),ends=el('g',{},root),items=[];
  const strands=m.lengths.map((len,i)=>[0,1].map(strand=>{const sourceIndex=i-linkerKnots,pair=hasCore&&sourceIndex>=0&&sourceIndex<source.basePairs.length-1?source.basePairs[sourceIndex]:null,side=strand?'B':'A';const node=el('path',{fill:'none',stroke:hasCore&&strand?C.teal:color,'stroke-width':2.7,'stroke-linecap':'round','data-edge':i,'data-strand':strand,...(pair?{'data-origin-source-chain':pair['chain'+side],'data-source-start-index':pair['index'+side],'data-source-end-index':source.basePairs[sourceIndex+1]['index'+side]}:{})},depth);const item={node,i,strand,depth:0};items.push(item);return item;}));
  const rungs=Array.from({length:Math.floor(m.points.length/4)},(_,j)=>{const node=el('line',{stroke:color,'stroke-width':.8,'stroke-opacity':.45},depth);const item={node,i:j*4,depth:0,rung:true};items.push(item);return item;});
  let core=null;
  if(hasCore){
   const node=el('g',{'data-origin-part':'histone-core','data-source-pdb':'1KX5'},depth),cartoon=AtacHistoneCartoon.create(node,el);
   core={node,cartoon,depth:0};items.push(core);
  }
  const terminals=[0,1].map(side=>{
   const q=el('g',{'data-origin-end':side},ends),mark=el('circle',{r:5.5,fill:C.gold},q),tag=el('path',{fill:'none',stroke:side?C.purple:C.gold,'stroke-width':4,'stroke-linecap':'round'},q);
   const site=el('circle',{r:12,fill:'none',stroke:C.gold,'stroke-width':1.2,'stroke-opacity':.45},q);
   return {q,mark,tag,site};
  });
  return {root,depth,m,color,items,strands,rungs,core,terminals,lastOrder:[]};
 }
 const a=molecule(short,'short',C.gold,false),b=molecule(long,'spanning-nucleosome',C.blue,true);
 let disposed=false,snapshot;
 function paint(input={}){
  if(disposed)throw new Error('AtacFragmentOrigin actor is disposed');
  const visibility=clamp(Number.isFinite(input.visibility)?input.visibility:1),stage=Math.max(0,Math.min(2,Number.isFinite(input.stage)?input.stage:0)),turn=Number.isFinite(input.turn)?input.turn:0;
  const introduce=phase(stage,0,1),strip=phase(stage,1,1.22),straight=phase(stage,1.24,2);
  opacity(g,visibility);
  if(visibility<=0){snapshot={stage,visibility,introduce,proteinRemoval:strip,unroll:straight,geometry:[],schematic:true};return snapshot;}
  opacity(wordGroups[0],1-phase(stage,0,.38));opacity(wordGroups[1],phase(stage,.5,.85)*(1-phase(stage,1,1.22)));opacity(wordGroups[2],phase(stage,1.85,1.97));
  const geometry=[];
  function draw(actor,cx,cy,scale,alpha){
   const m=actor.m,p=unfold(m,straight),yaw=((actor.core?-.18:.12)+turn*Math.PI/180)*(1-straight),pitch=(actor.core?.3:.65)*(1-straight),roll=(actor.core?Math.PI/2:.18)*(1-straight);
   const cp=Math.cos(pitch),sp=Math.sin(pitch),cr=Math.cos(yaw),sr=Math.sin(yaw);
   const rot=q=>{const a=q[0]*Math.cos(roll)-q[1]*Math.sin(roll),b=q[0]*Math.sin(roll)+q[1]*Math.cos(roll),x=cr*a+sr*q[2],z=-sr*a+cr*q[2];return [x,-cp*b+sp*z,sp*b+cp*z];};
   const project=q=>{const r=rot(q);return [cx+scale*r[0],cy+scale*r[1],r[2]];};
   const positions=p.map(project),strandPoints=[[],[]],movingFrames=frames(p);
   p.forEach((q,i)=>{
    const f=movingFrames[i],angle=m.cumulative[i]*TAU/27,components=m.offsetComponents?.[i];
    const radial=components?add(add(mul(f.t,components[0]),mul(f.n,components[1])),mul(f.b,components[2])):add(mul(f.n,Math.cos(angle)*3.7),mul(f.b,Math.sin(angle)*3.7));
    strandPoints[0].push(project(add(q,radial)));strandPoints[1].push(project(sub(q,radial)));
   });
   opacity(actor.root,alpha);
   actor.strands.forEach(pair=>pair.forEach(item=>{const q=strandPoints[item.strand][item.i],r=strandPoints[item.strand][item.i+1];attrs(item.node,{d:`M${q[0]},${q[1]}L${r[0]},${r[1]}`});item.depth=(q[2]+r[2])/2;opacity(item.node,.78+.22*clamp((item.depth+50)/100));}));
   actor.rungs.forEach(item=>{const q=strandPoints[0][item.i],r=strandPoints[1][item.i];attrs(item.node,{x1:q[0],y1:q[1],x2:r[0],y2:r[1]});item.depth=(q[2]+r[2])/2;});
   if(actor.core){
    // Source DNA and all eight proteins undergo exactly the same rigid camera
    // transform. The protein disappears BEFORE the explanatory straightening.
    const sourceCenter=[0,1,2].map(k=>(Math.min(...m.points.map(q=>q[k]))+Math.max(...m.points.map(q=>q[k])))/2);
    const center=project(mul(sourceCenter,-1)),core=actor.core;
    core.cartoon.paint(local=>{const p=project(sub(local,sourceCenter));return {x:p[0],y:p[1],depth:p[2]};},scale);core.depth=center[2];opacity(core.node,1-strip);
   }
   const order=actor.items.slice().sort((x,y)=>x.depth-y.depth);
   if(order.some((item,i)=>actor.lastOrder[i]!==item)){order.forEach(item=>actor.depth.append(item.node));actor.lastOrder=order;}
   actor.terminals.forEach((end,i)=>{const q=positions[i?positions.length-1:0],near=positions[i?positions.length-2:1],v=norm(sub(q,near)),tip=add(q,mul(v,22));attrs(end.q,{transform:`translate(${q[0]},${q[1]})`});attrs(end.tag,{d:`M0,0L${tip[0]-q[0]},${tip[1]-q[1]}`});opacity(end.site,1-straight);});
   const sum=p.slice(1).reduce((v,q,i)=>v+Math.hypot(...sub(q,p[i])),0);
   geometry.push({id:actor.root.dataset.originMolecule,modelContourLength:m.length,contourLength:sum,modelUnits:'shared illustrative display units; not fragment bp',endpoints:[positions[0],positions[positions.length-1]],unroll:straight,proteinOpacity:actor.core?1-strip:0,centerline:p,...(actor.core?{source:'1KX5',sourcePairs:source.basePairs.length,sourceStrands,sourceRegion:[linkerKnots,linkerKnots+wrapped.length-1],proteinChains:actor.core.cartoon.chains,representation:straight?'pedagogical contour straightening':'experimental nucleosome with illustrative linkers'}:{})});
  }
  const finalStart=335;
  draw(a,mix(mix(640,340,introduce),finalStart+short.length/2,straight),mix(378,325,straight),mix(mix(1.75,1.15,introduce),1,straight),mix(1,.7,introduce)*(1-straight)+straight);
  // A small layout lift keeps the intermediate contour clear of the caption;
  // endpoint positions and the shared final length scale stay unchanged.
  draw(b,mix(875,finalStart+long.length/2,straight),mix(405,458,straight)-15*Math.sin(Math.PI*straight),mix(1.35,1,straight),introduce);
  snapshot={stage,visibility,introduce,proteinRemoval:strip,unroll:straight,geometry,schematic:true};return snapshot;
 }
 function dispose(){if(disposed)return;disposed=true;labels.forEach(b=>b.dispose());g.remove();}
 paint({visibility:0});return {g,paint,dispose,nodes,get snapshot(){return snapshot;}};
}
global.AtacFragmentOrigin=Object.freeze({create,models:Object.freeze({shortLength:short.length,longLength:long.length}),unfold});
})(window);
