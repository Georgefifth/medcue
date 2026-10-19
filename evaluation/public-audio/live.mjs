import { readFile, writeFile, access } from 'node:fs/promises';
import { importSrt, DEFAULT_GLOSSARY } from '../../src/core.js';
const root = new URL('./', import.meta.url), output = new URL('gemini-results.json', root);
try { await access(output); throw new Error('Recorded run exists; refusing to repeat API requests.'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const cues = importSrt(await readFile(new URL('antibiotics.srt', root), 'utf8'));
const term = cues.find(c => c.id === 27), negation = cues.find(c => c.id === 65);
const cases = [
  { id: 'term-original', cueId: term.id, kind: 'unaltered-publisher-caption', text: term.text },
  { id: 'term-perturbed', cueId: term.id, kind: 'author-injected-spelling-error-not-ASR', text: term.text.replace('Staphylococcus', 'Staphylococus') },
  { id: 'negation-original', cueId: negation.id, kind: 'unaltered-publisher-caption', text: negation.text },
  { id: 'negation-perturbed', cueId: negation.id, kind: 'author-deleted-negation-not-ASR', text: negation.text.replace(' not ', ' ') },
];
// Freeze the test cases before any inference. Reference captions are withheld.
await writeFile(new URL('live-cases.json', root), JSON.stringify(cases, null, 2) + '\n', { flag: 'wx' });
const base = process.env.MEDCUE_EVAL_URL || 'http://127.0.0.1:8080';
const config = await (await fetch(base + '/api/config')).json();
if (!config.enabled) throw new Error('AI unavailable; no generation requests sent.');
const result = { model: config.model, startedAt: new Date().toISOString(), automaticRetries: false, referenceWithheld: true, audioSent: false, glossary: DEFAULT_GLOSSARY, results: [] };
for (const c of cases) {
  if (result.results.length) await new Promise(r => setTimeout(r, Math.max(16000, config.minimumRequestIntervalMs || 0)));
  const start = Date.now();
  try {
    const response = await fetch(base + '/api/review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: c.text, glossary: DEFAULT_GLOSSARY }), signal: AbortSignal.timeout(50000) });
    const payload = await response.json();
    const item = { ...c, status: response.status, elapsedMs: Date.now() - start, ...(response.ok ? { suggestions: payload.suggestions } : { error: payload.error, retryAfter: response.headers.get('retry-after') }) };
    result.results.push(item);
    console.log(JSON.stringify(item));
    await writeFile(output, JSON.stringify(result, null, 2) + '\n');
    if (!response.ok) break;
  } catch { result.results.push({ id: c.id, error: 'Transport failure; no automatic retry.' }); await writeFile(output, JSON.stringify(result, null, 2) + '\n'); break; }
}
