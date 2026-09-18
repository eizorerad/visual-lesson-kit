#!/usr/bin/env python3
"""Extract the deposited 1EHZ Mg560 hydration shell and nearby phosphate stubs.

Python stdlib only. Coordinates are neither rebuilt nor moved. Phosphate
covalent edges are explicit chemistry; contact guides are heavy-atom distances.
"""
import argparse
import hashlib
import itertools
import json
import math
from pathlib import Path
import shlex
import sys

SOURCE_SHA256 = '3021dd2b6461f850bb66d6748d3c22a5e1bb6cc891c625c15d793f38215b28ab'
PHOSPHATE_RESIDUES = (8, 11, 12)
CONTACTS = ((725, 12, 'OP2'), (726, 8, 'OP1'), (728, 11, 'OP2'))
PADDING = 0.6
TURN_DEGREES = 20


def require(ok, message):
    if not ok:
        raise ValueError(message)


def read_atoms(path):
    fields, atoms = [], {}
    for line in path.read_text().splitlines():
        if line.startswith('_atom_site.'):
            fields.append(line.split()[0].split('.', 1)[1])
        elif line.startswith(('ATOM ', 'HETATM ')):
            values = shlex.split(line)
            require(len(values) == len(fields), 'Malformed atom_site row')
            row = dict(zip(fields, values))
            if row['pdbx_PDB_model_num'] != '1':
                continue
            atom = {
                'id': int(row['id']), 'name': row['auth_atom_id'], 'element': row['type_symbol'],
                'xyz': [float(row['Cartn_' + axis]) for axis in 'xyz'],
                'residue': int(row['auth_seq_id']), 'component': row['auth_comp_id'],
                'auth_chain': row['auth_asym_id'], 'label_chain': row['label_asym_id'],
                'label_seq_id': row['label_seq_id'], 'label_atom_id': row['label_atom_id'],
                'label_comp_id': row['label_comp_id'], 'label_entity_id': row['label_entity_id'],
                'model': int(row['pdbx_PDB_model_num']), 'altloc': row['label_alt_id'],
                'occupancy': float(row['occupancy']), 'b_iso_angstrom_squared': float(row['B_iso_or_equiv']),
                'source_formal_charge': row['pdbx_formal_charge'],
            }
            key = (atom['auth_chain'], atom['residue'], atom['name'])
            require(key not in atoms, 'Duplicate atom identity requires an explicit alternate-location policy')
            atoms[key] = atom
    return atoms


def dot(a, b):
    return sum(x * y for x, y in zip(a, b))


def sub(a, b):
    return [x - y for x, y in zip(a, b)]


def unit(a):
    norm = math.sqrt(dot(a, a))
    require(norm > 1e-10, 'Degenerate camera axis')
    return [x / norm for x in a]


def cross(a, b):
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]


def sinusoid_bounds(a, b):
    """Exact extrema of a*cos(t)+b*sin(t), 0 <= t <= 20 degrees."""
    end = math.radians(TURN_DEGREES)
    angles = [0, end]
    stationary = math.atan2(b, a)
    angles += [stationary + k * math.pi for k in range(-2, 3) if 0 < stationary + k * math.pi < end]
    values = [a * math.cos(t) + b * math.sin(t) for t in angles]
    return min(values), max(values)


def camera_frame(magnesium, waters, closeup):
    origin = magnesium['xyz']
    # The sum of one direction from each opposite water pair looks obliquely
    # through an octahedral face, so no pair is initially viewed end-on.
    axes = [unit(sub(waters[i]['xyz'], origin)) for i in (0, 2, 4)]
    z = unit([sum(axis[i] for axis in axes) for i in range(3)])
    x = unit(cross([0, 0, 1], z))
    y = unit(cross(z, x))
    basis = [x, y, z]
    require(abs(dot(x, cross(y, z)) - 1) < 1e-12, 'Camera changes handedness')
    points = [[dot(sub(atom['xyz'], origin), axis) for axis in basis] for atom in closeup]
    center = [(min(p[i] for p in points) + max(p[i] for p in points)) / 2 for i in range(3)]
    view_origin = [origin[i] + sum(basis[j][i] * center[j] for j in range(3)) for i in range(3)]
    shifted = [sub(p, center) for p in points]
    extents = []
    for x, y, z in shifted:
        x_low, x_high = sinusoid_bounds(x, z)
        z_low, z_high = sinusoid_bounds(z, -x)
        extents.append(([x_low, y, z_low], [x_high, y, z_high]))
    half = [max(abs(pair[j][i]) for pair in extents for j in (0, 1)) + PADDING for i in range(3)]
    bounds = {'low': [-v for v in half], 'high': half,
              'width': 2 * half[0], 'height': 2 * half[1], 'depth': 2 * half[2],
              'padding_angstrom': PADDING, 'rotation_angle_degrees': [0, TURN_DEGREES], 'tilt_degrees': 0}
    return view_origin, basis, bounds


def build(root):
    source_path = root / 'assets/rna-folding/tertiary-1ehz.cif'
    sha = hashlib.sha256(source_path.read_bytes()).hexdigest()
    require(sha == SOURCE_SHA256, 'The supplied mmCIF differs from the pinned official 1EHZ source')
    source = read_atoms(source_path)
    pick = lambda residue, name: source['A', residue, name]
    magnesium = pick(560, 'MG')
    waters = [pick(i, 'O') for i in range(725, 731)]
    require(magnesium['id'] == 1658 and magnesium['label_chain'] == 'G' and magnesium['component'] == 'MG',
            'Wrong Mg560 identity')
    require([(w['id'], w['label_chain'], w['component']) for w in waters] ==
            [(i, 'K', 'HOH') for i in range(1804, 1810)], 'Wrong six-water hydration-shell identities')
    phosphates = [pick(i, 'P') for i in range(1, 77)]
    require(all(a['label_chain'] == 'A' and a['label_entity_id'] == '1' and a['element'] == 'P'
                for a in phosphates), 'Phosphate overlay must contain all 76 tRNA phosphorus atoms')
    groups, covalent_lengths = [], []
    for residue in PHOSPHATE_RESIDUES:
        keys = [(residue, name) for name in ('P', 'OP1', 'OP2', "O5'", "C5'")]
        keys += [(residue - 1, name) for name in ("O3'", "C3'")]
        atoms = [pick(*key) for key in keys]
        names = [(keys[0], keys[i]) for i in (1, 2, 3, 5)] + [(keys[3], keys[4]), (keys[5], keys[6])]
        bonds = []
        for a, b in names:
            atom_a, atom_b = pick(*a), pick(*b)
            distance = math.dist(atom_a['xyz'], atom_b['xyz'])
            require(1.3 < distance < 1.9, 'Implausible phosphate covalent edge: ' + str((a, b)))
            covalent_lengths.append(distance)
            bonds.append([atom_a['id'], atom_b['id']])
        groups.append({'id': residue, 'component': pick(residue, 'P')['component'], 'auth_chain': 'A',
                       'phosphorusAtomId': pick(residue, 'P')['id'], 'center': pick(residue, 'P')['xyz'],
                       'atoms': atoms, 'covalentBonds': bonds,
                       'depiction': 'Phosphate P and its four oxygen neighbors with two covalent carbon stubs; remaining sugar atoms and bases are omitted.'})
    coordination = []
    for water in waters:
        distance = math.dist(magnesium['xyz'], water['xyz'])
        require(1.99 < distance < 2.01, 'Unexpected deposited Mg-water separation')
        coordination.append({'atomIds': [magnesium['id'], water['id']], 'waterResidue': water['residue'],
                             'distanceAngstrom': distance, 'kind': 'Mg-water oxygen coordination guide'})
    contacts = []
    for water_residue, phosphate_residue, name in CONTACTS:
        a, b = pick(water_residue, 'O'), pick(phosphate_residue, name)
        distance = math.dist(a['xyz'], b['xyz'])
        require(2.5 < distance < 3.2, 'Unexpected water-phosphate heavy-atom separation')
        contacts.append({'atomIds': [a['id'], b['id']], 'waterResidue': water_residue,
                         'phosphateResidue': phosphate_residue, 'phosphateAtom': name,
                         'distanceAngstrom': distance, 'kind': 'water-phosphate oxygen proximity guide',
                         'interpretation': 'Heavy-atom separation compatible with a water-mediated contact; water hydrogens and hydrogen-bond angles are not supplied.'})
    closeup = [magnesium] + waters + [a for group in groups for a in group['atoms']]
    selected = {a['id']: a for a in closeup + phosphates}
    require(len(closeup) == 28 and len(selected) == 101, 'Unexpected selected atom count')
    for atom in selected.values():
        require(all(math.isfinite(v) for v in atom['xyz']), 'Nonfinite atomic coordinate')
        require(atom['occupancy'] == 1 and atom['altloc'] == '.', 'Partial or alternate atom needs a selection policy')
        require(atom['element'] != 'H', 'No hydrogen positions are deposited for this selection')
    original = json.loads((root / 'assets/rna-folding/ions-1ehz.json').read_text())
    require(original['source_sha256'] == sha, 'Original ions fixture uses a different source')
    for atom, previous in zip([magnesium] + waters, [original['magnesium']] + original['waters']):
        for field in ('xyz', 'auth_chain', 'label_chain', 'residue', 'component', 'occupancy'):
            require(atom[field] == previous[field], 'Mg/water identity changed relative to original lesson fixture')
        require(atom['name'] == previous['atom'], 'Mg/water atom name changed')
    view_origin, basis, bounds = camera_frame(magnesium, waters, closeup)
    directions = [unit(sub(w['xyz'], magnesium['xyz'])) for w in waters]
    angles = [math.degrees(math.acos(max(-1, min(1, dot(a, b))))) for a, b in itertools.combinations(directions, 2)]
    cis, trans = [a for a in angles if a < 135], [a for a in angles if a >= 135]
    require(len(cis) == 12 and len(trans) == 3 and all(89 < a < 91 for a in cis) and all(a > 179 for a in trans),
            'Selected six-water oxygen geometry is not the deposited approximate octahedron')
    return {
        'schemaVersion': 1, 'pdbId': '1EHZ', 'model': 1, 'units': 'angstrom',
        'sourceURL': 'https://files.rcsb.org/download/1EHZ.cif',
        'entryURL': 'https://www.rcsb.org/structure/1EHZ',
        'primaryPaperURL': 'https://doi.org/10.1017/S1355838200000364',
        'sourceFile': 'assets/rna-folding/tertiary-1ehz.cif', 'sourceHash': sha,
        'method': 'X-RAY DIFFRACTION', 'resolutionAngstrom': 1.93,
        'selection': 'Mg560 (author A, label G), water O725–730 (author A, label K), phosphate stubs at U8/C11/U12, and all 76 tRNA phosphate P positions (author/label A). Model 1 only.',
        'magnesium': magnesium, 'waters': waters, 'phosphates': phosphates,
        'phosphateGroups': groups, 'coordinationLinks': coordination, 'waterPhosphateContacts': contacts,
        'origin': magnesium['xyz'], 'hydration_origin': magnesium['xyz'],
        'view_origin': view_origin, 'view_basis': basis, 'view_bounds': bounds,
        'cameraConvention': 'Subtract the source-coordinate camera origin; take dot products with the three right-handed view_basis rows; turn about local y, then project x and negative y. view_bounds includes all 28 close-up centers plus 0.6 Å symbolic-radius padding throughout a 0–20 degree turn at zero tilt. hydration_origin centers Mg; view_origin centers the bridge cluster.',
        'validation': {'uniqueSelectedAtoms': len(selected), 'closeupAtoms': len(closeup),
                       'phosphatePositions': len(phosphates), 'phosphateGroups': len(groups),
                       'covalentLinks': len(covalent_lengths),
                       'covalentDistanceRangeAngstrom': [min(covalent_lengths), max(covalent_lengths)],
                       'mgWaterDistanceRangeAngstrom': [min(c['distanceAngstrom'] for c in coordination), max(c['distanceAngstrom'] for c in coordination)],
                       'cisWaterMgWaterAngleRangeDegrees': [min(cis), max(cis)],
                       'transWaterMgWaterAngleRangeDegrees': [min(trans), max(trans)],
                       'allCoordinatesFromSource': True, 'matchesOriginalMgWaterFixture': True,
                       'allSelectedAtomsFullOccupancy': True, 'hydrogens': 0},
        'displayNotes': [
            'All atomic positions, names, source atom IDs, author/label chain IDs, occupancy and B factors are unchanged from the pinned 1EHZ mmCIF. No atom is rebuilt, averaged or moved.',
            'The six water records contain oxygen only. Do not add inferred water hydrogen positions, donor directions or hydrogen-bond angles.',
            'Six Mg–water guides represent the deposited hydration coordination geometry. The three water–phosphate guides mark selected oxygen–oxygen proximities, not measured hydrogen-bond energies or direct Mg–phosphate bonds.',
            'The contact selection is illustrative, not an exhaustive inventory of all nearby RNA or solvent interactions. There are additional nearby oxygen atoms and other metal ions in the source.',
            'Each phosphate group includes P, OP1, OP2, O5-prime, the preceding residue O3-prime, and two attached carbon stubs. Do not connect omitted sugar atoms, bases, groups or sequence gaps by new covalent lines.',
            'Phosphate negative-charge marks are schematic annotations for the anionic backbone groups. Their positions use deposited P coordinates; the charge is not confined to the phosphorus nucleus and no electrostatic potential is calculated.',
            'Mg²⁺ is the conventional chemical ion label. The deposited atom_site formal-charge field is unknown (question mark), which is retained separately as source_formal_charge.',
            'A surrounding ion atmosphere is an authored conceptual illustration, not additional observed ions, measured concentrations or a simulation. These coordinates do not measure stability or demonstrate a folding pathway.',
            'The octahedral shell and distances describe this refined crystallographic model, not universal exact Mg–O lengths or independently measured hydration dynamics.',
            'Camera basis, origins, fitting bounds and symbol radii are depiction choices. Symbolic sphere sizes are not ionic radii, van der Waals radii or solvent-accessible surfaces.'
        ]
    }


def json_text(data):
    return json.dumps(data, ensure_ascii=False, indent=2, allow_nan=False) + '\n'


def js_text(data):
    value = json.dumps(data, ensure_ascii=False, separators=(',', ':'), allow_nan=False)
    value = value.replace('&', '\\u0026').replace('<', '\\u003c').replace('>', '\\u003e').replace('\u2028', '\\u2028').replace('\u2029', '\\u2029')
    return '// Generated by build/trna-magnesium.py from the pinned official 1EHZ mmCIF.\nwindow.TRNA_MAGNESIUM_DATA=' + value + ';\n'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--project', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--check', action='store_true', help='Verify source and generated JSON/JS without writing')
    args = parser.parse_args()
    try:
        root = args.project.resolve()
        data = build(root)
        outputs = {root / 'assets/trna/magnesium-1ehz.json': json_text(data),
                   root / 'js/trna-magnesium-data.js': js_text(data)}
        for path, value in outputs.items():
            if args.check:
                require(path.is_file() and path.read_text() == value, 'Generated data absent or stale: ' + str(path.relative_to(root)))
            else:
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(value)
        print(json.dumps({'ok': True, 'mode': 'check' if args.check else 'write',
                          'validation': data['validation'], 'view_bounds': data['view_bounds']}, ensure_ascii=False))
        return 0
    except (OSError, ValueError, KeyError, TypeError, IndexError) as error:
        print('tRNA magnesium: ' + str(error), file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
