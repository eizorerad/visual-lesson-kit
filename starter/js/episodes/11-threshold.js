(function(){
'use strict';
// Six invented cases. Scores are ranking numbers, not calibrated probabilities.
const DATA=[{id:'A',score:.9,positive:true},{id:'B',score:.8,positive:false},{id:'C',score:.6,positive:true},{id:'D',score:.6,positive:false},{id:'E',score:.3,positive:true},{id:'F',score:.1,positive:false}];
D.deck.register({id:'threshold-ranking',chapter:'Порог и ошибки',title:'Что меняется вместе с порогом?',
notes:[
 F.note('Перед нами шесть придуманных случаев с известным истинным классом. A, C и E — положительные, B, D и F — отрицательные. Буква сохраняет идентичность случая; горизонтальная координата означает score на фиксированной шкале от 0 до 1. Это число для ранжирования, а не обязательно вероятность. Правило выбора: score не меньше порога. При начальном пороге 0,95 никто не выбран. Precision для пустой выборки не определена; recall равна нулю, потому что ни один из трёх положительных случаев ещё не найден. Ползунок доступен сразу.'),
 F.note('Порог опускается до 0,8. В выборку входят A со score 0,9 и B со score 0,8: равенство порогу включено в правило. Выбрано два случая, один из них действительно положительный. Precision равна 1/2; recall равна 1/3, поскольку всего положительных три. Эти два отношения отвечают на разные вопросы: сколько верных среди выбранных и сколько истинных положительных мы нашли. Точка справа вычисляется из тех же целочисленных счётчиков. Во время движения порога числа меняются только в моменты пересечения наблюдений; дробных случаев не возникает.'),
 F.note('При пороге 0,6 случаи C и D входят одновременно. Их score одинаков, поэтому порядок букв не должен искусственно менять результат. Теперь выбрано четыре случая: два истинно положительных и два ложных срабатывания. Precision остаётся 2/4 = 0,5, а recall растёт до 2/3. PR-траектория состоит из горизонтальных и вертикальных участков; диагональная интерполяция не используется. Снижение порога не обязано повышать precision: следующий случай может оказаться как положительным, так и отрицательным. Сами score и истинные классы не меняются.'),
 F.note('Сначала порог проходит все оставшиеся score, затем проявляются прямоугольники площади. Высота каждого прямоугольника равна precision после очередной группы одинаковых score, а ширина — приросту recall. В этом учебном наборе average precision равна (1/3)×1 + (1/3)×0,5 + (1/3)×0,6 = 0,70. Отрицательные случаи без прироста recall добавляют нулевую ширину. AP описывает всё ранжирование; это не precision в конечной точке, которая здесь равна 3/6 = 0,5. Название AUPRC бывает связано с другими правилами интегрирования, включая трапеции: данный пример показывает именно дискретную average precision. Все числа синтетические.')
],qa:[
 {q:'Почему C и D входят одновременно?',a:'Оба score равны 0,6. При правиле score ≥ порог порог 0,6 включает оба случая, независимо от их порядка в массиве.',source:'Учебные случаи C и D в DATA; явное правило K.binaryRanking.at.'},
 {q:'AP = 0,70 означает precision 70% при выбранном пороге?',a:'Нет. AP суммирует приросты recall, взвешенные precision после каждой группы score. При выборе всех шести случаев precision равна 3/6 = 0,5, хотя AP этого ранжирования равна 0,70.',source:'Прямой расчёт для шести придуманных случаев; дискретная average precision.'}
],build(ctx){
 const v=F.stage(ctx,'Что меняется вместе с порогом?','Шаблон 11 · выборка → ошибки → PR','Шесть придуманных случаев · score и истинные классы фиксированы');
 const stage=K.viewport(v.svg),ranking=K.binaryRanking({observations:DATA}),state={threshold:.95,pr:0,area:0,phase:0,manual:0};
 F.label(stage,640,184,'Выбираем каждый случай со score ≥ порог',28,C.white);
 F.label(stage,420,232,'Шесть известных случаев',25,C.white);
 const chart=K.thresholdCurve(stage,{ranking,scoreDomain:[0,1],scoreFrame:{x:190,y:275,width:460,height:140},prFrame:{x:840,y:275,width:300,height:240},threshold:.95,radius:8});
 F.label(stage,164,308.6,'класс +',20,C.teal,'end');F.label(stage,164,381.4,'класс −',20,C.red,'end');
 chart.points.forEach((node,i)=>{F.label(node,0,-19,DATA[i].id,20,C.white);F.label(node,0,22,DATA[i].score.toFixed(1),17,C.grey);});
 F.label(stage,420,466,'Score · фиксированная шкала',20,C.grey);
 const counts=F.label(stage,420,495,'',23,C.white),ratios=F.label(stage,420,527,'',20,C.gold);
 const prLabels=F.group(stage);F.label(prLabels,990,232,'Precision · верных / выбранных',21,C.white);F.label(prLabels,990,569,'Recall · найдены / все истинные',20,C.white);
 // Keep the summary clear of Recall and below the clipped chart viewport.
 const areaLabel=F.label(v.svg,990,605,'Average precision = 0,70',24,C.gold);
 const driver=F.driver(state,paint);ctx.onDispose(driver.dispose);
 const slider=T.control(v.root,'Порог',0,1,.95,.01,value=>driver.set({threshold:value,pr:1,area:0,manual:1}),190,550,460);slider.el.style.rowGap='3px';slider.el.style.fontSize='19px';
 function formatted(value){return value===null?'—':value.toFixed(2).replace('.',',');}
 function paint(){
  chart.setThreshold(state.threshold).showPR(state.pr).revealArea(state.area);const q=chart.stats();
  counts.textContent='Выбрано '+q.selected+': верных '+q.TP+' · ложных '+q.FP;
  ratios.textContent='Precision '+formatted(q.precision)+' · Recall '+q.TP+'/3 = '+formatted(q.recall);
  F.opacity(prLabels,state.pr);F.opacity(areaLabel,state.area);
  if(slider){slider.input.value=state.threshold;const approximate=Math.abs(state.threshold*100-Math.round(state.threshold*100))>1e-8;slider.output.textContent=(approximate?'≈ ':'')+state.threshold.toFixed(2).replace('.',',');}
  Object.assign(v.root.dataset,{threshold:String(state.threshold),selected:String(q.selected),tp:String(q.TP),fp:String(q.FP),precision:String(q.precision),recall:String(q.recall),ap:String(+ranking.averagePrecision.toFixed(12))});
  if(state.manual){v.caption(q.selected?'Выбрано '+q.selected+': верных '+q.TP+', ложных '+q.FP+'. Precision '+formatted(q.precision)+'; recall '+q.TP+'/3.':'Никто не выбран: precision не определена; recall = 0/3.');}
  else if(state.area>0){v.caption('Прямоугольники суммируют всё ранжирование: average precision = 0,70.');}
  else if(state.phase>=3){v.caption('Пройдём все score. Затем посчитаем площадь прямоугольников, а не трапеций.');}
  else if(state.phase>=2){v.caption('Одинаковые score входят вместе: при пороге 0,60 в выборку входят C и D.');}
  else if(state.phase>=1){v.caption(q.selected?'Верных среди выбранных: '+q.TP+'/'+q.selected+'. Найдено истинных положительных: '+q.TP+'/3.':'Пока никто не выбран: precision не определена. Двигаем порог к первым случаям.');}
  else v.caption('Правило одно: score ≥ порог. При 0,95 пока не выбран никто.');
 }
 paint();
 ctx.step(()=>{driver.set({phase:1,manual:0,area:0});return driver.to({threshold:.8,pr:1},{duration:2200});});
 ctx.step(()=>{driver.set({phase:2,manual:0,area:0});return driver.to({threshold:.6,pr:1},{duration:1900});});
 ctx.step(async()=>{driver.set({phase:3,manual:0,area:0});const result=await driver.to({threshold:0,pr:1},{duration:1800});if(!result.completed)return result;return driver.to({area:1},{duration:1000});});
 T.evidence(v.root,{title:'Учебные данные и определение AP',url:'',buttonLabel:'Данные и расчёт',html:'<p>Все шесть случаев придуманы: A 0,9 (+), B 0,8 (−), C 0,6 (+), D 0,6 (−), E 0,3 (+), F 0,1 (−). Они не являются результатами статьи или модельного эксперимента.</p><p>Выбор: score ≥ порог. Precision = TP / (TP + FP), когда выбран хотя бы один случай. Recall = TP / 3.</p><p>Для average precision складываем приросты recall, умноженные на precision после соответствующей группы score: 1/3 × 1 + 1/3 × 0,5 + 1/3 × 0,6 = 0,70. Это прямоугольная сумма, не трапецеидальная AUPRC.</p>'});
 return v.root;
}});
})();
