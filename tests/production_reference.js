import { writeFile } from 'node:fs/promises';
import { MasteringDSP } from '../src/audio/dsp-core.js';

const SAMPLE_RATE = 48000;
const NUM_SAMPLES = 100000;
const CHANNELS = 2;
const PARAMS = {
  low: 3.0,
  mid: -2.0,
  high: 1.5,
  threshold: -24,
  ratio: 3,
  gain: 0,
};

function generateInput(numSamples) {
  const left = new Float32Array(numSamples);
  const right = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i += 1) {
    const t = i / SAMPLE_RATE;
    left[i] =
      0.30 * Math.sin(2 * Math.PI * 440 * t) +
      0.20 * Math.sin(2 * Math.PI * 1000 * t);
    right[i] =
      0.24 * Math.sin(2 * Math.PI * 550 * t) +
      0.18 * Math.sin(2 * Math.PI * 1400 * t);
  }

  // Deterministic transients to exercise compressor + limiter state.
  left[0] = 1.0;
  right[0] = 0.9;
  left[24000] = 0.95;
  right[24000] = -0.92;
  left[72000] = -0.98;
  right[72000] = 0.88;

  return [left, right];
}

const [leftInput, rightInput] = generateInput(NUM_SAMPLES);
const leftOutput = new Float32Array(NUM_SAMPLES);
const rightOutput = new Float32Array(NUM_SAMPLES);

const dsp = new MasteringDSP(SAMPLE_RATE, CHANNELS, PARAMS);
dsp.process(
  [leftInput, rightInput],
  [leftOutput, rightOutput],
);

await writeFile('tests/production-input-left.bin', Buffer.from(leftInput.buffer));
await writeFile('tests/production-input-right.bin', Buffer.from(rightInput.buffer));
await writeFile('tests/production-reference-left.bin', Buffer.from(leftOutput.buffer));
await writeFile('tests/production-reference-right.bin', Buffer.from(rightOutput.buffer));

console.log(`Generated production reference: ${NUM_SAMPLES} stereo frames`);
