/* Compact copies of the deposited 1MUH synaptic complex. Every retained
 * C-alpha/C4-prime vertex is shared with the structural close-up. Placement
 * beside genomic DNA is illustrative: 1MUH has no genomic target or full
 * ATAC adapters. A trace is not a molecular surface or an atomic bond model. */
(function(global){
 'use strict';
 const fmt=n=>Number(n.toFixed(5));
 const distance=(a,b)=>Math.hypot(...a.map((n,i)=>n-b[i]));
 const mean=ps=>ps.reduce((a,p)=>a.map((v,i)=>v+p[i]),[0,0,0]).map(v=>v/ps.length);
 const bounds=ps=>({minX:Math.min(...ps.map(p=>p.x)),maxX:Math.max(...ps.map(p=>p.x)),minY:Math.min(...ps.map(p=>p.y)),maxY:Math.max(...ps.map(p=>p.y))});
 function rotate(p,center){
  const [x,y,z]=p.map((v,i)=>v-center[i]),ca=Math.cos(-.6),sa=Math.sin(-.6),cb=Math.cos(.15),sb=Math.sin(.15),cc=Math.cos(-.12),sc=Math.sin(-.12);
  const X=x*ca+z*sa,Z=-x*sa+z*ca,Y=y*cb-Z*sb,Z2=y*sb+Z*cb;
  return[X*cc-Y*sc,X*sc+Y*cc,Z2];
 }
 function overview(){
  const source=global.AtacStructures?.transposome;
  if(source?.pdb!=='1MUH')throw new Error('AtacTn5Cartoon requires verified 1MUH coordinates');
  const all=source.chains.flatMap(c=>c.points),center=mean(all),rot=all.map(p=>rotate(p,center));
  const rb=bounds(rot.map(p=>({x:p[0],y:p[1]}))),scale=Math.min(540/(rb.maxX-rb.minX),322/(rb.maxY-rb.minY));
  const offset=[(rb.minX+rb.maxX)/2,(rb.minY+rb.maxY)/2],maxDepth=Math.max(...rot.map(p=>Math.abs(p[2])));
  const project=p=>{const q=rotate(p,center);return{x:643+(q[0]-offset[0])*scale,y:377-(q[1]-offset[1])*scale,z:q[2],depth:q[2]};};
  const pb=bounds(source.chains.filter(c=>c.kind==='protein').flatMap(c=>c.points.map(project)));
  return{source,project,maxDepth,proteinCenter:[(pb.minX+pb.maxX)/2,(pb.minY+pb.maxY)/2]};
 }
 function create(parent,make){
  const view=overview(),C=global.C,source=view.source,parts=[],localScale=.19;
  const project=p=>{const q=view.project(p);return{x:(q.x-view.proteinCenter[0])*localScale,y:(q.y-view.proteinCenter[1])*localScale-30,z:q.z,depth:q.depth};};
  const proteinLandmarks=[],dnaLandmarks=[],allPoints=[];
  source.chains.forEach((chain,ci)=>{
   const dna=chain.kind==='dna',color=dna?(/2|B/.test(String(chain.end||chain.duplex||chain.group||chain.role))?C.teal:C.gold):(/B|2/.test(chain.role)||ci%2?C.purple:C.red);
   chain.points.forEach((p,index)=>{const q=project(p);(dna?dnaLandmarks:proteinLandmarks).push({chain:chain.id,index,point:[q.x,q.y]});allPoints.push(q);});
   const limit=dna?1:2,breaks=new Set(chain.breaks||[]);
   for(let i=0;i<chain.points.length-1;){
    const end=Math.min(chain.points.length-1,i+limit),ps=chain.points.slice(i,end+1);
    if((chain.breaks||[]).some(b=>b>i&&b<=end)||ps.some((p,j)=>j&&distance(p,ps[j-1])>(dna?11:7))){i=end;continue;}
    const node=make('g',{'data-source-pdb':'1MUH','data-chain':chain.id,'data-role':chain.role,'data-kind':chain.kind,'data-start-index':i,'data-end-index':end,'data-tn5-trace':''},parent);
    const p=ps.map(project),z=p.reduce((a,q)=>a+q.z,0)/p.length,back=Math.max(0,Math.min(1,.5+z/(view.maxDepth*2)));
    let d='M'+fmt(p[0].x)+','+fmt(p[0].y);
    for(let j=1;j<p.length;j++){
     const at=i+j,a=p[j-1],b=p[j],prev=at-2>=0&&!breaks.has(at-1)?project(chain.points[at-2]):a,next=at+1<chain.points.length&&!breaks.has(at+1)?project(chain.points[at+1]):b;
     d+=' C'+fmt(a.x+(b.x-prev.x)/6)+','+fmt(a.y+(b.y-prev.y)/6)+' '+fmt(b.x-(next.x-a.x)/6)+','+fmt(b.y-(next.y-a.y)/6)+' '+fmt(b.x)+','+fmt(b.y);
    }
    const width=(dna?4.4:6.4)*localScale;
    const strokes=[['color-mix(in srgb, '+color+' 52%, var(--color-bg))',width,.95],[color,width*.76,.62+.36*back],[color,width*.22,.35+.3*back]];
    strokes.forEach(([stroke,w,alpha])=>make('path',{d,fill:'none',stroke,'stroke-width':w,'stroke-opacity':alpha,'stroke-linecap':'round','stroke-linejoin':'round'},node));
    node.style.opacity=dna?'1':'.9';parts.push({node,z,dna,alpha:dna?1:.9});i=end;
   }
   if(dna&&chain.basePoints)for(let i=0;i<chain.points.length;i+=2){
    if(!Array.isArray(chain.basePoints[i]))continue;
    spoke([chain.sugarPoints?.[i]||chain.points[i],chain.basePoints[i]],color,chain.id);
   }
  });
  function spoke(ps,color,chain){
   const p=ps.map(project),z=p.reduce((a,q)=>a+q.z,0)/p.length;
   const node=make('path',{d:p.map((q,i)=>(i?'L':'M')+fmt(q.x)+','+fmt(q.y)).join(' '),fill:'none',stroke:color,'stroke-width':1.9*localScale,'stroke-linecap':'round','data-source-pdb':'1MUH','data-kind':'dna-base-spoke',...(chain?{'data-chain':chain}:{})},parent);
   node.style.opacity='.72';parts.push({node,z,dna:true,alpha:.72});
  }
  for(const pair of source.basePairs||[]){
   const a=source.chains.find(c=>c.id===pair.chainA)?.basePoints?.[pair.indexA],b=source.chains.find(c=>c.id===pair.chainB)?.basePoints?.[pair.indexB];
   if(a&&b)spoke([a,b],C.grey);
  }
  parts.sort((a,b)=>a.z-b.z).forEach(p=>parent.appendChild(p.node));
  const pb=bounds(proteinLandmarks.map(p=>({x:p.point[0],y:p.point[1]}))),ab=bounds(allPoints);
  let lastDNA=null;
  function place(x,y,dnaOpacity=1){
   parent.setAttribute('transform',`translate(${fmt(x)} ${fmt(y)})`);
   if(dnaOpacity!==lastDNA){parts.filter(p=>p.dna).forEach(p=>p.node.style.opacity=String(p.alpha*dnaOpacity));lastDNA=dnaOpacity;}
   const move=b=>({minX:b.minX+x,maxX:b.maxX+x,minY:b.minY+y,maxY:b.maxY+y});
   const proteinBounds=move(pb),allBounds=move(ab);
   return{source:'1MUH',representation:'deposited C-alpha and C4-prime traces',containsTargetDNA:false,containsFullAdapters:false,bounds:proteinBounds,allBounds,center:[(pb.minX+pb.maxX)/2+x,(pb.minY+pb.maxY)/2+y],diagonal:Math.hypot(pb.maxX-pb.minX,pb.maxY-pb.minY),landmarks:proteinLandmarks.map(p=>({...p,point:[p.point[0]+x,p.point[1]+y]})),dnaLandmarks:dnaLandmarks.map(p=>({...p,point:[p.point[0]+x,p.point[1]+y]})),proteinChains:source.chains.filter(c=>c.kind==='protein').map(c=>c.id),proteinPointCount:proteinLandmarks.length,dnaPointCount:dnaLandmarks.length};
  }
  return{place,source:'1MUH',parts:parts.length};
 }
 global.AtacTn5Cartoon=Object.freeze({create,overview});
})(window);
