"""Library invariants: one template registry, checksum manifests, lean projects and shared RNA recipes."""
import json
import re
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
import create as kit  # noqa: E402


def run_cli(*args, cwd=None):
    return subprocess.run([sys.executable, *map(str, args)], cwd=cwd, capture_output=True, text=True)


def build_bodies(text):
    """Balanced bodies of every build(ctx,v){...} in a recipe, with string literals blanked."""
    bodies = []
    for match in re.finditer(r'build\(ctx,v\)\{', text):
        depth, start = 0, match.end() - 1
        for index in range(start, len(text)):
            depth += text[index] == '{'
            depth -= text[index] == '}'
            if depth == 0:
                bodies.append(text[start:index + 1])
                break
    literal = re.compile(r"'(?:\\.|[^'\\\n])*'|\"(?:\\.|[^\"\\\n])*\"|`(?:\\.|[^`\\])*`", re.S)
    return [re.sub(r'\s+', ' ', literal.sub('""', body)).strip() for body in bodies]


class RegistryTests(unittest.TestCase):
    def test_starter_manifest_names_the_current_version(self):
        manifest = json.loads((ROOT / 'starter/lesson-kit.json').read_text())
        self.assertEqual(manifest, {'kit': 'visual-lesson-kit', 'version': kit.VERSION})
        self.assertEqual(json.loads((ROOT / 'package.json').read_text())['version'], kit.VERSION)

    def test_every_template_has_a_page_and_public_documentation(self):
        readme = (ROOT / 'README.md').read_text()
        usage = run_cli(ROOT / 'create.py', '--help').stdout
        for template in kit.TEMPLATES:
            self.assertTrue((ROOT / 'starter' / kit.template_page(template)).is_file(), template)
            self.assertIn('`' + template + '`', readme, template + ' is missing from the README template table')
            self.assertIn(template, usage)
        pages = {page.name for page in (ROOT / 'starter').glob('*.html')}
        self.assertEqual(pages, {kit.template_page(template) for template in kit.TEMPLATES}, 'every starter page is a registered template')

    def test_generated_manifest_records_pristine_checksums(self):
        with tempfile.TemporaryDirectory() as tmp:
            dest = Path(tmp) / 'lesson'
            self.assertEqual(run_cli(ROOT / 'create.py', dest, '--template', 'methods').returncode, 0)
            manifest = json.loads((dest / 'lesson-kit.json').read_text())
            self.assertEqual((manifest['kit'], manifest['version'], manifest['template'], manifest['profile']),
                             ('visual-lesson-kit', kit.VERSION, 'methods', 'full'))
            for authored in ('index.html', 'js/config.js', 'lesson-kit.json'):
                self.assertNotIn(authored, manifest['files'])
            self.assertGreater(len(manifest['files']), 300)
            for rel, digest in manifest['files'].items():
                self.assertEqual(kit.sha256(dest / rel), digest, rel)
            self.assertIn('guide/START.md', manifest['files'])
            self.assertIn('js/deck.js', manifest['files'])


class LeanProfileTests(unittest.TestCase):
    def test_lean_trna_project_carries_only_its_runtime_data_builders_and_checks(self):
        with tempfile.TemporaryDirectory() as tmp:
            dest = Path(tmp) / 'lean'
            result = run_cli(ROOT / 'create.py', dest, '--template', 'trna-journey', '--lean', '--palette', 'ocean')
            self.assertEqual(result.returncode, 0, result.stderr)
            html = (dest / 'index.html').read_text()
            for ref in re.findall(r'(?:src|href)="([^":#]+)"', html):
                self.assertTrue((dest / ref).is_file(), ref + ' is referenced by the page but missing')
            for rel in ('js/trna-journey.js', 'js/trna-spacefill-data.js', 'assets/trna/spacefill-1ehz.json',
                        'assets/rna-folding/tertiary-1ehz.cif', 'build/trna-data.py', 'build/rna-structures.py',
                        'qa/trna/science.py', 'css/shell.css', 'js/lib/dom.js', 'assets/fonts/SourceSans3-Regular.otf.woff2',
                        'licenses/font-manifest.json', 'guide/START.md', 'guide/navigation/route.py', 'AGENTS.md', 'serve.py'):
                self.assertTrue((dest / rel).is_file(), rel)
            for rel in ('js/atac-journey.js', 'js/atac-structures.js', 'js/molecular-views-data.js', 'js/recipes/chemistry-bridge.js',
                        'assets/atac', 'assets/molecular-views', 'qa/atac', 'build/atac-film.py',
                        'atac-seq.html', 'spatial-biology.html', 'trna-journey.html', 'js/recipes/representation-journey.js'):
                self.assertFalse((dest / rel).exists(), rel + ' does not belong to a lean tRNA project')
            manifest = json.loads((dest / 'lesson-kit.json').read_text())
            self.assertEqual((manifest['template'], manifest['profile']), ('trna-journey', 'lean'))
            self.assertEqual(run_cli(dest / 'build/bundle.py').returncode, 0)
            self.assertEqual(run_cli(dest / 'build/trna-data.py', '--check', cwd=dest).returncode, 0)
            lean_size = sum(p.stat().st_size for p in dest.rglob('*') if p.is_file() and 'dist' not in p.parts)
            full = Path(tmp) / 'full'
            self.assertEqual(run_cli(ROOT / 'create.py', full, '--template', 'trna-journey').returncode, 0)
            full_size = sum(p.stat().st_size for p in full.rglob('*') if p.is_file())
            self.assertLess(lean_size, full_size * 0.6, 'lean projects drop most of the unrelated template payload')

    def test_lean_atac_project_regenerates_its_own_data(self):
        with tempfile.TemporaryDirectory() as tmp:
            dest = Path(tmp) / 'atac'
            self.assertEqual(run_cli(ROOT / 'create.py', dest, '--template', 'atac-seq', '--lean').returncode, 0)
            self.assertTrue((dest / 'assets/atac/structures/extract.py').is_file())
            self.assertFalse((dest / 'js/trna-journey.js').exists())
            self.assertTrue((dest / 'js/trna-cinema.js').is_file(), 'the shared film clock is referenced by the ATAC page')
            for args in ((dest / 'build/atac-film.py',), (dest / 'build/atac-film.py', '--check')):
                result = run_cli(*args, cwd=tmp)
                self.assertEqual(result.returncode, 0, result.stdout + result.stderr)


class SharedRnaRecipeTests(unittest.TestCase):
    SHARED = ('rna-common.js', 'rna-models.js', 'rna-tertiary.js', 'rna-evidence.js')
    FORKED = ('rna-dynamics', 'rna-geometry', 'rna-intro', 'rna-ions', 'rna-topology', 'rna-trna')

    def test_both_rna_templates_load_one_shared_registry(self):
        for page in ('rna-folding.html', 'rna-prediction.html'):
            scripts = re.findall(r'<script src="([^"]+)"', (ROOT / 'starter' / page).read_text())
            for name in self.SHARED:
                self.assertIn('js/recipes/rna-shared/' + name, scripts, page)
            self.assertLess(scripts.index('js/recipes/rna-shared/rna-common.js'), min(scripts.index(s) for s in scripts if s.startswith('js/recipes/rna-') and 'rna-common' not in s))
        for folder in ('rna-folding', 'rna-prediction'):
            for name in self.SHARED:
                self.assertFalse((ROOT / 'starter/js/recipes' / folder / name).exists(), folder + '/' + name + ' duplicates the shared copy')
            self.assertIn('RNA.finish({', (ROOT / 'starter/js/recipes' / folder / 'rna-order.js').read_text())

    def test_forked_episode_files_differ_only_in_authored_text(self):
        for name in self.FORKED:
            a = build_bodies((ROOT / 'starter/js/recipes/rna-folding' / (name + '.js')).read_text())
            b = build_bodies((ROOT / 'starter/js/recipes/rna-prediction' / (name + '.js')).read_text())
            self.assertTrue(a, name + ' has build functions')
            self.assertEqual(a, b, name + ': the prediction copy may change titles, captions, notes and questions, not drawing code')


if __name__ == '__main__':
    unittest.main()
