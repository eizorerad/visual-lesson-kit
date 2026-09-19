(function(){
'use strict';
H.register({
 id:'delivery',
 title:'От вирусной РНК к встроенной ДНК',titleEn:'From viral RNA to integrated DNA',
 chapter:'Доставка конструкции',chapterEn:'Construct delivery',
 sources:[H.sources.lenti,H.sources.elife],
 notes:[
  ['Показан перенос генетического материала лентивирусным вектором, а не полный цикл размножения вируса. В частице находятся две копии длинной РНК вектора. Контуры клетки и ядра, масштабы и движение условны.', 'This depicts genetic delivery by a lentiviral vector, not a full viral replication cycle. The particle contains two copies of a long vector RNA. Cell and nuclear outlines, scales, and motion are schematic.'],
  ['После входа носителя в клетку его РНК-геном становится доступен для обратной транскрипции. Выходящие нити обозначают тот же доставленный РНК-геном. Они не являются зрелыми направляющими A и B. Молекулярные промежуточные комплексы здесь опущены.', 'After entry into the cell, the vector RNA genome becomes available for reverse transcription. The outgoing strands represent the same delivered RNA genome. They are not mature guides A and B. Molecular intermediate complexes are omitted.'],
  ['Обратная транскрипция создаёт новую ДНК-копию на основе РНК-генома. РНК-шаблон и продукт-ДНК — разные молекулы: на схеме они показаны раздельно. К моменту завершения обратной транскрипции РНК в действительности в основном разрушается; схема сохраняет её как напоминание об источнике.', 'Reverse transcription creates a new DNA copy from the RNA genome. The RNA template and DNA product are distinct molecules and are drawn separately. In reality, most of the RNA is degraded during reverse transcription; the schematic retains it as a reminder of the source.'],
  ['ДНК вектора интегрируется в ДНК клетки. Лентивирусная интеграция имеет собственные предпочтения; её место не выбирается sgRNA к TP53. Направляющая позднее задаёт адрес связывания dCas9–KRAB, а не адрес интеграции конструкции. Этап переноса в ядро сильно упрощён.', 'Vector DNA integrates into cellular DNA. Lentiviral integration has its own preferences; its location is not selected by the TP53 sgRNA. Later, the guide specifies where dCas9–KRAB binds, not where the construct integrates. Nuclear entry is highly simplified.']
 ],
 qa:[
  ['sgRNA к TP53 встраивает конструкцию прямо в TP53?', 'Нет. Место интеграции лентивирусного вектора и место последующего связывания направляемого комплекса — разные адреса.', 'Does a TP53 sgRNA insert the construct into TP53?', 'No. The lentiviral integration site and the later binding site of the guide-directed complex are different addresses.'],
  ['Превращается ли одна и та же молекула РНК в ДНК?', 'Нет. Ферменты синтезируют отдельную ДНК-копию, используя РНК как шаблон.', 'Does the same RNA molecule turn into DNA?', 'No. Enzymes synthesize a separate DNA copy using RNA as a template.']
 ],
 build(ctx,v){
  const state={entry:0,copy:0,integration:0};
  H.rect(v.svg,325,235,890,294,C.grey,.035,42);
  H.rect(v.svg,846,280,340,222,C.purple,.04,40);
  H.text(ctx,v.svg,343,249,200,34,'Клетка','Cell',23,C.grey,'left');
  H.text(ctx,v.svg,895,293,240,35,'Ядро','Nucleus',23,C.purple);
  H.text(ctx,v.svg,70,158,305,70,'1 · Вход и доставка','1 · Entry and delivery',25,C.gold);
  H.text(ctx,v.svg,430,158,345,70,'2 · Обратная транскрипция','2 · Reverse transcription',25,C.teal);
  H.text(ctx,v.svg,867,158,310,70,'3 · Интеграция','3 · Integration',25,C.blue);
  const carrier=PD.virion(v.svg,{x:205,y:357,scale:1.2,color:C.gold});
  const rna=F.group(v.svg);
  // Transfer the exact two genome paths into a motion wrapper. At entry=0
  // they still occupy their original position inside the carrier envelope.
  carrier.genomes.forEach(strand=>rna.append(strand));rna.style.color=C.gold;
  rna.dataset.molecule='delivered-vector-rna';
  const dna=PD.cassette(v.svg,{x:620,y:436,width:175,guides:['A','B'],colors:[C.blue,C.teal]});
  dna.g.dataset.molecule='new-vector-dna';
  B.dna(v.svg,{x:883,y:436,width:52,amplitude:8,color:C.grey,color2:C.grey});
  B.dna(v.svg,{x:1111,y:436,width:52,amplitude:8,color:C.grey,color2:C.grey});
  const gap=F.line(v.svg,909,436,1085,436,C.grey,1.3,'5 7');
  const viralLabel=F.group(v.svg),rnaLabel=F.group(v.svg),dnaLabel=F.group(v.svg),integrationLabel=F.group(v.svg);
  H.text(ctx,viralLabel,80,439,235,68,'РНК-геном\nв носителе','RNA genome\nin its carrier',23,C.gold);
  H.text(ctx,rnaLabel,391,402,170,68,'РНК-геном\nвектора','Vector RNA\ngenome',23,C.gold);
  H.text(ctx,dnaLabel,595,471,214,39,'Новая ДНК-копия','New DNA copy',22,C.teal);
  H.text(ctx,v.svg,863,459,300,35,'ДНК клетки','Cellular DNA',22,C.grey);
  H.text(ctx,integrationLabel,420,536,780,68,'Место интеграции не выбирается sgRNA к TP53','The TP53 sgRNA does not select the integration site',24,C.purple);
  const copyArrow=F.arrow(v.svg,C.teal,2),entryArrow=F.arrow(v.svg,C.gold,2);
  const captions=[
   ['В частице — РНК-геном вектора, а не готовые sgRNA.','The particle carries a vector RNA genome, not mature sgRNAs.'],
   ['Носитель входит в клетку и доставляет РНК-геном.','The carrier enters the cell and delivers its RNA genome.'],
   ['По РНК-шаблону синтезируется отдельная новая молекула ДНК.','The RNA template is used to synthesize a separate new DNA molecule.'],
   ['ДНК-копия встраивается в геном; адрес интеграции и адрес CRISPRi различаются.','The DNA copy integrates; the integration site and the CRISPRi target site are different.']
  ];
  function paint(){
   const entered=F.phase(state.entry,0,.6),release=F.phase(state.entry,.4,1);
   carrier.set({x:F.lerp(205,365,entered),y:357,scale:1.2});
   F.opacity(carrier.g,1-.76*release);
   rna.setAttribute('transform','translate('+F.lerp(F.lerp(205,365,entered),478,release)+' 357) scale('+F.lerp(1.2,1.7,release)+')');
   F.opacity(rna,1-.6*state.copy);
   F.opacity(viralLabel,1-release);F.opacity(rnaLabel,release);
   F.growArrow(entryArrow,270,357,316,357,entered*(1-release));
   const made=F.phase(state.copy,0,1);
   dna.set({x:F.lerp(F.lerp(570,620,made),910,state.integration),y:F.lerp(393,436,made)});
   F.opacity(dna.g,made);F.opacity(dnaLabel,made*(1-state.integration));
   F.growArrow(copyArrow,532,356,591,393,made*(1-state.integration));
   F.opacity(gap,1-state.integration);F.opacity(integrationLabel,state.integration);
   v.root.dataset.phase=state.integration>.99?'integrated':state.copy>.99?'dna-copy':state.entry>.99?'rna-delivered':'carrier';
  }
  const m=H.motion(ctx,v,state,paint,captions);
  m.step({entry:1},1,2200);m.step({copy:1},2,2200);m.step({integration:1},3,2300);
 }
});
})();
