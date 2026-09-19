#!/usr/bin/env python3
"""Generate bilingual story copy and bundle the standalone ATAC-seq film."""
import json
import subprocess
import sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]
subprocess.run([sys.executable,str(root/'assets/atac/structures/extract.py')]+(['--check'] if '--check' in sys.argv else []),check=True)
subprocess.run([sys.executable,str(root/'build/atac-histone-core.py')]+(['--check'] if '--check' in sys.argv else []),check=True)
copy=json.loads((root/'assets/atac/story-copy.json').read_text())
assert len({r['key'] for r in copy})==len(copy)
for row in copy:
    for lang in ('Ru','En'):
        for field in ('title','caption','note'):
            assert row[field+lang].strip(),(row['key'],field,lang)
    assert row['sourceUrl'].startswith('https://')
content='/* Generated from assets/atac/story-copy.json. */\nwindow.ATAC_COPY='+json.dumps(copy,ensure_ascii=False,separators=(',',':'))+';\n'
p=root/'js/atac-copy.js'
if '--check' in sys.argv:
    assert p.read_text()==content,'Generated copy is stale; run build/atac-film.py'
else:
    p.write_text(content)
subprocess.run([sys.executable,str(root/'build/bundle.py'),*sys.argv[1:]],check=True)
