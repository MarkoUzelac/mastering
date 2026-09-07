import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const netlifyToml = fs.readFileSync(new URL('../../netlify.toml', import.meta.url), 'utf8');
const apiFunction = fs.readFileSync(new URL('../../netlify/functions/api.ts', import.meta.url), 'utf8');
const aiModule = fs.readFileSync(new URL('../../api/ai.ts', import.meta.url), 'utf8');

test('netlify.toml configures secret scanner smart detection bypass and omitted values', () => {
  assert.match(netlifyToml, /SECRETS_SCAN_SMART_DETECTION_ENABLED\s*=\s*"false"/);
  assert.match(netlifyToml, /SECRETS_SCAN_SMART_DETECTION_OMIT_VALUES\s*=\s*"AIza[a-zA-Z0-9_\-]*"/);
});

test('netlify/functions/api.ts adheres to Netlify Functions v2 syntax and eliminates legacy v1 handler', () => {
  assert.match(apiFunction, /export\s+default\s+async\s*\(/);
  assert.doesNotMatch(apiFunction, /export\s+const\s+handler\s*=/);
  assert.doesNotMatch(apiFunction, /exports\.handler\s*=/);
  assert.doesNotMatch(apiFunction, /module\.exports\.handler\s*=/);
  assert.doesNotMatch(apiFunction, /serverless-http/);
});

test('api/ai.ts integrates with Netlify AI Gateway environment variables', () => {
  assert.match(aiModule, /GOOGLE_GEMINI_BASE_URL/);
  assert.match(aiModule, /NETLIFY_AI_GATEWAY_BASE_URL/);
  assert.match(aiModule, /NETLIFY_AI_GATEWAY_KEY/);
});

test('netlify/functions/api.ts default export handles HTTP requests returning Web Responses', async () => {
  const { default: handler } = await import('../../netlify/functions/api.ts');
  const req = new Request('https://example.com/api/health');
  const res = await handler(req);
  assert.equal(res.status, 200);
  const data = await res.json() as { status: string; service: string };
  assert.equal(data.status, 'ok');
  assert.match(data.service, /Netlify Gateway/);
});
