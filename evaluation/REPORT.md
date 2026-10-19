# MedCue exploratory validation report

Date: 2026-10-19. Model: gemini-3.5-flash-lite. Fixture set and six live cases were frozen before inference. See [protocol](PROTOCOL.md), [fixtures](fixtures.json), [raw rule results](rules-baseline.json) and [raw live output](gemini-live.json).

## Decision

Continue only to a small real-audio/editor pilot. Do not expand features or claim time savings yet. AI demonstrated a useful spelling suggestion outside the alias table in one selected case; it did not establish source fidelity. The current product is an attention and terminology aid, not a detector of all critical subtitle errors.

## What was actually tested

24 author-adapted/fictional text cues, not actual ASR output. References came from publicly accessible patient/medical education pages, including published video transcripts. No audio was downloaded or listened to, no human editor was timed, and no clinician independently adjudicated the labels. All timestamps are synthetic. The original reference text was withheld from the model, matching the app's current one-cue input. This is a text stress test, not the proposed real-course efficacy study.

## Deterministic baseline

- Planted spelling errors receiving a Terms signal: **3/8**. All three were known aliases.
- Unseen spellings receiving a Terms signal: **0/5**.
- Clean controls receiving any attention signal: **3/10**. Quantity/negation prompts are intentional checks, not error accusations. One default replacement suggestion needlessly standardized valid UK spelling.
- Audio-dependent alterations receiving any signal: **1/6**. This is retrieval only, not correct recovery of the original.
- SRT import/export of all 24 cues and timestamps: **passed**.

## Six preselected live checks

All 6/6 requests completed with HTTP 200. Median latency: **993 ms**, range **774–1204 ms**. Requests were serial and spaced by at least 16 seconds plus inference time. No retries, batch request or model fallback. This run made six generation requests. Actual token totals are unavailable because the application does not forward provider usage; no token-cost estimate is asserted.

| Case | Rule attention | API | Latency | Developer adjudication |
|---|---|---|---|---|
| E01 | Terms | 200 | 1003 ms | Targets the planted known alias. |
| E04 | None | 200 | 831 ms | Targets the planted unseen misspelling; useful beyond alias matching. |
| C01 | Terms | 200 | 774 ms | No suggestion for valid UK spelling. |
| C04 | Numbers, Meaning | 200 | 983 ms | An attention request on a correct decimal comparison; extra review work, not a correction. |
| A01 | None | 200 | 1204 ms | Deleted negation is missed. Correct reference was unavailable to the model. |
| A03 | Numbers | 200 | 1013 ms | Flags a quantity, but does not identify the missing decimal or recover the reference. Not counted as a verified correction. |

On the two selected spelling-error cases, AI targeted both planted spans; rules targeted one. This is **2 examples**, not a 100% accuracy claim. Of the two clean live controls, one received an AI attention request. On the two source-dependent cases, neither original alteration was established: the negation was missed, and the quantity warning did not recover the decimal. Alert count is not accuracy.

## Product change justified by the findings

The original default mapped 'haemoglobin' to 'Hemoglobin', even though NHS teaching materials use 'haemoglobin' correctly. Both are now accepted canonical terms by default. Forced HBA1C capitalization normalization was also removed from defaults; editors may still explicitly request a house style in their own glossary. Existing saved projects retain their own terminology; nothing is silently migrated. This targeted fix does not add the held-out spelling errors to the alias table.

On the **same** clean fixtures, current defaults produce **2/10** attention cases instead of 3/10. The remaining two are intentional number/negation prompts. This is a regression check on reused cases, not evidence of out-of-sample improvement.

## What this evidence does not support

- No measured reduction in editor time or operations; no support for the 30% target yet.
- No measured superiority over Subtitle Edit or Descript configured with the same glossary.
- No representative precision/recall, clinical safety, robustness across accents, languages or specialties.
- No evidence a text-only model can reliably detect a missing negation, plausible wrong number, or valid-but-wrong medical term without the original audio.
- No measured willingness to pay, repeated use or retention.

## Next investment gate

Use the human protocol already in PRODUCT.md: five recurring editors, eight consented clips, actual ASR output and source audio, counterbalanced comparison against the existing tool, independent final-output review. Include setup, false alerts and export time. A simpler glossary-only workflow must be a real comparator. Stop if users spend as much time dismissing/checking signals as they save, if final critical-error rates rise, or if they do not bring a second project. Access to participants and consented samples is still required; no outreach has been sent.

## Public provenance

- [metformin](https://www.niddk.nih.gov/health-information/professionals/diabetes-discoveries-practice/metformin-first-choice): Published video transcript; adapted, not quoted verbatim.
- [hypoglycemia](https://www.niddk.nih.gov/health-information/diabetes/overview/preventing-problems/low-blood-glucose-hypoglycemia): Patient education article; adapted.
- [spirometry](https://www.nhlbi.nih.gov/health/asthma/diagnosis): Patient education article; adapted.
- [haemoglobin](https://www.genomicseducation.hee.nhs.uk/glossary/haemoglobin/): NHS glossary; adapted; establishes valid UK spelling.
- [kidney](https://www.niddk.nih.gov/health-information/professionals/diabetes-discoveries-practice/managing-diabetic-kidney-disease): Published video transcript; adapted.
- [eilo](https://www.nationaljewish.org/education/health-information/multimedia/living-with-asthma/not-all-wheezing-is-asthma): Published video transcript; adapted; context-specific statement.
- [inhaler](https://www.nhlbi.nih.gov/sites/default/files/media/docs/asthgdln_1.pdf): 2007 teaching instructions, page 128; historical wording benchmark, not current medical guidance.
