"""RNA prediction template portability, opt-in loading, and source-model fidelity."""
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
class RnaPredictionTests(unittest.TestCase):
    def run_cli(self,*args,cwd=ROOT):
        return subprocess.run([sys.executable,*map(str,args)],cwd=cwd,capture_output=True,text=True)

    def test_fresh_prediction_template_is_portable_and_offline(self):
        with tempfile.TemporaryDirectory(prefix='RNA prediction перенос ') as tmp:
            project=Path(tmp)/'Новый урок'
            r=self.run_cli(ROOT/'create.py',project,'--template','rna-prediction','--palette','ocean')
            self.assertEqual(r.returncode,0,r.stderr)
            for ref in ['js/rna-pair-molecule.js','js/recipes/rna-prediction/prediction-thermo-story.js',
                        'js/recipes/rna-prediction/prediction-alignment-story.js','js/recipes/rna-prediction/prediction-ensemble-story.js',
                        'assets/rna-prediction/thermo-example.json','guide/rna-prediction.md','guide/cinematic-explanation.md',
                        'guide/rna-pair-molecule.md','build/rna-prediction-data.py','qa/rna-prediction/science.cjs']:
                self.assertTrue((project/ref).is_file(),ref)
            html=(project/'index.html').read_text()
            self.assertIn('js/rna-pair-molecule.js',html)
            self.assertNotIn('js/recipes/rna-folding/',html)
            self.assertNotIn('js/prediction-thermo.js',html)
            result=self.run_cli(project/'build/bundle.py');self.assertEqual(result.returncode,0,result.stderr)
            artifact=(project/'dist/lesson.html').read_text()
            self.assertNotIn('<script src=',artifact)
            self.assertNotRegex(artifact,r'/(?:Users|home)/[^/]+/')
            for scene in ['story-thermo-score','story-thermo-search','story-thermo-shape','story-ensemble','story-alignment','story-alignment-shape']:
                self.assertIn(scene,artifact)
            check=subprocess.run(['node',str(project/'qa/rna-prediction/science.cjs')],cwd=project,capture_output=True,text=True)
            self.assertEqual(check.returncode,0,check.stderr+check.stdout)
            # Shared coordinate audits must ignore inactive template copies,
            # while still detecting altered data in the selected lesson.
            audit=project/'qa/rna-folding/science.py'
            inactive=project/'js/recipes/rna-folding/rna-intro.js'
            self.assertTrue(inactive.exists())
            inactive.write_text('const CONNECTED_DATA = {};')
            result=self.run_cli(audit,cwd=project)
            self.assertEqual(result.returncode,0,result.stderr+result.stdout)
            active=project/'js/recipes/rna-prediction/rna-intro.js'
            before_active=active.read_bytes()
            active.write_text('const CONNECTED_DATA = {};')
            result=self.run_cli(audit,cwd=project)
            self.assertNotEqual(result.returncode,0)
            self.assertIn('Embedded data mismatch: CONNECTED_DATA',result.stdout)
            active.write_bytes(before_active)
            # Embedding is deterministic and available without ViennaRNA.
            js=project/'js/recipes/rna-prediction/prediction-experiment.js';before=js.read_bytes()
            embed=self.run_cli(project/'build/rna-prediction-data.py','--embed-only')
            self.assertEqual(embed.returncode,0,embed.stderr)
            self.assertEqual(js.read_bytes(),before)
            nav=self.run_cli(project/'guide/navigation/route.py','--show','rna-prediction','--json')
            self.assertEqual(nav.returncode,0,nav.stderr)

    def test_prediction_assets_are_available_but_not_loaded_in_other_templates(self):
        with tempfile.TemporaryDirectory() as tmp:
            p=Path(tmp)/'gallery';r=self.run_cli(ROOT/'create.py',p)
            self.assertEqual(r.returncode,0,r.stderr)
            self.assertTrue((p/'js/rna-pair-molecule.js').exists())
            self.assertTrue((p/'guide/cinematic-explanation.md').exists())
            self.assertNotIn('rna-pair-molecule.js',(p/'index.html').read_text())

    def test_new_discovery_cards(self):
        for query,expected in [('rna-prediction','rna-prediction'),('термодинамика РНК выравнивание','rna-prediction'),('rna-pair-molecule','rna-pair-molecule'),('ритм ускорение анимации','cinematic-explanation')]:
            r=self.run_cli(ROOT/'docs/navigation/route.py',query,'--json')
            self.assertEqual(r.returncode,0,r.stderr)
            results=json.loads(r.stdout)['results'];self.assertTrue(results,query)
            self.assertEqual(results[0]['id'],expected,query)

if __name__=='__main__':unittest.main()
