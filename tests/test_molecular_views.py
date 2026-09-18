"""Fresh construction kit generation, relocation and standalone use."""
import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class MolecularViewsTests(unittest.TestCase):
    def test_discovery_routes_builder_requests(self):
        for query in ['molecular-views', 'конструктор 3D комплекса белок РНК', 'telomerase assembly context zoom']:
            r = subprocess.run([sys.executable, str(ROOT/'docs/navigation/route.py'), query, '--json'], capture_output=True, text=True)
            self.assertEqual(r.returncode, 0, r.stderr)
            self.assertEqual(json.loads(r.stdout)['results'][0]['id'], 'molecular-views', query)

    def test_new_template_remains_buildable_after_relocation(self):
        with tempfile.TemporaryDirectory(prefix='molecular portable ') as tmp:
            src, project = Path(tmp)/'initial', Path(tmp)/'перенесённый урок'
            r = subprocess.run([sys.executable, str(ROOT/'create.py'), str(src), '--template', 'molecular-views', '--lang', 'en'], capture_output=True, text=True)
            self.assertEqual(r.returncode, 0, r.stderr)
            shutil.move(src, project)
            for f in ['js/molecular-views.js', 'js/molecular-scenes.js', 'js/recipes/molecular-views.js', 'guide/molecular-views.md', 'guide/molecular-views-api.md', 'guide/molecular-data.md', 'assets/molecular-views/7BG9.pdb', 'build/molecular-data.py', 'qa/molecular-views/verify.cjs', 'qa/molecular-views/performance.cjs']:
                self.assertTrue((project/f).is_file(), f)
            command = [sys.executable, str(project/'build/molecular-data.py'), '--source', 'assets/molecular-views/7BG9.pdb', '--config', 'assets/molecular-views/7BG9.config.json', '--json', 'assets/molecular-views/7BG9.json', '--js', 'js/molecular-views-data.js', '--global', 'MOLECULAR_VIEW_DATA', '--check']
            r = subprocess.run(command, cwd=project, capture_output=True, text=True)
            self.assertEqual(r.returncode, 0, r.stderr+r.stdout)
            for args in [[], ['--check']]:
                r = subprocess.run([sys.executable, str(project/'build/bundle.py'), *args], cwd=project, capture_output=True, text=True)
                self.assertEqual(r.returncode, 0, r.stderr+r.stdout)
            artifact = (project/'dist/lesson.html').read_text()
            self.assertNotIn('<script src=', artifact)
            self.assertNotRegex(artifact, r'/(?:Users|home)/[^/]+/')
            self.assertIn('MolecularScenes.overview(', artifact)
            self.assertIn('MolecularScenes.detail(', artifact)
            r = subprocess.run([sys.executable, str(project/'guide/navigation/route.py'), '--check', '--json'], capture_output=True, text=True)
            self.assertEqual(r.returncode, 0, r.stderr+r.stdout)


if __name__ == '__main__':
    unittest.main()
