import { readFile, writeFile, access } from 'node:fs/promises';
import { inspect, stamp, importSrt, exportSrt } from '../src/core.js';
const fixture = JSON.parse(await readFile(new URL('./fixtures.json',import.meta.url),'utf8'));
const cueFor = c => ({id:1,from:0,to:15000,text:c.text,original:c.text,reviewed:false});
const results = fixture.cases.map(c => ({id:c.id,group:c.group,signals:inspect(cueFor(c),[cueFor(c)],fixture.glossary),knownAlias:c.knownAlias}));
const spelling=results.filter(c=>c.group==='spelling'), clean=results.filter(c=>c.group==='clean'), audio=results.filter(c=>c.group==='audio-dependent');
const summary = {spellingCues:spelling.length,spellingFlagged:spelling.filter(c=>c.signals.some(s=>s.type==='Terms')).length,knownAliasCases:spelling.filter(c=>c.knownAlias).length,unseenSpellingCases:spelling.filter(c=>!c.knownAlias).length,unseenSpellingFlagged:spelling.filter(c=>!c.knownAlias&&c.signals.some(s=>s.type==='Terms')).length,cleanCues:clean.length,cleanCuesWithAttentionSignals:clean.filter(c=>c.signals.length).length,audioDependentCues:audio.length,audioDependentCuesWithSignals:audio.filter(c=>c.signals.length).length};
const srt=fixture.cases.map((c,i)=>`${i+1}\n${stamp(i*15000)} --> ${stamp((i+1)*15000)}\n${c.text}`).join('\n\n')+'\n';
const cues=importSrt(srt), roundtrip=importSrt(exportSrt(cues));
const report={fixtureVersion:fixture.version,summary,roundtripPassed:JSON.stringify(cues)===JSON.stringify(roundtrip),results,limitations:['Small convenience sample selected by the developer.','Labels and scoring were prepared by the developer, not independent clinical reviewers.','Timing is synthetic; no audio or actual ASR output.','Clean-cue attention signals are not necessarily error accusations.','No human time-savings measurement or Subtitle Edit/Descript usability comparison.']};
await writeFile(new URL('./rules-current.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
try { await writeFile(new URL('./rules-baseline.json',import.meta.url),JSON.stringify(report,null,2)+'\n',{flag:'wx'}); } catch(error) { if(error.code!=='EEXIST') throw error; }
await writeFile(new URL('./review-fixtures.srt',import.meta.url),srt);
console.log(JSON.stringify(summary));
if(process.argv.includes('--live')) {
  try { await access(new URL('./gemini-live.json',import.meta.url)); throw new Error('Live results already exist. Refusing to spend quota or overwrite the frozen run. Use a new evaluation directory for another study.'); } catch(error) { if(error.code!=='ENOENT') throw error; }
  const base=process.env.MEDCUE_EVAL_URL||'http://127.0.0.1:8080';
  const config=await (await fetch(base+'/api/config')).json();
  if(!config.enabled) throw new Error('Server AI is not configured. No inference requests sent.');
  const interval=Math.max(16000,Number(config.minimumRequestIntervalMs)||0);
  const live={model:config.model,requestedCaseIds:fixture.cases.filter(c=>c.live).map(c=>c.id),results:[],automaticRetries:false,referenceWithheld:true};
  for(const c of fixture.cases.filter(c=>c.live)) {
    if(live.results.length) await new Promise(resolve=>setTimeout(resolve,interval));
    const started=Date.now();
    let response,payload;
    try { response=await fetch(base+'/api/review',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:c.text,glossary:fixture.glossary}),signal:AbortSignal.timeout(50000)});payload=await response.json(); }
    catch { live.results.push({id:c.id,error:'Transport failure; no automatic retry'});break; }
    live.results.push({id:c.id,httpStatus:response.status,elapsedMs:Date.now()-started,...(response.ok?{suggestions:payload.suggestions}:{error:payload.error,retryAfter:response.headers.get('retry-after')})});
    await writeFile(new URL('./gemini-live.json',import.meta.url),JSON.stringify(live,null,2)+'\n');
    console.log(JSON.stringify(live.results.at(-1)));
    if(!response.ok) break;
  }
  await writeFile(new URL('./gemini-live.json',import.meta.url),JSON.stringify(live,null,2)+'\n');
}
