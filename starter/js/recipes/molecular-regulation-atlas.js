/* Optional histone chemistry / transcription initiation specimens. */
(function(){
'use strict';
const A=window.MOLECULAR_ATLAS;if(!A)return;const H=A.H,add=A.add;
const u=x=>Math.max(0,Math.min(1,x));
add('atlas-histone-tail','H3K9me3: маленькая метка, новый контакт','H3K9me3: a small mark creates a new contact',
 ['K9 — девятый аминокислотный остаток гистона H3.','Три метильные группы находятся на азоте боковой цепи K9.','Хромодомен HP1 узнаёт метку вместе с соседними остатками H3.'],
 ['K9 is the ninth amino-acid residue of histone H3.','Three methyl groups attach to the side-chain nitrogen of K9.','The HP1 chromodomain reads the mark and neighboring H3 residues.'],
 ['Слева нуклеосома, справа увеличен участок хвоста одного H3: масштабы различаются. Точки на нити — позиции аминокислот 1–13, выделенная позиция 9 — лизин. В боковой цепи лизина четыре метиленовых звена перед концевым азотом. Схема оставляет остальную химию пептида за кадром.',
 'H3K9me3 означает три метильные группы CH₃ на ε-азоте одного лизина, а не три белка и не три метки на ДНК. При физиологическом pH азот показан положительно заряженным. Плавное появление всех трёх групп — переход между иллюстрациями; промежуточная прозрачность не задаёт химическую стехиометрию. Фермент переносит метильные группы от донора, а не создаёт их из ничего.',
 'HP1 распознаёт метилированный K9 с помощью хромодомена: ароматические боковые цепи образуют карман вокруг метиламмониевой группы. Контакты с соседними остатками также важны; HP1 способен связывать и H3K9me2. Рисунок белка условен. Такое связывание помогает организовать репрессивный хроматин, но метка сама по себе не является механическим замком для полимеразы.'],
 ['Left: a nucleosome. Right: a magnified segment of one H3 tail; the two views use different scales. Dots mark amino-acid positions 1–13; residue 9 is lysine. Its side chain has four methylene groups before the terminal nitrogen. Other peptide chemistry is omitted.',
 'H3K9me3 means three methyl groups, CH₃, on the epsilon nitrogen of one lysine, rather than three proteins or three DNA marks. The nitrogen is shown positively charged at physiological pH. All three groups fade in as a transition between illustrations; intermediate opacity has no chemical stoichiometric meaning. Enzymes transfer methyl groups from a donor.',
 'The HP1 chromodomain recognizes methylated K9: aromatic side chains form a pocket around the methylammonium group. Neighboring residues contribute specificity; HP1 can also bind H3K9me2. The protein silhouette is schematic. Binding helps organize repressive chromatin, but the mark alone is not a mechanical lock on polymerase.'],
 'https://www.rcsb.org/structure/1KNE','Jacobs & Khorasanizadeh, Science, 2002 · PDB 1KNE',v=>{
 const n=B.nucleosome(v.svg,{x:258,y:357,scale:1.45});
 H.text(v.svg,75,163,360,67,'Нуклеосома','Nucleosome',29,C.blue);
 H.text(v.svg,82,492,350,86,'Увеличим один хвост H3','Magnify one H3 tail',27,C.purple);
 const zoom=F.path(v.svg,[[329,289],[424,255],[456,255]],C.grey,1.1);zoom.setAttribute('stroke-dasharray','4 6');
 const tail=B.histoneTail(v.svg,{x:720,y:468,scale:1.55});
 H.text(v.svg,426,491,92,43,'1','1',22,C.grey);H.text(v.svg,680,491,80,45,'K9','K9',27,C.gold);H.text(v.svg,798.5,491,91,43,'13','13',22,C.grey);
 H.text(v.svg,474,549,440,46,'Хвост H3 — цепочка аминокислот','H3 tail — an amino-acid chain',24,C.purple);
 const initialN=H.text(v.svg,717.2,283.25,49,44,'NH₃⁺','NH₃⁺',21,C.gold),markedN=H.text(v.svg,717.2,283.25,49,44,'N⁺','N⁺',24,C.gold);
 const methyls=[[-25,-135],[50,-135],[56,-88]].map(([x,y])=>H.text(v.svg,720+1.55*x-31,468+1.55*y-23,62,46,'CH₃','CH₃',24,C.red));
 const markLabel=H.text(v.svg,495,161,376,65,'H3K9 → H3K9me3','H3K9 → H3K9me3',29,C.red);
 const hp=B.protein(v.svg,{kind:'hp1',x:1060,y:365,scale:1.08,color:C.teal});
 const hpLabel=H.text(v.svg,945,173,255,101,'HP1\nчитает метку','HP1\nreads the mark',28,C.teal);
 const contact=F.path(v.svg,[[846,331],[891,331]],C.teal,1.1);contact.setAttribute('stroke-dasharray','3 5');
 return {paint:s=>{const m=u(s.p),read=u(s.p-1);n.set({marked:m});B.emphasis(n,{level:'context'});tail.set({methylation:m});B.emphasis(tail,{level:'focus',part:'lysine-9-side-chain',amount:.65*(1-read)});H.opacity(initialN,m<.5?1:0);H.opacity(markedN,m<.5?0:1);methyls.forEach(t=>H.opacity(t,m));H.opacity(markLabel,m);B.place(hp,1060-106*read,365-34*read,1.08);H.opacity(hp,read);H.opacity(hpLabel,read);H.opacity(contact,read);}};
},{
 qa:[
 {q:'Что означает «me3» в H3K9me3?',a:'<p>Три метильные группы CH₃ на ε-азоте одного лизина K9. Это химическая модификация одного аминокислотного остатка, а не три белка или три метки на ДНК.</p>',source:'Jacobs & Khorasanizadeh, 2002 · PDB 1KNE',url:'https://www.rcsb.org/structure/1KNE'},
 {q:'Метилирование убирает положительный заряд лизина?',a:'<p>Нет. Азот триметиллизина положительно заряжен. HP1 узнаёт метку в кармане хромодомена вместе с соседними остатками H3; узнавание нельзя свести к исчезновению заряда.</p>',source:'Jacobs & Khorasanizadeh, 2002 · PDB 1KNE',url:'https://www.rcsb.org/structure/1KNE'}],
 enQa:[
 {q:'What does “me3” mean in H3K9me3?',a:'<p>Three methyl groups, CH₃, on the epsilon nitrogen of one lysine, K9. This modifies one amino-acid residue; it does not mean three proteins or three DNA marks.</p>',source:'Jacobs & Khorasanizadeh, 2002 · PDB 1KNE',url:'https://www.rcsb.org/structure/1KNE'},
 {q:'Does methylation remove the positive charge of lysine?',a:'<p>No. Trimethyllysine has a positively charged nitrogen. HP1 recognizes the mark in its chromodomain pocket together with neighboring H3 residues; recognition cannot be explained by charge loss.</p>',source:'Jacobs & Khorasanizadeh, 2002 · PDB 1KNE',url:'https://www.rcsb.org/structure/1KNE'}]
});

add('atlas-initiation','Pol II запускается вместе с партнёрами','Pol II starts with its partners',
 ['Для запуска транскрипции Pol II нужны общие факторы транскрипции.','Mediator помогает организовать комплекс инициации на промоторе.','При репрессии доступ и продуктивная сборка могут ухудшаться.'],
 ['Pol II requires general transcription factors to initiate transcription.','Mediator helps organize the initiation complex at the promoter.','Repression can reduce access and productive assembly.'],
 ['Комплекс доинициации (PIC) включает Pol II и общие факторы транскрипции. Здесь отдельно обозначены TBP, TFIIB и TFIIH; другие факторы сведены к серым модулям. TBP обычно работает с белками TAF в TFIID, которые здесь не прорисованы. Изображение — схема ролей, а не полный перечень субъединиц.',
 'Mediator — крупный комплекс из многих белков, который связывает регуляторные сигналы с аппаратом транскрипции. Он взаимодействует с Pol II и факторами инициации. TFIIH участвует в раскрытии ДНК и фосфорилировании C-концевого домена Pol II. Одновременное сближение — способ показать совместную работу, не обязательный универсальный порядок сборки.',
 'В CRISPRi локальные изменения хроматина и занятость регуляторной области могут снижать вероятность продуктивной инициации. Полимераза не уничтожается. Исчезновение части комплекса на рисунке означает меньше продуктивных комплексов в рассматриваемом состоянии, а не прямое измерение стехиометрии или единственный механизм репрессии. Хроматиновая репрессия: <a href="https://doi.org/10.1371/journal.pgen.1000869" target="_blank" rel="noopener">Groner et al., 2010</a>.'],
 ['The preinitiation complex (PIC) contains Pol II and general transcription factors. TBP, TFIIB and TFIIH are separately marked; other factors are grouped into gray modules. TBP commonly works with TAF proteins in TFIID, which are not drawn in detail. This is a role diagram, not a complete subunit inventory.',
 'Mediator is a large multiprotein complex connecting regulatory signals with the transcription machinery. It interacts with Pol II and initiation factors. TFIIH contributes to DNA opening and phosphorylation of the Pol II C-terminal domain. Simultaneous convergence illustrates cooperation, not a universal compulsory assembly sequence.',
 'In CRISPRi, local chromatin changes and regulatory-site occupancy can lower the probability of productive initiation. Polymerase is not destroyed. Fading the assembly represents fewer productive complexes in the illustrated condition, not a stoichiometric measurement or the only repression mechanism. Chromatin repression: <a href="https://doi.org/10.1371/journal.pgen.1000869" target="_blank" rel="noopener">Groner et al., 2010</a>.'],
 'https://www.rcsb.org/structure/7LBM','Abdella et al., Science, 2021 · PDB 7LBM',v=>{
 const dna=B.dna(v.svg,{x:640,y:445,width:1040,amplitude:12,period:82});
 const pic=B.initiationComplex(v.svg,{x:640,y:445,scale:1.08});
 const promoter=F.path(v.svg,[[431,480],[512,480]],C.purple,1.2);
 H.text(v.svg,448,148,390,69,'Mediator','Mediator',30,C.teal);
 H.text(v.svg,76,280,276,97,'TFIIB\nпозиционирование','TFIIB\npositioning',26,C.blue);
 H.text(v.svg,935,300,270,111,'TFIIH\nраскрытие ДНК','TFIIH\nDNA opening',26,C.red);
 H.text(v.svg,81,165,265,92,'Общие факторы\nтранскрипции','General\ntranscription factors',27,C.grey);
 H.text(v.svg,320,523,250,81,'TBP\nу промотора','TBP\nat the promoter',26,C.purple);
 H.text(v.svg,609,536,189,58,'Pol II','Pol II',29,C.gold);
 const repression=H.text(v.svg,941,468,261,120,'Меньше\nпродуктивных\nзапусков','Fewer\nproductive\nstarts',27,C.red);
 H.text(v.svg,870,178,334,67,'Нажмите на комплекс\nдля крупного плана','Click the complex\nfor a larger view',23,C.grey);
 return {inspect:[{actor:pic,label:'Рассмотреть комплекс инициации',enLabel:'Inspect the initiation complex',title:'Комплекс инициации',enTitle:'Initiation complex',description:'Pol II, общие факторы транскрипции и Mediator. Схема объединяет несколько белковых комплексов.',enDescription:'Pol II, general transcription factors and Mediator. This schematic combines several protein complexes.'}],paint:s=>{const built=u(s.p),repressed=u(s.p-1);pic.set({assembly:built*(1-.7*repressed)});B.emphasis(pic,{level:'normal'});H.opacity(pic,1-.63*repressed);H.opacity(repression,repressed);dna.set({open:built*(1-repressed),openX:35,openWidth:130});F.opacity(promoter,1);}};
},{
 qa:[
 {q:'Почему для запуска недостаточно одной Pol II?',a:'<p>Общие факторы помогают расположить комплекс на промоторе и подготовить ДНК к началу транскрипции. Mediator взаимодействует с аппаратом инициации. Схема показывает совместную работу, а не универсальный порядок присоединения.</p>',source:'Abdella et al., 2021 · PDB 7LBM',url:'https://www.rcsb.org/structure/7LBM'},
 {q:'CRISPRi уничтожает молекулы Pol II?',a:'<p>Нет. В показанном механизме локальная репрессия снижает вероятность продуктивного запуска. Более бледный комплекс обозначает меньше продуктивных комплексов в рассматриваемом состоянии, а не распад или уничтожение самой полимеразы.</p>',source:'Groner et al., 2010',url:'https://doi.org/10.1371/journal.pgen.1000869'}],
 enQa:[
 {q:'Why is Pol II alone insufficient for initiation?',a:'<p>General factors help position the complex at the promoter and prepare DNA for initiation. Mediator interacts with the initiation machinery. This is a cooperative process, not a universal assembly order.</p>',source:'Abdella et al., 2021 · PDB 7LBM',url:'https://www.rcsb.org/structure/7LBM'},
 {q:'Does CRISPRi destroy Pol II molecules?',a:'<p>No. In the illustrated mechanism, local repression lowers the probability of productive initiation. Fading indicates fewer productive complexes in the condition shown, rather than breakdown or destruction of polymerase itself.</p>',source:'Groner et al., 2010',url:'https://doi.org/10.1371/journal.pgen.1000869'}]
});
})();
