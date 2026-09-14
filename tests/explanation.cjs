const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM} = require('jsdom');
const root = path.join(__dirname, '../starter/js');
const plain = value => JSON.parse(JSON.stringify(value));
const near = (actual, expected) => assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) < 1e-10, `${actual} != ${expected}`);
const coords = line => ['x1', 'y1', 'x2', 'y2'].map(key => +line.getAttribute(key));

function setup(t) {
  const dom = new JSDOM('<body></body>', {runScripts: 'outside-only'});
  const w = dom.window;
  for (const name of ['lib/dom', 'lib/num', 'lib/anim', 'lib/plot', 'lib/svg', 'lesson', 'film', 'patterns']) {
    w.eval(fs.readFileSync(path.join(root, name + '.js'), 'utf8'));
  }
  const module = path.join(root, 'explanation.js');
  if (fs.existsSync(module)) w.eval(fs.readFileSync(module, 'utf8'));
  const svg = w.D.dom.s('svg');
  w.document.body.append(svg);
  t.after(() => w.close());
  return {w, svg};
}

test('box anchors land on the chosen edge with an explicit fraction convention', t => {
  const {w} = setup(t);
  assert.equal(typeof w.K.boxAnchor, 'function');
  const frame = {x: 10, y: 20, width: 200, height: 80};
  const before = JSON.stringify(frame);
  assert.deepEqual(plain(w.K.boxAnchor(frame, 'left')), [10, 60]);
  assert.deepEqual(plain(w.K.boxAnchor(frame, 'right', .25)), [210, 40]);
  assert.deepEqual(plain(w.K.boxAnchor(frame, 'top', .75)), [160, 20]);
  assert.deepEqual(plain(w.K.boxAnchor(frame, 'bottom', 1)), [210, 100]);
  assert.deepEqual(plain(w.K.boxAnchor(frame, 'top', 0)), [10, 20]);
  const anchor = w.K.boxAnchor(frame, 'left');
  anchor[0] = 999;
  assert.deepEqual(plain(w.K.boxAnchor(frame, 'left')), [10, 60]);
  assert.equal(JSON.stringify(frame), before);
});

test('box anchors reject invalid dimensions, fractions and overflowing frame edges', t => {
  const {w} = setup(t), box = {x: 10, y: 20, width: 200, height: 80};
  assert.equal(typeof w.K.boxAnchor, 'function');
  for (const invalid of [null, [], {}, {...box, x: NaN}, {...box, y: '20'}, {...box, width: 0}, {...box, height: -1}, {...box, width: Infinity}, {...box, x: 1e308, width: 1e308}]) {
    assert.throws(() => w.K.boxAnchor(invalid, 'left'));
  }
  for (const fraction of [-.01, 1.01, NaN, Infinity, null, '.5']) assert.throws(() => w.K.boxAnchor(box, 'top', fraction));
  for (const side of ['center', '', null, 0]) assert.throws(() => w.K.boxAnchor(box, side));
});

test('guide defaults use a thin semantic dashed butt-cap line without changing other primitives', t => {
  const {w, svg} = setup(t);
  assert.equal(typeof w.K.guideSpan, 'function');
  const guide = w.K.guideSpan(svg, {from: [10, 20], to: [90, 20]});
  assert.equal(guide.g.parentNode, svg);
  assert.deepEqual(coords(guide.line), [10, 20, 90, 20]);
  assert.equal(guide.line.getAttribute('stroke'), w.C.grey);
  assert.equal(guide.line.getAttribute('stroke-width'), '1.5');
  assert.equal(guide.line.getAttribute('stroke-dasharray'), '6 4');
  assert.equal(guide.line.getAttribute('stroke-linecap'), 'butt');
  assert.equal(guide.ticks.length, 0);
  assert.equal(guide.g.querySelectorAll('line').length, 1);
  assert.equal(guide.g.querySelectorAll('circle,path').length, 0);
  assert.equal(w.F.line(svg, 0, 0, 10, 0).getAttribute('stroke-linecap'), 'round');
  assert.deepEqual(plain(guide.snapshot()), {from: [10, 20], to: [90, 20], color: w.C.grey, width: 1.5, dash: [6, 4], tickSize: 0});
});

test('endpoint ticks have exact centers, full requested length and perpendicular direction', t => {
  const {w, svg} = setup(t);
  assert.equal(typeof w.K.guideSpan, 'function');
  const guide = w.K.guideSpan(svg, {from: [10, 20], to: [40, 60], color: w.C.blue, width: 2, dash: [], tickSize: 10});
  assert.deepEqual(coords(guide.ticks[0]), [14, 17, 6, 23]);
  assert.deepEqual(coords(guide.ticks[1]), [44, 57, 36, 63]);
  assert.equal(guide.line.getAttribute('stroke-dasharray'), 'none');
  for (const tick of guide.ticks) {
    assert.equal(tick.getAttribute('stroke-linecap'), 'butt');
    assert.equal(tick.getAttribute('stroke-dasharray'), 'none');
    assert.equal(tick.getAttribute('stroke'), w.C.blue);
    assert.equal(tick.getAttribute('stroke-width'), '2');
    const [x1, y1, x2, y2] = coords(tick);
    near(Math.hypot(x2 - x1, y2 - y1), 10);
    near((x2 - x1) * 30 + (y2 - y1) * 40, 0);
  }
});

test('reversed and vertical spans preserve the endpoints and reverse tick orientation', t => {
  const {w, svg} = setup(t);
  assert.equal(typeof w.K.guideSpan, 'function');
  const guide = w.K.guideSpan(svg, {from: [40, 60], to: [10, 20], tickSize: 10});
  assert.deepEqual(coords(guide.line), [40, 60, 10, 20]);
  assert.deepEqual(coords(guide.ticks[0]), [36, 63, 44, 57]);
  assert.deepEqual(coords(guide.ticks[1]), [6, 23, 14, 17]);
  guide.setEndpoints([7, 30], [7, -10]);
  assert.deepEqual(coords(guide.ticks[0]), [2, 30, 12, 30]);
  assert.deepEqual(coords(guide.ticks[1]), [2, -10, 12, -10]);
});

test('zero-length spans collapse and hide ticks until a direction exists again', t => {
  const {w, svg} = setup(t);
  assert.equal(typeof w.K.guideSpan, 'function');
  const guide = w.K.guideSpan(svg, {from: [5, 7], to: [5, 7], tickSize: 12});
  const ticks = guide.ticks.slice();
  assert.deepEqual(coords(guide.line), [5, 7, 5, 7]);
  for (const tick of ticks) {
    assert.deepEqual(coords(tick), [5, 7, 5, 7]);
    assert.equal(tick.getAttribute('visibility'), 'hidden');
  }
  guide.setEndpoints([5, 7], [17, 7]);
  assert.deepEqual(coords(ticks[0]), [5, 1, 5, 13]);
  assert.ok(ticks.every((node, index) => node === guide.ticks[index] && node.getAttribute('visibility') !== 'hidden'));
  guide.setEndpoints([8, 9], [8, 9]);
  assert.ok(ticks.every(node => node.getAttribute('visibility') === 'hidden'));
  assert.deepEqual(coords(ticks[1]), [8, 9, 8, 9]);
});

test('one paint can keep moving box frames and their persistent guide endpoints in agreement', t => {
  const {w, svg} = setup(t);
  assert.equal(typeof w.K.guideSpan, 'function');
  const start = {x: 90, y: 150, width: 120, height: 80};
  const finish = {x: 800, y: 430, width: 200, height: 120};
  const fixed = {x: 1050, y: 200, width: 100, height: 120};
  const moving = w.D.dom.s('rect', start);
  svg.append(moving);
  const guide = w.K.guideSpan(svg, {from: w.K.boxAnchor(start, 'right'), to: w.K.boxAnchor(fixed, 'left'), tickSize: 8});
  const nodes = [...guide.g.children], count = svg.querySelectorAll('*').length;
  for (const progress of [0, .1, .25, .5, .75, .9, 1, .5, 0]) {
    const box = Object.fromEntries(Object.keys(start).map(key => [key, start[key] + (finish[key] - start[key]) * progress]));
    Object.entries(box).forEach(([key, value]) => moving.setAttribute(key, value));
    assert.equal(guide.setEndpoints(w.K.boxAnchor(box, 'right'), w.K.boxAnchor(fixed, 'left')), guide);
    assert.deepEqual(coords(guide.line), [box.x + box.width, box.y + box.height / 2, 1050, 260]);
    assert.ok(nodes.every((node, index) => node === guide.g.children[index]));
    assert.equal(svg.querySelectorAll('*').length, count);
  }
});

test('construction validates every input before adding any SVG nodes', t => {
  const {w, svg} = setup(t);
  assert.equal(typeof w.K.guideSpan, 'function');
  const base = {from: [10, 20], to: [30, 40]};
  const invalid = [null, [], {}, {...base, unknown: 1}, {...base, from: [1]}, {...base, from: [1, ,]}, {...base, to: [NaN, 2]}, {...base, to: [1, 2, 3]}, {...base, to: [1, '2']}, {...base, width: 0}, {...base, width: -1}, {...base, width: Infinity}, {...base, width: null}, {...base, tickSize: -.1}, {...base, tickSize: NaN}, {...base, dash: '6 4'}, {...base, dash: [1, ,]}, {...base, dash: [-1, 2]}, {...base, dash: [1, Infinity]}, {...base, dash: [0, 0]}, {...base, color: ''}, {...base, color: '   '}, {...base, color: 7}, {from: [-1e308, 0], to: [1e308, 0]}, {from: [1.7e308, 0], to: [1.7e308, 1], tickSize: 1e308}];
  for (const options of invalid) {
    const before = svg.outerHTML;
    assert.throws(() => w.K.guideSpan(svg, options), JSON.stringify(options));
    assert.equal(svg.outerHTML, before);
  }
  assert.throws(() => w.K.guideSpan(w.document.body, base));
  assert.throws(() => w.K.guideSpan(null, base));
});

test('invalid endpoint updates preserve both the current state and every node attribute', t => {
  const {w, svg} = setup(t);
  assert.equal(typeof w.K.guideSpan, 'function');
  const guide = w.K.guideSpan(svg, {from: [10, 20], to: [30, 40], tickSize: 1e308});
  const before = guide.g.outerHTML, state = plain(guide.snapshot());
  for (const [from, to] of [[[1, 2], [Infinity, 2]], [[1, 2], [3]], [[1, ,], [3, 4]], [[-1e308, 0], [1e308, 0]], [[1.7e308, 0], [1.7e308, 1]]]) {
    assert.throws(() => guide.setEndpoints(from, to));
    assert.equal(guide.g.outerHTML, before);
    assert.deepEqual(plain(guide.snapshot()), state);
  }
});

test('input arrays and snapshots cannot mutate guide state or deferred updates', t => {
  const {w, svg} = setup(t);
  assert.equal(typeof w.K.guideSpan, 'function');
  const from = [1, 2], to = [3, 4], dash = [2, 3];
  const guide = w.K.guideSpan(svg, {from, to, dash, tickSize: 6});
  from[0] = 99; to[1] = 99; dash[0] = 99;
  const snapshot = guide.snapshot();
  snapshot.from[0] = 77; snapshot.to[1] = 77; snapshot.dash[0] = 77; snapshot.width = 77;
  assert.deepEqual(plain(guide.snapshot()), {from: [1, 2], to: [3, 4], dash: [2, 3], tickSize: 6, width: 1.5, color: w.C.grey});
  const nextFrom = [10, 11], nextTo = [20, 30];
  guide.setEndpoints(nextFrom, nextTo);
  nextFrom[0] = 88; nextTo[0] = 88;
  assert.deepEqual(coords(guide.line), [10, 11, 20, 30]);
  assert.deepEqual(plain(guide.snapshot().from), [10, 11]);
  assert.notEqual(guide.snapshot().dash, guide.snapshot().dash);
});
