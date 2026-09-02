const DEFAULT_PARAMS = Object.freeze({
  low: 0,
  mid: 0,
  high: 0,
  threshold: -24,
  ratio: 3,
  gain: 0,
  lowFreq: 120,
  midFreq: 1200,
  highFreq: 8500,
  midQ: 0.8,
  attack: 25,
  release: 120,
  knee: 4,
  drive: 35,
  warmth: 40,
  mix: 100,
  width: 110,
  balance: 0,
  phaseInvert: false,
  ceiling: -1,
  limiterRelease: 80,
  lookahead: 3,
  truePeak: true,
});

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const dbToGain = (db) => 10 ** (db / 20);
const gainToDb = (v) => 20 * Math.log10(Math.max(v, 1e-12));

class Biquad {
  constructor(sr, type, frequency, q = 0.707) {
    this.sr = sr;
    this.type = type;
    this.frequency = frequency;
    this.q = q;
    this.z1 = 0;
    this.z2 = 0;
    this.setGain(0);
  }

  setFrequency(frequency) {
    this.frequency = clamp(frequency, 10, this.sr * 0.49);
    this.recalculate(this.lastGainDb || 0);
  }

  setQ(q) {
    this.q = clamp(q, 0.1, 10);
    this.recalculate(this.lastGainDb || 0);
  }

  setGain(gainDb) {
    this.lastGainDb = gainDb;
    this.recalculate(gainDb);
  }

  recalculate(gainDb) {
    const A = 10 ** (gainDb / 40);
    const w = 2 * Math.PI * this.frequency / this.sr;
    const c = Math.cos(w);
    const s = Math.sin(w);
    const alpha = s / (2 * this.q);
    const rootA = Math.sqrt(A);
    let b0, b1, b2, a0, a1, a2;

    if (this.type === 'peaking') {
      b0 = 1 + alpha * A;
      b1 = -2 * c;
      b2 = 1 - alpha * A;
      a0 = 1 + alpha / A;
      a1 = -2 * c;
      a2 = 1 - alpha / A;
    } else if (this.type === 'lowshelf') {
      const slope = 2 * rootA * alpha;
      b0 = A * ((A + 1) - (A - 1) * c + slope);
      b1 = 2 * A * ((A - 1) - (A + 1) * c);
      b2 = A * ((A + 1) - (A - 1) * c - slope);
      a0 = (A + 1) + (A - 1) * c + slope;
      a1 = -2 * ((A - 1) + (A + 1) * c);
      a2 = (A + 1) + (A - 1) * c - slope;
    } else {
      const slope = 2 * rootA * alpha;
      b0 = A * ((A + 1) + (A - 1) * c + slope);
      b1 = -2 * A * ((A - 1) + (A + 1) * c);
      b2 = A * ((A + 1) + (A - 1) * c - slope);
      a0 = (A + 1) - (A - 1) * c + slope;
      a1 = 2 * ((A - 1) - (A + 1) * c);
      a2 = (A + 1) - (A - 1) * c - slope;
    }

    this.b0 = b0 / a0;
    this.b1 = b1 / a0;
    this.b2 = b2 / a0;
    this.a1 = a1 / a0;
    this.a2 = a2 / a0;
  }

  process(x) {
    const y = x * this.b0 + this.z1;
    this.z1 = x * this.b1 - y * this.a1 + this.z2;
    this.z2 = x * this.b2 - y * this.a2;
    return y;
  }
}

class DcBlocker {
  constructor() {
    this.x1 = 0;
    this.y1 = 0;
  }

  process(x) {
    const y = x - this.x1 + 0.995 * this.y1;
    this.x1 = x;
    this.y1 = y;
    return y;
  }
}

class MasteringWorkletProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.params = { ...DEFAULT_PARAMS };
    this.isBypassed = false;
    this.envelope = 0;
    this.detectorHpL = 0;
    this.detectorHpR = 0;
    this.prevDetectorL = 0;
    this.prevDetectorR = 0;
    this.limiterGain = 1;
    this.previousL = 0;
    this.previousR = 0;
    this.reportCounter = 0;

    this.ringBufferSize = 4096;
    this.ringL = new Float32Array(this.ringBufferSize);
    this.ringR = new Float32Array(this.ringBufferSize);
    this.writeIndex = 0;
    this.lookaheadSamples = 0;

    this.dcL = new DcBlocker();
    this.dcR = new DcBlocker();

    this.filters = [
      {
        low: new Biquad(sampleRate, 'lowshelf', 120),
        mid: new Biquad(sampleRate, 'peaking', 1200, 0.8),
        high: new Biquad(sampleRate, 'highshelf', 8500),
      },
      {
        low: new Biquad(sampleRate, 'lowshelf', 120),
        mid: new Biquad(sampleRate, 'peaking', 1200, 0.8),
        high: new Biquad(sampleRate, 'highshelf', 8500),
      },
    ];

    this.updateParams(this.params);
    this.port.onmessage = ({ data = {} }) => {
      if (data.type === 'SET_PARAMS') this.updateParams(data.params || {});
      if (data.type === 'SET_ADVANCED_PARAMS') this.updateParams(data.params || {});
      if (data.type === 'SET_BYPASS') this.isBypassed = Boolean(data.isBypassed);
    };
  }

  updateParams(next) {
    Object.assign(this.params, next);

    const lowFreq = this.params.lowFreq ?? 120;
    const midFreq = this.params.midFreq ?? 1200;
    const highFreq = this.params.highFreq ?? 8500;
    const midQ = this.params.midQ ?? 0.8;

    this.filters.forEach((f) => {
      f.low.setFrequency(lowFreq);
      f.mid.setFrequency(midFreq);
      f.mid.setQ(midQ);
      f.high.setFrequency(highFreq);
      f.low.setGain(this.params.low ?? 0);
      f.mid.setGain(this.params.mid ?? 0);
      f.high.setGain(this.params.high ?? 0);
    });

    const attackMs = clamp(this.params.attack ?? 25, 0.1, 1000);
    const releaseMs = clamp(this.params.release ?? 120, 10, 2000);
    const limiterReleaseMs = clamp(this.params.limiterRelease ?? 80, 10, 2000);
    this.attack = Math.exp(-1 / Math.max(1, (attackMs / 1000) * sampleRate));
    this.release = Math.exp(-1 / Math.max(1, (releaseMs / 1000) * sampleRate));
    this.limitRelease = Math.exp(-1 / Math.max(1, (limiterReleaseMs / 1000) * sampleRate));

    this.makeup = dbToGain(clamp(this.params.gain ?? 0, -24, 24));
    this.ceiling = dbToGain(clamp(this.params.ceiling ?? -1, -60, 0));
    this.drive = clamp(this.params.drive ?? 0, 0, 100);
    this.warmth = clamp(this.params.warmth ?? 0, 0, 100) / 100;
    this.mix = clamp(this.params.mix ?? 100, 0, 100) / 100;
    this.width = clamp(this.params.width ?? 100, 0, 200) / 100;
    this.balance = clamp(this.params.balance ?? 0, -100, 100) / 100;
    this.knee = clamp(this.params.knee ?? 4, 0, 24);
    this.ratio = clamp(this.params.ratio ?? 3, 1, 20);
    this.threshold = clamp(this.params.threshold ?? -24, -60, 0);
    this.truePeak = this.params.truePeak !== false;

    const requestedLookahead = clamp(this.params.lookahead ?? 0, 0, 10);
    this.lookaheadSamples = Math.min(
      this.ringBufferSize - 1,
      Math.round((requestedLookahead / 1000) * sampleRate),
    );
  }

  saturate(x, dcBlocker) {
    if (this.drive === 0 && this.warmth === 0) return x;
    const driveGain = 1 + (2 * this.drive) / 100;
    let y = Math.tanh(x * driveGain) / Math.tanh(driveGain);
    if (this.warmth > 0) y += this.warmth * 0.25 * y * y;
    y = dcBlocker.process(y);
    return x + (y - x) * this.mix;
  }

  compressGain(detectorDb) {
    const t = this.threshold;
    const r = this.ratio;
    const k = this.knee;
    if (k <= 0) return detectorDb > t ? t + (detectorDb - t) / r - detectorDb : 0;
    const half = k / 2;
    if (detectorDb < t - half) return 0;
    if (detectorDb > t + half) return t + (detectorDb - t) / r - detectorDb;
    const x = detectorDb - t + half;
    return (1 / r - 1) * (x * x) / (2 * k);
  }

  updateDetector(sample, state, previous) {
    const hp = sample - previous + 0.995 * state;
    const next = hp;
    const detector = Math.abs(sample - previous) > 1e-15 ? Math.abs(sample) : Math.abs(next);
    return { state: next, previous: sample, detector };
  }

  truePeakEstimate(current, previous) {
    let peak = Math.max(Math.abs(previous), Math.abs(current));
    if (!this.truePeak) return peak;
    for (let phase = 1; phase < 4; phase += 1) {
      peak = Math.max(peak, Math.abs(previous + (current - previous) * (phase / 4)));
    }
    return peak + 1e-15;
  }

  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];
    if (!input?.[0] || !output?.[0]) return true;

    const inL = input[0];
    const inR = input[1] || input[0];
    const outL = output[0];
    const outR = output[1] || output[0];
    const channels = output.length > 1 ? 2 : 1;

    for (let i = 0; i < inL.length; i += 1) {
      const rawL = inL[i] || 0;
      const rawR = inR[i] || 0;

      if (this.isBypassed) {
        outL[i] = rawL;
        if (channels > 1) outR[i] = rawR;
        this.previousL = rawL;
        this.previousR = rawR;
        continue;
      }

      let L = this.saturate(rawL, this.dcL);
      let R = this.saturate(rawR, this.dcR);

      L = this.filters[0].high.process(this.filters[0].mid.process(this.filters[0].low.process(L)));
      R = this.filters[1].high.process(this.filters[1].mid.process(this.filters[1].low.process(R)));

      const mid = (L + R) * 0.5;
      const side = (L - R) * 0.5 * this.width;
      L = mid + side;
      R = mid - side;

      if (this.params.phaseInvert) R = -R;

      const balanceAngle = (this.balance + 1) * Math.PI * 0.25;
      const balanceL = Math.SQRT2 * Math.cos(balanceAngle);
      const balanceR = Math.SQRT2 * Math.sin(balanceAngle);
      L *= balanceL;
      R *= balanceR;

      const detectorSample = Math.max(Math.abs(L), Math.abs(R)) + 1e-15;
      const detectorDb = gainToDb(detectorSample);
      const detectorCoeff = detectorSample > this.envelope ? this.attack : this.release;
      this.envelope = detectorSample + detectorCoeff * (this.envelope - detectorSample);
      const compressorGainDb = this.compressGain(gainToDb(this.envelope));
      const compressorGain = dbToGain(compressorGainDb) * this.makeup;
      const scaledL = L * compressorGain;
      const scaledR = R * compressorGain;

      this.ringL[this.writeIndex] = scaledL;
      this.ringR[this.writeIndex] = scaledR;

      const peak = Math.max(
        this.truePeakEstimate(scaledL, this.previousL),
        this.truePeakEstimate(scaledR, this.previousR),
      );
      const targetGain = peak > this.ceiling ? this.ceiling / peak : 1;

      if (targetGain < this.limiterGain) {
        this.limiterGain = targetGain + (this.limiterGain - targetGain) * this.attack;
      } else {
        this.limiterGain = targetGain + (this.limiterGain - targetGain) * this.limitRelease;
      }

      let readIndex = this.writeIndex - this.lookaheadSamples;
      if (readIndex < 0) readIndex += this.ringBufferSize;

      L = this.ringL[readIndex] * this.limiterGain;
      R = this.ringR[readIndex] * this.limiterGain;

      const finalPeak = Math.max(Math.abs(L), Math.abs(R));
      if (finalPeak > this.ceiling) {
        const safety = this.ceiling / Math.max(finalPeak, 1e-15);
        L *= safety;
        R *= safety;
        this.limiterGain *= safety;
      }

      outL[i] = clamp(L, -1, 1);
      if (channels > 1) outR[i] = clamp(R, -1, 1);

      this.previousL = scaledL;
      this.previousR = scaledR;
    }

    this.reportCounter += inL.length;
    if (this.reportCounter >= 2048) {
      this.reportCounter = 0;
      const grDb = 20 * Math.log10(Math.max(this.limiterGain, 1e-12));
      this.port.postMessage({
        type: 'GR_UPDATE',
        gainReductionDb: grDb,
        latencySamples: this.lookaheadSamples,
      });
    }

    this.sendMeters(input, output, channels);
    return true;
  }

  sendMeters(input, output, channels) {
    let peakInL = 0;
    let peakInR = 0;
    let peakOutL = 0;
    let peakOutR = 0;
    let sumInL = 0;
    let sumInR = 0;
    let sumOutL = 0;
    let sumOutR = 0;

    for (let i = 0; i < output[0].length; i += 1) {
      const il = input[0][i] || 0;
      const ir = channels > 1 ? (input[1][i] || 0) : il;
      const ol = output[0][i] || 0;
      const or = channels > 1 ? (output[1][i] || 0) : ol;
      peakInL = Math.max(peakInL, Math.abs(il));
      peakInR = Math.max(peakInR, Math.abs(ir));
      peakOutL = Math.max(peakOutL, Math.abs(ol));
      peakOutR = Math.max(peakOutR, Math.abs(or));
      sumInL += il * il;
      sumInR += ir * ir;
      sumOutL += ol * ol;
      sumOutR += or * or;
    }

    this.port.postMessage({
      type: 'METERS',
      meters: {
        peakInL,
        peakInR,
        peakOutL,
        peakOutR,
        sumInL,
        sumInR,
        sumOutL,
        sumOutR,
        frameCount: output[0].length,
        limiterGain: this.limiterGain,
        truePeakL: peakOutL,
        truePeakR: peakOutR,
      },
    });
  }
}

registerProcessor('mastering-worklet', MasteringWorkletProcessor);
