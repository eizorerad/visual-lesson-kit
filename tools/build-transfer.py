#!/usr/bin/env python3
"""Build the independently authored scientific composition using the current portable starter."""
import argparse
import importlib.util
import re
import shutil
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'examples/independent-evidence.html'


def module(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    loaded = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(loaded)
    return loaded


def build_example():
    creator = module(ROOT / 'create.py', 'transfer_scaffold')
    with tempfile.TemporaryDirectory(prefix='visual-lesson-transfer-') as temporary:
        lesson = creator.create(Path(temporary) / 'lesson', 'Почему больше клеток — не всегда больше независимых данных',
                                source_label='Придуманный учебный набор · три независимых донора по условию')
        shutil.rmtree(lesson / 'js/episodes')
        for asset in (lesson / 'assets').iterdir():
            if asset.is_file():
                asset.unlink()
        index = (lesson / 'index.html').read_text(encoding='utf-8')
        index = re.sub(r'\s*<script src="js/episodes/[^"]+"></script>', '', index)
        index = index.replace('<script src="js/player.js"></script>',
                              '<script src="js/recipes/independent-evidence.js"></script>\n    <script src="js/player.js"></script>')
        index = index.replace('</head>', f'    <meta name="generator" content="visual-lesson-kit {creator.VERSION}" />\n  </head>')
        (lesson / 'index.html').write_text(index, encoding='utf-8')
        bundle = module(lesson / 'build/bundle.py', 'transfer_bundle')
        return bundle.build(lesson)[0]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Compare the HTML with a fresh build')
    args = parser.parse_args()
    try:
        content = build_example()
        if args.check:
            if not OUTPUT.is_file() or OUTPUT.read_text(encoding='utf-8') != content:
                parser.exit(1, 'Independent example differs from a fresh build; run tools/build-transfer.py.\n')
        else:
            OUTPUT.write_text(content, encoding='utf-8')
    except (OSError, ValueError) as error:
        parser.exit(1, str(error) + '\n')
    print(f'{"Verified" if args.check else "Built"}: {OUTPUT} ({len(content.encode("utf-8"))} bytes)')


if __name__ == '__main__':
    main()
