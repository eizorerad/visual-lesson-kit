/* Library preparation, sequencing and paired interpretation in a shared 3D view.
 * The collection stands and data tiles are spatial teaching metaphors, not
 * laboratory equipment. Products keep their identities; PCR copies are explicit. */
(function(){'use strict';
Bio3D.scene({id:'libraries',chapter:['Секвенирование','Sequencing'],title:['Две библиотеки. Один клеточный код.','Two libraries. One cell barcode.'],notes:[
['Вернёмся от примера подсчёта к подготовке библиотек, до секвенирования. Перед нами те же три учебных ДНК-продукта: один из мРНК и два родственных ADT-продукта. Они не возникли из записей данных. В исходном CITE-seq после разрушения эмульсии и извлечения бусин выполняют синтез и общую начальную амплификацию. Двойные спирали обобщают ДНК-продукты, а не изображают конкретный промежуточный комплекс.','Return from the counting example to library preparation, before sequencing. These are the same three teaching DNA products: one from mRNA and two related ADT products. They did not arise from data records. Original CITE-seq breaks the emulsion, recovers beads, then performs synthesis and common initial amplification. The helices summarize DNA products rather than a specific intermediate complex.'],
['После общей амплификации длинные продукты из мРНК и короткие ADT-продукты разделяют по размеру. Здесь они расходятся в две пространственные группы; это не физическое сито и не действие захватывающей бусины Drop-seq. Длины спиралей увеличены независимо от реальной длины: рисунок показывает принадлежность к фракциям, а не измеряет число нуклеотидов.','After common amplification, longer mRNA-derived products and shorter ADT products are separated by size. They move into two spatial groups here; this is neither a physical sieve nor the action of the Drop-seq capture bead. Helices are enlarged independently of sequence length: the view shows fraction membership, not nucleotide counts.'],
['Ветви подготавливают отдельно. В исходном протоколе RNA-ветвь проходит тагментацию и подготовку библиотеки; ADT-ветвь — специальную PCR с праймерами для секвенирования. Появляющиеся спирали — условные PCR-потомки выбранных примеров, не новые захваченные молекулы. Все потомки сохраняют происхождение клеточного кода A; фиолетовые UMI выбранных семейств — GCT и TGA. Адаптеры и реальные размеры здесь не детализируются.','The branches are prepared separately. In the original protocol, the RNA branch undergoes tagmentation and library preparation; the ADT branch undergoes dedicated PCR with sequencing primers. Emerging helices are schematic PCR descendants of the selected examples, not newly captured molecules. Descendants retain cell barcode A; the selected families retain UMIs GCT and TGA. Adapters and actual fragment sizes are not detailed here.'],
['В RNA-библиотеке секвенируют ДНК-копию мРНК. Прибор определяет порядок оснований A, C, G, T. В показанном варианте Drop-seq R1 содержит клеточный код и UMI, а R2 — фрагмент последовательности, полученной из РНК. Это парные чтения противоположных концов одного библиотечного фрагмента, а не два типа библиотек. Далее фрагмент сопоставляют с референсом и определяют ген. В нашем условном примере это CD4. Буквы ACTGACGA и соответствие гену вымышлены; A, GCT и TGA — сокращённые учебные обозначения. Цветные участки и движение маркеров объясняют поля данных, а не буквальную архитектуру или циклы прибора.','In the RNA library, the sequencer reads a DNA copy of mRNA by determining the order of A, C, G and T bases. In the illustrated Drop-seq configuration, R1 contains the cell barcode and UMI; R2 contains transcript-derived sequence. These are paired reads from opposite ends of one library fragment, not two library types. The sequence is then mapped to a reference to identify a gene, CD4 in this teaching example. ACTGACGA and its gene assignment are invented; A, GCT and TGA are shortened teaching labels. Colored segments and marker motion explain data fields, not literal library architecture or instrument cycles.'],
['В ADT-библиотеке также секвенируют ДНК: искусственную метку, ранее прикреплённую к антителу. R1 снова даёт клеточный код и UMI. Код из R2 ищут в известном словаре меток, который связывает код с реагентом anti-CD4. Это идентификация антитела по ДНК-коду, а не чтение последовательности белка и не картирование ADT на ген CD4. GTCACTAG и его соответствие anti-CD4 здесь вымышлены. Структура R1/R2 относится к выбранному Drop-seq протоколу и может отличаться в других версиях технологии.','The ADT library is also DNA: a synthetic tag originally attached to an antibody. R1 again supplies the cell barcode and UMI. The R2 tag code is matched to a known dictionary that identifies the anti-CD4 reagent. This identifies an antibody through its DNA code; it neither sequences protein nor maps the ADT to the CD4 gene. GTCACTAG and its anti-CD4 assignment are invented here. The R1/R2 layout is specific to the illustrated Drop-seq protocol and may differ in other technology versions.'],
['Один клеточный код A связывает два результата. После контроля качества, коррекции кодов и UMI-дедупликации внутри клетки и признака получают RNA- и ADT-профили. Библиотеки и UMI из разных каналов не сливают в один молекулярный отсчёт. Следующий слайд показывает отдельный вымышленный пример двух матриц для нескольких клеток.','Shared cell barcode A links the two results. Quality control, barcode correction and UMI deduplication within cell and feature yield RNA and ADT profiles. Libraries and UMIs from different modalities are not merged into one molecular count. The next slide shows a separate invented example of two matrices for several cells.']
],qa:[['Почему разделение не теряет адрес клетки?','Why does separation preserve the cell address?','Клеточный код уже включён в ДНК-продукты. Разделение и подготовка библиотек сохраняют эту информацию.','The cell barcode is already incorporated into the DNA products. Separation and library preparation retain that information.'],['Здесь показан реальный размер молекул?','Are molecular sizes shown to scale?','Нет. Геометрия увеличена для чтения кодов; в исходном протоколе фракции разделяют по реальной длине продуктов.','No. Geometry is enlarged to inspect codes; the original protocol separates fractions by actual product length.']],build(ctx){
const v=Bio3D.stage(ctx,'Две библиотеки. Один клеточный код.','Two libraries. One cell barcode.'),st={split:0,prep:0,read:0,decode:0,pair:0};
const dna=V3.CodesMesh.create(),props=V3.LibrariesMesh.create(),camera={cx:550,cy:399,scale:64};
const clones=[0,0,2].map((i,j)=>({...dna.molecules[i],id:['rna-cd4-gct-pcr-1','rna-cd4-gct-pcr-2','adt-cd4-tga-pcr-2'][j],parentId:dna.molecules[i].id}));
const products=[...dna.molecules,...clones];
// Three independent field markers per read pair: address, UMI and feature.
const readMarkers=[0,1].flatMap(side=>['primer','umi',side?'tag':'rna'].map((role,j)=>({...props.markers[side],id:`read-${side}-${j}`,parts:props.markers[side].parts.map(part=>({...part,role}))})));
const definitions=[...products,...props.molecules,...props.readouts,...readMarkers];
const surface=V3.CellSurface.create(v.svg,camera,{frame:{x:60,y:147,width:1160,height:463},molecules:definitions,includeCell:false});ctx.onDispose(surface.dispose);
if(F.shared)F.shared(surface.g,{id:'cite-dna-products',kind:'3d-dna-product-ancestry',label:'A: RNA GCT; ADT TGA and PCR copy',source:'Stoeckius 2017; schematic products'});
surface.g.dataset.libraries3d='';
const p=F.group(v.svg),leaders=F.group(p),labels=F.group(p);
const preamble=Bio3D.text(labels,65,148,1150,36,'Вернёмся к подготовке: после общей амплификации, до секвенирования.','Back to preparation: after common amplification, before sequencing.',21,C.grey);
const dataPreamble=Bio3D.text(labels,65,148,1150,36,'От двух ДНК-библиотек — к двум типам данных.','From two DNA libraries to two types of data.',21,C.grey);
const initial=F.group(labels);
[['Клеточный код','Cell barcode',274,190,C.gold],['UMI','UMI',436,100,C.purple],['Какой признак?','Which feature?',549,238,C.teal]].forEach(a=>Bio3D.text(initial,a[2],187,a[3],32,a[0],a[1],21,a[4]));
const initialValues=products.slice(0,3).map((m,i)=>{
 const y=[300,409,518][i],g=F.group(initial),color=i?C.teal:C.blue;
 Bio3D.text(g,65,y-20,197,40,i===0?'ДНК из мРНК':i===1?'ДНК из ADT':'PCR-копия ADT',i===0?'DNA from mRNA':i===1?'DNA from ADT':'ADT PCR copy',21,color);
 [['A','A',368,80,C.gold],[m.umi,m.umi,485,90,C.purple],[i?'код anti-CD4':'фрагмент CD4',i?'anti-CD4 code':'CD4-derived fragment',667,220,color]].forEach(a=>Bio3D.text(g,a[2]-a[3]/2,y-63,a[3],32,a[0],a[1],21,a[4]));return g;
});
const intro=Bio3D.text(initial,855,260,342,184,'Коды уже внутри ДНК.\nТеперь проследим две библиотеки.','The codes are already in DNA.\nNow follow the two libraries.',27,C.white);
const headings=[Bio3D.text(labels,95,178,490,42,'RNA-библиотека','RNA library',31,C.blue),Bio3D.text(labels,695,178,490,42,'ADT-библиотека','ADT library',31,C.teal)];
const status=[0,1].map(i=>{
 const g=F.group(labels),x=95+i*600,color=i?C.teal:C.blue;
 return {g,split:Bio3D.text(g,x,475,490,32,i?'Фракция коротких ADT':'Фракция длинной кДНК',i?'Short ADT fraction':'Long cDNA fraction',23,color),prep:Bio3D.text(g,x,475,490,32,i?'Отдельная PCR → библиотека':'Тагментация + PCR → библиотека',i?'Dedicated PCR → library':'Tagmentation + PCR → library',23,color),decode:Bio3D.text(g,x,475,490,32,i?'Код → словарь антител':'Последовательность → ген',i?'Code → antibody dictionary':'Sequence → gene',22,color)};
});
const fields=[0,1].map(i=>{
 const g=F.group(labels);g.dataset.libraryFields=i?'adt':'rna';
 return {g,texts:[Bio3D.text(g,0,0,50,30,'A','A',23,C.gold),Bio3D.text(g,0,0,66,30,i?'TGA':'GCT',i?'TGA':'GCT',20,C.purple),Bio3D.text(g,0,0,205,30,i?'код anti-CD4':'фрагмент CD4',i?'anti-CD4 code':'CD4-derived fragment',20,i?C.teal:C.blue)],lines:[C.gold,C.purple,i?C.teal:C.blue].map(c=>Bio3D.path(leaders,'M0 0',c,1.3))};
});
const records=[0,1].map(i=>{
 const g=F.group(labels);g.dataset.libraryRecord=i?'adt':'rna';
 const decoded=Bio3D.text(g,155+i*600,512,370,34,i?'A · anti-CD4 · TGA':'A · CD4 · GCT',i?'A · anti-CD4 · TGA':'A · CD4 · GCT',23,i?C.teal:C.blue);
 return {g,decoded};
});
const reading=[0,1].map(side=>{
 const color=side?C.teal:C.blue,g=F.group(labels);g.dataset.libraryReading=side?'adt':'rna';
 Bio3D.text(g,65,148,1150,43,side?'ADT: читаем ДНК-метку антитела':'RNA: читаем ДНК-копию мРНК',side?'ADT: read the antibody DNA tag':'RNA: read a DNA copy of mRNA',30,color);
 Bio3D.text(g,65,196,1150,32,'Прибор определяет порядок букв A, C, G, T.','The sequencer determines the order of A, C, G and T.',21,C.grey);
 const source=['Код клетки','UMI',side?'Код антитела':'Фрагмент кДНК'],sourceEN=['Cell barcode','UMI',side?'Antibody code':'cDNA fragment'];
 const fields=source.map((txt,j)=>Bio3D.text(g,0,233,[170,100,230][j],32,txt,sourceEN[j],21,[C.gold,C.purple,color][j]));
 const output=F.group(g);output.dataset.libraryReadPair=side?'adt':'rna';
 Bio3D.text(output,205,332,427,32,'R1 · код клетки + UMI','R1 · cell barcode + UMI',23,C.white);
 Bio3D.text(output,646,332,430,32,side?'R2 · код метки':'R2 · фрагмент кДНК',side?'R2 · tag code':'R2 · cDNA fragment',23,color);
 Bio3D.text(output,216,375,180,27,'Клетка','Cell',19,C.gold);Bio3D.text(output,438,375,180,27,'UMI','UMI',19,C.purple);Bio3D.text(output,650,375,410,27,'Прочитанная последовательность','Read sequence',19,color);
 const address=Bio3D.text(output,216,402,180,45,'A','A',31,C.gold),umi=Bio3D.text(output,438,402,180,45,side?'TGA':'GCT',side?'TGA':'GCT',30,C.purple);
 const sequence=side?'GTCACTAG':'ACTGACGA',letters=[...sequence].map((letter,j)=>Bio3D.text(output,749+j*27,405,26,39,letter,letter,28,color));
 const mapping=F.group(g);mapping.dataset.libraryMapping=side?'adt':'rna';
 Bio3D.text(mapping,110,474,1060,35,side?'Ищем код в словаре антител':'Сопоставляем фрагмент с референсом',side?'Look up the code in the antibody dictionary':'Map the fragment to the reference',24,C.white);
 Bio3D.text(mapping,110,516,1060,42,side?'GTCACTAG → anti-CD4':'ACTGACGA → ген CD4',side?'GTCACTAG → anti-CD4':'ACTGACGA → gene CD4',29,color);
 Bio3D.text(g,65,574,1150,32,'Учебные последовательности и соответствия. Drop-seq: R1/R2 — парные чтения.','Illustrative sequences and assignments. Drop-seq: R1/R2 are paired reads.',18,C.grey);
 return {g,fields,output,address,umi,letters,mapping,sequence};
});
const paired=Bio3D.text(labels,330,572,620,36,'Клетка A → два согласованных профиля','Cell A → two paired profiles',25,C.gold);
const connector=Bio3D.path(leaders,'M340 553 L340 563 L940 563 L940 553',C.gold,2);
const foot=Bio3D.text(labels,65,572,1150,36,'Длины спиралей не сравниваются. Подставки — группы, плитки — данные.','Helix lengths are not comparable. Stands group products; tiles represent data.',19,C.grey);
const poses=[];
function paint(){
 const s=st.split,b=st.prep,r=st.read,d=st.decode,k=st.pair;
 // Finish one close-up, pull back to the two branches, then enter the other.
 // This avoids passing the two enlarged DNA products through one another.
 const leave=1-F.phase(k,.22,.68),rnaFocus=F.phase(r,0,.5)*(1-F.phase(d,.18,.42))*leave,adtFocus=F.phase(d,.5,.72)*leave,focus=Math.max(rnaFocus,adtFocus);
 const zoom=1-14/64*s+34/64*focus,cam={cx:550+90*s,cy:399,scale:64*zoom};
 const rows=[300-20*b,300-20*b,380-40*b,300+40*b,300+100*b,380+20*b],centers=[];
 products.forEach((m,i)=>{
  const right=[1,2,5].includes(i),source=i<3?i:i===5?2:0,startY=[300,409,518][source],selected=i===0?rnaFocus:i===1?adtFocus:0;
  const baselineX=550+((right?940:340)-550)*s,baselineY=startY+(rows[i]-startY)*s,x=F.lerp(baselineX,640,selected),y=F.lerp(baselineY,285,selected);
  const visibility=i<3?1:F.phase(b,.08,.28),context=i===0?(1-.56*(1-F.phase(s,0,.4))):1;
  const alpha=visibility*context*(selected>0?1:1-F.phase(focus,0,.4)),parts=Object.fromEntries(m.parts.map(part=>[part.role,{opacity:alpha*(part.role==='linker'?.7:1)}]));
  poses[i]=V3.CodesMesh.pose([(x-cam.cx)/cam.scale,(cam.cy-y)/cam.scale,i===0?-.28:i<3?.34:(i-3)*.25],(right?4:-4)*s*(1-selected),14+20*s-6*selected,parts);poses[i].opacity=visibility;
  centers.push({x,y});
 });
 const contextVisible=1-F.phase(focus,0,.35),propVisible=F.phase(s,.55,1)*contextVisible,tileOpacity=F.phase(k,.72,.9);
 props.molecules.forEach((m,j)=>{
  const side=j%2,x=340+600*side,y=j<2?446:529,visible=j<2?propVisible:tileOpacity;
  poses[6+j]=V3.CodesMesh.pose([(x-cam.cx)/cam.scale,(cam.cy-y)/cam.scale,j<2?-1.2:0],j<2?(side?4:-4):0,j<2?34:12,Object.fromEntries(m.parts.map(part=>[part.role,{opacity:visible*(part.role==='linker'?.18:1)}])));
 });
 const stages=[{focus:rnaFocus,panel:F.phase(r,.60,.72)*(1-F.phase(d,0,.15))*(1-F.phase(k,0,.2)),travel:F.phase(r,.55,.78),bases:F.phase(r,.78,.93),mapped:F.phase(r,.94,1)},
 {focus:adtFocus,panel:F.phase(d,.78,.85)*(1-F.phase(k,0,.2)),travel:F.phase(d,.78,.88),bases:F.phase(d,.88,.96),mapped:F.phase(d,.97,1)}];
 stages.forEach((state,side)=>{
  const m=props.readouts[side],opacity=state.panel;
  poses[10+side]=V3.CodesMesh.pose([(640-cam.cx)/cam.scale,(cam.cy-410)/cam.scale,0],0,12,Object.fromEntries(m.parts.map(part=>[part.role,{opacity:opacity*(part.role==='linker'?.13:1)}])));
  const active=side?F.phase(d,.65,.78)*(1-F.phase(k,0,.2)):F.phase(r,.45,.55)*(1-F.phase(d,0,.15));
  ['cell','umi','feature'].forEach((key,j)=>{
   const start=V3.CodesMesh.project(dna.anchors[key],poses[side],cam),target=V3.CodesMesh.project(props.readouts[side].anchors[['cell','umi','sequence'][j]],poses[10+side],cam);
   const travel=state.travel,x=F.lerp(start.x,target.x,travel),y=F.lerp(start.y,target.y,travel),role=['primer','umi',side?'tag':'rna'][j];
   poses[12+side*3+j]=V3.CodesMesh.pose([(x-cam.cx)/cam.scale,(cam.cy-y)/cam.scale,.5+Math.sin(Math.PI*travel)],0,20,{[role]:{opacity:active*(1-F.phase(travel,.86,1))}});
  });
 });
 surface.paint({cellOpacity:0,magnification:zoom,panX:cam.cx-camera.cx*zoom,panY:cam.cy-camera.cy*zoom,moleculePoses:poses});
 F.opacity(initial,1-F.phase(s,0,.18));initialValues.forEach((g,i)=>F.opacity(g,i===0?.44+.56*s:1));
 headings.forEach(h=>F.opacity(h.el,F.phase(s,.7,1)*contextVisible));
 fields.forEach((f,i)=>{
  const alpha=F.phase(s,.8,1)*contextVisible;F.opacity(f.g,alpha);
  ['cell','umi','feature'].forEach((key,j)=>{
   const a=V3.CodesMesh.project(dna.anchors[key],poses[i],cam),w=[50,66,205][j],top=centers[i].y-62;
   f.texts[j].setBox({x:a.x-w/2,y:top,width:w,height:30});f.lines[j].setAttribute('d',`M${a.x} ${top+33} L${a.x} ${a.y-10}`);F.opacity(f.lines[j],alpha*.6);
  });
 });
 status.forEach(q=>{F.opacity(q.g,propVisible);F.opacity(q.split.el,(1-F.phase(b,0,.3))*(1-r));F.opacity(q.prep.el,F.phase(b,.7,1)*(1-r));F.opacity(q.decode.el,F.phase(k,.65,.9));});
 records.forEach(q=>F.opacity(q.g,tileOpacity));
 reading.forEach((q,side)=>{
  const state=stages[side];F.opacity(q.g,state.panel);
  q.fields.forEach((label,j)=>{const a=V3.CodesMesh.project(dna.anchors[['cell','umi','feature'][j]],poses[side],cam),w=[170,100,230][j];label.setBox({x:a.x-w/2,y:233,width:w,height:32});});
  F.opacity(q.output,F.phase(state.travel,.95,1));F.opacity(q.address.el,F.phase(state.bases,0,.12));F.opacity(q.umi.el,F.phase(state.bases,.05,.2));
  q.letters.forEach((letter,j)=>F.opacity(letter.el,F.phase(state.bases,j/9,(j+1)/9)));F.opacity(q.mapping,state.mapped);
 });
 F.opacity(connector,F.phase(k,.8,1));F.opacity(paired.el,F.phase(k,.85,1));F.opacity(foot.el,(1-F.phase(r,0,.2))*(1-k));
 F.opacity(preamble.el,1-F.phase(r,0,.15));F.opacity(dataPreamble.el,F.phase(k,.65,.9));
 Object.assign(v.root.dataset,{librariesSplit:String(s),librariesPrep:String(b),librariesRead:String(r),librariesDecode:String(d),librariesPair:String(k),librariesReadProgress:String(F.phase(r,.55,.78)),librariesRecords:d===1?'2':r===1?'1':'0',librariesCell:'A',librariesProducts:b===1?'6':'3',librariesRnaFocus:String(rnaFocus),librariesAdtFocus:String(adtFocus),librariesRnaBases:String(stages[0].bases),librariesAdtBases:String(stages[1].bases),librariesRnaMapped:String(stages[0].mapped),librariesAdtMapped:String(stages[1].mapped)});
}

Bio3D.motion(ctx,v,st,paint,[
 ['Те же ДНК-продукты. Вернёмся к этапу до секвенирования.','The same DNA products. Return to the stage before sequencing.'],
 ['После общей амплификации RNA- и ADT-продукты разделяют по размеру.','After common amplification, RNA and ADT products are separated by size.'],
 ['Каждую ветвь подготавливают отдельно. Копии сохраняют код A.','Prepare each branch separately. Copies retain barcode A.'],
 ['RNA: читаем кДНК; по фрагменту последовательности определяем ген.','RNA: read cDNA, then identify the gene from its sequence.'],
 ['ADT: читаем ДНК-код; по словарю определяем антитело.','ADT: read its DNA code, then identify the antibody in a dictionary.'],
 ['Код A связывает два профиля; UMI считают отдельно в каждом канале.','Barcode A pairs two profiles; UMIs are counted separately within each modality.']
],[{split:1},{prep:1},{read:1},{decode:1},{pair:1}],[3500,2800,6800,7800,3000]);paint();return v.root;
}});
})();
