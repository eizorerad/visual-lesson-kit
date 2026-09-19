"""upgrade.py replaces pristine kit files, keeps authored and edited files, and records new checksums."""
import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def run(*args, cwd=None):
    return subprocess.run([sys.executable, *map(str, args)], cwd=cwd, capture_output=True, text=True)


def newer_kit(directory, version='9.9.9'):
    """A copy of this checkout that pretends to be a later release."""
    kit = Path(directory) / 'kit'
    kit.mkdir()
    for name in ('create.py', 'upgrade.py', 'VERSION', 'LICENSE', 'THIRD_PARTY_NOTICES.md'):
        shutil.copy2(ROOT / name, kit / name)
    for folder in ('starter', 'docs', 'licenses'):
        shutil.copytree(ROOT / folder, kit / folder, ignore=shutil.ignore_patterns('__pycache__', '.DS_Store', 'dist', 'qa-output', 'superpowers'))
    (kit / 'VERSION').write_text(version + '\n')
    deck = kit / 'starter/js/deck.js'
    deck.write_text(deck.read_text() + '\n/* release ' + version + ' */\n')
    guide = kit / 'docs/shell.md'
    guide.write_text(guide.read_text() + '\n\nAdded in ' + version + '.\n')
    (kit / 'starter/js/new-core-helper.js').write_text('/* new in ' + version + ' */\n')
    return kit


class UpgradeTests(unittest.TestCase):
    def test_pristine_files_update_edited_files_are_kept_and_manifest_moves_on(self):
        with tempfile.TemporaryDirectory() as tmp:
            lesson = Path(tmp) / 'lesson'
            self.assertEqual(run(ROOT / 'create.py', lesson, '--template', 'methods').returncode, 0)
            kit = newer_kit(tmp)
            film = lesson / 'js/film.js'
            film.write_text(film.read_text() + '\n/* local change */\n')
            (lesson / 'js/config.js').write_text('window.LESSON = {"title": "Mine"};\n')
            index_before = (lesson / 'index.html').read_bytes()
            dry = run(kit / 'upgrade.py', lesson, '--json')
            self.assertEqual(dry.returncode, 0, dry.stderr)
            report = json.loads(dry.stdout)
            status = {row['path']: row['status'] for row in report['rows']}
            self.assertEqual(status['js/deck.js'], 'update')
            self.assertEqual(status['guide/shell.md'], 'update')
            self.assertEqual(status['js/new-core-helper.js'], 'add')
            self.assertEqual(status['js/film.js'], 'conflict')
            self.assertEqual(report['applied'], 0)
            self.assertNotIn('/* release 9.9.9 */', (lesson / 'js/deck.js').read_text(), 'a dry run writes nothing')
            applied = run(kit / 'upgrade.py', lesson, '--apply', '--json')
            self.assertEqual(applied.returncode, 2, 'a kept conflict is reported through the exit status')
            report = json.loads(applied.stdout)
            self.assertIn('/* release 9.9.9 */', (lesson / 'js/deck.js').read_text())
            self.assertIn('Added in 9.9.9', (lesson / 'guide/shell.md').read_text())
            self.assertTrue((lesson / 'js/new-core-helper.js').is_file())
            self.assertIn('/* local change */', film.read_text(), 'edited files stay')
            self.assertEqual((lesson / 'index.html').read_bytes(), index_before)
            self.assertEqual((lesson / 'js/config.js').read_text(), 'window.LESSON = {"title": "Mine"};\n')
            backup = Path(report['backup'])
            self.assertTrue((backup / 'js/deck.js').is_file(), 'replaced files are backed up')
            self.assertNotIn('/* release 9.9.9 */', (backup / 'js/deck.js').read_text())
            manifest = json.loads((lesson / 'lesson-kit.json').read_text())
            self.assertEqual((manifest['version'], manifest['template'], manifest['profile']), ('9.9.9', 'methods', 'full'))
            self.assertIn('js/deck.js', manifest['files'])
            self.assertNotIn('js/film.js', manifest['files'], 'a kept conflict is not recorded as pristine')
            again = json.loads(run(kit / 'upgrade.py', lesson, '--json').stdout)
            self.assertEqual({row['path'] for row in again['rows']}, {'js/film.js'})
            forced = run(kit / 'upgrade.py', lesson, '--apply', '--force', '--json')
            self.assertEqual(forced.returncode, 0, forced.stderr)
            self.assertNotIn('/* local change */', film.read_text())
            self.assertEqual(json.loads(run(kit / 'upgrade.py', lesson, '--json').stdout)['rows'], [])

    def test_legacy_lesson_without_checksums_is_upgraded_conservatively(self):
        with tempfile.TemporaryDirectory() as tmp:
            lesson = Path(tmp) / 'lesson'
            self.assertEqual(run(ROOT / 'create.py', lesson, '--template', 'methods').returncode, 0)
            (lesson / 'lesson-kit.json').write_text('{"kit": "visual-lesson-kit", "version": "0.12.1"}\n')
            (lesson / 'js/trna-journey.js').unlink()
            (lesson / 'js/lib/dom.js').unlink()
            kit = newer_kit(tmp)
            report = json.loads(run(kit / 'upgrade.py', lesson, '--json').stdout)
            status = {row['path']: row['status'] for row in report['rows']}
            self.assertEqual(report['profile'], 'legacy')
            self.assertEqual(status['js/deck.js'], 'conflict', 'without a recorded checksum a differing runtime file is not silently replaced')
            self.assertEqual(status['js/lib/dom.js'], 'add', 'missing runtime files are restored')
            self.assertEqual(status['js/trna-journey.js'], 'available', 'other template packs are only offered')
            applied = run(kit / 'upgrade.py', lesson, '--apply', '--json')
            self.assertEqual(applied.returncode, 2)
            self.assertTrue((lesson / 'js/lib/dom.js').is_file())
            self.assertFalse((lesson / 'js/trna-journey.js').exists())
            self.assertNotIn('/* release 9.9.9 */', (lesson / 'js/deck.js').read_text())
            forced = run(kit / 'upgrade.py', lesson, '--apply', '--force', '--json')
            self.assertEqual(forced.returncode, 0, forced.stderr)
            self.assertIn('/* release 9.9.9 */', (lesson / 'js/deck.js').read_text())
            manifest = json.loads((lesson / 'lesson-kit.json').read_text())
            self.assertEqual(manifest['version'], '9.9.9')
            self.assertGreater(len(manifest['files']), 300, 'the next upgrade can rely on recorded checksums')

    def test_lean_lessons_do_not_receive_other_template_packs(self):
        with tempfile.TemporaryDirectory() as tmp:
            lesson = Path(tmp) / 'lean'
            self.assertEqual(run(ROOT / 'create.py', lesson, '--template', 'rna-folding', '--lean').returncode, 0)
            kit = newer_kit(tmp)
            report = json.loads(run(kit / 'upgrade.py', lesson, '--apply', '--json').stdout)
            paths = {row['path'] for row in report['rows']}
            self.assertIn('js/deck.js', paths)
            self.assertFalse(any(p.startswith(('js/atac-', 'js/trna-', 'assets/atac/')) or p.endswith('.html') for p in paths), paths)
            self.assertFalse((lesson / 'rna-folding.html').exists())
            self.assertEqual(json.loads((lesson / 'lesson-kit.json').read_text())['profile'], 'lean')

    def test_refuses_folders_that_are_not_lessons(self):
        with tempfile.TemporaryDirectory() as tmp:
            result = run(ROOT / 'upgrade.py', tmp)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn('lesson-kit.json', result.stderr)
            self.assertNotEqual(run(ROOT / 'upgrade.py', ROOT / 'starter').returncode, 0, 'the starter is not a lesson')


if __name__ == '__main__':
    unittest.main()
