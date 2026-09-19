# Changelog

Release notes for authors; migration steps and checks per version are in [docs/upgrading.md](docs/upgrading.md).

## Unreleased

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
