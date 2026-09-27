/* Source-coordinate structural views for the ATAC-seq film.
   The conserved source geometry is represented by C-alpha and C4-prime traces.
   Tube width, base spokes, transparency and camera motion are representations,
   not molecular surfaces, bond geometry, dynamics or an inferred ATAC complex. */
(function(global){
'use strict';
const NS='http://www.w3.org/2000/svg',clamp=x=>Math.max(0,Math.min(1,Number(x)||0));
// Local quintic easing keeps the actor usable without the film timeline.
function smooth(u){u=clamp(u);if(u>.5)return 1-smooth(1-u);return u*u*u*(u*(u*6-15)+10);}
const mix=(a,b,t)=>a+(b-a)*t,blend=(a,b,t)=>a.map((v,i)=>mix(v,b[i],t));
const mean=ps=>ps.length?ps.reduce((a,p)=>a.map((v,i)=>v+p[i]),[0,0,0]).map(v=>v/ps.length):[0,0,0];
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const fmt=n=>Number(n.toFixed(2));
let serial=0;

function create(svg){
 if(!global.AtacStructures)throw new Error('AtacStructureViews requires source coordinates in AtacStructures');
 const uid='atac-structure-'+(++serial),C=global.C,labels=[],nodes=[],models=[];let disposed=false,lb=0,lastState=null;
 const element=(tag,attrs={},parent)=>{const e=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,String(v));if(parent)parent.appendChild(e);nodes.push(e);return e;};
 // Attribute and opacity writes skip values the node already has: unchanged
 // actors then cost no mutation records or style invalidation per frame.
 const group=p=>element('g',{},p),attrs=(n,o)=>{for(const[k,v]of Object.entries(o)){const next=String(v);if(n.getAttribute(k)!==next)n.setAttribute(k,next);}};
 const opacity=(n,a)=>{const next=String(clamp(a));if(n.style.opacity!==next)n.style.opacity=next;};
 const root=element('g',{'data-actor':'atac-structure-views','data-representation':'source-coordinate-polymer-traces'},svg);
 const title=element('title',{},root);title.textContent='Experimental nucleosome and Tn5 coordinates, shown as C-alpha and C4-prime polymer traces';
 const defs=element('defs',{},root),clip=element('clipPath',{id:uid+'-clip'},defs);
 // Focus views keep the enlarged neighboring traces in the frame. Only the
 // figure boundary crops geometry; small opaque plates protect the labels.
 element('rect',{x:60,y:201,width:1160,height:353,rx:18},clip);
 const molecular=group(root),locatorLayer=group(root),legend=group(root),stages=Array.from({length:5},()=>group(legend));
 const box=(p,x,y,w,h,ru,en,size=22,color=C.white,align='left')=>{
  D.i18n.pack('en',{strings:{[ru]:en||ru}});
  const b=L.textBox(p,{id:uid+'-label-'+(++lb),x,y,width:w,height:h,text:ru,size,color,align,padding:0,lineHeight:1.16});labels.push(b);return b;
 };
 const circle=(p,x,y,r,color,alpha=1)=>element('circle',{cx:x,cy:y,r,fill:color,'fill-opacity':alpha},p);
 const colors={H2A:C.purple,H2B:C.red,H3:C.gold,H4:C.white};
 function roleColor(chain,index,kind){
  if(chain.kind==='dna')return kind==='nucleosome'?(index%2?C.teal:C.blue):(/2|B/.test(String(chain.end||chain.duplex||chain.group||chain.role))?C.teal:C.gold);
  if(kind==='nucleosome')return colors[chain.role]||Object.entries(colors).find(([k])=>String(chain.role).includes(k))?.[1]||C.purple;
  return /B|2/.test(chain.role)||index%2?C.purple:C.red;
 }
 const lineData=ps=>ps.map((p,i)=>(i?'L':'M')+fmt(p.x)+','+fmt(p.y)).join(' ');
function rotated(p,center,yaw,pitch,roll){
  const x=p[0]-center[0],y=p[1]-center[1],z=p[2]-center[2];
  const ca=Math.cos(yaw),sa=Math.sin(yaw),cb=Math.cos(pitch),sb=Math.sin(pitch),cc=Math.cos(roll),sc=Math.sin(roll);
  const X=x*ca+z*sa,Z=-x*sa+z*ca,Y=y*cb-Z*sb,Z2=y*sb+Z*cb;
  return[X*cc-Y*sc,X*sc+Y*cc,Z2];
 }
 // The overview camera is the selected chromatin nucleosome's exact source
 // frame at turn=32. A larger view changes only scale and translation; later
 // detail turns rotate this same rigid object instead of replacing its pose.
 function nucleosomeRotation(p,center,turn=0){
  const frame=AtacHistoneCoreData.frame,d=p.map((v,i)=>v-center[i]);
  const q=frame.rotation.map(row=>row.reduce((a,v,i)=>a+v*d[i],0)*frame.scale);
  const tilt=18*Math.PI/180,ct=Math.cos(tilt),st=Math.sin(tilt),x0=ct*q[0]-st*q[1],y0=st*q[0]+ct*q[1];
  const yaw=.22*Math.sin(32*Math.PI/180),pitch=50*Math.PI/180;
  const x=x0*Math.cos(yaw)+q[2]*Math.sin(yaw),z0=-x0*Math.sin(yaw)+q[2]*Math.cos(yaw);
  const y=y0*Math.cos(pitch)-z0*Math.sin(pitch),z=y0*Math.sin(pitch)+z0*Math.cos(pitch);
  return[x*Math.cos(turn)+z*Math.sin(turn),-y,-x*Math.sin(turn)+z*Math.cos(turn)];
 }
 function sourceFromLocal(p){
  const f=AtacHistoneCoreData.frame,q=p.map((v,i)=>(v-f.translation[i])/f.scale);
  return q.map((_,i)=>f.rotation.reduce((a,row,j)=>a+row[i]*q[j],0));
 }
 function buildModel(kind,source){
  const g=element('g',{'data-pdb':source.pdb,'clip-path':'url(#'+uid+'-clip)'},molecular),geometry=group(g),items=[];
  const all=source.chains.flatMap(c=>c.points),center=mean(all),dna=source.chains.filter(c=>c.kind==='dna');
  const end1=dna.filter(c=>!(/2|B/.test(String(c.end||c.duplex||c.group||c.role))));
  const focusChains=end1.length&&end1.length<dna.length?end1:dna.slice(0,Math.max(1,dna.length/2));
  const focusSet=new Set(focusChains),focus=mean(focusChains.flatMap(c=>c.points));
  // Pick a reproducible source-indexed DNA arc, not a newly drawn helix.
  // Source indices 48..65 identify 18 base-pair centroids in 1KX5.
  const arcPairs=kind==='nucleosome'?(source.basePairs||[]).slice(48,66):[];
  const arcIndices=new Set(arcPairs.flatMap(p=>[p.chainA+':'+p.indexA,p.chainB+':'+p.indexB]));
  const arcPoints=arcPairs.flatMap(p=>[source.chains.find(c=>c.id===p.chainA).points[p.indexA],source.chains.find(c=>c.id===p.chainB).points[p.indexB]]);
  const proteinPoints=source.chains.filter(c=>c.kind==='protein').flatMap(c=>c.points),proteinCenter=mean(proteinPoints);
  const corePoints=proteinPoints.filter(p=>distance(p,proteinCenter)<30);
  const chainInfo=source.chains.map((chain,ci)=>{
   const color=roleColor(chain,ci,kind),dna=chain.kind==='dna',inFocus=focusSet.has(chain),points=chain.points,limit=dna?4:6,gap=dna?11:7,breaks=new Set(chain.breaks||[]);
   const occupancy=kind==='nucleosome'&&!dna?AtacHistoneCoreData.chains.find(c=>c.id===chain.id)?.occupancies:null;
   const uncertain=i=>!!occupancy&&(occupancy[i]===0||occupancy[i+1]===0);
   // Consecutive retained vertices share one stroke triple. A run ends at a
   // chain break, an implausible gap, a change of occupancy certainty or the
   // length limit, so every retained source vertex is still drawn exactly once
   // and painter sorting keeps a useful per-run depth. One node triple per
   // residue only multiplied SVG nodes; the polyline passes through the same points.
   const joined=j=>j>0&&j<points.length&&!breaks.has(j)&&distance(points[j],points[j-1])<=gap;
   for(let i=0;i<points.length-1;){
    if(!joined(i+1)){i++;continue;}
    const weak=uncertain(i);let end=i+1;
    while(end<points.length-1&&end-i<limit&&joined(end+1)&&uncertain(end)===weak)end++;
    const ps=points.slice(i,end+1);
    const node=element('g',{'data-chain':chain.id,'data-role':chain.role,'data-kind':chain.kind,'data-zero-occupancy':String(weak),'data-start-index':i,'data-end-index':end},geometry);
    const base=element('path',{fill:'none',stroke:'color-mix(in srgb, '+color+' 52%, var(--color-bg))','stroke-linecap':'round','stroke-linejoin':'round'},node);
    const tube=element('path',{fill:'none',stroke:color,'stroke-linecap':'round','stroke-linejoin':'round'},node);
    const light=element('path',{fill:'none',stroke:color,'stroke-linecap':'round','stroke-linejoin':'round','stroke-opacity':.6},node);
    if(weak)[base,tube,light].forEach(path=>path.setAttribute('stroke-linecap','butt'));
    items.push({node,paths:[base,tube,light],points:ps,kind:chain.kind,inFocus,inArc:arcIndices.has(chain.id+':'+i),color,chain:ci,index:i,type:'trace',z:0,uncertain:weak});
    i=end;
   }
   // Base centroids and C1-prime sugar coordinates are experimental. A spoke
   // is a representation, explicitly not the full covalent base geometry.
   if(dna&&chain.basePoints)for(let i=0;i<points.length;i+=2){
    if(!Array.isArray(chain.basePoints[i])||chain.basePoints[i].length!==3)continue;
    const node=element('path',{fill:'none',stroke:color,'stroke-width':1.7,'stroke-linecap':'round','data-chain':chain.id,'data-kind':'dna-base-spoke'},geometry);
    items.push({node,paths:[node],points:[chain.sugarPoints?.[i]||points[i],chain.basePoints[i]],kind:'dna',inFocus,inArc:arcIndices.has(chain.id+':'+i),color,chain:ci,index:i,type:'spoke',z:0});
   }
   return{chain,color,center:mean(points)};
  });
  for(const pair of source.basePairs||[]){
   const ca=source.chains.find(c=>c.id===pair.chainA),cb=source.chains.find(c=>c.id===pair.chainB);
   const a=ca?.basePoints?.[pair.indexA],b=cb?.basePoints?.[pair.indexB];if(!a||!b)continue;
   const node=element('path',{fill:'none',stroke:C.grey,'stroke-width':1.5,'stroke-linecap':'round','data-kind':'paired-base-centroids'},geometry);
   items.push({node,paths:[node],points:[a,b],kind:'dna',inFocus:focusSet.has(ca),inArc:arcIndices.has(pair.chainA+':'+pair.indexA),color:C.grey,type:'spoke',z:0});
  }
  const focusPairs=(source.basePairs||[]).filter(p=>focusChains.some(c=>c.id===p.chainA));
  const pairCenter=p=>mean([source.chains.find(c=>c.id===p.chainA).basePoints[p.indexA],source.chains.find(c=>c.id===p.chainB).basePoints[p.indexB]]);
  const ends=focusPairs.length>1?[pairCenter(focusPairs[1]),pairCenter(focusPairs[focusPairs.length-2])]:[focus,focus.map((v,i)=>v+(i===0?1:0))];
  const focusAxis=ends[1].map((v,i)=>v-ends[0][i]);
  const focusYaw=Math.atan2(focusAxis[2],focusAxis[0]),focusRoll=-Math.atan2(focusAxis[1],Math.hypot(focusAxis[0],focusAxis[2]));
  const sourceIndices=arcPairs.length?{chainA:arcPairs[0].chainA,indicesA:[Math.min(...arcPairs.map(p=>p.indexA)),Math.max(...arcPairs.map(p=>p.indexA))],chainB:arcPairs[0].chainB,indicesB:[Math.min(...arcPairs.map(p=>p.indexB)),Math.max(...arcPairs.map(p=>p.indexB))]}:null;
  let cartoon=null,cartoonNode=null;
  if(kind==='nucleosome'){
   cartoonNode=element('g',{'data-structure-histone-cartoon':'1KX5'},geometry);
   cartoon=AtacHistoneCartoon.create(cartoonNode,element);
  }
  const info={kind,source,g,geometry,items,cartoon,cartoonNode,center,focus,focusSet,focusYaw,focusRoll,chainInfo,arcPoints,arcCenter:mean(arcPoints),sourceIndices,corePoints,proteinCenter,lastOrder:[],signature:'',bounds:null,view:null};models.push(info);return info;
 }
 const nuc=buildModel('nucleosome',AtacStructures.nucleosome),tn5=buildModel('transposome',AtacStructures.transposome);
 // The locator uses exactly the same transformed source coordinates as the
 // large view. Its ring marks the selected source region, not a new object.
 function makeLocator(model){
  const g=element('g',{'data-locator':model.source.pdb},locatorLayer),items=[];
  element('rect',{x:76,y:278,width:244,height:177,rx:13,fill:'var(--color-bg)','fill-opacity':.98},g);
  for(const c of model.chainInfo){
   const node=element('path',{fill:'none',stroke:c.color,'stroke-width':c.chain.kind==='dna'?2:1.1,'stroke-opacity':c.chain.kind==='dna'?.9:.5,'stroke-linecap':'round'},g);
   items.push({node,chain:c.chain});
  }
  const ring=element('ellipse',{fill:C.gold,'fill-opacity':.06,stroke:C.gold,'stroke-width':2.5,'stroke-dasharray':'4 4','data-locator-region':'source-focus'},g);
  return{g,items,ring};
 }
 nuc.locator=makeLocator(nuc);tn5.locator=makeLocator(tn5);
 // The locator occupies a reserved gap in the side text and sits above the
 // side plates. Its visibility is independent of the numbered text states.
 root.appendChild(locatorLayer);
 const local=AtacCallouts.create(legend,{id:uid+'-local'});
 local.add('nuc-dna','ДНК · 147 п. н.','DNA · 147 bp',{width:174,height:40,color:C.blue});
 local.add('nuc-core','Гистоновая\nсердцевина','Histone\ncore',{width:174,height:70,color:C.gold});
 for(const role of ['H3','H4','H2A','H2B'])local.add('family-'+role,role+' × 2',role+' × 2',{width:98,height:38,color:colors[role]});
 ['H3','H4','H2A','H2B'].forEach((role,i)=>box(stages[1],408+i*116,565,108,36,role+' × 2',role+' × 2',22,colors[role],'center'));
 local.add('dna-arc','Двойная спираль','DNA duplex',{width:174,height:70,color:C.blue});
 local.add('tn5-protein','Димер Tn5','Tn5 dimer',{width:152,height:40,color:C.red});
 local.add('tn5-ends','Концы ДНК','DNA ends',{width:156,height:40,color:C.gold});
 local.add('loaded-end','Конец транспозона','Transposon end',{width:204,height:40,color:C.gold});
 box(stages[1],76,465,244,54,'Нуклеосома целиком','Whole nucleosome',18,C.grey,'center');
 box(stages[2],76,465,244,54,'Весь путь · ≈1,65 оборота','Full path · ≈1.65 turns',18,C.grey,'center');
 box(stages[4],76,465,244,54,'Тот же димер Tn5','The same Tn5 dimer',18,C.grey,'center');
 const provenanceN=group(root),provenanceT=group(root);
 box(provenanceN,172,567,936,35,'PDB 1KX5 · те же координаты · гистоновые спирали и трассы ДНК','PDB 1KX5 · the same coordinates · histone helices and DNA traces',17,C.grey,'center');
 box(provenanceT,97,567,1086,35,'PDB 1MUH · трассы Cα и ДНК · целевая ДНК и полные адаптеры здесь отсутствуют','PDB 1MUH · Cα and DNA traces · target DNA and full adapters are absent here',17,C.grey,'center');

 function render(model,state,amount){
  opacity(model.g,amount);if(amount<.001){opacity(model.locator.g,0);return model.bounds;}
  const isN=model.kind==='nucleosome',stage=Math.min(isN?2:4,state.stage),close=isN?clamp(stage):clamp(stage-3),arc=isN?clamp(stage-1):0;
  // Public camera contract: turn is degrees. Stage changes interpolate only
  // the view center, scale, emphasis and orientation, never source positions.
  const selected=isN?blend(model.proteinCenter,model.arcCenter,arc):model.focus;
  const focus=blend(model.center,selected,close),zoom=state.zoom,turn=(Number(state.turn)||0)*Math.PI/180;
  const baseYaw=(isN?.30:-.60)+turn+(isN?Math.max(0,stage-1)*.18:0);
  const yaw=isN?baseYaw:baseYaw+Math.atan2(Math.sin(model.focusYaw-baseYaw),Math.cos(model.focusYaw-baseYaw))*close,pitch=isN?-.22:mix(.15,0,close),roll=isN?Math.PI/2+.08:mix(-.12,model.focusRoll,close);
  const rotate=(p,center)=>isN?nucleosomeRotation(p,center,turn+arc*.18):rotated(p,center,yaw,pitch,roll);
  const all=model.source.chains.flatMap(c=>c.points),rot=all.map(p=>rotate(p,model.center));
  const minX=Math.min(...rot.map(p=>p[0])),maxX=Math.max(...rot.map(p=>p[0])),minY=Math.min(...rot.map(p=>p[1])),maxY=Math.max(...rot.map(p=>p[1]));
  const spanX=maxX-minX,spanY=maxY-minY,offset=[(minX+maxX)/2*(1-close),(minY+maxY)/2*(1-close)];
  const baseScale=Math.min(540/spanX,322/spanY),magnification=isN?1+close*.68+arc*.68:1+close*1.18,scale=baseScale*magnification*zoom;
  const signature=[stage,turn,zoom,amount].join('|');if(signature===model.signature)return model.bounds;model.signature=signature;
  const project=p=>{const q=rotate(p,focus);return{x:643+(q[0]-offset[0])*scale,y:377-(q[1]-offset[1])*scale,z:q[2],depth:q[2]};};
  const projected=all.map(project);model.bounds={minX:Math.min(...projected.map(p=>p.x)),maxX:Math.max(...projected.map(p=>p.x)),minY:Math.min(...projected.map(p=>p.y)),maxY:Math.max(...projected.map(p=>p.y)),clipped:close>.02};
  const dnaProjected=model.source.chains.filter(c=>c.kind==='dna').flatMap(c=>c.points.map(project));
  const dnaBounds={minX:Math.min(...dnaProjected.map(p=>p.x)),maxX:Math.max(...dnaProjected.map(p=>p.x)),minY:Math.min(...dnaProjected.map(p=>p.y)),maxY:Math.max(...dnaProjected.map(p=>p.y))};
  model.registration={center:[(dnaBounds.minX+dnaBounds.maxX)/2,(dnaBounds.minY+dnaBounds.maxY)/2],diagonal:Math.hypot(dnaBounds.maxX-dnaBounds.minX,dnaBounds.maxY-dnaBounds.minY),bounds:dnaBounds};
  const pp=model.source.chains.filter(c=>c.kind==='protein').flatMap(c=>c.points.map(project));
  const pb={minX:Math.min(...pp.map(p=>p.x)),maxX:Math.max(...pp.map(p=>p.x)),minY:Math.min(...pp.map(p=>p.y)),maxY:Math.max(...pp.map(p=>p.y))};
  model.proteinRegistration={source:model.source.pdb,center:[(pb.minX+pb.maxX)/2,(pb.minY+pb.maxY)/2],diagonal:Math.hypot(pb.maxX-pb.minX,pb.maxY-pb.minY),bounds:pb,landmarks:model.source.chains.filter(c=>c.kind==='protein').flatMap(c=>c.points.map((p,index)=>{const q=project(p);return{chain:c.id,index,point:[q.x,q.y]};}))};
  model.labelGeometry={protein:pp,dna:dnaProjected,core:model.corePoints.map(project),arc:model.arcPoints.map(project),end:model.chainInfo.filter(c=>model.focusSet.has(c.chain)).flatMap(c=>c.chain.points.map(project)),families:Object.fromEntries(Object.keys(colors).map(role=>[role,model.source.chains.filter(c=>c.kind==='protein'&&c.role.includes(role)).flatMap(c=>c.points.filter(p=>distance(p,model.proteinCenter)<30).map(project))]))};

  const maxDepth=Math.max(...rot.map(p=>Math.abs(p[2])))||1;
  let cartoonItem=null;
  if(isN){
   model.cartoonBounds=model.cartoon.paint(local=>project(sourceFromLocal(local)),scale);
   opacity(model.cartoonNode,mix(1,.16,arc));
   cartoonItem={node:model.cartoonNode,z:project(sourceFromLocal([0,0,0])).z};
  }
  for(const item of model.items){
   const p=item.points.map(project),z=p.reduce((a,v)=>a+v.z,0)/p.length;let d=lineData(p);item.z=z;
   // Interpolating the trace passes through every retained source point. The
   // neighboring controls only round the representation between those points.
   if(item.type==='trace'&&!isN){
    const chain=model.source.chains[item.chain],breaks=new Set(chain.breaks||[]);d='M'+fmt(p[0].x)+','+fmt(p[0].y);
    for(let j=1;j<p.length;j++){
     const at=item.index+j,a=p[j-1],b=p[j];
     const prev=at-2>=0&&!breaks.has(at-1)?project(chain.points[at-2]):a;
     const next=at+1<chain.points.length&&!breaks.has(at+1)?project(chain.points[at+1]):b;
     d+=' C'+fmt(a.x+(b.x-prev.x)/6)+','+fmt(a.y+(b.y-prev.y)/6)+' '+fmt(b.x-(next.x-a.x)/6)+','+fmt(b.y-(next.y-a.y)/6)+' '+fmt(b.x)+','+fmt(b.y);
    }
   }
   const back=clamp(.5+z/(maxDepth*2)),dna=item.kind==='dna';
   let a=dna?(isN?mix(mix(1,.18,close),item.inArc?1:.28,arc):mix(1,item.inFocus?1:.20,close)):(isN?mix(.90,.16,arc):mix(.9,.19,close));
   if(item.type==='spoke'){attrs(item.node,{d,'stroke-width':isN?mix(1.65,2.5,arc):mix(1.9,3,close)});opacity(item.node,a*.72*(isN?close:1));continue;}
   const width=dna?(isN?2.4*scale:mix(4.4,7,close)):(isN?mix(6.4,8.1,close):mix(6.4,9.1,close));
   attrs(item.paths[0],{d,'stroke-width':fmt(width),'stroke-opacity':.95});
   attrs(item.paths[1],{d,'stroke-width':fmt(width*.76),'stroke-opacity':fmt(.62+.36*back)});
   attrs(item.paths[2],{d,'stroke-width':fmt(width*.22),'stroke-opacity':fmt(.35+.3*back)});
   // Short source segments need short dashes and flat caps; round caps
   // would close the gaps and falsely paint these uncertain traces solid.
   if(item.uncertain)item.paths.forEach(path=>attrs(path,{'stroke-dasharray':`${fmt(width*.6)} ${fmt(width*.6)}`}));
   opacity(item.node,isN&&!dna?0:a*(item.uncertain?.78:1));
  }
  const ordered=[...model.items,...(cartoonItem?[cartoonItem]:[])].sort((a,b)=>a.z-b.z),same=model.lastOrder.length===ordered.length&&ordered.every((n,i)=>n.node===model.lastOrder[i]?.node);
  if(!same){const frag=document.createDocumentFragment();for(const item of ordered)frag.appendChild(item.node);model.geometry.appendChild(frag);model.lastOrder=ordered;}
  const loc=model.locator;opacity(loc.g,amount*close);
  const ls=Math.min(204/spanX,145/spanY),lp=p=>{const q=rotate(p,model.center);return{x:198+(q[0]-(minX+maxX)/2)*ls,y:365-(q[1]-(minY+maxY)/2)*ls,z:q[2]};};
  loc.items.forEach(item=>{const ps=item.chain.points.map(lp);attrs(item.node,{d:ps.map((p,i)=>(i&&!(item.chain.breaks||[]).includes(i)?'L':'M')+fmt(p.x)+','+fmt(p.y)).join(' ')});});
  const focusedPoints=isN?(arc>.5?model.arcPoints:model.corePoints):model.chainInfo.filter(c=>model.focusSet.has(c.chain)).flatMap(c=>c.chain.points);
  const f=lp(selected),coreExtent=isN?model.corePoints.map(lp):[],arcExtent=isN?model.arcPoints.map(lp):[];
  const extent=(ps,axis,center)=>Math.max(12,...ps.map(p=>Math.abs(p[axis]-center)))+5;
  const focusExtent=focusedPoints.map(lp);
  const rx=isN?mix(extent(coreExtent,'x',lp(model.proteinCenter).x),extent(arcExtent,'x',lp(model.arcCenter).x),arc):extent(focusExtent,'x',f.x);
  const ry=isN?mix(extent(coreExtent,'y',lp(model.proteinCenter).y),extent(arcExtent,'y',lp(model.arcCenter).y),arc):extent(focusExtent,'y',f.y);
  attrs(loc.ring,{cx:fmt(f.x),cy:fmt(f.y),rx:fmt(rx),ry:fmt(ry)});
  const fp=focusedPoints.map(project),fb={minX:Math.min(...fp.map(p=>p.x)),maxX:Math.max(...fp.map(p=>p.x)),minY:Math.min(...fp.map(p=>p.y)),maxY:Math.max(...fp.map(p=>p.y))};
  model.view={mode:close>.02?'focus':'overview',magnification,focus:{kind:isN?(arc>.5?'nucleosomal-dna-arc':'histone-octamer'):'loaded-transposon-end',sourceCenter:focus.slice(),pointCount:focusedPoints.length,bounds:fb,sourceIndices:isN&&arc>.5?model.sourceIndices:null},context:{neighboringGeometryRetained:true,clip:{x:60,y:201,width:1160,height:353}},locator:{visible:close>.02,opacity:amount*close,bounds:{x:76,y:278,width:244,height:177},ring:{cx:f.x,cy:f.y,rx,ry},source:model.source.pdb,pathCount:loc.items.length}};
  return model.bounds;
 }
 const labelPlans={};
 function placeCallouts(active,state,planning=false){
  const stage=Math.round(state.stage),plan=labelPlans[stage]||(labelPlans[stage]={});
  function placement(key,anchor,preferred){
   if(planning)plan[key]=local.suggest(key,{anchor,offset:preferred});
   return plan[key]||preferred;
  }
  const trans=clamp(state.stage-2),lg=active.labelGeometry;
  const avoid=[...lg.protein,...lg.dna].filter(p=>p.x>=60&&p.x<=1220&&p.y>=201&&p.y<=554).map(p=>[p.x,p.y,6]);
  if(active.cartoonBounds)avoid.push(...active.cartoonBounds.obstaclePoints.map(p=>[p.x,p.y,p.radius]));
  const close=active.view.mode==='focus';if(close)avoid.push({x:76,y:278,width:244,height:244});
  local.begin(avoid);
  const side=(key,points,right,alpha,dy=0)=>{
   if(!points.length)return;
   const center=mean(points.map(p=>[p.x,p.y,0])),edge=points.reduce((a,b)=>right?(b.x>a.x?b:a):(b.x<a.x?b:a));
   const widths={'nuc-dna':174,'nuc-core':174,'dna-arc':174,'tn5-protein':152,'tn5-ends':156,'loaded-end':204};
   const width=widths[key]||98;
   local.place(key,{anchor:[edge.x,edge.y],offset:placement(key,[edge.x,edge.y],[right?22:-width-22,dy-20]),opacity:alpha});
  };
  const at=i=>smooth(clamp(1-Math.abs(state.stage-i)/.22));
  if(trans<.5){
   side('nuc-dna',lg.dna,false,at(0));side('nuc-core',lg.core,true,at(0));
   ['H3','H4','H2A','H2B'].forEach((role,i)=>side('family-'+role,lg.families[role],i%2===1,at(1),i<2?-60:60));
   side('dna-arc',lg.arc,true,at(2),-55);
  }else{
   side('tn5-protein',lg.protein,false,at(3));side('tn5-ends',lg.dna,true,at(3));side('loaded-end',lg.end,true,at(4),-54);
  }
 }
 function paint(input={}){
  if(disposed)return null;
  const state={visibility:clamp(input.visibility),stage:Math.max(0,Math.min(4,Number(input.stage)||0)),turn:Number(input.turn)||0,zoom:Math.max(.5,Math.min(2,Number.isFinite(input.zoom)?input.zoom:1))};
  opacity(root,state.visibility);if(state.visibility<.001&&!input.prepareHidden){lastState={...state,source:null};return lastState;}
  const trans=clamp(state.stage-2),namount=1-trans;
  stages.forEach((g,i)=>opacity(g,clamp(1-Math.abs(state.stage-i))));opacity(provenanceN,namount*(1-clamp(1-Math.abs(state.stage-1))));opacity(provenanceT,trans);
  const nb=render(nuc,state,namount),tb=render(tn5,state,trans);
  const active=trans>.5?tn5:nuc;placeCallouts(active,state);
  lastState={...state,source:trans>.5?'1MUH':'1KX5',bounds:trans>.5?tb:nb,registration:active.registration,proteinRegistration:active.proteinRegistration,callouts:local.snapshots,...(trans>.5?tn5.view:nuc.view),chainCounts:{nucleosome:AtacStructures.nucleosome.chains.length,transposome:AtacStructures.transposome.chains.length},representation:'C-alpha and C4-prime traces with base centroids',geometryConserved:true};return lastState;
 }
 function setView(view=null){
  const scale=view?.scale??1,from=view?.from||[0,0],to=view?.to||[0,0],detail=view?.detail??1;
  attrs(molecular,{transform:`matrix(${scale} 0 0 ${scale} ${to[0]-scale*from[0]} ${to[1]-scale*from[1]})`});
  // Labels stay in the page coordinate system while molecular geometry moves.
  opacity(legend,detail);opacity(locatorLayer,detail);
  opacity(provenanceN,(1-clamp((lastState?.stage??0)-2))*(1-clamp(1-Math.abs((lastState?.stage??0)-1)))*detail);
  opacity(provenanceT,clamp((lastState?.stage??0)-2)*detail);
 }
 // Plan fixed relative offsets at the five authored destination views.
 // Playback only interpolates/fades; it never switches label sides abruptly.
 [0,22,68,0,25].forEach((turn,stage)=>{
  const model=stage<3?nuc:tn5,state={stage,turn,zoom:1};render(model,state,1);placeCallouts(model,state,true);
 });
 paint();
 return{g:root,paint,setView,nodes,dispose(){if(disposed)return;disposed=true;local.dispose();labels.forEach(b=>b.dispose());root.remove();}};
}
global.AtacStructureViews=Object.freeze({create});
})(window);
