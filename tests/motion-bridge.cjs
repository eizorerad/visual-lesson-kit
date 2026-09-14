/* SVG screen matrices are supplied explicitly because jsdom has no SVG layout. */
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), { JSDOM } = require('jsdom');
const base = process.env.LESSON_TEST_DIR || path.join(__dirname, '..', 'starter');
const matrix = (x = 0, y = 0, scale = 1) => ({ a: scale, b: 0, c: 0, d: scale, e: x, f: y });
function fixture(t, deck = false) {
  const dom = new JSDOM(deck ? fs.readFileSync(path.join(base, 'index.html'), 'utf8') : '<body></body>', { runScripts: 'outside-only', pretendToBeVisual: true, url: 'http://localhost/lesson/' });
  t.after(() => dom.window.close()); const w = dom.window; w.matchMedia = () => ({ matches: false });
  const svgDefaults = w.document.createElement('style'); svgDefaults.textContent = 'svg g { transform-origin: 0px 0px; }'; w.document.head.append(svgDefaults);
  // Native browsers expose SVG transform attributes as computed CSS matrices.
  // jsdom does not, so model that platform behavior alongside the screen CTMs.
  const computed = w.getComputedStyle.bind(w);
  w.getComputedStyle = node => {
    const css = computed(node);
    if (node.namespaceURI !== 'http://www.w3.org/2000/svg') return css;
    return new Proxy(css, { get(target, key) {
      if (key !== 'transform' || node.style.transform || (target.transform && target.transform !== 'none')) return Reflect.get(target, key);
      const value = node.getAttribute('transform') || '', raw = /^matrix\(([^)]+)\)$/.exec(value);
      if (raw) return 'matrix(' + raw[1].trim().split(/[\s,]+/).join(', ') + ')';
      const translation = /^translate\(([-.\d]+)[ ,]+([-.\d]+)\)/.exec(value), scale = /scale\(([-.\d]+)\)/.exec(value);
      return translation ? `matrix(${scale ? +scale[1] : 1}, 0, 0, ${scale ? +scale[1] : 1}, ${translation[1]}, ${translation[2]})` : 'none';
    } });
  };
  const files = deck ? ['js/config.js', 'js/lib/dom.js', 'js/lib/i18n.js', 'js/i18n/en.js', 'js/lib/touch.js', 'js/lib/anim.js', 'js/deck.js', 'js/film.js', 'js/motion.js'] : ['js/lib/dom.js', 'js/film.js', 'js/motion.js'];
  for (const f of files) if (fs.existsSync(path.join(base, f))) w.eval(fs.readFileSync(path.join(base, f), 'utf8'));
  assert.equal(typeof w.F.shared, 'function'); assert.equal(typeof w.F.motionBridge, 'object');
  const jobs = []; w.A = Object.assign(w.A || {}, { run: paint => new Promise(resolve => jobs.push({ paint, resolve })) });
  const signature = { id: 'sample-1', kind: 'observation', label: 'Sample 1', source: 'teaching-fixture', value: 7 };
  function scene(x, patch = {}) {
    const root = w.D.dom.h('section'), svg = w.D.dom.s('svg'), parent = w.D.dom.s('g'), actor = w.D.dom.s('g', { transform: `translate(${x} 50)` });
    actor.append(w.D.dom.s('text', {}, 'Образец 1')); parent.append(actor); svg.append(parent); root.append(svg); w.document.body.append(root);
    parent.getScreenCTM = () => matrix(10, 20, .5); actor.getScreenCTM = () => matrix(10 + x * .5, 45, .5);
    w.F.shared(actor, { ...signature, ...patch }); return { root, actor, parent };
  }
  return { w, jobs, scene, signature };
}
test('adjacent bridge matches declared semantic identity, moves the new actor, and restores authored transform', async t => {
  const { w, jobs, scene } = fixture(t), before = scene(100), snapshot = w.F.motionBridge.capture(before.root); before.root.remove();
  const after = scene(700), text = after.actor.firstChild;
  const set = after.actor.setAttribute.bind(after.actor);
  after.actor.setAttribute = (name, value) => {
    if (name === 'transform' && value === 'matrix(1 0 0 1 100 50)') assert.equal(after.root.getAttribute('data-motion-bridge-active'), 'true', 'flag precedes the first bridge pose');
    return set(name, value);
  };
  assert.equal(w.F.motionBridge.play(snapshot, after.root), true); assert.equal(jobs.length, 1);
  assert.equal(after.root.getAttribute('data-motion-bridge-active'), 'true');
  assert.equal(after.actor.getAttribute('transform'), 'matrix(1 0 0 1 100 50)');
  jobs[0].paint(.5); assert.equal(after.actor.getAttribute('transform'), 'matrix(1 0 0 1 400 50)');
  jobs[0].paint(1); jobs[0].resolve(); await Promise.resolve();
  assert.equal(after.actor.getAttribute('transform'), 'translate(700 50)'); assert.equal(after.actor.firstChild, text);
  assert.equal(after.root.hasAttribute('data-motion-bridge-active'), false);
  assert.equal(after.root.querySelectorAll('text').length, 1);
});
test('different labels, sources, values, hidden actors, duplicate IDs and unusable transforms do not bridge', t => {
  const { w, jobs, scene } = fixture(t), before = scene(100), snapshot = w.F.motionBridge.capture(before.root);
  for (const patch of [{ label: 'Other sample' }, { source: 'other-study' }, { value: 8 }, { kind: 'mean' }]) {
    const after = scene(700, patch); assert.equal(w.F.motionBridge.play(snapshot, after.root), false); after.root.remove();
  }
  const after = scene(700); after.actor.style.opacity = '0'; assert.equal(w.F.motionBridge.play(snapshot, after.root), false);
  after.actor.style.opacity = '1'; after.parent.getScreenCTM = () => matrix(0, 0, 0); assert.equal(w.F.motionBridge.play(snapshot, after.root), false);
  after.parent.getScreenCTM = () => ({ ...matrix(), b: .3 }); assert.equal(w.F.motionBridge.play(snapshot, after.root), false);
  before.actor.style.opacity = '0'; assert.equal(w.F.motionBridge.capture(before.root).size, 0);
  before.actor.style.opacity = '1'; const extra = scene(50); before.root.append(extra.root); assert.equal(w.F.motionBridge.capture(before.root).size, 0);
  assert.equal(jobs.length, 0);
});
test('CSS transform overrides and independent transforms fall back without changing authored attributes', t => {
  const { w, jobs, scene } = fixture(t);
  for (const style of ['transform: translate(100px, 50px)', 'transform: none', 'translate: 10px 20px', 'scale: 2', 'rotate: 0deg', 'transform-origin: 50% 50%', 'transition-property: transform; transition-duration: 1s']) {
    const before = scene(100); before.actor.setAttribute('style', style);
    const html = before.root.innerHTML;
    assert.equal(w.F.motionBridge.capture(before.root).size, 0, style);
    assert.equal(before.root.innerHTML, html, 'eligibility preserves authored DOM'); before.root.remove();
  }
  const sheet = w.document.createElement('style'); sheet.textContent = '[data-shared-id] { transform: matrix(1, 0, 0, 1, 100, 50) }'; w.document.head.append(sheet);
  const before = scene(100), html = before.root.innerHTML;
  assert.equal(w.F.motionBridge.capture(before.root).size, 0, 'stylesheet override equal to authored pose still owns transform');
  assert.equal(before.root.innerHTML, html); assert.equal(jobs.length, 0);
});
test('cancel, input and reduced motion keep canonical transforms and stale callbacks cannot write', async t => {
  const { w, jobs, scene } = fixture(t), before = scene(100), snapshot = w.F.motionBridge.capture(before.root), after = scene(700);
  w.F.motionBridge.play(snapshot, after.root); jobs[0].paint(.4); w.F.motionBridge.cancel();
  assert.equal(after.root.hasAttribute('data-motion-bridge-active'), false);
  const html = after.root.innerHTML; jobs[0].paint(.9); jobs[0].resolve(); await Promise.resolve(); assert.equal(after.root.innerHTML, html);
  w.F.motionBridge.play(snapshot, after.root); jobs[1].paint(.3); after.actor.dispatchEvent(new w.Event('input', { bubbles: true }));
  assert.equal(after.actor.getAttribute('transform'), 'translate(700 50)');
  assert.equal(after.root.hasAttribute('data-motion-bridge-active'), false);
  w.matchMedia = () => ({ matches: true }); assert.equal(w.F.motionBridge.play(snapshot, after.root), false);
  assert.equal(jobs.length, 2);
});
test('programmatic language and appearance changes cancel an active bridge without changing shared identity', async t => {
  const { w, jobs, scene } = fixture(t), before = scene(100), snapshot = w.F.motionBridge.capture(before.root), after = scene(700);
  w.F.motionBridge.play(snapshot, after.root); jobs[0].paint(.3);
  w.document.documentElement.dataset.font = 'serif'; await Promise.resolve();
  assert.equal(after.actor.getAttribute('transform'), 'translate(700 50)');
  assert.equal(after.root.hasAttribute('data-motion-bridge-active'), false);
  after.actor.firstChild.textContent = 'Sample 1'; w.F.motionBridge.play(snapshot, after.root); jobs[1].paint(.2);
  w.document.documentElement.dataset.lang = 'en'; await Promise.resolve();
  assert.equal(after.actor.getAttribute('transform'), 'translate(700 50)'); assert.equal(after.actor.textContent, 'Sample 1');
  assert.equal(after.root.hasAttribute('data-motion-bridge-active'), false);
});
test('only timed matched bridges expose the root flag, and a superseded callback cannot clear a new root', async t => {
  const { w, jobs, scene } = fixture(t), before = scene(100), snapshot = w.F.motionBridge.capture(before.root), after = scene(700), other = scene(900);
  assert.equal(w.F.motionBridge.play(snapshot, after.root, { duration: 0 }), true);
  assert.equal(after.root.hasAttribute('data-motion-bridge-active'), false);
  w.A.isInstant = () => true; assert.equal(w.F.motionBridge.play(snapshot, after.root), true);
  assert.equal(after.root.hasAttribute('data-motion-bridge-active'), false);
  w.A.isInstant = () => false; w.matchMedia = () => ({ matches: true });
  assert.equal(w.F.motionBridge.play(snapshot, after.root), false); assert.equal(after.root.hasAttribute('data-motion-bridge-active'), false);
  w.matchMedia = () => ({ matches: false });
  const unrelated = scene(300, { source: 'different-source' });
  assert.equal(w.F.motionBridge.play(snapshot, unrelated.root), false); assert.equal(unrelated.root.hasAttribute('data-motion-bridge-active'), false);
  assert.equal(jobs.length, 0);
  w.F.motionBridge.play(snapshot, after.root); assert.equal(after.root.dataset.motionBridgeActive, 'true');
  w.F.motionBridge.play(snapshot, other.root); assert.equal(after.root.hasAttribute('data-motion-bridge-active'), false); assert.equal(other.root.dataset.motionBridgeActive, 'true');
  jobs[0].paint(1); jobs[0].resolve(); await Promise.resolve(); assert.equal(other.root.dataset.motionBridgeActive, 'true');
  w.dispatchEvent(new w.Event('resize')); assert.equal(other.root.hasAttribute('data-motion-bridge-active'), false);
  w.F.motionBridge.play(snapshot, after.root);
  w.F.motionTrack([{ id: 'sample', node: after.actor }]).set({ sample: { x: 123, y: 45 } });
  assert.equal(after.root.hasAttribute('data-motion-bridge-active'), false); assert.equal(after.actor.getAttribute('transform'), 'translate(123 45) scale(1)');
});
test('scheduler failures remove the bridge flag and restore the authored pose', async t => {
  const { w, scene } = fixture(t), before = scene(100), snapshot = w.F.motionBridge.capture(before.root), after = scene(700), failure = new Error('scheduler failure'), errors = [];
  w.A.run = () => { throw failure; };
  assert.throws(() => w.F.motionBridge.play(snapshot, after.root), error => error === failure);
  assert.equal(after.root.hasAttribute('data-motion-bridge-active'), false); assert.equal(after.actor.getAttribute('transform'), 'translate(700 50)');
  w.console.error = error => errors.push(error); w.A.run = () => Promise.reject(failure);
  w.F.motionBridge.play(snapshot, after.root); assert.equal(after.root.dataset.motionBridgeActive, 'true');
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(after.root.hasAttribute('data-motion-bridge-active'), false); assert.equal(after.actor.getAttribute('transform'), 'translate(700 50)'); assert.deepEqual(errors, [failure]);
});
test('deck navigation disposes immediately, bridges after backward replay, and direct show cancels late bridge writes', async t => {
  const { w, jobs, scene } = fixture(t, true); let disposed = 0;
  const style = w.document.createElement('style'); style.textContent = '[data-motion-bridge-active="true"] .bridge-connector { visibility: hidden; }'; w.document.head.append(style);
  for (let i = 0; i < 2; i++) w.D.deck.register({ id: 'bridge-' + i, title: 'Bridge', chapter: 'Example', notes: ['One', 'Two'], build(ctx) {
    const built = scene(i ? 700 : 100); built.root.remove(); ctx.onDispose(() => disposed++);
    const connector = w.D.dom.s('line', { class: 'bridge-connector', x1: 100, x2: 300 }); connector.style.opacity = '0'; built.parent.append(connector);
    ctx.step(() => { built.actor.setAttribute('transform', 'translate(300 50)'); built.actor.getScreenCTM = () => matrix(160, 45, .5); connector.style.opacity = '1'; return Promise.resolve(); }); return built.root;
  } });
  w.D.deck.boot(); const first = w.D.deck.root();
  w.document.body.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'ArrowRight', shiftKey: true, bubbles: true }));
  assert.equal(first.isConnected, false); assert.equal(disposed, 1); assert.equal(jobs.length, 1);
  assert.equal(w.document.querySelector('#frame').classList.contains('scene-enter'), false);
  const bridged = w.D.deck.root(); assert.equal(bridged.dataset.motionBridgeActive, 'true');
  w.D.deck.show(1, 0); const target = w.D.deck.root(), html = target.innerHTML; assert.equal(bridged.hasAttribute('data-motion-bridge-active'), false); assert.equal(target.hasAttribute('data-motion-bridge-active'), false); jobs[0].paint(.9); jobs[0].resolve(); await Promise.resolve(); assert.equal(target.innerHTML, html);
  w.D.deck.prev(); await new Promise(resolve => setImmediate(resolve));
  assert.equal(w.D.deck.current().step, 1); assert.equal(jobs.length, 2);
  const incoming = w.D.deck.root(), connector = incoming.querySelector('.bridge-connector');
  assert.equal(incoming.dataset.motionBridgeActive, 'true'); assert.equal(connector.style.opacity, '1'); assert.equal(w.getComputedStyle(connector).visibility, 'hidden', 'backward completed state hides detached connected geometry');
  jobs[1].paint(1); jobs[1].resolve(); await Promise.resolve();
  assert.equal(incoming.hasAttribute('data-motion-bridge-active'), false); assert.equal(w.getComputedStyle(connector).visibility, 'visible');
  assert.equal(w.D.deck.root().querySelector('[data-shared-id]').getAttribute('transform'), 'translate(300 50)');
});
