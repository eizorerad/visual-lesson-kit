# RNA folding recipe checks

Run these commands **from the generated project root**, after building its standalone lesson. Python checks use only the standard library. Browser checks require Node.js, Playwright and a Chromium browser.

```sh
python3 build/bundle.py
python3 build/bundle.py --check
python3 qa/rna-folding/science.py
node qa/rna-folding/layout.cjs --full --screenshots
node qa/rna-folding/motion.cjs
node qa/rna-folding/interaction.cjs
```

Each check exits nonzero on failure and writes a JSON report under `qa-output/rna-folding/`. Screenshots are optional and go in its `screenshots/` directory. Generated reports do not modify QA source files.

## Browser runtime

The scripts first load `require('playwright')`, including Node's `NODE_PATH` lookup. A normal local installation works:

```sh
npm install --no-save playwright
npx playwright install chromium
```

Without an explicit channel, the scripts use Playwright's bundled Chromium. If its executable is missing, they try installed Google Chrome. Other launch errors are reported without retry. Reports record the actual browser channel/version and whether this fallback was used.

Alternatively, set `PLAYWRIGHT_MODULE` to an existing Playwright package directory or entry point. If using an installed Google Chrome browser, add `--channel chrome` or set `PLAYWRIGHT_CHANNEL=chrome`. No machine-specific runtime path is stored in the scripts.

## Targets and options

The default browser target is the current project's `dist/lesson.html`, opened with a `file:` URL. The default source target is `assets/rna-folding/`, with embedded data read from `js/` recursively. Examples of explicit targets:

```sh
node qa/rna-folding/layout.cjs --project /path/to/project --out qa-output/custom
node qa/rna-folding/layout.cjs --url http://127.0.0.1:8000/index.html --out qa-output/source
node qa/rna-folding/motion.cjs --scene rna-docking,rna-anchors --sample-ms 120 --screenshots
python3 qa/rna-folding/science.py --project /path/to/project --out qa-output/custom
```

Relative file URLs, output directories, and science `--assets`/`--scripts` overrides resolve from `--project` (default: current directory). Use `--help` for all flags. `--scene` filters only layout/motion; the full recipe manifest is still checked. Science has a `--legacy-inline` migration option for the pre-kit lesson; normal generated projects must pass without it.

## Coverage

- **Manifest:** every browser script requires the curated 17 scene IDs in order and exactly 63 authored states. Layout/motion also compare each built scene's steps with its note count.
- **Layout:** every settled state is checked after fonts are ready for contracted bounds, unmeasured/uncontracted text, visible text collisions, and nonfinite SVG attributes. Default: 126 frames in RU/sans/black and EN/serif/white. `--full`: 504 frames across all eight language × font × background combinations. The palette is ocean.
- **Motion:** every within-scene transition is sampled during its native cancellable animation (160 ms by default), with the same layout checks plus persistent SVG node identity and completion timeout. Default: 92 transitions over two appearance modes; `--full`: 368 transitions. Frame count depends on runtime timing. This usually takes several minutes.
- **Interaction:** next/previous controls, language switching during motion with actor retention, notes, question answers retained across language change, study-guide search, overview, appearance controls, cancellation after leaving a moving scene, and control/notes access at 960 × 600 and 844 × 390. This is one targeted flow; `--full` does not expand it into an appearance matrix.
- **Scientific data:** raw-source SHA-256, exact atom coordinates and residue identities, finite values, embedded JSON/registry equality, orthonormal bases, covalent connectivity and fragment boundaries. The 1EHZ acceptor segment requires 299 atoms and 332 unique covalent links in two fragments. Full tRNA context requires 76 residues and the curated modified residues. Tertiary selections require 24 residues from 1EHZ and 33 from 1HR2, three selected fragments each, and complete 76/157-residue contexts without invented gap bonds. Curated base-pair heavy-atom guides and the 1EHZ Mg560 site with water residues 725–730 are checked against source coordinates and distance ranges.

The source audit uses the bundled official records `tertiary-1ehz.cif` and `motif-1hr2.pdb`; it needs no network, NumPy or structural-biology parser. It validates the supplied fixture selection, not arbitrary new molecules. Preserve source files and update the checks deliberately if the recipe's scientific scope changes.

## Limits

DOM checks and source coordinates cannot establish pixel-level legibility, correct depth occlusion, pedagogical clarity, or a physical folding pathway. Inspect saved screenshots and native motion; physical touch/pinch gestures remain a device check. Distance guides alone do not establish hydrogen bonds, energetics or an A-minor assignment; the latter retains its cited literature provenance. Schematic ion clouds and kissing-loop motions are outside the experimental-coordinate audit.

For `file:` targets, browser reports reject HTTP requests and record `standaloneOfflineChecked: true`. An explicit HTTP target checks source behavior and rejects requests to other origins, but does not establish standalone offline behavior. Browser checks do not follow source citations.
