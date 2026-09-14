#!/usr/bin/env python3
"""Locate this skill's complete checkout and dispatch its public entry points."""
import argparse
from pathlib import Path
import subprocess
import sys


def library_root():
    root = Path(__file__).resolve().parents[3]
    required = ('VERSION', 'create.py', 'docs/START.md',
                'docs/navigation/route.py', 'starter/AGENTS.md')
    missing = [name for name in required if not (root / name).is_file()]
    if missing:
        raise ValueError(
            'Visual Lesson Kit checkout is incomplete at ' + str(root) +
            '. Missing: ' + ', '.join(missing) +
            '. Clone the whole repository and run tools/install-codex-skill.py; '
            'copying only the skill folder does not install the library.')
    return root


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=('root', 'doctor', 'route', 'create'))
    parser.add_argument('arguments', nargs=argparse.REMAINDER)
    args = parser.parse_args()
    forwarded = args.arguments
    try:
        root = library_root()
    except (ValueError, OSError) as error:
        parser.exit(1, str(error) + '\n')
    if args.command in ('root', 'doctor'):
        if forwarded:
            parser.error(args.command + ' does not accept extra arguments')
        print(root)
        if args.command == 'doctor':
            print('Visual Lesson Kit ' + (root / 'VERSION').read_text().strip())
            print('Python: ' + sys.executable)
            print('Checkout is complete; route and create entry points are available.')
        return
    script = 'docs/navigation/route.py' if args.command == 'route' else 'create.py'
    # Argument boundaries, caller's cwd and exit status are preserved, including spaces.
    result = subprocess.run([sys.executable, str(root / script), *forwarded])
    raise SystemExit(result.returncode)


if __name__ == '__main__':
    main()
