(function(){
'use strict';
// Deterministic invented observations: these are not study measurements or a fitted model.
const OBS=Array.from({length:200},(_,i)=>[54+(((i*37)%101)-50)*.38+Math.sin(i*1.1)*2,56+(((i*43+17)%101)-50)*.36+Math.cos(i*.8)*2]);
H.register({
 id:'crispri-evidence',title:'Больше клеток или другая пара направляющих?',titleEn:'More cells, or a different guide pair?',chapter:'Независимые проверки',chapterEn:'Independent evidence',
 source:'Детерминированный учебный пример · не данные исследования',sourceEn:'Deterministic teaching example · not study data',
 notes:[
  ['Каждая точка — одно придуманное клеточное наблюдение; горизонтальная координата — условный показатель изменения относительно контроля, а не измеренное значение конкретного гена. Все точки первой строки относятся к одной паре A+B. Вертикальная черта показывает среднее уже видимых точек, без доверительного интервала. Порядок и значения наблюдений фиксированы для воспроизводимости урока.','Each point is an invented cell observation. Its horizontal coordinate is an illustrative change score relative to control, not a measured value for a particular gene. Every point in the first row belongs to A+B. The vertical mark is the mean of visible points, without a confidence interval. Observation order and values are fixed for reproducibility.'],
  ['Добавление клеток помогает описать распределение ответа на A+B. Среднее вычисляется заново по видимым точкам. Но число разных пар остаётся равным одному: общая для всех этих клеток особенность A+B не становится различимой от эффекта целевого гена только потому, что клеток больше.','Adding cells helps characterize the response distribution for A+B. The mean is recomputed from visible points. The number of distinct pairs remains one: a feature shared by all A+B cells does not become distinguishable from a target-gene effect simply because more cells were observed.'],
  ['Теперь C+D — другая конструкция, применённая к другой группе клеток для того же целевого гена. Согласие направлений ответа поддерживает интерпретацию, связанную с геном, но не доказывает абсолютную специфичность. Отдельные культуры с той же A+B проверяют воспроизводимость эксперимента, а новые последовательности guides — другой аспект обоснованности. Увеличение глубины секвенирования тоже не добавляет независимых guides. При различии ответов сначала учитывают степень подавления целевого гена: разная глубина knockdown сама может менять фенотип. Расхождение не доказывает off-target эффект.','C+D is now a different construct applied to another cell group for the same target gene. Agreement in response direction supports a gene-related interpretation, but does not prove absolute specificity. Separate cultures with A+B test experimental reproducibility; new guide sequences address a different aspect of evidence. Greater sequencing depth does not add independent guides either. When responses differ, account for target-gene knockdown: different repression depth can itself alter the phenotype. Disagreement does not prove an off-target effect.']
 ],qa:[
  ['Много клеток с A+B совсем бесполезны для достоверности?','Полезны: они лучше характеризуют распределение и средний ответ этой интервенции при корректной статистической модели. Но сами по себе не отделяют эффект целевого гена от эффекта именно данной конструкции.','Are many A+B cells useless for reliability?','They are useful: they better characterize the response distribution and mean under an appropriate statistical model. They do not by themselves separate the target-gene effect from effects specific to this construct.'],
  ['Совпадение A+B и C+D доказывает отсутствие побочных эффектов?','Нет. Это дополнительное подтверждение, но возможны общие эффекты промоторного контекста и другие ограничения. Проверки механизма, специфичности и биологические реплики дополняют друг друга.','Does agreement between A+B and C+D prove there are no off-target effects?','No. It adds support, but shared promoter-context effects and other limitations remain possible. Mechanistic, specificity and biological-replicate checks are complementary.']
 ],sources:[H.sources.cell,H.sources.elife],
 build(ctx,v){
  const s={count:20,pairs:0};let motion,slider;
  const buttons=[
   H.button(ctx,v.svg,'evidence-one-pair',80,151,430,48,'Одна пара A+B','One pair A+B',()=>motion.driver.set({pairs:0}),C.blue),
   H.button(ctx,v.svg,'evidence-two-pairs',530,151,670,48,'Добавить другую пару C+D','Add a different pair C+D',()=>motion.driver.to({pairs:1},{duration:800}),C.purple)
  ];
  H.text(ctx,v.svg,80,214,1120,42,'Придуманные наблюдения · один и тот же целевой ген','Invented observations · the same target gene',25,C.grey);
  const graphX=505,graphW=610;
  H.text(ctx,v.svg,500,254,640,31,'Ответ относительно контроля, усл. ед.','Response vs control, arbitrary units',22);
  [0,50,100].forEach(n=>H.text(ctx,v.svg,graphX+graphW*n/100-35,285,70,30,String(n),String(n),21,C.grey));
  const rows=[],extra=F.group(v.svg);
  [0,1].forEach(k=>{
   const parent=k?extra:v.svg,y=k?445:345,color=k?C.purple:C.blue;
   PD.cassette(parent,{x:105,y,width:245,guides:k?['C','D']:['A','B'],colors:k?[C.purple,C.gold]:[C.blue,C.teal]});
   const nText=H.text(ctx,parent,95,y+30,260,31,'n = 20','n = 20',23,color);
   F.line(parent,graphX,y,graphX+graphW,y,C.grey,1);
   const dots=OBS.map((row,i)=>F.dot(parent,graphX+graphW*row[k]/100,y+(((i*17)%13)-6)*3.1,3.1,color));
   const meanLine=F.line(parent,0,y-25,0,y+25,C.gold,3);
   const meanLabel=H.text(ctx,parent,915,y+30,230,31,'x̄ = 0','x̄ = 0',23,C.gold);
   rows.push({dots,nText,meanLine,meanLabel,y});
  });
  const absent=H.text(ctx,v.svg,480,412,700,76,'Для этого гена пока проверена только A+B.','Only A+B has been tested for this gene so far.',25,C.grey);
  H.text(ctx,v.svg,585,532,595,68,'Больше клеток с A+B ≠ новая пара направляющих.','More cells with A+B ≠ a new guide pair.',23,C.grey);
  slider=T.control(v.root,H.tr('Клеток на конструкцию','Cells per construct'),20,200,20,1,n=>motion.driver.set({count:n}),80,528,440);slider.el.style.fontSize='21px';
  const captions=[
   ['Одна строка — одна конструкция. Точки — разные клетки.','One row is one construct. Points are different cells.'],
   ['Клеток больше, но все они всё ещё проверяют только A+B.','There are more cells, but they still test A+B only.'],
   ['Другая пара добавляет проверку новыми направляющими, а не просто новые клетки.','A different pair adds evidence from new guides, beyond adding cells.']
  ];
  function paint(){
   const n=Math.max(20,Math.min(200,Math.round(s.count)));
   rows.forEach((row,k)=>{let sum=0;row.dots.forEach((dot,i)=>{F.opacity(dot,i<n?.55:0);if(i<n)sum+=OBS[i][k];});const mean=sum/n;row.nText.setText('n = '+n);row.meanLabel.setText('x̄ = '+mean.toFixed(1));const x=graphX+graphW*mean/100;F.seg(row.meanLine,x,row.y-25,x,row.y+25);});
   // Separate fade intervals keep the placeholder clear of the incoming observations.
   F.opacity(absent.el,1-F.phase(s.pairs,0,.35));F.opacity(extra,F.phase(s.pairs,.45,1));
   buttons[0].setPressed(s.pairs<.5);buttons[1].setPressed(s.pairs>=.5);slider.input.value=String(n);slider.output.textContent=String(n);
   v.caption(H.tr(...captions[s.pairs>=.5?2:n>20?1:0]));
   Object.assign(v.root.dataset,{cellsPerConstruct:String(n),independentPairs:s.pairs>=1?'2':'1',synthetic:'true',pairReveal:String(s.pairs)});
  }
  motion=H.motion(ctx,v,s,paint,captions);motion.step({count:200},1,1900);motion.step({pairs:1},2,1400);
 }
});
})();
