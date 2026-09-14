# Molecular animation check

## Create and open

`python3 create.py /absolute/new/project --template molecular-check --title "Проверка молекулярных элементов" --palette ocean`

The independent project contains seven specimen scenes: H3 tail, Mediator, Pol II initiation complex, Cas12a, Cas13a, pre-mRNA and spliceosome. Build with `python3 build/bundle.py`; the standalone output is `dist/lesson.html`. The optional supplied example is `examples/molecular-check.html`; rebuild or compare it with `python3 tools/build-molecular-check.py` or `--check`.

## Review cycle

The shell's next/previous controls select specimens. Within each scene, **Play cycle** animates the same drawing through initial, intermediate, changed, enlarged/focused and reset views. **Pause**, the progress slider, **Reset** or opening a detail cancel the same local driver. Replaying starts a new controlled run; old callbacks cannot resume a paused frame. No deck steps are silently advanced by the local scrubber.

Every specimen has bilingual description, notes and a source link. Colors and fonts remain live. Click the moving actor to inspect its current drawing. H3's chemical labels are included inside its captured group; its inspection bounds include those annotations. NH₃⁺ and N⁺ never appear simultaneously.

The percentages are positions in a visual test cycle, not protein activity, transcription levels or physical time. Cas lobe separation and spliceosome decomposition are explanatory views. Mediator has no numeric biological-state setter. Rewinding splicing or histone methylation replays the image; it does not represent an actual reverse reaction.

## Reuse the template

`starter/js/recipes/molecular-check.js` contains the specimen configuration and common renderer. It exports `MOLECULAR_CHECK.specimens`, `createSpecimen(v,spec)` and `register(spec)`.

Each specification supplies `actor` (constructor name in B), `name/enName`, optional state `parameter`, a valid focus `part`, `focus/enFocus`, base `scale`, PDB source ID and `meaning/enMeaning`. `createSpecimen({svg},spec)` returns `{actor,paint(progress),focusPart}`. Progress must be a finite number in 0–4; invalid input leaves the drawing unchanged. State, placement and emphasis are updated together, and persistent biological geometry is never replaced.

The chosen scales keep the current seven actors and their declared bounds between y207–526. Add a new actor by checking its largest state bounds at base and enlarged scales; do not copy a scale blindly. Put its scientific context and limitations in the specimen text. No automatic biochemical model is inferred from a parameter name.

## Inspect the checks

Append `?qa=1` on a local development server to expose developer-only frame buttons at 0, 25, 50, 75 and 100% and a genuine intermediate-frame capture. The helper is inert otherwise. Frame buttons send ordinary input through the same scrubber handler. The hidden `#check-qa` DOM output records current progress, shape identity, scale, declared stage bounds, measured L.audit text regions and any failures. This supports read-only browser inspection without modifying application globals from the browser console.

The capture button appears only after actual playback reaches an intermediate pose. The saved view is a clone of that rendered frame, not a reconstruction from endpoint values. A font-loading result with unmeasured text is not a pass; wait for `data-ready="true"`.

Node tests check state/scale round trips, persistent nodes, control cancellation and late completions. Generator tests check portability and optional script loading. Browser checks must separately verify glyph bounds, art/label clearance, real hit testing, language, theme and motion. Physical touchscreen gestures require physical-device testing.
