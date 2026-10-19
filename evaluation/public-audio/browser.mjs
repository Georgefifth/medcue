import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { chromium, expect } from '@playwright/test';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { importSrt } from '../../src/core.js';
const root = new URL('./', import.meta.url);
const naturalAsr = process.argv.includes('--natural-asr');
const dataRoot = naturalAsr ? new URL('../editor-study/', root) : root;
const outputRoot = process.env.MEDCUE_EVAL_OUTPUT ? pathToFileURL(resolve(process.env.MEDCUE_EVAL_OUTPUT) + '/') : dataRoot;
await mkdir(outputRoot, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.MEDCUE_CHROME_PATH || '/usr/bin/google-chrome', headless: true });
const results = [];
try {
  for (const id of ['naloxone', 'antibiotics']) {
    const context = await browser.newContext({ viewport: { width: 1512, height: 1000 } });
    const page = await context.newPage();
    const errors = [], posts = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('request', r => { if (r.method() === 'POST') posts.push(r.url()); });
    // No inference calls or use of the owner's browser draft in this test.
    await page.route('**/api/review', r => r.abort());
    await page.goto(process.env.MEDCUE_EVAL_URL || 'http://127.0.0.1:8080');
    const subtitle = naturalAsr ? fileURLToPath(new URL(id + '-asr.srt', dataRoot)) : fileURLToPath(new URL(id === 'naloxone' ? 'naloxone-review.srt' : 'antibiotics.srt', root));
    const cues = importSrt(await readFile(subtitle, 'utf8'));
    await page.locator('#srt-file').setInputFiles(subtitle);
    await expect(page.locator('#cue-count')).toHaveText(String(cues.length));
    await page.locator('#audio-file').setInputFiles(fileURLToPath(new URL(id + '.mp3', root)));
    await expect(page.locator('#audio-status')).toContainText('Replay includes', { timeout: 30000 });
    // Use a short, nonzero-offset source cue to check seek and automatic stop.
    const cue = naturalAsr ? cues.find(c => c.id === (id === 'naloxone' ? 59 : 4)) : cues.find(c => c.from > 15000 && c.to - c.from < 2500);
    await page.locator(`[data-cue="${cue.id}"]`).click();
    const playback = [];
    for (const speed of ['0.75', '1.25']) {
      await page.locator('#speed').selectOption(speed);
      await page.getByRole('button', { name: 'Replay selected cue', exact: true }).click();
      await expect(page.locator('#audio-status')).toContainText('Playing selected cue');
      const start = await page.locator('audio').evaluate(el => ({ time: el.currentTime, speed: el.playbackRate, paused: el.paused }));
      assert.equal(start.speed, Number(speed)); assert.equal(start.paused, false);
      assert.ok(start.time >= Math.max(0, cue.from / 1000 - 1) - 0.15 && start.time < cue.to / 1000);
      await expect(page.locator('#audio-status')).toContainText('Paused', { timeout: 12000 });
      const end = await page.locator('audio').evaluate(el => el.currentTime);
      assert.ok(end >= cue.to / 1000 + 0.45 && end < cue.to / 1000 + 1.1);
      playback.push({ speed: Number(speed), seekSeconds: start.time, stopSeconds: end });
    }
    await page.locator('#cue-text').fill(cue.text + ' [test edit]');
    await page.locator('#cue-text').press('Tab');
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect(page.locator('#cue-text')).toHaveValue(cue.text);
    await page.getByRole('button', { name: 'Mark reviewed', exact: true }).click();
    await expect(page.locator('#progress')).toContainText(`1 of ${cues.length}`);
    await page.getByRole('button', { name: 'Export SRT', exact: true }).click();
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download SRT', exact: true }).click();
    const exported = importSrt(await readFile(await (await pending).path(), 'utf8'));
    assert.deepEqual(exported, cues);
    await page.screenshot({ path: fileURLToPath(new URL(id + '-browser.png', outputRoot)), fullPage: true });
    assert.deepEqual(errors, []); assert.deepEqual(posts, []);
    results.push({ id, cueCount: cues.length, playbackCue: cue.id, playback, editedAndUndone: true, reviewed: 1, exportPreservedAllTextAndTimestamps: true, pageErrors: errors, postRequests: posts });
    await context.close();
  }
  await writeFile(new URL('browser-results.json', outputRoot), JSON.stringify({ testedAt: new Date().toISOString(), isolatedBrowserContext: true, naturalAsr, results }, null, 2) + '\n');
  console.log(JSON.stringify(results, null, 2));
} finally { await browser.close(); }
