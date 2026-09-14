# RNA targeting and processing actors

## API contract

Load `js/molecular.js`, then `js/molecular-rna-processing.js`, before scene scripts. These constructors extend the existing `B` / `K.molecular` object and use the same live semantic colors, stroke normalization and `B.emphasis` behavior. New nodes are created only at construction. Setters preserve all SVG node identities, including the pre-mRNA intron as it changes shape.

```js
const rna = B.preMrna(svg, {x:640, y:330, width:850, spliced:0});
rna.set({spliced:0.5}); // branched intron still attached to exon 2
rna.set({spliced:1});   // joined exons, separate intron lariat
B.emphasis(rna, {level:'focus', part:'intron', color:C.gold});
```

All constructors accept ordinary `x`, `y`, `scale` placement. `B.place` must be used when scaling an actor, so its thin strokes stay independent of molecular size. Positions must be finite numbers and scale must be positive. There are no embedded text labels. Use `L.textBox` to supply RU/EN labels outside molecular bounds.

Every numeric state is strict: values must be finite JavaScript numbers; fractions must be in `[0,1]`. Unknown state keys, invalid values, arrays, `null` and non-object patches reject before state or geometry changes. `.set()` with no argument repaints existing state. Invalid numeric constructor state is checked before creating the SVG actor. A valid state patch can be animated with the kit's cancellable driver; scene authors still own cleanup.

| Constructor | Numeric state and options | Parts for emphasis | Main anchors |
|---|---|---|---|
| `B.cas12a` | `opening` defaults to 0; `color` defaults to `C.blue`. | `recognition`, `nuclease`, `ruvc` | `dnaIn`, `dnaOut`, `guide`, `recognition`, `ruvc`, `fusion`, `label` |
| `B.cas13` | `opening` defaults to 0; `color` defaults to `C.purple`. | `recognition`, `nuclease`, `hepn-1`, `hepn-2` | `rnaIn`, `rnaOut`, `guide`, `recognition`, `hepn1`, `hepn2`, `label` |
| `B.preMrna` | `width` defaults to 600 and accepts 300–1400 local graphic units; `spliced` defaults to 0. `color` optionally sets intron color; exons retain blue/teal roles. | `exon-1`, `exon-2`, `intron`, `branchpoint`, `exon-junction` | `fivePrime`, `threePrime`, `exon1`, `exon2`, `exon1End`, `exon2Start`, `intronStart`, `intronEnd`, `branchpoint`, `intron`, `junction`, `label` |
| `B.spliceosome` | `separation` defaults to 0; `color` optionally sets the main protein scaffold color. | `protein-scaffold`, `accessory-proteins`, `u2-snrna`, `u5-snrna`, `u6-snrna`, `catalytic-region` | `substrateIn`, `substrateOut`, `activeSite`, `u2`, `u5`, `u6`, `protein`, `label` |

All actors expose `g`, `kind`, `state`, `.set()`, `bounds`, and local `anchors`. Stage coordinates follow `[actor.x + actor.scale*x, actor.y + actor.scale*y]`. Read anchors after each state update: moving component anchors follow their component in both axes, including Cas13's guide and recognition anchors. Bounds describe the authored drawing, not its real molecular dimensions. `opening` and `separation` create explanatory exploded views; they do not denote binding energy, nuclease activation, assembly order or an observed molecular trajectory. Nucleic acids remain separate from Cas protein drawings. A Cas12a/Cas13 silhouette alone does not establish catalytic inactivation; name and explain dCas variants explicitly in a lesson.

## Scientific sequence and boundaries

`B.preMrna` depicts one conventional spliceosomal intron. At `spliced:0`, both exon–intron boundaries are connected. From 0 to 0.5, the same intron path forms a lariat; at exactly 0.5 its beginning meets its branchpoint, its other end is still attached to exon 2, and exon 1 is free. From 0.5 to 1, the same exon paths approach, their endpoints join, and the intron separates. These endpoint relations are tested. The morph between chemical states is a teaching transition, not continuous bond formation or a calibrated timescale.

The branchpoint is an adenosine. In the first transesterification its 2′ hydroxyl forms the 2′–5′ lariat linkage to the intron start. The second reaction joins the exons. Detailed atoms, sequence recognition, branchpoint chemistry and most spliceosomal components are omitted. RNA intron removal does **not** delete the corresponding DNA. Exons need not be entirely protein-coding. RNA cap, poly(A) tail, multiple introns, alternative exon choices and subsequent lariat debranching are outside this actor's current scope.

`B.spliceosome` is deliberately a ribonucleoprotein assembly, with visible RNA folds among separate protein shapes. It selects the U2/U5/U6-containing catalytic stage of the major spliceosome, inspired by human C* complex. U1 and U4 have roles in earlier stages and are not depicted here. The number and size of schematic protein lobes do not assert actual subunit stoichiometry. U2/U6 participate in the catalytic RNA core; U5 helps position exons. Its substrate anchors are layout interfaces, not atom-resolved attachment coordinates.

Cas12a's native guide is a compatible crRNA; a separate tracrRNA is not required. Cas13a uses crRNA to recognize an RNA target. Guide handles and protein silhouettes vary across orthologues; these drawings are representative teaching constructions, not universal family structures. Active Cas13 can have target and collateral RNA cleavage behaviors; the actor does not automatically perform either. Neither Cas actor contains a target strand, guide, cut mark or chemical-state toggle.

## Primary references and visual provenance

The following primary structure pages and their displayed assembly images were actually opened and visually inspected while authoring this addition (13 September 2026). No reference image or atomic coordinate file is redistributed in the module or atlas. Contours are new SVG paths that retain the kit's thin-line visual hierarchy; they are not traced atomic surfaces.

- [Yamano et al., Cell, 2016 — AsCpf1/Cas12a with crRNA and target DNA, PDB 5B43](https://www.rcsb.org/structure/5B43). The viewed assembly shows an irregular bilobed protein around a nucleic-acid channel. The drawing uses a compact asymmetric silhouette and separate recognition/nuclease regions. The historically proposed division of target and non-target strand cleavage between two sites in the 2016 abstract is not asserted here; `ruvc` marks only a schematic RuvC region.
- [Zetsche et al., Cell, 2015 — Cpf1 is a single RNA-guided endonuclease](https://doi.org/10.1016/j.cell.2015.09.038). Supports the crRNA-only native guide architecture and DNA targeting. The atlas does not include guide sequences or experiment instructions.
- [Liu et al., Cell, 2017 — LbuCas13a–crRNA–target RNA, PDB 5XWP](https://www.rcsb.org/structure/5XWP). The inspected ribbon image shows an elongated protein organization surrounding guide–target RNA. The two HEPN regions are emphasized as protein regions; their drawn boundaries are not amino-acid annotations. The deposited structure includes mutations, so the reference is used for organization rather than to claim that the drawn object has a particular catalytic status.
- [Bertram et al., Nature, 2017 — human spliceosome C* complex, PDB 5MQF](https://www.rcsb.org/structure/5MQF). The inspected assembly surface image shows a large asymmetric multipart complex. The schematic therefore uses several separate protein components and explicit U2/U5/U6 RNA paths. The publication describes the catalytic U2–U6 core and branched intron positioning before exon ligation. The drawing omits most resolved and flexible components.

Colors encode scientific roles, not atomic elements. Relative sizes between a Cas protein, pre-mRNA sequence map and spliceosome view are not comparable molecular scales. The optional `js/recipes/molecular-rna-atlas.js` registers four bilingual examples only after the shared molecular atlas helper is loaded; it adds no scenes to an ordinary lesson by itself. Every example has one note per state and topic-specific RU/EN questions with primary sources.

## Verification

`tests/molecular-rna-processing.cjs` checks node persistence across forward and reverse states, finite anchors, Cas13 anchor motion in both axes, atomic rejection of malformed patches, preserved exon/intron identities, the distinct first and second reaction endpoints, separate guide/target actors, composition of the spliceosome, and normalized selectable emphasis. Every actor undergoes scale and emphasis round trips with exact restoration of SVG attributes, bounds and anchors; the pre-mRNA test also exercises both width limits. Browser inspection is still required for the actual authored scene fonts, label clearances and intermediate frames; these numerical/DOM checks do not establish atomic accuracy or biological kinetics.
