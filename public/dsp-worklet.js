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
    this.channelCount = 2; // Assuming stereo
    this.params = { ...DEFAULT_PARAMS };
    this.isBypassed = false;
    
    this.envelope = 0;
    this.limiterGain = 1;
    this.filters = Array.from({ length: this.channelCount }, () => ({
      low: new Biquad(this.sampleRate, 'lowshelf', 120),
      mid: new Biquad(this.sampleRate, 'peaking', 1200, 0.8),
      high: new Biquad(this.sampleRate, 'highshelf', 8500),
    }));
    
    this.updateParams(this.params);

    this.port.onmessage = (event) => {
      if (event.data.type === 'SET_PARAMS') {
        this.updateParams(event.data.params);
      } else if (event.data.type === 'SET_BYPASS') {
        this.isBypassed = event.data.isBypassed;
      }
    };
  }

  updateParams(params) {
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
    const input = inputs[0];
    const output = outputs[0];

    if (!input || !output || input.length === 0) {
      return true;
    }

    const frameCount = input[0].length;
    const channels = Math.min(input.length, output.length, this.channelCount);

    if (this.isBypassed) {
      for (let channel = 0; channel < channels; channel++) {
        const inputChannel = input[channel];
        const outputChannel = output[channel];
        for (let i = 0; i < frameCount; i++) {
          outputChannel[i] = inputChannel[i];
        }
      }
      // Send dummy meters to avoid nulls
      this.sendMeters(input, output, frameCount, channels);
      return true;
    }

    for (let frame = 0; frame < frameCount; frame++) {
      let detector = 0;
      for (let channel = 0; channel < channels; channel++) {
        const filters = this.filters[channel];
        let sample = filters.low.process(input[channel][frame]);
        sample = filters.mid.process(sample);
        sample = filters.high.process(sample);
        output[channel][frame] = sample;
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
      
      for (let channel = 0; channel < channels; channel++) {
        output[channel][frame] = clamp(output[channel][frame] * compressorGain * this.limiterGain, -this.ceiling, this.ceiling);
      }
    }

    // Every block (128 samples), send telemetry to the main thread
    this.sendMeters(input, output, frameCount, channels);

    return true;
  }

  sendMeters(input, output, frameCount, channels) {
    let peakInL = 0, peakInR = 0, sumInL = 0, sumInR = 0;
    let peakOutL = 0, peakOutR = 0, sumOutL = 0, sumOutR = 0;
    
    for (let i = 0; i < frameCount; i++) {
      const inL = input[0][i];
      const inR = channels > 1 ? input[1][i] : inL;
      const absInL = Math.abs(inL);
      const absInR = Math.abs(inR);
      if (absInL > peakInL) peakInL = absInL;
      if (absInR > peakInR) peakInR = absInR;
      sumInL += inL * inL;
      sumInR += inR * inR;

      const outL = output[0][i];
      const outR = channels > 1 ? output[1][i] : outL;
      const absOutL = Math.abs(outL);
      const absOutR = Math.abs(outR);
      if (absOutL > peakOutL) peakOutL = absOutL;
      if (absOutR > peakOutR) peakOutR = absOutR;
      sumOutL += outL * outL;
      sumOutR += outR * outR;
    }

    this.port.postMessage({
      type: 'METERS',
      meters: {
        peakInL, peakInR, sumInL, sumInR,
        peakOutL, peakOutR, sumOutL, sumOutR,
        frameCount
      }
    });
  }
}

registerProcessor('mastering-worklet', MasteringWorkletProcessor);
