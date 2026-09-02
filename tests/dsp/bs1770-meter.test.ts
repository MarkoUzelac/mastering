import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ABSOLUTE_GATE_LUFS,
  BLOCK_MS,
  K_WEIGHT_STAGE_1,
  K_WEIGHT_STAGE_2,
  OVERLAP,
  RELATIVE_GATE_OFFSET_LU,
  TRUE_PEAK_FIR_48X4,
  measureBS1770,
  truePeakAmplitude,
} from '../../src/audio/bs1770-meter';

const FS = 48_000;

function sine(length: number, frequency: number, amplitudeDb: number, phase = 0): Float32Array {
  const amplitude = 10 ** (amplitudeDb / 20);
  const output = new Float32Array(length);
  for (let i = 0; i < length; i += 1) {
    output[i] = amplitude * Math.sin((2 * Math.PI * frequency * i) / FS + phase);
  }
  return output;
}

test('BS.1770 constants encode the normative 48 kHz K-weighting stages', () => {
  assert.equal(K_WEIGHT_STAGE_1.b0, 1.53512485958697);
  assert.equal(K_WEIGHT_STAGE_1.b1, -2.69169618940638);
  assert.equal(K_WEIGHT_STAGE_1.b2, 1.19839281085285);
  assert.equal(K_WEIGHT_STAGE_1.a1, -1.69065929318241);
  assert.equal(K_WEIGHT_STAGE_1.a2, 0.73248077421585);

  assert.equal(K_WEIGHT_STAGE_2.b0, 1);
  assert.equal(K_WEIGHT_STAGE_2.b1, -2);
  assert.equal(K_WEIGHT_STAGE_2.b2, 1);
  assert.equal(K_WEIGHT_STAGE_2.a1, -1.99004745483398);
  assert.equal(K_WEIGHT_STAGE_2.a2, 0.99007225036621);

  assert.equal(TRUE_PEAK_FIR_48X4.length, 12);
  assert.equal(TRUE_PEAK_FIR_48X4[0].length, 4);
});

test('20 s stereo 997 Hz sine at -23 dBFS measures -23.0 LUFS within EBU tolerance', () => {
  const left = sine(20 * FS, 997, -23);
  const right = sine(20 * FS, 997, -23);
  const result = measureBS1770([left, right], FS);

  assert.notEqual(result.integratedLufs, null);
  assert.ok(Math.abs(result.integratedLufs! - (-23)) <= 0.1, `${result.integratedLufs} LUFS`);
  assert.equal(result.blockCount, 197);
  assert.equal(result.absoluteGatedBlockCount, 197);
  assert.equal(result.relativeGatedBlockCount, 197);
});

test('400 ms blocks use 75% overlap and the specified two-stage gate thresholds', () => {
  assert.equal(BLOCK_MS, 400);
  assert.equal(OVERLAP, 0.75);
  assert.equal(ABSOLUTE_GATE_LUFS, -70);
  assert.equal(RELATIVE_GATE_OFFSET_LU, -10);

  const loud = sine(Math.round(2 * FS), 997, -23);
  const silence = new Float32Array(Math.round(2 * FS));
  const result = measureBS1770([loud, silence], FS);
  assert.notEqual(result.absoluteGateLufs, null);
  assert.notEqual(result.relativeGateLufs, null);
  assert.ok(result.relativeGateLufs! < result.absoluteGateLufs!);
});

test('absolute gate rejects pure silence instead of fabricating a loudness value', () => {
  const silence = new Float32Array(FS);
  const result = measureBS1770([silence, silence], FS);

  assert.equal(result.integratedLufs, null);
  assert.equal(result.absoluteGateLufs, null);
  assert.equal(result.relativeGateLufs, null);
  assert.equal(result.truePeakDbTp, -300);
  assert.equal(result.samplePeakDbFs, -300);
});

test('4-phase true-peak FIR detects an inter-sample peak missed by sample peak', () => {
  const input = sine(FS, 12_000, 0, Math.PI / 4);
  const samplePeak = Math.max(...Array.from(input, Math.abs));
  const truePeak = truePeakAmplitude(input);

  assert.ok(samplePeak < 0.71, `sample peak unexpectedly high: ${samplePeak}`);
  assert.ok(truePeak > 0.99, `true peak not recovered: ${truePeak}`);
  assert.ok(truePeak > samplePeak + 0.25, `true peak gain too small: ${truePeak}`);
});

test('non-48 kHz input is rejected instead of silently using the wrong normative coefficients', () => {
  assert.throws(
    () => measureBS1770([new Float32Array(44100)], 44100),
    /requires 48 kHz for exact normative coefficients/,
  );
});
