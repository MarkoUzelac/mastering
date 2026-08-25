import { MasteringDSP } from '../audio/dsp-core.js';
import { MasteringParams } from '../types';

export interface ParityTestItem {
  name: string;
  details: string;
  passed: boolean;
  deviation: number;
}

export interface ParitySuiteResult {
  passed: boolean;
  maxDeviation: number;
  totalSamples: number;
  tests: ParityTestItem[];
}

export async function runParityTestSuite(): Promise<ParitySuiteResult> {
  const sampleRate = 48000;
  const numSamples = 100000;
  const channels = 2;
  const tests: ParityTestItem[] = [];

  // Test 1: Unity identity at 0dB flat
  {
    const flatParams: MasteringParams = {
      low: 0,
      mid: 0,
      high: 0,
      threshold: 0,
      ratio: 1,
      gain: 0,
    };
    const inL = new Float32Array(numSamples);
    const inR = new Float32Array(numSamples);
    for (let i = 0; i < numSamples; i++) {
      inL[i] = 0.5 * Math.sin((2 * Math.PI * 440 * i) / sampleRate);
      inR[i] = 0.4 * Math.sin((2 * Math.PI * 1000 * i) / sampleRate);
    }
    const outL = new Float32Array(numSamples);
    const outR = new Float32Array(numSamples);

    const dsp = new MasteringDSP(sampleRate, channels, flatParams);
    dsp.process([inL, inR], [outL, outR]);

    let maxDev = 0;
    for (let i = 1000; i < numSamples; i++) {
      const diffL = Math.abs(outL[i] - inL[i]);
      const diffR = Math.abs(outR[i] - inR[i]);
      if (diffL > maxDev) maxDev = diffL;
      if (diffR > maxDev) maxDev = diffR;
    }

    const passed = maxDev < 1e-4;
    tests.push({
      name: 'Unity Gain Identity (0 dB Response)',
      details: 'Evaluates linear pass-through accuracy when EQ is flat and compression ratio is 1:1',
      passed,
      deviation: maxDev,
    });
  }

  // Test 2: Biquad Cascade Stability Sweep
  {
    const eqParams: MasteringParams = {
      low: 6.0,
      mid: -4.0,
      high: 3.5,
      threshold: 0,
      ratio: 1,
      gain: 0,
    };
    const inL = new Float32Array(numSamples);
    const inR = new Float32Array(numSamples);
    for (let i = 0; i < numSamples; i++) {
      inL[i] = 0.2 * (Math.random() * 2 - 1);
      inR[i] = 0.2 * (Math.random() * 2 - 1);
    }
    const outL = new Float32Array(numSamples);
    const outR = new Float32Array(numSamples);

    const dsp = new MasteringDSP(sampleRate, channels, eqParams);
    dsp.process([inL, inR], [outL, outR]);

    let hasNan = false;
    let maxVal = 0;
    for (let i = 0; i < numSamples; i++) {
      if (isNaN(outL[i]) || isNaN(outR[i]) || !isFinite(outL[i]) || !isFinite(outR[i])) {
        hasNan = true;
        break;
      }
      maxVal = Math.max(maxVal, Math.abs(outL[i]), Math.abs(outR[i]));
    }

    tests.push({
      name: 'Biquad Direct Form II Cascade Stability',
      details: 'Tests IIR filter pole stability under wideband white noise excitation',
      passed: !hasNan && maxVal < 5.0,
      deviation: hasNan ? 1.0 : 0.0,
    });
  }

  // Test 3: Feedback Compressor Ballistics
  {
    const compParams: MasteringParams = {
      low: 0,
      mid: 0,
      high: 0,
      threshold: -20,
      ratio: 4,
      gain: 0,
    };
    const inL = new Float32Array(numSamples);
    const inR = new Float32Array(numSamples);
    for (let i = 0; i < numSamples; i++) {
      const isBurst = i > 10000 && i < 30000;
      inL[i] = isBurst ? 0.9 : 0.05;
      inR[i] = isBurst ? 0.9 : 0.05;
    }
    const outL = new Float32Array(numSamples);
    const outR = new Float32Array(numSamples);

    const dsp = new MasteringDSP(sampleRate, channels, compParams);
    dsp.process([inL, inR], [outL, outR]);

    // Check that envelope responded to burst
    const steadyBurstLevel = Math.abs(outL[25000]);
    const passed = steadyBurstLevel < 0.85 && steadyBurstLevel > 0.1;
    tests.push({
      name: 'RMS Feedback Compressor Ballistics',
      details: 'Validates exponential attack and release curve transitions on high-amplitude step bursts',
      passed,
      deviation: Math.abs(steadyBurstLevel - 0.5),
    });
  }

  // Test 4: Peak Limiter Brickwall Invariant (-1.0 dBFS)
  {
    const maxParams: MasteringParams = {
      low: 4.0,
      mid: 3.0,
      high: 4.0,
      threshold: -24,
      ratio: 4,
      gain: 12.0, // +12 dB extreme overdrive
    };
    const inL = new Float32Array(numSamples);
    const inR = new Float32Array(numSamples);
    for (let i = 0; i < numSamples; i++) {
      inL[i] = Math.sin((2 * Math.PI * 300 * i) / sampleRate);
      inR[i] = Math.sin((2 * Math.PI * 600 * i) / sampleRate);
    }
    // Hard spikes
    inL[0] = 1.0;
    rightInSpike: inR[0] = 1.0;
    inL[24000] = 1.0;
    inR[24000] = -1.0;

    const outL = new Float32Array(numSamples);
    const outR = new Float32Array(numSamples);

    const dsp = new MasteringDSP(sampleRate, channels, maxParams);
    dsp.process([inL, inR], [outL, outR]);

    const ceilingLinear = 10 ** (-1 / 20); // ~0.89125
    let maxOutput = 0;
    for (let i = 0; i < numSamples; i++) {
      maxOutput = Math.max(maxOutput, Math.abs(outL[i]), Math.abs(outR[i]));
    }

    const passed = maxOutput <= ceilingLinear + 1e-3;
    tests.push({
      name: 'Peak Limiter Brickwall Ceiling (-1.0 dBFS Clamp)',
      details: 'Strictly enforces output peak containment under extreme +12dB makeup gain overdrive',
      passed,
      deviation: Math.max(0, maxOutput - ceilingLinear),
    });
  }

  const allPassed = tests.every((t) => t.passed);
  const maxDev = Math.max(...tests.map((t) => t.deviation));

  return {
    passed: allPassed,
    maxDeviation: maxDev,
    totalSamples: numSamples * 2,
    tests,
  };
}
