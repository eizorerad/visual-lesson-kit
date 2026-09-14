/* Orthographic arithmetic and persistent SVG geometry; not browser rendering. */
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const { JSDOM } = require('jsdom');
const starter = process.env.LESSON_TEST_DIR || path.join(__dirname, '..', 'starter');
const plain = value => JSON.parse(JSON.stringify(value));
const near = (actual, expected) => assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) < 1e-9, actual + ' ≠ ' + expected);
function fixture(t) {
  const dom = new JSDOM('<body></body>', { runScripts: 'outside-only', pretendToBeVisual: true }), w = dom.window;
  w.matchMedia = () => ({ matches: true });
  for (const name of ['lib/dom', 'lib/num', 'lib/anim', 'lib/plot', 'lib/svg', 'lesson', 'film', 'patterns']) w.eval(fs.readFileSync(path.join(starter, 'js', name + '.js'), 'utf8'));
  const helper = path.join(starter, 'js/perspective.js'); if (fs.existsSync(helper)) w.eval(fs.readFileSync(helper, 'utf8'));
  const svg = w.D.dom.s('svg'); w.document.body.append(svg); t.after(() => w.close()); return { w, svg };
}
function options() {
  return { camera: { cx: 200, cy: 300, scale: 20, yaw: 0, pitch: 0 },
    points: [{ id: 'near', xyz: [1, 0, 2], color: '#abcdef', r: 7, opacity: .8 }, { id: 'far', xyz: [1, 0, -2], color: '#fedcba', r: 9 }],
    segments: [{ id: 'edge', from: [0, 0, 0], to: [1, 2, 3], color: '#123456', width: 3, dash: '4 2' }, { id: 'vector', from: [0, 0, 0], to: [2, 0, 0], color: '#987654', width: 4, arrow: true }],
    polygons: [{ id: 'plane', vertices: [[0, 0, 0], [1, 0, 0], [0, 1, 0]], color: '#112233', opacity: .2 }],
    labels: [{ id: 'label', xyz: [2, 3, 4], text: 'L1', color: '#445566', size: 24, dx: 4, dy: -3, anchor: 'start' }] };
}

test('project3D uses degrees, the agreed yaw/pitch order and a fixed orthographic scale', t => {
  const { w } = fixture(t); assert.equal(typeof w.K.project3D, 'function');
  assert.deepEqual(plain(w.K.project3D([1, 2, 3])), { x: 1, y: -2, depth: 3 });
  let p = w.K.project3D([1, 0, 0], { yaw: 90 }); near(p.x, 0); near(p.y, -1); near(p.depth, 0);
  p = w.K.project3D([0, 0, 1], { pitch: 90 }); near(p.x, 0); near(p.y, 1); near(p.depth, 0);
  p = w.K.project3D([1, 2, 3], { cx: 100, cy: 200, scale: 10, yaw: 90, pitch: 90 }); near(p.x, 80); near(p.y, 230); near(p.depth, 1);
  const close = w.K.project3D([1, 2, 3], { scale: 8 }), distant = w.K.project3D([1, 2, 3000], { scale: 8 });
  near(close.x, distant.x); near(close.y, distant.y); near(distant.depth, 3000);
  const wrapped = w.K.project3D([1, 2, 3], { yaw: 450, pitch: -270 }), quarter = w.K.project3D([1, 2, 3], { yaw: 90, pitch: 90 });
  ['x', 'y', 'depth'].forEach(key => near(wrapped[key], quarter[key]));
});

test('camera orbits preserve point norms and pairwise 3D distances when depth is retained', t => {
  const { w } = fixture(t); assert.equal(typeof w.K.project3D, 'function');
  const a = [3, -4, 12], b = [-2, 5, 8], distance = Math.hypot(...a.map((v, i) => v - b[i]));
  for (let yaw = -180; yaw <= 180; yaw += 15) for (const pitch of [-75, -25, 0, 35, 90]) {
    const camera = { cx: 210, cy: 400, scale: 3.5, yaw, pitch }, p = w.K.project3D(a, camera), q = w.K.project3D(b, camera);
    near(Math.hypot((p.x - camera.cx) / camera.scale, (p.y - camera.cy) / camera.scale, p.depth), 13);
    near(Math.hypot((p.x - q.x) / camera.scale, (p.y - q.y) / camera.scale, p.depth - q.depth), distance);
  }
});

test('camera changes preserve world values, identities, sizes and colors while projecting every geometry kind', t => {
  const { w, svg } = fixture(t); assert.equal(typeof w.K.spatialScene, 'function');
  const input = options(), original = plain(input), scene = w.K.spatialScene(svg, input), before = scene.snapshot();
  const point = scene.points.get('near'), far = scene.points.get('far'), edge = scene.segments.get('edge'), arrow = scene.segments.get('vector'), polygon = scene.polygons.get('plane'), label = scene.labels.get('label');
  for (let yaw = 0; yaw <= 180; yaw += 3) {
    assert.equal(scene.setCamera({ yaw, pitch: 35 }), scene); const camera = scene.snapshot().camera;
    const pp = w.K.project3D(input.points[0].xyz, camera), start = w.K.project3D(input.segments[0].from, camera), end = w.K.project3D(input.segments[0].to, camera), lp = w.K.project3D(input.labels[0].xyz, camera);
    near(+point.getAttribute('cx'), pp.x); near(+point.getAttribute('cy'), pp.y); near(+point.getAttribute('r'), 7);
    near(+edge.getAttribute('x1'), start.x); near(+edge.getAttribute('y1'), start.y); near(+edge.getAttribute('x2'), end.x); near(+edge.getAttribute('y2'), end.y);
    near(+label.getAttribute('x'), lp.x + 4); near(+label.getAttribute('y'), lp.y - 3); assert.equal(label.getAttribute('transform'), null, 'labels stay upright');
    assert.equal(point.getAttribute('fill'), '#abcdef'); assert.equal(far.getAttribute('fill'), '#fedcba'); assert.equal(edge.getAttribute('stroke'), '#123456'); assert.equal(edge.getAttribute('stroke-dasharray'), '4 2');
    assert.equal(arrow.shaft.getAttribute('stroke'), '#987654'); assert.equal(arrow.head.getAttribute('fill'), '#987654');
    assert.equal(polygon.getAttribute('fill'), '#112233'); assert.equal(label.getAttribute('fill'), '#445566');
    assert.equal(scene.points.get('near'), point); assert.equal(scene.segments.get('vector'), arrow); assert.equal(scene.polygons.get('plane'), polygon); assert.equal(scene.labels.get('label'), label);
    const projected = input.polygons[0].vertices.map(xyz => w.K.project3D(xyz, camera));
    const coords = polygon.getAttribute('points').trim().split(/[ ,]+/).map(Number); projected.forEach((p, i) => { near(coords[2 * i], p.x); near(coords[2 * i + 1], p.y); });
  }
  const after = scene.snapshot(); delete after.camera; delete before.camera; assert.deepEqual(plain(after), plain(before)); assert.deepEqual(input, original);
  assert.equal(point.style.opacity, '0.8'); assert.equal(polygon.style.opacity, '0.2');
  scene.setCamera({ scale: 40 });
  near(+point.getAttribute('r'), 7); near(+edge.getAttribute('stroke-width'), 3); near(+arrow.shaft.getAttribute('stroke-width'), 4); near(+label.getAttribute('font-size'), 24);
});

test('geometry and opacity setters chain, snapshot copies cannot mutate scene data, and render reuses nodes', t => {
  const { w, svg } = fixture(t); assert.equal(typeof w.K.spatialScene, 'function');
  const input = options(), scene = w.K.spatialScene(svg, input), point = scene.points.get('near'), arrow = scene.segments.get('vector'), xyz = [4, 5, 6], from = [-1, 1, 0], to = [3, 2, 1];
  assert.equal(scene.setPoint('near', xyz).setSegment('vector', from, to).setOpacity('label', .3).render(), scene);
  near(+point.getAttribute('cx'), 280); near(+point.getAttribute('cy'), 200);
  near(+arrow.shaft.getAttribute('x1'), 180); near(+arrow.shaft.getAttribute('y1'), 280); near(+arrow.shaft.getAttribute('x2'), 260); near(+arrow.shaft.getAttribute('y2'), 260);
  assert.equal(scene.labels.get('label').style.opacity, '0.3'); assert.equal(scene.points.get('near'), point);
  xyz[0] = 999; from[0] = 999; to[0] = 999; input.camera.scale = 999; input.points[1].xyz[0] = 999; input.polygons[0].vertices[0][0] = 999;
  const snapshot = scene.snapshot(); snapshot.points[0].xyz[0] = 1000; snapshot.camera.yaw = 1000; snapshot.segments[1].to[0] = 1000; snapshot.polygons[0].vertices[0][0] = 1000;
  scene.render(); near(+point.getAttribute('cx'), 280); near(+scene.points.get('far').getAttribute('cx'), 220); near(scene.snapshot().camera.scale, 20); near(scene.snapshot().segments[1].to[0], 3); near(scene.snapshot().polygons[0].vertices[0][0], 0);
  scene.setSegment('vector', [1, 1, 1], [1, 1, 1]); assert(!/NaN|Infinity/.test(arrow.head.getAttribute('d')), 'zero-length projected arrow is finite');
});

test('point circles sort far to near without recreation and equal depths retain input order', t => {
  const { w, svg } = fixture(t); assert.equal(typeof w.K.spatialScene, 'function');
  const scene = w.K.spatialScene(svg, { points: [{ id: 'a', xyz: [0, 0, 3] }, { id: 'b', xyz: [0, 0, -3] }, { id: 'c', xyz: [1, 0, -3] }] });
  const nodes = Array.from(scene.points.values()), order = () => Array.from(nodes[0].parentNode.children);
  assert.deepEqual(order(), [nodes[1], nodes[2], nodes[0]]);
  scene.setCamera({ pitch: 180 }); assert.deepEqual(order(), [nodes[0], nodes[1], nodes[2]]);
  scene.setCamera({ pitch: 0 }).setPoint('a', [-1, 1, -3]); assert.deepEqual(order(), nodes);
  assert.deepEqual(Array.from(scene.points.values()), nodes, 'the public Map retains original insertion order');
});

test('invalid dense inputs and overflowing projections reject before mutating world state or SVG', t => {
  const { w, svg } = fixture(t); assert.equal(typeof w.K.spatialScene, 'function');
  for (const xyz of [[1, 2], [1, , 3], [1, 2, NaN], ['1', 2, 3], null]) assert.throws(() => w.K.project3D(xyz));
  for (const camera of [{ scale: 0 }, { scale: -1 }, { yaw: Infinity }, { pitch: '90' }, { cx: NaN }, { zoom: 2 }, null]) assert.throws(() => w.K.project3D([1, 2, 3], camera));
  const bad = [
    { points: [options().points[0], ,] }, { points: [{ id: 'x', xyz: [1, , 3] }] }, { points: [{ id: 'x', xyz: [1, 2, 3], r: -1 }] },
    { points: [{ id: '', xyz: [1, 2, 3] }] }, { segments: [{ id: 'near', from: [0, 0, 0], to: [1, 1, 1] }] },
    { segments: [{ id: 's', from: [0, 0, 0], to: [1, 1, 1], arrow: 'yes' }] },
    { polygons: [{ id: 'p', vertices: [[0, 0, 0], , [0, 1, 0]] }] }, { polygons: [{ id: 'p', vertices: [[0, 0, 0], [0, 1, 0]] }] },
    { labels: [{ id: 'l', xyz: [1, 2, 3], text: 'L', dy: Infinity }] }, { labels: [{ id: 'l', xyz: [1, 2, 3], text: 'L', anchor: 'left' }] },
    { camera: { scale: Number.MAX_VALUE } }, { points: [{ id: 'x', xyz: [1, 2, 3], opacity: 1.1 }] }
  ];
  for (const patch of bad) { assert.throws(() => w.K.spatialScene(svg, { ...options(), ...patch })); assert.equal(svg.childNodes.length, 0); }
  const scene = w.K.spatialScene(svg, options()), before = scene.g.outerHTML, state = plain(scene.snapshot());
  for (const update of [() => scene.setCamera({ scale: 0 }), () => scene.setCamera({ scale: Number.MAX_VALUE }), () => scene.setPoint('near', [Number.MAX_VALUE, 1, 2]), () => scene.setPoint('missing', [1, 2, 3]), () => scene.setPoint('vector', [1, 2, 3]), () => scene.setSegment('edge', [1, 2, 3], [1, , 3]), () => scene.setOpacity('near', NaN), () => scene.setOpacity('near', -1), () => scene.setOpacity('unknown', .5)]) {
    assert.throws(update); assert.equal(scene.g.outerHTML, before); assert.deepEqual(plain(scene.snapshot()), state);
  }
});
