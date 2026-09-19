(function(){
'use strict';
const QUIZ=[
 {tab:['Пара и клетки','Pairs and cells'],question:['1000 клеток получили одну и ту же A+B. Сколько разных пар проверено?','1000 cells received the same A+B. How many distinct pairs were tested?'],options:[['1 пара','1 pair'],['2 пары','2 pairs'],['1000 пар','1000 pairs']],correct:0,reason:['Одна. A и B доставлены вместе; новые клетки повторяют эту же совместную интервенцию.','One. A and B were delivered together; additional cells repeat the same joint intervention.']},
 {tab:['Низкий MOI','Low MOI'],question:['λ = 0,1 в модели Пуассона. Какая доля инфицированных получила ровно одно событие доставки?','λ = 0.1 in the Poisson model. What fraction of infected cells had exactly one delivery event?'],options:[['100%','100%'],['≈95,1%','≈95.1%'],['≈9,05%','≈9.05%']],correct:1,reason:['≈95,1%: делим P(1) на P(≥1). Число 9,05% относится ко всем клеткам, включая неинфицированные.','≈95.1%: divide P(1) by P(≥1). The value 9.05% uses all cells, including uninfected cells.']},
 {tab:['Источник Arc','The Arc source'],question:['Какое утверждение непосредственно подтверждает описание Arc VCC 2025?','Which statement is directly supported by the Arc VCC 2025 description?'],options:[['Ровно одна пара на каждый ген','Exactly one pair for every gene'],['Две sgRNA одного гена в векторе','Two sgRNAs for one gene per vector'],['Каждая клетка получила только одну sgRNA','Every cell received only one sgRNA']],correct:1,reason:['Подтверждены две sgRNA в векторе. Число разных пар на каждый ген блог не уточняет; нужны guide metadata.','The source confirms two sgRNAs per vector. It does not specify distinct pairs per gene; guide metadata are needed.']}
];
H.register({
 id:'crispri-check',title:'Проверим единицу вмешательства и силу вывода',titleEn:'Check the intervention unit and the conclusion',chapter:'Самопроверка',chapterEn:'Self-check',
 notes:[
  ['Выберите ответ. В первом вопросе важно не перепутать количество клеток с количеством разных guide-пар. Конструкция A+B — одна совместная интервенция. Отдельные клетки полезны для оценки её распределения ответов, но не разделяют эффекты A и B.','Choose an answer. The first question separates cell count from the number of distinct guide pairs. A+B is one joint intervention. Individual cells help estimate its response distribution but do not separate the effects of A and B.'],
  ['Во втором вопросе знаменатель — только инфицированные клетки. При λ=0,1 P(1)=0,1 exp(−0,1)≈0,09048 и P(≥1)=1−exp(−0,1)≈0,09516. Отношение около 0,9508. Эти значения относятся к идеализированной модели, не к измеренному MOI какого-либо исследования.','The second question uses infected cells only as the denominator. At λ=0.1, P(1)=0.1 exp(−0.1)≈0.09048 and P(≥1)=1−exp(−0.1)≈0.09516. Their ratio is about 0.9508. These values belong to the idealized model, not the measured MOI of a particular study.'],
  ['В третьем вопросе отделяем установленный факт от недоказанного уточнения. Arc описывает две sgRNA, направленные на один ген, в одном векторе. Одна конструкция на клетку при low MOI — замысел доставки; это не доказательство одной уникальной пары на ген во всей библиотеке и не утверждение об одной sgRNA в клетке.','The third question separates an established fact from an unsupported refinement. Arc describes two sgRNAs for the same gene in one vector. One construct per cell under low MOI is a delivery design aim; it does not establish one unique pair per gene across the whole library or one sgRNA per cell.']
 ],qa:[
  ['Что нужно сохранить при чтении нового Perturb-seq датасета?','Проверьте: последовательности guides и их группировку в конструкции; сколько конструкций таргетирует ген; как определялись perturbation labels; клеточные и экспериментальные реплики. Эти сведения нельзя восстановить только по слову dual-guide.','What should I check in a new Perturb-seq dataset?','Check guide sequences and their grouping into constructs, constructs per target gene, how perturbation labels were assigned, and cell-level and experimental replication. These facts cannot be inferred from the term dual-guide alone.']
 ],sources:[H.sources.cell,H.sources.elife,H.sources.arc,H.sources.lenti],
 build(ctx,v){
  const s={question:0,selection:-1,reveal:0};let motion;
  const tabButtons=QUIZ.map((q,i)=>H.button(ctx,v.svg,'quiz-tab-'+i,80+i*380,151,360,48,q.tab[0],q.tab[1],()=>motion.driver.set({question:i,selection:-1,reveal:0}),[C.blue,C.teal,C.purple][i]));
  const layers=[],choices=[],feedbacks=[];
  QUIZ.forEach((q,i)=>{
   const layer=F.group(v.svg);layers.push(layer);
   H.text(ctx,layer,85,212,1110,82,q.question[0],q.question[1],27);
   if(i===0){
    PD.cassette(layer,{x:275,y:354,width:240,guides:['A','B'],colors:[C.blue,C.teal]});
    H.text(ctx,layer,570,310,390,57,'× 1000 клеток','× 1000 cells',31,C.gold);
   }else if(i===1){
    H.rect(layer,355,309,570,60,C.teal,.05,10);
    H.text(ctx,layer,367,316,546,45,'P(1 | ≥1) = P(1) / P(≥1)','P(1 | ≥1) = P(1) / P(≥1)',28,C.teal);
   }else{
    PD.cassette(layer,{x:255,y:354,width:270,guides:['A','B'],colors:[C.blue,C.teal]});
    H.text(ctx,layer,600,308,390,58,'Arc · H1 ESC · 2025','Arc · H1 ESC · 2025',29,C.teal);
   }
   choices[i]=q.options.map((a,j)=>H.button(ctx,layer,'quiz-'+i+'-answer-'+j,80+j*380,391,360,72,a[0],a[1],()=>{
    motion.driver.set({question:i,selection:j,reveal:0});motion.driver.to({reveal:1},{duration:500});
   },C.blue));
   const feedback=F.group(layer);feedbacks.push(feedback);H.rect(feedback,90,489,1100,111,C.gold,.04,10);
   H.text(ctx,feedback,110,507,1060,75,q.reason[0],q.reason[1],24);
  });
  const prompt=H.text(ctx,v.svg,110,507,1060,75,'Выберите ответ — затем прочитайте объяснение.','Choose an answer, then read the explanation.',25,C.grey);
  const verdict=H.text(ctx,v.svg,1000,309,190,68,'','',22,C.gold);
  const captions=[
   ['Клетки, guides и конструкции — разные единицы счёта.','Cells, guides and constructs are different counting units.'],
   ['Сначала определяем знаменатель, затем читаем процент.','Identify the denominator before interpreting a percentage.'],
   ['Формулировка вывода должна быть не сильнее сведений об эксперименте.','The conclusion must stay within what the experimental description establishes.']
  ];
  function paint(){
   const i=Math.max(0,Math.min(2,Math.round(s.question))),selected=Math.round(s.selection);
   layers.forEach((g,k)=>{g.style.display=k===i?'':'none';});tabButtons.forEach((b,k)=>b.setPressed(k===i));
   choices.forEach((row,k)=>row.forEach((b,j)=>b.setPressed(k===i&&j===selected)));
   feedbacks.forEach((g,k)=>F.opacity(g,k===i&&selected>=0?s.reveal:0));
   F.opacity(prompt.el,selected>=0?0:1);F.opacity(verdict.el,selected>=0?s.reveal:0);
   verdict.setText(selected===QUIZ[i].correct?H.tr('Верно','Correct'):H.tr('Проверьте вывод','Check the reasoning'));
   v.caption(H.tr(...captions[i]));Object.assign(v.root.dataset,{quizQuestion:String(i),quizSelected:String(selected),quizCorrect:String(selected===QUIZ[i].correct),feedbackReveal:String(s.reveal)});
  }
  motion=H.motion(ctx,v,s,paint,captions);
  ctx.step(()=>{motion.driver.set({question:1,selection:-1,reveal:0});});
  ctx.step(()=>{motion.driver.set({question:2,selection:-1,reveal:0});});
 }
});
})();
