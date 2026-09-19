# Standalone teaching examples

Each example is one self-contained HTML file built from the tracked sources. The files are build products and are not committed; `examples/checksums.json` records their digests and continuous integration rebuilds and publishes them. Get them in either way:

- **Online:** the `Publish examples` workflow deploys this folder to GitHub Pages at `https://<owner>.github.io/visual-lesson-kit/<name>.html` (enable *Settings → Pages → Source: GitHub Actions* once for the repository).
- **Locally:** `python3 tools/build-examples.py` writes every file below into `examples/` in about a minute; `--check` verifies fresh builds against the recorded digests. Open a file directly or serve the repository with `python3 -m http.server 8150 --bind 127.0.0.1` and visit `/examples/`. GitHub file pages display source rather than running a lesson.

| File | What it shows | Build |
| --- | --- | --- |
| `atac-seq.html` | ATAC-seq film: 46 cues / 240.6 seconds, source-backed chromatin/Tn5 and synthetic readout. [Repeat/remix guide](../docs/atac-seq.md); edit `starter/js/atac-config.js`; scaffold `--template atac-seq` | `tools/build-atac.py` |
| `atac-components.html` | Four independent ATAC scenes / 16 states with source structures, fragment-origin geometry, readout and histogram. [Assembly guide](../docs/atac-components.md); scaffold `--template atac-components` | `tools/build-atac.py` |
| `trna-journey.html` | Continuous 6:38 / 39-cue tRNA film from sequence to atoms, D/T contacts, hydrated Mg and atom-sphere packing. [Repeat/remix guide](../docs/trna-journey.md); edit `starter/js/trna-config.js`; scaffold `--template trna-journey --palette ocean` | `tools/build-trna-journey.py` |
| `spatial-biology.html` | Three RU/EN 3D scenes (24 states): cell labelling, bead/droplet capture, barcode/feature/UMI, paired RNA/ADT libraries. [Guide](../docs/three-dimensional.md); components `starter/js/three/`; scaffold `--template spatial-biology` | `tools/build-spatial-biology.py` |
| `molecular-views.html` | Complex overview and atomic RNA/DNA detail assembled from the molecular constructor presets. [Guide](../docs/molecular-views.md); source `starter/js/recipes/molecular-views.js` | `tools/build-molecular-views.py` |
| `rna-prediction.html` | Motif energies and alignment evidence → pair topology → 2D and schematic 3D; 20 scenes, verified ViennaRNA data. [Guide](../docs/rna-prediction.md) | `tools/build-rna-prediction.py` |
| `rna-folding.html` | 17 scenes / 63 authored states of RNA structure and folding concepts. [Guide](../docs/rna-folding.md); source `starter/js/recipes/rna-folding/` and the shared `rna-shared/` registry | `tools/build-rna-folding.py` |
| `chemistry-bridge.html` | 16 continuous chemistry-to-biology stories, 48–60 seconds each, with causal narration and linked scientific geometry. [Guide](../docs/chemistry-bridge.md); scaffold `--template chemistry-bridge` | `tools/build-chemistry-bridge.py` |
| `molecular-check.html` | Visual check of the seven molecular elements: authored states, motion and enlarged captured views. [Guide](../docs/molecular-check.md); `?qa=1` runs the interaction cycle | `tools/build-molecular-check.py` |
| `molecular-atlas.html` | Schematic DNA, CRISPR, chromatin, gene-expression and RNA-processing actors with enlarged captured views. [API](../docs/molecular.md); scaffold `--template molecular` | `tools/build-molecular.py` |
| `pipeline-synthesis.html` | Branched map with four checkpoints on one two-cell toy, route animation and independent mean/range comparison. [Guide](../docs/pipeline-synthesis.md); scaffold `--template synthesis` | `tools/build-synthesis.py` |
| `explanation-bridges.html` | Four connected scenes (14 states): recurring map, quantile queries, exact W₂² versus W₂, a controlled curve. Scaffold `--template explanations` | `tools/build-explanations.py` |
| `independent-evidence.html` | An author's four-scene composition about cells and independent evidence (11 states) on the aggregation APIs; its recipe travels with projects but is not loaded by default | `tools/build-transfer.py` |
| `scientific-methods.html` | Nine worked operations: uncertainty, permutation, multiple testing, aggregation, normalization, allele counting, trigonometry, projection, linear maps. Scaffold `--template methods` | `tools/build-methods.py` |
| `representation-journey.html` | The starting composition example: six persistent records become feature rows, a coordinate plot and a changed camera before disclosed z values | `tools/build-journey.py` |
| `mean-spread.html` | One-scene example: A = [3, 4, 5] and B = [1, 4, 7] share a mean of 4 with ranges 2 and 6. Source `source/mean-spread.js` and `source/mean-spread-en.js`; DOM tests in `tests/example.cjs` | `tools/build-example.py` |

All values in the invented examples are teaching data; source-backed examples name their PDB entries and computations inside the lesson. Every build script accepts `--check` to compare the tracked or recorded output with a fresh temporary build, and never recovers runtime code from an earlier HTML bundle. The release QA history of individual templates (frame sweeps, `?qa=1` cycles) is summarized in each guide.
