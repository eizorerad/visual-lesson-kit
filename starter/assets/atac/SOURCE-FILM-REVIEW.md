# Imported source-film review (historical evidence)

This review belongs to the original source film before promotion into the kit. Its source artifact hash is retained below; it is not a claim that an edited or regenerated lesson has already passed QA. Run the commands in [qa/atac/README.md](../../qa/atac/README.md) for the generated project.

Reviewed 2026-09-19. Read-only review of all 46 bilingual cue records, the numeric route, chromatin/structure/read/origin/signal/extras renderers, and the 12 existing endpoint contact sheets (46 Russian endpoint views). Source arithmetic was independently recomputed in a separate VM. This is a diagnosis of the pre-fix film, not certification of the subsequently rebuilt artifact. No runtime files were changed by this reviewer.

## Required correction found beyond the user's reported issues

**P1 — The chemical inset does not unambiguously attach transferred adapter DNA to the target 5′ product.** In `js/atac-extras.js` the top target strand is labeled 5′→3′ from left to right and the lower strand 3′→5′. The pre-fix gold adapter path starts at `cut1-1` (left of the upper nick), while the lower purple path starts at `cut2+1` (right of the lower nick). Those are the target 3′ sides. The large event dot also hides the discontinuity, so the drawing can look like a branched junction involving an unbroken target backbone.

Keep the nine-base stagger, but terminate the upper adapter on the **right/downstream target 5′ side**, and the lower adapter on the **left/upstream target 5′ side**. Clearly show the break and annotate adapter 3′ joined to target 5′. That is a correction to strand-transfer connectivity, not added mechanistic detail or a claim about atomic trajectories.

Primary evidence: [Vaezeslami et al., 2007, Figure 2 and introduction](https://pmc.ncbi.nlm.nih.gov/articles/PMC2168436/) describes transposon 3′-OH attack on opposite target strands with a nine-bp spacing. [Davies et al., 2000](https://doi.org/10.1126/science.289.5476.77), the primary paper associated with [1MUH](https://www.rcsb.org/structure/1MUH), supplies the synaptic-complex structural basis. As corroborating explanatory literature, [Tagmentation-based single-cell genomics, 2021, Figure 1D](https://pmc.ncbi.nlm.nih.gov/articles/PMC8494221/) explicitly identifies the transferred 3′ end as covalently appended to the target nick's 5′ end. The last citation is a review, not an independent primary structural measurement.

## Confirmed issues already assigned to other editors

- The first cue's surrounding ellipse is a nucleus-like icon whose scale has no relationship to the chromatin scene. Starting at DNA/chromatin without this outline follows the user's requested scope and removes the implication of nuclear morphology.
- The fragment-origin actor used a new ellipsoid rather than the previously shown source-backed histone model. Reusing 1KX5 for both core and wrapped DNA preserves biological identity; adding detailed histones inside the old independently generated wrap would not by itself ensure correct DNA–protein placement.
- Tn5 in the chromatin scene used two smooth authored lobes while its close-up used 1MUH. Reusing the biological assembly for both levels resolves the inconsistency. Keep the explicit boundary that 1MUH lacks genomic target DNA and complete ATAC adapters: a structural model positioned over the locus is still a teaching placement, not a measured target-bound complex.
- The origin→length-distribution transition must distinguish two illustrative molecules from the 150 synthetic records. They must not visibly become the sample distribution. Return to the original records before length grouping, and avoid briefly reviving the old genomic-coordinate plot or showing the final histogram before grouping occurs.

## Claims and representations that are supported and should be retained

- 1KX5 is a reconstituted nucleosome core particle with 147 bp and an eight-histone core. The labels correctly identify two copies of each family, with an H3–H4 tetramer and two H2A–H2B dimers. Source: [RCSB 1KX5](https://www.rcsb.org/structure/1KX5).
- Explicitly distinguishing deposited tail positions with zero occupancy from positions supported by electron density is appropriate. No claim should be made that the displayed tail conformation is unique or dynamic.
- 1MUH is a dimer with two short transposon-end duplexes, and each end contacts both subunits. It is not the full modern ATAC adapter library or genomic target. Source: [RCSB 1MUH](https://www.rcsb.org/structure/1MUH).
- One Tn5 event acts locally; two events delimit the selected fragment. The stagger is not a nine-base deletion. Mg²⁺ is identified as a cofactor without invented stoichiometry or coordination.
- Paired-end reads are shown in sequential rounds, both 5′→3′, with the second round using the opposite template. F001 is consistently 88 genomic bp with two 30-base reads and a 28-bp unread interval. The absence of flow-cell optics and cluster chemistry is an explicitly labeled schematic omission, not a false biological claim.
- Long inserts can span wrapped DNA with insertion sites in accessible flanks. The narration correctly avoids treating one length as proof of a nucleosome. The primary ATAC paper itself notes that simple size cutoffs can produce false positives: [Buenrostro et al., 2013, nucleosome-positioning section](https://pmc.ncbi.nlm.nih.gov/articles/PMC3959825/).
- Length-distribution modes are clearly synthetic, not measured population proportions. Do not relabel these bars as observed mono-/dinucleosome assignments.
- Endpoint counts and fragment coverage are distinct quantities with different displayed units. The coordinates are explicitly unshifted fragment-boundary proxies. The film does not claim a numerical Tn5-centre correction.
- FRiP is explicitly a fragment-counting teaching variant dependent on specified peak windows. It does not claim to be a universal quality cutoff. The TSS profile has no invented enrichment score. These distinctions agree with [ENCODE's assay/pipeline guidance](https://www.encodeproject.org/atac-seq/).
- The peak, footprint, replicate and mixture scenes correctly distinguish accessibility from expression, sequence bias from occupancy, and cell-composition effects from within-cell changes. Smooth graphs in these sections are valid labeled conceptual profiles; replacing them with molecular-looking objects would not improve scientific accuracy.

## Independently recomputed values

150 original fragments; 12 recorded PCR copies; 300 original-fragment boundaries; 132 fragments overlapping at least one candidate window; fragment FRiP = 132/150 = 0.88; integrated coverage = 23,943 bp·fragments. The 25-bp histogram counts are `[0,0,22,41,24,4,1,13,13,12,3,1,0,0,1,4,5,6,0,0]`, summing to 150.

No additional hard scientific error was found in the other cue claims. This is not a guarantee against all criticism: the film deliberately retains synthetic data, schematic linker placement, a simplified chemical inset and simplified sequencing optics. These limitations are already explained in the cue notes.

## Integrated artifact verification

Final reviewed artifact: 3,955,662 bytes; SHA-256 `9d40322177a218377ce6395fcb2309114f9d894d65a94918693400276f39934b`.

`qa/atac/visual.cjs` passed all 503 sampled frames: all 46 endpoints in eight combinations of RU/EN, sans/serif and black/white, plus 135 intermediate-motion samples. No detected layout/text-overlap failures, invalid geometry, persistent-node failures, page errors or external requests. The film retains 46 cues and 240.6 seconds. `qa/atac/contact.cjs` regenerated 12 canonical Russian contact sheets.

Manual inspection covered all 46 endpoint views in the preceding integrated candidate (same scenes, with the final candidate differing only in a 20-px Tn5 docking displacement). The final dock and two-event views were inspected again at full screenshot size. The displacement separates Tn5 more clearly from the adjacent octamer without changing the event marker.

The nucleus outline is absent; the origin comparison uses the source-backed nucleosome; the Tn5 scene uses the structured dimer; the corrected chemical inset explicitly states adapter 3′ to target 5′; the length-distribution view correctly names the return to the 150 original records. No additional blocking issue was found in these final views. Mechanistic and molecular-identity regression suites are reported separately by the corresponding reviewers; this section does not claim to replace them.
