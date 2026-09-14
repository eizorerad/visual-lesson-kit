# Molecular expression actors: references and interpretation

`starter/js/molecular-expression.js` extends `B` (also available through the kit's molecular namespace). Load it after `molecular.js`. The drawings are original SVG constructions, with persistent nodes and live semantic colors. They are explanatory diagrams, not coordinate-derived structures or simulated biological trajectories. No source image is embedded or traced.

## Visual references inspected

The ribosome, tRNA and TFIIA/TBP illustrations below were opened and visually inspected in the browser on 13 September 2026. Their structural features informed the drawings; details were reduced to preserve clear highlighting.

| Actor | Scientific reference | Interpretation and limits |
| --- | --- | --- |
| `B.ribosome` | [RCSB PDB 4V5D](https://www.rcsb.org/structure/4V5D), Voorhees et al., 2009, [primary structure paper](https://doi.org/10.1038/nsmb.1577); [PDB-101 visual](https://pdb101.rcsb.org/motm/121) | Two unequal, irregular ribonucleoprotein subunits with a free interface for independent mRNA/tRNA actors. It is a generic explanatory side view, not a species-specific 70S or 80S coordinate model. `separation` moves the subunits into an exploded view; it does not model assembly or kinetics. No A/P/E orientation is asserted by the actor. |
| `B.trna` | [Yeast phenylalanine tRNA, PDB 1EHZ](https://www.rcsb.org/structure/1EHZ); [PDB-101 visual and structural explanation](https://pdb101.rcsb.org/motm/15) | Conventional 2D cloverleaf with acceptor stem, D arm, anticodon arm, variable loop and T arm. The actual tertiary shape is approximately L-shaped. The three anticodon ticks identify the functional triplet, without inventing a sequence. The optional amino-acid symbol attaches at the 3′ acceptor end. Neither tick counts nor distances represent exact nucleotides or physical size. |
| `B.mrna` | [Kahvejian et al., 2005, primary experimental paper](https://doi.org/10.1101/gad.1262905); [free poly(A)/cap translation study](https://pubmed.ncbi.nlm.nih.gov/12138105/) | A conventional capped, polyadenylated eukaryotic mRNA map: 5′ cap, 5′ UTR, coding region, 3′ UTR and poly(A). This is not a universal description of all RNA or all eukaryotic mRNA. Region widths, waves, and tail ticks are explanatory. There is no sequence, intron, folding or translation-rate claim. |
| `B.transcriptionFactor` | [Yeast TFIIA/TBP/DNA complex, PDB 1YTF](https://www.rcsb.org/structure/1YTF), Tan et al., 1996, [primary structure paper](https://doi.org/10.1038/381127a0); [PDB-101 TFIIA/TBP illustration](https://pdb101.rcsb.org/sci-art/geis-archive/gallery/rcsb-0008-tbp-tfiia-dna) | A mnemonic of DNA-binding and interaction regions joined by a linker. It is not a reconstruction of TFIIA, TBP, or a universal TF architecture. `bound` reveals a contact cue; it makes no claim that binding activates transcription. Use a specific protein name only with an additional source and an appropriate scene explanation. |
| `B.regulatoryLocus` | Fulco et al., 2019, [primary enhancer–promoter perturbation paper](https://www.nature.com/articles/s41588-019-0538-0), [open manuscript](https://pmc.ncbi.nlm.nih.gov/articles/PMC6886585/) | A DNA annotation lane with separate enhancer, promoter, TSS and gene anchors. Relative coordinates are graphic units, not a genomic locus. Enhancers may occur on either side of, or within, genes. The optional dashed arch is an illustrative contact annotation, not evidence that a particular enhancer regulates the displayed gene, and not a physical DNA loop. The TSS arrow denotes transcription direction, not the translation start. |

## API

All constructors accept `x`, `y` and `scale`. Apply visual emphasis separately through `B.emphasis(actor, options)`. Each returns a persistent actor with `.g`, `.state`, `.set(patch)`, local-coordinate `.anchors` and conservative `.bounds`. For an anchor `[x, y]`, the stage position is `[actor.x + actor.scale*x, actor.y + actor.scale*y]` when its parent uses stage coordinates. All numeric state values must be finite numbers in the ranges below; invalid values throw before state changes. Visual fractions support animation between named explanatory states.

| Constructor | Additional options / state | Named parts for selective emphasis |
| --- | --- | --- |
| `B.ribosome(parent, opts)` | `separation: 0…1`, default `0`; `color`, `color2` | `large-subunit`, `small-subunit` |
| `B.trna(parent, opts)` | `charged: 0…1`, default `0`; `color`, `anticodonColor` | `acceptor-stem`, `d-arm`, `anticodon-arm`, `anticodon`, `variable-loop`, `t-arm`, `amino-acid` |
| `B.mrna(parent, opts)` | `width: 240…1600`, default `420`; `cap`, `polyA: 0…1`, default `1`; `color` | `five-prime-cap`, `five-prime-utr`, `coding-sequence`, `three-prime-utr`, `poly-a-tail` |
| `B.transcriptionFactor(parent, opts)` | `bound: 0…1`, default `0`; `color` | `interaction-domain`, `linker`, `dna-binding-domain`, `dna-contact-cue` |
| `B.regulatoryLocus(parent, opts)` | `width: 300…1800`, default `650`; `contact: 0…1`, default `0` | `dna-lane`, `enhancer`, `promoter`, `gene-body`, `transcription-start-site`, `illustrative-contact` |

State such as `charged: 0.5` is a fade between two drawings. It does not mean that one molecule is half charged. mRNA `cap` and `polyA` are visibility controls, not processing probabilities; a faded tail does not move the `threePrime` anchor. Ribosome `separation` updates its anchor positions and bounds. mRNA/locus width changes update geometry, anchors and bounds without replacing SVG elements.
