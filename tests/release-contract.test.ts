import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const server = fs.readFileSync(new URL('../server.ts', import.meta.url), 'utf8');
const checkout = fs.readFileSync(new URL('../src/billing/subscription-service.ts', import.meta.url), 'utf8');
const packageJson = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { version: string; engines: { node: string }; scripts: Record<string, string> };

test('production contract uses Node 22+', () => {
  assert.equal(packageJson.engines.node, '>=22');
});

test('client checkout cannot activate entitlements', () => {
  assert.match(server, /Checkout confirmation is deprecated/);
  assert.match(checkout, /Stripe webhooks are authoritative/);
  assert.doesNotMatch(checkout, /fetch\('\/api\/checkout\/confirm'/);
});

test('production gateway verifies Stripe webhook signatures', () => {
  assert.match(server, /stripe\.webhooks\.constructEvent/);
  assert.match(server, /STRIPE_WEBHOOK_SECRET/);
});

test('production gateway has authenticated API middleware and durable Firestore path', () => {
  assert.match(server, /verifyIdToken/);
  assert.match(server, /getFirestore/);
  assert.match(server, /collection\('accounts'\)/);
});

test('production gateway does not contain simulated checkout provider', () => {
  assert.doesNotMatch(server, /stripe_simulated/);
  assert.doesNotMatch(server, /cs_test_/);
});
