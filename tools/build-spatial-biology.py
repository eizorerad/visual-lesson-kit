#!/usr/bin/env python3
"""Build or compare the two-scene 3D cell, capture and molecular-code example."""
import argparse
import importlib.util
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'examples/spatial-biology.html'


def module(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    loaded = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(loaded)
    return loaded


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    creator = module(ROOT / 'create.py', 'spatial_creator')
    with tempfile.TemporaryDirectory(prefix='spatial-biology-example-') as tmp:
        lesson = creator.create(
            Path(tmp) / 'lesson', 'Клетка, захват и молекулярные коды',
            source_url='https://doi.org/10.1038/nmeth.4380',
            source_label='Stoeckius et al. 2017 · CITE-seq',
            template='spatial-biology', palette='ocean')
        content = module(lesson / 'build/bundle.py', 'spatial_bundle').build(lesson)[0]
    if args.check:
        if not OUTPUT.is_file() or OUTPUT.read_text() != content:
            parser.exit(1, 'Spatial biology example differs from a fresh build.\n')
    else:
        OUTPUT.write_text(content)
    print(('Verified: ' if args.check else 'Built: ') + str(OUTPUT))


if __name__ == '__main__':
    main()
