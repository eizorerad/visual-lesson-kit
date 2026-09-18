#!/usr/bin/env python3
"""Extract the complete deposited tRNA heavy-atom set for a space-filling view.

Pinned offline source: PDB 1EHZ, model 1, author chain A, residues 1-76.
No atom is rebuilt, averaged, moved, or added. Solvent and metal ions are omitted.
"""
import argparse
from collections import Counter
import hashlib
import json
import math
from pathlib import Path
import shlex
import sys

SOURCE_SHA256 = '3021dd2b6461f850bb66d6748d3c22a5e1bb6cc891c625c15d793f38215b28ab'
RADII = {'C': 1.70, 'N': 1.55, 'O': 1.52, 'P': 1.80, 'S': 1.80}
EXPECTED_ELEMENTS = {'C': 746, 'N': 294, 'O': 536, 'P': 76}
EXPECTED_MODIFICATIONS = {10: '2MG', 16: 'H2U', 17: 'H2U', 26: 'M2G', 32: 'OMC', 34: 'OMG', 37: 'YYG', 39: 'PSU', 40: '5MC', 46: '7MG', 49: '5MC', 54: '5MU', 55: 'PSU', 58: '1MA'}


def require(ok, message):
    if not ok:
        raise ValueError(message)


def atom_rows(path):
    fields = []
    for line in path.read_text().splitlines():
        if line.startswith('_atom_site.'):
            fields.append(line.split()[0].split('.', 1)[1])
        elif line.startswith(('ATOM ', 'HETATM ')):
            values = shlex.split(line)
            require(len(values) == len(fields), 'Malformed atom_site record')
            yield dict(zip(fields, values))


def build(root):
    raw = root / 'assets/rna-folding/tertiary-1ehz.cif'
    sha = hashlib.sha256(raw.read_bytes()).hexdigest()
    require(sha == SOURCE_SHA256, 'The supplied mmCIF differs from the pinned official 1EHZ source')
    atoms, excluded, components, residue_counts, altlocs = [], [], {}, Counter(), Counter()
    source_ids, source_keys = set(), set()
    for row in atom_rows(raw):
        if row['pdbx_PDB_model_num'] != '1':
            continue
        residue = int(row['auth_seq_id'])
        selected = row['auth_asym_id'] == 'A' and 1 <= residue <= 76
        if not selected:
            excluded.append(row)
            continue
        require(row['label_asym_id'] == 'A' and row['label_entity_id'] == '1', 'A selected atom is not in the tRNA polymer entity')
        require(int(row['label_seq_id']) == residue, 'Unexpected author/label residue numbering discrepancy')
        require(row['pdbx_PDB_ins_code'] in ('.', '?'), 'Unexpected insertion code')
        # This exact entry has no alternates. Reject changes rather than silently
        # choosing an alternate or duplicating/averaging molecular positions.
        altlocs[row['label_alt_id']] += 1
        require(row['label_alt_id'] == '.', 'Alternate atomic position needs an explicit new selection policy')
        require(float(row['occupancy']) == 1.0, 'Unexpected partial occupancy in selected tRNA')
        element = row['type_symbol']
        require(element in RADII, 'Unsupported element or hydrogen unexpectedly present: ' + element)
        atom_id, name, component = int(row['id']), row['auth_atom_id'], row['auth_comp_id']
        require(name == row['label_atom_id'] and component == row['label_comp_id'], 'Author/label atom or component identity mismatch')
        require(atom_id not in source_ids and (residue, name) not in source_keys, 'Duplicate selected atom')
        source_ids.add(atom_id)
        source_keys.add((residue, name))
        require(residue not in components or components[residue] == component, 'Multiple components at one residue')
        components[residue] = component
        residue_counts[residue] += 1
        xyz = [float(row['Cartn_' + axis]) for axis in 'xyz']
        require(all(math.isfinite(v) for v in xyz), 'Nonfinite source coordinate')
        atoms.append({'id': atom_id, 'residue': residue, 'component': component, 'name': name, 'element': element, 'xyz': xyz})
    atoms.sort(key=lambda a: a['id'])
    counts = Counter(a['element'] for a in atoms)
    require(len(atoms) == 1652 and dict(counts) == EXPECTED_ELEMENTS, 'Incomplete deposited heavy-atom coverage')
    require([a['id'] for a in atoms] == list(range(1, 1653)), 'Deposited tRNA atom IDs are incomplete or reordered')
    require(sorted(components) == list(range(1, 77)), 'Expected every residue 1-76')
    require({i: c for i, c in components.items() if c not in ('A', 'C', 'G', 'U')} == EXPECTED_MODIFICATIONS, 'Modified component identities changed')
    # Independent continuity check against the existing C4-prime lesson fixture.
    trace = json.loads((root / 'assets/trna/trna-data.json').read_text())
    require(trace['sourceHash'] == sha, 'Whole-trace fixture uses a different source')
    lookup = {(a['residue'], a['name']): a for a in atoms}
    for residue in trace['residues']:
        atom = lookup[residue['id'], "C4'"]
        require(atom['xyz'] == residue['xyz'] and atom['component'] == residue['component'], 'Space-fill/C4 trace identity mismatch')
    exclusions = dict(Counter(r['auth_comp_id'] for r in excluded))
    require(exclusions == {'MG': 6, 'MN': 3, 'HOH': 160}, 'Unexpected solvent/ion inventory in pinned source')
    return {
        'schemaVersion': 1, 'pdbId': '1EHZ', 'chain': 'A', 'labelChain': 'A', 'model': 1,
        'sourceURL': 'https://files.rcsb.org/download/1EHZ.cif',
        'entryURL': 'https://www.rcsb.org/structure/1EHZ',
        'primaryPaperURL': 'https://doi.org/10.1017/S1355838200000364',
        'sourceFile': 'assets/rna-folding/tertiary-1ehz.cif', 'sourceHash': sha,
        'method': 'X-RAY DIFFRACTION', 'resolutionAngstrom': 1.93, 'units': 'angstrom',
        'selection': 'All deposited heavy atoms in tRNA polymer entity 1, model 1, author/label chain A, residues 1-76.',
        'altlocPolicy': {'policy': 'Require absent alternate locations; reject ambiguous or changed sources. No averaging or implicit conformer choice.', 'observed': dict(altlocs), 'allOccupancyOne': True},
        'counts': {'atoms': len(atoms), 'residues': len(components), 'modifiedResidues': len(EXPECTED_MODIFICATIONS),
                   'elements': dict(sorted(counts.items())), 'hydrogens': 0, 'excludedModel1Atoms': len(excluded), 'excludedComponents': exclusions},
        'residues': [{'id': i, 'component': components[i], 'atomCount': residue_counts[i]} for i in range(1, 77)],
        'radii': RADII,
        'radiusConvention': {
            'name': 'Conventional element-wise Bondi van der Waals radii', 'units': 'angstrom',
            'primarySource': {'title': 'Bondi, 1964. van der Waals Volumes and Radii', 'doi': '10.1021/j100785a001', 'url': 'https://doi.org/10.1021/j100785a001'},
            'verifiedTableSource': {'title': 'Mantina et al., 2009. Consistent van der Waals Radii for the Whole Main Group, Table 12', 'doi': '10.1021/jp8111556', 'url': 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3658832/'},
            'note': 'Radii are a conventional depiction model, not quantities measured separately for these atoms. Sulfur is included in the radius table but no sulfur is present in the selected 1EHZ tRNA atoms.'
        },
        'displayNotes': [
            'Each sphere is centered on one unchanged deposited heavy-atom coordinate; atom and residue identities remain fixed during representation changes.',
            'This heavy-atom space-filling depiction omits hydrogen atoms, which are not present in the source. No hydrogens are reconstructed.',
            'All 76 residues and 14 modified nucleotide components are retained. Waters, six magnesium ions and three manganese ions are excluded from this tRNA actor.',
            'Changing sphere visibility/radius shows a change of representation, not molecular inflation or a physical folding trajectory.',
            'Element-wise van der Waals spheres are a molecular depiction, not a measured electron-density or solvent-accessible surface.',
            'Colors may encode residue/region identity independently of the element-based radii. No chemical meaning should be inferred from color without the scene legend.'
        ],
        'atoms': atoms
    }


def json_text(data):
    # Keep each atomic record on one line while leaving metadata easy to read.
    metadata = {k: v for k, v in data.items() if k != 'atoms'}
    head = json.dumps(metadata, ensure_ascii=False, indent=2, allow_nan=False).rstrip()
    records = ',\n'.join('    ' + json.dumps(a, ensure_ascii=False, separators=(',', ':'), allow_nan=False) for a in data['atoms'])
    return head[:-1].rstrip() + ',\n  "atoms": [\n' + records + '\n  ]\n}\n'


def js_text(data):
    value = json.dumps(data, ensure_ascii=False, separators=(',', ':'), allow_nan=False)
    value = value.replace('&', '\\u0026').replace('<', '\\u003c').replace('>', '\\u003e').replace('\u2028', '\\u2028').replace('\u2029', '\\u2029')
    return '// Generated by build/trna-spacefill.py from the pinned official 1EHZ mmCIF.\nwindow.TRNA_SPACEFILL_DATA=' + value + ';\n'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--project', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--check', action='store_true', help='Verify source selection and generated JSON/JS without writing')
    args = parser.parse_args()
    try:
        root = args.project.resolve()
        data = build(root)
        outputs = {root / 'assets/trna/spacefill-1ehz.json': json_text(data), root / 'js/trna-spacefill-data.js': js_text(data)}
        for filename, content in outputs.items():
            if args.check:
                require(filename.is_file() and filename.read_text() == content, 'Generated data absent or stale: ' + str(filename.relative_to(root)))
            else:
                filename.parent.mkdir(parents=True, exist_ok=True)
                filename.write_text(content)
        print(json.dumps({'ok': True, 'mode': 'check' if args.check else 'write', 'counts': data['counts'], 'sourceHash': data['sourceHash']}, ensure_ascii=False))
        return 0
    except (OSError, ValueError, KeyError, IndexError) as error:
        print('tRNA space-fill: ' + str(error), file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
