"""Narrated video tools: delivery markup, pronunciation, subtitles and the template scaffold (no network)."""
import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOOLS = ROOT / 'starter' / 'tools'


def module(name):
    spec = importlib.util.spec_from_file_location(name, TOOLS / (name + '.py'))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


class NarrationMarkupTest(unittest.TestCase):
    def setUp(self):
        self.voice = module('voice')
        self.mux = module('mux')

    def test_style_segments_tags_and_stress(self):
        text = 'Вот *главное*. [pause] {excited} Ген изменился! [chuckle] log2FC.'
        parts = self.voice.segments(text, 'warm style', {'excited': 'EXCITED'}, [(r'log2FC', 'лог-фолд')])
        self.assertEqual(parts, [('warm style', 'Вот ГЛАВНОЕ. <short pause>'),
                                 ('EXCITED', 'Ген изменился! <chuckle> лог-фолд.')])
        self.assertEqual(self.voice.plain(text), 'Вот главное. Ген изменился! log2FC.')
        self.assertEqual(self.mux.plain(text), self.voice.plain(text), 'subtitles and the checker see the same text')

    def test_free_style_string_and_tags_stay_out_of_the_pronunciation_table(self):
        parts = self.voice.segments('{calm and slow} Шаг [long pause] два.', '', {}, [(r'\bpause\b', 'X')])
        self.assertEqual(parts, [('calm and slow', 'Шаг <long pause> два.')])

    def test_default_pronunciation_table_is_ordered_pairs(self):
        table = self.voice.load_pronunciation('ru')
        self.assertTrue(table and all(len(pair) == 2 for pair in table))
        self.assertEqual(self.voice.speech('CRISPRi и CPM', table), 'криспр-ай и си-пи-эм')

    def test_subtitles_follow_clip_length_without_markup(self):
        with tempfile.TemporaryDirectory() as tmp:
            import wave
            voice_dir = Path(tmp)
            with wave.open(str(voice_dir / 'a.wav'), 'wb') as w:
                w.setnchannels(1)
                w.setsampwidth(2)
                w.setframerate(24000)
                w.writeframes(b'\0\0' * 24000 * 2)
            self.mux.VOICE = voice_dir
            data = {'lead': .5, 'cues': [{'key': 'a', 'arrive': 1.0, 'voiceRu': 'Раз. [pause] {x} Два *три*.'}]}
            self.mux.subtitles(data, voice_dir / 's.srt', 'voiceRu')
            srt = (voice_dir / 's.srt').read_text(encoding='utf-8')
            self.assertIn('00:00:01,500 -->', srt)
            self.assertIn('Два три.', srt)
            self.assertNotIn('[', srt)
            self.assertNotIn('{', srt)


class NarratedScaffoldTest(unittest.TestCase):
    def run_cli(self, dest, *args):
        return subprocess.run([sys.executable, str(ROOT / 'create.py'), str(dest), *args], capture_output=True, text=True)

    def test_narrated_template_carries_its_tools_and_loads_in_order(self):
        with tempfile.TemporaryDirectory(prefix='lesson-narrated-') as tmp:
            for lean in (False, True):
                dest = Path(tmp) / ('lean' if lean else 'full')
                result = self.run_cli(dest, '--template', 'narrated', '--title', 'Film', *(['--lean'] if lean else []))
                self.assertEqual(result.returncode, 0, result.stderr)
                html = (dest / 'index.html').read_text(encoding='utf-8')
                order = ['js/cinema-timeline.js', 'js/trna-cinema.js', 'js/recipes/narrated/core.js', 'js/recipes/narrated/voice-timing.js',
                         'js/recipes/narrated/example-pairs.js', 'js/recipes/narrated/narrated-film.js', 'js/boot.js']
                self.assertEqual([html.index(ref) for ref in order], sorted(html.index(ref) for ref in order))
                for rel in ('tools/video.py', 'tools/voice.py', 'tools/voice_check.py', 'tools/mux.py', 'tools/pronunciation.json',
                            'qa/narrated/cues.cjs', 'qa/narrated/render.cjs', 'qa/narrated/shots.cjs',
                            'css/narrated.css', 'guide/narrated-video.md'):
                    self.assertTrue((dest / rel).is_file(), rel)
                self.assertEqual(json.loads((dest / 'lesson-kit.json').read_text())['template'], 'narrated')
            self.assertFalse((Path(tmp) / 'lean/js/recipes/film/pcr-film.js').exists(), 'a lean narrated film carries no PCR recipe')

    def test_other_lean_templates_do_not_receive_video_tools(self):
        with tempfile.TemporaryDirectory(prefix='lesson-film-') as tmp:
            dest = Path(tmp) / 'film'
            self.assertEqual(self.run_cli(dest, '--template', 'film', '--lean').returncode, 0)
            self.assertFalse((dest / 'tools').exists(), 'the video tools arrive only with a narrated film')
            self.assertTrue((dest / 'guide/narrated-video.md').is_file(), 'the guide is available to offer a video on request')


if __name__ == '__main__':
    unittest.main()
