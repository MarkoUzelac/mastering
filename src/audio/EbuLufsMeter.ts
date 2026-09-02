export interface LoudnessBlock {
  startFrame: number;
  energy: number;
  lufs: number;
}

export interface EbuLufsResult {
  integratedLufs: number | null;
  shortTermLufs: number | null;
  momentaryLufs: number | null;
  truePeakDbtp: number | null;
  rmsDb: number | null;
  crestFactorDb: number | null;
  clippingDetected: boolean;
  dcOffsetDetected: boolean;
  stereoWidth: number | null;
  dynamicRangeDb: number | null;
  durationSeconds: number;
  sampleRate: number;
  channels: number;
  valid: boolean;
  status: 'no_signal' | 'analyzing' | 'valid' | 'error';
}

const ABSOLUTE_GATE_LUFS = -70;
const LOUDNESS_OFFSET = -0.691;
const EPSILON = 1e-12;
const BLOCK_FRAMES = 19200;
const BLOCK_HOP_FRAMES = 4800;
const SHORT_TERM_FRAMES = 144000;
const TRUE_PEAK_DB_FLOOR = -300;

// ITU-R BS.1770-5 (11/2023), normative 48 kHz K-weighting coefficients.
export const K_WEIGHT_SECTIONS = [
  {
    b0: 1.53512485958697,
    b1: -2.69169618940638,
    b2: 1.19839281085285,
    a1: -1.69065929318241,
    a2: 0.73248077421585,
  },
  {
    b0: 1.0,
    b1: -2.0,
    b2: 1.0,
    a1: -1.99004745483398,
    a2: 0.99007225036621,
  },
] as const;

// ITU-R BS.1770-5 Annex 2: 48 taps total arranged as 12 rows x 4 phases.
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

class Biquad {
  private z1 = 0;
  private z2 = 0;

  constructor(private readonly c: (typeof K_WEIGHT_SECTIONS)[number]) {}

  process(x: number): number {
    const y = this.c.b0 * x + this.z1;
    this.z1 = this.c.b1 * x - this.c.a1 * y + this.z2;
    this.z2 = this.c.b2 * x - this.c.a2 * y;
    return y;
  }
}

class KWeightFilter {
  private readonly stage1 = new Biquad(K_WEIGHT_SECTIONS[0]);
  private readonly stage2 = new Biquad(K_WEIGHT_SECTIONS[1]);

  process(x: number): number {
    return this.stage2.process(this.stage1.process(x));
  }
}

function dbFromPower(power: number): number {
  return power > EPSILON ? LOUDNESS_OFFSET + 10 * Math.log10(power) : ABSOLUTE_GATE_LUFS;
}

function percentile(values: number[], p: number): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.max(0, Math.min(sorted.length - 1, Math.round((sorted.length - 1) * p)));
  return sorted[index];
}

/** ITU-R BS.1770-5 Annex 2 4x true-peak interpolation. */
export function truePeakAmplitude(samples: ArrayLike<number>): number {
  if (!samples.length) return 0;
  const tapCount = TRUE_PEAK_FIR_48X4.length;
  const half = tapCount / 2;
  let peak = 0;

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

function kWeighted(samples: Float32Array): Float32Array {
  const filter = new KWeightFilter();
  const output = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i += 1) output[i] = filter.process(samples[i]);
  return output;
}

/**
 * Analyze 48 kHz PCM using the single EBU/ITU loudness telemetry core.
 * Integrated loudness uses 400 ms blocks with 75% overlap and BS.1770 gating.
 */
export function analyzeEbuLufs(left: Float32Array, right: Float32Array, sampleRate: number): EbuLufsResult {
  const channels = right.length ? 2 : 1;
  const length = Math.min(left.length, right.length || left.length);
  const durationSeconds = sampleRate > 0 ? length / sampleRate : 0;

  const base: Omit<EbuLufsResult, 'status' | 'valid'> = {
    integratedLufs: null,
    shortTermLufs: null,
    momentaryLufs: null,
    truePeakDbtp: null,
    rmsDb: null,
    crestFactorDb: null,
    clippingDetected: false,
    dcOffsetDetected: false,
    stereoWidth: null,
    dynamicRangeDb: null,
    durationSeconds,
    sampleRate,
    channels,
  };

  if (!length) return { ...base, valid: false, status: 'no_signal' };
  if (sampleRate !== 48_000) return { ...base, valid: false, status: 'error' };

  const filteredL = kWeighted(left.subarray(0, length));
  const filteredR = channels === 2 ? kWeighted(right.subarray(0, length)) : filteredL;

  const blockPowers: number[] = [];
  const blockLoudness: number[] = [];
  for (let start = 0; start + BLOCK_FRAMES <= length; start += BLOCK_HOP_FRAMES) {
    let weightedPower = 0;
    let sumL = 0;
    let sumR = 0;
    for (let i = start; i < start + BLOCK_FRAMES; i += 1) {
      sumL += filteredL[i] * filteredL[i];
      if (channels === 2) sumR += filteredR[i] * filteredR[i];
    }
    weightedPower += sumL / BLOCK_FRAMES;
    if (channels === 2) weightedPower += sumR / BLOCK_FRAMES;
    const lufs = dbFromPower(weightedPower);
    blockPowers.push(weightedPower);
    blockLoudness.push(lufs);
  }

  const absoluteIndices = blockLoudness
    .map((lufs, index) => (lufs > ABSOLUTE_GATE_LUFS ? index : -1))
    .filter((index) => index >= 0);

  let integratedLufs: number | null = null;
  if (absoluteIndices.length) {
    const absolutePower = absoluteIndices.reduce((sum, index) => sum + blockPowers[index], 0) / absoluteIndices.length;
    const relativeGateLufs = dbFromPower(absolutePower) - 10;
    const relativeIndices = blockLoudness
      .map((lufs, index) => (lufs > ABSOLUTE_GATE_LUFS && lufs > relativeGateLufs ? index : -1))
      .filter((index) => index >= 0);
    if (relativeIndices.length) {
      const relativePower = relativeIndices.reduce((sum, index) => sum + blockPowers[index], 0) / relativeIndices.length;
      integratedLufs = dbFromPower(relativePower);
    }
  }

  const momentaryStart = Math.max(0, length - BLOCK_FRAMES);
  let momentaryPower = 0;
  for (let i = momentaryStart; i < length; i += 1) {
    momentaryPower += filteredL[i] * filteredL[i];
    if (channels === 2) momentaryPower += filteredR[i] * filteredR[i];
  }
  momentaryPower /= (length - momentaryStart);
  const momentaryLufs = blockPowers.length ? dbFromPower(momentaryPower) : null;

  let shortTermLufs: number | null = null;
  if (length >= SHORT_TERM_FRAMES) {
    const start = length - SHORT_TERM_FRAMES;
    let sum = 0;
    for (let i = start; i < length; i += 1) {
      sum += filteredL[i] * filteredL[i];
      if (channels === 2) sum += filteredR[i] * filteredR[i];
    }
    shortTermLufs = dbFromPower(sum / SHORT_TERM_FRAMES);
  }

  let sumSq = 0;
  let sumL = 0;
  let sumR = 0;
  let cross = 0;
  let peak = 0;
  let dcL = 0;
  let dcR = 0;
  for (let i = 0; i < length; i += 1) {
    const l = left[i];
    const r = channels === 2 ? right[i] : l;
    peak = Math.max(peak, Math.abs(l), Math.abs(r));
    sumSq += (l * l + r * r) / channels;
    sumL += l * l;
    sumR += r * r;
    cross += l * r;
    dcL += l;
    dcR += r;
  }

  const rms = Math.sqrt(sumSq / length);
  const rmsDb = rms > EPSILON ? 20 * Math.log10(rms) : ABSOLUTE_GATE_LUFS;
  const crestFactorDb = rms > EPSILON ? 20 * Math.log10(peak / rms) : null;
  const truePeak = Math.max(
    truePeakAmplitude(left.subarray(0, length)),
    truePeakAmplitude((channels === 2 ? right : left).subarray(0, length)),
  );
  const truePeakDbtp = truePeak > EPSILON ? 20 * Math.log10(truePeak) : TRUE_PEAK_DB_FLOOR;
  const correlation = Math.sqrt(sumL * sumR) > EPSILON ? cross / Math.sqrt(sumL * sumR) : 1;
  const midRms = Math.sqrt(Math.max(EPSILON, (sumL + sumR + 2 * cross) / (4 * length)));
  const sideRms = Math.sqrt(Math.max(EPSILON, (sumL + sumR - 2 * cross) / (4 * length)));
  const stereoWidth = channels === 2 && Number.isFinite(correlation) ? 20 * Math.log10(sideRms / midRms) : null;
  const p95 = percentile(blockLoudness, 0.95);
  const p10 = percentile(blockLoudness, 0.10);
  const dynamicRangeDb = p95 != null && p10 != null ? Math.max(0, p95 - p10) : null;

  base.integratedLufs = integratedLufs;
  base.shortTermLufs = shortTermLufs;
  base.momentaryLufs = momentaryLufs;
  base.truePeakDbtp = Number.isFinite(truePeakDbtp) ? truePeakDbtp : null;
  base.rmsDb = Number.isFinite(rmsDb) ? rmsDb : null;
  base.crestFactorDb = Number.isFinite(crestFactorDb ?? NaN) ? crestFactorDb : null;
  base.clippingDetected = peak >= 0.999 || truePeak >= 1;
  base.dcOffsetDetected = Math.abs(dcL / length) > 0.001 || Math.abs(dcR / length) > 0.001;
  base.stereoWidth = channels === 2 && Number.isFinite(stereoWidth ?? NaN) ? stereoWidth : null;
  base.dynamicRangeDb = dynamicRangeDb;

  const valid = integratedLufs != null && momentaryLufs != null && truePeakDbtp != null;
  return { ...base, valid, status: valid ? 'valid' : 'analyzing' };
}

export { ABSOLUTE_GATE_LUFS, BLOCK_FRAMES, BLOCK_HOP_FRAMES, SHORT_TERM_FRAMES };
