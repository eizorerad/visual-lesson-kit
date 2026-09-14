/* Indexed representations of one invented, canonical-pair-compatible RNA. */
(function(g){
'use strict';
const R=g.RNA;
const SEQ='GCAAGCAAGCAAGC';
const STEM_A=[[0,9],[1,8]],STEM_B=[[4,13],[5,12]];
const NESTED='((......))....',CROSSING='((..[[..))..]]';
const X0=100,DX=50,Y=332,MX=890,MY=245,CELL=20;
const x=i=>X0+i*DX;
const cell=(i,j)=>[MX+(j+.5)*CELL,MY+(i+.5)*CELL];
const pairPoint=(pair,k)=>[(x(pair[0])+x(pair[1]))/2,Y-22-(k===0?108:78)];
function arcPath(pair,k){const a=x(pair[0]),b=x(pair[1]),height=k===0?108:78;return `M${a},${Y-22} Q${(a+b)/2},${Y-22-2*height} ${b},${Y-22}`;}
function trajectory(a,b,t,offset=0){
 const u=1-t,control=[b[0],a[1]-offset];
 return [u*u*a[0]+2*u*t*control[0]+t*t*b[0],u*u*a[1]+2*u*t*control[1]+t*t*b[1]];
}
function makeSequence(parent){
 const q=F.group(parent);F.line(q,X0,Y,x(SEQ.length-1),Y,C.grey,2);
 [...SEQ].forEach((base,i)=>{const n=F.group(q);n.dataset.baseIndex=i+1;n.dataset.base=base;F.at(n,x(i),Y);const dot=F.dot(n,0,0,21,'var(--color-bg)');dot.setAttribute('stroke',C.blue);dot.setAttribute('stroke-width',1.7);R.label(n,0,1,base,26,C.white,44,44);R.label(q,x(i),Y+38,String(i+1),18,C.grey,43,29);});
 return q;
}
function makeMatrix(parent){
 const q=F.group(parent),highlights=F.group(q);
 const row=R.rect(highlights,MX,MY,14*CELL,CELL,C.gold,C.gold,0);row.setAttribute('fill-opacity','.12');row.setAttribute('stroke-width',1.2);
 const col=R.rect(highlights,MX,MY,CELL,14*CELL,C.gold,C.gold,0);col.setAttribute('fill-opacity','.12');col.setAttribute('stroke-width',1.2);
 for(let k=0;k<14;k++){
  const diag=R.rect(q,MX+k*CELL,MY+k*CELL,CELL,CELL,'none',C.grey,0);diag.setAttribute('fill-opacity','.1');
  R.label(q,MX+(k+.5)*CELL,MY-17,String(k+1),14,C.grey,CELL,24);
  R.label(q,MX-21,MY+(k+.5)*CELL,String(k+1),14,C.grey,30,CELL);
 }
 for(let k=0;k<=14;k++){F.line(q,MX+k*CELL,MY,MX+k*CELL,MY+14*CELL,C.grey,.55);F.line(q,MX,MY+k*CELL,MX+14*CELL,MY+k*CELL,C.grey,.55);}
 R.label(q,MX-21,MY-17,'i / j',18,C.grey,45,28);
 R.box(q,859,546,334,48,'Mᵢⱼ = Mⱼᵢ','Mᵢⱼ = Mⱼᵢ',27,C.gold);
 F.opacity(highlights,0);return {g:q,highlights};
}
function makeArcs(parent,pairs,color){return pairs.map((pair,k)=>{const n=R.path(parent,arcPath(pair,k),color,3.5);n.dataset.pair=(pair[0]+1)+','+(pair[1]+1);return n;});}
function makeSymbols(parent){
 const q=F.group(parent);
 R.box(q,70,458,730,33,'dot-bracket: точка = непарный нуклеотид','dot-bracket: dot = unpaired nucleotide',24,C.grey);
 const positions=[...NESTED].map((ch,i)=>{const n=F.group(q);F.at(n,x(i),425);return n;});
 const chars=[...NESTED].map((ch,i)=>R.label(positions[i],0,0,ch,31,ch==='.'?C.grey:C.gold,43,46));
 return {g:q,chars,positions};
}
function makeRecords(parent,pairs,color){
 return pairs.flatMap((pair,k)=>[pair,[pair[1],pair[0]]].map((ij,side)=>{
  const node=F.dot(parent,0,0,6.5,color);node.dataset.pair=(ij[0]+1)+','+(ij[1]+1);node.dataset.matrixRecord='true';
  return {node,source:pairPoint(pair,k),target:cell(...ij),k,side};
 }));
}
function paintRecords(records,progress){records.forEach(r=>{const t=F.phase(progress,0.08+r.k*.1,.78+r.k*.1);F.pos(r.node,...trajectory(r.source,r.target,t,r.side*16));F.opacity(r.node,progress>0?1:0);});}
function metadata(root,pairs,brackets){root.dataset.rnaSequence=SEQ;root.dataset.rnaPairs=JSON.stringify(pairs.map(p=>p.map(i=>i+1)));root.dataset.rnaDotBracket=brackets;}
R.register({
 id:'rna-representations',
 title:['Одни пары — три записи','The same pairs in three representations'],
 chapter:['6 · Пары и алгоритмы','6 · Pairs and algorithms'],
 source:['Nussinov et al., 1978 · Algorithms for Loop Matchings','https://doi.org/10.1137/0135006'],
 states:[
  ['Запишем стебель через индексы: пары 1–10 и 2–9.','Describe a stem using indices: pairs 1–10 and 2–9.',
   'Авторская последовательность GCAAGCAAGCAAGC длины L = 14. Заданы пары (1,10) = G–C и (2,9) = C–G; остальные позиции непарные. Это иллюстрация представления, а не предсказанная или экспериментально определённая структура. Дуга означает связь между индексами, а не форму молекулы в пространстве.',
   'The invented sequence GCAAGCAAGCAAGC has length L = 14. The supplied pairs are (1,10) = G–C and (2,9) = C–G; all other positions are unpaired. This illustrates a representation, not a predicted or experimentally determined structure. An arc encodes a relation between indices, not the molecule’s spatial shape.'],
  ['Каждому индексу соответствует один символ: ((......))....','Each index has one symbol: ((......))....',
   'В dot-bracket точка обозначает непарный нуклеотид. Согласованные круглые скобки обозначают пары: внешние скобки связывают 1 с 10, внутренние — 2 с 9. Символы стоят строго под теми же индексами. Вложенность позволяет прочитать такие пары обычным стеком скобок.',
   'In dot-bracket notation a dot denotes an unpaired nucleotide. Matching parentheses encode the pairs: the outer parentheses connect 1 with 10, and the inner parentheses connect 2 with 9. Symbols remain under the same indices. Nesting allows these pairs to be read using a conventional bracket stack.'],
  ['Каждую пару записываем в две симметричные ячейки матрицы.','Record each pair in two symmetric matrix cells.',
   'Матрица M — другая запись того же набора пар. Mᵢⱼ = 1 тогда и только тогда, когда i и j образуют пару; Mⱼᵢ = 1 отражает ту же неориентированную связь. Поэтому две метки — не две независимые пары. Метки движутся от дуги как копии записи отношения. Пустые ячейки означают 0, диагональ равна 0. Строки i и столбцы j используют те же индексы 1…14.',
   'The matrix M is another representation of the same pair set. Mᵢⱼ = 1 exactly when i and j pair; Mⱼᵢ = 1 records the same undirected relationship. Thus the two marks are not two independent pairs. Moving marks are copies of the relation record. Blank cells mean 0 and the diagonal is 0. Rows i and columns j use the same indices 1…14.'],
  ['В этой модели у каждого нуклеотида не больше одного партнёра.','In this model each nucleotide has at most one partner.',
   'Подсвечены первая строка и первый столбец: позиция 1 связана только с позицией 10. Базовый алгоритм Нуссинова ищет структуру без псевдоузлов, максимизируя число допустимых пар с помощью динамического программирования по интервалам. Для длины L стандартная формулировка требует O(L³) времени и O(L²) памяти; ограничения на минимальную петлю задаются отдельно. Это учебная базовая модель, а не полная термодинамическая модель РНК. Наша схема показывает заданный допустимый набор, а не оптимум этого алгоритма.',
   'The first row and column are highlighted: position 1 pairs only with position 10. The baseline Nussinov algorithm finds a pseudoknot-free structure that maximizes the number of allowed pairs, using interval dynamic programming. For length L, the standard formulation uses O(L³) time and O(L²) memory; minimum-loop constraints are specified separately. It is a teaching baseline, not a full RNA thermodynamic model. This diagram shows a supplied admissible pair set, not the optimum of that algorithm.']
 ],
 qa:[
  {q:['Почему в матрице четыре метки, а пар только две?','Why are there four matrix marks but only two pairs?'],a:['Матрица симметрична: каждая неориентированная пара записана дважды, в (i,j) и (j,i).','The matrix is symmetric: each undirected pair is recorded twice, at (i,j) and (j,i).']},
  {q:['Как прочитать ((......))....?','How do you read ((......))....?'],a:['Пары: 1–10 и 2–9. Позиции 3–8 и 11–14 непарные. Всего 14 символов для 14 нуклеотидов.','The pairs are 1–10 and 2–9. Positions 3–8 and 11–14 are unpaired. There are 14 symbols for 14 nucleotides.']},
  {q:['Матрица пар задаёт трёхмерные координаты?','Does a pair matrix specify three-dimensional coordinates?'],a:['Нет. Она задаёт отношения между индексами. Для третичной структуры нужны дополнительные геометрические и физические ограничения.','No. It specifies relationships between indices. Tertiary structure requires additional geometric and physical constraints.']},
  {q:['Какова сложность базового алгоритма Нуссинова?','What is the complexity of the baseline Nussinov algorithm?'],a:['Для структуры без псевдоузлов: O(L³) времени и O(L²) памяти в стандартной интервальной формулировке. Модель максимизирует число разрешённых пар.','For pseudoknot-free structures: O(L³) time and O(L²) memory in the standard interval formulation. The model maximizes the number of allowed pairs.']}
 ],
 build(ctx,v){
  const q=F.group(v.svg),state={symbols:0,map:0,focus:0};
  R.box(q,70,147,730,42,'Вложенные пары','Nested pairs',27);
  R.box(q,847,147,358,56,'Матрица тех же пар','Matrix of the same pairs',26);
  makeArcs(q,STEM_A,C.gold);makeSequence(q);const symbols=makeSymbols(q),matrix=makeMatrix(q),records=makeRecords(q,STEM_A,C.gold);
  R.box(q,75,515,725,69,'1 < 2 < 9 < 10: пары вложены','1 < 2 < 9 < 10: nested pairs',28,C.gold);
  function paint(){
   // Keep the fading symbol row below the full serif bounds of the indices.
   symbols.positions.forEach((n,i)=>F.at(n,x(i),F.lerp(412,425,state.symbols)));
   F.opacity(symbols.g,state.symbols);paintRecords(records,state.map);F.opacity(matrix.highlights,state.focus*.75);
   metadata(v.root,STEM_A,NESTED);v.root.dataset.rnaMapComplete=String(state.map===1);
  }
  return {state,paint,patches:[{symbols:1},{map:1},{focus:1}],durations:[1300,2300,1000]};
 }
});
R.register({
 id:'rna-pseudoknot',
 title:['Псевдоузел: пары пересекаются по индексам','A pseudoknot: pairs cross in index order'],
 chapter:['7 · Псевдоузлы','7 · Pseudoknots'],
 source:['UFold · Fu et al., 2022','https://doi.org/10.1093/nar/gkab1074'],
 states:[
  ['Сохраняем последовательность, индексы и первые две пары.','Keep the sequence, indices, and the first two pairs.',
   'Сохраняется учебная последовательность GCAAGCAAGCAAGC и пары (1,10), (2,9). Цвет обозначает набор пар, а не тип основания. Схема намеренно мала и не утверждает, что эта последовательность реально образует показанный псевдоузел.',
   'The toy sequence GCAAGCAAGCAAGC and pairs (1,10), (2,9) are retained. Color identifies the pair set, not the base type. This deliberately small schematic does not claim that the sequence actually forms the displayed pseudoknot.'],
  ['Добавим пары 5–14 и 6–13. Для них используем [ и ].','Add pairs 5–14 and 6–13, encoded by [ and ].',
   'Новые пары (5,14) = G–C и (6,13) = C–G совместимы с основаниями и не используют уже занятые позиции. Получается расширенная запись ((..[[..))..]]. Круглые и квадратные скобки сопоставляются независимо; второй тип скобок нужен, чтобы выразить пересечение между двумя наборами пар. Это одна из конвенций расширенного dot-bracket.',
   'The added pairs (5,14) = G–C and (6,13) = C–G are base-compatible and use previously unpaired positions. The extended notation becomes ((..[[..))..]]. Parentheses and square brackets are matched independently; a second bracket type expresses crossings between the two pair sets. This is one extended dot-bracket convention.'],
  ['Матрица сохраняет все четыре пары и свою симметрию.','The matrix retains all four pairs and remains symmetric.',
   'В матрице появились записи (5,14), (14,5), (6,13), (13,6). Псевдоузел не мешает представить структуру матрицей пар: каждая позиция по-прежнему имеет не больше одного партнёра. Матрица не делает найденный набор автоматически физически допустимым. UFold предсказывает карту пар с помощью свёрточной архитектуры U-Net и последующей обработки; U-Net не является механизмом attention. RNA-FM даёт контекстные эмбеддинги, а не самодостаточный решатель задачи фолдинга.',
   'The matrix gains entries (5,14), (14,5), (6,13), and (13,6). A pseudoknot can still be represented by a pair matrix: every position still has at most one partner. A matrix does not automatically make a pair set physically valid. UFold predicts a pair map using a convolutional U-Net architecture and postprocessing; U-Net is not an attention mechanism. RNA-FM provides contextual embeddings, not a self-contained folding solver.'],
  ['Пересечение дуг не означает, что цепь проходит сквозь себя.','Crossing arcs do not mean that the chain passes through itself.',
   'Для пар (i,j) = (1,10) и (k,l) = (5,14) выполняется i < k < j < l: 1 < 5 < 10 < 14. Это пересечение на схеме индексов, а не пересечение ковалентного остова РНК в пространстве. Обычная вложенная интервальная декомпозиция Нуссинова исключает такие пары; динамическое программирование само по себе не «ломается». Для разрешённых классов псевдоузлов существуют другие, более дорогие формулировки; сложность зависит от класса и модели. Дуги не показывают физический путь фолдинга.',
   'For pairs (i,j) = (1,10) and (k,l) = (5,14), i < k < j < l holds: 1 < 5 < 10 < 14. This is a crossing in an index diagram, not an intersection of the RNA covalent backbone in space. The usual nested interval decomposition of Nussinov excludes these pairs; dynamic programming itself does not “break.” Other, more expensive formulations handle permitted classes of pseudoknots, with complexity depending on the class and model. The arcs do not depict a physical folding pathway.']
 ],
 qa:[
  {q:['Какой точный признак псевдоузла показан?','What precise pseudoknot criterion is shown?'],a:['Есть пары (i,j) и (k,l) с i < k < j < l. Здесь (1,10) и (5,14), то есть 1 < 5 < 10 < 14.','There are pairs (i,j) and (k,l) with i < k < j < l. Here they are (1,10) and (5,14), so 1 < 5 < 10 < 14.']},
  {q:['Какие пары кодирует ((..[[..))..]]?','Which pairs does ((..[[..))..]] encode?'],a:['Круглые скобки: 1–10 и 2–9. Квадратные: 5–14 и 6–13. Позиции 3, 4, 7, 8, 11, 12 непарные.','Parentheses: 1–10 and 2–9. Square brackets: 5–14 and 6–13. Positions 3, 4, 7, 8, 11, and 12 are unpaired.']},
  {q:['Почему это не означает физическое самопересечение цепи?','Why does this not imply physical self-intersection of the chain?'],a:['Дуги рисуют отношения между позициями одномерной последовательности. Они не являются трёхмерной траекторией ковалентного остова.','Arcs encode relations between positions in a one-dimensional sequence. They are not the three-dimensional trajectory of the covalent backbone.']},
  {q:['Можно ли использовать динамическое программирование для псевдоузлов?','Can dynamic programming be used for pseudoknots?'],a:['Да, для определённых классов и моделей существуют специальные, более дорогие алгоритмы. Базовый алгоритм Нуссинова с вложенной интервальной декомпозицией их исключает.','Yes, specialized and more expensive algorithms exist for certain classes and models. The baseline Nussinov algorithm with nested interval decomposition excludes them.']},
  {q:['UFold использует attention для карты пар?','Does UFold use attention for its pair map?'],a:['Его основная предсказывающая архитектура — свёрточная U-Net. Предсказанные оценки пар требуют обработки ограничений; это отличается от контекстных эмбеддингов RNA-FM.','Its core prediction architecture is a convolutional U-Net. Predicted pair scores require constraint processing; this differs from RNA-FM contextual embeddings.']}
 ],
 build(ctx,v){
  const q=F.group(v.svg),state={second:0,map:0,witness:0};
  R.box(q,70,147,730,42,'Два набора пар','Two pair sets',27);
  R.box(q,847,147,358,56,'Та же матрица пар','The same pair matrix',26);
  makeArcs(q,STEM_A,C.gold);const second=makeArcs(q,STEM_B,C.teal);makeSequence(q);const symbols=makeSymbols(q),matrix=makeMatrix(q);
  const initial=makeRecords(q,STEM_A,C.gold),added=makeRecords(q,STEM_B,C.teal);initial.forEach(r=>F.pos(r.node,...r.target));
  const witness=F.group(q);
  [[0,C.gold],[4,C.teal],[9,C.gold],[13,C.teal]].forEach(([i,color])=>{const n=F.dot(witness,x(i),Y+38,15,'none');n.setAttribute('stroke',color);n.setAttribute('stroke-width',1.8);});
  R.box(witness,77,513,722,45,'1 < 5 < 10 < 14','1 < 5 < 10 < 14',30);
  R.box(witness,77,558,722,43,'i < k < j < l: пары пересекаются','i < k < j < l: crossing pairs',26,C.grey);
  const pairedB=new Set(STEM_B.flat());
  function paint(){
   second.forEach((n,k)=>F.revealStroke(n,F.phase(state.second,k*.13,.82+k*.13)));
   const showingSecond=state.second>=.6;
   symbols.chars.forEach((n,i)=>{const ch=showingSecond?CROSSING[i]:NESTED[i];if(n.textContent!==ch)n.textContent=ch;n.setAttribute('fill',pairedB.has(i)&&showingSecond?C.teal:ch==='.'?C.grey:C.gold);});
   paintRecords(added,state.map);F.opacity(witness,state.witness);F.opacity(matrix.highlights,0);
   metadata(v.root,showingSecond?STEM_A.concat(STEM_B):STEM_A,showingSecond?CROSSING:NESTED);v.root.dataset.rnaMapComplete=String(state.map===1);
  }
  return {state,paint,patches:[{second:1},{map:1},{witness:1}],durations:[1900,2200,1000]};
 }
});
})(window);
