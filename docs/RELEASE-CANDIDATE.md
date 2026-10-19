# Submission polish - 19 October 2026

## Scope and acceptance

Continue the established recording/document visual direction. Keep the Vite/WaveSurfer/parser architecture, project format and effective review controls. No new dashboard, transcription, medical truth claims or inference dependency. Existing WaveSurfer playback and browser storage already provide the required foundation; a new persistence library or audio service would add unnecessary scope.

| Priority | Previous behavior | Change | Acceptance |
|---|---|---|---|
| P1 | Restoring example audio through “Recording example” replaced the project after confirmation | Separate **Restore example audio** in the empty audio area | All original texts and timestamps must match the built-in example. A successful restore keeps the serialized project byte-for-byte, selected cue, edits, review decisions and audit. Failed loading preserves work and allows retry. A same-named but mismatched project is not offered the audio. |
| P1 | Reload returned to cue 1 | Persist selected cue separately from the saved project format | Reload returns to the selected valid cue. New projects reset to cue 1. Audio still requires explicit attachment. No model request. |
| P1 | Undo after Review & next restored the decision but stayed on the next cue | Store cue position with each in-memory undo snapshot | Undo returns to the decision's original cue and restores its state. Existing edit-group undo and search-scoped advance still pass. |
| P2 | An imported single cue could exceed the project validator's 30,000-character limit | Reject over-limit imports atomically; apply the same editor limit | The 30,000-character boundary round-trips; 30,001 rejects. No silent truncation of imported text. |
| P2 | Submission materials not collected in one place | One-page English PDF and a truthful recording script | Exactly one visually checked PDF page with embedded fonts; video remains explicitly unrecorded. Public editing and server-only AI distinguished. |

The audio recovery notice occupies the existing recording panel and disappears when audio is ready. It is a task-specific recovery action, not a new page. The site makes no new request to an AI provider. Example metadata and audio are same-origin static resources with a 25-second load timeout. The original **Recording example** replacement flow remains available with confirmation.

## Local verification

- 22 core/API checks passed: 9 core and 13 mocked API checks.
- 14 browser regressions passed, including two new recovery/matching cases and stronger undo navigation assertions.
- Server and Pages production builds passed.
- Static `/medcue/` smoke checks playback, undo navigation, refresh position, byte-identical project retention after audio restoration, reviewed export, 390-pixel layout, and zero API/POST requests, page errors or failed responses.
- One-page PDF rendered and visually inspected. Text checked separately.

The earlier full 257-cue natural-ASR evaluation remains historical evidence, with its original limitations; it was not repeated to inflate this release's results. No live model calls, paid services, human participants or medical expert validation were used for this release.

## Release decision

Recommend freezing functionality after the deployed checks pass. The largest remaining uncertainties concern independent usability, demand and quality of error detection; additional interface features cannot resolve them. Prepare the narrated demonstration and clearly explain the optional AI deployment boundary. Submission instructions and the remaining materials are in [SUBMISSION.md](SUBMISSION.md). Actual release/deployment observations are recorded in `verification.json` under `submissionPolish`.
