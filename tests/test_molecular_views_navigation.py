"""Discover the molecular constructor under 3D, including portable lesson copies."""
import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ROUTER = ROOT / 'docs/navigation/route.py'


class MolecularViewsNavigationTests(unittest.TestCase):
    def route(self, *args, script=ROUTER):
        result = subprocess.run(
            [sys.executable, str(script), *args, '--json'],
            capture_output=True, text=True,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        return json.loads(result.stdout)

    def test_3d_branch_includes_coordinate_constructor_and_procedural_scenes(self):
        cards = self.route('--branch', 'three-dimensional')['concepts']
        self.assertTrue({'molecular-views', 'three-dimensional', 'spatial-biology'}
                        .issubset({card['id'] for card in cards}))

    def test_biology_search_and_coordinate_crosslink_still_find_constructor(self):
        for query in ('биология теломераза', 'protein RNA complex 3D',
                      'конструктор 3D комплекса белок РНК'):
            cards = self.route(query)['results']
            self.assertEqual(cards[0]['id'], 'molecular-views', query)
            self.assertEqual(cards[0]['branch'], 'three-dimensional')
        coordinate_card = self.route('--show', 'molecular-coordinates')
        self.assertEqual(coordinate_card['branch'], 'biology')
        self.assertIn('molecular-views', coordinate_card['related'])

    def test_generated_and_moved_project_retains_3d_discovery_and_guides(self):
        with tempfile.TemporaryDirectory(prefix='molecular 3d navigation ') as tmp:
            project = Path(tmp) / 'lesson'
            result = subprocess.run(
                [sys.executable, str(ROOT / 'create.py'), str(project),
                 '--template', 'molecular-views'],
                capture_output=True, text=True,
            )
            self.assertEqual(result.returncode, 0, result.stderr)
            moved = Path(tmp) / 'moved lesson'
            shutil.move(project, moved)
            router = moved / 'guide/navigation/route.py'
            branch = self.route('--branch', 'three-dimensional', script=router)
            self.assertIn('molecular-views', [card['id'] for card in branch['concepts']])
            card = self.route('--show', 'molecular-views', script=router)
            self.assertNotIn(str(ROOT), json.dumps(card))
            for ref in card['guides']:
                self.assertTrue(Path(ref['path']).is_relative_to(moved.resolve()))
                self.assertTrue(Path(ref['path']).is_file())
            self.assertTrue((moved / 'guide/three-dimensional.md').is_file())
            self.assertEqual(self.route('--check', script=router)['errors'], [])


if __name__ == '__main__':
    unittest.main()
