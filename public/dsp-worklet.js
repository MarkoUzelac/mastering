const DEFAULT_PARAMS = Object.freeze({ low: 0, mid: 0, high: 0, threshold: -24, ratio: 3, gain: 0 });
const DEFAULT_ADVANCED = Object.freeze({ drive: 0, warmth: 0, mix: 100, width: 100, balance: 0, ceiling: -1, limiterRelease: 80, truePeak: true, attack: 20, release: 240, knee: 0 });
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const dbToGain = (db) => 10 ** (db / 20);
const gainToDb = (v) => 20 * Math.log10(Math.max(v, 1e-8));

class Biquad {
  constructor(sr, type, frequency, q = 0.707) {
    this.sr = sr; this.type = type; this.frequency = frequency; this.q = q; this.z1 = 0; this.z2 = 0; this.setGain(0);
  }
  setGain(gainDb) {
    const A = 10 ** (gainDb / 40); const w = 2 * Math.PI * this.frequency / this.sr; const c = Math.cos(w); const s = Math.sin(w); const alpha = s / (2 * this.q); const rootA = Math.sqrt(A);
    let b0, b1, b2, a0, a1, a2;
    if (this.type === 'peaking') {
      b0 = 1 + alpha * A; b1 = -2 * c; b2 = 1 - alpha * A; a0 = 1 + alpha / A; a1 = -2 * c; a2 = 1 - alpha / A;
    } else if (this.type === 'lowshelf') {
      const slope = 2 * rootA * alpha; b0 = A * ((A + 1) - (A - 1) * c + slope); b1 = 2 * A * ((A - 1) - (A + 1) * c); b2 = A * ((A + 1) - (A - 1) * c - slope); a0 = (A + 1) + (A - 1) * c + slope; a1 = -2 * ((A - 1) + (A + 1) * c); a2 = (A + 1) + (A - 1) * c - slope;
    } else {
      const slope = 2 * rootA * alpha; b0 = A * ((A + 1) + (A - 1) * c + slope); b1 = -2 * A * ((A - 1) + (A + 1) * c); b2 = A * ((A + 1) + (A - 1) * c - slope); a0 = (A + 1) - (A - 1) * c + slope; a1 = 2 * ((A - 1) - (A + 1) * c); a2 = (A + 1) - (A - 1) * c - slope;
    }
    this.b0 = b0 / a0; this.b1 = b1 / a0; this.b2 = b2 / a0; this.a1 = a1 / a0; this.a2 = a2 / a0;
  }
  process(x) { const y = x * this.b0 + this.z1; this.z1 = x * this.b1 - y * this.a1 + this.z2; this.z2 = x * this.b2 - y * this.a2; return y; }
}

class MasteringWorkletProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.params = { ...DEFAULT_PARAMS }; this.advanced = { ...DEFAULT_ADVANCED }; this.isBypassed = false;
    this.envelope = 0; this.limiterGain = 1; this.previousL = 0; this.previousR = 0;
    this.filters = Array.from({ length: 2 }, () => ({ low: new Biquad(sampleRate, 'lowshelf', 120), mid: new Biquad(sampleRate, 'peaking', 1200, 0.8), high: new Biquad(sampleRate, 'highshelf', 8500) }));
    this.updateParams(this.params);
    this.port.onmessage = ({ data = {} }) => {
      if (data.type === 'SET_PARAMS') this.updateParams(data.params || {}, data.advanced);
      if (data.type === 'SET_ADVANCED_PARAMS') this.updateParams(this.params, data.params || {});
      if (data.type === 'SET_BYPASS') this.isBypassed = Boolean(data.isBypassed);
    };
  }

  updateParams(params, advanced) {
    Object.assign(this.params, params);
    Object.assign(this.advanced, advanced || {});
    for (const key of ['drive','warmth','mix','width','balance','ceiling','limiterRelease','truePeak','attack','release','knee']) {
      if (params[key] !== undefined && advanced?.[key] === undefined) this.advanced[key] = params[key];
    }
    this.filters.forEach((f) => { f.low.setGain(this.params.low); f.mid.setGain(this.params.mid); f.high.setGain(this.params.high); });
    this.makeup = dbToGain(this.params.gain);
    this.attack = Math.exp(-1 / (Math.max(1, this.advanced.attack) / 1000 * sampleRate));
    this.release = Math.exp(-1 / (Math.max(1, this.advanced.release) / 1000 * sampleRate));
    this.limitRelease = Math.exp(-1 / (Math.max(10, this.advanced.limiterRelease) / 1000 * sampleRate));
    this.ceiling = dbToGain(clamp(this.advanced.ceiling, -60, 0));
    this.drive = clamp(this.advanced.drive, 0, 100); this.warmth = clamp(this.advanced.warmth, 0, 100); this.mix = clamp(this.advanced.mix, 0, 100) / 100;
    this.width = clamp(this.advanced.width, 0, 200) / 100; this.balance = clamp(this.advanced.balance, -100, 100) / 100; this.truePeak = this.advanced.truePeak !== false;
  }

  saturate(x) {
    if (this.drive === 0 && this.warmth === 0) return x;
    const k = 1 + (2 * this.drive + this.warmth) / 100;
    const wet = Math.tanh(x * k) / Math.tanh(k);
    return x + (wet - x) * this.mix;
  }

  truePeakEstimate(current, previous) {
    if (!this.truePeak) return Math.abs(current);
    let peak = Math.max(Math.abs(previous), Math.abs(current));
    for (let phase = 1; phase < 4; phase += 1) peak = Math.max(peak, Math.abs(previous + (current - previous) * (phase / 4)));
    return peak;
  }

  process(inputs, outputs) {
    const input = inputs[0], output = outputs[0];
    if (!input?.[0] || !output?.[0]) return true;
    const frames = input[0].length; const channels = Math.min(2, input.length, output.length);
    for (let i = 0; i < frames; i += 1) {
      let L = input[0][i] || 0; let R = channels > 1 ? (input[1][i] || 0) : L;
      if (!this.isBypassed) {
        L = this.saturate(this.filters[0].high.process(this.filters[0].mid.process(this.filters[0].low.process(L))));
        R = this.saturate(this.filters[1].high.process(this.filters[1].mid.process(this.filters[1].low.process(R))));
        const mid = (L + R) * 0.5; const side = (L - R) * 0.5 * this.width; L = mid + side; R = mid - side;
        const balance = this.balance; if (balance < 0) L *= 1; else if (balance > 0) R *= 1; L *= balance < 0 ? 1 : 1 - balance; R *= balance > 0 ? 1 : 1 + balance;
        const detector = Math.max(Math.abs(L), Math.abs(R)); const coeff = detector > this.envelope ? this.attack : this.release; this.envelope = detector + coeff * (this.envelope - detector);
        const overDb = gainToDb(this.envelope) - this.params.threshold; const reductionDb = overDb > 0 ? -overDb * (1 - 1 / Math.max(1, this.params.ratio)) : 0;
        const compressorGain = dbToGain(reductionDb) * this.makeup; const scaledL = L * compressorGain; const scaledR = R * compressorGain;
        const peak = Math.max(this.truePeakEstimate(scaledL, this.previousL), this.truePeakEstimate(scaledR, this.previousR));
        const target = peak > this.ceiling ? this.ceiling / peak : 1;
        this.limiterGain = target < this.limiterGain ? target : 1 + this.limitRelease * (this.limiterGain - 1);
        L = scaledL * this.limiterGain; R = scaledR * this.limiterGain;
        const finalPeak = Math.max(Math.abs(L), Math.abs(R)); if (finalPeak > this.ceiling) { const s = this.ceiling / finalPeak; L *= s; R *= s; this.limiterGain *= s; }
      }
      output[0][i] = clamp(L, -1, 1); if (channels > 1) output[1][i] = clamp(R, -1, 1); this.previousL = L; this.previousR = R;
    }
    this.sendMeters(input, output, frames, channels); return true;
  }

  sendMeters(input, output, frames, channels) {
    let peakInL=0, peakInR=0, peakOutL=0, peakOutR=0, sumInL=0, sumInR=0, sumOutL=0, sumOutR=0;
    for (let i=0;i<frames;i+=1){ const il=input[0][i]||0, ir=channels>1?(input[1][i]||0):il, ol=output[0][i]||0, or=channels>1?(output[1][i]||0):ol; peakInL=Math.max(peakInL,Math.abs(il)); peakInR=Math.max(peakInR,Math.abs(ir)); peakOutL=Math.max(peakOutL,Math.abs(ol)); peakOutR=Math.max(peakOutR,Math.abs(or)); sumInL+=il*il; sumInR+=ir*ir; sumOutL+=ol*ol; sumOutR+=or*or; }
    this.port.postMessage({ type:'METERS', meters:{ peakInL,peakInR,peakOutL,peakOutR,sumInL,sumInR,sumOutL,sumOutR,frameCount:frames,limiterGain:this.limiterGain,truePeakL:peakOutL,truePeakR:peakOutR } });
  }
}

registerProcessor('mastering-worklet', MasteringWorkletProcessor);
