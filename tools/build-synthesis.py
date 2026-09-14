#!/usr/bin/env python3
"""Rebuild the optional branched synthesis recipe with the active runtime."""
import argparse
import importlib.util
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'examples/pipeline-synthesis.html'

def module(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    loaded = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(loaded)
    return loaded

def build_example():
    creator = module(ROOT / 'create.py', 'synthesis_creator')
    with tempfile.TemporaryDirectory(prefix='visual-synthesis-') as temporary:
        lesson = creator.create(Path(temporary) / 'lesson', 'От модели к независимой проверке',
                                source_label='Учебные данные; определения в руководстве', template='synthesis')
        return module(lesson / 'build/bundle.py', 'synthesis_bundle').build(lesson)[0]

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    content = build_example()
    if args.check:
        if not OUTPUT.is_file() or OUTPUT.read_text(encoding='utf-8') != content:
            parser.exit(1, 'Synthesis recipe differs from a fresh build.\n')
    else:
        OUTPUT.write_text(content, encoding='utf-8')
    print(('Verified' if args.check else 'Built') + ': ' + str(OUTPUT))

if __name__ == '__main__':
    main()
