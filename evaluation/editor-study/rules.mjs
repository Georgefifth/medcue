import { readFile, writeFile } from 'node:fs/promises';
import { importSrt, exportSrt, inspect, DEFAULT_GLOSSARY } from '../../src/core.js';
import assert from 'node:assert/strict';
const root = new URL('./', import.meta.url), output = [];
for (const id of ['antibiotics', 'naloxone']) {
  const cues = importSrt(await readFile(new URL(id + '-asr.srt', root), 'utf8'));
  assert.deepEqual(importSrt(exportSrt(cues)), cues);
  const rows = cues.map(c => ({ id: c.id, text: c.text, signals: inspect(c, cues, DEFAULT_GLOSSARY) }));
  const exampleIds = id === 'antibiotics' ? [4, 37] : [59, 93];
  output.push({ id, cueCount: cues.length, roundtripPassed: true, attention: rows.filter(c => c.signals.length).length, signals: rows.filter(c => c.signals.length), selectedExamples: rows.filter(c => exampleIds.includes(c.id)) });
}
await writeFile(new URL('rule-results.json', root), JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify(output.map(({ signals, ...row }) => row), null, 2));
