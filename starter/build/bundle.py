#!/usr/bin/env python3
"""Inline local scripts, styles, fonts and image assets into dist/lesson.html."""
import argparse
import base64
import json
import mimetypes
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STYLE = re.compile(r'<link\b[^>]*\brel="stylesheet"[^>]*\bhref="([^"]+)"[^>]*>')
SCRIPT = re.compile(r'<script\b[^>]*\bsrc="([^"]+)"[^>]*>\s*</script>')
CSS_URL = re.compile(r'url\(\s*([\'"]?)([^\)\'"\s]+)\1\s*\)')
IMAGE_ATTR = re.compile(r'\b(src|href)="(assets/[^"<>]+)"')
IMAGE_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif'}


def local_path(reference, base, root):
    if re.match(r'^(?:[a-z][a-z0-9+.-]*:|//)', reference, re.I):
        raise ValueError('Внешняя зависимость не входит в автономный урок: ' + reference)
    path = (base / reference).resolve()
    if root not in path.parents or not path.is_file():
        raise ValueError('Нет локального файла внутри урока: ' + reference)
    return path


def data_uri(path):
    mime = mimetypes.guess_type(path.name)[0] or 'application/octet-stream'
    return 'data:' + mime + ';base64,' + base64.b64encode(path.read_bytes()).decode('ascii')


def notice_block(root):
    paths = [root / name for name in ('LICENSE', 'THIRD_PARTY_NOTICES.md')]
    licenses = root / 'licenses'
    if licenses.is_dir():
        paths.extend(path for path in licenses.rglob('*') if path.suffix.lower() in ('.md', '.txt'))
    notices = {}
    for path in sorted(paths, key=lambda item: item.relative_to(root).as_posix()):
        if path.is_file():
            name = path.relative_to(root).as_posix()
            checked = local_path(name, root, root)
            notices[name] = checked.read_bytes().decode('utf-8')
    if not notices:
        return ''
    # JSON is inert; escaping HTML delimiters also prevents a notice from closing its script element.
    encoded = json.dumps(notices, ensure_ascii=False, indent=2)
    for character, escaped in (('<', '\\u003c'), ('>', '\\u003e'), ('&', '\\u0026'),
                               ('\u2028', '\\u2028'), ('\u2029', '\\u2029')):
        encoded = encoded.replace(character, escaped)
    return '<script type="application/json" id="visual-lesson-kit-notices">\n' + encoded + '\n</script>\n'


def build(root=ROOT):
    root = Path(root).resolve()
    source = (root / 'index.html').read_text(encoding='utf-8')
    assets = root / 'assets'
    images = {}
    for path in sorted(assets.rglob('*')) if assets.exists() else []:
        if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS:
            checked = local_path(str(path.relative_to(root)), root, root)
            images[path.relative_to(assets).as_posix()] = data_uri(checked)
    counts = {'styles': 0, 'scripts': 0, 'images': len(images)}

    def stylesheet(match):
        path = local_path(match[1], root, root)
        css = path.read_text(encoding='utf-8')
        def asset(m):
            return m[0] if m[2].startswith(('data:', '#')) else 'url("' + data_uri(local_path(m[2], path.parent, root)) + '")'
        css = CSS_URL.sub(asset, css)
        if re.search(r'</\s*style', css, re.I):
            raise ValueError('Недопустимый закрывающий тег в CSS: ' + match[1])
        counts['styles'] += 1
        return '<style>/* ' + match[1] + ' */\n' + css + '\n</style>'

    def script(match):
        js = local_path(match[1], root, root).read_text(encoding='utf-8')
        js = re.sub(r'</(?=script)', r'<\\/', js, flags=re.I)
        counts['scripts'] += 1
        return '<script>/* ' + match[1] + ' */\n' + js + '\n</script>'

    source = SCRIPT.sub(script, STYLE.sub(stylesheet, source))
    source = IMAGE_ATTR.sub(lambda m: m[1] + '="' + data_uri(local_path(m[2], root, root)) + '"', source)
    bootstrap = '<script>window.LESSON_ASSETS=' + json.dumps(images, separators=(',', ':')) + ';</script>\n'
    first = source.find('<script>')
    if first < 0:
        raise ValueError('В уроке нет скриптов.')
    source = source[:first] + notice_block(root) + bootstrap + source[first:]
    return source, counts


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Проверить без записи')
    parser.add_argument('-o', '--output', type=Path, default=ROOT / 'dist/lesson.html')
    args = parser.parse_args()
    try:
        content, counts = build()
        if not args.check:
            args.output.parent.mkdir(parents=True, exist_ok=True)
            args.output.write_text(content, encoding='utf-8')
    except (OSError, ValueError) as error:
        parser.exit(1, str(error) + '\n')
    print(json.dumps({'output': str(args.output), 'bytes': len(content.encode('utf-8')), **counts}, ensure_ascii=False))


if __name__ == '__main__':
    main()
