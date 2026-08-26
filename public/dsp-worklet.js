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

class MasteringWorkletProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.channelCount = 2;
    this.params = { ...DEFAULT_PARAMS };
    this.isBypassed = false;
    this.envelope = 0;
    this.limiterGain = 1;
    this.meterDecimation = 0;
    this.meterInterval = 6;
    this.filters = Array.from({ length: this.channelCount }, () => ({
      low: new Biquad(sampleRate, 'lowshelf', 120),
      mid: new Biquad(sampleRate, 'peaking', 1200, 0.8),
      high: new Biquad(sampleRate, 'highshelf', 8500),
    }));

    this.updateParams(this.params);

    this.port.onmessage = (event) => {
      const { type, data } = event.data || {};
      if (type === 'SET_PARAMS') this.updateParams(data || {});
      if (type === 'SET_BYPASS') this.isBypassed = Boolean(data);
    };

    this.port.postMessage({ type: 'WORKLET_READY' });
  }

  updateParams(params) {
    Object.assign(this.params, params);
    this.filters.forEach((filters) => {
      filters.low.setGain(this.params.low);
      filters.mid.setGain(this.params.mid);
      filters.high.setGain(this.params.high);
    });
    this.makeup = dbToGain(this.params.gain);
    this.attack = Math.exp(-1 / (0.02 * sampleRate));
    this.release = Math.exp(-1 / (0.24 * sampleRate));
    this.limitRelease = Math.exp(-1 / (0.08 * sampleRate));
    this.ceiling = dbToGain(-1);
  }

  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];
    if (!output || output.length === 0) return true;

    const channels = Math.min(output.length, this.channelCount);
    const inputChannels = input || [];
    const frameCount = output[0]?.length || inputChannels[0]?.length || 0;
    if (frameCount === 0) return true;

    if (this.isBypassed) {
      for (let channel = 0; channel < channels; channel += 1) {
        const inChannel = inputChannels[channel] || inputChannels[0];
        const outChannel = output[channel];
        for (let i = 0; i < frameCount; i += 1) outChannel[i] = inChannel?.[i] || 0;
      }
      this.sendMeters(inputChannels, output, frameCount, channels, true);
      return true;
    }

    for (let frame = 0; frame < frameCount; frame += 1) {
      let detector = 0;
      for (let channel = 0; channel < channels; channel += 1) {
        const inputChannel = inputChannels[channel] || inputChannels[0];
        const filters = this.filters[channel];
        let sample = inputChannel?.[frame] || 0;
        sample = filters.low.process(sample);
        sample = filters.mid.process(sample);
        sample = filters.high.process(sample);
        output[channel][frame] = sample;
        detector = Math.max(detector, Math.abs(sample));
      }

      const coefficient = detector > this.envelope ? this.attack : this.release;
      this.envelope = detector + coefficient * (this.envelope - detector);
      const overDb = gainToDb(this.envelope) - this.params.threshold;
      const reductionDb = overDb > 0
        ? -overDb * (1 - 1 / Math.max(1, this.params.ratio))
        : 0;
      const compressorGain = dbToGain(reductionDb) * this.makeup;
      const postPeak = detector * compressorGain;
      const targetLimiter = postPeak > this.ceiling ? this.ceiling / postPeak : 1;
      this.limiterGain = targetLimiter < this.limiterGain
        ? targetLimiter
        : 1 + this.limitRelease * (this.limiterGain - 1);

      for (let channel = 0; channel < channels; channel += 1) {
        output[channel][frame] = clamp(
          output[channel][frame] * compressorGain * this.limiterGain,
          -this.ceiling,
          this.ceiling,
        );
      }
    }

    this.sendMeters(inputChannels, output, frameCount, channels, false);
    return true;
  }

  sendMeters(input, output, frameCount, channels, bypassed) {
    this.meterDecimation += 1;
    if (this.meterDecimation < this.meterInterval) return;
    this.meterDecimation = 0;

    let peakInL = 0;
    let peakInR = 0;
    let sumInL = 0;
    let sumInR = 0;
    let peakOutL = 0;
    let peakOutR = 0;
    let sumOutL = 0;
    let sumOutR = 0;

    for (let i = 0; i < frameCount; i += 1) {
      const inL = input[0]?.[i] || 0;
      const inR = channels > 1 ? (input[1]?.[i] || 0) : inL;
      const outL = output[0]?.[i] || 0;
      const outR = channels > 1 ? (output[1]?.[i] || 0) : outL;
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
        peakInL,
        peakInR,
        rmsInL: Math.sqrt(sumInL / frameCount),
        rmsInR: Math.sqrt(sumInR / frameCount),
        peakOutL,
        peakOutR,
        rmsOutL: Math.sqrt(sumOutL / frameCount),
        rmsOutR: Math.sqrt(sumOutR / frameCount),
        gainReductionDb: bypassed ? 0 : Math.max(0, -gainToDb(Math.max(1e-4, this.limiterGain))),
        limiterActive: !bypassed && this.limiterGain < 0.99,
      },
    });
  }
}

registerProcessor('mastering-worklet', MasteringWorkletProcessor);
