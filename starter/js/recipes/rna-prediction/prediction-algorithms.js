/* Algorithm diagrams: persistent teaching objects, no simulated RNA energies. */
(function(){
'use strict';
const R=RNA;
const ref=(url,text)=>'<a href="'+url+'" target="_blank" rel="noopener">'+text+'</a>';

R.register({
 id:'pred-dp',
 title:['Как найти минимум, не перебирая все структуры?','How can we find a minimum without enumerating every fold?'],
 source:['Zuker & Stiegler, 1981 · dynamic programming','https://pubmed.ncbi.nlm.nih.gov/6163133/'],
 status:['Учебная схема зависимостей · энергии не вычисляются','Teaching dependency diagram · energies are not computed'],
 states:[
  ['Большая задача состоит из повторяющихся задач на интервалах.','The full problem contains recurring interval subproblems.',
   'Каждая ячейка соответствует интервалу [i,j] одной последовательности. Цвет обозначает порядок готовности, а не энергию и не вероятность. Это учебная схема зависимостей: алгоритм не запущен на показанной последовательности GGAAUUCC.',
   'Each cell represents an interval [i,j] of one sequence. Color indicates dependency order, not energy or probability. This is a teaching dependency diagram: no folding algorithm was run on the displayed sequence GGAAUUCC.'],
  ['Сначала решаем короткие интервалы и сохраняем ответы.','Solve short intervals first and retain their answers.',
   'Таблица заполняется от коротких интервалов к длинным. Ответ на уже решённую подзадачу можно использовать повторно. В упрощённой модели Nussinov максимизируют число допустимых непересекающихся пар; у Zuker–Turner минимизируют энергию мотивов и используют несколько типов состояний. '+ref('https://pubmed.ncbi.nlm.nih.gov/6161375/','Nussinov & Jacobson, 1980')+'.',
   'The table is filled from short intervals to long intervals. A solved subproblem can be reused. A simplified Nussinov model maximizes allowed noncrossing pairs; Zuker–Turner minimizes motif energies and uses several state types. '+ref('https://pubmed.ncbi.nlm.nih.gov/6161375/','Nussinov & Jacobson, 1980')+'.'],
  ['Разрез k соединяет два уже решённых фрагмента.','A split at k combines two solved fragments.',
   'Показан один пример зависимости: [1,8] разбивается на [1,4] и [5,8], то есть k=4. Реальные рекуррентные формулы рассматривают допустимые разрезы, спаривание концов и контекст петель. Рисунок не утверждает, что выбранный разрез даёт оптимальную структуру.',
   'One dependency is illustrated: [1,8] splits into [1,4] and [5,8], so k=4. Actual recurrences consider admissible splits, endpoint pairing and loop contexts. The diagram does not claim that this split gives the optimal structure.'],
  ['Таблица даёт оптимум модели; обратный проход восстанавливает структуру.','The table gives the model optimum; traceback recovers a structure.',
   'Для стандартной задачи без псевдоузлов типичны O(n³) времени и O(n²) памяти. Кубическая оценка предполагает обычную обработку петель: например, ограниченный размер внутренних петель; наивный полный перебор внутренних петель может дать O(n⁴). Специальные методы также дают O(n³): '+ref('https://pubmed.ncbi.nlm.nih.gov/10383469/','Lyngsø, Zuker & Pedersen, 1999')+'. Точность решения модели не означает гарантированную биологическую точность.',
   'Standard pseudoknot-free folding typically takes O(n³) time and O(n²) memory. Cubic time assumes the usual loop treatment, such as bounded internal-loop size; naive enumeration of all internal loops can take O(n⁴). Specialized methods also achieve O(n³): '+ref('https://pubmed.ncbi.nlm.nih.gov/10383469/','Lyngsø, Zuker & Pedersen, 1999')+'. Exact model optimization does not guarantee biological accuracy.']
 ],
 qa:[
  {q:['Почему число структур может быть огромным, а алгоритм — полиномиальным?','How can an enormous structure space admit a polynomial algorithm?'],a:['В допустимой модели структуры разлагаются на повторяющиеся подзадачи. Динамическое программирование хранит ответ для каждого состояния и не пересчитывает его для каждой полной структуры.','Within the admissible model, structures decompose into recurring subproblems. Dynamic programming stores each state’s answer instead of recomputing it for every full structure.']},
  {q:['Эта таблица реализует Turner?','Does this table implement Turner folding?'],a:['Нет. Это схема зависимостей интервалов без численных энергий. Для термодинамической модели нужны состояния, которые различают стеки и разные типы петель.','No. It is an interval dependency diagram without numerical energies. A thermodynamic model needs states that distinguish stacks and different loop types.']}
 ],
 build(ctx,v){
  const state={fill:1,reuse:0,split:0,done:0};
  R.box(v.svg,83,162,565,37,'Одна последовательность','One sequence',23,C.grey);
  const seq='GGAAUUCC';
  [...seq].forEach((base,i)=>{const x=127+i*66;F.dot(v.svg,x,233,19,'var(--color-bg)').setAttribute('stroke',C.blue);R.label(v.svg,x,233,base,21,C.white,34,36);R.label(v.svg,x,270,String(i+1),17,C.grey,31,30);if(i<7)F.line(v.svg,x+22,233,x+44,233,C.grey,1.8);});
  const cut=F.group(v.svg);F.line(cut,358,213,358,281,C.gold,2,'4 5');R.box(cut,318,284,80,31,'k = 4','k = 4',20,C.gold);
  const tree=F.group(v.svg),left=F.group(tree),right=F.group(tree);
  const rootRect=R.rect(tree,284,329,148,54,C.grey,'none',11);R.label(tree,358,356,'[1, 8]',27,C.white,135,43);
  R.rect(left,105,433,164,54,C.blue,'none',11);R.label(left,187,460,'[1, 4]',26,C.blue,150,44);
  R.rect(right,447,433,164,54,C.teal,'none',11);R.label(right,529,460,'[5, 8]',26,C.teal,150,44);
  const arrows=F.group(tree),arA=F.arrow(arrows,C.blue,2.1),arB=F.arrow(arrows,C.teal,2.1);
  arA.set(202,426,318,390);arB.set(514,426,398,390);
  const combine=R.box(tree,289,408,138,55,'Сочетаем','Combine',21,C.gold);
  R.box(v.svg,765,162,433,37,'Порядок зависимостей','Dependency order',23,C.grey);
  const chart=F.group(v.svg),N=8,cs=34,x0=838,y0=239,cells=[];
  R.label(chart,815,212,'j',20,C.grey,28,32);R.label(chart,793,243,'i',20,C.grey,28,32);
  for(let j=0;j<N;j++)R.label(chart,x0+j*cs+15,y0-24,String(j+1),16,C.grey,30,29);
  for(let i=0;i<N;i++){
   R.label(chart,x0-26,y0+i*cs+15,String(i+1),16,C.grey,30,29);
   for(let j=i;j<N;j++){
    const q=F.group(chart),r=R.rect(q,x0+j*cs,y0+i*cs,29,29,C.grey,'none',4);
    const dot=F.dot(q,x0+j*cs+14.5,y0+i*cs+14.5,3.1,C.blue);
    cells.push({i,j,len:j-i+1,r,dot});
   }
  }
  const tracing=R.rect(chart,x0+7*cs-3,y0-3,35,35,C.gold,'none',6);
  const models=F.group(v.svg);
  R.box(models,82,535,598,31,'Учебный Nussinov → максимум пар','Teaching Nussinov → most pairs',22,C.blue);
  R.box(models,82,565,598,31,'Turner / Zuker → минимум ΔG','Turner / Zuker → minimum ΔG',22,C.teal);
  const complexity=F.group(v.svg);
  R.box(complexity,737,535,463,31,'O(n³) время · O(n²) память','O(n³) time · O(n²) memory',23,C.gold);
  R.box(complexity,737,565,463,31,'Обычная модель петель','Usual loop model',20,C.grey);
  function paint(){
   F.opacity(cut,state.split);F.opacity(left,.18+.82*state.reuse);F.opacity(right,.18+.82*state.reuse);
   F.opacity(arrows,state.split);F.opacity(combine.el,state.split);F.opacity(tracing,state.done);F.opacity(complexity,state.done);
   rootRect.setAttribute('stroke',state.done>.5?C.gold:C.grey);
   cells.forEach(c=>{const ready=F.phase(state.fill,c.len-.7,c.len);c.r.setAttribute('stroke',ready>.5?C.blue:C.grey);c.r.setAttribute('opacity',.16+.55*ready);F.opacity(c.dot,ready);const chosen=(c.i===0&&c.j===3)||(c.i===4&&c.j===7);c.dot.setAttribute('fill',chosen&&state.reuse>.3?C.teal:C.blue);c.dot.setAttribute('r',chosen?3.1+state.split*2.4:3.1);});
   v.root.dataset.predictionChart='pedagogical-dependencies-no-energy-values';
   v.root.dataset.predictionSplit='1:4|5:8';
  }
  return{state,paint,patches:[{fill:4,reuse:1},{fill:7,split:1},{fill:8,done:1}],durations:[2200,2100,1900]};
 }
});

R.register({
 id:'pred-beam',
 title:['LinearFold: сохранить только часть вариантов','LinearFold: retain a bounded set of alternatives'],
 source:['Huang et al., 2019 · LinearFold','https://academic.oup.com/bioinformatics/article/35/14/i295/5529205'],
 status:['Схема поиска · b = 3 для иллюстрации','Search schematic · illustrative beam b = 3'],
 states:[
  ['Алгоритм продвигается по последовательности и хранит частичные состояния.','The algorithm scans the sequence and retains partial states.',
   'Здесь круги обозначают абстрактные состояния поиска, не молекулы и не реальные рассчитанные структуры. LinearFold использует проход 5′→3′ и динамическое программирование. Этот порядок вычислений сам по себе не моделирует котранскрипционную кинетику.',
   'Circles represent abstract search states, not molecules or actual computed structures. LinearFold scans 5′→3′ using dynamic programming. This computation order does not itself model cotranscriptional kinetics.'],
  ['Следующий символ расширяет набор возможных продолжений.','The next symbol expands the set of possible continuations.',
   'Каждое частичное состояние допускает продолжения. В схеме число кандидатов задано для объяснения; здесь нет рассчитанных энергий и приведённые ветви не являются точной трассировкой программы.',
   'Each partial state admits continuations. Candidate counts are chosen for explanation; there are no computed energies and these branches are not an exact program trace.'],
  ['Остаются b лучших состояний; остальные удаляются из поиска.','Retain the best b states; prune the rest.',
   'Ширина луча b ограничивает число сохраняемых состояний соответствующего типа. На рисунке b=3; это учебное значение, не рекомендация настройки. Отсечение может удалить путь к глобальному минимуму выбранной энергетической модели.',
   'Beam width b bounds the retained states of the relevant type. Here b=3 is a teaching value, not a recommended setting. Pruning can discard a path to the global minimum under the chosen energy model.'],
  ['Фиксированный b даёт линейное масштабирование по длине n.','A fixed b gives linear scaling with sequence length n.',
   'LinearFold: O(nb log b) времени и O(nb) памяти; при фиксированном b обе оценки линейны по n. Приближение не требует ограничивать максимальную дальность пары, но стандартный метод остаётся без псевдоузлов. Улучшение модельного оптимума и биологической точности — разные цели; больший b не гарантирует лучшую биологическую точность. Это поиск MFE/лучшего score, а не расчёт ансамбля LinearPartition.',
   'LinearFold takes O(nb log b) time and O(nb) memory, both linear in n for fixed b. The approximation does not require a maximum pair span, but the standard method remains pseudoknot-free. Model optimization and biological accuracy are distinct objectives; a larger b does not guarantee better biological accuracy. This is MFE/best-score search, not LinearPartition ensemble calculation.']
 ],
 qa:[
  {q:['Почему это приближённый алгоритм?','Why is the algorithm approximate?'],a:['Ограниченный луч удаляет часть кандидатов до завершения полной структуры. Среди удалённых может быть предшественник оптимального решения.','A bounded beam deletes some candidates before the full structure is completed. A deleted candidate may be a predecessor of the optimal solution.']},
  {q:['Линейное время означает запрет дальних пар?','Does linear time forbid long-range pairs?'],a:['Нет. LinearFold ограничивает число состояний луча, а не расстояние между спариваемыми позициями.','No. LinearFold limits the number of beam states, not the distance between pairing positions.']}
 ],
 build(ctx,v){
  const state={expand:0,prune:0,advance:0};
  const seq='GGAAUUCC',sx=184,dx=128;
  [...seq].forEach((b,i)=>R.label(v.svg,sx+i*dx,192,b,23,C.grey,40,40));
  const cursor=F.dot(v.svg,sx,224,4.3,C.gold);
  const baseline=F.line(v.svg,115,224,1165,224,C.grey,.8);baseline.setAttribute('opacity',.22);
  F.dot(v.svg,137,386,11,C.blue);
  const ys=[267,315,363,411,459,507],kept=[0,2,4];
  const first=ys.map((y,i)=>{const g=F.group(v.svg),path=R.path(g,'M153 386 C245 386 302 '+y+' 401 '+y,C.blue,1.7),dot=F.dot(g,418,y,9,'var(--color-bg)');dot.setAttribute('stroke',C.blue);dot.setAttribute('stroke-width',2);return{g,path,dot,i};});
  const boundary=F.group(v.svg);F.line(boundary,585,246,585,523,C.gold,1.7,'4 6');R.box(boundary,540,532,90,34,'b = 3','b = 3',25,C.gold);
  const second=ys.map((y,i)=>{const sourceY=ys[kept[Math.floor(i/2)]],g=F.group(v.svg),path=R.path(g,'M430 '+sourceY+' C561 '+sourceY+' 644 '+y+' 773 '+y,C.teal,1.7),dot=F.dot(g,790,y,9,'var(--color-bg)');dot.setAttribute('stroke',C.teal);dot.setAttribute('stroke-width',2);return{g,path,dot,i};});
  const final=kept.map((idx,i)=>{const y=ys[idx],g=F.group(v.svg),p=R.path(g,'M803 '+y+' C891 '+y+' 954 '+y+' 1069 '+y,C.gold,2.2),dot=F.dot(g,1086,y,10,C.gold);return{g,p,dot};});
  R.box(v.svg,82,532,234,34,'Частичное состояние','Partial state',21,C.grey);
  const candidates=R.box(v.svg,313,532,214,34,'Кандидаты','Candidates',22,C.blue);
  const continued=R.box(v.svg,693,532,432,34,'Расширить → снова отобрать','Expand → prune again',22,C.teal);
  const complexity=R.box(v.svg,193,574,894,32,'Фиксированный b: O(n) времени и памяти','Fixed b: O(n) time and memory',24,C.gold);
  function paint(){
   F.pos(cursor,F.lerp(sx,sx+3*dx,(state.expand+state.prune+state.advance)/3),224);
   first.forEach(n=>{const reveal=F.phase(state.expand,n.i*.075,.56+n.i*.07);const survivor=kept.includes(n.i);F.opacity(n.g,reveal*(survivor?1:1-.91*state.prune));n.dot.setAttribute('stroke',survivor&&state.prune>.25?C.gold:C.blue);n.dot.setAttribute('fill',survivor&&state.prune>.7?C.gold:'var(--color-bg)');});
   F.opacity(boundary,state.prune);F.opacity(candidates.el,state.expand);F.opacity(continued.el,state.advance);F.opacity(complexity.el,F.phase(state.advance,.6,1));
   second.forEach(n=>{const reveal=F.phase(state.advance,n.i*.035,.45+n.i*.035),keep=kept.includes(n.i),fade=keep?1:1-.91*F.phase(state.advance,.67,.9);F.opacity(n.g,reveal*fade);n.dot.setAttribute('stroke',keep&&state.advance>.75?C.gold:C.teal);});
   final.forEach((n,i)=>F.opacity(n.g,F.phase(state.advance,.69+i*.025,.94+i*.025)));
   v.root.dataset.predictionBeamWidth='3';v.root.dataset.predictionBeam='illustrative-state-pruning';
  }
  return{state,paint,patches:[{expand:1},{prune:1},{advance:1}],durations:[2100,1900,2300]};
 }
});

R.register({
 id:'pred-tools',
 title:['Выбирайте инструмент по данным и вопросу','Choose a tool by its input and the question'],
 source:['ViennaRNA · RNAfold reference manual','https://www.tbi.univie.ac.at/RNA/RNAfold'],
 status:['Типы задач и выходов · не рейтинг точности','Task and output types · not an accuracy ranking'],
 states:[
  ['Одна последовательность: энергетический минимум и альтернативы.','One sequence: an energy minimum and alternatives.',
   'RNAfold и RNAstructure предлагают MFE и расчёт ансамбля/вероятностей пар; UNAFold также поддерживает минимизацию и статистическую сумму. mfold известен MFE и субоптимальными структурами: его energy dot plot не следует путать с картой вероятностей пар. Конкретные функции зависят от команды и настроек. '+ref('https://rna.urmc.rochester.edu/GUI/html/Partition_Function.html','RNAstructure')+' · '+ref('https://www.unafold.org/Dinamelt/unafold-man-pages/UNAFold-pl.php','UNAFold')+'.',
   'RNAfold and RNAstructure provide MFE and ensemble/pair-probability calculations; UNAFold also supports minimization and partition functions. mfold is known for MFE and suboptimal structures: its energy dot plot should not be confused with pair probabilities. Available outputs depend on the command and settings. '+ref('https://rna.urmc.rochester.edu/GUI/html/Partition_Function.html','RNAstructure')+' · '+ref('https://www.unafold.org/Dinamelt/unafold-man-pages/UNAFold-pl.php','UNAFold')+'.'],
  ['Длинная последовательность: приближённый поиск с ограниченным лучом.','Long sequence: approximate search with a bounded beam.',
   'LinearFold масштабирует поиск вторичной структуры за счёт ограничения луча. Вариант LinearFold-V использует термодинамическую модель, LinearFold-C — обученную модель score. Это не универсальная рекомендация по качеству: сравнивайте задачу, модель, ресурсы и ограничения. '+ref('https://github.com/LinearFold/LinearFold','Официальная реализация LinearFold')+'.',
   'LinearFold scales secondary-structure search by limiting its beam. LinearFold-V uses a thermodynamic model; LinearFold-C uses a learned score model. This is not a universal accuracy recommendation: compare the task, model, resources and constraints. '+ref('https://github.com/LinearFold/LinearFold','Official LinearFold implementation')+'.'],
  ['Выравнивание родственных РНК: консенсусная вторичная структура.','An alignment of related RNAs: a consensus secondary structure.',
   'RNAalifold и PETfold принимают выравнивание родственных последовательностей и используют структурные/эволюционные сигналы вместе с термодинамической информацией. Качество и состав выравнивания влияют на результат; консенсус не означает, что все молекулы имеют идентичную структуру. '+ref('https://www.tbi.univie.ac.at/RNA/RNAalifold.1.html','RNAalifold')+' · '+ref('https://pubmed.ncbi.nlm.nih.gov/18836192/','PETfold, Seemann et al., 2008')+'.',
   'RNAalifold and PETfold take aligned related sequences and use structural/evolutionary signals together with thermodynamic information. Alignment quality and composition affect the result; a consensus does not imply identical structures in every molecule. '+ref('https://www.tbi.univie.ac.at/RNA/RNAalifold.1.html','RNAalifold')+' · '+ref('https://pubmed.ncbi.nlm.nih.gov/18836192/','PETfold, Seemann et al., 2008')+'.'],
  ['Семейство и ковариация проверяют другие стороны гипотезы.','Family homology and covariation test other aspects of the hypothesis.',
   'Infernal и модели Rfam позволяют искать гомологов структурных семейств; R-scape оценивает статистическую поддержку ковариации в выравнивании с учётом филогенетического фона. Это разные задачи. Отсутствие значимой ковариации интерпретируют с учётом мощности выравнивания. Модельная вероятность пары не заменяет независимые данные. '+ref('https://docs.rfam.org/en/latest/','Rfam')+' · '+ref('https://eddylab.org/software/rscape/R-scape_userguide.pdf','R-scape guide')+'.',
   'Infernal and Rfam models support searches for homologs of structured RNA families; R-scape evaluates statistical support for alignment covariation against a phylogenetic background. These are distinct tasks. Lack of significant covariation must be interpreted with alignment power in mind. A model pair probability does not replace independent evidence. '+ref('https://docs.rfam.org/en/latest/','Rfam')+' · '+ref('https://eddylab.org/software/rscape/R-scape_userguide.pdf','R-scape guide')+'.']
 ],
 qa:[
  {q:['Что выбрать, если есть хорошее выравнивание?','What changes when a good alignment is available?'],a:['Можно решать задачу консенсусной структуры и оценивать эволюционную поддержку пар. Это дополнительная информация, качество которой зависит от выравнивания и разнообразия последовательностей.','You can infer a consensus structure and evaluate evolutionary support for pairs. The information quality depends on alignment quality and sequence diversity.']},
  {q:['Высокая вероятность пары доказывает её существование?','Does a high pair probability prove the pair exists?'],a:['Нет. Это уверенность внутри конкретной модели и ансамбля. Экспериментальные данные и корректно оценённая эволюционная поддержка проверяют гипотезу независимо от такого расчёта.','No. It is confidence within a particular model and ensemble. Experimental observations and properly assessed evolutionary support test the hypothesis beyond that calculation.']}
 ],
 build(ctx,v){
  const state={long:0,alignment:0,evidence:0};
  const rows=[],colors=[C.blue,C.gold,C.teal,C.white],ys=[171,263,355,447];
  const inputs=[['Одна РНК','One RNA'],['Длинная РНК','Long RNA'],['Выравнивание','Alignment'],['Семейство / MSA','Family / MSA']];
  const names=[['RNAfold · RNAstructure\nmfold / UNAFold','RNAfold · RNAstructure\nmfold / UNAFold'],['LinearFold','LinearFold'],['RNAalifold · PETfold','RNAalifold · PETfold'],['Infernal / Rfam · R-scape','Infernal / Rfam · R-scape']];
  const outputs=[['MFE · альтернативы\nансамблевый анализ','MFE · alternatives\nensemble analysis'],['Приближённая\nвторичная структура','Approximate\nsecondary structure'],['Консенсусная\nструктура','Consensus\nstructure'],['Гомология · поддержка\nковариацией','Homology · covariation\nsupport']];
  ys.forEach((y,i)=>{
   const g=F.group(v.svg),color=colors[i];rows.push(g);
   if(i<3){F.line(v.svg,85,y+87,1195,y+87,C.grey,.7).setAttribute('opacity',.21);}
   R.box(g,232,y+13,195,55,...inputs[i],23,color);
   R.box(g,448,y+6,423,73,...names[i],25,C.white);
   const arr=F.arrow(g,color,1.6);arr.set(873,y+43,899,y+43);
   R.box(g,918,y+8,284,68,...outputs[i],22,color);
   if(i<2){const count=i?9:5,step=i?11.5:23;for(let k=0;k<count;k++){const x=116+k*step,yy=y+42+(i?Math.sin(k*.88)*13:Math.sin(k*1.2)*9);if(k){const px=116+(k-1)*step,py=y+42+(i?Math.sin((k-1)*.88)*13:Math.sin((k-1)*1.2)*9);F.line(g,px,py,x,yy,color,1.7);}F.dot(g,x,yy,i?3.2:4.4,color);}}
   if(i===2){for(let r=0;r<3;r++)for(let k=0;k<7;k++){const n=F.line(g,117+k*14,y+24+r*17,125+k*14,y+24+r*17,k===2||k===5?C.gold:C.teal,3);n.setAttribute('opacity',.6+r*.2);}}
   if(i===3){F.line(g,116,y+43,140,y+43,color,1.5);F.line(g,140,y+24,140,y+61,color,1.5);F.line(g,140,y+24,170,y+24,color,1.5);F.line(g,140,y+61,159,y+61,color,1.5);F.line(g,159,y+46,159,y+72,color,1.5);F.line(g,159,y+46,180,y+46,color,1.5);F.line(g,159,y+72,180,y+72,color,1.5);[[185,24],[191,46],[191,72]].forEach(([x,dy],k)=>F.dot(g,x,y+dy,4.3,k===0?C.blue:C.teal));}
  });
  const evidence=R.box(v.svg,174,554,932,44,'Уверенность модели ≠ независимые данные','Model confidence ≠ independent evidence',26,C.gold);
  function paint(){
   const values=[1,state.long,state.alignment,state.evidence];
   rows.forEach((r,i)=>{F.opacity(r,values[i]);F.at(r,0,10*(1-values[i]));});
   F.opacity(evidence.el,state.evidence);v.root.dataset.predictionTools='inputs-and-output-types-not-accuracy-ranking';
  }
  return{state,paint,patches:[{long:1},{alignment:1},{evidence:1}],durations:[1800,2000,2200]};
 }
});
})();
