# ATAC-seq lesson: scientific map and source audit

Source review: 2026-09-19. This document supports an educational animation, not a laboratory protocol. Locus coordinates, reads, tracks and QC examples are synthetic. The default film has **46 cues and lasts 240.6 seconds**. Its compact and detailed nucleosome/Tn5 views share deposited 1KX5/1MUH coordinates; the placement of complexes, linkers and reaction/reading motion remains explanatory. See [3D provenance](ATAC-3D-SOURCES.md), [fragment geometry](ATAC-FRAGMENT-ORIGIN.md), [paired-end reading](ATAC-READING-SOURCES.md) and the [portable QA commands](../../qa/atac/README.md).

## Core facts and animation decisions

| Claim to teach | Scientific boundary / common mistake | Evidence |
|---|---|---|
| ATAC-seq samples DNA accessibility to a transposase. | Accessibility is an assay-dependent, probabilistic property. Avoid making “open” and “closed” absolute physical categories. | [Buenrostro 2013](https://pubmed.ncbi.nlm.nih.gov/24097267/) |
| DNA wraps around histone cores; accessible linker and regulatory regions can be sampled more readily. | A cartoon showing four nucleosomes is one explanatory configuration, not a structure inferred from the later synthetic track. | [Buenrostro 2013](https://pmc.ncbi.nlm.nih.gov/articles/PMC3959825/) |
| Loaded Tn5 brings synthetic adapter-bearing DNA. | It transfers DNA strands, not Tn5 protein or a complete bacterial transposon. Full sequencing handles and sample indexes can be completed later. | [Adey 2010](https://pmc.ncbi.nlm.nih.gov/articles/PMC3046479/) |
| One transposome event is local. | Two separate events delimit the highlighted short genomic fragment. Do not draw one dimer reaching across the entire fragment to clip both ends. | [Adey 2021, mechanistic synthesis, Fig. 1](https://pmc.ncbi.nlm.nih.gov/articles/PMC8494221/) |
| Strand transfer is staggered by 9 bp on opposite target strands. | This is not deletion of nine bases. Repair produces overlapping genomic sequence in adjacent library molecules. | [Davies 2000](https://pubmed.ncbi.nlm.nih.gov/10884228/), [Adey 2021](https://pmc.ncbi.nlm.nih.gov/articles/PMC8494221/) |
| Fragment lengths contain chromatin information. | Short fragments can be enriched for nucleosome-depleted DNA; broader modes near nucleosome-repeat scales are suggestive, not a per-molecule proof of occupancy. | [Buenrostro 2013](https://pmc.ncbi.nlm.nih.gov/articles/PMC3959825/), [Schep 2015](https://pmc.ncbi.nlm.nih.gov/articles/PMC4617971/) |
| Peak calling identifies statistical enrichment. | A local maximum, a coverage track and a called peak are three different objects. The teaching threshold is an illustrative rule, not a production peak caller. | [ENCODE ATAC-seq](https://www.encodeproject.org/atac-seq/) |
| A TF footprint may contain information about protection. | Sequence preferences can create or obscure a dip. Motif presence or an uncorrected dip does not establish TF occupancy. | [Bentsen 2020](https://www.nature.com/articles/s41467-020-18035-1) |
| An accessible region is a candidate regulatory feature. | Accessibility alone does not measure RNA expression, establish enhancer activity, assign a target gene, or prove TF binding. | [Long et al. 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC11090500/), [Bentsen 2020](https://www.nature.com/articles/s41467-020-18035-1) |

## Tn5: what to draw

Use the source-derived 1MUH dimer in compact and detailed views, with its two short transposon-end duplexes. These source ends are not the full modern ATAC adapters. Keep the latter in the explicitly schematic reaction/library views. A separate 2D inset may label a transferred adapter strand and the opposite genomic strands. Each local event joins adapter DNA to newly created target-DNA ends. The selected molecule gets its two genomic ends from distinct events. Show this as a selected productive library example; do not imply every possible adapter combination is equally useful. [Adey 2010](https://pmc.ncbi.nlm.nih.gov/articles/PMC3046479/)

Tn5 can remain tightly associated with products after strand transfer. An explanatory protein-removal transition before fragments drift apart is more faithful than immediately ejecting a freely diffusing finished library molecule. Subsequent completion of complementary DNA and library handles should be visibly separate from insertion. No reaction conditions are needed. [Adey 2021](https://pmc.ncbi.nlm.nih.gov/articles/PMC8494221/)

Optional cofactor caption: **“Mg²⁺ supports the catalytic chemistry / Mg²⁺ участвует в каталитической реакции.”** Divalent-metal catalysis is established; the metal dots in this lesson must remain schematic. Do not present a specific number, position or coordination shell as if recovered from the cartoon. [Lovell et al. 2002](https://doi.org/10.1038/nsb778)

## Coordinates and measurement units

For the lesson, use an explicit synthetic locus `0…1200`. If the selected fragment is `[490,578)`, it is a **0-based, half-open interval of 88 bp**. Base 578 is outside that interval. This is a project convention, not a claim about a real genomic locus.

| Object | Meaning | Honest label |
|---|---|---|
| Genomic fragment / insert | DNA interval represented by one library molecule; adapter DNA is separate. | `Fragment length / длина вставки` |
| Paired-end reads | Two sequences read from opposite ends of the same library insert. They can overlap if the insert is short. | `R1`, `R2`, one shared fragment identifier |
| Read alignment | Placement of a read on a reference coordinate system. | `Read coverage / покрытие чтениями` |
| Fragment coverage | Count of inferred insert intervals spanning each coordinate. | `Fragment coverage / покрытие фрагментами` |
| Endpoint signal | Count of observed or schematically inferred fragment ends. | `Endpoint counts / счёт концов` |
| Insertion-center estimate | A processed coordinate adjusted for the strand-offset geometry. | `Estimated insertions / оценки позиций вставки` |
| Peak interval | Region declared enriched by a stated algorithm or teaching rule. | `Illustrative peak / условный пик` |

These representations answer different questions. A long fragment can cover nucleosomal DNA while its ends lie in accessible flanks. Counting the whole interval is therefore not equivalent to marking accessible insertion sites. Two mates are not two independent molecules. “Coverage” must always name what was counted. Fragment geometry underlies the structured patterns exploited by [NucleoATAC / Schep 2015](https://pmc.ncbi.nlm.nih.gov/articles/PMC4617971/).

**Offset note, only if needed:** ATAC workflows commonly describe moving positive-strand read starts by `+4 bp` and negative-strand 5′ ends by `−5 bp` to estimate an insertion center. The negative-strand 5′ end is at the high-coordinate side. Exact code depends on base versus interval-boundary indexing, and some tools already apply a shift. This is a computational convention, not a physical movement of the read, a removal of nine bases, or correction of sequence preference. Prefer the general explanation in the main film; reserve the numbers for an optional note. The original convention is cited by [Chromatin accessibility plays a key role in selective targeting of Hox proteins, 2019](https://pmc.ncbi.nlm.nih.gov/articles/PMC6547607/); [Schep 2015](https://pmc.ncbi.nlm.nih.gov/articles/PMC4617971/) also makes its own fragment-length convention explicit.

Do not silently mix raw fragment boundaries, individual staggered strand cuts and center-adjusted coordinates. If the main model directly treats the synthetic fragment endpoints as cuts, call them **schematic endpoints** and state that the 9-bp geometry is handled only in the separate inset.

## QC and interpretation: short captions

- **Fragment-length pattern:** nucleosome-related periodicity is a distribution-level clue. Its visibility varies with biological material and assay/library effects; exact 200-bp multiples are not universal. Distinguish genomic insert length from molecule size including adapters. [Buenrostro 2013](https://pmc.ncbi.nlm.nih.gov/articles/PMC3959825/)
- **FRiP:** state the count unit and denominator. A pedagogical fragment-overlap fraction should be labeled “fragment-based FRiP illustration”; it need not match an implementation that counts individual reads or insertion sites. The peak set affects the result. [ENCODE definitions](https://www.encodeproject.org/data-standards/terms/)
- **TSS enrichment:** aggregate signal around many annotated transcription start sites relative to flanks. A single toy locus cannot yield a genuine genome-wide TSS enrichment metric. Label any displayed curve as a separate synthetic aggregate. [ENCODE definitions](https://www.encodeproject.org/data-standards/terms/)
- **Use several QC views:** mapping, unique molecules/library complexity, mitochondrial fraction, fragment lengths, enrichment and replicate consistency provide different checks. ENCODE thresholds have reference-annotation and sample-context qualifications; omit universal “pass/fail” numbers in this film. [ENCODE ATAC-seq](https://www.encodeproject.org/atac-seq/)
- **Omni-ATAC context:** Corces and colleagues reported reduced background and improved accessibility profiling across challenging sample types, including frozen tissue. Mention this as method history, not a claim that every Omni-ATAC dataset is automatically superior or that the animation specifies that protocol. [Corces 2017](https://pubmed.ncbi.nlm.nih.gov/28846090/)
- **Population:** a bulk track aggregates sampled molecules across cells. A difference between two tracks can reflect a within-cell change, a cell-composition change, technical variation, or combinations. Cell-to-cell accessibility variation is measurable with single-cell approaches. [Buenrostro 2015](https://www.nature.com/articles/nature14590)
- **Evidence ladder:** peak → candidate accessible region; motif → candidate TF family; corrected footprint → occupancy evidence under a model. Independent binding, RNA or functional evidence addresses different claims. [Bentsen 2020](https://www.nature.com/articles/s41467-020-18035-1), [Long et al. 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC11090500/)

## Default route and remix boundary

The following 46 cue IDs are stable selectors for remixing. The full default route preserves the source film; optional subsets and timing overrides live in `js/atac-config.js`. Subsets need their own narrative and visual audit: shortening a route must not imply that a representation transition is a measured biochemical trajectory.

| # | Cue ID | English title |
|---|---|---|
| 01 | `question` | How does DNA packaging affect accessibility? |
| 02 | `chromatin` | Chromatin is DNA together with proteins |
| 03 | `nucleosome` | DNA wraps around a histone core |
| 04 | `nucleosome-real` | The nucleosome has an experimentally determined structure |
| 05 | `histone-octamer` | The core contains four histone pairs |
| 06 | `wrapped-dna` | The DNA duplex winds around the protein core |
| 07 | `linker` | Accessible DNA lies between packaged regions |
| 08 | `protected` | Accessibility is a probability of interaction |
| 09 | `tn5` | Tn5 carries short adapter DNA |
| 10 | `tn5-real` | Two Tn5 subunits hold two DNA ends |
| 11 | `tn5-end-dna` | Short DNA ends are held within the complex |
| 12 | `dock` | The first event occurs at one local site |
| 13 | `stagger` | The two strands are targeted with a 9-bp stagger |
| 14 | `tag-chemistry` | Adapter DNA joins the newly formed ends |
| 15 | `two-events` | Two separate events delimit one fragment |
| 16 | `coordinate-map` | The same fragment gains coordinates |
| 17 | `release` | Tagged fragments separate after protein removal |
| 18 | `library` | F001 becomes one library molecule |
| 19 | `handles` | Library elements flank the genomic insert |
| 20 | `copies` | Amplification makes copies, not new observations |
| 21 | `read-orientation` | The two strands run in opposite directions |
| 22 | `read-one` | R1 grows from the first end |
| 23 | `read-two` | R2 reads the opposite end |
| 24 | `paired-reads` | Two reads belong to one insert |
| 25 | `mapping` | Read sequences are placed on a reference |
| 26 | `insert-span` | A read pair defines the inferred insert interval |
| 27 | `pileup` | Many molecules create an aggregate signal |
| 28 | `duplicates` | Copies must not be treated as independent evidence |
| 29 | `endpoints` | Fragment ends highlight event locations |
| 30 | `count-track` | Local marks accumulate into a track |
| 31 | `two-tracks` | Coverage and endpoint counts answer different questions |
| 32 | `peaks` | An enriched region becomes a peak candidate |
| 33 | `peak-evidence` | A peak reports accessibility in the sampled material |
| 34 | `short-origin` | Nearby accessible positions produce a short insert |
| 35 | `nucleosomal-origin` | A nucleosome can lie between accessible flanks |
| 36 | `contour-length` | DNA retains its contour length after histone removal |
| 37 | `lengths` | Insert lengths carry additional information |
| 38 | `frip` | FRiP relates fragments to a chosen peak set |
| 39 | `tss` | TSS signal is assessed across many genes |
| 40 | `quality` | One attractive curve does not establish quality |
| 41 | `footprint` | A signal dip does not prove protein binding |
| 42 | `replicates` | Biological differences require independent replicates |
| 43 | `mixture` | Bulk ATAC-seq mixes signals from different cells |
| 44 | `interpretation` | Accessibility is one layer of regulatory evidence |
| 45 | `journey` | Every peak now connects to a molecular history |
| 46 | `finale` | ATAC-seq turns accessibility into testable evidence |

## Primary references and official definitions

1. Buenrostro JD, Giresi PG, Zaba LC, Chang HY, Greenleaf WJ. **Transposition of native chromatin for fast and sensitive epigenomic profiling of open chromatin, DNA-binding proteins and nucleosome position.** *Nature Methods* 10, 1213–1218 (2013). [DOI](https://doi.org/10.1038/nmeth.2688), [PubMed](https://pubmed.ncbi.nlm.nih.gov/24097267/). The PMC manuscript uses the alternate title “Transposition of native chromatin for multimodal regulatory analysis and personal epigenomics.”
2. Corces MR et al. **An improved ATAC-seq protocol reduces background and enables interrogation of frozen tissues.** *Nature Methods* 14, 959–962 (2017). [DOI](https://doi.org/10.1038/nmeth.4396), [PubMed](https://pubmed.ncbi.nlm.nih.gov/28846090/).
3. Adey A et al. **Rapid, low-input, low-bias construction of shotgun fragment libraries by high-density in vitro transposition.** *Genome Biology* 11, R119 (2010). [Full text](https://pmc.ncbi.nlm.nih.gov/articles/PMC3046479/), [DOI](https://doi.org/10.1186/gb-2010-11-12-r119).
4. Davies DR, Goryshin IY, Reznikoff WS, Rayment I. **Three-dimensional structure of the Tn5 synaptic complex transposition intermediate.** *Science* 289, 77–85 (2000). [PubMed](https://pubmed.ncbi.nlm.nih.gov/10884228/), [DOI](https://doi.org/10.1126/science.289.5476.77). A structural intermediate is not the complete target-bound event animated here.
5. Lovell S, Goryshin IY, Reznikoff WR, Rayment I. **Two-metal active site binding of a Tn5 transposase synaptic complex.** *Nature Structural Biology* 9, 278–281 (2002). [DOI](https://doi.org/10.1038/nsb778).
6. Schep AN et al. **Structured nucleosome fingerprints enable high-resolution mapping of chromatin architecture within regulatory regions.** *Genome Research* 25, 1757–1770 (2015). [Full text](https://pmc.ncbi.nlm.nih.gov/articles/PMC4617971/).
7. Bentsen M et al. **ATAC-seq footprinting unravels kinetics of transcription factor binding during zygotic genome activation.** *Nature Communications* 11, 4267 (2020). [Article](https://www.nature.com/articles/s41467-020-18035-1).
8. Buenrostro JD et al. **Single-cell chromatin accessibility reveals principles of regulatory variation.** *Nature* 523, 486–490 (2015). [Article](https://www.nature.com/articles/nature14590).
9. Long T et al. **The contributions of DNA accessibility and transcription factor occupancy to enhancer activity during cellular differentiation.** *G3* 14, jkad269 (2024; online 2023). [Full text](https://pmc.ncbi.nlm.nih.gov/articles/PMC11090500/), [DOI](https://doi.org/10.1093/g3journal/jkad269).
10. ENCODE. **ATAC-seq Data Standards and Processing Pipeline** and **Terms and Definitions**. [Assay page](https://www.encodeproject.org/atac-seq/), [Definitions](https://www.encodeproject.org/data-standards/terms/). Accessed 2026-09-19; assay page identifies its update as July 2020.

Mechanistic supporting synthesis (explicitly not an original experiment): Adey AC. **Tagmentation-based single-cell genomics.** *Genome Research* 31, 1693–1705 (2021). [Full text and mechanism figure](https://pmc.ncbi.nlm.nih.gov/articles/PMC8494221/).

No source figure or substantial passage is reproduced in the lesson. Visuals and wording should be original, with source links available from the lesson's literature panel.

## Imported source-film review

The [source-film biology review](SOURCE-FILM-REVIEW.md) records the final artifact from which this package was promoted, including its hash and bounded checks. These are historical source-film results; generated projects must run their own [QA](../../qa/atac/README.md). The portable regression suite retains the corrected adapter 3′ → target 5′ connection, source-identity zooms, contour-preserving origin scene, and progressive 150-record length histogram.
