#!/usr/bin/env node
'use strict';
// Offline audit of the shipped calculation and pure schematic geometry.
// Reevaluate the energy model separately with build/rna-prediction-data.py --check.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const args = process.argv.slice(2);
let root = path.resolve(__dirname, '../..');
let out = 'qa-output/rna-prediction';
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--help') {
    console.log('Usage: node qa/rna-prediction/science.cjs [--project PATH] [--out PATH]\nDefault project: the directory containing this qa/ folder. --out is relative to that project.\nRequires only the Node standard library; no ViennaRNA, browser, or network.');
    process.exit(0);
  }
  if (!['--project', '--out'].includes(args[i]) || !args[i + 1] || args[i + 1].startsWith('--')) {
    throw new Error(`Unknown or incomplete option: ${args[i]}`);
  }
  if (args[i] === '--project') root = path.resolve(args[++i]);
  else out = args[++i];
}
out = path.resolve(root, out);
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const ordinary = value => JSON.parse(JSON.stringify(value));
let checks = 0;
const check = (value, message) => { assert(value, message); checks++; };
const close = (a, b, message, tolerance = 1e-10) => check(Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) < tolerance, message);
const equal = (a, b, message) => { assert.deepEqual(ordinary(a), ordinary(b), message); checks++; };
const allowedPair = bases => /^(AU|UA|GC|CG|GU|UG)$/.test(bases);

function pairs(structure) {
  const stack = [], result = [];
  for (const [index, symbol] of [...structure].entries()) {
    check('().'.includes(symbol), 'recognized dot-bracket symbol');
    if (symbol === '(') stack.push(index + 1);
    if (symbol === ')') {
      check(stack.length > 0, 'balanced closing bracket');
      result.push([stack.pop(), index + 1]);
    }
  }
  check(!stack.length, 'balanced opening brackets');
  return result.sort((a, b) => a[0] - b[0]);
}

function audit() {
  const data = JSON.parse(read('assets/rna-prediction/thermo-example.json'));
  const context = vm.createContext({window: {}, C: {}, F: {}});
  vm.runInContext(read('js/recipes/rna-prediction/prediction-experiment.js'), context);
  equal(context.window.RNA_EXPERIMENT, data, 'embedded data equals reproducible JSON');
  check(data.sequence === 'GGACGAAACGUCC', 'same 13-nt sequence');
  check(data.provenance.version === '2.7.2', 'pinned ViennaRNA version');
  check(data.length === 13 && data.index_base === 1, 'explicit length and one-based fixture indices');
  check(data.provenance.parameter_set === 'RNA Turner 2004', 'explicit parameter set');
  close(data.model.temperature_C, 37, 'reference temperature');
  close(data.model.monovalent_salt_M, 1.021, 'reference salt concentration');
  close(data.model.RT_kcal_mol, 0.6163207755, 'thermal energy with recorded units');
  const seq = data.sequence, all = data.ensemble.all_structures;
  check(all.length === 99 && new Set(all.map(s => s.structure)).size === 99, '99 distinct structures');
  check(data.ensemble.structure_count === all.length, 'recorded structure count');

  // Enumerate independently from the static records, without an energy library.
  const memo = new Map();
  function enumerate(left, right) {
    if (left > right) return [''];
    const key = `${left},${right}`;
    if (memo.has(key)) return memo.get(key);
    const result = enumerate(left + 1, right).map(s => '.' + s);
    for (let partner = left + 4; partner <= right; partner++) {
      if (!allowedPair(seq[left] + seq[partner])) continue;
      for (const interior of enumerate(left + 1, partner - 1)) {
        for (const suffix of enumerate(partner + 1, right)) result.push('(' + interior + ')' + suffix);
      }
    }
    memo.set(key, result);
    return result;
  }
  equal(all.map(s => s.structure).sort(), enumerate(0, seq.length - 1).sort(), 'all legal noncrossing structures are present');

  const z = all.reduce((sum, s) => sum + Math.exp(-s.energy_kcal_mol / data.model.RT_kcal_mol), 0);
  const matrix = Array.from({length: 13}, () => Array(13).fill(0));
  const apiTolerance = 1e-6;
  for (const s of all) {
    check(s.structure.length === seq.length, 'structure length preserves every residue');
    const parsed = pairs(s.structure);
    equal(parsed, s.pairs, 'dot-bracket matches pairs');
    check(s.pair_count === parsed.length, 'pair count');
    check(s.loops.reduce((sum, loop) => sum + loop.energy_centikcal_mol, 0) === s.energy_centikcal_mol, 'integer motif sum');
    close(s.energy_centikcal_mol / 100, s.energy_kcal_mol, 'energy conversion');
    for (const loop of s.loops) {
      check(Number.isInteger(loop.energy_centikcal_mol), 'integer loop energy');
      close(loop.energy_centikcal_mol / 100, loop.energy_kcal_mol, 'loop energy conversion');
      check(loop.highlight_nt.every(i => Number.isInteger(i) && i >= 1 && i <= seq.length), 'loop highlights preserve residue indices');
      if (loop.type === 'hairpin') check(loop.unpaired_nt.length >= 3, 'minimum hairpin size');
    }
    const occupied = new Set();
    for (const [i, j] of parsed) {
      check(j - i > 3, 'minimum hairpin span');
      check(allowedPair(seq[i - 1] + seq[j - 1]), 'compatible bases');
      check(!occupied.has(i) && !occupied.has(j), 'one partner per base');
      occupied.add(i); occupied.add(j);
      matrix[i - 1][j - 1] += s.probability;
      matrix[j - 1][i - 1] += s.probability;
    }
    close(s.probability, Math.exp(-s.energy_kcal_mol / data.model.RT_kcal_mol) / z, 'independent Boltzmann probability');
    close(s.boltzmann_weight, Math.exp(-s.energy_kcal_mol / data.model.RT_kcal_mol), 'stored Boltzmann weight');
    close(s.probability, s.probability_vienna_api, 'structure probability agrees with stored ViennaRNA PF result', apiTolerance);
  }
  close(all.reduce((sum, s) => sum + s.probability, 0), 1, 'normalized ensemble');
  close(data.ensemble.partition_function_Z, z, 'full partition function');
  close(data.ensemble.free_energy_kcal_mol, -data.model.RT_kcal_mol * Math.log(z), 'ensemble free energy');
  close(data.ensemble.free_energy_kcal_mol, data.ensemble.free_energy_vienna_api_kcal_mol, 'ensemble energy agrees with stored ViennaRNA PF result', apiTolerance);
  close(data.mfe.energy_kcal_mol, Math.min(...all.map(s => s.energy_kcal_mol)), 'MFE minimum');
  close(data.mfe.energy_kcal_mol, -4.9, 'displayed MFE');
  close(data.mfe.probability, .8536834510498192, 'structure probability');
  close(data.ensemble.mfe_probability, data.mfe.probability, 'reported MFE probability');
  check(all.filter(s => s.energy_kcal_mol === data.mfe.energy_kcal_mol).length === 1, 'unique minimum');
  equal(data.mfe.pairs, [[1,13],[2,12],[3,11],[4,10],[5,9]], 'displayed MFE pairs');
  equal(data.mfe.loops.map(loop => loop.energy_centikcal_mol), [0,-330,-240,-220,-240,540], 'displayed MFE energy terms');

  const candidateEnergies = {mfe: -4.9, long_loop: -3.7, frayed: -2.6, internal_loop: .2, unpaired: 0};
  equal(data.candidates.map(s => s.id), Object.keys(candidateEnergies), 'five displayed candidates');
  for (const candidate of data.candidates) {
    const {id, label, ...record} = candidate;
    equal(record, all.find(s => s.structure === candidate.structure), 'candidate record preserves the full ensemble result');
    close(candidate.energy_kcal_mol, candidateEnergies[id], 'displayed candidate energy');
    check(typeof label.en === 'string' && typeof label.ru === 'string', 'candidate labels in both languages');
  }
  equal(data.mfe, data.candidates[0], 'MFE candidate equals the headline record');

  const recorded = new Set();
  for (const pair of data.ensemble.pair_probabilities) {
    const key = `${pair.i},${pair.j}`;
    check(!recorded.has(key), 'unique stored marginal'); recorded.add(key);
    close(matrix[pair.i - 1][pair.j - 1], pair.probability, 'pair marginal');
    close(pair.probability, pair.probability_vienna_api, 'pair marginal agrees with stored ViennaRNA PF result', apiTolerance);
    check(pair.bases === seq[pair.i - 1] + seq[pair.j - 1], 'marginal base identities');
    check(pair.in_mfe === data.mfe.pairs.some(([i, j]) => i === pair.i && j === pair.j), 'MFE membership');
  }
  for (let i = 0; i < seq.length; i++) {
    const sum = matrix[i].reduce((a, b) => a + b, 0);
    check(sum <= 1 + 1e-12, 'partner probabilities do not exceed one');
    const unpaired = data.ensemble.unpaired_probabilities[i];
    check(unpaired.i === i + 1 && unpaired.base === seq[i], 'unpaired probability identity');
    close(unpaired.probability, 1 - sum, 'unpaired probability complements pair marginals');
    for (let j = i + 1; j < seq.length; j++) check(recorded.has(`${i + 1},${j + 1}`) === (matrix[i][j] > 0), 'complete marginal table');
  }
  close(matrix[4][8], .874616, 'displayed pair 5–9 probability', 1e-7);

  vm.runInContext(read('js/rna-pair-molecule.js'), context);
  const pm = context.window.PM;
  for (const id of ['mfe', 'long_loop', 'frayed']) {
    const candidate = data.candidates.find(s => s.id === id);
    const pp = candidate.pairs.map(pair => pair.map(i => i - 1));
    const paired = new Set(pp.flat());
    const a = pm.helixCoordinates(seq, pp, {variant: 0});
    const b = pm.helixCoordinates(seq, pp, {variant: 1});
    for (const i of paired) equal(a[i], b[i], 'loop variant preserves paired stem');
    for (const fold of [0, .25, .5, .75, 1]) {
      for (const depth of [0, .5, 1]) {
        for (const variant of [0, 1]) {
          const coords = pm.coordinates(seq, pp, {fold, depth, variant});
          check(coords.length === 13 && coords.every(p => p.length === 3 && p.every(Number.isFinite)), 'finite 13 identity-preserving positions');
        }
      }
    }
  }
  // Positive discrete torsion in physical XYZ; convert screen y to upward y.
  const physical = pm.helixCoordinates(seq, data.mfe.pairs.map(p => p.map(i => i - 1)), {variant: 0}).map(p => [p[0], -p[1], p[2]]);
  const sub = (a, b) => a.map((v, i) => v - b[i]);
  for (const strand of [[0,1,2,3,4], [12,11,10,9,8]]) {
    for (let k = 0; k < 2; k++) {
      const p = strand.slice(k, k + 4).map(i => physical[i]);
      const a = sub(p[1], p[0]), b = sub(p[2], p[1]), c = sub(p[3], p[2]);
      const cross = [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
      check(cross.reduce((sum, x, i) => sum + x * c[i], 0) > 0, 'right-handed helical stem');
    }
  }

  const definitions = [];
  context.window.RNA = {seq, pairs: data.mfe.pairs.map(p => p.map(i => i - 1)), register: d => definitions.push(d)};
  const alignment = read('js/recipes/rna-prediction/prediction-alignment-story.js');
  // Capture the actual authored ROWS inside the QA-only VM; no browser globals added.
  const declaration = /^(const ROWS=.*;)$/m;
  check(declaration.test(alignment), 'alignment row declaration available to the fixture audit');
  vm.runInContext(alignment.replace(declaration, '$1\ng.__RNA_QA_ALIGNMENT_ROWS = ROWS;'), context);
  check(definitions.find(d => d.id === 'story-alignment').states.length === 8, 'eight alignment states');
  const rows = ['GGACGAAACGUCC','AGACGGAACGUCU','GGACGAACCGUCU','CGGCGUAACGCCG','UAACAAGAUGUUA','GGUAGAAACUACC'];
  equal(context.window.__RNA_QA_ALIGNMENT_ROWS, rows, 'actual illustrative MSA rows match the audited teaching fixture');
  for (const row of rows) {
    for (const [i, j] of data.mfe.pairs) check(allowedPair(row[i - 1] + row[j - 1]), 'teaching MSA pair compatibility');
  }
  return {ok: true, checks, sequence: seq, structures: all.length, mfe: data.mfe.energy_kcal_mol, mfeProbability: data.mfe.probability, pair5_9: matrix[4][8], scope: 'Static numerical coherence and pure schematic geometry; no energy-library rerun, browser check, or experimental validation.'};
}

let report;
try {
  report = audit();
} catch (error) {
  report = {ok: false, checks, error: error.message};
  process.exitCode = 1;
}
fs.mkdirSync(out, {recursive: true});
fs.writeFileSync(path.join(out, 'science-report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
