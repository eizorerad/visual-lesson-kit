# Source-backed molecular coordinates

Use this component for **curated RNA fragments with known atoms and connectivity**. It supplies an orthographic view, persistent SVG actors, and a whole-molecule locator. The complete example is the [RNA folding template](rna-folding.md); `B.inspect` remains a separate captured schematic view.

For a ready protein–RNA overview and shared-depth RNA/DNA close-up, start with the [molecular construction kit](molecular-views.md). It wraps this renderer with scene presets, framing, controls and a bounded PDB importer. Existing MC APIs remain available independently.

## Load and use

Load `js/molecular-coordinates.js` after `js/lib/dom.js`, `js/film.js` and `js/perspective.js` (and their normal kit dependencies). Load `js/rna-structures.js` for the two bundled coordinate fixtures. Both files are copied into every new project; only the RNA template loads them automatically. No network fetch, external viewer, GPU, or package is required to display the lesson.

`RNA_STRUCTURES.acceptorT` contains the selected 1EHZ acceptor/T-stem fragment and a 76-residue context. `RNA_STRUCTURES.tetraloopReceptor` contains the 33-residue 1HR2 loop/receptor fragment and a 157-residue context. Full provenance and raw source structures are in `assets/rna-folding/`. After editing either fixture JSON, run `python3 build/rna-structures.py` from the generated project, then rebuild the HTML and run the source audit. `python3 build/rna-structures.py --check` detects a stale registry without rewriting it. These objects are input data, not predictions.

```js
const data = RNA_STRUCTURES.tetraloopReceptor;
const selected = new Set(data.residues.map(r => r.id));
const color = id => id >= 150 && id <= 153 ? C.gold : C.blue;
const locator = MC.context(v.svg, data, selected, color, {
  box: { x: 90, y: 244, width: 237, height: 272 }, leaderX: 375
});
const model = MC.rnaFragment(v.svg, data, {
  color, focusIds: [153, 223, 250]
});
const focusOrigin = MC.centroid([153, 223, 250].map(id => model.row(id).center));
const state = { angle: 14, focus: 0 };
function paint() {
  const origin = data.origin.map((n, i) => F.lerp(n, focusOrigin[i], state.focus));
  const out = model.paint({ origin, cx: 807, cy: 389,
    scale: F.lerp(8.05, 25, state.focus), angle: state.angle, pitch: 15 * state.focus
  }, { focus: state.focus, detail: 1 });
  // Move labels/contact markers with these same projected coordinates.
  const adenine = out.project(out.row(153).center);
  // Position your leader endpoint at adenine.x / adenine.y.
}
const driver = F.driver(state, paint);
ctx.onDispose(driver.dispose);
paint();
ctx.step(() => driver.to({ focus: 1, angle: 32 }, { duration: 1700 }));
```

This is the view layer for a scene registered with the normal kit shell. Use full RU/EN captions and notes, `L.textBox`/`L.contract` for text, and the lifecycle shown in the RNA recipe. Example framing must be reviewed after adding labels or choosing another fragment.

## API and coordinate convention

| Call | Contract |
|---|---|
| `MC.project(data, xyz, camera)` | Returns `{x, y, depth}`. Subtract `camera.origin` (default `data.origin`), resolve in `data.basis`, turn about the local vertical axis by `angle`, then apply `K.project3D` with `pitch`. Angles are **degrees**; positive screen y points down. `scale` is stage units per source unit; depth is unscaled. |
| `MC.centroid(points)` | Mean of a nonempty array of finite `[x,y,z]` points. |
| `MC.rnaFragment(parent, data, {color, focusIds})` | Creates actors once; returns `{g, q, row(id), paint(camera, {focus, detail})}`. `g` and `q` refer to the same group. The renderer owns a frozen copy of input data. `color(id)` defaults to `C.blue`; focus defaults to all residues. |
| `model.paint(camera, {focus=0, detail=1})` | Projects atoms, ring faces and explicit bonds, reorders the same nodes by depth, and updates emphasis. `focus`/`detail` are in `[0,1]`; focus fades non-selected residues. Returns `{project(xyz), row(id)}` for labels and contact geometry. It does not change any source coordinate. |
| `MC.context(parent, data, selection, color, {box, leaderX})` | Fits the supplied context trace in the box, highlights the same selected residue IDs, and draws a region outline/leader. Returns a group for opacity control. Selection must be nonempty and reference context residues. Default box: x89.5/y244/w237/h272; default leader x375. |
| `MC.validateRNA(data)` | Validates required atoms, unique residue IDs, finite coordinates, orthonormal basis and explicit bond endpoints. No DOM mutation. This structural validation does **not** establish source accuracy or chemical correctness. |

Camera defaults: `cx=0`, `cy=0`, `scale=1`, `angle=0`, `pitch=0`; `origin` comes from data. The matrix basis must be orthonormal with determinant +1, preserving handedness. No perspective foreshortening is applied. Invalid structure, camera or emphasis values are rejected before painting. Keep magnitudes in sensible molecular/stage ranges.

## Data contract

The current renderer is deliberately bounded to an RNA **single-chain** subset. It does not parse PDB/mmCIF, infer bonds by distance, generate missing atoms, or choose a biological assembly. Prepare and verify an explicit data record:

- `pdb_id`, `chain`, `model`, `source_url`, `source_sha256`, `coordinate_units`: experimental identity and provenance. Bundled records use Å, model 1, author chain A. Preserve modified residue names and author IDs.
- `origin: [x,y,z]`, `basis: [[...],[...],[...]]`: display framing independent of coordinates.
- `residues: [{id, component, atoms: {atomName: [x,y,z]}, rings: [[atomNames]], exo: [[name,name]], center: [x,y,z]}]`: supplied heavy atoms, base-ring paths, exocyclic bonds and base centroid. Optional `glycosidic: [sugarAtom, baseAtom]` handles other modifications; defaults are C1′–N9 for A/G and C1′–N1 for C/U/5MC. Unknown components require an explicit adjacency.
- `sugar_ring: [atomNames]`, `backbone: [atomNames]`: the displayed within-residue sugar polygon and covalent backbone path. These are depiction subsets, not promises that every atom of a nucleotide is present.
- `bonds: [[fromResidueId, toResidueId]]`: **explicit** inter-residue O3′–P connections. Do not connect neighboring array entries or bridge omitted segments. The supplied chemical graph must be checked against the source.
- `context: {residues: [{id, xyz, ...}], bonds, origin, basis}`: coarse C4′ positions for the whole source chain. Lines represent a residue trace along verified connectivity, not bonds between C4′ atoms.

The connected acceptor-stem recipe in `js/recipes/rna-folding/rna-intro.js` uses a more detailed renderer for all 299 heavy atoms/332 covalent links, including phosphate branches and 2′-OH. The ions recipe uses real Mg/water coordinates plus a separately labeled authored ion atmosphere. Do not substitute the fragment depiction above for those specific scientific claims.

## Preserve the explanation

1. Introduce the nucleotide glyph before atom-level detail. Connect bases to sugars and the backbone; isolated rings lose chain identity.
2. Keep a whole-source locator beside the enlarged view, with the **same IDs and selection**. Carry the selected pair and camera into the following scene when the question continues.
3. Change one relation at a time: pairing across strands, then stacking along a stem; whole loop/receptor, then an existing receptor pair, then the A-minor interface.
4. Attach labels to projected atom/base anchors in every paint. Reserve empty text regions throughout the camera sweep and inspect intermediate frames.
5. Crystal cameras preserve all coordinates. A schematic hinge illustrates alternative geometry; neither camera motion nor authored morphs calculate a folding path or free energy.
6. A contact marker is not automatically a hydrogen bond or a new canonical pair. Mg–water coordination is distinct from covalent connectivity or a direct RNA–Mg bridge. Ring fills are neither molecular surfaces nor measured volumes.

## Verify

Use `python3 qa/rna-folding/science.py` to compare the bundled coordinates and displayed chemical graph with the raw sources. Build/check the standalone file, then run the portable layout, motion and interaction checks in [rna-folding.md](rna-folding.md). Library maintenance also runs `node --test tests/molecular-coordinates.cjs` and rebuilds the RNA fixture module with `python3 tools/build-rna-structures.py --check`.

The template carries the working camera/layout recipe; it cannot automatically choose a useful viewpoint, repair a new chemical topology, or guarantee legibility after arbitrary edits. Review the actual output and report the checks performed.
