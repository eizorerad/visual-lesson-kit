/* Data/identity and sampled geometry checks; not browser rendering. */
const fs = require('fs'), path = require('path'), assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..'), starter = process.env.LESSON_TEST_DIR || path.join(root, 'starter');
const dom = new JSDOM('<body></body>', { runScripts: 'outside-only', pretendToBeVisual: true });
const w = dom.window; w.matchMedia = () => ({ matches: false });
for (const name of ['config', 'lib/dom', 'lib/num', 'lib/anim', 'lib/plot', 'lib/svg', 'lesson', 'film', 'patterns']) w.eval(fs.readFileSync(path.join(starter, 'js', name + '.js'), 'utf8'));
for (const name of ['matrices', 'partitions']) { const file = path.join(starter, 'js', name + '.js'); if (fs.existsSync(file)) w.eval(fs.readFileSync(file, 'utf8')); }
let assertions = 0;
function check(ok, message) { assert.ok(ok, message); assertions++; }
function near(a, b, message) { check(Number.isFinite(a) && Math.abs(a - b) < 1e-8, message + ': ' + a + ' vs ' + b); }
function rejects(fn, message) { assert.throws(fn, undefined, message); assertions++; }
const plain = x => JSON.parse(JSON.stringify(x));
(async () => {
  check(typeof w.K.heatmap === 'function', 'K.heatmap is available');
  check(typeof w.K.partitionActors === 'function', 'K.partitionActors is available');
  const svg = w.D.dom.s('svg'); w.document.body.append(svg);
  const options = { values: [[-2, 0, 2], [1, -1, .5]], rowLabels: ['R1', 'R2'], columnLabels: ['C1', 'C2', 'C3'], domain: [-2, 2], x: 100, y: 200, cellWidth: 30, cellHeight: 20, gap: 4 };
  const heat = w.K.heatmap(svg, options), originals = [...heat.cells], fills = heat.cells.map(n => n.getAttribute('fill'));
  check(heat.cells.length === 6, 'all rectangular matrix cells present');
  near(heat.position(1, 2).x, 168, 'initial column units'); near(heat.position(1, 2).y, 224, 'initial row units');
  for (const t of [0, .25, .5, .75, 1]) {
    heat.setOrder({ rows: [1, 0], columns: [2, 0, 1] }, t);
    near(heat.position(0, 0).x, 100 + 34 * t, 'explicit original-to-new column interpolation');
    near(heat.position(0, 0).y, 200 + 24 * t, 'explicit original-to-new row interpolation');
    check(heat.cells.every((n, i) => n === originals[i] && n.getAttribute('fill') === fills[i]), 'permutation preserves DOM identity and color');
    check(heat.cells.map(n => +n.dataset.value).join(',') === '-2,0,2,1,-1,0.5', 'permutation preserves values');
  }
  heat.setOrder({ rows: [0, 1], columns: [0, 1, 2], fromRows: [1, 0], fromColumns: [2, 0, 1] }, .5);
  near(heat.position(0, 0).x, 117, 'explicit reversed origin interpolation');
  heat.setRowOffset(0, 40, -10); near(heat.position(0, 0).x, 157, 'author staging offset');
  heat.setSelection({ row: 1, column: 2 }); check(heat.cells.filter(n => n.dataset.selected === 'true').length === 1, 'selection intersects original row/column indices');
  check(heat.cell(1, 2).dataset.selected === 'true', 'selection follows identity after layout');
  heat.setSelection({}); check(heat.cells.every(n => n.style.opacity === '1'), 'selection clearing restores cells');
  rejects(() => heat.setOrder({ rows: [0, 0], columns: [0, 1, 2] }), 'duplicate permutation');
  rejects(() => heat.setOrder({ rows: [1, 0], columns: [0, 1] }), 'missing permutation member');
  rejects(() => heat.setSelection({ row: 7 }), 'invalid selection');
  rejects(() => heat.setOrder({ rows: [1, 0], columns: [0, 1, 2] }, NaN), 'invalid progress');
  for (const patch of [{ values: [[1], [1, 2]] }, { values: [[NaN]] }, { domain: [2, 2] }, { values: [[3]] }, { rowLabels: ['only one'] }, { cellWidth: -2 }]) rejects(() => w.K.heatmap(svg, { ...options, ...patch }), 'invalid matrix input');
  check(JSON.stringify(options.values) === '[[-2,0,2],[1,-1,0.5]]', 'caller matrix remains unchanged');
  for (const patch of [
    { values: [[1, , 2], [1, 0, 2]] }, { values: [[1, 0, 2], , [1, 0, 2]] },
    { domain: [-2, ,] }, { colors: ['#112233', , '#445566'] },
    { rowLabels: ['R1', ,] }, { columnLabels: ['C1', , 'C3'] }
  ]) rejects(() => w.K.heatmap(svg, { ...options, ...patch }), 'sparse matrix input must reject');
  const beforeSparseOrder = heat.rowGroups.map(n => n.getAttribute('transform'));
  rejects(() => heat.setOrder({ rows: [1, ,], columns: [0, 1, 2] }), 'sparse row order must reject');
  rejects(() => heat.setOrder({ rows: [1, 0], columns: [2, , 0] }), 'sparse column order must reject');
  check(heat.rowGroups.every((n, i) => n.getAttribute('transform') === beforeSparseOrder[i]), 'invalid sparse order does not mutate DOM');

  const items = ['a', 'b', 'c', 'd'].map(id => ({ id, label: id.toUpperCase() }));
  const lanes = { all: { x: 100, y: 200, columns: 2, dx: 50, dy: 50 }, build: { x: 500, y: 200, columns: 2, dx: 50, dy: 50 }, reserve: { x: 100, y: 450, columns: 2, dx: 50, dy: 50 } };
  const actors = w.K.partitionActors(svg, { items, groups: lanes, initialGroup: 'all' });
  const nodes = actors.actors.map(a => a.g), split = { build: ['b', 'a'], reserve: ['d', 'c'] };
  for (const t of [0, .25, .5, .75, 1]) {
    actors.setPartition(split, t);
    near(actors.position('a').x, 100 + 400 * t, 'deterministic build position');
    near(actors.position('c').y, 250 + 200 * t, 'reserve position');
    check(actors.actors.every((a, i) => a.g === nodes[i] && a.g.isConnected), 'actors retain identity');
    check(Object.values(actors.counts).reduce((a, b) => a + b, 0) === 4, 'partition conserves all observations');
    check(new Set(Object.keys(actors.assignments)).size === 4, 'one role per observation');
  }
  actors.setPartition({ all: ['d', 'c', 'b', 'a'] }, .5, { from: split }); near(actors.position('a').x, 300, 'explicit reverse transition');
  rejects(() => actors.setPartition({ build: ['a', 'b'], reserve: ['b', 'c', 'd'] }), 'duplicate assignment');
  rejects(() => actors.setPartition({ build: ['a', 'b'] }), 'unassigned observations');
  rejects(() => actors.setPartition({ missing: ['a', 'b', 'c', 'd'] }), 'unknown lane');
  rejects(() => actors.setPartition({ all: ['a', 'b', 'c', 'unknown'] }), 'unknown observation');
  rejects(() => actors.setPartition(split, Infinity), 'invalid partition progress');
  rejects(() => w.K.partitionActors(svg, { items: [{ id: 'a' }, { id: 'a' }], groups: lanes, initialGroup: 'all' }), 'duplicate item IDs');
  rejects(() => w.K.partitionActors(svg, { items, groups: { all: { ...lanes.all, columns: 0 } }, initialGroup: 'all' }), 'invalid lane');
  check(items.map(x => x.id).join(',') === 'a,b,c,d', 'caller items unchanged');
  rejects(() => actors.setPartition({ all: ['a', , 'b', 'c', 'd'] }), 'sparse membership must reject');
  rejects(() => w.K.partitionActors(svg, { items: [items[0], , items[2]], groups: lanes, initialGroup: 'all' }), 'sparse observations must reject');

  const scenes = []; w.D.deck = { register: scene => scenes.push(scene), count: () => 2 };
  for (const name of ['07-heatmap', '08-partition']) w.eval(fs.readFileSync(path.join(starter, 'js/episodes', name + '.js'), 'utf8'));
  let frames = 0, current;
  function translation(node) {
    const match = (node.getAttribute('transform') || '').match(/translate\(([-+\d.e]+)[ ,]+([-+\d.e]+)\)/);
    check(!!match, 'actor has explicit translation'); return match.slice(1).map(Number);
  }
  function sampleGeometry() {
    const boxes = [];
    for (const cell of current.querySelectorAll('[data-component="heatmap"] rect[data-value]')) {
      const [x, y] = translation(cell.parentNode), left = x + +cell.getAttribute('x');
      boxes.push([left, y, left + +cell.getAttribute('width'), y + +cell.getAttribute('height')]);
    }
    for (const actor of current.querySelectorAll('[data-observation-id]')) {
      const [x, y] = translation(actor), radius = +actor.querySelector('circle').getAttribute('r');
      boxes.push([x - radius, y - radius, x + radius, y + radius]);
    }
    check(boxes.length === 12, 'twelve persistent matrix cells or observations');
    for (const b of boxes) check(b[0] >= 60 && b[1] >= 147 && b[2] <= 1220 && b[3] <= 610, 'sampled actor hull stays inside safe stage');
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j];
      check(Math.min(a[2], b[2]) <= Math.max(a[0], b[0]) || Math.min(a[3], b[3]) <= Math.max(a[1], b[1]), 'persistent actor hulls remain disjoint during motion');
    }
  }
  w.A.run = async fn => { for (let i = 0; i <= 40; i++) { const t = i / 40; fn(t * t * t * (t * (t * 6 - 15) + 10)); frames++; for (const node of current.querySelectorAll('*')) for (const a of node.attributes) check(!/NaN|Infinity|undefined/.test(a.value), 'finite sampled episode attributes'); sampleGeometry(); } };
  for (const scene of scenes) {
    const steps = []; current = scene.build({ index: 0, step: fn => steps.push(fn) }); w.document.body.append(current);
    check(steps.length === 3 && scene.notes.length === 4, scene.id + ': three builds and four notes');
    check(scene.qa.length === 2 && scene.qa.every(q => q.q && q.a && q.source), scene.id + ': two source-labelled questions');
    sampleGeometry();
    for (const step of steps) await step(); current.remove();
  }
  console.log(JSON.stringify({ assertions, sampledFrames: frames, episodes: scenes.length, errors: 0, method: 'jsdom identity/data/domain/permutation/partition checks; not browser QA' }));
  w.close();
})().catch(error => { console.error(error.stack); w.close(); process.exitCode = 1; });
