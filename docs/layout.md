# Intended boxes, padding and measured text

Load `js/layout.js` after `js/lib/dom.js` and `js/lib/i18n.js`, before episodes. The optional global `L` leaves `S.text`, `T.text` and `F.label` unchanged. Those low-level functions remain single-line labels; they do not wrap or reserve space.

`L` distinguishes the outer box, its padding, and the measured content. A label staying inside the SVG viewport does not show that it fits its card. Every enclosed label needs the card's actual box, including its actual height. Do not infer a box from the label's font size.

When labels sit near axes, connectors or contours, also use the [label-clearance patterns](label-clearance.md). Reserving a text box does not automatically reroute strokes around it. Check the widest moving stroke, both font families and the entire relevant control range; preserve the scientific geometry while repositioning labels.

## Boxes and tracks

```js
const region = { x: 80, y: 180, width: 1120, height: 350 };
const inside = L.inset(region, 20);
const cards = L.columns(region, 3, { padding: 12, gap: 30 });
const bands = L.rows(region, 2, { gap: 24, weights: [1, 2] });
```

All values use the coordinate system of the drawing's parent. A stage uses 1280 × 720 units, regardless of its size on screen. Padding accepts one number or CSS-order arrays: `[vertical, horizontal]`, `[top, horizontal, bottom]`, or `[top, right, bottom, left]`. Gaps are explicit; weights divide the space remaining after padding and gaps. Weight arrays must be dense and positive; normalization avoids overflow when finite weights have a very large sum. Input objects are not mutated. Invalid sizes, negative spacing, non-finite derived coordinates, unrepresentable positive tracks, and padding that leaves no content area throw an error.

## SVG text inside a box

```js
const label = L.textBox(cardGroup, {
  id: 'encoder.description',
  x: 450, y: 270, width: 250, height: 110,
  text: 'Контекстное представление',
  size: 25, color: C.blue,
  padding: [14, 18], lineHeight: 1.4,
  align: 'center', valign: 'middle'
});
label.setText('Новый полный исходный текст');
F.opacity(label.el, progress);
```

The result exposes `el`, `setText(source)`, `setBox({x,y,width,height})`, `layout()` and `dispose()`. `align` is `left`, `center` or `right`; `valign` is `top`, `middle` or `bottom`. Optional `weight` and `className` set the font weight and SVG class. Defaults are size 25, padding 12, minimum line height 1.4, center/middle alignment.

Text wraps at word boundaries using browser `getComputedTextLength()`. Explicit newlines are retained. Each line is then measured at a common baseline. The baseline stride is at least `size × lineHeight`, and at least the combined measured ascent/descent envelope plus `lineGap`. The default gap is `0.08 × size`; an explicit `lineGap` uses local drawing units. This prevents lines from intersecting when a font's SVG rectangle is taller than its nominal em, and never reduces requested leading. The glyph bounding box determines vertical alignment after wrapping. The font size remains unchanged and the complete text remains present: a word wider than the content box, or too many lines, stays visible and is reported as overflow. Widen/rearrange the card or rewrite the label when it does not fit. The module does not silently split technical terms, shrink fonts, truncate, or hide content.

Always give `setText` the full source-language string. The primitive translates that full string with `D.i18n.text` before splitting lines, and excludes its generated descendants from the general translator. Translating separate `tspan` fragments would lose the exact full-sentence dictionary key. Construction, source-text changes, and watched language changes publish the current localized string synchronously, including while detached; unavailable geometry remains unmeasured. A mounted `setText` or `setBox` updates synchronously so a numeric label and its marks can agree in the same `paint()`; unchanged inputs do no work. Font/language changes retain the text element and surrounding actors; only its line children are updated. Move a containing group when animating the label and its box together, or update `setBox` when the intended location changes.

## Mounting, fonts and disposal

Call `L.watch(stageRoot, ctx)` once per scene; `F.stage` can own this call for its episodes. It schedules layout on the next animation frame, after synchronous scene construction and mounting. It listens for language changes, root font/style changes, completed font loads, and resizing. `ctx.onDispose` removes the observers, listeners, scheduled frame and all contracts/text boxes belonging to that scene. For a standalone specimen call the returned watcher's `dispose()` yourself.

`await L.ready(stageRoot)` is the browser QA fence: it first lays out the current localized string to request its fonts, waits for `document.fonts.ready`, waits for the next animation frame, then reflows and returns an audit. Call it after mounting and after font/language changes. `L.reflow(root)` performs synchronous layout and audit when fonts are already available. Do not measure detached construction nodes or substitute canvas character-count estimates for the rendered font. `layout()`/`setText()` do not rebuild a scene, navigate, or change animation state.

## Contracts for existing labels and HTML

```js
const remove = L.contract(existingSvgLabel, {
  id: 'input.sequence',
  box: { x: 110, y: 270, width: 225, height: 95 },
  padding: 12,
  space: labelGroup
});

L.contract(heading, {
  id: 'stage.title',
  box: { x: 60, y: 48, width: 1160, height: 94 },
  space: stageRoot,
  measure: 'content'
});
```

`contract` returns a function that unregisters it. The box may also be a function returning the current box. An omitted `space` means the node's parent. For SVG, `space` must be an SVG element: the audit transforms the label's `getBBox()` corners through the node's screen matrix and the inverse space matrix, so a translated/scaled parent does not mix local units and screen pixels. `textBox` registers its own box in its SVG parent's coordinates.

For HTML, explicitly use the stage root as `space`. The audit converts browser rectangle coordinates using that root's unscaled `offsetWidth`/`offsetHeight` and rendered rectangle. This supports the shell's translated, independently scaled x/y stage, not arbitrary rotated or skewed HTML containers. `measure: 'element'` is the default and checks the entire control/element rectangle. Use `measure: 'content'` for headings and captions: a DOM Range measures the actual text even when a fixed width or maximum height conceals overflow in the element's own rectangle. Mixed SVG/HTML geometry must not be compared without this conversion.

Account for inherited CSS limits when allocating controls. For example, the
standard `.lesson-buttons` region has a `470px` maximum width. If a deliberately
wider custom row is needed, set both its `width` and `maxWidth`, or use a layout
within the existing limit. A contract must describe the actual allocated row;
an inline width alone does not override a smaller CSS maximum.

## What the audit proves

```js
const report = await L.ready(stageRoot);
// report.issues: {kind: 'overflow'|'unmeasured', id, text, box, actual, ...}
// overflow.excess: {left, top, right, bottom}, in contract-local units.
```

`L.audit(root, { tolerance: 1, visibleOnly: true })` measures registered contracts without changing the drawing. Tolerance is in each contract's local units, not screen pixels. It reports `contracted`, `checked`, `skipped`, `unmeasured`, `results`, `issues` and `uncontractedText`. Ancestor opacity, `display` and `visibility` determine visibility; request `visibleOnly: false` to include hidden states. Missing/detached geometry or non-finite coordinate/containment calculations are **unmeasured**, never a successful fit.

`uncontractedText` lists visible SVG labels whose intended boxes remain unknown. A clean audit of two contracted labels cannot certify thirty uncontracted labels. The audit checks containment and padding, not pairwise collisions, stroke crossings, occlusion by front cards, scientific correctness, or all continuous animation frames. Check title/drawing/caption region separation, content within each card, and representative intermediate frames in the browser. Show contract coverage and unmeasured counts alongside any zero-issue claim.

The layout test suite uses synthetic SVG/HTML measurements because jsdom has no browser layout. One regression is grounded in the bundled fonts: HarfBuzz shaping of `Последовательность` at size 25 gives Source Sans 3 an advance of 230.525 and ink width 227.225, and Source Serif 4 an advance of 243.85 and ink width 242. A 225-unit card with 12-unit left/right padding provides only 201 units. The word exceeds both its intended content box and outer card while still lying well inside the 1280-unit viewport. Browser QA must verify the real rendered geometry separately.
