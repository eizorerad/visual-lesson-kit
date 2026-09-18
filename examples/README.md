# Standalone teaching examples

Download the repository and open any HTML file below locally, or serve the repository with `python3 -m http.server 8150 --bind 127.0.0.1` and visit `/examples/`. GitHub file pages display source rather than running the lesson.

- [Spatial biology](spatial-biology.html): three complete RU/EN 3D scenes (24 states), from cell labelling through bead/droplet capture to cell barcode, feature identity and UMI, then paired RNA/ADT libraries sharing the cell barcode. [Guide](../docs/three-dimensional.md), reusable components `starter/js/three/`, editable recipes `starter/js/recipes/spatial-biology/`, build `python3 tools/build-spatial-biology.py` and verify with `--check`. Scaffold with `--template spatial-biology`. Procedural geometry and motion are illustrative; co-capture precedes synthesis in the depicted original solid-bead Drop-seq CITE-seq workflow.
- [Molecular constructor](molecular-views.html): complex overview and atomic RNA/DNA detail assembled from reusable presets. [Guide](../docs/molecular-views.md), source `starter/js/recipes/molecular-views.js`, build `python3 tools/build-molecular-views.py`.
- [RNA folding](rna-folding.html): 17 scenes / 63 authored states, RU/EN. [Guide](../docs/rna-folding.md), source `starter/js/recipes/rna-folding.js`, build `python3 tools/build-rna-folding.py`.


`chemistry-bridge.html` is the **v0.17.0** bilingual chemistry-to-biology lesson: **16 continuous visual stories, 48–60 seconds each**, with causal narration, retained moving actors and linked scientific geometry. Ordinary entry starts playback; chapter buttons begin their story segment. QA/reduced-motion entry remains still. The seven foundation/context recipes and shared registry live under `starter/js/recipes/`. Guide: [chemistry-bridge.md](../docs/chemistry-bridge.md); scaffold with `--template chemistry-bridge`; rebuild with `python3 tools/build-chemistry-bridge.py` and verify with `--check`.

The completed release sweep sampled **1536 frames across 8 configurations** (RU/EN × Source Sans 3/Source Serif 4 × black/white), with **zero automated QA findings**. Optional `?qa=1` repeats **12 × 16 = 192 frames per configuration**; scientific meaning and arrow clearance also require inspection. Historically, 0.16.0 introduced CH, PH and the 16-scene template; 0.16.1 revised its first five scenes with **26 phases (5 + 5 + 5 + 5 + 6)**.

`molecular-check.html` is the v0.15 reusable visual check for the seven new molecular elements. It exercises authored schematic states, motion and enlarged captured views in the standard bilingual shell. Source: `starter/js/recipes/molecular-check.js`; guide: `docs/molecular-check.md`. Scaffold with `--template molecular-check`, rebuild with `python3 tools/build-molecular-check.py` and verify with `--check`. Optional browser QA is activated only by `?qa=1`; the cycle tests visuals and interaction, not biophysics or reaction kinetics. The recipe and QA helper travel with all templates but are loaded only by `molecular-check`.

`molecular-atlas.html` is the v0.14 schematic molecular actor gallery: reusable DNA, CRISPR, chromatin and gene-expression components, with ordinary/context/focus styling and local anchors. Its shapes and motion are explanatory, not an atomic model or kinetic calculation. It also includes H3-tail chemistry, Mediator/PIC, Cas12a/Cas13 and RNA-processing scenes, with accessible enlarged captured views. Sources: `starter/js/recipes/molecular-atlas.js`, `molecular-regulation-atlas.js`, `molecular-rna-atlas.js`, using `starter/js/molecular-gallery.js`; API and boundaries: `docs/molecular.md`. Rebuild with `python3 tools/build-molecular.py`, verify with `--check`; scaffold with `--template molecular`. The recipe travels with other templates without running there.

`pipeline-synthesis.html` is the v0.12 branched-map example: four checkpoints on one consistent two-cell toy, full-tile SVG interaction, route animation and independent comparison of mean and range. It separates changing a proposed response from changing its spread; a correct mean can coexist with an incorrect range. Source: `starter/js/recipes/pipeline-synthesis.js`; guide: `docs/pipeline-synthesis.md`. Rebuild with `python3 tools/build-synthesis.py` and verify with `--check`; scaffold with `--template synthesis`. All data are invented, with no b18 or competition results copied into the example.

`explanation-bridges.html` is the v0.11 connected four-scene example (14 states, RU/EN): a recurring map, eight preserved observations, quantile queries and a dense grid, exact W₂² versus W₂, a controlled central curve and its objective, then a visual return to the opening question. Rebuild with `python3 tools/build-explanations.py`, verify with `--check`; scaffold with `--template explanations`. Numerical models and exact guide geometry are reusable modules, while the map remains an adaptable composition. All values are invented.

`independent-evidence.html` is a fresh author’s four-scene composition about cells and independent evidence (11 states, RU/EN). It combines the pure aggregation and summary APIs with custom SVG views and an explicit random-intercept variance model. Its source is `starter/js/recipes/independent-evidence.js`, copied into generated projects but not loaded by default. Rebuild with `python3 tools/build-transfer.py`; verify with `--check`. This is an example of extending the visual vocabulary, not a required outline. All values and variance parameters are invented.

`scientific-methods.html` is the optional scientific laboratory: nine worked operations spanning statistical uncertainty, permutation, multiple testing, cell/sample aggregation, count normalization, genotype/allele counting, trigonometry, projection and linear-map area. Run `python3 tools/build-methods.py` and `python3 tools/build-methods.py --check`. Sources are in `starter/js/recipes/methods-*.js`; create a portable editable laboratory with `create.py destination --template methods`. Its scenes are a menu, not an outline to copy into every lesson.

`representation-journey.html` is the starting example for composing a new lesson. Its three connected scenes transform six persistent records into feature rows, place the same records in a coordinate plot, then change the camera before disclosing supplied z values. All coordinates are invented teaching data. RU/EN slides, notes, QA, controls and intended text-box contracts are included.

Its source is `starter/js/recipes/representation-journey.js`, also copied into every generated lesson. From the library root run `python3 tools/build-journey.py`, then `python3 tools/build-journey.py --check`. The recipe uses the current shared runtime and local font assets. Source/data identity is explicit at the scene bridges; a projected picture does not infer unknown dimensions.

## Mean and spread

`mean-spread.html` is a one-scene standalone example built with the current Visual Lesson Kit starter. Its authored source is `source/mean-spread.js`; its English scene text, three notes, two questions and common-shell translations are in `source/mean-spread-en.js`. The Russian lesson has the same three states and two questions.

The illustrative values are A = [3, 4, 5] and B = [1, 4, 7]. Both means equal 4; the observed ranges are 2 and 6. These segments show minimum to maximum, not confidence intervals. No research paper or external data is used.

From the library root:

```sh
python3 tools/build-example.py
python3 tools/build-example.py --check
node --test tests/example.cjs
```

The build script creates a temporary lesson with `create.py`, copies only this episode and its language pack, and exports it with the current bundler. It never recovers runtime code from an earlier HTML bundle. `--check` compares the tracked HTML byte-for-byte with a fresh temporary build. The DOM tests inspect the actual exported HTML, both languages, all three states, reading panels, values and bundled font hashes/notices. They do not measure browser text layout or claim physical touchscreen coverage.
