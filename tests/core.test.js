import test from 'node:test';
import assert from 'node:assert/strict';
import { importSrt, previewSrtImport, exportSrt, DEFAULT_GLOSSARY, DEMO_SRT, inspect, replaceAlias, validateProject } from '../src/core.js';

test('round trip preserves every timestamp, multiline content and subtitle markup', () => {
  const input = '\uFEFF1\r\n00:01:02,123 --> 00:01:04,987\r\n<i>One</i>\r\nTwo\r\n\r\n2\r\n00:01:05,000 --> 00:01:06,000\r\nFinal cue';
  const cues = importSrt(input);
  assert.equal(cues.length, 2); assert.equal(cues[0].text, '<i>One</i>\nTwo');
  assert.deepEqual(importSrt(exportSrt(cues)), cues);
});
test('rejects partial, invalid and out-of-order files atomically', () => {
  for (const input of ['', DEMO_SRT + '\n6\ninvalid', '1\n00:00:03,000 --> 00:00:02,000\nBad', '1\n00:99:00,000 --> 00:00:05,000\nBad', '1\n00:00:03,000 --> 00:00:04,000\nLater\n\n2\n00:00:01,000 --> 00:00:02,000\nEarlier']) assert.throws(() => importSrt(input));
});
test('empty-cue preview preserves text and timing and never relaxes strict import', () => {
  const raw = '7\n00:00:01,000 --> 00:00:02,000\nKeep this.\n\n8\n00:00:02,000 --> 00:00:03,000\n\n9\n00:00:03,000 --> 00:00:04,000\nTwo\nlines';
  assert.throws(() => importSrt(raw));
  const preview = previewSrtImport(raw);
  assert.deepEqual(preview.emptyCues, [{ sourceNumber: 8, from: 2000, to: 3000 }]);
  assert.deepEqual(preview.cues.map(c => [c.id, c.from, c.to, c.original]), [[1, 1000, 2000, 'Keep this.'], [2, 3000, 4000, 'Two\nlines']]);
  assert.deepEqual(importSrt(exportSrt(preview.cues)), preview.cues);
});
test('preview rejects malformed or invalid empty cues instead of hiding them', () => {
  for (const suffix of ['6\n00:00:30,000 --> 00:00:29,000', '6\n00:99:00,000 --> 00:99:01,000', '6\n00:00:00,000 --> 00:00:01,000', '6\nnot a timestamp']) assert.throws(() => previewSrtImport(DEMO_SRT + '\n' + suffix));
  assert.throws(() => previewSrtImport('1\n00:00:00,000 --> 00:00:01,000'), /no nonempty/);
});
test('only suggests editor-provided aliases at word boundaries', () => {
  const cues = importSrt(DEMO_SRT);
  assert.equal(inspect(cues[0], cues, DEFAULT_GLOSSARY)[0].replacement, 'Metformin');
  assert.equal(replaceAlias('meta formin and meta forminx', 'meta formin', 'Metformin'), 'Metformin and meta forminx');
  assert.equal(inspect({ ...cues[0], text: 'Metformin' }, cues, DEFAULT_GLOSSARY).length, 0);
  assert.equal(replaceAlias('x+y', 'x+y', '$&'), '$&');
  assert.equal(inspect({ ...cues[0], text: 'HbA1c' }, cues, DEFAULT_GLOSSARY).length, 0);
  assert.equal(inspect({ ...cues[0], text: 'HBA1C' }, cues, 'HbA1c | HBA1C')[0].replacement, 'HbA1c');
});
test('default terminology accepts regional spelling and valid acronym capitalization', () => {
  for (const text of ['Haemoglobin carries oxygen.', 'Hemoglobin carries oxygen.', 'The slide says HBA1C.']) {
    const cue = { id: 1, from: 0, to: 10000, text };
    assert.equal(inspect(cue, [cue], DEFAULT_GLOSSARY).filter(s => s.type === 'Terms').length, 0);
  }
});
test('numeric, qualifier and overlap signals do not rewrite content', () => {
  const cues = importSrt('1\n00:00:00,000 --> 00:00:05,000\nDo not use 500 mg.\n\n2\n00:00:04,000 --> 00:00:06,000\nNext');
  assert.deepEqual(inspect(cues[0], cues, '').map(s => s.type), ['Numbers', 'Meaning', 'Timing']);
  assert.equal(cues[0].text, 'Do not use 500 mg.');
});
test('project recovery preserves original, edits and review decisions; rejects malformed data', () => {
  const cues = importSrt(DEMO_SRT); cues[0].text = 'Edited'; cues[0].reviewed = true;
  const p = validateProject({ format: 'medcue-1', cues, glossary: DEFAULT_GLOSSARY, name: 'Example', audit: ['Edited'] });
  assert.equal(p.cues[0].original, cues[0].original); assert.equal(p.cues[0].text, 'Edited'); assert.equal(p.cues[0].reviewed, true);
  assert.throws(() => validateProject({ ...p, cues: [{ ...cues[0], from: -100 }] }));
  assert.throws(() => exportSrt([{ ...cues[0], text: ' ' }]));
  assert.throws(() => exportSrt([{ ...cues[0], text: 'First\n\nSecond' }]));
});

test('import and project recovery share the per-cue text limit', () => {
  const input = text => `1\n00:00:00,000 --> 00:00:05,000\n${text}`;
  const cues = importSrt(input('x'.repeat(30000)));
  assert.equal(validateProject({ format: 'medcue-1', cues, glossary: '', audit: [] }).cues[0].text.length, 30000);
  assert.throws(() => importSrt(input('x'.repeat(30001))), /30,000-character/);
  assert.throws(() => previewSrtImport(input('x'.repeat(30001))), /30,000-character/);
});
