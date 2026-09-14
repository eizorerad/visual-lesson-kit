/* Animation helpers: fade, write, draw, grow, transform,
   count, indicate, and a FLIP morph that moves the same term of a formula to
   its new place. Every helper returns a Promise, so a step can chain them.

   Two global switches matter to the deck: `setInstant(true)` makes every
   tween complete synchronously (used to rebuild a scene at a given step),
   and `finishAll()` jumps every running tween to its end (used when the
   presenter presses → in the middle of a step). */
(function (global) {
  'use strict';

  var running = [];
  var loopOn = false;
  var instant = false;
  var speed = 1;

  var ease = {
    linear: function (t) { return t; },
    smooth: function (t) {
      // Evaluate the upper half by symmetry to avoid cancellation past 1.
      // Keep the original polynomial outside the animation interval.
      if (t > 0.5 && t <= 1) {
        var u = 1 - t;
        return 1 - u * u * u * (u * (u * 6 - 15) + 10);
      }
      return t * t * t * (t * (t * 6 - 15) + 10);
    },
    out: function (t) { return 1 - (1 - t) * (1 - t) * (1 - t); },
    in: function (t) { return t * t * t; },
    thereAndBack: function (t) { return ease.smooth(1 - Math.abs(2 * t - 1)); }
  };

  function toList(el) {
    if (!el) return [];
    if (Array.isArray(el)) return el.reduce(function (acc, one) { return acc.concat(toList(one)); }, []);
    if (typeof el.length === 'number' && !(el instanceof Node)) return Array.prototype.slice.call(el);
    return [el];
  }

  function finish(tw) {
    if (tw.done) return;
    tw.done = true;
    try { tw.update(1); } catch (error) { console.error(error); }
    if (tw.after) { try { tw.after(); } catch (error) { console.error(error); } }
    tw.resolve();
  }

  function frame(now) {
    running.slice().forEach(function (tw) {
      if (tw.done) return;
      if (tw.start === null) tw.start = now + tw.delay;
      var raw = (now - tw.start) / tw.duration;
      if (raw < 0) return;
      if (raw >= 1) { finish(tw); return; }
      /* A tween that throws must not take the whole loop down with it. */
      try { tw.update(tw.ease(raw)); } catch (error) { console.error(error); finish(tw); }
    });
    running = running.filter(function (tw) { return !tw.done; });
    if (running.length) schedule(); else loopOn = false;
  }

  function tween(opts) {
    var o = Object.assign({ duration: 800, delay: 0, ease: ease.smooth, update: function () {}, after: null }, opts || {});
    var easing = typeof o.ease === 'string' ? ease[o.ease] : o.ease;
    return new Promise(function (resolve) {
      var tw = {
        start: null, delay: o.delay / speed, duration: Math.max(1, o.duration / speed),
        ease: easing, update: o.update, after: o.after, resolve: resolve, done: false
      };
      if (instant || global.matchMedia('(prefers-reduced-motion: reduce)').matches || o.duration <= 0) { finish(tw); return; }
      running.push(tw);
      if (!loopOn) { loopOn = true; schedule(); }
    });
  }

  /* requestAnimationFrame stops in an occluded window; a timer keeps the
     tweens moving (at a lower rate) so a step can never stall forever. */
  var rafId = null, timerId = null;
  function schedule() {
    rafId = global.requestAnimationFrame(function (ts) { global.clearTimeout(timerId); frame(ts); });
    timerId = global.setTimeout(function () { global.cancelAnimationFrame(rafId); frame(global.performance.now()); }, 80);
  }

  function finishAll() {
    var list = running.slice();
    running = [];
    list.forEach(finish);
  }

  function setInstant(on) { instant = !!on; }
  function isInstant() { return instant; }
  function setSpeed(value) { speed = value; }
  function wait(ms) { return tween({ duration: ms, ease: 'linear' }); }
  function par(list) { return Promise.all(list); }
  function seq(fns) {
    return fns.reduce(function (p, fn) { return p.then(function () { return fn(); }); }, Promise.resolve());
  }
  function run(update, opts) { return tween(Object.assign({}, opts || {}, { update: update })); }

  function frameScale() {
    return global.D && global.D.deck && global.D.deck.scale ? global.D.deck.scale() : 1;
  }

  /* ---------- opacity and position ---------- */

  function hide(el) {
    toList(el).forEach(function (node) { node.style.opacity = '0'; node.style.pointerEvents = 'none'; });
    return el;
  }

  function show(el) {
    toList(el).forEach(function (node) { node.style.opacity = '1'; node.style.pointerEvents = ''; node.style.visibility = ''; });
    return el;
  }

  /* `shift` is where the element starts, relative to its resting place. */
  function fadeIn(el, opts) {
    var o = Object.assign({ shift: [0, 0], duration: 700, delay: 0, to: 1, ease: 'smooth', stagger: 0 }, opts || {});
    var list = toList(el);
    list.forEach(function (node) { node.style.opacity = '0'; node.style.pointerEvents = ''; node.style.visibility = ''; });
    var moving = o.shift[0] !== 0 || o.shift[1] !== 0;
    if (o.stagger && list.length > 1) {
      return par(list.map(function (node, i) {
        return fadeIn(node, Object.assign({}, o, { stagger: 0, delay: o.delay + i * o.stagger }));
      }));
    }
    return tween({
      duration: o.duration, delay: o.delay, ease: o.ease,
      update: function (t) {
        list.forEach(function (node) {
          node.style.opacity = String(o.to * t);
          if (moving) node.style.translate = ((1 - t) * o.shift[0]).toFixed(2) + 'px ' + ((1 - t) * o.shift[1]).toFixed(2) + 'px';
        });
      },
      after: function () { if (moving) list.forEach(function (node) { node.style.translate = ''; }); }
    });
  }

  function fadeOut(el, opts) {
    var o = Object.assign({ shift: [0, 0], duration: 500, delay: 0, remove: false, ease: 'smooth' }, opts || {});
    var list = toList(el);
    var starts = list.map(function (node) { return parseFloat(node.style.opacity === '' ? 1 : node.style.opacity); });
    var moving = o.shift[0] !== 0 || o.shift[1] !== 0;
    return tween({
      duration: o.duration, delay: o.delay, ease: o.ease,
      update: function (t) {
        list.forEach(function (node, i) {
          node.style.opacity = String(starts[i] * (1 - t));
          if (moving) node.style.translate = (t * o.shift[0]).toFixed(2) + 'px ' + (t * o.shift[1]).toFixed(2) + 'px';
        });
      },
      after: function () {
        list.forEach(function (node) {
          node.style.pointerEvents = 'none';
          if (moving) node.style.translate = '';
          if (o.remove && node.parentNode) node.parentNode.removeChild(node);
        });
      }
    });
  }

  function prepOrigin(node) {
    if (node instanceof SVGElement) {
      node.style.transformBox = 'fill-box';
      node.style.transformOrigin = 'center';
    }
  }

  function grow(el, opts) {
    var o = Object.assign({ duration: 700, delay: 0, from: 0, ease: 'out' }, opts || {});
    var list = toList(el);
    list.forEach(function (node) { prepOrigin(node); node.style.opacity = '1'; node.style.pointerEvents = ''; node.style.scale = String(o.from); });
    return tween({
      duration: o.duration, delay: o.delay, ease: o.ease,
      update: function (t) { list.forEach(function (node) { node.style.scale = String(o.from + (1 - o.from) * t); }); },
      after: function () { list.forEach(function (node) { node.style.scale = ''; }); }
    });
  }

  function shrink(el, opts) {
    var o = Object.assign({ duration: 500, delay: 0, remove: false }, opts || {});
    var list = toList(el);
    list.forEach(prepOrigin);
    return tween({
      duration: o.duration, delay: o.delay, ease: 'in',
      update: function (t) { list.forEach(function (node) { node.style.scale = String(1 - t); node.style.opacity = String(1 - t); }); },
      after: function () {
        list.forEach(function (node) {
          node.style.pointerEvents = 'none';
          if (o.remove && node.parentNode) node.parentNode.removeChild(node);
        });
      }
    });
  }

  /* Reveal text from left to right. */
  function write(el, opts) {
    var o = Object.assign({ duration: 900, delay: 0, stagger: 0 }, opts || {});
    var list = toList(el);
    if (o.stagger && list.length > 1) {
      return par(list.map(function (node, i) {
        return write(node, Object.assign({}, o, { stagger: 0, delay: o.delay + i * o.stagger }));
      }));
    }
    list.forEach(function (node) { node.style.opacity = '1'; node.style.pointerEvents = ''; node.style.clipPath = 'inset(-10% 100% -10% 0)'; });
    return tween({
      duration: o.duration, delay: o.delay, ease: 'linear',
      update: function (t) { list.forEach(function (node) { node.style.clipPath = 'inset(-10% ' + ((1 - t) * 100).toFixed(2) + '% -10% 0)'; }); },
      after: function () { list.forEach(function (node) { node.style.clipPath = ''; }); }
    });
  }

  function unwrite(el, opts) {
    var o = Object.assign({ duration: 500, delay: 0 }, opts || {});
    var list = toList(el);
    return tween({
      duration: o.duration, delay: o.delay, ease: 'linear',
      update: function (t) { list.forEach(function (node) { node.style.clipPath = 'inset(-10% 0 -10% ' + (t * 100).toFixed(2) + '%)'; }); },
      after: function () { list.forEach(function (node) { node.style.clipPath = ''; node.style.opacity = '0'; node.style.pointerEvents = 'none'; }); }
    });
  }

  /* Draw an SVG shape along its length. */
  function draw(el, opts) {
    var o = Object.assign({ duration: 900, delay: 0, fill: null, ease: 'smooth', stagger: 0 }, opts || {});
    var list = toList(el);
    if (o.stagger && list.length > 1) {
      return par(list.map(function (node, i) {
        return draw(node, Object.assign({}, o, { stagger: 0, delay: o.delay + i * o.stagger }));
      }));
    }
    var lengths = list.map(function (node) {
      try { return node.getTotalLength ? node.getTotalLength() : 0; } catch (error) { return 0; }
    });
    list.forEach(function (node, i) {
      node.style.opacity = '1';
      node.style.pointerEvents = '';
      if (lengths[i]) {
        node.style.strokeDasharray = lengths[i] + ' ' + lengths[i];
        node.style.strokeDashoffset = String(lengths[i]);
      }
      if (o.fill !== null) node.style.fillOpacity = '0';
    });
    return tween({
      duration: o.duration, delay: o.delay, ease: o.ease,
      update: function (t) {
        list.forEach(function (node, i) {
          if (lengths[i]) node.style.strokeDashoffset = String(lengths[i] * (1 - t));
          if (o.fill !== null && t > 0.5) node.style.fillOpacity = String(o.fill * (t - 0.5) / 0.5);
        });
      },
      after: function () {
        list.forEach(function (node) {
          node.style.strokeDasharray = '';
          node.style.strokeDashoffset = '';
          if (o.fill !== null) node.style.fillOpacity = String(o.fill);
        });
      }
    });
  }

  /* Interpolate numeric attributes: attr(node, { cx: 40, cy: [0, 80] }). */
  function attr(el, spec, opts) {
    var o = Object.assign({ duration: 800, delay: 0, ease: 'smooth' }, opts || {});
    var list = toList(el);
    var plans = list.map(function (node) {
      return Object.keys(spec).map(function (name) {
        var value = spec[name];
        var from = Array.isArray(value) ? value[0] : (parseFloat(node.getAttribute(name)) || 0);
        var to = Array.isArray(value) ? value[1] : value;
        return { name: name, from: from, to: to };
      });
    });
    return tween({
      duration: o.duration, delay: o.delay, ease: o.ease,
      update: function (t) {
        list.forEach(function (node, i) {
          plans[i].forEach(function (p) { node.setAttribute(p.name, String(p.from + (p.to - p.from) * t)); });
        });
      }
    });
  }

  /* Interpolate numeric style properties given with units: style(node, { left: [10, 40, 'px'] }). */
  function style(el, spec, opts) {
    var o = Object.assign({ duration: 800, delay: 0, ease: 'smooth' }, opts || {});
    var list = toList(el);
    var plans = Object.keys(spec).map(function (name) {
      var v = spec[name];
      return { name: name, from: v[0], to: v[1], unit: v[2] || '' };
    });
    return tween({
      duration: o.duration, delay: o.delay, ease: o.ease,
      update: function (t) {
        list.forEach(function (node) {
          plans.forEach(function (p) { node.style[p.name] = (p.from + (p.to - p.from) * t) + p.unit; });
        });
      }
    });
  }

  function count(el, from, to, opts) {
    var o = Object.assign({ duration: 900, delay: 0, digits: 2, format: null, ease: 'smooth' }, opts || {});
    var node = toList(el)[0];
    var format = o.format || function (v) { return global.N ? global.N.fmt(v, o.digits) : v.toFixed(o.digits); };
    return tween({
      duration: o.duration, delay: o.delay, ease: o.ease,
      update: function (t) { node.textContent = format(from + (to - from) * t); }
    });
  }

  /* A quick pulse: scale up and back, lit for the duration. */
  function indicate(el, opts) {
    var o = Object.assign({ duration: 800, delay: 0, scale: 1.15 }, opts || {});
    var list = toList(el);
    list.forEach(function (node) { prepOrigin(node); node.classList.add('is-lit'); });
    return tween({
      duration: o.duration, delay: o.delay, ease: 'thereAndBack',
      update: function (t) { list.forEach(function (node) { node.style.scale = String(1 + (o.scale - 1) * t); }); },
      after: function () { list.forEach(function (node) { node.style.scale = ''; node.classList.remove('is-lit'); }); }
    });
  }

  /* Draw a yellow box around an HTML element inside the scene, then fade it. */
  function circumscribe(root, el, opts) {
    var o = Object.assign({ duration: 900, hold: 700, color: 'var(--color-focus)', pad: 6 }, opts || {});
    var node = toList(el)[0];
    var scale = frameScale();
    var rootRect = root.getBoundingClientRect();
    var rect = node.getBoundingClientRect();
    var box = document.createElement('div');
    box.className = 'circ';
    box.style.left = ((rect.left - rootRect.left) / scale - o.pad) + 'px';
    box.style.top = ((rect.top - rootRect.top) / scale - o.pad) + 'px';
    box.style.width = (rect.width / scale + 2 * o.pad) + 'px';
    box.style.height = (rect.height / scale + 2 * o.pad) + 'px';
    box.style.borderColor = o.color;
    root.appendChild(box);
    return fadeIn(box, { duration: o.duration * 0.4 }).then(function () {
      return wait(o.hold);
    }).then(function () {
      return fadeOut(box, { duration: o.duration * 0.4, remove: true });
    });
  }

  /* FLIP: measure every [data-key] descendant, let `mutate` rebuild the
     container, measure again, and slide each surviving key from its old
     place to its new one. Keys that are new fade in. */
  function flip(container, mutate, opts) {
    var o = Object.assign({ duration: 900, delay: 0 }, opts || {});
    var scale = frameScale();
    var before = {};
    Array.prototype.forEach.call(container.querySelectorAll('[data-key]'), function (node) {
      before[node.dataset.key] = node.getBoundingClientRect();
    });
    mutate();
    var moves = [];
    var fresh = [];
    Array.prototype.forEach.call(container.querySelectorAll('[data-key]'), function (node) {
      var first = before[node.dataset.key];
      if (!first) { fresh.push(node); return; }
      var last = node.getBoundingClientRect();
      moves.push({ node: node, dx: (first.left - last.left) / scale, dy: (first.top - last.top) / scale });
    });
    fresh.forEach(function (node) { node.style.opacity = '0'; });
    moves.forEach(function (m) { m.node.style.translate = m.dx.toFixed(2) + 'px ' + m.dy.toFixed(2) + 'px'; });
    return par([
      tween({
        duration: o.duration, delay: o.delay, ease: 'smooth',
        update: function (t) {
          moves.forEach(function (m) {
            m.node.style.translate = (m.dx * (1 - t)).toFixed(2) + 'px ' + (m.dy * (1 - t)).toFixed(2) + 'px';
          });
        },
        after: function () { moves.forEach(function (m) { m.node.style.translate = ''; }); }
      }),
      fadeIn(fresh, { duration: o.duration * 0.5, delay: o.delay + o.duration * 0.5 })
    ]);
  }

  function debug() { return { running: running.length, loopOn: loopOn, instant: instant, pending: running.map(function (tw) { return { start: tw.start, duration: tw.duration, delay: tw.delay, done: tw.done }; }) }; }

  global.A = {
    debug: debug, ease: ease, tween: tween, run: run, finishAll: finishAll, setInstant: setInstant, isInstant: isInstant, setSpeed: setSpeed,
    wait: wait, par: par, seq: seq, toList: toList,
    hide: hide, show: show, fadeIn: fadeIn, fadeOut: fadeOut, grow: grow, shrink: shrink,
    write: write, unwrite: unwrite, draw: draw, attr: attr, style: style, count: count,
    indicate: indicate, circumscribe: circumscribe, flip: flip
  };
})(window);
