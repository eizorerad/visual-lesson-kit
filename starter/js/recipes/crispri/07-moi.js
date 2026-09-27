(function(){
'use strict';
H.register({
 id:'crispri-moi',title:'Низкий MOI уменьшает риск, но не даёт гарантии',titleEn:'Low MOI reduces risk, without a guarantee',chapter:'Доставка',chapterEn:'Delivery',
 source:'Идеализированная модель Пуассона · не измерения Replogle или Arc',sourceEn:'Idealized Poisson model · not Replogle or Arc measurements',
 notes:[
  ['Здесь λ — среднее число успешных событий доставки на клетку в идеализированной модели Пуассона: события независимы, восприимчивость клеток одинакова. P(0)=exp(−λ), P(1)=λ exp(−λ), P(≥2)=1−P(0)−P(1). Это модель, а не оценка фактического MOI в названных исследованиях. Одна доставленная dual-guide конструкция уже содержит две sgRNA.','Here λ is the mean number of successful delivery events per cell in an idealized Poisson model: events are independent and cells equally susceptible. P(0)=exp(−λ), P(1)=λ exp(−λ), and P(≥2)=1−P(0)−P(1). This is a model, not an estimate of actual MOI in the cited studies. One delivered dual-guide construct already contains two sgRNAs.'],
  ['С ростом λ растёт доля клеток с двумя или более событиями доставки. Ползунок меняет ровно одну модельную величину; все столбцы используют одну шкалу 0–100%. Наличие нескольких конструкций усложняет интерпретацию результата как одиночной интервенции.','As λ grows, the fraction of cells with two or more delivery events increases. The slider changes one model parameter; every bar uses the same 0–100% scale. Multiple constructs complicate interpretation as a single intervention.'],
  ['После отбора инфицированных клеток знаменатель меняется: P(1 | ≥1)=P(1)/(1−P(0)). При λ=0,1 это около 95,1%, а вероятность двух или более событий среди инфицированных — около 4,9%. Низкий MOI не означает абсолютной гарантии единственной конструкции. Реальные клетки могут отклоняться от идеализированных предположений.','Selecting infected cells changes the denominator: P(1 | ≥1)=P(1)/(1−P(0)). At λ=0.1 this is about 95.1%; about 4.9% of infected cells have two or more events. Low MOI does not guarantee a single construct. Real cells can depart from these idealized assumptions.']
 ],qa:[
  ['Почему после отбора меняются проценты?','Мы больше не учитываем клетки с нулём событий доставки. Те же события сравниваются с меньшим знаменателем — только инфицированными клетками.','Why do percentages change after selection?','Cells with zero delivery events are excluded. The same events are compared against a smaller denominator: infected cells only.'],
  ['MOI=0,1 означает, что 10% инфицированных имеют две конструкции?','Нет. В данной модели среди инфицированных примерно 95,1% имеют одно событие и 4,9% — два или более. MOI — среднее число событий по всем клеткам.','Does MOI=0.1 mean 10% of infected cells have two constructs?','No. In this model about 95.1% of infected cells have one event and 4.9% have two or more. MOI is the mean event count across all cells.']
 ],sources:[H.sources.lenti,H.sources.arc],
 build(ctx,v){
  const s={moi:.1,conditional:0};let motion,slider;
  const buttons=[
   H.button(ctx,v.svg,'moi-all',80,151,360,48,'Все клетки','All cells',()=>motion.driver.set({conditional:0}),C.blue),
   H.button(ctx,v.svg,'moi-infected',460,151,440,48,'Только инфицированные','Infected cells only',()=>motion.driver.set({conditional:1}),C.teal)
  ];
  H.text(ctx,v.svg,925,155,275,44,'Модель Пуассона','Poisson model',23,C.grey);
  const population=H.text(ctx,v.svg,80,217,1120,47,'Доля среди всех клеток','Fraction of all cells',26);
  const baseY=449,barHeight=132,xs=[285,615,945],colors=[C.grey,C.blue,C.gold];
  [0,.5,1].forEach(p=>{F.line(v.svg,190,baseY-p*barHeight,1190,baseY-p*barHeight,C.grey,p===0?1.5:1,'4 6');H.text(ctx,v.svg,90,baseY-p*barHeight-15,82,30,(100*p)+'%',(100*p)+'%',21,C.grey,'right');});
  const bars=xs.map((x,i)=>H.rect(v.svg,x,baseY,170,0,colors[i],.6,3));
  const numbers=xs.map((x,i)=>H.text(ctx,v.svg,x-30,270,230,34,'0%','0%',25,colors[i]));
  const labels=[['0 событий','0 events'],['1 событие','1 event'],['≥2 событий','≥2 events']];
  labels.forEach((q,i)=>H.text(ctx,v.svg,xs[i]-30,463,230,37,q[0],q[1],25,colors[i]));
  H.text(ctx,v.svg,560,521,620,79,'Число событий доставки ≠ число sgRNA: одна конструкция может содержать A+B.','Delivery events ≠ sgRNA count: one construct can contain A+B.',23,C.grey);
  slider=T.control(v.root,H.tr('MOI λ · событий / клетку','MOI λ · events / cell'),.05,2,.1,.01,val=>motion.driver.set({moi:val}),80,527,420);slider.el.style.fontSize='21px';
  const captions=[
   ['При низком λ многие клетки не получают конструкцию.','At low λ, many cells receive no construct.'],
   ['При высоком λ клетки с несколькими конструкциями встречаются чаще.','At higher λ, cells with multiple constructs become more common.'],
   ['После отбора делим на число инфицированных: риск нескольких конструкций остаётся.','After selection, the denominator is infected cells; multiple constructs remain possible.']
  ];
  function paint(){
   const q=PD.poissonOccupancy(s.moi),conditional=s.conditional>=.5;
   const p=conditional?[0,q.oneGivenPositive,q.multiGivenPositive]:[q.zero,q.one,q.multi];
   bars.forEach((bar,i)=>{const h=p[i]*barHeight;bar.setAttribute('y',baseY-h);bar.setAttribute('height',h);numbers[i].setText((p[i]*100).toFixed(1)+'%');});
   buttons.forEach((b,i)=>b.setPressed(i===(conditional?1:0)));
   population.setText(conditional?H.tr('Доля среди инфицированных · клетки с 0 исключены','Fraction of infected cells · cells with 0 excluded'):H.tr('Доля среди всех клеток','Fraction of all cells'));
   slider.input.value=String(s.moi);slider.output.textContent=s.moi.toFixed(2);
   v.caption(H.tr(...captions[conditional?2:s.moi<.4?0:1]));
   Object.assign(v.root.dataset,{moi:String(s.moi),conditional:String(conditional),pZero:String(p[0]),pOne:String(p[1]),pMulti:String(p[2]),oneGivenPositive:String(q.oneGivenPositive),multiGivenPositive:String(q.multiGivenPositive)});
  }
  motion=H.motion(ctx,v,s,paint,captions);motion.step({moi:1,conditional:0},1,2300);motion.step({moi:.1,conditional:1},2,2100);
 }
});
})();
