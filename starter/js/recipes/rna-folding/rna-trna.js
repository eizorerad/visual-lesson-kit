(function(g){
'use strict';
const R=g.RNA;
// PDB 1EHZ, model 1, chain A. One deposited C4′ per residue; original Å coordinates.
// Provenance, component IDs and covalent-connectivity checks: assets/rna-folding/trna-1ehz.json.
const DATA=[[1,"G",50.968,49.231,54.309],[2,"C",56.836,48.075,56.049],[3,"G",62.769,46.443,54.422],[4,"G",66.749,44.634,50.114],[5,"A",67.927,42.844,44.191],[6,"U",66.579,44.4,38.565],[7,"U",64.055,47.852,34.101],[8,"U",66.105,52.236,29.628],[9,"A",64.531,52.215,22.904],[10,"2MG",59.058,48.375,20.709],[11,"C",60.091,42.608,23.221],[12,"U",64.121,39.544,26.594],[13,"C",69.102,41.516,29.762],[14,"A",74.612,43.815,30.626],[15,"G",78.274,48.248,31.867],[16,"H2U",80.514,52.486,33.353],[17,"H2U",84.176,55.886,36.15],[18,"G",80.1,59.412,35.902],[19,"G",80.105,62.508,30.407],[20,"G",80.529,60.879,23.849],[21,"A",75.622,58.001,23.58],[22,"G",76.292,51.916,21.581],[23,"A",76.705,45.975,20.257],[24,"G",74.313,40.622,18.747],[25,"C",69.17,38.275,16.491],[26,"M2G",63.938,40.267,14.143],[27,"C",61.594,44.378,10.321],[28,"C",62.918,48.099,5.246],[29,"A",67.384,49.009,1.027],[30,"G",72.933,47.996,-1.281],[31,"A",77.346,43.848,-2.3],[32,"OMC",77.712,38.038,-3.579],[33,"U",74.457,33.095,-5.87],[34,"OMG",70.295,33.326,-11.163],[35,"A",65.999,34.348,-7.216],[36,"A",65.801,33.698,-1.565],[37,"YYG",66.976,32.279,4.107],[38,"A",71.783,31.31,7.804],[39,"PSU",77.034,33.8,8.726],[40,"5MC",80.351,38.97,7.985],[41,"U",80.498,45.168,6.953],[42,"G",77.769,50.433,7.372],[43,"G",73.059,54.264,8.204],[44,"A",67.971,56.191,10.523],[45,"G",64.255,55.158,15.248],[46,"7MG",63.911,55.833,21.859],[47,"U",62.482,60.255,26.545],[48,"C",66.046,56.424,30.251],[49,"5MC",61.796,55.006,32.81],[50,"U",59.218,60.444,34.331],[51,"G",59.365,65.668,37.334],[52,"U",62.118,69.559,40.905],[53,"G",67.174,70.724,43.912],[54,"5MU",73.295,70.03,45.246],[55,"PSU",78.398,70.137,41.999],[56,"C",79.735,74.239,36.678],[57,"G",76.829,69.964,33.385],[58,"1MA",74.279,63.972,33.383],[59,"U",70.618,58.472,33.026],[60,"C",73.252,56.436,38.285],[61,"C",75.643,58.316,43.84],[62,"A",71.882,60.684,48.244],[63,"C",66.263,61.75,50.244],[64,"A",60.204,61.569,49.339],[65,"G",55.988,59.17,46.06],[66,"A",53.671,55.677,41.542],[67,"A",53.319,50.645,38.32],[68,"U",55.168,44.94,37.012],[69,"U",57.582,39.88,39.4],[70,"C",59.348,35.925,43.805],[71,"G",59.688,34.434,49.701],[72,"C",57.653,35.834,55.45],[73,"A",53.508,38.772,58.837],[74,"C",47.463,40.541,58.985],[75,"C",42.564,38.194,56.568],[76,"A",37.607,38.379,58.569]];
const VIEW_BASIS=[[-0.704858062764348,-0.41373289261369006,0.5761945894622744],[-0.23042024713417378,-0.6346941460188456,-0.7376109074031069],[0.6708812272427337,-0.6526778949672779,0.35203685084713265]];
const VIEW_ORIGIN=[79.92,68.3735,33.5425];

const STEM_PAIRS=[...Array.from({length:7},(_,i)=>[1+i,72-i]),...Array.from({length:4},(_,i)=>[10+i,25-i]),...Array.from({length:5},(_,i)=>[27+i,43-i]),...Array.from({length:5},(_,i)=>[49+i,65-i])];
const MODIFIED=DATA.filter(r=>!['A','C','G','U'].includes(r[1])).map(r=>r[0]);
// Authored secondary-structure drawing, preserving the same residue numbering.
function cloverleaf(){
 const q=Array(76),put=(id,x,y)=>q[id-1]=[x,380+(y-380)*.92+20,0];
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
function residueColor(id){return id<=7||id>=66?C.blue:id<=26?C.teal:id<=43?C.gold:id<=48?C.grey:C.purple;}
function modelPoints(angle=0){
 const c=Math.cos(angle),s=Math.sin(angle);
 return DATA.map(row=>{
  const d=row.slice(2).map((v,i)=>v-VIEW_ORIGIN[i]);
  const v=VIEW_BASIS.map(axis=>axis.reduce((sum,a,i)=>sum+a*d[i],0));
  // Orthographic camera rotation around the vertical axis; one common scale for x/y/z.
  const x=v[0]-24,z=v[2],xr=x*c+z*s+24,zr=-x*s+z*c;
  return [385+xr*4.8,268+v[1]*4.8,zr];
 });
}
function trimmed(line,a,b,inset=7){
 const dx=b[0]-a[0],dy=b[1]-a[1],d=Math.max(.001,Math.hypot(dx,dy)),t=Math.min(inset/d,.45);
 F.seg(line,a[0]+dx*t,a[1]+dy*t,b[0]-dx*t,b[1]-dy*t);
}
R.register({
 id:'rna-trna-real',chapter:['От схемы к структуре','From diagram to structure'],
 title:['Как выглядит настоящая тРНК?','What does an actual tRNA look like?'],
 status:['2D: авторская схема · 3D: PDB 1EHZ','2D: authored diagram · 3D: PDB 1EHZ'],
 source:['Shi & Moore, 2000 · PDB 1EHZ','https://www.rcsb.org/structure/1EHZ'],
 states:[
  ['Теперь сравним схему пар и измеренную 3D-форму одной тРНК.',
   'Now compare the pair diagram and measured 3D shape of one tRNA.',
   'Здесь одна дрожжевая тРНК(Phe), цепь A структуры 1EHZ. Все 76 нуклеотидов изображены в авторской плоской схеме: короткие поперечные линии показывают пары четырёх стеблей. Расстояния и углы этой 2D-схемы условны. Номера остатков сохраняются при смене представления; модифицированные нуклеотиды не заменены немодифицированными. Полные идентификаторы компонентов сохранены в данных и подсказках точек.',
   'This is one yeast tRNA(Phe), chain A of structure 1EHZ. All 76 residues appear in an authored planar diagram; short cross-lines show base pairs in the four stems. Distances and angles in this 2D diagram are schematic. Residue numbers persist when the representation changes; modified nucleotides are not replaced with unmodified ones. Full component IDs are retained in the data and point tooltips.'],
  ['Проследим те же ориентиры: антикодон 34–36 и конец 3′-CCA 74–76.',
   'Track the same landmarks: anticodon 34–36 and the 3′-CCA end, residues 74–76.',
   'Золотые кольца выделяют антикодон: OMG34, A35, A36; OMG — обозначение 2′-O-метилгуанозина в PDB. Синие кольца выделяют C74, C75, A76. Метка 5′ относится к G1, метка 3′ — к A76. Каждая точка имеет постоянный номер; непрерывная цепь следует от 1 к 76. Три остатка CCA образуют конец, к которому при аминоацилировании присоединяется аминокислота; сама аминокислота в этой структуре не показана.',
   'Gold rings highlight the anticodon: OMG34, A35, A36; OMG is the PDB component ID for 2′-O-methylguanosine. Blue rings highlight C74, C75, A76. The 5′ label identifies G1 and the 3′ label identifies A76. Each point retains its residue number; the continuous chain runs from 1 to 76. The CCA residues form the end to which an amino acid attaches during aminoacylation; no amino acid is shown in this structure.'],
  ['В 3D те же 76 остатков образуют L-образную структуру по данным рентгенографии.',
   'In 3D, the same 76 residues form an L-shaped structure from X-ray data.',
   'Теперь каждая точка стоит в проекции координаты атома C4′ из официального файла 1EHZ, модель 1, цепь A. Это упрощённый след цепи: отрезки C4′–C4′ соединяют соседние остатки, а не изображают отдельные химические связи. Структурная модель получена рентгеновской дифракцией с разрешением 1,93 Å. Все 76 атомов C4′ присутствуют; между соседними остатками нет пропущенных связей. Переход между 2D и 3D — авторское сопоставление представлений, не рассчитанный путь фолдинга. <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC1369984/" target="_blank" rel="noopener">Первичная статья: Shi & Moore, 2000.</a>',
   'Each point now projects a deposited C4′ atom coordinate from the official 1EHZ file, model 1, chain A. This is a coarse chain trace: C4′–C4′ segments link neighboring residues rather than depicting individual chemical bonds. The structural model was determined by X-ray diffraction at 1.93 Å resolution. All 76 C4′ atoms are present; no residue boundary is skipped. The 2D-to-3D transition is an authored comparison of representations, not a calculated folding pathway. <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC1369984/" target="_blank" rel="noopener">Primary paper: Shi & Moore, 2000.</a>'],
  ['Антикодон и конец CCA находятся на разных концах L-образной молекулы.',
   'The anticodon and CCA end lie at different ends of the L-shaped molecule.',
   'Последний шаг — жёсткий поворот камеры вокруг одной и той же структуры, поэтому внутренние 3D-расстояния не меняются. Оттенок и порядок отрисовки помогают видеть глубину. Атомы оснований, вода и ионы опущены. В 1EHZ есть 14 модифицированных остатков: 10, 16, 17, 26, 32, 34, 37, 39, 40, 46, 49, 54, 55, 58; их исходные идентификаторы сохранены. Эта структура — экспериментально обоснованная модель одного кристаллического состояния, а не видеозапись фолдинга в растворе.',
   'The final step rigidly rotates the view of the same structure, so internal 3D distances stay fixed. Shading and drawing order indicate depth. Base atoms, water and ions are omitted. 1EHZ contains 14 modified residues: 10, 16, 17, 26, 32, 34, 37, 39, 40, 46, 49, 54, 55, 58; deposited component IDs remain intact. This is an experimentally supported model of one crystal state, not a movie of folding in solution.']
 ],
 qa:[
  {q:['Почему клеверный лист и L-форма не противоречат друг другу?','Why do the cloverleaf and the L shape agree?'],a:['Клеверный лист — плоская схема вторичных пар, а L-форма описывает пространственное расположение тех же остатков.','The cloverleaf is a planar diagram of secondary base pairs; the L shape describes the spatial arrangement of the same residues.']},
  {q:['Откуда взяты координаты 3D и что означает одна точка?','Where do the 3D coordinates come from, and what does one point mean?'],a:['Из официальной структуры PDB 1EHZ, определённой рентгенографией при 1,93 Å. Одна точка — атом C4′ одного нуклеотида; это упрощённое представление структуры.','From official PDB structure 1EHZ, determined by X-ray diffraction at 1.93 Å. One point represents one nucleotide’s C4′ atom; this is a simplified structural view.']},
  {q:['Показывает ли переход реальную траекторию фолдинга?','Does the transition show a real folding trajectory?'],a:['Нет. 2D и 3D сопоставлены авторским движением; заключительный поворот меняет только ракурс.','No. Authored motion compares the 2D and 3D representations; the final rotation changes only the view.']}
 ],
 build(ctx,v){
  const p=F.group(v.svg),state={landmarks:0,model:0,angle:0},flat=cloverleaf();
  p.dataset.trnaSource='1EHZ';p.dataset.trnaResidueCount='76';
  R.box(p,76,154,738,48,'Одна цепь · 76 нуклеотидов','One chain · 76 nucleotides',29,C.white);
  F.line(p,839,160,839,599,C.grey,1);
  R.box(p,859,157,351,46,'тРНК(Phe) · 1EHZ','tRNA(Phe) · 1EHZ',28,C.blue);
  R.box(p,859,207,351,80,'Связь кодона\nи аминокислоты','Connecting a codon\nand an amino acid',26,C.white);
  R.box(p,859,285,351,82,'Антикодон читает кодон','The anticodon reads a codon',27,C.blue);
  const kind=R.box(p,859,378,351,71,'2D · схема пар','2D · base-pair diagram',27,C.gold);
  const detail=R.box(p,859,455,351,80,'Четыре стебля\nи соединяющие петли','Four stems\nand connecting loops',26,C.grey);
  R.box(p,858,539,354,71,'К CCA присоединяется\nаминокислота','The amino acid attaches\nto CCA',25,C.grey);
  const pairs=STEM_PAIRS.map(([a,b])=>{const line=F.line(p,0,0,0,0,C.grey,1.8);line.dataset.trnaPair=a+'-'+b;return line;});
  const structure=F.group(p),segments=[],markers=[];
  // Persistent segments and markers are depth-sorted without replacing any node.
  for(let i=0;i<75;i++){
   const q=F.group(structure);q.dataset.trnaBond=(i+1)+'-'+(i+2);
   const halo=F.line(q,0,0,0,0,'var(--color-bg)',8),line=F.line(q,0,0,0,0,residueColor(i+1),3.2);
   segments.push({el:q,line,halo,index:i});
  }
  DATA.forEach(([id,component])=>{
   const q=F.group(structure);q.dataset.trnaResidue=String(id);q.dataset.trnaComponent=component;
   const dot=F.dot(q,0,0,5.4,residueColor(id));dot.setAttribute('stroke','var(--color-bg)');dot.setAttribute('stroke-width','1.4');
   const ring=F.dot(q,0,0,10,'none');ring.setAttribute('stroke',residueColor(id));ring.setAttribute('stroke-width','2.2');
   const title=D.dom.s('title');title.textContent='1EHZ · A:'+id+' · '+component+' · C4′';q.append(title);
   markers.push({el:q,dot,ring,index:id-1,id,modified:MODIFIED.includes(id)});
  });
  const leaders=[F.line(p,0,0,0,0,C.blue,1.5),F.line(p,0,0,0,0,C.blue,1.5)];
  const five=F.group(p),three=F.group(p);
  R.box(five,-60,-20,120,40,'5′ · G1','5′ · G1',26,C.blue);
  R.box(three,-78,-23,156,46,'3′ · CCA','3′ · CCA',26,C.blue);
  const anti=F.group(p);
  R.box(anti,262,564,500,42,'Антикодон · 34–36','Anticodon · 34–36',27,C.gold);
  const antiLeader=F.line(p,0,0,0,0,C.gold,1.5);
  const status2=R.t('2D · схема пар','2D · base-pair diagram'),status3=R.t('3D · координаты C4′','3D · C4′ coordinates');
  const statusTransition=R.t('Смена представления','Changing representation');
  const text2=R.t('Четыре стебля\nи соединяющие петли','Four stems\nand connecting loops');
  const text3=R.t('Сопоставление видов,\nне путь фолдинга','View comparison,\nnot a folding pathway');
  const text4=R.t('Два функциональных конца\nодной молекулы','Two functional ends\nof one molecule');
  function paint(){
   const actual=modelPoints(state.angle),points=flat.map((a,i)=>a.map((v,j)=>F.lerp(v,actual[i][j],state.model)));
   p.dataset.trnaView=state.model>=.999?'coordinate-model':state.model>0?'representation-transition':'secondary-diagram';
   p.dataset.trnaProgress=state.model.toFixed(4);p.dataset.trnaCameraAngle=state.angle.toFixed(4);
   const ordered=[];
   segments.forEach(o=>{
    const a=points[o.index],b=points[o.index+1];
    F.seg(o.line,a[0],a[1],b[0],b[1]);F.seg(o.halo,a[0],a[1],b[0],b[1]);
    F.opacity(o.halo,state.model);F.opacity(o.line,1-state.model*.1);
    ordered.push({el:o.el,z:(a[2]+b[2])/2,layer:0});
   });
   markers.forEach(o=>{
    const a=points[o.index];F.at(o.el,a[0],a[1]);
    const highlighted=o.id>=34&&o.id<=36||o.id>=74;
    F.opacity(o.ring,highlighted?state.landmarks:0);
    o.dot.setAttribute('r',highlighted?5.4+state.landmarks*1.3:5.4);
    F.opacity(o.dot,Math.max(.55,Math.min(1,.82+state.model*a[2]*.007)));
    ordered.push({el:o.el,z:a[2],layer:1});
   });
   // Markers sit above the trace so neighboring segment halos cannot erase them.
   ordered.sort((a,b)=>a.layer-b.layer||a.z-b.z).forEach(o=>structure.append(o.el));
   pairs.forEach((line,i)=>{const [a,b]=STEM_PAIRS[i];trimmed(line,points[a-1],points[b-1]);F.opacity(line,1-state.model);});
   const f=points[0],t=points[75];
   const fx=f[0]-72+state.model*78,fy=f[1]-21-state.model*32;
   F.at(five,fx,fy);F.seg(leaders[0],fx+40*(1-state.model),fy+19,f[0]-7*(1-state.model),f[1]-8);
   const tx=t[0]+74,ty=t[1];F.at(three,tx,ty);F.seg(leaders[1],t[0]+10,t[1],tx-68,ty);
   const a=points[34];F.seg(antiLeader,a[0],a[1]+13,a[0],561);
   F.opacity(anti,state.landmarks);F.opacity(antiLeader,state.landmarks);
   kind.setText(state.model>0&&state.model<1?statusTransition:state.model<.5?status2:status3);
   detail.setText(state.model<.5?text2:state.angle>.02?text4:text3);
  }
  return {state,paint,patches:[{landmarks:1},{model:1},{angle:.9}],durations:[1100,2800,2600]};
 }
});
})(window);
