import assert from 'node:assert/strict';
import test from 'node:test';
import { MasteringDSP } from '../../src/audio/dsp-core.js';

test('limiter output never exceeds the configured ceiling', () => {
  const ceilingDb = -1;
  const ceiling = 10 ** (ceilingDb / 20);
  const dsp = new MasteringDSP(48_000, 2, {
    threshold: 0,
    ratio: 1,
    gain: 0,
    drive: 0,
    warmth: 0,
    mix: 100,
    width: 100,
    balance: 0,
    ceiling: ceilingDb,
    truePeak: true,
  });
  const inputL = new Float32Array(128).fill(10 ** (3 / 20));
  const inputR = new Float32Array(128).fill(10 ** (3 / 20));
  const outputL = new Float32Array(128);
  const outputR = new Float32Array(128);
  dsp.process([inputL, inputR], [outputL, outputR]);
  for (const sample of outputL) assert.ok(Math.abs(sample) <= ceiling + 1e-6, `L exceeded ceiling: ${sample}`);
  for (const sample of outputR) assert.ok(Math.abs(sample) <= ceiling + 1e-6, `R exceeded ceiling: ${sample}`);
});
