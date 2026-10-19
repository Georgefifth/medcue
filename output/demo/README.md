# MedCue visual demo

A 1920 x 1080 English demo combines designed explanations with the actual public application. The finished video is generated locally as `medcue-demo.mp4` and has not been uploaded to a video host or submitted to Devpost. `medcue-demo.srt` contains the narration captions.

## Files

- `medcue-visual-story.pptx`: ten editable slides. Text, diagram nodes, connectors and the evidence chart are native objects. The chart includes an embedded workbook with the two literal source counts. Screenshots remain raster images.
- `assets/01-*.png` through `assets/10-*.png`: 1080p exports for recorder image cards. `assets/medcue-original-cue-04.png` is the original real-app capture. `assets/actual-export-inspection.png` shows actual exported text in the clearly labeled demo viewer.
- `sources/scenes.cjs`: the complete voiceover, captions, actions and ordering. `sources/motion.html` progressively highlights the existing workflow frames with a small camera move. `sources/build-deck.mjs` builds the native deck and PNGs.
- `sources/assemble.cjs`: reuses demo-recorder's existing post pipeline, then adds the matching NLM recording excerpt and a caption band. Optional live retakes replace scenes by name. The shared recorder is unchanged.
- `timeline.json`, `STORYBOARD.md`: timing, narrative intent and the edit map.
- `clips/`: nineteen edit-ready scene MP4s before burned captions. `audio/`: individual narration tracks and the credited NLM source sample. These generated media are supplied in the local source ZIP, rather than duplicated in the repository. The selected source-audio placement is in `timeline.json`.
- `fonts/`: free DejaVu fonts and their license. Install them when editing the PPTX to preserve layout. Rendered PNGs and video need no font installation. Native PowerPoint opening has not been tested.
- `CAPABILITIES.md`: inspected recorder tools and actual availability boundaries.

The MP4 and source ZIP are local deliverables, excluded from the source repository to avoid duplicating generated media. The editable deck, PNGs, fonts and source files are retained in the repository. The source ZIP omits the final MP4, original raw capture containers, caches, model credentials, profiles and dependencies. It includes the edit-ready per-scene clips and narration audio. These clips and the PNGs allow recutting without regenerating speech.

## Visual and narrative direction

Use the product's paper surface, navy ink and teal action color. Large source words establish a concrete transcription difference. A progressive workflow directs attention to listening and human review. A real screenshot explains immutable source evidence. Separate diagrams show the browser editing loop and optional server inference. An SRT comparison preserves literal timestamps, while the evidence chart shows dataset size without presenting it as accuracy.

The video reserves its bottom 180 pixels for captions. Slides and key live controls stay above that area. Motion belongs to the explanatory flow asset; the PPTX itself is an editable static design source, without native animation keyframes. The app footage uses browser zoom/framing for video readability. These presentation changes do not alter product behavior.

The download viewer is a video overlay that reads the actual Blob created by the app's exporter, then displays its text. It identifies itself on screen. It neither substitutes a fabricated SRT nor claims to be a shipped MedCue feature.

## Evidence and source boundaries

The real demonstration uses [public NLM audio and its actual automatic captions](../../public/sample/ATTRIBUTION.md). The correction is preselected and manual. Only one of fourteen cues is marked reviewed. The source-recording track is a 5.52-second segment corresponding to the selected cue with context, aligned using the recorder's playback-click timing. It is mixed from the same public sample because the recorder captures browser frames without page audio. A waveform identity check confirmed the excerpt within approximately 100 ms of the intended decoded position. This is not sample-accurate audiovisual synchronization or an independent listening study.

The 257-cue chart reports earlier [developer-run round-trip checks](../../evaluation/editor-study/README.md), with 134 antibiotics cues and 123 naloxone cues. It measures text/timestamp preservation, not medical accuracy. The 22 core/API and 14 browser checks refer to the verified application release recorded in `docs/verification.json`; this production task did not repeat the full product test suite.

The displayed Gemini quotations come from [four frozen selected cases](../../evaluation/editor-study/gemini-natural-asr.json). They are labeled recorded responses and include a misplaced warning. No new model inference was requested for this video. The public Pages site supports local editing and does not run the server API. No human time-saving, clinical correctness or competitive superiority claim is established.

## Rebuild

Run from the MedCue project root, with this directory placed at `output/demo/`.

The slide builder uses the Codex bundled `@oai/artifact-tool` runtime. Set `MEDCUE_RUNTIME_MODULES`, `MEDCUE_RUNTIME_PYTHON`, and `MEDCUE_PRESENTATION_SKILL` to the installed runtime and presentation skill. Use its Node executable. The finalizer requires a new output filename for subsequent design revisions.

For capture, use the existing recorder:

```sh
node ~/tools/demo-recorder/record-demo.js output/demo/sources/scenes.cjs --check
node ~/tools/demo-recorder/record-demo.js output/demo/sources/scenes.cjs --dry --out=artifacts/demo-build/film
node output/demo/sources/assemble.cjs
```

The assembly requires `edge-tts` 7.3.1 or a compatible official version, ffmpeg/ffprobe and the existing recorder (override with `MEDCUE_RECORDER_DIR`). The initially installed 7.2.8 failed with HTTP 403. [Official releases](https://github.com/rany2/edge-tts/releases) describe the October 2026 protocol update. This build used 7.3.1 in an isolated project build folder, without changing the system package. Narration text is sent to Microsoft's online speech service. It contains only the public script and no project secrets. A final visual retake reused the previously generated narration rather than making new speech requests.

The scene runner does not collect mic or system audio. Assembly adds only the credited public recording segment. Its default automatic zoom is explicitly disabled through the library option. The designed flow asset supplies the deliberate camera motion; no unsupported per-element animation API is claimed. The contact sheet was exported using the recorder's own `tools/frames.js`.

When revising the script, regenerate the narration and captions together. Check the actual final frame, audio and timing before delivery. The video has not received independent human usability, narration or medical review.
