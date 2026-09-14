/* Real deck behavior in jsdom; no claim about browser layout. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const starter = process.env.LESSON_TEST_DIR || path.join(__dirname, '..', 'starter');
const settle = () => new Promise(resolve => setImmediate(resolve));

function fixture(t) {
  const dom = new JSDOM('<body><div id="frame"></div><nav id="chrome"><button data-action="notes">Notes</button><button data-action="questions">Questions</button><button data-action="guide">Guide</button></nav><aside id="notes"><div id="notesHead"></div><div id="notesBody" tabindex="0"></div></aside></body>', {
    runScripts: 'outside-only', pretendToBeVisual: true, url: 'http://localhost/lesson/'
  });
  t.after(() => dom.window.close());
  const w = dom.window;
  w.matchMedia = () => ({ matches: true });
  for (const file of ['js/lib/dom.js', 'js/lib/i18n.js', 'js/lib/touch.js', 'js/lib/anim.js', 'js/deck.js']) w.eval(fs.readFileSync(path.join(starter, file), 'utf8'));
  function scene(id, title, qa) {
    return { id, title, chapter: 'Учебный пример', qa, notes: ['<p>Начало ' + id + '</p>', '<p>После шага ' + id + '</p>'], build(ctx) {
      ctx.step(() => Promise.resolve()); return w.D.dom.h('section', title);
    } };
  }
  w.D.deck.register(scene('mean', 'Среднее', [
    { q: 'Что показывает среднее?', a: '<p>Центр наблюдений.</p>' },
    { q: 'Есть источник?', a: '<p>Для примера.</p>', source: 'Автор <em>2026</em>', url: 'https://example.org/method#mean' },
    { q: 'Недопустимые ссылки?', a: 'Не становятся ссылками.', source: 'Локальная заметка', url: 'javascript:alert(1)' },
    { q: 'Неполный адрес?', a: 'Не становится внешним источником.', url: '//example.org/paper' }
  ]));
  w.D.deck.register(scene('spread', 'Разброс', [{ q: 'Как сравнить значения?', a: '<p>Размах измерений — максимум минус минимум.</p>', source: 'Учебное определение' }]));
  w.D.deck.register(scene('empty', 'Без вопросов', []));
  w.D.deck.boot();
  const doc = w.document;
  return { w, doc, click: name => doc.querySelector('[data-action="' + name + '"]').click(), key(key, target = doc.body, repeat = false) {
    const event = new w.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, repeat }); target.dispatchEvent(event); return event;
  } };
}

test('current questions follow the scene; notes retain step navigation and panel state', async t => {
  const { w, doc, click, key } = fixture(t);
  click('questions');
  assert.equal(doc.querySelectorAll('.qa-item').length, 4, 'questions button opens current scene questions');
  assert.equal(doc.querySelector('[data-action="questions"]').getAttribute('aria-pressed'), 'true');
  assert.match(doc.querySelector('#notesHead').textContent, /Вопросы/);
  const first = doc.querySelector('.qa-item'); first.open = false;
  w.D.deck.next(); await settle();
  assert.equal(doc.querySelector('.qa-item'), first, 'step changes preserve the reading position and disclosure nodes');
  assert.equal(first.open, false);
  w.D.deck.show(1, 0);
  assert.equal(doc.querySelectorAll('.qa-item').length, 1);
  assert.equal(doc.querySelector('.qa-scene-title').textContent, 'Разброс');
  assert.match(doc.querySelector('#notesHead').textContent, /2/);
  click('notes');
  assert.equal(doc.querySelectorAll('.note-block').length, 2);
  assert.equal(doc.querySelector('[data-action="questions"]').getAttribute('aria-pressed'), 'false');
  assert.equal(doc.querySelector('[data-action="notes"]').getAttribute('aria-pressed'), 'true');
  key('ArrowRight'); await settle();
  assert.equal(w.D.deck.current().step, 1);
  assert.match(doc.querySelector('.note-block.is-now').textContent, /После шага spread/);
  key('ArrowLeft'); await settle();
  assert.equal(w.D.deck.current().step, 0);
  assert.match(doc.querySelector('.note-block.is-now').textContent, /Начало spread/);
  key('Escape'); assert.equal(doc.body.classList.contains('notes-open'), false);
  key('Й', w); assert.equal(doc.querySelector('[data-action="questions"]').getAttribute('aria-pressed'), 'true');
  key('q'); assert.equal(doc.body.classList.contains('notes-open'), false);
  w.D.deck.show(2, 0); click('questions');
  assert.equal(doc.querySelectorAll('.qa-item').length, 0);
  assert.match(doc.querySelector('#notesBody').textContent, /нет вопросов/i);
});

test('guide searches question, answer, source and scene text, and jumps to the matching scene', async t => {
  const { w, doc, key } = fixture(t);
  key('П');
  const input = doc.querySelector('input[type="search"]');
  assert.ok(input, 'guide shortcut opens searchable guide');
  assert.equal(doc.querySelectorAll('.qa-item').length, 5);
  const search = value => { input.value = value; input.dispatchEvent(new w.Event('input', { bubbles: true })); };
  search('МАКСИМУМ');
  assert.equal(doc.querySelectorAll('.qa-item').length, 1, 'searches answer case-insensitively');
  assert.equal(doc.querySelector('input[type="search"]'), input, 'typing preserves the input element');
  search('Автор'); assert.equal(doc.querySelectorAll('.qa-item').length, 1, 'searches citation');
  search('Разброс'); assert.equal(doc.querySelectorAll('.qa-item').length, 1, 'searches scene title');
  search('unmatched'); assert.equal(doc.querySelectorAll('.qa-item').length, 0);
  assert.match(doc.querySelector('.qa-result-count').textContent, /0/);
  search('максимум');
  doc.querySelector('.qa-scene-jump').click(); await settle();
  assert.equal(w.D.deck.current().index, 1);
  assert.equal(w.D.deck.current().step, 0);
  assert.equal(doc.querySelector('[data-action="questions"]').getAttribute('aria-pressed'), 'true');
  assert.equal(doc.querySelector('.qa-scene-title').textContent, 'Разброс');
});

test('panel typing, details and repeated scroll keys stay native; Escape closes from search', t => {
  const { w, doc, click, key } = fixture(t);
  click('questions');
  const summary = doc.querySelector('.qa-item summary');
  assert.ok(summary, 'answers use keyboard-accessible details');
  for (const pressed of [' ', 'Enter', 'ArrowRight', 'ArrowDown', 'PageDown', 'Home', 'End']) {
    assert.equal(key(pressed, summary).defaultPrevented, false);
    assert.equal(w.D.deck.current().step, 0);
  }
  assert.equal(key('ArrowDown', doc.querySelector('#notesBody'), true).defaultPrevented, false, 'held scroll key remains native');
  click('guide');
  const input = doc.querySelector('input[type="search"]');
  for (const pressed of ['q', 'n', 'g', 'й', 'п', '2', 'Enter', 'ArrowRight']) {
    assert.equal(key(pressed, input).defaultPrevented, false);
    assert.equal(w.D.deck.current().index, 0);
    assert.equal(w.D.deck.current().step, 0);
  }
  key('Escape', input);
  assert.equal(doc.body.classList.contains('notes-open'), false);
});

test('sources are optional plain labels with explicit absolute HTTP(S) links only', t => {
  const { doc, click } = fixture(t);
  click('questions');
  const items = doc.querySelectorAll('.qa-item');
  assert.equal(items.length, 4);
  assert.equal(items[0].querySelector('.qa-source'), null, 'fictional question gains no source');
  const links = doc.querySelectorAll('.qa-source a');
  assert.equal(links.length, 1, 'rejects script and protocol-relative URLs');
  assert.equal(links[0].href, 'https://example.org/method#mean');
  assert.equal(links[0].textContent, 'Автор <em>2026</em>');
  assert.equal(links[0].querySelector('em'), null, 'citation labels are text');
  assert.equal(links[0].rel, 'noopener noreferrer');
  assert.equal(items[2].querySelector('.qa-source').textContent, 'Локальная заметка');
  assert.equal(doc.querySelector('a[href*="study-guide"]'), null, 'no source-deck path leaks');
});

test('canvas fit is independent of toolbar measurements at every responsive size', async t => {
  const { w, doc } = fixture(t);
  doc.querySelector('#chrome').getBoundingClientRect = () => { throw Error('content measurement would reintroduce layout jumps'); };
  for (const [width, height] of [[320, 700], [390, 844], [844, 390], [852, 994], [940, 994], [1280, 800], [1920, 1080]]) {
    Object.defineProperty(w, 'innerWidth', { configurable: true, value: width });
    Object.defineProperty(w, 'innerHeight', { configurable: true, value: height });
    w.D.deck.refit();
    const transform = doc.querySelector('#frame').style.transform;
    assert.equal(parseFloat(doc.body.style.getPropertyValue('--toolbar-bottom-space')), 72);
    for (const index of [1, 2, 0]) {
      w.D.deck.show(index, 0); w.D.deck.refit();
      assert.equal(doc.querySelector('#frame').style.transform, transform, 'scene length cannot move the frame');
    }
    w.D.deck.next(); await settle(); w.D.deck.refit();
    assert.equal(doc.querySelector('#frame').style.transform, transform, 'step progress cannot move the frame');
    assert.equal(doc.body.classList.contains('bar-side'), false, 'one bar orientation at every viewport');
  }
});

test('reading uses a full overlay below 1080px and a readable fixed desktop column', t => {
  const { w, doc, click } = fixture(t);
  for (const [width, height] of [[390, 844], [844, 390], [852, 994], [940, 994], [1080, 800], [1280, 800]]) {
    Object.defineProperty(w, 'innerWidth', { configurable: true, value: width });
    Object.defineProperty(w, 'innerHeight', { configurable: true, value: height });
    w.D.deck.refit(); const closed = doc.querySelector('#frame').style.transform;
    click('notes');
    const overlay = width < 1080 || height < 520;
    assert.equal(doc.body.classList.contains('is-narrow'), overlay);
    assert.equal(parseFloat(doc.body.style.getPropertyValue('--toolbar-available-width')), width - (overlay ? 0 : 430));
    assert.equal(parseFloat(doc.body.style.getPropertyValue('--notes-shift')), overlay ? 0 : 215);
    assert.equal(doc.querySelector('#notes').style.width, overlay ? '' : '430px');
    if (overlay) assert.equal(doc.querySelector('#frame').style.transform, closed, 'overlay preserves canvas geometry');
    click('notes'); assert.equal(doc.querySelector('#frame').style.transform, closed);
  }
});

test('notes retain their nodes and source disclosure while the current step changes', async t => {
  const { w, doc, click } = fixture(t);
  w.D.deck.root().appendChild(w.D.dom.h('span.film-source', 'Source provenance'));
  click('questions'); click('notes'); const block = doc.querySelector('.note-block');
  const source = doc.querySelector('.note-provenance'); source.open = true;
  w.D.deck.next(); await settle();
  assert.equal(doc.querySelector('.note-provenance'), source);
  assert.equal(source.open, true, 'source disclosure stays open during navigation');
  assert.equal(doc.querySelector('.note-block'), block, 'step highlighting updates classes without rebuilding prose');
  assert.equal(doc.querySelectorAll('.note-block.is-now').length, 1);
});
