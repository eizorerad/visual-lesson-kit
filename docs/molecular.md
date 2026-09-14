# Schematic molecules for teaching

## Molecular actors and visual hierarchy

Load `js/molecular.js` after `biology.js`, then `js/molecular-expression.js`, `js/molecular-regulation.js`, `js/molecular-rna-processing.js` and `js/molecular-inspect.js` before authored scenes. All new-project templates include them. They expose the same object as `B` and `K.molecular`; `K`'s existing numerical biology functions are unchanged. These modules create persistent SVG drawings. The optional atlas uses `js/molecular-gallery.js` as a shared bilingual registry. Load it before `js/recipes/molecular-atlas.js`, `js/recipes/molecular-regulation-atlas.js` and `js/recipes/molecular-rna-atlas.js`. These recipes supply RU/EN scenes, notes and questions; ordinary templates carry their source files without loading or registering their scenes.

Create a portable editable atlas with `python3 create.py /new/empty/folder --template molecular --palette ocean`. From the kit root, `python3 tools/build-molecular.py` builds `examples/molecular-atlas.html`; the same command with `--check` compares a fresh temporary build byte for byte. A normal generated lesson contains the source recipe without registering its scenes alongside the default gallery.

```js
const cas = B.cas9(svg, {x:600, y:350, scale:1.7, color:C.blue});
B.emphasis(cas, {level:'normal'});
B.emphasis(cas, {level:'focus', part:'recognition', color:C.gold});
// Later, restore the entire actor's ordinary appearance:
B.emphasis(cas, {level:'normal'});
B.place(cas, 660, 380, 2);
```

`B.emphasis(actor,{level,part?,color?,amount?})` establishes a visual hierarchy: `context` keeps an already explained object subordinate, `normal` keeps the whole object readable, and `focus` gives the current actor or named part a stronger accent. Use a live semantic `C` color. Optional `amount` is a finite number in `[0,1]` (default 1) for blending the selected emphasis into the same persistent actor. Invalid levels, unknown parts and out-of-range emphasis amounts reject. A new emphasis call replaces the previous choice; returning to normal restores the original role colors. Whole-actor opacity remains available to the scene for visibility and transition control. An accent is a teaching state, not an additional protein, a molecular concentration or proof of biochemical activity.

Stroke widths are normalized when `B.place(actor,x,y,scale)` scales geometry. Enlarging dCas9 or an RNA scaffold therefore does not multiply its contour weight. Weights are expressed in the 1280×720 stage coordinate system, so the whole stage still scales naturally with the viewport. Nested transforms authored inside the supplied actors are included in normalization. Place the actor under an unscaled scene parent; a separate scaled ancestor falls outside this normalization. Use `B.place` for actor scaling rather than setting its transform yourself. This mechanism does not alter generic `F.line`, other SVG views or previously authored lessons.

The supplied protein silhouette uses 1.25 stage units; ordinary internal detail is around 0.8, and nucleic-acid backbones are around 1.4–1.75. Full focus raises an ordinary outer edge to 2.2 units while keeping thin internal detail at about 1.05, rather than turning every fold into a heavy outline. Full context multiplies the original ink opacity by 0.45. Ordinary outer contours should remain quieter than a focused feature. Internal domain lines are subordinate to the silhouette; RNA/DNA paths remain identifiable without becoming thick bands. Check the result in both backgrounds and all supported palettes. Never rely on color alone: pair the visual emphasis with a clear current caption or nearby label. Keep labels and connectors outside the contours, including during motion; see [label clearance](label-clearance.md).

Actors own their geometry and expose persistent parts. Create them once during scene mount, then use their setters in one `paint()` driven by cancellable `F.driver`; dispose the driver through `ctx.onDispose`. A setter changes an authored geometric state. It does not solve diffusion, folding, recruitment or transcription rates. Authors supply those states or a separately verified model.

## Actor catalogue and local anchors

Constructors take `(parent, options)`. Common placement options are `x`, `y`, `scale` and a live semantic `color` where relevant. Returned actors expose `g`, `kind`, local-coordinate `anchors`, and named SVG groups; stateful actors also expose `state` and `.set(...)`. Anchors describe positions inside the actor: with the ordinary `B.place` transform, stage coordinates are `[actor.x + actor.scale * x, actor.y + actor.scale * y]`. An anchor does not place or route a connector automatically. DNA and nucleosome `left/right` are layout centers, not backbone endpoints. Use `strandAStart`, `strandAEnd`, `strandBStart`, `strandBEnd` for actual drawn strands; nucleosome `dnaStart/dnaEnd` are the center of its double-strand endpoints. These anchors have graphic coordinates, without asserting 5′/3′ polarity. Some actors also expose `bounds`; these are drawing bounds, not text-layout contracts.

| Constructor | Drawing and authored states | Useful local anchors |
|---|---|---|
| `B.dna` | Two persistent strands and rungs; `.set({open,openX,openWidth,phase})` opens a local bubble. `width`, `amplitude`, `period` control the schematic helix. | `left`, `right` |
| `B.cas9` | Bilobed protein, exposed DNA channel, separate recognition and nuclease regions. DNA and guide RNA are separate actors. | `dnaIn`, `dnaOut`, `guide`, `fusion`, `label` |
| `B.polymerase` | Clamp and core around an open DNA channel; the transcript is a separate actor. | `dnaIn`, `dnaOut`, `rnaExit`, `label` |
| `B.guide` | Cas9 dual RNA or joined sgRNA; `.set({joined,bound})` changes the same spacer and connector. `family:'cas12a'` or `'cas13'` draws a distinct single crRNA handle. | `spacer`, `spacerStart`, `spacerEnd`, `scaffold`, `attach` |
| `B.nucleosome` | Eight histone lobes with front/back DNA wrapping, tails, and two optional H3-tail mark symbols; `.set({marked})`. | `left`, `right`, `mark`, `label` |
| `B.protein` | Role-specific schematic silhouettes selected by `kind`: `krab`, `kap1`, `setdb1`, `hp1`, `nurd`; `generic` is an unnamed protein mnemonic. | `attach`, `label` |
| `B.transcript` | A separate emerging RNA strand with base strokes, suitable for attaching to a polymerase RNA exit. | `start`, `end` |
| `B.ribosome` | Large and small ribonucleoprotein subunits; `.set({separation})` controls an exploded view. mRNA, tRNA and peptide remain independent actors. | `mrnaIn`, `mrnaOut`, `decoding`, `peptideExit`, `large`, `small`, `label` |
| `B.trna` | A 2D cloverleaf; `.set({charged})` reveals an amino-acid symbol at the 3′ end. The actual tertiary fold is approximately L-shaped. | `fivePrime`, `threePrime`, `aminoAcid`, `anticodon`, `dArm`, `tArm`, `label` |
| `B.mrna` | A typical mature eukaryotic message; `.set({width,cap,polyA})` adjusts drawn width and optional features. | `fivePrime`, `cap`, `utr5`, `startCodon`, `cds`, `stopCodon`, `utr3`, `polyA`, `threePrime`, `label` |
| `B.transcriptionFactor` | A generic regulatory-protein mnemonic; `.set({bound})` reveals a DNA contact cue. | `dna`, `interaction`, `linker`, `label` |
| `B.regulatoryLocus` | An enhancer/promoter/gene annotation lane; `.set({width,contact})` adjusts the drawing and illustrative contact cue. Its scale differs from a protein. | `left`, `right`, `enhancer`, `promoter`, `tss`, `gene`, `geneEnd`, `contact`, `label` |

The five expression actors have strict numeric state setters that reject invalid values and unknown keys before modifying state. Their fractions are in `[0,1]`; `mrna.width` is 240–1600 and `regulatoryLocus.width` is 300–1800 stage-local drawing units. A fractional `charged`, `cap` or `bound` value is an opacity transition, not fractional molecular occupancy. Full constructor options, selectable part names and primary references are in [expression actor details](molecular-expression-references.md). Core DNA/guide/nucleosome setters preserve the earlier lesson API and may coerce or clamp visual inputs; they are not scientific-input validators. Validate scientific inputs before mapping them into these authored geometric states.

A `guide` spacer marks the targeting segment, while its scaffold or handle provides the compatible protein-binding fold. The drawn handle is family-level teaching geometry, not a promise that every Cas12a or Cas13 orthologue accepts that exact RNA sequence or conformation. `joined` illustrates the engineered Cas9 sgRNA connection; it is not a molecular conversion occurring spontaneously in the cell. A PAM belongs on target DNA, not on the guide.

Core part names are `base-pairs` (DNA); `recognition`, `nuclease`, `domain-contours` (Cas9); `clamp`, `core` (polymerase); `spacer`, `crrna-repeat`, `scaffold`, `engineered-join`, `dual-rna-pairing` (Cas9 guide; other guide families use `direct-repeat-handle`); `histone-octamer`, `histone-tails`, `histone-methylation`, `wrapped-dna-back`, `wrapped-dna-front` (nucleosome); `body` (repression proteins); and `strand` (transcript).

Named emphasis parts are recorded on SVG groups with `data-bio-part`. Inspect the returned actor's groups or those attributes to choose a part; an actor without that scientific part should not inherit an unrelated label. There are no baked-in text labels. Use `L.textBox` for complete RU/EN labels and provide the intended text region rather than shrinking text to fit a protein silhouette.

## Regulation, RNA processing and enlarged detail

Version 0.14.0 adds three optional groups of operations while retaining the original actor and emphasis APIs:

| Module | Added operations | Contract |
|---|---|---|
| `molecular-regulation.js` | `B.histoneTail`, `B.mediator`, `B.initiationComplex` | [Histone chemistry and initiation](molecular-regulation.md): explicit H3K9 methyl groups, required chemical labels, cooperative PIC organization and limits |
| `molecular-rna-processing.js` | `B.cas12a`, `B.cas13`, `B.preMrna`, `B.spliceosome` | [CRISPR families and RNA processing](molecular-rna-processing.md): distinct actor families, supplied processing states and schematic boundaries |
| `molecular-inspect.js` | `B.inspect` | [Enlarged molecular detail](molecular-inspection.md): an accessible captured view of the existing actor, keyboard opening/closing and disposal |

These modules extend the shared `B` / `K.molecular` object and do not register scenes. The gallery registry belongs before the selected recipes, after actor modules and the inspection helper. In a normal author-created lesson, load only the recipes whose full scenes are desired; their presence on disk is not an instruction to append the atlas to an unrelated explanation. The `molecular` template demonstrates all three recipe groups together.

The shared registry exposes `MOLECULAR_ATLAS.add(id,title,enTitle,captions,enCaptions,notes,enNotes,sourceUrl,sourceLabel,draw,options)`. Supply a unique scene ID and equal-length RU/EN caption and note arrays, one entry per state. Duplicate IDs and mismatched arrays reject. `draw(view,ctx)` creates persistent geometry once and returns `{paint(state)}`; the helper drives `state.p` from 0 through the declared steps. Source links and the standard question about schematic structure enter both language packs. Optional `options.qa` and `options.enQa` replace the standard question with topic-specific bilingual QA; use them when the generic question does not teach the intended scientific distinction. Inspection-enabled recipe callbacks and host integration are documented under [shared gallery definitions](molecular-inspection.md). Reusing the registry keeps scene registration separate from actor modules.

An enlarged detail is the same authored object at the captured state. It neither infers hidden atoms nor continues an independent biological simulation. Give the control a meaningful bilingual label, reserve a usable hit region and follow the inspector's scene cleanup contract. Explicit chemistry labels belong in scene text or the detail composition, not as unexplained decorations inside the actor.

## Scientific boundaries and provenance

The drawings are newly authored SVG compositions developed for an educational CRISPRi lesson, then generalized for reuse in Visual Lesson Kit 0.13.0. Structural references guide the visual organization; reference images and atomic coordinate files are not redistributed inside the module or atlas. The result is intentionally schematic: shape, spacing, number of decorative folds, relative molecular size and motion duration are not structural measurements.

Cas9's two-lobe organization and nucleic-acid channel were informed by the [RCSB PDB-101 Cas9 presentation](https://pdb101.rcsb.org/motm/181). The transcription clamp follows the organization described in [RCSB PDB-101 RNA polymerase](https://pdb101.rcsb.org/motm/40). The nucleosome uses an octamer and wrapped DNA informed by [RCSB PDB-101 nucleosome](https://pdb101.rcsb.org/motm/7) and the [human nucleosome structure 5AV9](https://www.rcsb.org/structure/5AV9). The custom KRAB, KAP1, SETDB1, HP1 and NuRD shapes are distinct role mnemonics, not experimentally determined outlines or a depiction of all subunits in those complexes.

Preserve the following distinctions in authored scenes:

- A Cas9 protein actor becomes a *dCas9* explanation through the stated catalytic inactivation, source and behavior. The same shape alone does not establish whether a nuclease can cut.
- One targeted Cas9 complex uses one compatible guide unit. Dual crRNA + tracrRNA comprise that unit; multiple alternative experimental guides and multiplexed complexes need separate meanings and actors.
- KRAB-associated repression combines recruited partners. KAP1/TRIM28, SETDB1, H3K9 methylation, HP1 and deacetylation-related complexes do not form one universal strict linear chain or an ever-growing solid plug that crushes polymerase.
- Nucleosomal mark symbols refer to histone-tail modification, not DNA methylation. Two visible symbols correspond to the two H3 proteins; their icon count is not a measured modification stoichiometry.
- Polymerase displacement, chromatin closure and dimming of RNA output are authored explanations. CRISPRi can produce context-dependent and heterogeneous expression; a population mean is not proof that every cell responds as an analog dimmer.
- An mRNA with cap and poly(A) tail depicts a chosen mature eukaryotic example, not every RNA in every organism. Gene, regulatory locus, nucleosome and individual protein views may use different scales; state that explicitly when changing between them.

These actors are available under the kit's existing provenance record; this addition does not create a new license for inherited runtime or reference material. See [provenance](provenance.md). Molecular dynamics, folding prediction, atomic rendering and biochemical kinetic simulation remain separate capabilities; the `molecular-simulation` navigation card remains `external`.

## Verification and author responsibilities

The reusable actor checks exercise persistence, setters, emphasis restoration, thickness under actor scaling and compatibility with the rest of the kit. Python scaffold/navigation checks verify local script order, copied guides, optional recipe loading, discoverability, portable generation and standalone build. These checks do not measure actual browser glyph geometry or establish biological validity for a new scene.

After composing an explanation, inspect real endpoints and intermediate frames after fonts load: RU/EN, both backgrounds and both bundled text fonts; compare focused parts against the ordinary contours. Check clearances, connector endpoints, manual interruption, state retention during appearance/language changes, and `ctx.onDispose`. Run the lesson's `build/bundle.py`, then `--check`, and inspect the resulting standalone HTML. Record actual coverage and any unmeasured regions in the release report.
