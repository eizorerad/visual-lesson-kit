#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Synthesize the narration of a narrated film and write
js/recipes/narrated/voice-timing.js so that every cue holds long enough for its
narration. Clips are cached by content hash in media/voice/.

Engines (a video is made only when the user asks for one):
  say     macOS `say`, offline, no key (Russian voice Milena, English Samantha):
          python3 tools/voice.py --engine say
  gemini  Gemini API TTS (gemini-3.8-flash-tts) with a Google AI Studio key read
          only from the GEMINI_API_KEY environment variable, never written to disk:
          GEMINI_API_KEY=... python3 tools/voice.py --engine gemini --voice Sulafat
  cloud   Google Cloud Text-to-Speech, Gemini-TTS voices (gemini-3.1-flash-tts-preview),
          as the logged-in gcloud user and billed to a GCP project; no key:
          python3 tools/voice.py --engine cloud --voice Sulafat --project=MY-PROJECT

Delivery markup in the spoken text: a cue's `tone` sets the style; {style} switches
it for the rest of the clip (a new request segment); [pause], [long pause],
[chuckle], [sigh], [breath] become vocal tags; *word* is stressed. `say` ignores it.
Pronunciation of Latin terms for the voice lives in tools/pronunciation.json.
Cue texts come from qa/narrated/cues.cjs (node + Playwright) unless --cues is given.
"""
import argparse
import array
import base64
import hashlib
import io
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request
import wave
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MEDIA = ROOT / 'media' / 'voice'
TIMING = ROOT / 'js' / 'recipes' / 'narrated' / 'voice-timing.js'
PRONUNCIATION = ROOT / 'tools' / 'pronunciation.json'
GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/interactions'
CLOUD_URL = 'https://texttospeech.googleapis.com/v1/text:synthesize'
STYLE = 'engaging science explainer talking to a school student, lively and clear, brisk pace without rushing'
LANGUAGE = {'ru': 'ru-RU', 'en': 'en-US'}
SAY_VOICE = {'ru': 'Milena', 'en': 'Samantha'}

TAGS = {'pause': '<short pause>', 'long pause': '<long pause>', 'chuckle': '<chuckle>',
        'sigh': '<sigh>', 'breath': '<breath>', 'laugh': '<laugh>'}
MARK = re.compile(r'\s*\[(' + '|'.join(TAGS) + r')\]\s*')
# Gemini API tags → Cloud Gemini-TTS markup; unsupported ones become a short pause.
CLOUD_TAGS = {'<short pause>': '[short pause]', '<long pause>': '[long pause]', '<chuckle>': '[laughing]',
              '<laugh>': '[laughing]', '<sigh>': '[sigh]', '<breath>': '[short pause]'}


def load_pronunciation(lang):
    if not PRONUNCIATION.is_file():
        return []
    table = json.loads(PRONUNCIATION.read_text(encoding='utf-8'))
    return [tuple(pair) for pair in table.get(lang, [])]


def speech(text, table, lang='ru'):
    """Latin terms spelled for the voice; for a Russian voice leftovers are reported."""
    for pattern, spoken in table:
        text = re.sub(pattern, spoken, text)
    if lang == 'ru':
        leftover = re.findall(r'[A-Za-z]+', text)
        if leftover:
            print('  note: Latin left for the voice:', ', '.join(sorted(set(leftover))), file=sys.stderr)
    return text


def plain(text):
    """The narration without delivery markup: what subtitles and the checker see."""
    text = re.sub(r'\{[^}]*\}\s*', '', text)
    text = MARK.sub(' ', text)
    text = re.sub(r'\*([^*]+)\*', r'\1', text)
    return re.sub(r'\s+', ' ', text).strip()


def segments(text, tone, tones, table, lang='ru'):
    """Split the narration at {style} markers into (style, TTS text) pairs.
    A marker holds a style string or a name from the film's tone table."""
    out, style = [], tone
    for i, part in enumerate(re.split(r'\{([^}]*)\}', text)):
        if i % 2:
            style = tones.get(part.strip(), part.strip())
            continue
        part = part.strip()
        if not part:
            continue
        # Tags stay out of the pronunciation table; *word* becomes capitals (stress).
        spoken = ''.join(' ' + TAGS[piece] + ' ' if j % 2 else
                         speech(re.sub(r'\*([^*]+)\*', lambda m: m.group(1).upper(), piece), table, lang)
                         for j, piece in enumerate(MARK.split(part)))
        out.append((style, re.sub(r'\s+', ' ', spoken).strip()))
    return out


def duration(path):
    with wave.open(str(path)) as w:
        return w.getnframes() / w.getframerate()


def trim(clip, keep=0.12, threshold=300):
    """Cut leading/trailing silence beyond `keep` seconds (16-bit mono)."""
    with wave.open(str(clip)) as w:
        params, rate = w.getparams(), w.getframerate()
        samples = array.array('h', w.readframes(w.getnframes()))
    loud = [i for i in range(0, len(samples), 64) if abs(samples[i]) > threshold]
    if not loud:
        return
    pad = int(keep * rate)
    samples = samples[max(0, loud[0] - pad):min(len(samples), loud[-1] + pad)]
    with wave.open(str(clip), 'wb') as w:
        w.setparams(params)
        w.writeframes(samples.tobytes())


def say_clip(parts, clip, args):
    text = ' '.join(re.sub(r'<[^>]+>', ' ', t) for _, t in parts)
    subprocess.run(['say', '-v', args.voice, '-r', str(args.rate), '--file-format=WAVE',
                    '--data-format=LEI16@22050', '-o', str(clip), text], check=True)


def post(url, body, headers, label, attempts=6):
    for attempt in range(attempts):
        request = urllib.request.Request(url, data=json.dumps(body).encode('utf-8'), headers=headers())
        try:
            with urllib.request.urlopen(request, timeout=300) as response:
                return json.loads(response.read())
        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError) as error:
            code = getattr(error, 'code', None)
            if code in (400, 401, 402, 403):
                detail = error.read().decode()[:400]
                hint = ' (prepaid credits are used up: top up in AI Studio, or use --engine cloud / say)' if code == 402 else ''
                sys.exit(f'{label}: the service refused the request ({code}){hint}: {detail}')
            wait = min(60, 5 * 2 ** attempt)
            print(f'  retry {label} in {wait} s ({code or error})', file=sys.stderr)
            time.sleep(wait)
    sys.exit(f'{label}: no audio after {attempts} attempts')


def gemini_clip(parts, clip, args):
    key = os.environ.get('GEMINI_API_KEY')
    if not key:
        sys.exit('GEMINI_API_KEY is not set')
    # One text segment per style: the delivery may change inside a cue.
    body = {'model': args.model,
            'input': [{'type': 'user_input', 'content': [
                {'type': 'text', 'text': text, 'annotations': [{'type': 'speech_metadata', 'style': style or args.style}]}
                for style, text in parts]}],
            'response_format': {'type': 'audio'},
            'generation_config': {'speech_config': [{'voice': args.voice}]}}
    data = post(GEMINI_URL, body, lambda: {'x-goog-api-key': key, 'Content-Type': 'application/json'}, clip.stem)
    audio = [c for step in data.get('steps', []) if step.get('type') == 'model_output'
             for c in step.get('content', []) if c.get('type') == 'audio']
    if not audio:
        sys.exit(f'{clip.stem}: no audio in the response')
    clip.write_bytes(base64.b64decode(audio[-1]['data']))
    trim(clip)


_token = {}


def cloud_token():
    if 'value' not in _token:
        out = subprocess.run(['gcloud', 'auth', 'print-access-token'], capture_output=True, text=True)
        if out.returncode:
            sys.exit('gcloud has no valid login; the user runs: gcloud auth login\n' + out.stderr[-300:])
        _token['value'] = out.stdout.strip()
    return _token['value']


def cloud_clip(parts, clip, args):
    """One synthesize call per styled segment (Cloud takes one prompt per request),
    joined with a short gap and a little room after the last word."""
    frames, params = [], None
    headers = lambda: {'Authorization': 'Bearer ' + cloud_token(), 'x-goog-user-project': args.project,
                       'Content-Type': 'application/json'}
    for style, text in parts:
        for tag, markup in CLOUD_TAGS.items():
            text = text.replace(tag, markup)
        body = {'input': {'prompt': 'Read at a lively, natural pace; keep pauses short. Style: ' + (style or args.style), 'text': text},
                'voice': {'languageCode': LANGUAGE[args.lang], 'name': args.voice, 'modelName': args.cloud_model},
                'audioConfig': {'audioEncoding': 'LINEAR16', 'sampleRateHertz': 24000}}
        audio = base64.b64decode(post(CLOUD_URL, body, headers, clip.stem)['audioContent'])
        with wave.open(io.BytesIO(audio)) as w:
            params = params or w.getparams()
            if frames:
                frames.append(b'\0' * int(0.08 * w.getframerate()) * w.getsampwidth())
            frames.append(w.readframes(w.getnframes()))
    frames.append(b'\0' * int(0.15 * params.framerate) * params.sampwidth)
    with wave.open(str(clip), 'wb') as w:
        w.setparams(params)
        w.writeframes(b''.join(frames))
    trim(clip)


def load_cues(path, page):
    if path:
        return json.loads(Path(path).read_text(encoding='utf-8'))
    out = subprocess.run(['node', str(ROOT / 'qa' / 'narrated' / 'cues.cjs'), page], check=True, capture_output=True, cwd=ROOT)
    return json.loads(out.stdout.decode('utf-8'))


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--cues', help='JSON from qa/narrated/cues.cjs (default: run it on --page)')
    parser.add_argument('--page', default='index.html')
    parser.add_argument('--engine', choices=['say', 'gemini', 'cloud'], default='say')
    parser.add_argument('--lang', choices=sorted(LANGUAGE), default='ru', help='narration language (voice text of that language)')
    parser.add_argument('--voice', help='say: Milena/Samantha; gemini and cloud: a prebuilt voice such as Sulafat or Kore')
    parser.add_argument('--rate', type=int, default=185, help='say words-per-minute setting')
    parser.add_argument('--model', default='gemini-3.8-flash-tts', help='gemini: model')
    parser.add_argument('--cloud-model', default='gemini-3.1-flash-tts-preview', help='cloud: Gemini-TTS model name')
    parser.add_argument('--project', help='cloud: the GCP project to bill (default: gcloud config project)')
    parser.add_argument('--style', default=STYLE, help='default delivery when a cue has no tone')
    parser.add_argument('--workers', type=int, default=3, help='parallel requests for gemini/cloud')
    parser.add_argument('--only', help='comma-separated cue keys to (re)synthesize regardless of the cache')
    args = parser.parse_args()
    args.voice = args.voice or (SAY_VOICE[args.lang] if args.engine == 'say' else 'Sulafat')
    if args.engine == 'cloud' and not args.project:
        args.project = subprocess.run(['gcloud', 'config', 'get-value', 'project'], capture_output=True, text=True).stdout.strip()
        if not args.project:
            sys.exit('cloud: pass --project=GCP-PROJECT')
    model = {'say': str(args.rate), 'gemini': args.model, 'cloud': args.cloud_model}[args.engine]
    data = load_cues(args.cues, args.page)
    table = load_pronunciation(args.lang)
    tones = data.get('tones', {})
    field = 'voiceRu' if args.lang == 'ru' else 'voiceEn'
    MEDIA.mkdir(parents=True, exist_ok=True)
    manifest_path = MEDIA / 'manifest.json'
    manifest = json.loads(manifest_path.read_text(encoding='utf-8')) if manifest_path.exists() else {}
    forced = set(args.only.split(',')) if args.only else set()
    jobs, entries = [], []
    for i, cue in enumerate(data['cues']):
        parts = segments(cue[field], cue.get('tone') or args.style, tones, table, args.lang)
        text = speech(plain(cue[field]), table, 'en')
        setting = f'{args.engine}|{model}|{args.voice}|{args.lang}'
        digest = hashlib.sha1(f"{setting}|{json.dumps(parts, ensure_ascii=False)}".encode('utf-8')).hexdigest()[:12]
        clip = MEDIA / f"{cue['key']}.wav"
        entry = manifest.get(cue['key'])
        if cue['key'] in forced or not (entry and entry.get('hash') == digest and clip.exists()):
            jobs.append((parts, clip))
        entries.append((i, cue['key'], text, clip, digest, parts))
    synth = {'say': say_clip, 'gemini': gemini_clip, 'cloud': cloud_clip}[args.engine]
    with ThreadPoolExecutor(max_workers=1 if args.engine == 'say' else args.workers) as pool:
        for n, (parts, clip) in enumerate(pool.map(lambda job: (synth(job[0], job[1], args), job)[1], jobs), 1):
            print(f'  {n:>2}/{len(jobs)} {clip.stem}: {duration(clip):.1f} s', flush=True)
    timing = {}
    for i, key, text, clip, digest, parts in entries:
        seconds = round(duration(clip), 2)
        manifest[key] = {'hash': digest, 'seconds': seconds, 'text': text, 'index': i, 'engine': args.engine,
                         'voice': args.voice, 'lang': args.lang, 'styles': [style for style, _ in parts]}
        timing[key] = seconds
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=1), encoding='utf-8')
    TIMING.write_text('/* Generated by tools/voice.py: narration length in seconds per cue key. */\n'
                      f'window.NARRATED_VOICE = {json.dumps(timing, ensure_ascii=False, indent=1)};\n', encoding='utf-8')
    total = sum(timing.values())
    print(f'{len(timing)} clips ({len(jobs)} synthesized) · narration {total/60:.1f} min · {TIMING.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
