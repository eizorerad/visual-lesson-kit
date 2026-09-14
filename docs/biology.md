# Count aggregation, normalization and allele counting

Load `js/biology.js` after `film.js`, `patterns.js`, the `lib/*` dependencies and optional `layout.js`. It extends `K`. The connected examples are in `js/recipes/methods-biology.js`, separate from the default gallery. They use invented, independently calculable data and full RU/EN notes, questions and controls.

The module separates pure numerical models from small persistent SVG views. Models copy and deeply freeze their output. Counts must be nonnegative safe integers; missing, sparse or inconsistent rows, duplicate IDs and overflowing sums reject. No coercion turns missing values into zero. Setters validate before DOM writes, and normalization views retain their own source snapshot rather than rereading caller-owned data.

## Raw counts by sample and stratum

```js
const cells = [
  {id:'c1', sample:'D1', stratum:'T', counts:[1,3]},
  {id:'c2', sample:'D1', stratum:'T', counts:[2,4]},
  {id:'c3', sample:'D2', stratum:'T', counts:[4,2]}
];
const model = K.aggregateCounts(cells, {genes:['G1','G2']});
// groups[0]: counts [3,7], sourceIds ['c1','c2'], cellCount 2
```

Every cell requires a unique nonempty `id`, a nonempty `sample`, a nonempty `stratum`, and a dense `counts` row. `genes` must contain one unique label per column. A group is exactly one `(sample,stratum)` pair; the collision-safe group ID is its JSON encoding. Output includes `cells`, `genes`, `groups`, per-gene `totals`, `cellCount`, `sampleIds`, `sampleCount`, and per-stratum `sampleIds`/`sampleCount`. Group and sample order follow first appearance. Each group retains its source IDs and counts.

`sampleCount` counts distinct supplied sample IDs. It does **not** establish statistical independence. If separate sample IDs are aliquots from the same donor, that design must be represented and explained by the author. The recipe uses two assumed independent donors, eight cells and four donor-by-type profiles; neither eight cells nor four profiles becomes four or eight independent donors. Sum raw counts within biological sample and cell type, retaining biological replication for downstream inference. This module does not perform differential expression. [OSCA, multi-sample comparisons](https://bioconductor.org/books/release/OSCA.multisample/multi-sample-comparisons.html).

`K.countAggregation(parent,{cells,genes,frame?})` returns `{g,model,actors,totals,xScale,setProgress,state}`. `setProgress({group,sum})` accepts finite 0–1 progress; summation requires `group===1`. Source groups have `data-cell-id`, sample, stratum and raw counts. Aggregate marks have their own IDs and source lists. As the sum assembles, widths show contributions being added; final numeric labels appear at completion. Partial assembly is explanatory geometry, not a fractional raw measurement.

The default frame is `{x:90,y:235,width:1100,height:290}`. The small view accepts up to three genes and rejects layouts with insufficient cell/group spacing. It does not find collision-free trajectories for arbitrary supplied layouts. Use the numerical model with custom marks when a new topic requires a larger matrix, another composition, or another grouping presentation.

## A common total, then natural log1p

```js
const rows = [{id:'c1',counts:[1,3]}, {id:'c2',counts:[2,6]}];
const model = K.normalizeCountRows(rows,{targetTotal:8});
// Both normalized rows are [2,6]; both log1p rows are [ln(3),ln(7)].
```

`targetTotal` must be positive and finite. Each row returns `id`, immutable `raw`, raw `total`, `factor`, `normalized` and `log1p`. The calculation is `normalized[j] = raw[j] / total × targetTotal`; log1p is `ln(1 + normalized[j])`. All supplied columns contribute to the denominator. Zero-total rows reject explicitly; do not silently claim they achieved the target. An individual zero stays zero. Nonrepresentable arithmetic and underflow of a positive count reject.

Scaling changes the numerical representation; it does not recover unmeasured molecules or prove gene absence at zero. Equal totals normally cease to be equal after log1p. These models implement the stated elementary operations, not the full preprocessing or feature-selection options of a production analysis package. [Scanpy normalize_total](https://scanpy.readthedocs.io/en/stable/generated/scanpy.pp.normalize_total.html), [Scanpy log1p](https://scanpy.readthedocs.io/en/1.9.x/generated/scanpy.pp.log1p.html).

`K.countNormalization(parent,{rows,targetTotal,maxTotal?,frame?})` returns `{g,marks,scales,maxTotal,setState,model,state}`. `maxTotal` fixes the normalized scale domain and defaults to the initial target. The raw scale remains fixed to the original maximum; log1p uses fixed domain `0…ln(1+maxTotal)`. The author must visibly label all three scales and gene order. The provided recipe does so and keeps raw bars/numbers visible throughout.

`setState({targetTotal,normalize,log})` preserves unspecified state. Progress must be in 0–1; positive log progress requires completed normalization. A target above `maxTotal` rejects, rather than silently widening the axis. Raw data and IDs never change when controls move. The small view accepts at most three genes and requires adequate row height; use the model with a custom view for other arrangements.

## Diploid allele frequencies and separate HWE expectations

```js
const summary = K.alleleSummary({AA:4,Aa:4,aa:2});
// individuals 10; copies 20; A 12; a 8; p=.6; q=.4
// observed [.4,.4,.2]; expected [.36,.48,.16]
// expectedCounts [3.6,4.8,1.6]
```

Exactly the keys `AA`, `Aa`, `aa` are required, with at least one individual. The scope is complete, biallelic, autosomal diploid genotype counts. Missing data, varying ploidy, sex-linked special cases and multiallelic loci require another explicit model.

Allele counting uses `p=(2AA+Aa)/(2n)` and `q=(2aa+Aa)/(2n)` without a Hardy–Weinberg assumption. `observed` and `expected` arrays use order AA,Aa,aa. The separate HWE expectation is `p²,2pq,q²`; expected counts retain fractions and never replace observed counts. Independent random gamete union yields these expected genotype proportions. Equilibrium across generations has further assumptions about selection, drift, mutation and migration. No goodness-of-fit test or population inference is performed. [OpenStax, population evolution](https://openstax.org/books/biology-2e/pages/19-1-population-evolution).

`K.alleleFrequency(parent,{counts,frame?})` returns `{g,model,observed,tokens,expected,scale,setProgress,state}`. `setProgress({count,expect})` first separates allele copies from their source genotype rows, then grows separately labeled expectation bars. Positive expectation progress requires `count===1`. All progress is finite 0–1. Observed genotype marks remain unchanged. Token source attributes identify their genotype, generated within-genotype individual index, and copy index; these are illustrative indices inferred from the supplied count tally, not imported individual genotypes. The small display rejects more than 120 copies or a frame below its documented minimum (width 900, height 240); the pure model is not tied to that visual limit. Inspect more crowded custom fixtures before publication.

## Composition and verification

Views own their SVG geometry; do not also apply a motion track to nodes whose transforms a view controls. Wrap a whole view for an independent global translation, or use the pure model and your own SVG objects. The views do not own time. Connect state to `F.driver`, register `driver.dispose` with `ctx.onDispose`, and update captions and controls in the same `paint`. Optional `L` contracts record intended label bounds; a scene using `F.stage` supplies automatic contract cleanup.

The recipes are `bio-pseudobulk`, `bio-normalize`, and `bio-alleles`. They demonstrate moving cells into groups, preserving raw values while changing numerical representations, and counting inherited copies before displaying a separate expectation. Their manual sliders can interrupt guided steps; visible slider values track guided animation too. Their shape and sequence are examples, not a required narrative template.

Run `node --test tests/biology.cjs`. The suite checks independent arithmetic, dense/valid input, overflow and zero denominators, source snapshots, atomic invalid setters, persistent actors, raw-reference preservation, guided controls, RU/EN state, interruptions and disposal. Numerical/SVG tests do not establish browser text fit, trajectory clearance, physical gestures or biological validity of a new author's input. Review the new methods laboratory in the browser using `qa.md`.
