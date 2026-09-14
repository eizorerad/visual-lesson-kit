/* Numeric motion contracts. Browser label layout is checked separately. */
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), { JSDOM } = require('jsdom');
const base = process.env.LESSON_TEST_DIR || path.join(__dirname, '..', 'starter');
function fixture(t) {
  const dom = new JSDOM('<body><svg><g id="one"><text>One</text></g><g id="two"><text>Two</text></g></svg></body>', { runScripts: 'outside-only' });
  t.after(() => dom.window.close());
  for (const f of ['js/lib/dom.js', 'js/film.js', 'js/motion.js']) if (fs.existsSync(path.join(base, f))) dom.window.eval(fs.readFileSync(path.join(base, f), 'utf8'));
  const w = dom.window; assert.equal(typeof w.F.motionTrack, 'function');
  return { w, nodes: ['one', 'two'].map(id => w.document.getElementById(id)) };
}
const plain = x => JSON.parse(JSON.stringify(x));
test('keyed poses move persistent actors through an explicit waypoint and reverse exactly', t => {
  const { w, nodes } = fixture(t), text = nodes.map(n => n.firstChild);
  const track = w.F.motionTrack(nodes.map((node, i) => ({ id: ['a', 'b'][i], node })));
  const from = { a: { x: 0, y: 10 }, b: { x: 60, y: 10 } };
  const to = { b: { x: 100, y: 200 }, a: { x: 100, y: 100, scale: 2, opacity: .5 } };
  track.between(from, to, .5, { via: { a: { x: 220, y: 30 } } });
  assert.deepEqual(plain(track.snapshot().a), { x: 220, y: 30, scale: 1.5, opacity: .75 });
  assert.deepEqual(plain(track.snapshot().b), { x: 80, y: 105, scale: 1, opacity: 1 });
  for (const p of [1, .3, 0, .5, 1, 0]) track.between(from, to, p);
  assert.equal(nodes[0].getAttribute('transform'), 'translate(0 10) scale(1)');
  assert.deepEqual(nodes.map(n => n.firstChild), text);
  assert.equal(nodes[0].dataset.motionId, 'a');
  const snapshot = track.snapshot(); snapshot.a.x = 999; assert.equal(track.snapshot().a.x, 0);
});
test('invalid poses reject atomically and actor IDs must form a unique complete mapping', t => {
  const { w, nodes } = fixture(t);
  assert.throws(() => w.F.motionTrack([{ id: 'a', node: nodes[0] }, { id: 'a', node: nodes[1] }]));
  assert.throws(() => w.F.motionTrack([{ id: 'a', node: nodes[0] }, { id: 'b', node: nodes[0] }]));
  const track = w.F.motionTrack([{ id: 'a', node: nodes[0] }, { id: 'b', node: nodes[1] }]);
  const good = { a: { x: 10, y: 20 }, b: { x: 30, y: 40 } }; track.set(good);
  const before = nodes.map(n => n.outerHTML), snap = plain(track.snapshot());
  for (const bad of [{ a: good.a }, { ...good, c: good.a }, { ...good, b: { x: NaN, y: 2 } }, { ...good, b: { x: 1, y: 2, scale: 0 } }, { ...good, b: { x: 1, y: 2, opacity: 2 } }]) {
    assert.throws(() => track.set(bad)); assert.deepEqual(nodes.map(n => n.outerHTML), before); assert.deepEqual(plain(track.snapshot()), snap);
  }
  assert.throws(() => track.between(good, good, NaN));
  assert.throws(() => track.between(good, good, .5, { via: { missing: { x: 1, y: 2 } } }));
  assert.throws(() => track.between(good, { a: { x: Number.MAX_VALUE, y: 20 }, b: good.b }, .5, { via: { a: { x: -Number.MAX_VALUE, y: 2 } } }));
  assert.deepEqual(nodes.map(n => n.outerHTML), before);
});
