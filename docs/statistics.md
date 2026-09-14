# Statistical operations with persistent observations

Load `js/statistics.js` after `film.js`, `layout.js` and `patterns.js`. It extends
`K` with three numerical operations and three optional SVG views. The runnable
RU/EN recipe `js/recipes/methods-statistics.js` registers `stats-spread`,
`stats-permutation` and `stats-bh` in the separate methods laboratory. These are
illustrative examples, not required scenes or a statistical analysis package.

Choose the scientific operation first. A new author can use a numerical result
with ordinary `F`/`L` actors, compose one of these views with another component,
or write a topic-specific scene. Bootstrap already has `K.resampleMean`; reuse
its explicit source-ID copies instead of implementing a second bootstrap helper.

## Pure numerical APIs

### Numerical input contract

All functions validate a dense nonempty array, reject nonfinite numeric inputs,
leave caller data unchanged, and return frozen objects and arrays. Numeric strings
are not silently converted. Arithmetic that cannot be represented finitely throws.

### Sample summary

```js
K.sampleSummary([2, 3, 4, 7, 8, 9]);
// {n:6, mean:5.5, residuals:[-3.5,-2.5,-1.5,1.5,2.5,3.5],
//  squares:[12.25,6.25,2.25,2.25,6.25,12.25], sumSquares:41.5,
//  variance:8.3, sd:Math.sqrt(8.3), sem:Math.sqrt(8.3/6)}
```

`K.sampleSummary(values)` uses sample variance with denominator `n−1`. A
singleton has a mean and zero residual, but `variance`, `sd`, and `sem` are
`null`, because sample uncertainty is undefined. Constant samples with at least
two observations have SD and SEM zero. SD is observation spread. `sem=sd/√n`
estimates the sampling SD of the mean under independent identically distributed
units with finite variance. The data alone cannot establish independence.
Neither `mean±SD` nor `mean±SEM` is automatically a confidence interval.

### Exact mean permutation

```js
const exact = K.exactMeanPermutation([2, 3, 4, 7, 8, 9], 3);
// exact.observed === -5; exact.extremeCount === 2;
// exact.assignments.length === 20; exact.pValue === .1
```

`K.exactMeanPermutation(values, groupSize)` treats the first `groupSize` entries
as observed group A and the rest as B. It enumerates every subset of that size,
in lexicographic source-index order, with at most 12 observations. Each frozen
assignment contains `groupA`, `groupB` (source indices), `meanA`, `meanB` and
`statistic=meanA−meanB`. Every source index occurs exactly once per assignment;
there is no resampling with replacement. The model also returns `n`, `groupSize`,
`observed`, `extremeCount`, `pValue`, `tolerance` and
`alternative:'two-sided-absolute'`.

The p value is the fraction with `|T|≥|Tobserved|`, inclusive of the observed
assignment. It cannot be zero. Equality permits `32×Number.EPSILON` times the
largest absolute enumerated statistic, to handle floating-point roundoff.
This convention is explicit: twice the smaller one-sided p value can differ for
an asymmetric distribution. This helper does not implement paired, blocked,
clustered or covariate-adjusted permutations. Exchangeability under the null is
an assumption supplied by the experimental design; equal means alone do not
make labels exchangeable. Never interpret p as a null-hypothesis probability.

### BH adjustment

```js
const bh = K.bhAdjust([.001, .012, .019, .041, .2, .65], .05);
// bh.adjusted: [.006,.036,.038,.0615,.24,.65]
// bh.k === 3; bh.rejected: [true,true,true,false,false,false]
```

`K.bhAdjust(pValues, q=.05)` accepts p values and q in `[0,1]`. It returns `m`,
`q`, `k`, `order` (original indices sorted by p; ties retain source order),
`ranks` (each `{index,rank,p,threshold,adjusted,passes}`), and original-order
`adjusted` and `rejected` arrays. Here `threshold=q×rank/m`, `passes` is that
row's own comparison, and `k` is the **largest** passing rank. All ranks `1…k`
are rejected, even if a preceding row fails its own comparison. Adjusted values
use the reverse cumulative minimum of `m×p/rank`, capped at one.

For example, sorted p values `[.001,.021,.029,.2,.5]` at q=.05 reject the first
three: rank 2 fails .02, but rank 3 passes .03. The tested family must be defined
before selection. FDR is the expected proportion of false discoveries among
rejections, with proportion zero when there are no rejections. It is not an
individual hypothesis's truth probability. Classical BH's guarantee requires
independence or suitable positive dependence; arbitrary dependence is not
covered by an unconditional promise.

## Persistent SVG views

### Driver usage example

```js
const observations = [2,3,4,7,8,9].map((value,i) => ({id:'D'+(i+1),value}));
const chart = K.sampleSpread(stage, {
  observations, domain:[0,11], x:115, y:265, width:650, height:150
});
const state = {progress:0};
const driver = F.driver(state, () => chart.setProgress(state.progress));
ctx.onDispose(driver.dispose);
ctx.step(() => driver.to({progress:.5}, {duration:1800})); // residual segments
ctx.step(() => driver.to({progress:1}, {duration:2200}));  // residual squares
```

### View input and identity contract

Each constructor checks initial input and derived layout **before touching the
DOM**. Each returns `.g`, `.snapshot()` and chainable setters. Progress is an
absolute finite number clamped to `[0,1]`; reverse/replay is deterministic. Input
setters preserve actor IDs and node identities and reject a new length. Invalid
updates leave both the DOM and model unchanged. IDs are unique nonempty strings
of at most 12 characters. Existing IDs/values remain in `data-*` attributes.
All labels use `L.textBox` with local-coordinate contracts, and live `C` roles
follow appearance changes. No font shrinking or clipping repairs layout.

### Residual spread view

`K.sampleSpread(parent,{observations,domain,x,y,width,height})` creates
categorical observation columns, a fixed vertical value scale, residuals and
squares, and horizontal `±1 SD`/`±1 SEM` bars on that same numerical domain.
It needs at least two observations, height at least 100, width at least 70 per
observation, a domain containing `mean±SD`, and enough column width to contain
the largest square plus 20 units. `height` describes the observation value
axis; allow an additional 140 units below it for identities, intervals and
horizontal end ticks. `setValues(values)` recomputes summaries; `setProgress(t)`
first grows residual segments, then squares and intervals. The snapshot contains
`progress`, `domain`, current `observations` and `summary`. Label axes and units
in your scene, and make clear that square areas encode squared units.

### Permutation view

`K.permutationView(parent,{observations,groupSize,domain,x,y,width,height})`
uses the same fixed horizontal value scale for both group lanes. The same actors
move vertically into each exact assignment, and individual assignment statistics
accumulate below. `setProgress(t)` traverses the entire exact enumeration;
`setValues(values)` recomputes it without replacing actors. The snapshot has
`progress`, target `assignment` index, `domain`, current `observations` and
`model`. During movement `groupFrom`/`groupTo` describe the endpoints; intermediate
screen coordinates are animation, not fractional observations. The target
assignment is used by the recipe's readout; the exact p always uses the full
space, even while only some statistic dots are disclosed.

This compact view is deliberately bounded: height at least 230, width at least
70 per source record, neighboring value positions separated by at least 60
horizontal units, and enough vertical space for the tallest tied-statistic stack
above the distribution baseline. It rejects tied/too-close source marks or an
unfit stack rather than hiding observations. The pure exact function accepts
ties; for tied source values compose a categorical assignment display or a
histogram with the pure result. Domains never rescale in a setter. Authors still
check their actual ID/value strings in both fonts; numeric spacing validation
is not a substitute for real text measurement.

### BH ranking view

`K.bhView(parent,{hypotheses:[{id,p},...],q=.05,x,y,width,height})` creates
persistent hypothesis rows and columns for rank, ID, p, the BH threshold and
adjusted p. It needs width at least 750 and height at least 42 per hypothesis.
During the first half of progress, numerical cells retract, compact identities
spread into separate columns, move to their ordered ranks, return to a shared
column, and regain their values. The second half reveals threshold/adjusted
values and extends a cutoff below rank k. `setQ(q)` recomputes the cutoff;
`setPValues(values)` recomputes stable ordering and adjustment; `setProgress(t)`
updates the operation. The snapshot contains `progress`, current `hypotheses`
and `model`. Use short identities in dense rows and reserve 50 units above
`y` for headings. This view illustrates sorting and the step-up prefix; the
numerical model exposes every intermediate rank for a custom scan or a lesson
about reverse cumulative minima.

### View lifecycle

Views own no animation loop or event listener. `F.stage`/`L.watch` own text
layout lifecycle; authors register `F.driver.dispose` through `ctx.onDispose`.
A standalone usage should explicitly dispose its `L.watch` and any driver.
Use a real `T.control` for manual inputs as in the recipe, and call the same
setters from the animation and control paths.

## Source and operation ledger

All scene measurements and p values are invented teaching fixtures.

| Question | Persistent input | Visible operation | Result |
|---|---|---|---|
| How do SD and SEM differ? | D1–D6 values | residuals grow from mean; squares grow with side proportional to residual; labeled intervals extend | sample SD and estimated SEM |
| What changes in a permutation? | six ID/value pairs | actors change group lanes on a fixed scale; assignment statistics accumulate | exact absolute-tail p |
| How does BH select discoveries? | H1–H6 p values | compact IDs reorder through separate lanes; numerical rows return; cutoff extends below k | rejected prefix and original-ID adjusted values |

Primary sources checked for this implementation:

- [NIST: measures of scale](https://www.itl.nist.gov/div898/handbook/eda/section3/eda356.htm): sample variance, denominator n−1 and SD units.
- [NIST: interval plots](https://www.itl.nist.gov/div898/software/dataplot/refman1/auxillar/i_plot.htm): one SD, one standard error and confidence intervals are separate quantities.
- [Penn State STAT 414, Lesson 24](https://online.stat.psu.edu/stat414/Lesson24): IID finite-variance sampling gives Var(mean)=σ²/n.
- [SciPy permutation test documentation](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.permutation_test.html): independent exact label enumeration, p conventions and roundoff concerns. Our explicit absolute-tail convention is not claimed to be SciPy's default two-sided convention.
- [R p.adjust documentation](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/p.adjust.html) and [R implementation](https://svn.r-project.org/R/trunk/src/library/stats/R/p.adjust.R): BH adjusted values, step-up structure and dependence distinctions.

Run `node tests/statistics.cjs` for checked fixtures, scientific edge cases,
atomic setters, persistent identities, collision-free compact BH motion and
scene control/disposal checks. The jsdom suite has no renderer geometry: actual
RU/EN text bounds, both fonts/backgrounds and intermediate frames require the
separate laboratory renderer QA. Physical gesture behavior is a separate check.

### Assignment transitions

`permutationView.snapshot().transition` returns `{from, to, progress, moving}`. During travel, `assignment` names the destination for compatibility; label its statistic as a target, not as a completed assignment. A null-distribution dot is revealed only after its assignment completes.
