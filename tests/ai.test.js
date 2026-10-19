import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { createAiHandler, configuration } from '../server/ai.mjs';

async function request(handler, payload, options = {}) {
  const req = Readable.from([options.raw ?? JSON.stringify(payload)]); req.url = options.url || '/api/review'; req.method = options.method || 'POST'; req.headers = { host: '127.0.0.1:5173', origin: options.origin || 'http://127.0.0.1:5173' };
  const res = { statusCode: 200, headers: {}, setHeader(k, v) { this.headers[k] = v; }, end(body) { this.result = JSON.parse(body); } };
  await handler(req, res, () => {}); return res;
}
const cloud = { AI_PROVIDER: 'cloud', AI_BASE_URL: 'https://provider.example/v1', AI_MODEL: 'test-model', AI_API_KEY: 'test-secret', AI_PROVIDER_NAME: 'Test provider' };
const reply = JSON.stringify({ suggestions: [{ quote: 'meta formin', reason: 'Check the spelling.' }, { quote: 'invented', reason: 'Must be removed' }] });
const input = { text: 'Say meta formin.', glossary: 'Metformin | meta formin' };

test('provider billing rejection is reported clearly without retries or model fallback', async () => {
  let calls = 0;
  const handler = createAiHandler({ env: cloud, fetcher: async () => { calls++; return { ok: false, status: 402 }; } });
  const result = await request(handler, input);
  assert.equal(result.statusCode, 402);
  assert.match(result.result.error, /billing credits/);
  assert.match(result.result.error, /Lowering RPM/);
  assert.equal(calls, 1);
});

test('rejects foreign origins, invalid JSON, long input and unsupported methods before inference', async () => {
  const handler = createAiHandler({ env: cloud, fetcher: () => { throw new Error('Must not call'); } });
  assert.equal((await request(handler, {}, { origin: 'https://example.com' })).statusCode, 403);
  assert.equal((await request(handler, {})).statusCode, 400);
  assert.equal((await request(handler, {}, { raw: '{' })).statusCode, 400);
  assert.equal((await request(handler, { text: 'x'.repeat(3001), glossary: '' })).statusCode, 400);
  assert.equal((await request(handler, {}, { method: 'GET' })).statusCode, 405);
});
test('cloud request uses server secret, selected cue, token cap and normalized response', async () => {
  let call;
  const handler = createAiHandler({ env: cloud, fetcher: async (url, options) => { call = { url, options }; return { ok: true, json: async () => ({ choices: [{ message: { content: reply } }] }) }; } });
  const response = await request(handler, input);
  assert.equal(call.url, 'https://provider.example/v1/chat/completions');
  assert.equal(call.options.headers.Authorization, 'Bearer test-secret');
  assert.equal(call.options.redirect, 'error');
  const body = JSON.parse(call.options.body); assert.equal(body.max_tokens, 700); assert.equal(body.model, 'test-model');
  assert.deepEqual(JSON.parse(body.messages[1].content), { subtitle: input.text, glossary: input.glossary });
  assert.deepEqual(response.result.suggestions, [{ quote: 'meta formin', reason: 'Check the spelling.' }]);
  const config = await request(handler, {}, { method: 'GET', url: '/api/config' });
  assert.equal(config.result.label, 'Test provider'); assert.ok(!JSON.stringify(config.result).includes('test-secret'));
});
test('Ollama remains an optional mode without cloud credentials', async () => {
  let call;
  const handler = createAiHandler({ env: { AI_PROVIDER: 'ollama' }, fetcher: async (url, options) => { call = { url, options }; return { ok: true, json: async () => ({ message: { content: reply } }) }; } });
  assert.equal((await request(handler, input)).statusCode, 200);
  assert.equal(call.url, 'http://127.0.0.1:11434/api/chat'); assert.equal(call.options.headers.Authorization, undefined);
});
test('unconfigured or unsafe cloud endpoints are disabled without falling back to local inference', async () => {
  for (const env of [{}, { ...cloud, AI_BASE_URL: 'http://provider.example/v1' }, { ...cloud, AI_BASE_URL: 'https://user:pass@provider.example/v1' }]) {
    assert.equal(configuration(env).enabled, false);
    assert.equal((await request(createAiHandler({ env }), input)).statusCode, 503);
  }
});
test('provider failure and malformed output do not reveal credentials or rewrite text', async () => {
  for (const fetcher of [async () => { throw new Error('test-secret'); }, async () => ({ ok: true, json: async () => ({ choices: [{ message: { content: 'bad json test-secret' } }] }) })]) {
    const response = await request(createAiHandler({ env: cloud, fetcher }), input);
    assert.equal(response.statusCode, 503); assert.ok(!JSON.stringify(response.result).includes('test-secret'));
  }
});
test('hourly request budget blocks calls and resets after an hour', async () => {
  let time = 0, calls = 0;
  const handler = createAiHandler({ env: { ...cloud, AI_MAX_REQUESTS_PER_HOUR: '1' }, now: () => time, fetcher: async () => { calls++; return { ok: true, json: async () => ({ choices: [{ message: { content: '{"suggestions":[]}' } }] }) }; } });
  assert.equal((await request(handler, input)).statusCode, 200);
  assert.equal((await request(handler, input)).statusCode, 429); assert.equal(calls, 1);
  time = 3600000; assert.equal((await request(handler, input)).statusCode, 200);
});
test('Gemini-named key stays server-side and is used only for the Google endpoint', async () => {
  let authorization;
  const env = { ...cloud, AI_BASE_URL: 'https://generativelanguage.googleapis.com/v1beta/openai', AI_API_KEY: '', GEMINI_API_KEY: 'dummy-gemini-key' };
  const handler = createAiHandler({ env, fetcher: async (url, options) => { authorization = options.headers.Authorization; return { ok: true, json: async () => ({ choices: [{ message: { content: '{"suggestions":[]}' } }] }) }; } });
  assert.equal((await request(handler, input)).statusCode, 200);
  assert.equal(authorization, 'Bearer dummy-gemini-key');
  assert.ok(!JSON.stringify(configuration(env)).includes('dummy-gemini-key'));
  assert.equal(configuration({ ...env, AI_BASE_URL: 'https://other.example/v1' }).enabled, false);
});
test('request spacing and sliding RPM reject excess requests without calling provider', async () => {
  let time = 0, calls = 0;
  const handler = createAiHandler({ env: { ...cloud, AI_MAX_REQUESTS_PER_MINUTE: '2', AI_MIN_REQUEST_INTERVAL_MS: '15000' }, now: () => time, fetcher: async () => { calls++; return { ok: true, json: async () => ({ choices: [{ message: { content: '{"suggestions":[]}' } }] }) }; } });
  assert.equal((await request(handler, input)).statusCode, 200);
  let result = await request(handler, input); assert.equal(result.statusCode, 429); assert.equal(result.headers['Retry-After'], '15'); assert.equal(calls, 1);
  time = 15000; assert.equal((await request(handler, input)).statusCode, 200);
  time = 30000; assert.equal((await request(handler, input)).statusCode, 429); assert.equal(calls, 2);
  time = 60000; assert.equal((await request(handler, input)).statusCode, 200);
});
test('daily cap resets on a Pacific-time date change', async () => {
  let time = Date.parse('2026-10-20T06:59:00Z');
  const handler = createAiHandler({ env: { ...cloud, AI_MAX_REQUESTS_PER_DAY: '1' }, now: () => time, fetcher: async () => ({ ok: true, json: async () => ({ choices: [{ message: { content: '{"suggestions":[]}' } }] }) }) });
  assert.equal((await request(handler, input)).statusCode, 200);
  time += 15000; assert.equal((await request(handler, input)).statusCode, 429);
  time += 120000; assert.equal((await request(handler, input)).statusCode, 200);
});
test('upstream 429 creates a cooldown and never automatically retries', async () => {
  let time = 0, calls = 0;
  const handler = createAiHandler({ env: cloud, now: () => time, fetcher: async () => { calls++; return { ok: false, status: 429, headers: new Headers({ 'Retry-After': '90' }) }; } });
  const result = await request(handler, input); assert.equal(result.statusCode, 429); assert.equal(result.result.retryAfterSeconds, 90);
  time = 20000; assert.equal((await request(handler, input)).statusCode, 429); assert.equal(calls, 1);
});
test('input-token estimate limits cumulative input in a rolling minute', async () => {
  let time = 0;
  const handler = createAiHandler({ env: { ...cloud, AI_MAX_INPUT_TOKENS_PER_MINUTE: '1000' }, now: () => time, fetcher: async () => ({ ok: true, json: async () => ({ choices: [{ message: { content: '{"suggestions":[]}' } }] }) }) });
  assert.equal((await request(handler, input)).statusCode, 200);
  time = 15000; assert.equal((await request(handler, input)).statusCode, 429);
  time = 60000; assert.equal((await request(handler, input)).statusCode, 200);
});
test('concurrency cap blocks a second request while the first is pending', async () => {
  let resolveCall, signalStarted;
  const started = new Promise(resolve => signalStarted = resolve);
  const handler = createAiHandler({ env: cloud, fetcher: () => { signalStarted(); return new Promise(resolve => resolveCall = resolve); } });
  const first = request(handler, input); await started;
  assert.equal((await request(handler, input)).statusCode, 429);
  resolveCall({ ok: true, json: async () => ({ choices: [{ message: { content: '{"suggestions":[]}' } }] }) });
  assert.equal((await first).statusCode, 200);
});
