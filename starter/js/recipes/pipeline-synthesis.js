/* Optional recurring-map composition. All values are original teaching fixtures.
   The map describes this tiny calculation, not a mandatory scientific workflow. */
(function (g) {
  'use strict';
  const CELLS = Object.freeze([{ id: 'c1', value: 1 }, { id: 'c2', value: 3 }].map(Object.freeze));
  const REFERENCE = Object.freeze([3, 5]);
  const IDS = Object.freeze(['pipeline-inputs', 'pipeline-shift', 'pipeline-spread', 'pipeline-synthesis']);
  function calculate(shift, spread, reference = REFERENCE) {
    if (!Number.isFinite(shift) || shift < 0 || shift > 4 || !Number.isFinite(spread) || spread < 0 || spread > 1) throw new RangeError('shift in [0,4], spread in [0,1]');
    const sampleMean = CELLS.reduce((sum, c) => sum + c.value, 0) / CELLS.length;
    // Reference information never enters the prediction.
    const values = CELLS.map(c => sampleMean + shift + spread * (c.value - sampleMean));
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const range = Math.max(...values) - Math.min(...values);
    if (!Array.isArray(reference) || reference.length !== 2 || ![0,1].every(i => Object.hasOwn(reference,i) && Number.isFinite(reference[i]))) throw new RangeError('two dense finite reference values required');
    const referenceMean = reference[0]/2 + reference[1]/2;
    const referenceRange = Math.abs(reference[1] - reference[0]);
    const meanError=Math.abs(mean-referenceMean), rangeError=Math.abs(range-referenceRange);
    if (![referenceMean,referenceRange,meanError,rangeError].every(Number.isFinite)) throw new RangeError('reference summaries and discrepancies must be finite');
    return { sampleMean, values, mean, range, referenceMean, referenceRange, meanError, rangeError };
  }
  g.PIPELINE_SYNTHESIS_EXAMPLE = Object.freeze({ cells: CELLS, reference: REFERENCE, sceneIds: IDS, calculate });
  if (!g.D?.deck) return;

  const dictionary = {};
  function tr(ru, en) { if (!Object.hasOwn(dictionary, ru)) { dictionary[ru] = en; D.i18n.pack('en', { strings: { [ru]: en } }); } return ru; }
  function words(p, id, x, y, width, height, ru, en = ru, size = 25, color = C.white, align = 'center') {
    return L.textBox(p, { id, x, y, width, height, text: tr(ru,en), size, color, align, valign: 'middle', padding: 5, lineHeight: 1.2 });
  }
  function rounded(n) { const v = Math.round(n * 100) / 100; return (Math.abs(v) < 1e-10 ? 0 : v).toString(); }
  function relation(n) { return Math.abs(n - Math.round(n*100)/100) < 1e-9 ? '=' : '≈'; }
  function number(n) { return (relation(n) === '≈' ? '≈ ' : '') + rounded(n); }
  function rect(p, x, y, width, height, color, opacity=1, stroke='none') {
    const n = D.dom.s('rect', { x, y, width, height, fill: color, 'fill-opacity': opacity, stroke, 'stroke-width': 1.5 }); p.append(n); return n;
  }
  function path(p, d, color, opacity=.65, width=2) {
    const n = D.dom.s('path', { d, fill: 'none', stroke: color, 'stroke-opacity': opacity, 'stroke-width': width, 'stroke-linecap': 'butt', 'stroke-linejoin': 'round' }); p.append(n); return n;
  }
  const provenance = () => tr('Придуманный пример · две клетки · условные единицы · эталон только для проверки', 'Invented example · two cells · arbitrary units · reference used only for evaluation');
  const commonQA = [
    ['Откуда взялся эталон?', 'Where did the reference come from?',
      'Значения [3,5] придуманы отдельно для проверки этой учебной модели. Они не входят в построение y и не обучают параметры. В настоящем исследовании источник и независимость проверки надо обосновать.',
      'The values [3,5] were invented separately to evaluate this teaching model. They do not enter the construction of y or train its parameters. A real study must justify the source and independence of its evaluation.'],
    ['Достаточно ли среднего и размаха?', 'Are mean and range sufficient?',
      'Только для этой пары чисел они задают неупорядоченную пару. Для больших наборов разные распределения могут иметь одинаковые среднее и размах. Здесь нет оценки неопределённости или доказательства биологического механизма.',
      'For this pair of numbers they determine the unordered pair. Larger samples can have different distributions with the same mean and range. This example provides neither uncertainty estimates nor evidence of a biological mechanism.']
  ];
  const specs = [
    { id: IDS[0], title: ['Два входа, одно предсказание', 'Two inputs, one prediction'],
      initial: {shift:0, spread:1, focus:0, trace:0},
      states: [{focus:1, trace:1}, {focus:2, trace:2}],
      question: ['Верное среднее — верные отдельные клетки?', 'Does a correct mean imply correct individual cells?'],
      notes: [
        ['Один вопрос всей истории: означает ли верное среднее верное предсказание клеток? Здесь всё придумано: c1=1, c2=3, среднее выборки 2. Предложенный моделью сдвиг δ — отдельный вход. Формула в центре объединяет сдвиг и реальные значения этой учебной выборки. Сейчас δ=0 и s=1.', 'One question runs through this story: does a correct mean imply a correct cell prediction? Everything here is invented: c1=1, c2=3, with sample mean 2. The proposed shift δ is a separate input. The central formula combines it with the values of this teaching sample. Initially δ=0 and s=1.'],
        ['Проследите два входа. Предложение δ задаёт изменение среднего, а c1 и c2 — отклонения от среднего выборки. При s=1 сохраняются отклонения −1 и +1; y=[1,3]. Имена клеток продолжаются в двух полосах. Это вычисление значений, а не новые наблюдения.', 'Trace the two inputs. The proposal δ specifies a mean change, while c1 and c2 supply deviations from the sample mean. At s=1, deviations −1 and +1 are retained, giving y=[1,3]. Cell names continue in the two bars. These are calculated values, not new observations.'],
        ['Теперь один результат идёт по двум ветвям. Его среднее μ=2 отличается от среднего эталона 4 на 2. Размах R=3−1=2 уже равен размаху эталона. Придуманный эталон [3,5] входит только справа, при проверке; он не был входом построения. Дальше изменим один параметр δ.', 'Now one result enters two branches. Its mean μ=2 differs from reference mean 4 by 2. Its range R=3−1=2 already equals the reference range. The invented reference [3,5] enters only on the right, at evaluation; it was not a construction input. Next, change only δ.']
      ],
      qa: ['Что дают два входа?', 'What do the two inputs contribute?', 'δ предлагает общий сдвиг, а выбранные c1 и c2 задают исходные значения и их различие. Одно число δ не содержит эту клеточную информацию.', 'δ proposes a common shift, while sampled c1 and c2 supply starting values and their difference. δ alone does not contain that cell-level information.']
    },
    { id: IDS[1], title: ['Общий сдвиг меняет среднее', 'A common shift changes the mean'],
      initial: {shift:0, spread:1, focus:0, trace:2},
      states: [{shift:1, focus:1}, {shift:2, focus:2}],
      question: ['Прибавим одно число обеим клеткам. Изменится ли размах?', 'Add the same number to both cells. Does the range change?'],
      notes: [
        ['Карта остаётся на прежнем месте. Сохраняем c1=1, c2=3 и s=1. Перед движением предскажите: если обеим клеткам прибавить одинаковое δ, что произойдёт со средним и размахом? Шкала полос 0–8 остаётся фиксированной.', 'The map stays in place. Keep c1=1, c2=3 and s=1. Before the movement, predict what adding the same δ to both cells does to their mean and range. The bar scale remains fixed at 0–8.'],
        ['δ возрастает от 0 до 1. Обе полосы удлиняются на одну единицу: [1,3]→[2,4]. Среднее становится 3, его ошибка — 1. Разность между значениями остаётся 2. Во время движения числа и полосы вычисляются по одному текущему δ; знак ≈ обозначает округление.', 'δ rises from 0 to 1. Both bars grow by one unit: [1,3]→[2,4]. The mean becomes 3 and its error becomes 1. The difference between values stays 2. During movement, numbers and bars use the same current δ; ≈ marks rounding.'],
        ['При δ=2 получаем [3,5], среднее 4 и размах 2. Обе ошибки равны нулю для этого учебного эталона. Но пока мы сохранили исходный разброс s=1. Следующий вопрос: может ли другой способ построения клеток оставить среднее верным и изменить клетки?', 'At δ=2 the result is [3,5], with mean 4 and range 2. Both errors are zero for this teaching reference. So far we retained the original spread with s=1. Next: could a different construction keep the mean correct while changing the cells?']
      ],
      qa: ['Почему размах не меняется?', 'Why does the range stay fixed?', '(c2+δ)−(c1+δ)=c2−c1: общий сдвиг сокращается. Этот вывод требует одного и того же δ для обеих клеток.', '(c2+δ)−(c1+δ)=c2−c1: the common shift cancels. This conclusion requires the same δ for both cells.']
    },
    { id: IDS[2], title: ['Верное среднее может скрывать другие клетки', 'A correct mean can hide different cells'],
      initial: {shift:2, spread:1, focus:1, trace:2},
      states: [{spread:0, focus:3}, {spread:1, focus:3}],
      question: ['Среднее равно 4. Можно ли изменить клетки, сохранив его?', 'The mean is 4. Can the cells change while it stays fixed?'],
      notes: [
        ['Сохраняем сдвиг δ=2. Параметр s умножает отклонения cᵢ−2, то есть −1 и +1. При s=1 y=[3,5]. Сейчас изменим только s, сохранив число клеток, их имена и среднее. Это выбранная учебная операция, не обязательный шаг реальной модели.', 'Keep shift δ=2. Parameter s multiplies deviations cᵢ−2, namely −1 and +1. At s=1, y=[3,5]. We now change only s, keeping the number of cells, their names and their mean. This is a chosen teaching operation, not a required step in a real model.'],
        ['При s=0 оба отклонения исчезают: y=[4,4]. Среднее по-прежнему 4 и его ошибка 0. Но размах стал 0 вместо эталонных 2, поэтому ошибка размаха равна 2. Одна успешная проверка среднего пропустила это изменение отдельных клеток.', 'At s=0 both deviations vanish: y=[4,4]. The mean is still 4 with error 0. But the range is now 0 instead of reference range 2, so its error is 2. A successful mean check alone missed the change in individual cells.'],
        ['Возвращаем s=1: [4,4]→[3,5]. Среднее не движется, а размах снова 2. Формула сохраняет имена клеток и отклонения исходной выборки; она не создаёт новые независимые измерения. Для больших распределений одних среднего и размаха недостаточно.', 'Restore s=1: [4,4]→[3,5]. The mean does not move and the range returns to 2. The formula preserves cell names and the original sample deviations; it does not create new independent measurements. Mean and range alone are insufficient for larger distributions.']
      ],
      qa: ['Почему среднее не зависит от s?', 'Why does the mean not depend on s?', 'Отклонения −1 и +1 в сумме дают 0. Умножение обоих на s оставляет их сумму нулевой. Поэтому среднее y равно 2+δ при любом показанном s.', 'The deviations −1 and +1 sum to zero. Multiplying both by s leaves their sum zero. The mean of y is therefore 2+δ for every displayed s.']
    },
    { id: IDS[3], title: ['Соберите весь ответ', 'Put the whole answer together'],
      initial: {shift:0, spread:0, focus:0, trace:2},
      states: [{shift:2, focus:2}, {spread:1, focus:3}, {shift:3, focus:2}],
      question: ['', ''],
      notes: [
        ['Возвращаемся к исходному вопросу на той же карте. При δ=0,s=0 получаем [2,2]: неверны и среднее, и размах. Кнопки меняют названные параметры; все полосы, подстановки и ошибки пересчитываются вместе. «Проследить» показывает пути информации, не переобучает модель.', 'Return to the opening question on the same map. At δ=0,s=0, the result [2,2] has both the wrong mean and wrong range. Buttons change the named parameters; bars, substitutions and errors update together. “Trace” shows information paths; it does not retrain the model.'],
        ['Исправляем общий сдвиг до δ=2, оставляя s=0. Получаем [4,4]: ошибка среднего исчезла, ошибка размаха осталась 2. Это прямой ответ на вопрос: верное среднее само по себе не гарантирует верные отдельные клетки.', 'Correct the common shift to δ=2 while leaving s=0. The result [4,4] has zero mean error but range error 2. This directly answers the question: a correct mean alone does not guarantee correct individual cells.'],
        ['Возвращаем отклонения при s=1. Теперь y=[3,5], обе проверки совпадают с учебным эталоном. Два изменения работают на разных частях вычисления: δ перемещает общий уровень, s регулирует различие клеток. Операции и проверки остаются разными объектами.', 'Restore deviations with s=1. Now y=[3,5] agrees with the teaching reference on both checks. The two changes act on different parts of the calculation: δ moves the common level and s controls the difference between cells. Operations and evaluation checks remain separate objects.'],
        ['Намеренно сдвигаемся дальше, до δ=3: [4,6]. Размах всё ещё совпадает, но ошибка среднего стала 1. Сами операции не обещают улучшения: нужен независимый эталон и вопрос о том, что именно проверяет каждый критерий. Исследуйте кнопки. Это точная арифметика двух придуманных клеток, не научный benchmark и не вывод о биологии.', 'Deliberately shift farther, to δ=3: [4,6]. The range still agrees, but mean error rises to 1. Operations do not promise improvement by themselves: we need an independent reference and a question about what each criterion checks. Explore the buttons. This is exact arithmetic for two invented cells, not a scientific benchmark or a biological conclusion.']
      ],
      qa: ['Каждая операция обязательно улучшает результат?', 'Does each operation necessarily improve the result?', 'Нет. Если сдвиг проходит мимо эталонного среднего, его ошибка возрастает. Смысл операции объясняется формулой; её полезность определяется сравнением с независимо заданной целью.', 'No. If the shift passes the reference mean, its error increases. The formula explains an operation; comparison with an independently specified target determines its usefulness.']
    }
  ];

  // Motion and attention are authored per operation, independently of the
  // accumulated route. Parameter motion may reuse a branch (e.g. collapse and
  // restore spread); its action label and current values explain the difference.
  const beats = [
    [
      {id:'inputs-known',nodes:['proposal','sample'],edges:[],zones:[0],label:['Сдвиг δ и клетки — два отдельных входа','Shift δ and cells are two separate inputs']},
      {id:'inputs-construct',nodes:['proposal','sample','construction'],edges:['proposal','sample'],zones:[1],label:['Соединяем входы → получаем y','Combine the inputs → construct y']},
      {id:'inputs-evaluate',nodes:['construction','reference','mean','range'],edges:['mean','range'],zones:[2],label:['Готовый y → две разные проверки','Finished y → two separate checks']}
    ],
    [
      {id:'shift-question',nodes:['proposal','construction'],edges:['proposal'],zones:[0],label:['Что изменит общий сдвиг δ?','What will a common shift δ change?']},
      {id:'shift-move',nodes:['proposal','construction','mean'],edges:['proposal','mean'],zones:[1],label:['Увеличиваем δ до 1: общий сдвиг','Increase δ to 1: a common shift']},
      {id:'shift-check',nodes:['construction','mean','reference'],edges:['mean'],zones:[2],label:['Доводим δ до 2: проверяем среднее','Move δ to 2: check the mean']}
    ],
    [
      {id:'spread-question',nodes:['sample','construction'],edges:['sample'],zones:[1],label:['Сохраним среднее. Что изменит s?','Keep the mean fixed. What will s change?']},
      {id:'spread-collapse',nodes:['construction','range'],edges:['range'],zones:[2],label:['Убираем отклонения: s → 0','Remove deviations: s → 0']},
      {id:'spread-restore',nodes:['sample','construction','range'],edges:['sample','range'],zones:[1],label:['Возвращаем отклонения: s → 1','Restore deviations: s → 1']}
    ],
    [
      {id:'synthesis-overview',nodes:[],edges:[],zones:[],label:['Соберите весь ответ','Put the whole answer together']},
      {id:'synthesis-mean',nodes:['proposal','construction','mean'],edges:['proposal','mean'],zones:[1],label:['1 · Исправим среднее','1 · Correct the mean']},
      {id:'synthesis-range',nodes:['sample','construction','range'],edges:['sample','range'],zones:[1],label:['2 · Вернём различие клеток','2 · Restore the cell difference']},
      {id:'synthesis-check',nodes:['construction','mean','reference'],edges:['mean'],zones:[2],label:['3 · Проверим лишний сдвиг','3 · Evaluate a shift that goes too far']}
    ]
  ];
  function build(ctx, spec) {
    const story=beats[IDS.indexOf(spec.id)],v=F.stage(ctx,tr(...spec.title),'',provenance()), p=K.viewport(v.svg), state={...spec.initial,beat:0,flow:1,replay:0,replayProgress:0,manual:0}; let driver;
    const edges=F.group(p), marks=F.group(p), labels=F.group(p), controls=F.group(p);
    const nodeIds=['proposal','sample','construction','mean','range','reference'],nodeMarks={},nodeLabels=Object.fromEntries(nodeIds.map(id=>[id,[]]));let owner='';
    function label(...args){const actor=words(...args);if(owner)nodeLabels[owner].push(actor.el);return actor;}
    function node(id){const actor=F.group(marks);actor.dataset.pipelineNode=id;nodeMarks[id]=actor;owner=id;return actor;}
    const geometry = [
      ['proposal','M292 282 C365 282 365 307 471 307',C.blue,0,1],
      ['sample','M287 468 C365 468 366 421 471 421',C.teal,0,1],
      ['mean','M888 359 C908 359 900 332 914 332',C.blue,1,2],
      ['range','M888 359 C909 359 900 477 914 477',C.teal,1,2]
    ];
    const routes=geometry.map(([id,d,c,a,b])=>{path(edges,d,c,.10,1.3);const line=path(edges,d,c,1,2),flow=path(edges,d,c,1,4);line.dataset.pipelinePath=id;flow.dataset.pipelineFlow=id;return{id,line,flow,a,b};});
    const zones=[
      label(labels,'pipe-zone-input',75,147,250,50,'1 · Входы','1 · Inputs',28),
      label(labels,'pipe-zone-build',420,147,399,50,'2 · Построить','2 · Construct',28),
      label(labels,'pipe-zone-check',917,147,287,50,'3 · Проверить','3 · Evaluate',28)
    ];
    const zoneGuides=[[80,240],[425,389],[922,277]].map(([x,w])=>rect(marks,x,145,w,3,C.gold));
    const proposal=node('proposal');
    label(labels,'pipe-proposal-name',78,210,216,50,'Сдвиг модели','Model shift',26,C.blue);
    // Parent mark owns opacity; avoid applying it twice to this numeric label.
    const shiftRead=words(proposal,'pipe-shift',85,263,202,58,'','',32,C.blue);
    label(labels,'pipe-units',92,319,190,38,'Условные единицы','Arbitrary units',19,C.grey);
    const sample=node('sample');
    label(labels,'pipe-sample-name',71,359,228,43,'Выборка клеток','Sampled cells',24,C.teal);
    CELLS.forEach((c,i)=>{const x=126+i*111, cell=F.cell(sample,x,470,17,C.teal,'pipeline-'+c.id);cell.g.dataset.pipelineCell=c.id;cell.g.dataset.value=String(c.value);
      label(labels,'pipe-sample-id-'+c.id,x-40,405,80,41,c.id,c.id,23,C.teal);
      label(labels,'pipe-sample-value-'+c.id,x-40,490,80,45,String(c.value),String(c.value),25);
    });
    const construction=node('construction');
    const formula=label(labels,'pipe-formula',367,204,465,80,'','',24);
    const bars=CELLS.map((c,i)=>{const row=F.group(construction);row.dataset.pipelineOutput=c.id;const y=307+i*114;
      label(labels,'pipe-output-id-'+c.id,482,y-26,61,52,c.id,c.id,25,C.teal);
      const bar=rect(row,557,y-13,0,26,C.teal,.75);bar.dataset.pipelineBar=c.id;
      const value=label(labels,'pipe-output-value-'+c.id,772,y-29,100,58,'','',25,C.teal);
      return{bar,value};
    });
    path(construction,'M880 292 H888 V449 H880',C.dim,.7,1.2);F.dot(construction,888,359,3,C.grey);
    F.line(construction,557,466,781,466,C.dim,1);
    [0,4,8].forEach(n=>{const x=557+n*28;F.line(construction,x,462,x,470,C.grey,1);label(labels,'pipe-tick-'+n,x-24,472,48,40,String(n),String(n),20,C.grey);});
    label(labels,'pipe-scale',548,510,251,40,'Значения y · шкала 0–8','Values y · scale 0–8',19,C.grey);
    const evaluation=F.group(marks);evaluation.dataset.pipelineNode='evaluation';
    node('reference');label(labels,'pipe-reference',927,201,284,62,'Эталон: [3, 5]','Reference: [3, 5]',25,C.gold);
    const meanNode=node('mean'),meanRing=rect(meanNode,915,273,291,124,'none',0,C.dim);
    label(labels,'pipe-mean-label',921,273,279,45,'Среднее μ · эталон 4','Mean μ · reference 4',23,C.blue);
    const meanRead=label(labels,'pipe-mean-read',922,317,276,80,'','',24,C.blue);
    const rangeNode=node('range'),rangeRing=rect(rangeNode,915,402,291,128,'none',0,C.dim);
    label(labels,'pipe-range-label',921,402,279,45,'Размах R · эталон 2','Range R · reference 2',23,C.teal);
    const rangeRead=label(labels,'pipe-range-read',922,447,276,80,'','',24,C.teal);
    evaluation.append(meanNode,rangeNode);
    owner='';
    const question=spec.id!==IDS[3]?label(labels,'pipe-question',79,549,845,63,'','',25,C.white,'left'):null;
    const buttons=[];
    function makeButton(id,box,ru,en,fn){const button=T.svgButton(controls,{id:'pipeline-'+id,box,label:tr(ru,en),onActivate:fn});
      const frame=rect(button.g,box.x,box.y,box.width,box.height,C.bg,1,C.dim);
      words(button.g,'pipe-button-'+id,box.x,box.y,box.width,box.height,ru,en,22);
      ctx.onDispose(button.dispose);buttons.push({id,button,frame});return button;
    }
    if(spec.id===IDS[3]){
      makeButton('shift-down',{x:80,y:557,width:119,height:48},'δ − 1','δ − 1',()=>change({shift:Math.max(0,state.shift-1)},2));
      makeButton('shift-up',{x:214,y:557,width:119,height:48},'δ + 1','δ + 1',()=>change({shift:Math.min(4,state.shift+1)},2));
      makeButton('spread-zero',{x:381,y:557,width:139,height:48},'s = 0','s = 0',()=>change({spread:0},3,1000));
      makeButton('spread-one',{x:535,y:557,width:139,height:48},'s = 1','s = 1',()=>change({spread:1},3,1000));
    }
    makeButton('trace',{x:963,y:557,width:241,height:48},'Повторить путь','Replay route',()=>replay());
    const manualFocus={2:{nodes:['proposal','construction','mean'],edges:['proposal','mean'],zones:[1]},3:{nodes:['sample','construction','range'],edges:['sample','range'],zones:[1]}};
    function attention(){return state.manual?manualFocus[state.manual]:story[state.beat];}
    function change(patch,focus,duration=0){driver.set({manual:focus,focus,flow:1,replay:0});return duration?driver.to(patch,{duration}):driver.set(patch);}
    function replay(){driver.set({replay:1,replayProgress:0});return driver.to({replayProgress:2},{duration:2600,after:()=>driver.set({replay:0})});}
    function paint(){
      const r=calculate(state.shift,state.spread),beat=story[state.beat],focus=attention(),known=new Set(spec.id===IDS[0]?story.slice(0,state.beat+1).flatMap(b=>b.nodes):nodeIds),revealed={};
      routes.forEach(({id,line,flow,a,b})=>{
        const progress=F.phase(state.trace,a,b),active=focus.edges.includes(id)&&progress>0;
        revealed[id]=progress;F.revealStroke(line,progress);line.setAttribute('stroke-opacity',active?.8:.35);
        Object.assign(line.dataset,{pipelineProgress:String(progress),pipelineActive:String(active)});
        const order=focus.edges.indexOf(id),start=Math.max(0,order)/Math.max(1,focus.edges.length),end=(order+1)/Math.max(1,focus.edges.length);
        const movement=state.replay?Math.min(progress,F.phase(state.replayProgress,a,b)):active?Math.min(progress,F.phase(state.flow,start,end)):0;
        F.revealStroke(flow,movement);flow.dataset.pipelineProgress=String(movement);
      });
      nodeIds.forEach(id=>{
        const active=focus.nodes.includes(id),overview=spec.id===IDS[3]&&state.beat===0&&!state.manual,feedback=state.manual&&(id==='mean'||id==='range');
        F.opacity(nodeMarks[id],active?1:overview?.7:known.has(id)?.44:.12);
        nodeLabels[id].forEach(el=>F.opacity(el,active||feedback?1:overview?.8:known.has(id)?.68:.2));
        Object.assign(nodeMarks[id].dataset,{pipelineActive:String(active),pipelineKnown:String(known.has(id))});
      });
      // δ is a label inside its mark group, so give its retained context the
      // same readability as other labels without multiplying two opacities.
      if(!focus.nodes.includes('proposal'))F.opacity(proposal,spec.id===IDS[3]&&state.beat===0&&!state.manual?.8:known.has('proposal')?.68:.2);
      zones.forEach((z,i)=>{const active=focus.zones.includes(i);F.opacity(z.el,active?1:.45);F.opacity(zoneGuides[i],active?1:0);});
      shiftRead.setText('δ '+relation(state.shift)+' '+rounded(state.shift));
      formula.setText('yᵢ = 2 + δ + s(cᵢ − 2)\nδ '+relation(state.shift)+' '+rounded(state.shift)+'   ·   s '+relation(state.spread)+' '+rounded(state.spread));
      bars.forEach((b,i)=>{b.bar.setAttribute('width',28*r.values[i]);b.bar.dataset.value=String(r.values[i]);b.value.setText(number(r.values[i]));});
      meanRead.setText(tr('μ '+relation(r.mean)+' '+rounded(r.mean)+'\nОшибка: '+number(r.meanError),'μ '+relation(r.mean)+' '+rounded(r.mean)+'\nError: '+number(r.meanError)));
      rangeRead.setText(tr('R '+relation(r.range)+' '+rounded(r.range)+'\nОшибка: '+number(r.rangeError),'R '+relation(r.range)+' '+rounded(r.range)+'\nError: '+number(r.rangeError)));
      meanRing.setAttribute('stroke',focus.nodes.includes('mean')?C.blue:C.dim);rangeRing.setAttribute('stroke',focus.nodes.includes('range')?C.teal:C.dim);
      meanRing.setAttribute('stroke-width',focus.nodes.includes('mean')?2.5:1);rangeRing.setAttribute('stroke-width',focus.nodes.includes('range')?2.5:1);
      buttons.forEach(({id,button,frame})=>{const selected=id==='spread-zero'&&state.spread===0||id==='spread-one'&&state.spread===1;
        if(id.startsWith('spread-'))button.setPressed(selected);frame.setAttribute('stroke',selected?C.gold:C.dim);
        if(id==='shift-down')button.setDisabled(state.shift<=0);if(id==='shift-up')button.setDisabled(state.shift>=4);
        if(id==='trace')button.setDisabled(state.trace===0);
      });
      if(question)question.setText(tr((state.beat+1)+' / '+story.length+' · '+beat.label[0],(state.beat+1)+' / '+story.length+' · '+beat.label[1]));
      if(spec.id===IDS[3])v.title(tr(...(state.manual?['Исследуйте параметры δ и s','Explore parameters δ and s']:beat.label)));
      if(state.replay)v.caption(tr('Повторяем уже раскрытые связи; значения и выбранный шаг сохраняются.','Replay the revealed connections; values and the selected step stay unchanged.'));
      else if(spec.id===IDS[0])v.caption(state.beat===0?tr('Предложение и выборка — разные источники информации.','Proposal and sample are different information sources.'):state.beat===1?tr('Одни и те же c1 и c2 получают вычисленные значения y.','The same c1 and c2 receive computed values y.'):tr('Один результат. Две проверки. Эталон приходит только сюда.','One result. Two checks. The reference enters only here.'));
      else if(spec.id===IDS[1])v.caption(tr('Общий сдвиг меняет среднее. Размах остаётся 2.','A common shift changes the mean. The range stays 2.'));
      else if(spec.id===IDS[2])v.caption(tr('Среднее остаётся 4. Отдельные клетки и размах меняются.','The mean stays 4. Individual cells and range change.'));
      else v.caption(r.meanError<1e-9&&r.rangeError<1e-9?tr('Обе проверки совпали — для этих двух придуманных клеток.','Both checks agree — for these two invented cells.'):r.meanError<1e-9?tr('Верное среднее ещё не означает верные отдельные клетки.','A correct mean does not yet mean correct individual cells.'):r.rangeError<1e-9?tr('Размах совпал. Среднее всё ещё отличается от эталона.','The range agrees. The mean still differs from the reference.'):tr('Чтобы оценить предсказание, нужны разные вопросы к одному результату.','Evaluating a prediction takes different questions about the same result.'));
      Object.assign(v.root.dataset,{pipelineState:JSON.stringify(state),pipelineResult:JSON.stringify(r),motionPhase:JSON.stringify(state),pipelineBeat:beat.id,pipelineAttention:JSON.stringify({nodes:focus.nodes,edges:focus.edges.filter(id=>revealed[id]>0)}),pipelineRevealed:JSON.stringify(revealed)});
    }
    driver=F.driver(state,paint);ctx.onDispose(driver.dispose);paint();
    spec.states.forEach((patch,i)=>ctx.step(()=>{const {focus,...values}=patch;driver.set({beat:i+1,focus,manual:0,replay:0,flow:0});return driver.to({...values,flow:1},{duration:1700});}));
    return v.root;
  }
  specs.forEach(spec=>{const qa=[spec.qa,...commonQA];D.i18n.pack('en',{notes:{[spec.id]:spec.notes.map(n=>F.note(n[1]))},qa:{[spec.id]:qa.map(q=>({q:q[1],a:q[3],source:'Original two-cell teaching fixture; exact arithmetic.'}))}});
    D.deck.register({id:spec.id,title:tr(...spec.title),chapter:tr('Целая картина','The whole picture'),notes:spec.notes.map(n=>F.note(n[0])),qa:qa.map(q=>({q:q[0],a:q[2],source:'Авторский учебный пример с двумя клетками; точная арифметика.'})),build:ctx=>build(ctx,spec)});
  });
})(typeof window==='undefined'?globalThis:window);
