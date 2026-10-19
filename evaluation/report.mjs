import { readFile, writeFile } from 'node:fs/promises';
import { inspect, DEFAULT_GLOSSARY } from '../src/core.js';
const fixture=JSON.parse(await readFile(new URL('./fixtures.json',import.meta.url),'utf8'));
const rules=JSON.parse(await readFile(new URL('./rules-baseline.json',import.meta.url),'utf8'));
const live=JSON.parse(await readFile(new URL('./gemini-live.json',import.meta.url),'utf8'));
const successful=live.results.filter(r=>r.httpStatus===200);
const sorted=successful.map(r=>r.elapsedMs).sort((a,b)=>a-b);
const median=sorted.length%2?sorted[Math.floor(sorted.length/2)]:(sorted[sorted.length/2-1]+sorted[sorted.length/2])/2;
const post=fixture.cases.filter(c=>c.group==='clean').map(c=>{const cue={id:1,from:0,to:15000,text:c.text};return {id:c.id,signals:inspect(cue,[cue],DEFAULT_GLOSSARY)};});
await writeFile(new URL('./default-glossary-regression.json',import.meta.url),JSON.stringify({note:'Same-sample regression only, not a fresh validation set. No further model requests.',cleanCues:post.length,flaggedCleanCues:post.filter(c=>c.signals.length).length,results:post},null,2)+'\n');
const judgement={E01:'Targets the planted known alias.',E04:'Targets the planted unseen misspelling; useful beyond alias matching.',C01:'No suggestion for valid UK spelling.',C04:'An attention request on a correct decimal comparison; extra review work, not a correction.',A01:'Deleted negation is missed. Correct reference was unavailable to the model.',A03:'Flags a quantity, but does not identify the missing decimal or recover the reference. Not counted as a verified correction.'};
const rows=live.results.map(r=>{const rule=rules.results.find(c=>c.id===r.id);return `| ${r.id} | ${rule.signals.map(s=>s.type).join(', ')||'None'} | ${r.httpStatus} | ${r.elapsedMs||'—'} ms | ${judgement[r.id]} |`;}).join('\n');
const report=`# MedCue exploratory validation report

Date: 2026-10-19. Model: ${live.model}. Fixture set and six live cases were frozen before inference. See [protocol](PROTOCOL.md), [fixtures](fixtures.json), [raw rule results](rules-baseline.json) and [raw live output](gemini-live.json).

## Decision

Continue only to a small real-audio/editor pilot. Do not expand features or claim time savings yet. AI demonstrated a useful spelling suggestion outside the alias table in one selected case; it did not establish source fidelity. The current product is an attention and terminology aid, not a detector of all critical subtitle errors.

## What was actually tested

24 author-adapted/fictional text cues, not actual ASR output. References came from publicly accessible patient/medical education pages, including published video transcripts. No audio was downloaded or listened to, no human editor was timed, and no clinician independently adjudicated the labels. All timestamps are synthetic. The original reference text was withheld from the model, matching the app's current one-cue input. This is a text stress test, not the proposed real-course efficacy study.

## Deterministic baseline

- Planted spelling errors receiving a Terms signal: **${rules.summary.spellingFlagged}/${rules.summary.spellingCues}**. All three were known aliases.
- Unseen spellings receiving a Terms signal: **${rules.summary.unseenSpellingFlagged}/${rules.summary.unseenSpellingCases}**.
- Clean controls receiving any attention signal: **${rules.summary.cleanCuesWithAttentionSignals}/${rules.summary.cleanCues}**. Quantity/negation prompts are intentional checks, not error accusations. One default replacement suggestion needlessly standardized valid UK spelling.
- Audio-dependent alterations receiving any signal: **${rules.summary.audioDependentCuesWithSignals}/${rules.summary.audioDependentCues}**. This is retrieval only, not correct recovery of the original.
- SRT import/export of all 24 cues and timestamps: **${rules.roundtripPassed?'passed':'failed'}**.

## Six preselected live checks

All ${successful.length}/${live.results.length} requests completed with HTTP 200. Median latency: **${median} ms**, range **${sorted[0]}–${sorted.at(-1)} ms**. Requests were serial and spaced by at least 16 seconds plus inference time. No retries, batch request or model fallback. This run made six generation requests. Actual token totals are unavailable because the application does not forward provider usage; no token-cost estimate is asserted.

| Case | Rule attention | API | Latency | Developer adjudication |
|---|---|---|---|---|
${rows}

On the two selected spelling-error cases, AI targeted both planted spans; rules targeted one. This is **2 examples**, not a 100% accuracy claim. Of the two clean live controls, one received an AI attention request. On the two source-dependent cases, neither original alteration was established: the negation was missed, and the quantity warning did not recover the decimal. Alert count is not accuracy.

## Product change justified by the findings

The original default mapped 'haemoglobin' to 'Hemoglobin', even though NHS teaching materials use 'haemoglobin' correctly. Both are now accepted canonical terms by default. Forced HBA1C capitalization normalization was also removed from defaults; editors may still explicitly request a house style in their own glossary. Existing saved projects retain their own terminology; nothing is silently migrated. This targeted fix does not add the held-out spelling errors to the alias table.

On the **same** clean fixtures, current defaults produce **${post.filter(c=>c.signals.length).length}/${post.length}** attention cases instead of 3/10. The remaining two are intentional number/negation prompts. This is a regression check on reused cases, not evidence of out-of-sample improvement.

## What this evidence does not support

- No measured reduction in editor time or operations; no support for the 30% target yet.
- No measured superiority over Subtitle Edit or Descript configured with the same glossary.
- No representative precision/recall, clinical safety, robustness across accents, languages or specialties.
- No evidence a text-only model can reliably detect a missing negation, plausible wrong number, or valid-but-wrong medical term without the original audio.
- No measured willingness to pay, repeated use or retention.

## Next investment gate

Use the human protocol already in PRODUCT.md: five recurring editors, eight consented clips, actual ASR output and source audio, counterbalanced comparison against the existing tool, independent final-output review. Include setup, false alerts and export time. A simpler glossary-only workflow must be a real comparator. Stop if users spend as much time dismissing/checking signals as they save, if final critical-error rates rise, or if they do not bring a second project. Access to participants and consented samples is still required; no outreach has been sent.

## Public provenance

${Object.entries(fixture.sources).filter(([,s])=>s.url).map(([key,s])=>`- [${key}](${s.url}): ${s.kind}.`).join('\n')}
`;
await writeFile(new URL('./REPORT.md',import.meta.url),report);
console.log(JSON.stringify({liveRequests:live.results.length,successful:successful.length,medianMs:median,cleanAttentionBefore:3,cleanAttentionAfter:post.filter(c=>c.signals.length).length,report:'evaluation/REPORT.md'}));
