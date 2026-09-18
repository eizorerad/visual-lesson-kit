#!/usr/bin/env python3
"""Independently audit the 1EHZ Mg560 fixture against its pinned mmCIF."""
import argparse
import hashlib
import itertools
import json
import math
from pathlib import Path
import re
import shlex
import sys

PINNED_SHA = '3021dd2b6461f850bb66d6748d3c22a5e1bb6cc891c625c15d793f38215b28ab'


def require(ok, message):
    if not ok:
        raise ValueError(message)


def source_rows(path):
    names, rows = [], {}
    for line in path.read_text().splitlines():
        if line.startswith('_atom_site.'):
            names.append(line.split()[0].split('.', 1)[1])
        elif line.startswith(('ATOM ', 'HETATM ')):
            values = shlex.split(line)
            require(len(names) == len(values), 'Malformed source atom row')
            row = dict(zip(names, values))
            rows[int(row['id'])] = row
    return rows


def audit(root):
    fixture = root / 'assets/trna/magnesium-1ehz.json'
    require(fixture.is_file(), 'Magnesium fixture is absent')
    data = json.loads(fixture.read_text())
    source = root / 'assets/rna-folding/tertiary-1ehz.cif'
    require(hashlib.sha256(source.read_bytes()).hexdigest() == PINNED_SHA == data['sourceHash'],
            'Source SHA-256 does not match pinned source and fixture')
    rows = source_rows(source)
    script = (root / 'js/trna-magnesium-data.js').read_text()
    match = re.search(r'window\.TRNA_MAGNESIUM_DATA\s*=\s*(\{.*\});\s*$', script, re.S)
    require(match and json.loads(match.group(1)) == data, 'Embedded JavaScript differs from JSON')
    require(data['pdbId'] == '1EHZ' and data['model'] == 1 and data['units'] == 'angstrom',
            'Source identity or coordinate units changed')
    records = [data['magnesium']] + data['waters'] + data['phosphates']
    records += [a for group in data['phosphateGroups'] for a in group['atoms']]
    atoms = {}
    for atom in records:
        raw = rows[atom['id']]
        require(atom['xyz'] == [float(raw['Cartn_' + axis]) for axis in 'xyz'],
                f"Atom {atom['id']} coordinates differ from source")
        for field, source_field in [('name', 'auth_atom_id'), ('element', 'type_symbol'),
                                    ('component', 'auth_comp_id'), ('auth_chain', 'auth_asym_id'),
                                    ('label_chain', 'label_asym_id'), ('label_seq_id', 'label_seq_id'),
                                    ('label_atom_id', 'label_atom_id'), ('label_comp_id', 'label_comp_id'),
                                    ('label_entity_id', 'label_entity_id'), ('altloc', 'label_alt_id'),
                                    ('source_formal_charge', 'pdbx_formal_charge')]:
            require(atom[field] == raw[source_field], f"Atom {atom['id']} identity mismatch: {field}")
        require(atom['residue'] == int(raw['auth_seq_id']) and atom['model'] == int(raw['pdbx_PDB_model_num']),
                'Source model or residue mismatch')
        require(atom['occupancy'] == float(raw['occupancy']) == 1 and atom['altloc'] == '.',
                'Unresolved alternate/partial atom')
        require(atom['b_iso_angstrom_squared'] == float(raw['B_iso_or_equiv']), 'Source B factor mismatch')
        require(atom['element'] != 'H', 'Water hydrogens must not be invented')
        require(atom['id'] not in atoms or atoms[atom['id']] == atom, 'Conflicting duplicate atom identity')
        atoms[atom['id']] = atom
    mg = data['magnesium']
    require((mg['id'], mg['residue'], mg['name'], mg['auth_chain'], mg['label_chain']) ==
            (1658, 560, 'MG', 'A', 'G'), 'Wrong deposited Mg560 atom')
    require([(w['id'], w['residue'], w['label_chain'], w['name']) for w in data['waters']] ==
            [(1804 + i, 725 + i, 'K', 'O') for i in range(6)], 'Wrong deposited hydration shell')
    require([p['residue'] for p in data['phosphates']] == list(range(1, 77)) and
            all(p['element'] == 'P' and p['name'] == 'P' and p['label_chain'] == 'A' for p in data['phosphates']),
            'Charge overlay must use all 76 deposited phosphate positions')
    covalent = []
    require([g['id'] for g in data['phosphateGroups']] == [8, 11, 12], 'Phosphate group selection changed')
    for group in data['phosphateGroups']:
        residue = group['id']
        atom_map = {(a['residue'], a['name']): a for a in group['atoms']}
        keys = {(residue, n) for n in ('P', 'OP1', 'OP2', "O5'", "C5'")}
        keys |= {(residue - 1, n) for n in ("O3'", "C3'")}
        require(set(atom_map) == keys and len(group['atoms']) == 7, 'Phosphate stub atom selection changed')
        pair_names = [((residue, 'P'), (residue, n)) for n in ('OP1', 'OP2', "O5'")]
        pair_names += [((residue, 'P'), (residue - 1, "O3'")),
                       ((residue, "O5'"), (residue, "C5'")),
                       ((residue - 1, "O3'"), (residue - 1, "C3'"))]
        expected = {tuple(sorted([atom_map[a]['id'], atom_map[b]['id']])) for a, b in pair_names}
        require({tuple(sorted(pair)) for pair in group['covalentBonds']} == expected and
                len(group['covalentBonds']) == 6, 'Incorrect covalent phosphate graph')
        for a, b in group['covalentBonds']:
            distance = math.dist(atoms[a]['xyz'], atoms[b]['xyz'])
            require(1.3 < distance < 1.9, 'Invalid phosphate covalent distance')
            covalent.append(distance)
    require([link['atomIds'] for link in data['coordinationLinks']] == [[1658, i] for i in range(1804, 1810)],
            'Mg coordination must end at six water oxygens, not RNA')
    require([c['atomIds'] for c in data['waterPhosphateContacts']] == [[1804, 241], [1805, 154], [1807, 221]],
            'Water-phosphate guide selection changed')
    for key, lower, upper in [('coordinationLinks', 1.99, 2.01), ('waterPhosphateContacts', 2.5, 3.2)]:
        for contact in data[key]:
            a, b = contact['atomIds']
            distance = math.dist(atoms[a]['xyz'], atoms[b]['xyz'])
            require(lower < distance < upper and abs(distance - contact['distanceAngstrom']) < 1e-12,
                    'Contact distance does not match deposited geometry')
    dot = lambda a, b: sum(x * y for x, y in zip(a, b))
    basis = data['view_basis']
    for i, j in itertools.product(range(3), repeat=2):
        require(abs(dot(basis[i], basis[j]) - int(i == j)) < 1e-12, 'Camera basis is not orthonormal')
    a, b, c = basis
    det = a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0])
    require(abs(det - 1) < 1e-12, 'Camera basis changes handedness')
    require(data['origin'] == mg['xyz'] == data['hydration_origin'], 'Hydration origin must remain Mg560')
    closeup = [mg] + data['waters'] + [a for g in data['phosphateGroups'] for a in g['atoms']]
    bounds = data['view_bounds']
    minimum_separation = math.inf
    # The fixture stores an independently padded 0–20° reference envelope.
    # This is not the authored film camera (0° yaw, 10° bridge tilt); magnesium-projection.cjs
    # checks the actual semantic camera poses and their visible sphere bounds.
    for angle in range(81):
        theta = math.radians(angle / 4)
        projected = []
        for atom in closeup:
            d = [v - w for v, w in zip(atom['xyz'], data['view_origin'])]
            x, y, z = [dot(row, d) for row in basis]
            point = [x * math.cos(theta) + z * math.sin(theta), y, -x * math.sin(theta) + z * math.cos(theta)]
            for axis in range(3):
                require(bounds['low'][axis] + .59 <= point[axis] <= bounds['high'][axis] - .59,
                        'Close-up atom crosses the fixture reference envelope (0–20 degrees)')
            projected.append(point)
        minimum_separation = min(minimum_separation, min(math.dist(a[:2], b[:2]) for a, b in itertools.combinations(projected[:7], 2)))
    require(minimum_separation > .8, 'Hydration shell has near end-on overlaps in the fixture reference sweep')
    return {'sourceHash': PINNED_SHA, 'uniqueAtoms': len(atoms), 'chargePhosphates': 76,
            'hydrationWaters': 6, 'phosphateGroups': 3, 'covalentLinks': len(covalent),
            'covalentDistanceRangeAngstrom': [min(covalent), max(covalent)],
            'mgWaterDistancesAngstrom': [c['distanceAngstrom'] for c in data['coordinationLinks']],
            'waterPhosphateDistancesAngstrom': [c['distanceAngstrom'] for c in data['waterPhosphateContacts']],
            'minProjectedHydrationCenterSeparationAngstrom': minimum_separation,
            'cameraFrames': 81, 'cameraCoverage': 'fixture reference envelope, 0–20 degrees; actual film poses are checked by magnesium-projection.cjs',
            'JSONMatchesEmbeddedJavaScript': True}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--project', type=Path, default=Path(__file__).resolve().parents[2])
    args = parser.parse_args()
    try:
        print(json.dumps({'ok': True, 'checks': audit(args.project.resolve())}, ensure_ascii=False))
        return 0
    except (OSError, ValueError, KeyError, TypeError, IndexError) as error:
        print(json.dumps({'ok': False, 'error': str(error)}, ensure_ascii=False))
        return 1


if __name__ == '__main__':
    sys.exit(main())
