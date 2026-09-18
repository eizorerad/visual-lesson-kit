# Molecular view bricks

`MV` packages the reusable parts of the telomerase overview and close-up: a multi-chain trace, an atomic detail with a context locator, fitting, and cancellable camera controls. Use [molecular views](molecular-views.md) for the ready-to-assemble example and scene presets. This guide is for custom compositions.

Load `js/molecular-views.js` after `js/molecular-coordinates.js`, `js/film.js` and `js/lesson.js` (`MC`, `F`, `T`, and the normal `D`/`C` dependencies). No viewer package, GPU or network access is needed at display time. `MV` is a frozen namespace with four functions:

| Brick | Visible operation |
|---|---|
| `MV.assembly(parent, data, options)` | Rotate a whole supplied complex and emphasize its component chains or selected trace segments. |
| `MV.detail(parent, config)` | Show connected atomic fragments in one camera, optionally with their location in a context trace. |
| `MV.fit(data, options)` | Frame supplied coordinates in a chosen region, including asymmetric geometry. |
| `MV.rig(ctx, config)` | Connect numeric camera/emphasis state, guided steps, manual control, and scene disposal. |

Create actors once during scene construction; call `paint` to move the camera. Coordinates remain an immutable copy of the supplied source. Add labels with `L.textBox`/`L.contract`, anchored to returned projections. Camera movement does not calculate folding or enzymatic motion.

## Source identity and coordinates

Assembly and detail data require `pdb_id`, `source_sha256`, positive integer `model`, `coordinate_units`, `origin: [x,y,z]`, and a right-handed orthonormal `basis`. Preserve the actual source identifiers and hash; include `source_url` and relevant experimental limitations in your data and notes. Validation checks structural consistency, **not** whether a claimed source is scientifically accurate.

The camera uses [MC's convention](molecular-coordinates.md): orthographic projection, angles in degrees, positive screen y downward, `scale` in stage units per source unit. A view never rescales or replaces source coordinates. All detail parts and their supplied context must share the same PDB/source hash, source model, coordinate units, declared `altloc`, and basis. Two legacy records with `altloc` absent remain compatible; an absent selection is not assumed equivalent to explicitly declared blank-only (`''`) or a labelled alternate conformer. Record-set filters such as `records: ['ATOM']` may differ legitimately between chains and are not identity constraints. Parts may have different author chain IDs and default framing origins; `MV.detail` supplies one common camera origin to all parts. It rejects mixed sources and unaligned bases rather than silently aligning them.

All source rows have unique, nonempty IDs within their chain/part. Numeric `1` and string `"1"` cannot coexist in the same rows because they would produce ambiguous visible source identifiers. Use supplied explicit links; missing residues do not create links. Insertion-code or author numbering identifiers may be strings. The API never infers connectivity from proximity.

## Assembly

```js
const complex = MV.assembly(v.svg, data.assembly, {
  chains: {
    A: {color: C.blue, width: 1.5, opacity: .8},
    B: {color: C.gold, width: 3.2},
    N: {color: C.red, width: 4.5},
    M: {color: C.grey, opacity: .24},
    L: {color: C.grey, opacity: .24}
  }
});
const camera = MV.fit(data.assembly, {
  box: {x: 90, y: 200, width: 650, height: 340},
  padding: 18, angle: 25, pitch: 15
});
const out = complex.paint(camera, {
  opacity: {A: .2, B: .8},
  highlight: {B: ['B46', 'B47', 'B48']}
});
const position = out.project(complex.row('B', 'B47').xyz);
```

`data.traces` is a nonempty array of:

```js
{
  chain: 'B', atom: 'P',
  rows: [
    {id: 'B46', residue: 46, component: 'C', xyz: [/* source x,y,z */]},
    {id: 'B47', residue: 47, component: 'U', xyz: [/* source x,y,z */]}
  ],
  bonds: [['B46', 'B47']]
}
```

No chain names, PDB IDs, residue positions, or biological roles are hardcoded. The above chain mapping belongs to the example. Default width is `3.2` for `atom: 'P'`, otherwise `1.5`; default color is `C.gold` for P, otherwise `C.blue`. Defaults denote representation, not a claim that every P trace is RNA.

Chain styles support `color`, `width`, `opacity`, and `highlightColor`. Colors may be a nonempty CSS color string or a function `(rowId) => color`; functions are resolved at construction. Use semantic `C` colors so the CSS variables follow appearance changes.

`paint(camera, {opacity, highlight})` validates all coordinates/options before changing visible attributes. Both maps use chain IDs. `highlight[chain]` is an array of **trace row IDs**, not guessed residue numbers. Only explicit segments whose two endpoints are selected receive `highlightColor` (default `C.gold`) and opacity 1. Other segments retain the specified/default chain opacity. An empty selection clears highlighting. Opacity values are in `[0,1]`.

Returns `{g, data, row(chain,id), paint}`; `data` is a frozen independent source snapshot. Each paint returns `{project(xyz), row(chain,id)}`. Missing rows return `undefined`; check an optional selection before reading it. Line nodes persist and are sorted by average source depth each frame, with `data-mv-chain`, `data-mv-source-bond` (JSON endpoint IDs), and `data-mv-depth` for inspection. A trace is a skeletal representation, not a molecular surface.

The assembly renderer projects shared endpoints once per camera update and moves only the nodes needed to restore depth order. Equal-depth ties retain source order. Repainting an unchanged camera reuses its geometry; opacity/highlight changes update appearance without rewriting coordinates or reordering actors. Camera values, including mutable origin components, and emphasis are still validated on every call. Keep changes inside `paint` rather than editing its owned SVG actors directly.

Assembly actors are single unfilled SVG lines, so their alpha is stored as `stroke-opacity`, with pointer hit testing disabled below the usual visibility threshold. Applying CSS `opacity` to thousands of individual lines can create expensive compositing work; do not reintroduce it for these actors. `MV.detail` contains compound atomic shapes and keeps its separate opacity handling.

For new animated scenes, create the view once and drive it with `MV.rig`; avoid rebuilding SVG, replacing unchanged caption HTML, or appending every actor on every animation frame. `MolecularScenes` already preserves unchanged captions and numeric control readouts. Profile real transitions separately from layout audits and mutation-counting runs, since those instruments add work of their own. Frame rates depend on the browser, machine and source size; coordinate fidelity is not reduced to meet a timing target.

## Detail and context

```js
const detail = MV.detail(v.svg, {
  parts: [
    {id: 'rna', data: data.fragments.rna, color: C.gold},
    {id: 'dna', data: data.fragments.dna, color: C.red}
  ],
  context: {
    data: data.fragments.rna,
    selection: data.fragments.rna.residues.map(r => r.id),
    color: C.gold,
    box: {x: 95, y: 248, width: 225, height: 235},
    leaderX: 362
  }
});
const points = ['rna', 'dna'].flatMap(id =>
  data.fragments[id].residues.flatMap(r => Object.values(r.atoms)));
const camera = MV.fit(data.fragments.rna, {
  points, box: {x: 420, y: 220, width: 690, height: 300},
  angle: 25, pitch: 20
});
const out = detail.paint(camera, {
  detail: 1,
  parts: {dna: {opacity: .8}},
  contextOpacity: 1
});
const templateBase = out.anchor('rna', 48);
```

Each part has a unique author-chosen `id`, an explicit atomic record supported by [MC.rnaFragment](molecular-coordinates.md), optional `color`, and optional `focusIds`. This bounded renderer supports nucleic-acid depiction with supplied atom paths and glycosidic adjacency, including DNA when its actual deoxy atoms and component names are supplied. It is not a generic protein atomic renderer or a bond-perception engine.

Optional `context` uses the same source as the parts and requires `data.context` plus a nonempty `selection` (array or Set of existing context residue IDs). The locator shows the supplied modeled context, including its explicit gaps. A modeled subset must not be labelled the full sequence/complex. The context is a static overview: it does not inherit the close-up camera. `box` defaults to `{x:89.5,y:244,width:237,height:272}` and `leaderX` to `375`. Review actual leader/label clearance when changing these values.

`paint(camera, emphasis)` accepts common `{focus:0, detail:1}` and per-part overrides under `parts: {[partId]: {focus, detail, opacity}}`, plus `contextOpacity` (default 1). Every value is in `[0,1]`. `focus` fades residues outside that part's `focusIds`; opacity fades the entire part. All source coordinates and emphasis values are validated before any part is repainted.

Returns `{g, data, parts, context, paint, anchor(partId,residueId,camera)}`. `data` is the first part's frozen record, providing the common basis/default origin. `parts[id].row(residueId)` exposes immutable atom/centroid data. `context` is the locator group or `null`. Each paint returns `{parts, project(xyz), anchor(partId,residueId)}`; the output `parts[id]` is the corresponding MC paint result. An anchor is the projected supplied base center and rejects unknown parts/residues.

All atom, ring and bond nodes persist. After MC paints them, `MV.detail` sorts them together in one shared depth layer, across part boundaries. `data-mv-part` and `data-mv-depth` preserve part identity for inspection. **Paint through the detail composition**, not individual `parts[id].paint`; use the `parts` emphasis map for opacity. The internal MC groups are temporary paint hosts and are empty between frames, so changing their group opacity does not fade the visible part. These SVG depth-sorted primitives provide a readable depiction, not opaque-surface occlusion or photorealistic rendering.

## Fit

`MV.fit(data, {box, padding=12, angle=0, pitch=0, points?})` returns a plain `{origin,cx,cy,scale,angle,pitch}` camera. Geometry comes from all trace row coordinates, all atomic residue coordinates, or the explicit nonempty `points` array. Explicit points make a shared fit for several parts easy. Units and basis remain those of `data`.

Fit places the **projected bounds** at the center of the target box, rather than assuming the molecular centroid is its visual center. The padding must leave positive width and height. Degenerate point/line projections get a positive finite scale; a coincident point uses one source unit as its framing span. The default box is the kit drawing region `{x:60,y:147,width:1160,height:463}`. Include enough padding for stroke/atom radii; text is not part of the fit. The guarantee applies to the supplied angle/pitch. Refit at another angle or allocate a common framing margin when the rotation must stay within fixed bounds.

## Rig and guided/manual motion

```js
const state = {angle: 0, pitch: 0, proteinOpacity: .8};
const rig = MV.rig(ctx, {
  state,
  paint(s) {
    complex.paint({...camera, angle:s.angle, pitch:s.pitch}, {
      opacity:{A:s.proteinOpacity}
    });
    // Geometry, labels and captions all derive from this same state.
  },
  steps: [
    {to:{angle:32, pitch:24}, duration:1900},
    {proteinOpacity:.2}
  ],
  control: {
    root:v.root, label:'Ракурс', key:'angle', min:-35, max:55,
    x:150, y:554, width:560
  }
});
```

`state` must contain finite numeric fields; the rig retains this object. `paint(state)` runs immediately once and on every update. `steps` (default `[]`) contain numeric patches of existing fields or `{to: patch, duration}`. The default duration is `1900` ms; nonnegative per-step durations override it. All patches, duration values and control settings are checked before registering lifecycle callbacks or creating controls. State need not consist solely of camera fields: a numeric focus/emphasis/caption-progress field can be painted at the same time.

The optional control uses `T.control`. It requires `root`, a readable translated `label`, `min`, `max`; defaults are `key:'angle'`, `step:1`, `x:140`, `y:550`, `width:430`, `suffix:''`. A string `suffix` such as `'°'` is appended only to the visible output, leaving the input and state numeric. The range must contain the initial value and every guided value for that key. Keyboard/native range input interrupts the active local driver, updates state and repaints. The slider and output update during guided motion as well. Output rounds to two decimal places for legibility; the numeric state is retained at full precision.

Returns `{driver,state,control,paint,dispose}`. `control` is the T control or `null`. `driver` has `set`, `to`, `cancel`, and `dispose`, with F.driver's completion/cancellation semantics; it also enforces the chosen control range. `ctx.onDispose` receives the rig's idempotent disposal method. Disposal invalidates pending motion, disables the control, and ignores late input; it does not alter another scene's driver. No extra disposal registration is necessary. Normal shell gesture/accessibility behavior still applies; physical-device gestures require physical-device testing.

## Validation

`tests/molecular-views.cjs` checks source snapshots, explicit gaps and alternate chain/PDB identifiers, asymmetric/rotated fitting, errors before scene mutation, persistent actor identity, cross-part depth sorting, manual interruption and disposal. These are Node/jsdom contract checks. The complete example must also be built and visually checked in the real browser, including intermediate motion, RU/EN, appearance choices and label/line clearance.
