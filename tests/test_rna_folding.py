"""Fresh RNA template discovery, source portability and deterministic export."""
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

class RnaTemplateTests(unittest.TestCase):
    def test_portable_fixture_builder_detects_staleness_and_embeds_literal_text_safely(self):
        with tempfile.TemporaryDirectory() as tmp:
            project = Path(tmp)/'rna'
            p = subprocess.run([sys.executable, str(ROOT/'create.py'), str(project), '--template', 'rna-folding'], capture_output=True, text=True)
            self.assertEqual(p.returncode, 0, p.stderr)
            fixture = project/'assets/rna-folding/tertiary-v4-1hr2.json'
            data = json.loads(fixture.read_text())
            data['notes'] = 'Literal source note: </script><script>window.unwanted=1</script>'
            fixture.write_text(json.dumps(data))
            registry = project/'js/rna-structures.js'
            before = registry.read_bytes()
            builder = project/'build/rna-structures.py'
            stale = subprocess.run([sys.executable, str(builder), '--check'], capture_output=True, text=True)
            self.assertNotEqual(stale.returncode, 0)
            self.assertEqual(registry.read_bytes(), before, 'check must not rewrite source')
            built = subprocess.run([sys.executable, str(builder)], capture_output=True, text=True)
            self.assertEqual(built.returncode, 0, built.stderr)
            payload = registry.read_text().split('window.RNA_STRUCTURES = ', 1)[1].strip().removesuffix(';')
            self.assertNotIn('</script>', payload)
            self.assertEqual(json.loads(payload)['tetraloopReceptor']['notes'], data['notes'])
            check = subprocess.run([sys.executable, str(builder), '--check'], capture_output=True, text=True)
            self.assertEqual(check.returncode, 0, check.stderr)

    def test_rna_discovery_distinguishes_coordinates_from_folding_simulation(self):
        for query, expected in [('укладка РНК', 'rna-folding'), ('A-minor hydrated magnesium', 'rna-folding'),
                                ('atomic coordinates context zoom', 'molecular-coordinates')]:
            p = subprocess.run([sys.executable, str(ROOT/'docs/navigation/route.py'), query, '--json'], capture_output=True, text=True)
            self.assertEqual(p.returncode, 0, p.stderr)
            self.assertEqual(json.loads(p.stdout)['results'][0]['id'], expected)

    def test_fresh_project_has_editable_sources_data_qa_and_standalone_export(self):
        with tempfile.TemporaryDirectory(prefix='RNA portable ') as tmp:
            p = Path(tmp)/'Урок РНК'
            result = subprocess.run([sys.executable, str(ROOT/'create.py'), str(p), '--template', 'rna-folding', '--lang', 'en'],capture_output=True,text=True)
            self.assertEqual(result.returncode,0,result.stderr)
            html=(p/'index.html').read_text()
            self.assertIn('js/molecular-coordinates.js',html)
            self.assertIn('js/recipes/rna-folding/rna-order.js',html)
            self.assertNotIn('js/episodes/',html)
            for f in ['guide/rna-folding.md','guide/molecular-coordinates.md','qa/rna-folding/science.py','assets/rna-folding/tertiary-1ehz.cif','assets/rna-folding/motif-1hr2.pdb']:
                self.assertTrue((p/f).is_file(),f)
            for args in [[], ['--check']]:
                built=subprocess.run([sys.executable,str(p/'build/bundle.py'),*args],capture_output=True,text=True)
                self.assertEqual(built.returncode,0,built.stderr+built.stdout)
            artifact=(p/'dist/lesson.html').read_text()
            self.assertNotIn('<script src=',artifact)
            self.assertNotRegex(artifact, r'/(?:Users|home)/[^/]+/')
            self.assertIn('rna-trna-real',artifact)
            self.assertIn('rna-anchors',artifact)
            audit=subprocess.run([sys.executable,str(p/'qa/rna-folding/science.py')],cwd=p,capture_output=True,text=True)
            self.assertEqual(audit.returncode,0,audit.stderr+audit.stdout)

if __name__=='__main__': unittest.main()
