#!/usr/bin/env python3
"""Audit declared local font stacks: uv run --with fonttools --with brotli python tests/check_font_glyphs.py."""
import argparse
import hashlib
import json
import re
import unicodedata
from pathlib import Path
from fontTools.ttLib import TTFont

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--lesson', type=Path, default=Path(__file__).resolve().parents[1] / 'starter')
args = parser.parse_args()
lesson = args.lesson.resolve()
required = set('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
               'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюя'
               'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩαβγδεζηθικλμνξοπρστυφχψω'
               '×±−≤≥≈→←↔∑√∞ᵢⱼℝ∈')
index = (lesson / 'index.html').read_text()
for source in [lesson / 'index.html', *sorted((lesson / 'js').rglob('*.js'))]:
    required.update(c for c in source.read_text() if ord(c) > 126 and unicodedata.category(c)[0] != 'C')
manifest_path = lesson / 'licenses/font-manifest.json'
if not manifest_path.exists() and lesson.name == 'starter':
    manifest_path = lesson.parent / 'licenses/font-manifest.json'
manifest = json.loads(manifest_path.read_text())
inventory = {}
for item in manifest['fonts']:
    path = (lesson / item['path']).resolve()
    assert hashlib.sha256(path.read_bytes()).hexdigest() == item['sha256'], f'Font hash mismatch: {path}'
    with TTFont(path) as font:
        inventory[path] = {**item, 'cmap': set(map(chr, font.getBestCmap()))}

# Audit the default root and both selectable modes independently. Only the kit's
# simple root selectors set shared font stacks; keep specificity and source order
# instead of flattening a conditional serif declaration into the default stack.
modes = {'default': None, 'sans': 'sans', 'serif': 'serif'}
variables_by_mode = {mode: {} for mode in modes}
priorities_by_mode = {mode: {} for mode in modes}
faces = []
root_selector = re.compile(r'(?P<root>:root|html)(?:\[data-font\s*=\s*[\'"]?(?P<font>[\w-]+)[\'"]?\])?')
order = 0
for href in re.findall(r'<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"', index):
    stylesheet = (lesson / href).resolve()
    css = re.sub(r'/\*[\s\S]*?\*/', '', stylesheet.read_text())
    for selectors, block in re.findall(r'([^{}]+)\{([^{}]*)\}', css):
        declarations = re.findall(r'(--[\w-]+)\s*:\s*([^;{}]+)', block)
        if not declarations:
            continue
        for selector in selectors.split(','):
            match = root_selector.fullmatch(selector.strip())
            if not match:
                assert not any(name.startswith('--f-') for name, _ in declarations), (
                    f'Font audit needs support for selector {selector.strip()!r} in {stylesheet}')
                continue
            specificity = (int(match['root'] == ':root') + int(match['font'] is not None),
                           int(match['root'] == 'html'))
            for name, raw_value in declarations:
                order += 1
                value, important = re.subn(r'\s*!important\s*$', '', raw_value)
                priority = (important, *specificity, order)
                for mode, font in modes.items():
                    if match['font'] is not None and match['font'] != font:
                        continue
                    if priority >= priorities_by_mode[mode].get(name, (-1,)):
                        variables_by_mode[mode][name] = value.strip()
                        priorities_by_mode[mode][name] = priority
    for block in re.findall(r'@font-face\s*\{([^}]+)\}', css):
        properties = dict(re.findall(r'([\w-]+)\s*:\s*([^;]+)', block))
        family = properties['font-family'].strip().strip('\'"')
        match = re.search(r'url\([\'\"]?([^\)\'\"]+)', properties['src'])
        assert match, f'Font face has no local source: {family}'
        path = (stylesheet.parent / match[1]).resolve()
        assert path in inventory, f'Font face missing from manifest: {path}'
        item = inventory[path]
        assert family == item['family'], f'Font family differs from manifest: {path}'
        weight = int(properties.get('font-weight', '400'))
        style = properties.get('font-style', 'normal').strip()
        assert weight == item['weight'] and style == item['style'], f'Font face differs from manifest: {path}'
        faces.append({**item, 'weight': weight, 'style': style})
assert len(faces) == len(inventory), 'Every manifest font must have one declared local face'

def resolve(value, variables, seen=()):
    def substitute(match):
        variable = match[1]
        assert variable not in seen, f'Circular font variable: {variable}'
        return resolve(variables[variable], variables, (*seen, variable))
    return re.sub(r'var\((--[\w-]+)\)', substitute, value)

def match_face(family, primary):
    available = [face for face in faces if face['family'] == family]
    if not available:
        return None  # System fonts do not count as offline coverage.
    styles = [face for face in available if face['style'] == primary['style']]
    if not styles:
        styles = [face for face in available if face['style'] == 'normal'] or available
    return min(styles, key=lambda face: (abs(face['weight'] - primary['weight']), face['weight']))

results = []
for mode, variables in variables_by_mode.items():
    for variable in ['--f-text', '--f-math', '--f-sans', '--f-ui', '--f-mono']:
        families = [part.strip().strip('\'"') for part in resolve(variables[variable], variables).split(',')]
        primary_faces = [face for face in faces if face['family'] == families[0]]
        assert primary_faces, f'Stack lacks a bundled primary family: {mode} {variable}'
        missing, fallback_used = set(), {}
        for primary in primary_faces:
            uncovered = required.difference(primary['cmap'])
            for family in families[1:]:
                fallback = match_face(family, primary)
                if fallback:
                    covered = uncovered.intersection(fallback['cmap'])
                    if covered:
                        fallback_used.setdefault(family, set()).update(covered)
                        uncovered.difference_update(covered)
            missing.update(uncovered)
        describe = lambda chars: [f'U+{ord(c):04X} {c}' for c in sorted(chars)]
        results.append({'font_mode': mode, 'stack': variable, 'families': families,
                        'primary_faces_checked': len(primary_faces), 'required': len(required),
                        'fallback_used': {family: describe(chars) for family, chars in fallback_used.items()},
                        'missing': describe(missing)})
print(json.dumps({'method': 'manifest hashes, declared CSS font faces/root stacks by font mode, and fontTools cmap coverage; system fonts excluded',
                  'font_files': len(inventory), 'stacks': results}, ensure_ascii=False, indent=2))
assert not any(result['missing'] for result in results), 'A declared font stack lacks required source glyphs'
