"""Generate the one-page submission description; requires reportlab and pypdf."""
from pathlib import Path
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4
from pypdf import PdfReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Embed fonts so the brief renders consistently without system PDF substitutions.
font_root = Path('/usr/share/fonts/truetype/dejavu')
for name, filename in [('Body', 'DejaVuSans.ttf'), ('BodyBold', 'DejaVuSans-Bold.ttf'), ('Title', 'DejaVuSerif-Bold.ttf')]:
    pdfmetrics.registerFont(TTFont(name, str(font_root / filename)))
pdfmetrics.registerFontFamily('Body', normal='Body', bold='BodyBold', italic='Body', boldItalic='BodyBold')

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'output/pdf/medcue-project-description.pdf'
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
ink = HexColor('#143343')
teal = HexColor('#126c75')
muted = HexColor('#516c77')
body = ParagraphStyle('body', fontName='Body', fontSize=10.4, leading=14.3, textColor=ink, spaceAfter=10)
heading = ParagraphStyle('heading', parent=body, fontName='BodyBold', fontSize=11, textColor=teal, spaceBefore=7, spaceAfter=5)
small = ParagraphStyle('small', parent=body, fontSize=8.8, leading=12, textColor=muted)
items = []
def p(text, style=body):
    items.append(Paragraph(text, style))
def section(title, text):
    p(title, heading)
    p(text)

p('MedCue', ParagraphStyle('title', parent=body, fontName='Title', fontSize=36, leading=39, spaceAfter=7))
p('Listen. Check the words. Keep the meaning.', ParagraphStyle('subtitle', parent=body, fontSize=15, leading=20, textColor=teal, spaceAfter=9))
p('A source-focused subtitle review desk for medical education editors.', body)
section('The problem and the user', 'Automatic captions can mishear medical terms and qualifiers. An editor preparing an educational video needs to compare uncertain words with the recording while preserving subtitle timing. MedCue concentrates the original subtitle, neighboring context, playback and final text in one review workspace.')
steps = Table([[Paragraph(t, ParagraphStyle('step', parent=small, fontName='BodyBold', textColor=white)) for t in ['01  OPEN SRT', '02  LISTEN', '03  REVIEW', '04  EXPORT']]], colWidths=[126.8]*4)
steps.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, -1), teal), ('TOPPADDING', (0, 0), (-1, -1), 12), ('BOTTOMPADDING', (0, 0), (-1, -1), 12), ('LEFTPADDING', (0, 0), (-1, -1), 10)]))
items += [Spacer(1, 4), steps, Spacer(1, 7)]
section('What works today', 'Open existing SRT and matching audio, replay a selected cue with context, edit against the immutable original, and mark reviewed with one action. Editor-provided terminology, quantities, qualifiers and timing produce attention signals. Every decision stays manual and undoable. Export retains every cue and its timestamps; project files preserve edits and review history. Browser drafts resume the selected cue, and the built-in recording can be reattached without replacing work.')
section('Where AI fits', 'The optional server edition sends only the selected text and glossary to an OpenAI-compatible cloud API, or to Ollama. Audio stays in the browser. Quoted suggestions are unverified and never applied automatically. Request spacing, concurrency and daily limits constrain usage; rate-limit errors do not block editing. The public GitHub Pages edition supports local editing and export but does not run AI or collect API keys.')
section('Evidence and honest limits', 'Developer-run checks cover 257 actual automatic-caption cues from two public National Library of Medicine videos, including lossless text/timestamp round trips and selected-cue playback. Four selected live Gemini checks produced useful leads and a misplaced warning on a correct term. These examples are not an accuracy score. No medical expert study, human time savings or market demand has been established. MedCue supports source fidelity; it does not establish clinical correctness or replace a comprehensive timing editor.')
p('TRY THE WORKFLOW', heading)
p('<link href="https://georgefifth.github.io/medcue/" color="#126c75">georgefifth.github.io/medcue/</link> - choose <b>Try a real recording</b> for 37.5 seconds of NLM audio and 14 actual automatic captions. Source attribution is included in the repository.', small)
p('<link href="https://github.com/Georgefifth/medcue" color="#126c75">github.com/Georgefifth/medcue</link> - Vite, WaveSurfer.js, a strict SRT parser and a Node.js API adapter. Built with AI assistance; implementation and evaluation limitations are documented.', small)

def footer(canvas, doc):
    canvas.setStrokeColor(HexColor('#d1dde0'))
    canvas.line(44, 35, A4[0] - 44, 35)
    canvas.setFillColor(muted)
    canvas.setFont('Body', 8)
    canvas.drawString(44, 22, 'MedCue | Project description | 19 October 2026')
    canvas.drawRightString(A4[0] - 44, 22, '1 / 1')

doc = SimpleDocTemplate(str(OUTPUT), pagesize=A4, rightMargin=44, leftMargin=44, topMargin=36, bottomMargin=47, title='MedCue - Project Description', author='MedCue')
doc.build(items, onFirstPage=footer, onLaterPages=footer)
reader = PdfReader(OUTPUT)
assert len(reader.pages) == 1, 'The submission description must fit on one page.'
assert 'Where AI fits' in reader.pages[0].extract_text()
print('One-page project description generated and text checked.')
