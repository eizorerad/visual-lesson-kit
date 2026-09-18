# Mg²⁺ и вода: научная опора и пять реплик фильма

Проверено 18 сентября 2026 года. Эта короткая последовательность продолжает объяснение D/T-контактов и возвращает зрителя к той же тРНК(Phe), PDB 1EHZ. Здесь отдельно обозначены общая физическая картина, депонированная кристаллографическая модель и авторские визуальные акценты.

## Три основные первичные работы

1. **Shi, H.; Moore, P. B. (2000).** The crystal structure of yeast phenylalanine tRNA at 1.93 Å resolution: a classic structure revisited. *RNA* **6**, 1091–1105. [DOI](https://doi.org/10.1017/S1355838200000364), [PDB 1EHZ](https://www.rcsb.org/structure/1EHZ), [исходный mmCIF](https://files.rcsb.org/download/1EHZ.cif). Экспериментальная опора для идентичности и расположения показанных атомов. Координаты вод и иона берутся из модели 1, а не из другой тРНК или модельной динамики.
2. **Bai, Y. et al. (2007).** Quantitative and Comprehensive Decomposition of the Ion Atmosphere around Nucleic Acids. *JACS* **129**, 14981–14988. [DOI](https://doi.org/10.1021/ja075020g), [полный текст](https://pmc.ncbi.nlm.nih.gov/articles/PMC3167487/). Работа измеряет состав ионной атмосферы модельных ДНК методом BE-AES, включая накопление катионов и вытеснение анионов. Это первичная опора общей физической картины; она не измеряет число или траектории ионов вокруг данной тРНК.
3. **Schauss, J.; Kundu, A.; Fingerhut, B. P.; Elsaesser, T. (2021).** Magnesium Contact Ions Stabilize the Tertiary Structure of Transfer RNA: Electrostatics Mapped by Two-Dimensional Infrared Spectra and Theoretical Simulations. *J. Phys. Chem. B* **125**, 740–747. [DOI](https://doi.org/10.1021/acs.jpcb.0c08966), [PubMed](https://pubmed.ncbi.nlm.nih.gov/33284610/), [полный текст](https://pmc.ncbi.nlm.nih.gov/articles/PMC7848891/). Спектроскопия и расчёты исследуют Mg²⁺, фосфаты и воду в тРНК; различают контактные и разделённые водой ионные пары. Смоделированный участок M8 между D- и T-областями нельзя отождествлять с выбранным кристаллографическим Mg560. Предлагаемый фильм не воспроизводит динамику или количественные результаты этой работы.

В существующем обсуждении также фигурирует **Byrne et al. (2010), NAR 38, 4154–4162**, [DOI](https://doi.org/10.1093/nar/gkq133). Эта работа посвящена немодифицированной тРНК(Phe) *E. coli*, PDB 3L0U. Она может служить сравнительным контекстом; из неё нельзя заимствовать атомы, положение Mg560 или воды для фильма о дрожжевой 1EHZ.

## Независимая проверка выбранного участка по координатам

Источник: локальный `../rna-folding/tertiary-1ehz.cif`, SHA-256 `3021dd2b6461f850bb66d6748d3c22a5e1bb6cc891c625c15d793f38215b28ab`. Ниже — наши евклидовы расстояния по депонированным координатам, без преобразований симметрии кристалла. Идентификаторы остатков авторские; для Mg560 `auth_asym_id=A`, `label_asym_id=G`; для воды `auth_asym_id=A`, `label_asym_id=K`. Все выбранные атомы относятся к модели 1.

Mg560: `_atom_site.id=1658`, имя атома `MG`, координаты `(62.649, 46.629, 27.595)` Å. Это один из шести Mg²⁺ в файле, а не добавленный условный катион.

| Вода, авторский номер | ID атома O | Mg560–O, Å |
|---|---:|---:|
| HOH725 | 1804 | 2.003985 |
| HOH726 | 1805 | 2.003552 |
| HOH727 | 1806 | 2.002963 |
| HOH728 | 1807 | 1.998988 |
| HOH729 | 1808 | 2.004865 |
| HOH730 | 1809 | 1.999169 |

Шесть кислородов образуют почти октаэдрическое окружение в **уточнённой модели**. Малый разброс расстояний и почти идеальные углы нельзя подавать как независимо измеренную точность каждого положения: кристаллографическая модель уточняется с геометрическими ограничениями.

Выбранные близости к неэфирным кислородам фосфатов:

| Вода O | Кислород фосфата | Расстояние O···O, Å |
|---|---|---:|
| HOH725 | U12 OP2 | 2.719749 |
| HOH726 | U8 OP1 | 2.822940 |
| HOH726 | A9 OP1 | 2.941908 |
| HOH727 | U8 OP2 | 2.765862 |
| HOH728 | C11 OP2 | 2.951649 |
| HOH729 | U8 OP2 | 2.677977 |
| HOH729 | A9 OP2 | 2.706650 |
| HOH730 | U12 OP2 | 2.646747 |

Ближайший атом РНК к самому Mg560 — U12 OP2, 3.696784 Å; U8 OP2 находится в 3.699653 Å. Следовательно, выбранный крупный план показывает полностью водное ближайшее координационное окружение Mg560 и соседство этой воды с фосфатами. Не следует рисовать прямые Mg560–фосфатные координационные связи длиной около 2 Å. Пунктир O···O обозначает близость, согласующуюся с взаимодействием через воду; положения H и направление каждой водородной связи из этого файла не следуют.

## Пять готовых двуязычных реплик

Нижние подписи имеют 109–123 знака, включая пробелы, в каждой языковой версии. Заголовок даёт биологическую мысль, нижняя подпись добавляет наблюдение. Номера Mg560 и HOH725–730 предназначены для заметок и локальных меток; их необязательно включать в крупный заголовок.

### 1. Заряженный остов

**RU title:** Фосфаты несут отрицательный заряд

**EN title:** Phosphates carry negative charge

**RU caption (109):** Фосфатные группы повторяются вдоль остова тРНК. Их одинаковые заряды создают электростатическое отталкивание.

**EN caption (123):** Phosphate groups repeat along the tRNA backbone. Their like charges create electrostatic repulsion between nearby segments.

**RU note:** После контактов оснований возвращаемся к остову той же молекулы. Отрицательный заряд относится к ионизованной фосфатной группе; знак «−» около её положения не означает отрицательный атом фосфора. Значки являются учебными указателями, а не расчётом распределения частичных зарядов или электрического потенциала. Координаты РНК сохраняются. Общая физическая опора: Bai et al., 2007; атомные положения: Shi & Moore, 2000 / 1EHZ.

**EN note:** After the base contacts, return to the backbone of the same molecule. The negative charge belongs to the ionized phosphate group; a minus sign near its position does not identify a negatively charged phosphorus atom. These markers are explanatory annotations, not a calculation of partial charges or electrostatic potential. RNA coordinates remain fixed. General physical context: Bai et al., 2007; atomic positions: Shi & Moore, 2000 / 1EHZ.

**Visual:** Overview of the existing 1EHZ fold; selective minus markers at phosphate positions. Do not deform the RNA or draw pairwise repulsive forces as measured vectors.

### 2. Ионная среда

**RU title:** Ионы ослабляют отталкивание

**EN title:** Ions reduce electrostatic repulsion

**RU caption (119):** Положительные ионы накапливаются вокруг РНК и экранируют её заряд. Mg²⁺ участвует в этой среде вместе с другими ионами.

**EN caption (118):** Positive ions accumulate around RNA and screen its charge. Mg²⁺ participates in this environment alongside other ions.

**RU note:** Полупрозрачное окружение — условная ионная атмосфера: оно не передаёт измеренные координаты, концентрацию или число частиц в 1EHZ. Экранирование ослабляет электростатическое взаимодействие, не удаляя заряд фосфатов. Ионная среда включает другие катионы и перераспределение анионов. Здесь нет временного ряда добавления соли или рассчитанного фолдинга. Bai et al., 2007 — экспериментальный источник общей картины, полученный на модельных ДНК.

**EN note:** The translucent surroundings illustrate an ion atmosphere; they do not represent measured coordinates, concentrations or particle counts for 1EHZ. Screening reduces electrostatic interactions while phosphate charges remain. Other cations and redistribution of anions also contribute. This is not a time series of salt addition or calculated folding. Bai et al., 2007 provides experimental context from model DNA systems.

**Visual:** Separate schematic environment from source-derived atom spheres by appearance and a small “схема среды / environment schematic” label. Preserve some phosphate minus markers as the environment appears.

### 3. Один ион в структуре

**RU title:** Mg²⁺ расположен рядом с остовом

**EN title:** Mg²⁺ lies near the backbone

**RU caption (115):** Выбранный Mg²⁺ расположен около остова остатков 8–12. Его положение, как и положение тРНК, взято из структуры 1EHZ.

**EN caption (119):** The selected Mg²⁺ lies near the backbone of residues 8–12. Its position, like those of the tRNA atoms, comes from 1EHZ.

**RU note:** Условная атмосфера уступает место одному конкретному объекту: Mg560, атом 1658, авторская цепь A, модель 1. Камера приближается к этому исходному положению, сохраняя контекст всей тРНК. Ион не прилетает из условного облака и не перемещает РНК. Этот участок близок к фосфатам U8, A9, C11 и U12, а не является прямым мостиком G18–Ψ55 или G19–C56. Источник: Shi & Moore, 2000 / 1EHZ и приведённые выше расчёты по координатам.

**EN note:** Replace the schematic atmosphere with one specific object: Mg560, atom 1658, author chain A, model 1. The camera approaches its deposited position while retaining the full tRNA as context. The ion does not fly in from the schematic cloud or move the RNA. This site lies near the phosphates of U8, A9, C11 and U12; it is not a direct bridge across G18–Ψ55 or G19–C56. Source: Shi & Moore, 2000 / 1EHZ and the coordinate calculations above.

**Visual:** Fade in Mg560 at its unchanged world coordinate, then move the camera. Keep a faint whole-molecule locator or chain trace.

### 4. Гидратированный Mg²⁺

**RU title:** Вода образует оболочку Mg²⁺

**EN title:** Water forms the Mg²⁺ hydration shell

**RU caption (112):** Шесть молекул воды окружают выбранный ион. Их атомы кислорода находятся примерно в 2 Å от Mg²⁺ в структуре 1EHZ.

**EN caption (114):** Six water molecules surround this ion. Their oxygen atoms lie about 2 Å from Mg²⁺ in the deposited 1EHZ structure.

**RU note:** Показаны именно O атомов HOH725–HOH730 из того же файла. Расстояния Mg–O составляют 1,999–2,005 Å; шесть O задают почти октаэдрическую оболочку в уточнённой модели. Тонкие направляющие показывают координационное окружение, а не ковалентные связи остова. Рентгеновская модель содержит для этих вод только кислород: атомы H и ориентации молекул воды не достраиваются. Размеры и цвета сфер — условное изображение, а не масштабы электронной плотности. Источник: Shi & Moore, 2000 / 1EHZ и расчёты выше.

**EN note:** Show the deposited oxygen atoms of HOH725–HOH730 from the same file. Mg–O distances are 1.999–2.005 Å; the six oxygens form a nearly octahedral shell in the refined model. Thin guides indicate the coordination environment, not covalent backbone bonds. These waters are represented only by oxygen in the X-ray model; do not add hydrogen atoms or water orientations. Sphere sizes and colors are display conventions, not electron-density measurements. Source: Shi & Moore, 2000 / 1EHZ and the calculations above.

**Visual:** Six small water-O spheres appear at fixed source coordinates; an annotation says “6 O воды · ≈2 Å / 6 water O · ≈2 Å”. A gentle camera rotation can expose depth without moving waters.

### 5. Через воду к фосфатам

**RU title:** Этот Mg²⁺ взаимодействует с РНК через воду

**EN title:** This Mg²⁺ interacts with RNA through water

**RU caption:** Три выбранных расстояния O···O между водой и фосфатами — 2,72–2,95 Å. Вода связывает окружение Mg²⁺ с остовом.

**EN caption:** Three selected O···O distances between water and phosphates are 2.72–2.95 Å. Water connects this Mg²⁺ site to the backbone.

**RU note:** Выделяем три O···O-близости из таблицы: HOH725–U12 OP2, HOH726–U8 OP1 и HOH728–C11 OP2. Вода расположена между Mg560 и фосфатами; это пример взаимодействия через гидратную оболочку. Пунктир не добавляет непосредственно наблюдённых водородов и не измеряет энергию связи. Ионная и водная среда входят в общую картину устойчивости РНК, но этот отдельный участок не доказывает механическую фиксацию D/T-петель. Schauss et al., 2021 даёт контекст роли Mg²⁺ и воды в тРНК; конкретные положения и расстояния здесь принадлежат 1EHZ. Затем камера возвращается к целой неизменённой тРНК, и фильм объединяет уже разобранные уровни перед показом атомной упаковки.

**EN note:** Highlight three O···O proximities from the table: HOH725–U12 OP2, HOH726–U8 OP1 and HOH728–C11 OP2. Water lies between Mg560 and the phosphates, illustrating interaction through the hydration shell. Dashed guides do not add observed hydrogen positions or measure bond energies. Ions and water contribute to RNA stability, but this one site does not demonstrate a mechanical clamp between the D and T loops. Schauss et al., 2021 provides context for Mg²⁺ and water in tRNA; these particular positions and distances belong to 1EHZ. Pull back to the same unchanged tRNA, then combine the explained levels before revealing the atomic space-filling view.

**Visual:** Add just two or three clear water-O···phosphate-O guides, using a distinct style from Mg–O coordination. Fade the local detail during the pullback; keep the RNA coordinates fixed throughout.

## Границы научного вывода

- Условные ионы окружения и реальные атомы Mg560/HOH725–730 должны быть визуально различимы. Облако не является полной экспериментальной ионной атмосферой 1EHZ.
- Отрицательный заряд фосфатов сохраняется при экранировании. Не анимировать исчезновение всех минусов или нейтрализацию химической группы.
- Добавление визуального слоя Mg²⁺ не вызывает изменения конформации. Движется камера; атомы остаются на исходных координатах.
- Mg560 не соединяет непосредственно D- и T-петли. Последовательность сцен означает переход объяснения, а не новую причинную связь между уже показанными контактами и этим ионом.
- Шесть близких лигандов Mg560 — водные O. Не заменять их атомами РНК и не рисовать напрямую координированные фосфаты для этого участка.
- В источнике нет H выбранных вод. Не изображать точные направления водородных связей, диполи воды или присоединение водородов как экспериментальные данные.
- Расстояние O···O позволяет выделить подходящую геометрию, но само по себе не даёт энергии, времени жизни или вклада в полную ΔG фолдинга.
- Ни координаты кристалла, ни авторский маршрут камеры не устанавливают порядок образования контактов или путь сворачивания в растворе.
