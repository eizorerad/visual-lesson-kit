#!/usr/bin/env python3
"""Create a self-contained lesson from a versioned, local starter."""
import argparse
import html
import json
import shutil
import sys
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent
VERSION = (ROOT / 'VERSION').read_text(encoding='utf-8').strip()


def create(destination, title, source_url='', source_label='Источник', lang='ru',
           background='black', palette='warm', font='sans', template='gallery'):
    if not title.strip():
        raise ValueError('Название урока не может быть пустым.')
    if lang not in ('ru', 'en'):
        raise ValueError('Начальный язык должен быть ru или en.')
    if template not in ('gallery', 'methods', 'explanations', 'synthesis', 'molecular', 'molecular-check', 'chemistry-bridge', 'rna-folding', 'rna-prediction', 'trna-journey', 'molecular-views', 'spatial-biology'):
        raise ValueError('Шаблон должен быть gallery, methods, explanations, synthesis, molecular, molecular-check, chemistry-bridge, rna-folding, rna-prediction, trna-journey, molecular-views или spatial-biology.')
    for field, value, choices in (
        ('Фон', background, ('black', 'white')),
        ('Палитра', palette, ('warm', 'ocean', 'botanical')),
        ('Шрифт', font, ('sans', 'serif')),
    ):
        if value not in choices:
            raise ValueError(field + ': выберите ' + ', '.join(choices) + '.')
    url = urlsplit(source_url)
    if source_url and (url.scheme not in ('https', 'http') or not url.hostname or url.username or url.password):
        raise ValueError('Источник должен быть обычной ссылкой http/https без логина и пароля.')
    requested = Path(destination).expanduser()
    if requested.is_symlink():
        raise ValueError('Папка назначения не должна быть символической ссылкой.')
    dest = requested.resolve()
    if dest == ROOT or ROOT in dest.parents:
        raise ValueError('Создайте урок за пределами папки самой библиотеки.')
    if dest.exists() and (not dest.is_dir() or any(dest.iterdir())):
        raise ValueError('Папка назначения не пуста. Существующие файлы не перезаписаны.')
    starter = ROOT / 'starter'
    if not (starter / 'index.html').is_file():
        raise ValueError('Не найден starter/index.html рядом с create.py.')
    shutil.copytree(starter, dest, dirs_exist_ok=True,
                    ignore=shutil.ignore_patterns('__pycache__', '.DS_Store', 'dist', 'node_modules', 'qa-output'))
    if template in ('methods', 'explanations', 'synthesis', 'molecular', 'molecular-check', 'chemistry-bridge', 'rna-folding', 'rna-prediction', 'trna-journey', 'molecular-views', 'spatial-biology'):
        shutil.copy2(dest / (template + '.html'), dest / 'index.html')
        # The methods use calculated SVG only; gallery images are not their evidence.
        for asset in (dest / 'assets').iterdir():
            if asset.is_file():
                asset.unlink()
    config = {'title': title, 'lang': lang, 'kicker': 'Пошаговый визуальный урок',
              'appearance': {'background': background, 'palette': palette, 'font': font},
              'source': {'url': source_url, 'label': source_label}}
    encoded = json.dumps(config, ensure_ascii=False, indent=2).replace('<', '\\u003c').replace('>', '\\u003e').replace('&', '\\u0026')
    (dest / 'js/config.js').write_text('window.LESSON = ' + encoded + ';\n', encoding='utf-8')
    index = (dest / 'index.html').read_text(encoding='utf-8')
    import re
    index = re.sub(r'<title>.*?</title>', lambda _: '<title>' + html.escape(title) + '</title>', index, flags=re.S)
    index = re.sub(r'<html lang="[^"]+"', '<html lang="' + lang + '"', index)
    (dest / 'index.html').write_text(index, encoding='utf-8')
    (dest / 'lesson-kit.json').write_text(json.dumps({'kit': 'visual-lesson-kit', 'version': VERSION}, indent=2) + '\n')
    guide = dest / 'guide'; guide.mkdir(exist_ok=True)
    for name in ('START.md', 'authoring.md', 'components.md', 'qa.md', 'provenance.md',
                 'reference-patterns.md', 'inquiry.md', 'matrices-partitions.md', 'questions.md',
                 'predictions.md', 'resampling.md', 'threshold.md', 'interaction.md',
                 'languages.md', 'mobile-gestures.md', 'perspective.md', 'shell.md', 'upgrading.md', 'theme.md',
                 'layout.md', 'label-clearance.md', 'motion.md', 'storyboard.md', 'scientific-repertoire.md',
                 'statistics.md', 'biology.md', 'molecular.md', 'molecular-expression-references.md', 'molecular-regulation.md',
                 'molecular-rna-processing.md', 'molecular-inspection.md', 'molecular-check.md', 'geometry.md', 'distributions.md',
                 'chemistry.md', 'physical-chemistry.md', 'chemistry-bridge.md', 'rna-folding.md', 'rna-prediction.md', 'rna-pair-molecule.md', 'cinematic-explanation.md', 'trna-journey.md', 'cinema-timeline.md', 'molecular-coordinates.md',
                 'molecular-views.md', 'molecular-views-api.md', 'molecular-data.md', 'three-dimensional.md',
                 'explanation-geometry.md', 'explanation-design.md',
                 'interaction-regions.md', 'hit-region-audit.md', 'pipeline-synthesis.md'):
        source = ROOT / 'docs' / name
        if source.is_file():
            shutil.copy2(source, guide / name)
    navigation = ROOT / 'docs/navigation'
    if navigation.is_dir():
        shutil.copytree(navigation, guide / 'navigation', dirs_exist_ok=True,
                        ignore=shutil.ignore_patterns('__pycache__', '.DS_Store'))
    licenses = ROOT / 'licenses'
    if licenses.is_dir():
        shutil.copytree(licenses, dest / 'licenses', dirs_exist_ok=True)
    for name in ('LICENSE', 'THIRD_PARTY_NOTICES.md'):
        notice = ROOT / name
        if notice.is_file():
            shutil.copy2(notice, dest / name)
    return dest


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('destination', help='Новая папка урока; существующая должна быть пустой')
    parser.add_argument('--title', default=None)
    parser.add_argument('--lang', choices=('ru', 'en'), default='ru', help='Начальный язык; обе локали входят в HTML')
    parser.add_argument('--template', choices=('gallery', 'methods', 'explanations', 'synthesis', 'molecular', 'molecular-check', 'chemistry-bridge', 'rna-folding', 'rna-prediction', 'trna-journey', 'molecular-views', 'spatial-biology'), default='gallery', help='Галерея, научные методы, связное объяснение, общая карта, молекулярный атлас, проверка молекулярных элементов мост от химии к биологии укладка и предсказание структуры РНК, молекулярный конструктор, пространственная биология')
    parser.add_argument('--source-url', default='')
    parser.add_argument('--source-label', default='Источник')
    parser.add_argument('--background', choices=('black', 'white'), default='black', help='Начальный фон; зритель может переключить его')
    parser.add_argument('--palette', choices=('warm', 'ocean', 'botanical'), default='warm', help='Начальная палитра')
    parser.add_argument('--font', choices=('sans', 'serif'), default='sans', help='Начальный шрифт: без засечек или с засечками')
    args = parser.parse_args()
    try:
        title = args.title if args.title is not None else ('New visual lesson' if args.lang == 'en' else 'Новый визуальный урок')
        dest = create(args.destination, title, args.source_url, args.source_label, args.lang,
                      args.background, args.palette, args.font, args.template)
    except (OSError, ValueError) as error:
        parser.exit(1, str(error) + '\n')
    print(f'Создан урок: {dest}\nСобрать один HTML: python3 "{dest / "build/bundle.py"}"\nОткрыть: {dest / "index.html"}')


if __name__ == '__main__':
    main()
