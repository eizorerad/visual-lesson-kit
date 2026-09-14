#!/usr/bin/env python3
"""Select lesson-kit concepts without loading implementation or reference bodies."""
import argparse
import json
import re
import sys
from pathlib import Path


def normalized(text):
    return ' '.join(re.findall(r'[\w]+', text.casefold().replace('ё', 'е'), re.UNICODE))


STOP = set('a an the to of for and or with from in on how using use мне надо нужно как что для и или в на по из с the is'.split())


class Navigator:
    def __init__(self, catalog=None):
        self.catalog_path = Path(catalog or Path(__file__).with_name('catalog.json')).resolve()
        self.guide_root = self.catalog_path.parent.parent
        parent = self.guide_root.parent
        self.runtime_root = parent / 'starter' if (parent / 'starter/index.html').is_file() else parent
        data = json.loads(self.catalog_path.read_text(encoding='utf-8'))
        if data.get('version') != 1:
            raise ValueError('Unsupported navigation catalog version')
        self.branches = data['branches']
        self.concepts = data['concepts']
        self.by_id = {c['id']: c for c in self.concepts}
        if len(self.by_id) != len(self.concepts):
            raise ValueError('Duplicate concept IDs')

    def resolve(self, relative, kind):
        root = self.guide_root if kind == 'guide' else self.runtime_root
        rel = Path(relative)
        if rel.is_absolute() or '..' in rel.parts:
            raise ValueError('References must stay inside the portable guide/runtime')
        target = (root / rel).resolve()
        if not target.is_relative_to(root.resolve()):
            raise ValueError('Reference escapes portable project')
        return target

    def concept(self, identifier):
        if identifier not in self.by_id:
            raise ValueError('Unknown concept: ' + identifier + '. Use the tree or search.')
        return self.by_id[identifier]

    def card(self, identifier):
        c = self.concept(identifier)
        return {k: v for k, v in c.items() if k != 'keywords'} | {
            'guides': [dict(ref, path=str(self.resolve(ref['path'], 'guide'))) for ref in c['guides']],
            'sources': [str(self.resolve(p, 'source')) for p in c['sources']],
            'examples': [str(self.resolve(p, 'source')) for p in c['examples']],
        }

    def tree(self):
        return [dict(branch, concepts=[c['id'] for c in self.concepts if c['branch'] == branch['id']])
                for branch in self.branches]

    def branch(self, identifier):
        if identifier not in {b['id'] for b in self.branches}:
            raise ValueError('Unknown branch: ' + identifier)
        return [{'id': c['id'], 'title': c['title'], 'summary': c['summary'], 'status': c['status']}
                for c in self.concepts if c['branch'] == identifier]

    def search(self, query, limit=3):
        if not 1 <= limit <= 5:
            raise ValueError('Select between 1 and 5 results')
        q = normalized(query)
        words = set(q.split()) - STOP
        if not words:
            return []
        scores = []
        for c in self.concepts:
            title = normalized(c['title'])
            aliases = [normalized(c['id']), title, *(normalized(k) for k in c['keywords'])]
            exact = max((30 * len(alias.split()) for alias in aliases
                         if alias and (' ' + alias + ' ') in (' ' + q + ' ')), default=0)
            terms = set(' '.join(aliases).split()) - STOP
            score = exact + 8 * len(words & terms) + 2 * len(words & set(normalized(c['summary']).split()))
            if score >= 8:
                scores.append((score, c['id']))
        scores.sort(key=lambda item: (-item[0], item[1]))
        if not scores:
            return []
        threshold = max(8, scores[0][0] * .35)
        return [self.card(identifier) for score, identifier in scores if score >= threshold][:limit]

    def _section(self, reference):
        path = self.resolve(reference['path'], 'guide')
        text = path.read_text(encoding='utf-8')
        wanted = reference.get('section')
        if not wanted:
            return text
        lines = text.splitlines(keepends=True)
        start, level = None, None
        fenced = False
        for i, line in enumerate(lines):
            if re.match(r'^\s*(```|~~~)', line):
                fenced = not fenced
            heading = re.match(r'^(#{1,6})\s+(.+?)\s*#*\s*$', line.rstrip('\n')) if not fenced else None
            if not heading:
                continue
            if start is None and heading[2] == wanted:
                start, level = i, len(heading[1])
            elif start is not None and len(heading[1]) <= level:
                return ''.join(lines[start:i])
        if start is None:
            raise ValueError('Missing section ' + repr(wanted) + ' in ' + str(path))
        return ''.join(lines[start:])

    def read_guide(self, identifier, index=1, offset=0, max_chars=6000):
        refs = self.concept(identifier)['guides']
        if not 1 <= index <= len(refs):
            raise ValueError('Guide number is outside this concept card')
        if offset < 0 or not 500 <= max_chars <= 12000:
            raise ValueError('Use offset >= 0 and max-chars between 500 and 12000')
        ref = refs[index - 1]
        text = self._section(ref)
        if offset > len(text):
            raise ValueError('Offset exceeds the selected reference')
        end = min(len(text), offset + max_chars)
        return {'id': identifier, 'path': str(self.resolve(ref['path'], 'guide')),
                'section': ref.get('section'), 'offset': offset, 'total_chars': len(text),
                'next_offset': end if end < len(text) else None, 'text': text[offset:end]}

    def validate(self):
        errors = []
        branches = {b['id'] for b in self.branches}
        if len(branches) != len(self.branches):
            errors.append('Duplicate branch IDs')
        for c in self.concepts:
            if c['branch'] not in branches or c['status'] not in {'ready', 'compose', 'external'}:
                errors.append(c['id'] + ': invalid branch or status')
            for related in c['related']:
                if related not in self.by_id:
                    errors.append(c['id'] + ': unknown related concept ' + related)
            for kind, refs in [('guide', c['guides']), ('source', c['sources']), ('example', c['examples'])]:
                for ref in refs:
                    try:
                        p = self.resolve(ref['path'] if kind == 'guide' else ref, kind)
                        if not p.is_file():
                            raise ValueError('Missing file: ' + str(p))
                        if kind == 'guide':
                            self._section(ref)
                    except (OSError, ValueError) as e:
                        errors.append(c['id'] + ': ' + str(e))
        return errors


def print_card(card):
    print(card['id'] + ' [' + card['status'] + '] — ' + card['title'])
    print(card['summary'])
    for i, ref in enumerate(card['guides'], 1):
        print(f"  Guide {i}: {ref['path']}" + (' :: ' + ref['section'] if ref.get('section') else ''))
    if card['sources']:
        print('  Implementation only when needed: ' + ', '.join(card['sources']))
    if card['examples']:
        print('  Optional examples: ' + ', '.join(card['examples']))
    print('  Scope: ' + card['caveat'])
    if card['related']:
        print('  Related, not automatically loaded: ' + ', '.join(card['related']))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group()
    group.add_argument('--tree', action='store_true')
    group.add_argument('--branch')
    group.add_argument('--show')
    group.add_argument('--read')
    group.add_argument('--check', action='store_true')
    parser.add_argument('query', nargs='*')
    parser.add_argument('--limit', type=int, choices=range(1, 6), default=3)
    parser.add_argument('--guide', type=int, default=1)
    parser.add_argument('--offset', type=int, default=0)
    parser.add_argument('--max-chars', type=int, default=6000)
    parser.add_argument('--json', action='store_true')
    args = parser.parse_args()
    if args.query and any([args.tree, args.branch, args.show, args.read, args.check]):
        parser.error('Use either a search query or a single selection command')
    try:
        nav = Navigator()
        if args.check:
            result = {'errors': nav.validate(), 'concepts': len(nav.concepts)}
        elif args.show:
            result = nav.card(args.show)
        elif args.read:
            result = nav.read_guide(args.read, args.guide, args.offset, args.max_chars)
        elif args.branch:
            result = {'branch': args.branch, 'concepts': nav.branch(args.branch)}
        elif args.query:
            result = {'query': ' '.join(args.query), 'results': nav.search(' '.join(args.query), args.limit),
                      'hint': 'Choose a relevant card, then --read ID. If no match fits, use the tree or compose a new view; no exhaustive scan is required.'}
        else:
            result = {'branches': nav.tree()}
        if args.json:
            print(json.dumps(result, ensure_ascii=False, indent=2))
        elif args.show:
            print_card(result)
        elif args.read:
            print(str(result['path']) + (' :: ' + result['section'] if result['section'] else ''))
            print(result['text'], end='')
            if result['next_offset'] is not None:
                print(f"\n[Excerpt continues: --offset {result['next_offset']}; {result['total_chars']} total characters]")
        elif args.query:
            for i, card in enumerate(result['results']):
                if i:
                    print()
                print_card(card)
            print('\n' + result['hint'])
        elif args.branch:
            for c in result['concepts']:
                print(f"{c['id']} [{c['status']}] — {c['title']}: {c['summary']}")
        elif args.check:
            print(json.dumps(result, ensure_ascii=False))
        else:
            for b in result['branches']:
                print(b['id'] + ' — ' + b['title'] + '\n  ' + ', '.join(b['concepts']))
        return 1 if args.check and result['errors'] else 0
    except (OSError, ValueError, KeyError) as e:
        parser.exit(2, str(e) + '\n')


if __name__ == '__main__':
    sys.exit(main())
