/* Edit this recipe: data → component roles → camera states → explanation.
 * No projection, depth sorting, slider plumbing or animation loop is needed here.
 * See guide/molecular-views.md. Each state supplies a caption and a RU/EN note.
 */
(function(){
'use strict';
const text=(ru,en)=>({ru,en}),data=MOLECULAR_VIEW_DATA;
const source={url:'https://doi.org/10.1038/s41586-021-03415-4',label:'7BG9 · Ghanim et al. 2021'};
const chapter=text('Теломераза человека','Human telomerase');
D.i18n.pack('en',{strings:{[(window.LESSON||{}).title||'Молекулярный конструктор']:'Telomerase: complex and template'}});

MolecularScenes.overview({
 id:'complex',title:text('Фермент с собственной РНК','An enzyme with its own RNA'),chapter,source,data,
 chains:{A:{color:C.blue,width:1.5,opacity:.72},B:{color:C.gold,width:3.2,opacity:.9},N:{color:C.red,width:4.5},M:{color:C.grey,opacity:.25},L:{color:C.grey,opacity:.25}},
 legend:[
  {chain:'A',label:text('TERT · белок','TERT · protein'),description:text('Катализатор: строит ДНК','Catalyst: builds DNA')},
  {chain:'B',label:text('TR / hTR · РНК','TR / hTR · RNA'),description:text('Матрица и структурная опора','Template and structural scaffold')},
  {chain:'N',label:text('ДНК · субстрат','DNA · substrate'),description:text('Серым: H2A–H2B в 7BG9','Grey: H2A–H2B in 7BG9')}
 ],
 annotation:text('Модель по cryo-EM · 7BG9 · 3,8 Å','Cryo-EM-derived model · 7BG9 · 3.8 Å'),
 // Optional close framing of this verified fixture. Omit camera for a safe auto-fit.
 camera:{origin:data.origin,cx:435,cy:373,scale:2.45,angle:0,pitch:0},
 control:{label:text('Ракурс','View angle'),min:-35,max:55},
 states:[
  {caption:text('RNP означает: белок и РНК работают в одном комплексе.','RNP means that protein and RNA work within one complex.'),
   note:text('Теломераза удлиняет 3′-конец теломерной ДНК на конце хромосомы. Показано каталитическое ядро 7BG9: TERT, структурированная РНК hTR и связанная ДНК. ДНК является субстратом.','Telomerase extends the 3′ end of telomeric DNA at a chromosome end. The view shows catalytic core 7BG9: TERT, structured hTR and bound DNA. DNA is the substrate.')},
  {camera:{angle:32,pitch:24},caption:text('Косой ракурс показывает путь РНК вокруг каталитического белка.','The oblique view reveals the RNA path around the catalytic protein.'),
   note:text('Меняется только камера. Линии изображают трассы Cα белков и P нуклеиновых кислот. Пропуски модели не соединены. Разрешение 3,8 Å относится к cryo-EM реконструкции.','Only the camera changes. Lines depict protein Cα and nucleic-acid P traces. Model gaps are not bridged. The 3.8 Å resolution describes the cryo-EM reconstruction.')},
  {opacity:{A:.18},caption:text('Белок выполняет реакцию. РНК задаёт матрицу для синтеза ДНК.','The protein performs the reaction. RNA supplies the template for DNA synthesis.'),
   note:text('Ослабление белка раскрывает РНК; оно не означает удаления TERT из фермента. hTR — функциональная некодирующая РНК. Полный человеческий комплекс содержит дополнительные белки.','Dimming the protein exposes RNA; it does not mean TERT leaves the enzyme. hTR is functional noncoding RNA. The complete human complex contains additional proteins.')}
 ],
 qa:[{q:text('Почему это одновременно фермент и RNP?','Why is it both an enzyme and an RNP?'),a:text('Фермент — каталитическая функция; RNP — состав из белка и РНК.','Enzyme describes catalytic function; RNP describes protein–RNA composition.')}]
});

const rna=data.fragments.rna,dna=data.fragments.dna;
MolecularScenes.detail({
 id:'template',title:text('Матрица — короткий участок длинной РНК','The template is a short part of a long RNA'),chapter,source,
 parts:[{id:'rna',data:rna,color:C.gold,label:text('РНК 46–56','RNA 46–56')},{id:'dna',data:dna,color:C.red,label:text('ДНК 13–18','DNA 13–18')}],
 context:{data:rna,color:()=>C.gold,label:text('hTR в модели ядра','hTR in the core model'),selectionLabel:text('Рамка: hTR 46–56','Frame: hTR 46–56')},
 annotation:text('7BG9 · один связанный комплекс · выбранные атомы','7BG9 · one bound complex · selected atoms'),
 camera:{origin:MC.centroid([...rna.residues,...dna.residues].map(r=>r.center)),cx:785,cy:363,scale:5.6,angle:0,pitch:0},
 control:{label:text('Ракурс детали','Detail angle'),min:-25,max:55},
 states:[
  {caption:text('Матричный участок занимает лишь часть функциональной РНК.','The template region is only part of the functional RNA.'),
   note:text('Человеческая hTR содержит 451 нуклеотид. Локатор показывает 256 моделированных нуклеотидов ядра; выделены позиции 46–56. Отсутствующие в модели участки не дорисованы.','Human hTR has 451 nucleotides. The locator shows 256 modeled nucleotides in the core; positions 46–56 are selected. Missing model regions have not been added.')},
  {camera:{scale:9},caption:text('Приблизим те же атомы: РНК-матрица соседствует с ДНК-субстратом.','Zoom into the same atoms: the RNA template lies beside the DNA substrate.'),
   note:text('Увеличение сохраняет координаты, номера остатков и контекст. Показаны кольца оснований, сахар и выбранные связи. У ДНК сохранён дезоксирибозный состав; 2′-OH не добавлен.','Zoom preserves coordinates, residue IDs and context. The view shows base rings, sugars and selected bonds. DNA retains its deoxyribose composition; no 2′-OH is added.')},
  {camera:{angle:38,pitch:28},caption:text('Поворот разделяет наложенные цепи; их взаимная геометрия неизменна.','Rotation separates overlapping chains; their relative geometry is unchanged.'),
   note:text('Обе цепи вращаются в одной системе координат. Их атомы сортируются по общей глубине. Это один структурный снимок, а не запись ферментативного движения.','Both chains rotate in one coordinate system. Their atoms share a common depth order. This is one structural snapshot, not a recording of enzymatic motion.')},
  {caption:text('Матрица встроена в РНК, а удлиняемая цепь — ДНК.','The template belongs to RNA; the strand being extended is DNA.'),
   note:text('Матрица hTR 46–56: 5′-CUAACCCUAAC-3′. Не все 11 нуклеотидов спарены одновременно. Для объяснения последовательности синтеза нужна отдельно обозначенная схема цикла.','hTR template 46–56 is 5′-CUAACCCUAAC-3′. Not all 11 nucleotides are paired at once. Explaining the synthesis sequence requires a separately identified cycle schematic.')}
 ],
 qa:[{q:text('Все 451 нуклеотид служат матрицей?','Are all 451 nucleotides a template?'),a:text('Нет. Короткий участок задаёт последовательность, другие участки организуют комплекс и участвуют в его биогенезе.','No. A short region supplies the sequence; other regions organize the complex and support its biogenesis.')}]
});
})();
