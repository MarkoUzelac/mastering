import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const workletPath = require.resolve('../public/dsp-worklet.js');

async function loadProcessor() {
  const source = await readFile(workletPath, 'utf8');
  let Processor: any;
  class FakeAudioWorkletProcessor {
    port = { onmessage: null as any, postMessage: (_message: unknown) => undefined };
  }
  const context = vm.createContext({ AudioWorkletProcessor: FakeAudioWorkletProcessor, sampleRate: 48_000, Math, Float32Array, registerProcessor: (_name: string, processor: any) => { Processor = processor; } });
  vm.runInContext(source, context, { filename: workletPath });
  return Processor;
}

function configure(processor: any, params: Record<string, unknown>) {
  processor.port.onmessage({ data: { type: 'SET_PARAMS', params } });
}

function magnitudeAt(signal: Float32Array, frequency: number, sampleRate: number) {
  let re = 0; let im = 0;
  for (let n = 0; n < signal.length; n += 1) {
    const phase = 2 * Math.PI * frequency * n / sampleRate;
    re += signal[n] * Math.cos(phase);
    im -= signal[n] * Math.sin(phase);
  }
  return Math.hypot(re, im);
}

test('stereo width at 0% collapses a hard-left signal to equal L/R', async () => {
  const Processor = await loadProcessor();
  const processor = new Processor();
  configure(processor, { threshold: 0, ratio: 1, gain: 0, drive: 0, warmth: 0, mix: 100, width: 0, balance: 0, ceiling: 0 });
  const input = [new Float32Array([1]), new Float32Array([0])];
  const output = [new Float32Array(1), new Float32Array(1)];
  processor.process([input], [output]);
  assert.ok(Math.abs(output[0][0] - 0.5) < 1e-6);
  assert.ok(Math.abs(output[1][0] - 0.5) < 1e-6);
});

test('drive creates measurable harmonic content from a sine wave', async () => {
  const Processor = await loadProcessor();
  const processor = new Processor();
  configure(processor, { threshold: 0, ratio: 1, gain: 0, drive: 100, warmth: 0, mix: 100, width: 100, balance: 0, ceiling: 0 });
  const sampleRate = 48_000; const frequency = 1_000; const length = 4_800;
  const input = new Float32Array(length); const output = new Float32Array(length);
  for (let i = 0; i < length; i += 1) input[i] = 0.5 * Math.sin(2 * Math.PI * frequency * i / sampleRate);
  processor.process([[input]], [[output]]);
  const fundamental = magnitudeAt(output, frequency, sampleRate);
  const thirdHarmonic = magnitudeAt(output, frequency * 3, sampleRate);
  assert.ok(fundamental > 0);
  assert.ok(thirdHarmonic > fundamental * 0.005, `expected harmonic content, got ratio ${thirdHarmonic / fundamental}`);
});

test('limiter never exceeds the configured ceiling for a +3 dBFS signal', async () => {
  const Processor = await loadProcessor();
  const processor = new Processor();
  const ceilingDb = -1; const ceiling = 10 ** (ceilingDb / 20);
  configure(processor, { threshold: 0, ratio: 1, gain: 0, drive: 0, warmth: 0, mix: 100, width: 100, balance: 0, ceiling: ceilingDb, truePeak: true });
  const inputL = new Float32Array(128).fill(10 ** (3 / 20)); const inputR = new Float32Array(128).fill(10 ** (3 / 20));
  const outputL = new Float32Array(128); const outputR = new Float32Array(128);
  processor.process([[inputL, inputR]], [[outputL, outputR]]);
  for (const sample of outputL) assert.ok(Math.abs(sample) <= ceiling + 1e-6, `L exceeded ceiling: ${sample}`);
  for (const sample of outputR) assert.ok(Math.abs(sample) <= ceiling + 1e-6, `R exceeded ceiling: ${sample}`);
});
