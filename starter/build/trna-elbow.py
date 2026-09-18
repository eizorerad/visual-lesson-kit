#!/usr/bin/env python3
"""Extract and validate the seven-residue 1EHZ elbow fixture; Python stdlib only.

The atomic coordinates and IDs come directly from the supplied official mmCIF.
Covalent adjacencies are explicit chemical templates, checked against coordinates;
contact guides use deposited heavy-atom names, never added hydrogen positions.
"""
import argparse
import hashlib
import json
import math
import shlex
import sys
from pathlib import Path

SOURCE_SHA256 = '3021dd2b6461f850bb66d6748d3c22a5e1bb6cc891c625c15d793f38215b28ab'
COMPONENTS = {18: 'G', 19: 'G', 54: '5MU', 55: 'PSU', 56: 'C', 57: 'G', 58: '1MA'}
PYRIMIDINE = [['N1', 'C2', 'N3', 'C4', 'C5', 'C6']]
PURINE = PYRIMIDINE + [['C4', 'C5', 'N7', 'C8', 'N9']]
RINGS = {name: PURINE if name in ('G', '1MA') else PYRIMIDINE for name in ('G', '5MU', 'PSU', 'C', '1MA')}
EXO = {'G': [['C6', 'O6'], ['C2', 'N2']], 'C': [['C2', 'O2'], ['C4', 'N4']],
       '5MU': [['C2', 'O2'], ['C4', 'O4'], ['C5', 'C5M']],
       'PSU': [['C2', 'O2'], ['C4', 'O4']], '1MA': [['C6', 'N6'], ['N1', 'CM1']]}
GLYCO = {'G': 'N9', 'C': 'N1', '5MU': 'N1', 'PSU': 'C5', '1MA': 'N9'}
SUGAR = ["C1'", "C2'", "C3'", "C4'", "O4'"]
CHEM = [["C4'", "C5'"], ["C5'", "O5'"], ["O5'", 'P'], ['P', 'OP1'], ['P', 'OP2'], ["C3'", "O3'"], ["C2'", "O2'"]]
CONTACTS = [('G18-PSU55', (18, 'N1'), (55, 'O4'), 'imino to carbonyl'),
            ('G18-PSU55', (18, 'N2'), (55, 'O4'), 'amino to the same carbonyl'),
            ('G19-C56', (19, 'O6'), (56, 'N4'), 'carbonyl to amino'),
            ('G19-C56', (19, 'N1'), (56, 'N3'), 'imino to ring nitrogen'),
            ('G19-C56', (19, 'N2'), (56, 'O2'), 'amino to carbonyl')]


def require(condition, message):
    if not condition:
        raise ValueError(message)


def read_atoms(path):
    fields, result = [], {}
    for line in path.read_text().splitlines():
        if line.startswith('_atom_site.'):
            fields.append(line.split()[0].split('.', 1)[1])
        elif line.startswith(('ATOM ', 'HETATM ')):
            values = shlex.split(line)
            require(len(values) == len(fields), 'Malformed atom_site record')
            r = dict(zip(fields, values))
            if r['pdbx_PDB_model_num'] != '1' or r['auth_asym_id'] != 'A':
                continue
            i = int(r['auth_seq_id'])
            if i not in COMPONENTS:
                continue
            require(r['auth_comp_id'] == COMPONENTS[i], 'Unexpected residue identity at ' + str(i))
            require(r['type_symbol'] != 'H', 'Selected source unexpectedly contains hydrogens')
            require(r['label_alt_id'] == '.' and r['label_asym_id'] == 'A', 'Alternate location or chain mismatch')
            key = (i, r['auth_atom_id'])
            require(key not in result, 'Duplicate source atom ' + str(key))
            xyz = [float(r['Cartn_' + axis]) for axis in 'xyz']
            require(all(math.isfinite(v) for v in xyz), 'Nonfinite source coordinate')
            result[key] = {'xyz': xyz, 'element': r['type_symbol'], 'occupancy': float(r['occupancy'])}
    require(result, 'No selected atomic coordinates')
    return result


def centroid(points):
    return [sum(p[i] for p in points) / len(points) for i in range(3)]


def sub(a, b):
    return [x - y for x, y in zip(a, b)]


def dot(a, b):
    return sum(x * y for x, y in zip(a, b))


def cross(a, b):
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]


def unit(v):
    norm = math.sqrt(dot(v, v))
    require(norm > 1e-8, 'Degenerate view axis')
    return [x / norm for x in v]


def build(root):
    raw = root / 'assets/rna-folding/tertiary-1ehz.cif'
    sha = hashlib.sha256(raw.read_bytes()).hexdigest()
    require(sha == SOURCE_SHA256, 'Supplied mmCIF no longer matches the verified official 1EHZ source')
    source = read_atoms(raw)
    residues, links, base_centers = [], [], {}
    for i, component in COMPONENTS.items():
        atoms = {name: record['xyz'] for (j, name), record in source.items() if j == i}
        edges = set()
        for ring in RINGS[component] + [SUGAR]:
            edges.update(tuple(sorted(pair)) for pair in zip(ring, ring[1:] + ring[:1]))
        edges.update(tuple(sorted(pair)) for pair in EXO[component] + CHEM + [["C1'", GLYCO[component]]])
        covered = {atom for edge in edges for atom in edge}
        require(covered == set(atoms), f'Chemical graph does not cover every deposited heavy atom at {i}: {covered ^ set(atoms)}')
        for a, b in sorted(edges):
            distance = math.dist(atoms[a], atoms[b])
            require(1.1 < distance < 1.9, f'Implausible covalent adjacency {i}:{a}-{b}: {distance}')
            links.append({'refs': [[i, a], [i, b]], 'kind': 'within-residue', 'distance_angstrom': distance})
        names = list(dict.fromkeys(atom for ring in RINGS[component] for atom in ring))
        center = centroid([atoms[name] for name in names])
        base_centers[str(i)] = center
        residues.append({'id': i, 'component': component, 'atoms': atoms,
                         'elements': {name: source[i, name]['element'] for name in atoms},
                         'base_center': center, 'glycosidic_bond': ["C1'", GLYCO[component]],
                         'covalent_bonds': [list(edge) for edge in sorted(edges)]})
    boundaries = [[18, 19], [54, 55], [55, 56], [56, 57], [57, 58]]
    for i, j in boundaries:
        distance = math.dist(source[i, "O3'"]['xyz'], source[j, 'P']['xyz'])
        require(1.4 < distance < 1.9, f'Broken source O3-prime/P boundary {i}-{j}')
        links.append({'refs': [[i, "O3'"], [j, 'P']], 'kind': 'phosphodiester', 'distance_angstrom': distance})
    contacts = []
    for group, a, b, description in CONTACTS:
        distance = math.dist(source[a]['xyz'], source[b]['xyz'])
        require(2.5 < distance < 3.3, 'Unexpected donor/acceptor separation: ' + str((a, b)))
        contacts.append({'group': group, 'refs': [list(a), list(b)], 'distance_angstrom': distance,
                         'kind': 'donor-acceptor heavy-atom contact guide', 'description': description})
    # Readable face view: horizontal axis joins G19/C56 ring centers; normal is
    # derived from G19 ring atoms, then made perpendicular to that axis.
    x = unit(sub(base_centers['56'], base_centers['19']))
    g19 = {name: value['xyz'] for (i, name), value in source.items() if i == 19}
    raw_z = cross(sub(g19['C4'], g19['N9']), sub(g19['C8'], g19['N9']))
    z = unit([v - dot(raw_z, x) * x[i] for i, v in enumerate(raw_z)])
    y = unit(cross(z, x))
    basis = [x, y, z]
    require(abs(dot(x, cross(y, z)) - 1) < 1e-10, 'View frame is not right-handed')
    for i in range(3):
        for j in range(3):
            require(abs(dot(basis[i], basis[j]) - (1 if i == j else 0)) < 1e-10, 'Nonorthonormal view frame')
    origin = centroid(list(base_centers.values()))
    vertices = set(source)
    adjacency = {a: set() for a in vertices}
    for link in links:
        a, b = map(tuple, link['refs'])
        adjacency[a].add(b)
        adjacency[b].add(a)
    unseen, components = vertices.copy(), []
    while unseen:
        todo, group = [min(unseen)], set()
        while todo:
            current = todo.pop()
            if current in group:
                continue
            group.add(current)
            todo.extend(adjacency[current] - group)
        unseen -= group
        components.append(sorted({i for i, atom in group}))
    require(sorted(components) == [[18, 19], [54, 55, 56, 57, 58]], 'Omitted chain interval was bridged or chemical fragment disconnected')
    require(len(source) == 153, 'Expected 153 selected deposited heavy atoms')
    require(all(v['occupancy'] == 1 for v in source.values()), 'Unexpected partial-occupancy selected atom')
    return {
        'schemaVersion': 1, 'pdb_id': '1EHZ', 'chain': 'A', 'model': 1,
        'source_url': 'https://files.rcsb.org/download/1EHZ.cif',
        'entry_url': 'https://www.rcsb.org/structure/1EHZ',
        'source_file': 'assets/rna-folding/tertiary-1ehz.cif', 'mmcif_sha256': sha,
        'primary_paper_url': 'https://doi.org/10.1017/S1355838200000364',
        'interaction_sources': [
            {'title': 'Pan et al., 2008, Figure 1A', 'url': 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2440604/', 'supports': '1EHZ elbow stacking groups and the G18-PSU55/G19-C56 tertiary pairs'},
            {'title': 'Oliva et al., 2006, Table 1 and G18-PSU55/G19-C56 sections', 'url': 'https://pmc.ncbi.nlm.nih.gov/articles/PMC1361619/', 'supports': 'Bifurcated G18-PSU55 and Watson-Crick G19-C56 base interactions in 1EHZ'}],
        'method': 'X-RAY DIFFRACTION', 'resolution_angstrom': 1.93, 'units': 'angstrom',
        'selection': [18, 19, 54, 55, 56, 57, 58],
        'ring_atom_orders': RINGS, 'exocyclic_bonds': EXO, 'glycosidic_atoms': GLYCO,
        'sugar_ring': SUGAR, 'chem_links': CHEM, 'residues': residues,
        'bonds': boundaries, 'covalent_links': links, 'contacts': contacts,
        'baseCenters': base_centers, 'origin': origin, 'view_origin': origin,
        'view_basis': basis, 'pair_origin': centroid([base_centers['19'], base_centers['56']]),
        'stacking_groups': [[19, 56], [57], [18, 55], [54, 58]],
        'validation': {'residue_count': 7, 'heavy_atom_count': len(source), 'covalent_link_count': len(links),
                       'phosphodiester_boundary_count': len(boundaries), 'connected_fragments': sorted(components),
                       'covalent_distance_range_angstrom': [min(l['distance_angstrom'] for l in links), max(l['distance_angstrom'] for l in links)],
                       'all_coordinates_from_source': True, 'all_selected_atoms_full_occupancy': True, 'source_has_no_selected_hydrogens': True},
        'display_notes': [
            'All coordinates and atom/component names are unchanged from model 1, chain A of the verified 1EHZ mmCIF.',
            'PSU55 is pseudouridine, with the C1-prime-to-C5 C-glycosidic bond. Do not draw the uridine C1-prime-to-N1 bond.',
            'The deposited PSU55 atom contacted by G18 N1 and N2 is named O4. Keep this deposited name even when a classification source uses different carbonyl numbering.',
            'The two G18/PSU55 guides converge on one O4 atom. Guides mark literature-supported donor/acceptor heavy-atom geometry; hydrogen positions and angles are not supplied.',
            'G19-C56 is a Watson-Crick base pair participating in tertiary inter-loop packing. It is not one of the 21 conventional stem pairs in the lesson cloverleaf.',
            'Stacking groups reproduce the selected part of Pan et al. Figure 1A. Their order is spatial, not sequence order; no new covalent links connect groups.',
            'Only 18-to-19 and 54-to-55-to-56-to-57-to-58 are represented as continuous backbone segments. Residues 20 through 53 are omitted, not joined directly.',
            'The view basis and origin are authored camera framing derived from the unchanged coordinates, not new molecular coordinates or a folding trajectory.',
            'No energy, force, probability or pathway is inferred from the plotted contact lengths.'
        ]
    }


def json_text(data):
    return json.dumps(data, ensure_ascii=False, indent=2, allow_nan=False) + '\n'


def js_text(data):
    value = json_text(data).rstrip().replace('&', '\\u0026').replace('<', '\\u003c').replace('>', '\\u003e').replace('\u2028', '\\u2028').replace('\u2029', '\\u2029')
    return '// Generated by build/trna-elbow.py from the supplied official 1EHZ mmCIF.\nwindow.TRNA_ELBOW_DATA = ' + value + ';\n'


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--project', type=Path, default=Path(__file__).resolve().parents[1])
    p.add_argument('--check', action='store_true', help='Check source and generated JSON/JS without writing')
    args = p.parse_args()
    try:
        root = args.project.resolve()
        data = build(root)
        outputs = {root / 'assets/trna/elbow-1ehz.json': json_text(data), root / 'js/trna-elbow-data.js': js_text(data)}
        for filename, value in outputs.items():
            if args.check:
                require(filename.is_file() and filename.read_text() == value, 'Generated file is absent or stale: ' + str(filename.relative_to(root)))
            else:
                filename.parent.mkdir(parents=True, exist_ok=True)
                filename.write_text(value)
        print(json.dumps({'ok': True, 'mode': 'check' if args.check else 'write', 'validation': data['validation'], 'contacts': data['contacts']}, ensure_ascii=False))
        return 0
    except (OSError, ValueError, KeyError, IndexError) as error:
        print('tRNA elbow: ' + str(error), file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
