/* Actual scene data, SVG geometry and driver lifecycle. No text-layout or
   browser-rendering claims: jsdom has no font metrics or physical viewport. */
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const { JSDOM } = require('jsdom');
const starter = process.env.LESSON_TEST_DIR || path.join(__dirname, '..', 'starter');
const plain = value => JSON.parse(JSON.stringify(value));
const near = (actual, expected, message = '') => assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) < 1e-8, message + ': ' + actual + ' ≠ ' + expected);
const TARGET = [1.5, 1.1, 1.35], BASE = [1.5, 1.1, 0], ORIGIN = [0, 0, 0];

function fixture(t) {
  const dom = new JSDOM('<body></body>', { runScripts: 'outside-only', pretendToBeVisual: true }), w = dom.window;
  w.matchMedia = () => ({ matches: false });
  const errors = []; w.console.error = (...args) => errors.push(args.map(String).join(' '));
  t.after(() => { assert.deepEqual(errors, [], 'no swallowed scene errors'); w.close(); });
  for (const file of ['lib/dom', 'lib/num', 'lib/anim', 'lib/plot', 'lib/svg', 'lesson', 'film', 'patterns', 'perspective']) w.eval(fs.readFileSync(path.join(starter, 'js', file + '.js'), 'utf8'));
  const scenes = [], created = [], original = w.K.spatialScene;
  w.K.spatialScene = (parent, options) => {
    const chart = original(parent, options);
    const nodes = new Map(Array.from(chart.g.querySelectorAll('[data-spatial-id]'), node => [node.dataset.spatialId, node]));
    created.push({ chart, initial: plain(chart.snapshot()), nodes }); return chart;
  };
  w.D.deck = { register: scene => scenes.push(scene), count: () => 13 };
  for (const name of ['12-viewpoint', '13-dimension']) w.eval(fs.readFileSync(path.join(starter, 'js/episodes', name + '.js'), 'utf8'));
  function build(index) {
    const scene = scenes[index], steps = [], cleanups = [], count = created.length;
    const root = scene.build({ index: index + 11, step: fn => steps.push(fn), onDispose: fn => cleanups.push(fn) }); w.document.body.append(root);
    assert.equal(created.length, count + 1, 'one spatial scene per episode');
    assert.equal(steps.length, 3); assert.equal(scene.notes.length, 4); assert.equal(scene.qa.length, 2); assert.equal(cleanups.length, 1);
    return { scene, root, steps, cleanups, ...created.at(-1) };
  }
  return { w, scenes, build };
}

function visible(node, root) {
  for (let current = node; current; current = current.parentElement) {
    if (current.hidden || current.style.display === 'none' || current.style.visibility === 'hidden' || (current.style.opacity !== '' && +current.style.opacity <= .01)) return false;
    if (current === root) break;
  }
  return true;
}
function geometryAndIdentity(built) {
  const { root, chart, nodes } = built, current = new Map();
  for (const node of chart.g.querySelectorAll('[data-spatial-id]')) {
    assert.ok(!current.has(node.dataset.spatialId), 'a spatial ID is not duplicated'); current.set(node.dataset.spatialId, node);
  }
  assert.equal(current.size, nodes.size);
  for (const [id, node] of nodes) { assert.equal(current.get(id), node, id + ' node is persistent despite point sorting'); assert.ok(node.isConnected); }
  const bounded = (x, y, radius = 0) => {
    assert.ok(Number.isFinite(x) && Number.isFinite(y));
    assert.ok(x - radius >= 60 - 1e-8 && x + radius <= 1220 + 1e-8 && y - radius >= 147 - 1e-8 && y + radius <= 610 + 1e-8,
      built.scene.id + ': visible geometric mark escaped safe viewport at ' + [x, y, radius]);
  };
  for (const node of chart.g.querySelectorAll('circle,line,polygon,path')) {
    for (const attr of node.attributes) assert.ok(!/NaN|Infinity|undefined/.test(attr.value), 'finite SVG geometry');
    if (!visible(node, root)) continue;
    if (node.tagName === 'circle') bounded(+node.getAttribute('cx'), +node.getAttribute('cy'), +node.getAttribute('r'));
    else if (node.tagName === 'line') {
      const half = +(node.getAttribute('stroke-width') || 1) / 2;
      bounded(+node.getAttribute('x1'), +node.getAttribute('y1'), half); bounded(+node.getAttribute('x2'), +node.getAttribute('y2'), half);
    } else {
      // Scene polygons and F.arrow heads contain only explicit M/L vertices.
      const raw = node.getAttribute(node.tagName === 'polygon' ? 'points' : 'd');
      const values = (raw.match(/[-+]?(?:\d*\.?\d+)(?:e[-+]?\d+)?/gi) || []).map(Number);
      assert.equal(values.length % 2, 0); for (let i = 0; i < values.length; i += 2) bounded(values[i], values[i + 1]);
    }
  }
  const snapshot = plain(chart.snapshot());
  for (const point of snapshot.points) {
    const node = chart.points.get(point.id);
    near(+node.getAttribute('r'), point.r, 'radius stays in screen units'); assert.equal(node.getAttribute('fill'), point.color);
  }
  return snapshot;
}
function withoutCamera(snapshot) { const copy = plain(snapshot); delete copy.camera; return copy; }
function checkCloud(built) {
  const snapshot = geometryAndIdentity(built), { root, chart, initial } = built;
  assert.deepEqual(withoutCamera(snapshot), withoutCamera(initial), 'the cloud, cage and label world coordinates do not change');
  assert.equal(snapshot.points.length, 34); assert.equal(+root.dataset.pointCount, 34); assert.equal(root.dataset.coordinateMode, 'fixed-world');
  const values = new Map(snapshot.points.map(point => [point.id, point]));
  for (let i = 0; i <= 16; i++) {
    const suffix = i || '', p = values.get('P' + suffix), q = values.get('Q' + suffix);
    near(p.xyz[0], q.xyz[0]); near(p.xyz[1], q.xyz[1]); near(q.xyz[2] - p.xyz[2], 2.3, 'paired depths differ by 2.3');
  }
  assert.deepEqual(values.get('P').xyz, [0, 0, -1.15]); assert.deepEqual(values.get('Q').xyz, [0, 0, 1.15]);
  const angle = +root.dataset.angle, p = chart.points.get('P'), q = chart.points.get('Q');
  near(snapshot.camera.pitch, -angle); near(snapshot.camera.yaw, -22 * Math.sin(angle * Math.PI / 90)); near(snapshot.camera.scale, 82); near(snapshot.camera.cy, 371);
  near(Math.hypot(+q.getAttribute('cx') - +p.getAttribute('cx'), +q.getAttribute('cy') - +p.getAttribute('cy')), 2.3 * 82 * Math.sin(angle * Math.PI / 180), 'only projected separation varies');
  // The global clip alone is insufficient: keep the moving cage clear of
  // the subtitle at y=181 and the slider beginning at y=552.
  for (const node of chart.segments.values()) for (const end of ['1', '2']) {
    const x = +node.getAttribute('x' + end), y = +node.getAttribute('y' + end);
    assert.ok(x >= 60 - 1e-8 && x <= 1220 + 1e-8 && y >= 200 - 1e-8 && y <= 542 + 1e-8,
      'cloud wireframe enters the subtitle or slider band at ' + [x, y]);
  }
  return snapshot;
}
function checkPlane(built, phase) {
  const snapshot = geometryAndIdentity(built), state = built.root.dataset;
  const tilt = +state.tilt, axis = +state.axis, lift = +state.lift;
  for (const value of [tilt, axis, lift]) assert.ok(value >= 0 && value <= 1);
  assert.deepEqual(JSON.parse(state.target), TARGET, 'TARGET remains a supplied 3D coordinate'); assert.equal(state.coordinateMode, 'dimension-reveal');
  near(snapshot.camera.yaw, -30 * tilt); near(snapshot.camera.pitch, -62 * tilt); near(snapshot.camera.scale, 128);
  const points = new Map(snapshot.points.map(p => [p.id, p])), segments = new Map(snapshot.segments.map(s => [s.id, s]));
  const tip = [TARGET[0], TARGET[1], TARGET[2] * lift];
  assert.deepEqual(points.get('shadow').xyz, BASE, 'the shadow never leaves the original plane projection');
  assert.deepEqual(points.get('tip').xyz, tip);
  assert.deepEqual(segments.get('vector').from, ORIGIN); assert.deepEqual(segments.get('vector').to, tip);
  assert.deepEqual(segments.get('shadow-arrow').from, ORIGIN); assert.deepEqual(segments.get('shadow-arrow').to, BASE);
  assert.deepEqual(segments.get('lift-line').from, BASE); assert.deepEqual(segments.get('lift-line').to, tip);
  assert.deepEqual(segments.get('z-axis').from, ORIGIN); assert.deepEqual(segments.get('z-axis').to, [0, 0, 1.9 * axis]);
  near(points.get('shadow').opacity, lift); near(segments.get('shadow-arrow').opacity, .65 * lift); near(segments.get('lift-line').opacity, lift); near(segments.get('z-axis').opacity, axis);
  for (const item of snapshot.polygons) assert.ok(item.vertices.every(xyz => xyz[2] === 0), 'the reference floor stays at z=0');
  for (const item of snapshot.segments.filter(s => /^g[xy]|^[xy]-axis$/.test(s.id))) assert.deepEqual([item.from[2], item.to[2]], [0, 0], 'grid and original axes remain in the plane');
  if (phase === 0) assert.deepEqual([tilt, axis, lift], [0, 0, 0]);
  if (phase === 1) assert.deepEqual([axis, lift], [0, 0], 'tilt finishes before introducing the z axis');
  if (phase === 2) assert.deepEqual([tilt, lift], [1, 0], 'axis grows with a stopped camera and no point lift');
  if (phase === 3) assert.deepEqual([tilt, axis], [1, 1], 'point rises only after the camera and axis finish');
  return snapshot;
}
function check(built, phase) { return built.scene.id === 'viewpoint-cloud' ? checkCloud(built) : checkPlane(built, phase); }

test('episodes 12 and 13 retain spatial identities and scientific values across 31 frames per transition and replay', async t => {
  const { w, build } = fixture(t); let current, phase, frames = 0;
  w.A.run = async paint => {
    for (let i = 0; i <= 30; i++) { const q = i / 30; paint(q * q * q * (q * (q * 6 - 15) + 10)); check(current, phase); frames++; }
  };
  for (let index = 0; index < 2; index++) {
    let expected;
    for (let replay = 0; replay < 2; replay++) {
      current = build(index); phase = 0;
      const states = [{ model: check(current, phase), state: { ...current.root.dataset } }];
      for (let i = 0; i < current.steps.length; i++) { phase = i + 1; await current.steps[i](); states.push({ model: check(current, phase), state: { ...current.root.dataset } }); }
      if (index === 0) assert.deepEqual(states.map(s => +s.state.angle), [0, 58, 90, 0]);
      else assert.deepEqual(states.map(s => [+s.state.tilt, +s.state.axis, +s.state.lift]), [[0, 0, 0], [1, 0, 0], [1, 1, 0], [1, 1, 1]]);
      if (!replay) expected = states; else assert.deepEqual(states, expected, 'a rebuild and replay reproduce all four scientific states');
      current.cleanups.forEach(fn => fn()); current.root.remove();
    }
  }
  assert.equal(frames, 372); t.diagnostic('2 scenes × 2 replays × 3 transitions × 31 frames; geometric glyph bounds, not font measurements');
});

test('each scene slider supersedes pending camera frames and disposal prevents later writes', async t => {
  const { w, build } = fixture(t);
  for (let index = 0; index < 2; index++) {
    const jobs = []; w.A.run = paint => new Promise(resolve => jobs.push({ paint, resolve }));
    const built = build(index), first = built.steps[0]();
    jobs[0].paint(.4); check(built);
    const input = built.root.querySelector('input[type="range"]'), value = index === 0 ? 37 : .25;
    input.value = value; input.dispatchEvent(new w.Event('input', { bubbles: true }));
    const manual = plain(built.chart.snapshot()), state = { ...built.root.dataset };
    jobs[0].paint(1); jobs[0].resolve(); assert.equal((await first).completed, false);
    assert.deepEqual(plain(built.chart.snapshot()), manual, 'stale camera target does not replace slider input'); assert.deepEqual({ ...built.root.dataset }, state);
    near(+(index === 0 ? built.root.dataset.angle : built.root.dataset.tilt), value); check(built);
    const second = built.steps[1](); jobs[1].paint(.35); check(built);
    built.cleanups.forEach(fn => fn()); const html = built.root.innerHTML, frozen = plain(built.chart.snapshot());
    jobs[1].paint(1); jobs[1].resolve(); assert.equal((await second).completed, false);
    assert.equal(built.root.innerHTML, html, 'disposed scene receives no late DOM paint'); assert.deepEqual(plain(built.chart.snapshot()), frozen); built.root.remove();
  }
});

test('final plane camera changes preserve the revealed coordinate and make its top view coincide with the shadow', async t => {
  const { w, build } = fixture(t), built = build(1); w.A.run = async paint => paint(1);
  for (const step of built.steps) await step();
  const input = built.root.querySelector('input[type="range"]');
  for (const tilt of [0, .25, .5, .75, 1, 0]) {
    input.value = tilt; input.dispatchEvent(new w.Event('input', { bubbles: true })); const snapshot = checkPlane(built);
    assert.deepEqual(snapshot.points.find(p => p.id === 'tip').xyz, TARGET); assert.deepEqual(snapshot.points.find(p => p.id === 'shadow').xyz, BASE);
    if (tilt === 0) {
      const tip = built.chart.points.get('tip'), shadow = built.chart.points.get('shadow');
      near(+tip.getAttribute('cx'), +shadow.getAttribute('cx')); near(+tip.getAttribute('cy'), +shadow.getAttribute('cy'));
    }
  }
  built.cleanups.forEach(fn => fn());
});

test('manual plane camera movement does not cancel axis growth or leave a partially revealed coordinate', async t => {
  const { w, build } = fixture(t), jobs = [];
  w.A.run = paint => new Promise(resolve => jobs.push({ paint, resolve }));
  const built = build(1), input = built.root.querySelector('input[type="range"]');
  const tilt = built.steps[0](); jobs[0].paint(1); jobs[0].resolve(); assert.equal((await tilt).completed, true);
  const axis = built.steps[1](); jobs[1].paint(.4);
  input.value = .7; input.dispatchEvent(new w.Event('input', { bubbles: true }));
  near(+built.root.dataset.tilt, .7); near(+built.root.dataset.axis, .4); checkPlane(built);
  jobs[1].paint(1); jobs[1].resolve(); assert.equal((await axis).completed, true, 'camera input does not cancel the axis disclosure');
  near(+built.root.dataset.axis, 1); near(+built.root.dataset.tilt, .7);
  const lift = built.steps[2](); jobs[2].paint(.4);
  input.value = .2; input.dispatchEvent(new w.Event('input', { bubbles: true }));
  near(+built.root.dataset.tilt, .2); near(+built.root.dataset.lift, .4);
  let snapshot = checkPlane(built); near(snapshot.points.find(p => p.id === 'tip').xyz[2], TARGET[2] * .4);
  jobs[2].paint(.6); near(+built.root.dataset.lift, .6); near(+built.root.dataset.tilt, .2); checkPlane(built);
  jobs[2].paint(1); jobs[2].resolve(); assert.equal((await lift).completed, true, 'camera input does not cancel the coordinate disclosure');
  snapshot = checkPlane(built); assert.deepEqual(snapshot.points.find(p => p.id === 'tip').xyz, TARGET); assert.deepEqual(JSON.parse(built.root.dataset.target), TARGET);
  near(+built.root.dataset.tilt, .2); near(+built.root.dataset.lift, 1); built.cleanups.forEach(fn => fn());
});
