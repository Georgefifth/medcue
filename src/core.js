import { parse } from '@plussub/srt-vtt-parser';

export const DEFAULT_GLOSSARY = 'Metformin | meta formin\nHypoglycemia | hypo glycemia\nHemoglobin\nHaemoglobin\nHbA1c\nMilligram | miligram, miligrams';
export const DEMO_SRT = `1
00:00:00,000 --> 00:00:05,000
Today we will discuss meta formin in this fictional teaching example.

2
00:00:05,000 --> 00:00:10,000
The example label reads 500 mg. Check the number against the recording.

3
00:00:10,000 --> 00:00:15,000
Listen carefully to the term hypo glycemia.

4
00:00:15,000 --> 00:00:20,000
The speaker says this is not an individual treatment recommendation.

5
00:00:20,000 --> 00:00:25,000
Read the original source and confirm every change before publishing.
`;
export function stamp(ms, separator = ',') {
  const total = Math.max(0, Math.round(ms));
  return `${String(Math.floor(total / 3600000)).padStart(2, '0')}:${String(Math.floor(total / 60000) % 60).padStart(2, '0')}:${String(Math.floor(total / 1000) % 60).padStart(2, '0')}${separator}${String(total % 1000).padStart(3, '0')}`;
}
export function importSrt(input) {
  if (typeof input !== 'string' || input.length > 2_000_000) throw new Error('Choose an SRT smaller than 2 MB.');
  const normalized = input.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').trim();
  const blocks = normalized.split(/\n\s*\n/);
  if (!normalized || blocks.length > 5000) throw new Error('Import 1–5,000 subtitle cues.');
  for (let i = 0; i < blocks.length; i++) {
    if (!/^\d+\n\d{2,}:([0-5]\d):([0-5]\d),\d{3} --> \d{2,}:([0-5]\d):([0-5]\d),\d{3}\n[\s\S]+$/.test(blocks[i])) throw new Error(`Cue ${i + 1} is malformed. Use numbered SRT cues and HH:MM:SS,mmm timestamps.`);
  }
  const entries = parse(normalized).entries;
  if (entries.length !== blocks.length) throw new Error('Some subtitle cues could not be read. No cues were imported.');
  let previous = -1;
  return entries.map((e, i) => {
    if (!Number.isFinite(e.from) || !Number.isFinite(e.to) || e.to > 359999999 || e.to <= e.from || e.from < previous || !e.text.trim()) throw new Error(`Cue ${i + 1} has empty text, invalid timing or is out of order.`);
    if (e.text.length > 30000) throw new Error(`Cue ${i + 1} exceeds the 30,000-character project limit. No cues were imported.`);
    previous = e.from;
    return { id: i + 1, from: e.from, to: e.to, original: e.text, text: e.text, reviewed: false };
  });
}
export function exportSrt(cues) {
  if (cues.some(c => !c.text.trim())) throw new Error('A cue is empty. Add subtitle text before exporting.');
  if (cues.some(c => /\n\s*\n/.test(c.text))) throw new Error('Remove blank lines within cue text before exporting. Use a single line break for multiline subtitles.');
  return cues.map((c, i) => `${i + 1}\n${stamp(c.from)} --> ${stamp(c.to)}\n${c.text}`).join('\n\n') + '\n';
}
// A preview is separate from the strict importer: callers must explicitly
// confirm every omitted empty cue. Validate even omitted cues' timing first.
export function previewSrtImport(input) {
  if (typeof input !== 'string' || input.length > 2_000_000) throw new Error('Choose an SRT smaller than 2 MB.');
  const normalized = input.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').trim();
  const blocks = normalized.split(/\n\s*\n/);
  if (!normalized || blocks.length > 5000) throw new Error('Import 1–5,000 subtitle cues.');
  const emptyIndexes = [];
  const validation = blocks.map((block, i) => {
    if (/^\d+\n\d{2,}:\d{2}:\d{2},\d{3} --> \d{2,}:\d{2}:\d{2},\d{3}(?:\n\s*)?$/.test(block)) {
      emptyIndexes.push(i);
      return block.trimEnd() + '\n[empty cue validation placeholder]';
    }
    return block;
  });
  const all = importSrt(validation.join('\n\n'));
  const empty = new Set(emptyIndexes);
  const cues = all.filter((_, i) => !empty.has(i)).map((c, i) => ({ ...c, id: i + 1 }));
  if (!cues.length) throw new Error('This file has no nonempty subtitles. Add text in your subtitle editor before importing.');
  return { cues, emptyCues: emptyIndexes.map(i => ({ sourceNumber: Number(blocks[i].split('\n')[0]), from: all[i].from, to: all[i].to })) };
}
export function glossaryEntries(value) {
  return value.split('\n').filter(l => l.trim()).slice(0, 300).map(line => {
    const [term, ...rest] = line.split('|');
    return { term: term.trim(), aliases: rest.join('|').split(',').map(t => t.trim()).filter(Boolean) };
  }).filter(e => e.term);
}
const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export function inspect(cue, cues, glossary) {
  const findings = [];
  for (const { term, aliases } of glossaryEntries(glossary)) {
    for (const alias of aliases) {
      const matches = [...cue.text.matchAll(new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegex(alias)}(?![\\p{L}\\p{N}])`, 'giu'))];
      if (matches.some(match => match[0] !== term)) {
        findings.push({ type: 'Terms', title: `Check “${alias}”`, detail: `Your glossary maps this spelling to “${term}”. Listen before changing it.`, replacement: term, match: alias });
      }
    }
  }
  if (/\b\d+(?:[.,]\d+)?\s*(?:mg|mcg|µg|g|ml|mL|mmol|mmHg|%|units?|milligrams?)\b|\b\d+(?:\.\d+)?\s*%/i.test(cue.text)) findings.push({ type: 'Numbers', title: 'Verify the quantity and unit', detail: 'Compare the quantity and unit with the recording. This signal does not mean the value is wrong.' });
  if (/\b(?:not|never|without|avoid|contraindicated)\b/i.test(cue.text)) findings.push({ type: 'Meaning', title: 'Listen for the qualifier', detail: 'A negation or qualifier can change the meaning. Confirm it against the audio.' });
  const next = cues[cues.findIndex(c => c.id === cue.id) + 1];
  if (next && cue.to > next.from) findings.push({ type: 'Timing', title: 'Overlapping cues', detail: 'This cue ends after the next cue begins. Timing is preserved; adjust it in your subtitle editor if needed.' });
  if (cue.text.replace(/<[^>]*>/g, '').length / ((cue.to - cue.from) / 1000) > 22) findings.push({ type: 'Timing', title: 'Fast reading pace', detail: 'More than 22 characters per second. Check readability; timing is preserved in this MVP.' });
  return findings;
}
export function replaceAlias(text, match, replacement) {
  return text.replace(new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegex(match)}(?![\\p{L}\\p{N}])`, 'giu'), () => replacement);
}
export function validateProject(value) {
  if (!value || value.format !== 'medcue-1' || !Array.isArray(value.cues) || value.cues.length < 1 || value.cues.length > 5000 || typeof value.glossary !== 'string' || value.glossary.length > 30000) throw new Error('This is not a supported MedCue project.');
  const serialized = value.cues.map((c, i) => {
    if (typeof c.original !== 'string' || typeof c.text !== 'string' || c.text.length > 30000 || c.original.length > 30000 || !Number.isSafeInteger(c.from) || !Number.isSafeInteger(c.to) || c.from < 0 || c.to > 359999999) throw new Error('Project contains an invalid cue.');
    return `${i + 1}\n${stamp(c.from)} --> ${stamp(c.to)}\n${c.original}`;
  }).join('\n\n');
  const originals = importSrt(serialized);
  return { format: 'medcue-1', name: typeof value.name === 'string' ? value.name.slice(0, 160) : 'Restored project', glossary: value.glossary, cues: originals.map((c, i) => ({ ...c, text: value.cues[i].text, reviewed: value.cues[i].reviewed === true })), audit: Array.isArray(value.audit) ? value.audit.filter(a => typeof a === 'string').slice(-1000) : [] };
}
