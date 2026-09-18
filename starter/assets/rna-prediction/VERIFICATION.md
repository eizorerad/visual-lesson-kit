# Library transfer verification — 2026-09-18

The `rna-prediction` template was generated into a fresh project and bundled as
an offline HTML lesson. All 20 scenes and 91 authored states were retained.

| Check | Observed result |
| --- | --- |
| Template, navigation, scaffold and existing RNA folding regression tests | 39 Python tests passed |
| Indexed molecule, animation driver and easing boundary tests | 24 Node tests passed |
| Static prediction data, pair identities and schematic geometry | 4,573 assertions passed |
| Fresh ViennaRNA 2.7.2 calculation | All 99 structures, energy decomposition, JSON and embedded script matched |
| Shared atomic source audit | Six audit groups passed against the supplied PDB/mmCIF data |
| Browser layout | 728 states across RU/EN × sans/serif × black/white; no reported failures |
| Browser motion | 142 transitions across RU/sans/black and EN/serif/white; 1,593 sampled intermediate frames; no reported failures |
| Browser interaction | 16 checks passed, including interrupted navigation and direct replay |
| Standalone execution | No external requests, request failures or runtime errors reported |
| Stored library example | Byte-for-byte match with a fresh template build |

Browser engine: Chrome 153.0.8010.48 through Playwright. Representative screenshots
of energy contributions, pair-preserving spatial geometry and alignment evidence
were also inspected. Runtime files used in the browser checks matched the central
starter after verification. The original story modules, durations and phase
windows were preserved; the indexed molecule received an input-validation fix
for sparse pair lists.

The source-coordinate audit now follows local script references in `index.html`;
inactive templates cannot create false duplicate-data failures. A regression test
also confirms that altering the selected lesson's embedded data still fails.

These checks establish portability, numerical consistency and tested browser
behavior. They do not establish experimental RNA structure accuracy, a physical
folding trajectory, correctness for unsupported molecule topologies, or gestures
on a physical touch device. See `SOURCES.md` and `COMPUTATION.md` for provenance.
