/* Numeric physical-chemistry contracts; no browser or kit dependencies. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const assert = require('node:assert/strict');
const root = process.env.LESSON_TEST_DIR || path.resolve(__dirname, '../starter');
const source = path.join(root, 'js/physical-chemistry.js');
const sandbox = vm.createContext({});
if (fs.existsSync(source)) vm.runInContext(fs.readFileSync(source, 'utf8'), sandbox);
const PH = sandbox.PH || {};
const plain = value => JSON.parse(JSON.stringify(value));
const sum = values => values.reduce((a, b) => a + b, 0);
function has(name) { assert.equal(typeof PH[name], 'function', `PH.${name} exists`); }
function near(actual, expected, relative = 1e-12, absolute = 1e-14) {
  assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) <= Math.max(absolute, relative * Math.abs(expected)), `${actual} ≈ ${expected}`);
}
function rejects(fn) { assert.throws(fn, error => error.name === 'TypeError' || error.name === 'RangeError'); }

test('PH loads into an empty context with no DOM', () => {
  for (const name of ['lennardJones', 'dipole', 'occupancy', 'protonated', 'reactionExtent', 'maxExtent', 'diffuseStep', 'bindingStep', 'nernst', 'photon', 'firstOrder']) has(name);
});

test('Lennard–Jones minimum, energy reference and force derivative agree', () => {
  has('lennardJones');
  const minimum = PH.lennardJones(2 ** (1 / 6));
  near(minimum.energy, -1); near(minimum.force, 0);
  near(PH.lennardJones(1).energy, 0);
  assert.ok(PH.lennardJones(.95).force > 0, 'small separation is repulsive');
  assert.ok(PH.lennardJones(1.5).force < 0, 'large separation is attractive');
  assert.ok(Math.abs(PH.lennardJones(100).energy) < 5e-12, 'far-separated energy tends to zero');
  for (const r of [.9, 1, 1.12, 1.5, 2.2]) {
    const dr = 1e-6;
    const derivative = (PH.lennardJones(r + dr).energy - PH.lennardJones(r - dr).energy) / (2 * dr);
    near(PH.lennardJones(r).force, -derivative, 2e-8, 2e-8);
  }
  const scaled = PH.lennardJones(3, { sigma: 2, epsilon: 7 });
  near(scaled.energy, 7 * PH.lennardJones(1.5).energy);
  near(scaled.force, 7 / 2 * PH.lennardJones(1.5).force);
  assert.deepEqual(plain(PH.lennardJones(1, { epsilon: 0 })), { energy: 0, force: 0 });
  for (const r of [0, -1, NaN, Infinity, '1']) rejects(() => PH.lennardJones(r));
  rejects(() => PH.lennardJones(1, { sigma: 0 }));
  rejects(() => PH.lennardJones(1, { epsilon: -1 }));
  rejects(() => PH.lennardJones(1e-100));
});

test('dipole uses signed charge coordinates and neutral translation invariance', () => {
  has('dipole');
  const atoms = [{ x: -1, y: 0, q: -1 }, { x: 1, y: 0, q: 1 }];
  const before = JSON.stringify(atoms);
  assert.deepEqual(plain(PH.dipole(atoms)), { x: 2, y: 0, magnitude: 2 });
  assert.deepEqual(plain(PH.dipole(atoms.map(a => ({ ...a, x: a.x + 30, y: a.y - 7 })))), { x: 2, y: 0, magnitude: 2 });
  assert.deepEqual(plain(PH.dipole(atoms.map(a => ({ ...a, q: -a.q })))), { x: -2, y: 0, magnitude: 2 });
  near(PH.dipole([{ x: 3, y: 4, q: 2 }]).magnitude, 10, 0, 0);
  assert.equal(JSON.stringify(atoms), before, 'input unchanged');
  for (const a of [[], [undefined], [{ x: 1, y: 2, q: NaN }], [{ x: '1', y: 2, q: 1 }], new Array(2)]) rejects(() => PH.dipole(a));
  rejects(() => PH.dipole([{ x: 1e308, y: 0, q: 1e308 }]));
});

test('one-site occupancy has half-saturation and remains bounded over extreme ratios', () => {
  has('occupancy');
  near(PH.occupancy(0, 3), 0, 0, 0);
  near(PH.occupancy(3, 3), .5, 0, 0);
  near(PH.occupancy(9, 3), .75, 0, 0);
  near(PH.occupancy(1e308, 1e308), .5, 0, 0);
  near(PH.occupancy(1e308, 1e-308), 1, 0, 0);
  const concentrations = [0, .001, .1, 1, 10, 1e12];
  const fractions = concentrations.map(c => PH.occupancy(c, 1));
  assert.ok(fractions.every((v, i) => v >= 0 && v <= 1 && (!i || v > fractions[i - 1])));
  for (const args of [[-1, 2], [0, 0], [1, -1], [NaN, 1], [1, Infinity], ['1', 2]]) rejects(() => PH.occupancy(...args));
});

test('single-site protonation has the correct pH direction, midpoint and limiting fractions', () => {
  has('protonated');
  near(PH.protonated(7, 7), .5, 0, 0);
  near(PH.protonated(6, 7), 10 / 11);
  near(PH.protonated(8, 7), 1 / 11);
  near(PH.protonated(-1000, 0), 1, 0, 0);
  near(PH.protonated(1000, 0), 0, 0, 0);
  near(PH.protonated(-1e308, 1e308), 1, 0, 0);
  near(PH.protonated(1e308, -1e308), 0, 0, 0);
  for (const args of [[NaN, 7], [7, Infinity], ['7', 7]]) rejects(() => PH.protonated(...args));
});

test('forward reaction extent respects limiting reagents and atom conservation', () => {
  has('reactionExtent'); has('maxExtent');
  // 2 H2 + O2 -> 2 H2O in a fixed volume: molecule totals need not be conserved.
  const initial = [3, 2, 0], stoich = [-2, -1, 2], before = JSON.stringify([initial, stoich]);
  near(PH.maxExtent(initial, stoich), 1.5, 0, 0);
  const atoms = concentrations => [2 * concentrations[0] + 2 * concentrations[2], 2 * concentrations[1] + concentrations[2]];
  for (const extent of [0, .1, 1, 1.5]) {
    const c = PH.reactionExtent(initial, stoich, extent);
    assert.ok(c.every(v => v >= 0));
    atoms(c).forEach((value, i) => near(value, atoms(initial)[i]));
  }
  assert.deepEqual(plain(PH.reactionExtent(initial, stoich, 1.5)), [0, .5, 3]);
  assert.equal(JSON.stringify([initial, stoich]), before, 'arrays are unchanged');
  assert.deepEqual(plain(PH.reactionExtent([0, 2], [-1, 1], 0)), [0, 2]);
  for (const extent of [-.1, 1.50001, NaN, Infinity]) rejects(() => PH.reactionExtent(initial, stoich, extent));
  for (const pair of [[[], []], [[1], [-1, 1]], [[-1, 0], [-1, 1]], [[1, 0], [0, 1]], [[1, 0], [0, 0]], [[1, 0], [-1, NaN]], [[1, , 0], [-1, 0, 1]]]) rejects(() => PH.maxExtent(...pair));
  rejects(() => PH.reactionExtent([1e308, 1e308], [-1, 2], 1e308));
});

test('reflecting diffusion is conservative, nonnegative and mirror symmetric', () => {
  has('diffuseStep');
  assert.deepEqual(plain(PH.diffuseStep([1, 0, 0], .5)), [.5, .5, 0]);
  assert.deepEqual(plain(PH.diffuseStep([0, 1, 0], .5)), [.5, 0, .5]);
  assert.deepEqual(plain(PH.diffuseStep([2, 0], .5)), [1, 1]);
  assert.deepEqual(plain(PH.diffuseStep([7], .5)), [7]);
  const initial = [3, 0, 1, 8, .3, 2, 0], before = JSON.stringify(initial);
  assert.deepEqual(plain(PH.diffuseStep(initial, 0)), initial);
  assert.deepEqual(plain(PH.diffuseStep([5, 5, 5, 5], .5)), [5, 5, 5, 5]);
  const forward = PH.diffuseStep(initial, .37), reverse = PH.diffuseStep(initial.slice().reverse(), .37).slice().reverse();
  forward.forEach((value, i) => near(value, reverse[i]));
  for (const alpha of [0, .13, .5]) {
    let values = initial;
    for (let i = 0; i < 1000; i++) {
      values = PH.diffuseStep(values, alpha);
      assert.ok(values.every(value => value >= 0 && value <= 8));
      near(sum(values), sum(initial), 1e-12);
    }
  }
  assert.equal(JSON.stringify(initial), before, 'initial array unchanged');
  for (const alpha of [-.01, .500001, NaN, Infinity]) rejects(() => PH.diffuseStep(initial, alpha));
  for (const values of [[], [1, -1], [1, NaN], [1, , 2]]) rejects(() => PH.diffuseStep(values, .1));
});

test('exact binding kinetics agree with equilibrium, dissociation and time composition', () => {
  has('bindingStep'); has('occupancy'); has('firstOrder');
  const p = { kon: 2, koff: 3, concentration: 4, dt: .17 };
  const equilibrium = PH.occupancy(p.concentration, p.koff / p.kon);
  near(PH.bindingStep(equilibrium, p), equilibrium);
  const whole = PH.bindingStep(.1, p);
  const half = PH.bindingStep(PH.bindingStep(.1, { ...p, dt: p.dt / 2 }), { ...p, dt: p.dt / 2 });
  near(whole, half);
  near(PH.bindingStep(.8, { ...p, concentration: 0 }), PH.firstOrder(.8, p.koff, p.dt));
  near(PH.bindingStep(.25, { ...p, dt: 0 }), .25, 0, 0);
  near(PH.bindingStep(.25, { kon: 0, koff: 0, concentration: 4, dt: 10 }), .25, 0, 0);
  near(PH.bindingStep(0, { kon: 1, koff: 0, concentration: 1, dt: 1e-16 }), 1e-16, 1e-12, 0);
  for (const theta of [0, .5, 1]) for (const dt of [0, 1e-12, 1, 1e308]) {
    const value = PH.bindingStep(theta, { ...p, dt });
    assert.ok(value >= 0 && value <= 1);
    assert.ok(value >= Math.min(theta, equilibrium) - 1e-15 && value <= Math.max(theta, equilibrium) + 1e-15);
  }
  for (const theta of [-.1, 1.1, NaN]) rejects(() => PH.bindingStep(theta, p));
  for (const key of ['kon', 'koff', 'concentration', 'dt']) for (const value of [-1, NaN, Infinity]) rejects(() => PH.bindingStep(.5, { ...p, [key]: value }));
  rejects(() => PH.bindingStep(.5, { ...p, kon: 1e308, concentration: 1e308 }));
});

test('Nernst voltage is inside minus outside with signed valence and Kelvin scaling', () => {
  has('nernst');
  near(PH.nernst(10, 10), 0, 0, 0);
  near(PH.nernst(100, 10), .05915934968478111, 1e-12, 0);
  near(PH.nernst(10, 100), -.05915934968478111, 1e-12, 0);
  near(PH.nernst(100, 10, { z: -1 }), -PH.nernst(100, 10));
  near(PH.nernst(100, 10, { z: 2 }), PH.nernst(100, 10) / 2);
  near(PH.nernst(100, 10, { T: 596.3 }), 2 * PH.nernst(100, 10));
  near(PH.nernst(.1, .01), PH.nernst(100, 10));
  assert.ok(Number.isFinite(PH.nernst(1e308, 1e-308)), 'logs avoid overflowing a concentration ratio');
  for (const args of [[0, 1], [1, 0], [-1, 1], [NaN, 1], [1, Infinity]]) rejects(() => PH.nernst(...args));
  for (const z of [0, .5, NaN, Infinity]) rejects(() => PH.nernst(1, 2, { z }));
  for (const T of [0, -1, NaN, Infinity]) rejects(() => PH.nernst(1, 2, { T }));
});

test('photon energy converts vacuum nanometers to joules and electronvolts', () => {
  has('photon');
  const violet = PH.photon(400), red = PH.photon(800);
  near(violet.joules, 4.966114642872321e-19, 1e-13, 0);
  near(violet.eV, 3.0996049608300065, 1e-13, 0);
  near(violet.joules / red.joules, 2);
  near(violet.eV / red.eV, 2);
  near(violet.joules / violet.eV, 1.602176634e-19, 1e-13, 0);
  for (const wavelength of [0, -1, NaN, Infinity, '400', Number.MIN_VALUE]) rejects(() => PH.photon(wavelength));
});

test('first-order decay has half-life and exact time-composition invariants', () => {
  has('firstOrder');
  near(PH.firstOrder(8, 2, Math.log(2) / 2), 4);
  near(PH.firstOrder(8, 0, 999), 8, 0, 0);
  near(PH.firstOrder(8, 2, 0), 8, 0, 0);
  near(PH.firstOrder(0, 2, 99), 0, 0, 0);
  near(PH.firstOrder(8, 1e308, 1e308), 0, 0, 0);
  near(PH.firstOrder(PH.firstOrder(8, .2, 3), .2, 7), PH.firstOrder(8, .2, 10));
  for (const args of [[-1, 1, 1], [1, -1, 1], [1, 1, -1], [NaN, 1, 1], [1, Infinity, 1], [1, 1, '1']]) rejects(() => PH.firstOrder(...args));
});
