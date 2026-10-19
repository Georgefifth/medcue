// Inspect only this repository's index and built static artifact. Never print
// matched credentials or read unrelated projects. This is a preflight, not a
// claim that automated scanning can prove absence of every sensitive datum.
import { execFileSync } from 'node:child_process';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
const root = process.cwd();
function git(args, options) { try { return execFileSync('git', args, options); } catch { throw new Error('Git inspection failed; no subprocess output is displayed.'); } }
const staged = git(['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
const blocked = staged.filter(p => /(^|\/)\.env(?:$|\.)/.test(p) && p !== '.env.example' || /^(node_modules|dist|dist-pages|artifacts|test-results)\//.test(p));
if (blocked.length) throw new Error('Unexpected publication paths: ' + blocked.join(', '));
try { process.loadEnvFile('.env'); } catch (e) { if (e.code !== 'ENOENT') throw e; }
const actualKeys = ['AI_API_KEY', 'GEMINI_API_KEY'].map(k => process.env[k]).filter(v => v && v.length >= 16);
const patterns = [/AIza[0-9A-Za-z_-]{30,}/, /gh[pousr]_[A-Za-z0-9]{30,}/, /-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----/, /\/home\/[^\s/]+\//];
const findings = [];
async function scan(path, label) {
  const data = await readFile(path);
  if (actualKeys.some(key => data.includes(Buffer.from(key)))) findings.push({ file: label, reason: 'Configured credential appears in file' });
  if (!data.includes(0)) {
    const text = data.toString('utf8');
    if (patterns.some(p => p.test(text))) findings.push({ file: label, reason: 'Potential secret, private key or personal absolute path' });
  }
}
for (const path of staged) {
  // Scan the bytes actually staged, as well as the current built artifact.
  const data = git(['show', ':' + path], { maxBuffer: 8 * 1024 * 1024 });
  if (actualKeys.some(key => data.includes(Buffer.from(key))) || !data.includes(0) && patterns.some(p => p.test(data.toString('utf8')))) findings.push({ file: path, reason: 'Potential credential or personal absolute path in staged bytes' });
}
let built = 0;
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await walk(path); else { await scan(path, path.slice(root.length + 1)); built++; }
  }
}
await walk(resolve('dist-pages'));
if (findings.length) { console.error(JSON.stringify(findings, null, 2)); process.exitCode = 1; }
else {
  const result = { stagedFiles: staged.length, builtFiles: built, configuredCredentialMatch: false, obviousSecretPatternOrPersonalAbsolutePathMatch: false, environmentFilesExcluded: true, limitations: 'Automated index/build preflight plus manual source review; not an exhaustive privacy/security audit.' };
  await writeFile('artifacts/publication-audit.json', JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result, null, 2));
}
