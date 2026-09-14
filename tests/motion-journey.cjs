/* The compact recipe must demonstrate actual persistent motion, not only fades. */
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), { JSDOM } = require('jsdom');
const base = process.env.LESSON_TEST_DIR || path.join(__dirname, '..', 'starter');
test('three connected recipe scenes preserve supplied feature values, bilingual states and moving actor identities', async t => {
  const dom = new JSDOM('<body></body>', { runScripts: 'outside-only', pretendToBeVisual: true }); t.after(() => dom.window.close());
  const w = dom.window; w.matchMedia = () => ({ matches: false });
  for (const file of ['lib/dom', 'lib/i18n', 'lib/num', 'lib/anim', 'lib/plot', 'lib/svg', 'lesson', 'film', 'motion', 'patterns', 'perspective', 'layout']) if (fs.existsSync(path.join(base, 'js', file + '.js'))) w.eval(fs.readFileSync(path.join(base, 'js', file + '.js'), 'utf8'));
  const scenes = []; w.D.deck = { register: sc => scenes.push(sc), count: () => 3 };
  const file = path.join(base, 'js/recipes/representation-journey.js'); if (fs.existsSync(file)) w.eval(fs.readFileSync(file, 'utf8'));
  assert.equal(scenes.length, 3);
  const data = JSON.stringify(w.REPRESENTATION_JOURNEY.data); let frames = 0;
  for (const [index, scene] of scenes.entries()) {
    const steps = [], cleanups = [], root = scene.build({ index, step: f => steps.push(f), onDispose: f => cleanups.push(f) }); w.document.body.append(root);
    const actors = [...root.querySelectorAll('[data-shared-id]')]; assert.equal(actors.length, 6);
    const values = actors.map(n => n.dataset.features), nodes = actors.map(n => n.querySelector('[data-record-symbol]'));
    const initial = actors.map(n => n.getAttribute('transform'));
    w.A.run = async paint => { for (let i = 0; i <= 12; i++) {
      paint(i / 12); frames++; assert.equal(JSON.stringify(w.REPRESENTATION_JOURNEY.data), data); assert.deepEqual([...root.querySelectorAll('[data-shared-id]')], actors); assert.deepEqual(actors.map(n => n.dataset.features), values);
      const centers = actors.map(node => { const transform = node.getAttribute('transform'); assert.doesNotMatch(transform, /NaN|Infinity|undefined/); const pair = /translate\(([-.\d]+) ([-.\d]+)\)/.exec(transform); assert.ok(pair); return [+pair[1], +pair[2]]; });
      centers.forEach(([x, y], a) => { assert.ok(x >= 82 && x <= 1198 && y >= 169 && y <= 588, 'identity marks stay within drawing bounds'); centers.slice(a + 1).forEach(([u, v]) => assert.ok(Math.hypot(x - u, y - v) >= 44, 'identity circles do not collide in the demonstrated paths')); });
    } };
    await steps[0](); assert.notDeepEqual(actors.map(n => n.getAttribute('transform')), initial, scene.id + ' changes actual actor geometry');
    for (const fn of steps.slice(1)) await fn();
    assert.equal(scene.notes.length, steps.length + 1); assert.equal(scene.qa.length, 1);
    w.D.i18n.setLang('en'); assert.equal(w.D.i18n.notes(scene).length, scene.notes.length); assert.match(w.D.i18n.qa(scene)[0].q, /\?/);
    assert.deepEqual(actors.map(n => n.querySelector('[data-record-symbol]')), nodes); w.D.i18n.setLang('ru');
    cleanups.forEach(f => f()); root.remove();
  }
  assert.equal(frames, 78);
});
