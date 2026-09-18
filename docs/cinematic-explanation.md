# Cinematic explanation: preserve the object, pace the cause

This recipe records the visual style and motion of the six `story-*` scenes in the RNA prediction lesson. It is an authoring recipe for other subjects, not a new animation engine or a global easing preset. Use it when a viewer needs to follow how a contribution, constraint or representation produces a result. The complete RNA example is available through the `rna-prediction` template; the small scene below uses only the general kit APIs.

The portable pattern is **recognize an object → clear space → carry its meaning into the operation → let it settle → reveal the result**. A persistent source, one moving focus and a short interpretation make the operation readable. The subject can be a term in a sum, a record entering a group, a constraint entering a model, or the same observations acquiring a different layout.

## Appearance and hierarchy

The source lesson sets `LESSON.appearance` to `{background:'black', palette:'ocean', font:'sans'}` and starts in Russian, with a complete English version. These are author defaults, not requirements for every lesson. The general kit defaults to black / warm / sans; request `--background black --palette ocean --font sans` when creating another lesson with this appearance. Saved reader choices take precedence over author defaults.

- Keep the 1280×720 stage and x60–1220/y147–610 drawing region. The title is above it; one short explanatory caption sits below it. The standard title is 39 units, the caption 25. Leave sources and detailed qualifications in the notes while retaining labels and units needed to read the diagram.
- Use live semantic colors: `C.white` for main text, `C.grey` for secondary context, `C.blue` for primary objects, `C.teal` for a second meaningful role, `C.gold` for the active contribution or result. These names resolve to theme roles; they are not fixed colors. Preserve identity through labels, shape and position as well as color.
- Prefer open space, fine contours and a small number of emphasized marks to a screen of bordered cards. In the source stories, supporting text is often 17–24 units, conceptual labels 25–30, and important values 30–34. Those are observed choices, not permission to shrink text to fit.
- Give every label an intended region with `L.textBox` or `L.contract`. The source's `RNA.box` is a thin `L.textBox` wrapper with zero padding and requested line height 1.22. Its surrounding layout supplies the breathing room. The underlying layout engine still applies its measured line-height safeguards.
- Keep Source Sans 3 as the initial font and retain the selectable Source Serif 4, both languages, live backgrounds and the compact five-control shell. Appearance changes must not reset the scene.

See [theme.md](theme.md), [layout.md](layout.md) and [label-clearance.md](label-clearance.md) for the underlying contracts.

## Object permanence and causal motion

Construct actors once in `build()`. `paint()` derives their positions, visibility, labels and readouts from finite numeric state. Do not append a fresh diagram each frame or accumulate offsets; replaying or directly opening a state must produce the same geometry.

The RNA stories preserve sequence letters, residue indices and pair identities while the drawing changes. A pair map becomes a hairpin without changing its pairs. A numeric motif contribution travels from the highlighted motif to its term in the sum. Alignment evidence leaves the selected columns and arrives on the corresponding pair arc. Ensemble contributions arrive at one indexed pair, with the displayed total derived from the same progress.

Apply that distinction in another subject: a moving value token is a representation of a contribution, not an extra observation. A copied candidate is a competing hypothesis, not a new biological replicate. A camera turn changes the view, not the data. Curved travel can make the path legible, but does not imply a measured physical trajectory.

Use existing data-dependent anchors for departure and arrival, rather than unrelated decorative arrows. The ensemble scene uses the actual donor pair midpoint and the receiving pair midpoint. Its tokens follow an interpolated path with a `−44 * sin(π * progress)` vertical bow. The alignment scene uses quadratic Bézier paths. These are authored explanatory paths, not constant-speed paths or simulations.

## The actual time curves

The source `RNA.mount` calls `driver.to(patch, {duration})` without an `ease` override. Therefore its six stories use the existing `A.ease.smooth` curve. For normalized elapsed time `u` in [0,1], this is quintic smootherstep:

```text
S(u)   = 6u⁵ − 15u⁴ + 10u³
S′(u)  = 30u²(1 − u)²
S″(u)  = 60u(2u² − 3u + 1)
```

`S(0)=0`, `S(1)=1`, and both `S′` and `S″` are zero at the endpoints. A scalar value `x=x₀+Δx S(t/T)` therefore starts and ends with zero velocity and acceleration when joined to a stationary hold. Its peak normalized velocity is 1.875 at `u=.5`; physical velocity and acceleration scale as `Δx/T` and `Δx/T²`. The implementation evaluates the upper half by symmetry to avoid floating-point cancellation beyond 1; it is the same polynomial mathematically.

`F.phase` uses a **different**, cubic curve. With `q=clamp((p−a)/(b−a),0,1)`:

```text
F.phase(p,a,b) = H(q) = 3q² − 2q³
H′(q)  = 6q(1 − q)
H″(q)  = 6 − 12q
```

The cubic has zero endpoint velocity, but its interior endpoint second derivatives are +6 and −6. When clamped to stationary holds, it is continuously differentiable but generally not twice continuously differentiable at its phase boundaries. Do not describe `F.phase` itself as having smooth acceleration into and out of each hold.

The source often composes these two curves: a 0→1 driver field has `p=S(u)`, then geometry uses `H(clamp((p−a)/(b−a)))`. Thus `.2` and `.9` in `F.phase(state.move,.2,.9)` are thresholds in eased **state progress**, not 20% and 90% of elapsed time. Their wall-clock locations are `T·S⁻¹(.2)` and `T·S⁻¹(.9)`. Nested `F.phase` calls reshape the schedule again. At an internal cubic boundary where `S′` is nonzero, the composed motion can still have an acceleration jump; the outer quintic does not remove it.

For a differentiable path `r(p)`, velocity also depends on `r′(p)`, and acceleration includes `r″(p)(dp/dt)²`. Easing a parameter therefore does not guarantee constant spatial speed, uniform acceleration, or smoothness at a path corner. Preserve the original path, phase windows and duration together when matching an existing motion.

`driver.to(patch,{duration,ease:'linear'})` is available when a new scene needs phase boundaries to be fractions of wall-clock time. That is an intentional pacing choice; it does **not** reproduce these six stories. Keep the global engine and its default easing unchanged. See [interaction.md](interaction.md) for controller behavior.

## Durations in the six source stories

These are literal per-step milliseconds at 1× speed. They exclude time the viewer spends reading between steps and the shell's separate scene-entry effect.

| Scene ID | Step durations in source order | Sum of authored transitions |
|---|---|---|
| `story-thermo-score` | 2700, 2400, 2600, 5700, 2100, 1500 | 17.0 s |
| `story-thermo-search` | 2800, 2000, 2300, 3500, 3100, 1500 | 15.2 s |
| `story-thermo-shape` | 3600, 3100, 3100, 1900 | 11.7 s |
| `story-ensemble` | 2200, 1900, 1900, 4200, 2400 | 12.6 s |
| `story-alignment` | 2300, 2400, 2800, 2200, 3000, 3000, 2900 | 18.6 s |
| `story-alignment-shape` | 2700, 2600, 2600, 2400 | 10.3 s |

The complete range is 1500–5700 ms. Many single operations take roughly 1900–3100 ms; larger representation changes reach 3500–3600 ms. The 4200 ms ensemble step contains several ordered transfers; the 5700 ms energy step reads three further motifs in sequence. Retain those longer budgets when retaining their nested actions. Do not set every transition to the controller's generic 1700 ms default.

The animation scheduler divides duration by the selected playback speed. Reduced motion, instant replay and `duration:0` paint the final state without this paced motion. The player's 240 ms entry fade is a separate shell behavior; it does not supply the scientific explanation.

## Clear, move, then reveal

Reserve distinct intervals for outgoing labels, travel and incoming labels. A clean endpoint is insufficient: the labels may collide halfway through.

Three exact examples from the source show how the rhythm also protects readability:

1. **Energy score.** A term fades in on its local progress 0→.12; travel uses `.2→.9`; its name appears at `.92→1`. For the final sum, term names disappear on `sum=0→.25`, tokens disappear on `0→.48`, the arithmetic appears on `.49→.62`, and the total on `.65→1`. The three later motif terms have separate outer windows `0→.31`, `.34→.65`, and `.68→1` within the 5700 ms step.
2. **Alignment compaction.** Outgoing column indices clear on `sweepA=0→.025`. The layout compacts on `0→.20`; incoming compact indices appear on `.20→.28`. The same label actors survive, but their crossing paths are hidden until they settle.
3. **Ensemble transfer.** Candidate diagrams contract on `flow=0→.33`, and their source layer fades on `.33→.55`. The receiver appears on `.27→.52`. Three token flights use `[.34+.06k, .70+.075k]` for `k=0,1,2`; their visible tokens fade near departure/arrival. The temporary running percentage disappears on `.84→.91`, while the permanent pair label appears on `.85→1`. Their spatial separation and opacity overlap need inspection as well as the endpoints.

These windows belong to the existing eased state. Copying only the numbers into a linear-clock scene changes the perceived timing.

For one actor that enters and later leaves, make one opacity assignment: `enter * (1 - leave)`. Two writes such as “show” followed by “hide” overwrite each other. Keep future labels inside the same visibility group. When revealing a stroke with `F.revealStroke`, use a parent group for an independent fade, since the stroke helper owns the stroke node's opacity.

## A small scene for another subject

Put this code in `js/episodes/contribution-story.js` in a newly generated lesson and add its script tag after the runtime modules, before `player.js` and `boot.js`. It registers one optional scene and needs no RNA module. The example is explicitly invented: a known contribution joins an existing total. Replace the values and interpretation together for a real subject.

```js
(function () {
  'use strict';
  const id = 'contribution-story';
  const tr = (ru, en) => {
    D.i18n.pack('en', {strings: {[ru]: en}});
    return ru;
  };
  const title = tr('Как вклад входит в сумму', 'How a contribution enters a sum');
  const chapter = tr('Один видимый шаг', 'One visible operation');
  const status = tr('Придуманный числовой пример', 'Invented numerical example');
  const captions = [
    tr('У записи B вклад +3. Текущая сумма равна 4.',
       'Record B contributes +3. The existing total is 4.'),
    tr('Перенесём тот же вклад к сумме.',
       'Carry the same contribution to the total.'),
    tr('4 + 3 = 7. Движение объясняет сложение.',
       '4 + 3 = 7. Motion explains the addition.')
  ];
  const notes = [
    ['Числа придуманы. B обозначает один вклад, а не новую выборку.',
     'The numbers are invented. B denotes one contribution, not a new sample.'],
    ['Тот же знак B перемещается; исходное значение +3 сохраняется.',
     'The same B actor moves; its original +3 value is retained.'],
    ['Сумма вычислена из заданных чисел. Путь знака не является физической траекторией.',
     'The total comes from the supplied numbers. The actor path is not a physical trajectory.']
  ];
  const question = tr('Создаёт ли движение новое наблюдение?',
                      'Does the motion create a new observation?');
  const answer = tr('Нет. Один и тот же вклад B входит в сумму один раз.',
                    'No. The same contribution B enters the sum once.');
  D.i18n.pack('en', {
    notes: {[id]: notes.map(n => F.note(n[1]))},
    qa: {[id]: [{q: 'Does the motion create a new observation?',
      a: 'No. The same contribution B enters the sum once.',
      source: 'Invented numerical example'}]}
  });
  D.deck.register({id, title, chapter,
    notes: notes.map(n => F.note(n[0])),
    qa: [{q: question, a: answer, source: status}],
    build(ctx) {
      const v = F.stage(ctx, title, chapter, status);
      const state = {move: 0, result: 0};
      function words(parent, key, x, y, width, height, ru, en, size, color) {
        return L.textBox(parent, {id: id + '.' + key, x, y, width, height,
          text: tr(ru, en), size, color, padding: 0, lineHeight: 1.22});
      }
      const source = words(v.svg, 'source', 90, 210, 400, 64,
        'Известный вклад', 'Known contribution', 28, C.white);
      words(v.svg, 'receiver', 690, 210, 400, 64,
        'Текущая сумма: 4', 'Existing total: 4', 28, C.white);
      const actor = F.group(v.svg); // Construct once; keep its identity.
      actor.dataset.recordId = 'B';
      const ring = F.dot(actor, 0, 0, 62, C.bg);
      ring.setAttribute('stroke', C.gold);
      ring.setAttribute('stroke-width', 2);
      words(actor, 'token', -59, -24, 118, 48,
        'B: +3', 'B: +3', 30, C.gold);
      const arrived = words(v.svg, 'arrived', 680, 440, 420, 64,
        'Вклад сохранён', 'Contribution retained', 25, C.teal);
      const result = words(v.svg, 'result', 390, 530, 500, 66,
        '4 + 3 = 7', '4 + 3 = 7', 34, C.gold);
      function paint() {
        const t = F.phase(state.move, .18, .78);
        F.at(actor, F.lerp(290, 890, t), 355 - 60 * Math.sin(Math.PI * t));
        F.opacity(source.el, 1 - F.phase(state.move, 0, .16));
        F.opacity(arrived.el, F.phase(state.move, .82, 1));
        F.opacity(result.el, state.result);
      }
      const driver = F.driver(state, paint);
      ctx.onDispose(driver.dispose);
      paint(); // F.driver does not perform the initial paint.
      v.caption(captions[0]);
      ctx.step(() => {
        v.caption(captions[1]);
        return driver.to({move: 1}, {duration: 2800});
      });
      ctx.step(() => {
        v.caption(captions[2]);
        return driver.to({result: 1}, {duration: 1900});
      });
      return v.root;
    }
  });
})();
```

This uses the source's outer quintic timing and nested cubic travel interval, while its content and geometry are independent of RNA. It has one note per state and registers English text, notes and QA. `F.stage` owns `L.watch`, so its text boxes and observers are cleaned up with the scene. The example is an authoring starting point: inspect its rendered layout after fonts load in the promised appearance modes before shipping it.

## Cancellation and synchronized state

Use `F.driver(state,paint)` and register `ctx.onDispose(driver.dispose)`. Any slider or other manual control calls `driver.set({move:value})`, rather than mutating state during an active transition. `set`, a superseding `to`, and `cancel` invalidate that driver's old writes and settle its pending promise with `{completed:false}`. The shared scheduler may drain an invalidated tween, but it no longer paints or calls its completion callback. Other controllers keep running.

`cancel()` preserves the current state and permits later use. `dispose()` is idempotent, cancels the pending operation and prevents later `set`/`to`. Only successful completion runs `after`; an external promise chain must check `result.completed` and scene lifetime before continuing. `paint` should update geometry and numeric readouts together from the same state. Do not use an unconditional `.then(...)` to reveal a result after a canceled operation.

The player already handles instant reconstruction, interrupted navigation and reduced motion. Preserve that contract instead of introducing independent timers or CSS animations for meaningful actor motion. See [interaction.md](interaction.md).

## Fidelity and verification

The source and central kit use the same `A.ease.smooth` polynomial, `F.phase` windows, scheduler and default driver easing. The current central driver additionally preserves unchanged fields exactly instead of letting interpolation introduce floating-point drift; this does not alter the specified time curves. The source lesson's common helper changes selected episode order and chapter assignment while retaining the same duration-forwarding contract. No missing engine curve needs to be ported.

Faithful reuse therefore preserves the story modules, supporting actors/data, scene mounting order, durations, phase windows and author appearance defaults. It does not require replacing the central engine or changing its default curve. Independently authored actors may use similar timing, but should not be presented as a frame-for-frame reproduction of the RNA lesson.

Before delivery, check initial and final states, direct state replay, representative intermediate frames around each fade boundary, interrupted navigation, and manual interruption if controls are present. After `L.ready(root)`, inspect RU/EN with both font families and backgrounds. Report contracted and unmeasured text as well as overflow; text containment alone cannot establish clearance from a moving line. Confirm that no stale completion changes the new scene, then build and check the standalone file. Follow [qa.md](qa.md) for the export workflow and the `export-qa` navigation card for the current verification entry points.

## Continuous film and explicit reading holds

The [tRNA journey](trna-journey.md) extends this style into a continuous 398-second film. Its [CinemaTimeline](cinema-timeline.md) separates incoming motion from settled reading time and delays detailed captions until the depicted evidence is visible. The complete template includes configurable episode selection, exact pause/seek, source-backed atoms, contacts and a sphere renderer with per-pixel depth. Those are opt-in components, not a change to the global motion defaults.
