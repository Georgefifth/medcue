# Visual storyboard

Final edit timings are approximate to a rounded second. The machine-readable edit map is `timeline.json`.

| Time | Scene | Visual purpose | Narration |
|---|---|---|---|
| 00:00-00:10 | 01 actual transcription example | Concrete automatic-caption discrepancy and manual correction | Automatic captions can turn a medical term into a plausible word. MedCue helps education editors compare that text with the recording. |
| 00:10-00:21 | 02 workflow focus | Overview, focus on listening/review, then return to the overview | Open the subtitles and matching audio. Listen to a cue, edit against the original, then review and continue. The editor controls every change. |
| 00:21-00:31 | 03 open the real application | Actual app loads the credited sample | Here is the working app. This example loads fourteen actual automatic captions and a matching public National Library of Medicine recording. |
| 00:31-00:39 | 04 select the discrepant cue | Actual cue selection with immutable original evidence | Cue four contains the word mersa. Its original text and nearby context remain visible. |
| 00:39-00:47 | 05 source audio playback | Real source speech, without narration over it | Original NLM recording, with source attribution caption. |
| 00:47-00:56 | 06 annotated source evidence | Annotated screenshot explains the evidence/editor separation | The workspace separates the original evidence from the final subtitle. Listening guides the correction, while the original stays unchanged. |
| 00:56-01:06 | 07 restore audio without replacing edits | Actual selected-cue recovery and explicit audio restoration | After a refresh, the selected cue returns. Restore example audio reattaches the recording without replacing the review. |
| 01:06-01:15 | 08 manual correction | Actual manual text correction | After listening, the editor corrects the wording. This is a prepared demonstration, not an automatic correction or an accuracy test. |
| 01:15-01:21 | 09 review and next | Actual one-action review transition | Review and next records the decision and selects the next cue in one action. |
| 01:21-01:28 | 10 undo returns to its cue | Actual undo restores decision and selection | Undo restores the decision and returns to its cue, so a mistaken action is recoverable. |
| 01:28-01:35 | 11 export with pending review visible | Reapply review and retain the pending count | Only one cue has been reviewed. Export keeps the remaining thirteen visible as pending. |
| 01:35-01:40 | 12 confirm the actual export | Actual export confirmation | Every imported cue and its original timing will be included. |
| 01:40-01:47 | 13 inspect the actual downloaded content | Inspect the real downloaded Blob in a labeled overlay | This inspection overlay shows the actual downloaded text, not a replacement exporter. |
| 01:47-01:56 | 14 output comparison | Literal SRT before/after timing comparison | The words change while the timestamps stay intact. A separate project file preserves review decisions and history. |
| 01:56-02:09 | 15 browser processing boundary | Browser processing and audio boundary | The parser, waveform playback, glossary rules and draft storage run in the browser. Audio stays on the device. The public site supports this editing loop without a server. |
| 02:09-02:23 | 16 optional inference boundary | Optional server sequence and credential boundary | The optional server edition sends only the selected cue and glossary after an explicit click. A guarded Node API contacts the configured model. The public Pages site does not run inference. |
| 02:23-02:36 | 17 inconvenient model evidence | Frozen useful and misplaced AI suggestions | Earlier selected Gemini checks produced useful leads and a misplaced warning on a correct term. These are recorded responses. Suggestions are unverified and never apply themselves. |
| 02:36-02:53 | 18 bounded validation evidence | Actual round-trip evidence and its limits | Developer checks preserved text and timestamps across two hundred fifty seven actual automatic caption cues. Twenty two core and API checks and fourteen browser tests pass. Human time savings and medical correctness remain unmeasured. |
| 02:53-03:03 | 19 try the public review loop | Working public destination | Try the real recording at the public site. The source repository includes server setup, evaluation evidence and the limits of the prototype. |

All slides reserve the bottom 180 pixels for captions. The static PPTX is the editable design source. The HTML flow asset supplies the progressive highlight and camera move.

The shown correction and four AI examples are selected demonstrations. No human speed or medical accuracy result is implied. Public editing footage and server-only inference architecture are distinguished.
