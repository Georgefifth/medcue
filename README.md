# MedCue

A local-first desk for reviewing existing English education subtitles against a recording. Keep original text, listen in context, edit, record review decisions and export SRT without changing timestamps. The focus is transcription fidelity, not medical truth or automatic correction.

## Try the hosted version

[Open MedCue](https://georgefifth.github.io/medcue/)

The GitHub Pages edition runs editing, glossary rules, audio playback, project recovery and SRT export in your browser. It has **no AI backend**, collects no API key, and makes no inference requests. Audio is not uploaded. GitHub still serves the site and may log normal visit metadata; this is not a claim of anonymous hosting.

Choose **Try a real recording** to load a 37.5-second public NLM audio excerpt and its actual automatic captions together. The captions contain real transcription differences; nothing is automatically corrected. Attribution and source permission are in [the sample notice](public/sample/ATTRIBUTION.md). The separate **Explore a sample review** option contains fictional text without audio. **Restore example audio** reattaches its recording after a refresh without replacing edits or review decisions. It is offered only when every original cue and timestamp matches the example. **Recording example** in the sidebar starts a new example review and still asks before replacing your work.

## Review workflow

1. **Open subtitles** with UTF-8 SRT, then **Attach audio** with matching MP3, WAV, M4A or OGG. Codec support varies by browser. An empty-cue preview lists omissions for explicit confirmation; Cancel keeps the current project. Malformed text/timing still rejects atomically.
2. Select a cue. Read the original and neighboring original subtitles; replay starts one second before and stops half a second after the cue, bounded by the recording. Use 0.75×, 1× or 1.25× playback.
3. Edit the final subtitle. The original remains unchanged. Signals are reasons to listen, not proof of errors.
4. **Review & next** (Ctrl/Cmd+Enter) records the decision and advances to the next matching unreviewed cue, respecting the current search/filter and wrapping. **Mark reviewed / Reopen cue** changes a decision without moving. **Undo** restores edits or review decisions and returns to their cue. Shift+Space replays while editing.
5. **Export SRT** includes every imported nonempty cue, with a pending count. Original timestamps/order are preserved and sequence numbers normalized. Empty edited text or internal blank lines block export.
6. **Save project** downloads originals, edits, glossary, decisions and audit entries. **Open project** restores them. Audio must be reattached after reload or restore.

One browser draft and its selected cue are retained in localStorage. Download a project before switching; clearing browser data removes the draft. Browser storage is persistent on this profile, not an encrypted medical-record store. Original files on your device are not modified. Empty source cues omitted through explicit import confirmation are recorded in the project audit.

## Terminology and limits

Use one canonical term per line, optionally followed by aliases:

```text
Metformin | meta formin
Hypoglycemia | hypo glycemia
Hemoglobin
Haemoglobin
```

Only editor-provided aliases trigger spelling replacements, with word boundaries and an explicit click. The default is a small demonstration list, not a medical dictionary. Canonical terms alone do not detect arbitrary mishearings. Changing terminology resets review decisions. Number/qualifier/timing signals do not establish correctness. Subtitle markup is displayed literally and never executed.

Limits: English SRT, 2 MB, 1–5,000 source cues, at most 30,000 characters per cue, timestamps below 100 hours; audio up to 150 MB. Very large permitted files have not been performance-benchmarked. No transcription, translation, timing editor, accounts, team sync or clinical validation is provided. Comprehensive subtitle authoring is already served by Subtitle Edit and Aegisub.

## Run with a server

Requires Node.js 24+ and npm. No local model is installed.

```sh
git clone https://github.com/Georgefifth/medcue.git
cd medcue
npm ci
cp .env.example .env
# Set the provider/model and key in .env, then:
npm run build
npm start
```

Open `http://127.0.0.1:8080/`. For development, `npm run dev` serves port 5173. The dependency-free Node server serves built assets, `/api/config`, `/api/review` and `/healthz`. Vite development/preview expose the same adapter. Credentials are loaded at startup; restart after changes. `.env` is ignored by Git and Docker and must never be public.

Cloud-compatible Chat Completions is the default; Ollama is optional. Configure the base URL without `/chat/completions`, a model ID and a server-side key. For Google's endpoint, use `GEMINI_API_KEY`; for another compatible service, use `AI_API_KEY`. See `.env.example`. Do not prefix secrets with `VITE_`. Provider JSON-mode support varies; disabling `AI_JSON_MODE` still requires valid JSON in the returned content.

Only the selected cue and glossary are sent after **Check with AI**. Neighboring context and audio remain in the browser. The interface shows the processing destination. Suggestions are unverified and never applied automatically; changed text invalidates a pending result. Failed or malformed requests leave editing/export available. Regression tests mock inference.

The example uses conservative demo guards: 4 requests/minute, at least 15 seconds apart, concurrency 1, 20/hour and 20/day with a Pacific-time daily reset. These are application caps, not guaranteed Google free-tier entitlements. Failed attempts count. Provider Retry-After creates a cooldown with no retry, batch or model fallback. Limits are in memory, reset on server restart and are not shared across instances. Actual quota, retention and account spending controls belong to the provider; the demo server has no account/access-control system.

For existing Ollama hosting, set `AI_PROVIDER=ollama` and `OLLAMA_MODEL`. The application server contacts its own loopback Ollama instance, not the visitor's computer. No automatic model download or fallback occurs.

A non-root multi-stage `Dockerfile` is supplied but has not been container-tested. Set `HOST=0.0.0.0` and the host's `PORT` for an independent server host, supply secrets only at runtime and terminate HTTPS there. No cloud backend has been publicly deployed as part of the Pages publication.

## GitHub Pages

```sh
npm run build:pages
```

This produces `dist-pages/` with relative asset paths, works under `/medcue/`, and explicitly disables AI without trying `/api` endpoints. Normal `npm run build` produces the separate server edition in `dist/`.

The `Verify and publish Pages` workflow tests and builds the static edition, verifies it under a repository subpath, and deploys only `dist-pages/` through GitHub Pages. Source checkout, tests, server files and `.env` are not the deployed artifact. GitHub Pages cannot execute the Node API handler or keep an API key secret in client JavaScript. [GitHub's Pages documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages) describes the static hosting model.

## Verification and evidence

```sh
npm test
npm run test:e2e
npm run build
npm run build:pages
node scripts/hosted-smoke.mjs --local
```

Playwright needs its browser (`npx playwright install chromium`) or an explicit `MEDCUE_CHROME_PATH`. The static smoke test checks real audio, review-next, edited SRT export, 390-pixel overflow and zero API/POST requests. `MEDCUE_PUBLIC_URL=https://georgefifth.github.io/medcue/ node scripts/hosted-smoke.mjs` checks the actual hosted version. Screenshots/logs are generated under ignored `artifacts/`.

- [Competition and user feedback](docs/COMPETITION.md): five alternatives, sources and trial boundaries.
- [Priorities and design acceptance](docs/IMPROVEMENT-PLAN.md).
- [Submission polish and acceptance](docs/RELEASE-CANDIDATE.md).
- [Submission PDF and demo script](docs/SUBMISSION.md).
- [Earlier delivery and measured differences](docs/DELIVERY.md).
- [Initial synthetic exploration](evaluation/REPORT.md): explicitly author-adapted/fictional, not real ASR.
- [Public audio compatibility](evaluation/public-audio/README.md).
- [Natural ASR and existing-tool walkthrough](evaluation/editor-study/README.md): four selected natural differences, relevant and misplaced AI leads; not population accuracy.

Human time savings, medical correctness, retention and willingness to switch remain unverified. There are no fabricated participants, expert labels or productivity claims. The 30% time-saving idea remains an untested target.

## Architecture and reuse

Vite + vanilla JavaScript, `@plussub/srt-vtt-parser` for parsing, WaveSurfer for audio and Lucide for icons. `src/core.js` owns import/export/rules/project validation; `src/main.js` owns the review UI and local draft; `server/ai.mjs` owns provider calls/quotas; `server/start.mjs` owns static serving and API routing. Keep the project format and original cue evidence intact.

Source Sans 3 is self-hosted through Fontsource. Distributed dependencies' notices are in `public/licenses/`; the real sample has its separate source attribution. Original application code is ISC licensed. Existing tools are research references; their application code was not copied. Work was confined to this new project, without reading or reusing other local projects.
