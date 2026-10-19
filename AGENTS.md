# MedCue

## Product
Help recurring medical-education video editors review existing English subtitles faster. Optimize time to an accurately reviewed SRT, not the number of alerts or AI responses. The proposed 30% time reduction is an untested research target.

## Scope and architecture
- Work only inside this new project. Do not inspect or reuse other local projects.
- English UI, source code, documentation and fixtures.
- Vite browser application; reusable subtitle parsing and WaveSurfer audio playback.
- Deterministic review rules work without a service. AI defaults to a server-side cloud API adapter, with optional self-hosted Ollama. Secrets must stay in server environment variables. Send only the selected cue and glossary after an explicit click; audio remains in the browser. No provider is selected or billed automatically. Production hosting must not depend on the developer computer.
- Keep source subtitle text and timestamps immutable. Edits, review decisions and audit entries are separate.
- No diagnosis, clinical accuracy claims, automatic transcription or automatic application of suggestions.

## Quality
- Reject malformed SRT without partial imports; preserve every cue and timestamp on export.
- Empty SRT entries may be omitted only through the separate import preview with explicit confirmation and an audit entry. Validate their timing too; never silently discard malformed content. The strict parser and saved-project validator remain strict.
- Treat files and model output as untrusted text. Never insert user text as HTML.
- Changes invalidate the affected review decision and AI suggestions. No silent edits.
- Every review action can be undone. Project export must preserve work; audio must be reattached after reload.
- Keyboard focus, labeled controls, mobile layout and reduced motion support are required.
- Test malformed imports, multiline round trips, edits, review invalidation, glossary boundaries, export and AI failure paths. Run build, unit tests and browser smoke tests before delivery.
- Respect configured RPM, request spacing, concurrency, hourly/daily caps and provider Retry-After. Do not auto-retry or switch models/providers on quota failure. Never print .env contents or keys.
- Record actual verification and limitations in README.md. Never imply synthetic fixtures validate clinical performance or real-world time savings.
