import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const modules = process.env.MEDCUE_RUNTIME_MODULES;
process.env.RUNTIME_NODE_MODULES = modules;
const skill = process.env.MEDCUE_PRESENTATION_SKILL;
if (!modules || !skill) throw new Error('Set MEDCUE_RUNTIME_MODULES and MEDCUE_PRESENTATION_SKILL to the installed presentation runtime and skill.');
const req = createRequire(path.join(modules, 'loader.cjs'));
const { Presentation, PresentationFile } = await import(pathToFileURL(req.resolve('@oai/artifact-tool')).href);
const { finalizePresentation, applyPresentationChartFont } = await import(pathToFileURL(path.join(skill, 'container_tools/artifact_tool_utils.mjs')).href);
const root = fileURLToPath(new URL('../../../', import.meta.url));
const out = path.join(root, 'output/demo'), build = path.join(root, 'artifacts/demo-build');
await fs.mkdir(path.join(out, 'assets'), { recursive: true });
const P = Presentation.create({ slideSize: { width: 1920, height: 1080 } });
P.theme.defaultFont = 'DejaVu Sans';
const C = { bg:'#EDF2F3', paper:'#FFFFFF', ink:'#143343', teal:'#126C75', muted:'#516C77', line:'#B7CDD1', soft:'#DCECEE', evidence:'#F6E5A9', warning:'#80521C' };
const evidence = 'https://github.com/Georgefifth/medcue/blob/codex/medcue/evaluation/editor-study/README.md';
const slides = [];
function shape(s,name,x,y,w,h,fill='none',stroke='none',geometry='rect') { return s.shapes.add({name,geometry,position:{left:x,top:y,width:w,height:h},fill,line:{fill:stroke,width:stroke==='none'?0:3,style:'solid'}}); }
function text(s,name,t,x,y,w,h,size=36,color=C.ink,bold=false,align='left',font='DejaVu Sans') {
 const o=shape(s,name,x,y,w,h);o.text=t;o.text.style={typeface:font,fontSize:size,color,bold,alignment:align,verticalAlignment:'top',autoFit:'none',wrap:'square',insets:0};return o;
}
function line(s,name,x,y,w,color=C.line,weight=2) { return s.shapes.add({name,geometry:'line',position:{left:x,top:y,width:w,height:0},fill:'none',line:{fill:color,width:weight,style:'solid'}}); }
function arrow(s,a,b,from='right',to='left',color=C.teal){return s.shapes.connect(a,b,{kind:'straight',fromSide:from,toSide:to,line:{fill:color,width:4,style:'solid'},tail:{type:'triangle',width:'med',length:'med'}});}
function add(id,title,notes='') {const s=P.slides.add();s.background.fill=C.bg;shape(s,'caption-safe-area',0,900,1920,180,C.ink);text(s,'slide-title',title,90,60,1740,100,64,C.ink,true);s.speakerNotes.text=notes;slides.push({id,s});return s;}
function node(s,name,title,sub,x,y,w=350,h=190,active=true){const n=shape(s,name,x,y,w,h,active?C.paper:C.bg,active?C.teal:C.line);text(s,name+'-title',title,x+25,y+28,w-50,58,42,active?C.teal:C.muted,true);text(s,name+'-sub',sub,x+25,y+95,w-50,h-100,30,C.muted);return n;}
function foot(s,t){text(s,'source-disclosure',t,90,820,1740,62,28,C.muted);}
// 01: concrete transcription evidence, rather than a decorative title page.
{
 const s=add('01-problem','MedCue',`Sources: ${evidence}\nNLM source: https://medlineplus.gov/medlineplus-videos/antibiotics-vs-bacteria-fighting-the-resistance/\nActual ASR cue 4. This is a selected example, not an accuracy or prevalence claim.`);
 text(s,'purpose','Subtitle review for medical education',90,164,1720,65,44,C.muted);
 text(s,'source-label','AUTOMATIC CAPTION',100,325,760,50,30,C.muted,true);
 text(s,'original-word','mersa',100,405,760,160,130,C.ink,true);
 const a=shape(s,'source-anchor',815,450,10,10);const b=shape(s,'decision-anchor',1045,450,10,10);arrow(s,a,b);
 text(s,'decision-label','AFTER LISTENING',1100,325,720,50,30,C.teal,true);
 text(s,'reviewed-word','MRSA',1100,405,720,160,130,C.teal,true);
 line(s,'source-separator',100,625,1710);
 text(s,'source-cue','“gonorrhea mersa these bedbugs are”',100,670,1700,65,44,C.ink);
 foot(s,'Actual automatic captions from public NLM audio. The editor makes the correction.');
}
function workflow(id,focus=false){
 const s=add(id,focus?'The recording guides the decision':'The review workflow',`Implementation: https://github.com/Georgefifth/medcue/blob/codex/medcue/src/main.js\nThese are editor actions, not enforced playback prerequisites. The one-action review transition is structural, not measured human time savings.`);
 const titles=['Open','Listen','Review','Export'];const subs=['SRT and matching audio','Replay the selected cue','Edit against the original','SRT keeps its timing'];
 const xs=[100,555,1010,1465];const nodes=xs.map((x,i)=>{text(s,`step-${i}-number`,`0${i+1}`,x,255,350,66,48,focus&&i<1||focus&&i>2?C.muted:C.teal,true);return node(s,`step-${i}`,titles[i],subs[i],x,350,350,205,!focus||i===1||i===2);});
 for(let i=0;i<3;i++)arrow(s,nodes[i],nodes[i+1],'right','left',focus&&i!==1?C.line:C.teal);
 text(s,'workflow-human','Review & next',1010,624,700,60,48,C.teal,true);
 text(s,'workflow-transition','One action records the decision and selects the next cue',1010,695,780,90,30,C.muted);
 if(focus){line(s,'listen-underline',580,590,290,C.teal,6);text(s,'listen-note','Replay includes nearby audio',100,695,760,70,34,C.ink);}
 else text(s,'source-note','Original text and timestamps remain available throughout',100,695,800,90,34,C.ink);
 foot(s,'Audio stays on the device. Editing and export work without AI.');
}
workflow('02-workflow');workflow('03-listen-focus',true);
// 04: original screenshot crop, with editable native annotations.
{
 const s=add('04-workspace','Evidence beside the edit',`Screenshot captured from https://georgefifth.github.io/medcue/ in an isolated recorder session on 2026-10-19. No text or review decisions altered for this screenshot. Crop is of the original evidence area, not a mockup.`);
 const bytes=await fs.readFile(path.join(out,'assets/medcue-original-cue-04.png'));
 s.images.add({blob:bytes,contentType:'image/png',alt:'Real MedCue cue 4 showing nearby original context, immutable original subtitle and final subtitle textarea',fit:'contain',crop:{left:685/1920,top:393/1080,right:455/1920,bottom:195/1080},position:{left:760,top:230,width:1060,height:665}});
 const y=[310,455,610];const labels=['Nearby original context','Original stays unchanged','The editor owns the final text'];
 y.forEach((v,i)=>{text(s,`callout-${i}-number`,`0${i+1}`,100,v,95,64,44,C.teal,true);text(s,`callout-${i}`,labels[i],215,v,470,115,40,C.ink,true);const a=shape(s,`callout-anchor-${i}`,690,v+45,2,2);const b=shape(s,`callout-target-${i}`,785,v+45,2,2);arrow(s,a,b);});
}
// 05: browser processing boundary.
{
 const s=add('05-local-architecture','The editing loop runs in the browser',`Sources: https://github.com/Georgefifth/medcue/blob/codex/medcue/src/main.js and src/core.js. GitHub Pages serves static assets. User audio is not uploaded. Browser draft storage is localStorage, not encrypted medical-record storage. Audio is reattached after reload.`);
 text(s,'input-label','DEVICE FILES',110,260,470,55,30,C.muted,true);
 const a=node(s,'input','SRT + audio','Existing subtitles and recording',100,350,420,205);
 const b=node(s,'browser','Review desk','Parser, WaveSurfer and glossary rules',720,350,490,205);
 const c=node(s,'output','SRT + project','Export text or save review decisions',1430,350,390,205);
 arrow(s,a,b);arrow(s,b,c);
 text(s,'browser-scope','BROWSER',730,260,480,55,30,C.teal,true);
 line(s,'browser-data-boundary',720,610,490,C.teal,4);
 text(s,'draft-data','Originals, edits and review history',720,650,570,90,34,C.ink);
 text(s,'audio-boundary','Audio playback stays here',720,755,650,60,34,C.teal,true);
 foot(s,'The public Pages edition has no AI backend. No API key is collected there.');
}
// 06: separate sequence for optional inference, without implying Pages runs it.
{
 const s=add('06-ai-architecture','Optional AI request',`Sources: https://github.com/Georgefifth/medcue/blob/codex/medcue/server/ai.mjs and src/main.js. Only a selected cue and glossary are sent after explicit Check with AI. The Node server protects its key and applies spacing/concurrency/budget guards. A configured cloud endpoint or server-side Ollama returns unverified suggestions. Pages has no such backend. No live model call is made during this video.`);
 text(s,'server-edition','SERVER EDITION ONLY',100,220,1720,55,32,C.teal,true);
 const xs=[100,555,1010,1465];const tt=['Explicit click','Node API','Model','Suggestions'];const ss=['Selected cue + glossary','Request limits and server-side key','Cloud API or Ollama','Quotes to investigate'];
 const ns=xs.map((x,i)=>node(s,`ai-${i}`,tt[i],ss[i],x,350,350,230));for(let i=0;i<3;i++)arrow(s,ns[i],ns[i+1]);
 line(s,'audio-stays-divider',100,650,1715);
 text(s,'no-audio','Audio stays in the browser',100,700,850,70,44,C.teal,true);
 text(s,'manual-apply','The editor accepts every change',1030,700,780,100,42,C.ink,true);
 foot(s,'Rate-limit or provider failures leave editing and export available. No automatic retries.');
}
// 07: editable SRT evidence from the same core exporter, with literal syntax.
{
 const s=add('07-output','Changed words, unchanged timing',`Source: public/sample/antibiotics.srt cue 4 and src/core.js exportSrt. The reviewed wording shown is a manual demonstration correction, supported by the separately preserved publisher captions across adjacent publisher cues. This is a prepared example. The live demonstration exports all 14 cues while only one has been marked reviewed. Other cues may still contain errors.`);
 const timing='00:00:09,769 --> 00:00:13,789';
 text(s,'original-label','SOURCE CUE 4',100,260,780,50,30,C.muted,true);
 text(s,'output-label','MANUALLY REVIEWED CUE 4',1020,260,800,50,30,C.teal,true);
 text(s,'original-srt',`4\n${timing}\ngonorrhea mersa these bedbugs are`,100,355,800,290,36,C.ink,false,'left','DejaVu Sans Mono');
 text(s,'output-srt',`4\n${timing}\nGonorrhea. MRSA. These bad bugs are`,1020,355,800,290,36,C.ink,false,'left','DejaVu Sans Mono');
 line(s,'timing-source-emphasis',100,447,780,C.teal,4);line(s,'timing-output-emphasis',1020,447,780,C.teal,4);
 text(s,'all-cues','All 14 cues exported',100,715,820,70,46,C.teal,true);
 text(s,'pending-disclosure','13 still await review',1020,715,800,70,46,C.muted,true);
 foot(s,'SRT carries text and timing. Save a project file to retain decisions and history.');
}
// 08: native chart with literal source data, rather than an accuracy graphic.
{
 const s=add('08-evidence','Text and timing survived the round trip',`Data: ${evidence}\nNatural ASR antibiotics=134 cues, naloxone=123 cues, sum=257. These are developer-run import/export checks. Selected-cue playback was tested, not a manual listening review of every cue. They are not medical accuracy data. Current release tests: docs/verification.json, core=9, API=13, browser=14.`);
 text(s,'total','257',100,255,550,180,150,C.teal,true);
 text(s,'unit','actual automatic-caption cues',100,455,610,130,42,C.ink,true);
 const chart=s.charts.add('bar',{position:{left:760,top:260,width:1060,height:350},categories:['Antibiotics','Naloxone'],series:[{name:'Cues',values:[134,123],fill:C.teal}],barOptions:{direction:'bar',grouping:'clustered',gapWidth:95},hasLegend:false,chartFill:C.bg,plotAreaFill:C.bg,xAxis:{visible:true,textStyle:{fontSize:32,fill:C.ink},line:{fill:'none',width:0},majorGridlines:null},yAxis:{visible:false,min:0,max:150,majorGridlines:null},dataLabels:{showValue:true,position:'outEnd',textStyle:{fontSize:36,fill:C.teal,bold:true}}});
 applyPresentationChartFont(chart,{fontFamily:'DejaVu Sans'});
 text(s,'checks','22 core/API checks and 14 browser tests pass',100,680,1740,70,42,C.ink,true);
 foot(s,'Developer-run checks. Human time savings and medical correctness remain unmeasured.');
}
// 09: two actual frozen model responses, including the inconvenient one.
{
 const s=add('09-ai-limits','An AI suggestion can misdirect attention',`Recorded responses: https://github.com/Georgefifth/medcue/blob/codex/medcue/evaluation/editor-study/gemini-natural-asr.json\nFour developer-selected, unblinded cases. Displayed quotes and reasons below are exact model output. The gonorrhea cue contains a different actual mismatch (death vs deaf in the reference); the suggested quote misses it. No inference is performed for the video. Not an accuracy estimate.`);
 text(s,'recorded-label','RECORDED GEMINI RESPONSES',100,218,1720,55,30,C.muted,true);
 text(s,'useful-label','A useful lead',100,320,780,60,40,C.teal,true);
 text(s,'useful-quote','“mersa”',100,405,780,105,82,C.ink,true);
 text(s,'useful-reason','“possible mishearing of medical term MRSA”',100,540,770,155,36,C.muted);
 text(s,'warning-label','A misplaced warning',1030,320,790,60,40,C.warning,true);
 text(s,'warning-quote','“gonorrhea”',1030,405,790,105,82,C.ink,true);
 text(s,'warning-reason','“Check for similar-sounding medical terminology”',1030,540,780,155,36,C.muted);
 line(s,'caveat-divider',100,722,1710);
 foot(s,'Four selected checks included a misplaced warning on a correct term. Suggestions never apply themselves.');
}
// 10: an actionable destination and precise scope.
{
 const s=add('10-try','MedCue demo',`Public site: https://georgefifth.github.io/medcue/\nSource: https://github.com/Georgefifth/medcue\nThe hosted edition runs editing only. No account is required. AI requires the server edition. This video uses a real recording walkthrough and illustrative diagrams, not a human validation study.`);
 text(s,'url','georgefifth.github.io/medcue/',100,295,1720,130,78,C.teal,true);
 text(s,'start','Choose “Try a real recording”',100,485,1720,85,54,C.ink,true);
 text(s,'sample','37.5 seconds of public NLM audio with actual automatic captions',100,610,1660,105,36,C.muted);
 line(s,'cta-divider',100,760,1710);
 foot(s,'Source and server setup: github.com/Georgefifth/medcue');
}
for(const {id,s} of slides){await fs.writeFile(path.join(out,'assets',id+'.png'),new Uint8Array(await (await P.export({slide:s,format:'png',scale:1})).arrayBuffer()));await fs.writeFile(path.join(build,id+'.layout.json'),await (await s.export({format:'layout'})).text());console.log('Rendered '+id);}
await fs.writeFile(path.join(out,'slides.json'),JSON.stringify(slides.map(({id},i)=>({id,page:i+1,png:`assets/${id}.png`})),null,2));
await fs.mkdir(path.join(build,'finalizer'),{recursive:true});
const candidatePath=path.join(build,'finalizer/candidate.pptx');await (await PresentationFile.exportPptx(P)).save(candidatePath);
const result=await finalizePresentation({workspaceDir:root,candidatePath,finalPath:path.join(out,'medcue-visual-story.pptx'),pythonExecutable:process.env.MEDCUE_RUNTIME_PYTHON,integrityValidatorPath:path.join(skill,'container_tools/inspect_presentation_package_integrity.py'),layoutValidatorPath:path.join(skill,'container_tools/inspect_presentation_layout_geometry.py'),layoutArgs:['--expected-slide-size-emu','18288000,10287000','--validate-heading-fit'],requiredNativeChartOwnerSlides:[8],materializeLiteralChartWorkbooks:true,fontPolicy:{basis:'design',families:['DejaVu Sans','DejaVu Sans Mono']},verifyArtifactToolImport:true,receiptPath:path.join(build,'finalizer/validation.json')});
console.log('Editable deck finalized.');
