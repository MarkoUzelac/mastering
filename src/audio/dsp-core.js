const DEFAULT_PARAMS = Object.freeze({
  low: 0,
  mid: 0,
  high: 0,
  threshold: -24,
  ratio: 3,
  gain: 0,
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
    let b0;
    let b1;
    let b2;
    let a0;
    let a1;
    let a2;

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

export class MasteringDSP {
  constructor(sampleRate, channelCount = 2, params = {}) {
    this.sampleRate = sampleRate;
    this.channelCount = channelCount;
    this.params = { ...DEFAULT_PARAMS, ...params };
    this.envelope = 0;
    this.limiterGain = 1;
    this.filters = Array.from({ length: channelCount }, () => ({
      low: new Biquad(sampleRate, 'lowshelf', 120),
      mid: new Biquad(sampleRate, 'peaking', 1200, 0.8),
      high: new Biquad(sampleRate, 'highshelf', 8500),
    }));
    this.update(this.params);
  }

  update(params) {
    Object.assign(this.params, params);
    this.filters.forEach((filters) => {
      filters.low.setGain(this.params.low);
      filters.mid.setGain(this.params.mid);
      filters.high.setGain(this.params.high);
    });
    this.makeup = dbToGain(this.params.gain);
    this.attack = Math.exp(-1 / (0.02 * this.sampleRate));
    this.release = Math.exp(-1 / (0.24 * this.sampleRate));
    this.limitRelease = Math.exp(-1 / (0.08 * this.sampleRate));
    this.ceiling = dbToGain(-1);
  }

  process(inputs, outputs) {
    const frameCount = inputs[0]?.length || 0;
    for (let frame = 0; frame < frameCount; frame += 1) {
      let detector = 0;
      for (let channel = 0; channel < this.channelCount; channel += 1) {
        const input = inputs[channel] || inputs[0];
        const filters = this.filters[channel];
        let sample = filters.low.process(input[frame] || 0);
        sample = filters.mid.process(sample);
        sample = filters.high.process(sample);
        outputs[channel][frame] = sample;
        detector = Math.max(detector, Math.abs(sample));
      }

      const coefficient = detector > this.envelope ? this.attack : this.release;
      this.envelope = detector + coefficient * (this.envelope - detector);
      const overDb = gainToDb(this.envelope) - this.params.threshold;
      const reductionDb = overDb > 0 ? -overDb * (1 - 1 / Math.max(1, this.params.ratio)) : 0;
      const compressorGain = dbToGain(reductionDb) * this.makeup;
      const postPeak = detector * compressorGain;
      const targetLimiter = postPeak > this.ceiling ? this.ceiling / postPeak : 1;
      this.limiterGain = targetLimiter < this.limiterGain
        ? targetLimiter
        : 1 + this.limitRelease * (this.limiterGain - 1);

      for (let channel = 0; channel < this.channelCount; channel += 1) {
        outputs[channel][frame] = clamp(outputs[channel][frame] * compressorGain * this.limiterGain, -this.ceiling, this.ceiling);
      }
    }
  }
}

export { DEFAULT_PARAMS };
