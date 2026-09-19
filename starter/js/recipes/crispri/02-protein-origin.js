(function(){
'use strict';
H.register({
 id:'protein-origin',title:'Откуда в клетке белок dCas9–KRAB?',titleEn:'Where does cellular dCas9–KRAB come from?',chapter:'Сначала подготавливают клетки',chapterEn:'First, prepare the cells',
 sources:[H.sources.elife,H.sources.cell,H.sources.lenti,['Nuclear import and reverse transcription','https://pmc.ncbi.nlm.nih.gov/articles/PMC9286700/']],
 notes:[
  ['Начинаем до подготовки клеток: в ядре ещё нет внесённого гена dCas9–KRAB. Снаружи находится лентивектор. Его РНК-геном несёт код искусственного слитого белка dCas9–KRAB, а не только отдельного домена KRAB. Вектор не несёт готовый рабочий комплекс. Показан один используемый способ создания CRISPRi-клеток; позже отдельным этапом будет доставлена библиотека sgRNA.', 'We begin before cell preparation: the introduced dCas9–KRAB gene is not yet in the nucleus. A lentivector is outside the cell. Its RNA genome carries the code for the engineered dCas9–KRAB fusion protein, not just an isolated KRAB domain. It does not carry the completed working complex. This is one route for making CRISPRi cells; the sgRNA library is delivered in a later, separate stage.'],
  ['После входа лентивектора в клетку генетический груз оказывается в цитоплазме. На рисунке перемещаются те же две РНК-нити, которые были в частице. Бледный контур вокруг груза обозначает упрощённый внутриклеточный транспортный комплекс; оболочка вирусной частицы не входит в ядро.', 'After lentivector entry, the genetic cargo reaches the cytoplasm. The same two RNA strands previously inside the particle move with it. A faint outline denotes a simplified intracellular transport complex; the viral envelope does not enter the nucleus.'],
  ['Обратная транскриптаза синтезирует новую ДНК по РНК-шаблону. Фиолетовый фрагмент — растущая ДНК-копия с кодом dCas9–KRAB. РНК и ДНК — разные молекулы. Здесь показано начало копирования, а не обязательное завершение всей обратной транскрипции в цитоплазме.', 'Reverse transcriptase synthesizes new DNA from the RNA template. The purple fragment is a growing DNA copy carrying the dCas9–KRAB code. RNA and DNA are separate molecules. This depicts the start of copying, not obligatory completion of all reverse transcription in the cytoplasm.'],
  ['Груз проходит через ядерную пору. Перенос в ядро и обратная транскрипция могут перекрываться во времени; ДНК-копия может достраиваться уже в ядре. Контур комплекса, движение и размеры условны. РНК-шаблон разрушается в ходе обратной транскрипции и исчезает с рисунка. Это ещё не интеграция: ДНК груза пока отделена от ДНК клетки.', 'The cargo crosses a nuclear pore. Nuclear import and reverse transcription can overlap; DNA synthesis may finish inside the nucleus. The complex outline, movement and sizes are schematic. The RNA template is degraded during reverse transcription and disappears from the drawing. This is not yet integration: cargo DNA remains separate from cellular DNA.'],
  ['Вирусная интеграза обеспечивает встраивание ДНК-копии в геном клетки. Теперь ген dCas9–KRAB физически присутствует в ядерной ДНК и может экспрессироваться. На схеме фрагмент занимает условное место в хромосоме: это не точная последовательность и не адрес будущей CRISPRi-мишени. При подготовке стабильной линии подходящие клетки дополнительно отбирают и проверяют; эти процедуры здесь не показаны.', 'Viral integrase enables insertion of the DNA copy into the cellular genome. The dCas9–KRAB gene is now physically present in nuclear DNA and can be expressed. Its chromosome position is schematic: it is neither an exact sequence nor the future CRISPRi target site. Suitable cells are also selected and verified when preparing a stable line; those procedures are not shown here.'],
  ['Клеточная РНК-полимераза считывает белок-кодирующую ДНК и создаёт мРНК dCas9–KRAB. ДНК остаётся на месте. На рисунке показана одна РНК для наглядности; созревание мРНК упрощено. Это мРНК белка, а не направляющая sgRNA.', 'Cellular RNA polymerase transcribes the protein-coding DNA to produce dCas9–KRAB mRNA. The DNA stays in place. One RNA molecule is drawn for clarity and mRNA processing is simplified. This is the protein messenger RNA, not an sgRNA guide.'],
  ['Созревшая мРНК выходит из ядра в цитоплазму, где её может читать рибосома. Это та же молекула мРНК, что появилась на предыдущем шаге. Ген не перемещается к рибосоме.', 'The mature mRNA is exported from the nucleus to the cytoplasm, where a ribosome can read it. It is the same mRNA molecule created in the previous step. The gene does not move to the ribosome.'],
  ['Рибосома переводит кодирующую последовательность мРНК в аминокислотную цепь. Получается новый слитый белок dCas9–KRAB: домен dCas9 и домен KRAB соединены в одной полипептидной цепи. Сама мРНК не превращается в белок и может использоваться повторно. Синтез и сворачивание здесь показаны условно, не по аминокислотам.', 'The ribosome translates the mRNA coding sequence into an amino-acid chain. The resulting dCas9–KRAB fusion protein contains the dCas9 and KRAB domains in one polypeptide chain. The mRNA itself does not turn into protein and can be used again. Synthesis and folding are schematic, not depicted amino acid by amino acid.'],
  ['Сигналы ядерной локализации в конструкции белка обеспечивают его импорт в ядро. При наличии sgRNA белок может собраться с ней в направляемый комплекс; точный порядок импорта и сборки здесь не моделируется. В следующей части доставляется отдельная конструкция A+B и образуются направляющие. Их РНК не переводится в белок. Это один распространённый способ организации CRISPRi, а не единственный способ доставки компонентов.', 'Nuclear localization signals in the protein construct enable nuclear import. Once an sgRNA is available, the protein can assemble with it into a guided complex; the exact order of import and assembly is not modeled here. The next part delivers a separate A+B construct and produces the guides. Guide RNA is not translated into protein. This is one common CRISPRi design, not the only way to deliver the components.']
 ],qa:[
  ['Как ген dCas9–KRAB оказался в ядре?', 'Лентивектор доставил РНК с этим кодом. По ней синтезируется ДНК-копия; груз проходит через ядерную пору, а затем ДНК встраивается в геном клетки. Импорт и достраивание ДНК могут перекрываться. Это происходит до доставки направляющих A+B.', 'How did the dCas9–KRAB gene reach the nucleus?', 'A lentivector delivered RNA carrying this code. A DNA copy is synthesized; the cargo crosses a nuclear pore and the DNA then integrates into the cellular genome. Import and DNA completion can overlap. This occurs before A+B guide delivery.'],
  ['Белок принёс тот же вирус, который доставляет A+B?', 'В показанной схеме этапы раздельные. Сначала подготавливают клетки, экспрессирующие dCas9–KRAB из отдельного гена. Затем доставляют конструкции A+B. Эти направляющие не кодируют dCas9–KRAB.', 'Did the A+B virus bring the protein?', 'The stages are separate in this design. First, cells are prepared to express dCas9–KRAB from a separate gene. A+B constructs are delivered later. These guides do not encode dCas9–KRAB.'],
  ['Из sgRNA тоже получится белок?', 'Нет. мРНК dCas9–KRAB несёт инструкцию для синтеза белка. sgRNA сама является рабочей РНК: связывается с белком и направляет его к ДНК.', 'Does an sgRNA also make a protein?', 'No. dCas9–KRAB mRNA encodes the protein. An sgRNA is itself a functional RNA: it binds the protein and directs it to DNA.'],
  ['dCas9–KRAB есть в любой человеческой клетке?', 'Нет. Для этого эксперимента его специально вводят или обеспечивают его экспрессию. На этой схеме показана заранее подготовленная клеточная линия.', 'Does every human cell contain dCas9–KRAB?', 'No. The protein must be introduced or expressed for the experiment. This diagram shows a cell line prepared in advance.']
 ],build(ctx,v){
  const p=v.svg,s={entry:0,copy:0,dnaImport:0,integration:0,transcribe:0,export:0,translate:0,import:0};
  const deliveryHeading=H.text(ctx,p,85,153,850,66,'Отдельный вектор с кодом dCas9–KRAB','A separate vector encoding dCas9–KRAB',26,C.purple);
  const expressionHeading=H.text(ctx,p,85,153,1110,66,'Теперь клетка может производить dCas9–KRAB','The cell can now produce dCas9–KRAB',27,C.purple);
  H.rect(p,75,223,1130,314,C.grey,.025,30);
  H.rect(p,100,243,475,273,C.purple,.035,28);
  H.text(ctx,p,113,459,160,38,'Ядро','Nucleus',23,C.purple);
  H.text(ctx,p,990,234,195,38,'Цитоплазма','Cytoplasm',23,C.grey);
  const hostLabel=H.text(ctx,p,130,254,410,38,'ДНК клетки','Cellular DNA',25,C.grey);
  const geneLabel=H.text(ctx,p,130,254,410,38,'Встроенный ген dCas9–KRAB','Integrated dCas9–KRAB gene',24,C.purple);
  B.dna(p,{x:183.75,y:316,width:77.5,amplitude:7,color:C.grey,color2:C.grey});
  const hostMiddle=B.dna(p,{x:330,y:316,width:215,amplitude:7,color:C.grey,color2:C.grey});
  B.dna(p,{x:476.25,y:316,width:77.5,amplitude:7,color:C.grey,color2:C.grey});
  const carrier=PD.virion(p,{x:1085,y:177,scale:.63,color:C.gold});
  const vectorRNA=F.group(p);carrier.genomes.forEach(n=>vectorRNA.append(n));vectorRNA.style.color=C.gold;vectorRNA.dataset.molecule='effector-vector-rna';
  const cargo=F.group(p);const cargoOutline=D.dom.s('ellipse',{cx:0,cy:0,rx:139,ry:34,fill:'none',stroke:C.purple,'stroke-opacity':.35,'stroke-width':1.4,'stroke-dasharray':'5 6'});cargo.append(cargoOutline);
  const gene=F.group(p);gene.dataset.molecule='effector-gene';
  const defs=D.dom.s('defs'),clip=D.dom.s('clipPath',{id:'effector-copy-clip-'+ctx.index}),clipRect=D.dom.s('rect',{x:-108,y:-16,width:0,height:32});clip.append(clipRect);defs.append(clip);p.append(defs);
  const geneDrawing=F.group(gene);geneDrawing.setAttribute('clip-path','url(#effector-copy-clip-'+ctx.index+')');
  H.rect(geneDrawing,-107.5,-12.5,215,25,C.purple,.12,4);B.dna(geneDrawing,{width:215,amplitude:7,color:C.purple,color2:C.purple});
  const vectorRnaLabel=H.text(ctx,p,694,339,315,70,'РНК вектора:\nкод dCas9–KRAB','Vector RNA:\ndCas9–KRAB code',23,C.gold);
  const templateLabel=H.text(ctx,p,715,329,300,38,'РНК-шаблон','RNA template',23,C.gold);
  const dnaCopyLabel=F.group(p);H.text(ctx,dnaCopyLabel,-150,30,300,38,'ДНК-копия','DNA copy',23,C.purple);
  const pore=F.group(p);pore.append(D.dom.s('rect',{x:566,y:410,width:18,height:40,fill:C.bg}));
  pore.append(D.dom.s('ellipse',{cx:575,cy:430,rx:13,ry:23,fill:'none',stroke:C.purple,'stroke-width':3}));
  const poreName=H.text(ctx,p,583,344,180,36,'Ядерная пора','Nuclear pore',22,C.purple);
  const copyArrow=F.arrow(p,C.purple,2);copyArrow.set(865,397,865,417);
  const pol=B.polymerase(p,{x:320,y:316,scale:.36,color:C.teal});
  const message=F.group(p);message.dataset.molecule='effector-mrna';
  B.mrna(message,{width:320,scale:.63,color:C.gold});
  H.text(ctx,message,-120,20,240,34,'мРНК белка','Protein mRNA',22,C.gold);
  const ribosome=B.ribosome(p,{x:876,y:344,scale:.55,color:C.teal,color2:C.teal});
  const ribosomeLabel=H.text(ctx,p,720,251,215,38,'Рибосома','Ribosome',24,C.teal);
  const protein=H.complex(p,1010,425,C.blue,.62);protein.guide.g.style.display='none';protein.g.dataset.molecule='effector-protein';
  const proteinName=F.group(p);H.text(ctx,proteinName,-160,60,320,38,'Белок dCas9–KRAB','dCas9–KRAB protein',24,C.purple);
  const synth=F.group(p);F.path(synth,[[915,310],[1060,310],[1060,365]],C.purple,2);
  const synthArrow=F.arrow(synth,C.purple,2);synthArrow.set(1060,365,1040,389);
  H.rect(p,90,551,1100,54,C.purple,.035,10);
  H.text(ctx,p,105,556,1070,44,'Ген белка → мРНК → белок; ген sgRNA → sgRNA','Protein gene → mRNA → protein; sgRNA gene → sgRNA',25,C.white);
  const caps=[
   ['В ядре ещё нет внесённого гена. Его код находится в РНК лентивектора снаружи клетки.','The introduced gene is not yet in the nucleus. Its code is in lentivector RNA outside the cell.'],
   ['Лентивектор доставляет в клетку РНК с кодом dCas9–KRAB.','The lentivector delivers RNA encoding dCas9–KRAB into the cell.'],
   ['Обратная транскрипция: по РНК начинается синтез отдельной ДНК-копии.','Reverse transcription: synthesis of a separate DNA copy begins on the RNA template.'],
   ['Груз проходит через ядерную пору; ДНК-копия достраивается.','The cargo crosses the nuclear pore; the DNA copy is completed.'],
   ['Интеграза встраивает ДНК с геном dCas9–KRAB в геном клетки.','Integrase inserts the DNA carrying dCas9–KRAB into the cellular genome.'],
   ['Транскрипция: с гена белка считывается мРНК.','Transcription: the protein-coding gene produces mRNA.'],
   ['мРНК выходит в цитоплазму и становится доступна рибосоме.','The mRNA enters the cytoplasm and becomes available to a ribosome.'],
   ['Трансляция: рибосома синтезирует белок; мРНК остаётся.','Translation: the ribosome synthesizes protein; the mRNA remains.'],
   ['Белок импортируется в ядро. Направляющие A и B доставим следующим этапом.','The protein enters the nucleus. Guides A and B are delivered in the next stage.']
  ];
  function paint(){
   const entered=F.phase(s.entry,0,.55),released=F.phase(s.entry,.4,1);
   const carrierX=1085,carrierY=F.lerp(177,300,entered);
   carrier.set({x:carrierX,y:carrierY,scale:.63});F.opacity(carrier.g,(1-.85*released)*(1-s.copy));
   const vectorX=F.lerp(F.lerp(carrierX,865,released),397,s.dnaImport),vectorY=F.lerp(F.lerp(F.lerp(carrierY,300,released),425,s.copy),430,s.dnaImport);
   vectorRNA.setAttribute('transform','translate('+vectorX+' '+vectorY+') scale('+(F.lerp(.63,1.2,released)*(1-.35*s.copy))+')');
   F.opacity(vectorRNA,1-s.dnaImport);F.opacity(vectorRnaLabel.el,released*(1-s.dnaImport)*(s.copy>.01?0:1));
   F.opacity(templateLabel.el,s.copy*(1-s.dnaImport));
   const gx=F.lerp(F.lerp(865,397,s.dnaImport),330,s.integration),gy=F.lerp(F.lerp(445,430,s.dnaImport),316,s.integration);
   F.at(gene,gx,gy);F.opacity(gene,s.copy);clipRect.setAttribute('width',216*s.copy*(.5+.5*s.dnaImport));
   F.at(cargo,F.lerp(865,397,s.dnaImport),F.lerp(300,430,s.copy));F.opacity(cargo,released*(1-s.integration));
   F.at(dnaCopyLabel,gx,gy);F.opacity(dnaCopyLabel,s.copy*(1-s.integration));F.opacity(copyArrow.g,s.copy*(1-s.dnaImport));
   F.opacity(pore,s.copy*(1-s.integration));F.opacity(poreName.el,s.copy*(1-s.integration));
   F.opacity(hostLabel.el,s.integration>.99?0:1);F.opacity(geneLabel.el,s.integration>.99?1:0);
   F.opacity(hostMiddle.g,1-s.integration);
   F.opacity(deliveryHeading.el,s.integration>.99?0:1);F.opacity(expressionHeading.el,s.integration>.99?1:0);
   const rnaX=F.lerp(327,876,s.export),rnaY=F.lerp(393,352,s.export);
   F.at(message,rnaX,rnaY);F.opacity(message,s.transcribe);
   F.opacity(pol.g,s.transcribe*(1-s.export));F.opacity(ribosome.g,s.integration*(.35+.65*s.export));F.opacity(ribosomeLabel.el,s.integration);
   const proteinX=F.lerp(1010,397,s.import),proteinY=F.lerp(425,410,s.import);
   F.at(protein.g,proteinX,proteinY);F.at(proteinName,proteinX,proteinY);
   F.opacity(protein.g,s.translate);F.opacity(proteinName,s.translate);F.opacity(synth,s.translate*(1-s.import));
   Object.assign(v.root.dataset,{vectorEntry:String(s.entry),dnaCopy:String(s.copy),dnaNuclearImport:String(s.dnaImport),geneIntegration:String(s.integration),transcription:String(s.transcribe),mrnaExport:String(s.export),translation:String(s.translate),nuclearImport:String(s.import)});
  }
  const m=H.motion(ctx,v,s,paint,caps);
  m.step({entry:1},1,2100);m.step({copy:1},2,1800);m.step({dnaImport:1},3,2400);m.step({integration:1},4,2100);
  m.step({transcribe:1},5,1600);m.step({export:1},6,2100);m.step({translate:1},7,1800);m.step({import:1},8,2300);
 }});
})();
