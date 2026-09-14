/* Scales, ticks, beeswarm layout, histograms, colour ramps and a tooltip. */
(function (global) {
  'use strict';

  var h = global.D.dom.h;

  function ticks(min, max, n) {
    var span = max - min;
    if (span <= 0) return [min];
    var step = Math.pow(10, Math.floor(Math.log10(span / n)));
    var err = span / n / step;
    if (err >= 7.5) step *= 10; else if (err >= 3.5) step *= 5; else if (err >= 1.5) step *= 2;
    var out = [];
    for (var v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) out.push(+v.toFixed(10));
    return out;
  }

  function scaleLinear(domain, range) {
    var d0 = domain[0], d1 = domain[1], r0 = range[0], r1 = range[1];
    var f = function (v) { return r0 + (v - d0) / (d1 - d0) * (r1 - r0); };
    f.invert = function (p) { return d0 + (p - r0) / (r1 - r0) * (d1 - d0); };
    f.ticks = function (n) { return ticks(d0, d1, n || 5); };
    f.domain = domain; f.range = range;
    return f;
  }

  function scaleLog(domain, range) {
    var l0 = Math.log10(domain[0]), l1 = Math.log10(domain[1]), r0 = range[0], r1 = range[1];
    var f = function (v) { return r0 + (Math.log10(v) - l0) / (l1 - l0) * (r1 - r0); };
    f.invert = function (p) { return Math.pow(10, l0 + (p - r0) / (r1 - r0) * (l1 - l0)); };
    f.ticks = function () {
      var out = [];
      for (var e = Math.ceil(l0); e <= Math.floor(l1); e += 1) out.push(Math.pow(10, e));
      return out;
    };
    f.domain = domain; f.range = range;
    return f;
  }

  /* Horizontal offsets that keep dots of radius r from overlapping. */
  function beeswarm(ys, r, maxWidth) {
    var order = ys.map(function (y, i) { return { y: y, i: i }; }).sort(function (a, b) { return a.y - b.y; });
    var placed = [];
    var out = new Array(ys.length);
    var rr = 4 * r * r;
    order.forEach(function (p) {
      var candidates = [0];
      placed.forEach(function (q) {
        var dy = q.y - p.y;
        if (Math.abs(dy) < 2 * r) {
          var dx = Math.sqrt(Math.max(0, rr - dy * dy)) + 0.01;
          candidates.push(q.x + dx, q.x - dx);
        }
      });
      candidates.sort(function (a, b) { return Math.abs(a) - Math.abs(b); });
      var x = 0;
      for (var c = 0; c < candidates.length; c += 1) {
        var cand = candidates[c];
        var ok = true;
        for (var k = placed.length - 1; k >= 0; k -= 1) {
          var q = placed[k];
          if (p.y - q.y > 2 * r) break;
          if ((q.x - cand) * (q.x - cand) + (q.y - p.y) * (q.y - p.y) < rr - 1e-6) { ok = false; break; }
        }
        if (ok) { x = cand; break; }
      }
      if (maxWidth) x = Math.max(-maxWidth, Math.min(maxWidth, x));
      placed.push({ x: x, y: p.y });
      out[p.i] = x;
    });
    return out;
  }

  function histogram(values, bins, domain) {
    var lo = domain ? domain[0] : Math.min.apply(null, values);
    var hi = domain ? domain[1] : Math.max.apply(null, values);
    var w = (hi - lo) / bins;
    var counts = new Array(bins).fill(0);
    values.forEach(function (v) {
      var k = Math.floor((v - lo) / w);
      if (k === bins && v === hi) k = bins - 1;
      if (k >= 0 && k < bins) counts[k] += 1;
    });
    return counts.map(function (n, k) { return { x0: lo + k * w, x1: lo + (k + 1) * w, n: n }; });
  }

  function hexToRgb(hex) {
    var v = parseInt(hex.slice(1), 16);
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  }

  function isColor(value) { return typeof value === 'string' && (/^#[0-9a-f]{6}$/i.test(value) || /^var\(--color-(?:bg|text|muted|dim|primary|secondary|focus|contrast|auxiliary)\)$/.test(value)); }

  function mixHex(a, b, t) {
    // Keep literal-hex interpolation numeric for existing calculations. Role
    // operands stay as a CSS expression so stored ramp fills remain reactive.
    if (!/^#[0-9a-f]{6}$/i.test(a) || !/^#[0-9a-f]{6}$/i.test(b)) {
      if (!isColor(a) || !isColor(b) || !Number.isFinite(t)) throw new TypeError('Finite mix fraction and hex colors or C roles required');
      var fraction = Math.max(0, Math.min(1, t));
      if (fraction === 0) return a; if (fraction === 1) return b;
      return 'color-mix(in srgb, ' + a + ' ' + ((1 - fraction) * 100) + '%, ' + b + ' ' + (fraction * 100) + '%)';
    }
    var ca = hexToRgb(a), cb = hexToRgb(b);
    return 'rgb(' + ca.map(function (x, i) { return Math.round(x + (cb[i] - x) * t); }).join(',') + ')';
  }

  /* Primary for negative, canvas for zero, and contrast color for positive. */
  function diverging(v, vmax) {
    var t = Math.max(-1, Math.min(1, v / (vmax || 1)));
    return t < 0 ? mixHex('var(--color-bg)', 'var(--color-primary)', -t) : mixHex('var(--color-bg)', 'var(--color-contrast)', t);
  }

  function sequential(t) {
    return mixHex('var(--color-bg)', 'var(--color-focus)', Math.max(0, Math.min(1, t)));
  }

  /* Mouse position in the scene's own 1280×720 coordinates. */
  function localPoint(root, event) {
    var rect = root.getBoundingClientRect();
    var scale = global.D && global.D.deck && global.D.deck.scale ? global.D.deck.scale() : 1;
    return { x: (event.clientX - rect.left) / scale, y: (event.clientY - rect.top) / scale };
  }

  function tooltip(root) {
    var tip = h('div.tip');
    root.appendChild(tip);
    return {
      el: tip,
      show: function (x, y, html) {
        tip.innerHTML = html;
        tip.classList.add('is-on');
        var w = tip.offsetWidth, hh = tip.offsetHeight;
        var left = x + 14, top = y - hh - 10;
        if (left + w > 1270) left = x - w - 14;
        if (top < 4) top = y + 16;
        tip.style.left = left + 'px';
        tip.style.top = top + 'px';
      },
      hide: function () { tip.classList.remove('is-on'); }
    };
  }

  /* Drag handling for an SVG element inside the scaled canvas: onMove gets
     scene coordinates. */
  function drag(node, root, onMove, onEnd) {
    var active = false;
    node.style.cursor = 'grab';
    /* A finger dragging this must not scroll the page or count as a swipe. */
    node.style.touchAction = 'none';
    node.setAttribute('data-drag', '');
    node.addEventListener('pointerdown', function (event) {
      active = true;
      node.setPointerCapture(event.pointerId);
      node.style.cursor = 'grabbing';
      event.preventDefault();
    });
    node.addEventListener('pointermove', function (event) {
      if (!active) return;
      var p = localPoint(root, event);
      onMove(p.x, p.y, event);
    });
    function end(event) {
      if (!active) return;
      active = false;
      node.style.cursor = 'grab';
      if (onEnd) onEnd();
    }
    node.addEventListener('pointerup', end);
    node.addEventListener('pointercancel', end);
  }

  global.P = {
    ticks: ticks, scaleLinear: scaleLinear, scaleLog: scaleLog, beeswarm: beeswarm, histogram: histogram,
    mixHex: mixHex, isColor: isColor, diverging: diverging, sequential: sequential, localPoint: localPoint, tooltip: tooltip, drag: drag
  };
})(window);

/* Five teaching accents and four neutrals; legacy keys remain compatible. */
window.C = {
  blue: 'var(--color-primary)', blueD: 'var(--color-primary)', blueE: 'var(--color-primary)', blueB: 'var(--color-primary)', teal: 'var(--color-secondary)', green: 'var(--color-secondary)', greenE: 'var(--color-secondary)',
  yellow: 'var(--color-focus)', yellowD: 'var(--color-focus)', gold: 'var(--color-focus)', red: 'var(--color-contrast)', redE: 'var(--color-contrast)', maroon: 'var(--color-contrast)',
  purple: 'var(--color-auxiliary)', purpleB: 'var(--color-auxiliary)', orange: 'var(--color-primary)', pink: 'var(--color-contrast)',
  grey: 'var(--color-muted)', greyB: 'var(--color-muted)', greyD: 'var(--color-dim)', greyE: 'var(--color-bg)', white: 'var(--color-text)', bg: 'var(--color-bg)'
};
