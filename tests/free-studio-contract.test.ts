import assert from 'node:assert/strict';
import test from 'node:test';
import { FeatureGates } from '../src/billing/feature-gates.ts';
import { MASTERING_PRESETS } from '../src/utils/presets.ts';
import { readFile } from 'node:fs/promises';

const readSource = (path: string) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('free studio exposes the complete preset library', () => {
  assert.ok(MASTERING_PRESETS.length >= 20, `expected at least 20 presets, got ${MASTERING_PRESETS.length}`);
  assert.ok(MASTERING_PRESETS.every((preset) => !preset.isPro && !preset.proOnly));
});

test('free studio feature gates never block supported features', () => {
  assert.equal(FeatureGates.isProUser(), false);
  assert.equal(FeatureGates.hasAccess('HIGH_RES_EXPORT'), true);
  assert.equal(FeatureGates.hasAccess('ADVANCED_PRESETS'), true);
  assert.equal(FeatureGates.hasAccess('LUFS_TARGETING'), true);
  assert.equal(FeatureGates.hasAccess('TRUE_PEAK_CALIBRATION'), true);
  assert.equal(FeatureGates.hasAccess('VERSION_HISTORY'), true);
});

test('premium responsive design contract protects layout bounds', async () => {
  const css = await readSource('src/index.css');
  assert.match(css, /box-sizing:\s*border-box/);
  assert.match(css, /\.safe-width/);
  assert.match(css, /overflow-x:\s*hidden/);
  assert.match(css, /min-width:\s*0/);
});
