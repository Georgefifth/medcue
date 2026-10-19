# Public audio evaluation — 2026-10-19

The app passed a real-file workflow check using two public NLM health-education videos. This establishes file compatibility and playback behavior, not editor time savings or accuracy on real ASR output.

## Sources and permission

Source: MedlinePlus, National Library of Medicine.

- [How Naloxone Saves Lives in Opioid Overdose](https://medlineplus.gov/medlineplus-videos/how-naloxone-saves-lives-in-opioid-overdose/) (published 2019).
- [Antibiotics vs. Bacteria: Fighting the Resistance](https://medlineplus.gov/medlineplus-videos/antibiotics-vs-bacteria-fighting-the-resistance/) (published 2018).
- [MedlinePlus content-use policy](https://medlineplus.gov/about/using/usingcontent/) explicitly lists MedlinePlus videos among public-domain content that may be reproduced and redistributed. This permission is distinct from the copyrighted A.D.A.M. encyclopedia videos. These samples do not imply NLM endorsement of MedCue.

`sources.json` records original URLs, byte sizes and SHA-256 hashes. Original MP4s and SRTs were downloaded from each official page's media metadata. MP3 derivatives were made with FFmpeg: mono, 24 kHz, libmp3lame quality 4. Their durations include encoder padding. Historical educational statements and statistics are not current medical guidance.

## File and browser results

| Sample | MP3 duration | Imported cues | Cues with rule signals | Round trip |
|---|---:|---:|---:|---|
| Naloxone | 339.696 s | 90 | 1 quantity | Passed |
| Antibiotics | 348.048 s | 81 | 6 qualifiers, 1 quantity | Passed |

Total: 687.744 seconds (11 min 27.744 s), 171 nonempty cues, 8 cues with attention signals. These counts are not errors, sensitivity or specificity; the publisher's captions were not independently audited.

**Source compatibility issue:** the original naloxone SRT contains a 91st cue with timestamps and no text. The app rejects it atomically with “Cue 91 is malformed.” `check.mjs` verifies this rejection and writes a separate `naloxone-review.srt` with only that empty final cue removed (336000–339633 ms). The original remains unchanged. No product parser rules were relaxed and no nonempty caption was dropped. Antibiotics required no preprocessing. An import preview that explains empty cues and offers explicit removal is a concrete candidate for improvement; it is not implemented in this evaluation.

In an isolated Chrome context against the production server at port 8080, both sample pairs passed:

- Import all nonempty subtitles and decode the matching actual speech MP3.
- Seek a nonzero-offset source cue with one second of context, play at 0.75× and 1.25×, automatically pause approximately 0.5 seconds after its end. The test reads actual media time and playback rate, rather than just button labels.
- Edit, undo to source text, mark one cue reviewed, export and parse the download. All 171 texts and timestamps match the imported references.
- No browser errors; no POST requests during the media/workflow test. The owner's browser draft was not changed.

Evidence: `file-results.json`, `browser-results.json`, `naloxone-browser.png`, `antibiotics-browser.png`. Playback was machine-checked; nobody performed a complete auditory correctness review. Screenshots were visually inspected for layout.

## Four live AI checks

The four cases were frozen in `live-cases.json` before inference. The existing server's Gemini configuration and quota guard were used, with at least 16 seconds between calls, no automatic retries and no provider/model switching. All four returned HTTP 200; latencies were 996, 982, 840 and 878 ms. Only selected text and the default glossary were sent; no audio or reference answer was sent. Raw responses are in `gemini-results.json`. Token totals are unavailable through the current adapter.

| Case | Input provenance | Observed response |
|---|---|---|
| Antibiotics cue 27 | Unmodified official caption | No suggestions |
| Same cue, spelling changed | Developer changed `Staphylococcus` to `Staphylococus` | Flagged spelling and named the original spelling |
| Antibiotics cue 65 | Unmodified official caption | No suggestions |
| Same cue, negation deleted | Developer removed `not` | Flagged the altered recommendation using medical knowledge |

The perturbed cases have real source text and timing, but their mistakes were **injected by the developer, not produced by actual ASR**. Two unmodified cases are too few to estimate unwanted suggestions. The negation response makes a medical-inaccuracy claim: treat it as unverified model output, not a clinical verdict. The model neither heard the recording nor independently established its wording. No suggestions were automatically applied.

## Decision and remaining investment gate

**Verified:** public matching audio/caption pairs exist; the core editing loop works on them; the narrow live examples produce relevant reminders. **Reasonable inference:** this can support source-based spot checks. **Still unverified:** performance on naturally occurring ASR errors, reduction in user actions, repeat usage, willingness to adopt, and advantage over Subtitle Edit with a glossary.

Keep the MVP narrow. Next compare the same public clips in MedCue and Subtitle Edit with independent editors and actual ASR output, keeping reference captions hidden. Measure total time, residual source mismatches, and extra checks caused by suggestions. Do not expand features or claim the 30% time-saving target from these tests.

The normal 19 core/API checks, all 8 browser regressions and the production build also passed after this evaluation.

## Reproduce or try the samples

`public-audio-samples.zip` contains two MP3s, the usable SRT pairs, the original naloxone SRT, provenance and this attribution/report. Open `antibiotics.srt` and attach `antibiotics.mp3`, or use `naloxone-review.srt` with `naloxone.mp3`. Audio must be reattached when reopening a saved project.

From the project root, with Python 3, FFmpeg and Chrome installed:

```sh
python3 evaluation/public-audio/download.py
node evaluation/public-audio/check.mjs
# Requires the MedCue production server to be running at port 8080:
node evaluation/public-audio/browser.mjs
```

Large media and the convenience ZIP are ignored by Git. Downloading again checks source bytes before replacing evidence. `live.mjs` refuses to repeat an already recorded generation run. The static app serves only `dist/`; evaluation media are not automatically published.
