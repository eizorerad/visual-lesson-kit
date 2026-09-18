/* Continuous comparative inference story. All MSA rows and 3D geometry are authored. */
(function(g){
'use strict';
const R=g.RNA,SEQ=R.seq,PAIRS=R.pairs;
const RC=[C.blue,C.teal,C.gold,C.purple,C.red,C.white];
const PC=[C.gold,C.blue,C.teal,C.purple,C.red];
const SOURCE=['Bernhart et al., 2008 · RNAalifold','https://doi.org/10.1186/1471-2105-9-474'];
const COV=['Lindgreen et al., 2006 · Measuring covariation','https://doi.org/10.1093/bioinformatics/btl514'];
const TEST=['Rivas et al., 2020 · Covariation detection power','https://doi.org/10.1093/bioinformatics/btaa080'];
function row(changes,loop){const a=[...SEQ];changes.forEach(([k,b])=>{const [i,j]=PAIRS[k];a[i]=b[0];a[j]=b[1];});if(loop)[...loop].forEach((b,k)=>a[k+5]=b);return a.join('');}
// Exactly the six invented rows used in prediction-comparative.js.
const ROWS=[SEQ,row([[0,'AU']],'GAA'),row([[0,'GU']],'AAC'),row([[0,'CG'],[2,'GC']],'UAA'),row([[0,'UA'],[1,'AU'],[4,'AU']],'AGA'),row([[1,'GC'],[2,'UA'],[3,'AU']],'AAA')];
function text(p,x,y,w,h,ru,en=ru,size=24,color=C.white,align='center'){return R.box(p,x,y,w,h,ru,en,size,color,align).el;}
function op(n,t){F.opacity(n,F.clamp(t));}
function mix(a,b,t){return[F.lerp(a[0],b[0],t),F.lerp(a[1],b[1],t)];}
function quad(a,c,b,t){return[(1-t)*(1-t)*a[0]+2*(1-t)*t*c[0]+t*t*b[0],(1-t)*(1-t)*a[1]+2*(1-t)*t*c[1]+t*t*b[1]];}
function glyph(p,base,index,color=C.white,r=17){
 const q=F.group(p),circle=F.dot(q,0,0,r,'var(--color-bg)');circle.setAttribute('stroke',color);circle.setAttribute('stroke-width',1.7);
 const label=text(q,-r,-r-2,2*r,2*r+4,base,base,23,color);
 q.dataset.base=base;q.dataset.baseIndex=String(index+1);return{g:q,circle,label};
}
function provenance(v){v.root.dataset.rnaSequence=SEQ;v.root.dataset.rnaPairs=JSON.stringify(PAIRS.map(p=>p.map(i=>i+1)));v.root.dataset.teachingMsa=JSON.stringify(ROWS);v.root.dataset.predictionRun='false';v.root.dataset.statisticalTestRun='false';}

R.register({
 id:'story-alignment',
 title:['Из выравнивания — в пары той же РНК','From aligned sequences to pairs in the same RNA'],
 source:SOURCE,
 status:['Придуманные гомологи · авторская иллюстрация вывода','Invented homologs · authored inference illustration'],
 states:[
  ['Начнём с шести родственных строк: пока позиции ещё не сопоставлены.','Begin with six related sequences, before corresponding positions are aligned.',
   'Шесть последовательностей придуманы для объяснения. H1 — та же учебная РНК GGACGAAACGUCC. Их разное положение на экране означает «ещё не сопоставлены», а не измеренные вставки или удаления. Мы не запускаем поиск гомологов или алгоритм выравнивания; в этом простом примере длины одинаковы и пропусков нет.',
   'These six sequences are invented for teaching. H1 is the same teaching RNA, GGACGAAACGUCC. Their staggered screen positions mean “not yet put into correspondence”, not measured insertions or deletions. No homology search or alignment algorithm is run; this simple example has equal lengths and no gaps.'],
  ['Строки сдвигаются в общие столбцы: теперь сравниваются соответствующие позиции.','The rows slide into shared columns, so corresponding positions can be compared.',
   'Двигаются те же буквы, а не новые последовательности. Номер столбца связывает соответствующие позиции гомологов. В реальных данных это сопоставление нужно обосновать; неоднозначное или подогнанное под структуру MSA может вводить в заблуждение. Совпадение номеров здесь задано автором.',
   'The same letters move, rather than being replaced by new sequences. A column index connects corresponding homologous positions. Real data require a defensible correspondence; an ambiguous alignment, or one fitted to a proposed structure, can mislead. The correspondence here is supplied by the author.'],
  ['Выделим столбцы 1 и 13: G–C, A–U, G–U, C–G, U–A, G–C.','Isolate columns 1 and 13: G–C, A–U, G–U, C–G, U–A, G–C.',
   'Те же крайние буквы вытягиваются из строк и становятся шестью наблюдениями одной пары столбцов. Все сочетания совместимы со спариванием: Watson–Crick G–C/A–U или wobble G–U с учётом направления. Цвет принадлежит строке H1…H6. Нижняя строка справа — явно обозначенная копия H1 для записи результата; сам MSA остаётся источником.',
   'The same endpoint letters are pulled out of their rows to become six observations of one column pair. Every combination is pairing-compatible: Watson–Crick G–C/A–U or wobble G–U, with orientation retained. Each color belongs to a row, H1…H6. The lower row on the right is an explicitly labelled copy of H1 for recording the result; the MSA remains the source.'],
  ['Цветные наблюдения переходят к дуге 1–13: так возникает гипотеза пары.','The colored observations move to arc 1–13, making a pairing hypothesis visible.',
   'Каждая цветная метка — копия наблюдения из определённой строки, перенесённая к той же паре индексов H1. Это объяснение направления вывода: совместимость сочетаний и изменения обоих столбцов могут поддерживать парное ограничение. Метки не являются независимыми голосами, вероятностями или p-value. RNAalifold дополнительно объединяет сравнительную информацию с термодинамикой; здесь программа не запускалась.',
   'Each colored marker is a copy of one row observation carried to the same pair of H1 indices. This shows the direction of inference: compatible combinations and changes in both columns can support a pair constraint. The markers are not independent votes, probabilities or p-values. RNAalifold also combines comparative information with thermodynamics; it was not run here.'],
  ['Одинаковые G–C дали бы совместимость; меняющиеся G–C/A–U дают ещё и изменения пары.','Invariant G–C would show compatibility; changing G–C/A–U also shows changes in the pair.',
   'Слева добавлен явно контрфактический контроль: что было бы, если бы все шесть строк имели G–C. Это не дополнительные данные и не изменение исходного MSA. Он совместим с парой, но не содержит совместных изменений. В реальных строках G–C и A–U различаются обеими позициями: это пример компенсаторного сочетания. G–C и G–U различаются одной позицией; это consistent substitution. Ни порядок замен, ни независимые эволюционные события по этой схеме не восстановлены.',
   'The left side adds an explicitly counterfactual control: what if all six rows contained G–C? It is neither additional data nor a modification of the original MSA. It is pairing-compatible but contains no coordinated changes. In the actual teaching rows, G–C and A–U differ at both positions, illustrating a compensatory combination. G–C and G–U differ at one position, a consistent substitution. This diagram reconstructs neither the order of mutations nor independent evolutionary events.'],
  ['Тот же приём проверяет 2–12 и 3–11; наблюдения доходят до своих дуг.','The same operation checks 2–12 and 3–11; observations reach their own arcs.',
   'Подсветка перемещается к следующей паре столбцов, а метки каждой строки следуют к соответствующим индексам целевой H1. Учебные строки совместимы и с этими парами. Повторяем видимую операцию, а не превращаем одну удачную пару в подтверждение всего стебля. Реальные методы оценивают множество допустимых пар и их совместимость с общей структурой.',
   'The highlight moves to the next column pair, and each row marker follows the corresponding H1 indices. The teaching rows are compatible with these pairs too. We repeat the visible operation rather than treating one favorable pair as confirmation of the whole stem. Real methods evaluate many possible pairs and their compatibility with a complete structure.'],
  ['Ещё две проверки добавляют 4–10 и 5–9 к тому же набору ограничений.','Two more checks add 4–10 and 5–9 to the same set of constraints.',
   'Все пять дуг привязаны к исходным индексам 13-нуклеотидной H1. Разные цвета дуг обозначают разные пары; маленькие цветные метки сохраняют происхождение от строк. В реальном анализе строки связаны филогенией, а пар проверяется много. Нужны подходящая нулевая модель, поправка на множественные проверки и оценка мощности; число цветных меток этого не заменяет. Для этой иллюстрации значимость не вычислялась.',
   'All five arcs attach to the original indices of the 13-nucleotide H1. Arc colors distinguish pairs; small colored markers retain their row provenance. In real analysis, rows are related by phylogeny and many pairs are tested. An appropriate null model, multiple-testing control and power assessment are needed; counting the colored markers does not replace them. No significance was calculated for this illustration.'],
  ['Те же буквы складываются в 2D: пять дуг становятся пятью перекладинами.','The same letters rearrange into 2D: five arcs become five rungs.',
   'Ни одна последовательность и ни одна пара при смене рисунка не меняются: (1,13), (2,12), (3,11), (4,10), (5,9); позиции 6–8 непарные. Это переукладка представления, а не биологическая траектория фолдинга. Получена иллюстрация гипотезы вторичной структуры, совместимой с придуманным MSA, а не результат RNAalifold или значимый результат R-scape. Следующий вопрос: определяют ли эти пять пар пространственную форму?',
   'Neither the sequence nor the pairs change during the rearrangement: (1,13), (2,12), (3,11), (4,10), (5,9); positions 6–8 are unpaired. This changes the representation, not the molecule’s biological folding trajectory. The result illustrates a secondary-structure hypothesis compatible with the invented MSA, not an RNAalifold output or a significant R-scape result. The next question is whether these five pairs determine spatial shape.']
 ],
 qa:[
  {q:['Шесть меток означают шесть независимых подтверждений?','Do six markers mean six independent confirmations?'],a:['Нет. Цвета сохраняют происхождение наблюдений, но родственные строки зависимы. Это иллюстрация, а не статистический тест.','No. Colors retain observation provenance, but related rows are dependent. This is an illustration, not a statistical test.'],source:TEST[0],url:TEST[1]},
  {q:['Почему контроль со всеми G–C слабее показывает ковариацию?','Why does the all-G–C control show less about covariation?'],a:['Он вообще не содержит изменений. Совместимость пары и консервация видны, но нельзя наблюдать согласованные изменения столбцов.','It contains no changes at all. Pair compatibility and conservation are visible, but coordinated column changes cannot be observed.'],source:COV[0],url:COV[1]},
  {q:['Эти дуги вычислены RNAalifold?','Were these arcs calculated by RNAalifold?'],a:['Нет. Пары и строки заданы автором. Настоящий RNAalifold сочетает термодинамические и сравнительные оценки, чтобы предсказать консенсус вторичной структуры из готового MSA.','No. The pairs and rows are authored. Real RNAalifold combines thermodynamic and comparative scores to predict a secondary-structure consensus from a precomputed MSA.']}
 ],
 build(ctx,v){
  const q=F.group(v.svg),s={aligned:0,pick:0,carry:0,contrast:0,sweepA:0,sweepB:0,fold:0};provenance(v);
  const fullHeading=F.group(q);text(fullHeading,80,158,1120,44,'Шесть гомологов одной семьи · H1 — наша РНК','Six homologs from one family · H1 is our RNA',27,C.white);
  const readHeading=F.group(q);text(readHeading,90,161,365,47,'Читаем столбцы 1 и 13','Read columns 1 and 13',25,C.white);
  const compactHeading=F.group(q);text(compactHeading,68,157,421,52,'Повторяем для соседних столбцов','Repeat for neighboring columns',24,C.white);
  const targetHeading=F.group(q);text(targetHeading,531,160,660,46,'Та же H1 · сохраняем номера','Same H1 · retain its indices',26,C.blue);
  const counterHeading=F.group(q);text(counterHeading,68,160,211,43,'Если все G–C','If all were G–C',22,C.grey);text(counterHeading,292,160,205,43,'В этом MSA','In this MSA',22,C.white);
  const indexed=Array.from({length:13},(_,i)=>{const n=F.group(q);text(n,-18,-14,36,28,String(i+1),String(i+1),15,C.grey);return n;});
  const columnFocus=[0,1].map(()=>{const n=R.rect(q,0,0,36,274,C.gold,C.gold,8);n.setAttribute('fill-opacity','.08');return n;});
  const rowLines=ROWS.map((_,r)=>F.line(q,0,0,0,0,RC[r],1.8));
  const rowLabels=ROWS.map((_,r)=>{const n=F.group(q);text(n,-28,-18,56,36,'H'+(r+1),'H'+(r+1),19,RC[r]);return n;});
  const cells=ROWS.map((seq,r)=>[...seq].map((b,i)=>{const a=glyph(q,b,i,C.white,17);a.g.dataset.msaRow=String(r+1);a.g.dataset.alignmentColumn=String(i+1);return a;}));
  const counter=F.group(q);
  ROWS.forEach((_,r)=>{const yy=254+r*42;F.line(counter,145,yy,215,yy,C.grey,1.6);['G','C'].forEach((b,j)=>{const a=glyph(counter,b,j?12:0,C.grey,17);F.at(a.g,j?235:125,yy);});});
  text(counter,69,499,205,65,'Совместимость\nбез изменений','Compatibility\nwithout changes',21,C.grey);
  const variation=F.group(q);text(variation,294,499,203,65,'Меняются\nобе позиции','Both positions\nchange',21,C.gold);
  const target=F.group(q),targetBack=R.path(target,'M0,0',C.grey,2.1);
  const arcs=PAIRS.map((pair,k)=>{const n=R.path(target,'M0,0',PC[k],2.8);n.dataset.pair=pair.map(i=>i+1).join(',');return n;});
  const targetNodes=[...SEQ].map((b,i)=>{const a=glyph(target,b,i,i>=5&&i<=7?C.grey:C.blue,17);a.g.dataset.targetSequence='H1';const index=F.group(a.g);text(index,-17,-13,34,26,String(i+1),String(i+1),14,C.grey);a.index=index;return a;});
  const rowTokens=PAIRS.map((pair,k)=>ROWS.map((_,r)=>{const n=F.dot(target,0,0,7,RC[r]);n.setAttribute('stroke','var(--color-bg)');n.setAttribute('stroke-width',2);n.dataset.evidenceRow='H'+(r+1);n.dataset.evidencePair=pair.map(i=>i+1).join(',');return n;}));
  const activePairLabel=F.group(q);text(activePairLabel,-93,-19,186,38,'1 ↔ 13','1 ↔ 13',27,C.gold);
  const copyNote=F.group(q);text(copyNote,527,585,659,25,'Копия H1 для записи пар','A copy of H1 for recording pairs',18,C.grey);
  const modelNote=F.group(q);text(modelNote,524,566,665,31,'5 пар · те же индексы · 2D-гипотеза','5 pairs · same indices · a 2D hypothesis',21,C.white);
  const provenanceLabel=F.group(q);text(provenanceLabel,69,577,431,29,'Придуманное MSA · это не p-value','Invented MSA · these are not p-values',18,C.grey);
  const markerKey=F.group(q);F.dot(markerKey,107,548,6,C.teal);text(markerKey,122,533,364,32,'Цветная метка = строка MSA','Colored marker = one MSA row',19,C.grey,'left');
  const shifts=[0,79,-41,55,-22,67];
  function flight(k){if(k===0)return s.carry;if(k===1)return F.phase(s.sweepA,.25,.59);if(k===2)return F.phase(s.sweepA,.70,1);if(k===3)return F.phase(s.sweepB,.16,.49);return F.phase(s.sweepB,.64,.97);}
  function targetPoints(){
   const end=R.hairpinPoints(852,377,1.10),f=s.fold;
   return end.map((p,i)=>{const start=mix([240+i*58,247],[510+i*52,536],F.phase(s.pick,.48,1));if(i<5||i>7){const left=i<5,mid=left?2:10,angle=(left?-1:1)*Math.PI*f/2,spacing=F.lerp(F.lerp(58,52,F.phase(s.pick,.48,1)),42.9,f),flatMid=mix([240+mid*58,247],[510+mid*52,536],F.phase(s.pick,.48,1)),c=mix(flatMid,end[mid],f);return[c[0]+(i-mid)*spacing*Math.cos(angle),c[1]+(i-mid)*spacing*Math.sin(angle)];}return[F.lerp(start[0],p[0],f),F.lerp(start[1],p[1],f)-25*Math.sin(Math.PI*f)];});
  }
  function arcGeometry(points,k){const[i,j]=PAIRS[k],a=points[i],b=points[j],f=s.fold;return{a:[a[0]+19*f,a[1]-19*(1-f)],b:[b[0]-19*f,b[1]-19*(1-f)],c:[(a[0]+b[0])/2,(a[1]+b[1])/2-(480-75*k)*(1-f)]};}
  function paint(){
   const compact=F.phase(s.sweepA,0,.20),contrast=s.contrast*(1-compact),pick=s.pick,extract=F.phase(pick,.16,.50),scan=F.phase(s.sweepA,.13,.31)+F.phase(s.sweepA,.60,.78)+F.phase(s.sweepB,.04,.22)+F.phase(s.sweepB,.54,.72);
   const nearest=Math.round(scan),active=PAIRS[nearest],selected=[active[0],active[1]],sourceY=r=>F.lerp(F.lerp(245+r*48,247+r*45,s.aligned),254+r*42,pick);
   op(fullHeading,1-F.phase(pick,0,.16));op(readHeading,F.phase(pick,.7,1)*(1-F.phase(s.contrast,0,.2))*(1-compact));op(counterHeading,F.phase(s.contrast,.7,1)*(1-F.phase(compact,0,.25)));op(compactHeading,F.phase(compact,.7,1));op(targetHeading,F.phase(pick,.7,1));op(counter,F.phase(s.contrast,.85,1)*(1-F.phase(compact,0,.06)));op(variation,F.phase(s.contrast,.7,1)*(1-F.phase(compact,0,.3)));op(provenanceLabel,1);op(markerKey,s.carry*(1-F.phase(s.contrast,0,.2))*(1-compact)+s.carry*F.phase(compact,.8,1));
   cells.forEach((rr,r)=>rr.forEach((cell,i)=>{
    const original=[F.lerp(230+i*55+shifts[r],240+i*58,s.aligned),sourceY(r)];
    let p=original;
    if(i===0||i===12)p=mix(original,[i===0?220+130*contrast:340+110*contrast,sourceY(r)],extract);
    p=mix(p,[110+i*29,254+r*42],compact);F.at(cell.g,...p);
    const chosen=compact>.5?selected.includes(i):i===0||i===12;
    const bright=F.lerp(1,chosen?1:.12*F.phase(s.sweepA,.20,.28),F.phase(pick,0,.16));op(cell.g,bright*(1-.54*s.fold));op(cell.circle,pick*(chosen?1:0));cell.label.setAttribute('fill',pick>.1&&chosen?RC[r]:C.white);cell.circle.setAttribute('stroke',RC[r]);
   }));
   rowLabels.forEach((n,r)=>{F.at(n,F.lerp(F.lerp(155+shifts[r]*(1-s.aligned),157+130*contrast,pick),76,compact),sourceY(r));op(n,1-.54*s.fold);});
   indexed.forEach((n,i)=>{
    const chosen=i===0||i===12,wide=240+i*58,focused=i===0?220+130*contrast:340+110*contrast;
    F.at(n,F.lerp(chosen?F.lerp(wide,focused,extract):wide,110+i*29,compact),F.lerp(211,214,pick));
    // Extracted and compact indices share actors but cross different paths.
    // Clear the outgoing labels, then reveal the compact set after it settles.
    const outgoing=(chosen?1:1-F.phase(pick,0,.16))*(1-F.phase(s.sweepA,0,.025));
    const incoming=F.phase(s.sweepA,.20,.28);
    op(n,s.aligned*(outgoing+incoming)*(1-.5*s.fold));
   });
   const lx=F.lerp(220+130*contrast,110+29*scan,compact),rx=F.lerp(340+110*contrast,110+29*(12-scan),compact);
   columnFocus.forEach((n,k)=>{n.setAttribute('x',(k?rx:lx)-20);n.setAttribute('y',230);n.setAttribute('height',257);op(n,F.phase(pick,.5,.8)*(1-.7*s.fold));});
   rowLines.forEach((n,r)=>{F.seg(n,lx+21,sourceY(r),rx-21,sourceY(r));op(n,F.phase(pick,.5,.8)*(1-.76*compact)*(1-.6*s.fold));});
   const points=targetPoints();targetBack.setAttribute('d',points.map((p,i)=>(i?'L':'M')+p.join(',')).join(' '));op(targetBack,F.phase(pick,.4,.8));
   targetNodes.forEach((n,i)=>{F.at(n.g,...points[i]);const before=points[Math.max(0,i-1)],after=points[Math.min(12,i+1)];let outward=Math.atan2(-(after[0]-before[0]),after[1]-before[1]);if(i<6&&outward<Math.PI/2)outward+=2*Math.PI;const a=F.lerp(Math.PI/2,outward,F.clamp(s.fold/.12));F.at(n.index,32*Math.cos(a),32*Math.sin(a));op(n.g,F.phase(pick,.74,.80));op(n.index,F.phase(pick,.92,1));});
   arcs.forEach((n,k)=>{const a=arcGeometry(points,k),t=flight(k);n.setAttribute('d',`M${a.a} Q${a.c} ${a.b}`);F.revealStroke(n,F.phase(t,.14,.84));});
   rowTokens.forEach((rr,k)=>rr.forEach((n,r)=>{
    const t=flight(k),a=arcGeometry(points,k),dest=quad(a.a,a.c,a.b,.26+r*.096),origin=k===0?[280,254+r*42]:[284,254+r*42];
    const p=quad(origin,[F.lerp(origin[0],dest[0],.46),Math.min(origin[1],dest[1])-75],dest,t);F.pos(n,...p);n.setAttribute('r',F.lerp(7,4.7,s.fold));op(n,(k===0?F.phase(pick,.7,.9)*(1-compact)+t*compact:t>0?1:0)*(1-.15*s.fold));
   }));
   F.at(activePairLabel,822,248);op(activePairLabel,F.phase(pick,.8,1)*(1-compact)*(1-s.fold));op(copyNote,F.phase(pick,.85,1)*(1-F.phase(s.fold,0,.2)));op(modelNote,F.phase(s.fold,.8,1));
   v.root.dataset.activeColumnPair=selected.map(i=>i+1).join(',');v.root.dataset.pairConstraints=JSON.stringify(PAIRS.filter((_,k)=>flight(k)>.99).map(p=>p.map(i=>i+1)));v.root.dataset.evidenceMarkersAreIndependent='false';
  }
  return{state:s,paint,patches:[{aligned:1},{pick:1},{carry:1},{contrast:1},{sweepA:1},{sweepB:1},{fold:1}],durations:[2300,2400,2800,2200,3000,3000,2900]};
 }
});

R.register({
 id:'story-alignment-shape',
 title:['Пять пар ещё не задают пространственную форму','Five pairs do not yet specify a spatial shape'],
 source:SOURCE,
 status:['Те же пары · грубая 3D-схема, не атомная модель','Same pairs · rough 3D schematic, not an atomic model'],
 states:[
  ['Сохраним результат MSA: те же пять пар и та же последовательность H1.','Keep the MSA result: the same five pairs and the same H1 sequence.',
   'Показана авторская вторичная структура GGACGAAACGUCC с парами (1,13), (2,12), (3,11), (4,10), (5,9). Цвета перекладин сохраняют идентичность пар предыдущей сцены. Это гипотеза, совместимая с придуманным MSA; значимость для неё не вычислялась. 2D-рисунок удобен для записи отношений, но расстояния и углы в нём не измерены.',
   'This is the authored secondary structure of GGACGAAACGUCC with pairs (1,13), (2,12), (3,11), (4,10), (5,9). Rung colors preserve the pair identities from the previous scene. This hypothesis is compatible with the invented MSA; no significance was calculated. The 2D layout records relationships, but its distances and angles are not measurements.'],
  ['Добавим схематическую глубину: пары остаются перекладинами спирали.','Add schematic depth while keeping the pairs as helix rungs.',
   'К тем же узлам добавлена придуманная глубина и закрутка стебля. Это грубая пространственная иллюстрация, не атомные координаты, не вычисленная A-форма и не симуляция фолдинга. В настоящей РНК пространственная организация включает геометрию оснований, сахаров и фосфатов, стэкинг и ограничения ковалентной цепи. Столбцы MSA сами по себе не предоставили эти координаты.',
   'The same nodes receive authored depth and stem twist. This is a rough spatial illustration, not atomic coordinates, a computed A-form structure or a folding simulation. Real RNA organization involves base, sugar and phosphate geometry, stacking and covalent-chain constraints. The MSA columns did not supply these coordinates.'],
  ['Повернём ту же спираль: ракурс меняется, номера пар сохраняются.','Rotate the same helix: the viewpoint changes while pair identities stay fixed.',
   'Поворачивается камера вокруг одной и той же условной геометрии. Цветные перекладины и индексы связывают пространственную проекцию с прежней картой пар. Это не новая гипотеза спаривания и не вывод скрытых координат из выравнивания. Поворот лишь делает выбранную глубину видимой.',
   'The camera rotates around one illustrative geometry. Colored rungs and indices link its spatial projection to the earlier pair map. This is neither a new pairing hypothesis nor an inference of hidden coordinates from the alignment. Rotation only makes the chosen depth visible.'],
  ['Изменим только петлю: другой рисунок пространства сохраняет все пять пар.','Change only the loop: a different spatial drawing retains all five pairs.',
   'Непарные позиции 6–8 смещаются в другую грубую форму петли, а пять пар остаются прежними. Две геометрии удовлетворяют нарисованной карте пар; мы не утверждаем, что обе атомистически допустимы, энергетически выгодны или наблюдались в эксперименте. Именно ограниченность парной карты и демонстрируется: она не задаёт единственные координаты непарных участков и всей молекулы.',
   'Unpaired positions 6–8 move into another rough loop shape while all five pairs stay fixed. Both drawings satisfy the displayed pair map; we do not claim that both are atomistically feasible, energetically favorable or experimentally observed. This demonstrates the limitation of a pair map: it does not uniquely specify the coordinates of unpaired regions or of the entire molecule.'],
  ['Сравнение последовательностей дало ограничения пар; для 3D нужна дополнительная модель.','Sequence comparison supplied pair constraints; 3D requires an additional model.',
   'Мы снова меняем ракурс, сохраняя пары, чтобы отделить информацию об отношениях от произвольно выбранной пространственной схемы. RNAalifold предсказывает консенсус вторичной структуры из MSA и энергетической модели; здесь он не запускался. Для предсказания 3D нужны дополнительные геометрические и энергетические модели, шаблоны, экспериментальные ограничения или иная информация. Нельзя трактовать эту анимацию как прямое вычисление 3D по шести строкам.',
   'Another viewpoint change preserves the pairs while distinguishing relational information from the arbitrarily chosen spatial schematic. RNAalifold predicts a secondary-structure consensus from an MSA and energy model; it was not run here. 3D prediction requires additional geometric and energetic models, templates, experimental restraints or other information. This animation must not be interpreted as directly computing 3D from six rows.']
 ],
 qa:[
  {q:['Поворот камеры вычисляет третичную структуру?','Does rotating the camera calculate tertiary structure?'],a:['Нет. Он только меняет проекцию уже заданных автором координат. Карта пар остаётся той же.','No. It only changes the projection of coordinates already supplied by the author. The pair map remains the same.']},
  {q:['Обе петли — реальные структуры этой РНК?','Are both loops real structures of this RNA?'],a:['Нет. Это грубые рисунки с одинаковыми парными ограничениями. Атомистическая допустимость, энергия и существование этих форм не проверялись.','No. They are rough drawings with identical pair constraints. Atomistic feasibility, energy and the existence of these forms were not tested.']}
 ],
 build(ctx,v){
  const q=F.group(v.svg),s={depth:0,turn:0,variant:0,stop:0};provenance(v);v.root.dataset.geometryStatus='rough-authored-not-atomic';
  const molecule=g.PM.create(q,{sequence:SEQ,pairs:PAIRS,radius:12});ctx.onDispose(molecule.dispose);
  const names=PAIRS.map(([i,j],k)=>{const p=F.group(q);F.line(p,0,0,66,0,PC[k],4);text(p,84,-19,152,38,(i+1)+' ↔ '+(j+1),(i+1)+' ↔ '+(j+1),25,PC[k],'left');F.at(p,112,260+k*51);return p;});
  text(q,83,168,350,53,'Результат: кто с кем','Result: which bases pair',27,C.white);
  const primary=F.group(q);text(primary,854,229,341,99,'Глубину и закрутку\nдобавляет модель','Depth and twist\ncome from a model',26,C.white);
  const alternative=F.group(q);text(alternative,854,226,341,110,'Другая петля.\nТе же пять пар.','A different loop.\nThe same five pairs.',27,C.gold);
  const boundary=F.group(q);text(boundary,835,225,363,135,'MSA → ограничения пар\n3D → дополнительная модель','MSA → pair constraints\n3D → additional model',26,C.white);text(boundary,849,388,345,74,'Координаты не получены\nиз этих шести строк','These six rows did not\nsupply the coordinates',22,C.grey);
  const loopMarker=R.path(q,'M0,0',C.gold,2);loopMarker.setAttribute('stroke-dasharray','4 6');
  const early=F.group(q);text(early,79,520,355,42,'Та же H1 · та же карта пар','Same H1 · same pair map',21,C.white);
  text(q,79,585,1121,28,'Придуманное MSA · грубая 3D-геометрия · не результат предсказания','Invented MSA · rough 3D geometry · not a prediction result',18,C.grey);
  function paint(){
   const yaw=-.22*s.depth+.44*s.turn-.20*s.stop,pitch=-.10*s.depth+.20*s.turn-.16*s.stop;
   molecule.paint({cx:638,cy:382,scale:1.06,fold:1,depth:s.depth,yaw,pitch,pairProgress:1,variant:s.variant,labelOpacity:1,indexOpacity:1,plateOpacity:.85});
   // Pair colors explicitly persist across the 2D-to-3D change of representation.
   molecule.links.forEach((n,k)=>{n.line.setAttribute('stroke',PC[k]);n.plate.setAttribute('stroke',PC[k]);n.plate.setAttribute('fill',PC[k]);});
   op(primary,s.depth*(1-F.phase(s.variant,0,.2))*(1-s.stop));op(alternative,F.phase(s.variant,.7,1)*(1-F.phase(s.stop,0,.2)));op(boundary,F.phase(s.stop,.7,1));
   names.forEach((n,k)=>{F.at(n,112,260+k*51);op(n,1);});
   const pts=molecule.positions();if(pts&&pts.length>7){const pt=pts[6],x=Array.isArray(pt)?pt[0]:pt.x,y=Array.isArray(pt)?pt[1]:pt.y;loopMarker.setAttribute('d',`M${x+32},${y-5} Q${x+101},${y-58} 851,286`);op(loopMarker,s.variant*(1-s.stop));}else op(loopMarker,0);
   v.root.dataset.spatialPairConstraints=JSON.stringify(PAIRS.map(p=>p.map(i=>i+1)));v.root.dataset.spatialVariant=String(s.variant);v.root.dataset.spatialGeometryComputed='false';
  }
  return{state:s,paint,patches:[{depth:1},{turn:1},{variant:1},{stop:1}],durations:[2700,2600,2600,2400]};
 }
});
})(window);
