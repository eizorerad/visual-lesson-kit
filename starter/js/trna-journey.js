/* A continuous comparison of representations of one deposited tRNA. */
(function(g){
'use strict';
const ID='trna-journey',SOURCE='Shi & Moore, 2000 · PDB 1EHZ',URL='https://www.rcsb.org/structure/1EHZ';
const tr=(ru,en=ru)=>{D.i18n.pack('en',{strings:{[ru]:en}});return ru;};
const baseline={seqZoom:0,fold:0,pairs:0,simple:0,landmarks:0,model:0,angle:0,zoomAnti:0,zoomCCA:0,elbowZoom:0,elbowAtoms:0,elbowSecond:0,elbowStack:0,elbowExplain:0,stem:0,atomicView:0,atomReveal:0,atomAngle:8,focus:0,detail:0,contacts:0,neighbors:0,spacefill:0,surfaceAngle:0,final:0,...TrnaMagnesiumStory.baseline};
// Numeric content keys retain the original source poses; TrnaFilmStory sets playback order and time.
const originalScript=[
 [0,{},'тРНК доставляет фенилаланин','tRNA carries phenylalanine',
  'У этой дрожжевой тРНК 76 нуклеотидов. Их последовательность записана буквами A, C, G и U; точки отмечают модификации.','This yeast tRNA contains 76 nucleotides. Letters A, C, G and U record their parent bases; dots mark chemical modifications.',
  'Исследуем одну молекулу: тРНК(Phe) Saccharomyces cerevisiae, PDB 1EHZ, модель 1, цепь A. Запись из 76 букв использует родительские основания A, C, G, U. Точки рядом с буквами отмечают 14 модифицированных остатков; реальные идентификаторы PDB сохранены в данных и подсказках.',
  'We follow one molecule: Saccharomyces cerevisiae tRNA(Phe), PDB 1EHZ, model 1, chain A. The 76 letters denote parent bases A, C, G and U. Dots next to letters mark 14 modified residues; actual PDB component IDs remain in the data and tooltips.'],
 [7,{seqZoom:1},'Антикодон занимает позиции 34–36','The anticodon occupies positions 34–36',
  'Триплет Gm–A–A содержит модифицированный гуанозин Gm34. Поэтому запись GAA передаёт только родительские основания.','The Gm–A–A triplet includes modified guanosine Gm34. Writing GAA records the parent bases without this chemical detail.',
  'Участок 34–36 содержит OMG34, A35, A36. OMG — 2′-O-метилгуанозин (Gm). Поэтому простая запись GAA передаёт родительские основания, но не всю химическую идентичность. Масштаб меняется, номера остаются прежними.',
  'Positions 34–36 are OMG34, A35 and A36. OMG is 2′-O-methylguanosine (Gm). Thus GAA records the parent bases, not their complete chemical identity. Zoom changes scale while keeping residue numbers.'],
 [13,{seqZoom:0},'Нуклеотиды образуют одну непрерывную цепь','Nucleotides form one continuous chain',
  'От G1 на 5′-конце до A76 на 3′-конце сохраняется один порядок. Некоторые далёкие по последовательности основания спарены.','One sequence runs from G1 at the 5′ end to A76 at the 3′ end. Some bases far apart in this sequence are pairing partners.',
  'Сохраняются все 76 остатков и их порядок от 5′ к 3′. Следующий переход меняет способ изображения известной структуры; алгоритм предсказания здесь не запускается.',
  'All 76 residues and their 5′-to-3′ order remain fixed. The next transition changes how a known structure is depicted; no prediction algorithm is running.'],
 [21,{fold:1},'В тРНК есть стебли и петли','tRNA contains stems and loops',
  'Клеверный лист показывает расположение участков одной цепи. Парные области образуют стебли, между которыми лежат петли.','The cloverleaf maps regions of one chain. Paired regions form stems, with loops connecting the different regions.',
  'Авторская раскладка клеверного листа сохраняет нумерацию и последовательность 1–76. Она показывает топологию известной вторичной структуры, но её расстояния и углы условны. Движение знаков не является траекторией молекулы.',
  'The authored cloverleaf layout preserves sequence positions 1–76. It shows known secondary-structure topology, with schematic distances and angles. Moving the symbols does not depict a molecular trajectory.'],
 [28,{pairs:1},'Стебли состоят из пар оснований','Stems consist of base pairs',
  'Карта отмечает 21 пару четырёх стеблей. Поперечные линии соединяют партнёров, но не задают одинаковую геометрию всех пар.','The map marks 21 pairs across four stems. Cross-lines connect pairing partners without implying identical geometry for every pair.',
  'Показана традиционная карта 21 пары четырёх стеблей: акцепторный 1–7/66–72, D-стебель 10–13/22–25, антикодоновый 27–31/39–43, T-стебель 49–53/61–65. Это карта связности вторичной структуры, а не исчерпывающий перечень третичных контактов или утверждение о канонической геометрии каждой пары. В депонированной 1EHZ замыкающая пара A31–Ψ39 отличается от обычной A–U: RNA 3D Hub / FR3D аннотирует её как ntSH, близкую к trans sugar–Hoogsteen геометрии. Поперечная линия на схеме не добавляет идеализированных водородных связей к этой паре. Аннотации: https://rna.bgsu.edu/rna3dhub/pdb/1EHZ/interactions/fr3d/all.',
  'The conventional map contains 21 pairs across four stems: acceptor 1–7/66–72, D stem 10–13/22–25, anticodon stem 27–31/39–43 and T stem 49–53/61–65. It records secondary-structure connectivity, not every tertiary contact or a claim that every pair has canonical geometry. In deposited 1EHZ, the closing A31–Ψ39 pair differs from an ordinary A–U pair: RNA 3D Hub / FR3D annotates it as ntSH, near trans sugar–Hoogsteen geometry. Its cross-line does not add idealized hydrogen bonds to the atomic model. Annotations: https://rna.bgsu.edu/rna3dhub/pdb/1EHZ/interactions/fr3d/all.'],
 [34,{simple:1},'У каждой петли своё место в тРНК','Each loop has a place in tRNA',
  'D-, T-, антикодоновая и переменная петли соединяют разные участки цепи. Их расположение задаёт рисунок клеверного листа.','The D, T, anticodon and variable loops connect different regions of the chain, defining the familiar cloverleaf pattern.',
  'Упрощённый вид построен из тех же 76 точек, а не заменён другой условной тРНК. Каждая область сохраняет собственный цвет в выбранной палитре. В исходной палитре Ocean: голубой — акцепторная область, бирюзовый — D, золотой — антикодоновая, фиолетовый — T, серый — переменная петля.',
  'The simplified view uses the same 76 nodes, rather than a different generic tRNA. Each region retains its own color in the selected palette. In the default Ocean palette: blue identifies the acceptor region, teal the D region, gold the anticodon region, purple the T region and grey the variable loop.'],
 [40,{landmarks:1},'Антикодон узнаёт кодон мРНК','The anticodon recognizes an mRNA codon',
  'Триплет Gm34–A35–A36 находится в антикодоновой петле. Во время трансляции эти основания взаимодействуют с кодоном мРНК.','The Gm34–A35–A36 triplet lies in the anticodon loop. During translation, these bases interact with an mRNA codon.',
  'Антикодон расположен в петле между двумя сторонами антикодонового стебля. Метка прикреплена к тем же остаткам и будет сопровождать их при переходе в объём. Матричная РНК и рибосома здесь не изображены.',
  'The anticodon lies in the loop between the two sides of the anticodon stem. Its label stays attached to the same residues during the 3D transition. Messenger RNA and the ribosome are not shown.'],
 [46,{landmarks:2},'Аминокислота присоединяется к концу CCA','The amino acid attaches at the CCA end',
  'Концевой аденозин A76 завершает участок C74–C75–A76 и служит местом аминоацилирования. В этой структуре аминокислоты нет.','Terminal adenosine A76 completes C74–C75–A76 and is the aminoacylation site. No amino acid is present in this structure.',
  'CCA — позиции 74–76, завершающиеся аденозином A76. Это место аминоацилирования тРНК. В показанной структуре аминокислота не добавлена. Метка 5′ соответствует G1.',
  'CCA comprises positions 74–76, ending with adenosine A76. This is the aminoacylation end of tRNA. No amino acid has been added to the displayed structure. The 5′ label refers to G1.'],
 [55,{model:1},'В пространстве тРНК имеет L-форму','tRNA has an L shape in three dimensions',
  'Координаты 1EHZ получены рентгенографией при 1,93 Å. Переход сопоставляет их с 2D-схемой; это не траектория сворачивания.','1EHZ coordinates come from X-ray diffraction at 1.93 Å. This transition matches the 2D diagram to them, not a folding path.',
  'Конечные 3D-точки взяты из координат атомов C4′ официального mmCIF 1EHZ. Структура определена рентгенографией с разрешением 1,93 Å. Интерполяция между рисунками — авторская смена представления, не предсказанный или наблюдённый путь фолдинга. Отрезки C4′–C4′ обозначают след цепи, а не отдельные химические связи.',
  'The final 3D nodes use C4′ coordinates from the official 1EHZ mmCIF. The structure was determined by X-ray diffraction at 1.93 Å resolution. Interpolation between drawings is an authored representation change, not a predicted or observed folding pathway. C4′–C4′ segments are a chain trace, not individual chemical bonds.'],
 [63,{angle:45},'Антикодон и CCA разнесены в пространстве','The anticodon and CCA are spatially separated',
  'Такое расположение позволяет тРНК связывать узнавание кодона в рибосоме с доставкой аминокислоты к месту синтеза белка.','This arrangement lets tRNA connect codon recognition on the ribosome with amino acid delivery to the protein synthesis site.',
  'Этот поворот меняет только ортографическую камеру. Все исходные трёхмерные координаты и внутренние расстояния сохраняются. Глубину передают порядок отрисовки, контуры и затенение следа.',
  'This rotation changes only the orthographic camera. All source coordinates and internal 3D distances remain unchanged. Drawing order, outlines and trace shading communicate depth.'],
 [70,{zoomAnti:1},'Петля несёт три основания антикодона','The loop carries the three anticodon bases',
  'Позиции 34–36 находятся между двумя сторонами антикодонового стебля. Они обращены к кодону мРНК при его узнавании.','Positions 34–36 lie between the two sides of the anticodon stem. These bases face the mRNA codon during recognition.',
  'Камера приближается к среднему положению C4′ остатков 34–36. Кольца выделения не добавляют атомов; это указатели выбранных остатков. Малый локатор показывает их в полной цепи из 76 позиций.',
  'The camera approaches the C4′ centroid of residues 34–36. Highlight rings are residue highlights, not additional atoms. The locator shows these residues in the full 76-position chain.'],
 [76,{zoomAnti:0},'Концы L-формы выполняют разные задачи','The ends of the L shape perform different tasks',
  'Антикодоновая петля участвует в чтении мРНК, а CCA-конец несёт аминокислоту. Оба участка принадлежат одной молекуле.','The anticodon loop participates in reading mRNA, while the CCA end carries the amino acid. Both belong to one molecule.',
  'Отъезд камеры возвращает полный контекст. Ни нумерация, ни химический состав молекулы не изменяются.',
  'Pulling back restores the complete context. Neither residue numbering nor molecular composition changes.'],
 [83,{zoomCCA:1},'CCA завершает 3′-конец тРНК','CCA completes the 3′ end of tRNA',
  'C74–C75–A76 расположены за акцепторным стеблем и не входят в его пары. Последний остаток A76 — место присоединения аминокислоты.','C74–C75–A76 extend beyond the acceptor stem and its base pairs. The final residue, A76, is the amino acid attachment site.',
  'Подпись указывает на реальные остатки 74–76. Показан след C4′; атомная химия присоединения аминокислоты и сама аминокислота здесь не моделируются.',
  'The label points to actual residues 74–76. This is a C4′ trace; aminoacylation chemistry and the amino acid itself are not modeled.'],
 [89,{zoomCCA:0},'Два плеча образуют L-форму тРНК','Two arms form the tRNA L shape',
  'Акцепторный и T-стебли образуют одно плечо, D- и антикодоновый — другое. Рассмотрим, как устроен один из этих стеблей.','The acceptor and T stems form one arm; the D and anticodon stems form the other. We examine how one of these stems is built.',
  'Акцепторный и T-стебли образуют одно плечо L-формы, D- и антикодоновый — другое. Сначала разберём атомное устройство акцепторного стебля: сахарофосфатный остов, пары оснований и стэкинг. Эти понятия далее помогут понять контакты D- и T-петель. Всё время сохраняется одна структура 1EHZ.',
  'The acceptor and T stems form one arm of the L shape, and the D and anticodon stems form the other. We first examine the atomic acceptor stem: sugar–phosphate backbone, base pairing and stacking. These concepts then help explain the D/T-loop contacts. The source remains one structure, 1EHZ.'],
 [97,{elbowZoom:1},'D- и T-петли образуют локоть тРНК','The D and T loops form the tRNA elbow',
  'D-петля занимает позиции 14–21, T-петля — 54–60. Эти далёкие участки последовательности соседствуют в структуре 1EHZ.','The D loop spans positions 14–21 and the T loop 54–60. These distant sequence regions lie next to one another in 1EHZ.',
  'На клеверном листе D-петля (14–21) и T-петля (54–60) разнесены. В известной пространственной структуре они образуют локоть L-формы. Сейчас камера приближает уже готовую структуру: петли не движутся навстречу друг другу. Дальше раскроем контакты их оснований, которые не показаны на карте 21 стеблевой пары.',
  'The cloverleaf separates the D loop (14–21) and T loop (54–60). In the known 3D structure they form the elbow of the L shape. The camera now approaches an already folded structure: the loops do not move toward one another. Next we reveal base contacts omitted from the map of 21 stem pairs.'],
 [106,{elbowAtoms:1},'G19–C56 соединяет D- и T-петли','G19–C56 connects the D and T loops',
  'У этой межпетлевой пары геометрия Уотсона–Крика. Три пунктира отмечают донорно-акцепторные контакты между основаниями.','This interloop pair has Watson–Crick geometry. Three dashed guides mark donor–acceptor contacts between its bases.',
  'G19–C56 имеет геометрию пары Уотсона–Крика. Здесь она связывает две разные петли, поэтому относится к третичной организации. Три пунктира соединяют тяжёлые атомы O6–N4, N1–N3, N2–O2; расстояния по 1EHZ равны 3,03, 2,93 и 2,82 Å. Это ориентиры водородных контактов, не ковалентные связи. Водороды не добавлены. Основания сохраняют координаты 1EHZ; цвет обозначает D- или T-петлю.',
  'G19–C56 has Watson–Crick geometry. Here it connects two different loops, making it part of the tertiary organization. Three dashed guides connect heavy atoms O6–N4, N1–N3 and N2–O2, separated by 3.03, 2.93 and 2.82 Å in 1EHZ. They indicate hydrogen-bond contacts, not covalent bonds. No hydrogens are added. Bases retain deposited coordinates; colors identify D or T loop.'],
 [115,{elbowSecond:1},'G18–Ψ55 дополняет межпетлевые контакты','G18–Ψ55 adds another interloop contact',
  'Ψ55 — псевдоуридин. Два донора гуанина G18 обращены к одному кислороду Ψ55; эта пара имеет неканоническую геометрию.','Ψ55 is pseudouridine. Two G18 donors face one oxygen of Ψ55, producing a noncanonical pairing geometry.',
  'G18 из D-петли контактирует с Ψ55 из T-петли. Это не обычная пара G–U. В именах атомов текущего файла 1EHZ доноры N1 и N2 G18 находятся в 2,78 и 2,94 Å от одного O4 остатка PSU55; показана разветвлённая геометрия контакта. Число пунктиров не измеряет силу взаимодействия. Псевдоуридин имеет C-гликозидную связь C1′–C5; сохранена его реальная химическая идентичность.',
  'D-loop G18 contacts T-loop Ψ55. This is not an ordinary G–U pair. Using atom names in the current 1EHZ file, G18 donors N1 and N2 lie 2.78 and 2.94 Å from the same O4 atom of PSU55, giving a bifurcated contact geometry. The number of dashes does not measure interaction strength. Pseudouridine has a C1′–C5 C-glycosidic bond; its actual chemical identity is retained.'],
 [124,{elbowStack:1},'Основания петель образуют общую стопку','Bases from both loops share a stack',
  'G57 расположен между G18 и G19; рядом стопку продолжает m¹A58. Такое наложение соседних оснований называют стэкингом.','G57 lies between G18 and G19, with m¹A58 continuing the stack nearby. This packing of neighboring bases is called stacking.',
  'G57 расположен между уровнями G19–C56 и G18–Ψ55; рядом стопку продолжает T54–m¹A58. Пурины m¹A58, G18, G57 и G19 последовательно участвуют в стэкинге. Основания двух петель чередуются в общей упаковке. Показаны семь оснований исходной структуры; углы и расстояния не идеализированы. Поворот меняет только камеру. Стэкинг не показан как дополнительная ковалентная связь.',
  'G57 lies between the G19–C56 and G18–Ψ55 levels; the neighboring T54–m¹A58 level continues the stack. Purines m¹A58, G18, G57 and G19 participate successively in stacking. Bases from the two loops interleave in a shared arrangement. Seven deposited bases are shown without idealizing angles or distances. Only the camera rotates. Stacking is not drawn as an additional covalent bond.'],
 [133,{elbowExplain:1},'Контакты и стэкинг стабилизируют локоть','Contacts and stacking stabilize the elbow',
  'Они входят в общую сеть взаимодействий тРНК. На устойчивость укладки также влияют остальная молекула, вода и ионное окружение.','They belong to a wider interaction network. The rest of the molecule, water and the ionic environment also affect stability.',
  'Гибкая РНК может принимать разные конформации. В этой укладке совместимые поверхности оснований образуют сеть контактов и стэкинга, которая помогает удерживать D- и T-петли вместе и поддерживать L-форму. Это часть всей системы взаимодействий, а не единственная причина её устойчивости: важны также остальная молекула, растворитель и ионное окружение. Не следует представлять петли как два магнита. Статическая структура и показанные контакты не определяют порядок или скорость сворачивания; фильм объясняет стабилизацию известной укладки.',
  'Flexible RNA can adopt different conformations. In this arrangement, compatible base surfaces form a network of contacts and stacking that helps hold the D and T loops together and support the L shape. This is part of the full interaction network, not the sole source of stability: the rest of the molecule, solvent and ionic environment also matter. The loops should not be imagined as two magnets. A static structure and its contacts do not determine folding order or rates; the film explains stabilization of a known arrangement.'],
 [140,{elbowZoom:0,elbowAtoms:0,elbowSecond:0,elbowStack:0,elbowExplain:0,stem:1,landmarks:0},'У акцепторного стебля семь пар','The acceptor stem contains seven pairs',
  'Остатки 1–7 спарены с остатками 72–66. Два участка у концов одной цепи образуют стебель рядом с местом присоединения аминокислоты.','Residues 1–7 pair with residues 72–66. Two regions near the ends of one chain form a stem beside the amino acid attachment end.',
  'Это фрагменты одной непрерывной цепи. Между остатками 7 и 66 нет прямой ковалентной связи: соединяющий их путь проходит через остальную тРНК. Малый общий вид далее удержит этот контекст.',
  'These are segments of one continuous chain. Residues 7 and 66 have no direct covalent bond: the connecting path runs through the rest of the tRNA. The overview retains this context in the close-up.'],
 [149,{atomicView:1},'Обе стороны стебля — части одной цепи','Both sides of the stem belong to one chain',
  'Через остатки 8–65 эти участки связаны непрерывным остовом. Прямой ковалентной связи между позициями 7 и 66 нет.','Residues 8–65 connect the two selected segments through the rest of the tRNA. There is no direct covalent bond from 7 to 66.',
  'Координаты всех остатков остаются неизменными. Базис камеры интерполируется как жёсткое вращение, без деформации или зеркального отражения. Целая трасса C4′ и будущая атомная модель используют одну и ту же проекцию.',
  'Every residue retains its coordinates. Camera bases interpolate by rigid rotation, without deformation or reflection. The full C4′ trace and the atomic model use the same projection.'],
 [157,{atomReveal:1},'Нуклеотид объединяет основание, сахар и фосфат','A nucleotide combines a base, sugar and phosphate',
  'В выбранных 14 нуклеотидах показаны 299 тяжёлых атомов. Каждый прежний маркер C4′ находится в рибозе своего нуклеотида.','The 14 selected nucleotides contain 299 heavy atoms. Each earlier C4′ marker lies within the ribose of its nucleotide.',
  'Изображены все 299 тяжёлых атомов выбранных 14 нуклеотидов. Сохранены 332 ковалентные связи, включая 12 межостаточных границ O3′–P. Фосфатные ветви и 2′-OH включены; атомы водорода не добавлялись. Появление атомов — смена детализации.',
  'All 299 heavy atoms of the selected 14 nucleotides are shown. The 332 covalent links include 12 inter-residue O3′–P boundaries. Phosphate branches and 2′-OH are included; hydrogen atoms were not added. Revealing atoms changes the level of detail.'],
 [165,{atomAngle:38},'Сахара и фосфаты образуют остов РНК','Sugars and phosphates form the RNA backbone',
  'Основания присоединены к сахарам и обращены внутрь стебля. Два участка сахарофосфатного остова проходят по его краям.','Bases attach to the sugars and face the stem interior. Two stretches of sugar–phosphate backbone run along its edges.',
  'Фосфатные группы и сахара продолжают сахарофосфатный остов. Кольца обозначают основания. Цвета указаны в легенде. Цвета здесь кодируют химические части; это отдельная легенда от цветов областей целой тРНК.',
  'Phosphate groups and sugars form the sugar–phosphate backbone. Rings represent bases. Colors are identified in the legend. Here colors encode chemical parts, with a separate legend from the whole-tRNA region colors.'],
 [171,{focus:1},'G3 и C70 — партнёры одной пары','G3 and C70 are pairing partners',
  'Они далеко друг от друга в последовательности, но соседствуют поперёк стебля. Каждое основание сохраняет связь со своим сахаром.','They are far apart in the sequence but meet across the stem. Each base remains attached to the sugar of its own nucleotide.',
  'G3 и C70 принадлежат противоположным сторонам акцепторного стебля. Остальные атомы приглушены для чтения, но не удалены из данных. Их номера связывают крупный план с начальной последовательностью.',
  'G3 and C70 belong to opposite sides of the acceptor stem. Other atoms are dimmed for clarity, not removed from the data. Residue numbers connect this close-up to the opening sequence.'],
 [180,{detail:1,contacts:1},'Водородные контакты связывают G3 с C70','Hydrogen-bond contacts link G3 to C70',
  'Три пунктира соединяют атомы азота и кислорода партнёров. Расстояния между этими тяжёлыми атомами составляют 2,76–2,94 Å.','Three dashed guides connect nitrogen and oxygen atoms on the two bases. These heavy-atom distances range from 2.76 to 2.94 Å.',
  'Показаны O6(G3)–N4(C70), N1(G3)–N3(C70), N2(G3)–O2(C70). Расстояния тяжёлых атомов в источнике составляют примерно 2,94, 2,87 и 2,76 Å. Пунктир помогает прочитать водородные взаимодействия пары; координат самих водородов в модели нет.',
  'The guides join O6(G3)–N4(C70), N1(G3)–N3(C70) and N2(G3)–O2(C70). Source heavy-atom distances are about 2.94, 2.87 and 2.76 Å. Dashed guides help read pair hydrogen-bond interactions; hydrogen coordinates are absent from the model.'],
 [187,{neighbors:1},'В стебле соседствуют разные типы пар','Different pair types coexist in the stem',
  'За G3–C70 следуют G4–U69 и A5–U68. Пара G–U имеет wobble-геометрию и отличается расположением оснований от пары G–C.','G3–C70 is followed by G4–U69 and A5–U68. The G–U pair has wobble geometry, with bases arranged differently from G–C.',
  'G4–U69 — G–U wobble-пара, а не G–C. Следующая пара — A5–U68. Показаны настоящие соседние остатки той же структуры; их расположение не заменено идеализированной спиралью.',
  'G4–U69 is a G–U wobble pair, not G–C. The next pair is A5–U68. These are actual neighboring residues from the same structure, not an idealized helix.'],
 [196,{atomAngle:69},'Стэкинг продолжается вдоль стебля','Stacking extends along the stem',
  'Спаривание соединяет партнёров поперёк стебля. Вдоль него соседние плоскости оснований упакованы друг над другом.','Pairing joins partners across the stem. Along it, neighboring base planes pack above and below one another.',
  'Поворот открывает взаимное расположение плоскостей оснований. Спаривание соединяет партнёров поперёк стебля, стэкинг характеризует упаковку соседей вдоль него. Движение камеры не измеряет свободную энергию и не симулирует взаимодействия.',
  'Rotation reveals how base planes are arranged. Pairing relates partners across the stem; stacking describes neighboring bases along it. Camera motion neither measures free energy nor simulates interactions.'],
 [203,{detail:0,focus:0,contacts:0,neighbors:0,atomAngle:38},'Семь пар образуют акцепторный стебель','Seven pairs make up the acceptor stem',
  'G3–C70 и две соседние пары входят в общий участок 1–7 / 66–72. Пары и стэкинг связывают основания в единую пространственную укладку.','G3–C70 and its neighbors belong to residues 1–7 / 66–72. Pairing and stacking organize the bases into a shared structure.',
  'Крупный план и общий стебель связаны одними координатами, одной нумерацией и одной ковалентной топологией. Меняются только камера и визуальные акценты.',
  'The close-up and the whole stem share coordinates, residue numbering and covalent topology. Only the camera and visual emphasis change.'],
 [210,{atomReveal:0},'Остов связывает все нуклеотиды тРНК','The backbone connects every tRNA nucleotide',
  'Каждая точка соответствует C4′ одной рибозы. Линия через эти точки передаёт ход цепи, а подробные химические связи скрыты.','Each point marks C4′ in one ribose. The line through these points traces the chain while leaving chemical bond details out.',
  'Точки C4′ находятся на тех же координатах, что соответствующие атомы подробного представления. Поэтому при смене детализации выбранная область не перескакивает в другое место.',
  'C4′ nodes occupy the same positions as their atoms in the detailed representation, so the selected region stays in place while the level of detail changes.'],
 [218,{atomicView:0,stem:0,landmarks:2,angle:15},'Контакты между петлями дополняют стебли','Contacts between loops complement the stems',
  'Пары и стэкинг встречаются не только внутри стеблей. В локте L-формы взаимодействуют основания D- и T-петель.','Pairing and stacking also occur outside stems. Bases of the D and T loops interact in the elbow of the L shape.',
  'Вновь видны все 76 остатков той же дрожжевой тРНК(Phe). После спаривания и стэкинга в акцепторном стебле рассмотрим третичные контакты между D- и T-петлями. Это взаимодействия уже уложенной структуры, не показанное по времени образование её локтя.',
  'All 76 residues of the same yeast tRNA(Phe) are visible again. After pairing and stacking in the acceptor stem, we examine tertiary contacts between the D and T loops. These are interactions in an existing folded structure, not a time-resolved formation of its elbow.'],
 [225,{final:1},'Порядок, спаривание и укладка связаны','Sequence, pairing and spatial structure connect',
  'Последовательность задаёт порядок 76 остатков, пары указывают их партнёров, а 3D-структура — взаимное расположение участков.','The sequence orders 76 residues, pairs identify their partners, and the 3D structure locates the regions relative to each other.',
  'Последовательность, клеверный лист, пространственный след и атомный стебель — согласованные представления одного источника 1EHZ. Уровни описания дополняют друг друга. Показанный маршрут — обучающее объяснение, а не запись процесса фолдинга.',
  'Sequence, cloverleaf, spatial trace and atomic stem are consistent representations of one source, 1EHZ. These descriptive levels complement each other. The journey is an educational explanation, not a recording of folding.'],
 [237,{spacefill:1,final:0},'Атомы придают тРНК объём','Atoms give tRNA its volume',
  '1652 тяжёлых атома занимают пространство вокруг знакомого следа цепи. Цвета по-прежнему обозначают участки тРНК.',
  'The 1652 heavy atoms occupy space around the familiar chain trace. Colors still identify the same regions of tRNA.',
  'Объёмное представление построено по всем 1652 тяжёлым атомам 76 остатков 1EHZ, модель 1, авторская цепь A. Размеры сфер заданы условными ван-дер-ваальсовыми радиусами Бонди: C 1,70; N 1,55; O 1,52; P 1,80 Å. Сферы показывают атомную упаковку; это не вычисленная поверхность доступности растворителю. Рост сфер меняет представление, не изображает физическое набухание. Координаты атомов неизменны, водороды, вода и ионы не добавлены. Цвет кодирует область цепи, а не химический элемент.',
  'The volume view uses all 1652 heavy atoms of the 76 residues in 1EHZ, model 1, author chain A. Sphere sizes use conventional Bondi van der Waals radii: C 1.70, N 1.55, O 1.52 and P 1.80 Å. They depict atomic packing, not a calculated solvent-accessible surface. Growing spheres changes the representation, rather than depicting physical swelling. Atom coordinates remain fixed; hydrogens, water and ions are omitted. Color identifies the chain region, not the element.'],
 [249,{surfaceAngle:35,final:1},'Одна форма соединяет две функции','One shape connects two functions',
  'На одном конце антикодон распознаёт кодон мРНК. На другом конец CCA принимает аминокислоту для синтеза белка.',
  'At one end the anticodon recognizes an mRNA codon. At the other, the CCA end accepts an amino acid for protein synthesis.',
  'В объёмной модели сохраняются те же остатки антикодона 34–36 и конца CCA 74–76. Изображена свободная тРНК без аминокислоты и рибосомы; взаимодействие с партнёрами здесь не моделируется. Пространственная форма позволяет её функциональным концам связывать узнавание кодона с переносом аминокислоты. Вода и Mg²⁺ уже были показаны отдельным слоем; в этом объёмном представлении видны только атомы самой тРНК.',
  'The volume model retains anticodon residues 34–36 and CCA residues 74–76. It shows free tRNA without an amino acid or ribosome; interactions with partners are not simulated. Its spatial form connects codon recognition with amino acid delivery. Water and Mg²⁺ were shown in a separate layer; this volume view contains only the tRNA atoms.']

];
const cues=TrnaFilmStory.build(originalScript,TrnaMagnesiumStory.cues,baseline,g.TRNA_FILM_CONFIG).map(c=>{
 tr(c.titleRu,c.titleEn);tr(c.captionRu,c.captionEn);if(c.approachRu)tr(c.approachRu,c.approachEn);return c;
});
const ELBOW_SOURCE='Pan et al., 2008 · Fig. 1 / 1EHZ',ELBOW_URL='https://pmc.ncbi.nlm.nih.gov/articles/PMC2440604/';
const noteFor=(c,lang)=>{const source=c.sourceKind==='magnesium'?TrnaMagnesiumStory.sourceFor(c.sourceTime):c.key.startsWith('elbow')?[ELBOW_SOURCE,ELBOW_URL]:[SOURCE,URL];return F.note(lang==='en'?c.noteEn:c.noteRu,...source);};
const DURATION=cues.at(-1).time+cues.at(-1).hold;
const sample=time=>TrnaFilmStory.sample(cues,baseline,time,A.ease.smooth);
const qa=[
 {q:'Mg²⁺ убирает отрицательные заряды фосфатов?',a:'Нет. Ионы экранируют электростатическое взаимодействие; заряд фосфатных групп сохраняется. Полупрозрачные точки — схема среды, а Mg560 и шесть O воды взяты из 1EHZ.',source:'Bai et al., 2007',url:'https://doi.org/10.1021/ja075020g'},
 {q:'Mg560 непосредственно соединяет D- и T-петли?',a:'Нет. Показанный ион находится около остова остатков 8–12. Его ближайшее окружение — шесть кислородов воды; некоторые из них соседствуют с кислородами фосфатов. Этот сайт не является прямой скобой между петлями.',source:SOURCE,url:URL},
 {q:'Почему D- и T-петли находятся рядом?',a:'Их основания участвуют в третичных контактах G19–C56 и G18–Ψ55 и в общей стопке. Эта сеть помогает стабилизировать локоть известной L-формы; она не задаёт единственный путь сворачивания.',source:ELBOW_SOURCE,url:ELBOW_URL},
 {q:'Почему G19–C56 не было на клеверном листе?',a:'На схеме показаны 21 пара четырёх стеблей. G19–C56 имеет геометрию Уотсона–Крика, но связывает две петли и относится к третичной организации.',source:ELBOW_SOURCE,url:ELBOW_URL},
 {q:'Почему клеверный лист и L-форма изображают одну тРНК?',a:'Оба представления сохраняют те же 76 остатков и их нумерацию. Клеверный лист подчёркивает вторичные пары, а L-форма использует пространственные координаты 1EHZ.',source:SOURCE,url:URL},
 {q:'Переход в 3D показывает физический путь сворачивания?',a:'Нет. Это авторское сопоставление представлений. Конечная структура задана экспериментальными координатами; камера не вычисляет фолдинг.',source:SOURCE,url:URL},
 {q:'Почему у антикодона написано GmAA?',a:'Позиция 34 содержит OMG — 2′-O-метилгуанозин. Буква G в записи последовательности обозначает его родительское основание.',source:'PDB chemical component OMG',url:'https://www.rcsb.org/ligand/OMG'},
 {q:'Между 7 и 66 есть прямая связь?',a:'Нет. Они входят в разные участки одной цепи. Между ними лежат остатки 8–65; общий локатор сохраняет этот контекст.',source:SOURCE,url:URL}
];
D.i18n.pack('en',{notes:{[ID]:cues.map(c=>noteFor(c,'en'))},qa:{[ID]:[
 {q:'Does Mg²⁺ remove the negative phosphate charges?',a:'No. Ions screen electrostatic interactions while phosphate groups remain charged. Translucent dots illustrate the environment; Mg560 and six water O atoms come from 1EHZ.',source:'Bai et al., 2007',url:'https://doi.org/10.1021/ja075020g'},
 {q:'Does Mg560 directly join the D and T loops?',a:'No. This ion lies near the backbone of residues 8–12. Its immediate surroundings are six water oxygen atoms, some close to phosphate oxygens. This site is not a direct clamp between the loops.',source:SOURCE,url:URL},
 {q:'Why are the D and T loops adjacent?',a:'Their bases participate in tertiary contacts G19–C56 and G18–Ψ55 and in a shared stack. This network helps stabilize the elbow of the known L shape; it does not prescribe a unique folding pathway.',source:ELBOW_SOURCE,url:ELBOW_URL},
 {q:'Why was G19–C56 absent from the cloverleaf?',a:'The diagram showed 21 pairs in four stems. G19–C56 has Watson–Crick geometry, but joins two loops and belongs to the tertiary organization.',source:ELBOW_SOURCE,url:ELBOW_URL},
 {q:'Why do the cloverleaf and L shape show the same tRNA?',a:'Both retain the same 76 residues and numbering. The cloverleaf emphasizes secondary pairs, whereas the L shape uses spatial coordinates from 1EHZ.',source:SOURCE,url:URL},
 {q:'Does the 3D transition show a physical folding pathway?',a:'No. It is an authored comparison of representations. The final structure uses experimental coordinates; camera motion does not compute folding.',source:SOURCE,url:URL},
 {q:'Why is the anticodon labeled GmAA?',a:'Position 34 contains OMG, 2′-O-methylguanosine. G in the sequence denotes its parent base.',source:'PDB chemical component OMG',url:'https://www.rcsb.org/ligand/OMG'},
 {q:'Is there a direct bond between residues 7 and 66?',a:'No. They are in separate segments of one chain, connected through residues 8–65. The overview retains that context.',source:SOURCE,url:URL}
]}});
D.deck.register({id:ID,title:tr('тРНК: от последовательности к атомам','tRNA: from sequence to atoms'),chapter:tr('Одна молекула — непрерывное путешествие','One molecule — a continuous journey'),notes:cues.map(c=>noteFor(c,'ru')),qa,
 build(ctx){
  const v=F.stage(ctx,cues[0].titleRu,'1EHZ',SOURCE);v.root.classList.add('trna-journey');
  // Cue copy owns its locale: repeated author text must not share a global
  // dictionary key, and an intentionally empty locale must stay empty.
  v.heading.setAttribute('data-i18n-ignore','');v.cap.setAttribute('data-i18n-ignore','');
  const world=TrnaWorld.create(v.svg),overlay=F.group(v.svg),state={time:0};let controller=null,lastCue=-1,lastLanguage='',lastCaptionPhase='',uid=0;
  ctx.onDispose(world.dispose);
  const box=(p,x,y,w,h,ru,en,size=23,color=C.white,align='center')=>L.textBox(p,{id:'trna-annotation-'+(++uid),x,y,width:w,height:h,text:tr(ru,en),size,color,padding:0,lineHeight:1.22,align});
  const badge=box(overlay,72,148,620,35,'тРНК(Phe) · дрожжи · 1EHZ · 76 нуклеотидов','tRNA(Phe) · yeast · 1EHZ · 76 nucleotides',18,C.grey,'left');
  const mode=box(overlay,839,148,365,35,'Последовательность','Sequence',18,C.grey,'right');
  const seqNote=box(overlay,198,552,884,42,'Буквы — родительские основания; точки — модификации','Letters are parent bases; dots mark modifications',21,C.grey);
  const seqZoomLabel=box(overlay,380,190,700,42,'Антикодон · Gm34–A35–A36','Anticodon · Gm34–A35–A36',26,C.gold);
  const diagramLabels=F.group(overlay);
  const dl=[
   box(diagramLabels,75,281,250,78,'D-стебель\nи D-петля','D stem\nand D loop',24,C.teal),
   box(diagramLabels,964,272,243,78,'T-стебель\nи T-петля','T stem\nand T loop',24,C.purple),
   box(diagramLabels,914,187,290,78,'Акцепторный\nстебель','Acceptor\nstem',23,C.blue),
   box(diagramLabels,85,465,245,67,'Антикодоновый\nстебель','Anticodon\nstem',22,C.gold),
   box(diagramLabels,966,429,237,66,'Переменная\nпетля','Variable\nloop',21,C.grey)
  ];
  function callout(ru,en,color,width=255){
   const group=F.group(overlay),line=F.line(group,0,0,0,0,color,1.25),label=box(group,0,0,width,72,ru,en,24,color);return {g:group,label,line,width};
  }
  const anti=callout('Антикодон\n34–36 · GmAA','Anticodon\n34–36 · GmAA',C.gold);
  const cca=callout('3′-CCA\n74–76','3′-CCA\n74–76',C.blue);
  const five=callout('5′ · G1','5′ · G1',C.blue,155);
  const stem=callout('Акцепторный стебель\n1–7 / 66–72','Acceptor stem\n1–7 / 66–72',C.gold,275);
  const mean=(pts,ids)=>[0,1,2].map(k=>ids.reduce((sum,id)=>sum+pts[id-1][k],0)/ids.length);
  function place(c,p,side='right',dy=0,alpha=1){
   const x=side==='left'?75:1205-c.width,y=Math.max(185,Math.min(507,p[1]-36+dy));
   c.label.setBox({x,y,width:c.width,height:72});
   const sx=side==='left'?x+c.width+12:x-12,sy=y+36,dx=p[0]-sx,dy2=p[1]-sy,len=Math.max(1,Math.hypot(dx,dy2));
   F.seg(c.line,sx,sy,p[0]-dx/len*12,p[1]-dy2/len*12);const inFrame=F.phase(p[0],60,110)*(1-F.phase(p[0],1170,1220))*F.phase(p[1],148,180)*(1-F.phase(p[1],580,610));F.opacity(c.g,alpha*inFrame);
  }
  const locatorCaption=box(overlay,76,365,234,67,'Тот же участок\nв целой тРНК','The same region\nin the whole tRNA',20,C.grey);
  const morphNote=box(overlay,921,433,282,114,'Смена представления\nне путь фолдинга','Representation change\nnot a folding path',20,C.grey);
  const elbow=F.group(overlay),elbowContour=D.dom.s('ellipse',{fill:'none',stroke:C.gold,'stroke-width':2,'stroke-dasharray':'4 6'});elbow.append(elbowContour);
  const elbowLabel=box(elbow,947,342,258,134,'D-петля + T-петля\nЛокоть L-формы','D loop + T loop\nThe L-shaped elbow',23,C.gold);
  const elbowText=F.group(overlay);
  box(elbowText,76,448,237,53,'D-петля · 14–21','D loop · 14–21',23,C.teal);
  box(elbowText,76,504,237,53,'T-петля · 54–60','T loop · 54–60',23,C.purple);
  const elbowPairText=box(elbowText,942,250,268,110,'G19–C56\nПара между петлями','G19–C56\nAn inter-loop pair',25,C.gold);
  const elbowPsiText=box(elbowText,942,251,268,150,'G18–Ψ55\nΨ — псевдоуридин','G18–Ψ55\nΨ = pseudouridine',24,C.gold);
  const elbowStackText=box(elbowText,942,237,268,187,'G57 — между\nG18 и G19','G57 lies between\nG18 and G19',25,C.gold);
  const elbowLegend=box(elbowText,942,440,268,125,'Пунктир: водородные\nконтакты оснований','Dashed guides:\nbase hydrogen-bond\ncontacts',21,C.grey);
  const elbowStackLegend=box(elbowText,938,437,272,130,'Основания двух петель\nчередуются в стопке','Bases from both loops\ninterleave in a stack',23,C.grey);
  const elbowResult=box(elbowText,938,251,272,165,'Контакты + стэкинг\nстабилизируют\nлокоть тРНК','Contacts + stacking\nstabilize the\ntRNA elbow',24,C.gold);
  const elbowLimit=box(elbowText,934,448,279,125,'Известная укладка.\nПуть сворачивания\nздесь не показан.','A known arrangement.\nThe folding pathway\nis not shown here.',21,C.grey);
  const elbowLabels=F.group(overlay),elbowTags=[19,56,18,55,57,58,54].map(id=>{
   const label=id===55?'Ψ55':id===54?'T54':id===58?'m¹A58':TRNA_DATA.residues[id-1].base+id;
   const line=F.line(elbowLabels,0,0,0,0,id<30?C.teal:C.purple,1);return {id,line,label:box(elbowLabels,0,0,103,38,label,label,22,id<30?C.teal:C.purple)};
  });
  const chemical=F.group(overlay);
  box(chemical,76,445,239,40,'Основания','Bases',24,C.gold);
  box(chemical,76,488,239,40,'Сахара','Sugars',24,C.teal);
  box(chemical,76,531,239,40,'Фосфаты','Phosphates',24,C.blue);
  const pairLabels=F.group(overlay),gLabel=box(pairLabels,298,180,145,46,'G3','G3',26,C.gold),cLabel=box(pairLabels,905,180,160,46,'C70','C70',26,C.gold);
  const gl=F.line(pairLabels,0,0,0,0,C.gold,1.2),cl=F.line(pairLabels,0,0,0,0,C.gold,1.2);
  const neighbor=F.group(overlay);
  box(neighbor,966,394,239,76,'G4–U69\nwobble','G4–U69\nwobble',23,C.teal);
  box(neighbor,966,483,239,54,'A5–U68','A5–U68',23,C.teal);
  const contactNote=box(overlay,944,414,265,115,'Пунктир:\nконтакты\nвнутри пары','Dashed guides:\ncontacts\nwithin the pair',22,C.grey);
  const stacking=box(overlay,903,523,304,77,'Соседние основания\nобразуют стопку','Neighboring bases\nform a stack',23,C.gold);
  const finalText=box(overlay,76,266,247,150,'Порядок\nПары\nПространство','Order\nPairs\nSpace',29,C.white);
  const oneMolecule=box(overlay,934,462,272,108,'76 остатков.\nТа же молекула.','76 residues.\nThe same molecule.',25,C.gold);
  const volumeNote=box(overlay,76,266,247,154,'Атомная упаковка\nРазмеры сфер —\nрадиусы атомов','Atomic packing\nSphere sizes reflect\natomic radii',23,C.grey);
  const magnesiumLabels=TrnaMagnesiumLabels.create(overlay,box);
  function paint(){
   const frame=sample(state.time),s=frame.values,out=world.paint(s),pts=out.points,zoom=Math.max(s.zoomAnti,s.zoomCCA,s.elbowZoom,s.atomicView,s.mgZoom);
   const lang=D.i18n.lang();if(frame.cue!==lastCue||lang!==lastLanguage||frame.captionPhase!==lastCaptionPhase){
    const cue=cues[frame.cue],locale=lang==='en'?'En':'Ru';
    v.title(cue['title'+locale]);v.caption(cue[(frame.captionPhase==='detail'?'caption':'approach')+locale]||'');
    lastCue=frame.cue;lastLanguage=lang;lastCaptionPhase=frame.captionPhase;
   }
   F.opacity(v.cap,frame.captionOpacity);v.cap.dataset.captionPhase=frame.captionPhase;
   F.opacity(seqNote.el,(1-s.fold)*(1-s.seqZoom));F.opacity(seqZoomLabel.el,s.seqZoom);
   F.opacity(diagramLabels,s.simple*(1-s.model)*(1-F.phase(s.landmarks,0,1)));
   F.opacity(locatorCaption.el,Math.max(Math.max(s.zoomAnti,s.zoomCCA,s.elbowZoom,s.atomicView)*(1-F.phase(s.mgCharge,0,.4)),F.phase(s.mgZoom,.45,.85)));
   F.opacity(morphNote.el,s.model*(1-F.phase(s.angle,0,15))*(1-zoom)*(1-s.final));
   const a=mean(pts,[34,35,36]),c=mean(pts,[74,75,76]);
   const landmarks=(1-F.phase(s.mgCharge,0,.2))*F.phase(s.landmarks,0,1)*s.simple*(1-s.atomicView)*(1-F.phase(s.elbowZoom,0,.2))*(1-F.phase(s.stem,0,.2));
   place(anti,a,a[0]<640?'left':'right',0,landmarks*(1-s.zoomCCA));
   place(cca,c,'right',0,(1-F.phase(s.mgCharge,0,.2))*F.phase(s.landmarks,1,2)*s.simple*(1-s.atomicView)*(1-F.phase(s.elbowZoom,0,.2))*(1-F.phase(s.stem,0,.2))*(1-s.zoomAnti));
   place(five,pts[0],'left',-40,s.simple*F.phase(s.landmarks,1,2)*(1-s.model)*(1-zoom)*(1-s.final)*.85);
   place(stem,mean(pts,[1,7,66,72]),'right',0,F.phase(s.stem,.6,1)*(1-s.atomReveal));
   const elbowExit=(1-F.phase(s.stem,0,.35))*(1-F.phase(s.mgCharge,0,.35));
   F.opacity(elbow,s.elbowZoom*(1-F.phase(s.elbowAtoms,0,.4))*elbowExit);
   F.opacity(elbowText,F.phase(s.elbowAtoms,.5,1)*elbowExit);
   F.opacity(elbowLabels,F.phase(s.elbowAtoms,.65,1)*(1-F.phase(s.elbowStack,0,.2)+F.phase(s.elbowStack,.8,1))*elbowExit);
   F.opacity(elbowPairText.el,(1-F.phase(s.elbowSecond,0,.4))*(1-s.elbowExplain));
   F.opacity(elbowPsiText.el,F.phase(s.elbowSecond,.6,1)*(1-F.phase(s.elbowStack,0,.4))*(1-s.elbowExplain));
   F.opacity(elbowStackText.el,F.phase(s.elbowStack,.6,1)*(1-F.phase(s.elbowExplain,0,.4)));
   F.opacity(elbowLegend.el,(1-F.phase(s.elbowStack,0,.4))*(1-s.elbowExplain));
   F.opacity(elbowStackLegend.el,F.phase(s.elbowStack,.6,1)*(1-F.phase(s.elbowExplain,0,.4)));
   F.opacity(elbowResult.el,F.phase(s.elbowExplain,.6,1));F.opacity(elbowLimit.el,F.phase(s.elbowExplain,.6,1));
   if(out.elbowView){
    const slots={58:[368,460],18:[475,214],57:[680,259],19:[750,506]};
    elbowTags.forEach(o=>{const p=out.elbowView.center(o.id),dx=o.id<30?-84:16;
     const start=[Math.max(324,Math.min(813,p[0]+dx)),Math.max(192,Math.min(565,p[1]-47))],target=slots[o.id]||start;
     const x=F.lerp(start[0],target[0],s.elbowStack),y=F.lerp(start[1],target[1],s.elbowStack);
     o.label.setBox({x,y,width:103,height:38});
     const visible=[19,56].includes(o.id)?1:[18,55].includes(o.id)?s.elbowSecond:s.elbowStack;
     F.opacity(o.label.el,visible*(slots[o.id]?1:1-F.phase(s.elbowStack,0,.4)));
     const sx=x+51.5,sy=y+(y<p[1]?40:-3),vx=p[0]-sx,vy=p[1]-sy,d=Math.max(1,Math.hypot(vx,vy));
     F.seg(o.line,sx,sy,p[0]-vx/d*26,p[1]-vy/d*26);F.opacity(o.line,slots[o.id]?F.phase(s.elbowStack,.4,1)*.65:0);
    });
   }
   const ep=[18,19,55,56].map(id=>pts[id-1]),ex=ep.map(p=>p[0]),ey=ep.map(p=>p[1]);
   elbowContour.setAttribute('cx',(Math.min(...ex)+Math.max(...ex))/2);elbowContour.setAttribute('cy',(Math.min(...ey)+Math.max(...ey))/2);
   elbowContour.setAttribute('rx',(Math.max(...ex)-Math.min(...ex))/2+28);elbowContour.setAttribute('ry',(Math.max(...ey)-Math.min(...ey))/2+28);
   F.opacity(chemical,s.atomReveal*(1-s.detail));
   F.opacity(pairLabels,s.focus*s.atomReveal);
   if(s.atomReveal>0&&out.atomView){
    const p=out.atomView.center(3),q=out.atomView.center(70),y=Math.max(190,Math.min(505,Math.min(p[1],q[1])-22));
    gLabel.setBox({x:302,y,width:140,height:46});cLabel.setBox({x:902,y,width:160,height:46});
    F.seg(gl,444,y+23,p[0]-12,p[1]);F.seg(cl,900,y+23,q[0]+12,q[1]);
   }
   F.opacity(contactNote.el,s.contacts*(1-s.neighbors));F.opacity(neighbor,s.neighbors*(1-F.phase(s.atomAngle,45,65)));
   F.opacity(stacking.el,s.neighbors*F.phase(s.atomAngle,45,65));
   F.opacity(finalText.el,s.final*(1-F.phase(s.spacefill,0,.35)));F.opacity(oneMolecule.el,s.final*(1-F.phase(s.spacefill,0,.35)));
   F.opacity(volumeNote.el,F.phase(s.spacefill,.65,1));
   magnesiumLabels.paint(s,out);
   const kind=s.mgZoom>.5?tr('Mg²⁺ · вода · фосфаты','Mg²⁺ · water · phosphates'):s.mgCharge>.5?tr('3D · ионное окружение','3D · ionic environment'):s.spacefill>.5?tr('3D · атомные сферы','3D · atomic spheres'):s.elbowAtoms>.5?tr('3D · основания локтя','3D · elbow bases'):s.atomReveal>.5?tr('Атомы · 1EHZ','Atoms · 1EHZ'):s.model===1?tr('3D · координаты C4′','3D · C4′ coordinates'):s.model>0?tr('2D → 3D · сопоставление','2D → 3D · correspondence'):s.fold>.99?tr('2D · карта пар','2D · pair map'):tr('Последовательность','Sequence');
   mode.setText(kind);v.root.dataset.filmTime=state.time.toFixed(4);v.root.dataset.cue=String(frame.cue);v.root.dataset.source='1EHZ';
   controller?.update();
   g.TrnaJourney.snapshot={time:state.time,cue:frame.cue,captionPhase:frame.captionPhase,captionOpacity:frame.captionOpacity,values:{...s},camera:out.camera,points:pts.map(p=>p.slice())};
  }
  const driver=F.driver(state,paint);ctx.onDispose(driver.dispose);
  controller=Cinema.mount(ctx,{root:v.root,state,driver,cues,duration:DURATION,narrativeIndex:time=>sample(time).cue});
  ctx.onDispose(D.i18n.onChange(paint));
  g.TrnaJourney.actor=world;g.TrnaJourney.paint=paint;
  cues.slice(1).forEach((_,i)=>ctx.step(()=>controller.go(i+1,true)));
  paint();return v.root;
 }});
g.TrnaJourney={cues,duration:DURATION,sample,baseline,source:URL,catalog:TrnaFilmStory.catalog(originalScript,TrnaMagnesiumStory.cues,baseline)};
})(window);
