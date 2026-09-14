# Enlarged molecular details

## Accessible inspection

Load `molecular-inspect.js` after `molecular.js` and `interaction-regions.js`. `B.inspect(parent,actor,options)` places an accessible transparent SVG trigger over an existing actor. It does not create another biological entity: opening shows an enlarged captured view of the same drawing, explicitly labelled as such.

```js
const detail=B.inspect(svg,cas,{
  id:'cas-detail',label:'Рассмотреть Cas9',enLabel:'Inspect Cas9',
  title:'Cas9',enTitle:'Cas9',
  description:'Две доли окружают канал для нуклеиновых кислот.',
  enDescription:'Two lobes surround the nucleic-acid channel.',
  onOpen:()=>driver.cancel()
});
ctx.onDispose(detail.dispose);
```

The options `id`, `label`, `enLabel`, `title`, `enTitle` are required nonempty strings. Optional `part` names an existing `data-bio-part`. `detailBounds:{x,y,width,height}` crops in actor-local coordinates; absent an explicit crop, current `actor.bounds` is read when opening. `box` overrides the SVG activation rectangle in parent coordinates. The default rectangle follows the actor's current placement when `.setBox()` is called; authors must call this from their paint if an interactive actor moves. Browser SVG matrices map the four bounds corners through nested translation, rotation, scale and SVG viewports into the trigger parent's coordinates. The resulting trigger is an axis-aligned rectangle. Environments without SVG matrices fall back to the actor's own `x`, `y` and positive uniform `scale`; they cannot establish nested-transform geometry. Keep hit regions disjoint and disable/remove them when an actor is not visible.

The return value contains `trigger` (a `T.svgButton`), `open`, `close`, `dispose` and `setBox`. `dispose()` is idempotent and closes any owned detail. Only one molecular detail is open at a time. Opening optionally calls `onOpen`, which the gallery uses to cancel the active animation at its current pose. Escape or Close removes the view and restores trigger focus; Tab remains in the detail. Keyboard events inside the view do not navigate lesson steps. The generic evidence-layer CSS provides responsive layout and live colors/fonts.

The captured SVG strips duplicate IDs, retains the actor's orientation in the source SVG, and uses non-scaling strokes in the enlarged view. Uniform ancestor scales contribute to the captured ink width; page and viewport zoom cancel out. Existing non-scaling strokes retain their width, including inline `stroke-width` styles. For nonuniform scale or skew, the snapshot uses the geometric mean of the two scale factors for a single ink width; it does not reproduce direction-dependent stroke distortion. Current actor and ancestor opacity, display and visibility are retained: dimming another part never reveals a hidden ligand, methyl group or contact. The drawing does not update while open; close/reopen to capture a later state. This is a detail viewer, not an atomic structure viewer or a dynamics calculation.

Captions and labels drawn outside an actor are not automatically copied. In particular the current H3 chemistry specimen keeps its NH₃⁺/N⁺/CH₃ labels in the scene and already is a close-up; do not apply the generic inspector to its bare actor without supplying the missing chemical explanation. Use brief object titles and full bilingual descriptions.

## Shared gallery definitions

Load `molecular-gallery.js` before any molecular recipe. `MOLECULAR_ATLAS.add(id,title,enTitle,captions,enCaptions,notes,enNotes,url,sourceLabel,draw,options)` collects `{content,draw}` in `entries`. It also registers the scene unless a host lesson exposes `window.H.atlas === false`; this lets a host reuse selected definitions without registering the whole atlas. IDs must be unique and both languages must have a caption and note for every state. Optional `options.qa` and `options.enQa` replace the default structure question.

`draw(v,ctx)` creates persistent geometry and returns `paint(state)` with `state.p` indexing states. It may return `inspect:[{actor,label,enLabel,title,enTitle,description,enDescription,...}]`; the gallery attaches controls, cancels the animation before capture, and disposes them with the scene. `MOLECULAR_ATLAS.attachInspection(v,ctx,api,driver)` supplies the same behavior to host lesson registrars. It returns a refresh function: call it after every paint to follow actor bounds and disable triggers while an actor is hidden or has been removed from the scene SVG. Visibility follows rendered styles, including `F.opacity`, inline styles, stylesheet rules and hidden ancestors. The shared gallery does this automatically. Every enclosing SVG with role `img`, including nested viewports, temporarily uses role `group` so assistive technology can reach those buttons; each original role returns when its last inspector is disposed.

The three source recipes independently cover the original molecules, histone/PIC regulation, and RNA/Cas/splicing. Each scene preserves RU/EN notes, questions and scientific sources. They are optional teaching compositions, not a compulsory order for a new lesson.

## Verification

Focused Node tests check source identity, effective stroke widths, duplicate ID removal, hidden-part and ancestor visibility, moving bounds, gallery visibility refresh, dialog language changes, Escape and Tab behavior, focus restoration, single-dialog ownership and disposal. Matrix tests supply screen matrices because jsdom has no SVG geometry engine; browser QA must additionally inspect real nested-transform hit testing, font layout, the selected crop, responsive reading and the actual captured drawing. Automated DOM tests alone do not establish physical touchscreen behavior.
