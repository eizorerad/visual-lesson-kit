/* Deposited heavy atoms as opaque van der Waals spheres with per-pixel depth.
 * Growth reveals a representation; it never changes source coordinates. */
(function(g){
'use strict';
const DATA=TRNA_SPACEFILL_DATA,clamp=x=>Math.max(0,Math.min(1,x||0));
const region=id=>id<=7||id>=66?'blue':id<=26?'teal':id<=43?'gold':id<=48?'grey':'purple';
const semantic={blue:'primary',teal:'secondary',gold:'focus',grey:'muted',purple:'auxiliary'};
const defaults={blue:[.4,.73,.88],teal:[.38,.79,.71],gold:[.89,.72,.33],grey:[.59,.58,.63],purple:[.67,.6,.83]};
function create(parent){
 const root=F.group(parent),metadata=F.group(root),viewport={x:60,y:188,width:1160,height:422};
 root.dataset.trnaSpacefill='1EHZ';root.dataset.spacefillCount=String(DATA.atoms.length);
 // Persistent SVG records preserve atom IDs and precise projected geometry for audits.
 // They are not painted: overlapping spheres require a shared surface depth buffer.
 metadata.setAttribute('display','none');metadata.setAttribute('aria-hidden','true');
 const host=D.dom.s('foreignObject',{...viewport,'pointer-events':'none'});root.append(host);
 const renderer=TrnaSphereRenderer.create(host,viewport);
 const actors=DATA.atoms.map(atom=>{
  const dot=F.dot(metadata,0,0,0,'none');
  dot.dataset.spacefillAtom=String(atom.id);dot.dataset.spacefillResidue=String(atom.residue);dot.dataset.spacefillElement=atom.element;
  const title=D.dom.s('title');title.textContent=`1EHZ · ${atom.component}${atom.residue} · ${atom.name}`;dot.append(title);
  return {atom,dot,center:[0,0,0],radius:0,color:defaults[region(atom.residue)]};
 });
 let lastKey=null,lastCamera=null,lastAmount=0,palette={...defaults},disposed=false;
 function readColors(){
  const styles=g.getComputedStyle(document.documentElement);
  for(const [name,token] of Object.entries(semantic)){
   const value=styles.getPropertyValue('--color-'+token).trim();
   if(/^#[0-9a-f]{6}$/i.test(value))palette[name]=[1,3,5].map(i=>parseInt(value.slice(i,i+2),16)/255);
   else if(/^rgb/.test(value)){const parts=value.match(/[\d.]+/g);if(parts?.length>=3)palette[name]=parts.slice(0,3).map(x=>Number(x)/255);}
  }
 }
 function render(camera,amount=0){
  if(disposed)return {count:actors.length};
  amount=clamp(amount);lastCamera=camera;lastAmount=amount;root.style.display=amount>0?'':'none';F.opacity(root,F.phase(amount,0,.32));
  if(!amount)return {count:actors.length};
  const key=JSON.stringify(camera)+';'+amount;if(key===lastKey)return {count:actors.length};
  const project=TrnaAtoms.projector(camera),radiusProgress=F.phase(amount,.12,1);
  actors.forEach(o=>{const p=project(o.atom.xyz),r=DATA.radii[o.atom.element]*camera.scale*F.lerp(.12,1,radiusProgress);
   F.pos(o.dot,p[0],p[1]);o.dot.setAttribute('r',r);o.center=[p[0],p[1],p[2]*camera.scale];o.radius=r;o.color=palette[region(o.atom.residue)];
  });
  renderer.draw(actors);root.dataset.spacefillAmount=String(amount);lastKey=key;return {count:actors.length};
 }
 readColors();
 const observer=new MutationObserver(()=>{if(disposed)return;readColors();lastKey=null;if(lastCamera&&lastAmount>0)render(lastCamera,lastAmount);});
 observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-background','data-palette','style']});
 return {g:root,render,actors,renderer,dispose(){if(disposed)return;disposed=true;observer.disconnect();renderer.dispose();}};
}
g.TrnaSpacefill=Object.freeze({create,data:DATA,region});
})(window);
