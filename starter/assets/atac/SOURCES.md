# ATAC film data and provenance

The package was promoted from the final reviewed 46-cue ATAC film (source artifact SHA-256 `9d40322177a218377ce6395fcb2309114f9d894d65a94918693400276f39934b`). A generated artifact has its own hash. Historical source-film results are recorded separately in [SOURCE-FILM-REVIEW.md](SOURCE-FILM-REVIEW.md); they do not replace a new project's QA.

## What is measured, synthetic, or authored

| Asset | Origin and limits |
|---|---|
| `structures/1KX5-assembly1.cif` | Saved RCSB biological assembly: 147-bp nucleosome core, eight histone chains, two DNA strands. No linker DNA or neighbouring nucleosomes. |
| `structures/1MUH-assembly1.cif` | Saved RCSB biological assembly: two Tn5 protein subunits and two short transposon-end duplexes. No target genomic DNA or complete modern ATAC adapters. |
| `structures/*-entry.json`, `*-assembly1.json` | Saved experimental-entry and biological-assembly metadata. |
| `structures/provenance.json` | Raw-coordinate SHA-256 hashes, URLs, chain identities, atom selections, omissions and geometry criteria. |
| `js/atac-structures.js` | Source-derived Cα/C4′ traces and base centroids; source coordinates in ångström. Broken/missing residues remain breaks. |
| `js/atac-histone-core-data.js` | Eight protein chains, helix annotations and one proper similarity frame. Dashed edges mark deposited zero-occupancy positions; they are not experimentally localized tail conformations. |
| `js/atac-data.js` | Deterministic synthetic locus: 150 original inserts, 12 explicitly known PCR copies, read length 30 bases. Not a biological dataset or peak caller. |
| `story-copy.json` | All 46 bilingual default cue titles, captions, notes and source links. Overrides belong in `js/atac-config.js`; keep scientific qualifications with reused episodes. |
| Camera/docking/straightening/reading motion | Authored explanation. It does not simulate molecular dynamics, predict accessibility or reproduce a sequencer. The two origin examples are not the 150 histogram records. |

Only ATAC-specific experimental assets are included in this folder. Reuse individual source objects with the same IDs, units, occupancy and missing-residue semantics. For a different experimental model, rederive the data and independently audit chains, residue correspondence and rendering; changing a PDB label alone is insufficient.

## Reproduce without network access

From the generated project's root:

```sh
python3 assets/atac/structures/extract.py
python3 build/atac-histone-core.py
python3 build/atac-film.py
python3 build/atac-film.py --check
node qa/atac/science.cjs
```

The film builder runs source extraction, histone extraction, copy generation and the standalone bundler in this order. Each script resolves its project from its own location, so an absolute script path also works from another current directory. Python's standard library is sufficient; these commands do not download data. `--check` verifies source-derived output without writing it. Keep `provenance.json` with any copied coordinates.

See [scientific map](ATAC-LITERATURE.md), [3D source boundaries](ATAC-3D-SOURCES.md), [fragment-origin contract](ATAC-FRAGMENT-ORIGIN.md), [reading contract](ATAC-READING-SOURCES.md) and [portable QA](../../qa/atac/README.md). Primary coordinates: [RCSB 1KX5](https://www.rcsb.org/structure/1KX5), [RCSB 1MUH](https://www.rcsb.org/structure/1MUH). Full article links accompany the cue copy and source map.
