# Auditing authored SVG hit regions

The development inspector (`build/inspect.html`) measures optional SVG button hit regions as well as its existing text geometry and intended-box contracts. **Measure current**, **Scan endpoints** and **Record next transition** include a separate `hitRegions` report. This code is development-only and is not bundled into the exported lesson.

The audit is read-only: it does not click, dispatch events, focus controls, invoke callbacks or change control state. Scene navigation performed by the inspector's existing sweep/record commands is unchanged. Inspect the state produced by an interaction manually, then measure it; the audit does not explore arbitrary interactions automatically.

## Opt in with a real hit rectangle

`T.svgButton` creates this metadata:

```html
<g data-vlk-button="choose-A" role="button" tabindex="0" aria-label="Choose A">
  <rect data-vlk-hit="choose-A"
        x="100" y="200" width="240" height="64"
        fill="transparent" pointer-events="all" aria-hidden="true"></rect>
  <!-- Visible label/content and any non-interactive focus ring. -->
</g>
```

Only `[data-vlk-hit]` rectangles are audited. Ordinary chart rectangles, labels and arbitrary elements with `role="button"` are not inferred to be hit regions. The nearest `[data-vlk-button]` group is the owning control; a direct parent SVG `g` is accepted as a fallback for an explicitly authored rectangle. Keep IDs useful for identifying a finding.

The inspector reads the hit rectangle itself, not a decorative border, focus ring or the union of its text. Its rendered `getBoundingClientRect()` supplies viewport coordinates, including translations and scale. Measurements from different local SVG spaces are therefore not mixed.

## What is checked

For each current, visible, enabled region:

1. Read its actual browser rectangle. Missing, detached, zero-size or non-finite geometry is **unmeasured**, never a passing rectangle.
2. Intersect it with the lesson iframe's viewport. Fully off-screen regions are skipped; partially visible regions are audited only over their visible rectangle.
3. Query the lesson document's `elementFromPoint` at the rectangle center and four corners inset by 10% of its width and height. A point is covered only when the browser's topmost hit element belongs to the owning SVG group. A label or other child of the same group is acceptable. An unrelated HTML overlay is a miss even if the SVG rectangle's coordinates look correct.
4. Compare the visible rectangles of different owners. Any positive-width **and** positive-height overlap is a finding. Touching edges or corners are allowed. Multiple marked rectangles belonging to the same owner are not treated as distinct competing controls.

Hidden ancestors (`hidden`, `aria-hidden`, display, visibility or effective opacity), inert ancestors and controls marked `aria-disabled="true"` are skipped with explicit counts. The decorative hit rectangle's own `aria-hidden="true"` does not hide its geometry: the helper's owning group carries the accessible name. `aria-hidden` on that owner or a containing scene still excludes it. An enabled control covered by a disabled sibling can still produce a coverage finding. Skipping a disabled control is not a verification of its disabled-event behavior.

The kit's known reading surface, `#notes.notes`, intentionally occupies the drawing in some layouts. Inert drawing states are skipped. When a sampled point instead lands on that visible reading surface, that point is recorded as skipped and the region is not counted as fully checked; its overlap comparisons are also omitted. Other points are still sampled, so a separate generic HTML obstruction is not hidden by the exception. The audit never treats an arbitrary frontmost HTML element as a harmless reading panel.

## Report and coverage counts

Each frame contains:

```js
{
  hitRegions: {
    marked, checked, unmeasured, skipped, disabled,
    checkedPoints, coveredPoints, skippedPoints, pairChecks,
    results, issues
  }
}
```

- `marked`: all opt-in nodes found in the current scene root.
- `checked`: regions whose five interior points were tested, including regions with failed coverage. It means checked, not passed.
- `unmeasured`: regions with unavailable/invalid geometry, viewport, ownership or browser hit testing.
- `skipped`: regions excluded due to visibility, inert/disabled state, viewport location or reading-panel coverage. A partially panel-covered region is skipped rather than fully checked.
- `disabled`: the disabled subset of skipped regions.
- `checkedPoints`: successful calls to browser hit testing outside the reading-panel exception, including misses; `coveredPoints` counts only points hitting their owner.
- `skippedPoints`: points exempted because the known reading panel covers them.
- `pairChecks`: the number of eligible different-owner rectangle pairs examined.

Each marked node receives one result classification: checked, unmeasured or skipped. A region with a partly failed browser API call can have some checked points while still being unmeasured overall. A region partly covered by the reading surface can have a separate coverage issue at another sampled point.

Issue kinds are separate from existing text or contract issues:

```js
{kind: 'hit-region-unmeasured', id, reason}
{kind: 'hit-region-overlap', ids: [firstId, secondId], overlap: [width, height]}
{kind: 'hit-region-coverage', id, points: [{name, x, y, covered: false, hit}]}
```

Sweep/record summaries add `markedHitRegions`, `checkedHitRegions`, `unmeasuredHitRegions`, `skippedHitRegions`, `disabledHitRegions`, `checkedHitPoints`, `coveredHitPoints`, `skippedHitPoints` and `hitRegionPairChecks`. These are **frame samples**, not counts of unique controls. A finding in the new audit includes its frame in the existing `issues` array. Existing `geometry` and `contracts` fields keep their meanings; the existing `unmeasured` summary still refers to text contracts.

The compact UI output omits per-region `results`, as it already omits successful contract results. To inspect full details from the **inspector page's** console:

```js
const lessonWindow = document.querySelector('#lesson').contentWindow;
const report = VLK_INSPECTOR.auditHitRegions(lessonWindow.D.deck.root());
console.table(report.results);
```

Calling `VLK_INSPECTOR.auditHitRegions()` without an argument uses the iframe's current scene root. The helper lives on the development inspector's window, not on the normal lesson window.

## Limits of this evidence

Five native hit samples do not prove continuous coverage of every point in a rectangle. Rectangle overlap uses browser axis-aligned bounding boxes; rotation/skew or nonrectangular clipping may require a more precise manual geometric check. The report does not prove that callbacks are correct, that keyboard activation works, or that the disabled lifecycle is correct. Those remain component behavior tests and manual interaction checks.

This feature does **not** detect arbitrary label/shape collisions, obscured diagram meanings, every stroke crossing, scientific errors or all unsampled animation frames. No marked regions means zero coverage, not a globally passing interaction audit. Continue to inspect the actual lesson across languages, fonts, backgrounds, viewport sizes and representative intermediate states.

`tests/inspector.cjs` injects browser rectangles and hit-test responses into jsdom to verify classification, counts, overlap rules, overlay handling and sweep/record integration. Those tests validate the inspector's logic; they do not claim native SVG layout, font shaping or paint-order verification. Use the development page in an actual browser for that evidence.

## Native browser verification

Open the generated project's development inspector in a real browser and run the hit-region audit on the current scene. Exercise controls with pointer and keyboard input, including blank areas inside SVG button rectangles. Check separate controls, deliberate overlap, disabled controls and overlays. Keep generated reports and screenshots in a local QA output directory.

The inspector logic is covered by `tests/inspector.cjs`; the component behavior is covered by `tests/interaction-regions.cjs`. These tests do not measure native SVG layout or replace browser inspection. Historical machine-specific smoke scripts and screenshots are not dependencies of the distributed library.
