import { readFile, writeFile, access } from 'node:fs/promises';
import { importSrt, DEFAULT_GLOSSARY } from '../../src/core.js';
const root = new URL('./', import.meta.url), output = new URL('gemini-natural-asr.json', root);
try { await access(output); throw new Error('Recorded run exists; refusing to repeat API requests.'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const cases = [];
// Deliberately selected discrepancies, not a random sample or a recall estimate.
for (const [sample, cueId] of [['antibiotics', 4], ['antibiotics', 37], ['naloxone', 59], ['naloxone', 93]]) {
  const cue = importSrt(await readFile(new URL(sample + '-asr.srt', root), 'utf8')).find(c => c.id === cueId);
  cases.push({ sample, cueId, text: cue.text });
}
await writeFile(new URL('live-cases.json', root), JSON.stringify(cases, null, 2) + '\n', { flag: 'wx' });
const base = process.env.MEDCUE_EVAL_URL || 'http://127.0.0.1:8080';
const config = await (await fetch(base + '/api/config')).json();
if (!config.enabled) throw new Error('AI unavailable; no generation requests sent.');
// Canonical study glossary, no aliases harvested from observed errors.
const glossary = DEFAULT_GLOSSARY + '\nNaloxone\nEndorphins\nMRSA\nStaphylococcus aureus\nNIAID';
const result = { model: config.model, startedAt: new Date().toISOString(), automaticRetries: false, referenceWithheld: true, audioSent: false, glossary, selection: 'Four developer-selected natural ASR discrepancies; not blinded or representative', results: [] };
for (const c of cases) {
  if (result.results.length) await new Promise(r => setTimeout(r, Math.max(16000, config.minimumRequestIntervalMs || 0)));
  const start = Date.now();
  try {
    const response = await fetch(base + '/api/review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: c.text, glossary }), signal: AbortSignal.timeout(50000) });
    const payload = await response.json();
    const item = { ...c, status: response.status, elapsedMs: Date.now() - start, ...(response.ok ? { suggestions: payload.suggestions } : { error: payload.error, retryAfter: response.headers.get('retry-after') }) };
    result.results.push(item); console.log(JSON.stringify(item));
    await writeFile(output, JSON.stringify(result, null, 2) + '\n');
    if (!response.ok) break;
  } catch { result.results.push({ ...c, error: 'Transport failure; no automatic retry.' }); await writeFile(output, JSON.stringify(result, null, 2) + '\n'); break; }
}
