#!/usr/bin/env python3
"""Rebuild the one-scene mean/spread example from the current local starter."""
import argparse
import importlib.util
import re
import shutil
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'examples/mean-spread.html'


def module(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    loaded = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(loaded)
    return loaded


def build_example():
    creator = module(ROOT / 'create.py', 'example_scaffold')
    with tempfile.TemporaryDirectory(prefix='visual-lesson-example-') as temporary:
        lesson = creator.create(Path(temporary) / 'lesson', 'Почему среднее не рассказывает всё',
                                source_label='Придуманные данные')
        for folder in ('js/episodes', 'js/i18n'):
            shutil.rmtree(lesson / folder)
            (lesson / folder).mkdir()
        shutil.copy2(ROOT / 'examples/source/mean-spread.js', lesson / 'js/episodes/mean-spread.js')
        shutil.copy2(ROOT / 'examples/source/mean-spread-en.js', lesson / 'js/i18n/mean-spread-en.js')
        # This numerical example has no figure; retain only its current font assets.
        for asset in (lesson / 'assets').iterdir():
            if asset.is_file():
                asset.unlink()
        index = (lesson / 'index.html').read_text(encoding='utf-8')
        index = re.sub(r'\s*<script src="js/i18n/[^"]+"></script>', '', index)
        index = index.replace('<script src="js/lib/i18n.js"></script>',
                              '<script src="js/lib/i18n.js"></script>\n    <script src="js/i18n/mean-spread-en.js"></script>')
        index = re.sub(r'\s*<script src="js/episodes/[^"]+"></script>', '', index)
        index = index.replace('<script src="js/player.js"></script>',
                              '<script src="js/episodes/mean-spread.js"></script>\n    <script src="js/player.js"></script>')
        version = creator.VERSION
        index = index.replace('</head>', f'    <meta name="generator" content="visual-lesson-kit {version}" />\n  </head>')
        (lesson / 'index.html').write_text(index, encoding='utf-8')
        bundle = module(lesson / 'build/bundle.py', 'example_bundle')
        return bundle.build(lesson)[0]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Compare the tracked HTML to a fresh temporary build')
    args = parser.parse_args()
    try:
        content = build_example()
        if args.check:
            if not OUTPUT.is_file() or OUTPUT.read_text(encoding='utf-8') != content:
                parser.exit(1, 'The example differs from a fresh build; run tools/build-example.py.\n')
        else:
            OUTPUT.write_text(content, encoding='utf-8')
    except (OSError, ValueError) as error:
        parser.exit(1, str(error) + '\n')
    print(f'{"Verified" if args.check else "Built"}: {OUTPUT} ({len(content.encode("utf-8"))} bytes)')


if __name__ == '__main__':
    main()
