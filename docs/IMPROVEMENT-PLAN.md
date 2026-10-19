# Focused improvement plan — 2026-10-19

Audience: an editor reviewing existing English medical-education subtitles against a recording. The job is source fidelity, not diagnosis or medical fact correction. Keep the existing Vite/WaveSurfer/parser architecture and saved project format.

## Design pass 1

- Palette: Paper `#FFFFFF`, Work surface `#EDF2F3`, Ink `#143343`, Action `#126C75`, Evidence `#F6E5A9`, Divider `#D1DDE0`.
- Type: self-hosted Source Sans 3, normal for text and semibold for controls; retain a small Georgia wordmark. Numeric timestamps use tabular figures within the same family.
- Layout: left-aligned transcript, central recording and edit, quieter evidence rail; no marketing hero or metric dashboard.

```text
MedCue       recording stays here                  Export
files/queue | transcript | waveform + playback   | signals
progress   | cue rows   | before / current / after| optional AI
glossary   | search     | original + editable text| limits
project    |           | undo / review / continue|
```

- The distinctive element is the recording strip above the text, tied to actual cue time. Status color means reviewed, pending, or attention; it is not decorative.
- Preserve keyboard focus, responsive reading order, clear buttons and visible limits. Public Pages build offers the complete local editing loop with AI explicitly unavailable.

## Critique and revision before implementation

The current three rounded columns plus a slogan look like a generic SaaS dashboard and waste space on repeated framing. Keep the useful three-column hierarchy, but remove the slogan and pill, use a restrained document surface with smaller corner radii and no decorative shadows, and group the waveform with source context. Do not add imagery, motion, charts or a new navigation system. Source context and real audio are more specific to this job than a new brand illustration.

## Priorities and acceptance

| Priority | Issue / change | Value and cost | Acceptance |
|---|---|---|---|
| P0 | Official NLM SRT rejected for an empty final cue | Blocks real import; small bounded parser preflight | Strict parser remains strict. Preview lists empty cue IDs/times. Cancel leaves existing project untouched. Explicit confirmation imports all nonempty cues and records omissions. Invalid timing/malformed content still rejects atomically. |
| P0 | Textarea replaced on every keystroke | Focus/composition stability; small render change | Same DOM textarea survives typing and composition; original retained, review invalidated, signals and undo update. |
| P1 | Marking reviewed then finding the next cue takes two actions | Repeated action reduction; small navigation change | One button or Ctrl/Cmd+Enter marks and advances to the next matching unreviewed cue; respects search/filter and wraps. Undo restores the decision. Single-cue review/reopen remains. |
| P1 | An isolated cue hides context | Adjacent text is already available; small read-only addition | Show source previous/next text without modifying it or sending it to AI. No extra API consumption or claimed accuracy gain. |
| P1 | Text-only fictional example cannot demonstrate listening | One-click real-file onboarding; small public audio asset | Clearly attributed 37.5-second NLM audio and actual automatic subtitles load together, with loading/failure states and no AI call. Existing fictional fixture remains available. |
| P1 | GitHub Pages has no Node backend | Required honest deployment; small build mode | Relative asset paths work under repository subpath. No `/api` requests or key in static build. Local editing/export work; hosted AI limitation is visible. |
| P2 | Weak hierarchy / small muted labels | Readability and task focus; bounded CSS revision | Review desktop and 390-pixel screenshots; no horizontal overflow, visible focus and reduced-motion support. |

## Measurement boundaries

Record structural before/after checks and action counts, not agent execution time as human efficiency. Reuse the 257-cue natural-ASR round-trip/playback test, core/API regression tests, browser regressions and a hosted static-mode smoke test. No live inference is necessary for these UI fixes. Competition, source details and unresolved risks are in `COMPETITION.md` and `DELIVERY.md`.

## Publication boundary

The application directory has no dedicated Git repository; Git currently resolves to an unrelated home-directory repository. Do not publish or alter that parent repository. Initialize only this new project after inspecting its files. Check the intended GitHub repository before creating it. Use an explicit file allowlist for the initial commit; exclude `.env`, large evaluation media, local absolute-path screenshots/logs and unrelated work. Build only `dist/` for Pages. User explicitly requested repository creation and publication in this turn.

## Subsequent submission pass

The repository and Pages site are now configured; the initial publication boundary above is historical. Reuse them. The bounded continuation, current acceptance and submission materials are in [RELEASE-CANDIDATE.md](RELEASE-CANDIDATE.md) and [SUBMISSION.md](SUBMISSION.md).
