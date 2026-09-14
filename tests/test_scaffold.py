"""Observable scaffold/export behaviour, without browser or package dependencies."""
import json
import re
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class ScaffoldTests(unittest.TestCase):
    def run_cli(self, dest, *args):
        return subprocess.run([sys.executable, str(ROOT / 'create.py'), str(dest), *args],
                              capture_output=True, text=True)

    def test_creates_portable_project_with_escaped_metadata(self):
        with tempfile.TemporaryDirectory(prefix='lesson kit ') as tmp:
            dest = Path(tmp) / 'Новая лекция'
            title = 'Данные & модели </script><script>window.bad=1</script>'
            result = self.run_cli(dest, '--title', title, '--source-url', 'https://example.org/paper')
            self.assertEqual(result.returncode, 0, result.stderr)
            config_text = (dest / 'js/config.js').read_text()
            config = json.loads(config_text.split('=', 1)[1].strip().removesuffix(';'))
            self.assertEqual(config['title'], title)
            self.assertEqual(config['source']['url'], 'https://example.org/paper')
            self.assertNotIn('</script>', config_text)
            self.assertNotIn(str(ROOT), (dest / 'index.html').read_text())
            self.assertEqual(json.loads((dest / 'lesson-kit.json').read_text())['version'], (ROOT / 'VERSION').read_text().strip())
            built = subprocess.run([sys.executable, str(dest / 'build/bundle.py')], capture_output=True, text=True)
            self.assertEqual(built.returncode, 0, built.stderr)
            html = (dest / 'dist/lesson.html').read_text()
            self.assertIn('window.LESSON_ASSETS=', html)
            self.assertNotIn('<script src=', html)
            self.assertNotIn('href="css/', html)
            self.assertNotIn('s41556-025-01626-9', html)
            self.assertIn('data:image/svg+xml;base64,', html)

    def test_new_lessons_include_reference_pattern_guides(self):
        with tempfile.TemporaryDirectory() as tmp:
            dest = Path(tmp) / 'lesson'
            result = self.run_cli(dest)
            self.assertEqual(result.returncode, 0, result.stderr)
            for name in ('reference-patterns.md', 'inquiry.md', 'matrices-partitions.md', 'questions.md',
                         'predictions.md', 'resampling.md', 'threshold.md', 'interaction.md',
                         'languages.md', 'mobile-gestures.md', 'perspective.md', 'shell.md', 'upgrading.md',
                         'label-clearance.md'):
                self.assertTrue((dest / 'guide' / name).is_file(), name + ' is available to the next author')
                self.assertEqual((dest / 'guide' / name).read_bytes(), (ROOT / 'docs' / name).read_bytes())

    def test_methods_template_exports_new_repertoire_without_old_gallery(self):
        with tempfile.TemporaryDirectory() as tmp:
            dest = Path(tmp) / 'methods'
            result = self.run_cli(dest, '--template', 'methods', '--title', 'Methods')
            self.assertEqual(result.returncode, 0, result.stderr)
            html = (dest / 'index.html').read_text()
            for module in ('statistics', 'biology', 'geometry'):
                self.assertIn('src="js/' + module + '.js"', html)
                self.assertIn('src="js/recipes/methods-' + module + '.js"', html)
                self.assertEqual((dest / 'guide' / (module + '.md')).read_bytes(),
                                 (ROOT / 'docs' / (module + '.md')).read_bytes())
            self.assertNotIn('src="js/episodes/', html)
            self.assertTrue((dest / 'guide/scientific-repertoire.md').is_file())
            result = subprocess.run([sys.executable, str(dest / 'build/bundle.py')], capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertNotIn('<script src=', (dest / 'dist/lesson.html').read_text())

    def test_explanations_template_is_portable_and_keeps_helpers_in_gallery(self):
        with tempfile.TemporaryDirectory() as tmp:
            dest = Path(tmp) / 'bridges'
            result = self.run_cli(dest, '--template', 'explanations')
            self.assertEqual(result.returncode, 0, result.stderr)
            html = (dest / 'index.html').read_text()
            self.assertIn('js/recipes/explanation-bridges.js', html)
            self.assertNotIn('src="js/episodes/', html)
            for name in ('explanation', 'distributions'):
                self.assertIn('js/' + name + '.js', html)
            for name in ('explanation-geometry.md', 'distributions.md', 'explanation-design.md'):
                self.assertEqual((dest / 'guide' / name).read_bytes(), (ROOT / 'docs' / name).read_bytes())
            self.assertFalse(any(p.is_file() for p in (dest / 'assets').iterdir()))
            self.assertTrue((dest / 'assets/fonts').is_dir())
            gallery = Path(tmp) / 'gallery'
            self.assertEqual(self.run_cli(gallery).returncode, 0)
            self.assertNotIn('js/recipes/explanation-bridges.js', (gallery / 'index.html').read_text())
            self.assertTrue((gallery / 'js/recipes/explanation-bridges.js').is_file())

    def test_synthesis_template_is_self_contained_and_optional(self):
        with tempfile.TemporaryDirectory() as tmp:
            dest = Path(tmp) / 'synthesis'
            result = self.run_cli(dest, '--template', 'synthesis', '--lang', 'en')
            self.assertEqual(result.returncode, 0, result.stderr)
            html = (dest / 'index.html').read_text()
            self.assertIn('js/interaction-regions.js', html)
            self.assertIn('js/recipes/pipeline-synthesis.js', html)
            self.assertNotIn('src="js/episodes/', html)
            for name in ('interaction-regions.md', 'hit-region-audit.md', 'pipeline-synthesis.md'):
                self.assertEqual((dest / 'guide' / name).read_bytes(), (ROOT / 'docs' / name).read_bytes())
            built = subprocess.run([sys.executable, str(dest / 'build/bundle.py')], capture_output=True, text=True)
            self.assertEqual(built.returncode, 0, built.stderr)
            self.assertNotIn('<script src=', (dest / 'dist/lesson.html').read_text())
            gallery = Path(tmp) / 'gallery'
            self.assertEqual(self.run_cli(gallery).returncode, 0)
            self.assertNotIn('js/recipes/pipeline-synthesis.js', (gallery / 'index.html').read_text())
            self.assertTrue((gallery / 'js/recipes/pipeline-synthesis.js').is_file())

    def test_molecular_template_and_modules_are_portable_without_autorunning_recipe(self):
        with tempfile.TemporaryDirectory(prefix='lesson-molecular-') as tmp:
            for template in ('gallery', 'methods', 'explanations', 'synthesis', 'molecular', 'molecular-check'):
                dest = Path(tmp) / template
                result = self.run_cli(dest, '--template', template)
                self.assertEqual(result.returncode, 0, result.stderr)
                html = (dest / 'index.html').read_text()
                for name in ('molecular.js', 'molecular-expression.js', 'molecular-regulation.js', 'molecular-rna-processing.js', 'molecular-inspect.js'):
                    self.assertEqual((dest / 'js' / name).read_bytes(), (ROOT / 'starter/js' / name).read_bytes())
                    self.assertIn('src="js/' + name + '"', html)
                self.assertLess(html.index('js/biology.js'), html.index('js/molecular.js'))
                self.assertLess(html.index('js/molecular.js'), html.index('js/molecular-expression.js'))
                for guide in ('molecular.md', 'molecular-expression-references.md', 'molecular-regulation.md', 'molecular-rna-processing.md', 'molecular-inspection.md', 'molecular-check.md'):
                    self.assertEqual((dest / 'guide' / guide).read_bytes(), (ROOT / 'docs' / guide).read_bytes())
                for recipe in ('molecular-atlas.js', 'molecular-regulation-atlas.js', 'molecular-rna-atlas.js'):
                    self.assertTrue((dest / 'js/recipes' / recipe).is_file())
                    self.assertEqual('src="js/recipes/' + recipe + '"' in html, template == 'molecular')
                self.assertTrue((dest / 'js/molecular-gallery.js').is_file())
                self.assertEqual('src="js/molecular-gallery.js"' in html, template in ('molecular', 'molecular-check'))
                self.assertTrue((dest / 'js/recipes/molecular-check.js').is_file())
                self.assertTrue((dest / 'js/molecular-check-qa.js').is_file())
                self.assertEqual('src="js/recipes/molecular-check.js"' in html, template == 'molecular-check')
                self.assertEqual('src="js/molecular-check-qa.js"' in html, template == 'molecular-check')
                if template in ('molecular', 'molecular-check'):
                    self.assertNotIn('src="js/episodes/', html)
                    self.assertFalse(any(p.is_file() for p in (dest / 'assets').iterdir()))
                    built = subprocess.run([sys.executable, str(dest / 'build/bundle.py')], capture_output=True, text=True)
                    self.assertEqual(built.returncode, 0, built.stderr)
                    bundle = (dest / 'dist/lesson.html').read_text()
                    self.assertNotIn('<script src=', bundle)
                    self.assertNotIn(str(ROOT), bundle)

    def test_molecular_check_template_has_an_isolated_recipe_and_ordered_qa_helper(self):
        with tempfile.TemporaryDirectory(prefix='lesson-molecular-check-') as tmp:
            dest = Path(tmp) / 'lesson'
            result = self.run_cli(dest, '--template', 'molecular-check', '--lang', 'en')
            self.assertEqual(result.returncode, 0, result.stderr)
            html = (dest / 'index.html').read_text()
            scripts = re.findall(r'<script src="([^"]+)"', html)
            for module in ('molecular', 'molecular-expression', 'molecular-regulation',
                           'molecular-rna-processing', 'molecular-inspect'):
                self.assertLess(scripts.index('js/' + module + '.js'), scripts.index('js/molecular-gallery.js'))
            sequence = ['js/molecular-gallery.js', 'js/recipes/molecular-check.js',
                        'js/molecular-check-qa.js', 'js/player.js', 'js/boot.js']
            for before, after in zip(sequence, sequence[1:]):
                self.assertLess(scripts.index(before), scripts.index(after))
            self.assertEqual(len(scripts), len(set(scripts)))
            self.assertFalse(any('atlas.js' in src or '/episodes/' in src for src in scripts))
            self.assertIn('visual', html)
            self.assertIn('biophysics', html)
            self.assertIn('<html lang="en"', html)

    def test_molecular_expansion_loads_inspector_and_registry_in_dependency_order(self):
        with tempfile.TemporaryDirectory(prefix='lesson-molecular-registry-') as tmp:
            dest = Path(tmp) / 'lesson'
            result = self.run_cli(dest, '--template', 'molecular')
            self.assertEqual(result.returncode, 0, result.stderr)
            html = (dest / 'index.html').read_text()
            scripts = re.findall(r'<script src="([^"]+)"', html)
            for module in ('molecular-regulation', 'molecular-rna-processing', 'molecular-inspect'):
                self.assertLess(scripts.index('js/molecular.js'), scripts.index('js/' + module + '.js'))
                self.assertLess(scripts.index('js/' + module + '.js'), scripts.index('js/molecular-gallery.js'))
            self.assertLess(scripts.index('js/interaction-regions.js'), scripts.index('js/molecular-inspect.js'))
            for recipe in ('molecular-atlas', 'molecular-regulation-atlas', 'molecular-rna-atlas'):
                self.assertLess(scripts.index('js/molecular-gallery.js'), scripts.index('js/recipes/' + recipe + '.js'))
                self.assertLess(scripts.index('js/recipes/' + recipe + '.js'), scripts.index('js/boot.js'))
            self.assertEqual(len(scripts), len(set(scripts)), 'No duplicate shared registry or runtime load')

    def test_chemistry_bridge_template_exports_an_independent_reusable_lesson(self):
        with tempfile.TemporaryDirectory(prefix='lesson-chemistry-bridge-') as tmp:
            dest = Path(tmp) / 'lesson'
            result = self.run_cli(dest, '--template', 'chemistry-bridge', '--lang', 'en')
            self.assertEqual(result.returncode, 0, result.stderr)
            html = (dest / 'index.html').read_text()
            scripts = re.findall(r'<script src="([^"]+)"', html)
            for dependency in ('film', 'layout', 'molecular', 'molecular-inspect', 'geometry'):
                self.assertLess(scripts.index('js/' + dependency + '.js'), scripts.index('js/chemistry.js'))
            sequence = ['js/chemistry.js', 'js/physical-chemistry.js',
                        'js/recipes/chemistry-foundations-bonds.js',
                        'js/recipes/chemistry-foundations-environment.js',
                        'js/recipes/chemistry-foundations-transfer.js',
                        'js/recipes/chemistry-context-binding.js',
                        'js/recipes/chemistry-context-reactions.js',
                        'js/recipes/chemistry-context-transport.js',
                        'js/recipes/chemistry-context-energy.js',
                        'js/recipes/chemistry-bridge.js', 'js/recipes/chemistry-physics-scenes.js',
                        'js/chemistry-bridge-qa.js',
                        'js/player.js', 'js/boot.js']
            for before, after in zip(sequence, sequence[1:]):
                self.assertLess(scripts.index(before), scripts.index(after))
            self.assertEqual(len(scripts), len(set(scripts)))
            self.assertFalse(any('molecular-check' in src or '/episodes/' in src or 'atlas.js' in src for src in scripts))
            self.assertNotIn('CHEMISTRY_BRIDGE.register(', html, 'The recipe registers itself exactly once')
            self.assertIn('<html lang="en"', html)
            self.assertIn('?qa=1', html)
            for guide in ('chemistry.md', 'physical-chemistry.md', 'chemistry-bridge.md'):
                self.assertEqual((dest / 'guide' / guide).read_bytes(), (ROOT / 'docs' / guide).read_bytes())
            built = subprocess.run([sys.executable, str(dest / 'build/bundle.py')], capture_output=True, text=True)
            self.assertEqual(built.returncode, 0, built.stderr)
            bundle = (dest / 'dist/lesson.html').read_text()
            self.assertNotIn('<script src=', bundle)
            self.assertNotIn(str(ROOT), bundle)
            gallery = Path(tmp) / 'gallery'
            self.assertEqual(self.run_cli(gallery).returncode, 0)
            gallery_html = (gallery / 'index.html').read_text()
            for name in ('chemistry.js', 'physical-chemistry.js', 'chemistry-bridge-qa.js',
                         'recipes/chemistry-foundations-bonds.js',
                         'recipes/chemistry-foundations-environment.js',
                         'recipes/chemistry-foundations-transfer.js',
                         'recipes/chemistry-context-binding.js',
                         'recipes/chemistry-context-reactions.js',
                         'recipes/chemistry-context-transport.js',
                         'recipes/chemistry-context-energy.js',
                         'recipes/chemistry-bridge.js', 'recipes/chemistry-physics-scenes.js'):
                self.assertEqual((gallery / 'js' / name).read_bytes(),
                                 (ROOT / 'starter/js' / name).read_bytes())
                self.assertNotIn('src="js/' + name + '"', gallery_html)

    def test_english_default_contains_both_language_packs(self):
        with tempfile.TemporaryDirectory() as tmp:
            dest = Path(tmp) / 'English lesson'
            result = self.run_cli(dest, '--lang', 'en')
            self.assertEqual(result.returncode, 0, result.stderr)
            config = json.loads((dest / 'js/config.js').read_text().split('=', 1)[1].strip().removesuffix(';'))
            self.assertEqual(config['lang'], 'en')
            self.assertEqual(config['title'], 'New visual lesson')
            self.assertIn('<html lang="en"', (dest / 'index.html').read_text())
            for name in ('en.js', 'en-notes.js', 'en-perspective.js'):
                self.assertTrue((dest / 'js/i18n' / name).is_file())
            self.assertNotIn('user-scalable=no', (dest / 'index.html').read_text())

    def test_measured_layout_and_motion_recipe_are_portable(self):
        with tempfile.TemporaryDirectory(prefix='lesson-layout-motion-') as tmp:
            dest = Path(tmp) / 'lesson'
            result = self.run_cli(dest)
            self.assertEqual(result.returncode, 0, result.stderr)
            html = (dest / 'index.html').read_text()
            for name in ('layout.js', 'motion.js'):
                self.assertIn('src="js/' + name + '"', html)
                self.assertEqual((dest / 'js' / name).read_bytes(), (ROOT / 'starter/js' / name).read_bytes())
            self.assertLess(html.index('js/film.js'), html.index('js/layout.js'))
            self.assertLess(html.index('js/motion.js'), html.index('js/episodes/01-objects.js'))
            for name in ('layout.md', 'motion.md', 'storyboard.md'):
                self.assertEqual((dest / 'guide' / name).read_bytes(), (ROOT / 'docs' / name).read_bytes())
            recipe = dest / 'js/recipes/representation-journey.js'
            self.assertTrue(recipe.is_file(), 'The worked transformation source travels with the lesson')
            self.assertNotIn('js/recipes/representation-journey.js', html, 'The recipe does not run alongside authored scenes')

    def test_generated_project_has_compact_shell_and_ordered_motion_api(self):
        with tempfile.TemporaryDirectory(prefix='lesson-shell-070-') as tmp:
            dest = Path(tmp) / 'lesson'
            result = self.run_cli(dest, '--lang', 'en')
            self.assertEqual(result.returncode, 0, result.stderr)
            html = (dest / 'index.html').read_text()
            styles = re.findall(r'<link[^>]+href="([^"]+)"', html)
            self.assertEqual(styles[-1], 'css/shell.css')
            self.assertEqual((dest / 'css/shell.css').read_bytes(), (ROOT / 'starter/css/shell.css').read_bytes())
            chrome = re.search(r'<nav class="chrome".*?</nav>', html, re.S).group(0)
            self.assertEqual(re.findall(r'data-action="([^"]+)"', chrome), ['prev', 'overview', 'next', 'reading', 'more'])
            for selector in ('id="moreMenu"', 'id="languageValue"', 'id="readingLanguageToggle"', 'id="readingLanguageValue"', 'id="speedValue"', 'data-action="close-reading"', 'data-action="close-overview"'):
                self.assertIn(selector, html)
            self.assertEqual(html.count('role="tab"'), 3)
            film = (dest / 'js/film.js').read_text()
            for name in ('phase', 'revealStroke', 'growArrow'):
                self.assertIn('function ' + name + '(', film)
            self.assertIn('g.F={phase,revealStroke,growArrow,', film)
            self.assertEqual((dest / 'js/film.js').read_bytes(), (ROOT / 'starter/js/film.js').read_bytes())
            self.assertEqual(json.loads((dest / 'lesson-kit.json').read_text())['version'], (ROOT / 'VERSION').read_text().strip())
            self.assertIn('F.phase', (dest / 'guide/interaction.md').read_text())
            self.assertIn('dominant-baseline="middle"', (dest / 'guide/authoring.md').read_text())
            self.assertNotIn('user-scalable=no', html)

    def test_refuses_to_overwrite_user_content(self):
        with tempfile.TemporaryDirectory() as tmp:
            dest = Path(tmp) / 'existing'; dest.mkdir()
            (dest / 'keep.txt').write_text('original')
            result = self.run_cli(dest, '--title', 'Lecture')
            self.assertNotEqual(result.returncode, 0)
            self.assertEqual((dest / 'keep.txt').read_text(), 'original')
            self.assertEqual(sorted(p.name for p in dest.iterdir()), ['keep.txt'])

    def test_configured_appearance_is_portable_and_preserves_shell(self):
        with tempfile.TemporaryDirectory() as tmp:
            dest = Path(tmp) / 'white serif lesson'
            result = self.run_cli(dest, '--background', 'white', '--palette', 'ocean', '--font', 'serif')
            self.assertEqual(result.returncode, 0, result.stderr)
            config = json.loads((dest / 'js/config.js').read_text().split('=', 1)[1].strip().removesuffix(';'))
            self.assertEqual(config['appearance'], {'background': 'white', 'palette': 'ocean', 'font': 'serif'})
            html = (dest / 'index.html').read_text()
            chrome = re.search(r'<nav class="chrome".*?</nav>', html, re.S).group(0)
            self.assertEqual(re.findall(r'data-action="([^"]+)"', chrome), ['prev', 'overview', 'next', 'reading', 'more'])
            self.assertEqual((dest / 'guide/theme.md').read_bytes(), (ROOT / 'docs/theme.md').read_bytes())
            built = subprocess.run([sys.executable, str(dest / 'build/bundle.py')], capture_output=True, text=True)
            self.assertEqual(built.returncode, 0, built.stderr)
            bundle = (dest / 'dist/lesson.html').read_text()
            self.assertIn('"background": "white"', bundle)
            self.assertIn('"font": "serif"', bundle)
            self.assertNotIn('<script src=', bundle)

    def test_appearance_defaults_and_invalid_choices(self):
        with tempfile.TemporaryDirectory() as tmp:
            dest = Path(tmp) / 'default'
            result = self.run_cli(dest)
            self.assertEqual(result.returncode, 0, result.stderr)
            config = json.loads((dest / 'js/config.js').read_text().split('=', 1)[1].strip().removesuffix(';'))
            self.assertEqual(config['appearance'], {'background': 'black', 'palette': 'warm', 'font': 'sans'})
            for field, value in [('background', 'grey'), ('palette', 'unknown'), ('font', 'https://remote/font')]:
                invalid = Path(tmp) / field
                result = self.run_cli(invalid, '--' + field, value)
                self.assertNotEqual(result.returncode, 0)
                self.assertFalse(invalid.exists())

    def test_rejects_executable_source_url_without_creating_output(self):
        with tempfile.TemporaryDirectory() as tmp:
            dest = Path(tmp) / 'new'
            result = self.run_cli(dest, '--source-url', 'javascript:alert(1)')
            self.assertNotEqual(result.returncode, 0)
            self.assertFalse(dest.exists())

    def test_missing_image_and_external_dependency_fail_explicitly(self):
        with tempfile.TemporaryDirectory() as tmp:
            dest = Path(tmp) / 'lesson'
            result = self.run_cli(dest)
            self.assertEqual(result.returncode, 0, result.stderr)
            index = dest / 'index.html'
            original = index.read_text()
            index.write_text(original.replace('</head>', '<script src="https://example.org/remote.js"></script></head>'))
            built = subprocess.run([sys.executable, str(dest / 'build/bundle.py')], capture_output=True, text=True)
            self.assertNotEqual(built.returncode, 0)
            index.write_text(original.replace('</body>', '<img src="assets/missing.png"></body>'))
            built = subprocess.run([sys.executable, str(dest / 'build/bundle.py')], capture_output=True, text=True)
            self.assertNotEqual(built.returncode, 0)


if __name__ == '__main__':
    unittest.main()
