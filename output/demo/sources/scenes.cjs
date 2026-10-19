const path=require('node:path');
const {pathToFileURL}=require('node:url');
const output=path.resolve(__dirname,'..');
const A=path.join(output,'assets');
const card=(name,id,duration,vo)=>({name,card:{image:path.join(A,id+'.png')},duration,vo});
const wait=(sel)=>({type:'waitFor',sel});const click=(sel)=>({type:'click',sel});const hold=(ms)=>({type:'wait',ms});
// This hook inspects the real Blob passed to the app's download link. It does
// not replace the exporter or supply subtitle text. The viewer labels itself
// as a video overlay, not a shipped product feature.
const exportInspector=`(() => {
 const nativeClick=HTMLAnchorElement.prototype.click;
 HTMLAnchorElement.prototype.click=function(){
   if(this.download==='medcue-reviewed.srt' && this.href.startsWith('blob:')) {
     fetch(this.href).then(r=>r.text()).then(srt=>{
       document.body.style.zoom='1';document.body.style.width='1920px';document.body.style.height='900px';
       const layer=document.createElement('section');layer.id='demo-export-inspection';
       layer.style.cssText='position:fixed;inset:0;z-index:2147483600;background:#edf2f3;color:#143343;padding:70px 100px 195px;font-family:DejaVu Sans,sans-serif';
       const title=document.createElement('h1');title.textContent='Downloaded SRT';title.style.cssText='font-size:64px;margin:0 0 20px';
       const label=document.createElement('p');label.textContent='Actual export contents shown in a demo inspection overlay';label.style.cssText='font-size:30px;color:#516c77;margin:0 0 45px';
       const pre=document.createElement('pre');pre.textContent=srt.split(/\\n\\n/).slice(0,4).join('\\n\\n');pre.style.cssText='font:28px/1.32 DejaVu Sans Mono,monospace;margin:0;white-space:pre-wrap';
       const count=document.createElement('p');const cueCount=srt.trim().split(/\\n\\s*\\n/).length;const reviewed=Number(document.querySelector('#progress strong')?.textContent.match(/^[0-9]+/)?.[0]||0);count.textContent='All '+cueCount+' cues exported. '+(cueCount-reviewed)+' still await review.';count.style.cssText='font-size:30px;color:#126c75;position:absolute;left:1050px;top:340px;width:690px';
       layer.append(title,label,pre,count);document.body.append(layer);
     });
   }
   return nativeClick.call(this);
 };
})();`;
module.exports=[
card('01 actual transcription example','01-problem',8,'Automatic captions can turn a medical term into a plausible word. MedCue helps education editors compare that text with the recording.'),
{name:'02 workflow focus',url:pathToFileURL(path.join(__dirname,'motion.html')).href,actions:[wait('.camera'),hold(10000)],vo:'Open the subtitles and matching audio. Listen to a cue, edit against the original, then review and continue. The editor controls every change.'},
{name:'03 open the real application',session:'medcue',url:'https://georgefifth.github.io/medcue/',actions:[wait('#real-sample'),{type:'exec',js:"document.body.style.cssText += ';zoom:1.25;position:absolute;top:0;left:0;width:1536px;height:720px;overflow:auto;background:#edf2f3';document.documentElement.style.background='#edf2f3'"},click('#real-sample'),wait('#play:not([disabled])')],duration:9,vo:'Here is the working app. This example loads fourteen actual automatic captions and a matching public National Library of Medicine recording.'},
{name:'04 select the discrepant cue',session:'medcue',actions:[wait('[data-cue="4"]'),click('[data-cue="4"]'),hold(3500)],duration:7,vo:'Cue four contains the word mersa. Its original text and nearby context remain visible.'},
{name:'05 source audio playback',session:'medcue',actions:[wait('#play:not([disabled])'),click('#play'),hold(5700)],caption:'Source recording: National Library of Medicine. Selected cue with context.'},
card('06 annotated source evidence','04-workspace',8,'The workspace separates the original evidence from the final subtitle. Listening guides the correction, while the original stays unchanged.'),
// New session after the annotation card: reload restores the draft and offers
// the verified example audio. This also demonstrates real recovery.
{name:'07 restore audio without replacing edits',session:'resume',url:'https://georgefifth.github.io/medcue/',actions:[wait('#restore-sample-audio'),{type:'exec',js:"document.body.style.cssText += ';zoom:1.25;position:absolute;top:0;left:0;width:1536px;height:720px;overflow:auto;background:#edf2f3';document.documentElement.style.background='#edf2f3'"},click('#restore-sample-audio'),wait('#play:not([disabled])')],duration:8,vo:'After a refresh, the selected cue returns. Restore example audio reattaches the recording without replacing the review.'},
{name:'08 manual correction',session:'resume',actions:[wait('#cue-text'),{type:'fill',sel:'#cue-text',text:'Gonorrhea. MRSA. These bad bugs are'},hold(3500)],duration:8,vo:'After listening, the editor corrects the wording. This is a prepared demonstration, not an automatic correction or an accuracy test.'},
{name:'09 review and next',session:'resume',actions:[wait('#review-next'),click('#review-next'),hold(2200)],duration:6,vo:'Review and next records the decision and selects the next cue in one action.'},
{name:'10 undo returns to its cue',session:'resume',actions:[wait('#undo:not([disabled])'),click('#undo'),hold(2200)],duration:6,vo:'Undo restores the decision and returns to its cue, so a mistaken action is recoverable.'},
{name:'11 export with pending review visible',session:'resume',actions:[wait('#review-next'),click('#review-next'),{type:'exec',js:exportInspector}],vo:'Only one cue has been reviewed. Export keeps the remaining thirteen visible as pending.'},
{name:'12 confirm the actual export',session:'resume',actions:[wait('#export'),click('#export'),wait('#export-confirm')],duration:5,vo:'Every imported cue and its original timing will be included.'},
{name:'13 inspect the actual downloaded content',session:'resume',actions:[wait('#export-confirm'),click('#export-confirm'),wait('#demo-export-inspection'),{type:'screenshot',path:path.join(A,'actual-export-inspection.png')}],duration:7,vo:'This inspection overlay shows the actual downloaded text, not a replacement exporter.'},
card('14 output comparison','07-output',7,'The words change while the timestamps stay intact. A separate project file preserves review decisions and history.'),
card('15 browser processing boundary','05-local-architecture',9,'The parser, waveform playback, glossary rules and draft storage run in the browser. Audio stays on the device. The public site supports this editing loop without a server.'),
card('16 optional inference boundary','06-ai-architecture',10,'The optional server edition sends only the selected cue and glossary after an explicit click. A guarded Node API contacts the configured model. The public Pages site does not run inference.'),
card('17 inconvenient model evidence','09-ai-limits',10,'Earlier selected Gemini checks produced useful leads and a misplaced warning on a correct term. These are recorded responses. Suggestions are unverified and never apply themselves.'),
card('18 bounded validation evidence','08-evidence',10,'Developer checks preserved text and timestamps across two hundred fifty seven actual automatic caption cues. Twenty two core and API checks and fourteen browser tests pass. Human time savings and medical correctness remain unmeasured.'),
card('19 try the public review loop','10-try',7,'Try the real recording at the public site. The source repository includes server setup, evaluation evidence and the limits of the prototype.')
];
