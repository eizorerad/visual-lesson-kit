#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Assemble the final video: the silent film + the narration placed at each cue,
soft subtitles (the narration text without delivery markup) and chapter markers.

    python3 tools/mux.py [--video media/film-silent.mp4] [--lang ru] [--ffmpeg PATH]

The cue timings come from the page that was rendered (qa/narrated/cues.cjs on
dist/lesson.html); voice clips come from tools/voice.py (media/voice/<key>.wav).
Output: media/<film id>.mp4 and media/<film id>.<lang>.srt.
"""
import argparse
import json
import os
import re
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VOICE = ROOT / 'media' / 'voice'
MARKUP = re.compile(r'\s*\[(?:pause|long pause|chuckle|sigh|breath|laugh)\]\s*')
ISO = {'ru': 'rus', 'en': 'eng'}


def plain(text):
    text = MARKUP.sub(' ', re.sub(r'\{[^}]*\}\s*', '', text))
    return re.sub(r'\s+', ' ', re.sub(r'\*([^*]+)\*', r'\1', text)).strip()


def load_cues(path, page):
    if path:
        return json.loads(Path(path).read_text(encoding='utf-8'))
    out = subprocess.run(['node', str(ROOT / 'qa' / 'narrated' / 'cues.cjs'), page], check=True, capture_output=True, cwd=ROOT)
    return json.loads(out.stdout.decode('utf-8'))


def narration(data, target):
    """One mono track as long as the film, each clip starting LEAD s after its cue arrives."""
    rate, width, frames = None, None, []
    for cue in data['cues']:
        with wave.open(str(VOICE / f"{cue['key']}.wav")) as w:
            if rate is None:
                rate, width = w.getframerate(), w.getsampwidth()
            if (w.getframerate(), w.getsampwidth(), w.getnchannels()) != (rate, width, 1):
                sys.exit('voice clips must share one mono format; re-voice them with one engine')
            frames.append((cue, w.readframes(w.getnframes())))
    total = int(round(data['duration'] * rate)) * width
    track = bytearray(total)
    for i, (cue, pcm) in enumerate(frames):
        start = int(round((cue['arrive'] + data['lead']) * rate)) * width
        end = start + len(pcm)
        limit = int(round(data['cues'][i + 1]['arrive'] * rate)) * width if i + 1 < len(frames) else total
        if end > limit:
            print(f"  warning: {cue['key']} overlaps the next cue by {(end - limit) / width / rate:.2f} s", file=sys.stderr)
        track[start:min(end, total)] = pcm[:max(0, min(end, total) - start)]
    with wave.open(str(target), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(width)
        w.setframerate(rate)
        w.writeframes(bytes(track))


def stamp(seconds):
    ms = int(round(seconds * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f'{h:02d}:{m:02d}:{s:02d},{ms:03d}'


def wrap(text, width=64):
    lines, line = [], ''
    for word in text.split():
        if line and len(line) + 1 + len(word) > width:
            lines.append(line)
            line = word
        else:
            line = (line + ' ' + word).strip()
    lines.append(line)
    return lines


def subtitles(data, target, field):
    """Narration split into sentences, each timed by its share of characters."""
    blocks, n = [], 0
    for cue in data['cues']:
        with wave.open(str(VOICE / f"{cue['key']}.wav")) as w:
            spoken = w.getnframes() / w.getframerate()
        pieces = []
        for s in [s for s in re.split(r'(?<=[.!?…])\s+', plain(cue[field])) if s]:
            while len(s) > 120:
                cut = max(s.rfind(', ', 0, 110), s.rfind(' — ', 0, 110))
                if cut < 40:
                    break
                pieces.append(s[:cut + 1].strip())
                s = s[cut + 1:].strip()
            pieces.append(s)
        chars, t = sum(len(p) for p in pieces) or 1, cue['arrive'] + data['lead']
        for p in pieces:
            d = spoken * len(p) / chars
            n += 1
            blocks.append(f"{n}\n{stamp(t)} --> {stamp(t + d)}\n" + '\n'.join(wrap(p)) + '\n')
            t += d
    target.write_text('\n'.join(blocks), encoding='utf-8')


def chapters(data, target, title, lang):
    lines = [';FFMETADATA1', f'title={title}', f'language={ISO[lang]}']
    starts = []
    for cue in data['cues']:
        if not starts or starts[-1][1] != cue['chapter']:
            starts.append((cue['arrive'], cue['chapter']))
    for i, (start, ch) in enumerate(starts):
        end = starts[i + 1][0] if i + 1 < len(starts) else data['duration']
        lines += ['[CHAPTER]', 'TIMEBASE=1/1000', f'START={int(start * 1000)}', f'END={int(end * 1000)}',
                  f"title={i + 1}. {data['chapters'][ch][lang]}"]
    target.write_text('\n'.join(lines) + '\n', encoding='utf-8')


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--video', default='media/film-silent.mp4')
    parser.add_argument('--page', default='dist/lesson.html')
    parser.add_argument('--cues')
    parser.add_argument('--lang', choices=sorted(ISO), default='ru')
    parser.add_argument('--out', help='default: media/<film id>.mp4')
    parser.add_argument('--ffmpeg', default=os.environ.get('FFMPEG', 'ffmpeg'))
    args = parser.parse_args()
    data = load_cues(args.cues, args.page)
    field = 'voiceRu' if args.lang == 'ru' else 'voiceEn'
    title = (data.get('title') or {}).get(args.lang) or data.get('id', 'film')
    out = Path(args.out) if args.out else ROOT / 'media' / (data.get('id', 'film') + '.mp4')
    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        narration(data, tmp / 'narration.wav')
        subtitles(data, tmp / 'subs.srt', field)
        chapters(data, tmp / 'chapters.txt', title, args.lang)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.with_suffix('.' + args.lang + '.srt').write_text((tmp / 'subs.srt').read_text(encoding='utf-8'), encoding='utf-8')
        subprocess.run([args.ffmpeg, '-y', '-hide_banner', '-loglevel', 'error',
                        '-i', str(ROOT / args.video), '-i', str(tmp / 'narration.wav'), '-i', str(tmp / 'subs.srt'), '-i', str(tmp / 'chapters.txt'),
                        '-map', '0:v', '-map', '1:a', '-map', '2:s', '-map_metadata', '3', '-map_chapters', '3',
                        '-c:v', 'copy', '-c:a', 'aac', '-b:a', '128k', '-ar', '44100', '-c:s', 'mov_text',
                        '-metadata:s:a:0', 'language=' + ISO[args.lang], '-metadata:s:s:0', 'language=' + ISO[args.lang],
                        '-movflags', '+faststart', str(out)], check=True)
    print(f"{out.relative_to(ROOT) if out.is_relative_to(ROOT) else out} · {data['duration'] / 60:.1f} min · {len(data['cues'])} cues · {len(data['chapters'])} chapters")


if __name__ == '__main__':
    main()
