"""Black-box tests for deterministic, bounded source-coordinate extraction."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / 'starter/build/molecular-data.py'


def atom(serial, name, component, chain, residue, xyz, alt='', insertion=''):
    return (f'ATOM  {serial:5d} {name:>4}{alt or " ":1}{component:>3} {chain:1}'
            f'{residue:4d}{insertion or " ":1}   '
            f'{xyz[0]:8.3f}{xyz[1]:8.3f}{xyz[2]:8.3f}  1.00 20.00           C')


def nucleotide(serial, residue, component='A', chain='B', offset=0):
    names = ["P", "O5'", "C5'", "C4'", "C3'", "O3'", "C1'", "C2'", "O4'",
             'N1', 'C2', 'N3', 'C4', 'C5', 'C6', 'N9', 'C8', 'N7', 'N6', 'O6',
             'N2', 'O2', 'N4', 'O4', 'C7']
    if not component.startswith('D'):
        names.append("O2'")
    rows = []
    for index, name in enumerate(names):
        xyz = [offset + index * .01, index % 3, index % 5]
        if name == 'P':
            xyz = [offset, 0, 0]
        if name == "O3'":
            xyz = [offset + 3.4, 0, 0]
        rows.append(atom(serial + index, name, component, chain, residue, xyz))
    return rows


class MolecularDataTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.path = Path(self.tmp.name)
        self.source = self.path / 'input.pdb'
        self.config = self.path / 'config.json'
        self.output = self.path / 'data.json'
        self.js = self.path / 'data.js'
        self.cfg = {
            'pdb_id': 'TEST', 'source_url': 'https://example.org/TEST.pdb',
            'model': 1, 'altloc': '',
            'frame': {'origin': [0, 0, 0], 'basis': [[1, 0, 0], [0, 1, 0], [0, 0, 1]]},
            'traces': [{'chain': 'B', 'atom': 'P', 'max_link_distance': 8}],
            'fragments': {'rna': {'chain': 'B', 'polymer': 'RNA', 'residues': [1, 2]}},
        }
        self.rows = nucleotide(1, 1) + nucleotide(50, 2, 'C', offset=5)

    def run_import(self, check=False):
        self.source.write_text('\n'.join(self.rows) + '\n')
        self.config.write_text(json.dumps(self.cfg))
        command = [sys.executable, str(SCRIPT), '--source', str(self.source),
                   '--config', str(self.config), '--json', str(self.output),
                   '--js', str(self.js), '--global', 'MOLECULAR_VIEW_DATA']
        if check:
            command.append('--check')
        return subprocess.run(command, capture_output=True, text=True)

    def good(self, check=False):
        result = self.run_import(check)
        self.assertEqual(result.returncode, 0, result.stderr)
        return json.loads(self.output.read_text())

    def bad(self, phrase):
        result = self.run_import()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn(phrase, result.stderr)
        self.assertFalse(self.output.exists())

    def test_source_coordinates_identity_and_canonical_connectivity(self):
        data = self.good()
        self.assertEqual(data['source_sha256'], hashlib.sha256(self.source.read_bytes()).hexdigest())
        self.assertEqual(data['coordinate_units'], 'Å')
        self.assertEqual(data['records'], ['ATOM', 'HETATM'])
        self.assertEqual(data['traces'][0]['rows'][0],
                         {'id': 'B1', 'residue': 1, 'component': 'A', 'xyz': [0, 0, 0]})
        fragment = data['fragments']['rna']
        self.assertEqual(fragment['bonds'], [[1, 2]])
        self.assertEqual(fragment['residues'][0]['glycosidic'], ["C1'", 'N9'])
        self.assertEqual(fragment['residues'][1]['glycosidic'], ["C1'", 'N1'])
        self.assertEqual(fragment['residues'][0]['atoms']["O3'"], [3.4, 0, 0])
        self.assertEqual(fragment['basis'], data['basis'])
        self.assertEqual(fragment['context']['residues'][0]['id'], 1)

    def test_record_selection_is_explicit_validated_and_preserved(self):
        # Water shares the author chain, but has no polymer landmark.
        self.rows.append(atom(999, 'O', 'HOH', 'B', 9, [3, 3, 3]).replace('ATOM  ', 'HETATM', 1))
        self.bad('missing B:9:P')
        self.cfg['records'] = ['ATOM']
        data = self.good()
        self.assertEqual(data['records'], ['ATOM'])
        self.assertEqual(data['fragments']['rna']['records'], ['ATOM'])
        self.assertEqual(len(data['traces'][0]['rows']), 2)

    def test_invalid_record_selection_is_rejected(self):
        for choice in ([], ['ATOM', 'ATOM'], ['SEQRES'], 'ATOM', ['ATOM', 1]):
            with self.subTest(choice=choice):
                self.cfg['records'] = choice
                self.bad('records')

    def test_1hr2_explicit_polymer_records_preserve_full_polymer_context(self):
        assets = ROOT / 'starter/assets/rna-folding'
        source = assets / 'motif-1hr2.pdb'
        reference = json.loads((assets / 'tertiary-v4-1hr2.json').read_text())
        cfg = {
            'pdb_id': '1HR2', 'source_url': 'https://files.rcsb.org/download/1HR2.pdb',
            'model': 1, 'altloc': '', 'records': ['ATOM'],
            'traces': [{'chain': 'A', 'atom': "C4'", 'max_link_distance': 8}],
            'fragments': {'rna': {'chain': 'A', 'polymer': 'RNA',
                                  'residues': [r['id'] for r in reference['residues']]}},
            'frame': {'basis': reference['basis'], 'origin': reference['origin']},
        }
        self.config.write_text(json.dumps(cfg))
        result = subprocess.run([
            sys.executable, str(SCRIPT), '--source', str(source), '--config', str(self.config),
            '--json', str(self.output), '--js', str(self.js),
        ], capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        data = json.loads(self.output.read_text())
        self.assertEqual(data['source_sha256'], reference['source_sha256'])
        self.assertEqual(data['records'], ['ATOM'])
        self.assertEqual(len(data['traces'][0]['rows']), 157)
        self.assertEqual(len(data['fragments']['rna']['context']['residues']), 157)
        self.assertEqual(len(data['fragments']['rna']['residues']), 33)
        self.assertEqual(sum(len(r['atoms']) for r in data['fragments']['rna']['residues']), 708)
        reference_atoms = {}
        for line in source.read_text().splitlines():
            if line.startswith('ATOM  ') and line[21] == 'A':
                reference_atoms.setdefault(int(line[22:26]), {})[line[12:16].strip()] = [
                    float(line[a:b]) for a, b in ((30, 38), (38, 46), (46, 54))]
        for row in data['fragments']['rna']['residues']:
            self.assertEqual(row['atoms'], reference_atoms[row['id']])

    def test_subset_has_full_modeled_chain_context(self):
        self.rows += nucleotide(100, 3, 'G', offset=10)
        self.cfg['fragments']['rna']['residues'] = [2]
        data = self.good()
        self.assertEqual([r['id'] for r in data['fragments']['rna']['residues']], [2])
        self.assertEqual([r['id'] for r in data['fragments']['rna']['context']['residues']], [1, 2, 3])

    def test_numbering_gap_is_not_a_bond_even_when_close(self):
        self.rows = nucleotide(1, 1) + nucleotide(50, 3, 'C', offset=5)
        self.cfg['fragments']['rna']['residues'] = [1, 3]
        data = self.good()
        self.assertEqual(data['traces'][0]['bonds'], [])
        self.assertEqual(data['fragments']['rna']['bonds'], [])

    def test_subset_does_not_skip_an_intervening_source_residue(self):
        self.rows = nucleotide(1, 1) + nucleotide(50, 8, 'G', offset=10) + nucleotide(100, 2, 'C', offset=5)
        data = self.good()
        self.assertEqual(data['fragments']['rna']['bonds'], [])

    def test_ter_break_stays_disconnected(self):
        self.rows = nucleotide(1, 1) + ['TER'] + nucleotide(50, 2, 'C', offset=5)
        data = self.good()
        self.assertEqual(data['traces'][0]['bonds'], [])
        self.assertEqual(data['fragments']['rna']['bonds'], [])
        self.assertEqual(data['fragments']['rna']['context']['bonds'], [])

    def test_overlong_candidate_does_not_become_chemical_bond(self):
        self.rows = nucleotide(1, 1) + nucleotide(50, 2, 'C', offset=20)
        data = self.good()
        self.assertEqual(data['fragments']['rna']['bonds'], [])
        self.assertTrue(data['omissions'])

    def test_explicit_model_is_selected_without_merging(self):
        self.rows = ['MODEL        1'] + self.rows + ['ENDMDL', 'MODEL        2'] + nucleotide(100, 1, offset=20) + nucleotide(150, 2, 'C', offset=25) + ['ENDMDL']
        self.cfg['model'] = 2
        data = self.good()
        self.assertEqual(data['model'], 2)
        self.assertEqual(data['traces'][0]['rows'][0]['xyz'], [20, 0, 0])

    def test_model_and_altloc_are_required(self):
        del self.cfg['model']
        self.bad('model')
        self.cfg['model'] = 1
        del self.cfg['altloc']
        self.bad('altloc')

    def test_selected_alternate_replaces_no_atoms_implicitly(self):
        self.rows = [row[:16] + 'A' + row[17:] for row in self.rows]
        self.cfg['altloc'] = 'A'
        data = self.good()
        self.assertEqual(data['altloc'], 'A')
        self.cfg['altloc'] = 'B'
        self.output.unlink()
        self.bad('selected altloc')

    def test_duplicate_alternate_atom_is_rejected(self):
        self.rows.append(self.rows[0][:16] + 'A' + self.rows[0][17:])
        self.cfg['altloc'] = 'A'
        self.bad('duplicate atom')

    def test_insertion_codes_and_reused_author_ids_fail_explicitly(self):
        self.rows[0] = self.rows[0][:26] + 'A' + self.rows[0][27:]
        self.bad('insertion code')
        self.rows = nucleotide(1, 1) + ['TER'] + nucleotide(50, 1, offset=5)
        self.bad('reused author residue')

    def test_noncanonical_fragment_requires_curated_data(self):
        self.rows = nucleotide(1, 1, 'PSU') + nucleotide(50, 2, 'C', offset=5)
        self.bad('curated')

    def test_dna_topology_does_not_invent_ribose_oxygen(self):
        self.rows = nucleotide(1, 1, 'DG') + nucleotide(50, 2, 'DT', offset=5)
        self.cfg['fragments'] = {'dna': {'chain': 'B', 'polymer': 'DNA', 'residues': [1, 2]}}
        data = self.good()
        g, t = data['fragments']['dna']['residues']
        self.assertNotIn("O2'", g['atoms'])
        self.assertEqual(g['glycosidic'], ["C1'", 'N9'])
        self.assertIn(['C5', 'C7'], t['exo'])

    def test_invalid_basis_and_nonfinite_coordinate_fail(self):
        self.cfg['frame']['basis'][2] = [0, 0, -1]
        self.bad('right-handed')
        self.cfg['frame']['basis'][2] = [0, 0, 1]
        self.rows[0] = self.rows[0][:30] + '     nan' + self.rows[0][38:]
        self.bad('finite')

    def test_anchor_frame_preserves_source_coordinates(self):
        self.cfg['frame'] = {'anchors': {
            'x': [{'chain': 'B', 'residue': 1, 'atom': 'P'}, {'chain': 'B', 'residue': 2, 'atom': 'P'}],
            'y': [{'chain': 'B', 'residue': 1, 'atom': 'P'}, {'chain': 'B', 'residue': 1, 'atom': "C4'"}],
        }}
        data = self.good()
        self.assertEqual(data['basis'][0], [1, 0, 0])
        self.assertEqual(data['traces'][0]['rows'][1]['xyz'], [5, 0, 0])

    def test_check_detects_stale_json_and_js_without_writing(self):
        self.good()
        json_bytes, js_bytes = self.output.read_bytes(), self.js.read_bytes()
        self.good(check=True)
        self.js.write_text('stale')
        result = self.run_import(check=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('stale', result.stderr)
        self.assertEqual(self.js.read_text(), 'stale')
        self.assertEqual(self.output.read_bytes(), json_bytes)
        self.js.write_bytes(js_bytes)
        self.output.write_text('{}')
        result = self.run_import(check=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(self.output.read_text(), '{}')
        self.assertEqual(self.js.read_bytes(), js_bytes)

    def test_curated_fixture_matches_unmodified_pdb_and_regenerates(self):
        assets = ROOT / 'starter/assets/molecular-views'
        source = (assets / '7BG9.pdb').read_bytes()
        self.assertEqual(hashlib.sha256(source).hexdigest(),
                         'dbc78e3ec2d041cc51efebe813c107ed813472766fd735ae53ef9e0234b9ad43')
        result = subprocess.run([
            sys.executable, str(SCRIPT), '--source', str(assets / '7BG9.pdb'),
            '--config', str(assets / '7BG9.config.json'), '--json', str(assets / '7BG9.json'),
            '--js', str(ROOT / 'starter/js/molecular-views-data.js'), '--check',
        ], capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        data = json.loads((assets / '7BG9.json').read_text())
        raw = {}
        for line in source.decode().splitlines():
            if line.startswith('ATOM  '):
                raw[(line[21], int(line[22:26]), line[12:16].strip())] = [
                    float(line[a:b]) for a, b in ((30, 38), (38, 46), (46, 54))]
        self.assertEqual({t['chain']: len(t['rows']) for t in data['traces']},
                         {'A': 913, 'M': 90, 'L': 82, 'B': 256, 'N': 6})
        for trace in data['traces']:
            for row in trace['rows']:
                self.assertEqual(row['xyz'], raw[(trace['chain'], row['residue'], trace['atom'])])
        for part in data['fragments'].values():
            for row in part['residues']:
                for atom_name, xyz in row['atoms'].items():
                    self.assertEqual(xyz, raw[(part['chain'], row['id'], atom_name)])
        self.assertEqual(''.join(r['component'] for r in data['fragments']['rna']['residues']), 'CUAACCCUAAC')
        self.assertEqual(len(data['fragments']['rna']['context']['residues']), 256)
        self.assertEqual(data['omissions'], [])


if __name__ == '__main__':
    unittest.main()
