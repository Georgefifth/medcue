# Submission preparation

## What is ready

- Public interactive editing demo: https://georgefifth.github.io/medcue/
- Source and server setup: https://github.com/Georgefifth/medcue
- One-page project description: [PDF](../output/pdf/medcue-project-description.pdf). The PDF has embedded fonts, one page, working links and a visually checked rendering. It describes shipped features and evaluation limits.
- A narrated 1080p English video has now been rendered locally at `output/demo/medcue-demo.mp4` (approximately 3 minutes 4 seconds), with captions, designed explanations, actual product actions and the NLM source excerpt. It has **not** been uploaded to a video host. The final visual edit is documented in [the storyboard](../output/demo/STORYBOARD.md); the earlier short recording script below remains an optional shorter version. No Devpost entry has been submitted by this project workflow.

The [UnivaBio overview](https://univabio.devpost.com/) lists an interactive project, demo video, one-page PDF and “Github Repository / Code PDF.” The wording on the last item is ambiguous; check the actual submission form for whether a separate code PDF is required. Do not upload `.env`, keys, personal files or dependency/generated directories in a code attachment.

Schedule checked 19 October 2026: the overview and deadline banner say 20 October 2026, 11:45 p.m. EDT (21 October, 11:45 a.m. Malaysia time). The [rules body](https://univabio.devpost.com/rules) still lists an October 7 end date. Treat this as an inconsistency in the organizer's pages; verify the active submission form rather than assuming an extension is guaranteed. Eligibility and any declarations must be completed by the entrant.

## Suggested 90-120 second demonstration

Use the public Pages edition for the editing demonstration and clearly identify any switch to the local server edition. Start with a saved project backup if the browser contains work you want to keep. Never show the environment file or developer tools containing credentials.

| Segment | Show | Suggested narration |
|---|---|---|
| 0-15 s | Open the live site; choose **Try a real recording** | “MedCue helps an education editor check existing subtitles against the source recording. This example uses public National Library of Medicine audio and actual automatic captions.” |
| 15-40 s | Select cue 4; replay normally, then at 0.75×. Read the original and neighboring context. | “Captions can contain plausible-looking mishearings. The source remains visible, and replay stays close to the selected cue.” |
| 40-60 s | After listening, edit `gonorrhea mersa these bedbugs are` to `Gonorrhea. MRSA. These bad bugs are`. Press **Review & next**, then **Undo** to show the original review selection returning. Review again. | “The editor makes the correction. Review and advance is one action, and undo restores both the decision and its cue. No AI edit is applied automatically.” |
| 60-80 s | Refresh. Show the same selected cue and review count. Choose **Restore example audio**. Open cue 4 to show the retained correction. | “A refreshed browser resumes the review. Example audio can be restored without replacing edits or review history. Personal recordings are reattached from the device.” |
| 80-95 s | Export SRT; show pending-review count. Download a project backup if useful. | “Export includes every imported cue with its original timestamps. It does not claim the remaining cues have been reviewed.” |
| 95-120 s | Explain the AI/server boundary, or explicitly switch to the running server edition for one real request if quota is available. | “Optional AI checks text and terminology, never audio. Its suggestions can be wrong. Public Pages offers the local editing workflow; AI requires the server edition. We have functional tests and public-caption evaluations, but no expert accuracy or human productivity study.” |

The demonstrated wording is supported by the separately preserved publisher captions, spanning two publisher cues. Their cue boundaries differ from the automatic captions. This is a preselected walkthrough, not a blind accuracy test. Listen to the recording during recording of the demo rather than presenting the prepared correction as automatic detection.

For an AI segment, use the already configured local server and one explicit **Check with AI** action. Respect the displayed cooldown. If a 429 occurs, show or explain it honestly and keep the working edit/export flow; do not fake a response, retry repeatedly, switch models automatically or imply that Pages runs inference. Existing selected-case results are documented in [the natural-ASR report](../evaluation/editor-study/README.md), including the misplaced warning.

## Suggested positioning

“A focused subtitle review companion for medical education, with original evidence, local audio, manual decisions and optional AI attention cues.”

Avoid: “clinically accurate,” “detects all medical errors,” “75% accurate,” “saves 30% of editing time,” or “better than Subtitle Edit.” These claims are not established. Existing mature editors remain stronger at timing, formats and authoring. The defensible demonstration is a clear, working review loop with preserved source evidence.

## One-page PDF reproduction

Run `python3 scripts/project-brief.py` with `reportlab`, `pypdf` and the system DejaVu Sans/Serif TTF fonts available. Output is `output/pdf/medcue-project-description.pdf`. Render and inspect the regenerated PDF before replacing the checked copy. The generator asserts one page and required section text; those checks alone do not prove layout quality.
