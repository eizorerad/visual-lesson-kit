/* A toy cotranscriptional example: supplied pair sets, no folding predictor. */
(function(){
'use strict';const R=RNA,SEQ='GGGAAACCCAAACCC',EARLY=[[0,8],[1,7],[2,6]],LATE=[[0,14],[1,13],[2,12]];
R.register({id:'rna-cotranscription',title:['РНК может складываться ещё во время синтеза','RNA can fold while it is being synthesized'],chapter:['Фолдинг во времени','Folding through time'],source:['Szyjka et al., 2025 · Sequential probing of RNA folding','https://www.nature.com/articles/s41467-025-60425-w'],states:[
 ['Важна и история: участки РНК становятся доступны по мере синтеза.','History also matters: RNA segments become available as synthesis proceeds.','Здесь показана учебная последовательность GGGAAACCCAAACCC. Это абстрактная схема поэтапной доступности фрагмента: сначала для спаривания доступны позиции 1–9, позднее — 10–15. Защищённая полимеразой часть транскрипта опущена; подпись «к 3′» указывает направление продолжения цепи, а не её физический конец. Новые нуклеотиды добавляются к 3′-концу внутри комплекса полимеразы.','This toy sequence is GGGAAACCCAAACCC. This is an abstract model of progressive segment availability: positions 1–9 can pair first, followed later by positions 10–15. The polymerase-protected transcript segment is omitted; “to 3′” marks the direction of continuation, not the physical chain end. New nucleotides are added at the 3′ end inside the polymerase complex.'],
 ['Уже доступный участок может образовать локальную шпильку.','The available segment can already form a local hairpin.','Заданы пары (1,9), (2,8), (3,7), все G–C. На молекулярной схеме это локальная шпилька с тремя неспаренными основаниями петли. Ранние структуры могут появляться до завершения синтеза всей РНК. <a href="https://academic.oup.com/nar/article/45/16/9716/3964622" target="_blank" rel="noopener">Incarnato et al., 2017</a> исследовали такие процессы с помощью SPET-seq в E. coli.','The supplied pairs (1,9), (2,8), (3,7) are all G–C. This creates a local hairpin with three unpaired loop bases in the diagram. Early structures can form before synthesis is complete. <a href="https://academic.oup.com/nar/article/45/16/9716/3964622" target="_blank" rel="noopener">Incarnato et al., 2017</a> studied these processes using SPET-seq in E. coli.'],
 ['С удлинением цепи появляются новые потенциальные партнёры.','As the chain elongates, new potential pairing partners become available.','По мере синтеза становятся доступны позиции 10–15. Последние три C тоже комплементарны начальным трём G. При этом простая комплементарность ещё не определяет, какие пары будут наиболее устойчивыми. Соседи, петли, среда и путь образования структуры влияют на результат.','As synthesis proceeds, positions 10–15 become available. The final three C bases can also pair with the first three G bases. Complementarity alone does not determine which pair set is most stable. Neighbors, loops, environment and the folding pathway all influence the outcome.'],
 ['Возможна перестройка: старые пары размыкаются, новые — образуются.','Rearrangement is possible: old pairs open and new pairs form.','В учебной альтернативе пары (1,9), (2,8), (3,7) сменяются на (1,15), (2,14), (3,13). Энергии и скорости не вычислялись; мы не утверждаем, что в этой придуманной последовательности такая перестройка предпочтительна или реально произойдёт. Реальную перестройку временной шпильки SRP RNA при транскрипции проверяли, например, методом TECprobe-LM (Szyjka et al., 2025). У РНК могут быть альтернативные состояния и барьеры перехода, поэтому путь имеет значение.','In the toy alternative, pairs (1,9), (2,8), (3,7) are replaced by (1,15), (2,14), (3,13). Energies and rates were not calculated; this invented sequence is not claimed to favor or actually undergo the transition. Rearrangement of a transient SRP RNA hairpin during transcription was tested experimentally using TECprobe-LM (Szyjka et al., 2025). RNA can have alternative states and transition barriers, so the pathway matters.']
],qa:[{q:['Почему конечная последовательность не описывает весь путь фолдинга?','Why does the final sequence not describe the whole folding pathway?'],a:['Во время синтеза спариваться могут уже появившиеся и вышедшие из полимеразы участки. Они могут временно спариваться, а позже перестраиваться, когда становятся доступны дальние партнёры.','Initially, pairing is possible in segments that have already been synthesized and exposed outside the polymerase. They can pair transiently and rearrange later when distant partners become available.']},{q:['Две допустимые схемы означают равную вероятность?','Do two allowed structures have equal probability?'],a:['Нет. На этой схеме нет энергий или вероятностей. Населённости состояний зависят от термодинамики и условий, а скорость обмена — от кинетических барьеров.','No. This diagram contains no energies or probabilities. State populations depend on thermodynamics and conditions, while exchange rates depend on kinetic barriers.']}],build(ctx,v){
 const state={fold:0,length:9,rearrange:0};
 const row=[...SEQ].map((_,i)=>[100+i*46,351]);
 const early=[[190,432],[190,385],[190,338],[192,274],[238,240],[284,274],[286,338],[286,385],[286,432],[347,432],[408,432],[469,432],[530,432],[591,432],[652,432]];
 const late=early.map((_,i)=>{if(i<3)return[315,432-i*47];if(i>11)return[525,338+(i-12)*47];const a=Math.PI*(1-(i-2)/10);return[420+105*Math.cos(a),338-150*Math.sin(a)];});
 const chain=R.chain(v.svg,SEQ,row,EARLY.concat(LATE),18);
 const start=R.box(v.svg,70,400,60,42,'5′','5′',24,C.blue),end=R.box(v.svg,500,400,85,42,'к 3′','to 3′',23,C.blue);
 const info=R.box(v.svg,842,182,354,118,'Доступны позиции\n1–9','Available positions\n1–9',29,C.white);
 const earlyText=R.box(v.svg,842,326,354,106,'Ранние локальные пары','Early local pairs',28,C.gold);
 const lateText=R.box(v.svg,842,454,354,115,'Поздние участки меняют возможности спаривания','Later segments change the pairing options',26,C.teal);
 const track=F.group(v.svg),tick=[];
 R.box(track,83,513,148,37,'Позиции','Positions',22,C.grey);
 for(let i=0;i<15;i++){const q=F.group(track);F.at(q,254+i*34,531);const dot=F.dot(q,0,0,11,C.blue);R.label(q,0,35,String(i+1),15,C.grey,29,25);tick.push(dot);}
 const bracket=F.line(track,0,0,0,0,C.teal,3);
 R.t('Доступны позиции\n1–9','Available positions\n1–9');
 
 for(let n=9;n<=15;n++)R.t('Доступны позиции\n1–'+n,'Available positions\n1–'+n);R.t('Возможная перестройка пар','A possible pair rearrangement');
 function paint(){
  const unfolded=R.mix(row,early,state.fold),coords=R.mix(unfolded,late,F.phase(state.rearrange,.2,.85));
  const progress=EARLY.map(()=>state.fold*(1-F.phase(state.rearrange,0,.25))).concat(LATE.map(()=>F.phase(state.rearrange,.8,1)));
  chain.set(coords,progress);
  chain.nodes.forEach((n,i)=>F.opacity(n,F.phase(state.length,i,i+1)));
  const length=Math.floor(state.length),fraction=state.length-length,visible=coords.slice(0,length);if(fraction>0&&length<coords.length){const a=coords[length-1],b=coords[length];visible.push([F.lerp(a[0],b[0],fraction),F.lerp(a[1],b[1],fraction)]);}
  chain.back.setAttribute('d',visible.map((p,i)=>(i?'L':'M')+p.join(',')).join(' '));
  const last=visible[visible.length-1];start.setBox({x:coords[0][0]-78,y:coords[0][1]-18,width:55,height:40});end.setBox({x:last[0]+27,y:last[1]+25,width:85,height:40});
  tick.forEach((n,i)=>F.opacity(n,F.phase(state.length,i,i+1)>.5?1:.13));F.seg(bracket,243,588,254+(state.length-1)*34+11,588);
  info.setText('Доступны позиции\n1–'+Math.ceil(state.length));earlyText.setText(state.rearrange>.5?'Возможная перестройка пар':'Ранние локальные пары');F.opacity(earlyText.el,state.fold);F.opacity(lateText.el,F.phase(state.length,10,15));
  v.root.dataset.rnaSequence=SEQ;v.root.dataset.rnaAvailableCount=String(Math.ceil(state.length));v.root.dataset.rnaExample='abstract exposed segment; no energy ranking';
 }
 return {state,paint,patches:[{fold:1},{length:15},{rearrange:1}],durations:[2000,2300,2300]};
}});
})();
