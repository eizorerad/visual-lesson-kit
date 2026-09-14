#!/usr/bin/env python3
"""Offline, deterministic PDB-to-view import. See guide/molecular-data.md.

This intentionally bounded importer selects one model and one explicit alternate
conformer. It does not reconstruct missing atoms, infer proximity bonds, choose a
biological assembly, or accept unsupported author identities by flattening them.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
import re
import sys

SUGAR = ["C1'", "C2'", "C3'", "C4'", "O4'"]
BACKBONE = ['P', "O5'", "C5'", "C4'", "C3'", "O3'"]
SIX_RING = ['N1', 'C2', 'N3', 'C4', 'C5', 'C6']
FIVE_RING = ['N9', 'C8', 'N7', 'C5', 'C4']
EXO = {
    'A': [['C6', 'N6']], 'G': [['C6', 'O6'], ['C2', 'N2']],
    'C': [['C2', 'O2'], ['C4', 'N4']],
    'U': [['C2', 'O2'], ['C4', 'O4']],
    'T': [['C2', 'O2'], ['C4', 'O4'], ['C5', 'C7']],
}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def integer(value, name):
    require(isinstance(value, int) and not isinstance(value, bool), name + ' must be an integer')
    return value


def vector(value, name):
    require(isinstance(value, list) and len(value) == 3, name + ' must have three coordinates')
    require(all(isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v)
                for v in value), name + ' must be finite')
    return value


def sub(a, b):
    return [x - y for x, y in zip(a, b)]


def dot(a, b):
    return sum(x * y for x, y in zip(a, b))


def unit(a):
    length = math.sqrt(dot(a, a))
    require(length > 1e-12, 'frame anchors must define nonzero, nonparallel axes')
    return [x / length for x in a]


def cross(a, b):
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]


def mean(points):
    require(bool(points), 'cannot frame an empty coordinate selection')
    return [sum(p[i] for p in points) / len(points) for i in range(3)]


def distance(a, b):
    d = sub(a, b)
    return math.sqrt(dot(d, d))


def record_types(config):
    records = config.get('records', ['ATOM', 'HETATM'])
    require(isinstance(records, list) and bool(records)
            and all(isinstance(record, str) and record in ('ATOM', 'HETATM') for record in records),
            'config.records must be a nonempty array selecting ATOM and/or HETATM')
    require(len(records) == len(set(records)), 'config.records must not contain duplicates')
    return records


def parse_pdb(source, config):
    """Keep author residue order and TER segment identity until links are built."""
    model = integer(config.get('model'), 'config.model')
    require(model > 0, 'config.model must be positive')
    require('altloc' in config, "config.altloc is required: '' for blank-only or an explicit label")
    altloc = config['altloc']
    require(isinstance(altloc, str) and (altloc == '' or re.fullmatch(r'[A-Za-z0-9]', altloc)),
            "config.altloc must be '' or one alphanumeric PDB label")
    records = record_types(config)
    lines = source.decode('ascii').splitlines()
    explicit_models = any(line.startswith('MODEL ') for line in lines)
    current = None if explicit_models else 1
    models = set()
    chains = {}
    segment = 0
    for number, line in enumerate(lines, 1):
        record = line[:6].strip()
        if record == 'MODEL':
            require(explicit_models and current is None, 'nested or unclosed MODEL boundary')
            current = int(line[10:14].strip())
            require(current not in models, 'duplicate MODEL identifier')
            models.add(current)
            continue
        if record == 'ENDMDL':
            require(explicit_models and current is not None, 'ENDMDL without MODEL')
            current = None
            continue
        if record in ('ATOM', 'HETATM') and explicit_models:
            require(current is not None, 'atom record outside explicit MODEL boundaries')
        if current != model:
            continue
        if record == 'TER':
            segment += 1
            continue
        if record not in records:
            continue
        require(len(line) >= 54, 'short atom record at line ' + str(number))
        require(not line[26].strip(),
                'insertion code at line %d is unsupported; preserve this identity in curated data' % number)
        chain, rid, component = line[21], int(line[22:26]), line[17:20].strip()
        atom_name, alternate = line[12:16].strip(), line[16].strip()
        residues = chains.setdefault(chain, {})
        if rid in residues:
            require(residues[rid]['segment'] == segment,
                    'reused author residue %s%d across TER; use curated identities' % (chain, rid))
            require(residues[rid]['component'] == component,
                    'multiple components at author residue %s%d; use curated alternate-residue data' % (chain, rid))
        else:
            residues[rid] = {'id': rid, 'component': component, 'atoms': {}, 'segment': segment,
                             'source_order': len(residues),
                             'source_atoms': set()}
        row = residues[rid]
        row['source_atoms'].add(atom_name)
        if alternate and alternate != altloc:
            continue
        require(atom_name not in row['atoms'],
                'duplicate atom %s:%d:%s for selected altloc %r; no implicit precedence' %
                (chain, rid, atom_name, altloc))
        row['atoms'][atom_name] = vector([float(line[a:b]) for a, b in ((30, 38), (38, 46), (46, 54))],
                                         'source coordinate at line ' + str(number))
    require(not explicit_models or current is None, 'unclosed MODEL boundary')
    require(model in models if explicit_models else model == 1, 'selected model is absent from source')
    require(bool(chains), 'selected model contains no atoms of the selected record types')
    return chains


def get_chain(chains, chain):
    require(isinstance(chain, str) and len(chain) == 1, 'chain must be one author PDB character')
    require(chain in chains, 'source chain %r is absent' % chain)
    return chains[chain]


def get_atom(row, atom, chain):
    require(atom in row['atoms'],
            'missing %s:%d:%s for selected altloc; choose a modeled subset or curated data' %
            (chain, row['id'], atom))
    return row['atoms'][atom]


def candidates(rows):
    """Canonical polymer neighbors, before any distance validation.

    A numeric gap, a TER record or a missing selected residue cannot create an
    edge. The distance test below can only remove one of these candidates.
    """
    return [(a, b) for a, b in zip(rows, rows[1:])
            if a['segment'] == b['segment'] and b['id'] == a['id'] + 1
            and b['source_order'] == a['source_order'] + 1]


def validated_links(rows, chain, atoms, maximum, omissions, label, trace=False):
    require(isinstance(maximum, (int, float)) and not isinstance(maximum, bool)
            and math.isfinite(maximum) and maximum > 0, 'max_link_distance must be finite and positive')
    links = []
    for a, b in candidates(rows):
        if atoms[0] not in a['atoms'] or atoms[1] not in b['atoms']:
            omissions.append({'selection': label, 'from': a['id'], 'to': b['id'],
                              'reason': 'missing canonical linkage atom'})
            continue
        length = distance(a['atoms'][atoms[0]], b['atoms'][atoms[1]])
        if length > maximum or length < (0.1 if trace else 1.0):
            omissions.append({'selection': label, 'from': a['id'], 'to': b['id'],
                              'reason': 'candidate failed distance validation', 'distance_angstrom': length})
            continue
        links.append([chain + str(a['id']), chain + str(b['id'])] if trace else [a['id'], b['id']])
    return links


def framing(config, chains, points):
    frame = config.get('frame')
    require(isinstance(frame, dict), 'config.frame must define basis or anchor-derived framing')
    require(('basis' in frame) != ('anchors' in frame), 'frame needs exactly one of basis or anchors')
    if 'basis' in frame:
        basis = frame['basis']
        require(isinstance(basis, list) and len(basis) == 3, 'basis must have three rows')
        for axis in basis:
            vector(axis, 'basis')
    else:
        def anchor(spec):
            require(isinstance(spec, dict), 'each frame anchor must be an object')
            chain = spec.get('chain')
            rows = get_chain(chains, chain)
            rid = integer(spec.get('residue'), 'anchor.residue')
            require(rid in rows, 'anchor residue is absent')
            return get_atom(rows[rid], spec.get('atom'), chain)
        axes = frame['anchors']
        require(isinstance(axes, dict) and all(isinstance(axes.get(n), list) and len(axes[n]) == 2
                                              for n in ('x', 'y')), 'anchors need x and y endpoint pairs')
        x = unit(sub(anchor(axes['x'][1]), anchor(axes['x'][0])))
        y0 = sub(anchor(axes['y'][1]), anchor(axes['y'][0]))
        y = unit(sub(y0, [dot(y0, x) * v for v in x]))
        basis = [x, y, cross(x, y)]
    require(all(abs(dot(basis[i], basis[j]) - int(i == j)) < 1e-6
                for i in range(3) for j in range(3)), 'basis must be orthonormal')
    require(abs(dot(basis[0], cross(basis[1], basis[2])) - 1) < 1e-6,
            'basis must be right-handed with determinant +1')
    origin = vector(frame['origin'], 'frame.origin') if 'origin' in frame else mean(points)
    return origin, basis


def fragment(spec, chains, provenance, basis, omissions, name):
    require(isinstance(spec, dict), 'fragment must be an object')
    chain = spec.get('chain')
    source_rows = get_chain(chains, chain)
    polymer = spec.get('polymer')
    require(polymer in ('RNA', 'DNA'), 'fragment.polymer must explicitly be RNA or DNA')
    ids = spec.get('residues')
    require(isinstance(ids, list) and ids, 'fragment.residues must be a nonempty ordered list')
    for rid in ids:
        integer(rid, 'fragment residue')
        require(rid in source_rows, 'requested residue %s%d is absent' % (chain, rid))
    require(len(ids) == len(set(ids)), 'fragment residues must be unique')
    require(ids == [rid for rid in source_rows if rid in set(ids)],
            'fragment residues must follow source polymer order')
    rows = []
    for rid in ids:
        source = source_rows[rid]
        component = source['component']
        allowed = ('A', 'C', 'G', 'U') if polymer == 'RNA' else ('DA', 'DC', 'DG', 'DT')
        require(component in allowed, 'component %s is unsupported for %s; supply curated component adjacency/data' %
                (component, polymer))
        base = component[1:] if polymer == 'DNA' else component
        rings = [SIX_RING, FIVE_RING] if base in ('A', 'G') else [SIX_RING]
        exo = [pair[:] for pair in EXO[base]]
        if polymer == 'RNA':
            exo.append(["C2'", "O2'"])
        for oxygen in ('OP1', 'OP2'):
            if oxygen in source['atoms']:
                exo.append(['P', oxygen])
        glycosidic = ["C1'", 'N9' if base in ('A', 'G') else 'N1']
        required = set(SUGAR + BACKBONE + glycosidic + sum(rings, []) + sum(exo, []))
        for atom in sorted(required):
            get_atom(source, atom, chain)
        ring_atoms = sorted(set(sum(rings, [])))
        rows.append({'id': rid, 'component': component, 'atoms': source['atoms'],
                     'rings': rings, 'exo': exo, 'glycosidic': glycosidic,
                     'center': mean([source['atoms'][atom] for atom in ring_atoms])})
    # Context means the full modeled source chain, not the full biological RNA.
    context_source = list(source_rows.values())
    context_rows = [{'id': row['id'], 'xyz': get_atom(row, "C4'", chain)} for row in context_source]
    selected_source = [source_rows[rid] for rid in ids]
    maximum = spec.get('max_link_distance', 2.0)
    result = dict(provenance, chain=chain, polymer=polymer, origin=mean([row['center'] for row in rows]),
                  basis=basis, residues=rows, sugar_ring=SUGAR, backbone=BACKBONE,
                  bonds=validated_links(selected_source, chain, ("O3'", 'P'), maximum,
                                        omissions, name))
    result['context'] = {
        'residues': context_rows,
        'bonds': validated_links(context_source, chain, ("O3'", 'P'), maximum,
                                 omissions, name + '.context'),
        'origin': mean([row['xyz'] for row in context_rows]), 'basis': basis,
    }
    return result


def extract(source, config):
    require(isinstance(config, dict), 'config must be an object')
    require(isinstance(config.get('pdb_id'), str) and config['pdb_id'], 'pdb_id is required')
    require(isinstance(config.get('source_url'), str) and config['source_url'], 'source_url is required')
    chains = parse_pdb(source, config)
    omissions, traces = [], []
    specs = config.get('traces')
    require(isinstance(specs, list) and specs, 'config.traces must be nonempty')
    require(all(isinstance(t, dict) for t in specs), 'trace definitions must be objects')
    require(len({t.get('chain') for t in specs}) == len(specs), 'trace chains must be unique')
    for spec in specs:
        chain, atom = spec.get('chain'), spec.get('atom')
        require(isinstance(atom, str) and atom, 'trace.atom is required')
        source_rows = list(get_chain(chains, chain).values())
        rows = [{'id': chain + str(row['id']), 'residue': row['id'], 'component': row['component'],
                 'xyz': get_atom(row, atom, chain)} for row in source_rows]
        maximum = spec.get('max_link_distance', 5 if atom == 'CA' else 8)
        traces.append({'chain': chain, 'atom': atom, 'rows': rows,
                       'bonds': validated_links(source_rows, chain, (atom, atom), maximum,
                                                omissions, 'trace.' + chain, trace=True)})
    origin, basis = framing(config, chains, [row['xyz'] for trace in traces for row in trace['rows']])
    provenance = {key: config[key] for key in ('pdb_id', 'model', 'altloc', 'source_url')}
    provenance.update(source_sha256=hashlib.sha256(source).hexdigest(), coordinate_units='Å',
                      records=record_types(config))
    specs = config.get('fragments', {})
    require(isinstance(specs, dict), 'config.fragments must be a dictionary of named subsets')
    fragments = {name: fragment(spec, chains, provenance, basis, omissions, name)
                 for name, spec in specs.items()}
    return dict(provenance, origin=origin, basis=basis, traces=traces, fragments=fragments,
                omissions=omissions,
                connectivity='Canonical author-adjacent polymer links, pruned at gaps, TER and failed geometry; trace links are landmark guides, not atom bonds.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for arg in ('source', 'config', 'json', 'js'):
        parser.add_argument('--' + arg, required=True, type=Path)
    parser.add_argument('--global', dest='global_name', default='MOLECULAR_VIEW_DATA')
    parser.add_argument('--check', action='store_true', help='compare both outputs byte-for-byte without writing')
    args = parser.parse_args()
    try:
        require(re.fullmatch(r'[A-Za-z_$][A-Za-z0-9_$]*', args.global_name), 'global must be one JavaScript identifier')
        paths = [p.resolve() for p in (args.source, args.config, args.json, args.js)]
        require(len(paths) == len(set(paths)), 'source, config and output paths must all differ')
        data = extract(args.source.read_bytes(), json.loads(args.config.read_text()))
        outputs = {
            args.json: (json.dumps(data, ensure_ascii=False, indent=2, allow_nan=False) + '\n').encode('utf8'),
            args.js: ('window.' + args.global_name + '=' +
                      json.dumps(data, ensure_ascii=False, separators=(',', ':'), allow_nan=False) + ';\n').encode('utf8'),
        }
        if args.check:
            stale = [str(path) for path, content in outputs.items() if not path.exists() or path.read_bytes() != content]
            require(not stale, 'stale or missing generated output: ' + ', '.join(stale))
            print('Coordinate data verified: JSON and JS match source + config exactly.')
        else:
            for path, content in outputs.items():
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_bytes(content)
            print('Coordinate data written: %d trace points, %d fragments; %d omitted candidate links.' %
                  (sum(len(t['rows']) for t in data['traces']), len(data['fragments']), len(data['omissions'])))
    except (ValueError, OSError, TypeError, KeyError) as error:
        parser.exit(1, 'molecular-data: ' + str(error) + '\n')


if __name__ == '__main__':
    main()
