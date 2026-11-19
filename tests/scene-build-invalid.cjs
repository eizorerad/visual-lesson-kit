/* Scenes whose build() returns a non-Node render an error box and keep navigation alive. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const starter = process.env.LESSON_TEST_DIR || path.join(__dirname, '..', 'starter');

function fixture(t, builds) {
  const dom = new JSDOM('<body><div id="frame"></div><nav id="chrome"></nav></body>', {
    runScripts: 'outside-only', pretendToBeVisual: true, url: 'http://localhost/lesson/'
  });
  t.after(() => dom.window.close());
  const w = dom.window;
  w.matchMedia = () => ({ matches: true });
  for (const file of ['js/lib/dom.js', 'js/lib/i18n.js', 'js/lib/touch.js', 'js/lib/anim.js', 'js/deck.js']) w.eval(fs.readFileSync(path.join(starter, file), 'utf8'));
  builds.forEach((build, i) => w.D.deck.register({ id: 's' + i, title: 'Scene ' + i, chapter: 'Test', notes: [], build: build(w) }));
  w.D.deck.boot();
  return w;
}

const valid = w => () => w.D.dom.h('section.ok', 'fine');
for (const [name, value] of [['undefined', undefined], ['null', null]]) {
  test('build() returning ' + name + ' shows an error box and navigation continues', t => {
    const origError = console.error; console.error = () => {};
    t.after(() => { console.error = origError; });
    const w = fixture(t, [() => () => value, valid, valid]);
    const doc = w.document;
    assert.doesNotThrow(() => w.D.deck.show(0, 0));
    const box = doc.querySelector('#frame .scene-error');
    assert.ok(box, 'error box rendered');
    assert.match(box.textContent, /build\(\) must return an element/);
    assert.equal(w.D.deck.current().index, 0);
    assert.doesNotThrow(() => w.D.deck.show(1, 0));
    assert.equal(doc.querySelector('#frame .scene-error'), null);
    assert.ok(doc.querySelector('#frame .ok'));
    assert.equal(w.D.deck.current().index, 1);
  });
}
