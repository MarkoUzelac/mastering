import assert from 'node:assert/strict';
import test from 'node:test';
import { MasteringDSP } from '../../src/audio/dsp-core.js';

function magnitudeAt(signal: Float32Array, frequency: number, sampleRate: number) {
  let re = 0;
  let im = 0;
  for (let n = 0; n < signal.length; n += 1) {
    const phase = 2 * Math.PI * frequency * n / sampleRate;
    re += signal[n] * Math.cos(phase);
    im -= signal[n] * Math.sin(phase);
  }
  return Math.hypot(re, im);
}

test('drive 100 adds measurable harmonic content to a 0.5 amplitude sine', () => {
  const sampleRate = 48_000;
  const frequency = 1_000;
  const length = 4_800;
  const dsp = new MasteringDSP(sampleRate, 2, {
    threshold: 0,
    ratio: 1,
    gain: 0,
    drive: 100,
    warmth: 0,
    mix: 100,
    width: 100,
    balance: 0,
    ceiling: 0,
  });
  const input = new Float32Array(length);
  const outputL = new Float32Array(length);
  const outputR = new Float32Array(length);
  for (let i = 0; i < length; i += 1) input[i] = 0.5 * Math.sin(2 * Math.PI * frequency * i / sampleRate);
  dsp.process([input, input], [outputL, outputR]);
  const fundamental = magnitudeAt(outputL, frequency, sampleRate);
  const thirdHarmonic = magnitudeAt(outputL, frequency * 3, sampleRate);
  assert.ok(fundamental > 0);
  assert.ok(thirdHarmonic > fundamental * 0.005, `expected harmonic content, got ratio ${thirdHarmonic / fundamental}`);
});
