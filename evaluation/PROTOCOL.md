# Exploratory validation protocol

## Registered before the live run

- 24 cues: 8 planted spelling errors, 10 clean controls, 6 source/audio-dependent alterations.
- Six live cases selected before inference: E01, E04, C01, C04, A01, A03.
- All cue text is author-adapted from cited teaching/education sources or explicitly fictional. Timestamps are synthetic (15 seconds per cue). Nothing is presented as original ASR output or as a real listening test.
- Public references are provenance for benchmark construction; original reference strings are NOT supplied to the model.
- Glossary frozen from the initial app default plus three canonical domain terms, without adding the held-out misspellings as aliases.
- Baseline: the actual application's deterministic rules, including attention signals. This is NOT a timed comparison with Subtitle Edit or Descript.
- AI: the running application's configured Gemini model, one cue per request, identical frozen glossary, sequential requests at least 16 seconds apart. No batches, retries, extra judging model or provider/model fallback. Stop after any non-200 response.

## Measures

1. Rule retrieval of planted spelling errors: Terms signals on the 8 spelling-error cases. Report known-alias and unseen-alias coverage separately. This is not an estimate of real-world accuracy.
2. Attention cost on clean controls: number of clean cues receiving any rule signal. Number/negation signals are intentional attention requests and must not be called definite false error claims. Separately identify unnecessary replacement suggestions on valid spelling variants.
3. Live AI: preserve each returned quote/reason and latency. Manually inspect whether spelling suggestions target the planted span; describe clean-case suggestions instead of using an opaque aggregate accuracy score.
4. Source-dependent alterations: report whether a cue was flagged, but never infer that an accurate correction was established without audio. In particular, a quantity flag does not prove the original decimal or dose.
5. Operational metrics: request count, HTTP results and wall-clock latency. The application does not forward provider usage fields; do not invent token counts for this run.
6. SRT round-trip: all 24 cues and synthetic timestamps must survive import/export.

## Bias and limits

The developer authored and labeled this small convenience sample. It is not blinded, independently reviewed, statistically representative or clinically validated. Live cases are tiny and language is English only. Source ages vary; historical teaching material is used as transcription provenance, not current treatment advice. There is no recorded audio, observed ASR error distribution, editor task time or retention evidence. An AI can plausibly flag a problematic statement without knowing what was said. Reporting a successful HTTP request is not evidence of product value.

## Next gate: actual editor comparison

Use at least eight consented teaching clips from different speakers, preserve real ASR output and verified transcript references, and recruit five recurring editors. Counterbalance tool order and clip assignment to avoid learning effects. Baseline should be the participant's existing editor configured with the same glossary. Include setup, false alerts and export in total active time. Have an independent reviewer inspect final term/number/negation errors against audio. Record omissions as well as incorrect edits. Continue only after a meaningful median time reduction (target about 30%), no increase in critical errors in the pilot and willingness to bring a second project. A pilot cannot establish medical safety. No recruitment, consent or human study has occurred.
