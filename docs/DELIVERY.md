# Delivery — 2026-10-19

## Completed scope

Five-alternative competition audit and real user-feedback review are in `COMPETITION.md`; bounded design/priorities and acceptance conditions are in `IMPROVEMENT-PLAN.md`. No accounts, paid trials, participant recruitment or new model calls were used for this iteration.

| Change | Before | After | Verified boundary |
|---|---|---|---|
| NLM file with empty final cue | Strict import rejected the whole file | Explicit preview identifies cue 91; cancel preserves draft; confirmation imports all 90 nonempty cues and records omission | Browser export equals the separate 90-cue reference, including all text/timestamps. Invalid empty timing still rejects. |
| Text input | Same textarea node did not survive typing | Same node survives continuous input and simulated composition; grouped undo restores text | Automated DOM identity/focus/undo tests. Real IME/hardware combinations are not exhaustively tested. |
| Review transition | Mark reviewed + select next: 2 actions | Review & next: 1 button action, or Ctrl/Cmd+Enter | Decision, next selection, search scope, focus and undo checked. This is not measured human task-time improvement. |
| Adjacent context | Only selected original shown | Before/after original subtitle visible beside current evidence | No extra files or API request; accuracy benefit unproven. |
| First listening example | Fictional text with no recording | One action loads 14 actual automatic captions and matching 37.5-second NLM audio | Loading failure leaves draft usable; playback and zero inference requests tested. |
| Hosted AI | A static copy would attempt an absent API | Separate Pages build explicitly offers local editing and describes server-only AI | Static subpath smoke has zero API requests/POSTs and no failed responses. No key input or provider endpoint is exposed as a working hosted service. |
| Interface | Generic slogan/card framing; very small secondary labels | Recording/text workspace, self-hosted Source Sans 3, quieter evidence rail, larger labels, useful shortcut hints | Desktop/mobile screenshots inspected; no overflow at 390 px. No user preference claim. |

## Verification

- 21 core/API checks passed (8 core, 13 API).
- 12 browser regressions passed (8 retained, 4 new).
- Normal and Pages production builds passed.
- Local static smoke under `/medcue/` passed: sample audio ready in 162 ms in one automation observation, selected-cue playback, edited 14-cue export with original timestamps, one-action review/advance, no page errors, no failed responses, no API/POST requests, and no horizontal overflow at 390 px. This one local observation is not a network or user-efficiency benchmark.
- Historical 257-cue natural-ASR checks remain separately documented. The new source context and navigation controls have not been independently shown to improve error detection.

## Publication

The directory originally inherited an unrelated home-directory Git repository, with no tracked project files and no project remote. Only this project was initialized as its own repository; the parent repository and other local projects were not published or modified.

The target `Georgefifth/medcue` did not exist at the initial check. Repository creation, static deployment and hosted verification are pending at this document's initial preparation. Actual status and links will be recorded after publication; no public success is claimed here yet.

## Remaining limits

GitHub Pages cannot run the Node API or protect a key placed in browser JavaScript. The hosted edition intentionally has no AI inference, transcription, database or cloud sync. The local/self-hosted server edition retains compatible cloud APIs and optional Ollama. No public backend was deployed. Provider quotas are not guaranteed by local caps and reset per process.

This is not a comprehensive subtitle editor or a validated medical-correction system. Prior natural-ASR testing found both relevant AI leads and a misplaced warning on a correct term. We did not train aliases on those observed errors or repeat inference to manufacture a better result. Human time savings, retention, market demand and switching preference remain unverified. Existing tools retain substantial advantages in retiming, formats, authoring and collaboration.
