"""ATAC templates must work from a portable fresh project, without the source film."""
import json
import re
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
class AtacTemplateTests(unittest.TestCase):
 def run_python(self,*args,cwd=None):
  return subprocess.run([sys.executable,*map(str,args)],cwd=cwd,capture_output=True,text=True)
 def test_atac_templates_build_outside_checkout(self):
  with tempfile.TemporaryDirectory(prefix='ATAC перенос ') as temp:
   for template in ('atac-seq','atac-components'):
    p=Path(temp)/template
    r=self.run_python(ROOT/'create.py',p,'--template',template,'--lang','en','--palette','ocean')
    self.assertEqual(r.returncode,0,r.stderr)
    for name in ['js/atac-config.js','js/atac-tn5-cartoon.js','guide/atac-seq.md','guide/atac-components.md','assets/atac/story-copy.json','assets/atac/structures/1KX5-assembly1.cif','assets/atac/structures/1MUH-assembly1.cif','qa/atac/science.cjs']:
     self.assertTrue((p/name).is_file(),name)
    for command in [p/'assets/atac/structures/extract.py',p/'build/atac-histone-core.py']:
     r=self.run_python(command,'--check',cwd=temp); self.assertEqual(r.returncode,0,r.stdout+r.stderr)
    r=self.run_python(p/'build/atac-film.py',cwd=temp);self.assertEqual(r.returncode,0,r.stdout+r.stderr)
    r=self.run_python(p/'build/atac-film.py','--check',cwd=temp);self.assertEqual(r.returncode,0,r.stdout+r.stderr)
    output=(p/'dist/lesson.html').read_text()
    self.assertNotIn('<script src=',output)
    self.assertNotRegex(output,r'/(?:Users|home)/[^/]+/')
    self.assertIn('visual-lesson-kit-notices',output)
    self.assertIn('1KX5',output);self.assertIn('1MUH',output)
    index=(p/'index.html').read_text()
    if template=='atac-components':
     self.assertNotIn('src="js/atac-journey.js"',index)
     self.assertNotIn('src="js/trna-cinema.js"',index)
    else:self.assertIn('src="js/atac-config.js"',index)
 def test_discovery(self):
  for query,expected in [('ATAC-seq фильм','atac-seq'),('atac-components','atac-components')]:
   r=self.run_python(ROOT/'docs/navigation/route.py',query,'--json')
   self.assertEqual(r.returncode,0,r.stderr)
   self.assertEqual(json.loads(r.stdout)['results'][0]['id'],expected)
 def test_gallery_does_not_load_atac(self):
  with tempfile.TemporaryDirectory() as temp:
   p=Path(temp)/'gallery';r=self.run_python(ROOT/'create.py',p)
   self.assertEqual(r.returncode,0,r.stderr)
   self.assertTrue((p/'js/atac-fragment-origin.js').is_file())
   self.assertNotIn('atac-',(p/'index.html').read_text())
if __name__=='__main__':unittest.main()
