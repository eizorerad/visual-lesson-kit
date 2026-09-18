# Литература и научные уточнения

Поиск и проверка: 14 сентября 2026. Основа — первичные работы и официальная документация. Ссылки также доступны в пояснениях и вопросах непосредственно в HTML-презентации.

## Термодинамика и алгоритмы

- Turner & Mathews (2010). **NNDB: the nearest neighbor parameter database.** [DOI 10.1093/nar/gkp892](https://doi.org/10.1093/nar/gkp892); [официальная база](https://rna.urmc.rochester.edu/NNDB/). Экспериментальные параметры, мотивы и правила модели.
- Zuker & Stiegler (1981). **Optimal computer folding of large RNA sequences using thermodynamics and auxiliary information.** [DOI 10.1093/nar/9.1.133](https://doi.org/10.1093/nar/9.1.133). Термодинамическое динамическое программирование.
- Nussinov & Jacobson (1980). **Fast algorithm for predicting the secondary structure of single-stranded RNA.** [DOI 10.1073/pnas.77.11.6309](https://doi.org/10.1073/pnas.77.11.6309). Основа интервального ДП; подсчёт пар используется в уроке как упрощённая модель.
- Lyngsø, Zuker & Pedersen (1999). **Fast evaluation of internal loops in RNA secondary structure prediction.** [DOI 10.1093/bioinformatics/15.6.440](https://doi.org/10.1093/bioinformatics/15.6.440). Условия кубической оценки сложности.
- McCaskill (1990). **The equilibrium partition function and base pair binding probabilities for RNA secondary structure.** [DOI 10.1002/bip.360290621](https://doi.org/10.1002/bip.360290621). Статистическая сумма и вероятности пар.
- Huang et al. (2019). **LinearFold.** [DOI 10.1093/bioinformatics/btz375](https://doi.org/10.1093/bioinformatics/btz375). Приближённый поиск: O(nb log b), линейный по длине при фиксированной ширине луча b.
- Lyngsø & Pedersen (2000). **RNA pseudoknot prediction in energy-based models.** [DOI 10.1089/106652700750050862](https://doi.org/10.1089/106652700750050862). Вычислительная трудность общих классов псевдоузлов.
- Rivas & Eddy (1999). **A dynamic programming algorithm for RNA structure prediction including pseudoknots.** [DOI 10.1006/jmbi.1998.2436](https://doi.org/10.1006/jmbi.1998.2436). Полиномиальный алгоритм для ограниченного класса.
- Watters et al. (2016). **Cotranscriptional folding of a riboswitch at nucleotide resolution.** [DOI 10.1038/nsmb.3316](https://doi.org/10.1038/nsmb.3316). Экспериментальная роль истории синтеза.
- Arteaga et al. (2023). **Thermodynamic determination of RNA duplex stability in magnesium solutions.** [DOI 10.1016/j.bpj.2022.12.025](https://doi.org/10.1016/j.bpj.2022.12.025). Условия и поправки к устойчивости в присутствии Mg²⁺.

## Эволюция и сравнительные методы

- Lindgreen, Gardner & Krogh (2006). **Measuring covariation in RNA alignments.** [DOI 10.1093/bioinformatics/btl514](https://doi.org/10.1093/bioinformatics/btl514). Консервация, допустимые одиночные и компенсаторные замены.
- Bernhart et al. (2008). **RNAalifold: improved consensus structure prediction for RNA alignments.** [DOI 10.1186/1471-2105-9-474](https://doi.org/10.1186/1471-2105-9-474).
- Seemann, Gorodkin & Backofen (2008). **Unifying evolutionary and thermodynamic information for RNA folding of multiple alignments.** [DOI 10.1093/nar/gkn544](https://doi.org/10.1093/nar/gkn544). PETfold.
- Nawrocki & Eddy (2013). **Infernal 1.1: 100-fold faster RNA homology searches.** [DOI 10.1093/bioinformatics/btt509](https://doi.org/10.1093/bioinformatics/btt509). Ковариационные модели и поиск гомологии.
- Rivas, Clements & Eddy (2017). **A statistical test for conserved RNA structure.** [DOI 10.1038/nmeth.4066](https://doi.org/10.1038/nmeth.4066). R-scape и филогенетический фон.
- Tan et al. (2017). **TurboFold II.** [DOI 10.1093/nar/gkx815](https://doi.org/10.1093/nar/gkx815). Совместное выравнивание и предсказание по невыравненным гомологам.
- Rivas, Clements & Eddy (2020). **Estimating the power of sequence covariation.** [DOI 10.1093/bioinformatics/btaa080](https://doi.org/10.1093/bioinformatics/btaa080). Различие отсутствия сигнала и недостатка мощности.
- Rivas (2023). **RNA covariation at helix-level resolution.** [DOI 10.1371/journal.pcbi.1011262](https://doi.org/10.1371/journal.pcbi.1011262). Поддержка спиралей, мощность и риск кругового подтверждения.
- Ontiveros-Palacios et al. (2025). **Rfam 15: RNA families database in 2025.** [DOI 10.1093/nar/gkae1023](https://doi.org/10.1093/nar/gkae1023).

## Источник 3D-координат

- Shi & Moore (2000). **The crystal structure of yeast phenylalanine tRNA at 1.93 Å resolution.** [PDB 1EHZ](https://www.rcsb.org/structure/1EHZ); [DOI 10.1017/S1355838200000364](https://doi.org/10.1017/S1355838200000364). 76 нуклеотидов, связанный атомный фрагмент и гидратированный Mg560. Координаты и нумерация сохранены из курированного набора Visual Lesson Kit; исходные файлы и SHA-256 входят в проект.

## Что уточнено относительно исходного текста

1. MFE — оптимум выбранной модели, а в равновесии существует распределение структур.
2. Упрощённый Nussinov с подсчётом пар отделён от термодинамического Zuker/Turner.
3. LinearFold приближённый; линейная оценка относится к фиксированному b.
4. Псевдоузлы не всегда требуют экспоненциального алгоритма: сложность зависит от разрешённого класса и модели.
5. Ковариация — статистическое свидетельство с оговорками, а не прямое физическое наблюдение контакта. Родство, выравнивание и мощность важны.
6. G–C → G–U — одиночная допустимая замена; G–C → A–U меняет обе позиции. Показанный путь через G–U не является восстановленной историей.
7. Infernal/Rfam решают прежде всего задачу семейной гомологии; стандартные CM описывают вложенные пары. Статистические тесты ковариации не обязаны иметь то же ограничение топологии.
8. TurboFold II не требует заранее готового MSA, в отличие от обычных RNAalifold/PETfold.
9. Современные энергетические программы могут учитывать солевые поправки, хотя локальная модель мотивов не восстанавливает полную 3D-среду.

## Реальный расчёт для непрерывного визуального примера

- **ViennaRNA 2.7.2, RNA Turner 2004.** Официальные [Python API](https://www.tbi.univie.ac.at/RNA/ViennaRNA/doc/html/api_python.html), [оценка мотивов](https://www.tbi.univie.ac.at/RNA/ViennaRNA/doc/html/eval/eval_loops.html) и [статистическая сумма](https://www.tbi.univie.ac.at/RNA/ViennaRNA/doc/html/pf_fold.html). Использованы действительные результаты MFE, eval_loop_pt и PF для авторской последовательности GGACGAAACGUCC. Генератор, параметры и проверка всех 99 структур: `build/rna-prediction-data.py`, `assets/rna-prediction/thermo-example.json`, `assets/rna-prediction/COMPUTATION.md`.
- Для главного примера больше не используются условные энергии первой версии. MFE = −4.90 ккал/моль; четыре стэкинга −3.30, −2.40, −2.20, −2.40 и шпилечная петля +5.40. Вероятности относятся ко всем 99 структурам принятой модели, а не к трём показанным кандидатам.
- Новые 2D↔3D-переходы — отдельная авторская геометрическая интерпретация карты пар. Единственная 3D-структура и путь сворачивания в этом расчёте не определялись.

## Происхождение примеров и границы переноса / Provenance and illustration boundaries

This bibliography is preserved from the source RNA prediction presentation, researched on 14 September 2026. Its literature supports the scientific explanations; it does not make every diagram a measured or computed result.

- **Computed fixture:** the authored 13-nt sequence `GGACGAAACGUCC` has real ViennaRNA 2.7.2 / Turner 2004 model energies and equilibrium probabilities for all 99 allowed structures. These are calculations conditional on the stated model, not experimental measurements. [COMPUTATION.md](COMPUTATION.md) records settings, exact energy terms, reproduction, and verification. The JSON retains historical calculation provenance unchanged; the portable reproducer is `build/rna-prediction-data.py`.
- **Schematic geometry:** the shared `js/rna-pair-molecule.js` preserves nucleotide identities and supplied pair topology while arranging an authored right-handed stem and loop geometry. Candidate changes, camera rotation, loop variants and 2D↔3D transitions do not compute atomic coordinates, a unique tertiary structure, or a kinetic folding pathway.
- **Illustrative teaching alignment:** the six aligned 13-nt rows and G–C → G–U → A–U substitution sequence are authored examples. They are not a downloaded biological MSA, a phylogenetic reconstruction, or a statistical covariation test. Compatibility of the illustrated pairs is checked; apparent covariation is not presented as measured structural evidence. The literature distinguishes conservation, compatible single substitutions, compensatory changes, relatedness and statistical power.
- **Distinct source coordinates:** the cited PDB 1EHZ tRNA and hydrated Mg560 belong to the separate curated RNA folding coordinate assets, documented in `assets/rna-folding/SOURCES.md`. They are not coordinates for this 13-nt teaching sequence. Coordinate-derived views should retain the cited deposited structure and numbering; schematic prediction views must retain their schematic label.
- **Algorithm demonstrations:** pair-count interval dynamic programming is an explicitly simplified teaching model. It is not the ViennaRNA thermodynamic evaluator. Literature statements about pseudoknot classes, beam width, alignment requirements and statistical support retain the qualifications listed above.

Viewing the lesson and running `node qa/rna-prediction/science.cjs` use shipped static data and require no ViennaRNA installation. Reproducing the thermodynamic calculation itself requires the pinned environment described in [COMPUTATION.md](COMPUTATION.md).
