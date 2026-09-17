(function(){'use strict';
Bio3D.scene({id:'three-codes',chapter:['Три кода','Three codes'],title:['Три кода отвечают на разные вопросы','Three codes answer different questions'],notes:[
['После захвата и последующего синтеза продукты несут идентификатор клетки, UMI и информацию о признаке. В показанном варианте Drop-seq синтез выполняют после разрушения эмульсии и извлечения бусин. Схема показывает функциональные поля записи, а не точный порядок участков конкретной библиотеки.','After capture and subsequent synthesis, products carry a cell identifier, a UMI and feature information. In the illustrated Drop-seq variant, synthesis follows emulsion breakage and bead recovery. The diagram shows functional record fields, not the exact sequence architecture of a particular library.'],
['Клеточный штрихкод отвечает «из какой капли?». Общий код A связывает РНК и ADT одной клетки. При doublet этот код может относиться к нескольким клеткам.','The cell barcode answers “from which droplet?”. Shared barcode A links the cell’s RNA and ADT. In a doublet the barcode may refer to multiple cells.'],
['Feature identity отвечает «что считали?». Для RNA это ген, определённый по последовательности транскрипта и картированию; для ADT — заранее известный код антитела.','Feature identity answers “what was counted?”. For RNA it is a gene inferred from the transcript sequence and mapping; for ADT it is the predefined antibody code.'],
['UMI помогает схлопывать PCR-копии одного исходного захваченного фрагмента в один отсчёт. Здесь две записи с одинаковыми клеткой, признаком и UMI превращаются в один отсчёт. Это не доказывает точное число белковых молекул.','A UMI helps collapse PCR copies of one captured fragment into one count. Two records with the same cell, feature and UMI become one count here. This does not establish an exact protein-molecule count.']
],qa:[['Одинаковый UMI в разных клетках — одна молекула?','Does the same UMI in different cells mean one molecule?','Нет. Дедупликация учитывает клетку и признак; короткие UMI могут случайно совпасть.','No. Deduplication is conditioned on cell and feature, and short UMIs can collide.'],['Почему UMI не равен коду антитела?','Why is a UMI different from an antibody code?','Код антитела идентифицирует реагент. UMI различает захваченные молекулярные фрагменты внутри соответствующего контекста.','The antibody code identifies a reagent. A UMI distinguishes captured molecular fragments within the relevant context.']],build(ctx){
const v=Bio3D.stage(ctx,'Три кода отвечают на разные вопросы','Three codes answer different questions');
const st={cell:0,feature:0,dedup:0,turn:0},model=V3.CodesMesh.create(),camera={cx:647,cy:399,scale:89};
const surface=V3.CellSurface.create(v.svg,camera,{frame:{x:60,y:147,width:1160,height:427},molecules:model.molecules,includeCell:false});
ctx.onDispose(surface.dispose);surface.g.dataset.codesProducts='3';
const p=F.group(v.svg),lines=F.group(p),labels=F.group(p);
Bio3D.text(labels,70,147,1140,36,'После разрушения капель, извлечения бусин, синтеза и PCR: продукты ДНК','After droplet breakage, bead recovery, synthesis and PCR: DNA products',22,C.grey);
// Reserve a separate heading band above the highest projected code labels.
const headers=[Bio3D.text(labels,273,184,242,34,'Клеточный штрихкод','Cell barcode',22,C.gold),Bio3D.text(labels,505,184,158,34,'UMI','UMI',23,C.purple),Bio3D.text(labels,694,184,369,34,'Идентификатор признака','Feature identity',22,C.teal)];
const rowY=[310,411,512],rowLabels=[['Из RNA','RNA-derived'],['Из ADT','ADT-derived'],['PCR-копия ADT','ADT PCR copy']];
const productLabels=rowLabels.map((a,i)=>Bio3D.text(labels,65,rowY[i]-21,197,43,...a,22,i?C.teal:C.blue));
const values=model.molecules.map((m,i)=>{
 const group=F.group(labels);group.dataset.codesProduct=m.id;
 const a=Bio3D.text(group,0,0,114,38,'A','A',25,C.gold),u=Bio3D.text(group,0,0,120,38,m.umi,m.umi,25,C.purple);
 const f=Bio3D.text(group,0,0,282,38,i?'код anti-CD4':'последовательность CD4',i?'anti-CD4 barcode':'CD4-derived sequence',22,i?C.teal:C.blue);
 return {group,fields:[a,u,f],leaders:[C.gold,C.purple,i?C.teal:C.blue].map(color=>Bio3D.path(lines,'M0 0',color,1.5))};
});
const cellBracket=Bio3D.path(lines,'M0 0',C.gold,2.6),countBracket=Bio3D.path(lines,'M0 0',C.purple,2.6);
cellBracket.dataset.codesConnector='cell';countBracket.dataset.codesConnector='dedup';
const dedupNote=Bio3D.text(labels,279,537,795,36,'2 чтения ADT → 1 уникальный отсчёт','2 ADT reads → 1 unique count',26,C.purple);
const exactness=Bio3D.text(labels,70,581,1140,27,'Функциональные участки показаны условно: не точный порядок нуклеотидов.','Functional segments are schematic: not the exact nucleotide order.',19,C.grey);
const groupingNote=Bio3D.text(labels,70,581,1140,27,'Группировка в данных по клетке + признаку + UMI; копии ДНК остаются отдельными.','Group data by cell + feature + UMI; the DNA copies remain separate.',19,C.grey);
const poses=[];
function paint(){
 const t=st.turn,d=st.dedup,c=st.cell,f=st.feature;
 // Small rotations expose the real curved tube cross-sections. These are
 // explanatory camera poses, not simulated molecular dynamics.
 const pitches=[-22+12*t,20-11*t,-18+12*t],yaws=[-.35+.2*t,.3-.18*t,-.25+.16*t];
 const centers=[[0,(399-rowY[0])/89,-.28],[0,(399-rowY[1])/89,.34],[0,(399-rowY[2])/89,-.12]];
 const anchors=[];
 model.molecules.forEach((m,i)=>{
  const muted=Math.max(c,f),other=1-.64*muted,background=i===0?1-.54*d:1;
  const parts={linker:{opacity:(.72-.24*muted)*background},primer:{opacity:(1-.64*f)*background},umi:{opacity:other*background},[i?'tag':'rna']:{opacity:(1-.64*c)*background}};
  if(i>0)parts.umi.opacity=other+(1-other)*d;
  poses[i]=V3.CodesMesh.pose(centers[i],yaws[i],pitches[i],parts);
  const projected=['cell','umi','feature'].map(key=>V3.CodesMesh.project(model.anchors[key],poses[i],camera));anchors.push(projected);
  projected.forEach((a,j)=>{
   const role=j===0?'primer':j===1?'umi':i?'tag':'rna',top=Math.min(...model.bounds[i][role].map(point=>V3.CodesMesh.project(point,poses[i],camera).y));
   const width=j===2?282:j===1?120:114,box={x:a.x-width/2,y:top-48,width,height:38};
   values[i].fields[j].setBox(box);F.opacity(values[i].fields[j].el,(j===0?parts.primer:j===1?parts.umi:parts[i?'tag':'rna']).opacity);
   // Endpoints use the identical mesh point and transform as the renderer.
   values[i].leaders[j].setAttribute('d',`M${a.x} ${box.y+43} L${a.x} ${a.y-9}`);
   F.opacity(values[i].leaders[j],(j===0?parts.primer:j===1?parts.umi:parts[i?'tag':'rna']).opacity*.8);
  });
  F.opacity(productLabels[i].el,background);
 });
 surface.paint({cellOpacity:0,moleculePoses:poses});
 const a=anchors.map(q=>q[0]),left=288;
 // Shared identity is a correspondence guide, not a new molecular connection.
 cellBracket.setAttribute('d',`M${a[0].x-12} ${a[0].y+11} L${left} ${a[0].y+11} L${left} ${a[2].y+11} L${a[2].x-12} ${a[2].y+11} M${left} ${a[1].y+11} L${a[1].x-12} ${a[1].y+11}`);
 F.opacity(cellBracket,c*.8);
 const endpoints=[1,2].map(i=>V3.CodesMesh.project(model.anchors.end,poses[i],camera)),right=1046;
 countBracket.setAttribute('d',`M${endpoints[0].x+12} ${endpoints[0].y} L${right} ${endpoints[0].y} L${right} 551 L1024 551 M${endpoints[1].x+12} ${endpoints[1].y} L${right} ${endpoints[1].y}`);
 F.opacity(countBracket,d);F.opacity(dedupNote.el,d);F.opacity(exactness.el,1-F.phase(d,0,.38));F.opacity(groupingNote.el,F.phase(d,.62,1));
 headers.forEach((h,i)=>F.opacity(h.el,i===0?1-.5*f:i===1?1-.5*Math.max(c,f):1-.5*c));
 v.root.dataset.codesCell=String(c);v.root.dataset.codesFeature=String(f);v.root.dataset.codesDedup=String(d);v.root.dataset.codesTurn=String(t);
 v.root.dataset.codesUniqueAdt=String(d===1?1:2);v.root.dataset.codesDnaProducts='3';
}
Bio3D.motion(ctx,v,st,paint,[
 ['Каждый продукт ДНК несёт три вида информации.','Each DNA product carries three kinds of information.'],
 ['Общий клеточный штрихкод A связывает RNA и ADT.','Shared cell barcode A links RNA and ADT.'],
 ['RNA: ген по картированию. ADT: известный код антитела.','RNA: gene inferred by mapping. ADT: known antibody code.'],
 ['Одинаковые клетка, признак и UMI → один отсчёт в данных.','Same cell, feature and UMI → one count in the data.']
],[{cell:1,turn:1},{cell:0,feature:1,turn:2},{feature:0,dedup:1,turn:3}],[2200,2400,2600]);paint();return v.root;}});
})();
