(function(){
'use strict';
H.register({id:'crispri-vs-knockout',title:'Подавить транскрипцию или изменить ДНК?',titleEn:'Repress transcription or alter DNA?',chapter:'Два механизма',chapterEn:'Two mechanisms',sources:[H.sources.gilbert,H.sources.elife],notes:[
 ['Сравниваются два разных способа вмешательства в один условный ген. Слева — CRISPRi с dCas9–KRAB у промотора; справа — обычный knockout с активной нуклеазой Cas9, направленной в кодирующую область. Single-guide и dual-guide описывают организацию направляющих, а не эту разницу между эффектами Cas9.','Two interventions are compared for one illustrative gene. Left: CRISPRi with dCas9–KRAB near the promoter. Right: conventional knockout using active Cas9 targeted to a coding region. Single-guide and dual-guide describe guide organization, not this difference in Cas9 action.'],
 ['CRISPRi не требует разреза целевой ДНК: уменьшается транскрипция. Активный Cas9 разрезает ДНК; последующая репарация может внести вставки или делеции. Мутация возникает при репарации, а не потому, что Cas9 сам переписывает последовательность.','CRISPRi does not require cleavage of target DNA: transcription decreases. Active Cas9 cuts DNA, and subsequent repair may introduce insertions or deletions. The mutation arises during repair; Cas9 does not itself rewrite the sequence.'],
 ['Для CRISPRi типичен knockdown — снижение экспрессии, часто неполное. Для knockout цель — потеря функции, но не каждая отредактированная клетка её достигает: возможны функциональные аллели. Уровень мРНК после knockout не обязан сильно снижаться. Приведённые цепочки букв условны и не являются последовательностью TP53.','CRISPRi typically produces knockdown: reduced expression, often incomplete. Knockout aims for loss of function, but not every edited cell achieves it: functional alleles may remain. mRNA need not decrease substantially after knockout. The letters shown are illustrative, not a TP53 sequence.']
],qa:[
 ['Dual-guide обязательно означает два разреза ДНК?','Нет. В CRISPRi используется dCas9, который не режет ДНК. Две guides могут рекрутировать два репрессорных комплекса.','Does dual-guide necessarily mean two DNA cuts?','No. CRISPRi uses dCas9, which does not cleave DNA. Two guides can recruit two repression complexes.'],
 ['Если мРНК не уменьшилась, knockout не сработал?','Такой вывод сделать нельзя. Мутация может нарушить функцию белка без сильного изменения количества мРНК. Нужна проверка, соответствующая предполагаемому механизму.','If mRNA did not decrease, did knockout fail?','That does not follow. A mutation may disrupt protein function without greatly changing mRNA abundance. Validation must match the proposed mechanism.']
],build(ctx,v){
 const p=v.svg,state={act:0,repair:0};
 F.line(p,640,171,640,590,C.dim,1.5);
 H.text(ctx,p,90,163,500,43,'CRISPRi · dCas9–KRAB','CRISPRi · dCas9–KRAB',30,C.blue);
 H.text(ctx,p,690,163,500,43,'Knockout · активный Cas9','Knockout · active Cas9',30,C.red);
 H.text(ctx,p,90,217,500,35,'Мишень: около промотора','Target: near a promoter',23,C.grey);
 H.text(ctx,p,690,217,500,35,'Мишень: кодирующая область','Target: a coding region',23,C.grey);
 const dnaL=B.dna(p,{x:340,y:357,width:470,amplitude:8,color:C.grey,color2:C.grey});
 const l=H.complex(p,255,357,C.blue,.9);
 const leftSeq=H.text(ctx,p,90,444,500,40,'… A C G T A C …','… A C G T A C …',30,C.white);
 const dl=B.dna(p,{x:810,y:357,width:170,amplitude:8,color:C.grey,color2:C.grey}),dr=B.dna(p,{x:1030,y:357,width:230,amplitude:8,color:C.grey,color2:C.grey});
 const joinTop=F.line(p,895,354,915,354,C.grey,2),joinBottom=F.line(p,895,362,915,362,C.grey,2);
 const cas=B.cas9(p,{x:900,y:357,scale:.9,color:C.red});B.guide(cas.g,{x:-12,y:-10,scale:.67,spacerColor:C.red,scaffoldColor:C.red});
 const cut=F.group(p);F.line(cut,901,331,901,347,C.red,3);F.line(cut,909,369,909,385,C.red,3);
 const rightSeq=H.text(ctx,p,690,444,500,40,'… A C G T A C …','… A C G T A C …',30,C.white);
 const resultL=H.text(ctx,p,100,510,475,70,'Последовательность сохранена','Sequence preserved',26,C.blue);
 const resultR=H.text(ctx,p,700,505,475,82,'Репарация может изменить последовательность','Repair can alter the sequence',26,C.red);
 const caps=[
 ['Это разные механизмы. Число guides — отдельный выбор дизайна.','These are different mechanisms. Guide number is a separate design choice.'],
 ['dCas9–KRAB снижает транскрипцию; активный Cas9 разрезает ДНК.','dCas9–KRAB reduces transcription; active Cas9 cleaves DNA.'],
 ['Knockdown измеряют по снижению экспрессии; knockout проверяют на потерю функции.','Knockdown reduces expression; knockout must be assessed for loss of function.']
 ];
 H.tr('… A C — — A C …','… A C — — A C …');H.tr('… A C G T A C …','… A C G T A C …');
 function paint(){
  F.opacity(cut,state.act*(1-state.repair));
  F.opacity(joinTop,1-state.act+state.repair);F.opacity(joinBottom,1-state.act+state.repair);
  F.opacity(resultL.el,state.act);F.opacity(resultR.el,state.repair);
  rightSeq.setText(state.repair>.5?'… A C — — A C …':'… A C G T A C …');
  v.root.dataset.dnaCut=String(state.act);v.root.dataset.repaired=String(state.repair);
 }
 const m=H.motion(ctx,v,state,paint,caps);m.step({act:1},1,1600);m.step({repair:1},2,1800);
}});
})();
