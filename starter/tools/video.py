#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Turn a narrated film into an MP4 in one command: bundle → cue list → voice →
(optional clip check) → bundle with voice timing → deterministic render → mux.

    python3 tools/video.py --engine say                                   # offline, no key
    GEMINI_API_KEY=... python3 tools/video.py --engine gemini --check     # Gemini API key
    python3 tools/video.py --engine cloud --project=GCP-PROJECT --check   # gcloud login

Needs node with Playwright (PLAYWRIGHT_CHANNEL=chrome uses the installed Chrome) and
ffmpeg with libx264 (--ffmpeg, $FFMPEG, PATH, or `pip install imageio-ffmpeg`).
A video is an optional extra: make one only when the user asks for it.
"""
import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def find_ffmpeg(explicit):
    for candidate in (explicit, os.environ.get('FFMPEG'), shutil.which('ffmpeg')):
        if candidate:
            return candidate
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        sys.exit('ffmpeg not found: pass --ffmpeg, set FFMPEG, or `pip install imageio-ffmpeg`')


def run(*cmd, **kw):
    print('==', ' '.join(str(c) for c in cmd[:4]), flush=True)
    return subprocess.run([str(c) for c in cmd], cwd=ROOT, check=True, **kw)


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--engine', choices=['say', 'gemini', 'cloud'], default='say')
    parser.add_argument('--voice')
    parser.add_argument('--lang', choices=['ru', 'en'], default='ru')
    parser.add_argument('--project', help='cloud: GCP project to bill; also used by --check')
    parser.add_argument('--check', action='store_true', help='let a Gemini model hear every clip before rendering')
    parser.add_argument('--ffmpeg')
    args = parser.parse_args()
    ffmpeg = find_ffmpeg(args.ffmpeg)
    py = sys.executable
    (ROOT / 'qa-output').mkdir(exist_ok=True)
    cues = ROOT / 'qa-output' / 'narrated-cues.json'
    run(py, 'build/bundle.py')
    with open(cues, 'w', encoding='utf-8') as out:
        run('node', 'qa/narrated/cues.cjs', 'dist/lesson.html', stdout=out)
    voice = [py, 'tools/voice.py', '--engine', args.engine, '--lang', args.lang, '--cues', cues]
    if args.voice:
        voice += ['--voice', args.voice]
    if args.project:
        voice += ['--project=' + args.project]
    run(*voice)
    if args.check and args.engine != 'say':
        check = [py, 'tools/voice_check.py'] + (['--vertex', args.project] if args.engine == 'cloud' else [])
        if subprocess.run([str(c) for c in check], cwd=ROOT).returncode:
            sys.exit('the clip check failed to run')
        print('   read media/voice/check.json; re-voice flagged clips with tools/voice.py --only KEY,... and rerun')
    run(py, 'build/bundle.py')
    run(py, 'build/bundle.py', '--check')
    run('node', 'qa/narrated/render.cjs', 'dist/lesson.html', env={**os.environ, 'FFMPEG': ffmpeg})
    run(py, 'tools/mux.py', '--lang', args.lang, '--ffmpeg', ffmpeg)


if __name__ == '__main__':
    main()
