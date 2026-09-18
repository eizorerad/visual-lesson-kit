# Continuous film timeline

`CinemaTimeline` separates motion, settled reading time and caption readiness. It is a pure numeric utility: no DOM, tRNA, molecular coordinates or animation scheduler is required. Load `js/cinema-timeline.js`; use `js/trna-cinema.js` and `css/trna-cinema.css` only if you also want the supplied film controls.

## Compile and sample

```js
const baseline = {x: 200, emphasis: 0};
const catalog = [
  {key: 'recognize', motion: 0, hold: 5,
   target: {x: 200, emphasis: 0},
   titleRu: 'Один объект', titleEn: 'One object'},
  {key: 'move', motion: 4, hold: 6,
   target: {x: 850, emphasis: 1},
   titleRu: 'Положение меняется', titleEn: 'Position changes',
   approachRu: 'Следим за тем же объектом.',
   approachEn: 'Follow the same object.',
   captionRu: 'Объект переместился, сохранив свою идентичность.',
   captionEn: 'The object moved while retaining its identity.'}
];
const cues = CinemaTimeline.compile({baseline, catalog});
const duration = CinemaTimeline.duration(cues); // 15 seconds
const frame = CinemaTimeline.sample(cues, baseline, 7);
// frame.values: interpolated x/emphasis
// frame.cue: incoming cue index; frame.transition: linear motion progress
// frame.captionPhase: 'approach' or 'detail'; frame.captionOpacity: 0..1
```

The first target appears at time zero and is held for its `hold`. Each later cue begins at `previous.time + previous.hold`, reaches its target after `motion`, then holds. `cue.time` is the settled endpoint; `cue.arrive` is the beginning of its motion. The final hold is included in total duration. Direct seeking and replay derive values from the same targets, without accumulating offsets.

Every `target` must contain exactly the finite numeric fields in `baseline`. The catalog and route need unique, nonempty keys. The route must contain at least one cue. Holds are finite and nonnegative; incoming motion after the first cue is strictly positive. The first cue is immediate even if selected from later in the catalog; an explicit first-cue motion override must be zero. Total duration must be finite and positive. Positive motion and hold increments must remain representable at the accumulated timestamp; the compiler rejects increments lost to floating-point precision. Invalid fields, unknown cue keys, repeated route keys and malformed timings throw descriptive errors.

`compile` copies and freezes active cue/target records. Extra catalog metadata such as `sourceKind` remains attached; do not put mutable source geometry in that metadata. Reordering selects full targets rather than applying differences against an unrelated previous cue.

## Change order, timing and text

```js
const cues = CinemaTimeline.compile({
  baseline, catalog,
  route: ['recognize', {key: 'move', motion: 6}],
  overrides: {
    move: {hold: 8, text: {
      ru: {title: 'То же имя, другое место'},
      en: {title: 'Same identity, another position'}
    }}
  }
});
```

Omitting `route` uses catalog order. A string selects defaults. An object accepts `key`, `motion`, `hold`, and `text`; local route values override `overrides[key]`. Text accepts `ru` and `en`, each with `title`, `caption`, `note`, `approach`; a leaf replaces the corresponding `titleRu`, `titleEn`, etc. in the compiled cue. Unspecified text retains the catalog value. The compiler is independent of translation rendering: provide both languages and render the matching fields.

## Curves and caption timing

Default sampling uses quintic smootherstep, `6u⁵ − 15u⁴ + 10u³`, with zero first and second derivatives at the motion endpoints. `sample(cues, baseline, time, ease)` also accepts an easing function that returns finite values in [0,1]. `time` must be finite; values outside the film duration are clamped. Pass the same baseline schema used for compilation.

The incoming cue becomes current when its motion starts. Its heading and note can therefore announce the topic immediately. The detailed caption begins fading in when **eased progress** reaches .95. Before that, `approachRu/En` provides an optional introduction; without one, lower-caption opacity is zero. On a settled hold, the detailed caption has full opacity. A painter must update caption text on both cue and phase changes, and re-render it on language change. Title, note, timeline and hash must use the same sampled cue.

This threshold expresses an authoring decision, not a general visibility detector. Camera paths, reveal windows and text length still need actual intermediate-frame inspection. `F.phase` remains a separate cubic window; its thresholds are state progress, not necessarily elapsed-time fractions. See [the motion style recipe](cinematic-explanation.md).

## Connect the film controls

Inside a registered scene's `build(ctx)`, create persistent actors and a state `{time: 0}`. Let a cancellable `F.driver(state, paint)` call a painter that samples the timeline and updates geometry, text and controls in the same paint:

```js
let controller;
const state = {time: 0};
function paint() {
  const frame = CinemaTimeline.sample(cues, baseline, state.time);
  // Update your existing actors from frame.values here.
  // Update the title and approach/detail caption using frame.cue/phase.
  controller?.update();
}
const driver = F.driver(state, paint);
ctx.onDispose(driver.dispose);
controller = Cinema.mount(ctx, {
  root: sceneRoot, state, driver, cues,
  duration: CinemaTimeline.duration(cues),
  narrativeIndex: time => CinemaTimeline.sample(cues, baseline, time).cue
});
cues.slice(1).forEach((cue, index) =>
  ctx.step(() => controller.go(index + 1, true)));
paint();
```

`sceneRoot` is the real DOM root returned by your scene, for example `F.stage(...).root`. Register one note per cue, translate it through the normal kit API, and dispose your actors separately. `Cinema.mount` registers its own disposal with `ctx`. The existing five-control shell, `deck.js`, `player.js`, `F.driver` and scene CSS must be present. The tRNA template is the complete working integration; the snippet above illustrates wiring, not a standalone HTML document.

The returned controller provides `play()`, `pause()`, `seek(seconds)`, `go(index, animate = false)`, `current()`, `update()` and `dispose()`. It also appears as `window.CINEMA`; `TRNA_FILM` remains a compatibility alias. Mount one continuous film controller at a time. Manual seeking cancels playback; pause retains the exact numeric frame. Space/K toggles playback, arrows move between cues, Home/End seek to the film boundaries, and arrow keys on the range input seek by one second or five with Shift.

Use the current library `deck.js` when transferring these controls to an older project. `D.deck.syncPlaybackStep(step)` synchronizes notes and hash without rebuilding actors or executing the authored step; it must be called only for an already-painted attached scene. `Cinema` checks `deck.root() === sceneRoot` before doing this. It returns whether the cue changed and rejects invalid cue indices. The opt-in `--cinema-bottom-reserve` CSS property leaves space for the timeline; ordinary step lessons keep their existing fit.

## Verification

Pure library regressions: `node --test tests/cinema-timeline.cjs`. Controller integration in a generated project: `node qa/trna/cinema.cjs`, using optional Playwright and an installed browser. The [tRNA guide](trna-journey.md) covers full scientific, playback, layout, depth and remix checks. A frozen numerical frame alone does not establish readable labels or scientifically valid ordering.
