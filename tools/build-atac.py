#!/usr/bin/env python3
"""Reproduce the full ATAC movie and the independent component example."""
import argparse
import importlib.util
import subprocess
import sys
import tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def main():
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--check',action='store_true');args=parser.parse_args()
 spec=importlib.util.spec_from_file_location('atac_creator',ROOT/'create.py');creator=importlib.util.module_from_spec(spec);spec.loader.exec_module(creator)
 for template,title in [('atac-seq','ATAC-seq: от хроматина к карте доступности'),('atac-components','Хроматин и измерения: отдельные компоненты')]:
  with tempfile.TemporaryDirectory(prefix='vlk-atac-') as temp:
   lesson=creator.create(Path(temp)/'lesson',title,source_url='https://doi.org/10.1038/nmeth.2688',source_label='Buenrostro et al., 2013 · ATAC-seq',template=template,palette='ocean')
   subprocess.run([sys.executable,str(lesson/'build/atac-film.py')],check=True,capture_output=True,text=True)
   content=(lesson/'dist/lesson.html').read_bytes();output=ROOT/'examples'/f'{template}.html'
   if args.check:
    if not output.is_file() or output.read_bytes()!=content:parser.exit(1,f'{template} differs from a fresh build.\n')
   else:output.write_bytes(content)
   print(('Verified' if args.check else 'Built')+': '+str(output))
if __name__=='__main__':main()
