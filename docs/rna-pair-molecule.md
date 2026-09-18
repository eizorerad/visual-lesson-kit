# Connected RNA sequence, pair arcs and spatial stem

`js/rna-pair-molecule.js` exposes `window.PM`: one persistent indexed RNA
schematic that moves from a sequence through a hairpin into a coarse helix.
The same residues, backbone segments, pairs and text nodes survive every paint.
The module was promoted from the RNA prediction lesson without changing its
successful animation geometry.

This is an authored teaching model. Its right-handed stem, approximately 33°
twist per pair and exaggerated axial spacing support readable identities. They
are not metric A-form coordinates, deposited atoms, a prediction algorithm,
folding dynamics or a sampled conformational ensemble. Pair support is supplied
by the caller and is not computed here. Use the source-backed
[molecular coordinate renderer](molecular-coordinates.md) for atomic data.

## Load and reuse

Load `js/layout.js` and the kit's live `C` palette before
`js/rna-pair-molecule.js`. The renderer uses native SVG and `L.contract`; it has
no timers, listeners, fetches or external dependencies. The pure coordinate
factories do not need `L`, `C` or an SVG element. `F.driver` is an optional
caller-owned animation controller from the normal lesson runtime.

```js
// Inside a scene's build(ctx) function:
const v = F.stage(ctx, 'From sequence to a spatial stem');
const molecule = PM.create(v.svg, {
  sequence: 'GGACGAAACGUCC',
  pairs: [[0,12], [1,11], [2,10], [3,9], [4,8]],
  radius: 12
});
const state = {fold: 0, depth: 0, pairProgress: 1};
const driver = F.driver(state, () => molecule.paint(state));
ctx.onDispose(driver.dispose);
ctx.onDispose(molecule.dispose);
molecule.paint(state);
ctx.step(() => driver.to({fold: 1}, {duration: 2800}));
ctx.step(() => driver.to({depth: 1}, {duration: 3100}));
return v.root;
```

Create the actor once and supply each desired state to `paint`. Route manual
input through the driver's cancellation contract. See [motion](motion.md).

## Sequence and pair contract

`PM.SEQUENCE` is `GGACGAAACGUCC`; `PM.PAIRS` is the five-pair default above.
`PM.create(parent, {sequence, pairs, radius:12})` returns an actor and paints its
default horizontal state. The parent must accept SVG children; radius must be
positive and finite.

Sequences contain uppercase `A`, `C`, `G`, `U`. Pairs use **zero-based** residue
indices and form one contiguous nested stem, ordered outermost first:
`[a+k, b-k]`. There must be at least three unpaired loop residues; unpaired outer
tails are supported. The renderer checks topology, not nucleotide complementarity.
Keep any sequence-specific pairing claims in the scene's scientific checks.

Examples for the default 13-residue teaching sequence:

| Shape | Zero-based pairs |
| --- | --- |
| Five-pair stem, three-residue loop | `[[0,12],[1,11],[2,10],[3,9],[4,8]]` |
| Four-pair stem, longer loop | `[[0,12],[1,11],[2,10],[3,9]]` |
| Frayed outer pair, two outer tails | `[[1,11],[2,10],[3,9],[4,8]]` |

These are examples of the supported topology, not an exhaustive preset list.
Internal gaps, branches, pseudoknots, duplicate partners, sparse pair lists and
an empty pair list are rejected. Do not feed a general predicted secondary
structure into this single-stem renderer. To convert a one-based pair table:

```js
const pairs = source.pairs.map(([i, j]) => [i - 1, j - 1]);
```

## Complete synchronous paint

`molecule.paint(state={})` updates geometry, emphasis, labels and anchors in the
same call, then returns the actor. **Omitted fields reset to defaults**, rather
than retaining the previous paint. Supply finite numeric values and valid
arrays; normalize external data before painting.

| Fields | Defaults and meaning |
| --- | --- |
| `cx`, `cy`, `scale` | `640`, `380`, `1`; parent SVG origin and positive uniform scale |
| `fold`, `depth` | `0`, `0`; sequence → hairpin and planar → spatial progress, clamped to 0…1 |
| `yaw`, `pitch` | `0`, `0`, **radians**; orthographic camera turns gated by `fold * depth` |
| `pairProgress` | `0`; pair opacity progress, one scalar or an array in pair-list order |
| `focusPair` | `-1`; zero-based pair-list index, or `-1` for no focus |
| `support` | `null`; optional array of supplied 0…1 weights, controlling pair emphasis |
| `variant` | `0`; 0…1 illustrative loop alternative; paired stem and outer tails stay fixed |
| `labelOpacity`, `indexOpacity`, `plateOpacity` | `1`, `1`, `1`; base letters, residue indices and spatial pair planes |
| `highlightResidues`, `highlightColor` | `[]`, `C.gold`; zero-based residue indices and their accent color |

`fold=0` stays planar regardless of depth or camera values. Pair arcs become
endpoint-attached rungs as folding proceeds. `variant` affects only the spatial
loop; it does not define a second solved atomic structure. For readable labels,
keep yaw within about ±0.22 and pitch within ±0.12. Large turns can place bases
edge-on. The default teaching geometry fits the normal lesson drawing area;
longer sequences and tails require deliberate layout and browser inspection.

## Identity, anchors and disposal

- `g` is the SVG root. `nodes[i]` exposes `{g, bead, inset, halo, base, letter,
  index, indexGroup}`; `base` and `letter` reference the same text element.
- `links[k]` exposes `{g, line, halo, plate}`. Its `line` is an SVG **path**.
  `backbone[i]` exposes `{g, under, line}` for adjacent residues `i` and `i+1`.
  Depth sorting reorders existing SVG children without replacing them.
- `sequence` and `pairs` expose the construction data. The actor copies the input
  pairs and exposes a separate pair snapshot; mutate neither to change topology.
  Create a new actor for a different sequence or pair set.
- `positions()` returns fresh `{x,y,z,r,index,base}` records in original sequence
  order. `point(i)` returns one fresh record, or `null` outside that order.
  Coordinates are in the **parent SVG space**; positive `z` faces the viewer.
- `pairPoint(k,t=.5)` returns `{x,y,z}` on the currently displayed cubic pair
  path, including the sequence arc. `t` is clamped to 0…1. An absent pair returns
  `null`. Use this anchor for explanations attached to a pair.
- `bounds()` returns a fresh `{x,y,width,height}` for the current geometry and
  allocated index-label regions. It is not a browser text measurement; run
  actual font, clearance and motion checks in the completed scene.
- `dispose()` unregisters the actor's text contracts and is idempotent. It does
  not remove `g`; the owning scene removes its DOM. Subsequent paints throw.
  The last geometry remains readable through the anchor getters.

Residue labels and the `data-pair` SVG metadata are one-based for readers.
`data-base-index`, `data-pair-index`, the API and array positions are zero-based.
Base letters are 18 local units and residue indices 12, both scaled with the
actor. Live palette references preserve theme changes.

## Pure geometry and verification

Each factory returns fresh `[x,y,z]` arrays in sequence order, relative to the
actor's local origin (before camera, translation or scale):

```js
PM.sequenceCoordinates(sequence, pairs, {step: 50});
PM.hairpinCoordinates(sequence, pairs);
PM.helixCoordinates(sequence, pairs, {variant: 0});
PM.coordinates(sequence, pairs, {fold: 0, depth: 0, variant: 0});
```

Arguments default to `PM.SEQUENCE` and the default pairs. The local origin is
the authored layout origin, not a computed molecular centroid. SVG `y` points
down; use `[x,-y,z]` for a physical frame with upward `y` when checking helical
handedness.

Run `node --test tests/rna-pair-molecule.cjs` at the kit root. It checks the three
teaching topologies, right-handedness, loop-only alternatives, persistent DOM,
projection and indexing, cubic pair anchors, default-state replay, disposal and
rejection of unsupported structures. These are numerical and jsdom checks;
they do not claim browser text measurement or physical gesture coverage.
