/* Continuous Drop-seq CITE-seq capture. Paths explain order, not kinetics. */
(function(global){
'use strict';
const add=(a,b)=>a.map((x,i)=>x+b[i]),sub=(a,b)=>a.map((x,i)=>x-b[i]);
const mul=(a,k)=>a.map(x=>x*k),mix=(a,b,t)=>a.map((x,i)=>F.lerp(x,b[i],t));
// The approach bows through the liquid in front of the solid bead.
const approach=(a,b,t)=>add(mix(a,b,t),[0,0,1.05*Math.sin(Math.PI*t)]);
const dot=(a,b)=>a.reduce((q,x,i)=>q+x*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=a=>mul(a,1/(Math.hypot(...a)||1));
const transform=(p,m)=>[m[0]*p[0]+m[3]*p[1]+m[6]*p[2],m[1]*p[0]+m[4]*p[1]+m[7]*p[2],m[2]*p[0]+m[5]*p[1]+m[8]*p[2]];
const inverse=(p,m)=>[dot(p,m.slice(0,3)),dot(p,m.slice(3,6)),dot(p,m.slice(6,9))];
function rotation(yaw,pitch){const a=yaw*Math.PI/180,b=pitch*Math.PI/180,ca=Math.cos(a),sa=Math.sin(a),cb=Math.cos(b),sb=Math.sin(b);return [ca,cb*sa,sb*sa,-sa,cb*ca,sb*ca,0,-sb,cb];}
function align(from,to,t=1){
 const a=unit(from),b=unit(to),d=Math.max(-1,Math.min(1,dot(a,b))),angle=Math.acos(d)*t;
 let axis=cross(a,b);if(Math.hypot(...axis)<1e-8)axis=d>0?[1,0,0]:cross(a,Math.abs(a[2])<.9?[0,0,1]:[0,1,0]);
 const [x,y,z]=unit(axis),c=Math.cos(angle),s=Math.sin(angle),q=1-c;
 return [c+x*x*q,y*x*q+z*s,z*x*q-y*s,x*y*q-z*s,c+y*y*q,z*y*q+x*s,x*z*q+y*s,y*z*q-x*s,c+z*z*q];
}
function product(a,b){return [0,1,2].flatMap(i=>transform(b.slice(i*3,i*3+3),a));}
const notes=[
 ['После отмывки та же клетка встречает твёрдую бусину Drop-seq. В исходном протоколе это пористый метакрилатный полимер Toyopearl HW-65S: средний диаметр около 30 мкм, номинальный размер пор 100 нм. Отдельные поры на таком общем виде не видны. Оттенок бусины подстроен под тему для контраста с молекулами; это условная окраска схемы, а не измеренный цвет частицы. На бусине заранее синтезированы праймеры: 5′ PCR-участок → клеточный штрихкод → UMI → 3′ oligo-dT. A — условное имя полного штрихкода. Молекулы увеличены, число видимых нитей условно. Показан исходный вариант CITE-seq (Stoeckius et al., 2017) с твёрдой бусиной.','After washing, the same cell meets a solid Drop-seq bead. The original protocol uses porous methacrylic polymer, Toyopearl HW-65S: approximately 30 µm mean diameter and 100 nm nominal pores. Individual pores are unresolved at this overview scale. Bead shading follows the theme to contrast with the molecules; it is diagram colouring, not a measured particle colour. Primers already attached to the bead contain a 5′ PCR handle → cell barcode → UMI → 3′ oligo-dT. A names the complete example barcode. Molecules are enlarged and visible strand counts are illustrative. This depicts the original CITE-seq variant (Stoeckius et al., 2017) with a solid bead.'],
 ['Клетка и бусина заключаются в одну водную каплю в масле. Её граница — поверхность раздела вода–масло, не клеточная мембрана. Прозрачная 3D-поверхность с мягким оптическим ободком передаёт вид капель на микрофотографиях; точная оптика и течение жидкости не рассчитываются. Здесь выбран удачный случай «одна клетка + одна бусина»; в реальном потоке бывают пустые капли и doublets. Общий штрихкод A повторяется на праймерах одной бусины; UMI различаются.','The cell and bead are co-encapsulated in an aqueous droplet in oil. Its boundary is the oil–water interface, not a cell membrane. The transparent 3D surface and soft optical rim are informed by droplet micrographs; exact optics and fluid flow are not simulated. This is a selected successful one-cell/one-bead event; real workflows also produce empty droplets and doublets. The primers on one bead share barcode A and carry diverse UMIs.'],
 ['Лизис нарушает мембрану и высвобождает мРНК внутри той же капли. В показанной исходной химии восстановление расщепляемого линкера освобождает ДНК-метки антител. Это те же зелёные нити, которые были связаны с антителами; белок не превращается в РНК. Белковые компоненты убраны из вида, чтобы проследить нуклеиновые кислоты. Отщепление метки не является обязательным для всех современных вариантов CITE-seq. Траектории и длительности условны.','Lysis disrupts the membrane and releases mRNA within the same droplet. In the original chemistry illustrated here, reduction of the cleavable linker releases antibody DNA tags. These are the same green strands previously attached to antibodies; protein does not turn into RNA. Protein components are omitted from view to follow the nucleic acids. Tag cleavage is not required in all modern CITE-seq variants. Paths and durations are illustrative.'],
 ['Хвосты poly(A) мРНК и ДНК-меток гибридизуются с oligo-dT праймеров на той же бусине. Приближение остаётся внутри той же капли. Общий адрес A уже присутствует на праймерах: захват не дописывает штрихкод в исходную РНК или ДНК-метку. В этом варианте Drop-seq эмульсию затем разрушают, бусины извлекают, а при последующем синтезе формируются ДНК-продукты с клеточным штрихкодом и UMI. Здесь анимация заканчивается на совместном захвате, до синтеза этих копий.','The poly(A) tails of mRNA and antibody DNA tags hybridize to oligo-dT primers on the same bead. The close-up remains inside the same droplet. Shared address A already exists in the primers: capture does not append a barcode to the original RNA or DNA tag. In this Drop-seq variant, the emulsion is subsequently broken, beads recovered, and later synthesis produces DNA products containing the cell barcode and UMI. This animation ends at co-capture, before those copies are synthesized.']
];
notes.push(
 ['Камера приближает ту же мРНК и тот же праймер на бусине. Зелёный хвост poly(A) находится рядом с комплементарным oligo-dT; сама РНК и праймер остаются разными цепями. Положение молекул и место захвата не меняются. Крупный план показывает условную геометрию нитей, а не отдельные атомы или реальную длину последовательностей.','The camera approaches the same mRNA and bead primer. The green poly(A) tail lies alongside complementary oligo-dT; RNA and primer remain distinct strands. Molecular positions and the capture site do not change. This close-up shows schematic strand geometry, not individual atoms or literal sequence lengths.'],
 ['Теперь камера переходит к той же ДНК-метке антитела. Её poly(A) также удерживается oligo-dT праймера бусины. Это ДНК-метка, не само антитело и не РНК. На следующем слайде мы перейдём к ДНК-продуктам после извлечения бусины, синтеза и амплификации; здесь исходные цепи ещё не получили новых кодов.','The camera now moves to the same antibody DNA tag. Its poly(A) tract is likewise captured by a bead primer oligo-dT. This is the DNA tag, not the antibody protein or RNA. The next scene moves to DNA products after bead recovery, synthesis and amplification; the original strands shown here have not acquired new barcodes.']
);
const captions=[
 ['После отмывки та же клетка встречает баркодированную бусину.','After washing, the same cell meets a barcoded bead.'],
 ['Одна капля удерживает клетку и бусину вместе.','One droplet holds the cell and bead together.'],
 ['Лизис высвобождает мРНК и ДНК-метки внутри той же капли.','Lysis releases mRNA and DNA tags inside the same droplet.'],
 ['Совместный захват связывает РНК и ADT с адресом A.','Co-capture links RNA and ADT to address A.'],
 ['Крупный план: хвост poly(A) мРНК связывается с oligo-dT.','Close-up: the mRNA poly(A) tail binds oligo-dT.'],
 ['ДНК-метка антитела тоже захватывается через poly(A) ↔ oligo-dT.','The antibody DNA tag also binds through poly(A) ↔ oligo-dT.']
];
function create(svg,world,{model,sites,poses,center,root}){
 const s=D.dom.s,baseIndex=sites.length+8,beadPose=poses[baseIndex],rnaPoses=poses.slice(baseIndex+1,baseIndex+1+model.rnas.length),dropletPose=poses[baseIndex+1+model.rnas.length];
 const labels=F.group(svg);labels.dataset.captureLabels='';
 const beadLabelGroup=F.group(labels);
 const encounterLabel=Bio3D.text(beadLabelGroup,0,0,380,42,'Праймеры бусины · код A','Bead primers · barcode A',22,C.gold);
 const boundaryLabel=Bio3D.text(labels,80,160,440,38,'Водная капля в масле','Aqueous droplet in oil',21,C.blue,'left');
 const detail=F.group(labels);
 function callout(ru,en,y,color,w=305){const g=F.group(detail),line=Bio3D.path(g,'',color,1.4),dot=s('circle',{r:3,fill:color});g.append(dot);return {g,line,dot,label:Bio3D.text(g,93,y,w,58,ru,en,24,color,'left'),x:93+w+15,y:y+29};}
 const rnaLabel=callout('мРНК','mRNA',206,C.blue);
 const tagLabel=callout('ДНК-метка антитела','Antibody DNA tag',355,C.teal);
 const hybridLabel=callout('poly(A) ↔ oligo-dT','poly(A) ↔ oligo-dT',480,C.teal,350);
 Bio3D.text(detail,680,569,510,35,'Код A общий · UMI различаются','Shared barcode A · diverse UMIs',18,C.gold);
 const inside=Bio3D.text(detail,80,154,440,34,'Приближение внутри той же капли','Close-up inside the same droplet',19,C.grey,'left');
 const target=(primer)=>{const tangent=primer.side;return add(primer.polyTStart,mul(tangent,.023));};
 const rnaIndices=model.rnaPrimerIndices||[0,2,4,6,8,10],adtIndices=model.adtPrimerIndices||[1,3,5,7,9,11,12,13,14,15,16,17];
 const rnaRotations=rnaIndices.map(i=>align([1,0,0],model.primers[i].n));
 const rnaFree=[[-.35,.83,.35],[.35,.68,.55],[.80,.16,.65],[-.45,-.65,.30],[.35,-.80,.55],[.85,-.40,.60]];
 const tagFree=Array.from({length:12},(_,i)=>[-.85+(i%4)*.60,.95-Math.floor(i/4)*.90,.30+(i%3)*.18]);
 const tagEnds=[],rnaEnds=[];
 function paint(view){
  const encounter=view.encounter||0,lysis=view.lysis||0,capture=view.capture||0,focus=F.phase(capture,.48,1),inspection=view.inspection||0;
  const macro=F.phase(inspection,0,1),travel=F.phase(inspection,1,2);
  const rnaFocus=add(target(model.primers[rnaIndices[0]]),mul(model.primers[rnaIndices[0]].n,.16));
  const tagFocus=add(target(model.primers[adtIndices[0]]),mul(model.primers[adtIndices[0]].n,.055));
  const focusPoint=mix(rnaFocus,tagFocus,travel);
  const mag=F.lerp(F.lerp(F.lerp(1,.42,encounter),.61,focus),5,macro);
  const cx=F.lerp(F.lerp(F.lerp(center.cx,450,encounter),495,focus),850-center.scale*mag*focusPoint[0],macro);
  const cy=F.lerp(361,360+center.scale*mag*focusPoint[1],macro);
  const panX=cx-mag*center.cx,panY=cy-mag*center.cy,project=p=>({x:cx+center.scale*mag*p[0],y:cy-center.scale*mag*p[1]});
  const cellR=rotation(view.yaw,view.pitch),proteinAlpha=1-F.phase(lysis,.28,.90);
  beadPose.opacity=F.phase(encounter,.18,.50);beadPose.offset=[3.4*(1-encounter),0,0];
  dropletPose.opacity=view.encap||0;
  sites.forEach((site,i)=>{
   const end0=transform(site.anchors[7],cellR),release=F.phase(lysis,.16+i*.012,.78+i*.012),move=F.phase(capture,i*.010,.69+i*.010);
   const primer=model.primers[adtIndices[i]],end=approach(mix(end0,tagFree[i],release),target(primer),move);
   const rotation1=product(align(transform(sub(site.anchors[7],site.anchors[6]),cellR),mul(primer.n,-1),move),cellR);
   const offset=sub(inverse(end,rotation1),site.anchors[7]);
   poses[i].parts={antibody:{opacity:proteinAlpha},protein:{opacity:proteinAlpha},linker:{opacity:1-F.phase(lysis,.12,.29)},tag:{offset,rotation:rotation1,opacity:1}};
   // Prior to lysis, binding still uses the original whole-molecule offset.
   if(lysis===0)delete poses[i].parts.tag;
   tagEnds[i]=end;
  });
  rnaPoses.forEach((pose,i)=>{
   const start=[-.27+(i%3)*.17,.26-Math.floor(i/3)*.42,.25],release=F.phase(lysis,.12,.92),move=F.phase(capture,i*.02,.72+i*.02);
   const end=approach(mix(start,rnaFree[i],release),target(model.primers[rnaIndices[i]]),move);
   pose.rotation=rnaRotations[i];pose.offset=inverse(end,pose.rotation);pose.opacity=F.phase(lysis,.08,.42);rnaEnds[i]=end;
  });
  F.opacity(labels,F.phase(encounter,.65,1));
  F.opacity(encounterLabel.el,1-focus);F.opacity(boundaryLabel.el,(view.encap||0)*(1-focus));
  const bead=project(add(model.bead.center,beadPose.offset));F.at(beadLabelGroup,bead.x-190,172);
  F.opacity(detail,F.phase(capture,.90,1));
  // During camera travel labels fade; each endpoint still names a real strand.
  const settled=(1-F.phase(inspection,0,.16)+F.phase(inspection,.84,1))*(1-F.phase(inspection,1,1.16)+F.phase(inspection,1.84,2));
  F.opacity(rnaLabel.g,settled*(1-F.phase(inspection,1,1.16)));
  F.opacity(tagLabel.g,settled*(1-macro+F.phase(inspection,1.84,2)));
  F.opacity(hybridLabel.g,settled);
  const hybridPrimer=inspection>=.5&&inspection<1.5?rnaIndices[0]:adtIndices[0];
  const tagAnchor=mix(sites[0].anchors[5],sites[0].anchors[6],.5),tagPart=poses[0].parts.tag;
  const tagLabelPoint=tagPart?transform(add(tagAnchor,tagPart.offset),tagPart.rotation):transform(add(tagAnchor,poses[0].offset),cellR);
  const paired=model.primers[hybridPrimer],hybridPoint=add(add(paired.polyTStart,mul(paired.n,.05)),mul(paired.side,.0115));
  const points=[project(add(rnaEnds[0],transform(model.rnas[0].labelAnchor,rnaRotations[0]))),project(tagLabelPoint),project(hybridPoint)];
  [rnaLabel,tagLabel,hybridLabel].forEach((label,i)=>{const p=points[i];label.line.setAttribute('d',`M${label.x} ${label.y} H${label.x+38} L${p.x-14} ${p.y} H${p.x}`);label.dot.setAttribute('cx',p.x);label.dot.setAttribute('cy',p.y);});
  root.dataset.captureEncounter=String(encounter);root.dataset.captureEncapsulation=String(view.encap||0);root.dataset.captureLysis=String(lysis);root.dataset.captureHybridization=String(capture);
  root.dataset.captureTagCount=String(sites.length);root.dataset.captureRnaCount=String(model.rnas.length);
  root.dataset.captureDroplet='3d-interface';
  root.dataset.captureInspection=String(inspection);root.dataset.captureFocus=inspection>=1.5?'adt':inspection>0?'rna':'overview';
  return {magnification:mag,panX,panY,cellDissolve:F.phase(lysis,.04,.86),cellOpacity:1-F.phase(lysis,.80,1)};
 }
 return {paint};
}
global.Bio3D.CaptureStage={create,notes,captions};
})(window);
