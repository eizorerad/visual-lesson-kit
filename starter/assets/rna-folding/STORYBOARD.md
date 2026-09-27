# RNA folding — teaching storyboard, revision 4

The lesson answers: **what does pairing explain, what does it leave undetermined, and how do contacts, environment and time help organize an RNA?**

The shared registry `../../js/recipes/rna-shared/rna-common.js` mounts the episodes; the teaching order and chapters are declared in `../../js/recipes/rna-folding/rna-order.js`. Every state has RU/EN captions and notes. A source ID identifies an experimental model; invented diagrams are labeled as teaching examples. Camera motion is distinct from changing the arrangement of schematic modules.

| Scene | States | Viewer’s question → visible operation → result | What persists / next question |
|---|---:|---|---|
| 1. Sequence, secondary structure, tertiary structure | 3 | Bend one 13-nt chain into a hairpin; reveal its supplied pairs. Separate the three levels of description. | Same 13 positions and five pairs. Why does RNA favor this vocabulary? |
| 2. RNA and protein chemistry | 3 | Compare a schematic soluble-protein core with RNA stems and contacts. | A qualitative emphasis, not a universal folding mechanism or atomistic model. What makes a nucleotide? |
| 3. One nucleotide | 3 | Identify connected phosphate, sugar and base; locate RNA’s 2′-OH; mark C4′ as a coarse representative. | The same connected glyph. Atoms and a nucleotide bead are different levels of detail. |
| 4. The same parts form a chain | 3 | Locate a stem in whole tRNA, enlarge its connected atoms, select G3–C70. | Real 1EHZ acceptor stem; the final camera and selection carry directly into scene 5. |
| 5. Pairing and stacking | 4 | Enlarge that pair with its neighbors, show pairing across the strands and neighboring base planes along the stem. | Same deposited atoms, chemical connectivity and residue IDs; camera only. How are stems connected? |
| 6. Stems and loops | 3 | Compare a hairpin, a bulge, an internal loop and a multistem junction at consistent visual weight. | Schematic motif identities. How can these relations be recorded? |
| 7. Three pair representations | 4 | Two indexed nested pairs become bracket symbols and symmetric matrix entries. | Same 14-position example; moving dots copy pair records, not atoms. |
| 8. Pseudoknot | 4 | Keep that example and add a second pair set; expose crossing order. | Four complementary pairs, one partner per position. Crossing arcs are not chain self-intersection. |
| 9. Fixed pairs, changing geometry | 3 | Hold a 29-position/two-hairpin pair map fixed; turn one rigid schematic stem; mark a possible distant contact. | All 10 pairs, residue order and each stem’s geometry. Connector geometry is illustrative; no energy ranking. |
| 10. Real tRNA | 4 | Track 76 residues from cloverleaf to actual C4′ coordinates; retain anticodon and CCA landmarks through a camera rotation. | 1EHZ chain A and all modified residue IDs. Explain the two functional ends before inspecting its local contacts. |
| 11. Coaxial stacking and kissing loops | 5 | Whole tRNA → selected two stems → shared terminal stack; then explicitly change to a second, schematic mechanism, loop–loop pairing. | In the crystal views, real 1EHZ atoms; in the kissing diagram, a separately labeled GACG teaching example. |
| 12. GAAA loop and receptor | 5 | Whole P4–P6 RNA → selected loop/receptor → existing C223–G250 pair → A153 at its minor-groove side → bounded camera reveal. | 1HR2 ΔC209 chain A, gold donor vs blue receptor; no invented undocked crystal state. |
| 13. Ions and hydrated Mg | 5 | Mark negative phosphates; add a schematic cation atmosphere; select real Mg560; zoom while retaining a whole-tRNA locator; rotate its six-water environment. | Phosphate charge persists; crystal coordinates fixed; schematic atmosphere and real local site remain distinct. |
| 14. Folding during synthesis | 4 | Expose positions 1–9, form an early hairpin, expose 10–15, then open old pairs before making alternative ones. | Same invented 15-nt sequence and explicit availability track; no energies, rates or preferred-state claim. |
| 15. Prediction and evidence | 3 | Keep a tRNA sequence excerpt, hide the pair/coordinate targets, then restore the experimental reference for comparison. | Same 1EHZ example; no actual predictor run and no claim that 1EHZ was withheld by a named model. |
| 16. Three ML output types | 3 | Compare contextual vectors, a pair matrix and spatial coordinates, then introduce RNA-FM, UFold and RhoFold+. | Output glyphs illustrate formats; RhoFold+ uses RNA-FM and aligned related RNAs (MSA). UFold is independent. |
| 17. Visual retrieval questions | 4 | Revisit stem orientation, screening and growing-chain availability; reveal the corresponding answers. | Same visual vocabulary as the teaching scenes, with a connected moving recap diagram. |

**Total: 17 scenes, 63 states.**

## Continuity rules applied in this revision

- Teach the atom/nucleotide glyph before showing an atomic stem.
- Keep source context during cutouts and zooms; announce why a new molecule or toy example appears.
- Keep one pair selected across the stem-to-pair transition. Keep donor and receptor distinguishable through rotations.
- Teach tetraloop and receptor before naming A-minor; keep the existing receptor pair visible.
- Demonstrate underdetermination with a fixed pair graph, rather than relying on a camera rotation of one rigid structure.
- Pose the prediction/evidence question before naming algorithms.
- Move crystallographic metadata and method caveats into notes when they do not explain the operation. Keep visible source identity and essential schematic labels.

## Scientific boundaries

The 1EHZ and 1HR2 views are projections of deposited atomic coordinates. Schematic chain morphs and module rotations illustrate concepts; they do not calculate folding paths, free energies or ion responses. The ion atmosphere is an authored illustration, while Mg560 and water oxygens 725–730 are a coordinate subset of 1EHZ. A tertiary contact marker is not automatically a hydrogen bond or a new canonical base pair. Data provenance and atom checks are in [SOURCES.md](SOURCES.md) and the JSON files in this directory. The portable QA suite lives in `../../qa/rna-folding/`.
