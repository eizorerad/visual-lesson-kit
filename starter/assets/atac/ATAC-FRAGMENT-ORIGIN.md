# Connecting chromatin geometry to insert length

The new `AtacFragmentOrigin` actor supplies the missing explanation between the three-dimensional chromatin view and the fragment-length histogram. It follows two separate illustrative molecules. They are not records in the generated 150-fragment data set.

## Scientific basis and limits

- **Nearby accessible positions can delimit a short insert.** The original ATAC-seq study reports enrichment of short fragments in nucleosome-free regions and nucleosome-associated structure in the insert-size distribution. Its approximately 200-bp periodicity was an observed population pattern in those samples, not a universal size rule. [Buenrostro et al., 2013, Fig. 2](https://doi.org/10.1038/nmeth.2688). The author manuscript was checked at [this institutional copy](https://web-genobioinfo.toulouse.inrae.fr/~sdjebali/fragencode/biblio/Buenrostro_atal_2013_ataq_seq.pdf), especially Results, “ATAC-seq insert sizes disclose nucleosome positions.”
- **Two accessible flanks can delimit an insert spanning nucleosomal DNA.** Therefore the interval between the measured ends can include DNA protected from insertion; interval coverage and insertion-site density are different measurements. Schep and colleagues display the resulting joint pattern of fragment length and fragment midpoint. The article also discusses nucleosome breathing: protection is not an absolute prohibition of insertion throughout a fixed 147-bp region. The animation should never turn this illustrative long fragment into a universal classifier. [Schep et al., 2015, Fig. 1](https://doi.org/10.1101/gr.192294.115), [primary article PDF](https://genome.cshlp.org/content/genome/early/2015/10/08/gr.192294.115.full.pdf).
- **A nucleosome contains DNA wrapped around a histone core.** The actor uses the paired C4′ DNA traces and the same eight-chain histone cartoon from deposited 1KX5 coordinates as the opening and detailed views. Histone tails and zero-occupancy uncertainty marks are retained. Accessible flanks and the placement of this representative particle are authored, rather than an experimentally determined ATAC substrate. [Davey et al., 2002; PDB 1KX5](https://www.rcsb.org/structure/1KX5).

The two boundary markers are schematic ends of selected products. They do not resolve the strand-specific nine-base Tn5 stagger. That chemistry belongs to the separate local-event inset. The gold and violet terminal segments denote attached adapter DNA; their lengths are not included in the drawn genomic contour comparison.

## Three linked states

| Stage | Visible explanation |
| --- | --- |
| `0` | A short, gently curved DNA segment has two nearby boundary markers and adapter ends. |
| `1` | The short example moves aside. A second molecule stays wrapped around a core, with its selected ends in exposed flanks. The contiguous DNA between those ends includes the wrap. |
| `2` | The core disappears first. Both same molecules straighten as a change of representation, with their adapter ends retained. They share an origin and a common scale, so the longer DNA contour becomes apparent. |

This is an explanatory representation change, not a molecular-dynamics trajectory of histone removal or DNA relaxation. Exact base-pair counts, molecular dimensions, probability values, and biological timing are intentionally absent.

## Integration and numerical contract

Load `js/atac-fragment-origin.js` after `D`, `L`, `F`, semantic palette `C`, `AtacStructures`, `AtacHistoneCoreData`, and `AtacHistoneCartoon` are available. The source model and its strand offsets are transformed together; tangent linkers connect continuously to their endpoints.

```js
const origin = AtacFragmentOrigin.create(svg);
origin.paint({ visibility: 1, stage: 0, turn: 0 });
origin.paint({ visibility: 1, stage: 1.5, turn: 20 });
origin.paint({ visibility: 1, stage: 2, turn: 0 });
ctx.onDispose(origin.dispose);
```

`stage` is continuous and clamped to `0…2`; `turn` is a schematic camera angle in degrees. Every paint derives coordinates directly from the pose, allowing deterministic seeking. All SVG geometry nodes persist. Hidden actors skip geometry computation. Depth sorting only mutates DOM order when the sorted order changes. All text has RU/EN entries and `L.textBox` contracts.

The original centerline consists of edges with fixed lengths. To straighten it, the actor continuously changes the unwrapped direction angles of each edge and then reconstructs the polyline with its original edge lengths. It does not interpolate endpoint positions, which would shrink the contour. The camera can foreshorten this three-dimensional path during rotation; the final comparison uses a shared linear scale. The snapshot reports `modelContourLength` and `contourLength` in arbitrary schematic units for independent checks. No visible value is presented as a biological length.

Protein opacity reaches zero by `stage = 1.22`. Geometric unrolling begins only after `stage = 1.24`, preserving the selected DNA continuously. At the final state, both genomic left boundaries project to `x = 335`. Adapter extensions remain outside that interval.

## Bounded verification

`node qa/atac/origin.cjs` provides a portable 75-check audit of the assembled film. It independently projects source knots and checks the actual SVG DNA paths, all eight visible histone chains, uncertainty dashes, endpoint visibility, 33 transition samples, persistent nodes and reverse seeking. Contour-length error is below `1e-8` schematic units. The report is `qa-output/atac/origin-report.json`; captures are under `qa-output/atac/origin/`; `qa/atac/3d.cjs` and the whole-film visual sweep check its integration.

The following histogram is a separate view of the original 150 synthetic records. `qa/atac/narrative.cjs` checks 21 samples of this handoff: the two origin examples fade without a blank interval, the signal renderer enters its length-distribution state directly, and each original fragment contributes once to the final histogram. Intermediate bar heights grow with admitted fragments; the two explanatory molecules are never counted as 150 records.
