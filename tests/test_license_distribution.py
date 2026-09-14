"""License and attribution transport through a fresh project and one-file export."""
import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NOTICE_ID = 'visual-lesson-kit-notices'


class HTMLContents(HTMLParser):
    def __init__(self, content):
        super().__init__(convert_charrefs=False)
        self.tags = []
        self.scripts = []
        self.active = None
        self.feed(content)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.tags.append((tag, attrs))
        if tag == 'script':
            self.active = {'attrs': attrs, 'text': ''}
            self.scripts.append(self.active)

    def handle_data(self, data):
        if self.active is not None:
            self.active['text'] += data

    def handle_endtag(self, tag):
        if tag == 'script':
            self.active = None


class LicenseDistributionTests(unittest.TestCase):
    def make_kit(self, root, license_text=None):
        kit = root / 'source kit'
        (kit / 'starter/build').mkdir(parents=True)
        (kit / 'starter/js').mkdir()
        (kit / 'starter/css').mkdir()
        (kit / 'licenses/nested').mkdir(parents=True)
        shutil.copy2(ROOT / 'create.py', kit / 'create.py')
        shutil.copy2(ROOT / 'starter/build/bundle.py', kit / 'starter/build/bundle.py')
        (kit / 'VERSION').write_text('0.0.0-test\n', encoding='utf-8')
        (kit / 'starter/index.html').write_text(
            '<!doctype html><html lang="en"><head><title>Example</title>'
            '<link rel="stylesheet" href="css/main.css"></head><body>'
            '<main>Lesson</main><script src="js/main.js"></script></body></html>', encoding='utf-8')
        (kit / 'starter/css/main.css').write_text('body { color: white; }', encoding='utf-8')
        (kit / 'starter/js/main.js').write_text('window.lessonLoaded = true;', encoding='utf-8')
        files = {
            'THIRD_PARTY_NOTICES.md': '# Third-party sources\nPreserve attribution.\n',
            'licenses/zeta.txt': 'Font notice\n',
            'licenses/nested/alpha.md': 'Nested notice\n',
        }
        if license_text is not None:
            files['LICENSE'] = license_text
        for name, text in files.items():
            (kit / name).write_bytes(text.encode('utf-8'))
        (kit / 'licenses/font-manifest.json').write_text('{"fonts": []}\n', encoding='utf-8')
        return kit, files

    def create_project(self, kit, dest):
        result = subprocess.run([sys.executable, str(kit / 'create.py'), str(dest)],
                                capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)

    def build_project(self, project):
        result = subprocess.run([sys.executable, str(project / 'build/bundle.py')],
                                capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        return (project / 'dist/lesson.html').read_text(encoding='utf-8')

    def notices(self, content):
        document = HTMLContents(content)
        scripts = [s for s in document.scripts if s['attrs'].get('id') == NOTICE_ID]
        self.assertEqual(len(scripts), 1, 'One inert attribution block must survive one-file export')
        self.assertEqual(scripts[0]['attrs'].get('type'), 'application/json')
        return json.loads(scripts[0]['text']), document

    def test_generator_copies_exact_license_and_third_party_notices(self):
        with tempfile.TemporaryDirectory(prefix='license transport ') as tmp:
            root = Path(tmp)
            kit, files = self.make_kit(root, 'Synthetic test license\r\nCopyright Example\r\n')
            project = root / 'created lesson'
            self.create_project(kit, project)
            for name, text in files.items():
                self.assertTrue((project / name).is_file(), name + ' must accompany the generated project')
                self.assertEqual((project / name).read_bytes(), text.encode('utf-8'))
            self.assertTrue((project / 'licenses/font-manifest.json').is_file())

    def test_missing_code_license_does_not_invent_a_grant_or_prevent_export(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            kit, files = self.make_kit(root)
            project = root / 'lesson'
            self.create_project(kit, project)
            self.assertFalse((project / 'LICENSE').exists())
            notices, _ = self.notices(self.build_project(project))
            self.assertEqual(notices, files)
            self.assertNotIn('LICENSE', notices)

    def test_export_retains_exact_text_as_inert_escaped_json_in_sorted_order(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            dangerous = ('Synthetic license\r\n</ScRiPt><script>window.bad = true</script>'
                         '<img src="https://example.invalid/leak"> <!-- & © РНК \u2028\u2029\r\n')
            kit, files = self.make_kit(root, dangerous)
            project = root / 'lesson'
            self.create_project(kit, project)
            first = self.build_project(project)
            notices, document = self.notices(first)
            self.assertEqual(notices, files, 'HTML parsing and JSON decoding must preserve exact attribution')
            self.assertEqual(list(notices), sorted(files))
            self.assertEqual(len(document.scripts), 3, 'Only assets bootstrap, app script, and inert notices')
            self.assertFalse(any(tag == 'img' for tag, _ in document.tags), 'Notice markup must not become DOM')
            block = next(s['text'] for s in document.scripts if s['attrs'].get('id') == NOTICE_ID)
            for character in '<>&\u2028\u2029':
                self.assertNotIn(character, block)
            self.assertEqual(first, self.build_project(project), 'Repeated export must be deterministic')

    def test_standalone_export_has_no_notice_or_runtime_file_dependencies(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            kit, files = self.make_kit(root, 'Synthetic test license\n')
            project = root / 'lesson'
            self.create_project(kit, project)
            content = self.build_project(project)
            exported = root / 'shared lesson.html'
            exported.write_text(content, encoding='utf-8')
            shutil.rmtree(project)
            shutil.rmtree(kit)
            notices, document = self.notices(exported.read_text(encoding='utf-8'))
            self.assertEqual(notices, files)
            self.assertFalse(any(tag == 'script' and 'src' in attrs for tag, attrs in document.tags))
            self.assertFalse(any(tag == 'link' and attrs.get('rel') == 'stylesheet'
                                 for tag, attrs in document.tags))
            self.assertNotIn(str(root), content)
            self.assertIn('window.lessonLoaded = true;', content)


if __name__ == '__main__':
    unittest.main()
