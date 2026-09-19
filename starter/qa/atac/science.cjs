#!/usr/bin/env node
'use strict';
/* Independent arithmetic audit of the synthetic illustration.
 * This does not validate a biological experiment, a peak caller, or a folding
 * simulation. Oracles below enumerate raw intervals/base positions and do not
 * call AtacData.verify(). Run: node qa/atac/science.cjs
 */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const load = file => fs.readFileSync(path.join(root, file), 'utf8');
const context = { console };
context.window = context;
vm.createContext(context);
vm.runInContext(load('js/atac-data.js'), context, { filename: 'atac-data.js' });
const d = context.AtacData;
const clean = x => JSON.parse(JSON.stringify(x));
const checks = [];
function check(name, run) {
  try { const detail = run(); checks.push({ name, pass: true, ...(detail ? { detail } : {}) }); }
  catch (error) { checks.push({ name, pass: false, error: error.message }); }
}
const sum = xs => xs.reduce((a, b) => a + b, 0);
const expectedCoverage = Array.from({ length: d.length }, (_, p) => d.fragments.filter(f => p >= f.start && p < f.end).length);
const expectedBoundaries = Array.from({ length: d.length + 1 }, (_, p) => d.fragments.reduce((n, f) => n + Number(f.start === p) + Number(f.end === p), 0));
const overlapOracle = (a, b) => {
  for (let p = a.start; p < a.end; p++) if (p >= b.start && p < b.end) return true;
  return false;
};
const inPeak = d.fragments.filter(f => d.peaks.some(p => overlapOracle(f, p)));
const before = JSON.stringify({ fragments: d.fragments, duplicates: d.duplicates, peaks: d.peaks });
check('Synthetic provenance and coordinate semantics are explicit', () => {
  assert.equal(d.synthetic, true); assert.equal(d.seed, 7105);
  assert.equal(d.coordinateConvention, '0-based half-open [start,end)');
  assert.match(d.endpointConvention, /Unshifted/); assert.match(d.peakConvention, /not a statistical peak caller/);
});
check('Exactly 150 independent intervals, 12 amplification copies, 324 paired read records', () => {
  assert.equal(d.fragments.length, 150); assert.equal(d.duplicates.length, 12); assert.equal(d.records.length, 162);
  assert.equal(sum(d.records.map(f => f.reads.length)), 324);
  assert.equal(new Set(d.fragments.map(f => f.id)).size, 150);
  assert.equal(new Set(d.fragments.map(f => `${f.start}:${f.end}`)).size, 150);
});
check('Every fragment and read obeys the 0-based half-open interval convention', () => {
  for (const f of d.records) {
    assert(Number.isInteger(f.start) && Number.isInteger(f.end));
    assert(f.start >= 0 && f.end <= d.length && f.start < f.end);
    assert.equal(f.length, f.end - f.start); assert.equal(f.insertLength, f.length);
    assert.equal(f.reads.length, 2);
    for (const r of f.reads) {
      assert.equal(r.fragmentId, f.id); assert.equal(r.end - r.start, d.readLength);
      assert(r.start >= f.start && r.end <= f.end && r.start < r.end);
    }
    assert.equal(f.reads[0].mate, 1); assert.equal(f.reads[0].strand, '+'); assert.equal(f.reads[0].start, f.start);
    assert.equal(f.reads[1].mate, 2); assert.equal(f.reads[1].strand, '-'); assert.equal(f.reads[1].end, f.end);
  }
});
check('F001 is [490,578), R1 [490,520)+, R2 [548,578)-; 28 bp are unsequenced in this example', () => {
  const f = d.fragments.find(f => f.id === 'F001');
  assert.deepEqual([f.start, f.end, f.length], [490, 578, 88]);
  assert.deepEqual(clean(f.reads.map(r => [r.start, r.end, r.strand])), [[490, 520, '+'], [548, 578, '-']]);
  assert.equal(f.reads[1].start - f.reads[0].end, 28);
});
check('Every PCR copy retains explicit original-molecule provenance and identical read intervals', () => {
  for (const f of d.fragments) assert.equal(f.duplicate, false);
  for (const copy of d.duplicates) {
    const original = d.fragments.find(f => f.id === copy.originalId);
    assert(original); assert.equal(copy.duplicate, true);
    assert.deepEqual([copy.start, copy.end, copy.length], [original.start, original.end, original.length]);
    assert.deepEqual(clean(copy.reads.map(r => [r.start, r.end, r.strand, r.mate])), clean(original.reads.map(r => [r.start, r.end, r.strand, r.mate])));
    for (const r of copy.reads) assert.equal(r.originalId, original.id);
  }
  assert.equal(d.duplicates.filter(f => f.originalId === 'F001').length, 4);
});
check('Every one of 1200 per-base coverage values agrees with independent interval membership', () => {
  assert.deepEqual(clean(d.coverage), expectedCoverage);
});
check('All 1201 boundary positions agree with independently enumerated interval ends', () => {
  assert.deepEqual(clean(d.endpointBoundaries), expectedBoundaries); assert.equal(sum(expectedBoundaries), 300);
});
check('Coverage integral is 23943 bp·fragments by two independent enumerations', () => {
  assert.equal(sum(expectedCoverage), 23943); assert.equal(sum(d.fragments.map(f => f.end - f.start)), 23943);
  assert.equal(d.stats.coverageIntegral, 23943); assert.equal(d.stats.endpointCount, 300);
});
for (const width of [7, 20, 64, 1200, 1300]) check(`Endpoint and coverage display bins independently agree at width ${width}`, () => {
  const actual = d.computeBins(width);
  let endpoints = 0, integral = 0;
  actual.records.forEach((bin, i) => {
    const lo = i * width, hi = Math.min(d.length, lo + width);
    assert.equal(bin.start, lo); assert.equal(bin.end, hi);
    const bases = expectedCoverage.slice(lo, hi);
    let endCount = sum(expectedBoundaries.slice(lo, hi));
    if (hi === d.length) endCount += expectedBoundaries[d.length];
    assert.equal(bin.endpointCount, endCount); assert.equal(bin.coverageSum, sum(bases));
    assert.equal(bin.meanCoverage, sum(bases) / bases.length);
    endpoints += endCount; integral += sum(bases);
  });
  assert.equal(actual.records.length, Math.ceil(d.length / width));
  assert.equal(endpoints, 300); assert.equal(integral, 23943);
  assert.equal(actual.endpointTotal, endpoints); assert.equal(actual.coverageIntegral, integral);
});
check('Stored display bins and maxima are consistent with independently verified 20 bp bins', () => {
  assert.deepEqual(clean(d.bins), clean(d.computeBins(20)));
  assert.equal(d.stats.maxEndpointBin, Math.max(...d.bins.records.map(b => b.endpointCount)));
  assert.equal(d.stats.maxEndpointBin, 27); assert.equal(d.stats.maxMeanCoverage, 79.3);
});
check('Coverage excludes right endpoints, while the terminal boundary is assigned to the final display bin', () => {
  const probe = [{ id: 'A', start: 0, end: 20, length: 20 }, { id: 'B', start: 20, end: 40, length: 20 }, { id: 'C', start: 1199, end: 1200, length: 1 }];
  const b = d.computeBins(20, probe);
  assert.equal(b.records[0].coverageSum, 20); assert.equal(b.records[1].coverageSum, 20);
  assert.equal(b.records[2].coverageSum, 0); assert.equal(b.records.at(-1).coverageSum, 1);
  assert.equal(b.records[0].endpointCount, 1); assert.equal(b.records[1].endpointCount, 2);
  assert.equal(b.records[2].endpointCount, 1); assert.equal(b.records.at(-1).endpointCount, 2);
  assert.equal(b.endpointTotal, 6); assert.equal(b.coverageIntegral, 41);
});
check('Histogram bins count each fragment once and conserve all 150 molecule IDs', () => {
  const h = d.histogram();
  assert.equal(h.length, 20); assert.equal(sum(h.map(b => b.count)), 150);
  for (let i = 0; i < h.length; i++) {
    const ids = d.fragments.filter(f => f.end - f.start >= i * 25 && f.end - f.start < (i + 1) * 25).map(f => f.id);
    assert.equal(h[i].count, ids.length); assert.deepEqual(clean(h[i].ids), clean(ids));
  }
  assert.equal(new Set(h.flatMap(b => b.ids)).size, 150);
});
check('Histogram boundaries are half-open: length 24/25/499 placed correctly and 500 rejected', () => {
  const h = d.histogram(25, [{id:'24',length:24},{id:'25',length:25},{id:'499',length:499}], 500);
  assert.deepEqual(clean(h[0].ids), ['24']); assert.deepEqual(clean(h[1].ids), ['25']); assert.deepEqual(clean(h[19].ids), ['499']);
  assert.throws(() => d.histogram(25, [{id:'500',length:500}], 500), /range/);
});
check('FRiP equals 132/150 = 0.88 under the declared any-overlap definition', () => {
  assert.equal(inPeak.length, 132); assert.equal(d.fragments.length - inPeak.length, 18);
  assert.equal(d.stats.inPeaks, 132); assert.equal(d.stats.outsidePeaks, 18); assert.equal(d.stats.frip, .88);
  assert.deepEqual(clean(d.inPeakFragments.map(f => f.id)), clean(inPeak.map(f => f.id)));
});
check('Touching half-open windows do not overlap; one-base overlap does', () => {
  const cases = [
    [{start:0,end:10},{start:10,end:20},false],
    [{start:10,end:20},{start:0,end:10},false],
    [{start:0,end:11},{start:10,end:20},true],
    [{start:10,end:11},{start:10,end:11},true],
    [{start:0,end:1},{start:2,end:3},false]
  ];
  for (const [a,b,expected] of cases) { assert.equal(overlapOracle(a,b), expected); assert.equal(d.overlap(a,b), expected); }
});
check('Overlapping or repeated peak windows count any fragment only once, without mutating source windows', () => {
  const windows = [{start:470,end:570},{start:530,end:650},{start:470,end:570}];
  const serialized = JSON.stringify(windows);
  const ids = d.fragments.filter(f => d.overlapsPeaks(f, windows)).map(f => f.id);
  const expected = d.fragments.filter(f => windows.some(p => overlapOracle(f,p))).map(f => f.id);
  assert.deepEqual(ids, expected); assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual(clean(d.mergedWindows(windows)), [{start:470,end:650}]);
  assert.equal(JSON.stringify(windows), serialized);
  assert.equal(d.overlapsPeaks({start:650,end:660}, windows), false);
  assert.equal(d.overlapsPeaks({start:649,end:660}, windows), true);
});
check('Declared PCR copies are the only repeated coordinate pairs in this toy dataset', () => {
  const groups = new Map();
  for (const f of d.records) { const key = `${f.start}:${f.end}`; groups.set(key, (groups.get(key) || 0) + 1); }
  assert.equal(groups.size, 150); assert.equal(sum([...groups.values()].map(n => n - 1)), 12);
  assert.equal(d.markCoordinateDuplicates().filter(f => f.duplicate).length, 12);
});
check('Data generation is deterministic and does not load RNA structure globals', () => {
  const again = {}; again.window = again; vm.createContext(again); vm.runInContext(load('js/atac-data.js'), again);
  assert.equal(JSON.stringify(again.AtacData.fragments), JSON.stringify(d.fragments));
  assert.equal(context.RNA_STRUCTURES, undefined);
  const html = load('index.html');
  const scripts = [...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map(m => m[1]);
  assert(!scripts.some(s => /(?:rna-data|rna-structures|trna-data|5s-data)/i.test(s)));
});
const story = JSON.parse(load('assets/atac/story-copy.json'));
check('All 46 distinct story cues have nonempty RU/EN titles, captions, notes, and source links', () => {
  assert.equal(story.length, 46); assert.equal(new Set(story.map(c => c.key)).size, 46);
  for (const c of story) {
    for (const field of ['titleRu','titleEn','captionRu','captionEn','noteRu','noteEn','sourceUrl','sourceLabel']) assert(typeof c[field] === 'string' && c[field].trim().length, `${c.key}.${field}`);
    assert.match(c.sourceUrl, /^https:\/\//);
  }
});
check('Timeline compiles 46 finite numeric poses, lasts 240.6 seconds and is at least twice as fast', () => {
  vm.runInContext(load('js/cinema-timeline.js'), context);
  context.ATAC_COPY = story;
  vm.runInContext(load('js/atac-story.js'), context);
  const cues = context.AtacStory.build();
  assert.equal(cues.length, 46);
  const duration = context.CinemaTimeline.duration(cues);
  assert(Math.abs(duration - 240.6) < 1e-8); assert(duration <= 483 / 2);
  const timeSamples = Array.from({length:Math.floor(duration / .5) + 1}, (_, i) => i * .5);
  if (timeSamples.at(-1) !== duration) timeSamples.push(duration);
  const fields = Object.keys(context.AtacStory.baseline);
  for (const cue of cues) { assert.deepEqual(Object.keys(cue.target), fields); assert(Object.values(cue.target).every(Number.isFinite)); }
  assert.deepEqual(clean(cues.map(c => c.key)), story.map(c => c.key));
  for (const t of timeSamples) {
    const a = context.CinemaTimeline.sample(cues, context.AtacStory.baseline, t);
    context.CinemaTimeline.sample(cues, context.AtacStory.baseline, duration - t);
    const b = context.CinemaTimeline.sample(cues, context.AtacStory.baseline, t);
    assert.deepEqual(clean(a), clean(b)); assert(Object.values(a.values).every(Number.isFinite));
  }
  return { deterministicTimeSamples: timeSamples.length, duration, originalDuration:483, speedRatio:483/duration };
});

vm.runInContext(load('js/atac-structures.js'), context, {filename:'atac-structures.js'});
const structures = context.AtacStructures;
const structureBefore = JSON.stringify(structures);
const provenance = JSON.parse(load('assets/atac/structures/provenance.json'));
const distance = (a,b) => Math.hypot(...a.map((v,i) => v-b[i]));
// Independent, narrowly scoped parser: ATOM rows in the saved RCSB assembly
// downloads are one row per line. This does not call the extraction code.
function rawAtoms(pdb) {
  const text = load(`assets/atac/structures/${pdb}-assembly1.cif`);
  const columns = text.split('\n').filter(line => line.trim().startsWith('_atom_site.')).map(line => line.trim());
  const rows = text.split('\n').filter(line => /^ATOM\s/.test(line)).map(line => {
    const values = line.match(/"[^"]*"|'[^']*'|\S+/g).map(v => (/^["']/.test(v) ? v.slice(1,-1) : v));
    assert.equal(values.length, columns.length, `raw ${pdb} atom row width`);
    const row = Object.fromEntries(columns.map((name,i) => [name.slice(11),values[i]]));
    return row;
  }).filter(a => a.pdbx_PDB_model_num === '1' && ['.','A'].includes(a.label_alt_id));
  return rows;
}
for (const [name, structure] of Object.entries(structures)) {
  const pdb = structure.pdb;
  check(`${pdb}: coordinate source hashes and experimental metadata match saved provenance`, () => {
    const entry = JSON.parse(load(`assets/atac/structures/${pdb}-entry.json`));
    const item = provenance.structures.find(p => p.key === name);
    assert(item); assert.equal(item.pdb,pdb); assert.equal(item.assembly,'1');
    const raw = fs.readFileSync(path.join(root,item.coordinateFile));
    assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),item.sha256);
    assert.equal(structure.title,entry.struct.title);
    assert.equal(structure.resolutionAngstrom,entry.rcsb_entry_info.resolution_combined[0]);
    assert.equal(entry.exptl[0].method,'X-RAY DIFFRACTION');
    assert.equal(structure.article,item.primaryArticle);
    assert.equal(structure.coordinatesSource,item.downloadUrl);
    assert.equal(structure.coordinateUnits,'angstrom');
  });
  check(`${pdb}: every trace point and residue identity agrees with independently parsed raw mmCIF`, () => {
    const atoms = rawAtoms(pdb), byKey = new Map();
    for (const a of atoms) byKey.set(`${a.label_asym_id}:${a.label_seq_id}:${a.label_atom_id}`,a);
    const metadata = JSON.parse(load(`assets/atac/structures/${pdb}-assembly1.json`)).rcsb_assembly_info;
    assert.equal(structure.chains.length,metadata.polymer_entity_instance_count);
    assert.equal(structure.chains.filter(c=>c.kind==='protein').length,metadata.polymer_entity_instance_count_protein);
    assert.equal(structure.chains.filter(c=>c.kind==='dna').length,metadata.polymer_entity_instance_count_DNA);
    assert.equal(sum(structure.chains.map(c=>c.points.length)),metadata.modeled_polymer_monomer_count);
    for (const chain of structure.chains) {
      assert.equal(chain.points.length,chain.residues.length);
      assert.equal(chain.traceAtom,chain.kind==='protein'?'CA':"C4'");
      const rawTrace = atoms.filter(a=>a.label_asym_id===chain.id && a.label_atom_id===chain.traceAtom);
      assert.equal(chain.points.length,rawTrace.length);
      for(let i=0;i<chain.points.length;i++) {
        const residue=chain.residues[i],point=chain.points[i];
        assert.equal(point.length,3); assert(point.every(Number.isFinite));
        const a=byKey.get(`${chain.id}:${residue.seqId}:${chain.traceAtom}`);
        assert(a,`${chain.id} residue ${residue.seqId} exists in raw file`);
        assert.deepEqual(clean(point),['Cartn_x','Cartn_y','Cartn_z'].map(k=>Number(a[k])));
        assert.equal(residue.name,a.label_comp_id); assert.equal(residue.authSeqId,a.auth_seq_id);
        assert.equal(chain.authorId,a.auth_asym_id); assert.equal(chain.entityId,a.label_entity_id);
      }
      const expectedBreaks=[];
      for(let i=1;i<chain.points.length;i++) {
        if(chain.residues[i].seqId!==chain.residues[i-1].seqId+1 || distance(chain.points[i],chain.points[i-1])>(chain.kind==='protein'?4.7:9)) expectedBreaks.push(i);
      }
      assert.deepEqual(clean(chain.breaks),expectedBreaks);
    }
    return {chains:structure.chains.length,points:sum(structure.chains.map(c=>c.points.length)),rawAtomRows:atoms.length};
  });
  check(`${pdb}: displayed DNA base centroids use deposited atoms and do not fabricate points`, () => {
    const atoms = rawAtoms(pdb);
    const baseNames = new Set(['C2','C4','C5','C6','C8','N1','N2','N3','N4','N6','N7','N9','O2','O4','O6']);
    for(const chain of structure.chains.filter(c=>c.kind==='dna')) {
      assert.equal(chain.basePoints.length,chain.points.length); assert.equal(chain.sugarPoints.length,chain.points.length);
      chain.residues.forEach((r,i) => {
        const residueAtoms=atoms.filter(a=>a.label_asym_id===chain.id && Number(a.label_seq_id)===r.seqId);
        const baseAtoms=residueAtoms.filter(a=>baseNames.has(a.label_atom_id)); assert(baseAtoms.length>=6);
        const centroid=['Cartn_x','Cartn_y','Cartn_z'].map(k=>sum(baseAtoms.map(a=>Number(a[k])))/baseAtoms.length);
        // Source exporter rounds to 0.001 Å. Python and JS resolve exact half
        // ties differently, so compare to the unrounded centroid.
        assert(chain.basePoints[i].every((v,k)=>Number.isFinite(v)&&Math.abs(v-centroid[k])<=0.000501));
        const c1=residueAtoms.find(a=>a.label_atom_id==="C1'");assert(c1);
        assert.deepEqual(clean(chain.sugarPoints[i]),['Cartn_x','Cartn_y','Cartn_z'].map(k=>Number(c1[k])));
      });
    }
  });
}
check('Eight histone roles and two loaded DNA ends match experimental entity descriptions', () => {
  const n=structures.nucleosome,t=structures.transposome;
  const proteins=n.chains.filter(c=>c.kind==='protein');
  for(const histone of ['H3','H4','H2A.1','H2B.2']) assert.equal(proteins.filter(c=>c.entity===`histone ${histone}`).length,2);
  assert.equal(n.chains.filter(c=>c.kind==='dna').length,2);
  for(const c of proteins) assert.equal(c.role,c.entity);
  const rawN=load('assets/atac/structures/1KX5-assembly1.cif');
  for(const [entity,label] of [['3','histone H3'],['4','histone H4'],['5','histone H2A.1'],['6','histone H2B.2']]) {
    assert(new RegExp(`^${entity}\\s+polymer\\s+man\\s+"${label.replace('.','\\.')}"`,'m').test(rawN));
    assert(proteins.filter(c=>c.entityId===entity).every(c=>c.entity===label));
  }
  const rawT=load('assets/atac/structures/1MUH-assembly1.cif');
  for(const [entity,method,label] of [['1','syn','DNA TRANSFERRED STRAND'],['2','syn','DNA NON-TRANSFERRED STRAND'],['3','man','Tn5 transposase']]) {
    assert(new RegExp(`^${entity}\\s+polymer\\s+${method}\\s+"${label}"`,'m').test(rawT));
    assert(t.chains.filter(c=>c.entityId===entity).every(c=>c.entity===label));
  }
  assert.equal(t.chains.filter(c=>c.entity==='Tn5 transposase').length,2);
  assert.equal(t.chains.filter(c=>c.entity==='DNA TRANSFERRED STRAND').length,2);
  assert.equal(t.chains.filter(c=>c.entity==='DNA NON-TRANSFERRED STRAND').length,2);
  assert.equal(t.containsTargetDNA,false);
  for(const c of t.chains.filter(c=>c.kind==='dna')) assert.equal(c.points.length,20);
});
check('147 nucleosome and 18 + 18 Tn5 rungs have complementary antiparallel identities and plausible deposited geometry', () => {
  const complement={DA:'DT',DT:'DA',DG:'DC',DC:'DG'};
  const totals={};
  for(const [name,s] of Object.entries(structures)) {
    const byId=new Map(s.chains.map(c=>[c.id,c]));const seen=new Set();
    for(const p of s.basePairs) {
      const a=byId.get(p.chainA),b=byId.get(p.chainB);assert(a&&b);
      assert.equal(a.kind,'dna');assert.equal(b.kind,'dna');
      const key=`${p.chainA}:${p.indexA}:${p.chainB}:${p.indexB}`;assert(!seen.has(key));seen.add(key);
      assert.equal(p.indexA+p.indexB,a.points.length-1);
      assert.equal(complement[a.residues[p.indexA].name],b.residues[p.indexB].name);
      const sugars=distance(a.sugarPoints[p.indexA],b.sugarPoints[p.indexB]);
      const bases=distance(a.basePoints[p.indexA],b.basePoints[p.indexB]);
      assert(sugars>=9.5&&sugars<=11.5);assert(bases>=4.5&&bases<=7.5);
    }
    totals[name]=s.basePairs.length;
  }
  assert.deepEqual(totals,{nucleosome:147,transposome:36});
  for(const chain of ['A','A-2']) {
    const pairs=structures.transposome.basePairs.filter(p=>p.chainA===chain);
    assert.equal(pairs.length,18);assert(pairs.every(p=>p.indexA<18));
  }
});
check('Saved source coordinates reproduce the distributed JS exactly in an isolated temporary directory', () => {
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'atac-source-rebuild-'));
  try {
    fs.mkdirSync(path.join(temp,'assets/atac/structures'),{recursive:true});fs.mkdirSync(path.join(temp,'js'));
    for(const file of ['extract.py','1KX5-assembly1.cif','1MUH-assembly1.cif','1KX5-entry.json','1MUH-entry.json']) fs.copyFileSync(path.join(root,'assets/atac/structures',file),path.join(temp,'assets/atac/structures',file));
    const result=spawnSync('python3',[path.join(temp,'assets/atac/structures/extract.py')],{cwd:temp,encoding:'utf8',timeout:30000});
    assert.equal(result.status,0,result.stderr||result.error?.message||result.stdout);
    assert.equal(fs.readFileSync(path.join(temp,'js/atac-structures.js'),'utf8'),load('js/atac-structures.js'));
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(temp,'assets/atac/structures/provenance.json'),'utf8')),provenance);
  } finally {fs.rmSync(temp,{recursive:true,force:true});}
});
check('Audit leaves all original structural coordinates and metadata unchanged', () => {
  assert.equal(JSON.stringify(structures),structureBefore);
});

check('Audit calls leave source fragments, copies, and peaks unchanged', () => {
  assert.equal(JSON.stringify({ fragments: d.fragments, duplicates: d.duplicates, peaks: d.peaks }), before);
});
const report = {
  sourceHashes: Object.fromEntries(['js/atac-data.js','js/atac-structures.js','js/atac-story.js','assets/atac/story-copy.json'].map(file=>[file,crypto.createHash('sha256').update(load(file)).digest('hex')])),
  kind: 'ATAC-seq arithmetic, narrative and experimental-coordinate provenance audit',
  experimentalValidation: false,
  scope: 'Independent enumeration of interval membership, boundary counts, bins, histogram, FRiP and paired-read provenance; timeline and bilingual-copy completeness; every structural trace point against raw mmCIF, assembly metadata, source hashes and isolated reproducibility. No validation of biological samples, statistical peak calls, molecular dynamics or rendered geometry.',
  passed: checks.every(c => c.pass),
  checks: checks.length,
  failed: checks.filter(c => !c.pass).length,
  measured: { fragments: d.fragments.length, copies: d.duplicates.length, records: d.records.length, endpoints: sum(expectedBoundaries), coverageIntegral: sum(expectedCoverage), inPeakFragments: inPeak.length, frip: inPeak.length / d.fragments.length, cues: story.length },
  results: checks
};
const output = path.join(root, 'qa-output/atac/science-report.json');
fs.mkdirSync(path.dirname(output), { recursive: true }); fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: report.passed, checks: report.checks, failed: report.failed, measured: report.measured, failures: checks.filter(c => !c.pass), report: output }, null, 2));
process.exitCode = report.passed ? 0 : 1;
