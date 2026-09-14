#!/usr/bin/env python3
"""Link the complete local checkout's skill into a Codex skill directory."""
import argparse
import importlib.util
import os
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'skills/visual-lessons'


def verify_source():
    helper = SOURCE / 'scripts/kit.py'
    if not (SOURCE / 'SKILL.md').is_file() or not helper.is_file():
        raise ValueError('Missing skills/visual-lessons. Clone the complete repository first.')
    spec = importlib.util.spec_from_file_location('visual_lesson_kit_location', helper)
    module = importlib.util.module_from_spec(spec)
    previous = sys.dont_write_bytecode
    try:
        sys.dont_write_bytecode = True
        spec.loader.exec_module(module)
    finally:
        sys.dont_write_bytecode = previous
    if module.library_root() != ROOT:
        raise ValueError('Skill helper resolves to a different checkout.')


def install(target, check=False, replace_symlink=False):
    verify_source()
    # Do not resolve the destination itself: an existing link must be inspected first.
    target = Path(os.path.abspath(Path(target).expanduser()))
    if target.is_symlink() and target.resolve() == SOURCE.resolve():
        return 'Already installed: ' + str(target) + ' -> ' + str(SOURCE)
    if check:
        raise ValueError('Skill is not linked to this checkout at ' + str(target) +
                         '. Run the installer without --check; use --target for a custom location.')
    if target.is_symlink():
        if not replace_symlink:
            raise ValueError('Existing symlink points elsewhere: ' + str(target) +
                             '. Inspect it first; --replace-symlink explicitly replaces only this link.')
        target.unlink()
    elif target.exists():
        raise ValueError('Existing file or directory left unchanged: ' + str(target) +
                         '. Move it to a backup outside all skill directories or choose --target.')
    target.parent.mkdir(parents=True, exist_ok=True)
    target.symlink_to(SOURCE, target_is_directory=True)
    return 'Installed: ' + str(target) + ' -> ' + str(SOURCE)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--target', type=Path,
                        default=Path.home() / '.agents/skills/visual-lessons',
                        help='Full destination skill path (default: ~/.agents/skills/visual-lessons)')
    parser.add_argument('--check', action='store_true', help='Check this installation without changing it')
    parser.add_argument('--replace-symlink', action='store_true',
                        help='Replace an existing symlink, never a file or directory')
    args = parser.parse_args()
    if args.check and args.replace_symlink:
        parser.error('--check and --replace-symlink cannot be combined')
    try:
        print(install(args.target, args.check, args.replace_symlink))
    except (ValueError, OSError) as error:
        parser.exit(1, str(error) + '\n')


if __name__ == '__main__':
    main()
