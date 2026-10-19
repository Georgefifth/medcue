# Competition and workflow audit — 2026-10-19

Scope: existing English subtitle review against an education recording. Public-source research only. Pricing is an observed snapshot, not an offer or recommendation to purchase. No paid service or new account was used. “Documented” is distinct from a tested behavior; speed is not inferred from marketing.

## Five alternatives

| Alternative | Verified/documented strengths | Observed price / limits | Where it is stronger than MedCue | Evidence and access |
|---|---|---|---|---|
| Subtitle Edit | Free/open-source editor; waveform, timing, text editing, sync and format conversion. The online edition imported the 134-cue natural-ASR file, played the same MP3 with a waveform, and accepted an MRSA edit in the earlier walkthrough. | Free. Desktop installation/media dependencies can require setup. Do not confuse desktop features with online features. | Timing correction, broad format support, mature editing commands. We have no demonstrated superiority on general subtitling. | [Official overview](https://subtitleedit.github.io/subtitleedit/overview.html), [FAQ](https://github.com/SubtitleEdit/subtitleedit/blob/main/docs/faq.md), [public online editor](https://www.nikse.dk/subtitleedit/online). Earlier local evidence: `evaluation/editor-study/README.md`. |
| Subtitle-editor.org | Browser/local-file editing, SRT/VTT, multi-track workflow, waveform, undo/redo and shortcuts. In this turn the actual public editor imported the same file and displayed **134 subtitles**. The UI exposes edit text/timestamps, add/merge/delete, find/replace, save and audio loading. | Free, MIT; no signup required. UI recommends at least 1024 px and offers “Proceed anyway” on the available narrow viewport. | Direct retiming, track operations, documented keyboard conventions, clearer codec limitations. We did not test its media playback or export integrity in this turn. | [Official repository](https://github.com/laubonghaudoi/subtitle-editor), [live editor](https://subtitle-editor.org/), [real shortcut request](https://github.com/laubonghaudoi/subtitle-editor/issues/22). |
| Aegisub | Documented waveform/spectrogram and specialized timing modes, styling, subtitle editing and automation. | Free/open source desktop software. Native setup; primarily a subtitling authoring workflow. | Timing/typesetting precision and configurable audio workflow; these are outside our narrow review scope. | [Official docs](https://aegisub.org/docs/latest/main_page/), [audio workflow](https://aegisub.org/docs/latest/audio/). Documentation reviewed; no native runtime trial. |
| Descript | Official product supports transcript-based media editing, captions, speaker detection and a broad creation workflow. | Pricing page: Free has 60 media minutes/month and 100 one-time AI credits; Hobbyist shows $16/person/month annually vs $24 monthly, 10 media hours/month and 400 monthly AI credits. Creator shows $24 annually vs $35 monthly. | Integrated media/transcription-to-edit workflow and collaboration. Those can eliminate handoffs that MedCue still requires. | [Official pricing/features](https://www.descript.com/pricing). Login/account workflow was not trialed; no speed or accuracy claim adopted. |
| HappyScribe | Official plans document transcription/subtitling, collaborative editing, speaker detection, exports and human proofreading. | Free includes a 10-minute AI transcription/subtitling/translation trial; Basic shows $8.50/month billed annually, 120 AI minutes/month and $0.20/min top-ups. Human proofreading starts at $2/min. Export/seat limits vary by tier. | End-to-end service, collaboration, multiple output formats and optional human review. | [Official pricing and feature table](https://www.happyscribe.com/pricing). No signup, upload, paid proofread or performance trial. |

## Real feedback, interpreted conservatively

- A recurring user of subtitle-editor.org asks to combine finishing an edit, moving to the next subtitle and editing again, and to control playback without abandoning text input ([issue 22](https://github.com/laubonghaudoi/subtitle-editor/issues/22), opened 2025-10-14). This supports investigating repeated-action friction; it does not prove demand for a separate medical product. The current live app already documents several shortcuts, so do not claim it has none.
- Subtitle Edit has a [closed 2023 undo regression report](https://github.com/SubtitleEdit/subtitleedit/issues/6844). It motivates preserving predictable undo and testing input stability; it is not evidence the current release still has the bug. Its [current changelog](https://github.com/SubtitleEdit/subtitleedit/blob/main/Changelog.txt) also documents continuing improvements.
- A [Descript user discussion](https://www.reddit.com/r/Descript/comments/1up5t5f/descript_seems_to_be_another_ai_trap_for_creators/) describes unexpectedly consuming AI credits. A participant identifying as Descript staff acknowledges first-use trial costs, describes manual alternatives, and points to an existing option for showing usage. This is anecdotal feedback, not prevalence evidence. It supports deliberate opt-in requests and visible limits; it does not justify calling paid tools deceptive.
- Some subtitle-editor.org open requests are maintainer-authored and labeled `codex`. They are a public roadmap, not independent market demand. We relied on the separately authored shortcut report rather than treating all issues as user complaints.

## Interaction / speed / visual comparison

| Aspect | What was actually observed | Implication |
|---|---|---|
| Import steps | Subtitle Edit online uses Subtitle → Open → browse. Subtitle-editor.org uses Load Subtitles → file control → Done. Original MedCue had direct separate subtitle/audio controls. | Preserve direct file controls. No broad claim of fastest import: file selection, codec work and existing-user shortcuts were not timed comparatively. |
| Review transition | Old MedCue needs Mark reviewed then next cue. A real competitor user describes a similar sequence burden. | Add optional one-action Review & next and a shortcut while retaining mark/reopen. |
| Source evidence | MedCue already preserves original text and audio, but originally showed only the current cue. | Show adjacent original subtitles without extra inputs or model requests. Accuracy improvement remains unmeasured. |
| Visual density | Mature editors prioritize editable transcript and media controls. The current competitor's toolbar exposes many authoring actions; MedCue is deliberately narrower. | Use a readable recording/document hierarchy, not an extra dashboard. Preference and learning time remain unmeasured. |
| Response speed | The public competitor loaded and imported successfully. No controlled network/hardware timing comparison exists. | Report functional success only. Local/hosted smoke timing is a single observation, not proof we are faster. |
| Limits | Competitors disclose codec, screen-size, credit or plan limits. | Display the static edition's AI limitation instead of presenting a broken connection/reload error. |

## Product audit and decisions

**P0:** raw NLM SRT cannot import because of one empty cue; textarea is replaced on every input event (the isolated before-test confirms node identity changes). Fix with explicit omission preview and stable editor rendering.

**P1:** repeated review/next action, hidden neighboring context, a sample with no recording, and static-host API mismatch. Add the smallest useful controls/preview, not a new editor engine. Preserve original data, quota guard, manual review and saved project format.

**P2:** generic slogan, repeated card borders and tiny low-priority labels obscure the task. Replace with recording-first hierarchy, larger self-hosted text, quieter evidence rail and useful keyboard hints. No animation, charts, accounts, timing editor or new AI scope.

See `IMPROVEMENT-PLAN.md` for per-change acceptance conditions. Human time savings, medical correctness, market demand, retention and willingness to switch are still unverified. Existing tools remain the sensible default for comprehensive subtitle authoring.
