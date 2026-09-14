/* Persistent keyed actors and explicitly declared scene continuity.
   These helpers change layout, not the scientific identity of an observation. */
(function (global) {
  'use strict';
  const F = global.F, own = (o, key) => Object.prototype.hasOwnProperty.call(o, key);
  const finite = (v, name) => { if (typeof v !== 'number' || !Number.isFinite(v)) throw new TypeError(name + ' must be finite'); return v; };
  const record = (v, name) => { if (!v || typeof v !== 'object' || Array.isArray(v)) throw new TypeError(name + ' must be an object'); return v; };
  const text = (v, name) => { if (typeof v !== 'string' || !v.trim()) throw new TypeError(name + ' must be a nonempty string'); return v; };
  const group = node => { if (!node || node.namespaceURI !== 'http://www.w3.org/2000/svg' || node.localName !== 'g') throw new TypeError('Use an existing SVG group as the actor wrapper'); return node; };
  const mix = (a, b, t) => a * (1 - t) + b * t;
  function pose(value) {
    record(value, 'pose');
    if (Object.keys(value).some(key => !['x', 'y', 'scale', 'opacity'].includes(key))) throw new TypeError('Unknown pose field');
    const out = { x: finite(value.x, 'x'), y: finite(value.y, 'y'), scale: finite(value.scale === undefined ? 1 : value.scale, 'scale'), opacity: finite(value.opacity === undefined ? 1 : value.opacity, 'opacity') };
    if (out.scale <= 0 || out.opacity < 0 || out.opacity > 1) throw new RangeError('scale must be positive and opacity in [0,1]');
    return out;
  }
  function motionTrack(entries, options = {}) {
    if (!Array.isArray(entries) || !entries.length) throw new TypeError('motionTrack needs a nonempty actor array');
    record(options, 'options'); const actors = new Map(), nodes = new Set();
    Array.from(entries).forEach(item => {
      record(item, 'actor'); const id = text(item.id, 'id'), node = group(item.node);
      if (actors.has(id) || nodes.has(node)) throw new RangeError('Each actor ID and wrapper must be unique');
      for (const other of nodes) if (other.contains(node) || node.contains(other)) throw new RangeError('Motion actors must not be nested');
      actors.set(id, node); nodes.add(node);
    });
    let current = null;
    function layout(value) {
      record(value, 'layout');
      if (Object.keys(value).length !== actors.size || [...actors.keys()].some(id => !own(value, id))) throw new RangeError('Every layout needs exactly the same actor IDs');
      return Object.fromEntries([...actors.keys()].map(id => [id, pose(value[id])]));
    }
    function paint(next) {
      // A manual track update also ends any navigation effect on these actors.
      if (bridgeActive && bridgeActive.moves.some(move => nodes.has(move.node))) cancelBridge();
      for (const [id, node] of actors) {
        const p = next[id]; node.dataset.motionId = id;
        node.setAttribute('transform', 'translate(' + p.x + ' ' + p.y + ') scale(' + p.scale + ')'); F.opacity(node, p.opacity);
      }
      current = next; return api;
    }
    const api = {
      set(value) { return paint(layout(value)); },
      between(from, to, progress, options = {}) {
        const a = layout(from), b = layout(to), t = Math.max(0, Math.min(1, finite(progress, 'progress')));
        record(options, 'between options'); const via = options.via === undefined ? {} : record(options.via, 'via');
        Object.keys(via).forEach(id => {
          if (!actors.has(id)) throw new RangeError('Unknown waypoint ID: ' + id);
          record(via[id], 'waypoint'); finite(via[id].x, 'waypoint x'); finite(via[id].y, 'waypoint y');
        });
        const next = Object.fromEntries([...actors.keys()].map(id => {
          const p = Object.fromEntries(['x', 'y', 'scale', 'opacity'].map(key => [key, mix(a[id][key], b[id][key], t)]));
          if (own(via, id) && t > 0 && t < 1) for (const key of ['x', 'y']) {
            // Quadratic arc passing through the declared waypoint at t=1/2.
            const control = finite(2 * via[id][key] - a[id][key] / 2 - b[id][key] / 2, 'path control');
            p[key] = (1 - t) * (1 - t) * a[id][key] + 2 * (1 - t) * t * control + t * t * b[id][key];
          }
          return [id, pose(p)];
        }));
        return paint(next);
      },
      snapshot() { return current && Object.fromEntries(Object.entries(current).map(([id, p]) => [id, { ...p }])); }
    };
    if (options.initial !== undefined) api.set(options.initial);
    return api;
  }

  const sharedActors = new WeakMap();
  function shared(node, definition) {
    group(node); record(definition, 'shared identity');
    const identity = {};
    for (const key of ['id', 'kind', 'label', 'source']) identity[key] = text(definition[key], 'shared.' + key);
    const value = definition.value === undefined ? null : definition.value;
    if (value !== null && typeof value !== 'string' && typeof value !== 'number') throw new TypeError('shared.value must be a string, finite number or null');
    if (typeof value === 'number') finite(value, 'shared.value'); identity.value = value;
    sharedActors.set(node, { id: identity.id, signature: JSON.stringify(identity) }); node.dataset.sharedId = identity.id;
    return node;
  }
  const KEYS = ['a', 'b', 'c', 'd', 'e', 'f'], EPS = 1e-7;
  function measured(node) {
    if (!node || typeof node.getScreenCTM !== 'function') return null;
    let matrix; try { matrix = node.getScreenCTM(); } catch (_) { return null; }
    if (!matrix || KEYS.some(key => !Number.isFinite(matrix[key]))) return null;
    // Small educational glyphs use upright translation and uniform scale.
    // A rotated, reflected, skewed or singular transform falls back to entry.
    if (matrix.a <= EPS || matrix.d <= EPS || Math.abs(matrix.b) > EPS || Math.abs(matrix.c) > EPS || Math.abs(matrix.a - matrix.d) > EPS * Math.max(1, matrix.a, matrix.d)) return null;
    return Object.fromEntries(KEYS.map(key => [key, matrix[key]]));
  }
  function visible(node, root) {
    let opacity = 1;
    for (let p = node; p; p = p.parentElement) {
      const style = global.getComputedStyle(p);
      if (p.hidden || style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse') return false;
      if (style.opacity !== '') opacity *= +style.opacity;
      if (!Number.isFinite(opacity) || opacity <= .01) return false;
      if (p === root) return true;
    }
    return false;
  }
  function ownsTransform(node) {
    const style = global.getComputedStyle(node);
    // Individual CSS transforms compose with the SVG attribute. Rewriting only
    // the attribute would apply their measured displacement or scale twice.
    if (['translate', 'rotate', 'scale'].some(key => style[key] && style[key] !== 'none')) return false;
    if (node.style.transform) return false;
    if (style.transformOrigin && style.transformOrigin.split(/\s+/).some(value => parseFloat(value) !== 0)) return false;
    // Do not start a CSS transition while checking attribute ownership.
    if (/(^|,)\s*(all|transform)\s*(,|$)/.test(style.transitionProperty || '') && (style.transitionDuration || '').split(',').some(value => parseFloat(value) > 0)) return false;
    const authored = node.getAttribute('transform');
    try {
      // SVG presentation attributes themselves appear as computed matrices.
      // Two synchronous probes distinguish them from a stylesheet override,
      // including `none` or an override equal to the actor's authored pose.
      // Restore before returning; neither probe reaches an animation frame.
      for (const value of [[1, 0, 0, 1, 0, 0], [1, 0, 0, 1, 1, 2]]) {
        node.setAttribute('transform', 'matrix(' + value.join(' ') + ')');
        const match = /^matrix\(([^)]+)\)$/.exec(global.getComputedStyle(node).transform || '');
        if (!match) return false;
        const actual = match[1].trim().split(/[\s,]+/).map(Number);
        if (actual.length !== 6 || actual.some((n, i) => !Number.isFinite(n) || Math.abs(n - value[i]) > EPS)) return false;
      }
      return true;
    } finally {
      if (authored === null) node.removeAttribute('transform'); else node.setAttribute('transform', authored);
    }
  }
  function declared(root) {
    const groups = new Map(); if (!root) return groups;
    for (const node of root.querySelectorAll('[data-shared-id]')) {
      const identity = sharedActors.get(node); if (!identity) continue;
      const list = groups.get(identity.id) || []; list.push({ node, ...identity }); groups.set(identity.id, list);
    }
    const out = new Map();
    for (const [id, list] of groups) {
      if (list.length !== 1) continue; const item = list[0], node = item.node;
      if (node.querySelector('[data-shared-id]') || node.parentElement.closest('[data-shared-id]')) continue;
      if (!visible(node, root)) continue;
      if (!ownsTransform(node)) continue;
      const matrix = measured(node); if (matrix) out.set(id, { ...item, matrix });
    }
    return out;
  }
  function capture(root) {
    return new Map([...declared(root)].map(([id, item]) => [id, { signature: item.signature, matrix: { ...item.matrix } }]));
  }
  let bridgeActive = null, bridgeVersion = 0, appearanceObserver = null;
  const events = ['pointerdown', 'keydown', 'input', 'change'];
  function restore(moves) {
    moves.forEach(move => { if (move.transform === null) move.node.removeAttribute('transform'); else move.node.setAttribute('transform', move.transform); });
  }
  function cancelBridge() {
    bridgeVersion++;
    if (!bridgeActive) return;
    const active = bridgeActive; bridgeActive = null;
    try { restore(active.moves); }
    finally {
      active.root.removeAttribute('data-motion-bridge-active');
      events.forEach(name => global.document.removeEventListener(name, cancelBridge, true));
      global.removeEventListener('resize', cancelBridge);
      if (appearanceObserver) { appearanceObserver.disconnect(); appearanceObserver = null; }
      if (global.document.fonts) global.document.fonts.removeEventListener('loadingdone', cancelBridge);
    }
  }
  function play(snapshot, root, options = {}) {
    cancelBridge();
    if (!(snapshot instanceof Map) || !root || (global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches)) return false;
    const duration = options.duration === undefined ? 850 : finite(options.duration, 'duration'); if (duration < 0) throw new RangeError('duration must be nonnegative');
    const moves = [];
    for (const [id, incoming] of declared(root)) {
      const previous = snapshot.get(id), parent = measured(incoming.node.parentElement);
      if (!previous || previous.signature !== incoming.signature || !parent) continue;
      const local = screen => ({ a: screen.a / parent.a, b: 0, c: 0, d: screen.d / parent.d, e: (screen.e - parent.e) / parent.a, f: (screen.f - parent.f) / parent.d });
      const from = local(previous.matrix), to = local(incoming.matrix);
      if ([from, to].some(m => KEYS.some(key => !Number.isFinite(m[key])))) continue;
      moves.push({ node: incoming.node, transform: incoming.node.getAttribute('transform'), from, to });
    }
    if (!moves.length) return false;
    if (duration === 0 || (global.A.isInstant && global.A.isInstant())) return true;
    const version = bridgeVersion; bridgeActive = { moves, root };
    function paint(t) {
      if (version !== bridgeVersion || !bridgeActive) return;
      if (t === 1) { cancelBridge(); return; }
      moves.forEach(move => move.node.setAttribute('transform', 'matrix(' + KEYS.map(key => mix(move.from[key], move.to[key], t)).join(' ') + ')'));
    }
    try {
      root.setAttribute('data-motion-bridge-active', 'true');
      events.forEach(name => global.document.addEventListener(name, cancelBridge, true)); global.addEventListener('resize', cancelBridge);
      appearanceObserver = new MutationObserver(cancelBridge);
      appearanceObserver.observe(global.document.documentElement, { attributes: true, attributeFilter: ['style', 'data-lang', 'data-font', 'data-background', 'data-palette'] });
      if (global.document.fonts) global.document.fonts.addEventListener('loadingdone', cancelBridge);
      paint(0);
      Promise.resolve(global.A.run(paint, { duration })).then(() => { if (version === bridgeVersion) cancelBridge(); }, error => { if (version === bridgeVersion) cancelBridge(); global.console.error(error); });
    } catch (error) { if (version === bridgeVersion) cancelBridge(); throw error; }
    return true;
  }
  F.motionTrack = motionTrack; F.shared = shared; F.motionBridge = { capture, play, cancel: cancelBridge };
})(window);
