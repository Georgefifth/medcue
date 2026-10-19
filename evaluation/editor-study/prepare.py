"""Prepare genuine YouTube ASR without repeating rolling caption text.

The last nonempty payload line of each substantive display cue is retained.
Previous-line roll-ups and 10-ms duplicate display frames are discarded.
Single-word fresh lines without inline timestamps are retained.
No spelling, punctuation or semantic repair is performed.
"""
import hashlib
import html
import json
import pathlib
import re
import difflib

root = pathlib.Path(__file__).resolve().parent
source = root.parent / 'public-audio'

def ms(stamp):
    h, m, s = stamp.replace(',', '.').split(':')
    return round((int(h) * 3600 + int(m) * 60 + float(s)) * 1000)

def stamp(value):
    h, value = divmod(value, 3600000)
    m, value = divmod(value, 60000)
    s, value = divmod(value, 1000)
    return f'{h:02}:{m:02}:{s:02},{value:03}'

def tokens(text):
    return re.findall(r"[a-z0-9]+(?:'[a-z]+)?", text.lower().replace('’', "'"))

summary = {'downloadedAt': '2026-10-19', 'origin': 'YouTube automatic captions, downloaded with yt-dlp --write-auto-subs --skip-download --sub-langs en --sub-format vtt', 'normalization': 'Lowercase, normalize apostrophes, strip punctuation. No number expansion or clinical normalization. Differences are lexical, not clinically labeled.', 'samples': []}
for name, video in [('antibiotics', 'oLPAodRN1b0'), ('naloxone', 'cssRZEI9ujY')]:
    path = source / (name + '-youtube.en.vtt')
    raw = path.read_text(encoding='utf-8-sig')
    segments = []
    for block in re.split(r'(?m)(?=^\d{2}:\d{2}:\d{2}\.\d{3} -->)', raw.strip()):
        lines = block.splitlines()
        if not lines or '-->' not in lines[0]:
            continue
        timing = re.match(r'(\S+) --> (\S+)', lines[0])
        if ms(timing[2]) - ms(timing[1]) <= 20:
            continue
        payload = [line for line in lines[1:] if line.strip()]
        if not payload:
            continue
        fresh = payload[-1:]
        text = html.unescape(re.sub(r'<[^>]+>', '', ' '.join(fresh))).strip()
        segments.append({'id': len(segments) + 1, 'from': ms(timing[1]), 'to': ms(timing[2]), 'text': text})
    assert len(segments) > 50
    if name == 'antibiotics':
        assert any(s['text'] == 'coming' for s in segments)
        assert any(s['text'] == 'preparation' for s in segments)
    assert segments[0]['from'] < 1000, 'Leading ASR text must survive whitespace-only payload lines'
    assert all(a['to'] <= b['from'] for a, b in zip(segments, segments[1:]))
    srt = '\n\n'.join(f"{s['id']}\n{stamp(s['from'])} --> {stamp(s['to'])}\n{s['text']}" for s in segments) + '\n'
    (root / (name + '-asr.srt')).write_text(srt)
    (root / (name + '-asr-segments.json')).write_text(json.dumps(segments, indent=2) + '\n')
    ref_path = source / ('naloxone-review.srt' if name == 'naloxone' else 'antibiotics.srt')
    reference = ' '.join(' '.join(b.splitlines()[2:]) for b in re.split(r'\n\s*\n', ref_path.read_text(encoding='utf-8-sig').replace('\r\n', '\n').strip()))
    a, b = tokens(reference), tokens(' '.join(s['text'] for s in segments))
    diffs = []
    for op, i, j, k, l in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes():
        if op != 'equal':
            diffs.append({'operation': op, 'reference': ' '.join(a[i:j]), 'asr': ' '.join(b[k:l]), 'referenceRange': [i, j], 'asrRange': [k, l]})
    summary['samples'].append({'id': name, 'video': 'https://www.youtube.com/watch?v=' + video, 'vttSha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'asrCues': len(segments), 'referenceTokens': len(a), 'asrTokens': len(b), 'lexicalDifferenceGroups': len(diffs), 'differences': diffs})
(root / 'natural-asr-differences.json').write_text(json.dumps(summary, indent=2) + '\n')
print(json.dumps([{k: v for k, v in s.items() if k != 'differences'} for s in summary['samples']], indent=2))
