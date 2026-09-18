# Third-party notices

The Visual Lesson Kit code and documentation are released under the [MIT
License](LICENSE), copyright 2026 Leonid Klarov. The bundled fonts and structural
data below retain their separate terms. The code license does not relicense
publications cited by a lesson.

## Fonts

The unmodified font files are in `starter/assets/fonts/` in the kit and
`assets/fonts/` in a generated project. The [font manifest](licenses/font-manifest.json)
records their upstream download URLs, pinned versions, sizes and SHA-256 hashes.

| Family | Copyright and supplied terms |
|---|---|
| Source Sans 3 | Adobe, 2010–2024; SIL Open Font License 1.1, reserved font name “Source”. [Full notice](licenses/SourceSans3-OFL.md). |
| Source Serif 4 | Adobe, 2014–2023; SIL Open Font License 1.1, reserved font name “Source”. [Full notice](licenses/SourceSerif4-OFL.md). |
| Source Code Pro | Adobe, 2023; SIL Open Font License 1.1, reserved font name “Source”. [Full notice](licenses/SourceCodePro-OFL.md). |
| DejaVu Sans | Bitstream/Arev notices; DejaVu changes are in the public domain. [Full supplied notice](licenses/DejaVuSans-LICENSE.txt). |

Keep these notices with the fonts. The illustrative SVG and standalone lesson
exports also embed font notices. Font licenses do not license article text,
research figures or the lesson runtime.

## Protein Data Bank coordinate data

The kit includes downloaded PDB archive files and selected coordinate extracts
for the following structures. The [wwPDB usage policy](https://www.wwpdb.org/about/usage-policies)
and [RCSB PDB usage policy](https://www.rcsb.org/pages/usage-policy) make PDB archive
data available under the [CC0 1.0 Public Domain Dedication](https://creativecommons.org/publicdomain/zero/1.0/).
The policy encourages attribution of the original structure authors. These
policies were checked on 14 September 2026; they describe archive data, not every
publication or other item linked from a structural record.

| Structure | Attribution | Included data |
|---|---|---|
| [1EHZ](https://www.rcsb.org/structure/1EHZ) | Shi & Moore (2000), [The crystal structure of yeast phenylalanine tRNA at 1.93 Å resolution: a classic structure revisited](https://pmc.ncbi.nlm.nih.gov/articles/PMC1369984/). | `starter/assets/rna-folding/tertiary-1ehz.cif`, selected JSON/JavaScript coordinate extracts, and the tRNA selections in `starter/assets/trna/*.json` and `starter/js/trna-*-data.js`. |
| [1HR2](https://www.rcsb.org/structure/1HR2) | Juneau et al. (2001), [Structural basis of the enhanced stability of a mutant ribozyme domain and a detailed view of RNA-solvent interactions](https://doi.org/10.1016/S0969-2126(01)00579-2). | `starter/assets/rna-folding/motif-1hr2.pdb` and selected JSON/JavaScript coordinate extracts. |
| [7BG9](https://www.rcsb.org/structure/7BG9) | Ghanim et al. (2021), [Structure of human telomerase holoenzyme with bound telomeric DNA](https://doi.org/10.1038/s41586-021-03415-4). | `starter/assets/molecular-views/7BG9.pdb` and selected JSON/JavaScript coordinate extracts. |

Coordinate selections, hashes, model assumptions and further references are in
the [RNA folding source guide](starter/assets/rna-folding/SOURCES.md) and
[molecular views source guide](starter/assets/molecular-views/SOURCES.md), plus the [tRNA film source guide](starter/assets/trna/SOURCES.md).
In generated projects these guides are at `assets/rna-folding/SOURCES.md` and
`assets/molecular-views/SOURCES.md`; the `starter/` prefix is omitted.
The drawings distinguish source coordinates from authored explanatory motion.

## Distribution

`create.py` copies this file, the supplied `licenses/` directory and any root
`LICENSE` into each generated project. `build/bundle.py` retains this file, any
root `LICENSE`, and the `.md`/`.txt` files in `licenses/` as escaped, inert JSON
inside the standalone HTML (`visual-lesson-kit-notices`). This attribution block
does not add viewer controls or require a network request. Citation links and
source metadata in the lessons remain available separately.
