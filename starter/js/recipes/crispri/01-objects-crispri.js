(function(){
'use strict';
H.register({
 id:'objects-crispri',
 title:'Три разных объекта',titleEn:'Three different objects',
 chapter:'От доставки к репрессии',chapterEn:'From delivery to repression',
 sources:[H.sources.lenti,H.sources.gilbert],
 notes:[
  ['Лентивирусная частица — носитель для доставки. В ней находятся две копии РНК-генома вектора. Эти длинные РНК несут информацию конструкции; они не являются двумя зрелыми sgRNA. Размеры всех объектов здесь условны.', 'A lentiviral particle is a delivery vehicle. It contains two copies of the vector RNA genome. These long RNAs carry the construct information; they are not two mature sgRNAs. All object sizes are schematic.'],
  ['ДНК-конструкция — инструкция. В этом примере она кодирует два разных направляющих РНК, A и B. После доставки образуется ДНК-копия, которая может встроиться в геном. Наличие двух инструкций ещё не означает наличие двух готовых молекул РНК.', 'The DNA construct is an instruction template. In this example it encodes two distinct guides, A and B. After delivery, a DNA copy is formed and can integrate into the genome. Two instructions do not mean that two finished RNA molecules are already present.'],
  ['Работающий комплекс содержит одну sgRNA и одну молекулу слитого белка dCas9–KRAB. Направляющая задаёт последовательностную специфичность, dCas9 связывает ДНК, а KRAB привлекает клеточные факторы репрессии. Для A и B нужны отдельные комплексы.', 'A working complex contains one sgRNA and one dCas9–KRAB fusion protein. The guide supplies sequence specificity, dCas9 binds DNA, and KRAB recruits cellular repression factors. A and B require separate complexes.']
 ],
 qa:[
  ['Две РНК в вирусной частице — это sgRNA A и B?', 'Нет. Это две копии РНК-генома вектора. sgRNA A и B будут синтезированы с ДНК-шаблона после доставки.', 'Are the two RNAs in the viral particle sgRNAs A and B?', 'No. They are two copies of the vector RNA genome. sgRNAs A and B will be transcribed from a DNA template after delivery.'],
  ['Сколько направляющих находится в одном комплексе dCas9?', 'Одна sgRNA. Разные направляющие A и B связываются с разными молекулами dCas9–KRAB.', 'How many guides are in one dCas9 complex?', 'One sgRNA. Different guides A and B bind separate dCas9–KRAB molecules.']
 ],
 build(ctx,v){
  const state={focus:0};
  const xs=[60,460,860],frames=[],buttons=[];
  const descriptions=[
   ['Носитель\nРНК-геном вектора внутри','Delivery vehicle\nVector RNA genome inside'],
   ['Шаблон с инструкциями\nдля sgRNA A и B','Template with instructions\nfor sgRNAs A and B'],
   ['Одна sgRNA +\nодин белок dCas9–KRAB','One sgRNA +\none dCas9–KRAB protein']
  ];
  const names=[['Вирусная частица','Viral particle'],['ДНК-конструкция','DNA construct'],['Рабочий комплекс','Working complex']];
  xs.forEach((x,i)=>{
   frames.push(H.rect(v.svg,x,167,360,365,i===0?C.gold:i===1?C.teal:C.blue,.05,18));
   H.text(ctx,v.svg,x+20,190,320,62,...names[i],28);
   H.text(ctx,v.svg,x+20,430,320,78,...descriptions[i],24,C.grey);
  });
  PD.virion(v.svg,{x:240,y:333,scale:1.35,color:C.gold});
  PD.cassette(v.svg,{x:520,y:337,width:240,guides:['A','B'],colors:[C.blue,C.teal]});
  H.complex(v.svg,1038,345,C.blue,1.15);
  const captions=[
   ['Частица доставляет генетическую информацию в клетку.','The particle delivers genetic information into the cell.'],
   ['ДНК хранит инструкции; клетка ещё должна синтезировать направляющие РНК.','DNA stores the instructions; the cell must still transcribe the guide RNAs.'],
   ['У каждой направляющей — свой комплекс с dCas9–KRAB.','Each guide forms its own complex with dCas9–KRAB.']
  ];
  let controller;
  xs.forEach((x,i)=>buttons.push(H.button(ctx,v.svg,'object-'+i,x+35,550,290,48,...names[i],()=>{
   // Selecting an identity is navigation to its narrated state, so notes,
   // progress, caption and emphasis continue to describe the same object.
   D.deck.show(ctx.index,i);
  },i===0?C.gold:i===1?C.teal:C.blue)));
  function paint(){
   const active=Math.round(state.focus);
   frames.forEach((r,i)=>{r.setAttribute('fill-opacity',i===active?.105:.025);r.setAttribute('stroke-opacity',i===active?.95:.3);r.setAttribute('stroke-width',i===active?2.2:1.2);});
   buttons.forEach((b,i)=>b.setPressed(i===active));
   v.root.dataset.focus=String(active);
  }
  controller=H.motion(ctx,v,state,paint,captions);
  controller.step({focus:1},1,650);controller.step({focus:2},2,650);
 }
});
})();
