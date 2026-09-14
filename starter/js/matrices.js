/* Fixed-scale matrices. Permutations change layout, never values or units. */
(function () {
  'use strict';
  const finite = (v, name) => { if (!Number.isFinite(v)) throw new TypeError(name + ' must be finite'); return v; };
  const fraction = t => Math.max(0, Math.min(1, finite(t, 'progress')));
  function heatmap(parent, options) {
    const o = Object.assign({ gap: 6, labelSize: 22, colors: [C.blue, 'var(--color-bg)', C.red] }, options);
    if (!Array.isArray(o.values) || !o.values.length || !Array.isArray(o.values[0]) || !o.values[0].length) throw new TypeError('Matrix must be nonempty');
    const rows = o.values.length, columns = o.values[0].length;
    const values = Array.from(o.values, (row, r) => {
      if (!Array.isArray(row) || row.length !== columns) throw new RangeError('Matrix must be rectangular');
      return Object.freeze(Array.from(row, (value, c) => finite(value, 'value ' + r + ':' + c)));
    });
    if (!Array.isArray(o.domain) || o.domain.length !== 2 || !Array.from(o.domain).every(Number.isFinite) || o.domain[1] <= o.domain[0]) throw new RangeError('Explicit increasing finite color domain required');
    const domain = Object.freeze(o.domain.slice()), center = o.center === undefined ? (domain[0] + domain[1]) / 2 : finite(o.center, 'center');
    if (!(center > domain[0] && center < domain[1])) throw new RangeError('Color center must lie inside domain');
    if (!Array.isArray(o.colors) || o.colors.length !== 3 || !Array.from(o.colors).every(P.isColor)) throw new TypeError('Three six-digit hex colors or C roles required');
    const colors = Object.freeze(o.colors.slice());
    ['x', 'y', 'cellWidth', 'cellHeight', 'gap', 'labelSize'].forEach(key => finite(o[key], key));
    if (o.cellWidth <= 0 || o.cellHeight <= 0 || o.gap < 0 || o.labelSize <= 0) throw new RangeError('Positive cell/label dimensions and nonnegative gap required');
    function labels(input, n, prefix) {
      if (input === undefined) return Array.from({ length: n }, (_, i) => prefix + (i + 1));
      if (!Array.isArray(input) || input.length !== n) throw new RangeError(prefix + ' label count must match matrix');
      const result = Array.from(input);
      if (result.some(value => value === undefined)) throw new TypeError(prefix + ' labels must not contain holes or undefined');
      return result.map(String);
    }
    const rowNames = labels(o.rowLabels, rows, 'R'), columnNames = labels(o.columnLabels, columns, 'C');
    function colorScale(value) {
      finite(value, 'color value');
      if (value < domain[0] || value > domain[1]) throw new RangeError('Value outside fixed color domain');
      return value <= center ? P.mixHex(colors[0], colors[1], (value - domain[0]) / (center - domain[0])) : P.mixHex(colors[1], colors[2], (value - center) / (domain[1] - center));
    }
    values.forEach(row => row.forEach(colorScale));
    const g = F.group(parent); g.dataset.component = 'heatmap';
    const rowGroups = [], cells = [], rowLabels = [], columnLabels = [];
    const rowPositions = Array.from({ length: rows }, (_, i) => i), columnPositions = Array.from({ length: columns }, (_, i) => i);
    const offsets = Array.from({ length: rows }, () => ({ x: 0, y: 0 }));
    const pitchX = o.cellWidth + o.gap, pitchY = o.cellHeight + o.gap;
    values.forEach((row, r) => {
      const group = F.group(g); group.dataset.rowIndex = String(r); rowGroups.push(group);
      rowLabels.push(F.label(group, -16, o.cellHeight / 2, rowNames[r], o.labelSize, C.white, 'end'));
      row.forEach((value, c) => {
        const node = D.dom.s('rect', { x: c * pitchX, y: 0, width: o.cellWidth, height: o.cellHeight, fill: colorScale(value), stroke: 'none', 'stroke-width': 2 });
        node.dataset.rowIndex = String(r); node.dataset.columnIndex = String(c); node.dataset.value = String(value);
        node.setAttribute('role', 'img'); node.setAttribute('aria-label', rowNames[r] + ', ' + columnNames[c] + ': ' + value);
        group.append(node); cells.push(node);
      });
    });
    columnNames.forEach((name, c) => columnLabels.push(F.label(g, o.x + c * pitchX + o.cellWidth / 2, o.y - 26, name, o.labelSize, C.white)));
    function index(value, n, name) { if (!Number.isInteger(value) || value < 0 || value >= n) throw new RangeError('Invalid ' + name + ' index'); return value; }
    function permutation(order, n, name) {
      if (order === undefined) return Array.from({ length: n }, (_, i) => i);
      if (!Array.isArray(order) || order.length !== n) throw new RangeError(name + ' must be a complete permutation');
      const result = Array.from(order);
      if (new Set(result).size !== n || result.some(v => !Number.isInteger(v) || v < 0 || v >= n)) throw new RangeError(name + ' must be a complete permutation');
      return result;
    }
    function ranks(order) { const result = []; order.forEach((id, position) => { result[id] = position; }); return result; }
    function position(r, c) {
      index(r, rows, 'row'); index(c, columns, 'column');
      return { x: o.x + columnPositions[c] * pitchX + offsets[r].x, y: o.y + rowPositions[r] * pitchY + offsets[r].y };
    }
    function paint() {
      rowGroups.forEach((group, r) => F.at(group, o.x + offsets[r].x, o.y + rowPositions[r] * pitchY + offsets[r].y));
      cells.forEach(node => { const r = +node.dataset.rowIndex, c = +node.dataset.columnIndex; node.setAttribute('x', columnPositions[c] * pitchX); node.dataset.displayRow = String(rowPositions[r]); node.dataset.displayColumn = String(columnPositions[c]); });
      columnLabels.forEach((label, c) => label.setAttribute('x', o.x + columnPositions[c] * pitchX + o.cellWidth / 2));
    }
    function setOrder(order, progress = 1) {
      const t = fraction(progress), toRows = ranks(permutation(order.rows, rows, 'rows')), toColumns = ranks(permutation(order.columns, columns, 'columns'));
      const fromRows = ranks(permutation(order.fromRows, rows, 'fromRows')), fromColumns = ranks(permutation(order.fromColumns, columns, 'fromColumns'));
      rowPositions.forEach((_, i) => { rowPositions[i] = F.lerp(fromRows[i], toRows[i], t); });
      columnPositions.forEach((_, i) => { columnPositions[i] = F.lerp(fromColumns[i], toColumns[i], t); });
      paint();
    }
    function setRowOffset(row, dx = 0, dy = 0) { index(row, rows, 'row'); offsets[row] = { x: finite(dx, 'dx'), y: finite(dy, 'dy') }; paint(); }
    function setSelection(selection = {}) {
      const row = selection.row == null ? null : index(selection.row, rows, 'row'), column = selection.column == null ? null : index(selection.column, columns, 'column');
      const active = row !== null || column !== null;
      cells.forEach(node => {
        const selected = active && (row === null || +node.dataset.rowIndex === row) && (column === null || +node.dataset.columnIndex === column);
        node.dataset.selected = String(selected); node.setAttribute('stroke', selected ? C.gold : 'none'); F.opacity(node, !active || selected ? 1 : .3);
      });
    }
    paint(); setSelection({});
    return { g, cells, rowGroups, labels: { rows: rowLabels, columns: columnLabels }, values: Object.freeze(values), domain, colors, center, colorScale, position, cell: (r, c) => { index(r, rows, 'row'); index(c, columns, 'column'); return cells[r * columns + c]; }, setOrder, setRowOffset, setSelection };
  }
  K.heatmap = heatmap;
})();
