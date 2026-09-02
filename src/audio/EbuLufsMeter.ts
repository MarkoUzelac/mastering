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

const SILENCE_DB = -70;
const LUFS_OFFSET = -0.691;
const EPSILON = 1e-12;

// ITU-R BS.1770 K-weighting coefficients for 48 kHz PCM.
const K_WEIGHT_SECTIONS = [
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
    a2: 0.99007225036657,
  },
] as const;

class Biquad {
  private x1 = 0;
  private x2 = 0;
  private y1 = 0;
  private y2 = 0;

  constructor(private readonly c: (typeof K_WEIGHT_SECTIONS)[number]) {}

  process(x: number): number {
    const y = this.c.b0 * x + this.c.b1 * this.x1 + this.c.b2 * this.x2 - this.c.a1 * this.y1 - this.c.a2 * this.y2;
    this.x2 = this.x1;
    this.x1 = x;
    this.y2 = this.y1;
    this.y1 = y;
    return y;
  }
}

function dbFromPower(power: number): number {
  return power > EPSILON ? LUFS_OFFSET + 10 * Math.log10(power) : SILENCE_DB;
}

function percentile(values: number[], p: number): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.max(0, Math.min(sorted.length - 1, Math.round((sorted.length - 1) * p)));
  return sorted[index];
}

/**
 * Build a 4x polyphase low-pass interpolator. An odd tap count keeps phase 0
 * centered exactly on an input sample, so the interpolated peak can never
 * lose the original sample peak merely because of filter phase.
 */
function designSincPhase(phase: number, taps = 17): Float64Array {
  const coeffs = new Float64Array(taps);
  const center = Math.floor(taps / 2);
  const cutoff = 0.5;
  let sum = 0;

  for (let i = 0; i < taps; i += 1) {
    const n = i - center - phase / 4;
    const x = Math.PI * cutoff * n;
    const sinc = Math.abs(x) < 1e-12 ? 1 : Math.sin(x) / x;
    const w = 0.42
      - 0.5 * Math.cos((2 * Math.PI * i) / (taps - 1))
      + 0.08 * Math.cos((4 * Math.PI * i) / (taps - 1));
    coeffs[i] = cutoff * sinc * w;
    sum += coeffs[i];
  }

  for (let i = 0; i < taps; i += 1) coeffs[i] /= sum || 1;
  return coeffs;
}

const TP_PHASES = [0, 1, 2, 3].map((phase) => designSincPhase(phase));

function truePeak4x(samples: Float32Array): number {
  if (!samples.length) return 0;
  const taps = TP_PHASES[0].length;
  const half = Math.floor(taps / 2);
  let peak = 0;

  for (let i = 0; i < samples.length; i += 1) {
    for (let phase = 0; phase < 4; phase += 1) {
      const coeffs = TP_PHASES[phase];
      let y = 0;
      for (let k = 0; k < taps; k += 1) {
        const index = i + k - half;
        if (index >= 0 && index < samples.length) y += samples[index] * coeffs[k];
      }
      peak = Math.max(peak, Math.abs(y));
    }
  }

  return peak;
}

function kWeighted(samples: Float32Array): Float32Array {
  const first = new Biquad(K_WEIGHT_SECTIONS[0]);
  const second = new Biquad(K_WEIGHT_SECTIONS[1]);
  const output = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i += 1) {
    output[i] = second.process(first.process(samples[i]));
  }
  return output;
}

export function analyzeEbuLufs(left: Float32Array, right: Float32Array, sampleRate: number): EbuLufsResult {
  const channels = right.length ? 2 : 1;
  const length = Math.min(left.length, right.length || left.length);
  const durationSeconds = length / sampleRate;
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
  if (sampleRate !== 48000) return { ...base, valid: false, status: 'error' };

  const filteredL = kWeighted(left.subarray(0, length));
  const filteredR = right.length ? kWeighted(right.subarray(0, length)) : filteredL;
  const momentaryFrames = Math.round(sampleRate * 0.4);
  const hopFrames = Math.round(sampleRate * 0.1);
  const shortTermFrames = Math.round(sampleRate * 3);

  const combinedEnergyAt = (start: number, frames: number): number => {
    const end = Math.min(length, start + frames);
    if (end <= start) return 0;
    let sum = 0;
    for (let i = start; i < end; i += 1) {
      sum += filteredL[i] * filteredL[i];
      if (channels === 2) sum += filteredR[i] * filteredR[i];
    }
    return sum / ((end - start) * channels);
  };

  const momentaryBlocks: LoudnessBlock[] = [];
  for (let start = 0; start + momentaryFrames <= length; start += hopFrames) {
    const energy = combinedEnergyAt(start, momentaryFrames);
    momentaryBlocks.push({ startFrame: start, energy, lufs: dbFromPower(energy) });
  }

  const integratedCandidates = momentaryBlocks.filter((block) => block.lufs >= SILENCE_DB);
  let integratedLufs: number | null = null;
  if (integratedCandidates.length) {
    const absoluteMean = integratedCandidates.reduce((sum, block) => sum + block.energy, 0) / integratedCandidates.length;
    const absoluteLufs = dbFromPower(absoluteMean);
    const relativeGate = Math.max(SILENCE_DB, absoluteLufs - 10);
    const gated = integratedCandidates.filter((block) => block.lufs >= relativeGate);
    if (gated.length) {
      const gatedMean = gated.reduce((sum, block) => sum + block.energy, 0) / gated.length;
      integratedLufs = dbFromPower(gatedMean);
    }
  }

  const momentaryLufs = momentaryBlocks.length ? momentaryBlocks[momentaryBlocks.length - 1].lufs : null;

  let shortTermLufs: number | null = null;
  if (length >= shortTermFrames) {
    const energy = combinedEnergyAt(length - shortTermFrames, shortTermFrames);
    shortTermLufs = dbFromPower(energy);
  }

  let sumSq = 0;
  let sumL = 0;
  let sumR = 0;
  let cross = 0;
  let peak = 0;
  let dcL = 0;
  let dcR = 0;
  const shortTermHistory: number[] = [];

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

  if (length >= momentaryFrames) {
    for (const block of momentaryBlocks) shortTermHistory.push(block.lufs);
  }

  const rms = Math.sqrt(sumSq / length);
  const rmsDb = dbFromPower(rms * rms) + 0.691;
  const crestFactorDb = rms > EPSILON ? 20 * Math.log10(peak / rms) : null;
  const truePeak = Math.max(
    truePeak4x(left.subarray(0, length)),
    truePeak4x((channels === 2 ? right : left).subarray(0, length)),
  );
  const truePeakDbtp = truePeak > EPSILON ? 20 * Math.log10(truePeak) : SILENCE_DB;
  const correlation = Math.sqrt(sumL * sumR) > EPSILON ? cross / Math.sqrt(sumL * sumR) : 1;
  const midRms = Math.sqrt(Math.max(EPSILON, (sumL + sumR + 2 * cross) / (4 * length)));
  const sideRms = Math.sqrt(Math.max(EPSILON, (sumL + sumR - 2 * cross) / (4 * length)));
  const stereoWidth = 20 * Math.log10(sideRms / midRms);
  const p95 = percentile(shortTermHistory, 0.95);
  const p10 = percentile(shortTermHistory, 0.10);
  const dynamicRangeDb = p95 != null && p10 != null ? Math.max(0, p95 - p10) : null;

  base.integratedLufs = integratedLufs;
  base.shortTermLufs = shortTermLufs;
  base.momentaryLufs = momentaryLufs;
  base.truePeakDbtp = Number.isFinite(truePeakDbtp) ? truePeakDbtp : null;
  base.rmsDb = Number.isFinite(rmsDb) ? rmsDb : null;
  base.crestFactorDb = Number.isFinite(crestFactorDb ?? NaN) ? crestFactorDb : null;
  base.clippingDetected = peak >= 0.999 || truePeak >= 1;
  base.dcOffsetDetected = Math.abs(dcL / length) > 0.001 || Math.abs(dcR / length) > 0.001;
  base.stereoWidth = channels === 2 && Number.isFinite(stereoWidth) ? stereoWidth : null;
  base.dynamicRangeDb = dynamicRangeDb;
  const valid = integratedLufs != null && momentaryLufs != null && truePeakDbtp != null;
  return { ...base, valid, status: valid ? 'valid' : 'analyzing' };
}
