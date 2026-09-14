# Empirical distributions, probability grids and one-dimensional transport

Load `js/distributions.js` after `patterns.js` has created `K`. This module adds
three pure numerical helpers, with no DOM, animation or external dependency.
Compose their results with `F`, `S` and `L` for the scientific question at hand.
The examples below are invented, independently calculable teaching fixtures.

All array inputs must be dense and nonempty. Values must be finite numbers;
numeric strings, missing entries and typed arrays are rejected. Input arrays
are copied, every returned data object and array is frozen, and later caller
changes cannot change a result. An unrepresentable arithmetic result throws.
Calculations use JavaScript floating-point arithmetic: “exact” below means
integration of all empirical probability intervals, rather than a numerical
grid approximation. It does not mean symbolic or arbitrary-precision arithmetic.

## Observations become an empirical inverse CDF

```js
const sample = K.empiricalDistribution([10, 0, 0, 5]);
// sample.n === 4
// sample.sorted: [0, 0, 5, 10]
// sample.pieces:
// [{u0:0, u1:.5, value:0, count:2},
//  {u0:.5, u1:.75, value:5, count:1},
//  {u0:.75, u1:1, value:10, count:1}]
sample.quantile(.5); // 0
sample.quantile(.6); // 5
```

`K.empiricalDistribution(values)` gives each of the `n` observations weight
`1/n`. Repeated observations retain their full mass; they are not deduplicated.
`sorted` contains every observation in numerical order. Each `pieces` entry
groups an equal-valued run, records its observation `count`, and gives the
probability interval `(u0,u1]` on which its inverse CDF equals `value`.

`quantile(u)` accepts `0 <= u <= 1`. For `u > 0`, it returns the smallest observed
value whose empirical cumulative probability is at least `u`: the type-1
inverse CDF. At a jump boundary, the boundary belongs to the lower step.
`quantile(0)` is explicitly extended to the minimum observation;
`quantile(1)` is the maximum. There is no interpolation or out-of-range clipping.
For example, the type-1 `.5` quantile of `[0,10]` is `0`, not the interpolated
sample median `5`. Name this convention when the distinction matters.

```js
const evaluated = sample.grid(5);
// {m:5, probabilities:[.1,.3,.5,.7,.9], values:[0,0,0,5,10]}
```

`grid(m)` evaluates the same inverse CDF at `u_j=(j+.5)/m`, for zero-based
`j=0,...,m-1`. The result is `{m,probabilities,values}`. Use the same `m` for
distributions you want to compare at a common set of probabilities. `m` is a
positive integer within JavaScript's supported array lengths and available
memory. These are **evaluation points**, not additional observations:
`sample.n` remains four when `m` is five or fifty. Midpoints avoid endpoints but
can still land exactly on an empirical jump; the same type-1 rule applies.

## Exact W2 for empirical measures

```js
const A = K.empiricalDistribution([5, 5]);
const B = K.empiricalDistribution([0, 10]);
const transport = K.wasserstein1D(A, B);
// transport.squared === 25
// transport.distance === 5
// transport.segments:
// [{u0:0, u1:.5, a:5, b:0, contribution:12.5},
//  {u0:.5, u1:1, a:5, b:10, contribution:12.5}]
```

`K.wasserstein1D(a,b)` accepts either raw observation arrays or the immutable
models returned by `K.empiricalDistribution` in the current module instance.
It does not accept serialized model-shaped objects. Each input measure gives
equal weight to its own observations; their sample lengths may differ.

For one-dimensional measures, squared Wasserstein-2 distance is

`W2²(A,B) = integral_0^1 (Q_A(u) - Q_B(u))² du`.

The helper merges both sets of probability breakpoints. Each returned segment
contains `{u0,u1,a,b,contribution}`, where `a` and `b` are the constant quantile
values over that interval and `contribution=(u1-u0)*(a-b)²`. The sum is `squared`;
its square root is `distance`. Thus `squared` has squared measurement units and
`distance` has the original units. Isolated endpoint values do not affect the
integral. No interpolation, fitted density, histogram or common evaluation grid
is used to compute this distance.

For `[0,6]` and `[0,3,6]`, the merged intervals have endpoints
`0, 1/3, 1/2, 2/3, 1`. The two nonzero contributions each have width `1/6` and
squared gap `9`, giving `W2²=3`. Equal means alone do not imply zero distance.

A small common grid can hide an actual difference: `[0,10]` and `[0,0,10]` both
evaluate to `[0,10]` on `grid(2)`, but their exact squared distance is `100/6`.
Do not describe a grid approximation as an exact comparison of the original
empirical measures.

## Average quantile curves on a shared grid

```js
const curves = [A.grid(2).values, B.grid(2).values];
K.quantileBarycenter(curves);
// {m:2, values:[2.5,7.5], weights:[.5,.5]}
K.quantileBarycenter(curves, [1,3]);
// {m:2, values:[1.25,8.75], weights:[.25,.75]}
```

`K.quantileBarycenter(curves,weights?)` accepts a nonempty array of nondecreasing
value arrays with the same length `m`. Each array must already represent the
**same ordered probability locations**. Equal lengths alone cannot establish
that semantic requirement; using `empiricalDistribution(...).grid(m).values`
for each sample satisfies it. The helper never sorts a curve, which would hide
a broken quantile/probability correspondence.

Provide one finite nonnegative weight per curve, with at least one positive
weight. Omitted weights are equal. Supplied weights are normalized, including
large finite weights whose unscaled sum would overflow. Zero-weight curves are
allowed and still validated. Returned `{m,values,weights}` contains the
normalized weights and the coordinatewise average
`values[j] = sum_i weights[i]*curves[i][j]`.

For each probability location, expanding the weighted squared-error objective
around this weighted average leaves a nonnegative squared displacement, so the
average minimizes that objective. Nonnegative weights also preserve the
nondecreasing order of the curves. In continuous one-dimensional W2 geometry,
the same pointwise rule gives the quantile function of the barycenter. This API
returns only the supplied grid's averages; it does not recover values between
grid points or compute an exact barycenter of unequal-size empirical inputs.

For the equal-weight example, `[2.5,7.5]` has squared distance `6.25` to each
input. The **sum** of the two squared distances is `12.5`; their normalized
weighted **mean** is `6.25`. Both objectives have the same minimizer, but their
numeric values are different. If you pass grid values to `wasserstein1D`, it
treats those values as an equally weighted empirical sample. That is exact for
that new discrete measure, not necessarily for the original distributions.

Keep provenance and sampling units with the scene's source records. These
helpers model distributions and their geometry; they do not establish
independence, estimate uncertainty, fit a genetic association model, provide a
causal interpretation or reproduce any particular article's reported results.

Run `node tests/distributions.cjs` for independent exact-integral fixtures,
endpoints, ties, unequal sample counts, weighted averages, numerical range,
invalid inputs and immutability. This test has no browser dependency. It does
not verify the text bounds, actor identity or motion of a lesson composed from
the returned data; those require the lesson's own renderer checks.
