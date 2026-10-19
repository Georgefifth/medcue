import { test, expect } from '@playwright/test';
// Default mocks prevent regression runs from spending the owner's real API quota.
test.beforeEach(async ({ page }) => {
  await page.route('**/api/config', route => route.fulfill({ json: { mode: 'cloud', enabled: true, label: 'Test provider', minimumRequestIntervalMs: 15000 } }));
  await page.route('**/api/review', route => route.fulfill({ status: 503, json: { error: 'AI is unavailable in this offline regression test.' } }));
});
test('review, edit, persistence, undo, export and local AI failure', async ({ page }) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Explore a sample review' }).click();
  await expect(page.getByRole('heading', { name: 'A second listen' })).toBeVisible();
  await page.getByRole('button', { name: 'Use “Metformin”' }).click();
  await expect(page.locator('#cue-text')).toHaveValue(/Metformin/);
  await page.getByRole('button', { name: 'Mark reviewed' }).click();
  await expect(page.locator('#progress')).toContainText('1 of 5');
  await page.locator('#cue-text').fill('An explicitly revised subtitle.');
  await page.locator('#cue-text').press('Tab');
  await expect(page.locator('#progress')).toContainText('0 of 5');
  await page.reload(); await expect(page.locator('#cue-text')).toHaveValue('An explicitly revised subtitle.');
  await page.route('/api/review', r => r.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Local AI is unavailable for this test.' }) }));
  await page.getByRole('button', { name: 'Check with AI' }).click();
  await expect(page.locator('#ai-results')).toContainText('unavailable');
  await expect(page.locator('#cue-text')).toHaveValue('An explicitly revised subtitle.');
  await page.getByRole('button', { name: 'Export SRT', exact: true }).click();
  await expect(page.locator('#export-message')).toContainText('5 of 5');
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download SRT' }).click();
  const file = await (await downloaded).path();
  const { readFile } = await import('node:fs/promises');
  const content = await readFile(file, 'utf8');
  expect(content.match(/-->/g)).toHaveLength(5); expect(content).toContain('00:00:00,000 --> 00:00:05,000');
  expect(errors).toEqual([]);
});
test('malformed imports preserve project, unsafe text is inert, mobile does not overflow', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'Explore a sample review' }).click();
  await page.locator('#srt-file').setInputFiles({ name: 'bad.srt', mimeType: 'text/plain', buffer: Buffer.from('1\nbroken') });
  await expect(page.locator('#toast')).toContainText('malformed'); await expect(page.locator('#cue-count')).toHaveText('5');
  await page.locator('#cue-text').fill('<img src=x onerror="window.pwned=true">'); await page.locator('#cue-text').press('Tab');
  expect(await page.evaluate(() => window.pwned)).toBeUndefined();
  await page.getByRole('button', { name: 'Reset text', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  await page.screenshot({ path: 'artifacts/mobile.png', fullPage: true });
});
test('audio playback, project restore, glossary invalidation and undo', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'Explore a sample review' }).click();
  const rate = 8000, seconds = 26, samples = rate * seconds;
  const wav = Buffer.alloc(44 + samples * 2);
  wav.write('RIFF'); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22); wav.writeUInt32LE(rate, 24); wav.writeUInt32LE(rate * 2, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(samples * 2, 40);
  for (let i = 0; i < samples; i++) wav.writeInt16LE(Math.round(Math.sin(i / rate * 440 * 2 * Math.PI) * 1000), 44 + i * 2);
  await page.locator('#audio-file').setInputFiles({ name: 'synthetic-test-tone.wav', mimeType: 'audio/wav', buffer: wav });
  await expect(page.locator('#audio-status')).toContainText('00:00:26');
  await page.getByRole('button', { name: 'Replay selected cue', exact: true }).click();
  await expect(page.locator('#audio-status')).toContainText('Playing selected cue');
  await expect(page.locator('#audio-status')).toContainText('Paused', { timeout: 10000 });
  await page.getByRole('button', { name: 'Mark reviewed', exact: true }).click();
  await page.getByRole('button', { name: 'Your terminology', exact: true }).click();
  await page.locator('#glossary-text').fill('Metformin | meta formin');
  await page.getByRole('button', { name: 'Save terminology', exact: true }).click();
  await expect(page.locator('#progress')).toContainText('0 of 5');
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.locator('#progress')).toContainText('1 of 5');
  const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Save project', exact: true }).click();
  const file = await (await download).path();
  await page.getByRole('button', { name: 'Reopen cue', exact: true }).click();
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#project-file').setInputFiles(file);
  await expect(page.locator('#progress')).toContainText('1 of 5');
  await expect(page.locator('#audio-title')).toHaveText('Attach audio to listen');
});
test('desktop screenshot', async ({ page }) => {
  await page.setViewportSize({ width: 1512, height: 1000 }); await page.goto('/');
  await page.getByRole('button', { name: 'Explore a sample review' }).click();
  await page.screenshot({ path: 'artifacts/desktop.png', fullPage: true });
});
test('cloud disclosure and one-cue API review keep audio out of the request', async ({ page }) => {
  await page.route('/api/config', route => route.fulfill({ json: { mode: 'cloud', enabled: true, label: 'Example cloud provider', model: 'example-model' } }));
  let payload;
  await page.route('/api/review', async route => {
    payload = route.request().postDataJSON();
    await route.fulfill({ json: { suggestions: [{ quote: 'meta formin', reason: 'Check the terminology against the recording.' }] } });
  });
  await page.goto('/'); await page.getByRole('button', { name: 'Explore a sample review' }).click();
  await expect(page.locator('#ai-disclosure')).toContainText('Example cloud provider');
  await page.getByRole('button', { name: 'Check with AI', exact: true }).click();
  await expect(page.locator('#ai-results')).toContainText('Check the terminology');
  expect(Object.keys(payload).sort()).toEqual(['glossary', 'text']);
  expect(payload.text).toContain('meta formin');
  expect(payload.text).not.toContain('500 mg');
  await expect(page.locator('#cue-text')).toHaveValue(/meta formin/);
});

test('rate-limit countdown persists on reload and does not block editing or export', async ({ page }) => {
  await page.clock.install();
  let calls = 0;
  await page.route('**/api/review', route => { calls++; return route.fulfill({ status: 429, headers: { 'Retry-After': '30' }, json: { error: 'Too many requests. Please wait.', retryAfterSeconds: 30 } }); });
  await page.goto('/'); await page.getByRole('button', { name: 'Explore a sample review' }).click();
  await page.getByRole('button', { name: 'Check with AI', exact: true }).click();
  await expect(page.locator('#ai-results')).toContainText('Too many requests');
  await expect(page.locator('#ai')).toBeDisabled();
  await expect(page.locator('#ai-wait')).toContainText('30s');
  await page.locator('#cue-text').fill('Editing remains available during cooldown.');
  await expect(page.getByRole('button', { name: 'Export SRT', exact: true })).toBeEnabled();
  await page.reload(); await expect(page.locator('#ai')).toBeDisabled();
  await expect(page.locator('#cue-text')).toHaveValue('Editing remains available during cooldown.');
  await page.clock.fastForward(31000);
  await expect(page.getByRole('button', { name: 'Check with AI', exact: true })).toBeEnabled();
  expect(calls).toBe(1);
});
test('late AI results do not overwrite edits, reset caret or show stale suggestions', async ({ page }) => {
  let release;
  const gate = new Promise(resolve => release = resolve);
  await page.route('**/api/review', async route => {
    await gate;
    await route.fulfill({ json: { suggestions: [{ quote: 'meta formin', reason: 'A suggestion for the previous text.' }] } });
  });
  await page.goto('/'); await page.getByRole('button', { name: 'Explore a sample review' }).click();
  await page.getByRole('button', { name: 'Check with AI', exact: true }).click();
  await expect(page.locator('#ai')).toContainText('Checking cue 1');
  await page.locator('#cue-text').fill('My current edited subtitle.');
  await page.locator('#cue-text').press('Home');
  release();
  await expect(page.locator('#ai')).not.toContainText('Checking');
  await expect(page.locator('#cue-text')).toHaveValue('My current edited subtitle.');
  await expect(page.locator('#cue-text')).toBeFocused();
  await expect(page.locator('#ai-results')).not.toContainText('previous text');
  expect(await page.locator('#cue-text').evaluate(el => el.selectionStart)).toBe(0);
});
test('malformed model replies fail gracefully without changing subtitle text', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.route('**/api/review', route => route.fulfill({ json: { suggestions: null } }));
  await page.goto('/'); await page.getByRole('button', { name: 'Explore a sample review' }).click();
  const original = await page.locator('#cue-text').inputValue();
  await page.getByRole('button', { name: 'Check with AI', exact: true }).click();
  await expect(page.locator('#ai-results')).toContainText('valid review');
  await expect(page.locator('#cue-text')).toHaveValue(original);
  expect(errors).toEqual([]);
});
