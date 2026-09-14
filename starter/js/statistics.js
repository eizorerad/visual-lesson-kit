/* Small checked statistical operations and persistent teaching views. */
(function () {
  'use strict';
  const finite = (v, name) => { if (!Number.isFinite(v)) throw new TypeError(name + ' must be finite'); return v; };
  const freeze = Object.freeze;
  function dense(a, name) { if (!Array.isArray(a) || !a.length) throw new TypeError(name + ' must be a nonempty array'); const out = Array.from(a); if (out.some(v => v === undefined)) throw new TypeError(name + ' must be dense'); return out; }
  function numbers(a, name) { return dense(a, name).map(v => finite(v, name)); }
  function progress(t) { return Math.max(0, Math.min(1, finite(t, 'progress'))); }
  function probability(v, name) { finite(v, name); if (v < 0 || v > 1) throw new RangeError(name + ' must be in [0,1]'); return v; }
  function sampleSummary(input) {
    const values = numbers(input, 'values'), n = values.length;
    const mean = finite(values.reduce((sum, v) => sum + v / n, 0), 'mean');
    const residuals = values.map(v => finite(v - mean, 'residual'));
    const squares = residuals.map(v => finite(v * v, 'squared residual'));
    const sumSquares = finite(squares.reduce((sum, v) => sum + v, 0), 'sum of squares');
    const variance = n > 1 ? finite(sumSquares / (n - 1), 'variance') : null;
    const sd = variance === null ? null : Math.sqrt(variance), sem = sd === null ? null : sd / Math.sqrt(n);
    return freeze({ n, mean, residuals: freeze(residuals), squares: freeze(squares), sumSquares, variance, sd, sem });
  }
  function exactMeanPermutation(input, groupSize) {
    const values = numbers(input, 'values'), n = values.length;
    if (n > 12) throw new RangeError('Exact teaching enumeration supports at most 12 observations');
    if (!Number.isInteger(groupSize) || groupSize < 1 || groupSize >= n) throw new RangeError('groupSize must split observations into two nonempty groups');
    const assignments = [];
    function collect(groupA) {
      const groupB = values.map((_, i) => i).filter(i => !groupA.includes(i));
      const meanA = finite(groupA.reduce((s, i) => s + values[i] / groupSize, 0), 'mean A');
      const meanB = finite(groupB.reduce((s, i) => s + values[i] / (n - groupSize), 0), 'mean B');
      assignments.push(freeze({ groupA: freeze(groupA.slice()), groupB: freeze(groupB), meanA, meanB, statistic: finite(meanA - meanB, 'mean difference') }));
    }
    function choose(start, chosen) { if (chosen.length === groupSize) { collect(chosen); return; } for (let i = start; i <= n - (groupSize - chosen.length); i++) choose(i + 1, [...chosen, i]); }
    choose(0, []);
    const observed = assignments[0].statistic;
    // Include numerically equal statistics under a scale-relative roundoff allowance.
    const tolerance = 32 * Number.EPSILON * Math.max(...assignments.map(a => Math.abs(a.statistic)), Number.MIN_VALUE);
    const extremeCount = assignments.filter(a => Math.abs(a.statistic) >= Math.abs(observed) - tolerance).length;
    return freeze({ n, groupSize, observed, assignments: freeze(assignments), extremeCount, pValue: extremeCount / assignments.length, tolerance, alternative: 'two-sided-absolute' });
  }
  function bhAdjust(input, q = .05) {
    const pValues = dense(input, 'pValues').map(p => probability(p, 'p value')); probability(q, 'q');
    const m = pValues.length, order = pValues.map((_, i) => i).sort((a, b) => pValues[a] - pValues[b] || a - b), adjusted = Array(m), rejected = Array(m).fill(false);
    let k = 0, running = 1;
    for (let rank = m; rank >= 1; rank--) { const index = order[rank - 1]; running = Math.min(running, pValues[index] * (m / rank)); adjusted[index] = running; }
    const ranks = order.map((index, i) => { const rank = i + 1, threshold = q * (rank / m), passes = pValues[index] <= threshold; if (passes) k = rank; return freeze({ index, rank, p: pValues[index], threshold, adjusted: adjusted[index], passes }); });
    for (let i = 0; i < k; i++) rejected[order[i]] = true;
    return freeze({ m, q, k, order: freeze(order), ranks: freeze(ranks), adjusted: freeze(adjusted), rejected: freeze(rejected) });
  }
  function records(input, valueKey) {
    const out = dense(input, 'records').map(record => {
      if (!record || typeof record !== 'object' || typeof record.id !== 'string' || !record.id.length || record.id.length > 12) throw new TypeError('Each record needs an ID of 1–12 characters');
      return freeze({ id: record.id, [valueKey]: finite(record[valueKey], valueKey) });
    });
    if (new Set(out.map(d => d.id)).size !== out.length) throw new RangeError('Record IDs must be unique');
    return out;
  }
  function geometry(options, count, minimumWidth = 70) {
    const o = { ...options };
    for (const key of ['x', 'y', 'width', 'height']) finite(o[key], key);
    if (o.width < count * minimumWidth || o.height < 100) throw new RangeError('Allocate enough space for the persistent teaching marks');
    finite(o.x + o.width + 120, 'right edge'); finite(o.y + o.height + 160, 'bottom edge');
    return o;
  }
  function domain(input) { const a = numbers(input, 'domain'); if (a.length !== 2 || a[1] <= a[0]) throw new RangeError('domain must be increasing'); finite(a[1] - a[0], 'domain span'); return freeze(a); }
  function checkedValues(input, count, range) { const a = numbers(input, 'values'); if (a.length !== count) throw new RangeError('Input length must preserve the existing IDs'); if (a.some(v => v < range[0] || v > range[1])) throw new RangeError('Values must remain in the fixed domain'); return a; }
  function label(parent, name, x, y, width, height, text, size = 21, color = C.white) {
    return L.textBox(parent, { id: name, x, y, width, height, text, size, color, padding: 2, align: 'center', valign: 'middle' });
  }
  function rect(parent, attrs) { const el = D.dom.s('rect', attrs); parent.append(el); return el; }
  const fmt = v => Number(v.toFixed(4)).toString();
  function sampleSpread(parent, options) {
    let data = records(options.observations, 'value'); if (data.length < 2) throw new RangeError('Spread intervals require at least two observations'); const o = geometry(options, data.length), range = domain(o.domain);
    let values = checkedValues(data.map(d => d.value), data.length, range), summary = sampleSummary(values), t = 0;
    const unit = finite(o.height / (range[1] - range[0]), 'vertical scale'), ys = v => o.height - (v - range[0]) * unit;
    // Squares occupy one categorical column: reject unrepresentable layout before DOM creation.
    const checkSummary = s => { if (s.sd !== null && (s.mean - s.sd < range[0] || s.mean + s.sd > range[1])) throw new RangeError('Fixed domain must include mean ± SD'); if (s.residuals.some(r => Math.abs(r) * unit > o.width / data.length - 20)) throw new RangeError('Residual squares need wider columns or a shorter value axis'); return s; };
    checkSummary(summary);
    const g = F.group(parent); g.dataset.component = 'sample-spread'; F.at(g, o.x, o.y);
    const meanLine = F.line(g, 0, ys(summary.mean), o.width, ys(summary.mean), C.gold, 2, '5 4');
    label(g, 'spread-domain', 0, -44, 120, 34, '[' + range.join(', ') + ']', 19, C.grey);
    const actors = data.map((d, i) => {
      const node = F.group(g); node.dataset.observationId = d.id; F.at(node, (i + .5) * o.width / data.length, 0);
      const square = rect(node, { x: 0, y: 0, width: 0, height: 0, fill: C.blue, 'fill-opacity': .14, stroke: C.blue, 'stroke-width': 1 });
      const residual = F.line(node, 0, 0, 0, 0, C.blue, 2);
      const point = F.dot(node, 0, 0, 7, C.white);
      const caption = label(node, 'sample-' + d.id, -o.width / data.length / 2, o.height + 9, o.width / data.length, 35, '', 21);
      return { node, square, residual, point, caption };
    });
    const axisY = o.height + 65, xScale = v => (v - range[0]) / (range[1] - range[0]) * o.width;
    F.line(g, 0, axisY, o.width, axisY, C.dim, 1);
    [range[0], range[1]].forEach((value, i) => label(g, 'spread-horizontal-tick-' + i, i * o.width - 32, axisY + 62, 64, 30, fmt(value), 18, C.grey));
    const intervalRows = ['SD', 'SEM'].map((name, i) => {
      const y = axisY + i * 42, bar = F.line(g, 0, y, 0, y, i ? C.teal : C.blue, 5); bar.setAttribute('stroke-linecap', 'butt');
      const center = F.dot(g, 0, y, 5, C.gold), text = label(g, 'spread-' + name, o.width + 9, y - 18, 85, 36, '±1 ' + name, 21);
      return { bar, center, text, y };
    });
    function paint() {
      const residualProgress = Math.min(1, t * 2), squareProgress = Math.max(0, (t - .5) * 2);
      F.seg(meanLine, 0, ys(summary.mean), o.width, ys(summary.mean));
      actors.forEach((actor, i) => {
        const y = ys(values[i]), meanY = ys(summary.mean), side = Math.abs(summary.residuals[i]) * unit;
        actor.node.dataset.value = String(values[i]); actor.node.dataset.residual = String(summary.residuals[i]); actor.node.dataset.square = String(summary.squares[i]);
        F.pos(actor.point, 0, y); F.seg(actor.residual, 0, meanY, 0, meanY + (y - meanY) * residualProgress);
        actor.square.setAttribute('y', Math.min(y, meanY)); actor.square.setAttribute('height', side * squareProgress); actor.square.setAttribute('width', side * squareProgress);
        actor.caption.setText(data[i].id + ' · ' + fmt(values[i]));
      });
      intervalRows.forEach((row, i) => {
        const radius = (i ? summary.sem : summary.sd) || 0, center = xScale(summary.mean);
        F.seg(row.bar, xScale(summary.mean - radius * squareProgress), row.y, xScale(summary.mean + radius * squareProgress), row.y);
        F.pos(row.center, center, row.y); F.opacity(row.bar, squareProgress); F.opacity(row.center, squareProgress); F.opacity(row.text.el, squareProgress);
      });
      g.dataset.progress = String(t);
    }
    function setValues(input) { const next = checkedValues(input, data.length, range), model = checkSummary(sampleSummary(next)); values = next; summary = model; paint(); return api; }
    function setProgress(value) { const next = progress(value); t = next; paint(); return api; }
    const api = { g, setValues, setProgress, snapshot: () => freeze({ progress: t, domain: range, observations: freeze(data.map((d, i) => freeze({ id: d.id, value: values[i] }))), summary }) };
    paint(); return api;
  }
  function permutationView(parent, options) {
    const data = records(options.observations, 'value'), o = geometry(options, data.length), range = domain(o.domain);
    if (o.height < 230) throw new RangeError('Permutation view needs at least 230 vertical units');
    let values = checkedValues(data.map(d => d.value), data.length, range), model = exactMeanPermutation(values, o.groupSize), t = 0;
    const xScale = v => (v - range[0]) / (range[1] - range[0]) * o.width;
    function checkLayout(nextValues, nextModel) {
      const xs = nextValues.map(xScale).sort((a, b) => a - b);
      if (xs.some((x, i) => i && x - xs[i - 1] < 60)) throw new RangeError('Permutation observation labels require at least 60 horizontal units of separation; use a wider domain layout or another representation for ties');
      const bins = new Map(); nextModel.assignments.forEach(a => { const key = a.statistic.toPrecision(12); bins.set(key, (bins.get(key) || 0) + 1); });
      if (o.height - 15 - (Math.max(...bins.values()) - 1) * 10 < 185) throw new RangeError('Permutation distribution stack needs a taller layout or fewer observations');
      return nextModel;
    }
    checkLayout(values, model);
    const g = F.group(parent); g.dataset.component = 'permutation-view'; F.at(g, o.x, o.y);
    const laneA = 35, laneB = 125, statisticY = o.height - 5;
    [laneA, laneB].forEach((y, i) => { F.line(g, 0, y, o.width, y, C.dim, 1); label(g, 'permutation-group-' + i, -65, y - 20, 55, 40, i ? 'B' : 'A', 24); });
    label(g, 'permutation-fixed-scale', 0, -44, 120, 35, '[' + range.join(', ') + ']', 19, C.grey);
    const actors = data.map(d => { const node = F.group(g); node.dataset.observationId = d.id; F.dot(node, 0, 0, 8, C.white); const caption = label(node, 'shuffle-' + d.id, -48, 12, 96, 34, '', 21); return { node, caption }; });
    const statX = v => o.width / 2 + v / (range[1] - range[0]) * o.width / 2;
    F.line(g, 0, statisticY, o.width, statisticY, C.dim, 1);
    [-1, 0, 1].forEach(sign => label(g, 'permutation-stat-tick-' + sign, (sign + 1) * o.width / 2 - 38, statisticY + 5, 76, 30, fmt(sign * (range[1] - range[0])), 18, C.grey));
    const marks = model.assignments.map((a, i) => { const mark = F.dot(g, 0, 0, 4, C.grey); mark.dataset.assignment = String(i); return mark; });
    let assignment = 0, transition = freeze({ from: 0, to: 0, progress: 0, moving: false });
    function paint() {
      const position = t * (model.assignments.length - 1), from = Math.floor(position), to = Math.min(from + 1, model.assignments.length - 1), u = position - from;
      assignment = u === 0 ? from : to;
      transition = freeze({ from, to, progress: u, moving: u !== 0 });
      actors.forEach((actor, i) => {
        const a = model.assignments[from].groupA.includes(i) ? laneA : laneB, b = model.assignments[to].groupA.includes(i) ? laneA : laneB;
        F.at(actor.node, xScale(values[i]), F.lerp(a, b, u)); actor.node.dataset.value = String(values[i]); actor.node.dataset.groupFrom = a === laneA ? 'A' : 'B'; actor.node.dataset.groupTo = b === laneA ? 'A' : 'B'; actor.caption.setText(data[i].id + ' · ' + fmt(values[i]));
      });
      const seen = new Map();
      model.assignments.forEach((a, i) => { const key = a.statistic.toPrecision(12), level = seen.get(key) || 0; seen.set(key, level + 1); const mark = marks[i]; F.pos(mark, statX(a.statistic), statisticY - 10 - level * 10); mark.setAttribute('fill', Math.abs(a.statistic) >= Math.abs(model.observed) - model.tolerance ? C.gold : C.grey); mark.dataset.statistic = String(a.statistic); F.opacity(mark, i <= from ? 1 : 0); });
      g.dataset.progress = String(t); g.dataset.assignment = String(assignment);
    }
    function setValues(input) { const next = checkedValues(input, data.length, range), nextModel = checkLayout(next, exactMeanPermutation(next, o.groupSize)); values = next; model = nextModel; paint(); return api; }
    function setProgress(value) { const next = progress(value); t = next; paint(); return api; }
    const api = { g, setValues, setProgress, snapshot: () => freeze({ progress: t, assignment, transition, domain: range, observations: freeze(data.map((d, i) => freeze({ id: d.id, value: values[i] }))), model }) };
    paint(); return api;
  }
  function bhView(parent, options) {
    const data = records(options.hypotheses, 'p'), o = geometry(options, data.length, 50);
    if (o.width < 750 || o.height < data.length * 42) throw new RangeError('BH rows require width ≥750 and height ≥42 per hypothesis');
    let pValues = data.map(d => d.p), q = options.q === undefined ? .05 : options.q, model = bhAdjust(pValues, q), t = 0;
    const rowHeight = o.height / data.length;
    const g = F.group(parent); g.dataset.component = 'bh-view'; F.at(g, o.x, o.y);
    const slotX = [0, .14 * o.width, .35 * o.width, .58 * o.width, .82 * o.width];
    const headings = ['rank', 'ID', 'p', 'q × i / m', 'p (BH)'];
    const strings = { rank: 'Ранг' }; if (window.D.i18n) D.i18n.pack('en', { strings: { 'Ранг': 'Rank' } });
    headings.forEach((text, i) => label(g, 'bh-column-' + i, slotX[i] - (i ? 45 : 10), -50, i === 3 ? 190 : 120, 44, strings[text] || text, 21, C.grey));
    const rankLabels = data.map((_, i) => label(g, 'bh-rank-' + i, -10, i * rowHeight - 20, 70, 40, String(i + 1), 21, C.grey));
    const boundary = F.line(g, 65, 0, o.width, 0, C.gold, 3); boundary.dataset.bhBoundary = '';
    const thresholdLabels = data.map((_, i) => label(g, 'bh-threshold-' + i, slotX[3] - 45, i * rowHeight - 20, 180, 40, '', 21));
    const actors = data.map((d, i) => {
      const node = F.group(g); node.dataset.hypothesisId = d.id;
      const dot = F.dot(node, slotX[1] - 24, 0, 5, C.white);
      const name = label(node, 'bh-id-' + d.id, slotX[1] - 15, -20, 75, 40, d.id, 21);
      const p = label(node, 'bh-p-' + d.id, slotX[2] - 45, -20, 130, 40, '', 21);
      const adjusted = label(node, 'bh-adjusted-' + d.id, slotX[4] - 45, -20, 145, 40, '', 21);
      return { node, dot, name, p, adjusted };
    });
    function paint() {
      const arrange = Math.min(1, t * 2), select = Math.max(0, (t - .5) * 2), rankOf = Array(data.length); model.order.forEach((index, i) => { rankOf[index] = i; });
      actors.forEach((actor, i) => {
        // Compact IDs use separate columns while their vertical rank changes.
        // Restore the numerical row only after all IDs reach their destination.
        const startY = i * rowHeight, targetY = rankOf[i] * rowHeight;
        const phase = (a, b) => Math.max(0, Math.min(1, (arrange - a) / (b - a)));
        const spread = phase(.12, .37) * (1 - phase(.67, .92));
        const offset = i * (o.width - 280) / Math.max(1, data.length - 1) * spread;
        F.at(actor.node, offset, F.lerp(startY, targetY, phase(.37, .67)));
        F.opacity(actor.p.el, 1 - phase(0, .12) + phase(.92, 1)); actor.node.dataset.p = String(pValues[i]); actor.node.dataset.adjusted = String(model.adjusted[i]); actor.node.dataset.rejected = String(model.rejected[i]);
        actor.p.setText(fmt(pValues[i])); actor.adjusted.setText(fmt(model.adjusted[i])); F.opacity(actor.adjusted.el, select);
        actor.dot.setAttribute('fill', select > 0 && model.rejected[i] ? C.gold : C.white);
      });
      thresholdLabels.forEach((item, i) => { item.setText(fmt(model.ranks[i].threshold)); F.opacity(item.el, select); });
      const y = (model.k - .5) * rowHeight; F.seg(boundary, 65, y, 65 + (o.width - 65) * select, y); F.opacity(boundary, select);
      rankLabels.forEach(item => F.opacity(item.el, arrange)); g.dataset.progress = String(t); g.dataset.bhK = String(model.k);
    }
    function setQ(value) { const next = bhAdjust(pValues, value); q = value; model = next; paint(); return api; }
    function setPValues(input) { const nextValues = dense(input, 'pValues'); if (nextValues.length !== data.length) throw new RangeError('Input length must preserve IDs'); const next = bhAdjust(nextValues, q); pValues = nextValues.slice(); model = next; paint(); return api; }
    function setProgress(value) { const next = progress(value); t = next; paint(); return api; }
    const api = { g, setQ, setPValues, setProgress, snapshot: () => freeze({ progress: t, hypotheses: freeze(data.map((d, i) => freeze({ id: d.id, p: pValues[i] }))), model }) };
    paint(); return api;
  }
  Object.assign(K, { sampleSummary, exactMeanPermutation, bhAdjust, sampleSpread, permutationView, bhView });
})();
