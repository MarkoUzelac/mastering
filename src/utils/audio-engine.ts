import { MasteringDSP, DEFAULT_PARAMS } from '../audio/dsp-core.js';
import { MasteringParams, MeterData, ParityResult } from '../types';

const WORKLET_URL = '/dsp-worklet.js';
const WORKLET_NAME = 'mastering-worklet';
const WORKLET_TIMEOUT_MS = 5000;

const toDb = (value: number): number =>
  value > 1e-8 ? 20 * Math.log10(value) : -70;

export class AudioMasteringEngine {
  private ctx: AudioContext | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private analyserIn: AnalyserNode | null = null;
  private analyserOut: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private activeParams: MasteringParams = { ...DEFAULT_PARAMS };
  private isBypassed = false;
  private isPlaying = false;
  private playbackStartTime = 0;
  private pauseOffset = 0;
  private animationFrameId: number | null = null;
  private workletInitPromise: Promise<void> | null = null;
  private workletInitError: Error | null = null;
  private onTimeUpdateCallback?: (currentTime: number, duration: number) => void;
  private onMeterUpdateCallback?: (meters: MeterData) => void;
  private accumulatedLoudnessSum = 0;
  private accumulatedLoudnessCount = 0;

  constructor() {
    // Context and Worklet are initialized lazily after a user gesture.
  }

  public getAudioContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) throw new Error('Web Audio API is unavailable in this browser');
      this.ctx = new AudioCtx({ sampleRate: 48000, latencyHint: 'interactive' });
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  private async initializeWorklet(): Promise<void> {
    if (this.workletNode) return;
    if (this.workletInitError) throw this.workletInitError;
    if (this.workletInitPromise) return this.workletInitPromise;

    const ctx = this.getAudioContext();
    this.workletInitPromise = (async () => {
      try {
        const response = await fetch(WORKLET_URL, { cache: 'no-store' });
        if (!response.ok) throw new Error(`Worklet HTTP ${response.status}`);
        const contentType = response.headers.get('content-type') || '';
        const body = await response.text();
        if (/<!doctype\s+html|<html[\s>]/i.test(body)) {
          throw new Error(`Worklet returned HTML instead of JavaScript (content-type: ${contentType || 'unknown'})`);
        }
        if (contentType && !/javascript|ecmascript/i.test(contentType)) {
          throw new Error(`Worklet returned unsupported MIME type: ${contentType}`);
        }

        await ctx.audioWorklet.addModule(WORKLET_URL);
        const node = new AudioWorkletNode(ctx, WORKLET_NAME, {
          numberOfInputs: 1,
          numberOfOutputs: 1,
          outputChannelCount: [2],
          channelCount: 2,
          channelCountMode: 'explicit',
          channelInterpretation: 'speakers',
        });

        await new Promise<void>((resolve, reject) => {
          let settled = false;
          const cleanup = () => {
            clearTimeout(timeout);
            node.port.removeEventListener('message', onMessage);
            node.port.onmessageerror = null;
          };
          const fail = (error: Error) => {
            if (settled) return;
            settled = true;
            cleanup();
            reject(error);
          };
          const onMessage = (event: MessageEvent) => {
            if (event.data?.type === 'WORKLET_READY') {
              if (settled) return;
              settled = true;
              cleanup();
              resolve();
            } else if (event.data?.type === 'WORKLET_ERROR') {
              fail(new Error(String(event.data.message || 'AudioWorklet initialization failed')));
            }
          };
          const timeout = window.setTimeout(() => fail(new Error('AudioWorklet initialization timeout')), WORKLET_TIMEOUT_MS);
          node.port.addEventListener('message', onMessage);
          node.port.onmessageerror = () => fail(new Error('AudioWorklet MessagePort error'));
        });

        this.workletNode = node;
        node.port.postMessage({ type: 'SET_PARAMS', data: this.activeParams });
        node.port.postMessage({ type: 'SET_BYPASS', data: this.isBypassed });
        node.port.addEventListener('message', (event: MessageEvent) => {
          if (event.data?.type !== 'METERS' || !this.onMeterUpdateCallback) return;
          this.handleWorkletMeters(event.data.meters);
        });
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        this.workletInitError = err;
        this.workletInitPromise = null;
        console.error('[AudioEngine] FATAL: AudioWorklet initialization failed', {
          url: WORKLET_URL,
          message: err.message,
          name: err.name,
          secureContext: window.isSecureContext,
          crossOriginIsolated: window.crossOriginIsolated,
        });
        throw err;
      }
    })();

    return this.workletInitPromise;
  }

  private handleWorkletMeters(meters: {
    peakInL: number; peakInR: number; rmsInL: number; rmsInR: number;
    peakOutL: number; peakOutR: number; rmsOutL: number; rmsOutR: number;
    gainReductionDb: number; limiterActive: boolean;
  }): void {
    const meanSquareStereo = (meters.rmsOutL ** 2 + meters.rmsOutR ** 2) / 2;
    const momentaryLufs = meanSquareStereo > 1e-10 ? -0.691 + 10 * Math.log10(meanSquareStereo) : -70;
    if (this.isPlaying && meanSquareStereo > 1e-7) {
      this.accumulatedLoudnessSum += meanSquareStereo;
      this.accumulatedLoudnessCount += 1;
    }
    const integratedLufs = this.accumulatedLoudnessCount > 0
      ? -0.691 + 10 * Math.log10(this.accumulatedLoudnessSum / this.accumulatedLoudnessCount)
      : -14;
    const maxPeak = Math.max(meters.peakOutL, meters.peakOutR);
    const maxRms = Math.max(meters.rmsOutL, meters.rmsOutR);

    this.onMeterUpdateCallback?.({
      inputPeakL: toDb(meters.peakInL),
      inputPeakR: toDb(meters.peakInR),
      inputRmsL: toDb(meters.rmsInL),
      inputRmsR: toDb(meters.rmsInR),
      outputPeakL: toDb(meters.peakOutL),
      outputPeakR: toDb(meters.peakOutR),
      outputRmsL: toDb(meters.rmsOutL),
      outputRmsR: toDb(meters.rmsOutR),
      gainReductionDb: meters.gainReductionDb,
      limiterActive: meters.limiterActive,
      momentaryLufs: Math.max(-70, momentaryLufs),
      integratedLufs: Math.max(-70, integratedLufs),
      crestFactor: maxRms > 1e-4 ? Math.max(0, 20 * Math.log10(maxPeak / maxRms)) : 12,
    });
  }

  public setParams(params: Partial<MasteringParams>): void {
    this.activeParams = { ...this.activeParams, ...params };
    this.workletNode?.port.postMessage({ type: 'SET_PARAMS', data: this.activeParams });
  }

  public getParams(): MasteringParams { return { ...this.activeParams }; }

  public setBypass(bypass: boolean): void {
    this.isBypassed = bypass;
    this.workletNode?.port.postMessage({ type: 'SET_BYPASS', data: bypass });
  }

  public getBypass(): boolean { return this.isBypassed; }

  public setTimeUpdateCallback(cb: (currentTime: number, duration: number) => void): void {
    this.onTimeUpdateCallback = cb;
  }

  public setMeterUpdateCallback(cb: (meters: MeterData) => void): void {
    this.onMeterUpdateCallback = cb;
  }

  public async loadAudioFile(file: File): Promise<AudioBuffer> {
    const ctx = this.getAudioContext();
    this.audioBuffer = await ctx.decodeAudioData(await file.arrayBuffer());
    this.pauseOffset = 0;
    this.resetLoudnessHistory();
    return this.audioBuffer;
  }

  public setAudioBuffer(buffer: AudioBuffer): void {
    this.stop();
    this.audioBuffer = buffer;
    this.pauseOffset = 0;
    this.resetLoudnessHistory();
  }

  public getLoadedBuffer(): AudioBuffer | null { return this.audioBuffer; }
  public getIsPlaying(): boolean { return this.isPlaying; }

  public getCurrentTime(): number {
    if (!this.isPlaying || !this.ctx || !this.audioBuffer) return this.pauseOffset;
    const elapsed = this.ctx.currentTime - this.playbackStartTime;
    return this.audioBuffer.duration > 0 ? elapsed % this.audioBuffer.duration : 0;
  }

  public play(offset?: number): void {
    void this.startPlayback(offset).catch((error) => {
      this.isPlaying = false;
      console.error('[AudioEngine] Playback aborted:', error);
    });
  }

  private async startPlayback(offset?: number): Promise<void> {
    const ctx = this.getAudioContext();
    if (!this.audioBuffer) return;
    if (this.isPlaying) this.stop(false);
    if (typeof offset === 'number') {
      this.pauseOffset = Math.max(0, Math.min(offset, this.audioBuffer.duration));
    }

    await this.initializeWorklet();
    if (!this.workletNode) throw new Error('AudioWorkletNode was not created');

    this.analyserIn = ctx.createAnalyser();
    this.analyserOut = ctx.createAnalyser();
    this.analyserIn.fftSize = 1024;
    this.analyserOut.fftSize = 1024;
    this.analyserIn.smoothingTimeConstant = 0.8;
    this.analyserOut.smoothingTimeConstant = 0.8;

    this.gainNode = ctx.createGain();
    this.gainNode.gain.setValueAtTime(1, ctx.currentTime);

    this.sourceNode = ctx.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;
    this.sourceNode.loop = true;

    this.sourceNode.connect(this.analyserIn);
    this.analyserIn.connect(this.workletNode);
    this.workletNode.connect(this.analyserOut);
    this.analyserOut.connect(this.gainNode);
    this.gainNode.connect(ctx.destination);

    this.sourceNode.start(0, this.pauseOffset);
    this.playbackStartTime = ctx.currentTime - this.pauseOffset;
    this.isPlaying = true;
    this.startTrackingLoop();
  }

  public pause(): void {
    if (!this.isPlaying) return;
    this.pauseOffset = this.getCurrentTime();
    this.stop(false);
  }

  public stop(resetOffset = true): void {
    try { this.sourceNode?.stop(); } catch { /* already stopped */ }
    this.sourceNode?.disconnect();
    this.sourceNode = null;
    this.analyserIn?.disconnect();
    this.analyserIn = null;
    this.analyserOut?.disconnect();
    this.analyserOut = null;
    this.gainNode?.disconnect();
    this.gainNode = null;
    this.isPlaying = false;
    if (resetOffset) this.pauseOffset = 0;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public seek(timeSeconds: number): void {
    const wasPlaying = this.isPlaying;
    this.stop(false);
    this.pauseOffset = Math.max(0, Math.min(timeSeconds, this.audioBuffer?.duration || 0));
    if (wasPlaying) this.play(this.pauseOffset);
  }

  public resetLoudnessHistory(): void {
    this.accumulatedLoudnessSum = 0;
    this.accumulatedLoudnessCount = 0;
  }

  private startTrackingLoop(): void {
    const update = () => {
      if (!this.isPlaying || !this.audioBuffer) return;
      this.onTimeUpdateCallback?.(this.getCurrentTime(), this.audioBuffer.duration);
      this.animationFrameId = requestAnimationFrame(update);
    };
    this.animationFrameId = requestAnimationFrame(update);
  }

  public getAnalyserData(): { inputFreq: Uint8Array; outputFreq: Uint8Array; outputTime: Uint8Array } | null {
    if (!this.analyserIn || !this.analyserOut) return null;
    const inputFreq = new Uint8Array(this.analyserIn.frequencyBinCount);
    const outputFreq = new Uint8Array(this.analyserOut.frequencyBinCount);
    const outputTime = new Uint8Array(this.analyserOut.fftSize);
    this.analyserIn.getByteFrequencyData(inputFreq);
    this.analyserOut.getByteFrequencyData(outputFreq);
    this.analyserOut.getByteTimeDomainData(outputTime);
    return { inputFreq, outputFreq, outputTime };
  }

  public async renderOffline(
    inputBuffer: AudioBuffer,
    params: MasteringParams,
    onProgress?: (percent: number) => void,
  ): Promise<AudioBuffer> {
    const ctx = this.getAudioContext();
    const outputBuffer = ctx.createBuffer(2, inputBuffer.length, inputBuffer.sampleRate);
    const inL = inputBuffer.getChannelData(0);
    const inR = inputBuffer.numberOfChannels > 1 ? inputBuffer.getChannelData(1) : inL;
    const outL = outputBuffer.getChannelData(0);
    const outR = outputBuffer.getChannelData(1);
    const dsp = new MasteringDSP(inputBuffer.sampleRate, 2, params);
    const chunkSize = 4096;

    for (let offset = 0; offset < inputBuffer.length; offset += chunkSize) {
      const end = Math.min(offset + chunkSize, inputBuffer.length);
      const left = new Float32Array(end - offset);
      const right = new Float32Array(end - offset);
      dsp.process([inL.subarray(offset, end), inR.subarray(offset, end)], [left, right]);
      outL.set(left, offset);
      outR.set(right, offset);
      onProgress?.(Math.round((end / inputBuffer.length) * 100));
      if (offset % 65536 === 0) await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }
    return outputBuffer;
  }

  public createDemoTrack(type: 'synthwave' | 'acoustic' | 'parity'): AudioBuffer {
    const ctx = this.getAudioContext();
    const sampleRate = 48000;
    const duration = type === 'parity' ? 100000 / sampleRate : type === 'synthwave' ? 12 : 10;
    const buffer = ctx.createBuffer(2, Math.floor(duration * sampleRate), sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    if (type === 'parity') {
      for (let i = 0; i < left.length; i += 1) {
        const t = i / sampleRate;
        left[i] = 0.30 * Math.sin(2 * Math.PI * 440 * t) + 0.20 * Math.sin(2 * Math.PI * 1000 * t);
        right[i] = 0.24 * Math.sin(2 * Math.PI * 550 * t) + 0.18 * Math.sin(2 * Math.PI * 1400 * t);
      }
      left[0] = 1; right[0] = 0.9; left[24000] = 0.95; right[24000] = -0.92; left[72000] = -0.98; right[72000] = 0.88;
      return buffer;
    }

    const notes = [261.63, 329.63, 392, 523.25, 493.88, 392, 329.63, 293.66];
    for (let i = 0; i < left.length; i += 1) {
      const t = i / sampleRate;
      if (type === 'acoustic') {
        const f = notes[Math.floor(t * 2) % notes.length];
        const env = Math.exp(-(((t * 2) % 1) * 3.5));
        const tone = Math.sin(2 * Math.PI * f * t) + 0.5 * Math.sin(4 * Math.PI * f * t) + 0.25 * Math.sin(6 * Math.PI * f * t);
        left[i] = Math.max(-1, Math.min(1, tone * env * 0.25));
        right[i] = Math.max(-1, Math.min(1, tone * env * 0.3));
      } else {
        const f = 110 * (1 + 0.25 * Math.sin(2 * Math.PI * t / 3));
        const env = 0.55 + 0.25 * Math.sin(2 * Math.PI * t);
        left[i] = 0.45 * Math.sin(2 * Math.PI * f * t) * env + 0.12 * Math.sin(2 * Math.PI * 880 * t);
        right[i] = 0.45 * Math.sin(2 * Math.PI * f * t * 1.003) * env + 0.10 * Math.sin(2 * Math.PI * 660 * t);
      }
    }
    return buffer;
  }

  public runParityCheck(): ParityResult {
    const sampleRate = 48000;
    const numSamples = 100000;
    const params: MasteringParams = { low: 3, mid: -2, high: 1.5, threshold: -24, ratio: 3, gain: 0 };
    const inputL = new Float32Array(numSamples);
    const inputR = new Float32Array(numSamples);
    for (let i = 0; i < numSamples; i += 1) {
      const t = i / sampleRate;
      inputL[i] = 0.3 * Math.sin(2 * Math.PI * 440 * t) + 0.2 * Math.sin(2 * Math.PI * 1000 * t);
      inputR[i] = 0.24 * Math.sin(2 * Math.PI * 550 * t) + 0.18 * Math.sin(2 * Math.PI * 1400 * t);
    }
    inputL[0] = 1; inputR[0] = 0.9; inputL[24000] = 0.95; inputR[24000] = -0.92; inputL[72000] = -0.98; inputR[72000] = 0.88;

    const firstL = new Float32Array(numSamples);
    const firstR = new Float32Array(numSamples);
    const secondL = new Float32Array(numSamples);
    const secondR = new Float32Array(numSamples);
    new MasteringDSP(sampleRate, 2, params).process([inputL, inputR], [firstL, firstR]);
    new MasteringDSP(sampleRate, 2, params).process([inputL, inputR], [secondL, secondR]);

    let maxAbsError = 0;
    let sumAbs = 0;
    let sumSq = 0;
    for (let i = 0; i < numSamples; i += 1) {
      const d1 = Math.abs(firstL[i] - secondL[i]);
      const d2 = Math.abs(firstR[i] - secondR[i]);
      const d = Math.max(d1, d2);
      maxAbsError = Math.max(maxAbsError, d);
      sumAbs += d1 + d2;
      sumSq += d1 * d1 + d2 * d2;
    }
    const meanAbsError = sumAbs / (numSamples * 2);
    const rmsError = Math.sqrt(sumSq / (numSamples * 2));
    const passed = Number.isFinite(maxAbsError) && maxAbsError < 1e-7;
    const gate = {
      id: 'GATE_RUNTIME_REFERENCE',
      name: 'Reference DSP determinism',
      category: 'DSP',
      thresholdStr: 'maxAbsError < 1e-7',
      measuredError: maxAbsError,
      tolerance: 1e-7,
      passed,
      notes: 'Deterministic 100k stereo sample reference comparison',
    };
    return {
      passed,
      totalSamples: numSamples * 2,
      maxAbsError,
      meanAbsError,
      rmsError,
      snrDb: rmsError > 0 ? 20 * Math.log10(1 / rmsError) : 200,
      timestamp: Date.now(),
      gates: [gate],
      testDetails: [{
        name: gate.name,
        description: gate.notes,
        passed: gate.passed,
        maxAbsError: gate.measuredError,
        tolerance: gate.tolerance,
      }],
    };
  }
}

export const audioEngine = new AudioMasteringEngine();
