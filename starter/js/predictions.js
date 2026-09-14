/* Matched scalar observations. Amplitude changes values, never the common scale. */
(function () {
  'use strict';
  const finite = (value, name) => {
    if (typeof value !== 'number' || !Number.isFinite(value)) throw new TypeError(name + ' must be finite');
    return value;
  };
  const format = value => String(Number(value.toFixed(2)));
  function pearson(xs, ys) {
    if (xs.length < 2) return null;
    // Rescaling before centering avoids overflow from squaring large raw values.
    const xMax = xs.reduce((a, v) => Math.max(a, Math.abs(v)), 0);
    const yMax = ys.reduce((a, v) => Math.max(a, Math.abs(v)), 0);
    if (!xMax || !yMax) return null;
    const x = xs.map(v => v / xMax), y = ys.map(v => v / yMax);
    const mx = x.reduce((a, v) => a + v, 0) / x.length, my = y.reduce((a, v) => a + v, 0) / y.length;
    let xx = 0, yy = 0, xy = 0;
    x.forEach((v, i) => { const dx = v - mx, dy = y[i] - my; xx += dx * dx; yy += dy * dy; xy += dx * dy; });
    return xx && yy ? Math.max(-1, Math.min(1, xy / Math.sqrt(xx * yy))) : null;
  }
  function predictionComparison(parent, options) {
    const o = Object.assign({ amplitude: 1, observedColor: C.white, predictedColor: C.blue }, options);
    if (!Array.isArray(o.items) || !o.items.length) throw new TypeError('items must be a nonempty array');
    const items = Object.freeze(Array.from(o.items, (item, i) => {
      if (!item || typeof item.id !== 'string' || !item.id.trim()) throw new TypeError('Item ' + i + ' needs a nonempty string ID');
      if (item.label !== undefined && typeof item.label !== 'string') throw new TypeError('Item labels must be strings');
      return Object.freeze({ id: item.id, label: item.label === undefined ? item.id : item.label,
        observed: finite(item.observed, 'observed ' + i), predicted: finite(item.predicted, 'predicted ' + i) });
    }));
    if (new Set(items.map(item => item.id)).size !== items.length) throw new RangeError('Observation IDs must be unique');
    if (!Array.isArray(o.domain) || o.domain.length !== 2 || !Array.from(o.domain).every(Number.isFinite) || !(o.domain[1] > o.domain[0])) throw new RangeError('Explicit increasing finite domain required');
    const domain = Object.freeze(o.domain.slice()); finite(domain[1] - domain[0], 'domain span');
    ['x', 'y', 'width', 'height'].forEach(key => finite(o[key], key));
    if (o.width <= 0 || o.height / items.length < 44) throw new RangeError('Positive width and at least 44px height per row required');
    finite(o.x + o.width, 'right edge'); finite(o.y + o.height, 'bottom edge');
    const inDomain = value => { finite(value, 'displayed value'); if (value < domain[0] || value > domain[1]) throw new RangeError('Value outside fixed domain: ' + value); return value; };
    items.forEach(item => { inDomain(item.observed); inDomain(item.predicted); });
    const xScale = K.linearScale(domain, [o.x, o.x + o.width]);
    function calculate(amplitude) {
      finite(amplitude, 'amplitude');
      const values = Object.freeze(items.map(item => {
        const scaled = inDomain(item.predicted * amplitude), predicted = scaled === 0 ? 0 : scaled;
        return Object.freeze({ id: item.id, observed: item.observed, predicted, residual: finite(predicted - item.observed, 'residual') });
      }));
      const l2 = finite(values.reduce((length, row) => Math.hypot(length, row.residual), 0), 'L2');
      const metrics = Object.freeze({ n: items.length, amplitude, l2, pearson: pearson(values.map(row => row.observed), values.map(row => row.predicted)) });
      return { values, metrics };
    }
    let current = calculate(o.amplitude);
    // No nodes are appended until the entire initial dataset and geometry validate.
    const g = F.group(parent); g.dataset.component = 'prediction-comparison';
    const observedPoints = [], predictedPoints = [], residualLines = [], residualGroups = [], valueLabels = [], rowLabels = [], stems = [];
    items.forEach((item, i) => {
      const y = o.y + (i + .5) * o.height / items.length;
      const row = F.group(g); row.dataset.observationId = item.id;
      F.line(row, o.x, y, o.x + o.width, y, C.dim, 1);
      rowLabels.push(F.label(row, o.x - 22, y, item.label, 21, C.white, 'end'));
      const residualGroup = F.group(row), line = F.line(residualGroup, 0, y, 0, y, C.gold, 3);
      line.setAttribute('stroke-linecap', 'butt'); line.dataset.observationId = item.id;
      residualGroups.push(residualGroup); residualLines.push(line);
      stems.push([F.line(residualGroup, 0, y - 8, 0, y, C.gold, 1), F.line(residualGroup, 0, y, 0, y + 8, C.gold, 1)]);
      const observed = F.dot(row, xScale(item.observed), y - 8, 6, o.observedColor);
      const predicted = D.dom.s('rect', { x: 0, y: y + 2, width: 12, height: 12, fill: o.predictedColor }); row.append(predicted);
      observed.dataset.observationId = item.id; predicted.dataset.observationId = item.id;
      observedPoints.push(observed); predictedPoints.push(predicted);
      const observedLabel = F.label(row, o.x + o.width + 35, y - 8, '', 20, o.observedColor);
      F.label(row, o.x + o.width + 64, y - 8, '/', 20, C.grey);
      const predictedLabel = F.label(row, o.x + o.width + 95, y - 8, '', 20, o.predictedColor);
      const residualLabel = F.label(residualGroup, o.x + o.width + 64, y + 18, '', 18, C.gold);
      valueLabels.push({ observed: observedLabel, predicted: predictedLabel, residual: residualLabel });
    });
    function paint(snapshot) {
      snapshot.values.forEach((value, i) => {
        const ox = xScale(value.observed), px = xScale(value.predicted), y = o.y + (i + .5) * o.height / items.length;
        predictedPoints[i].setAttribute('x', px - 6);
        observedPoints[i].dataset.value = String(value.observed); predictedPoints[i].dataset.value = String(value.predicted);
        observedPoints[i].setAttribute('aria-label', items[i].label + ': наблюдение ' + value.observed);
        predictedPoints[i].setAttribute('aria-label', items[i].label + ': предсказание ' + value.predicted);
        F.seg(residualLines[i], ox, y, px, y); residualLines[i].dataset.residual = String(value.residual);
        F.seg(stems[i][0], ox, y - 8, ox, y); F.seg(stems[i][1], px, y, px, y + 8);
        valueLabels[i].observed.textContent = format(value.observed);
        valueLabels[i].predicted.textContent = format(value.predicted);
        valueLabels[i].residual.textContent = (value.residual > 0 ? '+' : '') + format(value.residual);
      });
      g.dataset.amplitude = String(snapshot.metrics.amplitude);
    }
    const api = { g, items, domain, xScale, observedPoints, predictedPoints, residualLines, valueLabels, rowLabels,
      values: () => current.values, metrics: () => current.metrics,
      setAmplitude(amplitude) { const next = calculate(amplitude); paint(next); current = next; return api; },
      showResiduals(progress) { finite(progress, 'residual visibility'); residualGroups.forEach(group => F.opacity(group, progress)); return api; }
    };
    paint(current); api.showResiduals(0); return api;
  }
  K.predictionComparison = predictionComparison;
})();
