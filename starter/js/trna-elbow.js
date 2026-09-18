/* Source-coordinate base view of the D/T elbow. No hydrogen positions or folding dynamics. */
(function(g){
'use strict';
const DATA=TRNA_ELBOW_DATA,ROWS=new Map(DATA.residues.map(r=>[r.id,r]));
const ringNames=id=>[...new Set(DATA.ring_atom_orders[ROWS.get(id).component].flat())];
const centers=new Map(DATA.residues.map(r=>[r.id,[0,1,2].map(i=>ringNames(r.id).reduce((v,n)=>v+r.atoms[n][i],0)/ringNames(r.id).length)]));
const mean=ids=>[0,1,2].map(i=>ids.reduce((sum,id)=>sum+centers.get(id)[i],0)/ids.length);
const sub=(a,b)=>a.map((v,i)=>v-b[i]),norm=a=>{const d=Math.hypot(...a);return a.map(v=>v/d);},cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const x=norm(sub(centers.get(56),centers.get(19))),ga=ROWS.get(19).atoms;
const normal=norm(cross(sub(ga.C6,ga.N1),sub(ga.N3,ga.N1))),y=norm(cross(normal,x)),z=norm(cross(x,y));
const BASIS=[x,y,z],color=id=>id<30?C.teal:C.purple;
const clamp=x=>Math.max(0,Math.min(1,x||0));
function camera(s,initial){
 const t=clamp(s.elbowAtoms),second=clamp(s.elbowSecond),stack=clamp(s.elbowStack);
 let center=mean([19,56]);center=center.map((v,i)=>F.lerp(v,mean([18,19,55,56])[i],second));
 center=center.map((v,i)=>F.lerp(v,mean([18,19,54,55,56,57,58])[i],stack));
 return {...initial,origin:initial.origin.map((v,i)=>F.lerp(v,center[i],t)),basis:TrnaWorld.mixBasis(initial.basis,BASIS,t),
  scale:F.lerp(initial.scale,F.lerp(36,34,stack),t),angle:F.lerp(initial.angle,58*stack,t),tilt:F.lerp(initial.tilt,18*stack,t)};
}
function create(parent){
 const root=F.group(parent),parts=[];root.dataset.trnaElbow='1EHZ';
 function add(el,refs,type){parts.push({el,refs,type});root.append(el);return el;}
 DATA.residues.forEach(r=>{
  const rings=DATA.ring_atom_orders[r.component],names=Object.keys(r.atoms).filter(n=>!n.includes("'")&&n!=='P'&&!n.startsWith('OP'));
  const seen=new Set();rings.forEach(ring=>{
   add(D.dom.s('polygon',{fill:color(r.id),'fill-opacity':.23,stroke:'none'}),ring.map(n=>[r.id,n]),'ring');
   ring.forEach((a,i)=>{const b=ring[(i+1)%ring.length],key=[a,b].sort().join(':');if(seen.has(key))return;seen.add(key);add(F.line(root,0,0,0,0,color(r.id),2.1),[[r.id,a],[r.id,b]],'bond');});
  });
  // Exocyclic bonds are taken from the source component topology, including methyl modifications.
  for(const [a,b] of DATA.exocyclic_bonds[r.component])add(F.line(root,0,0,0,0,color(r.id),2.1),[[r.id,a],[r.id,b]],'bond');
  for(const n of names){const dot=add(F.dot(root,0,0,3.2,color(r.id)),[[r.id,n]],'atom');dot.dataset.elbowAtom=r.id+':'+n;
   dot.setAttribute('stroke','var(--color-bg)');dot.setAttribute('stroke-width','.7');
   const title=D.dom.s('title');title.textContent='1EHZ · '+r.component+r.id+' · '+n;dot.append(title);
  }
 });
 const refs=[[[19,'O6'],[56,'N4']],[[19,'N1'],[56,'N3']],[[19,'N2'],[56,'O2']],[[18,'N1'],[55,'O4']],[[18,'N2'],[55,'O4']]];
 refs.forEach(r=>{const el=add(F.line(root,0,0,0,0,C.gold,2.2,'4 5'),r,'contact');el.dataset.elbowContact=r.map(a=>a.join(':')).join('-');});
 function render(s,camera){
  const reveal=clamp(s.elbowAtoms),second=clamp(s.elbowSecond),stack=clamp(s.elbowStack),project=TrnaAtoms.projector(camera);
  F.opacity(root,reveal);root.style.display=reveal>0?'':'none';
  const center=id=>project(centers.get(id)),atom=(id,n)=>project(ROWS.get(id).atoms[n]);
  if(!reveal)return {center,atom};
  const opacity=id=>[19,56].includes(id)?F.lerp(1,.25,second*(1-stack)):[18,55].includes(id)?F.lerp(.05,1,second):F.lerp(.025,1,stack);
  const order=[];parts.forEach(a=>{
   const ps=a.refs.map(([id,n])=>atom(id,n));let alpha=Math.min(...a.refs.map(([id])=>opacity(id)));
   if(a.type==='ring')a.el.setAttribute('points',ps.map(p=>p.slice(0,2).join(',')).join(' '));
   else if(a.type==='atom')F.pos(a.el,ps[0][0],ps[0][1]);
   else F.seg(a.el,...ps[0].slice(0,2),...ps[1].slice(0,2));
   if(a.type==='contact')alpha*=F.phase(reveal,.65,1)*(a.refs[0][0]===18?second:1)*F.lerp(1,.45,stack);
   F.opacity(a.el,alpha);order.push({el:a.el,z:ps.reduce((sum,p)=>sum+p[2],0)/ps.length,type:a.type});
  });
  order.sort((a,b)=>a.z-b.z||(a.type==='atom')-(b.type==='atom'));
  let cursor=root.firstElementChild;for(const a of order){if(a.el===cursor)cursor=cursor.nextElementSibling;else root.insertBefore(a.el,cursor);}
  return {center,atom};
 }
 return {g:root,render};
}
g.TrnaElbow=Object.freeze({create,camera,basis:BASIS,center:id=>centers.get(id).slice(),data:DATA});
})(window);
