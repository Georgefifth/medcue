import { fileURLToPath } from 'node:url';
import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { importSrt, exportSrt, inspect, DEFAULT_GLOSSARY } from '../../src/core.js';
const root = new URL('./', import.meta.url);
const raw = await readFile(new URL('naloxone.srt', root), 'utf8');
assert.throws(() => importSrt(raw), /Cue 91 is malformed/);
const blocks = raw.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').trim().split(/\n\s*\n/);
assert.equal(blocks.length, 91);
assert.equal(blocks.at(-1), '91\n00:05:36,000 --> 00:05:39,633');
// Explicit test preparation only: keep the original source byte-for-byte.
await writeFile(new URL('naloxone-review.srt', root), blocks.slice(0, -1).join('\n\n') + '\n');
const report = { sourceCaptionType: 'Publisher-provided; not established as automatic ASR', preprocessing: [{ file: 'naloxone.srt', originalRejected: true, change: 'Removed only empty final cue 91 (336000–339633 ms) from a separate review copy. Original retained.', output: 'naloxone-review.srt' }], samples: [] };
for (const id of ['naloxone', 'antibiotics']) {
  const file = id === 'naloxone' ? 'naloxone-review.srt' : 'antibiotics.srt';
  const cues = importSrt(await readFile(new URL(file, root), 'utf8'));
  assert.deepEqual(importSrt(exportSrt(cues)), cues);
  const durationSeconds = Number(JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'json', fileURLToPath(new URL(id + '.mp3', root))], { encoding: 'utf8' })).format.duration);
  assert.ok(cues.at(-1).to / 1000 <= durationSeconds);
  const findings = cues.map(c => ({ cueId: c.id, types: inspect(c, cues, DEFAULT_GLOSSARY).map(s => s.type) })).filter(c => c.types.length);
  report.samples.push({ id, captionFile: file, cueCount: cues.length, durationSeconds, roundtripPassed: true, cuesWithAttentionSignals: findings.length, signalsByType: findings.flatMap(c => c.types).reduce((o, t) => (o[t] = (o[t] || 0) + 1, o), {}), findings });
}
await writeFile(new URL('file-results.json', root), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report.samples.map(({ findings, ...sample }) => sample), null, 2));
