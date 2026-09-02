/**
 * ITU-R BS.1770-5 / EBU R 128 measurement core.
 *
 * This module is deliberately offline/pure-DSP oriented: no React, browser
 * globals, timers, or UI state. It implements:
 *  - the normative 48 kHz K-weighting biquads from BS.1770-5;
 *  - 400 ms blocks with 75% overlap;
 *  - -70 LKFS absolute gating and -10 LU relative gating;
 *  - the BS.1770 48-tap / 4-phase true-peak FIR interpolator from Annex 2.
 *
 * BS.1770-5 specifies the coefficients below for 48 kHz. Other sample rates
 * require separately derived coefficients that preserve the same frequency
 * response; this first core therefore rejects non-48 kHz input rather than
 * silently pretending that 48 kHz coefficients are standards-compliant.
 */

export interface BS1770Measurement {
  integratedLufs: number | null;
  absoluteGateLufs: number | null;
  relativeGateLufs: number | null;
  truePeakDbTp: number | null;
  samplePeakDbFs: number | null;
  blockCount: number;
  absoluteGatedBlockCount: number;
  relativeGatedBlockCount: number;
}

type BiquadCoefficients = {
  b0: number;
  b1: number;
  b2: number;
  a1: number;
  a2: number;
};

/** BS.1770-5 Table 1, 48 kHz. */
export const K_WEIGHT_STAGE_1: BiquadCoefficients = Object.freeze({
  b0: 1.53512485958697,
  b1: -2.69169618940638,
  b2: 1.19839281085285,
  a1: -1.69065929318241,
  a2: 0.73248077421585,
});

/** BS.1770-5 Table 2, 48 kHz. */
export const K_WEIGHT_STAGE_2: BiquadCoefficients = Object.freeze({
  b0: 1.0,
  b1: -2.0,
  b2: 1.0,
  a1: -1.99004745483398,
  a2: 0.99007225036621,
});

/**
 * Annex 2, 48-tap / 4-phase FIR interpolator.
 * Each row is one tap; each column is one output phase.
 */
export const TRUE_PEAK_FIR_48X4: readonly (readonly number[])[] = Object.freeze([
  [0.0017089843750, -0.0291748046875, -0.0189208984375, -0.0083007812500],
  [0.0109863281250, 0.0292968750000, 0.0330810546875, 0.0148925781250],
  [-0.0196533203125, -0.0517578125000, -0.0582275390625, -0.0266113281250],
  [0.0332031250000, 0.0891113281250, 0.1015625000000, 0.0476074218750],
  [-0.0594482421875, -0.1665039062500, -0.2003173828125, -0.1022949218750],
  [0.1373291015625, 0.4650878906250, 0.7797851562500, 0.9721679687500],
  [0.9721679687500, 0.7797851562500, 0.4650878906250, 0.1373291015625],
  [-0.1022949218750, -0.2003173828125, -0.1665039062500, -0.0594482421875],
  [0.0476074218750, 0.1015625000000, 0.0891113281250, 0.0332031250000],
  [-0.0266113281250, -0.0582275390625, -0.0517578125000, -0.0196533203125],
  [0.0148925781250, 0.0330810546875, 0.0292968750000, 0.0109863281250],
  [-0.0083007812500, -0.0189208984375, -0.0291748046875, 0.0017089843750],
]);

const LOUDNESS_OFFSET = -0.691;
const ABSOLUTE_GATE_LUFS = -70;
const RELATIVE_GATE_OFFSET_LU = -10;
const BLOCK_MS = 400;
const OVERLAP = 0.75;
const EPSILON = 1e-12;
const TRUE_PEAK_DB_FLOOR = -300;

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

class Biquad {
  private z1 = 0;
  private z2 = 0;

  public constructor(private readonly coefficients: BiquadCoefficients) {}

  public process(input: number): number {
    const { b0, b1, b2, a1, a2 } = this.coefficients;
    const output = b0 * input + this.z1;
    this.z1 = b1 * input - a1 * output + this.z2;
    this.z2 = b2 * input - a2 * output;
    return output;
  }
}

class KWeightFilter {
  private readonly stage1 = new Biquad(K_WEIGHT_STAGE_1);
  private readonly stage2 = new Biquad(K_WEIGHT_STAGE_2);

  public process(input: number): number {
    return this.stage2.process(this.stage1.process(input));
  }
}

const dbFromPower = (power: number): number =>
  power > EPSILON ? LOUDNESS_OFFSET + 10 * Math.log10(power) : -Infinity;

const dbFromAmplitude = (amplitude: number): number =>
  amplitude > EPSILON ? 20 * Math.log10(amplitude) : TRUE_PEAK_DB_FLOOR;

function validate48k(samples: readonly Float32Array[] | readonly number[][], sampleRate: number): void {
  if (sampleRate !== 48_000) {
    throw new RangeError(
      `BS.1770 core currently requires 48 kHz for exact normative coefficients; received ${sampleRate} Hz`,
    );
  }
  if (samples.length < 1 || samples.length > 5) {
    throw new RangeError('BS.1770 core accepts 1-5 main channels; LFE is not represented');
  }
}

function channelWeight(channelIndex: number, channelCount: number): number {
  // BS.1770-5: L/R/C = 1.0; Ls/Rs = 1.41. For mono/stereo this reduces to 1.0.
  if (channelCount === 5 && channelIndex >= 3) return 1.41;
  return 1.0;
}

/**
 * Measure integrated BS.1770 loudness and true peak for complete PCM channels.
 * Channels are ordered L,R,C,Ls,Rs. The LFE channel is intentionally excluded.
 */
export function measureBS1770(
  channels: readonly (Float32Array | readonly number[])[],
  sampleRate: number,
): BS1770Measurement {
  validate48k(channels, sampleRate);

  const frameCount = channels.reduce((max, channel) => Math.max(max, channel.length), 0);
  if (frameCount === 0) {
    return {
      integratedLufs: null,
      absoluteGateLufs: null,
      relativeGateLufs: null,
      truePeakDbTp: null,
      samplePeakDbFs: null,
      blockCount: 0,
      absoluteGatedBlockCount: 0,
      relativeGatedBlockCount: 0,
    };
  }

  const filters = channels.map(() => new KWeightFilter());
  const weightedSamples = channels.map(() => new Float64Array(frameCount));
  let samplePeak = 0;
  let truePeak = 0;

  for (let i = 0; i < frameCount; i += 1) {
    for (let channelIndex = 0; channelIndex < channels.length; channelIndex += 1) {
      const channel = channels[channelIndex];
      const sample = i < channel.length ? Number(channel[i]) : 0;
      if (!Number.isFinite(sample)) {
        throw new TypeError(`Non-finite sample at channel ${channelIndex}, frame ${i}`);
      }
      samplePeak = Math.max(samplePeak, Math.abs(sample));
      weightedSamples[channelIndex][i] = filters[channelIndex].process(sample);
    }
  }

  for (const channel of channels) {
    truePeak = Math.max(truePeak, truePeakAmplitude(channel));
  }

  const blockLength = Math.round((BLOCK_MS / 1000) * sampleRate);
  const step = Math.round(blockLength * (1 - OVERLAP));
  const blockPowers: number[] = [];
  const blockLoudness: number[] = [];

  for (let start = 0; start + blockLength <= frameCount; start += step) {
    let weightedPower = 0;
    for (let channelIndex = 0; channelIndex < weightedSamples.length; channelIndex += 1) {
      let sumSquares = 0;
      const weighted = weightedSamples[channelIndex];
      for (let i = start; i < start + blockLength; i += 1) {
        const sample = weighted[i];
        sumSquares += sample * sample;
      }
      const meanSquare = sumSquares / blockLength;
      weightedPower += channelWeight(channelIndex, channels.length) * meanSquare;
    }
    const loudness = dbFromPower(weightedPower);
    blockPowers.push(weightedPower);
    blockLoudness.push(loudness);
  }

  const absoluteIndices = blockLoudness
    .map((loudness, index) => (loudness > ABSOLUTE_GATE_LUFS ? index : -1))
    .filter((index) => index >= 0);

  const absoluteGatePower = meanPowerAtIndices(blockPowers, absoluteIndices);
  const absoluteGateLufs = absoluteGatePower === null ? null : dbFromPower(absoluteGatePower);
  const relativeGateLufs = absoluteGateLufs === null ? null : absoluteGateLufs + RELATIVE_GATE_OFFSET_LU;

  const relativeIndices = relativeGateLufs === null
    ? []
    : blockLoudness
        .map((loudness, index) => (
          loudness > ABSOLUTE_GATE_LUFS && loudness > relativeGateLufs ? index : -1
        ))
        .filter((index) => index >= 0);

  const integratedPower = meanPowerAtIndices(blockPowers, relativeIndices);
  const integratedLufs = integratedPower === null ? null : dbFromPower(integratedPower);

  return {
    integratedLufs,
    absoluteGateLufs,
    relativeGateLufs,
    truePeakDbTp: truePeak > EPSILON ? dbFromAmplitude(truePeak) : TRUE_PEAK_DB_FLOOR,
    samplePeakDbFs: samplePeak > EPSILON ? dbFromAmplitude(samplePeak) : TRUE_PEAK_DB_FLOOR,
    blockCount: blockPowers.length,
    absoluteGatedBlockCount: absoluteIndices.length,
    relativeGatedBlockCount: relativeIndices.length,
  };
}

function meanPowerAtIndices(powers: readonly number[], indices: readonly number[]): number | null {
  if (indices.length === 0) return null;
  let sum = 0;
  for (const index of indices) sum += powers[index];
  return sum / indices.length;
}

/**
 * BS.1770-5 Annex 2 48-tap / 4-phase interpolation.
 * The supplied table is the standard's normative example filter for 48 kHz.
 * We evaluate all four polyphase outputs around every source sample and take
 * the maximum absolute reconstructed sample.
 */
export function truePeakAmplitude(samples: readonly number[]): number {
  let peak = 0;
  const tapCount = TRUE_PEAK_FIR_48X4.length;
  const half = tapCount / 2;

  for (let n = 0; n < samples.length; n += 1) {
    for (let phase = 0; phase < 4; phase += 1) {
      let value = 0;
      for (let tap = 0; tap < tapCount; tap += 1) {
        const index = n + tap - half + 1;
        const sample = index >= 0 && index < samples.length ? Number(samples[index]) : 0;
        value += sample * TRUE_PEAK_FIR_48X4[tap][phase];
      }
      peak = Math.max(peak, Math.abs(value));
    }
  }

  return peak;
}

export { ABSOLUTE_GATE_LUFS, RELATIVE_GATE_OFFSET_LU, BLOCK_MS, OVERLAP };
