# Inspected demo-recorder capabilities

Checked the authorized `~/tools/demo-recorder` directory on 19 October 2026. Source, schemas, the single plugin, both HTML export tools, presets, regression example and six example scene specs were inspected. Assets or application code from the other projects mentioned by those examples were not opened or reused. The tool directory itself was not changed.

| Capability | Actual implementation / check | Use in this production |
|---|---|---|
| Scene contracts | `lib/schema.js`; `--check` validates cards, URLs, actions and sessions | Full 19-scene file validates. No unrecognized action names. |
| Browser capture | Playwright persistent isolated context, headless, per-scene video and named sessions | Browser launch probe and real public MedCue recordings succeeded. No access to the owner's draft. |
| Figma | One optional REST frame-to-PNG export plugin with cache. Environment credential presence checked without exposing its value. No Figma authoring MCP tool or selected MedCue file/node was available. | No Figma authentication, export or editable file creation claimed. Native editable presentation objects provided the design source. |
| Presentation creation | Recorder consumes image cards, not an editable presentation editor | Bundled Artifact Tool created ten native editable PPTX slides. Its package, workbook, layout and re-import finalization passed. |
| PNG import | `card.image` reads local PNG/JPEG or downloads remote images | Local 1920 x 1080 PNG cards successfully captured. |
| SVG import | Current card resolver chooses JPEG MIME only for JPG extensions and otherwise declares PNG. It does not identify SVG MIME. | SVG card support is not claimed. Diagram nodes and arrows remain editable native PPTX objects; exported PNGs supply the video. |
| HTML export | `tools/frames.js` renders selected HTML elements or `.slide` elements to PNG | Used to produce the storyboard contact sheet. |
| Themes | Seven presets, `themes.js`, swatch tool and reference PNGs | Editorial reference inspected; product's established paper/teal tokens guided the custom assets. No template default or decorative illustration required. |
| Sessions and overlays | Consecutive named session scenes share state. In-session cards can fade through a transient iframe. | Named sessions preserve live decisions. Final edit uses designed cuts and the motion asset rather than claiming an arbitrary transition API. |
| Camera | Action focus points are logged. Post code implements a focus crop. The CLI parses `--no-zoom` but does not forward that field to `post`. No scene camera-keyframe type exists. | Probe confirmed focus logging and video generation. Assembler calls `post` with `zoom:false` explicitly. A 10-second HTML asset provides a modest, visually checked zoom and progressive focus. |
| Element animation | No dedicated diagram or layer-animation action type | Two progressively highlighted workflow PNGs crossfade within the recorded HTML asset. These are presentation visuals, not simulated product behavior. |
| Icons/vector drawing | No icon, flowchart, timeline, sequence or graph authoring plugin found in the recorder | Native editable diagram primitives and a native evidence chart in the bundled presentation runtime were sufficient. No new recorder or diagram engine built. |
| Speech | `edge-tts` command per scene; original installed version 7.2.8 returned 403 | Isolated official 7.3.1 synthesized the public English narration. The shared/system tools remain unchanged. |
| Captions | ASS generation, sentence/word chunking, burned into the composed MP4 | Narration captions preserved separately as SRT and burned into a reserved bottom band. |
| Audio capture | Browser frames only. No mic, system or page audio recorded | Finishing mix adds the same credited NLM excerpt at the recorded playback cue. No live system-audio capture is implied. |
| Composition | ffmpeg scene padding, session trims, concatenate and caption burn | Existing capture/post pipeline reused. A narrow finishing step adds the source track and subtitle band. |

The native PPTX chart uses literal counts from the project evidence and an embedded workbook. It does not chart accuracy or agent timing. No full competitor survey, broad product button audit, new medical model call, paid generation, Figma installation, video upload or Devpost submission was performed for this production.
