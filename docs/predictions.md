# Matched predictions and two computed metrics

`K.predictionComparison` compares **scalar measurements for the same observation IDs**. Every row keeps its observed value, base prediction and SVG objects. A shared amplitude multiplies the raw base predictions; the common numerical scale stays fixed. Current values, residuals, Pearson and L2 are computed together.

Load `js/predictions.js` after `js/film.js` and `js/patterns.js`, before any episode using it. No stylesheet, data file, external library or network request is added. The gallery loads `js/episodes/09-prediction.js` after episode 08. Generated lessons must include the scripts in their index before bundling.

```js
const stage = K.viewport(v.svg);
const comparison = K.predictionComparison(stage, {
  items: [
    { id: 'S1', observed: 2, predicted: 2 },
    { id: 'S2', label: 'Sample 2', observed: 4, predicted: 4 },
    { id: 'S3', observed: 6, predicted: 6 }
  ],
  domain: [0, 9], x: 180, y: 250, width: 500, height: 180,
  amplitude: 1, observedColor: C.white, predictedColor: C.blue
});
comparison.setAmplitude(1.5).showResiduals(1);
const { pearson, l2 } = comparison.metrics(); // 1; sqrt(14)
const values = comparison.values();
// [{id:'S1',observed:2,predicted:3,residual:1}, ...]
```

`items` must be a nonempty dense array. Each record needs a unique nonempty string `id` and finite numeric `observed` and `predicted`; optional `label` is a string and defaults to the ID. Relevant fields are copied and frozen, so later changes to the caller's array cannot change the comparison. Neither sorting nor matching by position across two unrelated arrays occurs: each record explicitly owns one observed/predicted pair.

The two finite `domain` endpoints must be strictly increasing and have a finite difference. Base observations, base predictions, initial scaled predictions and every subsequent scaled prediction must lie within this domain, including endpoints. The component rejects out-of-domain values instead of clipping or silently widening the scale. An amplitude may be zero or negative if all resulting values remain in the declared domain. It must be a finite number; numeric strings are rejected.

The required finite `x`, `y`, `width`, `height` describe the horizontal numerical lines and vertical row allocation, in stage units. Width is positive and height is at least 44 units per row. Both far edges must remain finite. Row centres are `y + (i + 0.5) * height/n`; observed circles in the main-text role (`C.white`) sit 8 units above these centres, and prediction squares in the primary role (`C.blue`) sit 8 units below. Only **horizontal position measures a value**. This small vertical separation makes equal values visible as two paired marks. Each residual is a horizontal segment in the focus role (`C.gold`) with flat ends and short connectors to the two marks.

Reserve space outside that rectangle: at least 6 units at each horizontal endpoint for glyphs, room to the left for ID labels ending at `x−22`, and a numeric rail to the right (label centres `x+width+35`, `+64`, `+95`). Longer labels and larger numbers need more space; the component does not truncate, wrap or shrink them. The author draws ticks, units and legend explicitly on the same scale, then checks the full scene and intermediate motion against its viewport. The gallery's `[0,12]` domain and `x=180,width=500` leave every glyph inside the safe stage, including the zero and maximum predictions.

| API | Meaning |
| --- | --- |
| `g`, `items`, `domain`, `xScale` | SVG group, immutable input copies and fixed value-to-x mapping. |
| `observedPoints`, `predictedPoints`, `residualLines` | Permanent SVG objects in input order. Each has `data-observation-id`. |
| `rowLabels`, `valueLabels` | Permanent row labels and per-row `{observed,predicted,residual}` text nodes. |
| `values()` | Immutable current `{id,observed,predicted,residual}` records. `predicted` is the scaled value, not the base prediction. |
| `metrics()` | Immutable current `{n,amplitude,pearson,l2}`. |
| `setAmplitude(a)` | Recomputes all values and metrics, then updates the existing nodes; returns the component. |
| `showResiduals(t)` | Sets residual segments, connectors and labels to opacity clamped to 0…1. `t` must be finite. Returns the component. |

Constructor validation completes before adding any nodes. Invalid setter input or an unrepresentable residual/L2 throws before changing either the DOM or the current numeric snapshot. A previously returned snapshot stays unchanged after later updates. `g.dataset.amplitude`, mark `data-value`, residual `data-residual` and accessible mark labels retain the current numeric values; visible per-row labels round to two decimal places. Metrics are not calculated from rounded labels.

## Arithmetic and interpretation

For row `i`, the component computes `pᵢ = amplitude × basePredictionᵢ` and `eᵢ = pᵢ − observedᵢ`. **No control subtraction, centring or normalisation changes the displayed raw values.** If a lesson needs changes relative to a control, the author supplies those explicitly as the observations/predictions and labels their units and reference.

L2 is `sqrt(sum(eᵢ²))`, calculated with iterative `Math.hypot` to avoid overflow from squaring otherwise representable residuals. It has the measurement's units. It is not mean error or RMSE, since there is no division by `n`; duplicating every observation increases L2 by `sqrt(2)`.

Pearson is `sum((oᵢ−mean(o))*(pᵢ−mean(p))) / sqrt(sum((oᵢ−mean(o))²)*sum((pᵢ−mean(p))²))`. Each series is first divided by its largest absolute value to reduce overflow in this calculation, without changing the mathematical correlation. This internal arithmetic does not rescale the drawing. The result is clamped to `[-1,1]` for floating-point rounding. For a constant observed or predicted series, or a single row, the result is **`null`**, meaning undefined. It must not be displayed as zero.

Positive rescaling leaves Pearson unchanged for nonconstant series. Negative rescaling reverses its sign; zero amplitude makes the prediction constant and Pearson undefined. High correlation does not establish equality of individual values. These are descriptive calculations using JavaScript numbers, without fitting, inference, p-values or a guarantee about future observations.

## Animation and interaction

Keep amplitude, marks, numbers and captions in one paint function. Use `F.driver` so a new slider input invalidates an older transition's frames. Register disposal with the player. Validate the intended amplitude range against every base prediction and the common domain before authoring a transition; `F.driver` validates its numeric state, while this component validates the measurement domain.

```js
const state = { amplitude: 1 };
function paint() {
  comparison.setAmplitude(state.amplitude);
  const metrics = comparison.metrics();
  metricLabel.textContent = metrics.pearson === null
    ? 'не определён' : metrics.pearson.toFixed(2);
  errorLabel.textContent = metrics.l2.toFixed(2);
}
const driver = F.driver(state, paint);
ctx.onDispose(driver.dispose);
paint();
// In a slider callback: driver.set({amplitude: value});
ctx.step(() => driver.to({amplitude: 1.5}, {duration: 1800}));
```

The helper does not own an animation loop, auto-fit its domain or install global event handlers. On a convex amplitude interval whose endpoints are valid, linearly interpolated predictions remain within the common domain. Arbitrary easing that overshoots can exceed it and will be rejected.

## Gallery 09 and provenance

`prediction-amplitude` («Корреляция ещё не означает точность») has three builds, four note states and two source-labelled questions. All values are newly written toy measurements: S1–S4 have observed/base predictions `[2,4,6,8]` conditional only on the displayed arbitrary units. There is no article link or imported empirical result.

1. Initial state: amplitude 1, exact pairs, Pearson 1 and L2 0.
2. First build: amplitude 1.5, predictions `[3,6,9,12]`, Pearson 1 and L2 `sqrt(30)` ≈ 5.48.
3. Second build: reveal residuals `[1,2,3,4]` and their L2 formula, preserving all values.
4. Third build: amplitude 0, four zero predictions, undefined Pearson and L2 `sqrt(120)` ≈ 10.95; reveal the 0…1.5 amplitude control.

This helper adapts the course-lesson operation of changing prediction amplitude while preserving matched observations. The current implementation computes metrics from the raw scalar values shown in each frame. Its illustrative measurements, fixed domain and explicit constant-series handling are documented above. Local development history and licensing and third-party attribution are recorded in [provenance.md](provenance.md).

## Verification

`node --test tests/predictions.cjs` uses jsdom. Five tests verify known non-perfect Pearson and L2 values, zero/negative amplitudes, constant/singleton cases, dense arrays and invalid inputs before mutation, and permanent IDs/objects at 81 intermediate amplitudes. The gallery test samples 246 transition frames across two complete replays, checks metrics against the displayed values and the full glyphs against the safe viewport, and checks four notes/two questions with no fictional URLs. Another test injects a slider event during a pending transition and disposes a scene before stale frames finish. These are arithmetic, identity, lifecycle and SVG-coordinate checks; they do not replace browser layout review.
