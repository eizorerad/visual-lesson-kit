#!/usr/bin/env python3
"""Build every standalone example, or verify that fresh builds match examples/checksums.json.

The HTML files are reproducible build products of the tracked sources, so they
are not committed; their SHA-256 digests are. `--check` rebuilds each example
into a temporary file and compares its digest with the recorded one, which is
what continuous integration runs before publishing the examples.
"""
import argparse
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXAMPLES = ROOT / 'examples'
CHECKSUMS = EXAMPLES / 'checksums.json'
BUILDERS = sorted(path for path in (ROOT / 'tools').glob('build-*.py') if path.name not in ('build-examples.py', 'build-rna-structures.py'))


def outputs_of(builder):
    """Example files a builder writes, read from its source without running it."""
    text = builder.read_text(encoding='utf-8')
    names = re.findall(r"examples/([\w-]+\.html)", text)
    names += [f'{template}.html' for template in re.findall(r"\('([\w-]+)','[^']*'\)", text) if builder.name == 'build-atac.py']
    return sorted(set(names))


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--check', action='store_true', help='Rebuild and compare digests without keeping new files')
    args = parser.parse_args()
    recorded = json.loads(CHECKSUMS.read_text(encoding='utf-8')) if CHECKSUMS.is_file() else {}
    results, failures = {}, []
    for builder in BUILDERS:
        run = subprocess.run([sys.executable, str(builder)], cwd=ROOT, capture_output=True, text=True)
        if run.returncode:
            failures.append(f'{builder.name}: {run.stderr.strip() or run.stdout.strip()}')
            continue
        for name in outputs_of(builder):
            path = EXAMPLES / name
            if not path.is_file():
                failures.append(f'{builder.name} did not write {name}')
                continue
            results[name] = digest(path)
            print(f'{"checked" if args.check else "built"}: examples/{name} ({path.stat().st_size} bytes)')
    if failures:
        parser.exit(1, '\n'.join(failures) + '\n')
    if args.check:
        changed = sorted(name for name, value in results.items() if recorded.get(name) != value)
        missing = sorted(name for name in recorded if name not in results)
        if changed or missing:
            parser.exit(1, 'Examples differ from examples/checksums.json: ' + ', '.join(changed + missing) +
                        '. Run python3 tools/build-examples.py and commit the updated checksums.\n')
        print(f'All {len(results)} examples match examples/checksums.json.')
        return
    CHECKSUMS.write_text(json.dumps(dict(sorted(results.items())), indent=2) + '\n', encoding='utf-8')
    print(f'Recorded {len(results)} digests in examples/checksums.json.')


if __name__ == '__main__':
    main()
