/* One film clock, several connected representations of an explicitly synthetic assay. */
(function(g){
'use strict';
const ID='atac-journey',cues=AtacStory.build(g.ATAC_FILM_CONFIG===undefined?{}:g.ATAC_FILM_CONFIG),baseline=AtacStory.baseline,duration=CinemaTimeline.duration(cues),sample=t=>CinemaTimeline.sample(cues,baseline,t);
const tr=(ru,en)=>{D.i18n.pack('en',{strings:{[ru]:en}});return ru;};
const questions=[
 ['Почему R2 направлено влево, если синтез идёт 5′→3′?','Why does R2 point left if synthesis runs 5′→3′?',
 '5′ и 3′ обозначают химические концы цепи, а не стороны экрана. Матрицы антипараллельны, поэтому обе новые цепи растут 5′→3′, но в противоположных направлениях относительно выбранной геномной оси. R1 и R2 получают в разных раундах; ориентация R1 вправо выбрана только для этого примера.',
 '5′ and 3′ identify chemical ends, not screen directions. The templates are antiparallel, so both new strands grow 5′→3′ in opposite directions along the chosen genomic axis. R1 and R2 are acquired in separate rounds; rightward R1 is a choice for this example.',
 'https://support-docs.illumina.com/SHARE/IndexedSeq/Content/SHARE/IndexedSequencing/DualIndexWorkflowPE.htm','Illumina · paired-end sequencing workflow'],
 ['Белок или ДНК меняют форму при увеличении?','Does the protein or DNA change shape during a close-up?',
 'В видах 1KX5 и 1MUH экспериментальные координаты сохраняются. Меняются только масштаб, направление наблюдения и выделение. Отметка на общем виде связывает крупный план с тем же комплексом. Сцены чтения — отдельно подписанная учебная схема, а не атомная модель секвенатора.',
 'In the 1KX5 and 1MUH views the experimental coordinates stay fixed. Only scale, viewpoint and emphasis change. The whole-object marker connects the close-up to the same complex. Reading scenes are separately labeled teaching schematics, not an atomic model of a sequencer.',
 'https://www.rcsb.org/structure/1KX5','PDB 1KX5 · experimental nucleosome coordinates'],
 ['Здесь показаны реальные экспериментальные данные?','Are these real experimental data?',
 'Локус, фрагменты и треки синтетические. Отдельно подписанные крупные планы 1KX5 и 1MUH используют экспериментальные координаты PDB; остальные объёмные сцены — авторские схемы.',
 'The locus, fragments and tracks are synthetic. Separately labeled close-ups of 1KX5 and 1MUH use experimental PDB coordinates; other 3D scenes are authored schematics.'],
 ['Одно событие Tn5 сразу вырезает весь фрагмент?','Does one Tn5 event excise the entire fragment?',
 'Нет. Один комплекс действует локально. Два независимых события задают противоположные границы выбранной вставки; перенос адаптерной ДНК отделён от последующей достройки библиотеки.',
 'No. One complex acts locally. Two independent events define opposite boundaries of the selected insert; adapter transfer is separate from later library completion.'],
 ['9 пар оснований исчезают при тагментации?','Are nine base pairs removed during tagmentation?',
 'Нет. Девять пар оснований описывают смещение позиций на противоположных цепях. Программная коррекция координат и предпочтения Tn5 к последовательности — отдельные вопросы.',
 'No. Nine base pairs describe the stagger between opposite-strand positions. Software coordinate correction and Tn5 sequence preferences are separate issues.'],
 ['Два парных прочтения — это две молекулы?','Are paired-end reads two molecules?',
 'R1 и R2 происходят от одной библиотечной вставки. В примере оба имеют длину 30 оснований, а интервал F001 — 88 п. н. Часть вставки между прочтениями не секвенирована напрямую.',
 'R1 and R2 come from one library insert. In the example, both reads are 30 bases long and F001 spans 88 bp. The intervening insert sequence is not read directly.'],
 ['Почему покрытие не совпадает с числом концов?','Why does coverage differ from endpoint counts?',
 'Фрагмент перекрывает весь свой интервал, но имеет только два конца. Эти величины отвечают на разные вопросы и здесь вычисляются из одних и тех же записей.',
 'A fragment spans its entire interval but has only two ends. These quantities answer different questions and are computed from the same records here.'],
 ['88% FRiP означает, что образец прошёл контроль качества?','Does 88% FRiP mean that a sample passed quality control?',
 'Нет. Это результат на специально созданных учебных фрагментах и заданных окнах P1/P2. В реальном анализе важны выбранный набор пиков, единица счёта, сложность, TSS, митохондриальная доля и повторы.',
 'No. It is a result from deliberately generated teaching fragments and predefined P1/P2 windows. Real interpretation also depends on count units, complexity, TSS signal, mitochondrial fraction and replicates.'],
 ['ATAC-пик доказывает экспрессию гена?','Does an ATAC peak prove gene expression?',
 'Нет. Он поддерживает вывод о доступности участка при данных условиях анализа. Экспрессия, связывание конкретного белка и регуляторная функция требуют дополнительных измерений.',
 'No. It supports accessibility under the assay and analysis conditions. Expression, binding of a specific protein and regulatory function require additional measurements.'],
 ['147 пар оснований в нуклеосоме — это длина любого ATAC-фрагмента?','Does every ATAC fragment have the nucleosome’s 147-bp length?',
 'Нет. Места вставок могут лежать по обе стороны обёрнутой ДНК, поэтому геномная вставка включает и соседние участки. Длины зависят от положений событий; одна длина сама по себе не доказывает нуклеосому.',
 'No. Insertions can lie on either side of wrapped DNA, so the insert also includes flanking sequence. Length depends on event positions; one length alone does not prove a nucleosome.','https://pmc.ncbi.nlm.nih.gov/articles/PMC4617971/','Schep et al., 2015'],
 ['В структуре 1MUH показаны полные ATAC-адаптеры и геномная мишень?','Does 1MUH contain full ATAC adapters and a genomic target?',
 'Нет. Показан биологический димер Tn5 с двумя короткими двуцепочечными концами транспозона. Эта структура объясняет удержание ДНК; современная библиотека и геномная мишень показаны позже отдельной схемой.',
 'No. It shows the biological Tn5 dimer holding two short double-stranded transposon ends. It explains loaded-DNA binding; a modern library and genomic target appear later as separate schematics.','https://www.rcsb.org/structure/1MUH','Davies et al., 2000 · PDB 1MUH'],
 ['Что изменилось в Omni-ATAC?','What changed with Omni-ATAC?',
 'Omni-ATAC — опубликованное улучшение метода с уменьшением фона и расширением работы с разными материалами, включая замороженные ткани. Этот фильм объясняет общий принцип ATAC-seq, а не конкретный лабораторный протокол.',
 'Omni-ATAC is a published method improvement that reduced background and expanded applicability, including frozen tissues. This film explains the shared ATAC-seq principle, not a specific laboratory protocol.','https://doi.org/10.1038/nmeth.4396','Corces et al., 2017']
];
const qa=lang=>questions.map(q=>({q:q[lang==='en'?1:0],a:q[lang==='en'?3:2],url:q[4]||'https://doi.org/10.1038/nmeth.2688',source:q[5]||'ATAC-seq · sources in cue notes'}));
D.i18n.pack('en',{notes:{[ID]:cues.map(c=>F.note(c.noteEn,c.sourceLabel,c.sourceUrl))},qa:{[ID]:qa('en')}});
D.deck.register({id:ID,title:tr('ATAC-seq: от хроматина к карте доступности','ATAC-seq: from chromatin to accessibility'),chapter:tr('Одна история · от молекулы к свидетельству','One story · from molecule to evidence'),notes:cues.map(c=>F.note(c.noteRu,c.sourceLabel,c.sourceUrl)),qa:qa('ru'),
 build(ctx){
  const v=F.stage(ctx,cues[0].titleRu,'ATAC-seq','Primary studies · synthetic teaching data');v.root.classList.add('atac-journey');
  v.heading.setAttribute('data-i18n-ignore','');v.cap.setAttribute('data-i18n-ignore','');
  const chromatin=AtacChromatin.create(v.svg),signals=AtacSignals.create(v.svg),extras=AtacExtras.create(v.svg),structure=AtacStructureViews.create(v.svg),origin=AtacFragmentOrigin.create(v.svg),reads=AtacReadViews.create(v.svg),overlay=F.group(v.svg),state={time:0};
  const camera=AtacCameraStory.create({cues,sample,chromatin,structure,extras});
  const phase=(u,a,b)=>CinemaTimeline.smooth(Math.max(0,Math.min(1,(u-a)/(b-a))));
  let controller,lastCopy='',serial=0;[chromatin,signals,extras,structure,origin,reads].forEach(a=>ctx.onDispose(a.dispose));
  const box=(parent,x,y,width,height,ru,en,size=22,color=C.white,align='center')=>L.textBox(parent,{id:'atac-overlay-'+(++serial),x,y,width,height,text:tr(ru,en),size,color,align,padding:0,lineHeight:1.18});
  box(overlay,70,151,585,34,'ATAC-seq · от молекулы к свидетельству','ATAC-seq · from molecule to evidence',18,C.grey,'left');
  const mode=box(overlay,635,151,575,34,'Учебная 3D-схема','Teaching 3D schematic',18,C.grey,'right');
  const annotations=AtacCallouts.create(overlay,{id:'atac-nearby'});ctx.onDispose(annotations.dispose);
  const specs={
   histone:{ru:'Гистоновая\nсердцевина',en:'Histone\ncore',width:178,height:70,anchor:'histone',offset:[-89,77],color:C.purple},
   tails:{ru:'Гистоновые хвосты',en:'Histone tails',width:200,height:40,anchor:'tails',offset:[-100,-90],color:C.gold},
   dna:{ru:'Две цепи ДНК',en:'Two DNA strands',width:170,height:40,anchor:'dna',offset:[-85,49],color:C.blue},
   open:{ru:'Доступная ДНК',en:'Accessible DNA',width:180,height:40,anchor:'open',offset:[-90,48],color:C.gold},
   tn5:{ru:'Tn5 + ДНК',en:'Tn5 + DNA',width:180,height:40,anchor:'enzyme',offset:[-90,-91],color:C.gold},
   local:{ru:'Место действия',en:'Action site',width:168,height:40,anchor:'cutA',offset:[-84,54],color:C.gold},
   two:{ru:'Два события',en:'Two events',width:154,height:40,anchor:'fragment',offset:[-77,-95],color:C.gold},
   coordinate:{ru:'Условный локус · 0–1200 п. н.',en:'Synthetic locus · 0–1,200 bp',width:450,height:40,position:[415,493],color:C.grey},
   f001:{ru:'F001 · 88 п. н.',en:'F001 · 88 bp',width:200,height:40,position:[540,475],color:C.gold}
  };
  Object.entries(specs).forEach(([id,o])=>{const node=annotations.add(id,o.ru,o.en,o);node.dataset.atacAnnotation=id;});
  const labels={question:['dna'],chromatin:['histone','dna'],nucleosome:['histone','dna','tails'],linker:['open'],protected:['histone','open'],tn5:['tn5'],dock:['tn5','local'],'two-events':['two'],'coordinate-map':['coordinate'],'release':['f001']};
  const annotationPlans={};
  cues.forEach((cue,index)=>{
   const selected=labels[cue.key]||[];if(!selected.length)return;
   const {out}=camera.paint({cue:index,values:cue.target},cue.time);annotations.begin(out.geometry.labelObstacles||[]);
   annotationPlans[cue.key]={};
   for(const id of selected){const o=specs[id],anchor=o.position||out.anchors[o.anchor||id];
    const offset=o.position?[0,0]:annotations.suggest(id,{anchor,offset:o.offset});
    annotationPlans[cue.key][id]=offset;annotations.place(id,{anchor,offset,leader:!o.position});
   }
  });
  function paint(){
   const timelineFrame=sample(state.time),frame=AtacStory.renderFrame(cues,timelineFrame,state.time),cue=cues[frame.cue],s=frame.values,lang=D.i18n.lang()==='en'?'En':'Ru';
   const {out,st,eo,zoomBridge,cameraStory,annotationVisibility}=camera.paint(frame,state.time);
   const u=cue.motion>0?Math.max(0,Math.min(1,(state.time-cue.arrive)/cue.motion)):1;
   // The two origin examples are not records in the 150-fragment sample.
   // Return directly to length space; never expose the stale genomic track
   // stored before the explanatory detour. Accumulate the real sample bins.
   const lengthEntry=cue.key==='lengths',lengthFromOrigin=lengthEntry&&frame.cue>0&&cues[frame.cue-1].key==='contour-length',handoff=phase(u,.08,.4),lengthReveal=lengthEntry?phase(u,.17,1):1;
   const so=signals.paint({visibility:lengthFromOrigin?handoff:s.signal,stage:lengthFromOrigin?11:s.signalStage,lengthReveal});
   const fo=origin.paint({visibility:lengthFromOrigin?1-handoff:s.origin,stage:s.originStage,turn:s.originTurn});
   const ro=reads.paint({visibility:s.reads,stage:s.readStage});
   // Shorter cues need their full reading window, including meaningful motion.
   const copyKey=[frame.cue,lang].join(':');if(copyKey!==lastCopy){v.title(cue['title'+lang]);v.caption(cue['caption'+lang]);lastCopy=copyKey;}
   F.opacity(v.cap,1);v.cap.dataset.captionPhase='continuous';
   const current=new Set(labels[cue.key]||[]),prev=new Set(labels[cues[Math.max(0,frame.cue-1)].key]||[]);
   annotations.begin(out.geometry.labelObstacles||[]);
   Object.entries(specs).forEach(([id,o])=>{
    const present=current.has(id)?(prev.has(id)?1:phase(u,.35,.82)):prev.has(id)?1-phase(u,0,.22):0;
    const at=o.position||out.anchors[o.anchor||id];
    const oldOffset=annotationPlans[cues[Math.max(0,frame.cue-1)].key]?.[id]||o.offset||[0,0],newOffset=annotationPlans[cue.key]?.[id]||oldOffset,offset=oldOffset.map((v,i)=>v+(newOffset[i]-v)*CinemaTimeline.smooth(u));
    annotations.place(id,{anchor:at,offset:o.position?[0,0]:offset,leader:!o.position,opacity:present*annotationVisibility*(cameraStory?1:s.chrom)});
   });
   const type=cameraStory&&cameraStory.progress<1?(['nucleosome-entry','nucleosome-return'].includes(cameraStory.kind)?['Нуклеосома · общий вид и детали · 1KX5','Nucleosome · whole object and details · 1KX5']:['tn5-entry','tn5-return'].includes(cameraStory.kind)?['Tn5 · общий вид и детали · 1MUH','Tn5 · whole object and details · 1MUH']:['Место действия Tn5 · поясняющее приближение','Tn5 action site · explanatory close-up']):s.reads>.5?['Синтетическая вставка · схема чтения по синтезу','Synthetic insert · sequencing-by-synthesis schematic']:st.visibility>.5?(st.source==='1KX5'?['Экспериментальные координаты · PDB 1KX5','Experimental coordinates · PDB 1KX5']:['Экспериментальные координаты · PDB 1MUH','Experimental coordinates · PDB 1MUH']):s.origin>.5?['Поясняющая 3D-схема · длины условны','Explanatory 3D schematic · arbitrary lengths']:s.extra>.5?(s.extraStage<.5?['Отдельная учебная схема TSS','Separate TSS teaching schematic']:['Учебная схема интерпретации','Interpretation schematic']):s.signal>.5?['Синтетические фрагменты · условный локус','Synthetic fragments · teaching locus']:s.chem>.5?['Условная схема одного события','Schematic of one local event']:s.flat>.5?['Карта той же ДНК · условные координаты','Same DNA map · synthetic coordinates']:['Учебная 3D-схема · размеры условны','Teaching 3D schematic · schematic dimensions'];
   mode.setText(lengthEntry?(lang==='En'?'Synthetic sample · 150 original inserts':'Учебная выборка · 150 исходных вставок'):type[lang==='En'?1:0]);
   v.root.dataset.cue=String(frame.cue);v.root.dataset.filmTime=state.time.toFixed(4);controller?.update();
   g.ATAC_FILM.snapshot={time:state.time,key:cue.key,cue:frame.cue,values:s,timelineValues:timelineFrame.values,representationTransition:frame.representationTransition||null,captionPhase:'continuous',geometry:out.geometry,anchors:out.anchors,signal:so,extra:eo,structure:st,origin:fo,reads:ro,zoomBridge,cameraStory,annotations:annotations.snapshots};
  }
  const driver=F.driver(state,paint);ctx.onDispose(driver.dispose);controller=Cinema.mount(ctx,{root:v.root,state,driver,cues,duration,narrativeIndex:t=>sample(t).cue});
  ctx.onDispose(D.i18n.onChange(paint));cues.slice(1).forEach((c,i)=>ctx.step(()=>controller.go(i+1,true)));
  g.ATAC_FILM.actors={chromatin,signals,extras,structure,origin,reads};g.ATAC_FILM.paint=paint;paint();return v.root;
 }
});
g.ATAC_FILM={cues,catalog:Object.freeze(AtacStory.catalog().map(c=>Object.freeze({...c,target:Object.freeze({...c.target})}))),defaultRoute:AtacStory.defaultRoute,baseline,duration,sample};
})(window);
