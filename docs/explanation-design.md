# Make the local steps add up to one idea

A technically correct slide can still leave a gap. The viewer needs to know what the objects mean, what operation changed them, and why that operation advances the question. This guide records reusable lessons from a reader-driven revision of the distQTL explanation; it does not make that paper's outline mandatory.

The standalone example is `examples/explanation-bridges.html` from the library root. In a generated project open `explanations.html`, or create its main entry with `create.py /new/path --template explanations`. The source `js/recipes/explanation-bridges.js` is copied into every project. Its four scenes have 14 states, 14 bilingual notes and four bilingual Q&A entries. Two invented eight-observation samples stay fixed throughout. The map is a local composition, not an imposed diagram or extra player control.

## Build the explanation around a question

Write a single opening question in ordinary words. List the few operations needed to answer it, and give each a recognizable motif. Reuse each motif, position, label and semantic color when returning to the map. After a technical section, briefly show which connection is now understood and name the next missing connection. Highlighting means “we have explained this operation”, not “this scientific claim is proved”. Arrows represent the stated relationship; analytical order does not imply biological causation.

For a longer paper, a useful chain might be observations → representation → comparison → model → uncertainty. Another topic may need two branches or no map. Use recurring checkpoints only where they reduce a real gap. Author each beat's operation, active objects, local edge sequence and caption; the number of clicks follows the explanation. Three highlighted nodes with the same full trace are not three explanatory steps. Keep the main drawing and caption complementary: do not repeat one long sentence in both.

Keep revealed connections in a persistent layer and animate the current operation in a separate overlay. Next advances that operation while known paths stay visible. Use a clear hierarchy of active, known and future content; known labels must remain readable in both backgrounds. An explicit replay follows only the already available route, preserves the beat, parameters and manual selection, and then restores prior attention. Manual exploration must not reveal future paths. See the [branched synthesis recipe](pipeline-synthesis.md) for one implementation, not a required map layout.

The final visual should answer the opening question using familiar objects. Reassemble the same relationships, state the takeaway, then identify what remains outside the conclusion. Do not introduce a fresh notation system or a new results table as the entire ending. A table is evidence to explain, not an explanation on its own.

## Operation → formula → substitution → interpretation

Use the same numerical state to draw marks, produce the displayed formula substitution, fill a probability strip and position any connecting line. A future endpoint must be labelled as a target while objects are moving. Mark rounded moving coordinates as approximate when rounding could change an order statistic or threshold decision; a displayed equality at a boundary must not contradict the calculation. If the readout describes the current position, show it immediately alongside its marker; a long fade can hide the calculation exactly when it matters.

For each unfamiliar formula:

1. Name each object and its units, including what a weight counts.
2. Show the operation geometrically: matching, summing, squaring, averaging or taking a root.
3. Substitute a small example whose objects already appeared.
4. State what the output means, including its units.
5. Offer a control only when it changes a named formula parameter; recompute every dependent mark and number from that parameter.

Do not skip the root in a distance: ½·25 + ½·25 = 25, then √25 = 5. Distinguish a candidate object, its score, its minimizing parameter and its minimum score. For the recipe's central curve, `J(t)=25[t²+(1−t)²]=50(t−½)²+12.5`. The minimizer is t=½; the curve has heights 2.5 and 7.5; 12.5 is the **sum** objective. The mean objective has minimum 6.25 and the same minimizing curve. The [distribution APIs](distributions.md) keep these operations separate.

Prefer one running numerical example. If switching is necessary, name the new invented data and explain why the simpler example helps. Do not morph observed individuals into new examples or estimates as if their identities continued.

## Distinguish resolutions, counts and inferential units

A quantile level u is a query; Q(u) is a value. Two hundred queries can return repeated values from eight observations. A curve's numerical grid is not a new sample. Keep the original observation count, number of evaluated positions and number of distinct returned values separate. Decrease marker radius continuously as the grid becomes dense so that marks do not conceal the function.

Other important distinctions: cells versus independent donors; observations versus resampled copies; within-sample spread versus uncertainty of an estimate; an observed association versus its possible mechanism. Explain the distinction at the point of use, not only as a late caveat.

## Turn a result into an explanation

For a plot or table, identify the comparison, hold its scales fixed, and show the feature that carries the result. For equal means with different distributions, mark the shared mean and reveal the tails or quantile differences. A schematic derived from a published image remains labelled schematic; do not fabricate raw donor or cell measurements from a raster.

For testing, separate the links:

- A statistic turns a comparison into a number.
- Permutations generate values under a stated null model and exchangeability conditions.
- A tail count compares the observed statistic with that distribution.
- Pooling null draws across tests adds an assumption about their comparability; it is not automatically valid for every statistic and design.
- Calibration concerns behaviour under a null model. Multiple-testing control concerns a family of decisions and requires its own procedure and assumptions.

Reuse the existing permutation and BH modules when they fit; do not label a pile of shuffled points “a calibrated test” without explaining these links. The worked bridge recipe ends at geometric difference and explicitly does not claim a statistical discovery.

## Geometry lessons worth retaining

The optional [branched synthesis recipe](pipeline-synthesis.md) adds a second pattern: two distinct inputs meet during construction, then the output is evaluated in separate ways. Stable positions help the reader distinguish the proposal, how it is expressed, and an independent reference used only for checking. Three checkpoints lead to the same full map. The reference has no arrow into construction when it was unavailable there.

If separate earlier toy examples used unrelated data, do not animate them into a false end-to-end calculation. Either make one consistent model or label the overview as schematic. A switch selecting a measured report row is not a simulation: its recorded score comes from evidence, not the drawing. Keep both on/off captions and any concluding comparison synchronized with the actual selected state; selecting another object should clear a stale comparison caption.

For cell-like glyphs, reserve separate bands for IDs and numeric values. A nucleus is a mark, not empty space for a number. Measure the gap from text to the complete glyph at endpoint and extreme inputs; a text-only audit cannot detect that conflict. Apply the same rule to scatter points, connector curves, frames and focus outlines. Reposition a heading or route rather than conceal the measured mark.

A horizontal quantity bar ends at the encoded value. A circular cap is an extra mark and can look like a separate observation or uncertainty marker; add one only when it has a stated meaning. Use a plain rectangle or explicit flat caps for an exact endpoint. Existing `F.dot`, `F.line` and `F.path` styles are not globally altered by this guidance.

Separate the visible motif from its activation area. Use [T.svgButton](interaction-regions.md) for a full transparent tile: SVG `fill="none"` with the default pointer policy reacts only on painted content. Neighboring activation rectangles should not overlap even when labels look separate. Selection can emphasize an existing halo or frame; an added dashed rectangle should not cross a data label. Keyboard focus needs a distinct visible indicator.

Use [guideSpan and boxAnchor](explanation-geometry.md) for thin flat-ended spans and exact attachments. Compute an object and its connector endpoint from the same pose in the same paint. Reordering rows into bins should preserve row orientation when that represents the grouping; move selected actors above a dense background when needed, without creating duplicates.

Reserve a separate numeric-label column for bars. Never clamp a label onto a bar endpoint merely to keep it inside the outer SVG. Inspect source and destination alignment, midpoint collisions, dash endpoints and label placement. For real measured scatter points, preserve coordinates; reduce marker radius or use a justified overlap representation rather than silently jittering the data.

The [development inspector](qa.md) checks intended text bounds and SVG/HTML text and control intersections. It does not prove that every stroke, tile, point or image is unobstructed, or that Next teaches a new operation. Add targeted invariants for exact attachments, known counts, preserved IDs and scientific quantities. Separately compare authored beats with actual attention and route progression, including replay after manual selection, and inspect rendered movement.

## Проверять рассказ во времени

Разбейте объяснение на «объект → действие → наблюдаемое следствие → следующий вопрос». Глава навигации может содержать несколько коротких реплик; она не должна быть целым новым рисунком, который появляется сразу. Приближение, перенос, изменение связи, раскрытие пути и изменение графика должны показывать отношение между состояниями. Если зритель видит лишь новую подпись и новый готовый слой, механизм ещё не объяснён.

Во время смены масштаба сохраните узнаваемый исходный объект. Разведите пути движущихся крупных планов и неподвижные подписи. Сначала переместите компактный объект в свободную область, затем увеличивайте; мелкие поясняющие подписи раскрывайте при достаточном масштабе. У растущей направленной стрелки направление должно быть видно тогда, когда о нём говорит реплика.

Настоящее время в реплике должно совпадать с показанным состоянием. До образования связи говорите «после присоединения получится…», а «связь образована» показывайте после изменения связности. Уравнение баланса, движение электронной пары, перенос ядра и смена равновесного ансамбля — разные учебные операции. Называйте смену представления, чтобы она не выглядела рассчитанной траекторией реакции.

До переноса примера в библиотеку проиграйте его целиком и проверьте несколько промежуточных моментов движения. Проверка постоянства SVG-узлов, чисел и текстовых рамок необходима, но не устанавливает понятность рассказа и отсутствие пересечений на движущемся пути. Рабочий образец такого сценария: `chemistry-bridge` и раздел о часах рассказа в `motion.md`.
