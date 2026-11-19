"""bundle.build keeps image inlining to HTML markup and tolerates CSS URL suffixes."""
import importlib.util
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('lesson_bundle', ROOT / 'starter/build/bundle.py')
bundle = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bundle)

SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>'


class BundleTests(unittest.TestCase):
    def make_project(self, root):
        (root / 'assets').mkdir()
        (root / 'assets/x.svg').write_text(SVG)
        (root / 'assets/font.woff2').write_bytes(b'wOF2-font')
        (root / 'app.js').write_text('const t = `<img src="assets/missing.svg">`;\n')
        (root / 'style.css').write_text(
            '@font-face{src:url(assets/font.woff2?v=1)}\n'
            '@font-face{src:url("assets/font.woff2#hash")}\n')
        (root / 'index.html').write_text(
            '<link rel="stylesheet" href="style.css">\n'
            '<img src="assets/x.svg">\n'
            '<script src="app.js"></script>\n')

    def test_build(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.make_project(root)
            html, counts = bundle.build(root)
        self.assertIn('<img src="assets/missing.svg">', html)
        self.assertIn('<img src="data:image/svg+xml;base64,', html)
        self.assertNotIn('src="assets/x.svg"', html)
        self.assertNotIn('font.woff2', html)
        self.assertEqual(html.count('url("data:'), 2)
        self.assertEqual((counts['styles'], counts['scripts']), (1, 1))


if __name__ == '__main__':
    unittest.main()
