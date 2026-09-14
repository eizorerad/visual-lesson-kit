"""Discovery behavior and portability; no rendering or model-token claims."""
import importlib.util
import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
ROUTER = ROOT / 'docs/navigation/route.py'


class NavigationTests(unittest.TestCase):
    def cli(self, *args, script=ROUTER):
        return subprocess.run([sys.executable, str(script), *args], capture_output=True, text=True)

    def navigator(self):
        spec = importlib.util.spec_from_file_location('lesson_navigation', ROUTER)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        return module.Navigator()

    def test_bilingual_search_is_relevant_and_bounded(self):
        for query in ('перестановка меток', 'permutation test'):
            result = self.cli(query, '--json')
            self.assertEqual(result.returncode, 0, result.stderr)
            data = json.loads(result.stdout)
            self.assertEqual(data['results'][0]['id'], 'permutation')
            self.assertLessEqual(len(data['results']), 3)
            self.assertLess(len(result.stdout), 9000)

    def test_natural_gene_testing_request_finds_the_domain_before_generic_scene(self):
        query = ('Нужна короткая учебная сцена: почему при проверке многих генов '
                 'недостаточно просто сравнить каждое p с 0.05? Хочу, чтобы сортировка '
                 'и выбор гипотез были видны в движении, без смены значений')
        result = self.cli(query, '--json')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(json.loads(result.stdout)['results'][0]['id'], 'multiple-testing')

    def test_unknown_request_does_not_return_unrelated_catalog(self):
        result = self.cli('qzxv987654', '--json')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(json.loads(result.stdout)['results'], [])

    def test_missing_molecular_physics_is_explicit(self):
        result = self.cli('--show', 'molecular-simulation', '--json')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(json.loads(result.stdout)['status'], 'external')
        result = self.cli('--show', 'molecular-animation', '--json')
        self.assertEqual(json.loads(result.stdout)['status'], 'ready')

    def test_molecular_actor_requests_find_ready_schematic_contract(self):
        for query in ('dCas9 guide RNA', 'рибосома тРНК', 'подсветка белка'):
            result = self.cli(query, '--json')
            self.assertEqual(result.returncode, 0, result.stderr)
            data = json.loads(result.stdout)['results'][0]
            self.assertEqual(data['id'], 'molecular-animation')
            self.assertEqual(data['status'], 'ready')
            self.assertTrue(any(ref['path'].endswith('molecular.md') for ref in data['guides']))
            self.assertIn('not atom coordinates', data['caveat'])

    def test_regulation_splicing_and_enlargement_have_specific_ready_contracts(self):
        for query, expected in [('H3K9me3 histone tail', 'molecular-regulation'),
                                ('сплайсинг пре-мРНК', 'rna-processing'),
                                ('Cas12a Cas13', 'rna-processing'),
                                ('увеличить белок крупный план', 'molecular-inspection')]:
            result = self.cli(query, '--json')
            self.assertEqual(result.returncode, 0, result.stderr)
            data = json.loads(result.stdout)['results'][0]
            self.assertEqual(data['id'], expected)
            self.assertEqual(data['status'], 'ready')

    def test_folding_calculation_search_discloses_the_missing_capability(self):
        for query in ('рассчитать фолдинг', 'сворачивание белка folding simulation'):
            result = self.cli(query, '--json')
            self.assertEqual(result.returncode, 0, result.stderr)
            cards = json.loads(result.stdout)['results']
            self.assertIn('molecular-simulation', [c['id'] for c in cards])

    def test_molecular_check_template_has_its_own_portable_discovery_card(self):
        for query in ('molecular-check', 'проверка семи молекулярных элементов'):
            result = self.cli(query, '--json')
            self.assertEqual(result.returncode, 0, result.stderr)
            card = json.loads(result.stdout)['results'][0]
            self.assertEqual(card['id'], 'molecular-check')
            self.assertEqual(card['status'], 'ready')
            self.assertTrue(any(ref['path'].endswith('molecular-check.md') for ref in card['guides']))
            self.assertTrue(any(path.endswith('js/recipes/molecular-check.js') for path in card['examples']))
            self.assertIn('biophysics', card['caveat'])

    def test_search_reads_no_reference_or_implementation_bodies(self):
        nav = self.navigator()
        with patch.object(Path, 'read_text', side_effect=AssertionError('unexpected content read')):
            self.assertEqual(nav.search('permutation test')[0]['id'], 'permutation')

    def test_chemistry_operations_and_template_have_specific_portable_cards(self):
        for query, expected in [('ковалентная связь', 'chemistry'),
                                ('covalent bond', 'chemistry'),
                                ('свободная энергия', 'physical-chemistry'),
                                ('free energy', 'physical-chemistry'),
                                ('chemistry-bridge', 'chemistry-bridge'),
                                ('химия в биологию', 'chemistry-bridge')]:
            result = self.cli(query, '--json')
            self.assertEqual(result.returncode, 0, result.stderr)
            cards = json.loads(result.stdout)['results']
            self.assertTrue(cards, query)
            card = cards[0]
            self.assertEqual(card['id'], expected)
            self.assertEqual(card['status'], 'ready')
            self.assertTrue(any(ref['path'].endswith(expected + '.md') for ref in card['guides']))
            self.assertTrue(all(ref.get('section') for ref in card['guides']))

    def test_guide_read_returns_only_selected_section_and_pages_without_loss(self):
        nav = self.navigator()
        full = nav.read_guide('scene', max_chars=12000)
        self.assertIn('D.deck.register', full['text'])
        self.assertNotIn('## 2. Числовая шкала', full['text'])
        pieces, offset = [], 0
        while True:
            item = nav.read_guide('scene', offset=offset, max_chars=500)
            pieces.append(item['text'])
            if item['next_offset'] is None:
                break
            self.assertGreater(item['next_offset'], offset)
            offset = item['next_offset']
        self.assertEqual(''.join(pieces), full['text'])

    def test_bh_contract_does_not_load_unrelated_statistics(self):
        nav = self.navigator()
        numerical = nav.read_guide('multiple-testing', index=1)['text']
        view = nav.read_guide('multiple-testing', index=2)['text']
        self.assertIn('K.bhAdjust', numerical)
        self.assertNotIn('K.exactMeanPermutation', numerical)
        self.assertNotIn('K.sampleSummary', numerical)
        self.assertIn('K.bhView', view)
        self.assertNotIn('K.permutationView', view)

    def test_all_metadata_paths_sections_and_related_ids_resolve(self):
        nav = self.navigator()
        self.assertEqual(nav.validate(), [])
        self.assertEqual(len({c['id'] for c in nav.concepts}), len(nav.concepts))

    def test_invalid_selection_and_path_escape_are_rejected(self):
        for args in [('--show', '../README.md'), ('--branch', 'missing'), ('--limit', '99'), ('--read', 'scene', '--offset', '-1')]:
            self.assertNotEqual(self.cli(*args).returncode, 0, args)
        nav = self.navigator()
        with self.assertRaises(ValueError):
            nav.resolve('../outside.md', 'guide')

    def test_generated_navigator_is_independent_of_original_kit(self):
        with tempfile.TemporaryDirectory(prefix='lesson navigation ') as tmp:
            project = Path(tmp) / 'lesson'
            result = subprocess.run([sys.executable, str(ROOT / 'create.py'), str(project)], capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            portable = Path(tmp) / 'moved'
            shutil.move(project, portable)
            script = portable / 'guide/navigation/route.py'
            result = self.cli('--show', 'permutation', '--json', script=script)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertNotIn(str(ROOT), result.stdout)
            data = json.loads(result.stdout)
            for ref in data['guides']:
                self.assertTrue(Path(ref['path']).is_relative_to(portable.resolve()))
                self.assertTrue(Path(ref['path']).is_file())
            result = self.cli('--check', '--json', script=script)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(json.loads(result.stdout)['errors'], [])
            self.assertTrue((portable / 'guide/START.md').is_file())


if __name__ == '__main__':
    unittest.main()
