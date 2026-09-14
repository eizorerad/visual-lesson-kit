#!/usr/bin/env python3
"""Build/check the offline fixture registry using the same script shipped to lessons."""
import subprocess
import sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
if __name__ == '__main__':
    raise SystemExit(subprocess.call([sys.executable, str(ROOT / 'starter/build/rna-structures.py'), *sys.argv[1:]]))
