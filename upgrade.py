#!/usr/bin/env python3
"""Update the kit-managed files of a generated lesson to this library version.

Authored files are never touched: index.html, js/config.js, README.md, the
lesson's own docs, assets, episodes and data. A kit file is replaced only when
the lesson's copy still matches the checksum recorded by create.py or by the
previous upgrade; a locally edited copy is reported as a conflict and kept
unless --force is given. Replaced files are backed up inside the lesson.
"""
import argparse
import importlib.util
import json
import shutil
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent
STATUSES = ('add', 'update', 'same', 'conflict', 'available')


def load_kit():
    spec = importlib.util.spec_from_file_location('vlk_create', ROOT / 'create.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def is_core(kit, rel):
    if rel in ('LICENSE', 'THIRD_PARTY_NOTICES.md') or rel.startswith(('guide/', 'licenses/')):
        return True
    return any(rel == item or (item.endswith('/') and rel.startswith(item)) for item in kit.CORE)


def read_manifest(lesson):
    path = lesson / 'lesson-kit.json'
    if not path.is_file():
        raise ValueError('Не найден lesson-kit.json: папка не похожа на урок Visual Lesson Kit: ' + str(lesson))
    try:
        manifest = json.loads(path.read_text(encoding='utf-8'))
    except ValueError as error:
        raise ValueError('lesson-kit.json повреждён: ' + str(error)) from error
    if not isinstance(manifest, dict) or manifest.get('kit') != 'visual-lesson-kit':
        raise ValueError('lesson-kit.json не принадлежит Visual Lesson Kit.')
    return manifest


def plan(lesson, kit):
    """Classify every kit-managed path of the lesson against this checkout."""
    manifest = read_manifest(lesson)
    recorded = manifest.get('files') if isinstance(manifest.get('files'), dict) else {}
    legacy = not recorded
    template = manifest.get('template') if manifest.get('template') in kit.TEMPLATES else None
    lean = manifest.get('profile') == 'lean' and template is not None
    sources = kit.kit_sources(template, True) if lean else kit.kit_sources()
    rows = []
    for rel, source in sources.items():
        if rel in kit.AUTHORED or rel == 'README.md':
            continue
        if template != 'gallery' and rel.startswith('assets/') and '/' not in rel[len('assets/'):]:
            continue  # gallery figures are removed from every other template
        if lean and rel == kit.template_page(template):
            continue  # a lean project keeps its page only as index.html
        target = lesson / rel
        kit_sha = kit.sha256(source)
        if not target.is_file():
            status = 'add' if not legacy or is_core(kit, rel) else 'available'
            rows.append({'path': rel, 'status': status, 'source': source, 'kit': kit_sha, 'current': None})
            continue
        current = kit.sha256(target)
        if current == kit_sha:
            status = 'same'
        elif recorded.get(rel) == current:
            status = 'update'
        else:
            status = 'conflict'
        rows.append({'path': rel, 'status': status, 'source': source, 'kit': kit_sha, 'current': current})
    return manifest, rows, template, lean


def apply(lesson, kit, manifest, rows, force=False):
    stamp = time.strftime('%Y%m%d-%H%M%S')
    backup = lesson / '.vlk-upgrade-backup' / (str(manifest.get('version', 'unknown')) + '-' + stamp)
    files = {}
    applied = 0
    for row in rows:
        replace = row['status'] in ('add', 'update') or (force and row['status'] == 'conflict')
        target = lesson / row['path']
        if replace:
            if target.is_file():
                (backup / row['path']).parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(target, backup / row['path'])
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(row['source'], target)
            row['applied'] = True
            applied += 1
        if replace or row['status'] == 'same':
            files[row['path']] = row['kit']
    updated = {'kit': 'visual-lesson-kit', 'version': kit.VERSION}
    for key in ('template', 'profile'):
        if manifest.get(key) is not None:
            updated[key] = manifest[key]
    updated['files'] = dict(sorted(files.items()))
    (lesson / 'lesson-kit.json').write_text(json.dumps(updated, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    return applied, backup if applied and backup.exists() else None


def summarize(rows):
    return {status: sum(1 for row in rows if row['status'] == status) for status in STATUSES}


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('lesson', help='Папка урока, созданного create.py')
    parser.add_argument('--apply', action='store_true', help='Записать изменения; без флага только отчёт')
    parser.add_argument('--force', action='store_true', help='Заменять и локально изменённые файлы (резервная копия сохраняется)')
    parser.add_argument('--json', action='store_true', help='Отчёт в формате JSON')
    args = parser.parse_args()
    try:
        kit = load_kit()
        lesson = Path(args.lesson).expanduser().resolve()
        if lesson == ROOT or ROOT in lesson.parents:
            raise ValueError('Обновлять можно только урок за пределами самой библиотеки.')
        manifest, rows, template, lean = plan(lesson, kit)
        applied, backup = (apply(lesson, kit, manifest, rows, args.force) if args.apply else (0, None))
    except (OSError, ValueError) as error:
        parser.exit(1, str(error) + '\n')
    counts = summarize(rows)
    conflicts = [row['path'] for row in rows if row['status'] == 'conflict' and not row.get('applied')]
    report = {'lesson': str(lesson), 'from': manifest.get('version'), 'to': kit.VERSION, 'template': template,
              'profile': 'lean' if lean else ('full' if manifest.get('files') else 'legacy'),
              'applied': applied, 'backup': str(backup) if backup else None, 'counts': counts,
              'rows': [{'path': row['path'], 'status': row['status'], 'applied': bool(row.get('applied'))} for row in rows if row['status'] != 'same']}
    if args.json:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        print(f'Урок: {lesson}\nВерсия: {report["from"]} → {kit.VERSION} · профиль {report["profile"]}' + (f' · шаблон {template}' if template else ''))
        for row in report['rows']:
            print(f'  {row["status"]:9} {row["path"]}' + ('  ✓' if row['applied'] else ''))
        print('Итог: ' + ', '.join(f'{status} {counts[status]}' for status in STATUSES if counts[status]))
        if not args.apply:
            print('Отчёт без записи. Повторите с --apply; локально изменённые файлы (conflict) заменяет только --force.')
        elif conflicts:
            print('Сохранены локально изменённые файлы: ' + ', '.join(conflicts) + '. Сравните их с библиотекой вручную или примените --force.')
        if backup:
            print('Резервные копии заменённых файлов: ' + str(backup))
    if args.apply and conflicts:
        raise SystemExit(2)


if __name__ == '__main__':
    main()
