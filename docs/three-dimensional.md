# 3D scientific scenes and components

The `three-dimensional` navigation branch groups both source-coordinate molecular scenes and procedural scientific geometry. Choose by the evidence the scene needs:

| Need to explain | Start with | Representation |
| --- | --- | --- |
| A protein–RNA complex, chain identity and an atomic close-up with a retained locator | [`molecular-views`](molecular-views.md): `MolecularScenes.overview` / `detail`, then `MV` bricks | Preserved source coordinates, SVG projection and explicit connectivity |
| A custom RNA atomic fragment or contact | [`molecular-coordinates`](molecular-coordinates.md): `MC` | Curated source atoms, bonds and molecular context |
| Cell surfaces, antibody labelling, bead capture and barcode records | `spatial-biology`, using `V3` below | Authored mesh geometry, WebGL with Canvas fallback |

Create the editable molecular constructor with `python3 create.py ../my-molecular-lesson --template molecular-views`. Its [guide](molecular-views.md) covers the two presets, data import and verification. Biological searches and the `molecular-coordinates` card still lead to it. This is a navigation grouping: existing template names, runtime paths and the `MC`, `MV`, `MolecularScenes` and `V3` APIs stay unchanged.

## Procedural geometry

`V3` contains reusable, genuinely three-dimensional teaching geometry and a small WebGL renderer. The cell, immunoglobulin domains, strands, bead and droplet have object-space vertices, normals and depth. They are procedural scientific diagrams with illustrative sizes and counts. They are not atomic coordinates, molecular simulations, ray tracing, or measured surfaces.

`V3` uses its own runtime files in `js/three/`. Coordinate-backed `MC` / `MV` scenes share the 3D navigation group while retaining their own rendering and data contracts. Use [molecular coordinates](molecular-coordinates.md) or [molecular views](molecular-views-api.md) when the claim depends on a supplied experimental structure, chain identity or atomic contacts.

## Load and compose

For an editable cell-surface, molecular-record and paired-library lesson assembled from these components, run:

```sh
python3 create.py ../my-3d-lesson --template spatial-biology --lang en --palette ocean
```

The optional template loads `js/motion.js` after `js/film.js` so the molecular-code and library recipes can retain a shared identity across the scene boundary.

The template's recipe files live in `js/recipes/spatial-biology/`; customize their lesson data, controls and narration while reusing the `V3` geometry below.

The runtime files live in `js/three/`. Load the kit's `D.dom`, `D.appearance`, `F` and semantic `C` palette first, then:

```html
<script src="js/three/molecule-mesh.js"></script>
<script src="js/three/capture-mesh.js"></script>
<script src="js/three/codes-mesh.js"></script>
<script src="js/three/libraries-mesh.js"></script>
<script src="js/three/cell-surface.js"></script>
```

The mesh builders can run independently of the DOM and lesson modules. `CellSurface` needs `MoleculeMesh` only for definitions supplied as eight anchors; definitions with explicit `parts` need no molecular builder. No CITE-specific global, lesson data or external runtime dependency is required.

Create persistent geometry and a renderer once per scene, then paint current state. Register disposal with the scene lifecycle:

```js
const capture = V3.CaptureMesh.create({barcode: 'example-cell'});
const scene = V3.CellSurface.create(svg, {cx: 450, cy: 360, scale: 90}, {
  frame: {x: 60, y: 147, width: 1160, height: 463},
  molecules: [capture.bead, capture.droplet],
});
ctx.onDispose(scene.dispose);
scene.paint({yaw: 22, pitch: 18});
```

Use `includeCell: false` for a standalone bead, strand, antibody or other mesh. This avoids building the cell surface and microvilli, avoids their GPU buffers, and uses a one-pixel default material texture. Setting `cellOpacity: 0` on an ordinary cell scene only hides its already-created geometry.

The renderer has no animation loop. Drive `paint` through cancellable `F.driver` motion and keep input, captions and view state synchronized. The returned `rear` and `front` SVG groups permit labels and schematic annotations below and above the canvas; they do not take part in its depth buffer. `g` is the owning group. Dispose before removing it.

## V3.MoleculeMesh

```js
const mesh = V3.MoleculeMesh.create(anchors, {
  normal: [0, 0, 1],
  receptor: false,
  detail: 'full', // 'compact' or 'fallback'
});
```

`anchors` is an array of exactly eight finite `[x,y,z]` points in arbitrary world units, in this order:

1. First Fab tip, including its target contact.
2. Hinge.
3. Second Fab tip.
4. Fc end and connector attachment.
5. Connector bend.
6. Barcode strand start.
7. Barcode end and poly(A) tail start.
8. Poly(A) tail end.

Use nonzero, noncollinear Fab branches for a readable domain arrangement. `normal` is a finite outward membrane direction. With `receptor: true`, a schematic receptor extends 0.075 world units inward from the first Fab tip. The first Fab tip remains in contact with its given anchor. All three detail levels retain twelve solid immunoglobulin domains; lower detail reduces tessellation, not the scientific domain count.

The result contains `parts`, `domainCount: 12`, `detail`, `schematic: true`, axis-aligned `bounds: {min,max}`, and `stats: {vertices,triangles}`. Parts have semantic roles `antibody`, optional `protein`, `linker` and `tag`. Each uses interleaved `Float32Array` vertices with position3 / normal3 / uv2, and `Uint16Array` indices for outward counterclockwise triangles. Each part has fewer than 65,536 vertices. The domains and capped strands are closed surfaces. Geometry is deterministic and has no embedded camera-space lighting.

To retain the automatic lower-detail Canvas fallback, pass `anchors`, `normal`, `receptor` and optional `detail` in a renderer definition. Passing prebuilt `parts` reuses those exact parts in both renderers.

The linker and single DNA strand are teaching symbols. Their attachment position, folds, sequence, stoichiometry and surface grooves are illustrative; they do not represent solved atomic architecture or a specific conjugation chemistry.

## V3.CellSurface

```js
const scene = V3.CellSurface.create(parentSvgGroup, center, {
  frame,                    // optional SVG viewport rectangle
  includeCell: true,
  environmentView: {yaw: 0, pitch: 0},
  molecules: definitions,
});
```

`center` is `{cx, cy, scale}`, where the first two values are stage pixels and positive `scale` is stage pixels per world unit. `frame` is `{x,y,width,height}` with positive dimensions. Its default encloses the cell; specify a wider frame for molecules, a bead or a compartment outside the unit cell. Use finite values throughout. Canvas resolution is allocated once and capped at 2048 × 1100 backing pixels; camera zoom never reallocates it.

Each definition is `{id, space, center, parts}` or `{id, space, center, anchors, normal, receptor, detail}`. `space` defaults to `'cell'`; `'environment'` uses the fixed `environmentView` instead of the rotating cell. `center` is an optional world-space point for translucent-part depth sorting, defaulting to the antibody hinge or `[0,0,0]`. IDs are author metadata. The order of definitions determines pose-array order.

Explicit mesh `parts` follow the typed-array contract above. Supported semantic roles are `antibody`, `protein`, `linker`, `tag`, `bead`, `primer`, `umi`, `rna`, `polya` and `droplet`. Unknown roles use the linker color. The `droplet` role is reserved for a closed convex ellipsoid: the GPU draws front and rear faces separately; Canvas derives an ellipsoid from its coordinate bounds.

```js
scene.paint({
  yaw: 30, pitch: 15,        // degrees
  magnification: 1,         // positive zoom
  panX: 0, panY: 0,         // stage pixels after magnification
  cellOpacity: 1,           // 0..1
  cellDissolve: 0,          // 0..1; illustrative membrane opening
  moleculePoses: [
    {offset: [0,0,0], opacity: 1},
    {offset: [0,0,0], opacity: .8,
     parts: {tag: {offset: [.2,0,0], opacity: 1, rotation: matrix3}}},
  ],
});
```

Omitted scalar view fields retain their values. Omitted `moleculePoses` retains all poses. When a pose array is supplied, it describes the complete current pose state: omitted entries and fields reset to identity rotation selection, zero offset and opacity one. An explicit `rotation` is a finite orthonormal column-major 3×3 matrix. Offsets are applied in the object's selected coordinate frame **before** rotation. Part overrides replace the corresponding whole-molecule values; they are absolute in that frame, not additional relative transforms.

The `protein` role is membrane-fixed by default: it keeps the cell rotation, zero offset and opacity one even when the molecule is moved or faded. An explicit `parts.protein` override can release or hide it. This permits an antibody-linked strand to detach while its receptor remains attached. Every part uses the same projection and opaque depth buffer. A `rotation` override changes an object's frame while preserving that shared projection.

The orthographic projection matches `K.project3D`: yaw rotates x/y, pitch tilts y/z, screen y points downward, and larger camera z is nearer. For rotated point `p`, screen coordinates are `magnification * (cx + scale*p.x) + panX` and `magnification * (cy - scale*p.y) + panY`. Camera depth outside ±16 world units is clipped. `scene.probe(n)` returns `{x,y,depth}` for the cell surface at unit direction `n`, including current cell rotation, zoom and pan; `V3.CellSurface.surfaceRadius(n)` returns its base radius. This probe follows the base membrane, not an individual microvillus.

`paint(next, true)` forces a redraw; ordinary repeated values do not. The renderer observes the root's `data-background`, `data-palette` and `style` changes, resolves the live semantic CSS palette, and repaints without geometry uploads. The bead's diagram exposure adapts to light/dark backgrounds. `dispose()` is idempotent, releases GPU buffers/shaders/texture/program or Canvas interface stores, disconnects the theme observer, and makes later paints inert. It does not remove `g`.

WebGL context creation failure or context loss selects Canvas 2D. The fallback still projects mesh triangles and shades them, using coarse twelve-domain geometry for anchor-based molecules. Inspect `g.dataset.surfaceRenderer` (`webgl` or `canvas2d`), `surfaceFrames`, `surfaceDetail` (2300 microvilli or zero when omitted), `surfaceIncludesCell`, `moleculeCount` and `moleculeTriangles` for diagnostics. These attributes describe rendering, not biological measurements.

## V3.CaptureMesh

```js
const capture = V3.CaptureMesh.create({
  center: [3.85, 0, 0],
  radius: 2,
  dropletCenter: [2.1, 0, 0],
  dropletRadii: [4.2, 3.25, 4.2],
  barcode: 'A',
});
```

Options change bead placement and size, compartment geometry and the shared illustrative cell barcode. Coordinates must be finite; the bead radius must exceed 0.01 world units, droplet radii must be positive, and the barcode must be nonempty. Changing the bead radius does not scale primer lengths or RNA strands. Check the chosen compartment encloses the intended contents; only the default arrangement has that guarantee in the component tests. `surfaceRadius(n, {radius: 2})` evaluates the bead's subtle radial relief for a unit direction.

The result has these reusable pieces:

- `bead`: an environment-space mesh definition containing solid resin (`bead`), barcode (`primer`), `umi` and `linker` materials.
- `droplet`: an environment-space ellipsoid definition, with `center`, `radii` and a `droplet` material part.
- `rnas`: six environment-space strand definitions, each with `rna` / `polya` parts and `threePrime`, `polyAStart` and `polyAEnd` endpoints. Each strand's 3′/poly(A) endpoint starts at local `[0,0,0]` so its pose can place it at a capture target. `labelAnchor` is the RNA body's actual centerline midpoint; use the same pose/projection for a leader targeting that mesh.
- `primers`: eighteen enlarged teaching primers with stable `id`, outward `n`, tangent `side`, `attachment`, `handleEnd`, `barcodeEnd`, `umiEnd`, `polyTStart`, `polyTEnd`, `tip`, shared `barcode` and distinct illustrative `umiIndex`.
- `rnaPrimerIndices` and `adtPrimerIndices`: disjoint example assignments covering all eighteen primer indices, useful when composing RNA and antibody-derived tag capture.
- `center`, `radius`, `coatingCount: 220`, `stats: {vertices,triangles,parts}` and `schematic: true`.

The primer's attachment lies just inside the bead surface. Its terminal 0.10-world-unit poly(T) segment runs along `n`; the previous handle, barcode and UMI segments follow a bent chain. The fixed eighteen enlarged primers, six RNAs and 220 muted coating strands explain segment identity and functionalization. They are not measured molecular abundances, actual UMI sequences, or a count of all bead-bound oligos. Custom geometry and arbitrary counts require a separate model; the fixed assignment arrays deliberately remain coherent.

## V3.CodesMesh

`CodesMesh` provides enlarged double-stranded DNA products with distinct cell-barcode, UMI and feature-derived regions. Their colored lengths and rungs represent functional fields; they do not encode a literal nucleotide sequence or a specific library construct.

Create one reusable molecular record with explicit identity metadata:

```js
const record = V3.CodesMesh.product({
  id: 'record-1',
  kind: 'rna',               // 'rna' or 'adt'
  cell: 'cell-4',
  umi: 'AAC',
  feature: 'target-X',       // optional descriptive label
});
const scene = V3.CellSurface.create(svg, {cx: 640, cy: 375, scale: 90}, {
  includeCell: false,
  frame: {x: 60, y: 147, width: 1160, height: 463},
  molecules: [record],
});
ctx.onDispose(scene.dispose);
scene.paint({moleculePoses: [V3.CodesMesh.pose([0, 0, 0], 8, 20)]});
```

`id`, `cell` and `umi` must be nonempty strings; `kind` must be `'rna'` or `'adt'`. An omitted `feature` gets a generic kind-specific label. The returned environment-space definition has `id`, `kind`, `cell`, `umi`, `feature`, `schematic: true`, `center: [0,0,0]` and four mesh parts. Their roles are `linker`, `primer` (cell barcode), `umi`, and either `rna` (transcript-derived sequence) or `tag` (antibody barcode). These are DNA products for both kinds; material names identify record origin and coloring, not the chemical identity of the depicted backbone.

Each call owns independent typed arrays, so editing a custom product cannot change another product or the default example. Changing labels preserves the schematic geometry. IDs and metadata do not infer deduplication: the lesson must define which records share a cell, feature and UMI, and whether an object is an original captured record or a PCR copy.

`V3.CodesMesh.create()` returns a cached three-product teaching example: one RNA-derived CD4 product and two antibody-derived products with the same cell barcode and UMI, where the latter pair illustrates an original record and a PCR copy. Repeated calls return the same object and buffers; treat them as shared read-only data. The result contains:

- `molecules`: the three ready-to-render definitions.
- `stats`: product, part, vertex and triangle counts.
- `bounds`: one object per molecule, keyed by material role, each containing eight corners of that part's local axis-aligned bounds.
- `anchors`: local positions named `cell`, `umi`, `feature` and `end`, on the corresponding first DNA strand.
- `curve(t)` and `strand(t, phase=0)`: centerline and helical-strand points for finite `t` in `[0,1]`; phase `Math.PI` selects the partner strand.

The assembled template introduces the two original DNA products first, explains cell barcode, feature and UMI separately, then reveals a PCR copy and groups duplicate records into one count. The three mesh definitions persist throughout; data deduplication does not remove or fuse physical DNA molecules.

Custom products use the same local geometry layout, so the cached example's `anchors` and the appropriate RNA/ADT `bounds` can also locate their labels. Tube caps retain separate vertex normals for flat cap lighting; the surfaces are closed when coincident rim positions are welded for topology analysis.

`V3.CodesMesh.pose(center, yaw, pitch, parts={})` returns a renderer pose with opacity one. `center` is a finite world-space placement point and the angles are degrees. It applies inverse rotation to the pre-rotation offset so a product turns about its own origin while staying at the authored center. Pass the optional `parts` object for absolute material overrides under the `CellSurface` contract.

`V3.CodesMesh.project(point, pose, {cx,cy,scale})` projects a local anchor with that whole-product pose and the same orthographic convention as the renderer. It returns `{x,y,depth}`. Supply finite coordinates and positive scale. It does not apply material overrides, additional magnification or pan: for a moved material, project with its resolved part pose; for view zoom, use `cx = magnification*cx + panX`, `cy = magnification*cy + panY`, and `scale = magnification*scale` in the projection camera.

## V3.LibrariesMesh

`V3.LibrariesMesh.create()` returns cached procedural supports, record tiles, read markers and enlarged readout cards for paired RNA/ADT library explanations. It needs no DOM or external assets. Load it after `codes-mesh.js` when combining its props with DNA products and the `CodesMesh.pose`/`project` helpers.

The result exposes:

- `libraries`: two supports, `library-rna` and `library-adt`.
- `tiles`: two record tiles, `data-rna` and `data-adt`.
- `molecules`: the four definitions above, in that order.
- `markers`: separate `read-rna` and `read-adt` definitions; append these after `molecules` when creating a renderer.
- `readouts`: `readout-rna` and `readout-adt`, two enlarged data-field cards of kind `abstract-read-record`. Their `cell`, `umi` and `sequence` anchors run from left to right. Append these actors independently when the composition needs a close-up.
- `bounds`: local `min`/`max` geometry bounds keyed by actor ID.
- `anchors`: each actor's named local label and layout anchors, keyed by actor ID.
- `stats`: molecule, marker, readout, part, vertex and triangle counts. Geometry totals include all actors in `molecules`, `markers` and `readouts`; the original four-item `molecules` and two-item `markers` arrays retain their order. `schematic: true` labels the complete model.

Every actor uses environment coordinates and supplies typed mesh parts. Repeated calls share the same cached definitions and buffers; treat them as read-only. Use `V3.CellSurface.create` with `includeCell: false` and explicit poses to place the supports, DNA products, tiles, markers and readout cards in a shared depth buffer. Use each actor's anchors for projected labels; a label anchor can intentionally sit above its surface.

These props are explanatory symbols, not laboratory equipment or a reconstruction of a flow cell. Supports separate the two library channels; tiles and readout cards represent data records; moving markers represent information being read. The recipe supplies barcode, feature and UMI identity. Its separate RNA and ADT read close-ups explain gene mapping and antibody-code lookup before returning to the paired overview. Splitting or preparing a library does not create a new cell barcode, and moving a read marker does not move or destroy the source DNA. See `js/recipes/spatial-biology/03-libraries.js` for the complete six-state composition and its RU/EN notes.

## Reusable scenarios

The `spatial-biology` template assembles three complete RU/EN scenes and 24 states. Scene files are editable recipes; the `V3` files above are reusable geometry/rendering APIs. All are copied into newly created projects, including projects that select a different template. Use the template to run the full sequence, or keep only the scene scripts your lesson needs.

| Viewer question | Visible operation and result | Recipe / template address |
| --- | --- | --- |
| Which antibodies remain after washing? | Bind to surface sites, rotate the same cell, inspect one antibody, then remove unbound actors while bound actors retain their attachment frame. | `01-surface.js`, `#1` through `#1.5` |
| How do RNA and antibody tags acquire a shared address? | Encounter a bead, enclose it with the cell in an aqueous droplet, lyse, co-capture, then inspect the two poly(A)/oligo-dT interfaces. Capture and later synthesis are distinguished. | `01-surface.js` / `capture-stage.js`, `#1.6` through `#1.11` |
| What do cell barcode, feature and UMI each mean? | Inspect the fields separately, reveal a persistent PCR descendant, then group duplicate *read records* into one count. DNA products remain distinct. | `02-codes.js`, `#2` through `#2.5` |
| How can two libraries still describe the same cell? | Separate products into RNA/ADT branches, prepare the branches, inspect their reads, then pair the results using the retained cell barcode. | `03-libraries.js`, `#3` through `#3.5` |

The recipe paths are under `js/recipes/spatial-biology/`. Addresses above are for the three-scene template and its standalone example; a host lesson can place these scenes at different numbers. The last scene stands alone: add a matrix or downstream-analysis scene explicitly when your explanation needs one.

For only the library scenario in a generated project, retain the normal kit shell and common libraries, load `js/motion.js`, `js/perspective.js`, the five `js/three/` modules, `js/recipes/spatial-biology/common.js`, and `js/recipes/spatial-biology/03-libraries.js` before `js/player.js` and `js/boot.js`. Keep `css/spatial-biology.css`. The cell/capture and code-scene recipe scripts can be omitted. Direct entry into the library scene is supported; the shared navigation bridge only runs when a compatible outgoing scene is present.

## RNA and ADT readouts

`03-libraries.js` is a complete six-state sequencing scenario rather than a picture of a sequencing instrument:

| State | What the viewer sees | Retained identity |
| --- | --- | --- |
| 0 | Return to preparation before sequencing; the three inherited DNA examples keep their previous poses. | Cell A, RNA UMI GCT, ADT UMI TGA and the existing PCR-copy relationship. |
| 1 | RNA-derived and ADT-derived products move into separate spatial groups. | Whole product IDs and their code fields; displayed helix lengths are not comparable. |
| 2 | The branches are prepared separately; selected PCR descendants emerge from their parents. | Copy ancestry, barcode and UMI. The animation does not simulate tagmentation. |
| 3 | Enlarge RNA-derived DNA; reveal paired-read fields and base letters, then map a sequence to a gene. | R1: cell barcode and UMI; R2: transcript-derived sequence in this Drop-seq layout. |
| 4 | Return through the two-group view, enlarge ADT-derived DNA, and look up its code in an antibody dictionary. | R1: cell barcode and UMI; R2: synthetic antibody code. |
| 5 | Return to two library groups and two interpreted records, paired by cell A. | Modalities remain separate; their UMIs are not merged across channels. |

Both libraries contain DNA. **R1 and R2 are paired reads from one library fragment; they do not stand for RNA and ADT.** This allocation of read fields belongs to the illustrated original Drop-seq protocol. RNA feature assignment uses a reference sequence; ADT feature assignment uses the reagent's barcode dictionary. ADT is not protein sequencing and is not assigned by mapping its barcode to the CD4 gene.

The strings `ACTGACGA → CD4` and `GTCACTAG → anti-CD4` are explicitly invented teaching correspondences. The short cell and UMI labels are also illustrative. When supplying real sequence or antibody-panel data, replace the sequence, assignment, RU/EN captions and source notes together; do not present the default short strings as measured or reference sequences.

To adapt the actor identity in a new composition, use `V3.CodesMesh.product({id, kind, cell, umi, feature})` for each original record and give PCR descendants distinct IDs with their source identity retained. Do not mutate the cached example returned by `V3.CodesMesh.create()`. The bundled recipe deliberately calls `create()` to match the preceding code scene. If changing its examples, update both scenes and the `F.shared` identity declaration together; also replace the recipe's displayed sequences, labels, outputs and notes. The template does not infer those texts from a supplied product object.

Use `V3.LibrariesMesh.create().readouts` for the enlarged data cards. Its `cell`, `umi` and `sequence` anchors identify semantic fields; the geometry itself carries no molecular sequence. Supply read labels and results separately, as the recipe does. The same card and timing pattern can explain another barcode-based assay if its read layout and decoding rules are checked against that assay's source.

## Motion and identity contracts

The readout scenario uses one demand-rendered surface. Mesh buffers are created once; authored states change poses, material opacity and projected annotations. There is no idle rotation or timer-driven repaint. An actor's world placement and its annotations use the same effective orthographic camera:

```js
const projectedCamera = {
  cx: camera.cx * magnification + panX,
  cy: camera.cy * magnification + panY,
  scale: camera.scale * magnification
};
const label = V3.CodesMesh.project(localAnchor, moleculePose, projectedCamera);
```

Preserve the following ordering when adapting the story:

1. Move and settle the camera before showing the fixed readout labels.
2. Bring information markers to their fields, then reveal base letters.
3. Finish the sequence before revealing its gene or dictionary assignment.
4. Hide the readout before moving the camera away.
5. Return through a common overview when switching between enlarged molecules, so they do not pass through each other.

The code/library boundary declares a shared `F.shared` identity and matches the three DNA poses. This preserves visual and scientific continuity; normal scene disposal still replaces the renderer between scenes. Within a scene, the canvas and actors persist. A direct hash jump reconstructs the requested state without needing earlier playback.

These rules are guarded in `tests/spatial-biology.cjs`, including late readout-transition samples in addition to the general endpoints and midpoints. Keep the assertions about camera scale, completed sequence letters, source barcode/UMI identity, and one canvas when changing timing. `F.driver` must remain cancellable through `ctx.onDispose`; language and appearance changes must retain the current state.

## Primary sources for the readout scenario

- [Stoeckius et al., CITE-seq (2017), Methods](https://pmc.ncbi.nlm.nih.gov/articles/PMC5669064/): transcript and antibody-tag library preparation, read processing and tag identification. [Publisher article and supplement](https://www.nature.com/articles/nmeth.4380).
- [McCarroll Laboratory, Drop-seq Informatics Cookbook v1.0 (2015), pp. 3–4](https://mccarrolllab.org/wp-content/uploads/2015/05/DropSeqInformaticsCookbook_v1.0_May20151.pdf): the original Drop-seq R1 cell-barcode and UMI layout. The real lengths are not the shortened labels in this teaching scene.
- [Illumina, paired-end sequencing](https://www.illumina.com/science/technology/next-generation-sequencing/plan-experiments/paired-end-vs-single-read.html) and [sequencing by synthesis](https://www.illumina.com/science/technology/next-generation-sequencing/sequencing-technology.html): paired reads and base calling. The scene is a field-level explanation, not an instrument reconstruction.

## Scientific and rendering limits

The example follows [Stoeckius et al. (2017), original CITE-seq](https://doi.org/10.1038/nmeth.4380)
and [Macosko et al. (2015), Drop-seq](https://doi.org/10.1016/j.cell.2015.05.002).
The latter's [supplementary methods](https://shaleklab.com/wp-content/uploads/2024/03/Macoski-et-al-Cell-2015-SI.pdf)
describe the approximately 30 µm Toyopearl starting beads; the
[manufacturer specification](https://www.tosohbioscience.com/EU-EN-separations/products/toyopearl-hw-65s/0018377)
describes the methacrylic material and nominal 100 nm pores. These dimensions
do not set the diagram's molecular scale or calibrate its optical appearance.
The cell silhouette is informed by [Jung et al. (2016) microscopy](https://pmc.ncbi.nlm.nih.gov/articles/PMC5056101/);
the domain arrangement is informed by [intact IgG structure 1IGT](https://www.rcsb.org/structure/1IGT).
The procedural meshes do not copy figures or import those atomic coordinates.

- The cell is a lymphocyte-inspired unit surface with 2300 procedural microvilli. It does not encode cell-type morphology, membrane chemistry or physical rupture. Dissolve is an authored object-space masking field.
- IgG domains, receptor, strands, resin and compartment are explanatory geometry. The surface relief is decorative; none of these meshes can establish atomic contacts, sequence specificity, binding affinity or molecule numbers.
- Camera motion and per-part release do not compute diffusion, binding, fluid transport, DNA hybridization or folding. Narration should distinguish an authored illustrative trajectory from a computed process.
- WebGL supplies real shared depth for opaque objects. Translucent molecular parts use center-depth sorting; intersecting transparent shapes may not composite exactly. The liquid interface is an analytic transparent shell, with no refraction or ray tracing.
- Canvas uses sorted triangles and approximate cell occlusion. Its droplet fallback is the projected ellipsoid conic, composited behind and in front of the scene. Its accuracy is sufficient for teaching views, not quantitative surface analysis.
- The canvas lives inside SVG `foreignObject`; labels and accessible controls should remain ordinary SVG/HTML elements. Physical touch gestures, screen-reader wording and scientific label clearance remain the responsibility of each composed lesson.

## Verification

From the kit repository, run deterministic geometry tests with:

```sh
node --test tests/three-dimensional.cjs tests/libraries-mesh.cjs
```

The tests inspect finite vertices, index budgets, unit normals, closed surfaces with consistent edge winding and positive volume, retained IgG domain count/contact, primer endpoints, default bead containment, ellipsoid normals and configurable geometry. Record-strand tests additionally check cap-welded closure, functional anchors/bounds, independent custom products, metadata validation, fixed-center poses, and projection of rotated coordinates.

The library-prop test also checks independent loading without a DOM, stable cached identities, exposed bounds and anchors, finite meshes, unit normals, nondegenerate faces and a bounded triangle budget.

`three-dimensional.cjs` provides opt-in real-browser checks. Install Playwright as a development dependency in your environment and its Chromium browser, then run:

```sh
V3_BROWSER_TESTS=1 node --test tests/three-dimensional.cjs
# Or use an installed Chrome:
V3_BROWSER_TESTS=1 V3_BROWSER_CHANNEL=chrome node --test tests/three-dimensional.cjs
```

Browser checks instrument actual WebGL calls, inspect pixel coverage, and exercise shared projection, independent cell/environment frames, per-part release, no idle redraw, no repeated buffer upload, disposal, light/dark adaptation, two-pass transparent interfaces, context-loss fallback, and progressive cell opening in both renderers. They use portable `require('playwright')`; ordinary geometry tests do not require a browser. They do not certify complete lesson layout, wording, accessibility or physical-device gestures.

The optional assembled-template check covers all 24 states in both languages,
backgrounds and fonts, transition midpoints, live controls, visible text pairs,
layout contracts, nonempty WebGL output and offline requests:

```sh
python3 tools/build-spatial-biology.py --check
V3_BROWSER_TESTS=1 V3_BROWSER_CHANNEL=chrome node --test tests/spatial-biology.cjs
```

Set `V3_BROWSER_OUTPUT` to an output directory to retain its report and screenshots.
These are sampled browser checks; they do not certify every continuous frame or
physical-device gesture.
