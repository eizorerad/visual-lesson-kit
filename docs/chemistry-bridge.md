# Chemistry → biology lesson

## Narrated motion revision

Visual Lesson Kit **0.17.0** turns all 16 chemistry scenes into continuous, bilingual visual stories. A retained actor moves, binds, changes representation or drives a linked graph; short narration cues explain the cause and result. The scenes last **48–60 seconds** and keep their original chapter navigation.

The previous 0.16.2 phase audit corrected chemical notation and model states. This revision also checks what the viewer can follow between those states. It does not count fades or preserved invisible DOM nodes as sufficient motion.

## Use

From the Visual Lesson Kit root, create a new **0.17.0** lesson with all revised scenes:

```sh
python3 create.py /absolute/path/to/lesson --template chemistry-bridge --title "Химия → биология"
```

The template entry point is `starter/chemistry-bridge.html`. Its recipe order matches the list below, with source files under `starter/js/recipes/`. `python3 tools/build-chemistry-bridge.py` rebuilds the central standalone example; add `--check` to verify it against a fresh build.

The generated `index.html` loads these recipes after CH, PH, F, L, T and B:

1. `js/recipes/chemistry-foundations-bonds.js` — shared electron pairs and polarity.
2. `js/recipes/chemistry-foundations-environment.js` — hydration and intermolecular forces.
3. `js/recipes/chemistry-foundations-transfer.js` — proton transfer.
4. `js/recipes/chemistry-context-binding.js` — catalysis, occupancy and HP1 recognition (6–8).
5. `js/recipes/chemistry-context-reactions.js` — stoichiometry and protonation (9–10).
6. `js/recipes/chemistry-context-transport.js` — FRAP, Nernst equilibrium, photons and kinetics (11–14).
7. `js/recipes/chemistry-context-energy.js` — ATP synthase and arrow conventions (15–16).
8. `js/recipes/chemistry-bridge.js` — shared controls and registration of scenes 1–8.
9. `js/recipes/chemistry-physics-scenes.js` — registration of scenes 9–16.

The three foundation files populate `CHEMISTRY_FOUNDATIONS`; the four context files populate `CHEMISTRY_APPLICATIONS`. The two registries require exactly one definition per expected scene. Preserve the full load order. Build from the generated lesson folder:

```sh
python3 build/bundle.py
python3 build/bundle.py --check
```

The standalone output is `dist/lesson.html`. The editable entry point is `index.html`.

Find the guide and recipe paths without reading unrelated source files:

```sh
# In the library:
python3 docs/navigation/route.py --show chemistry-bridge
python3 docs/navigation/route.py --read chemistry-bridge
# In a generated lesson:
python3 guide/navigation/route.py --show chemistry-bridge
python3 guide/navigation/route.py --read chemistry-bridge
```

The generated lesson carries its own recipes and guides; the navigator resolves them locally. Other templates receive the files without loading these scenes into their normal gallery.

`CHEMISTRY_BRIDGE.specimens` contains the scene definitions. `createSpecimen({svg}, spec)` returns `{g, detail, metrics, paint(p)}`. Finite progress between 0 and 1 updates persistent shape nodes and model metrics; unsupported progress is rejected. Metrics describe declared model state and require comparison with rendered geometry. `add(spec)` registers an additional bilingual scene with a unique identifier.

Each scene defines `duration`, chapter `stages`, fallback `captions`/`enCaptions`, and independent `narration: [{at, ru, en}]` cues. Cue and chapter anchors are progress values between 0 and 1. Use short causal sentences: introduce an actor, explain the action while it happens, then hold the visible consequence. Cues follow the same story clock as geometry and model state.

Ordinary entry starts playback after mounting. `?qa=1`, reduced-motion preference, or `LESSON.chemistryNarration = false` suppresses entry autoplay. The story stops at its ending; it never advances to another scene automatically. Chapter buttons start playback at `stage.at`; with reduced motion they inspect `stage.seek` (or a representative point). A manual scrub or enlarged view stops playback. Pause/resume retains exact progress; hidden tabs pause and resume when visible. Disposal cancels pending entry and active motion.

The shared controller uses `F.driver.to({p:1}, {duration, ease:'linear'})`. Keep the story clock linear and author local movement/holds with `F.phase`. Do not apply a single global ease to a minute of narration. `CHEMISTRY_BRIDGE.H.move(item,x,y,scale)` places an actor wrapper; `H.trace(item,t)` reveals a stroke/arrow with its head at completion. CH components should retain ownership of their own transforms; move an outer wrapper or use `molecule.place()`.

## Scenes

| Scene | Teaching progression | Phases | Playback |
| --- | --- | ---: | ---: |
| CH₄ and bonding | Composition → shared pair → density → bond line → octet | 5 | 48 s |
| Polarity | Density → partial charges → chemical dipoles → vector addition → CO₂ comparison | 5 | 48 s |
| Hydration | Water bonds and angle → polarity → Na⁺ → orientation → ion–dipole contacts | 5 | 48 s |
| Lennard–Jones pair | Far apart → attraction → energy slope → exact minimum → compression | 5 | 48 s |
| Proton transfer | Reactants → two pairs → O pair to H → N–H pair to N → bond changes → charge check | 6 | 48 s |
| Catalysis | Endpoints → high barrier → alternative path → two local barriers → unchanged ΔG | 5 | 48 s |
| Occupancy | Site and ligand → alternative states → ensemble → half occupancy → saturation | 5 | 48 s |
| H3K9me3–HP1 | Mark → N⁺ charge → aromatic pocket → noncovalent contacts → chromatin context | 5 | 48 s |
| Stoichiometry | Molecules → atom count → connectivity → products → repeated amount ratio | 5 | 50 s |
| Protonation | Acid/base pair → proton exchange → equilibrium ensemble → pH = pKa → changed pH | 5 | 50 s |
| Diffusion/FRAP | Before bleach → bleach → redistribution → local recovery → closed-domain limit | 5 | 52 s |
| Nernst equilibrium | Compartments → V = 0 → voltage → balanced passive fluxes → reversed sign | 5 | 52 s |
| Photon energy | Electric field → wavelength → shorter wavelength → energy → comparison | 5 | 48 s |
| First-order kinetics | Initial population → rate law → half-life → another half-life → later time | 5 | 48 s |
| ATP synthase | Proton motive force → charge on c → rotor → synthesis → ATP release | 5 | 52 s |
| Arrow conventions | Electrons → reactions → resonance and force → two dipole conventions | 4 | 60 s |

The methane scene changes notation for the same bonds; the enlargement repeats a selected bond. Water retains a 104.5° angle, while linear CO₂ is a separate comparison molecule. Hydration preserves water connectivity and distinguishes covalent bonds from ion–dipole contacts. The Lennard–Jones scene links separation, energy slope and force, including the exact minimum. Proton-transfer arrows remain anchored to the reactants; the departing bond first gives its pair to N, an explicitly declared H⁺ bookkeeping transfer follows, and arrival completes O–H. Atom, electron and charge totals remain consistent throughout.

The context stories use observable causal motion. One retained ligand binds, releases, rebinds and becomes a member of the expanded ensemble. The same HP1 complex changes scale into chromatin context. A reaction-coordinate probe traces alternative energy paths; it is not a molecule moving in time. FRAP tracers mix across the bleached region while the quantitative field and recovery curve evolve. ATP close-ups travel from the overview to carboxyl and β sites, with a visible mechanical handoff along γ. The arrow recap demonstrates electron allocation, composition transport, continued opposing exchange, force scaling and the two dipole conventions.

 Catalytic barriers start at each step's own minimum. A site's binary state is separated from an equilibrium fraction across many sites. Stoichiometry and protonation preserve the declared atom, electron and charge bookkeeping. FRAP preserves fluorescent and dark populations after bleaching; Nernst arrows distinguish concentration tendency and electrical force. The light diagram labels a spatial electric-field profile, and kinetics keeps the exact curve distinct from rounded population symbols. ATP synthase separates side and top views, protonation, rotation, synthesis and product release. Arrow panels distinguish eight meanings without treating resonance contributors as time-separated states.

## Verification

Run the development checks from the **Visual Lesson Kit root**:

```sh
npm test
python3 -m unittest discover -s tests -p 'test_navigation.py' -v
```

The chemistry checks cover chemical-state bookkeeping, analytic invariants, preserved SVG objects, arrow directions, proportional geometry, exact equilibrium/half-life checkpoints, phase boundaries and controls. Navigation checks cover portable discovery. The tests and their dependencies live in the library and are not copied into generated lessons. Earlier verification remains evidence for its corresponding release; rerun affected checks after changes.

Add `?qa=1` to enable `js/chemistry-bridge-qa.js`; **Check all scenes** samples **12 × 16 = 192 frames per configuration** after fonts load. Check both languages, both bundled fonts and both backgrounds. Also run actual playback, pause/resume and intermediate motion samples: text containment and shape identity cannot establish that a transition explains its cause. Inspect atom/bond bookkeeping, nearby geometry and moving inset clearance separately. Physical touch gestures require hardware testing. Release-specific evidence belongs in the originating verification report; older release results do not verify edited recipes.

## Scope

The CH and PH guides separate reusable drawing primitives from numerical models. A shared pair can count toward both atoms’ octet/duet without adding electrons. Flat connectivity drawings do not assert planar methane or ammonia. Partial-charge values and density regions are illustrative where stated; authored rotations and state changes are not calculated trajectories or transition states.

The lesson is not a reaction predictor, quantum calculation or calibrated molecular-dynamics simulation. Numerical results retain units and assumptions in `physical-chemistry.md`. H3K9me3–HP1 uses a peptide–chromodomain complex; the nucleosome supplies context. Sources and scene-specific limits remain in the notes. The originating project retains its original research notes separately; generated lessons retain the official source links in each scene. No reference artwork was copied.

The context models declare their simplifications:

- Catalytic free energies are authored in arbitrary units; the paths share endpoints and do not predict a rate or equilibrium constant. Occupancy assumes identical independent sites at imposed free-ligand concentration; 20 drawn sites are a rounded ensemble, not a closed ligand-conserving trajectory.
- N₂ + 3H₂ → 2NH₃ is an overall balance, not an elementary collision mechanism. The NH₄⁺/NH₃ example uses fixed reference pKa = 9.26 and an ideal pH reservoir; its explicit proton-exchange diagram and later equilibrium ensemble are distinct representations.
- FRAP uses 20 reflecting cells and one irreversible bleach, retaining fluorescent/dark totals of 14/6 afterward. Its closed-domain fluorescence limit is 0.7. Nernst uses one permeant ion, K⁺, fixed concentrations and V = Vin − Vout; force arrows are qualitative and zero net passive flux does not stop individual crossings.
- Photon energy uses E = hc/λ for vacuum wavelengths 400–700 nm. The drawn wave propagates as a schematic spatial field profile with fixed arbitrary amplitude and a common horizontal scale. First-order kinetics uses irreversible 1:1 A → B with k = 0.4 s⁻¹ and conserved total concentration; exact half-life checkpoints are separate from rounded icons.
- ATP synthase uses the bovine c₈ example: 8 H⁺ through F₀ per full turn and 3 ATP across three β sites. One proton is not equated to a 120° step, and this ratio is not universal or the full mitochondrial transport cost. Phosphate circles are groups; Mg²⁺, pH-dependent charges and chemical substeps are omitted.
- Electron, reaction, equilibrium, resonance, force and dipole arrows retain distinct meanings. The crossed chemical arrow points toward δ⁻; the physical electric dipole moment points from negative to positive. Resonance contributors keep the nuclei fixed.

The foundation scenes cite [OpenStax Lewis structures](https://openstax.org/books/chemistry-2e/pages/7-3-lewis-symbols-and-structures), [molecular structure and polarity](https://openstax.org/books/chemistry-2e/pages/7-6-molecular-structure-and-polarity), [electrolytes](https://openstax.org/books/chemistry-2e/pages/11-2-electrolytes), [curved electron arrows](https://openstax.org/books/organic-chemistry/pages/6-5-using-curved-arrows-in-polar-reaction-mechanisms), [PhET Atomic Interactions](https://phet.colorado.edu/sims/html/atomic-interactions/latest/atomic-interactions_en.html) and the [LAMMPS Lennard–Jones expression](https://docs.lammps.org/pair_lj.html).

Context sources include OpenStax on [catalysis](https://openstax.org/books/chemistry-2e/pages/12-7-catalysis), [equation balance](https://openstax.org/books/chemistry-2e/pages/4-1-writing-and-balancing-chemical-equations), [amine basicity](https://openstax.org/books/organic-chemistry/pages/24-3-basicity-of-amines), [Henderson–Hasselbalch](https://openstax.org/books/organic-chemistry/pages/24-5-biological-amines-and-the-henderson-hasselbalch-equation), [photon energies](https://openstax.org/books/college-physics-2e/pages/29-3-photon-energies-and-the-electromagnetic-spectrum) and [first-order laws](https://openstax.org/books/chemistry-2e/pages/12-4-integrated-rate-laws); Caltech on [binding](https://biocircuits.github.io/chapters/intro_to_circuit_design.html) and [diffusion/FRAP](https://www.rpgroup.caltech.edu/mbl_pboc/code/diffusion_master_equation.html); [Hille & Catterall on electrodiffusion](https://www.ncbi.nlm.nih.gov/books/NBK28117/); [HP1 complex 1KNE](https://pdbj.org/mine/summary/1kne); [PDB-101 ATP synthase](https://pdb101.rcsb.org/motm/72) and [bovine F₁–c₈ structure 2XND](https://www.rcsb.org/structure/2XND); and [IUPAC electric dipole moment](https://goldbook.iupac.org/terms/view/E01929).
