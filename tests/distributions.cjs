/* Independent distribution fixtures. This pure module needs no browser or packages. */
'use strict';
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const assert = require('node:assert/strict');
const root = process.env.LESSON_TEST_DIR || path.resolve(__dirname, '../starter');
const context = vm.createContext({ window: { K: {} } }), K = context.window.K;
const source = path.join(root, 'js/distributions.js');
if (fs.existsSync(source)) vm.runInContext(fs.readFileSync(source, 'utf8'), context);
let checks = 0;
const ok = (value, message) => { assert.ok(value, message); checks++; };
const equal = (actual, expected, message) => { assert.deepEqual(JSON.parse(JSON.stringify(actual)), expected, message); checks++; };
const near = (actual, expected, message) => ok(Number.isFinite(actual) && Math.abs(actual - expected) <= 1e-12 * Math.max(1, Math.abs(expected)), message);
const rejects = (fn, message) => { assert.throws(fn, undefined, message); checks++; };
function frozen(value, message) {
  ok(Object.isFrozen(value), message);
  for (const item of Object.values(value)) if (item && typeof item === 'object') frozen(item, message);
}

for (const name of ['empiricalDistribution', 'wasserstein1D', 'quantileBarycenter']) ok(typeof K[name] === 'function', 'K.' + name + ' exists');

const raw = [10, 0, 0, 5], before = JSON.stringify(raw), empirical = K.empiricalDistribution(raw);
equal(empirical.sorted, [0, 0, 5, 10], 'numeric sorted copy retains all repeated observations');
ok(empirical.n === 4 && JSON.stringify(raw) === before, 'n counts observations and input stays unchanged');
equal(empirical.pieces, [
  { u0: 0, u1: .5, value: 0, count: 2 },
  { u0: .5, u1: .75, value: 5, count: 1 },
  { u0: .75, u1: 1, value: 10, count: 1 }
], 'ties have their combined probability mass');
for (const [u, value] of [[0, 0], [.1, 0], [.5, 0], [.5 + Number.EPSILON, 5], [.75, 5], [1, 10]]) near(empirical.quantile(u), value, 'type-1 inverse CDF at ' + u);
const thirds = K.empiricalDistribution([1, 2, 3]);
near(thirds.quantile(1 / 3), 1, 'represented probability breakpoint belongs to lower step');
near(thirds.quantile(2 / 3), 2, 'second represented probability breakpoint');
const grid = empirical.grid(5);
ok(grid.m === 5 && empirical.n === 4, 'evaluation count is separate from source sample size');
equal(grid.probabilities, [.1, .3, .5, .7, .9], 'common midpoint grid');
equal(grid.values, [0, 0, 0, 5, 10], 'grid evaluates the same inverse CDF');
equal(K.empiricalDistribution([0, 10]).grid(1).values, [0], 'type-1 quantile does not interpolate the middle pair');
equal(K.empiricalDistribution([7]).grid(3).values, [7, 7, 7], 'a grid creates evaluations, not observations');
raw[0] = 99;
equal(empirical.sorted, [0, 0, 5, 10], 'later caller mutation cannot alter the model');
frozen(empirical, 'empirical data recursively frozen'); frozen(grid, 'grid recursively frozen');
for (const input of [null, [], [1, , 2], [undefined], [NaN], [Infinity], [-Infinity], ['1'], [true], new Float64Array([1])]) rejects(() => K.empiricalDistribution(input), 'invalid empirical sample rejects');
for (const u of [-Number.EPSILON, 1 + Number.EPSILON, NaN, Infinity, '0.5', null]) rejects(() => empirical.quantile(u), 'invalid probability rejects');
for (const m of [0, -1, 1.5, NaN, Infinity, '5', null, Number.MAX_SAFE_INTEGER + 1]) rejects(() => empirical.grid(m), 'invalid grid count rejects');

const A = K.empiricalDistribution([5, 5]), B = K.empiricalDistribution([0, 10]);
const transport = K.wasserstein1D(A, B);
near(transport.squared, 25, 'equal-mean spread fixture has W2 squared 25');
near(transport.distance, 5, 'W2 is the square root, in original units');
equal(transport.segments, [
  { u0: 0, u1: .5, a: 5, b: 0, contribution: 12.5 },
  { u0: .5, u1: 1, a: 5, b: 10, contribution: 12.5 }
], 'exact probability intervals expose each integral contribution');
frozen(transport, 'transport recursively frozen');
const unequal = K.wasserstein1D([0, 6], [0, 3, 6]);
near(unequal.squared, 3, 'unequal sample lengths: two intervals of width 1/6 and squared gap 9');
equal(unequal.segments.map(s => [s.u0, s.u1, s.a, s.b]), [[0, 1 / 3, 0, 0], [1 / 3, .5, 0, 3], [.5, 2 / 3, 6, 3], [2 / 3, 1, 6, 6]], 'merged unequal probability breakpoints');
near(K.wasserstein1D([0, 2], [1]).squared, 1, 'singleton versus two observations');
near(K.wasserstein1D([0, 10], [0, 0, 10]).squared, 100 / 6, 'unequal sample mass cannot be replaced by midpoint-grid approximation');
equal(K.empiricalDistribution([0, 10]).grid(2).values, [0, 10], 'first grid in approximation counterexample');
equal(K.empiricalDistribution([0, 0, 10]).grid(2).values, [0, 10], 'same grid can conceal a positive exact distance');
near(K.wasserstein1D([0, 3], [0, 0, 3, 3]).squared, 0, 'replication preserves the empirical measure');
near(K.wasserstein1D([9, 3, 3], [3, 9, 3]).squared, 0, 'permuting observations preserves the measure');
near(K.wasserstein1D([0, 3, 6], [0, 6]).squared, unequal.squared, 'distance symmetry');
near(K.wasserstein1D([100, 106], [100, 103, 106]).squared, unequal.squared, 'translation invariant');
near(K.wasserstein1D([0, 12], [0, 6, 12]).squared, 4 * unequal.squared, 'squared distance scales quadratically');
near(unequal.segments.reduce((sum, s) => sum + s.u1 - s.u0, 0), 1, 'segments cover total probability one');
near(unequal.segments.reduce((sum, s) => sum + s.contribution, 0), unequal.squared, 'segments sum to the reported integral');
const arrayA = [5, 1], arrayB = [0, 4, 7], copyA = arrayA.slice(), copyB = arrayB.slice();
K.wasserstein1D(arrayA, arrayB);
equal(arrayA, copyA, 'first transport input unchanged'); equal(arrayB, copyB, 'second transport input unchanged');
for (const bad of [[], [1, , 2], [NaN], ['0'], {}, { sorted: [0], pieces: [] }, null]) {
  rejects(() => K.wasserstein1D(bad, [0]), 'invalid first distribution rejects');
  rejects(() => K.wasserstein1D([0], bad), 'invalid second distribution rejects');
}
rejects(() => K.wasserstein1D([-1e308], [1e308]), 'unrepresentable squared distance rejects');

const curves = [[5, 5], [0, 10]], weights = [1, 1], curvesBefore = JSON.stringify(curves);
const barycenter = K.quantileBarycenter(curves, weights);
equal(barycenter.values, [2.5, 7.5], 'equal-weight quantile barycenter');
equal(barycenter.weights, [.5, .5], 'weights normalize to total one');
ok(barycenter.m === 2, 'barycenter carries evaluation count');
const objective = curves.reduce((sum, curve) => sum + K.wasserstein1D(curve, barycenter.values).squared, 0);
near(objective, 12.5, 'unnormalized two-sample objective is 12.5');
near(objective / 2, 6.25, 'normalized equal-weight objective is 6.25');
equal(K.quantileBarycenter(curves).values, [2.5, 7.5], 'omitting weights assigns equal weights');
equal(K.quantileBarycenter(curves, [1, 3]).values, [1.25, 8.75], 'nonuniform weighted barycenter');
equal(K.quantileBarycenter(curves, [0, 2]).values, [0, 10], 'zero weights permitted');
equal(K.quantileBarycenter([[1, 1, 3]]).values, [1, 1, 3], 'single curve and ties preserved');
equal(K.quantileBarycenter(curves, [1e308, 1e308]).weights, [.5, .5], 'finite weights normalize without sum overflow');
equal(K.quantileBarycenter([[1e308], [-1e308]]).values, [0], 'opposite large inputs have finite average');
near(K.quantileBarycenter(Array.from({ length: 11 }, () => [Number.MAX_VALUE])).values[0], Number.MAX_VALUE, 'large identical values remain finite');
near(K.quantileBarycenter([[1e-300, 1e300], [3e-300, 1e300]]).values[0] / 1e-300, 2, 'each coordinate retains its own numeric scale');
near(K.quantileBarycenter([[1e308], [1e-300]], [0, 1]).values[0] / 1e-300, 1, 'zero-weight curve cannot erase a small retained value');
ok(JSON.stringify(curves) === curvesBefore, 'barycenter does not alter caller curves'); equal(weights, [1, 1], 'barycenter does not alter caller weights');
curves[0][0] = 99; weights[0] = 99;
equal(barycenter.values, [2.5, 7.5], 'later input mutation does not alter barycenter'); frozen(barycenter, 'barycenter recursively frozen');
for (const bad of [[], [[], []], [[1, 2], [1]], [[2, 1], [1, 2]], [[1, , 3]], [[NaN]], [['1']], [null], [undefined], new Array(2)]) rejects(() => K.quantileBarycenter(bad), 'invalid quantile curves reject');
for (const bad of [[], [1], [0, 0], [-1, 2], [NaN, 1], [Infinity, 1], ['1', 1], [1, ,], null]) rejects(() => K.quantileBarycenter([[0], [1]], bad), 'invalid barycenter weights reject');
rejects(() => K.quantileBarycenter([[1, 0], [1, 2]], [0, 1]), 'zero-weight curves must still satisfy the contract');
console.log(JSON.stringify({ checks, method: 'pure numerical fixtures, exact probability integration, validation and immutability' }));
