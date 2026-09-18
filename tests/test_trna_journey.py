"""Fresh-project portability and discoverability for the continuous tRNA film."""
import json
import importlib.util
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]


class TrnaJourneyTests(unittest.TestCase):
    def run_python(self, *args, cwd=ROOT):
        return subprocess.run([sys.executable, *map(str, args)], cwd=cwd,
                              capture_output=True, text=True)

    def test_generator_excludes_local_qa_records_even_when_present(self):
        spec = importlib.util.spec_from_file_location('trna_creator_test', ROOT / 'create.py')
        creator = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(creator)
        with tempfile.TemporaryDirectory() as temp:
            fixture = Path(temp) / 'library'
            starter = fixture / 'starter'
            (starter / 'js').mkdir(parents=True)
            (starter / 'qa-output').mkdir()
            (starter / 'qa-output/private-report.json').write_text('{"local": true}')
            (starter / 'index.html').write_text('<html lang="ru"><title>Film</title></html>')
            destination = Path(temp) / 'lesson'
            with patch.object(creator, 'ROOT', fixture):
                creator.create(destination, 'Film')
            self.assertTrue((destination / 'index.html').is_file())
            self.assertFalse((destination / 'qa-output').exists())

    def test_template_reproduces_offline_from_a_fresh_portable_folder(self):
        with tempfile.TemporaryDirectory(prefix='tRNA перенос ') as temp:
            project = Path(temp) / 'Новый фильм'
            result = self.run_python(ROOT / 'create.py', project,
                                     '--template', 'trna-journey', '--palette', 'ocean')
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertFalse((project / 'qa-output').exists(), 'Local QA records must not travel with new lessons')
            for item in ('js/trna-config.js', 'js/cinema-timeline.js', 'js/trna-story.js',
                         'js/trna-journey.js', 'js/trna-sphere-renderer.js',
                         'assets/trna/SOURCES.md', 'guide/trna-journey.md',
                         'guide/cinema-timeline.md', 'qa/trna/science.py',
                         'qa/trna/magnesium-projection.cjs'):
                self.assertTrue((project / item).is_file(), item)
            for name in ('trna-data', 'trna-elbow', 'trna-spacefill', 'trna-magnesium'):
                result = self.run_python(project / ('build/' + name + '.py'), '--check', cwd=project)
                self.assertEqual(result.returncode, 0, result.stderr + result.stdout)
            for name in ('science', 'magnesium-science'):
                result = self.run_python(project / ('qa/trna/' + name + '.py'), cwd=project)
                self.assertEqual(result.returncode, 0, result.stderr + result.stdout)
            result = self.run_python(project / 'build/bundle.py', cwd=project)
            self.assertEqual(result.returncode, 0, result.stderr)
            content = (project / 'dist/lesson.html').read_text()
            self.assertNotIn('<script src=', content)
            self.assertNotRegex(content, r'/(?:Users|home)/[^/]+/')
            self.assertIn('TrnaJourney', content)
            self.assertIn('CinemaTimeline', content)
            self.assertIn('A31–Ψ39', content)
            self.assertIn('visual-lesson-kit-notices', content)

    def test_components_available_without_loading_in_gallery(self):
        with tempfile.TemporaryDirectory() as temp:
            project = Path(temp) / 'gallery'
            result = self.run_python(ROOT / 'create.py', project)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertTrue((project / 'js/trna-journey.js').is_file())
            self.assertTrue((project / 'js/cinema-timeline.js').is_file())
            index = (project / 'index.html').read_text()
            self.assertNotIn('trna-journey.js', index)
            self.assertNotIn('trna-spacefill-data.js', index)

    def test_concept_discovery_and_portable_guide_paths(self):
        for query, expected in (('trna-journey', 'trna-journey'),
                                ('тРНК фильм', 'trna-journey'),
                                ('cinema-timeline', 'cinema-timeline')):
            result = self.run_python(ROOT / 'docs/navigation/route.py', query, '--json')
            self.assertEqual(result.returncode, 0, result.stderr)
            matches = json.loads(result.stdout)['results']
            self.assertTrue(matches, query)
            self.assertEqual(matches[0]['id'], expected, query)


if __name__ == '__main__':
    unittest.main()
