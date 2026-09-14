#!/usr/bin/env python3
"""Rebuild the reusable RNA folding lesson with the current starter."""
import argparse
import importlib.util
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'examples/rna-folding.html'


def module(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    loaded = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(loaded)
    return loaded


def build_example():
    creator = module(ROOT / 'create.py', 'rna_folding_creator')
    with tempfile.TemporaryDirectory(prefix='visual-rna-folding-') as temporary:
        lesson = creator.create(Path(temporary) / 'lesson', 'Как складывается РНК',
                                source_label='1EHZ / 1HR2 и явно обозначенные учебные схемы',
                                template='rna-folding', palette='ocean')
        return module(lesson / 'build/bundle.py', 'rna_folding_bundle').build(lesson)[0]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    content = build_example()
    if args.check:
        if not OUTPUT.is_file() or OUTPUT.read_text(encoding='utf-8') != content:
            parser.exit(1, 'RNA folding differs from a fresh build.\n')
    else:
        OUTPUT.write_text(content, encoding='utf-8')
    print(('Verified' if args.check else 'Built') + ': ' + str(OUTPUT))


if __name__ == '__main__':
    main()
