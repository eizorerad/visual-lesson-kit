/* SVG furniture: lines, dots, labels, arrows with a real head, and axes
   that return their scales so a scene can place marks with x(v), y(v). */
(function (global) {
  'use strict';

  var s = global.D.dom.s;
  var uid = 0;

  function line(x1, y1, x2, y2, o) {
    o = o || {};
    return s('line', {
      x1: x1, y1: y1, x2: x2, y2: y2, stroke: o.stroke || 'var(--color-text)', 'stroke-width': o.width || 2,
      'stroke-dasharray': o.dash || null, 'stroke-linecap': 'round', opacity: o.opacity, class: o.cls || null
    });
  }

  function circle(cx, cy, r, o) {
    o = o || {};
    return s('circle', {
      cx: cx, cy: cy, r: r, fill: o.fill || 'var(--color-text)', stroke: o.stroke || null, 'stroke-width': o.width || null,
      opacity: o.opacity, class: o.cls || null
    });
  }

  function rect(x, y, w, h, o) {
    o = o || {};
    return s('rect', {
      x: x, y: y, width: w, height: h, rx: o.rx || null, fill: o.fill || 'none', stroke: o.stroke || null,
      'stroke-width': o.width || null, 'stroke-dasharray': o.dash || null, opacity: o.opacity, class: o.cls || null
    });
  }

  function path(d, o) {
    o = o || {};
    return s('path', {
      d: d, fill: o.fill || 'none', stroke: o.stroke || 'var(--color-text)', 'stroke-width': o.width || 2,
      'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'stroke-dasharray': o.dash || null,
      opacity: o.opacity, class: o.cls || null
    });
  }

  function text(x, y, str, o) {
    o = o || {};
    var node = s('text', {
      x: x, y: y, 'text-anchor': o.anchor || 'middle', 'dominant-baseline': o.baseline || 'middle',
      fill: o.color || 'var(--color-text)', 'font-size': o.size || 16, 'font-style': o.italic ? 'italic' : null,
      'font-weight': o.weight || null, class: o.cls || null, opacity: o.opacity,
      transform: o.rotate ? 'rotate(' + o.rotate + ' ' + x + ' ' + y + ')' : null
    });
    if (o.html) node.innerHTML = o.html; else node.textContent = str;
    return node;
  }

  function polyline(points, o) {
    return path(points.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(2) + ',' + p[1].toFixed(2); }).join(' '), o);
  }

  function arrowGeometry(x1, y1, x2, y2, head) {
    var ang = Math.atan2(y2 - y1, x2 - x1);
    var len = Math.hypot(x2 - x1, y2 - y1);
    var h = Math.min(head, len * 0.6);
    var bx = x2 - h * Math.cos(ang), by = y2 - h * Math.sin(ang);
    var p2 = [x2 - h * Math.cos(ang - 0.42), y2 - h * Math.sin(ang - 0.42)];
    var p3 = [x2 - h * Math.cos(ang + 0.42), y2 - h * Math.sin(ang + 0.42)];
    return { shaft: [x1, y1, bx, by], head: [[x2, y2], p2, p3] };
  }

  /* A group holding a shaft and a head; setArrow moves it in place. */
  function arrow(x1, y1, x2, y2, o) {
    o = o || {};
    var geo = arrowGeometry(x1, y1, x2, y2, o.head || 11);
    var color = o.color || 'var(--color-text)';
    var g = s('g.arrow', { class: 'arrow' + (o.cls ? ' ' + o.cls : ''), opacity: o.opacity });
    g.appendChild(line(geo.shaft[0], geo.shaft[1], geo.shaft[2], geo.shaft[3], { stroke: color, width: o.width || 2.5, dash: o.dash }));
    g.appendChild(s('polygon', { points: geo.head.map(function (p) { return p.join(','); }).join(' '), fill: color }));
    g.dataset.head = String(o.head || 11);
    return g;
  }

  function setArrow(g, x1, y1, x2, y2) {
    var geo = arrowGeometry(x1, y1, x2, y2, parseFloat(g.dataset.head) || 11);
    var shaft = g.children[0], head = g.children[1];
    shaft.setAttribute('x1', geo.shaft[0]); shaft.setAttribute('y1', geo.shaft[1]);
    shaft.setAttribute('x2', geo.shaft[2]); shaft.setAttribute('y2', geo.shaft[3]);
    head.setAttribute('points', geo.head.map(function (p) { return p.join(','); }).join(' '));
    return g;
  }

  function growArrow(g, opts) {
    var o = Object.assign({ duration: 700, delay: 0 }, opts || {});
    g.style.opacity = '1';
    g.children[1].style.opacity = '0';
    return global.A.draw(g.children[0], { duration: o.duration * 0.75, delay: o.delay }).then(function () {
      return global.A.fadeIn(g.children[1], { duration: o.duration * 0.25 });
    });
  }

  function tickFormat(v) {
    if (Math.abs(v) >= 1000) return global.N.fmtInt(v);
    var abs = Math.abs(v);
    var digits = abs === 0 || abs >= 10 ? 0 : (abs >= 1 ? 1 : 2);
    var str = abs.toFixed(digits).replace(/\.0+$/, '');
    return (v < 0 ? '−' : '') + str;
  }

  /* axes({ left, top, width, height, x: [lo, hi], y: [lo, hi], ... }) */
  function axes(o) {
    var P = global.P;
    var g = s('g.axes', { transform: 'translate(' + o.left + ',' + o.top + ')' });
    var sx = o.xLog ? P.scaleLog(o.x, [0, o.width]) : P.scaleLinear(o.x, [0, o.width]);
    var sy = o.yLog ? P.scaleLog(o.y, [o.height, 0]) : P.scaleLinear(o.y, [o.height, 0]);
    var col = o.color || 'var(--color-muted)';
    var xt = Array.isArray(o.xTicks) ? o.xTicks : (o.xTicks === 0 ? [] : sx.ticks(o.xTicks || 5));
    var yt = Array.isArray(o.yTicks) ? o.yTicks : (o.yTicks === 0 ? [] : sy.ticks(o.yTicks || 5));
    var xFmt = o.xFmt || tickFormat, yFmt = o.yFmt || tickFormat;
    var frame = s('g.axes-frame');
    g.appendChild(frame);
    if (o.grid) {
      xt.forEach(function (v) { frame.appendChild(line(sx(v), 0, sx(v), o.height, { stroke: 'color-mix(in srgb, var(--color-text) 7.0%, transparent)', width: 1 })); });
      yt.forEach(function (v) { frame.appendChild(line(0, sy(v), o.width, sy(v), { stroke: 'color-mix(in srgb, var(--color-text) 7.0%, transparent)', width: 1 })); });
    }
    if (!o.noX) frame.appendChild(line(0, o.height, o.width, o.height, { stroke: col, width: 1.5 }));
    if (!o.noY) frame.appendChild(line(0, 0, 0, o.height, { stroke: col, width: 1.5 }));
    if (!o.noX) xt.forEach(function (v) {
      frame.appendChild(line(sx(v), o.height, sx(v), o.height + 6, { stroke: col, width: 1.5 }));
      frame.appendChild(text(sx(v), o.height + 18, xFmt(v), { size: o.tickSize || 13, color: 'var(--color-text)', cls: 'tick' }));
    });
    if (!o.noY) yt.forEach(function (v) {
      frame.appendChild(line(-6, sy(v), 0, sy(v), { stroke: col, width: 1.5 }));
      frame.appendChild(text(-10, sy(v), yFmt(v), { size: o.tickSize || 13, color: 'var(--color-text)', anchor: 'end', cls: 'tick' }));
    });
    if (o.xLabel) frame.appendChild(text(o.width / 2, o.height + (o.xLabelDy || 44), '', { size: o.labelSize || 16, color: 'var(--color-text)', cls: 'axlabel', html: o.xLabel }));
    if (o.yLabel) frame.appendChild(text(-(o.yLabelDx || 48), o.height / 2, '', { size: o.labelSize || 16, color: 'var(--color-text)', rotate: -90, cls: 'axlabel', html: o.yLabel }));
    var plot = s('g.plot');
    if (o.clip) {
      uid += 1;
      var id = 'clip' + uid;
      var clipPath = s('clipPath', { id: id });
      clipPath.appendChild(rect(-2, -2, o.width + 4, o.height + 4, { fill: 'var(--color-text)' }));
      g.appendChild(clipPath);
      plot.setAttribute('clip-path', 'url(#' + id + ')');
    }
    g.appendChild(plot);
    return { g: g, plot: plot, frame: frame, x: sx, y: sy, width: o.width, height: o.height, left: o.left, top: o.top, xTicks: xt, yTicks: yt };
  }

  /* A curly brace between two points, opening towards `side`. */
  function brace(x1, y1, x2, y2, o) {
    o = o || {};
    var dx = x2 - x1, dy = y2 - y1;
    var len = Math.hypot(dx, dy) || 1;
    var nx = -dy / len, ny = dx / len;
    var depth = o.depth || 10;
    var mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    var d = 'M' + x1 + ',' + y1 +
      ' Q' + (x1 + nx * depth) + ',' + (y1 + ny * depth) + ' ' + (x1 + dx * 0.25 + nx * depth) + ',' + (y1 + dy * 0.25 + ny * depth) +
      ' L' + (mx - dx * 0.05 + nx * depth) + ',' + (my - dy * 0.05 + ny * depth) +
      ' Q' + (mx + nx * depth) + ',' + (my + ny * depth) + ' ' + (mx + nx * depth * 2) + ',' + (my + ny * depth * 2) +
      ' Q' + (mx + nx * depth) + ',' + (my + ny * depth) + ' ' + (mx + dx * 0.05 + nx * depth) + ',' + (my + dy * 0.05 + ny * depth) +
      ' L' + (x2 - dx * 0.25 + nx * depth) + ',' + (y2 - dy * 0.25 + ny * depth) +
      ' Q' + (x2 + nx * depth) + ',' + (y2 + ny * depth) + ' ' + x2 + ',' + y2;
    return path(d, { stroke: o.color || 'var(--color-text)', width: o.width || 1.8 });
  }

  global.S = {
    line: line, circle: circle, rect: rect, path: path, text: text, polyline: polyline,
    arrow: arrow, setArrow: setArrow, growArrow: growArrow, axes: axes, brace: brace, tickFormat: tickFormat
  };
})(window);
