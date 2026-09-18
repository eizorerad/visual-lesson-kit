#!/usr/bin/env python3
"""Audit the tRNA journey's source identity and chemical geometry, offline."""

import argparse
import hashlib
import importlib.util
import json
import math
import re
import sys
from pathlib import Path


def import_helpers(root):
    path = root / 'qa/rna-folding/science.py'
    spec = importlib.util.spec_from_file_location('rna_source_helpers', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def chemical_fragment(data, source, h):
    rows = {r['id']: r for r in data['residues']}
    ids = list(range(1, 8)) + list(range(66, 73))
    h.require(len(rows) == len(data['residues']) and sorted(rows) == ids,
              'Acceptor-stem residue selection changed')
    vertices, links = set(), set()
    for i, residue in rows.items():
        for name, coordinate in residue['atoms'].items():
            h.same_atom(source, i, name, coordinate, residue['component'])
            vertices.add((i, name))
        rings = data['ring_atom_orders'][residue['component']] + [["C1'", "C2'", "C3'", "C4'", "O4'"]]
        local = set()
        for ring in rings:
            local.update(tuple(sorted(pair)) for pair in zip(ring, ring[1:] + ring[:1]))
        local.update(tuple(sorted(pair)) for pair in data['exocyclic_bonds'][residue['component']])
        local.update(tuple(sorted(pair)) for pair in [
            ["C1'", 'N9' if residue['component'] in ('A', 'G') else 'N1'],
            ["C4'", "C5'"], ["C5'", "O5'"], ["O5'", 'P'], ['P', 'OP1'], ['P', 'OP2'],
            ["C3'", "O3'"], ["C2'", "O2'"],
        ])
        if 'OP3' in residue['atoms']:
            local.add(('OP3', 'P'))
        links.update(((i, a), (i, b)) for a, b in local)
        if i + 1 in rows:
            links.add(((i, "O3'"), (i + 1, 'P')))
    h.require(len(vertices) == 299 and len(links) == 332, 'Expected 299 heavy atoms and 332 covalent links')
    distances = [math.dist(rows[a[0]]['atoms'][a[1]], rows[b[0]]['atoms'][b[1]]) for a, b in links]
    h.require(all(1.1 < d < 1.9 for d in distances), 'Implausible covalent bond in acceptor stem')
    fragments = [sorted(set(i for i, _ in group)) for group in h.components(vertices, links)]
    h.require(fragments == [list(range(1, 8)), list(range(66, 73))],
              'Omitted interval was bridged or a valid fragment was broken')
    boundaries = [math.dist(rows[i]['atoms']["O3'"], rows[i + 1]['atoms']['P'])
                  for i in rows if i + 1 in rows]
    h.require(len(boundaries) == 12 and all(1.4 < d < 1.9 for d in boundaries),
              'Incorrect contiguous phosphodiester boundaries')
    guides = data['pair_contact_guides']
    h.require([tuple(g['residues']) for g in guides] == [(3, 70)] * 3 + [(4, 69)] * 2 + [(5, 68)] * 2,
              'Selected base-pair guides changed')
    guide_distances = []
    for guide in guides:
        a, b = guide['residues']
        n, m = guide['atoms']
        distance = math.dist(rows[a]['atoms'][n], rows[b]['atoms'][m])
        h.require(abs(distance - guide['heavy_atom_distance_angstrom']) < 1e-12,
                  'Stored contact distance does not match source coordinates')
        h.require(2.5 < distance < 3.6, 'Unexpected donor/acceptor heavy-atom separation')
        guide_distances.append(distance)
    return {'residues': len(rows), 'heavy_atoms': len(vertices), 'covalent_links': len(links),
            'contiguous_phosphodiester_boundaries': len(boundaries), 'fragments': fragments,
            'covalent_distance_range_A': [min(distances), max(distances)],
            'pair_contact_distances_A': guide_distances, 'basis_error': h.basis_check(data['view_basis']),
            'all_coordinates_match_mmCIF': True}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--project', type=Path, default=Path(__file__).resolve().parents[2])
    parser.add_argument('--out', type=Path, default=Path('qa-output/trna/science'))
    args = parser.parse_args()
    root = args.project.resolve()
    out = (root / args.out).resolve()
    if out.is_relative_to(root / 'qa'):
        print('Output must be outside QA source directory', file=sys.stderr)
        return 1
    result = {'ok': False, 'checks': {}, 'errors': [], 'limitations': [
        'Checks verify source coordinates, parent bases, selections and covalent geometry; they do not infer a folding pathway or run a structure predictor.',
        'The 21 cloverleaf stem pairs do not enumerate all tertiary interactions; D/T proximity is not classified as a new canonical pair.',
        'Camera motion, rendering clearance, atomic occlusion and legibility need separate browser checks.',
    ]}
    try:
        h = import_helpers(root)
        assets = root / 'assets/rna-folding'
        raw = assets / 'tertiary-1ehz.cif'
        source = h.read_cif(raw)
        sha = hashlib.sha256(raw.read_bytes()).hexdigest()
        data = json.loads((root / 'assets/trna/trna-data.json').read_text())
        embedded = h.literal({root / 'js/trna-data.js'}, r'\bwindow\.TRNA_DATA\s*=\s*')
        h.require(embedded == data, 'TRNA_DATA embedded JS differs from JSON')
        h.require(data['sourceHash'] == sha, 'TRNA_DATA source SHA-256 mismatch')
        h.require(data['pdbId'] == '1EHZ' and data['chain'] == 'A' and data['model'] == 1,
                  'Source structure identity changed')
        h.require(data['sourceURL'] == 'https://files.rcsb.org/download/1EHZ.cif', 'Wrong source URL')
        h.require(data['selectedAtom'] == "C4'" and data['units'] == 'angstrom', 'Coordinate semantics changed')
        match = re.search(r'^_entity_poly\.pdbx_seq_one_letter_code_can\s+([ACGU]+)\s*$', raw.read_text(), re.M)
        h.require(match is not None and data['sequence'] == match.group(1), 'Canonical sequence differs from mmCIF')
        h.require(len(data['sequence']) == 76 and [r['id'] for r in data['residues']] == list(range(1, 77)),
                  'Incomplete or incorrectly numbered tRNA')
        original = json.loads((assets / 'trna-1ehz.json').read_text())
        h.digest(original, raw)
        h.require(data['basis'] == original['view_basis_rows'] and data['origin'] == original['view_origin_angstrom'],
                  'Original view basis or origin changed')
        for r, old in zip(data['residues'], original['residues']):
            h.same_atom(source, r['id'], "C4'", r['xyz'], r['component'])
            h.require(r['xyz'] == old['c4prime'] and r['component'] == old['component'], 'Original residue record changed')
            h.require(r['base'] == data['sequence'][r['id'] - 1], 'Parent-base sequence mapping mismatch')
        modified = [{'id': r['id'], 'component': r['component'], 'base': r['base']}
                    for r in data['residues'] if r['component'] not in ('A', 'C', 'G', 'U')]
        h.require(data['modified'] == modified and [r['id'] for r in modified] == [10, 16, 17, 26, 32, 34, 37, 39, 40, 46, 49, 54, 55, 58],
                  'Modified-residue identity or count changed')
        h.require(data['anticodon'] == [34, 35, 36] and [data['residues'][i - 1]['component'] for i in data['anticodon']] == ['OMG', 'A', 'A'],
                  'Anticodon must retain OMG34, A35, A36')
        h.require(data['cca'] == [74, 75, 76] and [data['residues'][i - 1]['component'] for i in data['cca']] == ['C', 'C', 'A'],
                  'CCA residue labels changed')
        pairs = data['stemPairs']
        h.require(pairs == original['display']['secondary_stem_pairs'] and len(pairs) == 21, 'Cloverleaf pairing changed')
        paired = []
        for pair in pairs:
            h.require(len(pair) == 2 and all(isinstance(i, int) for i in pair), 'Invalid stem-pair indices')
            i, j = pair
            h.require(1 <= i < j <= 76 and data['sequence'][i - 1] + data['sequence'][j - 1] in {'AU', 'UA', 'GC', 'CG', 'GU', 'UG'},
                      f'Noncomplementary parent-base stem pair {i}–{j}')
            paired.extend(pair)
        h.require(len(set(paired)) == len(paired), 'A residue belongs to multiple cloverleaf pairs')
        distances = [math.dist(source['A', i, "O3'"]['xyz'], source['A', i + 1, 'P']['xyz']) for i in range(1, 76)]
        h.require(all(1.4 < d < 1.9 for d in distances), 'Full-chain phosphodiester boundary is broken')
        result['checks']['whole_tRNA'] = {'residues': 76, 'modified_residues': len(modified), 'stem_pairs': len(pairs),
            'C4prime_coordinates_match_mmCIF': True, 'canonical_sequence_matches_mmCIF': True,
            'all_75_phosphodiester_boundaries_verified': True, 'O3_P_range_A': [min(distances), max(distances)],
            'basis_error': h.basis_check(data['basis']), 'JSON_and_JS_agree': True, 'source_sha256': sha}
        atom_fixture = json.loads((assets / 'duplex-connected-1ehz.json').read_text())
        h.digest(atom_fixture, raw)
        atom_embed = h.literal({root / 'js/trna-atoms.js'}, r'\bconst\s+DATA\s*=\s*')
        h.require(atom_embed == atom_fixture, 'New atomic actor fixture differs from supplied JSON')
        result['checks']['atomic_acceptor_stem'] = chemical_fragment(atom_fixture, source, h)
        result['checks']['atomic_acceptor_stem']['embedded_fixture_matches'] = True
        tertiary = json.loads((assets / 'tertiary-v4-1ehz.json').read_text())
        h.digest(tertiary, raw)
        h.require(sum(len(r['atoms']) for r in tertiary['residues']) == 440, 'Coaxial fixture must retain 440 selected heavy atoms')
        expected = list(range(1, 8)) + list(range(49, 54)) + list(range(61, 73))
        result['checks']['supporting_coaxial_fixture'] = h.tertiary(tertiary, source, expected, 76,
            [(7, 'O4', 66, 'N6'), (49, 'N4', 65, 'O6')])
        h.require([65, 66] in tertiary['bonds'] and [7, 49] not in tertiary['bonds'], 'Incorrect coaxial-stem covalent connectivity')
        result['ok'] = True
    except (AssertionError, OSError, ValueError, KeyError, TypeError, IndexError) as error:
        result['errors'].append(str(error))
    out.mkdir(parents=True, exist_ok=True)
    report = out / 'science.json'
    report.write_text(json.dumps(result, ensure_ascii=False, indent=2, allow_nan=False) + '\n')
    print(json.dumps({'ok': result['ok'], 'report': str(report), 'checks': list(result['checks']), 'errors': result['errors']}, ensure_ascii=False))
    return 0 if result['ok'] else 1


if __name__ == '__main__':
    sys.exit(main())
