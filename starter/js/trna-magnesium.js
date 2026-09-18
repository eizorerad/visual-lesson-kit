/* One deposited Mg site and its six water O atoms in the same source camera.
 * Atom balls are illustrative symbols, not van der Waals radii. Dashes mark
 * coordination/proximity; only source-curated phosphate links are covalent.
 * Atmospheric dots and field arcs are explicitly illustrative, not source ions. */
(function(g){
'use strict';
const DATA=TRNA_MAGNESIUM_DATA,clamp=x=>Math.max(0,Math.min(1,x||0));
const defaults={gold:[.89,.72,.33],teal:[.38,.79,.71],blue:[.4,.73,.88]};
const semantic={gold:'focus',teal:'secondary',blue:'primary'};
const ATOMS=[DATA.magnesium,...DATA.waters,...DATA.phosphateGroups.flatMap(p=>p.atoms)];
const BY_ID=new Map(ATOMS.map(a=>[a.id,a]));
const CHARGE_IDS=new Set([2,5,8,11,14,18,22,26,29,33,36,40,43,47,50,54,58,61,65,69,73,76]);
function create(parent){
 const root=F.group(parent),fields=F.group(root),cloud=F.group(root),charges=F.group(root),guides=F.group(root),metadata=F.group(root);
 root.dataset.trnaMagnesium='1EHZ';root.dataset.magnesiumSite=String(DATA.magnesium.residue);
 fields.dataset.magnesiumFields='illustrative';cloud.dataset.magnesiumAtmosphere='illustrative';charges.dataset.magnesiumCharges='source-P';
 metadata.setAttribute('display','none');metadata.setAttribute('aria-hidden','true');
 const viewport={x:60,y:188,width:1160,height:422},host=D.dom.s('foreignObject',{...viewport,'pointer-events':'none'});root.append(host);
 const renderer=TrnaSphereRenderer.create(host,viewport),selection=F.dot(root,0,0,11,'none');
 selection.dataset.magnesiumSelection=String(DATA.magnesium.id);selection.setAttribute('stroke',C.gold);selection.setAttribute('stroke-width','1.7');
 const chargeActors=DATA.phosphates.filter(a=>CHARGE_IDS.has(a.residue)).map((atom,i)=>{
  const q=F.group(charges);q.dataset.phosphateCharge=String(atom.id);
  const back=F.dot(q,0,0,7.1,'var(--color-bg)');back.setAttribute('fill-opacity','.91');
  F.line(q,-3.7,0,3.7,0,C.blue,1.85);
  let field=null;if(i%4===1){field=D.dom.s('path',{fill:'none',stroke:C.blue,'stroke-width':1.3,'stroke-linecap':'round'});fields.append(field);}
  return {atom,q,field};
 });
 const mean=[0,1,2].map(k=>DATA.phosphates.reduce((n,a)=>n+a.xyz[k],0)/DATA.phosphates.length);
 const cloudActors=DATA.phosphates.filter((a,i)=>i%2===0).map((atom,i)=>{
  // Fixed illustrative positions travel with the camera, not with a simulation.
  const d=atom.xyz.map((v,k)=>v-mean[k]),length=Math.hypot(...d)||1,theta=i*2.399963229728653;
  const xyz=atom.xyz.map((v,k)=>v+d[k]/length*(4.8+2.5*(i%3)/2)+[Math.cos(theta)*2,Math.sin(theta)*2,Math.sin(theta*.7)*3][k]);
  const q=F.group(cloud),dot=F.dot(q,0,0,i%3===0?3.5:2.6,C.gold);q.dataset.illustrativeIon=String(i);
  dot.setAttribute('fill-opacity',i%3===0?'.74':'.45');return {xyz,q};
 });
 const records=[...BY_ID.values()].map(atom=>{
  const kind=atom.id===DATA.magnesium.id?'magnesium':DATA.waters.some(w=>w.id===atom.id)?'water':'phosphate';
  const dot=F.dot(metadata,0,0,0,'none');dot.dataset.magnesiumAtom=String(atom.id);dot.dataset.magnesiumKind=kind;dot.dataset.magnesiumElement=atom.element;
  const title=D.dom.s('title');title.textContent=`1EHZ · ${atom.component}${atom.residue} · ${atom.name}`;dot.append(title);
  return {atom,kind,dot,center:[0,0,0],radius:0,color:defaults[kind==='magnesium'?'gold':kind==='water'?'teal':'blue']};
 });
 const links=[];
 function link(atomIds,kind,distance){
  const color=kind==='coordination'?C.gold:kind==='water-phosphate'?C.teal:C.blue;
  const el=F.line(guides,0,0,0,0,color,kind==='covalent'?2.8:2.05,kind==='coordination'?'4 5':kind==='water-phosphate'?'2 5':undefined);
  el.dataset.magnesiumGuide=kind;el.dataset.atomIds=JSON.stringify(atomIds);el.setAttribute('stroke-linecap','round');
  if(kind==='covalent')el.removeAttribute('stroke-dasharray');
  if(distance!=null){el.dataset.distanceAngstrom=String(distance);const title=D.dom.s('title');title.textContent=distance.toFixed(3)+' Å';el.append(title);}
  links.push({el,atomIds,kind});
 }
 DATA.coordinationLinks.forEach(a=>link(a.atomIds,'coordination',a.distanceAngstrom));
 DATA.waterPhosphateContacts.forEach(a=>link(a.atomIds,'water-phosphate',a.distanceAngstrom));
 DATA.phosphateGroups.forEach(p=>p.covalentBonds.forEach(ids=>link(ids,'covalent')));
 let disposed=false,lastKey=null,lastCamera=null,lastState=null,palette={...defaults};
 function readColors(){
  const styles=g.getComputedStyle(document.documentElement);
  for(const [name,token] of Object.entries(semantic)){
   const value=styles.getPropertyValue('--color-'+token).trim();
   if(/^#[0-9a-f]{6}$/i.test(value))palette[name]=[1,3,5].map(i=>parseInt(value.slice(i,i+2),16)/255);
   else if(/^rgb/.test(value)){const parts=value.match(/[\d.]+/g);if(parts?.length>=3)palette[name]=parts.slice(0,3).map(x=>Number(x)/255);}
  }
 }
 function render(state={},camera){
  const project=TrnaAtoms.projector(camera),points=new Map([...BY_ID].map(([id,a])=>[id,project(a.xyz)]));
  const atom=id=>points.get(id)?.slice();
  const phosphates=DATA.phosphateGroups.map(p=>({id:p.id,center:atom(p.atoms.find(a=>a.name==='P').id),atoms:p.atoms.map(a=>({id:a.id,name:a.name,point:atom(a.id)}))}));
  const out={mg:atom(DATA.magnesium.id),waters:DATA.waters.map(a=>({id:a.id,residue:a.residue,point:atom(a.id)})),phosphates,atom,phosphate:id=>phosphates.find(p=>p.id===id)?.center.slice()};
  if(disposed)return out;
  const charge=clamp(state.mgCharge),atmosphere=clamp(state.mgAtmosphere),select=clamp(state.mgSelect),zoom=clamp(state.mgZoom),water=clamp(state.mgWater),bridge=clamp(state.mgBridge);
  const active=Math.max(charge,atmosphere,select,zoom,water,bridge),whole=1-F.phase(zoom,0,.25);
  root.style.display=active>0?'':'none';F.opacity(root,active);lastState={...state};lastCamera={...camera};
  if(!active)return out;
  const key=JSON.stringify(camera)+';'+[charge,atmosphere,select,zoom,water,bridge].join(',');if(key===lastKey)return out;
  F.opacity(charges,charge*whole);F.opacity(fields,charge*whole*F.lerp(.55,.12,atmosphere));F.opacity(cloud,atmosphere*whole);
  for(const a of chargeActors){
   const p=project(a.atom.xyz);F.at(a.q,p[0],p[1]);
   if(a.field){const [x,y]=p;a.field.setAttribute('d',`M${x-11},${y-11}Q${x-20},${y} ${x-11},${y+11}M${x+11},${y-11}Q${x+20},${y} ${x+11},${y+11}`);}
  }
  cloudActors.forEach(a=>{const p=project(a.xyz);F.at(a.q,p[0],p[1]);});
  const waterGrow=F.phase(water,0,.85)*F.phase(zoom,.45,1),bridgeGrow=F.phase(bridge,.58,1)*F.phase(zoom,.45,1);
  for(const a of records){
   const p=points.get(a.atom.id);a.center=[p[0],p[1],p[2]*camera.scale];
   a.radius=a.kind==='magnesium'?F.lerp(5.5,20,zoom)*select:a.kind==='water'?12*waterGrow:(a.atom.element==='P'?8.5:5.6)*bridgeGrow;
   a.color=palette[a.kind==='magnesium'?'gold':a.kind==='water'?'teal':'blue'];F.pos(a.dot,p[0],p[1]);a.dot.setAttribute('r',a.radius);
  }
  for(const a of links){
   const ps=a.atomIds.map(id=>points.get(id));F.seg(a.el,...ps[0].slice(0,2),...ps[1].slice(0,2));a.el.dataset.endpoints=JSON.stringify(ps);
   F.opacity(a.el,a.kind==='coordination'?waterGrow*.77:a.kind==='water-phosphate'?bridgeGrow*waterGrow:bridgeGrow);
  }
  renderer.draw(records);F.pos(selection,out.mg[0],out.mg[1]);selection.setAttribute('r',F.lerp(11,27,zoom));F.opacity(selection,select*F.lerp(1,.28,zoom));
  root.dataset.magnesiumZoom=String(zoom);root.dataset.magnesiumWater=String(water);root.dataset.magnesiumBridge=String(bridge);lastKey=key;return out;
 }
 readColors();
 const observer=new MutationObserver(()=>{if(disposed)return;readColors();lastKey=null;if(lastCamera&&lastState)render(lastState,lastCamera);});
 observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-background','data-palette','style']});
 return {g:root,render,renderer,actors:records,dispose(){if(disposed)return;disposed=true;observer.disconnect();renderer.dispose();}};
}
g.TrnaMagnesium=Object.freeze({create,data:DATA});
})(window);
