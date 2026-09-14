# Histone chemistry and transcription initiation

Load `js/molecular-regulation.js` after `js/molecular.js`. It extends `B` / `K.molecular` with three persistent SVG actors. Ordinary placement, local anchors and visual emphasis use the contract in [molecular.md](molecular.md). Optional `js/recipes/molecular-regulation-atlas.js` adds two bilingual, three-state atlas examples when loaded after `js/molecular-gallery.js`. It does not require loading the original molecular-atlas recipe.

## API

```js
const h3 = B.histoneTail(svg, {x:650, y:460, scale:1.55, methylation:0});
h3.set({methylation:1});
B.emphasis(h3, {level:'focus', part:'three-methyl-groups', color:C.red});
const med = B.mediator(svg, {x:640, y:330, scale:1.5, color:C.teal});
const pic = B.initiationComplex(svg, {x:640, y:440, scale:1.08, assembly:0});
pic.set({assembly:1});
```

`histoneTail.methylation` and `initiationComplex.assembly` accept finite numbers in `[0,1]`; defaults are zero. Setters accept a patch object (or an omitted argument for an unchanged redraw). They reject null, arrays, primitives, unknown keys and invalid values before changing any state or SVG node. All their geometry nodes persist. Fractional values are authored transitions, never molecular stoichiometry, concentration or rate predictions.

| Actor | Parts | Local anchors |
|---|---|---|
| `histoneTail` | `h3-peptide`, `lysine-9-side-chain`, `epsilon-nitrogen`, `three-methyl-groups` | `nTerminus`, `cDirection`, `k9`, `nitrogen`, `methyl1/2/3`, `reader`, `label` |
| `mediator` | `mediator-tail`, `mediator-middle`, `mediator-head` | `tail`, `middle`, `head`, `regulator`, `polII`, `label` |
| `initiationComplex` | `mediator`, `pol-ii`, `tbp`, `tfiib`, `tfiih`, `other-general-factors`, `cooperative-contacts` | `dnaIn/out`, `promoter`, `polII`, `tbp`, `tfiib`, `tfiih`, `mediator`, `rnaExit`, `label` |

These constructors accept common `x`, `y`, `scale`. HistoneTail uses an optional peptide `color`; Mediator accepts optional `color`. The PIC intentionally retains role colors. It contains a fixed-scale `B.polymerase` and `B.mediator` under translated groups. Move or emphasize the **outer** PIC through `B.place` / `B.emphasis`; changing nested actor scales independently is outside its public contract and invalidates its stored normalization. Setter updates only internal translations and visibility, which preserve normalization. The PIC owns no DNA or RNA strand: supply separate actors at its anchors.

## H3 chemistry and labels

The peptide positions represent the N-terminal H3 residues 1–13. The ninth position is K9, not the ninth DNA nucleotide. A deliberately magnified side chain connects its C-alpha to four methylene positions and then the epsilon nitrogen. No full peptide chemical formula is implied by the smooth backbone.

At `methylation:1`, exactly three methyl branches are present around terminal N. The actor does not bake in text. Authors **must** label its terminal group with `NH₃⁺` in the unmodified state, and with `N⁺` plus three `CH₃` labels in the trimethylated state if presenting it as a chemical diagram; use the exposed anchor positions and `L.textBox` contracts. The supplied atlas demonstrates this labeling. Four side-chain carbon vertices remain implicit in skeletal notation. The positive charge is preserved by trimethylation; it is not the neutralization caused by lysine acetylation. Intermediates fade all three branches together, expressing a graphical transition between unmodified and trimethylated endpoints. They do not depict the mono- and dimethyl states or a reaction pathway. Methyl groups are transferred from a donor; the donor, enzyme and reaction chemistry are outside this specimen.

HP1 reads the methylated K9 side chain in the context of an H3 peptide. The methylammonium group fits within an aromatic pocket of its chromodomain, while neighboring residues provide further contacts. HP1 can bind both H3K9me2 and H3K9me3. The existing HP1 actor is a role mnemonic and is not a coordinate-derived rendering of the chromodomain. A dashed scene connector denotes recognition, not a covalent bond. No claim is made that this single interaction alone shuts down every promoter.

Structural reference and primary paper: [PDB 1KNE](https://www.rcsb.org/structure/1KNE), Jacobs & Khorasanizadeh, *Science* (2002), [doi:10.1126/science.1069473](https://doi.org/10.1126/science.1069473). The entry contains an HP1 chromodomain with an H3 peptide bearing trimethyllysine 9. Its rendered assembly was visually inspected before drawing the explanatory view; no reference image or atomic coordinates are redistributed.

## PIC organization and limits

Mediator is depicted as a large, asymmetric, multicomponent protein assembly with tail, middle and head regions. Shapes and internal contours are explanatory, not a map of every subunit. The optional dissociable kinase module is not included. The PIC keeps Pol II, TBP, TFIIB and TFIIH distinguishable; other general factors are grouped gray symbols. TBP normally operates with TAF proteins in TFIID in the common human setting, but those subunits are not individually rendered. PIC assembly involves cooperative interactions and can follow different routes; the simultaneous convergence of actors does not establish an obligatory temporal order.

Structural organization and reference: [PDB 7LBM](https://www.rcsb.org/structure/7LBM), Abdella et al., *Science* (2021), [doi:10.1126/science.abg3074](https://doi.org/10.1126/science.abg3074). Its rendered structure was inspected for the extended Mediator and multicomponent PIC silhouette. An additional fully assembled TFIID-containing reference is [PDB 7ENC](https://www.rcsb.org/structure/7ENC). The drawing does not include every chain from either entry and does not claim that its relative sizes or angles are experimental measurements.

A reduction in `assembly`, and an authored fading of the whole actor, can illustrate fewer productive initiation complexes under repression. This is a qualitative explanation of reduced productive recruitment and initiation, not polymerase destruction, a direct measurement of PIC occupancy, or a complete universal model of KRAB repression. Chromatin-dependent repression involves several interacting mechanisms.

## Verification

`node --test tests/molecular-regulation.cjs` checks the side-chain carbon/methyl counts, residue indexing, node persistence, atomic validation, component identities and scale-normalized strokes across nested composites. All three actors also undergo scale and part-emphasis round trips; stateful actors return to their starting state, with exact restoration of SVG attributes, bounds and anchors. Scene text is contracted through the atlas helper. Browser layout, labels and intermediate motion still need checking in the final lesson under RU/EN and supported appearances.
