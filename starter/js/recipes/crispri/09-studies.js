(function(){
'use strict';
H.register({
 id:'crispri-studies',title:'Что действительно известно о двух исследованиях?',titleEn:'What do the two studies actually establish?',chapter:'Реальные дизайны',chapterEn:'Real study designs',
 source:'Replogle et al., Cell 2022 · Arc VCC 2025',sourceEn:'Replogle et al., Cell 2022 · Arc VCC 2025',
 notes:[
  ['Replogle et al. использовали две разные sgRNA одного гена в одной конструкции. Основные эксперименты: K562 day 8 (геномный), K562 day 6 и RPE1 day 7 (essential-scale). Для K562 day 8 после фильтрации среднее составило 183 клетки на perturbation, медиана — 171. Поддерживаемое покрытие культуры 1000 клеток/элемент не равно числу прочитанных клеток. Arc VCC 2025 использует H1 ESC, dual-guide CRISPRi, 300 target-генов и примерно 1000 клеток на perturbation. Эти числа имеют разные определения и не являются прямым рейтингом качества.','Replogle et al. used two distinct sgRNAs for the same gene in one construct. Major experiments were K562 day 8 (genome scale), K562 day 6, and RPE1 day 7 (essential scale). After filtering, K562 day 8 had a mean of 183 cells per perturbation and a median of 171. Maintaining culture coverage of 1000 cells per element is different from profiling that many cells. Arc VCC 2025 uses H1 ESCs, dual-guide CRISPRi, 300 targets, and approximately 1000 cells per perturbation. These numbers have different definitions and are not a direct ranking of quality.'],
  ['В ограничениях Cell 2022 говорится об одной конструкции для большинства, а не всех генов. Пример исключения — несколько независимых пар для TMEM242 в RPE1 (Fig. S8G); были и отдельные проверки рибосомных кандидатов независимыми sgRNA. Альтернативные TSS не следует автоматически считать репликами одной интервенции. Блог Arc подтверждает две sgRNA в векторе и low MOI, но не устанавливает число разных пар на каждый ген. Поэтому заключение «все примерно 1000 клеток обязательно получили одинаковую пару» из блога не следует. Для этого нужны метаданные библиотеки.','Cell 2022 states that most, not all, genes were targeted by one construct. Exceptions include multiple independent pairs for TMEM242 in RPE1 (Fig. S8G) and separate ribosome-candidate validation with independent sgRNAs. Alternative TSS targets should not automatically be treated as replicates of one intervention. The Arc blog confirms two sgRNAs per vector and low MOI, but does not specify the number of distinct pairs per gene. Therefore the blog alone does not establish that all approximately 1000 cells necessarily received an identical pair. That requires library metadata.']
 ],qa:[
  ['Можно ли из dual-guide сделать вывод «одна пара на ген»?','Нет. Dual-guide описывает число guides в отдельной конструкции. Replogle/Bonnar также предоставляют подбиблиотеки с парами 1+2, 3+4 и 5+6.','Does dual-guide imply one pair per gene?','No. Dual-guide describes guides per construct. Replogle/Bonnar also provide sublibraries with guide pairs 1+2, 3+4 and 5+6.'],
  ['Arc использовал дизайн Replogle/Bonnar?','Описание Arc указывает использование дизайна dual-guide, protospacer-последовательностей и стратегии клонирования Replogle/Bonnar в пилоте; финальная библиотека клонирована аналогично. Это не заменяет её конкретные guide metadata.','Did Arc use the Replogle/Bonnar design?','Arc describes using the Replogle/Bonnar dual-guide design, protospacer sequences and cloning strategy in the pilot, with similar cloning for the final library. This does not substitute for its specific guide metadata.']
 ],sources:[H.sources.cell,H.sources.elife,H.sources.arc],
 build(ctx,v){
  const s={detail:0};let motion;
  const buttons=[H.button(ctx,v.svg,'studies-facts',80,151,530,48,'Подтверждённые факты','Documented facts',()=>motion.driver.to({detail:0},{duration:900}),C.blue),H.button(ctx,v.svg,'studies-limits',630,151,570,48,'Границы выводов','Limits of the conclusions',()=>motion.driver.to({detail:1},{duration:1100}),C.gold)];
  H.rect(v.svg,80,219,540,383,C.blue,.03,12);H.rect(v.svg,640,219,560,383,C.teal,.03,12);
  H.text(ctx,v.svg,100,232,500,41,'Replogle · Cell 2022','Replogle · Cell 2022',28,C.blue);
  H.text(ctx,v.svg,660,232,520,41,'Arc · VCC 2025','Arc · VCC 2025',28,C.teal);
  H.text(ctx,v.svg,100,277,500,35,'K562 · day 8 (геномный скрин)','K562 · day 8 (genome-scale screen)',22);
  H.text(ctx,v.svg,660,277,520,35,'H1 ESC · 300 целевых генов','H1 ESC · 300 target genes',22);
  PD.cassette(v.svg,{x:200,y:360,width:290,guides:['A','B'],colors:[C.blue,C.teal]});
  PD.cassette(v.svg,{x:775,y:360,width:290,guides:['A','B'],colors:[C.blue,C.teal]});
  H.text(ctx,v.svg,100,383,500,49,'Большинство генов: одна пара','Most genes: one pair',23);
  H.text(ctx,v.svg,660,383,520,49,'Две sgRNA одного гена / вектор','Two sgRNAs for one gene / vector',23);
  const counts=F.group(v.svg);
  H.text(ctx,counts,100,439,500,64,'183','183',43,C.blue);H.text(ctx,counts,660,439,520,64,'~1000','~1000',43,C.teal);
  H.text(ctx,counts,110,507,480,69,'Среднее клеток / perturbation\nпосле фильтрации','Mean cells / perturbation\nafter filtering',22,C.grey);
  H.text(ctx,counts,670,507,500,69,'Клеток / perturbation\nпо описанию Arc','Cells / perturbation\nreported by Arc',22,C.grey);
  const limits=F.group(v.svg);
  PD.cassette(limits,{x:200,y:485,width:290,guides:['C','D'],colors:[C.purple,C.gold]});
  H.text(ctx,limits,105,518,490,69,'Есть исключения:\nTMEM242 в RPE1 — разные пары','Exceptions exist:\nTMEM242 in RPE1 — distinct pairs',22,C.purple);
  H.rect(limits,850,443,140,62,C.gold,.09,10);H.text(ctx,limits,860,446,120,57,'?','?',36,C.gold);
  H.text(ctx,limits,665,520,510,69,'Число разных пар / ген\nв блоге не указано','Distinct pairs / gene\nnot specified in the blog',23,C.gold);
  const captions=[['Одинаковый формат вектора не означает одинаковое устройство всех библиотек.','The same vector format does not imply identical library designs.'],['У Replogle есть исключения; для Arc число пар проверяется по метаданным.','Replogle includes exceptions; the number of Arc pairs requires metadata.']];
  function paint(){
   F.opacity(counts,1-F.phase(s.detail,0,.35));F.opacity(limits,F.phase(s.detail,.55,1));F.at(limits,0,-12*(1-s.detail));
   buttons[0].setPressed(s.detail<.5);buttons[1].setPressed(s.detail>=.5);v.caption(H.tr(...captions[s.detail>=.5?1:0]));
   Object.assign(v.root.dataset,{studyLimits:String(s.detail),arcPairsKnown:'false',replogleSinglePairScope:'most-genes'});
  }
  motion=H.motion(ctx,v,s,paint,captions);motion.step({detail:1},1,1700);
 }
});
})();
