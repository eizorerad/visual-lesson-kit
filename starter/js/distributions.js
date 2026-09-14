/* Immutable one-dimensional empirical measures and quantile-grid operations. */
(function (g) {
  'use strict';
  const freeze = Object.freeze, models = new WeakSet();
  function finite(value, name) {
    if (!Number.isFinite(value)) throw new TypeError(name + ' must be a finite number');
    return value;
  }
  function dense(input, name) {
    if (!Array.isArray(input) || !input.length) throw new TypeError(name + ' must be a nonempty array');
    for (let i = 0; i < input.length; i++) if (!Object.hasOwn(input, i)) throw new TypeError(name + ' must be dense');
    return input.slice();
  }
  const numbers = (input, name) => dense(input, name).map(value => finite(value, name));
  function empiricalDistribution(input) {
    const sorted = freeze(numbers(input, 'values').sort((a, b) => a - b)), n = sorted.length, pieces = [];
    for (let start = 0; start < n;) {
      let end = start + 1;
      while (end < n && sorted[end] === sorted[start]) end++;
      pieces.push(freeze({ u0: start / n, u1: end / n, value: sorted[start], count: end - start }));
      start = end;
    }
    freeze(pieces);
    function quantile(u) {
      finite(u, 'probability');
      if (u < 0 || u > 1) throw new RangeError('probability must be in [0,1]');
      // Search probability boundaries directly: multiplication by n can round
      // a represented k/n boundary into the next order statistic.
      let lo = 0, hi = pieces.length - 1;
      while (lo < hi) {
        const middle = Math.floor((lo + hi) / 2);
        if (u <= pieces[middle].u1) hi = middle; else lo = middle + 1;
      }
      return pieces[lo].value;
    }
    function grid(m) {
      if (!Number.isSafeInteger(m) || m < 1 || m > 4294967295) throw new RangeError('grid count must be a positive supported array length');
      const probabilities = Array.from({ length: m }, (_, j) => (j + .5) / m);
      return freeze({ m, probabilities: freeze(probabilities), values: freeze(probabilities.map(quantile)) });
    }
    const model = freeze({ n, sorted, pieces, quantile, grid });
    models.add(model);
    return model;
  }
  function distribution(input) {
    return models.has(input) ? input : empiricalDistribution(input);
  }
  function wasserstein1D(inputA, inputB) {
    const A = distribution(inputA), B = distribution(inputB), segments = [];
    let i = 0, j = 0, u0 = 0, squared = 0;
    while (i < A.pieces.length && j < B.pieces.length) {
      const left = A.pieces[i], right = B.pieces[j], u1 = Math.min(left.u1, right.u1);
      const difference = finite(left.value - right.value, 'quantile difference');
      // Weight before the second multiplication to avoid needless overflow of
      // an unweighted square whose probability-weighted contribution is finite.
      const contribution = finite(difference * (difference * (u1 - u0)), 'squared-distance contribution');
      squared = finite(squared + contribution, 'squared distance');
      segments.push(freeze({ u0, u1, a: left.value, b: right.value, contribution }));
      u0 = u1;
      if (left.u1 === u1) i++;
      if (right.u1 === u1) j++;
    }
    return freeze({ squared, distance: Math.sqrt(squared), segments: freeze(segments) });
  }
  function quantileBarycenter(input, inputWeights) {
    const curves = dense(input, 'curves').map(curve => numbers(curve, 'quantile curve')), m = curves[0].length;
    for (const curve of curves) {
      if (curve.length !== m) throw new RangeError('quantile curves must share an evaluation count');
      if (curve.some((value, j) => j > 0 && value < curve[j - 1])) throw new RangeError('quantile curves must be nondecreasing');
    }
    const raw = inputWeights === undefined ? Array(curves.length).fill(1) : numbers(inputWeights, 'weights');
    if (raw.length !== curves.length || raw.some(weight => weight < 0)) throw new RangeError('one nonnegative weight is required per curve');
    const largest = raw.reduce((maximum, weight) => Math.max(maximum, weight), 0);
    if (largest === 0) throw new RangeError('at least one weight must be positive');
    const scaled = raw.map(weight => weight / largest), total = scaled.reduce((sum, weight) => sum + weight, 0);
    const weights = freeze(scaled.map(weight => weight / total));
    const values = Array.from({ length: m }, (_, j) => {
      let sum = 0, low = Infinity, high = -Infinity;
      curves.forEach((curve, i) => {
        if (weights[i] > 0) {
          sum += weights[i] * curve[j];
          low = Math.min(low, curve[j]); high = Math.max(high, curve[j]);
        }
      });
      if (!Number.isFinite(sum)) {
        // Normalized weights can sum slightly above one in floating point.
        // Scale this column only when that roundoff overflows a large sum.
        const scale = Math.max(Math.abs(low), Math.abs(high));
        const unitSum = curves.reduce((s, curve, i) => s + weights[i] * (curve[j] / scale), 0);
        sum = Math.max(low / scale, Math.min(high / scale, unitSum)) * scale;
      }
      // The mathematical convex average stays in its column's range. Clamp
      // only roundoff outside that range, including near Number.MAX_VALUE.
      return finite(Math.max(low, Math.min(high, sum)), 'barycenter value');
    });
    return freeze({ m, values: freeze(values), weights });
  }
  Object.assign(g.K, { empiricalDistribution, wasserstein1D, quantileBarycenter });
})(window);
