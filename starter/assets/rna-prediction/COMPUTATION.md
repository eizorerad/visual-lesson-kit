# Real thermodynamic example for the prediction lesson

Calculated and checked on 14 September 2026. Sequence: **5′-GGACGAAACGUCC-3′** (13 nt). This is an authored teaching sequence. The reported energies and probabilities are actual model calculations, not experimental measurements.

## Program and reproducibility

The calculation uses the official **ViennaRNA 2.7.2 Python bindings**, distributed on PyPI as `ViennaRNA==2.7.2`. The original calculation used Python 3.12.14 on macOS arm64 in an isolated environment. The [official installation documentation](https://www.tbi.univie.ac.at/RNA/ViennaRNA/doc/html/install.html#python-interface-from-pypi) documents the PyPI interface.

From a generated lesson's root, reproduce with an isolated environment:

```sh
python3 -m venv .venv-vienna-rna
.venv-vienna-rna/bin/python -m pip install 'ViennaRNA==2.7.2'
.venv-vienna-rna/bin/python build/rna-prediction-data.py
.venv-vienna-rna/bin/python build/rna-prediction-data.py --check
```

The portable generator is `build/rna-prediction-data.py`; its deterministic outputs are `assets/rna-prediction/thermo-example.json` and `js/recipes/rna-prediction/prediction-experiment.js`. Default paths resolve relative to the generator's own project, independent of the working directory. It refuses another ViennaRNA version and makes no network requests. `--check` recalculates and checks **both files exactly**, without writing. For an existing fixture, `python3 build/rna-prediction-data.py --embed-only` refreshes only the safe offline JavaScript embedding using the Python standard library; `--embed-only --check` verifies that embedding without making a new thermodynamic calculation.

The JSON retains every value and the original calculation provenance unchanged, including its historical `provenance.generator` value `build/thermo-example.py`. That value identifies the original script; use the portable script above to reproduce this promoted copy. The data were promoted from the source RNA prediction presentation's `assets/prediction/thermo-example.json`.

The lesson uses embedded static data and requires **no ViennaRNA, Python, network access, or runtime data fetch to view**. All indices in the JSON are **1-based**; the schematic drawing API receives converted zero-based indices.

The portable scientific audit runs with Node's standard library only:

```sh
node qa/rna-prediction/science.cjs
```

It checks embedded JSON equality, all 99 structures and energies, probabilities, loop sums, pair-preserving schematic geometry, helix handedness, and the illustrative alignment. It also compares stored ViennaRNA API outputs with independent sums. It does not call ViennaRNA or reevaluate nearest-neighbor parameters; run the pinned generator's `--check` for that independent reproduction step. The audit writes its report under `qa-output/rna-prediction/` and can run from any working directory. `--project PATH` selects another generated project and `--out PATH` changes the report directory (relative to that project).

## Exact energy-model conditions

`RNA.params_load_RNA_Turner2004()` explicitly loads ViennaRNA's built-in **RNA Turner 2004** nearest-neighbor parameters before creating the model-details object. Parameter values are those represented by this ViennaRNA release; the displayed numbers are program outputs, not hand-transcribed NNDB table entries. The [Python API](https://www.tbi.univie.ac.at/RNA/ViennaRNA/doc/html/api_python.html) documents this loader and the energy-evaluation calls.

Temperature is **37 °C = 310.15 K**. Monovalent salt is **1.021 M**, the [RNAfold manual's default](https://www.tbi.univie.ac.at/RNA/RNAfold). At this reference value the generator verifies that the compiled model's stack and loop salt corrections are zero. No explicit magnesium concentration, cell-like buffer, ligand, protein, or tertiary-contact correction is supplied.

Settings are `dangles=2`, `min_loop_size=3`, `noLP=0`, `noGU=0`, `noGUclosure=0`, `special_hp=1`, `circ=0`, `gquad=0`, `logML=0`, `max_bp_span=-1`, `betaScale=1`, `pf_smooth=1`, `compute_bpp=1`. Thus the input is a single linear RNA, AU/UA/GC/CG/GU/UG pairs are allowed, lonely pairs and closing GU pairs are allowed, special hairpin parameters are enabled, and pseudoknots and G-quadruplexes are excluded. No hard or soft constraints are supplied. All remaining model defaults are recorded implicitly by the pinned release. `dangles=2` keeps the same dangling-end model for MFE and partition-function computations.

The API's `exp_params.kT/1000` gives **RT = 0.6163207755 kcal/mol** (R = 0.00198717 kcal·mol⁻¹·K⁻¹). Integer energy APIs return units of 10 cal/mol, or 0.01 kcal/mol; dividing by 100 produces the displayed kcal/mol. The [loop-evaluation documentation](https://www.tbi.univie.ac.at/RNA/ViennaRNA/doc/html/eval/eval_loops.html) defines that conversion.

## Winner, alternatives, and energy terms

| Candidate | Dot-bracket | Pairs | ΔG (kcal/mol) | Model probability |
|---|---|---:|---:|---:|
| MFE | `(((((...)))))` | 5 | −4.90 | 85.368345% |
| Larger hairpin | `((((.....))))` | 4 | −3.70 | 12.181730% |
| Open outer pair | `.((((...)))).` | 4 | −2.60 | 2.044498% |
| Internal loop | `((.((...)).))` | 4 | +0.20 | 0.021754% |
| Unpaired | `.............` | 0 | 0.00 | 0.030094% |

These are selected examples from **99 legal structures**, so their displayed probabilities do not sum to one. All 99 structures, their actual energies, motif terms and normalized probabilities are in the JSON.

The MFE pairs are **G1–C13, G2–C12, A3–U11, C4–G10, G5–C9**. The unpaired hairpin residues are **A6, A7, A8**.

| Term and residues to highlight | ΔG (kcal/mol) |
|---|---:|
| Stack (1,13)/(2,12), `5′-GG-3′ / 3′-CC-5′` | −3.30 |
| Stack (2,12)/(3,11), `5′-GA-3′ / 3′-CU-5′` | −2.40 |
| Stack (3,11)/(4,10), `5′-AC-3′ / 3′-UG-5′` | −2.20 |
| Stack (4,10)/(5,9), `5′-CG-3′ / 3′-GC-5′` | −2.40 |
| AAA hairpin closed by (5,9), sequence `GAAAC` | +5.40 |
| Exterior loop | 0.00 |
| **Sum** | **−4.90** |

Every term was obtained with `fc.eval_loop_pt(i, pair_table)`; `i=0` means the exterior loop. Integer sums equal `fc.eval_structure_pt(pair_table)` exactly for every enumerated structure. These are contextual loop/stack terms, not independent hydrogen-bond energies or fixed scores for GC pairs. The three-nucleotide hairpin satisfies the [Turner 2004 minimum-loop rule](https://rna.urmc.rochester.edu/NNDB/rna_2004/rna_2004_hairpin_loops.html). It is not a special tetraloop.

The four-pair alternatives make the difference from a pair-count score explicit: −3.70, −2.60, and +0.20 kcal/mol despite identical pair counts. Removing the outer pair also changes the exterior term to −1.00 kcal/mol; one cannot obtain the new total by simply deleting one fixed “pair energy.”

## Independent verification and probability interpretation

An independent recursive enumerator assigns the leftmost residue either to an unpaired state or to each admissible partner, then combines the disjoint interior and suffix. It enumerates all 99 noncrossing structures once. Separate parsing checks base identities, pair span, unique pairing and noncrossing topology. Actual energies come from ViennaRNA; the independent part is the search and Boltzmann summation, not a second thermodynamic parameter implementation.

The enumerated minimum agrees with `fc.mfe()` and is unique. The exact integer motif totals agree with complete-structure evaluations. Summing `exp(−ΔG/RT)` gives **Z = 3322.9232947958376** and **Gensemble = −4.9974987542 kcal/mol**. The [ViennaRNA partition-function documentation](https://www.tbi.univie.ac.at/RNA/ViennaRNA/doc/html/pf_fold.html) defines the equilibrium weighting. `fc.pf()` independently gives −4.9974989891 kcal/mol; the absolute difference is 2.35×10⁻⁷ kcal/mol. Exhaustive and API pair probabilities differ by at most 2.76×10⁻⁷. Structure probabilities differ by at most 1.04×10⁻⁷; comparisons use tolerance 10⁻⁶. The normalized exhaustive probabilities sum to 1.0, and every nucleotide's partner probabilities sum to at most one.

The JSON `probability` fields use the normalized exhaustive calculation; the corresponding `probability_vienna_api` fields preserve the independent API values. The MFE's probability is **0.8536834510**. Its pair marginals are 0.97607443 for (1,13), 0.99943611 for (2,12), 0.99934597 for (3,11), 0.99933669 for (4,10), and 0.87461600 for (5,9). A pair marginal sums over all structures containing that pair; it is not the probability of the complete MFE structure.

## Boundary for the animation

The computation produces secondary-structure pair topology and thermodynamic model values. A 2D drawing lays out that topology. **No 3D coordinates or folding trajectories were computed.** Any rotation or 2D→3D transition must be labeled schematic geometry while preserving the same residue identities and computed pairs. Transitions between candidate folds compare alternatives; they are not a computed folding pathway. The MFE is the optimum within the stated model, not a claim of experimental validation.
