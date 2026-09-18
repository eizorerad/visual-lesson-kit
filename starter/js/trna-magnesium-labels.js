/* Biological annotations for the magnesium episode. Source geometry lives in the actor. */
(function(g){
'use strict';
function create(parent,box){
 const root=F.group(parent),full=F.group(root),charge=F.group(full),atmosphere=F.group(full),selection=F.group(full),close=F.group(root),shell=F.group(close),bridge=F.group(close);
 box(charge,76,252,237,127,'Фосфаты:\nотрицательный\nзаряд','Phosphates:\nnegative\ncharge',24,C.blue);
 box(atmosphere,941,250,269,127,'Ионы экранируют\nотталкивание','Ions screen\nrepulsion',24,C.gold);
 box(atmosphere,941,462,269,102,'Ионная атмосфера\nСхема среды','Ion atmosphere\nEnvironment schematic',21,C.grey);
 box(atmosphere,76,459,237,90,'Заряд фосфатов\nсохраняется','Phosphate charges\nremain',22,C.blue);
 const selectLine=F.line(selection,0,0,0,0,C.gold,1.3);
 box(selection,943,280,267,114,'Один Mg²⁺\nв структуре 1EHZ','One Mg²⁺\nin structure 1EHZ',24,C.gold);
 box(selection,943,461,267,105,'Рядом с остовом\nостатков 8–12','Near the backbone\nof residues 8–12',22,C.grey);
 box(close,76,452,237,80,'Тот же Mg²⁺\nи та же тРНК','The same Mg²⁺\nand the same tRNA',22,C.gold);
 box(shell,946,226,261,114,'6 кислородов\nводы','6 water\noxygen atoms',25,C.teal);
 box(shell,946,402,261,150,'Mg–O ≈ 2,0 Å\nВодороды\nопущены','Mg–O ≈ 2.0 Å\nHydrogens\nomitted',23,C.grey);
 box(bridge,944,214,264,138,'Фосфаты РНК\nU8 · C11 · U12','RNA phosphates\nU8 · C11 · U12',24,C.blue);
 box(bridge,944,424,264,143,'Вода ↔ фосфаты\nO···O: 2,72–2,95 Å','Water ↔ phosphates\nO···O: 2.72–2.95 Å',22,C.teal);
 const fragmentLabels=F.group(close),residueLabels=[[11,'C11'],[12,'U12']].map(([id,name])=>{
  const label=box(fragmentLabels,0,0,60,29,name,name,19,C.blue);label.el.dataset.magnesiumResidueLabel=String(id);return {id,label};
 });
 const mgLabel=box(root,0,0,72,32,'Mg²⁺','Mg²⁺',19,'var(--color-bg)');
 function paint(s,out){
  const q=s.mgCharge||0,z=s.mgZoom||0,a=s.mgAtmosphere||0,select=s.mgSelect||0,b=s.mgBridge||0;
  const fullAlpha=F.phase(q,.65,1)*(1-F.phase(z,0,.35)),closeAlpha=F.phase(z,.75,1)*(s.mgWater||0);
  F.opacity(full,fullAlpha);F.opacity(atmosphere,F.phase(a,.6,1)*(1-F.phase(select,0,.4)));F.opacity(selection,F.phase(select,.6,1));
  F.opacity(close,closeAlpha);F.opacity(shell,1-F.phase(b,0,.4));F.opacity(bridge,F.phase(b,.6,1));
  F.opacity(fragmentLabels,F.phase(b,.7,1));
  F.opacity(mgLabel.el,closeAlpha);
  if(out.mgView){const p=out.mgView.mg;mgLabel.setBox({x:p[0]-36,y:p[1]-16,width:72,height:32});
   for(const {id,label} of residueLabels){const fragment=out.mgView.phosphates.find(p=>p.id===id);
    label.setBox({x:fragment.center[0]-30,y:Math.max(...fragment.atoms.map(a=>a.point[1]))+18,width:60,height:29});
   }
   const dx=p[0]-931,dy=p[1]-337,d=Math.max(1,Math.hypot(dx,dy));F.seg(selectLine,931,337,p[0]-dx/d*15,p[1]-dy/d*15);
  }
 }
 return {g:root,paint};
}
g.TrnaMagnesiumLabels=Object.freeze({create});
})(window);
