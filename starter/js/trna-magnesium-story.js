/* Source-backed bilingual Mg/water poses. TrnaFilmStory owns playback time. */
(function(g){
'use strict';
const baseline={"mgCharge":0,"mgAtmosphere":0,"mgSelect":0,"mgZoom":0,"mgWater":0,"mgBridge":0,"mgTurn":0};
const cues=[
 [
  141,
  {
   "elbowZoom": 0,
   "elbowAtoms": 0,
   "elbowSecond": 0,
   "elbowStack": 0,
   "elbowExplain": 0,
   "landmarks": 0,
   "angle": 15,
   "mgCharge": 1
  },
  "Фосфаты несут отрицательный заряд",
  "Phosphates carry negative charge",
  "Фосфатные группы повторяются вдоль остова тРНК. Их одинаковые заряды создают электростатическое отталкивание.",
  "Phosphate groups repeat along the tRNA backbone. Their like charges create electrostatic repulsion between nearby segments.",
  "После контактов оснований возвращаемся к остову той же молекулы. Отрицательный заряд относится к ионизованной фосфатной группе; знак «−» около её положения не означает отрицательный атом фосфора. Значки являются учебными указателями, а не расчётом распределения частичных зарядов или электрического потенциала. Координаты РНК сохраняются. Вода и ионы пока скрыты для ясности, а не удалены из раствора. Общая физическая опора: Bai et al., 2007; атомные положения: Shi & Moore, 2000 / 1EHZ.",
  "After the base contacts, return to the backbone of the same molecule. The negative charge belongs to the ionized phosphate group; a minus sign near its position does not identify a negatively charged phosphorus atom. These markers are explanatory annotations, not a calculation of partial charges or electrostatic potential. RNA coordinates remain fixed. Water and ions are temporarily hidden for clarity, not removed from solution. General physical context: Bai et al., 2007; atomic positions: Shi & Moore, 2000 / 1EHZ."
 ],
 [
  150,
  {
   "mgAtmosphere": 1
  },
  "Ионы ослабляют отталкивание",
  "Ions reduce electrostatic repulsion",
  "Положительные ионы накапливаются вокруг РНК и экранируют её заряд. Mg²⁺ участвует в этой среде вместе с другими ионами.",
  "Positive ions accumulate around RNA and screen its charge. Mg²⁺ participates in this environment alongside other ions.",
  "Полупрозрачное окружение — условная ионная атмосфера: оно не передаёт измеренные координаты, концентрацию или число частиц в 1EHZ. Экранирование ослабляет электростатическое взаимодействие, не удаляя заряд фосфатов. Ионная среда включает другие катионы и перераспределение анионов. Здесь нет временного ряда добавления соли или рассчитанного фолдинга. Bai et al., 2007 — экспериментальный источник общей картины, полученный на модельных ДНК.",
  "The translucent surroundings illustrate an ion atmosphere; they do not represent measured coordinates, concentrations or particle counts for 1EHZ. Screening reduces electrostatic interactions while phosphate charges remain. Other cations and redistribution of anions also contribute. This is not a time series of salt addition or calculated folding. Bai et al., 2007 provides experimental context from model DNA systems."
 ],
 [
  158,
  {
   "mgSelect": 1
  },
  "Mg²⁺ расположен рядом с остовом",
  "Mg²⁺ lies near the backbone",
  "Выбранный Mg²⁺ расположен около остова остатков 8–12. Его положение, как и положение тРНК, взято из структуры 1EHZ.",
  "The selected Mg²⁺ lies near the backbone of residues 8–12. Its position, like those of the tRNA atoms, comes from 1EHZ.",
  "Условная атмосфера уступает место одному конкретному объекту: Mg560, атом 1658, авторская цепь A, модель 1. Камера приближается к этому исходному положению, сохраняя контекст всей тРНК. Ион не прилетает из условного облака и не перемещает РНК. Этот участок близок к фосфатам U8, A9, C11 и U12, а не является прямым мостиком G18–Ψ55 или G19–C56. Источник: Shi & Moore, 2000 / 1EHZ и расстояния, рассчитанные по депонированным координатам.",
  "Replace the schematic atmosphere with one specific object: Mg560, atom 1658, author chain A, model 1. The camera approaches its deposited position while retaining the full tRNA as context. The ion does not fly in from the schematic cloud or move the RNA. This site lies near the phosphates of U8, A9, C11 and U12; it is not a direct bridge across G18–Ψ55 or G19–C56. Source: Shi & Moore, 2000 / 1EHZ and distances calculated from the deposited coordinates."
 ],
 [
  169,
  {
   "mgZoom": 1,
   "mgWater": 1
  },
  "Вода образует оболочку Mg²⁺",
  "Water forms the Mg²⁺ hydration shell",
  "Шесть молекул воды окружают выбранный ион. Их атомы кислорода находятся примерно в 2 Å от Mg²⁺ в структуре 1EHZ.",
  "Six water molecules surround this ion. Their oxygen atoms lie about 2 Å from Mg²⁺ in the deposited 1EHZ structure.",
  "Показаны именно O атомов HOH725–HOH730 из того же файла. Расстояния Mg–O составляют 1,999–2,005 Å; шесть O задают почти октаэдрическую оболочку в уточнённой модели. Тонкие направляющие показывают координационное окружение, а не ковалентные связи остова. Рентгеновская модель содержит для этих вод только кислород: атомы H и ориентации молекул воды не достраиваются. Размеры и цвета сфер — условное изображение, а не масштабы электронной плотности. Источник: Shi & Moore, 2000 / 1EHZ и расстояния, рассчитанные по депонированным координатам.",
  "Show the deposited oxygen atoms of HOH725–HOH730 from the same file. Mg–O distances are 1.999–2.005 Å; the six oxygens form a nearly octahedral shell in the refined model. Thin guides indicate the coordination environment, not covalent backbone bonds. These waters are represented only by oxygen in the X-ray model; do not add hydrogen atoms or water orientations. Sphere sizes and colors are display conventions, not electron-density measurements. Source: Shi & Moore, 2000 / 1EHZ and distances calculated from the deposited coordinates."
 ],
 [
  183,
  {
   "mgBridge": 1,
   "mgTurn": 0
  },
  "Этот Mg²⁺ взаимодействует с РНК через воду",
  "This Mg²⁺ interacts with RNA through water",
  "Три выбранных расстояния O···O составляют 2,72–2,95 Å. Вода связывает окружение Mg²⁺ с фосфатами U8, C11 и U12.",
  "Three selected O···O distances span 2.72–2.95 Å. Water links this Mg²⁺ environment to the phosphates of U8, C11 and U12.",
  "Показаны три O···O-близости: HOH725–U12 OP2 (2,720 Å), HOH726–U8 OP1 (2,823 Å), HOH728–C11 OP2 (2,952 Å). Вода расположена между Mg560 и фосфатами; это пример взаимодействия через гидратную оболочку. Пунктир не добавляет непосредственно наблюдённых водородов и не измеряет энергию связи. Ионная и водная среда входят в общую картину устойчивости РНК, но этот отдельный участок не доказывает механическую фиксацию D/T-петель. Schauss et al., 2021 даёт контекст роли Mg²⁺ и воды в тРНК; конкретные положения и расстояния здесь принадлежат 1EHZ. Далее все изученные уровни объединяются в общем виде той же молекулы.",
  "Three O···O proximities are shown: HOH725–U12 OP2 (2.720 Å), HOH726–U8 OP1 (2.823 Å), and HOH728–C11 OP2 (2.952 Å). Water lies between Mg560 and the phosphates, illustrating interaction through the hydration shell. Dashed guides do not add observed hydrogen positions or measure bond energies. Ions and water contribute to RNA stability, but this one site does not demonstrate a mechanical clamp between the D and T loops. Schauss et al., 2021 provides context for Mg²⁺ and water in tRNA; these particular positions and distances belong to 1EHZ. The next whole-molecule view brings these descriptive levels together."
 ],
 [
  192,
  {
   "mgCharge": 0,
   "mgAtmosphere": 0,
   "mgSelect": 0,
   "mgZoom": 0,
   "mgWater": 0,
   "mgBridge": 0,
   "mgTurn": 0
  },
  "Среда помогает поддерживать укладку тРНК",
  "The environment helps stabilize the tRNA fold",
  "Пары стеблей, контакты петель, вода и ионы входят в общую систему. Вместе они помогают поддерживать пространственную укладку тРНК.",
  "Stem pairs, loop contacts, water and ions form a wider system. Together they help support the spatial fold of tRNA.",
  "Камера возвращается к полной тРНК с неизменными координатами. Исчезновение учебных слоёв не означает удаления воды или ионов из раствора. Третичная укладка поддерживается совместной системой взаимодействий; отдельный Mg560 не является единственной причиной L-формы. K⁺, Na⁺ и другие компоненты среды также важны, а потребность в Mg²⁺ зависит от РНК и условий. Экспериментальный контекст: Schauss et al., 2021. В финале та же молекула будет показана объёмными атомными сферами.",
  "The camera returns to the full tRNA with unchanged coordinates. Fading explanatory layers does not mean removing water or ions from solution. Tertiary structure is supported by a network of interactions; Mg560 alone does not explain the L shape. K⁺, Na⁺ and other environmental components also matter, and Mg²⁺ requirements depend on the RNA and conditions. Experimental context: Schauss et al., 2021. The finale shows the same molecule as atomic spheres."
 ]
];
function sourceFor(time){
 if(time<141||time>192)return null;
 if(time<=150)return ['Bai et al., 2007 · ion atmosphere','https://doi.org/10.1021/ja075020g'];
 if(time===192)return ['Schauss et al., 2021 · Mg²⁺ / tRNA','https://pubmed.ncbi.nlm.nih.gov/33284610/'];
 return ['Shi & Moore, 2000 · PDB 1EHZ','https://www.rcsb.org/structure/1EHZ'];
}
g.TrnaMagnesiumStory=Object.freeze({baseline,cues,sourceFor});
})(window);
