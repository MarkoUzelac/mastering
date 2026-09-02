import assert from 'node:assert/strict';
import test from 'node:test';
import { MasteringDSP } from '../../src/audio/dsp-core.js';

test('width 0 collapses a hard-left signal to equal L/R', () => {
  const dsp = new MasteringDSP(48_000, 2, {
    threshold: 0,
    ratio: 1,
    gain: 0,
    drive: 0,
    warmth: 0,
    mix: 100,
    width: 0,
    balance: 0,
    ceiling: 0,
  });
  const inputL = new Float32Array([1]);
  const inputR = new Float32Array([0]);
  const outputL = new Float32Array(1);
  const outputR = new Float32Array(1);
  dsp.process([inputL, inputR], [outputL, outputR]);
  assert.ok(Math.abs(outputL[0] - 0.5) < 1e-6);
  assert.ok(Math.abs(outputR[0] - 0.5) < 1e-6);
});
