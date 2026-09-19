/* Compact protein cartoons from deposited 1KX5 helix assignments and C-alpha
 * loops. Cylinder radii are explanatory, not a solvent/van der Waals surface. */
(function(global){
 'use strict';
 const line=ps=>ps.map((p,i)=>(i?'L':'M')+p.x.toFixed(3)+','+p.y.toFixed(3)).join(' ');
 function create(parent,make){
  const data=global.AtacHistoneCoreData;
  if(!data?.chains||data.chains.length!==8)throw new Error('A verified eight-chain histone core is required');
  const C=global.C,colors={H2A:C.purple,H2B:C.red,H3:C.gold,H4:C.white},parts=[];
  let order=[];
  function part(chain,points,kind,detail={}){
   const role=Object.keys(colors).find(k=>chain.role.includes(k)),color=colors[role];
   const node=make('g',{'data-histone-chain':chain.id,'data-histone-role':role,'data-histone-part':parts.length,'data-protein-cartoon':kind,...(kind==='tail'?{'data-tail-end':detail.end,'data-zero-occupancy':String(detail.uncertain)}:{})},parent);
   const paths=[
    make('path',{fill:'none',stroke:'color-mix(in srgb, '+color+' 42%, var(--color-bg))'},node),
    make('path',{fill:'none',stroke:color},node),
    make('path',{fill:'none',stroke:C.white,'stroke-opacity':kind==='helix'?.26:.12},node)
   ];
   paths.forEach(n=>{n.setAttribute('stroke-linecap','round');n.setAttribute('stroke-linejoin','round');});
   parts.push({node,paths,points,kind,...detail,order:parts.length,z:0});
  }
  data.chains.forEach(chain=>{
   const membership=new Map(),breaks=new Set(chain.breaks||[]),tailEdges=new Set();
   for(const tail of chain.tails||[])for(let i=tail.startIndex;i<tail.endIndex;i++)tailEdges.add(i);
   chain.helices.forEach((h,hi)=>{
    part(chain,[h.axisStart,h.axisEnd],'helix');
    for(let i=h.startIndex;i<=h.endIndex;i++)membership.set(i,hi);
   });
   const loopEdge=i=>i<chain.points.length-1&&!breaks.has(i+1)&&!tailEdges.has(i)&&!(membership.has(i)&&membership.get(i)===membership.get(i+1));
   for(let i=0;i<chain.points.length-1;){
    if(!loopEdge(i)){i++;continue;}
    const points=[chain.points[i]];
    // Keep every source vertex, batching only contiguous loop edges. Bounded
    // runs retain useful depth sorting while avoiding hundreds of tiny paths.
    do{points.push(chain.points[++i]);}while(points.length<7&&loopEdge(i));
    part(chain,points,'loop');
   }
   const uncertain=i=>chain.occupancies[i]===0||chain.occupancies[i+1]===0;
   for(const tail of chain.tails||[])for(let i=tail.startIndex;i<tail.endIndex;){
    if(breaks.has(i+1)){i++;continue;}
    const weak=uncertain(i),points=[chain.points[i]];
    do{points.push(chain.points[++i]);}while(i<tail.endIndex&&points.length<7&&!breaks.has(i+1)&&uncertain(i)===weak);
    part(chain,points,'tail',{end:tail.end,uncertain:weak});
   }
  });
  function paint(project,scale){
   const all=[],obstaclePoints=[];
   parts.forEach(part=>{
    const ps=part.points.map(project),d=line(ps),helix=part.kind==='helix';
    part.z=ps.reduce((n,p)=>n+p.depth,0)/ps.length;
    const widths=helix?[7.6,6.2,.9]:part.kind==='tail'?[3.5,2.45,.45]:[2.5,1.65,.35];
    // A round cap extends by half a stroke width at both ends. Keep the
    // gap wider than even the under-stroke so uncertainty stays visible.
    part.paths.forEach((path,i)=>{path.setAttribute('d',d);path.setAttribute('stroke-width',String(widths[i]*scale));if(part.uncertain)path.setAttribute('stroke-dasharray',`${4*scale} ${5*scale}`);});
    part.node.style.opacity=part.uncertain?'.78':'1';
    part.paths[2].setAttribute('transform',`translate(${-scale*.55} ${-scale*.55})`);
    all.push(...ps.map(p=>({...p,r:widths[0]*scale/2})));
    for(let i=1;i<ps.length;i++){
     const a=ps[i-1],b=ps[i],steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/4));
     for(let j=0;j<=steps;j++)obstaclePoints.push({x:a.x+(b.x-a.x)*j/steps,y:a.y+(b.y-a.y)*j/steps,radius:widths[0]*scale/2+1});
    }
   });
   const next=parts.slice().sort((a,b)=>a.z-b.z||a.order-b.order);
   if(next.some((p,i)=>p!==order[i])){next.forEach(p=>parent.appendChild(p.node));order=next;}
   // The teaching label follows a deposited, positive-occupancy H3 tail
   // residue, rather than an invented point beside the octamer.
   const h3=data.chains.find(c=>c.id==='G'),tailAnchor=project(h3.points[h3.residues.indexOf(12)]);
   return {minX:Math.min(...all.map(p=>p.x-p.r)),maxX:Math.max(...all.map(p=>p.x+p.r)),minY:Math.min(...all.map(p=>p.y-p.r)),maxY:Math.max(...all.map(p=>p.y+p.r)),parts:parts.length,tailAnchor:[tailAnchor.x,tailAnchor.y],obstaclePoints};
  }
  return {paint,source:data.pdb||'1KX5',chains:data.chains.map(c=>({id:c.id,role:c.role})),representation:'deposited-helix cylinders, C-alpha loops and terminal traces; zero-occupancy segments dashed'};
 }
 global.AtacHistoneCartoon=Object.freeze({create});
})(window);
