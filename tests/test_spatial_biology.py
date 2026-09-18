"""Optional 3D biology template discovery, relocation and script isolation."""
import json
import re
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CORE = [f'js/three/{name}.js' for name in
        ('molecule-mesh', 'cell-surface', 'capture-mesh', 'codes-mesh', 'libraries-mesh')]
RECIPES = [f'js/recipes/spatial-biology/{name}.js' for name in
           ('common', 'capture-stage', '01-surface', '02-codes', '03-libraries')]


class SpatialBiologyTests(unittest.TestCase):
    def command(self, *args, cwd=None):
        result = subprocess.run([sys.executable, *map(str, args)], cwd=cwd,
                                capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr + result.stdout)
        return result.stdout

    def test_discovery_keeps_a_separate_3d_branch_and_coordinate_routes(self):
        router = ROOT / 'docs/navigation/route.py'
        for query in ('spatial-biology', 'пространственная биология', 'CITE-seq cell bead droplet',
                      'two libraries one cell barcode', 'две библиотеки один клеточный код'):
            data = json.loads(self.command(router, query, '--json'))
            self.assertEqual(data['results'][0]['id'], 'spatial-biology', query)
        catalog = json.loads((ROOT / 'docs/navigation/catalog.json').read_text())
        cards = {card['id']: card for card in catalog['concepts']}
        self.assertIn('three-dimensional', {branch['id'] for branch in catalog['branches']})
        self.assertEqual(cards['spatial-biology']['branch'], 'three-dimensional')
        self.assertEqual(cards['three-dimensional']['branch'], 'three-dimensional')
        for card_id in ('molecular-views', 'molecular-coordinates'):
            self.assertIn(card_id, cards['three-dimensional']['related'])
            self.assertIn('three-dimensional', cards[card_id]['related'])
        self.command(router, '--check', '--json')

    def test_readout_and_pairing_queries_find_the_reusable_scenario(self):
        router = ROOT / 'docs/navigation/route.py'
        for query in ('R1 R2', 'paired reads', 'парные чтения', 'readout',
                      'RNA ADT readout', 'чтение RNA ADT', 'gene mapping',
                      'сопоставление с референсом', 'antibody dictionary',
                      'словарь антител', 'paired profiles', 'парные профили',
                      'общий клеточный код', 'camera settles before labels',
                      'камера перед подписями'):
            with self.subTest(query=query):
                data = json.loads(self.command(router, query, '--json'))
                self.assertTrue(data['results'], query)
                self.assertEqual(data['results'][0]['id'], 'spatial-biology', query)
        for query in ('V3.LibrariesMesh.readouts', 'readout-rna', 'readout-adt'):
            data = json.loads(self.command(router, query, '--json'))
            self.assertEqual(data['results'][0]['id'], 'three-dimensional', query)
        card = json.loads(self.command(router, '--show', 'spatial-biology', '--json'))
        self.assertEqual([guide.get('section') for guide in card['guides']], [
            'Reusable scenarios', 'RNA and ADT readouts',
            'Motion and identity contracts', 'Primary sources for the readout scenario'])

    def test_template_exports_after_relocation_with_guides_and_ordered_scripts(self):
        with tempfile.TemporaryDirectory(prefix='spatial biology portable ') as tmp:
            source, project = Path(tmp) / 'initial', Path(tmp) / 'перенесённый урок'
            self.command(ROOT / 'create.py', source, '--template', 'spatial-biology', '--lang', 'en')
            shutil.move(source, project)
            html = (project / 'index.html').read_text()
            scripts = re.findall(r'<script src="([^"]+)"', html)
            required = ['js/film.js', 'js/motion.js', 'js/layout.js', 'js/perspective.js', *CORE, *RECIPES,
                        'js/player.js', 'js/boot.js']
            self.assertEqual([script for script in scripts if script in required], required)
            self.assertEqual(len(scripts), len(set(scripts)))
            self.assertNotIn('js/episodes/', html)
            for relative in [*CORE, *RECIPES, 'css/spatial-biology.css',
                             'guide/three-dimensional.md', 'guide/molecular-views.md',
                             'guide/molecular-coordinates.md']:
                self.assertTrue((project / relative).is_file(), relative)
            for guide in json.loads((project / 'guide/navigation/catalog.json').read_text())['concepts']:
                for reference in guide.get('guides', []):
                    self.assertTrue((project / 'guide' / reference['path']).is_file(), reference)
            self.command(project / 'guide/navigation/route.py', '--check', '--json')
            self.command(project / 'build/bundle.py', cwd=project)
            self.command(project / 'build/bundle.py', '--check', cwd=project)
            artifact = (project / 'dist/lesson.html').read_text()
            self.assertNotIn('<script src=', artifact)
            self.assertNotRegex(artifact, r'/(?:Users|home)/[^/]+/')
            self.assertNotIn('CiteCellSurface', artifact)
            self.assertIn('Bio3D.CaptureStage', artifact)
            self.assertIn('V3.CodesMesh', artifact)
            self.assertIn('V3.LibrariesMesh', artifact)
            self.assertIn('F.shared(', artifact)
            self.assertIn('Three codes', artifact)

    def test_existing_templates_receive_reusable_files_without_loading_them(self):
        for template in ('gallery', 'molecular-views'):
            with self.subTest(template=template), tempfile.TemporaryDirectory() as tmp:
                project = Path(tmp) / 'lesson'
                self.command(ROOT / 'create.py', project, '--template', template)
                html = (project / 'index.html').read_text()
                for relative in [*CORE, *RECIPES, 'guide/three-dimensional.md']:
                    self.assertTrue((project / relative).is_file(), relative)
                    self.assertNotIn(relative, html)
                self.assertNotIn('css/spatial-biology.css', html)


if __name__ == '__main__':
    unittest.main()
