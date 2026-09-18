#!/usr/bin/env python3
"""Rebuild the reusable tRNA journey lesson with the current starter."""
import argparse
import importlib.util
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'examples/trna-journey.html'


def module(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    loaded = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(loaded)
    return loaded


def build_example():
    creator = module(ROOT / 'create.py', 'trna_journey_creator')
    with tempfile.TemporaryDirectory(prefix='visual-trna-journey-') as temporary:
        lesson = creator.create(Path(temporary) / 'lesson', 'тРНК: от последовательности к атомам',
                                source_url='https://www.rcsb.org/structure/1EHZ',
                                source_label='Shi & Moore, 2000 · PDB 1EHZ',
                                template='trna-journey', palette='ocean')
        return module(lesson / 'build/bundle.py', 'trna_journey_bundle').build(lesson)[0]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    content = build_example()
    if args.check:
        if not OUTPUT.is_file() or OUTPUT.read_text(encoding='utf-8') != content:
            parser.exit(1, 'tRNA journey differs from a fresh build.\n')
    else:
        OUTPUT.write_text(content, encoding='utf-8')
    print(('Verified' if args.check else 'Built') + ': ' + str(OUTPUT))


if __name__ == '__main__':
    main()
