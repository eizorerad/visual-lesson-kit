# Каталог тринадцати примеров

Сначала изучите [storyboard.md](storyboard.md) и законченный рецепт `js/recipes/representation-journey.js`: три связанные сцены показывают, как объединить `L.textBox`, `F.motionTrack`, `F.shared` и пространственную камеру. Его автономная версия находится в библиотеке в `examples/representation-journey.html`; исходник переносится генератором в каждый урок. Следующая галерея — дополнительные отдельные приёмы, а не замена этому связному примеру.

Галерея — набор небольших работающих образцов с учебными данными. Выберите представление, которое объясняет операцию в вашей статье; новый материал должен иметь собственный вопрос и связную историю. Для работы достаточно библиотеки и первичного материала пользователя. Все названные файлы находятся внутри `starter/` библиотеки, а после `create.py` — непосредственно в папке созданного урока.

| № и файл в `js/episodes/` | Что объясняет | Готовые API | Что проверяет автор |
|---|---|---|---|
| 01 · `01-objects.js` | Восемь знаков становятся восемью участками столбика; затем масштаб меняется при прежнем значении. | `F.stage`, `F.group`, `F.cell`, `F.path`, `F.step`, `K.viewport` | Идентичность объекта должна соответствовать научному смыслу; изменение вида не доказывает изменение клетки во времени. |
| 02 · `02-distribution.js` | Отдельные значения становятся распределением на общей шкале. | `K.linearScale`, `K.histogram` | Единицы, границы bin, счётчики и масштаб; площадь или высота не должна незаметно менять значение. |
| 03 · `03-replicates.js` | Отдельные измерения и их сводка остаются различимыми. | `K.replicates` | Что является независимым повтором; среднее не скрывает разброс и не добавляет наблюдений. |
| 04 · `04-source.js` | Приближение заданного фрагмента исходного изображения. | `K.sourceWindow`, `T.evidence` | Исходный рисунок, его размеры, разрешённое использование, подпись и точная область. Приближение не меняет научные значения. |
| 05 · `05-ponder.js` | Зритель формулирует догадку до ответа. | `T.ponder`, `K.linearScale` | Подсказка помогает рассуждать; ответ объясняет причину и раскрывается отдельным действием. |
| 06 · `06-sequence.js` | Те же символы меняют расположение, сохраняя индексы и заданные связи. | `K.sequenceTrack`, `T.control`, `T.buttons` | Последовательность, координаты и пары заданы явно. Helper не предсказывает структуру или допустимые пары. |
| 07 · `07-heatmap.js` | Перестановка строк/столбцов меняет вид таблицы, сохраняя значения ячеек. | `K.heatmap` | Фиксированный цветовой диапазон и биекция порядка; перестановка сама по себе не вычисляет кластеризацию. |
| 08 · `08-partition.js` | Наблюдения получают роли построения, резерва и проверки. | `K.partitionActors` | Каждый ID присутствует ровно один раз; сохранены число объектов и смысл резерва. Перемещение не обучает модель. |
| 09 · `09-prediction.js` | Корреляция и ошибка значений отвечают на разные вопросы. | `K.predictionComparison`, `F.driver`, `T.control` | Единая шкала и текущие пары чисел. L2 не RMSE; Pearson постоянного ряда не определён. |
| 10 · `10-resampling.js` | Исходные записи → выборка с возвращением → среднее → другие заданные выборки. | `K.resampleMean` | Единица пересэмплирования, зависимости и парность. Повтор ID означает копию записи. Несколько показанных средних не обосновывают доверительный интервал. |
| 11 · `11-threshold.js` | Порог связывает выбранные случаи, целые счётчики, precision/recall и площадь. | `K.binaryRanking`, `K.thresholdCurve`, `F.driver` | Точное правило `score ≥ threshold`, группировка равных оценок. Площадь здесь — дискретная average precision; при отсутствии положительных случаев recall/AP недоступны. |
| 12 · `12-viewpoint.js` | Другой ракурс открывает отношение в том же фиксированном облаке. | `K.project3D`, `K.spatialScene`, `F.driver` | Координаты и расстояния не меняются; проекция может скрывать или создавать перекрытия на экране. |
| 13 · `13-dimension.js` | Плоскость → наклон → третья ось → известная высота над сохранённой проекцией. | `K.project3D`, `K.spatialScene`, `F.driver` | Третье значение задано заранее. Нельзя восстановить его вращением двумерного изображения. |

## Где прочитать API

Базовые примитивы, шкалы, гистограмма, повторы и окно рисунка описаны в [components.md](components.md). Для примеров 5–6 используйте [inquiry.md](inquiry.md), для 7–8 — [matrices-partitions.md](matrices-partitions.md), для 9 — [predictions.md](predictions.md), для 10 — [resampling.md](resampling.md), для 11 — [threshold.md](threshold.md), для 12–13 — [perspective.md](perspective.md).

Во всех примерах объект создаётся один раз, а `paint()` обновляет его текущее состояние. Для анимации, которую может прервать ползунок, используйте `F.driver` и `ctx.onDispose`; для последовательных фаз — `F.phase`, `F.revealStroke` и `F.growArrow`. См. [interaction.md](interaction.md). Область `K.viewport` ограничивает рисунок, но автор проверяет подписи, наложения и весь путь движения.

## Как сделать урок по новому PDF

1. Прочитайте вопрос статьи, Methods, результаты и подписи. Для каждого факта укажите страницу, рисунок или таблицу; различайте результат, авторскую интерпретацию и собственную учебную схему.
2. Создайте папку через `create.py`, выберите подходящие примеры и напишите связный сценарий: вопрос → исходные объекты → операция → наблюдение → ограничение вывода.
3. Замените учебные числа и тексты, подключите нужные эпизоды в `index.html`, удалите неиспользуемые изображения. Сохраните явные источники. Исходный PDF не требует поиска других презентаций.
4. Подготовьте оба языка холста, заметок и вопросов по [languages.md](languages.md). Шрифт, цветовые роли и компоновка следуют [theme.md](theme.md).
5. Проверьте расчёты, все состояния, промежуточное движение и реальные рамки текста в RU/EN; затем соберите и откройте автономный HTML по [qa.md](qa.md).

`scene.qa` используется для определений и ошибочных трактовок; общая панель чтения содержит пояснения, вопросы и поиск. Готовая галерея имеет 13 сцен, 52 состояния заметок и 26 вопросов. Это свойства примеров, а не требование к размеру нового урока. История разработки и границы прав описаны в [provenance.md](provenance.md).


## Connected explanation recipe (0.11)

Use `js/recipes/explanation-bridges.js` / `explanations.html` when a viewer understands individual steps but loses their connection: repeat a fixed map, unpack a quantile query, increase numerical grid density without adding observations, distinguish W₂² from W₂, and connect the minimizing parameter to the displayed curve. Four scenes, 14 states, RU/EN. See [explanation-design.md](explanation-design.md); choose only the operations your topic needs.

## Branched synthesis and whole-region interaction

Use `js/recipes/pipeline-synthesis.js` / `synthesis.html` when several inputs meet in construction and one result needs distinct evaluation questions. Four scenes and thirteen states use one exact two-cell fixture; common shift and retained spread change different quantities. Fixed positions, ID continuity, animated routes and current-state captions make the local lessons add up to a full picture. See [pipeline-synthesis.md](pipeline-synthesis.md). `--template synthesis` creates this optional editable example.

For click targets that include empty space around a scientific motif, use [T.svgButton](interaction-regions.md), then the opt-in [hit-region audit](hit-region-audit.md). Keep the selected motif, accessible name and keyboard focus distinct. Do not replace all old buttons merely to adopt the new helper.
