# Changelog

Release notes for authors; migration steps and checks per version are in [docs/upgrading.md](docs/upgrading.md).

## Unreleased

- Frame review `qa/film/review.cjs` in every project: cue endpoints and transition midpoints in both languages, drawing coverage on an 8-px grid (clip paths, `<defs>` content and background-coloured fills excluded), geometry displaced outside the drawing area, uncontracted or overflowing text, duration and cue count against the brief, contact sheets. A stage that draws differently in the two languages or after seeking back to the first cue is a finding too (paint that depends on history). A label sweep at 0.1 s notes labels that pop or teleport instead of fading and travelling with their actor. Findings ask for a fix or a justification; notes (small drawings, close-ups, off-frame geometry during motion, dissolving edges) ask for a look. The author contract asks for a look at the frames, not only at passing checks.
- `film` template: a complete seven-cue PCR film on the cinema clock with complete poses, persistent actors, bilingual copy, notes, questions and a remix hook (`PCR_FILM_CONFIG`), as the starting point for new films.
- ATAC remix: a dissolve between non-adjacent cues fades out and in over 30% of the motion instead of dimming through the whole transition.
- Control bar: a labels button left of `···` (also T / Е) hides every on-stage text, title and caption with a 0.35 s fade and brings them back, so the drawing can be looked at alone; the state is not persisted.
- Unknown palette roles such as `C.cyan` log a one-time warning naming the real roles. The palette gains `bg`, the stage background: six recipes already read `C.bg` for knock-out fills and rings and received `undefined`.
- `film` template: `js/film-config.js` is the remix entry point, mirroring `js/atac-config.js` and `js/trna-config.js`; the `copies` cue records its cycle, so the counter never falls back to 1 when the ladder starts; the finale fades in a temperature legend instead of repeating the previous pose; every label and strand fades through a ramp, the molecule and the chart swap in the first 15 % of the ladder motion so bars never grow over strands, and the counter names completed cycles. A lean `film` project no longer receives the tRNA data, builders and checks through the shared cinema controller's file name.
- `upgrade.py`: bring a generated lesson to the current release. Kit files are replaced only when they still match the checksum recorded in `lesson-kit.json`; edited files are reported as conflicts, replaced files are backed up, authored files are never touched.
- `create.py --lean`: a project with the shared runtime and the selected template's scripts, data, builders and checks only. `lesson-kit.json` now records the template, profile and file checksums.
- One template registry in `create.py`; the README table and the starter pages are checked against it.
- Shared RNA recipe registry: `js/recipes/rna-shared/` holds the episodes and registry common to `rna-folding` and `rna-prediction`; each template declares its teaching order in its own `rna-order.js`. A test keeps the six deliberately forked episode files identical in drawing code.
- ATAC film: source traces are drawn as runs of retained vertices instead of one node triple per residue, hidden actors skip repaints of an unchanged state, and attribute writes skip values a node already has. The film builds about 12 300 SVG nodes instead of 18 700; headless Chrome on the author's Mac holds 56–60 fps on four of five sampled transitions instead of 29–48.
- tRNA space-fill: per-atom SVG records are created only for audits (jsdom or `?qa=`); playback keeps geometry in the actor array. The tRNA film scene has about 2 700 nodes instead of 6 000 and paints in 2.4–3.1 ms of script per frame.
- Runtime: `F.seg`, `F.pos`, `F.at`, `F.opacity` and the new `F.put` skip unchanged writes; layout watchers re-lay out text without running the full contract audit; a held key that the deck does not handle keeps its native repeat (Tab).
- Templates set an inline empty favicon, so offline exports no longer request `/favicon.ico`.
- `starter/lesson-kit.json` names the current version; the tRNA elbow data file is emitted compactly like the other data files; Python 3.9 is the documented minimum.
- CRISPRi design template (`--template crispri`), previously present only in a working tree.

## 0.19.0 — 2026-09-14

- Published under the MIT license with font notices and coordinate provenance.
- Molecular constructor (`molecular-views`): source-backed complex overview and atomic detail with fitted camera, depth ordering and a portable PDB importer.
- Added after the release without a version change: reusable 3D biology components and the `spatial-biology` template; `rna-prediction` and `trna-journey` film templates with `CinemaTimeline`; `atac-seq` and `atac-components` templates.

## 0.18.0

- Continuous 17-scene `rna-folding` template with source coordinates and portable checks; `molecular-coordinates` fragment renderer with locator.

## 0.17.0

- Chemistry-to-biology template as one continuous narrated story per scene; `F.driver` accepts an easing curve.

## 0.16.0 – 0.16.2

- Chemistry (`CH`) and physical chemistry (`PH`) modules with the 16-scene `chemistry-bridge` template; foundation and context recipes; scenes 6–16 reworked in 0.16.2.

## 0.15.0

- `molecular-check` template: seven molecular elements with authored motion and close-up inspection.

## 0.14.0

- Schematic molecular atlas: regulation, RNA processing and the inspector (`B.inspect`).

## 0.13.0

- Concept navigator (`docs/navigation/route.py` and `catalog.json`), copied into every project as `guide/`.

## 0.12.0 – 0.12.1

- `synthesis` template with a recurring map; SVG buttons, hit-region audit and explanation design notes; semantic accents per step and a replay of the known route.

## 0.11.0

- Connected explanation template (`explanations`): recurring map, quantile transport, controlled curves.

## 0.10.0

- Scientific repertoire (`methods`): statistics, biology and geometry operations.

## 0.9.0

- Numerically stable easing near the endpoint; scientific operations and label clearance guidance.

## 0.8.0

- Switchable appearance (black/white background, three palettes, two typefaces), internal layout boundaries and transformations.
