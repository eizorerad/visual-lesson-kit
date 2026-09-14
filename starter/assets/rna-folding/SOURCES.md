# Источники обновлённой презентации

Источники проверены 13 сентября 2026. Это перенос завершённого урока revision 4: 17 сцен, 63 состояния, русский и английский языки. Ниже перечислены первичные источники и границы их использования. Дополнительные ссылки доступны в пояснениях сцен. Названия тем на слайдах сокращены; здесь указаны названия статей. Порядок и учебные операции описаны в [STORYBOARD.md](STORYBOARD.md).

| Тема | Первичный источник | Как использован |
|---|---|---|
| Иерархия фолдинга | [Shelton et al., 2001. Altering the intermediate in the equilibrium folding of unmodified yeast tRNAPhe with monovalent and divalent cations](https://pubmed.ncbi.nlm.nih.gov/11297430/) | Вторичная и третичная структура могут формироваться раздельно или сопряжённо в зависимости от ионных условий. |
| Рибоза и геометрия | [Harp et al., 2022. Cryo neutron crystallography demonstrates influence of RNA 2′-OH orientation on conformation, sugar pucker and water structure](https://pmc.ncbi.nlm.nih.gov/articles/PMC9303348/) | 2′-OH, вода и геометрия сахара связаны; локальные исключения возможны. |
| Контекст пар | [Xia et al., 1998. Thermodynamic parameters for an expanded nearest-neighbor model for formation of RNA duplexes with Watson-Crick base pairs](https://pubmed.ncbi.nlm.nih.gov/9778347/) | Устойчивость определяется соседними парами и контекстом, не только числом H-связей. |
| G–U | [Chen et al., 2012. Testing the Nearest Neighbor Model for Canonical RNA Base Pairs: Revision of GU Parameters](https://pmc.ncbi.nlm.nih.gov/articles/PMC3335265/) | Отдельная экспериментальная опора для контекстной термодинамики GU. |
| Реальная тРНК | [Shi & Moore, 2000. The crystal structure of yeast phenylalanine tRNA at 1.93 Å resolution: a classic structure revisited](https://pmc.ncbi.nlm.nih.gov/articles/PMC1369984/); [PDB 1EHZ](https://www.rcsb.org/structure/1EHZ) | Координаты C4′ модели 1 цепи A, 76 остатков. Их происхождение и границы проверки записаны в [trna-1ehz.json](trna-1ehz.json). |
| Коаксиальный стэкинг | [Walter et al., 1994. Coaxial stacking of helixes enhances binding of oligoribonucleotides and improves predictions of RNA folding](https://pubmed.ncbi.nlm.nih.gov/7524072/) | Контакт концевых пар соседних спиралей. |
| Kissing loops | [Kim & Tinoco, 2000. A retroviral RNA kissing complex containing only two G·C base pairs](https://pmc.ncbi.nlm.nih.gov/articles/PMC16875/) | Две GC-пары между GACG-тетрапетлями; учебные стебли на рисунке не выдаются за измеренный конструкт. |
| A-minor | [Nissen et al., 2001. RNA tertiary interactions in the large ribosomal subunit: The A-minor motif](https://pubmed.ncbi.nlm.nih.gov/11296253/) | Контакт аденина с малой бороздкой, часто у CG-рецептора. |
| Тетрапетли | [Correll & Swinger, 2003. Common and distinctive features of GNRA tetraloops based on a GUAA tetraloop structure at 1.4 Å resolution](https://pmc.ncbi.nlm.nih.gov/articles/PMC1370402/); [Geary et al., 2008. Comprehensive features of natural and in vitro selected GNRA tetraloop-binding receptors](https://pmc.ncbi.nlm.nih.gov/articles/PMC2275092/) | Семейство GNRA и зависимость узнавания от рецептора. |
| Ионы | [Takamoto et al., 2004. Principles of RNA compaction: insights from the equilibrium folding pathway of the P4-P6 RNA domain in monovalent cations](https://pubmed.ncbi.nlm.nih.gov/15491606/) | Одновалентные катионы могут поддерживать компактизацию и многие, но не все, контакты конкретного РНК-домена. |
| Фолдинг при синтезе | [Incarnato et al., 2017. In vivo probing of nascent RNA structures reveals principles of cotranscriptional folding](https://academic.oup.com/nar/article/45/16/9716/3964622) | SPET-seq: структуры появляются и перестраиваются во время транскрипции. |
| Последовательное исследование пути | [Szyjka et al., 2025. Sequential structure probing of cotranscriptional RNA folding intermediates](https://www.nature.com/articles/s41467-025-60425-w) | TECprobe-LM и перестройка временной структуры SRP RNA. Анимация использует другой, явно учебный фрагмент. |
| Вложенные пары | [Nussinov et al., 1978. Algorithms for Loop Matchings](https://doi.org/10.1137/0135006) | Базовая задача непересекающегося паросочетания; O(L³) времени, O(L²) памяти. |
| RNA-FM | [Chen et al., 2022. Interpretable RNA Foundation Model from Unannotated Data for Highly Accurate RNA Structure and Function Predictions](https://arxiv.org/abs/2204.00300) | Исходная работа о модели представлений; **препринт**. |
| UFold | [Fu et al., 2022. UFold: fast and accurate RNA secondary structure prediction with deep learning](https://academic.oup.com/nar/article/50/3/e14/6430845) | U-Net, парные признаки и ограничения выходной карты; отдельная модель от RNA-FM. |
| RhoFold+ | [Shen et al., 2024. Accurate RNA 3D structure prediction using a language model-based deep learning approach](https://www.nature.com/articles/s41592-024-02487-0) | Стандартный процесс с RNA-FM и MSA, прямой выход 3D, ограничения обобщения. |

В сцене об ионах также есть ссылка на Bai et al. 2007: это эксперимент об ионной атмосфере на **ДНК**, не измерение изображённой РНК. Draper 2008 — дополнительный **обзор**, не первичная экспериментальная опора аудита.


## Координаты и границы моделей

Все экспериментальные координаты встроены в авторские JavaScript-модули: урок работает без сети. Копии JSON ниже нужны для редактирования и независимой проверки. Ссылки на статьи открываются только по действию читателя. Цвет обозначает учебную роль, а не химический элемент, если явно не указано иначе.

| Файл | Что сохранено | Где используется |
|---|---|---|
| [tertiary-1ehz.cif](tertiary-1ehz.cif) | Неизменённый официальный mmCIF 1EHZ, модель 1, рентгенография 1,93 Å. | Общий исходник всех видов 1EHZ. |
| [motif-1hr2.pdb](motif-1hr2.pdb) | Неизменённый официальный PDB 1HR2, P4–P6 ΔC209, рентгенография 2,25 Å. | Исходник сцены 12. Это мутант, не структура дикого типа. |
| [trna-1ehz.json](trna-1ehz.json) | 76 C4′ цепи A; исходные номера и 14 модифицированных остатков сохранены. Проверены все 75 последовательных O3′–P связей. | Сцены 10 и 15; исходник малого контекста сцены 4. |
| [duplex-trna-context.json](duplex-trna-context.json) | Те же 76 C4′ и авторский базис проекции. | Контекст целой тРНК в сцене 4. |
| [duplex-connected-1ehz.json](duplex-connected-1ehz.json) | Все 299 тяжёлых атомов остатков 1–7 / 66–72, сахарные кольца, гликозидные и фосфодиэфирные связи. | Сцены 4–5; соседние пары G3–C70, G4–U69, A5–U68. |
| [tertiary-v4-1ehz.json](tertiary-v4-1ehz.json) | 440 выбранных тяжёлых атомов 24 остатков: 1–7 / 66–72 и 49–53 / 61–65; 76 C4′ в контексте. | Сцена 11: акцепторный и T-стебель, стык U7–A66 / m5C49–G65. |
| [tertiary-v4-1hr2.json](tertiary-v4-1hr2.json) | 609 выбранных тяжёлых атомов 33 остатков: 145–158, 220–229, 245–253; 157 C4′ в контексте цепи A. | Сцена 12: GAAA150–153, рецептор 222–227 + 247–251. |
| [ions-1ehz.json](ions-1ehz.json) | 76 C4′, шесть выбранных P фосфатов, Mg auth A560 (label G), O воды auth A725–730 (label K). | Сцена 13: реальные расстояния Mg–O около 2,0 Å; атмосфера катионов показана отдельно как схема. |

SHA-256 исходного `tertiary-1ehz.cif`: `3021dd2b6461f850bb66d6748d3c22a5e1bb6cc891c625c15d793f38215b28ab`.

SHA-256 исходного `motif-1hr2.pdb`: `92e39092563e08f02f3396ba59ba6b36e19d2f7aea3c50f654c3c7b093133e24`.

- Координаты не изменены. Поворот камеры и увеличение не изображают физический путь фолдинга. Многоугольник кольца — способ отображения атомов, не молекулярная поверхность.
- C4′-линия — грубая трасса цепи, а не химическая связь. В атомных видах сахар, основание и фосфаты соединены явными связями. Пропущенный фрагмент не заменяется прямой ковалентной связью. В 1HR2 переход 208→210 соответствует удалённому C209 и проверен по геометрии реальной цепи.
- На стыке стеблей 1EHZ сохранена последовательная связь 65→66; связи 7→49 нет. [Разбор авторов DSSR](https://x3dna.org/highlights/stem-helix-and-coaxial-stacking-in-dssr) подтверждает коаксиальный стэкинг этих стеблей.
- [Juneau et al., 2001](https://doi.org/10.1016/S0969-2126(01)00579-2) — первичный источник 1HR2. [Doherty et al., 2001, таблица 1](https://doudnalab.org/Publications/nsb-8-339.pdf) подтверждает A-минорный контакт типа I A153→C223–G250. Обводка этой области не означает отдельную водородную связь или замену основания существующей пары.
- Водороды не добавлены. Пунктирные контакты G3–C70 показывают выбранные донорные/акцепторные тяжёлые атомы; линии не являются измеренными положениями водорода.

## Учебные схемы и объясняющие переходы

- Схема одного нуклеотида в сцене 3 — авторский химический рисунок. Она вводит части, связи, 2′-OH и смысл точки C4′ до первого экспериментального крупного плана.
- [Chu et al., 2009, Do conformational biases of simple helical junctions influence RNA folding stability and specificity?](https://pmc.ncbi.nlm.nih.gov/articles/PMC2779674/) подтверждает роль соединений спиралей в ограничении их взаимной ориентации. Две шпильки в сцене 9 — придуманный пример из 29 позиций: не измеренный ансамбль, расчёт энергии или координатная модель источника.
- GACG kissing loops — отдельная схема по Kim & Tinoco (2000), не часть 1EHZ. Межпетлевые пары комплементарны; пары собственных стеблей сохраняются.
- Ионная атмосфера и ко-транскрипционная последовательность — авторские иллюстрации. Они не задают измеренные числа ионов, энергии, скорости или предпочтительный конечный конформер.
- Сцена 15 повторно использует все 76 C4′ 1EHZ и правильно индексированную пару G3–C70. Это сравнение форматов предсказания и экспериментальной опоры: модель предсказания не запускалась, исключение 1EHZ из обучения конкретной модели не утверждается.
- Функциональные метки тРНК различают антикодон и конец присоединения аминокислоты. [Yusupov et al., 2001](https://pubmed.ncbi.nlm.nih.gov/11283358/) даёт первичный структурный контекст трансляции; мРНК, аминокислота и рибосома не добавлены к изолированной структуре 1EHZ.

Перенос использует текущий runtime Visual Lesson Kit. Устаревшие промежуточные JSON, старый runtime, архивы, скриншоты и готовые сборки исходного проекта не включены. Переносимый набор проверок находится в `../../qa/rna-folding/`.
