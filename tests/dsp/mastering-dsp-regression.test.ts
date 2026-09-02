import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeEbuLufs,
  truePeakAmplitude,
  TRUE_PEAK_FIR_48X4,
} from '../../src/audio/EbuLufsMeter';

const SR = 48_000;
const seconds = (value: number) => Math.round(value * SR);
const sine = (frames: number, frequency: number, peakDbfs: number): Float32Array => {
  const amplitude = 10 ** (peakDbfs / 20);
  const out = new Float32Array(frames);
  for (let i = 0; i < frames; i += 1) {
    out[i] = amplitude * Math.sin((2 * Math.PI * frequency * i) / SR);
  }
  return out;
};

test('EBU Tech 3341 Test 1: stereo 1 kHz -23 dBFS measures -23 LUFS', () => {
  const channel = sine(seconds(20), 1000, -23);
  const result = analyzeEbuLufs(channel, channel, SR);
  assert.equal(result.valid, true);
  assert.ok(result.integratedLufs !== null);
  assert.ok(Math.abs(result.integratedLufs + 23) <= 0.1, `got ${result.integratedLufs}`);
  assert.ok(result.shortTermLufs !== null);
  assert.ok(Math.abs(result.shortTermLufs + 23) <= 0.1, `got ${result.shortTermLufs}`);
  assert.ok(result.momentaryLufs !== null);
  assert.ok(Math.abs(result.momentaryLufs + 23) <= 0.1, `got ${result.momentaryLufs}`);
});

test('BS.1770 gating: low-level material does not pull integrated loudness down after absolute gating', () => {
  const lead = sine(seconds(10), 1000, -36);
  const body = sine(seconds(20), 1000, -23);
  const tail = sine(seconds(10), 1000, -36);
  const combined = new Float32Array(lead.length + body.length + tail.length);
  combined.set(lead, 0);
  combined.set(body, lead.length);
  combined.set(tail, lead.length + body.length);

  const result = analyzeEbuLufs(combined, combined, SR);
  assert.equal(result.valid, true);
  assert.ok(result.integratedLufs !== null);
  assert.ok(Math.abs(result.integratedLufs + 23) <= 0.15, `got ${result.integratedLufs}`);
});

test('BS.1770 Annex 2 table is exactly 12 taps by 4 phases', () => {
  assert.equal(TRUE_PEAK_FIR_48X4.length, 12);
  assert.ok(TRUE_PEAK_FIR_48X4.every((row) => row.length === 4));
});

test('BS.1770 true peak catches an inter-sample overshoot above the 0 dBFS sample peak', () => {
  const channel = new Float32Array(1024);
  for (let i = 0; i < channel.length; i += 1) {
    const phase = i % 4;
    channel[i] = phase === 1 ? 1 : phase === 3 ? -1 : 0;
  }

  const peak = truePeakAmplitude(channel);
  assert.ok(peak > 1.0, `true peak amplitude should exceed 1.0, got ${peak}`);
  assert.ok(20 * Math.log10(peak) > 0, `true peak dBTP should exceed 0 dBTP, got ${20 * Math.log10(peak)}`);
});

test('mono analysis reports one channel and the expected mono loudness', () => {
  const mono = sine(seconds(5), 1000, -23);
  const result = analyzeEbuLufs(mono, new Float32Array(0), SR);
  assert.equal(result.channels, 1);
  assert.equal(result.valid, true);
  assert.ok(result.integratedLufs !== null);
  // A single mono channel carries half the channel-energy sum of dual-mono,
  // so the same per-channel peak level measures about 3.01 LU lower.
  assert.ok(Math.abs(result.integratedLufs + 26.0103) <= 0.15, `got ${result.integratedLufs}`);
});

test('dual-mono analysis matches the stereo reference loudness', () => {
  const channel = sine(seconds(5), 1000, -23);
  const result = analyzeEbuLufs(channel, channel, SR);
  assert.equal(result.channels, 2);
  assert.equal(result.valid, true);
  assert.ok(result.integratedLufs !== null);
  assert.ok(Math.abs(result.integratedLufs + 23) <= 0.15, `got ${result.integratedLufs}`);
});

test('unsupported sample rate is explicit instead of silently applying 48 kHz coefficients', () => {
  const mono = sine(seconds(1), 1000, -23);
  const result = analyzeEbuLufs(mono, new Float32Array(0), 44_100);
  assert.equal(result.valid, false);
  assert.equal(result.status, 'error');
});
