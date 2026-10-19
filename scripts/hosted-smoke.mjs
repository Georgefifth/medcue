import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, sep, extname } from 'node:path';
import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import { importSrt } from '../src/core.js';
let server, browser;
const local = process.argv.includes('--local');
let base = process.env.MEDCUE_PUBLIC_URL;
try {
  if (local) {
    const root = fileURLToPath(new URL('../dist-pages/', import.meta.url));
    server = createServer(async (req, res) => {
      const path = new URL(req.url, 'http://localhost').pathname;
      if (!path.startsWith('/medcue/')) { res.writeHead(404); return res.end(); }
      const target = resolve(root, '.' + decodeURIComponent(path.slice('/medcue'.length) === '/' ? '/index.html' : path.slice('/medcue'.length)));
      if (!target.startsWith(root.endsWith(sep) ? root : root + sep)) { res.writeHead(403); return res.end(); }
      try {
        const data = await readFile(target);
        const type = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2', '.srt': 'text/plain' }[extname(target)] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': type }); res.end(data);
      } catch { res.writeHead(404); res.end(); }
    });
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${server.address().port}/medcue/`;
  }
  if (!base) throw new Error('Set MEDCUE_PUBLIC_URL to the deployed URL or use --local after build:pages.');
  browser = await chromium.launch({ headless: true, ...(process.env.MEDCUE_CHROME_PATH ? { executablePath: process.env.MEDCUE_CHROME_PATH } : {}) });
  const page = await browser.newPage({ viewport: { width: 1512, height: 1000 } });
  const errors = [], failures = [], apis = [], posts = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if (r.status() >= 400) failures.push({ url: r.url(), status: r.status() }); });
  page.on('request', r => { if (new URL(r.url()).pathname.includes('/api/')) apis.push(r.url()); if (r.method() === 'POST') posts.push(r.url()); });
  await page.goto(base);
  await expect(page.locator('#edition-label')).toContainText('GitHub Pages');
  await expect(page.locator('#ai')).toBeDisabled();
  await expect(page.locator('#ai-disclosure')).toContainText('no API key is collected');
  const start = Date.now();
  await page.getByRole('button', { name: 'Try a real recording', exact: true }).click();
  await expect(page.locator('#cue-count')).toHaveText('14');
  await expect(page.locator('#audio-status')).toContainText('00:00:37', { timeout: 30000 });
  const sampleReadyMs = Date.now() - start;
  await page.locator('[data-cue="4"]').click();
  await page.getByRole('button', { name: 'Replay selected cue', exact: true }).click();
  await expect(page.locator('#audio-status')).toContainText('Playing');
  await expect(page.locator('#audio-status')).toContainText('Paused', { timeout: 10000 });
  await page.locator('#cue-text').fill('gonorrhea MRSA these bedbugs are');
  await page.getByRole('button', { name: 'Review & next', exact: true }).click();
  await expect(page.locator('.cue-number')).toHaveText('Cue 05');
  await expect(page.locator('#progress')).toContainText('1 of 14');
  await page.getByRole('button', { name: 'Export SRT', exact: true }).click();
  const pending = page.waitForEvent('download'); await page.getByRole('button', { name: 'Download SRT', exact: true }).click();
  const exported = importSrt(await readFile(await (await pending).path(), 'utf8'));
  const original = importSrt(await readFile(new URL('../public/sample/antibiotics.srt', import.meta.url), 'utf8'));
  assert.equal(exported.length, original.length);
  assert.deepEqual(exported.map(c => [c.from, c.to]), original.map(c => [c.from, c.to]));
  assert.equal(exported[3].text, 'gonorrhea MRSA these bedbugs are');
  assert.deepEqual(exported.filter((_, i) => i !== 3), original.filter((_, i) => i !== 3));
  const screenshot = local ? 'artifacts/pages-local.png' : 'artifacts/pages-live.png';
  await page.screenshot({ path: screenshot, fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  await page.screenshot({ path: local ? 'artifacts/pages-local-mobile.png' : 'artifacts/pages-live-mobile.png', fullPage: true });
  assert.deepEqual(errors, []); assert.deepEqual(failures, []); assert.deepEqual(apis, []); assert.deepEqual(posts, []);
  const result = { testedAt: new Date().toISOString(), base: local ? 'Local static server under /medcue/' : base, sampleReadyMs, measurement: 'Single automation observation, not a performance benchmark or human task time', imported: 14, reviewed: 1, advancedTo: 5, exportTextAndTimingPassed: true, localPlaybackPassed: true, noHorizontalOverflowAt390px: true, apiRequests: apis, postRequests: posts, pageErrors: errors, failedResponses: failures };
  await writeFile(local ? 'artifacts/pages-local.json' : 'artifacts/pages-live.json', JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result, null, 2));
} finally { await browser?.close(); if (server) await new Promise(r => server.close(r)); }
