# Motion that preserves an object

Load `js/motion.js` after `js/film.js` and `js/layout.js`. The runnable recipe is
`starter/js/recipes/representation-journey.js` in the kit, or
`js/recipes/representation-journey.js` in a generated lesson.
It contains three connected scenes with complete RU/EN text, nine notes and three
questions: named records → feature rows → an xy plot → camera turn → supplied z.
It is a menu example, not part of the default thirteen-scene gallery. Replace the
episode script tags with this recipe to run it; keep `layout.js`, `perspective.js`
and the usual runtime dependencies loaded before the recipe.

Start with the operation the audience should follow. Write its persistent IDs,
source and values, the starting layout, the destination layout, and the reason for
the change. A fade is useful for a new explanation or an unrelated observation.
For rearrangement, aggregation, projection or coordinate disclosure, also show
the relevant change in geometry. Keeping invisible nodes in the DOM alone does
not establish continuity for the reader.

## One actor, several layouts

`F.motionTrack` wraps existing SVG `<g>` elements. It creates no marks, copies no
observations and does not schedule animation. A pose is `{x,y,scale:1,opacity:1}`;
the optional fields have those defaults. Translations and uniform scale keep
labels upright. Use a wrapper whose local origin is the identity mark, and keep
its label and any supplementary marks inside that wrapper.

```js
const a = F.group(stage), b = F.group(stage);
F.dot(a, 0, 0, 18, C.blue); F.label(a, 0, 35, 'A', 24, C.blue);
F.dot(b, 0, 0, 18, C.teal); F.label(b, 0, 35, 'B', 24, C.teal);
const track = F.motionTrack([{id:'A', node:a}, {id:'B', node:b}]);
const row = {A:{x:300,y:300}, B:{x:800,y:300}};
const column = {A:{x:550,y:270}, B:{x:550,y:440}};
const state = {move:0};
function paint() { track.between(row, column, state.move); }
const driver = F.driver(state, paint);
ctx.onDispose(driver.dispose);
paint();
ctx.step(() => driver.to({move:1}, {duration:2000}));
```

- `F.motionTrack(actors,{initial?})` accepts a nonempty array of unique `{id,node}`
  records. A node cannot belong to two IDs in the same track, and actors cannot
  contain each other. Without `initial`, construction does not reposition nodes.
- `track.set(poses)` applies a complete keyed layout immediately.
- `track.between(from,to,t,{via?})` interpolates the same IDs. Progress is clamped
  to 0…1; reverse and replay use the same supplied endpoints. `via` is an optional
  map of `{id:{x,y}}` waypoints. A quadratic path passes through each declared
  waypoint at t=0.5. Scale and opacity still interpolate linearly. The helper does
  not ease time; use `F.phase` or the driver for easing and ordered phases.
- `track.snapshot()` returns separate pose copies, or `null` before the first
  layout. All layouts require exactly the actor IDs; object-property order is
  irrelevant. Invalid/missing IDs, nonfinite coordinates, nonpositive scale,
  opacity outside 0…1, and overflowing intermediate geometry reject the entire
  update before writing DOM.

The track owns each wrapper's `transform` and opacity. Do not simultaneously call
`F.at` or another component's position setter on that wrapper. For example,
`K.sequenceTrack.setPositions` already owns its token transforms; either let that
component do the placement or deliberately transfer ownership to a track. For
independently controlled motions use separate state fields and `F.driver`
controllers, as in the recipe's camera and coordinate disclosure.

Use `via` to reserve space for motion, not to decorate it. First retract old row
details, then move the identity marks through separated paths, and finally show
the new axes/labels. The recipe's matrix-to-plot transition demonstrates this
order. A waypoint is a geometric midpoint, not a measured intermediate state.

Separated endpoints do not imply separated trajectories. Two cards swapping
positions on one horizontal line coincide halfway through a direct interpolation.
For an explanatory rearrangement, reserve separate lanes or move in stages; keep
the result annotation hidden until the actors leave its region. Sample the full
paths using the shapes' radii or bounds, including labels that travel with them.
The text inspector does not detect every circle, card or arrow occlusion. This
check applies to free teaching layouts: do not displace measured scatter points
merely to hide real overlap in the data.

## Continue an object across adjacent scenes

Mark the corresponding wrapper in both scenes with the same explicit identity:

```js
F.shared(actor, {
  id:'record-A',
  kind:'observation',
  label:'Record A',                // stable canonical label, not current locale
  source:'my-study/table-2',
  value:'0.3,0.5,0.2'               // optional scalar/string identity check
});
```

All four string fields are required and nonempty. `value` is optional: use a
finite number, a stable string encoding, or `null`. Matching requires identical
ID, kind, canonical label, source and value. Independent records, different
sources, a changed quantitative value, a sample and its average, or a sequence
and an independently predicted molecule must not be declared as one identity.
The marker expresses an author's checked claim; it cannot verify provenance on
its own. If values change as part of a calculation, teach that calculation
within a scene and update the declaration deliberately at the boundary.

Ordinary next/previous scene navigation then moves the incoming actor from the
outgoing actor's measured screen pose to its authored pose over 850 ms. The old
scene is still disposed immediately. No outgoing DOM, cloned label, overlay or
external timer remains. Canonical declarations are independent of translated
display text. When at least one actor matches, the player suppresses the whole
frame entry fade; unrelated content appears in its new authored state.

Only the matched wrappers move. A backbone or connector outside them stays at
its incoming authored coordinates and can temporarily detach from its tokens.
If that geometry did not exist in the previous view, keep it hidden until the
incoming scene begins its own connected transformation. If a whole graph is the
shared scientific object, consider sharing its common wrapper instead. Do not
register nested wrappers twice or label detached destination edges as current
bonds.

The bridge is deliberately conservative:

- Hidden actors and ambiguous duplicate IDs do not match. Nested shared wrappers
  are skipped to avoid applying motion twice.
- It needs measurable SVG screen matrices with upright translation and positive
  uniform scale. Missing, singular, reflected, skewed or rotated transforms and
  CSS transforms on the actor fall back to ordinary scene entry. It does not
  infer a new path or a scientific correspondence from visual similarity.
- Forward entry measures the initial state; backward entry measures the completed
  instant replay. Direct `D.deck.show`, hash navigation, and reduced motion remain
  instant. Scenes that do not call these APIs can omit the motion module.
  The shipped representation-journey recipe requires it because it calls
  `F.shared` and `F.motionTrack`.
- A new navigation, step, manual input, resize, font load, or language/appearance
  change cancels the bridge and restores the incoming actor's exact authored
  transform. Old animation callbacks cannot repaint a later scene. The track
  also cancels an active bridge if it takes ownership of an affected actor.

The player uses `F.motionBridge.capture/play/cancel` internally. Ordinary lesson
authors only need `F.shared`; keep scheduling in `F.driver` and the player.

## Compose layout with a camera

Project world coordinates into a keyed pose map. `K.spatialScene` can draw the
same camera's grid, axes, reference plane and guide segments while a motion track
positions existing identity groups:

```js
const camera = {cx:420,cy:480,scale:150,yaw:-18*state.tilt,pitch:-54*state.tilt};
space.setCamera(camera);
track.set(Object.fromEntries(records.map(record => {
  const [x,y,z] = record.xyz;
  const p = K.project3D([x,y,z*state.disclose], camera);
  return [record.id, {x:p.x,y:p.y}];
})));
```

First move the camera while `disclose=0`; then stop it, introduce the z axis, and
disclose the supplied third coordinate. Preserve the previous projection as a
shadow, keep axes and numerical units clear, and synchronize marks and readouts
in one `paint`. A camera changes the view of fixed coordinates. Disclosure shows
a value already present in the source. Neither recovers unmeasured depth from a
2D source image, computes UMAP, proves a class, or establishes a time trajectory.
See [perspective.md](perspective.md) for the projection convention and limits.

## Verify the transformation

Check a meaningful identity mark at initial, intermediate and final progress,
not only the count of nodes. Require actual coordinate/size changes where the
story claims a transformation. Test reverse/replay, direct jumps, interruption,
different sources with the same label, both languages, both fonts and reduced
motion. Measure text against its intended boxes after font loading; finite
geometry does not prove legibility. The recipe test samples 78 frames and checks
persistent actors, supplied values and movement. Bridge tests provide explicit
SVG matrices in jsdom; actual screen measurement and visual layout require the
browser checks described in [qa.md](qa.md).

## Read bridge activity for connected geometry

The incoming scene root exposes the public, read-only attribute
`data-motion-bridge-active="true"` while a timed bridge owns its actors'
transforms. The runtime sets it before the first bridge pose and removes it
when the authored transforms are restored on completion, cancellation or error.
This also covers a new navigation, a step, manual input, appearance changes and
backward entry into an instantly replayed scene. No-match entry, direct show,
zero-duration or instant playback, and reduced motion do not set the attribute.
Authors may read or select it; do not write it or use it to drive animation.

For a sequence whose tokens are shared individually, hide its separately drawn
backbone and pair edges while the tokens travel. A lesson can use this selector:

```css
[data-motion-bridge-active="true"] .sequence-track > path,
[data-motion-bridge-active="true"] .sequence-track > line {
  visibility: hidden;
}
```

The connectors return to their own authored visibility when the bridge ends.
This works in both navigation directions, including a backward replay where the
connections are already revealed. Leave the shared actor wrappers visible. The
attribute does not update connector coordinates; keep normal within-scene
geometry updates in the scene's `paint()`.

Also inspect the moving actors against the incoming scene's other content. A
matrix that fits beside the final molecule can still intersect tokens travelling
from the previous scene. Group that nonshared matrix, its ticks and annotations
and hide the group with the same scoped selector while the bridge is active.
Its authored visibility returns afterward. Do not hide the entire SVG or a group
containing shared actors. Inspect both directions at intermediate progress;
correct endpoints alone do not establish a clear transition.

## A narrator needs a story clock

For a long explanation, let the timeline run linearly and ease only the local operations:

```js
const state = {p: 0};
const driver = F.driver(state, () => {
  actor.place(startX + distance * F.phase(state.p, .1, .3), y);
  // Narration, graph and model state use the same state.p.
});
driver.to({p: 1}, {duration: 48000, ease: 'linear'});
```

`F.driver.to` accepts the easing names `linear`, `smooth`, `in`, `out`, `thereAndBack`, or an easing function. Omission preserves the existing smooth default. An invalid easing option fails before interrupting an active transition. Story progress is an authored explanatory parameter; measured physical time must be declared separately.

A sequence of finished drawings, even crossfaded or carried by a moving camera, does not demonstrate a mechanism. Give each stop an operation: electron allocation, site approach, concentration redistribution, graph tracing, vector addition, or an explicit change of scale. Preserve the identity mark during a change of scale. Retain the source as spatial context and finish one inset movement before another crosses it.

Write short narration cues independently from navigation chapters. Explain the action while it occurs, then leave a reading hold on the result. A review stop may compare unrelated notations, but each notation still needs its own demonstrated action. Electron-bookkeeping and equilibrium-ensemble transitions must be named as representations; do not imply a calculated chemical intermediate or a tracked kinetic history.

Verify the actual moving geometry at intermediate points, captions at cue anchors, exact conserved quantities, pause/resume, backward scrubbing and reduced-motion entry. An unchanged DOM or animated opacity alone does not pass this review. The chemistry template is the runnable example.
