/* An experimental reference and prediction targets; no model is run here. */
(function(){
'use strict';
const R=RNA;
// PDB 1EHZ, model 1, chain A, original C4-prime coordinates and component IDs.
// Provenance: assets/rna-folding/trna-1ehz.json. No altered or predicted coordinates.
const DATA=[[1,"G",50.968,49.231,54.309],[2,"C",56.836,48.075,56.049],[3,"G",62.769,46.443,54.422],[4,"G",66.749,44.634,50.114],[5,"A",67.927,42.844,44.191],[6,"U",66.579,44.4,38.565],[7,"U",64.055,47.852,34.101],[8,"U",66.105,52.236,29.628],[9,"A",64.531,52.215,22.904],[10,"2MG",59.058,48.375,20.709],[11,"C",60.091,42.608,23.221],[12,"U",64.121,39.544,26.594],[13,"C",69.102,41.516,29.762],[14,"A",74.612,43.815,30.626],[15,"G",78.274,48.248,31.867],[16,"H2U",80.514,52.486,33.353],[17,"H2U",84.176,55.886,36.15],[18,"G",80.1,59.412,35.902],[19,"G",80.105,62.508,30.407],[20,"G",80.529,60.879,23.849],[21,"A",75.622,58.001,23.58],[22,"G",76.292,51.916,21.581],[23,"A",76.705,45.975,20.257],[24,"G",74.313,40.622,18.747],[25,"C",69.17,38.275,16.491],[26,"M2G",63.938,40.267,14.143],[27,"C",61.594,44.378,10.321],[28,"C",62.918,48.099,5.246],[29,"A",67.384,49.009,1.027],[30,"G",72.933,47.996,-1.281],[31,"A",77.346,43.848,-2.3],[32,"OMC",77.712,38.038,-3.579],[33,"U",74.457,33.095,-5.87],[34,"OMG",70.295,33.326,-11.163],[35,"A",65.999,34.348,-7.216],[36,"A",65.801,33.698,-1.565],[37,"YYG",66.976,32.279,4.107],[38,"A",71.783,31.31,7.804],[39,"PSU",77.034,33.8,8.726],[40,"5MC",80.351,38.97,7.985],[41,"U",80.498,45.168,6.953],[42,"G",77.769,50.433,7.372],[43,"G",73.059,54.264,8.204],[44,"A",67.971,56.191,10.523],[45,"G",64.255,55.158,15.248],[46,"7MG",63.911,55.833,21.859],[47,"U",62.482,60.255,26.545],[48,"C",66.046,56.424,30.251],[49,"5MC",61.796,55.006,32.81],[50,"U",59.218,60.444,34.331],[51,"G",59.365,65.668,37.334],[52,"U",62.118,69.559,40.905],[53,"G",67.174,70.724,43.912],[54,"5MU",73.295,70.03,45.246],[55,"PSU",78.398,70.137,41.999],[56,"C",79.735,74.239,36.678],[57,"G",76.829,69.964,33.385],[58,"1MA",74.279,63.972,33.383],[59,"U",70.618,58.472,33.026],[60,"C",73.252,56.436,38.285],[61,"C",75.643,58.316,43.84],[62,"A",71.882,60.684,48.244],[63,"C",66.263,61.75,50.244],[64,"A",60.204,61.569,49.339],[65,"G",55.988,59.17,46.06],[66,"A",53.671,55.677,41.542],[67,"A",53.319,50.645,38.32],[68,"U",55.168,44.94,37.012],[69,"U",57.582,39.88,39.4],[70,"C",59.348,35.925,43.805],[71,"G",59.688,34.434,49.701],[72,"C",57.653,35.834,55.45],[73,"A",53.508,38.772,58.837],[74,"C",47.463,40.541,58.985],[75,"C",42.564,38.194,56.568],[76,"A",37.607,38.379,58.569]];
const BASIS=[[-0.704858062764348,-0.41373289261369006,0.5761945894622744],[-0.23042024713417378,-0.6346941460188456,-0.7376109074031069],[0.6708812272427337,-0.6526778949672779,0.35203685084713265]];
const ORIGIN=[79.92,68.3735,33.5425];
R.register({
 id:'rna-evidence',chapter:['От структуры к предсказанию','From structure to prediction'],
 title:['Что предсказывать — и с чем сравнивать?','What do we predict — and how do we check it?'],
 status:['Эталон: PDB 1EHZ · прогноз здесь не вычислялся','Reference: PDB 1EHZ · no prediction is computed here'],
 source:['Shi & Moore, 2000 · PDB 1EHZ; Shen et al., 2024 · RhoFold+','https://www.nature.com/articles/s41592-024-02487-0'],
 states:[
  ['У этой тРНК есть экспериментальная 3D-модель; пары можно описать отдельно.',
   'This tRNA has an experimental 3D model; its pairs can be described separately.',
   'Это та же дрожжевая тРНК(Phe), PDB 1EHZ, модель 1, цепь A. Слева — первые семь оснований GCGGAUU из 76 остатков. В центре — фрагмент матрицы пар: строки и столбцы 3 и 70, две золотые ячейки кодируют одну пару G3–C70. Это не вся матрица 76 × 76. Справа — все 76 исходных координат C4′ из рентгеновской модели при разрешении 1,93 Å. Отрезки между соседними точками — упрощённый след цепи, а не химические связи. G3 и C70 выделены золотом. Пары являются аннотацией структуры, а не отдельными прямыми измерениями водородных связей. Модификации сохранены в данных. <a href="https://www.rcsb.org/structure/1EHZ" target="_blank" rel="noopener">Экспериментальная структура: 1EHZ.</a>',
   'This is the same yeast tRNA(Phe), PDB 1EHZ, model 1, chain A. The left shows its first seven bases GCGGAUU, out of 76 residues. The center is a pair-map submatrix: rows and columns 3 and 70, with two gold cells recording the single G3–C70 pair. It is not the whole 76 × 76 matrix. The right shows all 76 original C4′ coordinates from the 1.93 Å X-ray model. Links between consecutive points form a coarse trace, not chemical bonds. G3 and C70 are gold. Pairs are structural annotations, not separate direct measurements of hydrogen bonds. Modifications remain in the data. <a href="https://www.rcsb.org/structure/1EHZ" target="_blank" rel="noopener">Experimental structure: 1EHZ.</a>'],
  ['Оставим последовательность. Какие пары и координаты предстоит предсказать?',
   'Keep the sequence. Which pairs and coordinates remain to be predicted?',
   'Известные ответы скрыты, чтобы сформулировать задачу; молекула не изменилась. Одна задача выдаёт отношения между позициями (i,j), другая — пространственные координаты. Даже верные пары не определяют все ориентации стеблей. Это объяснение входа и целей, а не запуск модели или разбиение реального обучающего набора. Последовательность — общий исходный объект; методы могут использовать дополнительные признаки. Например, стандартный RhoFold+ получает представления RNA-FM и отдельно построенное множественное выравнивание родственных последовательностей (MSA). RNA-FM не выдаёт готовую карту пар. UFold — отдельный метод, а не обязательный шаг перед RhoFold+.',
   'The known answers are hidden to pose the task; the molecule has not changed. One task outputs relations between positions (i,j), another spatial coordinates. Even correct pairs do not specify every helix orientation. This explains inputs and targets; it does not run a model or partition a real training dataset. Sequence is the shared starting object; methods may use additional features. For example, standard RhoFold+ receives RNA-FM representations and an independently constructed multiple sequence alignment (MSA) of related sequences. RNA-FM does not output a finished pair map. UFold is a separate method, not a required step before RhoFold+.'],
  ['Предсказание проверяют по эталонам, которые не использовали при обучении.',
   'Check predictions against references that were not used in training.',
   'Эталон снова открыт. При реальной оценке предсказанные пары сравнивают с аннотацией, а координаты — с экспериментальной структурой после пространственного совмещения. Точность локальных пар и глобальной 3D-формы — разные характеристики. Независимость теста требует контроля сходства последовательностей, семейств и структур с обучением. Shen et al., 2024 используют, среди прочего, проверки по отдельным семействам и времени публикации структур. Здесь 1EHZ — только знакомый наглядный эталон: мы не утверждаем, что эта тРНК отсутствовала в обучении какого-либо метода. Выдуманный прогноз и численная точность не показаны. Далее свяжем эти разные задачи с конкретными моделями.',
   'The reference is visible again. In an actual evaluation, predicted pairs are compared with annotations and coordinates with experimental structures after spatial superposition. Local pairing accuracy and global 3D accuracy are different properties. Independent evaluation requires attention to sequence, family and structural similarity to training data. Shen et al., 2024 use family-based and time-based assessments, among other evaluations. Here 1EHZ is only a familiar illustrative reference: we do not claim this tRNA was absent from any method’s training set. No invented prediction or numerical accuracy is shown. Next we connect these distinct tasks to specific models.']
 ],
 qa:[
  {q:['Картинка справа — результат работы нейросети?','Is the structure on the right a neural-network output?'],a:['Нет. Это экспериментальная структурная модель 1EHZ, показанная как эталон. В этой сцене модель не запускалась.','No. It is experimental structural model 1EHZ, shown as a reference. No model was run in this scene.'],source:'Shi & Moore, 2000 · PDB 1EHZ',url:'https://www.rcsb.org/structure/1EHZ'},
  {q:['Почему две золотые ячейки означают одну пару?','Why do two gold cells represent one pair?'],a:['Пара 3–70 записана симметрично: M₃,₇₀ = M₇₀,₃ = 1.','Pair 3–70 is recorded symmetrically: M₃,₇₀ = M₇₀,₃ = 1.'],source:'Shi & Moore, 2000 · PDB 1EHZ',url:'https://www.rcsb.org/structure/1EHZ'},
  {q:['Что означает независимая проверка?','What does independent evaluation mean?'],a:['Проверочные ответы не участвуют в обучении; сходство последовательностей, семейств и структур тоже контролируют. 1EHZ здесь объясняет идею, а не объявляется тестовым примером конкретной модели.','Evaluation answers are excluded from training; sequence, family and structural similarity also need attention. Here 1EHZ explains the idea and is not claimed as a test example for any specific model.']}
 ],
 build(ctx,v){
  const state={hide:0,compare:0};
  R.box(v.svg,70,163,300,50,'Известно','Known',28,C.blue);
  R.box(v.svg,459,163,270,50,'Какие пары?','Which pairs?',28,C.gold);
  R.box(v.svg,841,163,355,50,'Какая форма в 3D?','What 3D shape?',28,C.blue);
  F.line(v.svg,414,228,414,475,C.grey,1);F.line(v.svg,805,228,805,475,C.grey,1);
  R.box(v.svg,70,244,300,43,'Последовательность','Sequence',25,C.white);
  const input=F.group(v.svg);
  [...'GCGGAUU'].forEach((base,i)=>{const g=F.group(input);F.at(g,95+i*40,332);F.dot(g,0,0,15,'var(--color-bg)').setAttribute('stroke',i===2?C.gold:C.blue);R.label(g,0,0,base,20,i===2?C.gold:C.white,31,33);R.label(g,0,38,String(i+1),16,C.grey,31,28);g.dataset.residueId=String(i+1);});
  R.box(v.svg,74,407,292,59,'тРНК(Phe) · 76 остатков\nпоказаны позиции 1–7','tRNA(Phe) · 76 residues\npositions 1–7 shown',21,C.grey);
  const pair=F.group(v.svg),structure=F.group(v.svg);
  // Genuine indexed submatrix: off-diagonal cells encode the same one pair.
  [3,70].forEach((id,i)=>{R.label(pair,556+i*57,257,String(id),21,C.grey,54,34);R.label(pair,503,303+i*57,String(id),21,C.grey,54,34);});
  for(let i=0;i<2;i++)for(let j=0;j<2;j++){const cell=R.rect(pair,530+j*57,277+i*57,52,52,i===j?C.grey:C.gold,i===j?'none':C.gold,3);cell.dataset.pairIndices=[3,70][i]+','+[3,70][j];}
  R.box(pair,454,413,283,51,'Одна пара: G3–C70','One pair: G3–C70',24,C.gold);
  const xyz=DATA.map(row=>{const p=row.slice(2).map((a,i)=>a-ORIGIN[i]);return BASIS.map(axis=>axis.reduce((sum,a,i)=>sum+a*p[i],0));});
  const bounds=[0,1].map(k=>[Math.min(...xyz.map(p=>p[k])),Math.max(...xyz.map(p=>p[k]))]);
  const scale=Math.min(278/(bounds[0][1]-bounds[0][0]),209/(bounds[1][1]-bounds[1][0]));
  const points=xyz.map(p=>[1016+(p[0]-(bounds[0][0]+bounds[0][1])/2)*scale,331+(p[1]-(bounds[1][0]+bounds[1][1])/2)*scale]);
  F.path(structure,points,C.blue,1.7);
  DATA.forEach((row,i)=>{const dot=F.dot(structure,...points[i],row[0]===3||row[0]===70?4.5:2.3,row[0]===3||row[0]===70?C.gold:C.blue);dot.dataset.residueId=String(row[0]);dot.dataset.componentId=row[1];dot.dataset.c4prime=row.slice(2).join(',');const title=D.dom.s('title');title.textContent=row[1]+' '+row[0]+' · C4′';dot.append(title);});
  R.box(structure,845,447,352,40,'Эксперимент · PDB 1EHZ','Experiment · PDB 1EHZ',21,C.grey);
  const pairMask=F.group(v.svg),threeMask=F.group(v.svg);
  R.box(pairMask,454,277,283,120,'?','?',76,C.gold);R.box(pairMask,448,400,295,78,'Предсказать\nотношения (i,j)','Predict\nrelations (i,j)',25,C.gold);
  R.box(threeMask,845,260,350,137,'?','?',76,C.blue);R.box(threeMask,842,400,356,78,'Предсказать\nкоординаты (x,y,z)','Predict\ncoordinates (x,y,z)',25,C.blue);
  const initial=R.box(v.svg,190,531,900,45,'Одна РНК · разные описания структуры','One RNA · different descriptions of structure',27,C.grey);
  const hidden=R.box(v.svg,180,528,920,55,'Вход сохранён; ответы скрыты','The input remains; the answers are hidden',27,C.gold);
  const check=R.box(v.svg,130,519,1020,68,'Предсказание ↔ независимый эталон','Prediction ↔ independent reference',30,C.gold);
  function paint(){
   const reveal=1-F.phase(state.hide,0,.42),mask=F.phase(state.hide,.58,1);
   F.opacity(pair,reveal);F.opacity(structure,reveal);F.opacity(pairMask,mask);F.opacity(threeMask,mask);
   F.opacity(initial.el,reveal*(1-F.phase(state.compare,0,.25)));
   F.opacity(hidden.el,mask*(1-F.phase(state.compare,0,.3)));F.opacity(check.el,F.phase(state.compare,.6,1));
   v.root.dataset.evidenceSource='1EHZ';v.root.dataset.evidenceResidues='76';v.root.dataset.evidencePair='3,70';v.root.dataset.evidenceIsPrediction='false';
  }
  return{state,paint,patches:[{hide:1},{hide:0,compare:1}],durations:[1200,1500]};
 }
});
})();
