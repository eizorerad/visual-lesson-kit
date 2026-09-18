/* Library preparation, sequencing and paired interpretation in a shared 3D view.
 * The collection stands and data tiles are spatial teaching metaphors, not
 * laboratory equipment. Products keep their identities; PCR copies are explicit. */
(function(){'use strict';
Bio3D.scene({id:'libraries',chapter:['Секвенирование','Sequencing'],title:['Две библиотеки. Один клеточный код.','Two libraries. One cell barcode.'],notes:[
['Вернёмся от примера подсчёта к подготовке библиотек, до секвенирования. Перед нами те же три учебных ДНК-продукта: один из мРНК и два родственных ADT-продукта. Они не возникли из записей данных. В исходном CITE-seq после разрушения эмульсии и извлечения бусин выполняют синтез и общую начальную амплификацию. Двойные спирали обобщают ДНК-продукты, а не изображают конкретный промежуточный комплекс.','Return from the counting example to library preparation, before sequencing. These are the same three teaching DNA products: one from mRNA and two related ADT products. They did not arise from data records. Original CITE-seq breaks the emulsion, recovers beads, then performs synthesis and common initial amplification. The helices summarize DNA products rather than a specific intermediate complex.'],
['После общей амплификации длинные продукты из мРНК и короткие ADT-продукты разделяют по размеру. Здесь они расходятся в две пространственные группы; это не физическое сито и не действие захватывающей бусины Drop-seq. Длины спиралей увеличены независимо от реальной длины: рисунок показывает принадлежность к фракциям, а не измеряет число нуклеотидов.','After common amplification, longer mRNA-derived products and shorter ADT products are separated by size. They move into two spatial groups here; this is neither a physical sieve nor the action of the Drop-seq capture bead. Helices are enlarged independently of sequence length: the view shows fraction membership, not nucleotide counts.'],
['Ветви подготавливают отдельно. В исходном протоколе RNA-ветвь проходит тагментацию и подготовку библиотеки; ADT-ветвь — специальную PCR с праймерами для секвенирования. Появляющиеся спирали — условные PCR-потомки выбранных примеров, не новые захваченные молекулы. Все потомки сохраняют происхождение клеточного кода A; фиолетовые UMI выбранных семейств — GCT и TGA. Адаптеры и реальные размеры здесь не детализируются.','The branches are prepared separately. In the original protocol, the RNA branch undergoes tagmentation and library preparation; the ADT branch undergoes dedicated PCR with sequencing primers. Emerging helices are schematic PCR descendants of the selected examples, not newly captured molecules. Descendants retain cell barcode A; the selected families retain UMIs GCT and TGA. Adapters and actual fragment sizes are not detailed here.'],
['Обе библиотеки секвенируют; их можно объединять в пул. Движущиеся объёмные маркеры показывают перенос информации от ДНК к чтениям. Это не изображение прибора, фотонов или полного цикла sequencing-by-synthesis. ДНК остаются в своих группах; снизу появляются отдельные объекты данных. Число маркеров условно.','Both libraries are sequenced and may be pooled. Moving 3D markers trace information from DNA to reads. They do not depict an instrument, photons or a full sequencing-by-synthesis cycle. DNA remains in its groups; distinct data objects appear below. Marker counts are schematic.'],
['Признак RNA определяют картированием последовательности на транскрипт или ген: здесь CD4. ADT-признак определяют поиском искусственного кода в словаре антител: здесь anti-CD4. Это два разных типа измерений. Клеточный код считывают из соответствующего участка библиотечной молекулы; размер молекулы не определяет клетку.','RNA identity is determined by mapping sequence to a transcript or gene, CD4 here. ADT identity comes from matching a synthetic code to the antibody dictionary, anti-CD4 here. These are different measurements. The cell barcode is read from its library segment; molecule size does not identify the cell.'],
['Один клеточный код A связывает два результата. После контроля качества, коррекции кодов и UMI-дедупликации внутри клетки и признака получают RNA- и ADT-профили. Библиотеки и UMI из разных каналов не сливают в один молекулярный отсчёт. Следующий слайд показывает отдельный вымышленный пример двух матриц для нескольких клеток.','Shared cell barcode A links the two results. Quality control, barcode correction and UMI deduplication within cell and feature yield RNA and ADT profiles. Libraries and UMIs from different modalities are not merged into one molecular count. The next slide shows a separate invented example of two matrices for several cells.']
],qa:[['Почему разделение не теряет адрес клетки?','Why does separation preserve the cell address?','Клеточный код уже включён в ДНК-продукты. Разделение и подготовка библиотек сохраняют эту информацию.','The cell barcode is already incorporated into the DNA products. Separation and library preparation retain that information.'],['Здесь показан реальный размер молекул?','Are molecular sizes shown to scale?','Нет. Геометрия увеличена для чтения кодов; в исходном протоколе фракции разделяют по реальной длине продуктов.','No. Geometry is enlarged to inspect codes; the original protocol separates fractions by actual product length.']],build(ctx){
const v=Bio3D.stage(ctx,'Две библиотеки. Один клеточный код.','Two libraries. One cell barcode.'),st={split:0,prep:0,read:0,decode:0,pair:0};
const dna=V3.CodesMesh.create(),props=V3.LibrariesMesh.create(),camera={cx:550,cy:399,scale:64};
const clones=[0,0,2].map((i,j)=>({...dna.molecules[i],id:['rna-cd4-gct-pcr-1','rna-cd4-gct-pcr-2','adt-cd4-tga-pcr-2'][j],parentId:dna.molecules[i].id}));
const products=[...dna.molecules,...clones],definitions=[...products,...props.molecules,...props.markers];
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
 const raw=Bio3D.text(g,0,0,370,34,i?'Чтения ADT':'Чтения RNA',i?'ADT reads':'RNA reads',23,i?C.teal:C.blue);
 const decoded=Bio3D.text(g,0,0,370,34,i?'A · anti-CD4 · TGA':'A · CD4 · GCT',i?'A · anti-CD4 · TGA':'A · CD4 · GCT',23,i?C.teal:C.blue);
 return {g,raw,decoded};
});
const paired=Bio3D.text(labels,330,572,620,36,'Клетка A → два согласованных профиля','Cell A → two paired profiles',25,C.gold);
const connector=Bio3D.path(leaders,'M340 553 L340 563 L940 563 L940 553',C.gold,2);
const foot=Bio3D.text(labels,65,572,1150,36,'Длины спиралей не сравниваются. Подставки — группы, плитки — данные.','Helix lengths are not comparable. Stands group products; tiles represent data.',19,C.grey);
const sequencing=Bio3D.text(labels,285,515,710,42,'Секвенирование → чтения данных','Sequencing → read data',26,C.white);
const poses=[];
function paint(){
 const s=st.split,b=st.prep,r=st.read,d=st.decode,k=st.pair,zoom=1-14/64*s,cam={cx:550+90*s,cy:399,scale:64*zoom};
 const rows=[300-20*b,300-20*b,380-40*b,300+40*b,300+100*b,380+20*b];
 const centers=[];
 products.forEach((m,i)=>{
  const right=[1,2,5].includes(i),source=i<3?i:i===5?2:0,startY=[300,409,518][source],x=550+((right?940:340)-550)*s,y=startY+(rows[i]-startY)*s;
  const visibility=i<3?1:F.phase(b,.08,.28),context=i===0?(1-.56*(1-F.phase(s,0,.4))):1;
  const alpha=visibility*context,parts=Object.fromEntries(m.parts.map(part=>[part.role,{opacity:alpha*(part.role==='linker'?.7:1)}]));
  poses[i]=V3.CodesMesh.pose([(x-cam.cx)/cam.scale,(cam.cy-y)/cam.scale,i===0?-.28:i<3?.34:(i-3)*.25],(right?4:-4)*s,14+20*s,parts);poses[i].opacity=visibility;
  centers.push({x,y});
 });
 const propVisible=F.phase(s,.55,1),tileOpacity=F.phase(r,.78,.98);
 props.molecules.forEach((m,j)=>{
  const side=j%2,x=340+600*side,y=j<2?446:529,visible=j<2?propVisible:tileOpacity;
  poses[6+j]=V3.CodesMesh.pose([(x-cam.cx)/cam.scale,(cam.cy-y)/cam.scale,j<2?-1.2:0],j<2?(side?4:-4):0,j<2?34:12,Object.fromEntries(m.parts.map(part=>[part.role,{opacity:visible*(part.role==='linker'?.18:1)}])));
 });
 // The 3D information markers are not molecules and never change product identity.
 const travel=F.phase(r,.12,.78);
 props.markers.forEach((m,j)=>{
  const side=j%2,start=V3.CodesMesh.project(dna.anchors.end,poses[side],cam),target={x:340+600*side,y:529};
  const x=start.x+(target.x-start.x)*travel,y=start.y+(target.y-start.y)*travel;
  poses[6+props.molecules.length+j]=V3.CodesMesh.pose([(x-cam.cx)/cam.scale,(cam.cy-y)/cam.scale,.5+Math.sin(Math.PI*travel)*1.4],0,20,{[side?'tag':'rna']:{opacity:F.phase(r,0,.12)*(1-F.phase(r,.78,.95))}});
 });
 surface.paint({cellOpacity:0,magnification:zoom,panX:cam.cx-camera.cx*zoom,panY:cam.cy-camera.cy*zoom,moleculePoses:poses});
 F.opacity(initial,1-F.phase(s,0,.18));initialValues.forEach((g,i)=>F.opacity(g,i===0?.44+.56*s:1));
 headings.forEach(h=>F.opacity(h.el,F.phase(s,.7,1)));
 fields.forEach((f,i)=>{
  const alpha=F.phase(s,.8,1);F.opacity(f.g,alpha);
  ['cell','umi','feature'].forEach((key,j)=>{
   const a=V3.CodesMesh.project(dna.anchors[key],poses[i],cam),w=[50,66,205][j],top=centers[i].y-62;
   f.texts[j].setBox({x:a.x-w/2,y:top,width:w,height:30});f.lines[j].setAttribute('d',`M${a.x} ${top+33} L${a.x} ${a.y-10}`);F.opacity(f.lines[j],alpha*.6);
  });
 });
 status.forEach(q=>{F.opacity(q.g,propVisible);F.opacity(q.split.el,(1-F.phase(b,0,.3))*(1-r));F.opacity(q.prep.el,F.phase(b,.7,1)*(1-r));F.opacity(q.decode.el,F.phase(d,.65,1));});
 records.forEach((q,i)=>{const x=155+600*i;F.opacity(q.g,tileOpacity);q.raw.setBox({x,y:512,width:370,height:34});q.decoded.setBox({x,y:512,width:370,height:34});F.opacity(q.raw.el,1-F.phase(d,0,.3));F.opacity(q.decoded.el,F.phase(d,.65,1));});
 F.opacity(sequencing.el,F.phase(r,0,.15)*(1-F.phase(r,.60,.76)));F.opacity(connector,F.phase(k,.4,1));F.opacity(paired.el,F.phase(k,.65,1));F.opacity(foot.el,1-F.phase(k,0,.3));
 F.opacity(preamble.el,1-F.phase(r,0,.15));F.opacity(dataPreamble.el,F.phase(r,.25,.5));
 Object.assign(v.root.dataset,{librariesSplit:String(s),librariesPrep:String(b),librariesRead:String(r),librariesDecode:String(d),librariesPair:String(k),librariesReadProgress:String(travel),librariesRecords:tileOpacity===1?'2':'0',librariesCell:'A',librariesProducts:b===1?'6':'3'});
}
Bio3D.motion(ctx,v,st,paint,[
 ['Те же ДНК-продукты. Вернёмся к этапу до секвенирования.','The same DNA products. Return to the stage before sequencing.'],
 ['После общей амплификации RNA- и ADT-продукты разделяют по размеру.','After common amplification, RNA and ADT products are separated by size.'],
 ['Каждую ветвь подготавливают отдельно. Копии сохраняют код A.','Prepare each branch separately. Copies retain barcode A.'],
 ['Секвенирование переносит информацию из обеих библиотек в чтения.','Sequencing transfers information from both libraries into reads.'],
 ['RNA: узнаём ген. ADT: узнаём антитело по словарю кодов.','RNA: identify the gene. ADT: identify the antibody using its barcode dictionary.'],
 ['Код A связывает два профиля; UMI считают отдельно в каждом канале.','Barcode A pairs two profiles; UMIs are counted separately within each modality.']
],[{split:1},{prep:1},{read:1},{decode:1},{pair:1}],[3500,2800,3200,1800,2200]);paint();return v.root;
}});
})();
