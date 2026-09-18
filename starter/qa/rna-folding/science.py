#!/usr/bin/env python3
"""Offline RNA source, chemical-graph and fragment audit; Python standard library only."""
import argparse, hashlib, json, math, re, shlex, sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


def require(ok, message):
    if not ok:
        raise AssertionError(message)


def xyz(value):
    require(isinstance(value, list) and len(value) == 3, 'Coordinate must have three values')
    require(all(isinstance(x, (int, float)) and not isinstance(x, bool) and math.isfinite(x) for x in value), 'Nonfinite/non-numeric coordinate')
    return value


def read_cif(path):
    fields, out = [], {}
    for line in path.read_text().splitlines():
        if line.startswith('_atom_site.'):
            fields.append(line.split()[0].split('.', 1)[1])
        elif line.startswith(('ATOM ', 'HETATM ')):
            row = dict(zip(fields, shlex.split(line)))
            if row['pdbx_PDB_model_num'] != '1':
                continue
            key = (row['auth_asym_id'], int(row['auth_seq_id']), row['auth_atom_id'])
            require(key not in out, 'Duplicate/alternate atom key in source: ' + str(key))
            out[key] = {'xyz': [float(row['Cartn_' + a]) for a in 'xyz'], 'component': row['auth_comp_id'], 'alt': row['label_alt_id'], 'label_chain': row['label_asym_id'], 'occupancy': float(row['occupancy'])}
    require(out, 'No model-1 atom records read from ' + str(path))
    return out


def read_pdb(path):
    out, model = {}, 1
    for line in path.read_text().splitlines():
        if line.startswith('MODEL '):
            model = int(line[10:14])
        if model != 1 or not line.startswith(('ATOM  ', 'HETATM')):
            continue
        key = (line[21], int(line[22:26]), line[12:16].strip())
        require(key not in out, 'Duplicate/alternate atom key in source: ' + str(key))
        out[key] = {'xyz': [float(line[30:38]), float(line[38:46]), float(line[46:54])], 'component': line[17:20].strip(), 'alt': line[16].strip(), 'occupancy': float(line[54:60])}
    require(out, 'No model-1 atom records read from ' + str(path))
    return out


def same_atom(source, residue, name, coordinate, component=None, chain='A'):
    key = (chain, residue, name)
    require(key in source, 'Missing source atom ' + str(key))
    row = source[key]
    require(row['xyz'] == xyz(coordinate), 'Coordinate mismatch ' + str(key))
    require(row['alt'] in ('', '.'), 'Unexpected alternate location ' + str(key))
    if component is not None:
        require(row['component'] == component, 'Component mismatch ' + str(key))
    return row


def basis_check(basis):
    require(len(basis) == 3, 'Basis must have three rows')
    for row in basis:
        xyz(row)
    error = max(abs(sum(a * b for a, b in zip(basis[i], basis[j])) - int(i == j)) for i in range(3) for j in range(3))
    require(error < 1e-12, 'Non-orthonormal coordinate basis')
    return error


def digest(data, raw):
    stored = data.get('source_sha256', data.get('mmcif_sha256', data.get('raw_sha256')))
    require(stored == hashlib.sha256(raw.read_bytes()).hexdigest(), 'Source SHA-256 mismatch: ' + raw.name)


def normalize_paths(data):
    if isinstance(data, dict):
        return {k: normalize_paths(v) for k, v in data.items()}
    if isinstance(data, list):
        return [normalize_paths(v) for v in data]
    if isinstance(data, str):
        return data.replace('assets/rna-folding/', 'assets/')
    return data


def active_scripts(root):
    """Audit the selected lesson, excluding other shipped template recipes."""
    class Scripts(HTMLParser):
        def __init__(self):
            super().__init__()
            self.paths = set()

        def handle_starttag(self, tag, attrs):
            if tag != 'script':
                return
            src = dict(attrs).get('src')
            if not src:
                return
            url = urlsplit(src)
            if url.scheme or url.netloc:
                return
            path = (root / unquote(url.path)).resolve()
            require(path.is_relative_to(root), 'Script outside project: ' + src)
            self.paths.add(path)

    parser = Scripts()
    parser.feed((root / 'index.html').read_text())
    require(parser.paths, 'No local scripts in index.html; use --scripts for an explicit search directory')
    return parser.paths


def literal(scripts, pattern, filename=None):
    candidates = []
    for file in sorted(scripts.rglob('*.js') if isinstance(scripts, Path) else scripts):
        if filename and file.name != filename:
            continue
        text = file.read_text()
        for match in re.finditer(pattern, text):
            try:
                value, _ = json.JSONDecoder().raw_decode(text[match.end():].lstrip())
                candidates.append((file, value))
            except json.JSONDecodeError:
                continue
    require(len(candidates) == 1, 'Expected exactly one JSON literal for ' + pattern + ', found ' + str(len(candidates)))
    return candidates[0][1]


def embedded(scripts, name, data, filename=None):
    value = literal(scripts, r'\bconst\s+' + re.escape(name) + r'\s*=\s*', filename)
    require(normalize_paths(value) == normalize_paths(data), 'Embedded data mismatch: ' + name)


def components(vertices, edges):
    adjacency = {v: set() for v in vertices}
    for a, b in edges:
        require(a in adjacency and b in adjacency, 'Chemical edge references missing vertex')
        adjacency[a].add(b)
        adjacency[b].add(a)
    remaining, result = set(vertices), []
    while remaining:
        todo = [min(remaining)]
        seen = set(todo)
        while todo:
            for v in adjacency[todo.pop()] - seen:
                seen.add(v)
                todo.append(v)
        remaining -= seen
        result.append(sorted(seen))
    return sorted(result)


def connected_stem(data, source, scripts):
    embedded(scripts, 'CONNECTED_DATA', data)
    ids = list(range(1, 8)) + list(range(66, 73))
    by = {r['id']: r for r in data['residues']}
    require(sorted(by) == ids, 'Acceptor-stem residue selection changed')
    vertices, links = set(), []
    for i, r in by.items():
        for name, p in r['atoms'].items():
            same_atom(source, i, name, p, r['component'])
            vertices.add((i, name))
        local = set()
        for ring in data['ring_atom_orders'][r['component']] + [["C1'", "C2'", "C3'", "C4'", "O4'"]]:
            for a, b in zip(ring, ring[1:] + ring[:1]):
                local.add(tuple(sorted((a, b))))
        pairs = data['exocyclic_bonds'][r['component']] + [["C1'", 'N9' if r['component'] in ('A', 'G') else 'N1'], ["C4'", "C5'"], ["C5'", "O5'"], ["O5'", 'P'], ['P', 'OP1'], ['P', 'OP2'], ["C3'", "O3'"], ["C2'", "O2'"]]
        if 'OP3' in r['atoms']:
            pairs.append(['P', 'OP3'])
        local.update(tuple(sorted(pair)) for pair in pairs)
        links.extend(((i, a), (i, b)) for a, b in sorted(local))
        if i + 1 in by:
            links.append(((i, "O3'"), (i + 1, 'P')))
    require(len(vertices) == 299 and len(links) == 332, 'Expected 299 heavy atoms and 332 chemical links')
    ds = [math.dist(by[a[0]]['atoms'][a[1]], by[b[0]]['atoms'][b[1]]) for a, b in links]
    require(all(1.1 < x < 1.9 for x in ds), 'Implausible stem chemical bond length')
    groups = [sorted(set(i for i, _ in c)) for c in components(vertices, links)]
    require(groups == [list(range(1, 8)), list(range(66, 73))], 'A missing interval was bridged, or the molecular graph is disconnected')
    return {'residues': len(by), 'heavy_atoms': len(vertices), 'chemical_links': len(links), 'bond_range_A': [min(ds), max(ds)], 'connected_residue_fragments': groups, 'basis_error': basis_check(data['view_basis']), 'all_coordinates_match_source': True, 'embedded_data_matches': True}


def trna(data, context, source, scripts):
    rows = data['residues']
    require([r['id'] for r in rows] == list(range(1, 77)), 'Expected all 76 tRNA residues')
    full = []
    for r in rows:
        same_atom(source, r['id'], "C4'", r['c4prime'], r['component'])
        full.append([r['id'], r['component'], *r['c4prime']])
    embedded(scripts, 'DATA', full, 'rna-trna.js')
    embedded(scripts, 'TRNA_CONTEXT', context)
    require(context['residues'] == full, 'Intro context must retain the full tRNA')
    require(context['highlighted_residues'] == list(range(1, 8)) + list(range(66, 73)), 'Context selection no longer matches the enlarged stem')
    modified = [r['id'] for r in rows if r['component'] not in ('A', 'C', 'G', 'U')]
    require(modified == [10, 16, 17, 26, 32, 34, 37, 39, 40, 46, 49, 54, 55, 58], 'Modified nucleotide identities changed')
    ds = [math.dist(source['A', i, "O3'"]['xyz'], source['A', i + 1, 'P']['xyz']) for i in range(1, 76)]
    require(all(1.4 < d < 1.9 for d in ds), 'Broken tRNA backbone boundary')
    return {'residues': 76, 'modified_residues': modified, 'context_matches_full_chain': True, 'backbone_boundaries': 75, 'O3_P_range_A': [min(ds), max(ds)], 'basis_error': basis_check(data['view_basis_rows'])}


def tertiary(data, source, expected_ids, context_count, pair_guides):
    rows = {r['id']: r for r in data['residues']}
    require(sorted(rows) == expected_ids, 'Tertiary residue selection changed')
    sugar, glyco, backbone = [], [], []
    for i, r in rows.items():
        a = r['atoms']
        for name, p in a.items():
            same_atom(source, i, name, p, r['component'])
        ring = data['sugar_ring']
        sugar += [math.dist(a[n], a[ring[(j + 1) % len(ring)]]) for j, n in enumerate(ring)]
        glyco.append(math.dist(a["C1'"], a['N9' if r['component'] in ('A', 'G') else 'N1']))
        backbone += [math.dist(a[n], a[data['backbone'][j + 1]]) for j, n in enumerate(data['backbone'][:-1])]
    require(all(1.25 < d < 1.9 for d in sugar + glyco + backbone), 'Implausible tertiary covalent geometry')
    ctx = data['context']
    require(len(ctx['residues']) == context_count, 'Incomplete whole-chain context')
    ctx_ids = [r['id'] for r in ctx['residues']]
    for r in ctx['residues']:
        same_atom(source, r['id'], "C4'", r['xyz'], r['component'])
    require(len(set(ctx_ids)) == len(ctx_ids), 'Duplicate context residue')
    require(len(ctx['bonds']) == context_count - 1 and len(components(ctx_ids, ctx['bonds'])) == 1, 'Whole-chain context has an unverified gap')
    contexts = [math.dist(source['A', a, "O3'"]['xyz'], source['A', b, 'P']['xyz']) for a, b in ctx['bonds']]
    require(all(1.4 < d < 1.9 for d in contexts), 'Context draws an invalid covalent shortcut')
    boundaries = [math.dist(rows[a]['atoms']["O3'"], rows[b]['atoms']['P']) for a, b in data['bonds']]
    require(all(1.4 < d < 1.9 for d in boundaries), 'Main view draws an invalid fragment connection')
    fragments = components(expected_ids, data['bonds'])
    expected_fragments = [list(range(1, 8)), list(range(49, 54)), list(range(61, 73))] if data['pdb_id'] == '1EHZ' else [list(range(145, 159)), list(range(220, 230)), list(range(245, 254))]
    require(fragments == expected_fragments, 'Tertiary omitted fragment was bridged')
    contact_ds = [math.dist(rows[a]['atoms'][n], rows[b]['atoms'][m]) for a, n, b, m in pair_guides]
    require(all(2.5 < d < 3.6 for d in contact_ds), 'Unexpected base-pair heavy-atom guide distance')
    if data['pdb_id'] == '1EHZ':
        require(rows[49]['component'] == '5MC' and 'CM5' in rows[49]['atoms'], '5MC49 methyl identity lost')
    else:
        require([rows[i]['component'] for i in range(150, 154)] == list('GAAA'), 'Tetraloop identity changed')
        require(rows[153]['component'] == 'A' and rows[223]['component'] == 'C' and rows[250]['component'] == 'G', 'A-minor selection changed')
    return {'residues': len(rows), 'context_residues': context_count, 'context_connections': len(contexts), 'selected_fragments': fragments, 'sugar_bond_range_A': [min(sugar), max(sugar)], 'glycosidic_bond_range_A': [min(glyco), max(glyco)], 'context_O3_P_range_A': [min(contexts), max(contexts)], 'base_pair_heavy_atom_guides_A': contact_ds, 'basis_error': basis_check(data['basis']), 'context_basis_error': basis_check(ctx['basis']), 'all_coordinates_match_source': True}


def ions(data, source, scripts):
    embedded(scripts, 'DATA', data, 'rna-ions.js')
    require(len(data['trace']) == 76 and len(data['phosphates']) == 6 and len(data['waters']) == 6, 'Ion-scene selection changed')
    for r in data['trace'] + data['phosphates'] + [data['magnesium']] + data['waters']:
        row = same_atom(source, r['residue'], r['atom'], r['xyz'], r['component'], r['auth_chain'])
        require(row['label_chain'] == r['label_chain'] and row['occupancy'] == r['occupancy'], 'Ion/water source identity changed')
    require(data['magnesium']['residue'] == 560 and [w['residue'] for w in data['waters']] == list(range(725, 731)), 'Mg hydration site changed')
    ds = [math.dist(data['magnesium']['xyz'], w['xyz']) for w in data['waters']]
    require(all(1.8 < d < 2.2 for d in ds), 'Unexpected Mg-water distance')
    require(all(abs(a - b) < 1e-12 for a, b in zip(ds, data['mg_water_distances_A'])), 'Stored Mg-water distances changed')
    return {'trace_residues': 76, 'phosphates': 6, 'magnesium': 560, 'water_residues': list(range(725, 731)), 'Mg_water_distances_A': ds, 'all_coordinates_match_source': True, 'schematic_ion_atmosphere_excluded': True}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--project', type=Path, default=Path.cwd())
    parser.add_argument('--assets', type=Path, help='Override asset directory relative to project (default assets/rna-folding)')
    parser.add_argument('--scripts', type=Path, help='Override JS search directory relative to project (default: local scripts loaded by index.html)')
    parser.add_argument('--out', type=Path, help='Output directory relative to project (default qa-output/rna-folding)')
    parser.add_argument('--legacy-inline', action='store_true', help='Migration comparison only: allow pre-registry inline STEM/MOTIF data')
    args = parser.parse_args()
    root = args.project.resolve()
    assets = (root / (args.assets or 'assets/rna-folding')).resolve()
    out = (root / (args.out or 'qa-output/rna-folding')).resolve()
    require(Path(__file__).resolve().parent not in [out, *out.parents], 'Output must be outside QA source directory')
    out.mkdir(parents=True, exist_ok=True)
    result = {'ok': False, 'checks': {}, 'errors': [], 'limitations': ['These checks validate supplied source coordinates, chemical adjacency and known selections; they do not infer hydrogen bonds, energy or a folding pathway.', 'The curated A-minor assignment remains a literature claim; this offline audit does not re-review the paper.', 'Camera projections, label legibility, hidden-surface behavior and physical-device gestures require separate browser/visual checks.']}
    try:
        scripts = (root / args.scripts).resolve() if args.scripts else active_scripts(root)
        load = lambda name: json.loads((assets / name).read_text())
        raw1, raw2 = assets / 'tertiary-1ehz.cif', assets / 'motif-1hr2.pdb'
        s1, s2 = read_cif(raw1), read_pdb(raw2)
        connected, context, trna_data, ion_data = map(load, ['duplex-connected-1ehz.json', 'duplex-trna-context.json', 'trna-1ehz.json', 'ions-1ehz.json'])
        stem, motif = load('tertiary-v4-1ehz.json'), load('tertiary-v4-1hr2.json')
        for data in [connected, context, trna_data, ion_data, stem]:
            digest(data, raw1)
        digest(motif, raw2)
        result['checks']['connected_stem'] = connected_stem(connected, s1, scripts)
        result['checks']['trna_and_context'] = trna(trna_data, context, s1, scripts)
        if args.legacy_inline:
            embedded(scripts, 'STEM', stem)
            embedded(scripts, 'MOTIF', motif)
            result['checks']['structure_registry'] = {'legacy_inline': True}
        else:
            registry = literal(scripts, r'(?:window|g)\.RNA_STRUCTURES\s*=\s*(?:Object\.freeze\(\s*)?')
            require(normalize_paths(registry['acceptorT']) == normalize_paths(stem) and normalize_paths(registry['tetraloopReceptor']) == normalize_paths(motif), 'RNA_STRUCTURES registry differs from source assets')
            result['checks']['structure_registry'] = {'acceptorT_matches': True, 'tetraloopReceptor_matches': True}
        result['checks']['tertiary_1ehz'] = tertiary(stem, s1, list(range(1, 8)) + list(range(49, 54)) + list(range(61, 73)), 76, [(7, 'O4', 66, 'N6'), (7, 'N3', 66, 'N1'), (49, 'N4', 65, 'O6'), (49, 'N3', 65, 'N1'), (49, 'O2', 65, 'N2')])
        result['checks']['tertiary_1hr2'] = tertiary(motif, s2, list(range(145, 159)) + list(range(220, 230)) + list(range(245, 254)), 157, [(223, 'N4', 250, 'O6'), (223, 'N3', 250, 'N1'), (223, 'O2', 250, 'N2')])
        result['checks']['magnesium_hydration'] = ions(ion_data, s1, scripts)
        result['ok'] = True
    except (AssertionError, OSError, ValueError, KeyError, TypeError) as error:
        result['errors'].append(str(error))
    report = out / 'science-report.json'
    report.write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps({'ok': result['ok'], 'checks': list(result['checks']), 'errors': result['errors'], 'report': str(report)}, indent=2))
    return 0 if result['ok'] else 1


if __name__ == '__main__':
    sys.exit(main())
