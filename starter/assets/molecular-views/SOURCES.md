# Telomerase coordinate fixture

The fixture reproduces the source-backed overview and RNA–DNA close-up used in the telomerase lesson. It is an editable example for the molecular-view constructor, not a molecular simulation.

**Structural source:** [RCSB PDB 7BG9](https://www.rcsb.org/structure/7BG9), [structure DOI](https://doi.org/10.2210/pdb7BG9/pdb), [coordinate download](https://files.rcsb.org/download/7BG9.pdb). This is the catalytic-core lobe of human telomerase bound to a DNA substrate. The associated cryo-EM reconstruction has 3.8 Å resolution. This resolution is not a guarantee of the precision of every modeled atom.

**Primary publication:** Ghanim et al. (2021), *Nature* 593, 449–453, [Structure of human telomerase holoenzyme with bound telomeric DNA](https://doi.org/10.1038/s41586-021-03415-4). The whole holoenzyme includes an additional H/ACA RNP lobe. This fixture does not silently assemble it from a separately refined structure. DNA is the bound substrate, not a permanent third catalytic-core subunit.

The source links were checked on 14 September 2026. Raw `7BG9.pdb` was copied **without modification** from the independently authored telomerase lesson's downloaded RCSB file. Its SHA-256 is:

```text
dbc78e3ec2d041cc51efebe813c107ed813472766fd735ae53ef9e0234b9ad43
```

## Selection and provenance

`7BG9.config.json` is the editable specification; `7BG9.json` and `../../js/molecular-views-data.js` are deterministically generated with `../../build/molecular-data.py`. The original PDB, model selection, altloc/record selection, source URL, units, SHA, coordinate frame and explicit displayed links travel with the fixture. There are no MODEL blocks or nonblank alternate atoms in this PDB; the config explicitly selects model 1, blank altloc and both ATOM/HETATM record types.

The following counts come from the local source-coordinate extraction, not the length of the full biological molecules:

| Author chain | Role | Overview landmark | Modeled landmarks |
|---|---|---|---:|
| A | TERT | Cα | 913 |
| B | hTR / TERC | P | 256 |
| N | DNA substrate | P | 6 |
| M | Histone H2B | Cα | 90 |
| L | Histone H2A | Cα | 82 |

The `rna` detail selects B:46–56, source sequence `5′-CUAACCCUAAC-3′`; `dna` selects N:13–18, source sequence `5′-TTAGGG-3′`. Their source coordinates and author IDs remain unchanged. Context includes the complete **modeled** chain (256 RNA positions or 6 DNA positions); absent coordinates are not reconstructed. The 256 modeled RNA positions must not be labelled as the entire 451-nucleotide human telomerase RNA. [RCSB record and deposited sequence lengths](https://www.rcsb.org/structure/7BG9).

The display basis is right-handed: x follows P(N13)→P(N18), y is the perpendicular component of P(N16)→P(B51), and z = x × y. Rotating or zooming this frame changes the camera, not the source structure. Overview lines join adjacent source landmarks; they are not full atomistic bonds. Close-up paths use canonical nucleotide topology and validate source-neighbor O3′→P links. Numbering gaps and TER boundaries remain disconnected; the current extraction has no extra distance-rejected candidate links.

The example reveals spatial relationships in an experimentally derived coordinate model. It does not show a measured folding/catalysis trajectory, the complete holoenzyme, all waters/ions, or a full atomic/bond depiction. A biological mechanism animation needs its own evidence and explicitly labelled schematic motion.
