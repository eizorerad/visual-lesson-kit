# RNA folding: connected structures and explanations

## Create and run

This editable RU/EN lesson answers: **what do base pairs explain, what do they leave undetermined, and how do contacts, environment and time organize an RNA?** It contains **17 scenes and 63 states**, including connected atomic views of 1EHZ tRNA and the 1HR2 GAAA–receptor contact. Use the template to reproduce the lesson; no earlier presentation or compiled example is needed.

From the Visual Lesson Kit root:

```sh
python3 create.py /absolute/path/to/rna-lesson --template rna-folding --title "Укладка РНК" --lang ru --palette ocean
```

Then, from the generated project:

```sh
python3 build/bundle.py
python3 build/bundle.py --check
python3 qa/rna-folding/science.py
node qa/rna-folding/layout.cjs
node qa/rna-folding/motion.cjs
node qa/rna-folding/interaction.cjs
```

Open `dist/lesson.html` to review the standalone result. `index.html` is the editable entry point. `build/bundle.py --check` validates that the current sources can be bundled without writing a file; it does **not** compare an existing artifact with the sources. Run the build without `--check` after every edit, then inspect and test that newly written file. The fixture builder’s `--check` has a different contract: it compares the embedded coordinate registry with its JSON inputs.

The project includes:

- `js/recipes/rna-folding/rna-*.js`: scene definitions, shared authoring helpers and explicit teaching order.
- `assets/rna-folding/`: coordinate JSON, original structure files, `SOURCES.md` and `STORYBOARD.md`. Retain these when adapting the lesson; source numbering is part of molecular identity.
- `guide/rna-folding.md`, the [coordinate API guide](molecular-coordinates.md), and portable `qa/rna-folding/` checks.

For the reusable fragment fixtures, `js/rna-structures.js` embeds the two tertiary JSON records. If you change those JSON files, regenerate it with `python3 build/rna-structures.py` before bundling; `--check` verifies synchronization. Other recipe data remain embedded beside their authored views; the source audit detects divergence from their supplied JSON.

The template supplies both languages, notes, questions, sources, live appearance controls and cancellable step motion. `--lang` selects the initial language. It does not remove the other language.

## Scene ledger

Read this ledger before changing the narrative. A new scene should carry a known object into the next question, or explicitly introduce a different molecule or schematic example.

| Scene ID · states | Question → visible operation | Carried identity / result |
| --- | --- | --- |
| `rna-map` · 3 | What are the levels of RNA structure? → Bend one chain and reveal supplied pairs. | Same 13 positions and five pairs; separate sequence, pairing and spatial description. |
| `rna-protein` · 3 | Why use this vocabulary for RNA? → Compare a schematic protein core with RNA stems and contacts. | Qualitative comparison; no universal folding mechanism is asserted. |
| `rna-nucleotide` · 3 | What is one nucleotide? → Identify connected phosphate, sugar, base, 2′-OH and C4′. | Same chemical glyph; distinguish atoms from a coarse nucleotide marker. |
| `rna-chemistry` · 3 | How do nucleotides form a chain? → Locate the acceptor stem in whole tRNA, enlarge connected atoms and select G3–C70. | 1EHZ chain A; final camera and selected pair carry into `rna-pairs`. |
| `rna-pairs` · 4 | How do pairing and stacking differ? → Inspect that pair and neighboring base planes. | Same deposited atoms and backbone; pairs G3–C70, G4–U69 and A5–U68. |
| `rna-loops` · 3 | How are stems connected? → Compare hairpin, bulge, internal loop and junction. | Explicit schematic motif identities at comparable visual weight. |
| `rna-representations` · 4 | How can we record pairs? → Move two pair records into arcs, brackets and symmetric matrix cells. | Same indexed 14-position example; moving records are annotations, not atoms. |
| `rna-pseudoknot` · 4 | What changes when pairing is not nested? → Add a second pair set and expose crossing order. | Four complementary pairs; one partner per position. Arc crossings do not mean chain self-intersection. |
| `rna-geometry` · 3 | Do pairs determine 3D shape? → Hold the pair map fixed while turning a rigid schematic stem. | Same 29 positions and 10 pairs; a possible distant contact adds a spatial constraint. |
| `rna-trna-real` · 4 | How does a real tRNA fit in space? → Move from cloverleaf to C4′ coordinates, then rotate the view. | All 76 residues of 1EHZ chain A, including modifications, anticodon and CCA landmarks. |
| `rna-docking` · 5 | How can ready-made elements meet? → Whole tRNA → two stems → terminal stack; then introduce schematic kissing loops. | Real 1EHZ coaxial interface first; a separately labelled GACG example explains a different contact mechanism. |
| `rna-anchors` · 5 | How does a loop recognize a receptor? → Whole P4–P6 → GAAA/receptor → C223–G250 → A153 at its minor groove → bounded camera turn. | 1HR2 ΔC209 chain A; gold donor, blue receptor and the existing receptor pair remain identifiable. |
| `rna-ions` · 5 | How does the environment matter? → Negative phosphates → schematic cation atmosphere → real Mg560 → located close-up → hydration-shell rotation. | Charges persist; the whole-tRNA locator follows a fixed deposited Mg site and its six water oxygens. |
| `rna-cotranscription` · 4 | Why can synthesis history matter? → Expose positions 1–9, pair them, expose 10–15, open old pairs and form alternatives. | Same invented 15-position sequence and availability track; no rates or preferred-state claim. |
| `rna-evidence` · 3 | What would a predictor need to recover? → Hide pair/coordinate targets, then restore the experimental reference. | Same 1EHZ example; this is an explanation of evaluation, not a prediction run. |
| `rna-ml` · 3 | What do different ML methods output? → Compare contextual vectors, a pair matrix and coordinates, then name methods. | Formats remain distinct; RNA-FM, UFold and RhoFold+ are not a mandatory three-step pipeline. |
| `rna-takeaways` · 4 | What can the viewer explain now? → Revisit orientation, screening and growing-chain availability, then reveal answers. | Connected recap uses the same visual vocabulary as the preceding scenes. |

## Reuse by visual need

The template already sets script order. Begin with the relevant recipe, rather than loading every kit guide. Paths below are relative to `js/recipes/rna-folding/`.

| Need | Entry point | Preserve when adapting |
| --- | --- | --- |
| Scene registration, bilingual strings, chain glyphs | `rna-common.js`: `RNA.register`, `RNA.box`, `RNA.chain`, `RNA.helix`; `rna-order.js`: `RNA.finish()` | One note and caption per state, full translated strings, explicit scene order and persistent nodes. |
| Nucleotide primer; connected atomic stem; pairing/stacking | `rna-intro.js`: `rna-nucleotide`, `rna-chemistry`, `rna-pairs` | Base–sugar attachment, phosphodiester links, selected G3–C70, overview and matching transition cameras. |
| Pair records across arc/bracket/matrix views | `rna-topology.js` | Residue indices, complementary bases, matrix symmetry and one-partner constraints. |
| Fixed pairs with different module arrangements | `rna-geometry.js` | Pair graph and rigid internal stem geometry; label the changing connector as illustrative. |
| Whole measured RNA and coarse representation changes | `rna-trna.js` | Deposited residue IDs, all 76 C4′ positions and functional landmarks. C4′ trace segments are not chemical bonds. |
| Coaxial interface and A-minor close-up | `rna-tertiary.js`: `rna-docking`, `rna-anchors` | Source context, actual fragment boundaries, intact receptor pair, donor/receptor distinction and bounded camera motion. |
| Charge atmosphere and deposited hydrated Mg | `rna-ions.js` | Separate schematic ions from source atoms; keep context throughout zoom and rotation. |
| Growing-chain availability | `rna-dynamics.js` | Same sequence; unavailable positions cannot pair; old alternatives open before new ones form. |
| Prediction/evidence and method-output comparison | `rna-evidence.js`, `rna-models.js` | Familiar reference first, output types second, named models third; no fabricated accuracy or predictor run. |

For a **new coordinate-based drawing**, use `MC.rnaFragment`, `MC.context` and `MC.project` from [Molecular coordinates](molecular-coordinates.md). That guide defines the generic data and camera contracts. The RNA recipes provide complete teaching compositions; their local helper functions are not a separate public API. Preserve atom/residue identity, explicit bonds and source-fragment boundaries when supplying another structure.

`RNA.register(def)` accepts a unique `id`, bilingual `title`, `states`, a `source`, optional bilingual `qa`, and `build(ctx,v)`. Each state is `[ruCaption,enCaption,ruNote,enNote]`. The builder returns `{state,paint,patches}` and may provide `durations` and `bind(driver)`. `patches.length` must equal `states.length - 1`; the shared mount creates and disposes the `F.driver`. Add a new ID to the teaching order in `rna-common.js`; `rna-order.js` finalizes registration after definitions load. Do not start an independent timer for a camera or caption.

## Prevent known errors

- **Isolated bases that appear to be whole nucleotides:** teach the connected nucleotide first; retain sugar–base glycosidic bonds, sugar/phosphate structure and within-fragment backbone connections in atomic views. Never join the end of one cutout segment to the beginning of another across omitted residues.
- **A close-up that loses its molecule or selection:** keep a whole-source view with the same selected residue IDs and colors. Carry G3–C70 and the camera pose from chain to pairing. Update the locator with the close-up; a caption saying “same molecule” cannot replace visible context.
- **Clear endpoints but colliding intermediate labels:** keep incoming dot-bracket symbols below the full height of residue indices from their first visible frame. Check both fonts during motion, including low-opacity text; a crossfade does not remove a geometric collision. The template reserves this clearance throughout the transition.
- **Camera motion presented as folding:** deposited 1EHZ/1HR2 coordinates stay fixed under projection. The fixed-pair geometry scene deliberately changes schematic module arrangement. Keep these operations separately labelled; neither calculates an energetic trajectory.
- **A-minor treated as replacement pairing:** reveal the GAAA loop and receptor before the contact name. Keep C223–G250 paired while highlighting A153 at its minor-groove side. Use the already docked 1HR2 conformation; do not invent an undocked crystal state or count hydrogen bonds from proximity alone.
- **Stacking shown as a new inter-stem pair:** preserve the terminal pairs U7–A66 and m5C49–G65, including the actual 65→66 backbone link. Kissing-loop pairing is a separate, labelled schematic example.
- **An invented Mg bridge drawn between RNA segments:** use 1EHZ Mg560 with deposited water oxygens 725–730, approximately 2.0 Å from Mg. These six waters, rather than invented direct RNA contacts, define the close-up. Water hydrogens are omitted; Mg–O guides show coordination, not covalent bonds. The cation atmosphere is a separate illustration and does not neutralize the displayed phosphate charges.
- **RNA-FM → UFold → RhoFold+ as a required pipeline:** RNA-FM supplies contextual representations; UFold is a separate secondary-structure method; standard RhoFold+ uses RNA-FM and an independently constructed MSA to predict coordinates. Output-format glyphs do not claim any model was run or that the 1EHZ example was excluded from training.

## Verify the generated lesson

Run the commands in “Create and run” from the generated project. Browser scripts default to its local `dist/lesson.html` and write reports/screenshots under `qa-output/rna-folding`. They accept `--project /absolute/project`, `--url URL` and `--out /absolute/output` to select another project, rendered input or output directory. Example:

```sh
node qa/rna-folding/layout.cjs --project /absolute/path/to/rna-lesson --url http://127.0.0.1:8000/dist/lesson.html --out /absolute/path/to/review
node qa/rna-folding/layout.cjs --full --screenshots
```

The default layout run checks RU/sans/black and EN/serif/white; `--full` checks all eight combinations of RU/EN × sans/serif × black/white, with the ocean palette. `--screenshots` saves images for visual review. Read each report's declared coverage before claiming a full language/font/background check. The browser checks need Node, Playwright and its Chromium browser. They resolve `require('playwright')`; an existing external installation can be exposed through `NODE_PATH` or the optional `PLAYWRIGHT_MODULE` environment variable. No machine-specific dependency path is required. In Codex, `load_workspace_dependencies` can locate an existing bundled runtime. Outside that environment, install only missing development dependencies: `npm install --no-save playwright` and `npx playwright install chromium`. An installed Google Chrome can instead be selected with `--channel chrome`. These packages are needed for QA, not for opening the standalone HTML.

Use the checks together:

- `science.py` checks source-coordinate and molecular-identity invariants in the local scripts loaded by `index.html`, so inactive template recipes do not produce duplicate data. Use `--scripts DIRECTORY` for an explicit directory scan. Re-run it whenever coordinates, selections, bonds or embedded data change.
- `layout.cjs` measures registered text after fonts load and records rendered frames. Inspect overview/detail separation, labels, bonds, base-plane clarity and donor/receptor visibility in the images; text containment alone does not check art overlap.
- `motion.cjs` samples actual intermediate playback. Verify visible atom and camera changes, retained source context and the selected pair, rather than accepting endpoint screenshots or hidden persistent nodes as evidence of a clear transition.
- `interaction.cjs` checks the affected controls and state transitions. Also review manual interruption, language/appearance changes and navigation during motion in the built artifact.

Finite coordinates, matching data and DOM assertions do not establish visual clarity. Review the actual standalone file in both languages, relevant appearances and intermediate camera positions. Report skipped configurations and unmeasured text honestly; physical pinch/pan claims require a physical-device test. See [export QA](qa.md) only when a general release check needs more detail.

## Evidence boundaries

`assets/rna-folding/SOURCES.md` records primary sources; `STORYBOARD.md` records the narrative and carried objects. The principal coordinate examples are **1EHZ, model 1, chain A** and **1HR2, model 1, chain A, P4–P6 ΔC209**. Preserve modifications, source constructs and author residue numbers. Coordinate subsets and their raw sources travel with the project; projected ring polygons are molecular glyphs, not electron density or molecular surfaces.

Sequence bends, schematic kissing loops, ion-atmosphere marks, alternative module arrangements and cotranscriptional changes are authored illustrations. They supply no folding physics, free energies, calibrated time or validated trajectory. The lesson explains structural evidence and prediction tasks; it does not run structure prediction or prove a universal ion requirement.
