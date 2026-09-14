/* Prediction arithmetic and SVG trajectories; not browser layout checks. */
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { JSDOM } = require('jsdom');
const starter = process.env.LESSON_TEST_DIR || path.join(__dirname, '..', 'starter');
function environment(t) {
  const dom = new JSDOM('<body></body>', { runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window; w.matchMedia = () => ({ matches: true });
  for (const file of ['lib/dom', 'lib/num', 'lib/anim', 'lib/plot', 'lib/svg', 'lesson', 'film', 'patterns']) w.eval(fs.readFileSync(path.join(starter, 'js', file + '.js'), 'utf8'));
  const module = path.join(starter, 'js/predictions.js'); if (fs.existsSync(module)) w.eval(fs.readFileSync(module, 'utf8'));
  const svg = w.D.dom.s('svg'); w.document.body.append(svg); t.after(() => w.close());
  return { w, svg };
}
const items = [{ id: 'A', observed: -2, predicted: -1 }, { id: 'B', observed: 0, predicted: 1 }, { id: 'C', observed: 4, predicted: 3 }];
const options = () => ({ items, domain: [-6, 6], x: 180, y: 240, width: 560, height: 240 });
const near = (actual, expected) => assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) < 1e-9, actual + ' ≠ ' + expected);

test('Pearson and L2 use the currently displayed raw predictions, including zero and negative amplitudes', t => {
  const { w, svg } = environment(t);
  assert.equal(typeof w.K.predictionComparison, 'function');
  const chart = w.K.predictionComparison(svg, options());
  near(chart.metrics().pearson, Math.sqrt(27 / 28)); near(chart.metrics().l2, Math.sqrt(3));
  chart.setAmplitude(2); near(chart.metrics().pearson, Math.sqrt(27 / 28)); near(chart.metrics().l2, Math.sqrt(8));
  chart.setAmplitude(-1); near(chart.metrics().pearson, -Math.sqrt(27 / 28));
  chart.setAmplitude(0); assert.equal(chart.metrics().pearson, null); near(chart.metrics().l2, Math.sqrt(20));
  assert.deepEqual(Array.from(chart.values(), row => [row.observed, row.predicted, row.residual]), [[-2, 0, 2], [0, 0, 0], [4, 0, -4]]);
  const constant = w.K.predictionComparison(svg, { ...options(), items: [{ id: 'a', observed: 2, predicted: 1 }, { id: 'b', observed: 2, predicted: 3 }] });
  assert.equal(constant.metrics().pearson, null, 'constant observed values have undefined Pearson');
  const single = w.K.predictionComparison(svg, { ...options(), items: [{ id: 'a', observed: 2, predicted: 1 }] });
  assert.equal(single.metrics().pearson, null); near(single.metrics().l2, 1);
});

test('intermediate amplitudes preserve all IDs, units, glyphs, displayed numbers and residual endpoints', t => {
  const { w, svg } = environment(t); assert.equal(typeof w.K.predictionComparison, 'function');
  const chart = w.K.predictionComparison(svg, options());
  const observed = Array.from(chart.observedPoints), predicted = Array.from(chart.predictedPoints), residuals = Array.from(chart.residualLines);
  chart.showResiduals(1);
  for (let k = 0; k <= 80; k++) {
    const amplitude = -2 + k / 20; chart.setAmplitude(amplitude);
    let squared = 0;
    chart.values().forEach((row, i) => {
      const value = items[i].predicted * amplitude, residual = value - items[i].observed;
      squared += residual * residual;
      assert.equal(row.id, items[i].id); near(row.observed, items[i].observed); near(row.predicted, value); near(row.residual, residual);
      assert.equal(chart.observedPoints[i], observed[i]); assert.equal(chart.predictedPoints[i], predicted[i]); assert.equal(chart.residualLines[i], residuals[i]);
      near(+observed[i].getAttribute('cx'), 180 + (items[i].observed + 6) / 12 * 560);
      near(+predicted[i].getAttribute('x') + +predicted[i].getAttribute('width') / 2, 180 + (value + 6) / 12 * 560);
      near(+residuals[i].getAttribute('x1'), chart.xScale(items[i].observed)); near(+residuals[i].getAttribute('x2'), chart.xScale(value));
      assert.equal(residuals[i].getAttribute('stroke-linecap'), 'butt');
      assert.ok(+residuals[i].getAttribute('x1') >= 180 && +residuals[i].getAttribute('x1') <= 740);
      assert.ok(+residuals[i].getAttribute('x2') >= 180 && +residuals[i].getAttribute('x2') <= 740);
      near(+chart.valueLabels[i].observed.textContent, row.observed);
      assert.ok(Math.abs(+chart.valueLabels[i].predicted.textContent - value) < .00501);
      assert.ok(Math.abs(+chart.valueLabels[i].residual.textContent - residual) < .00501);
    });
    near(chart.metrics().l2, Math.sqrt(squared)); near(chart.metrics().amplitude, amplitude);
  }
  assert.deepEqual(items.map(row => [row.observed, row.predicted]), [[-2, -1], [0, 1], [4, 3]], 'input unchanged');
});

test('dense inputs and complete in-domain geometry are validated before any drawing mutation', t => {
  const { w, svg } = environment(t); assert.equal(typeof w.K.predictionComparison, 'function');
  for (const patch of [
    { items: [] }, { items: [items[0], , items[2]] }, { items: [items[0], items[0]] },
    { items: [{ id: 'x', observed: NaN, predicted: 1 }] }, { items: [{ id: 'x', observed: 1, predicted: undefined }] },
    { items: [{ id: '', observed: 1, predicted: 1 }] }, { items: [{ id: 'x', observed: 7, predicted: 1 }] },
    { items: [{ id: 'x', observed: 1, predicted: 7 }] }, { domain: [-6, ,] }, { domain: [6, -6] },
    { width: 0 }, { x: Infinity }, { amplitude: 3 }
  ]) {
    assert.throws(() => w.K.predictionComparison(svg, { ...options(), ...patch })); assert.equal(svg.childNodes.length, 0);
  }
  const chart = w.K.predictionComparison(svg, options()), before = chart.g.outerHTML, metrics = chart.metrics();
  for (const amplitude of [2.01, -2.01, NaN, Infinity, '1']) {
    assert.throws(() => chart.setAmplitude(amplitude)); assert.equal(chart.g.outerHTML, before); assert.equal(chart.metrics(), metrics);
  }
  assert.throws(() => chart.showResiduals(NaN)); assert.equal(chart.g.outerHTML, before);
});

function episode(w) {
  let scene;
  w.D.deck = { register: value => { scene = value; }, count: () => 9 };
  w.eval(fs.readFileSync(path.join(starter, 'js/episodes/09-prediction.js'), 'utf8'));
  return scene;
}
function checkScene(root) {
  const chart = root.querySelector('[data-component="prediction-comparison"]'), a = +chart.dataset.amplitude;
  const expected = [2, 4, 6, 8], observed = chart.querySelectorAll('circle[data-observation-id]');
  const predicted = chart.querySelectorAll('rect[data-observation-id]');
  assert.equal(observed.length, 4); assert.equal(predicted.length, 4);
  let squared = 0;
  observed.forEach((node, i) => {
    assert.equal(node.dataset.observationId, 'S' + (i + 1)); near(+node.dataset.value, expected[i]);
    assert.equal(predicted[i].dataset.observationId, node.dataset.observationId); near(+predicted[i].dataset.value, expected[i] * a);
    squared += (expected[i] * a - expected[i]) ** 2;
    const cx = +node.getAttribute('cx'), cy = +node.getAttribute('cy'), r = +node.getAttribute('r');
    const x = +predicted[i].getAttribute('x'), y = +predicted[i].getAttribute('y');
    assert.ok(cx - r >= 60 && cx + r <= 1220 && cy - r >= 147 && cy + r <= 610);
    assert.ok(x >= 60 && x + 12 <= 1220 && y >= 147 && y + 12 <= 610, 'entire glyph remains inside safe clip');
  });
  const l2 = root.querySelector('[data-metric="l2"]'), pearson = root.querySelector('[data-metric="pearson"]');
  near(+l2.dataset.value, Math.sqrt(squared)); assert.equal(l2.textContent, Math.sqrt(squared).toFixed(2));
  if (a === 0) { assert.equal(pearson.dataset.value, 'null'); assert.equal(pearson.textContent, 'не определён'); }
  else { near(+pearson.dataset.value, 1); assert.equal(pearson.textContent, '1.00'); }
  return { amplitude: a, values: Array.from(predicted, node => +node.dataset.value), l2: +l2.dataset.value };
}

test('episode 09 synchronizes metrics through all transitions and replays all four states', async t => {
  const { w } = environment(t), scene = episode(w);
  assert.equal(scene.notes.length, 4); assert.equal(scene.qa.length, 2);
  assert.ok(scene.notes.every(note => note && !/<a\b/.test(note)));
  assert.ok(scene.qa.every(item => item.q && item.a && item.source && !item.url), 'toy data has no fictional links');
  let root, frames = 0;
  w.A.run = async fn => { for (let k = 0; k <= 40; k++) { const t = k / 40; fn(t * t * t * (t * (t * 6 - 15) + 10)); frames++; checkScene(root); } };
  const reference = [];
  for (let replay = 0; replay < 2; replay++) {
    const steps = [], cleanup = [];
    root = scene.build({ index: 8, step: fn => steps.push(fn), onDispose: fn => cleanup.push(fn) }); w.document.body.append(root);
    assert.equal(steps.length, 3); assert.equal(cleanup.length, 1);
    const glyphs = Array.from(root.querySelectorAll('circle[data-observation-id], rect[data-observation-id]'));
    const states = [checkScene(root)];
    for (const step of steps) { await step(); states.push(checkScene(root)); }
    assert.deepEqual(Array.from(root.querySelectorAll('circle[data-observation-id], rect[data-observation-id]')), glyphs);
    assert.deepEqual(states.map(state => state.amplitude), [1, 1.5, 1.5, 0]);
    if (replay === 0) reference.push(...states); else assert.deepEqual(states, reference);
    cleanup.forEach(fn => fn()); root.remove();
  }
  assert.equal(frames, 246);
});

test('slider input supersedes an in-flight episode transition without stale frames restoring its value', async t => {
  const { w } = environment(t), scene = episode(w), steps = [], cleanup = [], jobs = [];
  w.A.run = fn => new Promise(resolve => jobs.push({ tick: fn, resolve }));
  const root = scene.build({ index: 8, step: fn => steps.push(fn), onDispose: fn => cleanup.push(fn) }); w.document.body.append(root);
  const transition = steps[0](); jobs[0].tick(.4); near(checkScene(root).amplitude, 1.2);
  const slider = root.querySelector('input[type="range"]'); slider.value = '.75'; slider.dispatchEvent(new w.Event('input', { bubbles: true }));
  near(checkScene(root).amplitude, .75);
  jobs[0].tick(1); jobs[0].resolve(); await transition;
  near(checkScene(root).amplitude, .75);
  const next = steps[1](); jobs[1].tick(.3); cleanup.forEach(fn => fn()); const before = root.innerHTML;
  jobs[1].tick(1); jobs[1].resolve(); await next;
  assert.equal(root.innerHTML, before, 'disposed scene receives no late paint');
});
