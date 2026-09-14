/* Entirely invented teaching data; not a biological finding. */
(function () {
  'use strict';
  const SOURCE = 'independent-evidence-toy-v1';
  const DONORS = ['D1','D2','D3'];
  const COLORS = [C.blue,C.teal,C.gold];
  const cells = Object.freeze([[1,2,2,3],[4,5,5,6],[7,8,8,9]].flatMap((values,d) => values.map((count,j) => Object.freeze({id:DONORS[d]+String.fromCharCode(97+j),sample:DONORS[d],stratum:'one-toy-type',counts:Object.freeze([count])}))));
  const aggregation = K.aggregateCounts(cells,{genes:['G']});
  const means = Object.freeze(aggregation.groups.map(group => Object.freeze({id:'mean-'+group.sample,sample:group.sample,value:group.counts[0]/group.cellCount,sourceIds:group.sourceIds})));
  const donorSummary = K.sampleSummary(means.map(d=>d.value));
  const cellSummary = K.sampleSummary(cells.map(d=>d.counts[0]));
  function varianceBudget(donors,cellsPerDonor) {
    if(!Number.isInteger(donors)||donors<1||donors>12||!Number.isInteger(cellsPerDonor)||cellsPerDonor<1||cellsPerDonor>100) throw new RangeError('Design requires integer D=1..12 and m=1..100');
    const between=9/donors,within=4/(donors*cellsPerDonor),variance=between+within;
    return Object.freeze({donors,cellsPerDonor,totalCells:donors*cellsPerDonor,between,within,variance,se:Math.sqrt(variance),floor:3/Math.sqrt(donors)});
  }
  const strings={};
  function tr(ru,en){if(!Object.hasOwn(strings,ru)){strings[ru]=en;D.i18n.pack('en',{strings:{[ru]:en}});}return ru;}
  function words(parent,id,x,y,width,height,ru,en,size=25,color=C.white,align='center'){
    return L.textBox(parent,{id,x,y,width,height,text:tr(ru,en),size,color,padding:4,align,valign:'middle'});
  }
  function rect(parent,x,y,width,height,color,opacity=1){const el=D.dom.s('rect',{x,y,width,height,fill:color,'fill-opacity':opacity});parent.append(el);return el;}
  function source(){return tr('Придуманные данные · один ген и один тип клеток · D1–D3 независимы по условию','Invented data · one gene and one cell type · D1–D3 independent by assumption');}
  function register(id,title,notes,qa,build){
    D.i18n.pack('en',{notes:{[id]:notes.map(p=>F.note(p[1]))},qa:{[id]:qa.map(q=>({q:q[1],a:q[3],source:'Invented teaching example; explicit assumptions in Notes.'}))}});
    D.deck.register({id,chapter:tr('Клетки и независимые данные','Cells and independent evidence'),title:tr(...title),notes:notes.map(p=>F.note(p[0])),qa:qa.map(q=>({q:q[0],a:q[2],source:'Придуманный пример; условия указаны в пояснениях.'})),build});
  }
  const ypos=d=>278+d*108;
  function poses(compact){return Object.fromEntries(cells.map((c,i)=>[c.id,{x:(compact?205:245)+(i%4)*(compact?88:245),y:ypos(Math.floor(i/4))}])) ;}
  function cellActors(stage){
    const actors=cells.map((c,i)=>{const node=F.group(stage);node.dataset.cellId=c.id;node.dataset.sample=c.sample;node.dataset.rawCount=String(c.counts[0]);
      F.dot(node,0,0,23,C.bg).setAttribute('stroke',COLORS[Math.floor(i/4)]);
      words(node,'cell-count-'+c.id,-24,-24,48,48,String(c.counts[0]),String(c.counts[0]),25,COLORS[Math.floor(i/4)]);
      words(node,'cell-id-'+c.id,-38,26,76,40,c.id,c.id,21,COLORS[Math.floor(i/4)]);
      F.shared(node,{id:c.id,kind:'cell-record',label:'Cell '+c.id,source:SOURCE,value:c.counts[0]});return {id:c.id,node};});
    return {actors,track:F.motionTrack(actors)};
  }
  function donorLabels(stage){return DONORS.map((d,i)=>words(stage,'donor-'+d,75,ypos(i)-26,88,52,d,d,29,COLORS[i]));}
  register('nested-cells',['Клетка принадлежит донору','A cell belongs to a donor'],[
    ['Перед нами двенадцать придуманных клеточных записей. В кружке — сырой счёт одного условного гена G, под кружком — уникальный ID. Префикс D1, D2 или D3 указывает донора. Все клетки относятся к одному условному типу; одинаковый счёт не означает одну и ту же клетку.','These are twelve invented cell records. A circle contains the raw count of one toy gene G; the unique ID sits below it. D1, D2 or D3 identifies the donor. All cells have the same toy type. Equal counts do not make two cells the same record.'],
    ['Те же клетки собраны в три донорские группы. Счета, ID и принадлежность не меняются. По условию примера D1–D3 независимо отобраны из одной популяции; клетки внутри донора могут разделять общие влияния. Поэтому здесь 12 клеточных измерений, но только 3 независимые донорские единицы. У реального исследования независимость проверяют по дизайну, а не по количеству ID. Следующий вопрос: как получить одну сводку на донора?','The same cells are collected into three donor groups. Counts, IDs and membership do not change. For this example, D1–D3 are assumed independently sampled from one population; cells within a donor may share influences. There are 12 cell measurements but only 3 independent donor units. In a real study, independence comes from the design, not from counting IDs. Next: how can each donor contribute one summary?']
  ],[
    ['Доказывают ли разные ID независимость?','Do distinct IDs prove independence?','Нет. Это разные записи. Независимость определяется отбором и структурой зависимости; два образца одного донора могут быть зависимыми.','No. They establish distinct records. Independence depends on sampling and dependence structure; two samples from one donor can be dependent.'],
    ['Бесполезны ли дополнительные клетки?','Are additional cells useless?','Нет. Они могут точнее описать донора или редкий клеточный тип. Но сами по себе не добавляют независимо отобранных доноров.','No. They can describe a donor or a rare cell type more precisely. They do not, by themselves, add independently sampled donors.']
  ],ctx=>{
    const v=F.stage(ctx,tr('Клетка принадлежит донору','A cell belongs to a donor'),'',source()),stage=K.viewport(v.svg),items=cellActors(stage),state={group:0};
    const labels=donorLabels(stage),brackets=DONORS.map((d,i)=>F.path(stage,[[162,ypos(i)-35],[150,ypos(i)-35],[150,ypos(i)+66],[162,ypos(i)+66]],COLORS[i],2));
    const head=words(stage,'raw-header',140,163,1000,58,'Учебный набор: число в клетке — сырой счёт G','Toy data: the number in each cell is a raw count of G',28);
    const result=F.group(stage);words(result,'twelve',685,265,465,75,'12 клеток','12 cells',43);words(result,'three',685,343,465,75,'3 донора','3 donors',43,C.gold);words(result,'assumption',690,428,450,136,'Доноры независимы по условию. Клетки вложены в доноров.','Donors are independent by assumption. Cells are nested within donors.',26);
    function paint(){items.track.between(poses(false),poses(true),state.group);labels.forEach(l=>F.opacity(l.el,F.phase(state.group,.7,1)));brackets.forEach(b=>F.revealStroke(b,F.phase(state.group,.6,1)));F.opacity(result,F.phase(state.group,.75,1));v.root.dataset.motionPhase=JSON.stringify(state);}
    const driver=F.driver(state,paint);ctx.onDispose(driver.dispose);paint();v.caption(tr('Разные клеточные ID обозначают разные записи.','Different cell IDs identify different records.'));
    ctx.step(()=>{v.caption(tr('12 клеток вложены в 3 независимых по условию донора.','12 cells are nested in 3 donors, assumed independent.'));return driver.to({group:1},{duration:2300});});return v.root;
  });
  register('donor-summary',['Одна сводка на донора','One summary per donor'],[
    ['Сохраняем все двенадцать клеток с исходными счетами. Каждая строка — один донор и один клеточный тип. Данные придуманы; здесь нет групп лечения и сравнения экспрессии.','Keep all twelve cells and their raw counts. Each row is one donor and one cell type. These data are invented; there are no treatment groups or differential-expression analysis.'],
    ['От каждой клетки растёт отдельный вклад в новую сумму справа. Полоски добавляются в порядке a, b, c, d; их длины используют общую шкалу 0–32. Итоги D1=8, D2=20, D3=32 вычислены K.aggregateCounts. Сумма — новый агрегат с перечнем исходных ID, а не новая клетка. Промежуточная длина — ход арифметического объяснения, а не дробный измеренный счёт.','A separate contribution from each cell grows into a new sum on the right. Segments are added in order a, b, c, d on a common 0–32 scale. K.aggregateCounts computes totals D1=8, D2=20 and D3=32. Each sum is a new aggregate retaining its source IDs, not a new cell. Partial widths show the arithmetic explanation, not fractional measured counts.'],
    ['Делим каждую сумму на четыре клетки: получаем донорские средние 2, 5 и 8 счётов на клетку. Это простая сводка для учебной арифметики, не полная нормализация scRNA-seq и не метод дифференциальной экспрессии. У всех доноров одинаковое число клеток, поэтому среднее трёх сводок равно среднему двенадцати клеток. Теперь можно спросить о неопределённости этого общего среднего.','Divide each sum by four cells, giving donor means 2, 5 and 8 counts per cell. This is a simple arithmetic teaching summary, not full scRNA-seq normalization or a differential-expression method. All donors have the same cell count, so the mean of the three summaries equals the mean of the twelve cells. We can now ask about the uncertainty of that overall mean.']
  ],[
    ['Почему сумма не является ещё одной клеткой?','Why is a sum not another cell?','Сумма вычислена из существующих клеток. Она содержит их вклады и не является новым независимо полученным измерением.','The sum is calculated from existing cells. It contains their contributions and is not a new independently acquired measurement.'],
    ['Можно ли так сравнить реальные группы scRNA-seq?','Can this directly compare real scRNA-seq groups?','Нет. Здесь показаны только группировка, сумма и среднее. Реальный анализ учитывает дизайн, библиотечные размеры, клеточные типы и подходящую статистическую модель.','No. This shows only grouping, summing and averaging. Real analysis accounts for design, library sizes, cell types and an appropriate statistical model.']
  ],ctx=>{
    const v=F.stage(ctx,tr('Одна сводка на донора','One summary per donor'),'',source()),stage=K.viewport(v.svg),items=cellActors(stage),state={sum:0,mean:0};items.track.set(poses(true));donorLabels(stage);
    words(stage,'cell-header',165,168,345,64,'Учебные клетки','Toy cells',28);
    const sumHeader=words(stage,'sum-header',595,162,340,73,'Сумма сырых счетов','Raw-count sum',28);
    const meanHeader=words(stage,'mean-header',970,153,220,95,'Среднее на клетку','Mean per cell',27);
    const sumGroup=F.group(stage),meanGroup=F.group(stage);const parts=[],totals=[];
    aggregation.groups.forEach((group,d)=>{
      const row=F.group(sumGroup);row.dataset.aggregateId=group.id;row.dataset.sourceIds=group.sourceIds.join(',');let start=0;
      group.sourceIds.forEach((id,j)=>{const c=cells.find(c=>c.id===id),bar=rect(row,600,ypos(d)-17,0,34,COLORS[d],.45+.13*j);bar.dataset.contributionFrom=id;parts.push({bar,start,count:c.counts[0],j});start+=c.counts[0];});
      totals.push(words(row,'sum-value-'+d,915,ypos(d)-28,64,56,String(group.counts[0]),String(group.counts[0]),29,COLORS[d]));
      words(meanGroup,'divide-'+d,975,ypos(d)-23,85,48,'÷ 4 =','÷ 4 =',25);
      const node=F.group(meanGroup);node.dataset.aggregateId=means[d].id;node.dataset.sourceIds=group.sourceIds.join(',');words(node,'mean-value-'+d,1070,ypos(d)-32,95,64,String(means[d].value),String(means[d].value),39,COLORS[d]);
    });
    const axis=F.group(sumGroup);F.line(axis,600,566,904,566,C.grey,1).setAttribute('stroke-linecap','butt');[0,8,16,24,32].forEach(n=>{F.line(axis,600+n*9.5,563,600+n*9.5,572,C.grey,1);words(axis,'sum-tick-'+n,580+n*9.5,571,40,32,String(n),String(n),18,C.grey);});
    function paint(){parts.forEach(p=>{const a=F.phase(state.sum,p.j/4,(p.j+1)/4);p.bar.setAttribute('x',600+p.start*9.5);p.bar.setAttribute('width',p.count*9.5*a);});totals.forEach(t=>F.opacity(t.el,state.sum===1?1:0));F.opacity(sumGroup,state.sum>0?1:0);F.opacity(sumHeader.el,state.sum>0?1:0);F.opacity(meanGroup,state.mean);F.opacity(meanHeader.el,state.mean);v.root.dataset.motionPhase=JSON.stringify(state);}
    const driver=F.driver(state,paint);ctx.onDispose(driver.dispose);paint();v.caption(tr('Клетки остаются видимыми как исходные наблюдения.','Cells remain visible as the source observations.'));
    ctx.step(()=>{v.caption(tr('Вклады клеток складываются в три новые донорские суммы.','Cell contributions add into three new donor totals.'));return driver.to({sum:1},{duration:2600});});
    ctx.step(()=>{v.caption(tr('Делим суммы на 4: донорские средние равны 2, 5 и 8.','Divide totals by 4: the donor means are 2, 5 and 8.'));return driver.to({sum:1,mean:1},{duration:1400});});return v.root;
  });
  register('which-sem',['Какая единица стоит за SEM?','Which unit underlies the SEM?'],[
    ['Три точки — донорские средние 2, 5 и 8 из предыдущей сцены. Единица оси — счёт на клетку. Общее среднее равно 5. Поскольку дизайн сбалансирован, объединение клеток даёт то же среднее; это ещё не означает ту же неопределённость.','The three points are donor means 2, 5 and 8 from the previous scene. The axis is counts per cell. The overall mean is 5. Because the design is balanced, pooling the cells gives the same mean; this does not imply the same uncertainty.'],
    ['Если механически применить s/√n к двенадцати клеточным счетам, получится SEM=√(78/(11×12))≈0.769. Показан интервал 5±SEM. Такое использование считает клетки независимыми одинаково распределёнными единицами; это не обосновано для вложенных клеток. Узкая полоска сама по себе не подтверждает точность. Это демонстрация неверно выбранной единицы, а не доверительный интервал.','Mechanically applying s/√n to the twelve cell counts gives SEM=√(78/(11×12))≈0.769. The display shows 5±SEM. This treats cells as independent identically distributed units, which is not justified for these nested cells. A narrow bar does not establish precision. This illustrates the wrong unit choice; it is not a confidence interval.'],
    ['При заявленном допущении независимых одинаково распределённых донорских сводок используем три средних: отклонения −3, 0, 3; выборочная дисперсия 18/(3−1)=9; SD=3; SEM=3/√3≈1.732. Показан 5±SEM на той же шкале. Только три донора дают ненадёжную оценку разброса, и SEM не является автоматически доверительным интервалом. Не любое корректное исправление обязано расширять интервал именно настолько: числа относятся к этому примеру. Следующий шаг — отдельная модель планирования.','Under the stated assumption of independent identically distributed donor summaries, use the three means: deviations −3, 0, 3; sample variance 18/(3−1)=9; SD=3; SEM=3/√3≈1.732. The display shows 5±SEM on the same scale. Three donors give an unstable estimate of spread, and SEM is not automatically a confidence interval. A valid correction need not always widen the interval by this amount; these numbers belong to this example. Next comes a separate design model.']
  ],[
    ['SD и SEM — одно и то же?','Are SD and SEM the same?','Нет. SD описывает разброс выбранных единиц. SEM оценивает стандартное отклонение их среднего при подходящих допущениях независимости. Здесь SD донорских средних = 3, SEM ≈ 1.732.','No. SD describes the spread of the selected units. SEM estimates the sampling standard deviation of their mean under suitable independence assumptions. Here donor-mean SD is 3 and SEM is about 1.732.'],
    ['Почему оба центра равны пяти?','Why are both centers five?','У каждого донора ровно четыре клетки. Поэтому равновзвешенное среднее донорских средних совпадает с объединённым клеточным средним. При разном числе клеток эти веса могут различаться.','Each donor has exactly four cells. Equal weighting of donor means therefore agrees with the pooled cell mean. Unequal cell counts can make those weights differ.']
  ],ctx=>{
    const v=F.stage(ctx,tr('Какая единица стоит за SEM?','Which unit underlies the SEM?'),'',source()),stage=K.viewport(v.svg),state={naive:0,donor:0},x=K.linearScale([0,10],[505,1155]);
    words(stage,'means-label',75,230,365,80,'Учебные средние','Toy donor means',28);
    means.forEach((m,i)=>{const node=F.group(stage);node.dataset.summaryId=m.id;F.dot(node,x(m.value),260,9,COLORS[i]);words(node,'mean-point-'+i,x(m.value)-45,274,90,47,m.sample+': '+m.value,m.sample+': '+m.value,23,COLORS[i]);});
    F.line(stage,505,330,1155,330,C.grey,1).setAttribute('stroke-linecap','butt');[0,2,4,6,8,10].forEach(n=>{F.line(stage,x(n),326,x(n),335,C.grey,1);words(stage,'sem-tick-'+n,x(n)-20,337,40,38,String(n),String(n),19,C.grey);});words(stage,'sem-units',525,171,615,60,'Счёт на клетку · общая шкала','Counts per cell · one shared scale',27);
    const naive=F.group(stage),donor=F.group(stage);
    words(naive,'naive-label',75,388,380,85,'12 клеток как независимые','12 cells treated as independent',27,C.red);
    words(donor,'donor-label',75,500,380,85,'3 донорские сводки','3 donor summaries',27,C.blue);
    const bars=[{g:naive,y:427,sem:cellSummary.sem,color:C.red,key:'naive'},{g:donor,y:539,sem:donorSummary.sem,color:C.blue,key:'donor'}].map(o=>{o.line=F.line(o.g,x(5),o.y,x(5),o.y,o.color,9);o.line.setAttribute('stroke-linecap','butt');o.dot=F.dot(o.g,x(5),o.y,7,C.white);o.label=words(o.g,o.key+'-value',615,o.y-56,420,43,'5 ± '+o.sem.toFixed(2)+' (SEM)','5 ± '+o.sem.toFixed(2)+' (SEM)',25,o.color);return o;});
    function paint(){bars.forEach(o=>{const p=state[o.key];F.seg(o.line,x(5-o.sem*p),o.y,x(5+o.sem*p),o.y);F.opacity(o.g,p>0?1:0);F.opacity(o.label.el,F.phase(p,.7,1));});v.root.dataset.motionPhase=JSON.stringify(state);v.root.dataset.naiveSem=String(cellSummary.sem);v.root.dataset.donorSem=String(donorSummary.sem);}
    const driver=F.driver(state,paint);ctx.onDispose(driver.dispose);paint();v.caption(tr('Одинаковое среднее ещё не означает одинаковую неопределённость.','The same mean does not imply the same uncertainty.'));
    ctx.step(()=>{v.caption(tr('Механический расчёт по клеткам даёт SEM 0.77; независимость не обоснована.','A mechanical cell-level calculation gives SEM 0.77; independence is unjustified.'));return driver.to({naive:1},{duration:1800});});
    ctx.step(()=>{v.caption(tr('По 3 независимым донорским сводкам SEM ≈ 1.73. Это не доверительный интервал.','Across 3 independent donor summaries, SEM ≈ 1.73. This is not a confidence interval.'));return driver.to({naive:1,donor:1},{duration:1800});});return v.root;
  });
  register('design-budget',['Что изменят дополнительные клетки?','What will more cells change?'],[
    ['Теперь отдельная придуманная модель планирования, а не подгонка предыдущих данных. Пусть Yᵢⱼ=μ+bᵢ+εᵢⱼ, где независимые донорские эффекты bᵢ имеют среднее 0 и дисперсию 9, а ошибки εᵢⱼ — среднее 0 и дисперсию 4. Ошибки взаимно независимы и независимы от донорских эффектов. У каждого из D доноров измерено одинаковое число m клеток. Тогда дисперсия общего среднего равна 9/D+4/(D×m). Полосы показывают эти два вклада в квадрате условных единиц, а SE — квадратный корень их суммы. Это ожидаемая неопределённость модели, не оценка из трёх доноров.','This is a separate invented design model, not a fit to the previous data. Let Yᵢⱼ=μ+bᵢ+εᵢⱼ. Independent donor effects bᵢ have mean 0 and variance 9; errors εᵢⱼ have mean 0 and variance 4. Errors are mutually independent and independent of donor effects. Each of D donors has the same m measured cells. The grand-mean variance is then 9/D+4/(D×m). The bars show these two contributions in squared arbitrary units, while SE is the square root of their sum. This is expected model uncertainty, not an estimate from three donors.'],
    ['Увеличиваем m при фиксированном D=3: внутридонорский вклад 4/(D×m) уменьшается, а донорский вклад 9/D=3 остаётся. При m→∞ SE стремится к 3/√D≈1.732, а не к нулю. Реальные дополнительные клетки могут улучшать описание донора, но остаются вложенными в тех же доноров. Ползунки меняют предполагаемый дизайн; они не генерируют наблюдения.','Increase m while D=3 stays fixed: the within-donor term 4/(D×m) shrinks, while the donor term 9/D=3 remains. As m→∞, SE approaches 3/√D≈1.732, not zero. Additional real cells can improve a donor description while remaining nested in the same donors. The sliders change a hypothetical design; they do not generate observations.'],
    ['Теперь увеличиваем число независимо отобранных доноров D: уменьшаются оба вклада. Попробуйте оба ползунка и сравните их действие на общей фиксированной шкале дисперсии 0–13. Это результат данной модели с ненулевой донорской вариацией, а не универсальная рекомендация по бюджету: важны также редкость типов клеток, качество измерений, стоимость и научный вопрос. Дополнительные клетки не бесполезны; они решают другую часть задачи.','Now increase the number of independently sampled donors D: both contributions shrink. Try both sliders and compare their effects on the same fixed variance scale, 0–13. This follows from this model with nonzero donor variation, not a universal budget recommendation: rare cell types, measurement quality, cost and the scientific question also matter. Additional cells are useful; they address a different part of the problem.']
  ],[
    ['Откуда берётся формула дисперсии?','Where does the variance formula come from?','Общее среднее содержит среднее D независимых эффектов bᵢ с дисперсией 9/D и среднее D×m независимых ошибок с дисперсией 4/(D×m). Эти части независимы, поэтому дисперсии складываются. Все клетки одного донора разделяют один bᵢ.','The grand mean contains the average of D independent bᵢ effects, with variance 9/D, plus the average of D×m independent errors, with variance 4/(D×m). These parts are independent, so their variances add. All cells from one donor share the same bᵢ.'],
    ['Больше клеток всегда даёт малую выгоду?','Do more cells always give little benefit?','Нет. Здесь донорская дисперсия 9, внутридонорская 4, и цель — среднее по донорам. Другие соотношения, редкие клетки или иная цель меняют выгоду. Главное — не путать число клеток с числом независимых доноров.','No. This example sets donor variance to 9, within-donor variance to 4, and targets a donor-population mean. Different variance ratios, rare cells or another target change the benefit. The key is not to confuse cell count with independent donor count.']
  ],ctx=>{
    const v=F.stage(ctx,tr('Что изменят дополнительные клетки?','What will more cells change?'),'',tr('Отдельная учебная модель · Var(b)=9, Var(ε)=4 · независимые доноры · равное m','Separate toy model · Var(b)=9, Var(ε)=4 · independent donors · equal m')),stage=K.viewport(v.svg),state={d:3,m:4};
    words(stage,'model-label',100,157,1080,64,'Учебная модель: независимые доноры, равное m','Toy model: independent donors, equal m',29);
    const between=rect(stage,125,290,0,52,C.blue),within=rect(stage,125,290,0,52,C.teal),x=K.linearScale([0,13],[125,1155]);
    const equation=words(stage,'variance-equation',110,219,1060,60,'Var(среднего) = 9/D + 4/(D × m) · у.е.²','Var(mean) = 9/D + 4/(D × m) · a.u.²',30);
    F.line(stage,125,354,1155,354,C.grey,1).setAttribute('stroke-linecap','butt');[0,3,6,9,13].forEach(n=>{F.line(stage,x(n),350,x(n),361,C.grey,1);words(stage,'variance-tick-'+n,x(n)-21,360,42,34,String(n),String(n),20,C.grey);});
    const bLabel=words(stage,'between-value',85,407,505,75,'','',27,C.blue),wLabel=words(stage,'within-value',680,407,505,75,'','',27,C.teal);
    const readout=words(stage,'budget-readout',150,482,980,48,'','',28);
    let driver;const mControl=T.control(v.root,tr('Клеток на донора · m','Cells per donor · m'),1,100,4,1,value=>driver.set({m:value}),125,549,445);
    const dControl=T.control(v.root,tr('Независимых доноров · D','Independent donors · D'),1,12,3,1,value=>driver.set({d:value}),705,549,445);
    L.contract(mControl.el,{id:'cells-control',box:{x:118,y:541,width:460,height:69},space:v.root});L.contract(dControl.el,{id:'donors-control',box:{x:698,y:541,width:460,height:69},space:v.root});
    function paint(){const q=varianceBudget(Math.round(state.d),Math.round(state.m));between.setAttribute('width',x(q.between)-x(0));within.setAttribute('x',x(q.between));within.setAttribute('width',x(q.variance)-x(q.between));
      bLabel.setText(tr('Между донорами: '+q.between.toFixed(2),'Between donors: '+q.between.toFixed(2)));wLabel.setText(tr('Внутри доноров: '+q.within.toFixed(3),'Within donors: '+q.within.toFixed(3)));
      readout.setText(tr(q.totalCells+' клеток · '+q.donors+' доноров · SE = '+q.se.toFixed(3),q.totalCells+' cells · '+q.donors+' donors · SE = '+q.se.toFixed(3)));
      mControl.input.value=q.cellsPerDonor;mControl.output.textContent=String(q.cellsPerDonor);dControl.input.value=q.donors;dControl.output.textContent=String(q.donors);Object.assign(v.root.dataset,{motionPhase:JSON.stringify(state),budget:JSON.stringify(q)});
    }
    driver=F.driver(state,paint);ctx.onDispose(driver.dispose);paint();v.caption(tr('Два вклада в дисперсию: между донорами и внутри донора.','Two variance contributions: between donors and within a donor.'));
    ctx.step(()=>{v.caption(tr('При росте m донорский вклад остаётся. SE не стремится к нулю.','As m grows, the donor contribution remains. SE does not approach zero.'));return driver.to({d:3,m:100},{duration:2500});});
    ctx.step(()=>{v.caption(tr('Больше независимых доноров уменьшает оба вклада. Попробуйте ползунки.','More independent donors reduce both contributions. Try the sliders.'));return driver.to({d:12,m:100},{duration:2300});});return v.root;
  });
  window.INDEPENDENT_EVIDENCE=Object.freeze({source:SOURCE,cells,aggregation,means,donorSummary,cellSummary,varianceBudget});
})();
