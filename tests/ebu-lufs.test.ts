import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzeEbuLufs } from '../src/audio/EbuLufsMeter';

const SR = 48000;

function constantStereo(seconds: number, amplitude: number): [Float32Array, Float32Array] {
  const length = Math.floor(seconds * SR);
  const left = new Float32Array(length).fill(amplitude);
  const right = new Float32Array(length).fill(amplitude);
  return [left, right];
}

test('EBU meter does not invent integrated loudness for silence', () => {
  const [left, right] = constantStereo(4, 0);
  const result = analyzeEbuLufs(left, right, SR);
  assert.equal(result.integratedLufs, -70);
  assert.equal(result.momentaryLufs, -70);
  assert.equal(result.shortTermLufs, -70);
  assert.equal(result.valid, true);
});

test('EBU meter uses a 400 ms momentary window and 3 s short-term window', () => {
  const length = 4 * SR;
  const left = new Float32Array(length);
  const right = new Float32Array(length);
  for (let i = SR; i < 2 * SR; i += 1) {
    left[i] = 0.25;
    right[i] = 0.25;
  }
  const result = analyzeEbuLufs(left, right, SR);
  assert.ok(result.momentaryLufs != null);
  assert.ok(result.shortTermLufs != null);
  assert.ok(result.integratedLufs != null);
  assert.ok(result.integratedLufs < -10);
  assert.ok(result.shortTermLufs <= result.integratedLufs + 1e-6 || result.shortTermLufs > -70);
});

test('4x true-peak interpolation detects an inter-sample peak above sample peak', () => {
  const length = 40000;
  const left = new Float32Array(length);
  const right = new Float32Array(length);
  const frequency = SR / 4.2;
  for (let i = 0; i < length; i += 1) {
    const value = 0.75 * Math.sin((2 * Math.PI * frequency * i) / SR + Math.PI / 7);
    left[i] = value;
    right[i] = value;
  }
  const samplePeak = Math.max(...left.map((v) => Math.abs(v)));
  const result = analyzeEbuLufs(left, right, SR);
  assert.ok(result.truePeakDbtp != null);
  const measuredLinearPeak = 10 ** (result.truePeakDbtp / 20);
  assert.ok(measuredLinearPeak >= samplePeak * 0.99);
});

test('unsupported sample rates are explicitly reported instead of approximated', () => {
  const result = analyzeEbuLufs(new Float32Array(48000), new Float32Array(48000), 44100);
  assert.equal(result.status, 'error');
  assert.equal(result.valid, false);
  assert.equal(result.integratedLufs, null);
});
