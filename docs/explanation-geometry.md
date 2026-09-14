# Exact anchors and quiet guides

Load `js/explanation.js` after `js/film.js` and `js/patterns.js`, before episodes.
It adds two optional helpers to `K`: a pure rectangular-frame anchor and a
persistent SVG guide. They use the parent's coordinates, normally the lesson's
1280 × 720 stage units. Neither helper schedules animation, measures a label,
infers a scientific relationship, or changes the styles of other primitives.

## Attach to the actual frame

```js
const input = {x: 120, y: 250, width: 240, height: 120};
const output = {x: 760, y: 320, width: 260, height: 140};
const connector = K.guideSpan(stage, {
  from: K.boxAnchor(input, 'right'),
  to: K.boxAnchor(output, 'left')
});
```

`K.boxAnchor(box, side, fraction = .5)` returns a fresh `[x, y]` on the specified
edge of `{x,y,width,height}`. Use the same frame that draws the box, including
its full height; guessing a center from a text baseline makes connectors miss.
The helper does not mutate the frame.

| Side | Fraction runs from 0 to 1 | Fixed coordinate |
|---|---|---|
| `left`, `right` | Top to bottom | `x`, `x + width` |
| `top`, `bottom` | Left to right | `y`, `y + height` |

The default fraction `.5` is the edge midpoint. Fractions `0` and `1` select
corners. The frame must have finite numeric coordinates, positive finite width
and height, and finite right/bottom edges. Unknown sides and fractions outside
`[0,1]` throw. Fractions are not silently clamped.

Anchors describe an axis-aligned rectangle's geometric frame. They do not add
stroke-width offsets or intersect rounded corners, arbitrary paths, or rotated
frames. Supply all boxes and guide endpoints in the same parent coordinate
system. A box local to a moving/scaled group needs its current frame expressed
in the guide's parent, or the guide must share the appropriate wrapper.

The same anchor works with existing arrows when direction is meaningful:

```js
const arrow = F.arrow(stage, C.blue, 2);
arrow.set(
  ...K.boxAnchor(input, 'bottom', .75),
  ...K.boxAnchor(output, 'top', .25)
);
```

## A persistent guide or span

```js
const span = K.guideSpan(stage, {
  from: [240, 470], to: [860, 470],
  color: C.grey, width: 1.5, dash: [6, 4], tickSize: 12
});
span.setEndpoints([260, 470], [820, 470]);
```

`K.guideSpan(parent, options)` creates one group and one main `<line>`. Defaults
are `color: C.grey`, `width: 1.5`, `dash: [6,4]`, and `tickSize: 0`. The line's
coordinates remain the exact supplied endpoints. Explicit flat
`stroke-linecap="butt"` keeps its dashes thin and its ends unextended. The color
remains a live semantic token when the reader changes appearance.

With a positive `tickSize`, the group also contains two solid straight lines
centered exactly at the endpoints and perpendicular to the span. `tickSize` is
their **full length**, in parent units. Both ticks share the main line's color,
width and flat caps. No endpoint circles are created. A reversed or diagonal
span uses its actual direction; no horizontal-only assumptions are built in.

The returned object exposes:

- `g`, `line`, `ticks`: the group, main line and array of zero or two tick nodes.
- `setEndpoints(from, to)`: updates those same nodes and returns the same API.
- `snapshot()`: returns separate copies of `{from,to,color,width,dash,tickSize}`.

The component owns the line/tick geometry and the ticks' zero-length visibility.
Use `F.opacity(span.g, progress)` for a reveal. Style options are fixed at
construction; this small API has no style setter. Endpoint input arrays and
snapshots cannot change its internal state after a call.

If `from` and `to` coincide, the main line has zero length, so its butt caps
produce no dot. Existing ticks collapse to that point and are hidden because
there is no perpendicular direction. The same ticks become visible when the
span gains length again.

Both endpoints must be dense arrays of exactly two finite numbers. `width`
must be finite and positive; `tickSize` must be finite and nonnegative. `dash`
is a dense array of finite nonnegative lengths, with at least one positive value
unless empty. Use `dash: []` for a solid main line; SVG's ordinary repetition
rules apply to odd-length patterns. `color` must be a nonempty SVG color string;
use semantic `C` values for appearance support. Unknown options are rejected.
Nonfinite derived differences, lengths or tick coordinates also throw.
Construction validates all inputs before creating nodes. Invalid endpoint
updates leave both state and DOM untouched.

For a projection guide, ticks are usually unnecessary:

```js
const residual = K.guideSpan(stage, {
  from: [420, 260], to: [420, 460], color: C.grey
});
```

For an observed interval, a straight solid span can expose its exact limits:

```js
const observedRange = K.guideSpan(stage, {
  from: [xScale(minimum), 510], to: [xScale(maximum), 510],
  dash: [], tickSize: 10, color: C.blue
});
```

Keep the axis, units and meaning visible. A pair of ticks does not establish
that supplied limits are a confidence interval; the author supplies and explains
the calculation. A connecting line by itself does not establish causation.

## Recompute connections from the current pose

Create the guide once in `build()`, then update objects, connectors and any
current readout from the **same current state** in `paint()`:

```js
const state = {move: 0};
const initial = {x: 120, y: 250, width: 240, height: 120};
const target = {x: 480, y: 370, width: 240, height: 120};
const output = {x: 920, y: 270, width: 200, height: 140};
const card = D.dom.s('rect', {...initial, fill: 'none', stroke: C.blue});
stage.append(card);
const guide = K.guideSpan(stage, {
  from: K.boxAnchor(initial, 'right'), to: K.boxAnchor(output, 'left')
});
function paint() {
  const frame = Object.fromEntries(Object.keys(initial).map(key =>
    [key, F.lerp(initial[key], target[key], state.move)]
  ));
  Object.entries(frame).forEach(([key, value]) => card.setAttribute(key, value));
  guide.setEndpoints(K.boxAnchor(frame, 'right'), K.boxAnchor(output, 'left'));
}
const driver = F.driver(state, paint);
ctx.onDispose(driver.dispose);
paint();
ctx.step(() => driver.to({move: 1}, {duration: 1600}));
```

When using `F.motionTrack`, derive the frame from the pose applied in that
paint, including its scale, instead of using the destination pose throughout
the transition. Keep label boxes synchronized too: use `L.textBox` with the
current intended frame and reserve padding. See [layout.md](layout.md) and
[motion.md](motion.md). A separate connector is not automatically updated by
the cross-scene motion bridge; follow the bridge's visibility guidance when
its shared actors travel independently.

`node --test tests/explanation.cjs` checks coordinates, directions, persistent
nodes, copied state, degenerate spans and atomic validation, including sampled
forward/reverse movement. DOM tests cannot establish visual separation. Inspect
initial, intermediate and final states in a real browser in both locales, both
fonts and black/white appearance. Check that ticks, arrows and guides avoid
labels and unrelated objects; correct endpoints alone do not prove a readable
composition.
