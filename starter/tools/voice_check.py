#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Check narration clips: a Gemini model hears each clip next to the text that was
sent to the voice and lists skipped, repeated or added words, wrong numbers, clearly
mispronounced words and cut-off endings. Neural voices do make such slips (merging
two words into another word, replacing a word by a related term), so run this before
rendering and re-voice flagged clips with `tools/voice.py --only KEY,...`.

    GEMINI_API_KEY=... python3 tools/voice_check.py [--only key1,key2]
    python3 tools/voice_check.py --vertex GCP-PROJECT [--only ...]   # as the gcloud user, no key

Results go to media/voice/check.json. The key is read only from GEMINI_API_KEY.
"""
import argparse
import base64
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MEDIA = ROOT / 'media' / 'voice'
PROMPT = ('You check the narration of a teaching video. Below are the text the narrator had to say and the audio. '
          'Compare them. Report only skipped, repeated or added words, wrong numbers, clearly distorted pronunciation, '
          'a cut-off phrase, long pauses or noise. Different spellings of letter names and abbreviations, expressive short '
          'pauses, a sigh or a chuckle are not problems. Write the problems in the language of the text. '
          'Answer JSON: {"ok": true|false, "problems": ["..."]}.\n\nText:\n')


def request_for(model, body, vertex):
    if vertex:
        token = subprocess.run(['gcloud', 'auth', 'print-access-token'], capture_output=True, text=True, check=True).stdout.strip()
        url = f'https://aiplatform.googleapis.com/v1/projects/{vertex}/locations/global/publishers/google/models/{model}:generateContent'
        headers = {'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json'}
    else:
        url = f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent'
        headers = {'x-goog-api-key': os.environ['GEMINI_API_KEY'], 'Content-Type': 'application/json'}
    return urllib.request.Request(url, data=json.dumps(body).encode('utf-8'), headers=headers)


def judge(path, text, model, vertex=None, attempts=6):
    body = {'contents': [{'role': 'user', 'parts': [
                {'inline_data': {'mime_type': 'audio/wav', 'data': base64.b64encode(path.read_bytes()).decode()}},
                {'text': PROMPT + text}]}],
            'generationConfig': {'responseMimeType': 'application/json'}}
    for attempt in range(attempts):
        try:
            with urllib.request.urlopen(request_for(model, body, vertex), timeout=300) as response:
                data = json.loads(response.read())
            return json.loads(''.join(part.get('text', '') for part in data['candidates'][0]['content']['parts']))
        except (urllib.error.HTTPError, urllib.error.URLError, KeyError, ValueError, TimeoutError) as error:
            if getattr(error, 'code', None) in (400, 401, 402, 403):
                sys.exit(f'the checker was refused: {error}')
            time.sleep(min(60, 5 * 2 ** attempt))
    return {'ok': None, 'problems': ['check failed']}


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--model', help='default: gemini-3.8-flash (key) or gemini-3.1-pro-preview (--vertex)')
    parser.add_argument('--vertex', help='GCP project: check through Vertex AI as the logged-in gcloud user')
    parser.add_argument('--only')
    args = parser.parse_args()
    args.model = args.model or ('gemini-3.1-pro-preview' if args.vertex else 'gemini-3.8-flash')
    if not args.vertex and not os.environ.get('GEMINI_API_KEY'):
        sys.exit('GEMINI_API_KEY is not set (or pass --vertex GCP-PROJECT)')
    manifest = json.loads((MEDIA / 'manifest.json').read_text(encoding='utf-8'))
    keys = args.only.split(',') if args.only else sorted(manifest, key=lambda k: manifest[k]['index'])
    with ThreadPoolExecutor(max_workers=3) as pool:
        report = list(pool.map(lambda key: {'key': key, **judge(MEDIA / f'{key}.wav', manifest[key]['text'], args.model, args.vertex)}, keys))
    for r in report:
        if r.get('ok') is not True:
            print(f"  {r['key']}: " + '; '.join(r.get('problems', [])))
    (MEDIA / 'check.json').write_text(json.dumps(report, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f"{len(report)} clips checked · {sum(r.get('ok') is not True for r in report)} with problems")


if __name__ == '__main__':
    main()
