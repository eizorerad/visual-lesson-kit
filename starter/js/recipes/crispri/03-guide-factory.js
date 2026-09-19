(function(){
'use strict';
H.register({
 id:'guide-factory',
 title:'Одна инструкция — много молекул РНК',titleEn:'One template, many RNA molecules',
 chapter:'Транскрипция и сборка',chapterEn:'Transcription and assembly',
 sources:[H.sources.elife,H.sources.gilbert],
 notes:[
  ['Встроенная ДНК-конструкция сохраняет инструкции A и B. В клеточной линии этого примера уже экспрессируется слитый белок dCas9–KRAB. Справа показаны отдельные заранее существующие белковые молекулы. Их число и расстояния — иллюстрация, не измерение.', 'The integrated DNA construct retains instructions A and B. In this example, the cell line already expresses the dCas9–KRAB fusion protein. The separate protein molecules shown on the right preexist guide binding. Their number and spacing are illustrative, not measurements.'],
  ['Клеточная транскрипционная система синтезирует отдельные РНК по двум инструкциям в ДНК. Новые sgRNA A и B отделяются от шаблона. ДНК не расходуется при каждом акте транскрипции; рисунок упрощает детали промоторов и созревания РНК.', 'Cellular transcription machinery synthesizes separate RNAs from the two instructions in DNA. Newly made sgRNAs A and B leave the template. DNA is not consumed by each transcription event; promoter and RNA-maturation details are simplified.'],
  ['Повторные акты транскрипции создают много копий A и много копий B. Каждая нарисованная РНК — отдельная молекула. Это не самокопирование sgRNA. Число значков выбрано для наглядности и не задаёт биологическую концентрацию, отношение A:B или скорость синтеза.', 'Repeated transcription produces many copies of A and many copies of B. Each drawn RNA is a separate molecule. This is not sgRNA self-replication. The icon count is chosen for clarity and specifies neither concentration, A:B ratio, nor synthesis rate.'],
  ['Каждая sgRNA связывается со своей молекулой dCas9–KRAB. Показанные белки не образовались из sgRNA: белок и РНК — разные компоненты, существовавшие до сборки комплекса. В одном комплексе находится одна направляющая; A и B не делят одну молекулу dCas9.', 'Each sgRNA binds its own dCas9–KRAB molecule. The displayed proteins did not arise from sgRNA: protein and RNA are distinct components that existed before assembly. One complex contains one guide; A and B do not share one dCas9 molecule.']
 ],
 qa:[
  ['Откуда уже имеющийся dCas9–KRAB?', 'На предыдущем этапе клетки специально подготовили: внесли отдельный ген dCas9–KRAB. По нему образуется мРНК, а рибосома синтезирует белок. Конструкция A+B производит только направляющие РНК.', 'Where did the preexisting dCas9–KRAB come from?', 'The cells were prepared beforehand by introducing a separate dCas9–KRAB gene. This gene produces mRNA, which a ribosome translates into protein. The A+B construct produces guide RNAs only.'],
  ['Почему из одной конструкции получается много sgRNA?', 'Потому что клетка многократно транскрибирует один и тот же ДНК-шаблон. Направляющая РНК не копирует саму себя.', 'Why can one construct produce many sgRNAs?', 'Because the cell repeatedly transcribes the same DNA template. A guide RNA does not copy itself.'],
  ['A и B садятся на один dCas9–KRAB?', 'Нет. Каждая направляющая связывается с отдельной молекулой слитого белка.', 'Do A and B bind one dCas9–KRAB molecule?', 'No. Each guide binds a separate fusion-protein molecule.']
 ],
 build(ctx,v){
  const state={first:0,repeated:0,binding:0};
  H.text(ctx,v.svg,65,157,280,76,'ДНК-шаблон\nостаётся','DNA template\npersists',25,C.teal);
  H.text(ctx,v.svg,390,157,308,76,'Новые sgRNA\nA и B','New sgRNAs\nA and B',25,C.white);
  H.text(ctx,v.svg,750,157,465,76,'dCas9–KRAB\nуже есть в клетке','dCas9–KRAB\nalready present in the cell',25,C.purple);
  const template=PD.cassette(v.svg,{x:85,y:352,width:250,guides:['A','B'],colors:[C.blue,C.teal]});
  template.g.dataset.molecule='persistent-dna-template';
  H.text(ctx,v.svg,65,398,280,76,'Повторная\nтранскрипция','Repeated\ntranscription',25,C.teal);
  H.text(ctx,v.svg,66,523,278,72,'Число значков\nусловно','Icon count\nis illustrative',21,C.grey);
  const pathArrow=F.arrow(v.svg,C.teal,2);pathArrow.set(353,352,397,352);
  const guides=[],proteinGroups=[];
  const rows=[290,410,530];
  rows.forEach((y,row)=>[0,1].forEach(col=>{
   const px=col?1090:824,color=col?C.teal:C.blue,id=col?'B':'A';
   const protein=F.group(v.svg);F.at(protein,px,y);
   B.cas9(protein,{scale:.74,color:C.grey});
   B.protein(protein,{kind:'krab',x:53,y:-37,scale:.42,color:C.purple});
   F.line(protein,35.52,-23.68,43,-31,C.purple,1.5);
   protein.dataset.molecule='protein-'+id+'-'+row;proteinGroups.push(protein);
   const wrapper=F.group(v.svg),guide=B.guide(wrapper,{scale:.54,spacerColor:color,scaffoldColor:color,joined:1});
   const label=F.group(wrapper);H.text(ctx,label,-73,45,146,30,'sgRNA '+id,'sgRNA '+id,21,color);
   wrapper.dataset.molecule='rna-'+id+'-'+row;
   guides.push({wrapper,guide,label,row,col,id,sourceX:col?275:150,freeX:col?640:480,proteinX:px-17.76,y});
  }));
  // Complete RU/EN strings are registered before any dynamic caption update.
  const captions=[
   ['В клетке есть ДНК-инструкции и отдельные молекулы белка dCas9–KRAB.','The cell contains DNA instructions and separate dCas9–KRAB protein molecules.'],
   ['Транскрипция создаёт новые sgRNA A и B; ДНК-шаблон остаётся.','Transcription makes new sgRNAs A and B; the DNA template remains.'],
   ['Повторная транскрипция даёт много копий. sgRNA не копирует себя.','Repeated transcription makes many copies. sgRNA does not copy itself.'],
   ['Каждая РНК связывается с отдельным белком: одна sgRNA на комплекс.','Each RNA binds a separate protein: one sgRNA per complex.']
  ];
  function paint(){
   guides.forEach(a=>{
    const made=a.row===0?state.first:F.phase(state.repeated,a.row===1?0:.3,a.row===1?.72:1);
    const progress=F.phase(made,0,1),released=F.phase(made,.72,1);
    const x=F.lerp(F.lerp(a.sourceX,a.freeX,progress),a.proteinX,state.binding);
    const y=F.lerp(F.lerp(352,a.y,progress),a.y+1.48,state.binding);
    F.at(a.wrapper,x,y);F.opacity(a.wrapper,F.phase(made,0,.2));
    F.opacity(a.label,released);a.guide.set({bound:state.binding});
   });
   F.opacity(pathArrow.g,.35+.65*Math.max(state.first,state.repeated));
   v.root.dataset.phase=state.binding>.99?'bound':state.repeated>.99?'many-copies':state.first>.99?'first-copies':'template';
  }
  const m=H.motion(ctx,v,state,paint,captions);
  m.step({first:1},1,1900);m.step({repeated:1},2,2600);m.step({binding:1},3,2300);
 }
});
})();
