#!/usr/bin/env python3
"""Create a self-contained lesson from a versioned, local starter."""
import argparse
import hashlib
import html
import json
import re
import shutil
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent
STARTER = ROOT / 'starter'
VERSION = (ROOT / 'VERSION').read_text(encoding='utf-8').strip()
KIT = 'visual-lesson-kit'

# One registry for validation, the CLI and the README table; the template's
# starter page is <name>.html, and the gallery keeps starter/index.html.
TEMPLATES = ('gallery', 'methods', 'explanations', 'synthesis', 'molecular', 'molecular-check',
             'chemistry-bridge', 'rna-folding', 'rna-prediction', 'trna-journey', 'atac-seq',
             'atac-components', 'molecular-views', 'spatial-biology', 'crispri')
BACKGROUNDS, PALETTES, FONTS, LANGUAGES = ('black', 'white'), ('warm', 'ocean', 'botanical'), ('sans', 'serif'), ('ru', 'en')

# Guides every project receives, alongside the navigation catalog and selector.
GUIDES = ('START.md', 'authoring.md', 'components.md', 'qa.md', 'provenance.md',
          'reference-patterns.md', 'inquiry.md', 'matrices-partitions.md', 'questions.md',
          'predictions.md', 'resampling.md', 'threshold.md', 'interaction.md',
          'languages.md', 'mobile-gestures.md', 'perspective.md', 'shell.md', 'upgrading.md', 'theme.md',
          'layout.md', 'label-clearance.md', 'motion.md', 'storyboard.md', 'scientific-repertoire.md',
          'statistics.md', 'biology.md', 'crispri-design.md', 'molecular.md', 'molecular-expression-references.md', 'molecular-regulation.md',
          'molecular-rna-processing.md', 'molecular-inspection.md', 'molecular-check.md', 'geometry.md', 'distributions.md',
          'chemistry.md', 'physical-chemistry.md', 'chemistry-bridge.md', 'rna-folding.md', 'rna-prediction.md', 'rna-pair-molecule.md', 'cinematic-explanation.md', 'trna-journey.md', 'atac-seq.md', 'atac-components.md', 'cinema-timeline.md', 'molecular-coordinates.md',
          'molecular-views.md', 'molecular-views-api.md', 'molecular-data.md', 'three-dimensional.md',
          'explanation-geometry.md', 'explanation-design.md',
          'interaction-regions.md', 'hit-region-audit.md', 'pipeline-synthesis.md')

# Runtime, shell, export and notices: present in every project, full or lean.
CORE = ('AGENTS.md', 'README.md', 'serve.py', 'build/bundle.py', 'build/inspect.html', 'build/inspect.js',
        'css/', 'js/lib/', 'js/i18n/', 'js/appearance.js', 'js/boot.js', 'js/deck.js', 'js/film.js',
        'js/layout.js', 'js/lesson.js', 'js/motion.js', 'js/player.js', 'js/cinema-timeline.js',
        'js/interaction-regions.js', 'assets/fonts/')
# A lean project carries the runtime files its page loads plus the sources,
# builders and checks that regenerate or verify those files.
FAMILIES = {
    'js/trna-': ('assets/trna/', 'assets/rna-folding/', 'build/trna-data.py', 'build/trna-elbow.py',
                 'build/trna-magnesium.py', 'build/trna-spacefill.py', 'qa/trna/'),
    'js/rna-structures.js': ('assets/rna-folding/', 'build/rna-structures.py', 'qa/rna-folding/'),
    'js/recipes/rna-folding/': ('assets/rna-folding/', 'build/rna-structures.py', 'qa/rna-folding/'),
    'js/recipes/rna-prediction/': ('assets/rna-prediction/', 'assets/rna-folding/', 'build/rna-prediction-data.py',
                                   'qa/rna-prediction/', 'qa/rna-folding/'),
    'js/molecular-views': ('assets/molecular-views/', 'build/molecular-data.py', 'qa/molecular-views/'),
    'js/atac-': ('assets/atac/', 'build/atac-film.py', 'build/atac-histone-core.py', 'qa/atac/'),
}
IGNORED = ('__pycache__', '.DS_Store', 'dist', 'node_modules', 'qa-output')
# Authored per project: never generated twice, never replaced by an upgrade.
AUTHORED = ('index.html', 'js/config.js', 'lesson-kit.json')
LOCAL_REFERENCE = re.compile(r'\b(?:src|href)="([^":#?]+)"')


def template_page(template):
    return 'index.html' if template == 'gallery' else template + '.html'


def sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def starter_files():
    """Relative paths of every distributable starter file."""
    out = []
    for path in sorted(STARTER.rglob('*')):
        rel = path.relative_to(STARTER)
        if not path.is_file() or any(part in IGNORED for part in rel.parts) or rel.as_posix() == 'lesson-kit.json':
            continue
        out.append(rel.as_posix())
    return out


def page_references(page):
    text = (STARTER / page).read_text(encoding='utf-8')
    return {ref for ref in LOCAL_REFERENCE.findall(text) if not re.match(r'^(?:[a-z][a-z0-9+.-]*:|//)', ref, re.I)}


def lean_files(template):
    """Starter files a lean project of this template needs."""
    page = template_page(template)
    wanted = {page} | page_references(page)
    for ref in list(wanted):
        for prefix, sources in FAMILIES.items():
            if ref.startswith(prefix):
                wanted.update(sources)
    if template == 'gallery':
        wanted.add('assets/')
    others = {template_page(name) for name in TEMPLATES} - {page}

    def keep(rel):
        if rel in others or (template != 'gallery' and rel.startswith('assets/') and '/' not in rel[len('assets/'):]):
            return False
        return any(rel == item or (item.endswith('/') and rel.startswith(item)) for item in (*CORE, *wanted))
    return [rel for rel in starter_files() if keep(rel)]


def kit_sources(template='gallery', lean=False):
    """Map every kit-managed project path to its source file in this checkout."""
    files = {rel: STARTER / rel for rel in (lean_files(template) if lean else starter_files())}
    for name in GUIDES:
        source = ROOT / 'docs' / name
        if source.is_file():
            files['guide/' + name] = source
    navigation = ROOT / 'docs/navigation'
    if navigation.is_dir():
        for path in sorted(navigation.rglob('*')):
            if path.is_file() and not any(part in IGNORED for part in path.relative_to(navigation).parts):
                files['guide/navigation/' + path.relative_to(navigation).as_posix()] = path
    licenses = ROOT / 'licenses'
    if licenses.is_dir():
        for path in sorted(licenses.rglob('*')):
            if path.is_file():
                files['licenses/' + path.relative_to(licenses).as_posix()] = path
    for name in ('LICENSE', 'THIRD_PARTY_NOTICES.md'):
        if (ROOT / name).is_file():
            files[name] = ROOT / name
    return files


def write_manifest(dest, template, lean):
    """Record the pristine checksum of every kit-managed file for later upgrades."""
    files = {}
    for path in sorted(Path(dest).rglob('*')):
        rel = path.relative_to(dest).as_posix()
        if path.is_file() and rel not in AUTHORED and not any(part in IGNORED for part in path.relative_to(dest).parts):
            files[rel] = sha256(path)
    manifest = {'kit': KIT, 'version': VERSION, 'template': template, 'profile': 'lean' if lean else 'full', 'files': files}
    (Path(dest) / 'lesson-kit.json').write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    return manifest


def create(destination, title, source_url='', source_label='Источник', lang='ru',
           background='black', palette='warm', font='sans', template='gallery', lean=False):
    if not title.strip():
        raise ValueError('Название урока не может быть пустым.')
    if lang not in LANGUAGES:
        raise ValueError('Начальный язык должен быть ru или en.')
    if template not in TEMPLATES:
        raise ValueError('Шаблон должен быть одним из: ' + ', '.join(TEMPLATES) + '.')
    for field, value, choices in (('Фон', background, BACKGROUNDS), ('Палитра', palette, PALETTES), ('Шрифт', font, FONTS)):
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
    if not (STARTER / 'index.html').is_file():
        raise ValueError('Не найден starter/index.html рядом с create.py.')
    for rel, source in kit_sources(template, lean).items():
        target = dest / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)
    if template != 'gallery':
        shutil.copy2(dest / template_page(template), dest / 'index.html')
        # The methods use calculated SVG only; gallery images are not their evidence.
        for asset in (dest / 'assets').iterdir():
            if asset.is_file():
                asset.unlink()
        if lean:
            (dest / template_page(template)).unlink()
    config = {'title': title, 'lang': lang, 'kicker': 'Пошаговый визуальный урок',
              'appearance': {'background': background, 'palette': palette, 'font': font},
              'source': {'url': source_url, 'label': source_label}}
    encoded = json.dumps(config, ensure_ascii=False, indent=2).replace('<', '\\u003c').replace('>', '\\u003e').replace('&', '\\u0026')
    (dest / 'js/config.js').write_text('window.LESSON = ' + encoded + ';\n', encoding='utf-8')
    index = (dest / 'index.html').read_text(encoding='utf-8')
    index = re.sub(r'<title>.*?</title>', lambda _: '<title>' + html.escape(title) + '</title>', index, flags=re.S)
    index = re.sub(r'<html lang="[^"]+"', '<html lang="' + lang + '"', index)
    (dest / 'index.html').write_text(index, encoding='utf-8')
    write_manifest(dest, template, lean)
    return dest


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('destination', help='Новая папка урока; существующая должна быть пустой')
    parser.add_argument('--title', default=None)
    parser.add_argument('--lang', choices=LANGUAGES, default='ru', help='Начальный язык; обе локали входят в HTML')
    parser.add_argument('--template', choices=TEMPLATES, default='gallery',
                        help='Стартовая страница: галерея, научные методы, связное объяснение, общая карта, молекулярные атлас и проверка, мост от химии к биологии, укладка и предсказание структуры РНК, фильмы о тРНК и ATAC-seq, молекулярный конструктор, пространственная биология или CRISPRi')
    parser.add_argument('--lean', action='store_true',
                        help='Копировать только ядро и файлы выбранного шаблона вместо всего набора компонентов')
    parser.add_argument('--source-url', default='')
    parser.add_argument('--source-label', default='Источник')
    parser.add_argument('--background', choices=BACKGROUNDS, default='black', help='Начальный фон; зритель может переключить его')
    parser.add_argument('--palette', choices=PALETTES, default='warm', help='Начальная палитра')
    parser.add_argument('--font', choices=FONTS, default='sans', help='Начальный шрифт: без засечек или с засечками')
    args = parser.parse_args()
    try:
        title = args.title if args.title is not None else ('New visual lesson' if args.lang == 'en' else 'Новый визуальный урок')
        dest = create(args.destination, title, args.source_url, args.source_label, args.lang,
                      args.background, args.palette, args.font, args.template, args.lean)
    except (OSError, ValueError) as error:
        parser.exit(1, str(error) + '\n')
    print(f'Создан урок: {dest}\nСобрать один HTML: python3 "{dest / "build/bundle.py"}"\nОткрыть: {dest / "index.html"}')


if __name__ == '__main__':
    main()
