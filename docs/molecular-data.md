# Import a source structure for molecular views

Use the bundled `MOLECULAR_VIEW_DATA` immediately for the telomerase example. To use another source structure, edit a small JSON selection file and run the offline importer. The output is data for the molecular-view constructor and `MC`; a presentation script should not contain PDB parsing or chemical connectivity guesses.

## Rebuild the bundled fixture

Run these commands from a generated project, or from `starter/` in the library:

```sh
python3 build/molecular-data.py \
  --source assets/molecular-views/7BG9.pdb \
  --config assets/molecular-views/7BG9.config.json \
  --json assets/molecular-views/7BG9.json \
  --js js/molecular-views-data.js \
  --global MOLECULAR_VIEW_DATA

# Append --check to the same command to compare both outputs without writing.
python3 build/bundle.py
```

The importer uses only the Python standard library. It never downloads a structure. `--check` regenerates in memory and compares **both JSON and JavaScript byte-for-byte**; a missing or stale output exits with status 1. An unchanged check does not rewrite files. Run the normal import, then rebuild the HTML after changing a source or selection. Updating a raw file is an intentional source change; inspect its new SHA and provenance before release.

## The selection file

The complete editable configuration is `assets/molecular-views/7BG9.config.json`. This compact example shows the fields; lists of residue numbers are explicit, not inclusive range expressions:

```json
{
  "pdb_id": "7BG9",
  "source_url": "https://files.rcsb.org/download/7BG9.pdb",
  "model": 1,
  "altloc": "",
  "records": ["ATOM", "HETATM"],
  "traces": [
    {"chain": "A", "atom": "CA", "max_link_distance": 5},
    {"chain": "B", "atom": "P", "max_link_distance": 8},
    {"chain": "N", "atom": "P", "max_link_distance": 8}
  ],
  "fragments": {
    "rna": {"chain": "B", "polymer": "RNA", "residues": [46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56]},
    "dna": {"chain": "N", "polymer": "DNA", "residues": [13, 14, 15, 16, 17, 18]}
  },
  "frame": {
    "anchors": {
      "x": [{"chain": "N", "residue": 13, "atom": "P"}, {"chain": "N", "residue": 18, "atom": "P"}],
      "y": [{"chain": "N", "residue": 16, "atom": "P"}, {"chain": "B", "residue": 51, "atom": "P"}]
    }
  }
}
```

- `model` is required. A PDB without `MODEL` records is explicitly model 1. If several models exist, exactly the requested one is selected; duplicate IDs and malformed boundaries are errors.
- `altloc` is required. `""` selects blank-only atoms. `"A"` selects common blank atoms plus conformer A. There is no occupancy ranking or fallback to another conformer. Conflicting blank/A coordinates for the same atom are errors; required atoms absent from the chosen conformer are also errors.
- `records` explicitly selects `"ATOM"`, `"HETATM"`, or both. The default is both, preserving all prior importer behavior; an empty, duplicate or unknown selection is an error. For a polymer-only view of a PDB whose author chains also contain waters/ions, choose `"records": ["ATOM"]`. The unchanged source SHA and this selection are stored in root and fragment provenance. This does not make all HETATM records irrelevant: they can include biologically important ligands or modified polymer residues. Review what was excluded; modified nucleotide chemistry still needs curated topology.
- `chain` means the one-character **author PDB chain**, not the mmCIF label-asym ID. Trace row IDs are chain + author number (`B46`); fragment IDs are author residue numbers (`46`). Trace chains must be unique.
- Each trace includes all modeled residues of its source chain and requires the requested landmark atom in each residue. Common choices are protein `CA`, nucleic acid `P`, or `C4'`. A trace is a guide through landmarks, not a chemical bond model.
- Each named fragment contains one chain and explicit source-order residue IDs. Canonical RNA `A/C/G/U` and DNA `DA/DC/DG/DT` are supported. Protein atomistic fragments, modified nucleotides, ligands and mixed polymers require separately curated data. Do not rename them into canonical components to bypass the check.
- `frame.anchors.x` defines the local x direction. The component of `frame.anchors.y` perpendicular to x defines y; x × y defines z. Alternatively supply `frame.basis: [[...],[...],[...]]`, an orthonormal matrix with determinant +1. Collinear anchors or a left-handed basis are errors.
- `frame.origin` optionally supplies a finite `[x,y,z]` center. Otherwise the mean of all trace landmarks is used. These settings change the display frame; the stored source coordinates are never centered, rotated or rounded again.

## What is preserved and what is bounded

The importer reads standard fixed-column PDB `ATOM` and `HETATM` records. It preserves selected Cartesian values in Å, component names, author numbering, order and TER discontinuities. Insertion codes, reused author residue IDs across TER, alternate component identities, hybrid-36/extended numbering and ambiguous duplicate atoms are rejected. Use a curated identity-preserving conversion for these cases, or a fuller structure parser; this small tool is not an mmCIF/assembly toolkit.

The importer does not assemble biological symmetry mates, use `SEQRES` to fill missing coordinates, infer hydrogen bonds, read chemical truth from interatomic proximity, or compute motion. In particular:

1. Link candidates first require adjacency in the source polymer order, consecutive author numbers and the same TER segment. Subsetting cannot bridge an omitted source residue.
2. Trace candidates then pass a finite landmark-distance check (default 5 Å for `CA`, 8 Å otherwise). These are display segments only.
3. Nucleotide candidates use the canonical directed O3′→P adjacency, checked within 1–2 Å by default. A fragment may explicitly lower `max_link_distance` if needed. Distance can remove a candidate, never create one between unrelated atoms or residues. Omitted candidates and their reason appear in root `omissions`; inspect this list when changing the structure.
4. Base rings, sugar ring, backbone, glycosidic and exocyclic paths come from canonical residue topology. Purines attach at N9, pyrimidines at N1. RNA includes its modeled C2′–O2′ branch; DNA does not gain one. Existing OP1/OP2 phosphate branches are retained. This is an explicit depiction subset, not a complete force-field topology.

Each fragment has a `context` containing **all modeled residues of its source chain within the explicitly selected record types**, with C4′ landmarks and gap-aware canonical links. This is not the complete biological molecule when the experiment lacks coordinates for some residues. All context landmarks are required; silently losing context is an error. If water/Mg records share the polymer's author chain, the default all-record selection fails on their missing polymer landmark. Use the explicit `records` setting when their exclusion matches the intended view.

## Output contract

```js
const data = MOLECULAR_VIEW_DATA;
// data.pdb_id, model, altloc, records, source_url, source_sha256, coordinate_units
// data.origin, basis, traces, fragments, omissions
const template = data.fragments.rna;
// template.residues, sugar_ring, backbone, bonds, context
// template has its own origin and the identical source basis/provenance.
MC.validateRNA(template); // the historical API also accepts explicit canonical DNA topology
```

The JS output assigns one global, chosen with `--global`; it must be a single JavaScript identifier. Load it before the lesson script. The JSON is the reviewable record; the JS is a generated offline registry. They contain the same data. Do not hand-edit either to change scientific selections: change the config and regenerate. For component rendering contracts, see [molecular coordinates](molecular-coordinates.md); for a complete source record, see `assets/molecular-views/SOURCES.md`.

## Verification

In the central library:

```sh
python3 -m unittest discover -s tests -p test_molecular_data.py
```

These tests exercise source/model/alternate/record selection, exact coordinates, canonical RNA/DNA topology, complete context, numbering and TER gaps, rejected unsupported identities, valid and invalid frames, and non-writing stale checks. The bundled fixture regression checks every exported trace coordinate and every selected atomic coordinate against the unmodified PDB. A second real-source regression imports the 33-residue 1HR2 RNA loop/receptor subset from the bundled unchanged PDB with `records: ["ATOM"]`, retaining 708 selected atoms and all 157 modeled RNA context positions while explicitly excluding same-chain HETATM Mg/waters. These tests establish import fidelity within the supported format; they do not establish the biological interpretation or visual quality of a new lesson.
