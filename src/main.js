import '@fontsource/source-sans-3/latin-400.css';
import '@fontsource/source-sans-3/latin-600.css';
import './style.css';
import WaveSurfer from 'wavesurfer.js';
import { createIcons, AudioLines, ShieldCheck, Download, FolderOpen, Plus, Headphones, BookOpen, Save, FolderInput, SkipForward, Search, Play, Pause, Ear, ScanText, Sparkles, X, List, CircleDot, BookA, Hash, MessageSquareText, Clock3, CircleCheck, FileAudio, TextCursorInput, Undo2, RotateCcw, Check, CircleHelp, CornerDownLeft } from 'lucide';
const icons = { AudioLines, ShieldCheck, Download, FolderOpen, Plus, Headphones, BookOpen, Save, FolderInput, SkipForward, Search, Play, Pause, Ear, ScanText, Sparkles, X, List, CircleDot, BookA, Hash, MessageSquareText, Clock3, CircleCheck, FileAudio, TextCursorInput, Undo2, RotateCcw, Check, CircleHelp, CornerDownLeft };
import { DEFAULT_GLOSSARY, DEMO_SRT, importSrt, previewSrtImport, exportSrt, inspect, stamp, replaceAlias, validateProject } from './core.js';

const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const icon = name => `<i data-lucide="${name}" aria-hidden="true"></i>`;
const key = 'medcue-project-v1';
const staticSite = import.meta.env.MODE === 'pages';
const assetBase = import.meta.env.BASE_URL;
let pendingImport = null, typingCueId = null, sampleBusy = false;
let project = { format: 'medcue-1', name: 'Untitled review', cues: [], glossary: DEFAULT_GLOSSARY, audit: [] };
let aiCooldownUntil = 0, aiConfigReady = false, aiConfigured = false, aiMinimumIntervalMs = 15000, aiCueId = null;
try { aiCooldownUntil = Math.min(Date.now() + 86400000, Number(sessionStorage.getItem('medcue-ai-cooldown')) || 0); } catch {}
let selected = 0, filter = 'All cues', query = '', audioUrl = '', player, ready = false, clipEnd = null, undo = [], aiResults = new Map(), aiBusy = false, revision = 0, toastTimer;
try { const saved = localStorage.getItem(key); if (saved) project = validateProject(JSON.parse(saved)); } catch { /* A corrupt draft never prevents startup. */ }

$('#app').innerHTML = `
<header class="topbar"><a class="brand" href="${assetBase}" aria-label="MedCue home"><span class="brand-icon">${icon('audio-lines')}</span>MedCue<span class="brand-tag">Subtitle review desk</span></a><span class="local-note">${icon('shield-check')} Audio stays on this device</span><button class="button primary" id="export">${icon('download')} Export SRT</button></header>
<div class="workspace"><aside class="sidebar"><div class="project-heading"><span class="folder">${icon('folder-open')}</span><div><p class="muted small">Current project</p><h1 id="project-name"></h1></div></div><button id="import" class="button import-button">${icon('plus')} Open subtitles</button><button id="audio-import" class="button quiet">${icon('headphones')} Attach audio</button><div class="section-label">Review queue</div><nav id="filters" aria-label="Filter cues"></nav><div class="sidebar-bottom"><div id="progress"></div><button id="glossary-open" class="button quiet">${icon('book-open')} Your terminology</button><button id="save-project" class="button quiet">${icon('save')} Save project</button><button id="restore-project" class="button quiet">${icon('folder-input')} Open project</button><button id="demo" class="demo-link">Try fictional text</button></div></aside>
<main><div class="desk-heading"><div><h2>Review the recording.</h2><p class="muted small">Check the words. Keep the speaker’s meaning.</p></div><span class="mode-tag" id="edition-label">Local review workspace</span></div><div class="review-layout"><section class="cue-panel" aria-label="Subtitle cues"><div class="panel-heading"><h3>Transcript <span id="cue-count"></span></h3><button class="icon-button" id="next" aria-label="Next unreviewed cue" title="Next unreviewed cue">${icon('skip-forward')}</button></div><label class="search">${icon('search')}<input id="search" placeholder="Find a word or phrase" aria-label="Search subtitles"></label><div id="cue-list"></div></section><section class="editing-column"><div class="audio-panel"><div class="audio-heading"><span>${icon('headphones')} Listen in context</span><label class="speed-label">Speed<select id="speed" aria-label="Playback speed"><option value="0.75">0.75×</option><option value="1" selected>1×</option><option value="1.25">1.25×</option></select></label></div><div id="waveform"></div><div class="player-bottom"><button id="play" disabled class="play-button" aria-label="Replay selected cue">${icon('play')}</button><div><strong id="audio-title">Attach audio to listen</strong><p id="audio-status" class="muted small" role="status">MP3, WAV, M4A or OGG • audio is never uploaded</p></div><button id="stop" disabled class="icon-button" aria-label="Pause audio">${icon('pause')}</button></div></div><div id="editor"></div><div class="review-note">${icon('ear')} A signal is a reason to listen, not proof of an error.</div><details class="audit-panel"><summary>Review activity <span id="audit-count"></span></summary><ol id="audit-list"></ol></details></section><aside class="evidence-column"><div class="panel-heading"><h3>Review signals</h3>${icon('scan-text')}</div><div id="signals"></div><div class="ai-panel"><div class="ai-title">${icon('sparkles')} Optional AI check</div><p>Check this cue’s text for possible wording issues. Suggestions are unverified; AI cannot hear your recording.</p><button id="ai" class="button">Check with AI</button><p class="muted small"><span id="ai-disclosure">Checking where AI review runs. Audio is never sent.</span></p><p id="ai-wait" class="small" role="status" hidden></p><div id="ai-results" aria-live="polite"></div></div><div class="evidence-foot">Your glossary is the reference.<br>The recording is the evidence.<br>You make the final call.</div></aside></div></main></div>
<footer><span>Built for medical education editors</span><span id="save-status">Ready for your first subtitle file</span></footer>
<input type="file" id="srt-file" accept=".srt" hidden><input type="file" id="audio-file" accept="audio/*" hidden><input type="file" id="project-file" accept=".json" hidden>
<div id="toast" role="status" hidden></div>
<dialog id="glossary-dialog"><form method="dialog"><div class="dialog-heading"><h2>Your terminology</h2><button class="icon-button" aria-label="Close terminology">${icon('x')}</button></div><p>Add one term per line. Use a vertical bar before known alternative spellings, separated by commas.</p><label for="glossary-text">Canonical term | spelling to check, another spelling</label><textarea id="glossary-text" rows="12" maxlength="30000" spellcheck="false"></textarea><p class="muted small">Entries are editor-provided spelling references, not medical recommendations. Changing them resets review decisions.</p><div class="dialog-actions"><button class="button">Cancel</button><button type="button" class="button primary" id="glossary-save">Save terminology</button></div></form></dialog>
<dialog id="import-dialog"><h2>Review subtitle import</h2><p id="import-summary"></p><p>These entries contain no subtitle text. Importing will omit only the listed empty entries and renumber the remaining cues. All nonempty text and timestamps stay unchanged.</p><pre id="empty-cues"></pre><p>The original file on your device is unchanged.</p><div class="dialog-actions"><button class="button" id="import-cancel">Cancel import</button><button class="button primary" id="import-confirm">Import without empty entries</button></div></dialog><dialog id="export-dialog"><form method="dialog"><h2>Export your subtitles</h2><p id="export-message"></p><p>Every cue and its original timing will be included. Review status is saved in the project file, not in SRT.</p><div class="dialog-actions"><button class="button">Back to review</button><button type="button" id="export-confirm" class="button primary">Download SRT</button></div></form></dialog>`;

function notify(message) { $('#toast').textContent = message; $('#toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').hidden = true, 5500); }
function record(message) { project.audit.push(`${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — ${message}`); project.audit = project.audit.slice(-1000); }
function persist() { try { localStorage.setItem(key, JSON.stringify(project)); $('#save-status').textContent = 'Draft saved on this browser • reattach audio after reload'; } catch { $('#save-status').textContent = 'Browser storage unavailable • use Save project to keep your work'; } }
function checkpoint() { typingCueId = null; undo.push(JSON.stringify(project)); if (undo.length > 40) undo.shift(); revision++; }
const signalCache = new Map();
function cueSignals(c) {
  const signature = JSON.stringify([c.text, c.from, c.to, project.glossary, project.cues[c.id]?.from]);
  const cached = signalCache.get(c.id);
  if (cached?.signature === signature) return cached.findings;
  const findings = inspect(c, project.cues, project.glossary);
  signalCache.set(c.id, { signature, findings });
  return findings;
}
function current() { return project.cues[selected]; }
function displayTime(ms) { return stamp(ms, '.').slice(0, 8); }
function matches(c) { const signals = cueSignals(c); return (!query || c.text.toLowerCase().includes(query)) && (filter === 'All cues' || (filter === 'Reviewed' ? c.reviewed : filter === 'Needs review' ? !c.reviewed : signals.some(s => s.type === filter))); }
function render({ preserveEditor = false } = {}) {
  $('#project-name').textContent = project.name;
  const reviewed = project.cues.filter(c => c.reviewed).length;
  const names = ['All cues', 'Needs review', 'Terms', 'Numbers', 'Meaning', 'Timing', 'Reviewed'];
  const symbols = ['list', 'circle-dot', 'book-a', 'hash', 'message-square-text', 'clock-3', 'circle-check'];
  $('#filters').innerHTML = names.map((name, i) => { const count = project.cues.filter(c => name === 'All cues' || (name === 'Reviewed' ? c.reviewed : name === 'Needs review' ? !c.reviewed : cueSignals(c).some(s => s.type === name))).length; return `<button class="filter ${filter === name ? 'active' : ''}" data-filter="${name}" aria-pressed="${filter === name}">${icon(symbols[i])}<span>${name}</span><b>${count}</b></button>`; }).join('');
  $('#progress').innerHTML = `<div class="progress-label"><strong>${reviewed} of ${project.cues.length}</strong><span>reviewed</span></div><progress value="${reviewed}" max="${project.cues.length || 1}"></progress>`;
  $('#cue-count').textContent = project.cues.length;
  const visible = project.cues.filter(matches);
  $('#cue-list').innerHTML = visible.length ? visible.map(c => `<button class="cue-row ${current()?.id === c.id ? 'selected' : ''}" data-cue="${c.id}" aria-current="${current()?.id === c.id}"><span class="cue-row-top"><span>${String(c.id).padStart(2, '0')} <span class="cue-time">${displayTime(c.from)}</span></span>${c.reviewed ? `<span class="reviewed-icon">${icon('circle-check')}</span>` : cueSignals(c).length ? '<span class="signal-dot"></span>' : ''}</span><span class="cue-preview">${esc(c.text)}</span><span class="cue-tags">${c.reviewed ? 'Reviewed' : [...new Set(cueSignals(c).map(s => s.type))].join(' / ') || 'Ready to review'}</span></button>`).join('') : `<div class="empty-list">${icon('file-audio')}<strong>${project.cues.length ? 'No matching cues' : 'Bring your subtitles'}</strong><p>${project.cues.length ? 'Try another filter or search.' : 'Open an SRT file to begin, or try the teaching example.'}</p></div>`;
  if (preserveEditor) renderSignals(); else renderEditor();
  $('#audit-count').textContent = project.audit.length;
  $('#audit-list').innerHTML = project.audit.slice(-12).reverse().map(a => `<li>${esc(a)}</li>`).join('') || '<li>Your review decisions will appear here.</li>';
  $('#export').disabled = !project.cues.length;
  $('#save-project').disabled = !project.cues.length;
  $('#play').disabled = !ready || !current();
  createIcons({ icons });
}
function renderEditor() {
  const c = current();
  if (!c) { $('#editor').innerHTML = `<div class="welcome"><div class="welcome-symbol">${icon('text-cursor-input')}</div><h2>Start with the recording.</h2><p>Open existing subtitles and attach their audio. Listen, correct the text, and export with the timing intact.</p><button class="button primary" id="real-sample">Try a real recording</button><p class="sample-credit">37 seconds of public NLM audio with actual automatic captions. <a href="https://medlineplus.gov/medlineplus-videos/antibiotics-vs-bacteria-fighting-the-resistance/" target="_blank" rel="noopener">View the source</a></p><button class="demo-link" id="welcome-demo">Explore a sample review</button><p class="muted small">The text-only example is fictional.</p></div>`; $('#signals').innerHTML = '<p class="muted signal-empty">Open subtitles to see review signals.</p>'; renderAi(); updateAiControls(); return; }
  $('#editor').innerHTML = `<article class="editor-card"><div class="editor-card-heading"><div><span class="cue-number">Cue ${String(c.id).padStart(2, '0')}</span><span class="time-pill">${stamp(c.from, '.')} — ${stamp(c.to, '.')}</span></div><span class="status-tag ${c.reviewed ? 'done' : ''}">${c.reviewed ? 'Reviewed' : 'Awaiting review'}</span></div><div class="source-context" role="note" aria-label="Nearby original subtitles">${selected > 0 ? `<p><span>Before</span>${esc(project.cues[selected - 1].original)}</p>` : ''}${selected + 1 < project.cues.length ? `<p><span>After</span>${esc(project.cues[selected + 1].original)}</p>` : ''}</div><div class="original-block"><span class="field-label">Original subtitle</span><p>${esc(c.original)}</p></div><label class="field-label" for="cue-text">Your final subtitle</label><textarea id="cue-text" rows="5" spellcheck="true">${esc(c.text)}</textarea><div class="editor-meta"><span id="character-count">${c.text.length} characters</span><span>Timing stays unchanged</span></div><div class="editor-actions"><button class="button quiet" id="undo" ${undo.length ? '' : 'disabled'}>${icon('undo-2')} Undo</button><button class="button quiet" id="reset" ${c.text === c.original ? 'disabled' : ''}>Reset text</button><button class="button quiet" id="review">${icon(c.reviewed ? 'rotate-ccw' : 'check')} ${c.reviewed ? 'Reopen cue' : 'Mark reviewed'}</button><button class="button primary" id="review-next" aria-keyshortcuts="Control+Enter Meta+Enter" title="Ctrl or Command + Enter">Review & next ${icon('skip-forward')}</button></div><p class="keyboard-help"><span><kbd>Ctrl / ⌘</kbd> + <kbd>Enter</kbd> review & next</span><span><kbd>Alt</kbd> + <kbd>Space</kbd> replay</span></p></article>`;
  renderSignals();
  $('#cue-text').addEventListener('input', e => {
    if (c.text === e.target.value) return;
    if (typingCueId !== c.id) { checkpoint(); typingCueId = c.id; } else revision++;
    c.text = e.target.value; c.reviewed = false; aiResults.delete(c.id);
    $('#character-count').textContent = `${c.text.length} characters`;
    $('.status-tag').textContent = 'Awaiting review'; $('.status-tag').classList.remove('done');
    $('#review').innerHTML = `${icon('check')} Mark reviewed`; $('#undo').disabled = false; $('#reset').disabled = c.text === c.original;
    if (!project.audit.at(-1)?.endsWith(`Edited cue ${c.id}`)) record(`Edited cue ${c.id}`);
    persist(); render({ preserveEditor: true });
  });
  $('#cue-text').addEventListener('blur', () => { typingCueId = null; });
}
function renderSignals() {
  const c = current();
  if (!c) return;
  const findings = cueSignals(c);
  $('#signals').innerHTML = findings.length ? findings.map((s, i) => `<article class="signal-card"><span class="signal-type ${s.type.toLowerCase()}">${s.type === 'Terms' ? icon('book-a') : s.type === 'Numbers' ? icon('hash') : icon('circle-help')}${s.type}</span><h4>${esc(s.title)}</h4><p>${esc(s.detail)}</p>${s.replacement ? `<button class="suggestion-button" data-suggestion="${i}">Use “${esc(s.replacement)}” ${icon('corner-down-left')}</button>` : ''}</article>`).join('') : `<div class="clear-signal">${icon('circle-check')}<h4>No rule signals</h4><p>Still listen and review. Rules cannot establish accuracy.</p></div>`;
  updateAiControls();
  renderAi();
}
function setAiCooldown(milliseconds) {
  aiCooldownUntil = Math.max(aiCooldownUntil, Date.now() + Math.min(86400000, Math.max(0, milliseconds)));
  try { sessionStorage.setItem('medcue-ai-cooldown', String(aiCooldownUntil)); } catch {}
  updateAiControls();
}
function updateAiControls() {
  const seconds = Math.max(0, Math.ceil((aiCooldownUntil - Date.now()) / 1000));
  const button = $('#ai'), waiting = $('#ai-wait');
  button.disabled = !current() || !aiConfigReady || !aiConfigured || aiBusy || seconds > 0;
  button.textContent = staticSite ? 'AI needs the server edition' : aiBusy ? `Checking cue ${aiCueId}…` : seconds ? `Available in ${seconds}s` : 'Check with AI';
  waiting.hidden = !aiBusy && seconds === 0;
  waiting.textContent = aiBusy ? `You can keep editing while cue ${aiCueId} is checked. Changed text will need a new review.` : `Please wait ${seconds}s before another AI request. You can keep editing and exporting.`;
}
setInterval(updateAiControls, 1000);
function normalizeAiResult(result, text) {
  if (!result || !Array.isArray(result.suggestions)) throw new Error('Unexpected AI response');
  return { suggestions: result.suggestions.filter(s => s && typeof s.quote === 'string' && s.quote.length > 0 && s.quote.length <= 300 && text.includes(s.quote) && typeof s.reason === 'string' && s.reason.length <= 500).slice(0, 4) };
}
function renderAi() {
  const result = aiResults.get(current()?.id);
  $('#ai-results').innerHTML = !result ? '' : result.error ? `<p class="ai-error">${esc(result.error)}</p>` : `<p class="small">AI suggestions • unverified</p>${result.suggestions.length ? result.suggestions.map(s => `<div class="ai-suggestion"><strong>“${esc(s.quote)}”</strong><p>${esc(s.reason)}</p></div>`).join('') : '<p>No specific wording issues suggested. This is not a correctness check.</p>'}`;
}
function stop() { clipEnd = null; player?.pause(); }
function advanceReview() {
  const candidates = [...project.cues.slice(selected + 1), ...project.cues.slice(0, selected + 1)];
  const next = candidates.find(c => !c.reviewed && matches(c));
  stop();
  if (next) selected = project.cues.indexOf(next);
  render();
  if (next) {
    document.querySelector(`[data-cue="${next.id}"]`)?.scrollIntoView({ block: 'nearest' });
    $('#cue-text')?.focus({ preventScroll: true });
  } else notify('No more unreviewed cues in this view.');
}
function acceptImport(pending) {
  const omissions = pending.emptyCues.length ? [`Explicitly omitted empty source cues: ${pending.emptyCues.map(c => c.sourceNumber).join(', ')}`] : [];
  setProject({ format: 'medcue-1', name: pending.name.replace(/\.srt$/i, ''), cues: pending.cues, glossary: project.glossary, audit: [`Imported ${pending.cues.length} cues from ${pending.name}`, ...omissions] });
  notify(`${pending.cues.length} cues imported. Attach matching audio to begin listening.`);
}
async function loadRealSample() {
  if (sampleBusy || !(await confirmReplace())) return;
  sampleBusy = true;
  const startRevision = revision;
  const button = $('#real-sample');
  if (button) { button.disabled = true; button.textContent = 'Loading recording…'; button.setAttribute('aria-busy', 'true'); }
  try {
    const [subtitleResponse, audioResponse] = await Promise.all([fetch(assetBase + 'sample/antibiotics.srt'), fetch(assetBase + 'sample/antibiotics.mp3')]);
    if (!subtitleResponse.ok || !audioResponse.ok) throw new Error('The sample could not be loaded. Try again, or open your own subtitles and audio.');
    const cues = importSrt(await subtitleResponse.text()), audio = await audioResponse.blob();
    if (revision !== startRevision) { notify('Sample loading stopped because your review changed. Your work is kept.'); return; }
    setProject({ format: 'medcue-1', name: 'Antibiotics · NLM recording', cues, glossary: DEFAULT_GLOSSARY, audit: ['Source: MedlinePlus, National Library of Medicine. Public-domain audio excerpt with actual YouTube automatic captions, not medically verified.'] });
    await loadAudio(new File([audio], 'NLM-antibiotics-excerpt.mp3', { type: 'audio/mpeg' }));
    notify('Real recording loaded. Automatic captions may contain errors; compare them with the audio.');
  } catch (error) { notify(error.message || 'The sample could not be loaded. Open your own files to continue.'); }
  finally { sampleBusy = false; if (button?.isConnected) { button.disabled = false; button.textContent = 'Try a real recording'; button.removeAttribute('aria-busy'); } }
}
async function loadAudio(file) {
  if (file.size > 150 * 1024 * 1024) throw new Error('Choose audio smaller than 150 MB.');
  stop(); ready = false; $('#play').disabled = true; $('#stop').disabled = true; player?.destroy(); if (audioUrl) URL.revokeObjectURL(audioUrl);
  audioUrl = URL.createObjectURL(file);
  $('#audio-title').textContent = file.name;
  $('#audio-status').textContent = 'Preparing audio…';
  player = WaveSurfer.create({ container: '#waveform', height: 70, waveColor: '#c0d7db', progressColor: '#126c75', cursorColor: '#143343', barWidth: 3, barGap: 3, barRadius: 2, normalize: true });
  player.on('ready', () => { ready = true; $('#play').disabled = !current(); $('#stop').disabled = false; $('#audio-status').textContent = `${displayTime(player.getDuration() * 1000)} • Replay includes 1 second of context`; player.setPlaybackRate(Number($('#speed').value)); });
  player.on('play', () => { $('#audio-status').textContent = 'Playing selected cue with context'; });
  player.on('pause', () => { $('#audio-status').textContent = 'Paused • Replay includes 1 second of context'; });
  player.on('finish', () => { $('#audio-status').textContent = 'Audio finished • Replay to listen again'; });
  player.on('timeupdate', time => { if (clipEnd !== null && time >= clipEnd) stop(); });
  player.on('error', () => { ready = false; $('#play').disabled = true; $('#stop').disabled = true; $('#audio-status').textContent = 'This audio could not be decoded. Try MP3 or WAV.'; });
  try { await player.load(audioUrl); } catch { ready = false; notify('This audio could not be decoded. Try MP3 or WAV.'); }
}
function download(content, name, type) { const url = URL.createObjectURL(new Blob([content], { type })); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
function setProject(value) { $('#play').disabled = true; $('#stop').disabled = true; stop(); player?.destroy(); player = undefined; ready = false; if (audioUrl) URL.revokeObjectURL(audioUrl); audioUrl = ''; $('#audio-title').textContent = 'Attach audio to listen'; $('#audio-status').textContent = 'MP3, WAV, M4A or OGG • audio is never uploaded'; project = value; signalCache.clear(); selected = 0; filter = 'All cues'; query = ''; $('#search').value = ''; undo = []; aiResults.clear(); revision++; persist(); render(); }
async function confirmReplace() { return !project.cues.length || confirm('Replace this review? Save a project file first if you want to keep it.'); }
async function readText(file, limit) { if (file.size > limit) throw new Error('This file is too large.'); return file.text(); }
document.addEventListener('click', async e => {
  const button = e.target.closest('button'); if (!button) return;
  try {
    typingCueId = null;
    if (button.dataset.filter) { filter = button.dataset.filter; render(); }
    if (button.dataset.cue) { stop(); selected = project.cues.findIndex(c => c.id === Number(button.dataset.cue)); render(); }
    if (button.dataset.suggestion !== undefined) { const c = current(); const s = cueSignals(c)[Number(button.dataset.suggestion)]; if (s?.replacement) { checkpoint(); c.text = replaceAlias(c.text, s.match, s.replacement); c.reviewed = false; aiResults.delete(c.id); record(`Applied glossary spelling to cue ${c.id}`); persist(); render(); } }
    switch (button.id) {
      case 'real-sample': await loadRealSample(); break;
      case 'import-confirm': if (pendingImport) { const pending = pendingImport; pendingImport = null; $('#import-dialog').close(); if (await confirmReplace()) acceptImport(pending); } break;
      case 'import-cancel': pendingImport = null; $('#import-dialog').close(); break;
      case 'import': $('#srt-file').click(); break;
      case 'audio-import': $('#audio-file').click(); break;
      case 'restore-project': $('#project-file').click(); break;
      case 'demo': case 'welcome-demo': if (await confirmReplace()) setProject({ format: 'medcue-1', name: 'A second listen', cues: importSrt(DEMO_SRT), glossary: DEFAULT_GLOSSARY, audit: ['Synthetic example loaded. Attach your own matching audio to test playback.'] }); break;
      case 'next': advanceReview(); break;
      case 'play': if (!ready) notify('Attach a supported audio file to listen in context.'); else if (!current()) notify('Open subtitles first.'); else if (current().from / 1000 >= player.getDuration()) notify('This cue starts beyond the attached audio. Check that the files match.'); else { clipEnd = Math.min(player.getDuration(), current().to / 1000 + 0.5); await player.play(Math.max(0, current().from / 1000 - 1)); } break;
      case 'stop': stop(); break;
      case 'reset': checkpoint(); current().text = current().original; current().reviewed = false; aiResults.delete(current().id); record(`Reset cue ${current().id} to original`); persist(); render(); break;
      case 'undo': if (undo.length) { project = validateProject(JSON.parse(undo.pop())); revision++; aiResults.clear(); persist(); render(); } break;
      case 'review-next': if (!current()?.text.trim()) throw new Error('Add subtitle text before marking this cue reviewed.'); if (!current().reviewed) { checkpoint(); current().reviewed = true; record(`Reviewed cue ${current().id}`); persist(); } advanceReview(); break;
      case 'review': if (!current().text.trim()) throw new Error('Add subtitle text before marking this cue reviewed.'); checkpoint(); current().reviewed = !current().reviewed; record(`${current().reviewed ? 'Reviewed' : 'Reopened'} cue ${current().id}`); persist(); render(); break;
      case 'glossary-open': $('#glossary-text').value = project.glossary; $('#glossary-dialog').showModal(); break;
      case 'glossary-save': if ($('#glossary-text').value !== project.glossary) { checkpoint(); project.glossary = $('#glossary-text').value; project.cues.forEach(c => c.reviewed = false); aiResults.clear(); record('Changed terminology; review decisions reset'); persist(); render(); } $('#glossary-dialog').close(); break;
      case 'save-project': download(JSON.stringify(project, null, 2), 'medcue-project.json', 'application/json'); notify('Project saved. Audio is not included; reattach it when reopening.'); break;
      case 'export': exportSrt(project.cues); $('#export-message').textContent = `${project.cues.length - project.cues.filter(c => c.reviewed).length} of ${project.cues.length} cues are still unreviewed.`; $('#export-dialog').showModal(); break;
      case 'export-confirm': download(exportSrt(project.cues), 'medcue-reviewed.srt', 'application/x-subrip;charset=utf-8'); $('#export-dialog').close(); notify('SRT downloaded with all cues and original timestamps.'); break;
      case 'ai': {
        if (!current() || aiBusy || !aiConfigReady || !aiConfigured || Date.now() < aiCooldownUntil) break;
        const c = current(), text = c.text, glossary = project.glossary, startRevision = revision;
        aiBusy = true; aiCueId = c.id; aiResults.delete(c.id); renderAi(); updateAiControls();
        setAiCooldown(aiMinimumIntervalMs);
        try {
          const response = await fetch('/api/review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, glossary }), signal: AbortSignal.timeout(50000) });
          let result;
          try { result = await response.json(); } catch { throw new Error('Unexpected AI response'); }
          if (response.status === 429) {
            const value = response.headers.get('Retry-After');
            const headerSeconds = value && Number.isFinite(Number(value)) ? Number(value) : value ? (Date.parse(value) - Date.now()) / 1000 : 0;
            const seconds = Math.max(Number(result?.retryAfterSeconds) || 0, Number.isFinite(headerSeconds) ? headerSeconds : 0, 15);
            setAiCooldown(seconds * 1000);
          }
          if (revision === startRevision) aiResults.set(c.id, response.ok ? normalizeAiResult(result, text) : { error: typeof result?.error === 'string' ? result.error : 'AI is unavailable.' });
        } catch {
          if (revision === startRevision) aiResults.set(c.id, { error: 'AI could not return a valid review. Your text is unchanged; editing and export still work.' });
        } finally {
          aiBusy = false; aiCueId = null; renderAi(); updateAiControls();
        }
        break;
      }
    }
  } catch (error) { notify(error.message || 'This action could not be completed.'); }
});
$('#search').addEventListener('input', e => { query = e.target.value.toLowerCase(); render(); });
$('#import-dialog').addEventListener('cancel', () => { pendingImport = null; });
document.addEventListener('keydown', e => {
  if (e.isComposing || e.repeat || document.querySelector('dialog[open]')) return;
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && current()) { e.preventDefault(); $('#review-next')?.click(); }
  if (e.altKey && e.code === 'Space' && current() && ready) { e.preventDefault(); $('#play').click(); }
});
$('#speed').addEventListener('change', e => player?.setPlaybackRate(Number(e.target.value)));
$('#srt-file').addEventListener('change', async e => { const file = e.target.files[0]; if (!file) return; try { const preview = previewSrtImport(await readText(file, 2_000_000)); const pending = { ...preview, name: file.name }; if (preview.emptyCues.length) { pendingImport = pending; $('#import-summary').textContent = `${file.name} has ${preview.cues.length} nonempty cues and ${preview.emptyCues.length} empty cues.`; $('#empty-cues').textContent = preview.emptyCues.map(c => `Cue ${c.sourceNumber}: ${stamp(c.from)} to ${stamp(c.to)}`).join('\n'); $('#import-confirm').textContent = `Import ${preview.cues.length} cues without empty entries`; $('#import-dialog').showModal(); } else if (await confirmReplace()) acceptImport(pending); } catch (error) { notify(error.message); } finally { e.target.value = ''; } });
$('#audio-file').addEventListener('change', async e => { try { if (e.target.files[0]) await loadAudio(e.target.files[0]); } catch (error) { notify(error.message); } finally { e.target.value = ''; } });
$('#project-file').addEventListener('change', async e => { try { if (!e.target.files[0]) return; const value = validateProject(JSON.parse(await readText(e.target.files[0], 4_000_000))); if (await confirmReplace()) { setProject(value); notify('Project restored. Reattach its audio to listen.'); } } catch (error) { notify(error.message || 'Could not read this project.'); } finally { e.target.value = ''; } });
render();
if (project.cues.length) $('#save-status').textContent = 'Draft restored on this browser • reattach audio to listen';

if (staticSite) {
  aiConfigReady = true; aiConfigured = false; updateAiControls();
  $('#edition-label').textContent = 'Local editing · GitHub Pages';
  $('#ai-disclosure').textContent = 'This hosted version keeps editing on your device. AI requires the self-hosted server; no API key is collected here.';
  $('#ai').textContent = 'AI needs the server edition';
  const link = document.createElement('a'); link.href = 'https://github.com/Georgefifth/medcue#run-with-a-server'; link.textContent = 'Run with a server'; $('#ai-disclosure').append(document.createTextNode(' '), link);
} else fetch('/api/config').then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(config => {
  aiConfigReady = true; aiConfigured = config.enabled === true;
  aiMinimumIntervalMs = Number.isFinite(config.minimumRequestIntervalMs) ? Math.max(1000, config.minimumRequestIntervalMs) : 15000;
  updateAiControls();
  $('#ai-disclosure').textContent = config.mode === 'ollama' ? 'When you click, this cue and glossary are sent to Ollama on the application server. Audio stays in your browser.' : config.enabled ? `When you click, this cue and glossary are sent to ${config.label}. Audio stays in your browser.` : 'Cloud AI is not configured yet. Editing and rule-based review work without it.';
}).catch(() => { aiConfigReady = true; aiConfigured = false; updateAiControls(); $('#ai-disclosure').textContent = 'AI connection settings could not be loaded. Reload the page to try again. Editing and export still work.'; });
