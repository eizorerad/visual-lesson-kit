import tempfile
import unittest
from pathlib import Path

import mux


class PreflightTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.voice = Path(self.tmp.name)
        self.data = {'cues': [{'key': 'a'}, {'key': 'b'}]}

    def tearDown(self):
        self.tmp.cleanup()

    def clips(self, *keys):
        for key in keys:
            (self.voice / f'{key}.wav').write_bytes(b'')

    def test_ok(self):
        self.clips('a', 'b')
        manifest = {'a': {'lang': 'ru'}, 'b': {'lang': 'ru'}}
        self.assertEqual(mux.preflight(self.data, self.voice, manifest, 'ru'), [])

    def test_lang_mismatch_names_both(self):
        self.clips('a', 'b')
        manifest = {'a': {'lang': 'en'}, 'b': {'lang': 'en'}}
        problems = mux.preflight(self.data, self.voice, manifest, 'ru')
        self.assertEqual(len(problems), 2)
        self.assertIn('"en"', problems[0])
        self.assertIn('"ru"', problems[0])

    def test_missing_clip_names_key(self):
        self.clips('a')
        problems = mux.preflight(self.data, self.voice, {}, 'ru')
        self.assertEqual(len(problems), 1)
        self.assertIn('"b"', problems[0])
        self.assertIn('voice.py --lang ru', problems[0])

    def test_empty_cues(self):
        problems = mux.preflight({'cues': []}, self.voice, {}, 'ru')
        self.assertEqual(len(problems), 1)
        self.assertIn('no narration cues', problems[0])

    def test_load_manifest_absent(self):
        self.assertEqual(mux.load_manifest(self.voice), {})


if __name__ == '__main__':
    unittest.main()
