#!/usr/bin/env python3
"""Extract a small source-derived histone cartoon; Python standard library only.

The source C-alpha positions and deposited helix annotations come from saved
1KX5 assembly 1. A proper uniform similarity places the octamer in the existing
authored nucleosome frame; this is not an atomistic fit to its schematic DNA.
Run this after assets/atac/structures/extract.py if the experimental data changes.
"""
from pathlib import Path
import argparse
import hashlib
import json
import math
import shlex

ROOT = Path(__file__).resolve().parents[1]
CIF = ROOT / 'assets/atac/structures/1KX5-assembly1.cif'
OUTPUT = ROOT / 'js/atac-histone-core-data.js'


def cif_categories(path):
    lines = iter(path.read_text().splitlines())
    tokens = []
    for line in lines:
        if line.startswith(';'):
            block = [line[1:]]
            for line in lines:
                if line.startswith(';'):
                    break
                block.append(line)
            tokens.append('\n'.join(block))
        else:
            tokens.extend(shlex.split(line, comments=True, posix=True))
    i, result = 0, {}
    while i < len(tokens):
        if tokens[i] == 'loop_':
            i += 1
            columns = []
            while i < len(tokens) and tokens[i].startswith('_'):
                columns.append(tokens[i])
                i += 1
            rows = []
            while i < len(tokens) and not (
                tokens[i].startswith('_') or tokens[i] == 'loop_' or
                tokens[i].startswith('data_')
            ):
                row = tokens[i:i + len(columns)]
                assert len(row) == len(columns)
                rows.append(dict(zip(columns, row)))
                i += len(columns)
            if columns:
                result[columns[0].split('.')[0]] = rows
        elif tokens[i].startswith('_') and i + 1 < len(tokens):
            name = tokens[i]
            result.setdefault(name.split('.')[0], [{}])[0][name] = tokens[i + 1]
            i += 2
        else:
            i += 1
    return result


def dot(a, b):
    return sum(x * y for x, y in zip(a, b))


def average(points):
    return [sum(p[k] for p in points) / len(points) for k in range(3)]


def determinant(m):
    return (m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
            m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
            m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]))


def largest_eigenvector(matrix):
    """Jacobi diagonalization of a small real symmetric matrix."""
    n = len(matrix)
    m = [list(row) for row in matrix]
    vectors = [[float(i == j) for j in range(n)] for i in range(n)]
    for _ in range(128):
        p, q = max(((i, j) for i in range(n) for j in range(i + 1, n)),
                   key=lambda ij: abs(m[ij[0]][ij[1]]))
        if abs(m[p][q]) < 1e-12:
            break
        angle = .5 * math.atan2(2 * m[p][q], m[q][q] - m[p][p])
        c, s = math.cos(angle), math.sin(angle)
        for k in range(n):
            if k != p and k != q:
                a, b = m[k][p], m[k][q]
                m[k][p] = m[p][k] = c * a - s * b
                m[k][q] = m[q][k] = s * a + c * b
        a, b, off = m[p][p], m[q][q], m[p][q]
        m[p][p] = c * c * a - 2 * s * c * off + s * s * b
        m[q][q] = s * s * a + 2 * s * c * off + c * c * b
        m[p][q] = m[q][p] = 0.
        for k in range(n):
            a, b = vectors[k][p], vectors[k][q]
            vectors[k][p], vectors[k][q] = c * a - s * b, s * a + c * b
    column = max(range(n), key=lambda i: m[i][i])
    return [vectors[k][column] for k in range(n)]


def proper_similarity(source, target):
    """Horn quaternion fit. Rotation multiplies column coordinate vectors."""
    a, b = average(source), average(target)
    x = [[p[k] - a[k] for k in range(3)] for p in source]
    y = [[p[k] - b[k] for k in range(3)] for p in target]
    h = [[sum(p[i] * q[j] for p, q in zip(x, y)) for j in range(3)]
         for i in range(3)]
    xx, xy, xz = h[0]
    yx, yy, yz = h[1]
    zx, zy, zz = h[2]
    w, qx, qy, qz = largest_eigenvector([
        [xx + yy + zz, yz - zy, zx - xz, xy - yx],
        [yz - zy, xx - yy - zz, xy + yx, zx + xz],
        [zx - xz, xy + yx, -xx + yy - zz, yz + zy],
        [xy - yx, zx + xz, yz + zy, -xx - yy + zz],
    ])
    rotation = [
        [1 - 2 * (qy * qy + qz * qz), 2 * (qx * qy - w * qz), 2 * (qx * qz + w * qy)],
        [2 * (qx * qy + w * qz), 1 - 2 * (qx * qx + qz * qz), 2 * (qy * qz - w * qx)],
        [2 * (qx * qz - w * qy), 2 * (qy * qz + w * qx), 1 - 2 * (qx * qx + qy * qy)],
    ]
    rotated = [[dot(row, p) for row in rotation] for p in x]
    scale = sum(dot(p, q) for p, q in zip(rotated, y)) / sum(dot(p, p) for p in x)
    translation = [b[k] - scale * dot(rotation[k], a) for k in range(3)]

    def transform(p):
        return [scale * dot(row, p) + translation[k]
                for k, row in enumerate(rotation)]

    rmsd = math.sqrt(sum(sum((v - q[k]) ** 2 for k, v in enumerate(transform(p)))
                         for p, q in zip(source, target)) / len(source))
    assert scale > 0 and abs(determinant(rotation) - 1) < 1e-10
    return transform, dict(rotation=rotation, scale=scale, translation=translation,
                           sourceCenter=a, targetCenter=b, determinant=determinant(rotation),
                           fitRmsd=rmsd)


def helix_axis(points):
    center = average(points)
    delta = [[p[k] - center[k] for k in range(3)] for p in points]
    axis = largest_eigenvector([[sum(p[i] * p[j] for p in delta)
                                for j in range(3)] for i in range(3)])
    if dot(axis, [points[-1][k] - points[0][k] for k in range(3)]) < 0:
        axis = [-v for v in axis]
    values = [dot(p, axis) for p in delta]
    return [[center[k] + t * axis[k] for k in range(3)]
            for t in (min(values), max(values))]


def rounded(value):
    if isinstance(value, float):
        return round(value, 8)
    if isinstance(value, list):
        return [rounded(v) for v in value]
    if isinstance(value, dict):
        return {k: rounded(v) for k, v in value.items()}
    return value


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    source_text = (ROOT / 'js/atac-structures.js').read_text()
    source = json.loads(source_text.split('window.AtacStructures = ', 1)[1].rstrip(';\n'))['nucleosome']
    by_id = {c['id']: c for c in source['chains']}
    a, b = by_id['A']['points'], by_id['B']['points']
    dna_center = [[(v + b[146 - i][k]) / 2 for k, v in enumerate(p)]
                  for i, p in enumerate(a)]
    target = []
    for i in range(147):
        u = i / 146
        angle = .85 * math.pi + 2 * math.pi * 1.65 * u
        target.append([44 * math.cos(angle), 39 * (u - .5), 42 * math.sin(angle)])
    transform, frame = proper_similarity(dna_center, target)
    frame.update(method='Proper least-squares similarity of 147 paired DNA C4-prime midpoints to the authored wrap.',
                 convention='localPoint = scale * rotation * sourcePoint + translation; column vectors; target coordinates use core axes 0/1/2.',
                 coordinateUnits='authored model units', sourceUnits='angstrom',
                 authoredWrap=dict(radialX=44, radialZ=42, rise=39, turns=1.65, phaseRadians=.85 * math.pi),
                 note='The authored wrap is an illustrative analytic path, not the experimental DNA. Residual registration mismatch is reported, not hidden; protein coordinates undergo rotation, uniform scale and translation only.')
    categories = cif_categories(CIF)
    annotations = categories['_struct_conf']
    ca_atoms = {(a['_atom_site.label_asym_id'], int(a['_atom_site.label_seq_id'])): a
                for a in categories['_atom_site']
                if a['_atom_site.group_PDB'] == 'ATOM'
                and a['_atom_site.pdbx_PDB_model_num'] == '1'
                and a['_atom_site.label_alt_id'] in ('.', 'A')
                and a['_atom_site.label_atom_id'] == 'CA'}
    # These cutoffs choose thick helix cartoons versus thin terminal traces.
    # Every deposited protein C-alpha position is retained, including tails.
    selections = {'3': (44, 135), '4': (24, 102), '5': (16, 118), '6': (34, 122)}
    chains = []
    for chain in source['chains']:
        if chain['kind'] != 'protein':
            continue
        lo, hi = selections[chain['entityId']]
        keep = list(range(len(chain['points'])))
        indices = {chain['residues'][i]['seqId']: j for j, i in enumerate(keep)}
        points = [transform(chain['points'][i]) for i in keep]
        occupancies = []
        for i in keep:
            atom = ca_atoms[(chain['id'], chain['residues'][i]['seqId'])]
            assert all(abs(float(atom['_atom_site.Cartn_' + k]) - chain['points'][i][j]) < 1e-6
                       for j, k in enumerate('xyz'))
            occupancies.append(float(atom['_atom_site.occupancy']))
        core_indices = [i for i, r in enumerate(chain['residues']) if lo <= int(r['authSeqId']) <= hi]
        tails = []
        if core_indices[0] > 0:
            tails.append(dict(end='N', startIndex=0, endIndex=core_indices[0]))
        if core_indices[-1] < len(points) - 1:
            tails.append(dict(end='C', startIndex=core_indices[-1], endIndex=len(points) - 1))
        helices = []
        for row in annotations:
            if row['_struct_conf.beg_label_asym_id'] != chain['id']:
                continue
            if int(row['_struct_conf.beg_auth_seq_id']) < lo or int(row['_struct_conf.end_auth_seq_id']) > hi:
                continue
            first, last = int(row['_struct_conf.beg_label_seq_id']), int(row['_struct_conf.end_label_seq_id'])
            if first not in indices or last not in indices:
                continue
            start, end = indices[first], indices[last]
            axis_start, axis_end = helix_axis(points[start:end + 1])
            helices.append(dict(id=row['_struct_conf.id'], startIndex=start, endIndex=end,
                                authStart=int(row['_struct_conf.beg_auth_seq_id']),
                                authEnd=int(row['_struct_conf.end_auth_seq_id']),
                                helixClass=int(row['_struct_conf.pdbx_PDB_helix_class']),
                                axisStart=axis_start, axisEnd=axis_end))
        breaks = [j for j in range(1, len(keep)) if keep[j] != keep[j - 1] + 1 or keep[j] in chain['breaks']]
        chains.append(dict(id=chain['id'], authorId=chain['authorId'], role=chain['role'],
                           entityId=chain['entityId'], authRange=[lo, hi], sourceIndices=keep,
                           occupancies=occupancies, tails=tails,
                           residues=[int(chain['residues'][i]['authSeqId']) for i in keep],
                           points=points, breaks=breaks, helices=helices))
    result = rounded(dict(
        pdb='1KX5', source=source['source'], article=source['article'],
        coordinateFile='assets/atac/structures/1KX5-assembly1.cif',
        sourceSha256=hashlib.sha256(CIF.read_bytes()).hexdigest(),
        representation='Source-derived protein cartoon with terminal traces, not molecular or solvent-accessible surface.',
        selectionNote='All 974 deposited protein C-alpha positions are retained. Thick core helices use author-numbered rendering ranges H3 44–135, H4 24–102, H2A 16–118, H2B 34–122; these are not histone-fold domain definitions. Outside these ranges, terminal regions remain thin traces, including two deposited short helices. No absent residues are invented.',
        occupancyNote='114 deposited terminal C-alpha positions have zero occupancy. Edges touching them are dashed in both cartoon and detailed views: these coordinates are not experimentally localized. The fixed crystal pose is not a universal tail conformation or a simulated motion.',
        frame=frame, chains=chains))
    assert len(chains) == 8 and all(len(c['points']) == len(c['residues']) for c in chains)
    expected = ('/* Generated by build/atac-histone-core.py from experimental 1KX5 coordinates and deposited helix annotations. */\n'
                'window.AtacHistoneCoreData = ' + json.dumps(result, separators=(',', ':')) + ';\n')
    if args.check:
        assert OUTPUT.read_text() == expected, 'Run python3 build/atac-histone-core.py to regenerate stale data.'
        print('Current histone core data matches source extraction.')
    else:
        OUTPUT.write_text(expected)
        print('Wrote', OUTPUT)
    print(f"8 chains; {sum(len(c['points']) for c in chains)} C-alpha points; "
          f"{sum(len(c['helices']) for c in chains)} deposited helices; "
          f"det={frame['determinant']:.12f}; uniform scale={frame['scale']:.9f}; "
          f"schematic registration RMSD={frame['fitRmsd']:.6f} model units")


if __name__ == '__main__':
    main()
