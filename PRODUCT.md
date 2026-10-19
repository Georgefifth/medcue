# MedCue MVP product specification

## User and job
A teaching assistant or small course-production team already has audio and machine-generated English SRT. They need to locate likely terminology mistakes and verify sensitive quantities without checking a separate spreadsheet while repeatedly scrubbing the audio.

## Core workflow
1. Open a synthetic example or import UTF-8 SRT and a supported audio file.
2. Optionally customize a glossary using `Canonical term | alias, another alias`.
3. Filter review signals, select a cue, replay with context and edit its text.
4. Explicitly mark the cue reviewed. Editing or changing evidence invalidates review.
5. Download the complete SRT, including unreviewed cues, with an explicit pending count. Download a JSON project for portable recovery.

## Signals and AI
Glossary alias matches suggest the canonical spelling. Quantity/unit and negation checks ask for listening; they do not diagnose errors. Subtitle timing checks flag overlap and high reading speed. The configured cloud API or optional self-hosted Ollama model only receives subtitle text and the editor's glossary when the editor requests a review; it cannot hear audio and must not be treated as independent verification. Its suggestions are separate from deterministic signals and always require manual confirmation.

## Deployment
Cloud API is the default testing and demo mode. A small Node server serves the built app and API; a container configuration allows deployment independently of the developer computer. Ollama remains an optional self-hosted mode. Display the configured processing destination before AI use. Keep API secrets out of browser code. Limit review input, output tokens, concurrent calls and per-instance hourly calls. Actual hosting/provider costs require a separate budget.

## Acceptance
- Imports preserve multiline text, cue count and millisecond timestamps. Reject invalid/empty/mixed malformed cues atomically.
- Playback starts with one second of context, stops after the selected cue and reports missing/invalid media.
- Original text remains visible; edits and review states survive browser refresh when storage is available; audio is not persisted.
- A project file restores original/current text, glossary and review decisions with input validation.
- Export preserves cue order and timing, never drops a cue, and blocks empty text.
- A slow/unavailable/malformed AI service produces a recoverable message and does not alter text.
- AI requests display the active cue, preserve editing focus, and discard stale results after edits.
- Cooldowns show a countdown, respect server Retry-After and survive refresh. Waiting never blocks editing/export.
- Regression tests mock AI by default; real provider checks are separate, deliberate runs.
- User-generated strings and model strings are rendered as text.
- Desktop and narrow-screen workflows remain usable with keyboard focus.

## Evaluation before further investment
Recruit five recurring editors; use at least eight consented teaching clips from different speakers. Randomize/counterbalance MedCue vs an existing editor with a configured glossary. Measure total active review time including setup and false-positive handling; independently annotate critical term/number errors. Continue only if median time falls about 30% with no increase in critical errors and editors bring a second project. A small study cannot establish medical safety. No participant study has been conducted.

## Design plan
Palette: ink #192b43, slate #5c6f87, paper #f3f6fb, blue #315ce7, mint #ddf4eb, amber #fff0d6. System humanist sans typography; serif only for the MedCue wordmark. A calm editing desk: a vertical cue list, a central listening/editing surface and a narrower evidence column. The memorable element is an audio strip linked to the selected cue. Avoid marketing hero cards; open into a usable workspace. Review: replace the generic dashboard/stat-card layout with actual subtitle rows, an editable cue and an evidence rail.

## Existing-solutions preflight
Subtitle Edit and Descript already solve general transcription/editing. Reuse @plussub/srt-vtt-parser (MIT), WaveSurfer (BSD-3-Clause), Lucide (ISC) and Vite (MIT). MedCue explores a narrow review workflow, not a new subtitle engine. Sources: https://github.com/plussub/srt-vtt-parser ; https://wavesurfer.xyz/docs/ ; https://nikse.dk/SubtitleEdit/ ; https://www.descript.com/pricing .
