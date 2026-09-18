/* Comparative evidence: invented homologs, retained column identities, no predictor run. */
(function(g){
'use strict';
const R=g.RNA;
const SEQ=R.seq,PAIRS=R.pairs;
const sources={
 covariance:['Lindgreen et al., 2006 · Measuring covariation','https://doi.org/10.1093/bioinformatics/btl514'],
 rscape:['Rivas et al., 2020 · Covariation detection power','https://doi.org/10.1093/bioinformatics/btaa080'],
 hybrid:['Tan et al., 2017 · TurboFold II','https://doi.org/10.1093/nar/gkx815']
};
function txt(p,x,y,w,h,ru,en=ru,size=24,color=C.white,align='center'){
 return R.box(p,x,y,w,h,ru,en,size,color,align).el;
}
function teachingRow(changes,loop){
 const row=[...SEQ];changes.forEach(([pair,bases])=>{const [i,j]=PAIRS[pair];row[i]=bases[0];row[j]=bases[1];});
 if(loop)for(let k=0;k<3;k++)row[k+5]=loop[k];return row.join('');
}
const ROWS=[SEQ,teachingRow([[0,'AU']],'GAA'),teachingRow([[0,'GU']],'AAC'),teachingRow([[0,'CG'],[2,'GC']],'UAA'),teachingRow([[0,'UA'],[1,'AU'],[4,'AU']],'AGA'),teachingRow([[1,'GC'],[2,'UA'],[3,'AU']],'AAA')];
function stroke(p,x1,y1,x2,y2,color=C.grey,width=2){return F.line(p,x1,y1,x2,y2,color,width);}
function arrow(p,x1,y1,x2,y2,color=C.blue){
 const n=F.group(p);stroke(n,x1,y1,x2,y2,color,2.4);
 const a=Math.atan2(y2-y1,x2-x1),r=8;
 R.path(n,`M${x2-r*Math.cos(a-.55)},${y2-r*Math.sin(a-.55)} L${x2},${y2} L${x2-r*Math.cos(a+.55)},${y2-r*Math.sin(a+.55)}`,color,2.4);return n;
}
function baseGlyph(p,base,i,color=C.blue,radius=17,withIndex=false){
 const q=F.group(p),circle=F.dot(q,0,0,radius,'var(--color-bg)');circle.setAttribute('stroke',color);circle.setAttribute('stroke-width',2);
 txt(q,-radius,-radius-1,2*radius,2*radius+2,base,base,radius*1.25);
 // The index box lives at its final offset in the nucleotide group's coordinates.
 // Moving the whole group preserves both text geometry and its layout contract.
 const offset=i<5?[-62,-12]:i>7?[26,-12]:i===5?[-53,-46]:i===6?[-18,-55]:[17,-46];
 const index=withIndex?txt(q,offset[0],offset[1],36,25,String(i+1),String(i+1),15,C.grey):null;
 q.dataset.baseIndex=String(i+1);q.dataset.base=base;return {g:q,circle,index};
}
function provenance(v){v.root.dataset.rnaSequence=SEQ;v.root.dataset.rnaPairs=JSON.stringify(PAIRS.map(p=>p.map(i=>i+1)));v.root.dataset.predictionRun='false';}

R.register({
 id:'pred-msa',
 title:['Как выравнивание подсказывает пары','How an alignment suggests base pairs'],
 source:['Bernhart et al., 2008 · RNAalifold','https://doi.org/10.1186/1471-2105-9-474'],
 status:['Учебное MSA · строки придуманы · тест не запускался','Teaching MSA · invented rows · no statistical test run'],
 states:[
  ['Одна и та же РНК: 13 позиций, сохраняем их номера.','The same RNA: 13 positions, with their indices retained.',
   'Первая строка — знакомая учебная последовательность GGACGAAACGUCC. Здесь мы не запускаем поиск гомологов или предсказание. Номера обозначают столбцы будущего выравнивания; в этой специально простой схеме нет вставок или удалений.',
   'The first row is the familiar teaching sequence GGACGAAACGUCC. No homology search or prediction is run here. Indices identify columns of the eventual alignment; this deliberately simple example contains no insertions or deletions.'],
  ['Добавим гомологи: сравниваем соответствующие столбцы.','Add homologs: compare corresponding alignment columns.',
   'Все шесть строк придуманы. Они иллюстрируют MSA гомологов, сохраняющих заданную шпильку: пары 1–13, 2–12, 3–11, 4–10 и 5–9 совместимы с основаниями во всех строках. В реальном анализе гомологию и правильность сопоставления столбцов нужно обосновать. Близкие копии не дают независимых эволюционных наблюдений.',
   'All six rows are invented. They illustrate an MSA of homologs compatible with a supplied hairpin: pairs 1–13, 2–12, 3–11, 4–10 and 5–9 are allowed in every row. In real analysis, homology and correct column correspondence require evidence. Closely related copies do not provide independent evolutionary observations.'],
  ['В столбцах 1 и 13 меняются основания, совместимость остаётся.','Bases change in columns 1 and 13, while pairing remains compatible.',
   'Выделенные столбцы содержат G–C, A–U, G–U, C–G, U–A и G–C. Наличие допустимых сочетаний — подсказка к гипотезе пары, а не статистическое доказательство. Следующая сцена отделяет одиночную consistent substitution от изменений обеих позиций. R-scape здесь не запускался; шесть придуманных строк нельзя выдавать за подтверждённую ковариацию.',
   'The highlighted columns contain G–C, A–U, G–U, C–G, U–A and G–C. Compatible combinations suggest a pairing hypothesis; they are not statistical proof. The next scene distinguishes a single consistent substitution from changes at both positions. R-scape was not run, and these six invented rows must not be presented as validated covariation.'],
  ['Те же индексы связывают MSA и карту вторичной структуры.','The same indices connect the MSA to a secondary-structure map.',
   'Копии символов первой строки переходят в другую запись той же последовательности. Это перенос представления, а не физическая траектория сворачивания. Показанные пять пар заданы автором и совместимы с учебным MSA; они не вычислены RNAalifold. Вход RNAalifold — готовое выравнивание: программа сочетает термодинамическую оценку с оценкой совместимости и ковариации и предсказывает консенсус пар.',
   'Copies of first-row symbols move into another representation of the same sequence. This changes the representation, not the molecule’s physical folding trajectory. The five displayed pairs are supplied by the author and compatible with the teaching MSA; RNAalifold did not compute them. RNAalifold takes a precomputed alignment, combines thermodynamic scoring with compatibility and covariation scoring, and predicts a consensus pair structure.']
 ],
 qa:[
  {q:['Эти шесть строк доказывают структуру?','Do these six rows prove the structure?'],a:['Нет. Это придуманная иллюстрация. Для реальных гомологов нужны надёжное MSA, проверка значимости и оценка мощности.','No. This is an invented illustration. Real homologs require a reliable MSA, significance testing and a power estimate.'],source:sources.rscape[0],url:sources.rscape[1]},
  {q:['Почему одинаковые столбцы недостаточны?','Why are invariant columns insufficient?'],a:['Неизменные G и C совместимы с парой, но не показывают согласованных изменений. Консервация и ковариация — разные виды информации.','Invariant G and C are compatible with a pair, but show no coordinated changes. Conservation and covariation provide different information.'],source:sources.covariance[0],url:sources.covariance[1]}
 ],
 build(ctx,v){
  const q=F.group(v.svg),state={rows:0,focus:0,map:0},x0=151,dx=41,y0=267,dy=43;
  provenance(v);v.root.dataset.teachingMsa=JSON.stringify(ROWS);
  txt(q,78,163,600,46,'Последовательности → столбцы','Sequences → alignment columns',28,C.white);
  const mappedTitle=F.group(q);txt(mappedTitle,762,163,440,46,'Та же строка → шпилька','The same row → a hairpin',28,C.white);
  const selected=F.group(q);
  [0,12].forEach(i=>{const n=R.rect(selected,x0+i*dx-19,224,38,284,C.gold,C.gold,7);n.setAttribute('fill-opacity','.10');});
  for(let i=0;i<13;i++)txt(q,x0+i*dx-19,217,38,29,String(i+1),String(i+1),17,C.grey);
  const rootOutline=R.rect(q,112,246,552,40,C.blue,'none',7);
  const rows=ROWS.map((seq,r)=>{
   const row=F.group(q);txt(row,73,y0+r*dy-17,34,34,'H'+(r+1),'H'+(r+1),19,r===0?C.blue:C.grey);
   [...seq].forEach((base,i)=>{const color=i===0||i===12?C.gold:i>=5&&i<=7?C.grey:C.blue;const t=txt(row,x0+i*dx-18,y0+r*dy-18,36,36,base,base,25,color);t.dataset.alignmentColumn=String(i+1);t.dataset.msaRow=String(r+1);});
   return row;
  });
  const explanation=F.group(q);
  stroke(explanation,x0,519,x0,530,C.gold,2);stroke(explanation,x0,530,x0+12*dx,530,C.gold,2);stroke(explanation,x0+12*dx,519,x0+12*dx,530,C.gold,2);
  txt(explanation,116,539,548,46,'1 ↔ 13: сохраняется допустимая пара','1 ↔ 13: compatible pairing is retained',23,C.gold);
  const map=F.group(q),back=R.path(map,'M0,0',C.grey,2.2),links=PAIRS.map((p,k)=>{const l=stroke(map,0,0,0,0,k===0?C.gold:C.blue,2.2);l.dataset.pair=p.map(i=>i+1).join(',');return l;});
  const glyphs=[...SEQ].map((base,i)=>baseGlyph(map,base,i,i===0||i===12?C.gold:i>=5&&i<=7?C.grey:C.blue,17,true));
  const target=R.hairpinPoints(968,379,.87);
  const diagramNote=F.group(q);txt(diagramNote,758,532,448,43,'5 заданных пар · петля 6–8','5 supplied pairs · loop 6–8',23,C.grey);
  txt(q,750,578,459,26,'Учебные строки · не результат теста','Invented rows · not a statistical test',18,C.grey);
  function paint(){
   const moved=F.phase(state.map,.07,.45),bend=F.phase(state.map,.45,1);
   rows.forEach((row,r)=>F.opacity(row,r===0?1-F.phase(state.map,0,.065)+.7*F.phase(state.map,.50,.66):F.phase(state.rows,(r-1)*.1,.55+(r-1)*.1)));
   F.opacity(rootOutline,1-.55*state.map);F.opacity(selected,state.focus);F.opacity(explanation,state.focus);
   F.opacity(mappedTitle,state.map);F.opacity(diagramNote,F.phase(state.map,.8,1));
   const points=target.map((end,i)=>{
    const flat=[740+i*36,y0];let bent;
    if(i<5||i>7){
     // Each future stem side turns as a rigid five-letter segment, so letters
     // remain separated during the change of representation.
     const left=i<5,k=left?i:i-8,mid=left?2:10,angle=(left?-1:1)*bend*Math.PI/2;
     const center=[F.lerp(740+mid*36,target[mid][0],bend),F.lerp(y0,target[mid][1],bend)],spacing=F.lerp(36,39*.87,bend);
     bent=[center[0]+(k-2)*spacing*Math.cos(angle),center[1]+(k-2)*spacing*Math.sin(angle)];
    }else bent=[F.lerp(flat[0],end[0],bend),F.lerp(flat[1],end[1],bend)-30*Math.sin(Math.PI*bend)];
    return [F.lerp(x0+i*dx,flat[0],moved)+bent[0]-flat[0],y0+bent[1]-flat[1]];
   });
   back.setAttribute('d',points.map((p,i)=>(i?'L':'M')+p.join(',')).join(' '));F.opacity(back,F.phase(state.map,.72,1));
   glyphs.forEach((n,i)=>{F.at(n.g,...points[i]);F.opacity(n.g,F.phase(state.map,.07,.14));F.opacity(n.index,F.phase(state.map,.88,1));});
   links.forEach((l,k)=>{const [i,j]=PAIRS[k],a=points[i],b=points[j],d=Math.hypot(b[0]-a[0],b[1]-a[1])||1,rx=(b[0]-a[0])*20/d,ry=(b[1]-a[1])*20/d;F.seg(l,a[0]+rx,a[1]+ry,b[0]-rx,b[1]-ry);F.opacity(l,F.phase(state.map,.79+k*.015,.94+k*.015));});
  }
  return {state,paint,patches:[{rows:1},{focus:1},{map:1}],durations:[1900,1800,2300]};
 }
});

R.register({
 id:'pred-compensation',
 title:['Что именно компенсирует замену?','What exactly makes a substitution compensatory?'],
 source:sources.covariance,
 status:['Возможный учебный путь · история замен не восстановлена','A possible teaching path · substitution history is not reconstructed'],
 states:[
  ['Сохраняем ту же пару столбцов 1 и 13: G–C.','Keep the same pair of columns, 1 and 13: G–C.',
   'Увеличена та же пара 1–13 из учебного MSA. G–C — Watson–Crick-пара. Линия обозначает спаривание, а не число водородных связей. Отдельно взятое сочетание G–C или его полная консервация не доказывает совместную эволюцию позиций.',
   'The same pair, 1–13, is enlarged from the teaching MSA. G–C is a Watson–Crick pair. The line denotes pairing, not the number of hydrogen bonds. One G–C combination, or its complete conservation, does not establish coevolution between positions.'],
  ['C → U: меняется одна позиция; G–U остаётся допустимой парой.','C → U: one position changes, and G–U remains an allowed pair.',
   'G–C → G–U — одиночная замена, совместимая со спариванием: consistent substitution. G–U — wobble-пара, отличная от Watson–Crick G–C/A–U. Если столбец G неизменен, такая вариация лишь в другом столбце сама по себе не является ковариацией. Обязательный разрыв пары не нужен.',
   'G–C → G–U is a single pairing-compatible change: a consistent substitution. G–U is a wobble pair, distinct from Watson–Crick G–C/A–U. If the G column is invariant, variation in the other column alone is not covariation. A mandatory loss of pairing is unnecessary.'],
  ['G → A: ещё одна одиночная замена приводит к A–U.','G → A: another single substitution leads to A–U.',
   'G–U → A–U меняет только левую позицию. Путь G–C → G–U → A–U возможен и удобен для объяснения; по двум современным вариантам G–C и A–U нельзя установить, существовал ли именно этот промежуточный G–U, в каком порядке произошли замены или были ли они одновременными. Стрелки здесь не обозначают реконструированные ветви дерева.',
   'G–U → A–U changes only the left position. The path G–C → G–U → A–U is possible and useful for teaching. Modern G–C and A–U variants do not reveal whether this G–U intermediate occurred, the order of substitutions, or whether they were simultaneous. These arrows are not reconstructed phylogenetic branches.'],
  ['G–C → A–U: различаются обе позиции, а спаривание сохраняется.','G–C → A–U: both positions differ, while pairing is retained.',
   'Крайние варианты иллюстрируют компенсаторную замену пары: различаются оба основания. Это описание сочетаний, а не утверждение об одном одновременном мутационном событии. Чтобы превратить такие примеры в свидетельство сохраняемой структуры, анализируют всё MSA с учётом филогении, множественных проверок и статистической мощности.',
   'The endpoint variants illustrate a compensatory base-pair substitution: both bases differ. This describes the combinations, not one simultaneous mutation event. To turn such examples into evidence for a conserved structure, the full MSA must be analysed with phylogeny, multiple testing and statistical power taken into account.']
 ],
 qa:[
  {q:['G–C → G–U — уже компенсаторная замена?','Is G–C → G–U already a compensatory substitution?'],a:['В принятом здесь различении это consistent substitution: меняется одна позиция. G–C → A–U меняет обе позиции и иллюстрирует компенсаторную замену пары.','In the terminology used here, this is a consistent substitution: one position changes. G–C → A–U changes both positions and illustrates a compensatory base-pair substitution.']},
  {q:['Переход обязательно проходит через G–U?','Must the transition pass through G–U?'],a:['Нет. Это возможный путь. Наблюдение крайних состояний не восстанавливает промежуточные состояния и порядок замен.','No. It is one possible path. Observing the endpoints does not reconstruct intermediates or substitution order.']}
 ],
 build(ctx,v){
  const q=F.group(v.svg),state={gu:0,au:0,compare:0};
  txt(q,306,167,669,52,'Один возможный путь сохранения пары','One possible path that preserves pairing',29,C.white);
  const centers=[232,640,1048],bases=['GC','GU','AU'];
  const groups=bases.map((pair,k)=>{const p=F.group(q),cx=centers[k],col=k===1?C.teal:C.gold;
   txt(p,cx-117,247,234,40,'Столбцы 1 и 13','Columns 1 and 13',21,C.grey);
   const relation=stroke(p,cx-10,344,cx+10,344,col,3);if(k===1)relation.setAttribute('stroke-dasharray','4 5');
   const chars=[...pair].map((base,j)=>{const n=baseGlyph(p,base,j===0?0:12,col,34,false);F.at(n.g,cx+(j===0?-48:48),344);return n;});
   txt(p,cx-151,399,302,50,...[['Исходная G–C','Initial G–C'],['G–U: wobble-пара','G–U: wobble pair'],['Конечная A–U','Final A–U']][k],26,col);
   return {g:p,chars};
  });
  const routes=[arrow(q,365,344,505,344,C.blue),arrow(q,773,344,913,344,C.blue)];
  const mutations=[F.group(q),F.group(q)];
  txt(mutations[0],360,274,151,45,'C → U','C → U',29,C.blue);txt(mutations[0],335,361,201,56,'Одна позиция','One position',21,C.grey);
  txt(mutations[1],768,274,151,45,'G → A','G → A',29,C.blue);txt(mutations[1],743,361,201,56,'Одна позиция','One position',21,C.grey);
  const bracket=F.group(q);R.path(bracket,'M232,491 L232,513 L1048,513 L1048,491',C.gold,2.5);
  txt(bracket,252,532,776,56,'G–C → A–U: изменились обе позиции','G–C → A–U: both positions have changed',29,C.gold);
  function paint(){
   F.opacity(groups[1].g,state.gu);F.at(groups[1].g,-26*(1-state.gu),0);F.opacity(routes[0],state.gu);F.opacity(mutations[0],state.gu);
   F.opacity(groups[2].g,state.au);F.at(groups[2].g,-26*(1-state.au),0);F.opacity(routes[1],state.au);F.opacity(mutations[1],state.au);
   F.opacity(bracket,state.compare);F.at(bracket,0,8*(1-state.compare));
   v.root.dataset.pairColumns='1,13';v.root.dataset.pairPath='GC,GU,AU';v.root.dataset.pathStatus='illustrative-possible-path';
  }
  return {state,paint,patches:[{gu:1},{au:1},{compare:1}],durations:[1900,1900,1700]};
 }
});

R.register({
 id:'pred-phylogeny',
 title:['Много строк — сколько независимых событий?','Many rows—but how many independent events?'],
 source:sources.rscape,
 status:['Схематические деревья · без рассчитанных p- или E-value','Schematic trees · no computed p- or E-values'],
 states:[
  ['Гомологи связаны родством: строки MSA не независимы.','Homologs are related: MSA rows are not independent.',
   'Шесть листьев слева — шесть схематических потомков общего предка. Длина ветвей не имеет единиц и не оценивает время. Дерево придумано для объяснения зависимости наблюдений; оно не построено по последовательностям предыдущей сцены.',
   'The six tips on the left represent schematic descendants of a common ancestor. Branch lengths have no units and do not estimate time. This tree is invented to explain dependent observations; it was not inferred from the previous scene’s sequences.'],
  ['Одна замена предка может повториться во многих строках.','One ancestral change can be inherited by many MSA rows.',
   'На общей ветви показана одна смена сочетания G–C на A–U. Все шесть потомков наследуют A–U: это шесть наблюдений одного показанного события, а не шесть независимых подтверждений. Смена сочетания пары на схеме не утверждает одновременное изменение двух оснований.',
   'A single change from G–C to A–U is placed on the shared ancestral branch. All six descendants inherit A–U: six observations of one displayed event, not six independent confirmations. A pair-state change in this diagram does not imply simultaneous mutations at both bases.'],
  ['Изменения на разных ветвях несут другую информацию.','Changes on different branches carry different information.',
   'Справа два изменения показаны на отдельных ветвях; снова шесть листьев A–U. Одни только частоты современных состояний скрывают различие между этими историями. R-scape оценивает ковариацию относительно нулевой модели, учитывающей филогенетические зависимости и состав последовательностей, а не просто считает совпадающие строки. Никакая значимость для этих схем не вычислялась.',
   'On the right, two changes occur on separate branches, again yielding six A–U tips. Present-day state frequencies alone conceal the difference between these histories. R-scape evaluates covariation against a null model that accounts for phylogenetic dependencies and sequence composition, rather than merely counting matching rows. No significance was calculated for these diagrams.'],
  ['Отсутствие сигнала нужно читать вместе с мощностью теста.','Interpret absence of signal together with the test’s power.',
   'Нет универсального достаточного числа гомологов. Важны разнообразие, реальные замены и качество MSA. При низкой мощности отсутствие значимой ковариации оставляет вопрос открытым. При достаточной мощности оно аргументирует против предложенной эволюционно сохраняемой структуры, но не утверждает, что молекула вообще не складывается. Подгонка MSA под сомнительную структуру может создать ложную поддержку; см. Rivas 2023, DOI 10.1371/journal.pcbi.1011262.',
   'There is no universal sufficient homolog count. Diversity, actual substitutions and MSA quality matter. With low power, a lack of significant covariation leaves the question open. With adequate power, it argues against the proposed evolutionarily conserved structure, not against the molecule forming any structure at all. Fitting an MSA to a doubtful structure can create spurious support; see Rivas 2023, DOI 10.1371/journal.pcbi.1011262.']
 ],
 qa:[
  {q:['Сколько гомологов достаточно?','How many homologs are enough?'],a:['Универсального порога нет. Число почти одинаковых строк само по себе мало полезно; мощность зависит от вариации в проверяемых столбцах и качества выравнивания.','There is no universal threshold. Counting nearly identical rows is not very informative; power depends on variation in the tested columns and alignment quality.']},
  {q:['E < 0,05 означает 95% вероятность пары?','Does E < 0.05 mean a 95% probability of pairing?'],a:['Нет. E-value относится к ожидаемому числу столь же сильных или более сильных случайных результатов среди проверяемых пар при нулевой модели. Это не вероятность истинности конкретной пары.','No. An E-value describes the expected number of chance results at least this strong among the tested pairs under the null model. It is not the probability that a particular pair is true.']},
  {q:['Можно сначала подогнать MSA под стебель, а потом подтвердить его тем же MSA?','Can an MSA be fitted to a stem and then used to independently confirm it?'],a:['Такой вывод может быть круговым: структура уже повлияла на сопоставление столбцов. Особенно внимательно проверяют неоднозначные выравнивания и искусственно созданную ковариацию.','That inference can be circular: the structure already influenced the column correspondence. Ambiguous alignments and artificially induced covariation need particular scrutiny.'],source:'Rivas, 2023 · Helix-level covariation',url:'https://doi.org/10.1371/journal.pcbi.1011262'}
 ],
 build(ctx,v){
  const q=F.group(v.svg),state={inherit:0,independent:0,power:0};
  function tree(x0,isRight){
   const p=F.group(q);txt(p,x0-23,164,506,60,isRight?'Разные ветви':'Общая ветвь',isRight?'Separate branches':'A shared branch',28,isRight?C.teal:C.blue);
   const rootX=x0+10,trunkX=x0+133,leafX=x0+331,ys=[253,296,339,382,425,468],mid=360;
   const root=baseGlyph(p,'G',0,C.grey,19,false);F.at(root.g,rootX,mid-24);const partner=baseGlyph(p,'C',12,C.grey,19,false);F.at(partner.g,rootX,mid+24);stroke(p,rootX,mid-3,rootX,mid+3,C.grey,1.5);
   stroke(p,rootX+22,mid,trunkX,mid,C.grey,2);
   if(isRight){
    stroke(p,trunkX,296,trunkX,425,C.grey,2);
    [296,425].forEach(y=>{stroke(p,trunkX,y,trunkX+98,y,C.grey,2);stroke(p,trunkX+98,y-43,trunkX+98,y+43,C.grey,2);});
    ys.forEach((y,k)=>stroke(p,trunkX+98,y,leafX,y,C.grey,2));
   }else{stroke(p,trunkX,ys[0],trunkX,ys[5],C.grey,2);ys.forEach(y=>stroke(p,trunkX,y,leafX,y,C.grey,2));}
   const tips=ys.map(y=>{const mark=F.dot(p,leafX,y,4,C.blue),old=txt(p,leafX+14,y-17,77,34,'G–C','G–C',23,C.grey),next=txt(p,leafX+14,y-17,77,34,'A–U','A–U',23,isRight?C.teal:C.gold);return {mark,old,next};});
   const events=F.group(p);
   (isRight?[[trunkX+54,296],[trunkX+54,425]]:[[rootX+65,mid]]).forEach(([x,y])=>{const dot=F.dot(events,x,y,8,isRight?C.teal:C.gold);dot.setAttribute('stroke','var(--color-bg)');dot.setAttribute('stroke-width',2);});
   const tally=F.group(p);txt(tally,x0-8,492,463,39,isRight?'2 события → 6 потомков':'1 событие → 6 потомков',isRight?'2 events → 6 descendants':'1 event → 6 descendants',24,isRight?C.teal:C.gold);
   return {g:p,tips,events,tally};
  }
  const left=tree(101,false),right=tree(693,true);
  const separator=stroke(q,643,230,643,510,C.grey,1);separator.setAttribute('opacity','.25');
  const power=F.group(q);stroke(power,86,544,1194,544,C.grey,1.2);
  txt(power,90,552,526,49,'Нет сигнала + мало вариации → вывод открыт','No signal + little variation → inconclusive',22,C.gold);
  txt(power,664,552,526,49,'Высокая мощность, нет сигнала → против','No signal + high power → evidence against',22,C.teal);
  function paint(){
   left.tips.forEach(t=>{F.opacity(t.old,1-F.phase(state.inherit,0,.40));F.opacity(t.next,F.phase(state.inherit,.56,1));});F.opacity(left.events,state.inherit);F.opacity(left.tally,state.inherit);
   F.opacity(right.g,state.independent);right.tips.forEach(t=>{F.opacity(t.old,1-F.phase(state.independent,0,.40));F.opacity(t.next,F.phase(state.independent,.56,1));});F.opacity(right.events,state.independent);F.opacity(right.tally,state.independent);
   F.opacity(power,state.power);F.opacity(left.g,1-.28*state.power);F.opacity(right.g,state.independent*(1-.28*state.power));
   v.root.dataset.phylogenyStatus='invented-not-inferred';v.root.dataset.statisticalTestRun='false';
  }
  return {state,paint,patches:[{inherit:1},{independent:1},{power:1}],durations:[1900,2000,1800]};
 }
});

R.register({
 id:'pred-hybrid',
 title:['Выравнивание и энергия: разные роли методов','Alignment and energy: distinct roles for methods'],
 source:sources.hybrid,
 status:['Схема входов и выходов · методы не запускались','Inputs and outputs · no methods were run'],
 states:[
  ['RNAalifold: готовое MSA и термодинамика дают консенсус пар.','RNAalifold: a precomputed MSA and thermodynamics yield a pair consensus.',
   'RNAalifold принимает готовое выравнивание гомологов, усредняет термодинамическую оценку по последовательностям и учитывает совместимость и ковариацию. Выход — консенсус вторичной структуры, а не экспериментально установленная структура. Предсказание в предположении общего фолда отличается от статистической проверки, существует ли вообще эволюционно сохраняемая структура. DOI RNAalifold: 10.1186/1471-2105-9-474.',
   'RNAalifold takes a precomputed homolog alignment, averages thermodynamic scoring across sequences and incorporates compatibility and covariation. Its output is a secondary-structure consensus, not an experimentally established structure. Prediction under an assumed shared fold differs from statistically testing whether an evolutionarily conserved structure exists. RNAalifold DOI: 10.1186/1471-2105-9-474.'],
  ['PETfold объединяет эволюционные и термодинамические вероятности.','PETfold combines evolutionary and thermodynamic probabilities.',
   'PETfold также принимает готовое MSA. Он сочетает эволюционную информацию Pfold и термодинамические вероятности; MEA выбирает консенсус с высокой ожидаемой точностью. Это отдельный метод, а не обязательный следующий этап после RNAalifold. Обычные RNAalifold и PETfold предсказывают вложенные структуры без псевдоузлов. DOI PETfold: 10.1093/nar/gkn544.',
   'PETfold also takes a precomputed MSA. It combines Pfold evolutionary information with thermodynamic probabilities; MEA selects a consensus with high expected accuracy. It is a separate method, not a mandatory step after RNAalifold. Standard RNAalifold and PETfold predict nested structures without pseudoknots. PETfold DOI: 10.1093/nar/gkn544.'],
  ['TurboFold II начинает с невыравненных гомологов.','TurboFold II starts from unaligned homologs.',
   'TurboFold II итеративно обновляет вероятности спаривания и выравнивания. На выходе MSA и структуры отдельных последовательностей; гомологи не обязаны иметь совершенно идентичный фолд. Есть режим ProbKnot для сборки структуры с возможными псевдоузлами, поэтому запрет псевдоузлов нельзя переносить на все сравнительные методы. Схематические значки не являются результатами вычисления.',
   'TurboFold II iteratively updates base-pair and alignment probabilities. It outputs an MSA and structures for individual sequences; homologs need not have perfectly identical folds. A ProbKnot mode can assemble structures containing pseudoknots, so pseudoknot exclusion must not be generalized to every comparative method. The schematic icons are not computed outputs.'],
  ['Infernal/Rfam: модель известного семейства служит поиску и выравниванию.','Infernal/Rfam: a known-family model supports homology search and alignment.',
   'Infernal строит covariance model (CM), профильную SCFG, по структурно аннотированному MSA или аннотированной последовательности. CM моделирует одиночные позиции и вложенные пары; Rfam предоставляет семейные MSA и модели для поиска гомологов. Это другая задача, а не универсальный de novo фолдинг или предсказание 3D. Rfam может хранить аннотацию псевдоузлов, но её перенос не означает явную оценку пересекающихся связей CM. DOI Infernal: 10.1093/bioinformatics/btt509; Rfam: 10.1093/nar/gkae1023.',
   'Infernal builds a covariance model (CM), a profile SCFG, from a structurally annotated MSA or annotated sequence. A CM models single positions and nested pairs; Rfam provides family MSAs and models for homology searches. This is a distinct task, not universal de novo folding or 3D prediction. Rfam can store pseudoknot annotations, but transferring them does not mean that the CM explicitly scores crossing interactions. Infernal DOI: 10.1093/bioinformatics/btt509; Rfam DOI: 10.1093/nar/gkae1023.']
 ],
 qa:[
  {q:['Каким методам нужно готовое MSA?','Which methods require a precomputed MSA?'],a:['RNAalifold и PETfold принимают готовое MSA. TurboFold II принимает невыравненные гомологи и сам формирует MSA вместе с предсказаниями структур.','RNAalifold and PETfold take a precomputed MSA. TurboFold II takes unaligned homologs and produces an MSA alongside structure predictions.']},
  {q:['Почему CM — больше, чем обычный профиль последовательности?','Why is a CM more than a standard sequence profile?'],a:['Профильная SCFG содержит совместные эмиссии пар, а не только независимые одиночные позиции. Стандартная CM описывает вложенную вторичную структуру семейства.','A profile SCFG includes joint emissions for base pairs, rather than only independent single positions. A standard CM describes a family’s nested secondary structure.'],source:'Nawrocki & Eddy, 2013 · Infernal 1.1',url:'https://doi.org/10.1093/bioinformatics/btt509'},
  {q:['Rfam — база готовых 3D-предсказаний?','Is Rfam a database of completed 3D predictions?'],a:['Нет. Семейства представлены seed-MSA, консенсусной вторичной структурой, covariance models и найденными гомологами; связи с экспериментальными 3D-структурами помогают курации.','No. Families are represented by seed MSAs, consensus secondary structures, covariance models and homolog matches; links to experimental 3D structures support curation.'],source:'Ontiveros-Palacios et al., 2025 · Rfam 15',url:'https://doi.org/10.1093/nar/gkae1023'}
 ],
 build(ctx,v){
  const q=F.group(v.svg),state={pet:0,turbo:0,cm:0};
  txt(q,84,164,267,38,'Метод','Method',22,C.grey,'left');txt(q,371,164,299,38,'Вход и информация','Input and information',22,C.grey);txt(q,756,164,430,38,'Выход / задача','Output / task',22,C.grey);
  const ys=[247,339,433,541],names=['RNAalifold','PETfold','TurboFold II','Infernal / Rfam'];
  const input=[['Готовое MSA + энергия','Precomputed MSA + energy'],['MSA + эволюция\n+ энергия','MSA + evolution\n+ energy'],['Невыровненные гомологи','Unaligned homologs'],['Аннотированное MSA\n→ модель семейства','Annotated MSA\n→ family model']];
  const output=[['Консенсус пар','Pair consensus'],['Консенсус пар (MEA)','Pair consensus (MEA)'],['MSA + структуры\nдля каждой РНК','MSA + structures\nfor each RNA'],['Поиск гомологов\nи выравнивание','Homology search\nand alignment']];
  function miniStem(p,x,y,height=41,color=C.blue){
   stroke(p,x-16,y-height/2,x-16,y+height/2,color,2);stroke(p,x+16,y-height/2,x+16,y+height/2,color,2);
   R.path(p,`M${x-16},${y-height/2} C${x-23},${y-height/2-26} ${x+23},${y-height/2-26} ${x+16},${y-height/2}`,color,2);
   for(let i=0;i<4;i++)stroke(p,x-12,y-height/2+5+i*(height-10)/3,x+12,y-height/2+5+i*(height-10)/3,C.gold,1.5);
  }
  const lanes=ys.map((y,k)=>{const lane=F.group(q),color=k===3?C.teal:C.blue;
   txt(lane,85,y-34,270,68,names[k],names[k],27,color,'left');txt(lane,371,y-36,282,72,...input[k],23,C.white);
   arrow(lane,683,y,738,y,color);txt(lane,762,y-38,k===2?340:321,76,...output[k],24,C.white,'left');
   if(k<2)miniStem(lane,1149,y+5,42,color);
   if(k===2){miniStem(lane,1129,y+3,30,color);miniStem(lane,1181,y+7,44,C.teal);}
   if(k===3){for(let r=0;r<3;r++){stroke(lane,1118,y-17+r*17,1186,y-17+r*17,C.teal,2);[0,1,2].forEach(c=>F.dot(lane,1126+c*25,y-17+r*17,3,C.teal));}}
   if(k<3){const sep=stroke(lane,85,y+45,1196,y+45,C.grey,.8);sep.setAttribute('opacity','.23');}
   return lane;
  });
  function paint(){
   [1,state.pet,state.turbo,state.cm].forEach((t,i)=>{F.opacity(lanes[i],t);F.at(lanes[i],0,7*(1-t));});
   v.root.dataset.methodRoles='RNAalifold:prealigned;PETfold:prealigned;TurboFoldII:unaligned;Infernal:CM-search-align';v.root.dataset.predictionRun='false';
  }
  return {state,paint,patches:[{pet:1},{turbo:1},{cm:1}],durations:[1700,2000,1900]};
 }
});
})(window);
