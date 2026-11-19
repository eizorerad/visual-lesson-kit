const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

test('blank boots one empty scene and keeps its state while reading in RU and EN', async t => {
  const starter = path.join(__dirname, '../starter');
  const html = fs.readFileSync(path.join(starter, 'blank.html'), 'utf8');
  const { window: w } = new JSDOM(html, {
    runScripts: 'outside-only', pretendToBeVisual: true, url: 'http://localhost/?lang=ru'
  });
  t.after(() => w.close());
  const d = w.document;
  await new Promise(resolve => d.addEventListener('DOMContentLoaded', resolve, { once: true }));
  for (const script of d.querySelectorAll('script[src]')) {
    w.eval(fs.readFileSync(path.join(starter, script.getAttribute('src')), 'utf8'));
  }
  const deck = w.D.deck, root = deck.root(), initial = deck.current();
  assert.equal(deck.count(), 1);
  assert.deepEqual({ ...initial }, { index: 0, step: 0, steps: 0, busy: false });
  assert.equal(root.querySelector('svg').childElementCount, 0);
  assert.equal(d.querySelector('#counter').textContent, '1 / 1');

  const click = action => d.querySelector('[data-action="' + action + '"]').click();
  click('overview');
  assert.ok(d.querySelector('#overview').classList.contains('is-on'));
  assert.equal(d.querySelectorAll('#overview .ov-card').length, 1);
  click('close-overview');
  click('reading');
  assert.ok(d.body.classList.contains('notes-open'));
  const note = () => d.querySelector('#notesBody .note-block.is-now').textContent;
  assert.equal(d.querySelectorAll('#notesBody .note-block').length, 1);
  const ru = note();
  assert.match(ru, /рисунк/);
  d.querySelector('#readingLanguageToggle').click();
  assert.equal(d.documentElement.lang, 'en');
  assert.equal(d.querySelector('#stepCount').textContent, 'Step 1 / 1');
  assert.match(note(), /drawing/);
  d.querySelector('#readingLanguageToggle').click();
  assert.equal(note(), ru);
  assert.deepEqual(deck.current(), initial);
  assert.equal(deck.root(), root);
});
