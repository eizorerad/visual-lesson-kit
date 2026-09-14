#!/usr/bin/env python3
"""Build or compare the two-scene molecular construction example."""
import argparse
import importlib.util
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT/'examples/molecular-views.html'


def module(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    loaded = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(loaded)
    return loaded


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    creator = module(ROOT/'create.py', 'molecular_creator')
    with tempfile.TemporaryDirectory(prefix='molecular-views-example-') as tmp:
        lesson = creator.create(Path(tmp)/'lesson', 'Теломераза: комплекс и матрица',
                                source_url='https://doi.org/10.1038/s41586-021-03415-4',
                                source_label='7BG9 · Ghanim et al. 2021',
                                template='molecular-views', palette='ocean')
        content = module(lesson/'build/bundle.py', 'molecular_bundle').build(lesson)[0]
    if args.check:
        if not OUTPUT.is_file() or OUTPUT.read_text()!=content:
            parser.exit(1, 'Molecular example differs from a fresh build.\n')
    else:
        OUTPUT.write_text(content)
    print(('Verified: ' if args.check else 'Built: ')+str(OUTPUT))


if __name__ == '__main__':
    main()
