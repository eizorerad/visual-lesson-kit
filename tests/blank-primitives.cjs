const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { JSDOM } = require('jsdom');

test('the documented scene and keyboard controls work in a lean blank lesson', async t => {
  const lesson = fs.mkdtempSync(path.join(os.tmpdir(), 'blank-primitives-'));
  t.after(() => fs.rmSync(lesson, { recursive: true, force: true }));
  const python = (...args) => execFileSync('python3', args, { cwd: lesson, encoding: 'utf8' });
  python(path.resolve(__dirname, '../create.py'), lesson, '--template', 'blank', '--lean');
  for (const other of ['js/episodes/01-objects.js', 'js/graph-alignment.js']) {
    assert.ok(!fs.existsSync(path.join(lesson, other)), other + ' is not part of the lean blank lesson');
  }
  const { text } = JSON.parse(python('guide/navigation/route.py', '--read', 'scene', '--json'));
  const entry = 'js/episodes/blank.js';
  fs.writeFileSync(path.join(lesson, entry), text.match(/```js\n([\s\S]+?)\n```/)[1]);
  fs.writeFileSync(path.join(lesson, 'assets/advance.svg'),
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path fill="gold" d="M2 1l7 4-7 4z"/></svg>');
  const html = fs.readFileSync(path.join(lesson, 'index.html'), 'utf8');
  const { window: w } = new JSDOM(html, {
    runScripts: 'outside-only', pretendToBeVisual: true, url: 'http://localhost/?lang=ru'
  });
  t.after(() => w.close());
  await new Promise(resolve => w.document.addEventListener('DOMContentLoaded', resolve, { once: true }));
  for (const script of w.document.querySelectorAll('script[src]')) {
    const src = script.getAttribute('src');
    if (src === entry) {
      for (const fn of [w.K.viewport, w.F.dot, w.F.line, w.F.image, w.T.svgButton]) {
        assert.equal(typeof fn, 'function', 'primitives must be available before ' + entry);
      }
    }
    w.eval(fs.readFileSync(path.join(lesson, src), 'utf8'));
  }

  const deck = w.D.deck;
  assert.equal(deck.count(), 1);
  assert.equal(deck.current().steps, 1);
  const stage = deck.root().querySelector('svg > svg');
  const point = stage.querySelector('circle');
  assert.equal(point.getAttribute('cx'), '300');
  const track = w.F.line(stage, 300, 370, 900, 370);
  assert.equal(track.parentNode, stage);
  assert.equal(track.getAttribute('x2'), '900');
  const button = w.T.svgButton(stage, {
    id: 'advance', label: 'Следующий шаг', box: { x: 970, y: 325, width: 50, height: 50 },
    onActivate: () => deck.next()
  });
  const icon = w.F.image(button.g, 'advance.svg', 970, 325, 50, 50, 'Вперёд');
  assert.equal(icon.getAttribute('href'), 'assets/advance.svg');
  assert.equal(button.g.querySelector('image'), icon);

  w.A.setInstant(true);
  button.g.focus();
  assert.equal(w.document.activeElement, button.g);
  for (const type of ['keydown', 'keyup']) {
    button.g.dispatchEvent(new w.KeyboardEvent(type, { key: 'Enter', bubbles: true, cancelable: true }));
  }
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(deck.current().step, 1);
  assert.equal(deck.root().querySelector('circle'), point);
  assert.equal(point.getAttribute('cx'), '900');
  assert.equal(point.getAttribute('cy'), '350');
});
