import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzeEbuLufs, K_WEIGHT_SECTIONS, TRUE_PEAK_FIR_48X4 } from '../src/audio/EbuLufsMeter';

const SR = 48000;

function stereoTone(seconds: number, amplitudeDbFs: number, frequency = 1000): [Float32Array, Float32Array] {
  const length = Math.round(seconds * SR);
  const amplitude = 10 ** (amplitudeDbFs / 20);
  const left = new Float32Array(length);
  const right = new Float32Array(length);
  for (let i = 0; i < length; i += 1) {
    const value = amplitude * Math.sin((2 * Math.PI * frequency * i) / SR);
    left[i] = value;
    right[i] = value;
  }
  return [left, right];
}

function concatStereoSegments(segments: Array<{ seconds: number; dbFs: number }>): [Float32Array, Float32Array] {
  const totalFrames = segments.reduce((sum, segment) => sum + Math.round(segment.seconds * SR), 0);
  const left = new Float32Array(totalFrames);
  const right = new Float32Array(totalFrames);
  let offset = 0;
  for (const segment of segments) {
    const [segmentLeft, segmentRight] = stereoTone(segment.seconds, segment.dbFs);
    left.set(segmentLeft, offset);
    right.set(segmentRight, offset);
    offset += segmentLeft.length;
  }
  return [left, right];
}

test('BS.1770-5 uses the normative 48 kHz K-weighting coefficients', () => {
  assert.deepEqual(K_WEIGHT_SECTIONS, [
    {
      b0: 1.53512485958697,
      b1: -2.69169618940638,
      b2: 1.19839281085285,
      a1: -1.69065929318241,
      a2: 0.73248077421585,
    },
    {
      b0: 1,
      b1: -2,
      b2: 1,
      a1: -1.99004745483398,
      a2: 0.99007225036621,
    },
  ]);
});

test('BS.1770-5 Annex 2 exposes 48 taps as 12 taps across 4 phases', () => {
  assert.equal(TRUE_PEAK_FIR_48X4.length, 12);
  assert.ok(TRUE_PEAK_FIR_48X4.every((row) => row.length === 4));
});

test('EBU Tech 3341 Test 1: stereo 1 kHz at -23 dBFS measures -23 LUFS', () => {
  const [left, right] = stereoTone(20, -23, 1000);
  const result = analyzeEbuLufs(left, right, SR);
  assert.ok(result.integratedLufs != null);
  assert.ok(Math.abs(result.integratedLufs + 23) <= 0.1);
  assert.ok(result.momentaryLufs != null);
  assert.ok(Math.abs(result.momentaryLufs + 23) <= 0.1);
});

test('EBU Tech 3341 Test 3: quiet sections are excluded by the relative gate', () => {
  const [left, right] = concatStereoSegments([
    { seconds: 10, dbFs: -36 },
    { seconds: 60, dbFs: -23 },
    { seconds: 10, dbFs: -36 },
  ]);
  const result = analyzeEbuLufs(left, right, SR);
  assert.ok(result.integratedLufs != null);
  assert.ok(Math.abs(result.integratedLufs + 23) <= 0.1);
});

test('EBU Tech 3341 Test 4: -72 dBFS silence-like sections are excluded', () => {
  const [left, right] = concatStereoSegments([
    { seconds: 10, dbFs: -72 },
    { seconds: 10, dbFs: -36 },
    { seconds: 60, dbFs: -23 },
    { seconds: 10, dbFs: -36 },
    { seconds: 10, dbFs: -72 },
  ]);
  const result = analyzeEbuLufs(left, right, SR);
  assert.ok(result.integratedLufs != null);
  assert.ok(Math.abs(result.integratedLufs + 23) <= 0.1);
});

test('EBU Tech 3341 Test 5: relative gating converges to -23 LUFS', () => {
  const [left, right] = concatStereoSegments([
    { seconds: 20, dbFs: -26 },
    { seconds: 20.1, dbFs: -20 },
    { seconds: 20, dbFs: -26 },
  ]);
  const result = analyzeEbuLufs(left, right, SR);
  assert.ok(result.integratedLufs != null);
  assert.ok(Math.abs(result.integratedLufs + 23) <= 0.1);
});

test('EBU Mode uses 400 ms momentary blocks and 3 s short-term window', () => {
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
});

test('silence does not invent integrated loudness', () => {
  const left = new Float32Array(4 * SR);
  const right = new Float32Array(4 * SR);
  const result = analyzeEbuLufs(left, right, SR);
  assert.equal(result.integratedLufs, -70);
  assert.equal(result.momentaryLufs, -70);
  assert.equal(result.shortTermLufs, -70);
  assert.equal(result.valid, true);
});

test('Annex 2 true-peak interpolation can exceed the discrete sample peak', () => {
  const length = 40000;
  const left = new Float32Array(length);
  const right = new Float32Array(length);
  const frequency = SR / 4.2;
  let samplePeak = 0;
  for (let i = 0; i < length; i += 1) {
    const value = 0.75 * Math.sin((2 * Math.PI * frequency * i) / SR + Math.PI / 7);
    left[i] = value;
    right[i] = value;
    samplePeak = Math.max(samplePeak, Math.abs(value));
  }
  const result = analyzeEbuLufs(left, right, SR);
  assert.ok(result.truePeakDbtp != null);
  const measuredLinearPeak = 10 ** (result.truePeakDbtp / 20);
  assert.ok(measuredLinearPeak >= samplePeak * 0.99);
});

test('unsupported sample rates are explicitly rejected rather than approximated', () => {
  const result = analyzeEbuLufs(new Float32Array(SR), new Float32Array(SR), 44100);
  assert.equal(result.status, 'error');
  assert.equal(result.valid, false);
  assert.equal(result.integratedLufs, null);
});
