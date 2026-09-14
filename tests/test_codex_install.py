"""Portable installation and dispatch, exercised without touching the user's skills."""
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[1]


class CodexInstallTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix='vlk skill test ')
        self.addCleanup(self.tmp.cleanup)
        self.base = Path(self.tmp.name).resolve()
        self.repo = self.base / 'checkout with spaces'
        self.repo.mkdir()
        shutil.copytree(ROOT / 'skills/visual-lessons', self.repo / 'skills/visual-lessons',
                        ignore=shutil.ignore_patterns('__pycache__'))
        (self.repo / 'tools').mkdir()
        shutil.copy2(ROOT / 'tools/install-codex-skill.py', self.repo / 'tools')
        for name in ('VERSION', 'docs/START.md', 'starter/AGENTS.md'):
            path = self.repo / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text('fixture\n')
        for name in ('create.py', 'docs/navigation/route.py'):
            path = self.repo / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text('import json, sys\nprint(json.dumps(sys.argv[1:]))\n')
        self.target = self.base / 'personal skills/visual-lessons'

    def command(self, script, *args):
        return subprocess.run([sys.executable, str(script), *map(str, args)],
                              cwd=self.base, text=True, capture_output=True)

    def install(self, *args):
        return self.command(self.repo / 'tools/install-codex-skill.py',
                            '--target', self.target, *args)

    def helper(self, *args):
        return self.command(self.target / 'scripts/kit.py', *args)

    def good(self, result):
        self.assertEqual(result.returncode, 0, result.stderr)
        return result.stdout.strip()

    def test_idempotent_link_and_dispatch_preserve_arguments_and_cwd(self):
        self.good(self.install())
        self.assertTrue(self.target.is_symlink())
        self.assertIn('Already installed', self.good(self.install()))
        self.good(self.install('--check'))
        self.assertEqual(Path(self.good(self.helper('root'))), self.repo)
        self.assertIn('Checkout is complete', self.good(self.helper('doctor')))
        for command in ('route', 'create'):
            args = ['a path with spaces', '--title', 'DNA → RNA $literal']
            self.assertEqual(json.loads(self.good(self.helper(command, *args))), args)
            self.assertEqual(json.loads(self.good(self.helper(command, '--help'))), ['--help'])

    def test_relocated_checkout_requires_explicit_link_replacement(self):
        self.good(self.install())
        moved = self.base / 'moved checkout'
        self.repo.rename(moved)
        self.repo = moved
        old_link = self.target.readlink()
        self.assertNotEqual(self.install().returncode, 0)
        self.assertEqual(self.target.readlink(), old_link)
        self.good(self.install('--replace-symlink'))
        self.assertEqual(Path(self.good(self.helper('root'))), moved)

    def test_never_overwrites_existing_directory_even_with_replace(self):
        self.target.mkdir(parents=True)
        valuable = self.target / 'SKILL.md'
        valuable.write_text('user custom skill')
        for args in ((), ('--replace-symlink',)):
            result = self.install(*args)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn('left unchanged', result.stderr)
            self.assertEqual(valuable.read_text(), 'user custom skill')

    def test_check_is_read_only_and_copied_skill_diagnoses_missing_library(self):
        source_files = sorted(str(path.relative_to(self.repo)) for path in self.repo.rglob('*'))
        self.assertNotEqual(self.install('--check').returncode, 0)
        self.assertFalse(self.target.parent.exists())
        self.assertEqual(sorted(str(path.relative_to(self.repo)) for path in self.repo.rglob('*')),
                         source_files)
        shutil.copytree(self.repo / 'skills/visual-lessons', self.target)
        result = self.helper('root')
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('Clone the whole repository', result.stderr)

    def test_incomplete_checkout_cannot_install(self):
        (self.repo / 'starter/AGENTS.md').unlink()
        result = self.install()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('checkout is incomplete', result.stderr)
        self.assertFalse(self.target.parent.exists())


if __name__ == '__main__':
    unittest.main()
