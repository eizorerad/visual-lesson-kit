/* One tRNA across sequence, secondary diagram, source C4′ trace and atoms.
 * Morphs compare representations. Camera moves never change source coordinates.
 * Load after TRNA_DATA, TrnaAtoms, D.dom, F and L. */
(function(g){
'use strict';
const DATA=TRNA_DATA,ROWS=DATA.residues,PAIRS=DATA.stemPairs,N=ROWS.length;
const clamp=x=>Math.max(0,Math.min(1,x||0)),mix=(a,b,t)=>a+(b-a)*t;
const mixPoint=(a,b,t)=>a.map((v,i)=>mix(v,b[i],t));
const centroid=ids=>[0,1,2].map(axis=>ids.reduce((sum,id)=>sum+ROWS[id-1].xyz[axis],0)/ids.length);
const WHOLE_BASIS=[DATA.basis[0].slice(),DATA.basis[1].map(v=>-v),DATA.basis[2].map(v=>-v)];
// Center the visible extent, so the anticodon has breathing room above captions.
const WHOLE_ORIGIN=(()=>{const mean=centroid(ROWS.map(r=>r.id)),local=ROWS.map(r=>WHOLE_BASIS.map(axis=>axis.reduce((sum,v,i)=>sum+v*(r.xyz[i]-mean[i]),0)));
 const center=[0,1,2].map(i=>(Math.min(...local.map(p=>p[i]))+Math.max(...local.map(p=>p[i])))/2);
 return mean.map((v,i)=>v+WHOLE_BASIS.reduce((sum,axis,k)=>sum+axis[i]*center[k],0));})();
const GRID=ROWS.map((r,i)=>[208+48*(i%19),225+82*Math.floor(i/19),0]);
const ANTI=[34,35,36],CCA=[74,75,76],ELBOW=[18,19,55,56],STEM=[1,2,3,4,5,6,7,66,67,68,69,70,71,72];
let serial=0;
function color(id){return id<=7||id>=66?C.blue:id<=26?C.teal:id<=43?C.gold:id<=48?C.grey:C.purple;}
function cloverleaf(){
 const q=Array(N),put=(id,x,y)=>q[id-1]=[640+(x-462)*1.18,375+(y-368)*1.05,0];
 for(let i=0;i<7;i++){put(1+i,420,235+18*i);put(72-i,464,235+18*i);}
 [[8,403,352],[9,385,343],[14,292,325],[15,271,322],[16,250,328],[17,239,345],[18,239,365],[19,250,382],[20,271,390],[21,292,385],[26,397,382],
  [32,409,493],[33,413,515],[34,431,530],[35,453,534],[36,475,530],[37,493,515],[38,497,493],
  [44,493,392],[45,513,402],[46,535,409],[47,555,402],[48,570,381],
  [54,648,367],[55,669,361],[56,681,344],[57,685,323],[58,677,304],[59,660,293],[60,640,296],
  [73,478,215],[74,498,207],[75,518,202],[76,538,202]].forEach(a=>put(...a));
 for(let i=0;i<4;i++){put(10+i,366-i*18,335);put(25-i,366-i*18,375);}
 for(let i=0;i<5;i++){put(27+i,420,402+i*18);put(43-i,464,402+i*18);put(49+i,548+i*20,361);put(65-i,548+i*20,317);}
 return q;
}
const FLAT=cloverleaf();
function quaternion(m){
 const t=m[0][0]+m[1][1]+m[2][2];let x,y,z,w,s;
 if(t>0){s=Math.sqrt(t+1)*2;w=.25*s;x=(m[2][1]-m[1][2])/s;y=(m[0][2]-m[2][0])/s;z=(m[1][0]-m[0][1])/s;}
 else if(m[0][0]>m[1][1]&&m[0][0]>m[2][2]){s=Math.sqrt(1+m[0][0]-m[1][1]-m[2][2])*2;w=(m[2][1]-m[1][2])/s;x=.25*s;y=(m[0][1]+m[1][0])/s;z=(m[0][2]+m[2][0])/s;}
 else if(m[1][1]>m[2][2]){s=Math.sqrt(1+m[1][1]-m[0][0]-m[2][2])*2;w=(m[0][2]-m[2][0])/s;x=(m[0][1]+m[1][0])/s;y=.25*s;z=(m[1][2]+m[2][1])/s;}
 else{s=Math.sqrt(1+m[2][2]-m[0][0]-m[1][1])*2;w=(m[1][0]-m[0][1])/s;x=(m[0][2]+m[2][0])/s;y=(m[1][2]+m[2][1])/s;z=.25*s;}
 const n=Math.hypot(x,y,z,w);return [x/n,y/n,z/n,w/n];
}
function mixBasis(a,b,t){
 if(t<=0)return a.map(r=>r.slice());if(t>=1)return b.map(r=>r.slice());
 const qa=quaternion(a);let qb=quaternion(b),dot=qa.reduce((sum,v,i)=>sum+v*qb[i],0);
 if(dot<0){qb=qb.map(v=>-v);dot=-dot;}
 let q;if(dot>.9995)q=qa.map((v,i)=>mix(v,qb[i],t));else{const angle=Math.acos(Math.min(1,dot)),sin=Math.sin(angle);q=qa.map((v,i)=>(Math.sin((1-t)*angle)*v+Math.sin(t*angle)*qb[i])/sin);}
 const n=Math.hypot(...q),[x,y,z,w]=q.map(v=>v/n);
 return [[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],[2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],[2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]];
}
function bounds(points){const low=[0,1].map(i=>Math.min(...points.map(p=>p[i]))),high=[0,1].map(i=>Math.max(...points.map(p=>p[i])));return {low,high,width:high[0]-low[0],height:high[1]-low[1]};}
const RAW=ROWS.map(r=>TrnaAtoms.project(r.xyz,{origin:WHOLE_ORIGIN,basis:WHOLE_BASIS,cx:0,cy:0,scale:1,angle:0,tilt:0}));
const EXTENT=bounds(RAW),WHOLE_SCALE=Math.min(585/EXTENT.width,360/EXTENT.height);
const LOCATOR_SCALE=Math.min(174/EXTENT.width,130/EXTENT.height);
const LOCATOR_ORIGIN=(()=>{const center=[(EXTENT.low[0]+EXTENT.high[0])/2,-(EXTENT.low[1]+EXTENT.high[1])/2,0];return WHOLE_ORIGIN.map((v,i)=>v+WHOLE_BASIS.reduce((sum,axis,k)=>sum+axis[i]*center[k],0));})();
const LOCATOR_CAMERA={origin:LOCATOR_ORIGIN,basis:WHOLE_BASIS,cx:185,cy:271,scale:LOCATOR_SCALE,angle:0,tilt:0};
const LOCATOR_POINTS=ROWS.map(r=>TrnaAtoms.project(r.xyz,LOCATOR_CAMERA));
function cameraFor(s={}){
 const anti=clamp(s.zoomAnti),cca=clamp(s.zoomCCA),elbow=clamp(s.elbowZoom),atomic=clamp(s.atomicView),detail=F.phase(clamp(s.detail),.4,1);
 const weights=[anti,cca,elbow],total=Math.max(1,anti+cca+elbow),targets=[centroid(ANTI),centroid(CCA),centroid(ELBOW)],scales=[13,12,11];
 let origin=WHOLE_ORIGIN.slice(),scale=WHOLE_SCALE;
 for(let k=0;k<3;k++){const t=weights[k]/total;origin=origin.map((v,i)=>v+(targets[k][i]-WHOLE_ORIGIN[i])*t);scale+=(scales[k]-WHOLE_SCALE)*t;}
 const atomOrigin=mixPoint(TrnaAtoms.origin,TrnaAtoms.tripleCenter,detail),atomScale=mix(11.6,20,detail);
 const camera={origin:mixPoint(origin,atomOrigin,atomic),basis:mixBasis(WHOLE_BASIS,TrnaAtoms.basis,atomic),cx:640,cy:380,
  scale:mix(scale,atomScale,atomic),angle:mix(s.angle||0,s.atomAngle??8,atomic),tilt:10*atomic};
 const out=g.TrnaElbow?TrnaElbow.camera(s,camera):camera;
 out.angle+=(s.surfaceAngle||0);
 out.scale*=mix(1,.94,clamp(s.spacefill));out.cy+=8*clamp(s.spacefill);
 const mz=clamp(s.mgZoom),mb=clamp(s.mgBridge),mg=g.TRNA_MAGNESIUM_DATA;
 if(mz>0&&mg){
  const target=mixPoint(mg.magnesium.xyz,mg.view_origin,mb),fit=Math.min(530/mg.view_bounds.width,330/mg.view_bounds.height);
  out.origin=mixPoint(out.origin,target,mz);out.basis=mixBasis(out.basis,mg.view_basis,mz);
  // A gentle bridge tilt separates C11/U12 without foreshortening their water contacts.
  out.scale=mix(out.scale,mix(56,fit,mb),mz);out.angle=mix(out.angle,s.mgTurn||0,mz);out.tilt=mix(out.tilt,10*mb,mz);
 }

 return out;
}
function reorder(parent,ordered){let cursor=parent.firstElementChild;for(const node of ordered){if(node===cursor)cursor=cursor.nextElementSibling;else parent.insertBefore(node,cursor);}}
function create(parent){
 const id=++serial,root=F.group(parent),defs=D.dom.s('defs'),clip=D.dom.s('clipPath',{id:'trna-main-clip-'+id});
 clip.append(D.dom.s('rect',{x:60,y:188,width:1160,height:422}));defs.append(clip);
 const clear=D.dom.s('mask',{id:'trna-label-clearance-'+id,maskUnits:'userSpaceOnUse',x:60,y:148,width:1160,height:462});
 clear.append(D.dom.s('rect',{x:60,y:148,width:1160,height:462,fill:'white'}));
 const gutters=[{x:60,y:180,width:268,height:430},{x:934,y:185,width:286,height:425}].map(b=>{const rect=D.dom.s('rect',{...b,fill:'black'});clear.append(rect);return rect;});
 defs.append(clear);root.append(defs);
 const main=F.group(root);main.setAttribute('clip-path','url(#trna-main-clip-'+id+')');
 main.setAttribute('mask','url(#trna-label-clearance-'+id+')');
 const pairLayer=F.group(main),trace=F.group(main),segmentLayer=F.group(trace),nodeLayer=F.group(trace),atomLayer=F.group(main);
 const magnesium=g.TrnaMagnesium?.create(main),spacefill=g.TrnaSpacefill?.create(main),elbow=g.TrnaElbow?.create(atomLayer),atoms=TrnaAtoms.create(atomLayer),pairs=PAIRS.map(([a,b])=>{const line=F.line(pairLayer,0,0,0,0,C.grey,1.5);line.dataset.trnaPair=a+'-'+b;return line;});
 const lines=[],segments=Array.from({length:N-1},(_,i)=>{const q=F.group(segmentLayer),halo=F.line(q,0,0,0,0,'var(--color-bg)',7.3),line=F.line(q,0,0,0,0,color(i+1),2.8);q.dataset.trnaBond=(i+1)+'-'+(i+2);lines.push({q,halo,line,i});return q;});
 const labels=[],unregister=[],markers=[],nodes=ROWS.map(r=>{
  const q=F.group(nodeLayer);q.dataset.trnaResidue=String(r.id);q.dataset.trnaComponent=r.component;
  const halo=F.dot(q,0,0,12,'none');halo.setAttribute('stroke',color(r.id));halo.setAttribute('stroke-width','2');
  const dot=F.dot(q,0,0,16,'var(--color-bg)');dot.setAttribute('stroke',color(r.id));dot.setAttribute('stroke-width','1.5');
  const bead=F.dot(q,0,0,16,color(r.id));
  const letter=D.dom.s('text',{x:0,y:0,fill:C.white,'font-size':24,'text-anchor':'middle','dominant-baseline':'central'});letter.textContent=r.base;q.append(letter);
  const number=D.dom.s('text',{x:0,y:29,fill:C.grey,'font-size':12,'text-anchor':'middle','dominant-baseline':'central'});number.textContent=r.id;q.append(number);
  const mod=F.dot(q,11,-13,2.5,C.gold);const title=D.dom.s('title');title.textContent='1EHZ · A:'+r.id+' · '+r.component;q.append(title);
  unregister.push(L.contract(letter,{id:'trna-base-'+id+'-'+r.id,box:{x:-24,y:-24,width:48,height:48},space:q}));
  unregister.push(L.contract(number,{id:'trna-number-'+id+'-'+r.id,box:{x:-22,y:20,width:44,height:19},space:q}));
  markers.push({q,dot,bead,halo,letter,number,mod,r});labels.push(letter,number);return q;
 });
 const locator=F.group(root);locator.dataset.trnaLocator='1EHZ';
 const back=D.dom.s('rect',{x:85,y:180,width:200,height:170,rx:15,fill:'var(--color-bg)','fill-opacity':.93,stroke:C.grey,'stroke-opacity':.35});locator.append(back);
 const locLines=Array.from({length:75},(_,i)=>{const a=LOCATOR_POINTS[i],b=LOCATOR_POINTS[i+1];return F.line(locator,a[0],a[1],b[0],b[1],C.grey,1.2);});
 const locNodes=ROWS.map((r,i)=>{const p=LOCATOR_POINTS[i],n=F.dot(locator,p[0],p[1],1.8,C.grey);n.dataset.locatorResidue=String(r.id);return n;});
 const locatorMg=F.group(locator),locatorMgRing=F.dot(locatorMg,0,0,7,'none'),locatorMgDot=F.dot(locatorMg,0,0,2.5,C.gold);
 locatorMgRing.setAttribute('stroke',C.gold);locatorMgRing.setAttribute('stroke-width','1.4');
 if(g.TRNA_MAGNESIUM_DATA){const p=TrnaAtoms.project(TRNA_MAGNESIUM_DATA.magnesium.xyz,LOCATOR_CAMERA);F.at(locatorMg,p[0],p[1]);}
 root.dataset.trnaSource='1EHZ';root.dataset.trnaResidueCount='76';
 function paint(s={}){
  const fold=clamp(s.fold),model=clamp(s.model),simple=clamp(s.simple),reveal=clamp(s.atomReveal),seqZoom=clamp(s.seqZoom)*(1-fold),camera=cameraFor(s),project=TrnaAtoms.projector(camera),actual=ROWS.map(r=>project(r.xyz));
  const sequence=GRID.map(p=>mixPoint(p,[640+(p[0]-928)*2.5,370+(p[1]-307)*2.5,0],seqZoom));
  const points=sequence.map((p,i)=>mixPoint(mixPoint(p,FLAT[i],fold),actual[i],model));
  const stem=clamp(s.stem),anti=clamp(s.landmarks),cca=clamp((s.landmarks||0)-1),zoom=Math.max(clamp(s.zoomAnti),clamp(s.zoomCCA),clamp(s.elbowZoom),clamp(s.atomicView),clamp(s.mgZoom));
  gutters.forEach(rect=>F.opacity(rect,zoom));
  const selected=clamp(s.mgZoom)>.02?[8,11,12]:clamp(s.atomicView)>.02||stem>.02?STEM:s.zoomAnti>0?ANTI:s.zoomCCA>0?CCA:s.elbowZoom>0?ELBOW:[];
  const dim=id=>mix(1,STEM.includes(id)?1:.16,stem)*(id>=20&&id<=38?1:1-seqZoom)
   *mix(1,id>=32&&id<=38?1:.18,clamp(s.zoomAnti))
   *mix(1,id>=73&&id<=76?1:.18,clamp(s.zoomCCA))
   *mix(1,id>=14&&id<=21||id>=54&&id<=60?1:.15,clamp(s.elbowZoom));
  F.opacity(trace,(1-reveal)*(1-.98*clamp(s.elbowAtoms))*(1-F.phase(clamp(s.spacefill),0,.65))*(1-F.phase(clamp(s.mgZoom),0,.6)));F.opacity(pairLayer,(1-model)*(1-reveal));
  lines.forEach(o=>{const a=points[o.i],b=points[o.i+1];F.seg(o.line,a[0],a[1],b[0],b[1]);F.seg(o.halo,a[0],a[1],b[0],b[1]);F.opacity(o.halo,model);
   const wrap=(o.i+1)%19===0,formed=F.phase(fold,wrap?.6:.06,wrap?1:.65);F.opacity(o.q,formed*Math.min(dim(o.i+1),dim(o.i+2)));});
  const letterOpacity=(1-simple)*(1-model),font=mix(24,16,fold)+seqZoom*12;
  markers.forEach(o=>{const p=points[o.r.id-1],highlight=(ANTI.includes(o.r.id)?Math.max(anti,seqZoom):0)||(CCA.includes(o.r.id)?cca:0)||(ELBOW.includes(o.r.id)?clamp(s.elbowZoom):0)||(STEM.includes(o.r.id)?stem:0);
   const radius=mix(mix(16,10,fold),5.2,Math.max(simple,model))+seqZoom*5;
   F.at(o.q,p[0],p[1]);o.q.style.display=p[0]<60+radius||p[0]>1220-radius||p[1]<148+radius||p[1]>610-radius?'none':'';
   o.dot.setAttribute('r',radius);o.bead.setAttribute('r',radius);F.opacity(o.bead,Math.max(simple,model));
   o.dot.setAttribute('stroke-width',mix(1.5,1.1,Math.max(simple,model)));
   o.halo.setAttribute('r',radius+6);F.opacity(o.halo,highlight);F.opacity(o.q,dim(o.r.id));
   o.letter.setAttribute('font-size',font);F.opacity(o.letter,letterOpacity);F.opacity(o.number,(1-F.phase(fold,0,.3))*(1-model));
   // Hide text too near a clipped edge; clipped letters would be misleading.
   o.letter.style.display=p[0]<84||p[0]>1196||p[1]<172||p[1]>586?'none':'';
   o.number.style.display=p[0]<82||p[0]>1198||p[1]+39>610||p[1]+20<148?'none':'';
   F.opacity(o.mod,o.r.component.length>1?letterOpacity:0);
  });
  pairs.forEach((line,i)=>{const [a,b]=PAIRS[i],p=points[a-1],q=points[b-1],d=Math.hypot(q[0]-p[0],q[1]-p[1]),inset=mix(12,6,simple),f=Math.min(.45,inset/Math.max(d,.001));F.seg(line,mix(p[0],q[0],f),mix(p[1],q[1],f),mix(q[0],p[0],f),mix(q[1],p[1],f));F.opacity(line,clamp(s.pairs)*fold);});
  if(model>0){reorder(segmentLayer,lines.slice().sort((a,b)=>(points[a.i][2]+points[a.i+1][2])-(points[b.i][2]+points[b.i+1][2])).map(o=>o.q));reorder(nodeLayer,markers.slice().sort((a,b)=>points[a.r.id-1][2]-points[b.r.id-1][2]).map(o=>o.q));}
  const mgView=magnesium?.render(s,camera);
  const spaceView=spacefill?.render(camera,clamp(s.spacefill));
  const elbowView=elbow?.render(s,camera);
  const atomView=atoms.render(camera,{focus:clamp(s.focus),detail:clamp(s.detail),contacts:clamp(s.contacts),neighbors:clamp(s.neighbors),chemical:reveal,visible:reveal>0});
  const otherZoom=Math.max(clamp(s.zoomAnti),clamp(s.zoomCCA),clamp(s.elbowZoom),clamp(s.atomicView));
  F.opacity(locator,model*Math.max(F.phase(otherZoom,0,.3)*(1-F.phase(clamp(s.mgCharge),0,.4)),F.phase(clamp(s.mgZoom),.45,.85)));F.opacity(locatorMg,clamp(s.mgZoom));
  locNodes.forEach((n,i)=>{const active=selected.includes(i+1);n.setAttribute('fill',active?C.gold:C.grey);n.setAttribute('r',active?2.8:1.8);F.opacity(n,active?1:.5);});
  locLines.forEach((n,i)=>{const active=selected.includes(i+1)&&selected.includes(i+2);n.setAttribute('stroke',active?C.gold:C.grey);n.setAttribute('stroke-width',active?2:1.2);F.opacity(n,active?1:.45);});
  root.dataset.trnaCamera=JSON.stringify(camera);root.dataset.trnaModel=String(model);root.dataset.trnaAtomicReveal=String(reveal);
  return {points,camera,atomView,elbowView,spaceView,mgView,locatorPoints:LOCATOR_POINTS.map(p=>p.slice())};
 }
 function dispose(){unregister.forEach(fn=>fn());spacefill?.dispose();magnesium?.dispose();}
 return {g:root,paint,nodes,segments,pairs,dispose};
}
g.TrnaWorld=Object.freeze({create,cameraFor,mixBasis,cloverleaf,wholeBasis:WHOLE_BASIS,wholeOrigin:WHOLE_ORIGIN,color});
})(window);
