const DEFAULT_PARAMS = Object.freeze({
  low: 0,
  mid: 0,
  high: 0,
  threshold: -24,
  ratio: 3,
  gain: 0,
});

const DEFAULT_ADVANCED = Object.freeze({
  drive: 0,
  warmth: 0,
  mix: 100,
  width: 100,
  balance: 0,
  ceiling: -1,
  limiterRelease: 80,
  truePeak: true,
});

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const dbToGain = (value) => 10 ** (value / 20);
const gainToDb = (value) => 20 * Math.log10(Math.max(value, 1e-8));

class Biquad {
  constructor(sampleRate, type, frequency, q = 0.707) {
    this.sampleRate = sampleRate;
    this.type = type;
    this.frequency = frequency;
    this.q = q;
    this.z1 = 0;
    this.z2 = 0;
    this.setGain(0);
  }

  setGain(gainDb) {
    const amplitude = 10 ** (gainDb / 40);
    const omega = 2 * Math.PI * this.frequency / this.sampleRate;
    const cosine = Math.cos(omega);
    const sine = Math.sin(omega);
    const alpha = sine / (2 * this.q);
    const rootAmplitude = Math.sqrt(amplitude);
    let b0, b1, b2, a0, a1, a2;

    if (this.type === 'peaking') {
      b0 = 1 + alpha * amplitude;
      b1 = -2 * cosine;
      b2 = 1 - alpha * amplitude;
      a0 = 1 + alpha / amplitude;
      a1 = -2 * cosine;
      a2 = 1 - alpha / amplitude;
    } else if (this.type === 'lowshelf') {
      const slope = 2 * rootAmplitude * alpha;
      b0 = amplitude * ((amplitude + 1) - (amplitude - 1) * cosine + slope);
      b1 = 2 * amplitude * ((amplitude - 1) - (amplitude + 1) * cosine);
      b2 = amplitude * ((amplitude + 1) - (amplitude - 1) * cosine - slope);
      a0 = (amplitude + 1) + (amplitude - 1) * cosine + slope;
      a1 = -2 * ((amplitude - 1) + (amplitude + 1) * cosine);
      a2 = (amplitude + 1) + (amplitude - 1) * cosine - slope;
    } else {
      const slope = 2 * rootAmplitude * alpha;
      b0 = amplitude * ((amplitude + 1) + (amplitude - 1) * cosine + slope);
      b1 = -2 * amplitude * ((amplitude - 1) + (amplitude + 1) * cosine);
      b2 = amplitude * ((amplitude + 1) + (amplitude - 1) * cosine - slope);
      a0 = (amplitude + 1) - (amplitude - 1) * cosine + slope;
      a1 = 2 * ((amplitude - 1) - (amplitude + 1) * cosine);
      a2 = (amplitude + 1) - (amplitude - 1) * cosine - slope;
    }

    this.b0 = b0 / a0;
    this.b1 = b1 / a0;
    this.b2 = b2 / a0;
    this.a1 = a1 / a0;
    this.a2 = a2 / a0;
  }

  process(sample) {
    const output = sample * this.b0 + this.z1;
    this.z1 = sample * this.b1 - output * this.a1 + this.z2;
    this.z2 = sample * this.b2 - output * this.a2;
    return output;
  }
}

class MasteringWorkletProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.sampleRate = sampleRate;
    this.channelCount = 2;
    this.params = { ...DEFAULT_PARAMS };
    this.advanced = { ...DEFAULT_ADVANCED };
    this.isBypassed = false;
    this.envelope = 0;
    this.limiterGain = 1;
    this.previousL = 0;
    this.previousR = 0;
    this.filters = Array.from({ length: this.channelCount }, () => ({
      low: new Biquad(this.sampleRate, 'lowshelf', 120),
      mid: new Biquad(this.sampleRate, 'peaking', 1200, 0.8),
      high: new Biquad(this.sampleRate, 'highshelf', 8500),
    }));
    this.updateParams(this.params, this.advanced);

    this.port.onmessage = (event) => {
      const data = event.data || {};
      if (data.type === 'SET_PARAMS') {
        this.updateParams(data.params || this.params, data.advanced || this.advanced);
      } else if (data.type === 'SET_ADVANCED_PARAMS') {
        this.updateParams(this.params, data.params || this.advanced);
      } else if (data.type === 'SET_BYPASS') {
        this.isBypassed = Boolean(data.isBypassed);
      }
    };
  }

  updateParams(params, advanced) {
    Object.assign(this.params, params);
    Object.assign(this.advanced, advanced);
    this.filters.forEach((filters) => {
      filters.low.setGain(this.params.low);
      filters.mid.setGain(this.params.mid);
      filters.high.setGain(this.params.high);
    });
    this.makeup = dbToGain(this.params.gain);
    this.attack = Math.exp(-1 / (0.02 * this.sampleRate));
    this.release = Math.exp(-1 / (0.24 * this.sampleRate));
    this.limitRelease = Math.exp(-1 / ((Math.max(10, this.advanced.limiterRelease) / 1000) * this.sampleRate));
    this.ceiling = dbToGain(this.advanced.ceiling);
    this.drive = clamp(this.advanced.drive, 0, 100);
    this.width = clamp(this.advanced.width, 0, 200) / 100;
    this.warmth = clamp(this.advanced.warmth, 0, 100) / 100;
    this.mix = clamp(this.advanced.mix, 0, 100) / 100;
    this.balance = clamp(this.advanced.balance, -100, 100) / 100;
    this.truePeak = this.advanced.truePeak !== false;
  }

  saturate(sample) {
    if (this.drive <= 0 && this.warmth <= 0) return sample;
    const drive = (2 * this.drive + this.warmth) / 100;
    const k = 1 + drive;
    const wet = Math.tanh(sample * k) / Math.tanh(k);
    return sample + (wet - sample) * this.mix;
  }

  applyStereo(L, R) {
    const mid = (L + R) * 0.5;
    const side = (L - R) * 0.5 * this.width;
    let outL = mid + side;
    let outR = mid - side;
    const balanceL = this.balance < 0 ? 1 : 1 - this.balance;
    const balanceR = this.balance > 0 ? 1 : 1 + this.balance;
    return [outL * balanceL, outR * balanceR];
  }

  estimateTruePeak(sample, previous) {
    if (!this.truePeak) return Math.abs(sample);
    let peak = Math.max(Math.abs(previous), Math.abs(sample));
    for (let phase = 1; phase < 4; phase += 1) {
      const t = phase / 4;
      const interpolated = previous + (sample - previous) * t;
      peak = Math.max(peak, Math.abs(interpolated));
    }
    return peak;
  }

  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];
    if (!input || !output || input.length === 0 || !input[0]) return true;

    const frameCount = input[0].length;
    const channels = Math.min(input.length, output.length, this.channelCount);

    for (let frame = 0; frame < frameCount; frame += 1) {
      let L = input[0][frame] || 0;
      let R = channels > 1 ? input[1][frame] || 0 : L;

      if (!this.isBypassed) {
        L = this.filters[0].high.process(this.filters[0].mid.process(this.filters[0].low.process(L)));
        R = this.filters[1].high.process(this.filters[1].mid.process(this.filters[1].low.process(R)));

        L = this.saturate(L);
        R = this.saturate(R);
        [L, R] = this.applyStereo(L, R);

        const detector = Math.max(Math.abs(L), Math.abs(R));
        const coefficient = detector > this.envelope ? this.attack : this.release;
        this.envelope = detector + coefficient * (this.envelope - detector);
        const overDb = gainToDb(this.envelope) - this.params.threshold;
        const reductionDb = overDb > 0 ? -overDb * (1 - 1 / Math.max(1, this.params.ratio)) : 0;
        const compressorGain = dbToGain(reductionDb) * this.makeup;
        const postPeak = detector * compressorGain;
        const estimatedPeak = this.truePeak
          ? Math.max(this.estimateTruePeak(L * compressorGain, this.previousL), this.estimateTruePeak(R * compressorGain, this.previousR))
          : postPeak;
        const targetLimiter = estimatedPeak > this.ceiling ? this.ceiling / estimatedPeak : 1;
        this.limiterGain = targetLimiter < this.limiterGain
          ? targetLimiter
          : 1 + this.limitRelease * (this.limiterGain - 1);

        L *= compressorGain * this.limiterGain;
        R *= compressorGain * this.limiterGain;
        const finalPeak = Math.max(Math.abs(L), Math.abs(R));
        if (finalPeak > this.ceiling) {
          const finalScale = this.ceiling / finalPeak;
          L *= finalScale;
          R *= finalScale;
          this.limiterGain *= finalScale;
        }
      }

      output[0][frame] = clamp(L, -1, 1);
      if (channels > 1) output[1][frame] = clamp(R, -1, 1);
      this.previousL = L;
      this.previousR = R;
    }

    this.sendMeters(input, output, frameCount, channels);
    return true;
  }

  sendMeters(input, output, frameCount, channels) {
    let peakInL = 0, peakInR = 0, sumInL = 0, sumInR = 0;
    let peakOutL = 0, peakOutR = 0, sumOutL = 0, sumOutR = 0;

    for (let i = 0; i < frameCount; i += 1) {
      const inL = input[0][i] || 0;
      const inR = channels > 1 ? input[1][i] || 0 : inL;
      const outL = output[0][i] || 0;
      const outR = channels > 1 ? output[1][i] || 0 : outL;
      peakInL = Math.max(peakInL, Math.abs(inL));
      peakInR = Math.max(peakInR, Math.abs(inR));
      peakOutL = Math.max(peakOutL, Math.abs(outL));
      peakOutR = Math.max(peakOutR, Math.abs(outR));
      sumInL += inL * inL;
      sumInR += inR * inR;
      sumOutL += outL * outL;
      sumOutR += outR * outR;
    }

    this.port.postMessage({
      type: 'METERS',
      meters: {
        peakInL, peakInR, sumInL, sumInR,
        peakOutL, peakOutR, sumOutL, sumOutR,
        frameCount,
        truePeakL: this.truePeak ? peakOutL : peakOutL,
        truePeakR: this.truePeak ? peakOutR : peakOutR,
        limiterGain: this.limiterGain,
      },
    });
  }
}

registerProcessor('mastering-worklet', MasteringWorkletProcessor);
