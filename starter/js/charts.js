/* Small chart builders. Inputs are immutable measurements; progress is visual. */
(function (g) {
  'use strict';
  const s = D.dom.s;
  const finite = (value, name) => {
    if (!Number.isFinite(value)) throw new TypeError(name + ' must be finite');
    return value;
  };
  function frame(o) {
    ['x', 'y', 'width', 'height'].forEach(key => finite(o[key], key));
    if (o.width <= 0 || o.height <= 0) throw new RangeError('Chart dimensions must be positive');
  }
  function fraction(t) { finite(t, 'progress'); return Math.max(0, Math.min(1, t)); }
  function histogram(parent, options) {
    const o = Object.assign({ color: C.gold }, options);
    frame(o);
    if (!Array.isArray(o.values) || !o.values.length) throw new TypeError('values must be a nonempty array');
    if (!Array.isArray(o.bins) || o.bins.length < 2) throw new TypeError('bins must contain at least two edges');
    const edges = o.bins.map((v, i) => finite(v, 'bin edge ' + i));
    if (edges.some((v, i) => i && v <= edges[i - 1])) throw new RangeError('Bin edges must increase strictly');
    const binWidth = edges[1] - edges[0];
    if (edges.some((v, i) => i && Math.abs(v - edges[i - 1] - binWidth) > Math.abs(binWidth) * 1e-9)) throw new RangeError('Count histogram requires equal-width bins; density mode is not implemented');
    const values = o.values.map((v, i) => finite(v, 'value ' + i));
    values.forEach(v => { if (v < edges[0] || v > edges.at(-1)) throw new RangeError('Value outside histogram domain: ' + v); });
    const initial = (o.initialPositions || values.map((_, i) => ({ x: o.x + (i + .5) * o.width / values.length, y: o.y - 35 }))).map(p => ({ x: p.x, y: p.y }));
    if (initial.length !== values.length) throw new RangeError('One initial position is required per value');
    initial.forEach((p, i) => { finite(p.x, 'initial x ' + i); finite(p.y, 'initial y ' + i); });
    const counts = Array(edges.length - 1).fill(0);
    const assignments = values.map((value, index) => {
      let bin = edges.length - 2;
      for (let b = 0; b < edges.length - 1; b++) if (value < edges[b + 1]) { bin = b; break; }
      return { index, value, bin, level: counts[bin]++ };
    });
    counts.forEach((_, bin) => assignments.filter(p => p.bin === bin)
      .sort((a, b) => initial[b.index].y - initial[a.index].y || a.index - b.index)
      .forEach((p, level) => { p.level = level; }));
    const xScale = K.linearScale([edges[0], edges.at(-1)], [o.x, o.x + o.width]);
    const maxCount = Math.max(...counts);
    const yScale = K.linearScale([0, maxCount], [o.y + o.height, o.y]);
    const group = F.group(parent);
    group.dataset.chart = 'histogram'; group.dataset.mode = 'count';
    const bars = counts.map((count, bin) => {
      const left = xScale(edges[bin]), right = xScale(edges[bin + 1]), gap = Math.min(8, (right - left) * .12);
      const node = s('rect', { x: left + gap / 2, y: yScale(0), width: right - left - gap, height: 0, fill: o.color, 'fill-opacity': .2, stroke: o.color, 'stroke-width': 1 });
      node.dataset.bin = String(bin); node.dataset.count = String(count);
      group.append(node); return node;
    });
    const points = values.map((value, i) => {
      const node = F.dot(group, initial[i].x, initial[i].y, 6, C.white);
      node.dataset.value = String(value); node.dataset.observation = String(i); node.dataset.bin = String(assignments[i].bin);
      return node;
    });
    function setProgress(value) {
      const t = fraction(value), vertical = Math.min(1, t / .6), horizontal = Math.max(0, (t - .6) / .4);
      points.forEach((node, i) => {
        const a = assignments[i], targetX = (xScale(edges[a.bin]) + xScale(edges[a.bin + 1])) / 2;
        F.pos(node, F.lerp(initial[i].x, targetX, horizontal), F.lerp(initial[i].y, yScale(a.level + .5), vertical));
      });
    }
    function setBarsProgress(value) {
      const t = fraction(value);
      bars.forEach((node, i) => { const top = F.lerp(yScale(0), yScale(counts[i]), t); node.setAttribute('y', top); node.setAttribute('height', yScale(0) - top); });
    }
    setProgress(0); setBarsProgress(0);
    return { g: group, bars, points, counts, assignments, xScale, yScale, setProgress, setBarsProgress };
  }
  function replicates(parent, options) {
    const o = options; frame(o);
    if (!Array.isArray(o.groups) || !o.groups.length) throw new TypeError('groups must be nonempty');
    if (!Array.isArray(o.domain) || o.domain.length !== 2 || !o.domain.every(Number.isFinite) || o.domain[1] <= o.domain[0]) throw new RangeError('domain must be finite and increasing');
    const groups = o.groups.map((group, gi) => {
      if (!Array.isArray(group.values) || !group.values.length) throw new TypeError('Group ' + gi + ' needs measured replicates');
      const values = group.values.map((v, i) => finite(v, 'replicate ' + gi + ':' + i));
      values.forEach(v => { if (v < o.domain[0] || v > o.domain[1]) throw new RangeError('Replicate outside fixed domain: ' + v); });
      return { label: String(group.label ?? gi + 1), values, color: group.color || C.white };
    });
    const group = F.group(parent); group.dataset.chart = 'replicates';
    const xScale = K.linearScale([0, groups.length], [o.x, o.x + o.width]);
    const yScale = K.linearScale(o.domain, [o.y + o.height, o.y]);
    const points = [], meanValues = [], means = [];
    groups.forEach((data, gi) => {
      const x = xScale(gi + .5), spacing = Math.min(30, o.width / groups.length / Math.max(4, data.values.length));
      data.values.forEach((value, ri) => {
        const node = F.dot(group, x + (ri - (data.values.length - 1) / 2) * spacing, yScale(value), 7, data.color);
        node.dataset.group = String(gi); node.dataset.replicate = String(ri); node.dataset.value = String(value);
        points.push(node);
      });
      const mean = data.values.reduce((sum, value) => sum + value, 0) / data.values.length;
      const line = F.line(group, x, yScale(mean), x, yScale(mean), C.gold, 4);
      line.dataset.group = String(gi); line.dataset.mean = String(mean); line.setAttribute('stroke-linecap', 'butt');
      means.push(line); meanValues.push(mean);
    });
    function setProgress(value) {
      const t = fraction(value), half = Math.min(40, o.width / groups.length * .15) * t;
      means.forEach((line, gi) => { const x = xScale(gi + .5), y = yScale(meanValues[gi]); F.seg(line, x - half, y, x + half, y); F.opacity(line, t ? 1 : 0); });
    }
    setProgress(0);
    return { g: group, points, means, meanValues, xScale, yScale, setProgress };
  }
  Object.assign(g.K, { histogram, replicates });
})(window);
