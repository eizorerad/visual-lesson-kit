/* Optional neighboring topics in the molecular atlas. */
(function(){
 'use strict';
 if(!window.MOLECULAR_ATLAS)return;
 const {add,H}=window.MOLECULAR_ATLAS;
 const unit=v=>Math.max(0,Math.min(1,v));
 add('atlas-cas12a','Cas12a: ДНК и совместимая crRNA','Cas12a: DNA and a compatible crRNA',
  ['Cas12a распознаёт мишень в ДНК с помощью своей crRNA.','Природной системе Cas12a не требуется отдельная tracrRNA.'],
  ['Cas12a recognizes a DNA target using its own crRNA.','Natural Cas12a does not require a separate tracrRNA.'],
  ['Слева белок, справа направляющая, внизу ДНК-мишень: это отдельные элементы схемы, ещё не собранный комплекс. Силуэт ориентирован на AsCas12a в PDB 5B43. Канал между долями оставлен открытым для РНК–ДНК гибрида.','Cas12a использует crRNA с подходящей структурной ручкой. Она отличается от каркаса Cas9; направляющие разных семейств не взаимозаменяемы. Раздвигание долей — пояснительный разбор рисунка. Рисунок не выполняет разрез и не обозначает белок как dCas12a; каталитическое состояние задаёт автор урока.'],
  ['Protein, guide and target DNA are drawn separately; this is not yet an assembled complex. The silhouette is informed by AsCas12a in PDB 5B43, leaving a channel for the RNA–DNA hybrid.','Cas12a uses a crRNA with a compatible structural handle. It differs from the Cas9 scaffold; guides are not freely interchangeable across families. Lobe separation is an explanatory exploded view. The drawing does not cut or establish that the protein is dCas12a; the lesson must state catalytic status.'],
  'https://www.rcsb.org/structure/5B43','Yamano et al., Cell, 2016 · PDB 5B43',v=>{
   const cas=B.cas12a(v.svg,{x:345,y:360,scale:1.8});const guide=B.guide(v.svg,{x:947,y:355,scale:1.8,family:'cas12a'});
   const dna=B.dna(v.svg,{x:640,y:521,width:960,amplitude:10,period:85});
   H.text(v.svg,150,164,390,80,'Белок Cas12a','Cas12a protein',30,C.blue);
   H.text(v.svg,757,164,410,80,'Направляющая crRNA','crRNA guide',30,C.teal);
   H.text(v.svg,450,549,380,48,'Мишень: ДНК','Target: DNA',27,C.blue);
   return {paint:s=>{const p=unit(s.p);cas.set({opening:.35*p});B.emphasis(guide,{level:'focus',part:'direct-repeat-handle',amount:p});B.emphasis(dna,{level:'normal'});}};
  },{qa:[{q:'Можно использовать sgRNA от Cas9?',a:'<p>Обычно нет. Cas12a распознаёт собственную совместимую crRNA; его природной системе не нужна отдельная tracrRNA.</p>',url:'https://doi.org/10.1016/j.cell.2015.09.038',source:'Zetsche et al., Cell, 2015'}],enQa:[{q:'Can a Cas9 sgRNA be used here?',a:'<p>Generally no. Cas12a recognizes its own compatible crRNA; its natural system does not need a separate tracrRNA.</p>',url:'https://doi.org/10.1016/j.cell.2015.09.038',source:'Zetsche et al., Cell, 2015'}]});

 add('atlas-cas13','Cas13: направляющая ведёт к РНК','Cas13: the guide leads to RNA',
  ['В этом примере Cas13a узнаёт РНК по комплементарности crRNA.','Направляющая РНК и РНК-мишень — две разные молекулы.'],
  ['In this example, Cas13a recognizes RNA through crRNA complementarity.','The guide RNA and target RNA are two separate molecules.'],
  ['Показан Cas13a, а не универсальная форма всех белков Cas13. Структура LbuCas13a PDB 5XWP даёт референс удлинённой архитектуры и центрального канала. crRNA и РНК-мишень показаны отдельно; белок не содержит встроенных рисунков направляющей или субстрата.','В активном Cas13a два HEPN-региона образуют каталитический центр; некоторые Cas13 после распознавания способны также расщеплять посторонние РНК. Здесь показана организация узнавания, без разреза. Для dCas13 автор должен отдельно указать инактивацию катализа. Этим объяснение отличается от подавления транскрипции с dCas9–KRAB.'],
  ['This depicts Cas13a, not a universal shape for all Cas13 proteins. LbuCas13a PDB 5XWP informs its elongated architecture and central channel. The crRNA and RNA target are separate; neither guide nor substrate is embedded in the protein actor.','In active Cas13a, two HEPN regions form a catalytic site; some Cas13 proteins can also cleave collateral RNAs after recognition. This scene shows recognition architecture without cleavage. A lesson using dCas13 must explicitly state catalytic inactivation. This differs from transcriptional repression by dCas9–KRAB.'],
  'https://www.rcsb.org/structure/5XWP','Liu et al., Cell, 2017 · PDB 5XWP',v=>{
   const cas=B.cas13(v.svg,{x:345,y:360,scale:1.55});const guide=B.guide(v.svg,{x:947,y:355,scale:1.8,family:'cas13',spacerColor:C.gold});
   const points=[];for(let i=0;i<=80;i++)points.push([160+12*i,518+Math.sin(i*.35)*6]);F.path(v.svg,points,C.purple,1.55);
   H.text(v.svg,130,164,430,80,'Белок Cas13a','Cas13a protein',30,C.purple);
   H.text(v.svg,757,164,410,80,'Направляющая crRNA','crRNA guide',30,C.teal);
   H.text(v.svg,450,549,380,48,'Мишень: РНК','Target: RNA',27,C.purple);
   return {paint:s=>{const p=unit(s.p);cas.set({opening:.3*p});B.emphasis(guide,{level:'focus',part:'spacer',amount:p});}};
  },{qa:[{q:'Cas13 и dCas9–KRAB подавляют ген одинаково?',a:'<p>Нет. Cas13 направляют к РНК, а dCas9–KRAB — к ДНК для репрессии транскрипции. Каталитическую активность конкретного Cas13 нужно оговорить отдельно.</p>',url:'https://doi.org/10.1016/j.cell.2017.06.050',source:'Liu et al., Cell, 2017'}],enQa:[{q:'Do Cas13 and dCas9–KRAB suppress genes in the same way?',a:'<p>No. Cas13 is directed to RNA, whereas dCas9–KRAB binds DNA to repress transcription. The catalytic status of the particular Cas13 must be stated separately.</p>',url:'https://doi.org/10.1016/j.cell.2017.06.050',source:'Liu et al., Cell, 2017'}]});

 add('atlas-splicing','Сплайсинг: интрон уходит из РНК','Splicing: an intron leaves the RNA',
  ['Пре-мРНК содержит экзоны и интрон между ними.','Первый шаг образует ветвление: интрон становится лассо.','Второй шаг соединяет экзоны и освобождает интрон.'],
  ['A pre-mRNA contains exons with an intron between them.','The first reaction creates a branch: the intron forms a lariat.','The second reaction joins the exons and releases the intron.'],
  ['Это условная пре-мРНК с одним интроном; ширина сегментов не задаёт число нуклеотидов. Синие и бирюзовые участки обозначают экзоны: экзон не обязательно целиком кодирует белок. Кепирование и полиаденилирование здесь опущены.','При первом трансэтерифицировании 2′-OH аденозина точки ветвления участвует в разрыве границы 5′-экзона и образовании связи 2′–5′ с началом интрона. 5′-экзон освобождается, интрон пока остаётся связан с 3′-экзоном. Точный атомный механизм и последовательность не нарисованы.','При втором трансэтерифицировании экзоны соединяются, а интронное лассо отделяется. Это те же участки РНК, что были в начале; соответствующий участок ДНК не удаляется. Движение условно: длительность анимации не отражает природную скорость сплайсинга.'],
  ['This is an illustrative pre-mRNA with one intron; segment widths do not encode nucleotide counts. Blue and teal regions are exons, which need not be entirely protein-coding. Capping and polyadenylation are omitted.','In the first transesterification, the branchpoint adenosine 2′-OH participates in cleavage at the 5′ exon boundary and formation of a 2′–5′ linkage to the intron start. The 5′ exon is freed; the intron remains attached to the 3′ exon. Exact atomic chemistry and sequence are not drawn.','The second transesterification joins exons and releases the intron lariat. These are the same RNA segments as at the start; the corresponding DNA is not deleted. Motion is illustrative, and animation duration is not a natural splicing rate.'],
  'https://www.rcsb.org/structure/5MQF','Bertram et al., Nature, 2017 · PDB 5MQF',v=>{
   const rna=B.preMrna(v.svg,{x:640,y:335,width:900});
   H.text(v.svg,135,164,320,80,'Экзон 1','Exon 1',30,C.blue);
   H.text(v.svg,825,164,320,80,'Экзон 2','Exon 2',30,C.teal);
   H.text(v.svg,490,164,300,80,'Интрон','Intron',30,C.gold);
   H.text(v.svg,90,470,370,96,'Меняется РНК;\nДНК сохраняется','RNA is processed;\nDNA is retained',28,C.grey);
   const lariat=H.text(v.svg,870,447,300,98,'Интронное\nлассо','Intron\nlariat',28,C.gold);
   return {paint:s=>{rna.set({spliced:unit(s.p/2)});H.opacity(lariat,unit(s.p));B.emphasis(rna,{level:s.p<.05?'normal':'focus',part:'intron',amount:unit(s.p)});}};
  },{qa:[{q:'Сплайсинг удаляет интрон из генома?',a:'<p>Нет. Обычный сплайсинг обрабатывает РНК. Соответствующий участок ДНК остаётся в геноме, а экзоны соединяются в продукте РНК.</p>',url:'https://www.rcsb.org/structure/5MQF',source:'Bertram et al., Nature, 2017'}],enQa:[{q:'Does splicing delete an intron from the genome?',a:'<p>No. Ordinary splicing processes RNA. The corresponding DNA remains in the genome, while exons are joined in the RNA product.</p>',url:'https://www.rcsb.org/structure/5MQF',source:'Bertram et al., Nature, 2017'}]});

 add('atlas-spliceosome','Сплайсосома: белки работают вместе с РНК','Spliceosome: proteins work together with RNA',
  ['Сплайсосома — комплекс многих белков и малых ядерных РНК.','РНК U2 и U6 участвуют в каталитическом центре; U5 удерживает экзоны.'],
  ['The spliceosome contains many proteins and small nuclear RNAs.','U2 and U6 help form the catalytic core; U5 positions the exons.'],
  ['Референс — человеческий комплекс C* (PDB 5MQF). Схема выделяет белковый каркас и РНК U2, U5, U6, характерные для каталитического этапа главной сплайсосомы. Она не изображает все субъединицы и не показывает ранние этапы с U1 и U4.','Раздвинутый вид раскрывает состав комплекса, а не последовательность сборки. U2 и U6 формируют РНК-часть активного центра вместе с окружающими белками; U5 помогает позиционировать экзоны. Три цвета РНК обозначают три выбранные молекулы, а не точные копийности всех компонентов.'],
  ['The reference is human C* complex PDB 5MQF. This schematic highlights a protein scaffold and the U2, U5 and U6 RNAs associated with the major spliceosome catalytic stage. It omits many subunits and earlier stages involving U1 and U4.','The exploded view explains composition, not assembly order. U2 and U6 form the RNA portion of the active center with surrounding proteins; U5 helps position exons. Three RNA colors represent three selected molecules, not a complete component stoichiometry.'],
  'https://www.rcsb.org/structure/5MQF','Bertram et al., Nature, 2017 · PDB 5MQF',v=>{
   const splice=B.spliceosome(v.svg,{x:610,y:376,scale:1.15});
   H.text(v.svg,90,167,420,82,'Белки + малые ядерные РНК','Proteins + small nuclear RNAs',28,C.blue);
   H.text(v.svg,825,172,350,100,'U2 · U5 · U6','U2 · U5 · U6',30,C.teal);
   const left=H.text(v.svg,130,526,410,72,'Каталитическое ядро РНК','Catalytic RNA core',28,C.gold);
   const right=H.text(v.svg,750,526,400,72,'Белковое окружение','Protein environment',28,C.blue);
   return {paint:s=>{const p=unit(s.p);splice.set({separation:p});B.emphasis(splice,{level:'focus',part:'u6-snrna',amount:p});H.opacity(left,p);H.opacity(right,p);}};
  },{qa:[{q:'Сплайсосома — это один белок?',a:'<p>Нет. Это динамический рибонуклеопротеиновый комплекс. Малые ядерные РНК и многие белки вместе распознают субстрат и обеспечивают сплайсинг.</p>',url:'https://www.rcsb.org/structure/5MQF',source:'Bertram et al., Nature, 2017'}],enQa:[{q:'Is the spliceosome a single protein?',a:'<p>No. It is a dynamic ribonucleoprotein complex. Small nuclear RNAs and many proteins jointly recognize the substrate and support splicing.</p>',url:'https://www.rcsb.org/structure/5MQF',source:'Bertram et al., Nature, 2017'}]});
})();
