/* Original molecular specimens. Load after molecular-gallery.js. */
(function(){'use strict';
if(!window.MOLECULAR_ATLAS)return;
const H=MOLECULAR_ATLAS.H,entry=MOLECULAR_ATLAS.add;
entry('atlas-dna','ДНК: две цепи, один адрес','DNA: two strands, one address',
 ['Две цепи удерживаются комплементарным спариванием оснований.','Локальное раскрытие позволяет прочитать одну цепь.'],['Complementary base pairing holds the two strands together.','Local opening exposes one strand for recognition.'],
 ['Двойная спираль — две полинуклеотидные цепи. Поперечные штрихи обозначают пары оснований; схема не задаёт реальную последовательность.','Раскрытие условного участка иллюстрирует доступ к основаниям. Это не разрез сахарофосфатной цепи и не вычисленная траектория движения.'],
 ['The double helix contains two polynucleotide strands. Rungs represent base pairs; no real sequence is encoded.','Opening an illustrative region exposes bases. The backbone is not cut; motion is not a computed molecular trajectory.'],
 'https://www.rcsb.org/structure/4UN3','Anders et al., 2014 · PDB 4UN3',v=>{
 const d=B.dna(v.svg,{x:640,y:340,width:1020,amplitude:27,period:130});
 H.text(v.svg,110,175,350,60,'Двойная спираль','Double helix',30,C.blue);
 H.text(v.svg,820,175,350,60,'Цепи остаются целыми','Backbones remain intact',27,C.teal);
 const label=H.text(v.svg,460,457,360,76,'Основания доступны','Bases are exposed',30,C.gold);
 return {paint:s=>{d.set({open:s.p,openWidth:240});H.opacity(label,s.p);}};
});
entry('atlas-guide','Направляющая РНК: адрес и каркас','Guide RNA: address and scaffold',
 ['Спейсер узнаёт ДНК; структурная часть связывает Cas9.','В sgRNA две природные РНК соединены в одну молекулу.'],['The spacer recognizes DNA; the structural region binds Cas9.','An sgRNA joins the two natural RNAs into one molecule.'],
 ['crRNA несёт адресную часть. tracrRNA спаривается с crRNA и участвует в формировании структуры для Cas9. Цвет здесь обозначает функцию, а не атомный состав.','sgRNA — инженерное объединение crRNA и tracrRNA. Соединение на рисунке объясняет устройство конструкции, а не реакцию сшивания внутри клетки.'],
 ['crRNA carries the targeting region. tracrRNA pairs with crRNA and contributes the Cas9-binding structure. Colors represent function, not atom types.','An sgRNA is an engineered fusion of crRNA and tracrRNA. Joining the drawing explains the design, not a ligation reaction inside a cell.'],
 'https://doi.org/10.1126/science.1225829','Jinek et al., Science, 2012',v=>{
 const r=B.guide(v.svg,{x:650,y:335,scale:3,dual:true});
 H.text(v.svg,120,160,440,65,'Спейсер = адрес','Spacer = address',31,C.gold);
 H.text(v.svg,730,160,430,65,'Каркас = связь с Cas9','Scaffold = Cas9 binding',30,C.teal);
 const t=H.text(v.svg,400,525,480,64,'sgRNA: одна цепь РНК','sgRNA: one RNA chain',31,C.teal);
 return {paint:s=>{r.set({joined:s.p});B.emphasis(r,{level:'focus',part:'engineered-join',amount:s.p});H.opacity(t,s.p);}};
});
entry('atlas-cas9','dCas9: белок с каналом для ДНК','dCas9: a protein with a DNA channel',
 ['Две доли Cas9 окружают комплекс РНК–ДНК.','dCas9 удерживает адрес, сохраняя обе цепи ДНК.'],['Two Cas9 lobes surround the RNA–DNA complex.','dCas9 holds the target while preserving both DNA strands.'],
 ['Силуэт вдохновлён Cas9 в структуре PDB 4UN3 и рисунком PDB-101. Сохранены доли и центральный канал; мелкие атомные детали опущены.','dCas9 — каталитически неактивный Cas9. Его распознавание мишени сохраняется, но обычный двуцепочечный разрез не выполняется.'],
 ['The silhouette is informed by PDB 4UN3 and PDB-101. Lobes and the central channel remain recognizable; atomic details are omitted.','dCas9 is catalytically inactive Cas9. It retains targeting but does not perform the normal double-strand cleavage.'],
 'https://pdb101.rcsb.org/motm/181','PDB-101 · Cas9 / 4UN3',v=>{
 const dna=B.dna(v.svg,{x:640,y:369,width:960,amplitude:20,period:125});const cas=B.cas9(v.svg,{x:430,y:300,scale:2.25});
 const r=B.guide(v.svg,{x:845,y:277,scale:1.6});
 H.text(v.svg,110,160,300,50,'Белковый якорь','Protein anchor',29,C.blue);
 H.text(v.svg,870,450,270,95,'Связывает ДНК\nбез разреза','Binds DNA\nwithout cutting',29,C.teal);
 return {paint:s=>{B.place(cas,F.lerp(430,630,s.p),F.lerp(290,369,s.p),2.25);B.place(r,F.lerp(850,735,s.p),F.lerp(275,334.2,s.p),1.6);r.set({bound:s.p});dna.set({open:s.p,openWidth:360});opCas();function opCas(){H.opacity(cas,1-.67*s.p);}}};
});
entry('atlas-polymerase','РНК-полимераза: молекулярная машина','RNA polymerase: a molecular machine',
 ['ДНК проходит через канал полимеразы.','По мере продвижения полимеразы удлиняется новая РНК.'],['DNA passes through the polymerase channel.','A new RNA strand extends as polymerase advances.'],
 ['Контур полимеразы основан на структурном образе PDB-101. Pol II — комплекс белковых субъединиц; на рисунке они сведены к нескольким долям.','Полимераза синтезирует РНК в направлении 5′ → 3′. Растущий 3′-конец находится у активного центра. Движение и длина РНК на рисунке условны.'],
 ['The polymerase outline follows the structural motif shown in PDB-101. Pol II has multiple protein subunits, simplified here into a few lobes.','Polymerase synthesizes RNA 5′ → 3′. The growing 3′ end remains at the active center. Motion and RNA length are illustrative.'],
 'https://pdb101.rcsb.org/motm/40','PDB-101 · RNA polymerase',v=>{
 const dna=B.dna(v.svg,{x:640,y:360,width:1050,amplitude:21,period:115});const pol=B.polymerase(v.svg,{x:350,y:360,scale:1.7});
 const r=F.path(v.svg,[[340,340],[280,240]],C.gold,1.9);
 H.text(v.svg,840,165,340,50,'Новая РНК','New RNA',31,C.gold);
 H.text(v.svg,140,480,460,60,'ДНК служит матрицей','DNA serves as the template',29,C.blue);
 return {paint:s=>{const x=350+s.p*480;B.place(pol,x,360,1.7);dna.set({open:1,openX:x-640,openWidth:150});r.setAttribute('d',`M${x-5} 348 Q${x-40} 262 ${x-130} 262 Q${x-220} 210 ${x-250-190*s.p} 249`);}};
});
entry('atlas-nucleosome','Нуклеосома: ДНК вокруг гистонов','Nucleosome: DNA around histones',
 ['ДНК оборачивается вокруг гистонового ядра.','Метка H3K9me3 находится на гистоне, а не на ДНК.'],['DNA wraps around a histone core.','H3K9me3 is a histone mark, not a DNA mark.'],
 ['Нуклеосома содержит ДНК и гистоновый октамер. Рисунок сохраняет мотив обёрнутой нити и выступающих хвостов; масштаб условный.','H3K9me3 означает три метильные группы на лизине 9 гистона H3. В KRAB-репрессии эту метку связывают с SETDB1 и белками HP1.'],
 ['A nucleosome consists of DNA and a histone octamer. The drawing retains wrapped strands and protruding tails; scale is schematic.','H3K9me3 denotes trimethylation of lysine 9 on histone H3. In KRAB repression, this mark is associated with SETDB1 and HP1 proteins.'],
 'https://www.rcsb.org/structure/5AV9','PDB 5AV9 · human nucleosome',v=>{
 const n=B.nucleosome(v.svg,{x:560,y:360,scale:2.7});
 H.text(v.svg,80,174,350,60,'ДНК','DNA',31,C.blue);
 H.text(v.svg,800,278,340,70,'Гистоновые хвосты','Histone tails',30,C.purple);
 const m=H.text(v.svg,850,420,310,90,'H3K9me3\nметка на H3','H3K9me3\nmark on H3',30,C.red);
 return {paint:s=>{n.set({marked:s.p});B.emphasis(n,{level:'focus',part:'histone-methylation',amount:s.p});H.opacity(m,s.p);}};
});
entry('atlas-partners','Партнёры KRAB: роли и связи','KRAB partners: roles and interactions',
 ['У каждого участника своя роль в локальной репрессии.','Собирается сеть взаимодействий; форма белков здесь условна.'],['Each partner has a distinct role in local repression.','An interaction network assembles; these protein shapes are illustrative.'],
 ['KRAB привлекает KAP1, также называемый TRIM28. SETDB1 модифицирует гистоны; HP1 распознаёт H3K9me3; NuRD участвует в деацетилировании и ремоделировании хроматина.','Здесь фигуры — мнемонические обозначения, не структуры из PDB. Связи не задают обязательный порядок присоединения или постоянную стехиометрию.'],
 ['KRAB recruits KAP1, also called TRIM28. SETDB1 modifies histones; HP1 recognizes H3K9me3; NuRD contributes deacetylation and chromatin remodeling.','These shapes are mnemonic symbols, not PDB structures. Links do not specify obligatory assembly order or fixed stoichiometry.'],
 'https://journals.plos.org/plosgenetics/article?id=10.1371/journal.pgen.1000869','Groner et al., PLoS Genetics, 2010',v=>{
 const names=['KRAB','KAP1','SETDB1','HP1','NuRD'];const kinds=['krab','kap1','setdb1','hp1','nurd'];
 const roles=[['привлекает','recruits'],['платформа','scaffold'],['ставит метки','writes marks'],['читает метки','reads marks'],['меняет хроматин','changes chromatin']];
 const actors=names.map((name,i)=>{const x=175+i*230;const a=B.protein(v.svg,{x,y:340,scale:1.1,kind:kinds[i],color:[C.red,C.teal,C.gold,C.purple,C.blue][i]});H.text(v.svg,x-95,190,190,50,name,name,29);H.text(v.svg,x-100,455,200,90,roles[i][0],roles[i][1],24,C.grey);return a;});
 const links=[F.path(v.svg,[[245,340],[325,340]],C.grey,2),...([635,865,1095].map(x=>F.path(v.svg,[[405,282],[405,263],[x,263],[x,282]],C.grey,1.5)))];
 return {paint:s=>links.forEach(l=>F.revealStroke(l,s.p))};
});
entry('atlas-ribosome','Рибосома: две субъединицы','Ribosome: two subunits',
 ['Рибосома состоит из РНК и белков. Через неё проходит мРНК.','Разнесём субъединицы, чтобы увидеть их устройство.'],
 ['The ribosome contains RNA and proteins. mRNA passes through it.','Separate the subunits to inspect their organization.'],
 ['Большая и малая субъединицы образуют рибонуклеопротеиновый комплекс. Силуэт сохраняет общие черты структурного референса; это не точная 70S- или 80S-структура. Показанная нить — мРНК, не ДНК.','Раздвижение — приём показа, а не реальная траектория сборки. Центр декодирования находится в малой субъединице, образование пептидной связи — в большой. мРНК движется в интерфейсе между ними.'],
 ['Large and small subunits form a ribonucleoprotein complex. The silhouette retains general structural features; it is not an exact 70S or 80S structure. The displayed strand is mRNA, not DNA.','Separation is an exploded view, not a real assembly trajectory. Decoding occurs in the small subunit; peptide-bond formation occurs in the large subunit. mRNA passes through their interface.'],
 'https://www.rcsb.org/structure/4V5D','Voorhees et al., 2009 · PDB 4V5D',v=>{
 const m=B.mrna(v.svg,{x:640,y:371,width:1000,color:C.gold}),r=B.ribosome(v.svg,{x:640,y:355,scale:1.7});
 H.text(v.svg,82,155,380,70,'РНК + белки','RNA + proteins',30,C.grey);
 H.text(v.svg,875,230,320,96,'Большая\nсубъединица','Large\nsubunit',29,C.blue);
 H.text(v.svg,875,447,320,96,'Малая\nсубъединица','Small\nsubunit',29,C.teal);
 H.text(v.svg,95,460,280,65,'мРНК','mRNA',29,C.gold);
 return {paint:s=>{r.set({separation:s.p*.65});B.place(m,640,372+35*s.p*.65*1.7);B.emphasis(r,{level:'focus',part:'large-subunit',amount:s.p*.65});}};
});
entry('atlas-trna','тРНК: адаптер между кодоном и аминокислотой','tRNA: linking a codon to an amino acid',
 ['Антикодон и место присоединения аминокислоты — разные участки.','Аминокислота присоединяется к 3′-концу тРНК.'],
 ['The anticodon and amino-acid attachment site are separate regions.','An amino acid attaches to the 3′ end of the tRNA.'],
 ['Это схема вторичной структуры в виде клеверного листа: стебли и петли показаны отдельно. Реальная пространственная структура тРНК приблизительно L-образна. Три штриха выделяют антикодон; последовательность не задана.','Аминоацил-тРНК-синтетаза обеспечивает присоединение соответствующей аминокислоты к тРНК. Жёлтый символ обозначает аминокислоту; её химическая формула и механизм реакции здесь не изображены.'],
 ['This cloverleaf secondary-structure diagram separates stems and loops. The actual tertiary structure is approximately L-shaped. Three ticks identify the anticodon without specifying a sequence.','An aminoacyl-tRNA synthetase attaches the corresponding amino acid to the tRNA. The gold symbol represents an amino acid; neither its chemical formula nor the reaction mechanism is drawn here.'],
 'https://www.rcsb.org/structure/1EHZ','Shi & Moore, 2000 · PDB 1EHZ',v=>{
 const a=B.trna(v.svg,{x:625,y:378,scale:1.75});
 H.text(v.svg,90,170,330,103,'Клеверный лист:\nвторичная структура','Cloverleaf:\nsecondary structure',29,C.grey);
 H.text(v.svg,868,206,310,86,'3′-конец:\nаминокислота','3′ end:\namino acid',29,C.gold);
 H.text(v.svg,857,448,320,72,'Антикодон','Anticodon',31,C.gold);
 H.text(v.svg,95,437,330,93,'В пространстве\nтРНК похожа на L','In three dimensions,\ntRNA is L-shaped',27,C.grey);
 return {paint:s=>{a.set({charged:s.p});B.emphasis(a,{level:'focus',part:s.p<.5?'anticodon':'amino-acid',amount:.8});}};
});
entry('atlas-mrna','Зрелая мРНК: что читает рибосома','Mature mRNA: what the ribosome reads',
 ['Типичная зрелая эукариотическая мРНК имеет кэп и поли(А)-хвост.','Рибосома переводит кодирующий участок; UTR не переводятся.'],
 ['A typical mature eukaryotic mRNA has a cap and a poly(A) tail.','The ribosome translates the coding region; UTRs are untranslated.'],
 ['Показана распространённая организация зрелой эукариотической мРНК: 5′-кэп, 5′-UTR, кодирующий участок, 3′-UTR и поли(А)-хвост. Это не универсальная схема всех РНК; в частности, существуют мРНК без поли(А)-хвоста.','UTR означает untranslated region: участок остаётся в молекуле РНК, но не кодирует переводимую аминокислотную последовательность. Начало транскрипции и старт-кодон — разные понятия. Длины областей на рисунке условны.'],
 ['This shows a common mature eukaryotic mRNA organization: 5′ cap, 5′ UTR, coding region, 3′ UTR and poly(A) tail. It is not universal for all RNA; some mRNAs lack a poly(A) tail.','UTR means untranslated region: it is present in the RNA but does not encode the translated amino-acid sequence. The transcription start and start codon are distinct. Region lengths here are illustrative.'],
 'https://doi.org/10.1101/gad.1262905','Kahvejian et al., Genes & Development, 2005',v=>{
 const a=B.mrna(v.svg,{x:650,y:360,width:950,color:C.gold});
 H.text(v.svg,115,194,1050,63,'Типичная зрелая эукариотическая мРНК','Typical mature eukaryotic mRNA',30,C.grey);
 const labels=[['Кэп','Cap',165,130,C.purple],['5′-UTR','5′ UTR',300,160,C.grey],['Кодирующий участок','Coding region',566,325,C.gold],['3′-UTR','3′ UTR',860,170,C.grey],['Поли(А)','Poly(A)',1045,175,C.gold]];
 labels.forEach(([ru,en,x,w,col])=>H.text(v.svg,x-w/2,431,w,75,ru,en,27,col));
 return {paint:s=>B.emphasis(a,{level:'focus',part:'coding-sequence',amount:s.p})};
});
entry('atlas-transcription-factor','Транскрипционный фактор: связывание и партнёры','Transcription factor: DNA binding and partners',
 ['Фактор может узнавать ДНК и взаимодействовать с другими белками.','Сам факт связывания ещё не означает активацию гена.'],
 ['A factor can recognize DNA and interact with other proteins.','Binding alone does not establish that a gene is activated.'],
 ['Здесь использован условный символ с областью связывания ДНК и областью взаимодействия с партнёрами. Он не задаёт универсальное устройство всех транскрипционных факторов и не изображает конкретный белок TBP или TFIIA.','Результат зависит от конкретного фактора, партнёров, положения участка и хроматина. Контактные штрихи обозначают связывание в схеме; они не являются химическими связями и не доказывают активацию.'],
 ['This mnemonic separates a DNA-binding region from a partner-interaction region. It is not a universal architecture for all transcription factors and does not depict the specific proteins TBP or TFIIA.','The outcome depends on the factor, its partners, the locus and chromatin. Contact ticks indicate schematic binding; they are not chemical bonds or evidence of activation.'],
 'https://www.rcsb.org/structure/1YTF','Tan et al., 1996 · PDB 1YTF; generic symbol',v=>{
 const d=B.dna(v.svg,{x:640,y:444,width:980,amplitude:18,period:110}),a=B.transcriptionFactor(v.svg,{x:620,y:315,scale:2});
 H.text(v.svg,90,165,350,110,'Взаимодействует\nс партнёрами','Interacts\nwith partners',28,C.purple);
 H.text(v.svg,846,305,342,93,'Участок\nсвязывания ДНК','DNA-binding\nregion',29,C.purple);
 H.text(v.svg,375,524,560,62,'Условный символ белка','A schematic protein symbol',27,C.grey);
 return {paint:s=>{B.place(a,620,315+65*s.p,2);a.set({bound:s.p});B.emphasis(a,{level:'focus',part:'dna-binding-domain',amount:s.p});}};
});
entry('atlas-regulatory-locus','Промотор и энхансер — участки ДНК','Promoters and enhancers are DNA regions',
 ['Промотор находится у старта транскрипции; энхансер может быть удалён.','Контакт с промотором — возможная часть регуляции.'],
 ['A promoter lies near transcription initiation; an enhancer may be distant.','Contact with a promoter can contribute to regulation.'],
 ['Это карта условного локуса. Промотор, энхансер и тело гена — аннотированные области одной ДНК. Координаты не соответствуют геному. Энхансеры могут располагаться с любой стороны гена и внутри него. TSS — transcription start site, начало транскрипции.','Пунктир обозначает возможный контакт, а не физическую петлю ДНК на этом рисунке. Контакт сам по себе не устанавливает функциональную связь. Для конкретного энхансера и гена нужны независимые данные, например функциональная проверка.'],
 ['This is an illustrative locus map. The promoter, enhancer and gene body are annotated regions of the same DNA. Coordinates are not genomic. Enhancers can lie upstream, downstream or within genes. TSS means transcription start site.','The dashed arch denotes a possible contact, not a physical DNA loop in this drawing. Contact alone does not establish a functional relationship. A specific enhancer–gene pair requires additional evidence, such as a functional perturbation.'],
 'https://www.nature.com/articles/s41588-019-0538-0','Fulco et al., Nature Genetics, 2019',v=>{
 const a=B.regulatoryLocus(v.svg,{x:640,y:383,width:1040});
 H.text(v.svg,111,471,300,65,'Энхансер','Enhancer',30,C.purple);
 H.text(v.svg,431,471,230,65,'Промотор','Promoter',30,C.gold);
 H.text(v.svg,732,471,400,65,'Тело гена','Gene body',30,C.teal);
 H.text(v.svg,671,253,340,70,'TSS → направление РНК','TSS → RNA direction',25,C.gold);
 const contact=H.text(v.svg,114,160,525,88,'Возможный контакт:\nнужны данные о функции','Possible contact:\nfunctional evidence is needed',27,C.purple);
 return {paint:s=>{a.set({contact:s.p});B.emphasis(a,{level:'focus',part:'illustrative-contact',amount:s.p*.75});H.opacity(contact,s.p);}};
});
entry('atlas-emphasis','Целое и часть: куда смотреть','Whole and part: where to look',
 ['Одинаковые молекулярные объекты сохраняют одинаковый масштаб.','Выделение направляет внимание на белок или выбранную долю.'],
 ['The same molecular objects retain the same scale.','Emphasis directs attention to a protein or a selected lobe.'],
 ['Три копии схемы Cas9 предназначены для сравнения оформления. Слева — контекст, в центре — целый объект, справа — выбранная доля. Это три изображения одного типа белка, а не три состояния его активности.','Подсветка меняет контраст и заливку, не молекулярное состояние. Контуры остаются тонкими при масштабировании. Выбранная доля обозначена условно: граница не является аннотацией точных аминокислотных доменов.'],
 ['Three copies of the Cas9 schematic compare visual treatments: context, the whole object, and a selected lobe. These are three drawings of one protein type, not three biological activity states.','Emphasis changes contrast and fill, not molecular state. Strokes remain thin when actors are enlarged. The selected lobe is schematic and does not annotate exact amino-acid domains.'],
 'https://www.rcsb.org/structure/4UN3','Anders et al., 2014 · PDB 4UN3',v=>{
 const actors=[250,640,1030].map(x=>B.cas9(v.svg,{x,y:345,scale:1.7}));
 [['Контекст','Context'],['Целый белок','Whole protein'],['Выбранная доля','Selected lobe']].forEach(([ru,en],i)=>H.text(v.svg,85+390*i,470,330,90,ru,en,29,i===0?C.grey:C.blue));
 H.text(v.svg,225,163,830,58,'Нажмите на правую долю, чтобы рассмотреть её','Click the right-hand lobe to inspect it',25,C.grey);
 return {inspect:[{actor:actors[2],part:'recognition',detailBounds:{x:-84,y:-64,width:170,height:68},box:{x:885,y:232,width:290,height:115},label:'Рассмотреть долю Cas9',enLabel:'Inspect the Cas9 lobe',title:'Доля Cas9',enTitle:'Cas9 lobe',description:'Увеличенная схема выбранной доли. Тонкие внутренние линии обозначают условные детали.',enDescription:'An enlarged schematic of the selected lobe. Thin internal lines denote illustrative detail.'}],paint:s=>{B.emphasis(actors[0],{level:'context',amount:s.p});B.emphasis(actors[1],{level:'focus',amount:s.p});B.emphasis(actors[2],{level:'focus',part:'recognition',amount:s.p});}};
});
})();
