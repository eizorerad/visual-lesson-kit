/* Pointer state-machine checks. Synthetic events do not emulate native pinch. */
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), { JSDOM } = require('jsdom');
const starter = process.env.LESSON_TEST_DIR || path.join(__dirname, '..', 'starter');
function fixture(t) {
  const dom = new JSDOM('<body><main id="stage"><div id="frame"><section class="scene"><svg class="film-viz" id="canvas"><circle id="mark"/></svg><p id="caption">Read this text</p><div data-swipe-canvas id="custom"><div id="scroll" style="overflow-y:auto"><span id="scrollText">Scrollable text</span></div><input id="slider" type="range"><details><summary id="summary">Question</summary></details><div contenteditable="true" id="edit">Edit</div><div role="button" id="button">Go</div><div data-no-swipe id="optout">Custom interaction</div></div></section></div></main><aside id="notes"><p id="note">Notes</p></aside><div class="evidence-layer"><p id="evidence">Source</p></div><button id="rotateDismiss">Continue</button></body>', { runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window, counts = { next: 0, prev: 0, capture: 0, release: 0, refit: 0 }, held = new Set();
  let now = 100; w.Date.now = () => now;
  w.matchMedia = () => ({ matches: false });
  w.D = { deck: { next() { counts.next++; }, prev() { counts.prev++; }, refit() { counts.refit++; } }, i18n: { ui: () => 'Swipe hint' } };
  const viewport = new w.EventTarget(); viewport.scale = 1; Object.defineProperty(w, 'visualViewport', { value: viewport });
  const get = id => w.document.getElementById(id), canvas = get('canvas');
  canvas.setPointerCapture = id => { held.add(id); counts.capture++; };
  canvas.hasPointerCapture = id => held.has(id);
  canvas.releasePointerCapture = id => { assert.ok(held.has(id)); held.delete(id); counts.release++; send(canvas, 'lostpointercapture', id, 0, 0); };
  function send(target, type, id, x, y, pointerType = 'touch', isPrimary) {
    const event = new w.Event(type, { bubbles: true, cancelable: true });
    Object.defineProperties(event, { pointerId: { value: id }, pointerType: { value: pointerType }, isPrimary: { value: isPrimary }, clientX: { value: x }, clientY: { value: y } });
    target.dispatchEvent(event); assert.equal(event.defaultPrevented, false, 'gesture observer must preserve native default handling'); return event;
  }
  function swipe(target = get('mark'), id = 1, from = [200, 100], to = [100, 105], type = 'touch') {
    send(target, 'pointerdown', id, ...from, type); send(target, 'pointermove', id, ...to, type); send(target, 'pointerup', id, ...to, type);
  }
  w.eval(fs.readFileSync(path.join(starter, 'js/lib/touch.js'), 'utf8')); w.D.touch.start();
  t.after(() => { if (w.D.touch.stop) w.D.touch.stop(); w.close(); });
  return { w, counts, held, get, send, swipe, viewport, advance: ms => { now += ms; } };
}

test('one-finger canvas swipes navigate once, capture only a recognized swipe, and release outside the stage', t => {
  const { w, counts, held, get, send, swipe } = fixture(t);
  send(get('mark'), 'pointerdown', 1, 200, 100); assert.equal(counts.capture, 0, 'a tap does not steal capture');
  send(get('mark'), 'pointermove', 1, 100, 105); assert.equal(counts.capture, 1);
  send(get('mark'), 'lostpointercapture', 1, 100, 105);
  assert.equal(held.size, 1, 'implicit capture transfer from mark to canvas must not cancel our swipe');
  send(w.document.body, 'pointerup', 1, 100, 105);
  assert.equal(counts.next, 1); assert.equal(counts.release, 1); assert.equal(held.size, 0);
  swipe(get('mark'), 2, [100, 100], [200, 110]); assert.equal(counts.prev, 1);
  swipe(get('mark'), 3, [100, 100], [130, 101]);
  swipe(get('mark'), 4, [200, 100], [100, 100], 'mouse'); swipe(get('mark'), 5, [200, 100], [100, 100], 'pen');
  for (const id of ['stage', 'caption', 'note', 'evidence']) swipe(get(id), 8);
  assert.deepEqual([counts.next, counts.prev], [1, 1]); assert.equal(counts.refit, 1);
});

test('vertical and diagonal reading paths cannot turn into a slide swipe, and slow drags do not navigate', t => {
  const { counts, get, send, swipe, advance } = fixture(t);
  swipe(get('mark'), 1, [200, 100], [150, 169]);
  send(get('mark'), 'pointerdown', 2, 200, 100);
  send(get('mark'), 'pointermove', 2, 201, 140); send(get('mark'), 'pointermove', 2, 100, 105); send(get('mark'), 'pointerup', 2, 100, 105);
  send(get('mark'), 'pointerdown', 3, 200, 100); advance(900); send(get('mark'), 'pointerup', 3, 100, 100);
  assert.equal(counts.next, 0); assert.equal(counts.capture, 0);
});

test('two/three-finger chords stay blocked until every contact lifts, including contacts outside the canvas', t => {
  const { counts, get, send, swipe, held } = fixture(t);
  send(get('mark'), 'pointerdown', 1, 200, 100); send(get('mark'), 'pointermove', 1, 140, 100);
  send(get('note'), 'pointerdown', 2, 200, 200); assert.equal(held.size, 0, 'second contact releases only our swipe capture');
  send(get('mark'), 'pointerdown', 3, 200, 300); send(get('mark'), 'pointerup', 3, 100, 300);
  send(get('mark'), 'pointerup', 1, 100, 100);
  send(get('mark'), 'pointerdown', 4, 200, 300); send(get('mark'), 'pointerup', 4, 100, 300);
  assert.equal(counts.next, 0, 'third finger and replacement fingers cannot start a swipe');
  send(get('note'), 'pointerup', 2, 100, 200); swipe(get('mark'), 5); assert.equal(counts.next, 1);
  send(get('slider'), 'pointerdown', 6, 200, 100); send(get('mark'), 'pointerdown', 7, 200, 300);
  send(get('mark'), 'pointerup', 7, 100, 300); send(get('slider'), 'pointerup', 6, 200, 100); assert.equal(counts.next, 1);
  // A browser-owned pinch may already have cancelled its older pointer streams.
  send(get('mark'), 'pointerdown', 9, 200, 100, 'touch', false); send(get('mark'), 'pointerup', 9, 100, 100);
  assert.equal(counts.next, 1, 'a non-primary contact cannot restart navigation after native cancellation');
});

test('controls, editable content, explicit opt-outs and scroll containers retain their pointer stream', t => {
  const { counts, get, swipe } = fixture(t);
  Object.defineProperties(get('scroll'), { scrollHeight: { value: 900 }, clientHeight: { value: 100 } });
  let events = 0; get('slider').addEventListener('pointermove', () => events++);
  for (const id of ['slider', 'summary', 'edit', 'button', 'optout', 'scrollText']) swipe(get(id));
  assert.equal(events, 1); assert.equal(counts.next, 0); assert.equal(counts.capture, 0);
});

test('cancel, lost capture and lifecycle cleanup cannot leave a swipe or chord active', t => {
  const { w, counts, held, get, send, swipe } = fixture(t);
  send(get('mark'), 'pointerdown', 1, 200, 100); send(get('mark'), 'pointermove', 1, 100, 100); send(get('mark'), 'pointercancel', 1, 100, 100);
  assert.equal(held.size, 0); send(get('mark'), 'pointerup', 1, 100, 100); assert.equal(counts.next, 0);
  send(get('mark'), 'pointerdown', 2, 200, 100); send(get('mark'), 'pointermove', 2, 100, 100);
  held.delete(2); send(get('canvas'), 'lostpointercapture', 2, 100, 100);
  send(get('mark'), 'pointerdown', 3, 200, 300); send(get('mark'), 'pointerup', 3, 100, 300);
  send(get('mark'), 'pointerup', 2, 100, 100); assert.equal(counts.next, 0, 'lost capture is not a finger lift');
  swipe(get('mark'), 4); assert.equal(counts.next, 1);
  w.D.touch.start(); swipe(get('mark'), 5); assert.equal(counts.next, 2, 'start is idempotent');
  send(get('mark'), 'pointerdown', 6, 200, 100); send(get('mark'), 'pointermove', 6, 100, 100);
  w.D.touch.stop(); assert.equal(held.size, 0); send(get('mark'), 'pointerup', 6, 100, 100); swipe(get('mark'), 7); assert.equal(counts.next, 2);
  w.D.touch.start(); swipe(get('mark'), 8); assert.equal(counts.next, 3);
});

test('native zoom state disables navigation and restores it only after returning to normal scale', t => {
  const { w, counts, get, swipe, send, viewport } = fixture(t);
  send(get('mark'), 'pointerdown', 1, 200, 100); viewport.scale = 2; viewport.dispatchEvent(new w.Event('resize'));
  send(get('mark'), 'pointerup', 1, 100, 100); swipe(get('mark'), 2);
  assert.equal(counts.next, 0); assert.ok(w.document.body.classList.contains('is-zoomed'));
  viewport.scale = 1; viewport.dispatchEvent(new w.Event('resize')); swipe(get('mark'), 3);
  assert.equal(counts.next, 1); assert.ok(!w.document.body.classList.contains('is-zoomed'));
});

test('touch tooltips remain readable, and a second contact or window blur cleans up hover and gestures', t => {
  const { w, counts, get, send, held } = fixture(t), tip = w.document.createElement('div');
  tip.className = 'tip'; get('frame').append(tip);
  let hoverUpdates = 0;
  get('mark').addEventListener('mouseenter', () => { tip.classList.add('is-on'); hoverUpdates++; });
  get('mark').addEventListener('mouseleave', () => tip.classList.remove('is-on'));
  send(get('mark'), 'pointerdown', 1, 200, 100); send(get('mark'), 'pointermove', 1, 180, 101); send(get('mark'), 'pointerup', 1, 100, 100);
  assert.equal(hoverUpdates, 2, 'a tooltip can follow the finger while navigation remains blocked');
  assert.equal(counts.next, 0); assert.ok(tip.classList.contains('is-on'), 'tap tooltip stays visible for reading');
  send(get('mark'), 'pointerdown', 2, 200, 100); send(get('mark'), 'pointerdown', 3, 200, 200);
  assert.ok(!tip.classList.contains('is-on'), 'multitouch does not synthesize further hover');
  w.dispatchEvent(new w.Event('blur')); send(get('mark'), 'pointerup', 2, 100, 100); send(get('mark'), 'pointerup', 3, 100, 200);
  assert.equal(counts.next, 0); assert.equal(held.size, 0);
});
