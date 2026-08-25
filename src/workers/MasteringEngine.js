import { MasteringDSP, DEFAULT_PARAMS } from '../audio/dsp-core.js';
import { WasmDspBridge } from './WasmDspBridge.js';

/**
 * MasteringEngine (Unified Engine Architecture)
 * 
 * Provides a unified, polymorphic interface to swap seamlessly between:
 * 1. Native C++ WebAssembly Engine (WasmDspBridge) complying with production WASM ABI
 * 2. High-precision Reference JavaScript Engine (MasteringDSP)
 * 
 * Features:
 * - Dynamic engine selection ('wasm' | 'js' | 'auto')
 * - Clamped parameter normalization
 * - Linear memory management with zero-leak lifecycle
 * - Chunked offline buffer processing with progress callbacks
 * - Stereo audio data handling and zero-copy transfer protocol
 */
export class MasteringEngine {
  constructor(options = {}) {
    this.sampleRate = options.sampleRate || 48000;
    this.channelCount = options.channelCount || 2;
    this.params = { ...DEFAULT_PARAMS, ...(options.params || {}) };
    
    this.wasmModule = options.wasmModule || null;
    this.wasmBridge = null;
    this.jsDsp = new MasteringDSP(this.sampleRate, this.channelCount, this.params);

    // Active engine mode: 'wasm' | 'js'
    this.preferredEngine = options.engine || 'auto';
    this.activeEngine = 'js';

    if (this.wasmModule) {
      this.initWasmBridge(this.wasmModule);
    } else if (this.preferredEngine === 'wasm') {
      this.tryAutoLoadWasm();
    }
  }

  initWasmBridge(wasmModule) {
    try {
      this.wasmModule = wasmModule;
      this.wasmBridge = new WasmDspBridge(this.wasmModule, this.sampleRate);
      this.wasmBridge.setParameters(
        this.params.low,
        this.params.mid,
        this.params.high,
        this.params.threshold,
        this.params.ratio,
        this.params.gain
      );
      if (this.preferredEngine !== 'js') {
        this.activeEngine = 'wasm';
      }
      return true;
    } catch (err) {
      console.warn('[MasteringEngine] WASM Bridge init failed, falling back to JS DSP:', err);
      this.activeEngine = 'js';
      return false;
    }
  }

  async tryAutoLoadWasm() {
    if (this.wasmBridge) {
      this.activeEngine = 'wasm';
      return true;
    }

    try {
      if (typeof WebAssembly !== 'undefined') {
        // Look for compiled WASM in worker context if available
        if (typeof createMasteringModule === 'function') {
          const mod = await createMasteringModule();
          return this.initWasmBridge(mod);
        }
      }
    } catch {
      // Fallback silently to JS DSP
    }
    this.activeEngine = 'js';
    return false;
  }

  /**
   * Explicitly set active engine implementation
   * @param {'wasm' | 'js'} engineType 
   */
  setEngineType(engineType) {
    if (engineType === 'wasm') {
      if (!this.wasmBridge && this.wasmModule) {
        this.initWasmBridge(this.wasmModule);
      }
      if (this.wasmBridge) {
        this.activeEngine = 'wasm';
        this.preferredEngine = 'wasm';
        return { success: true, activeEngine: 'wasm' };
      } else {
        return { 
          success: false, 
          activeEngine: this.activeEngine, 
          error: 'WASM module not loaded or initialized' 
        };
      }
    } else {
      this.activeEngine = 'js';
      this.preferredEngine = 'js';
      return { success: true, activeEngine: 'js' };
    }
  }

  getEngineStatus() {
    return {
      activeEngine: this.activeEngine,
      preferredEngine: this.preferredEngine,
      isWasmAvailable: !!this.wasmBridge,
      sampleRate: this.sampleRate,
      channelCount: this.channelCount,
      wasmMemoryCapacity: this.wasmBridge?.allocatedCapacitySamples || 0,
      params: { ...this.params },
    };
  }

  setSampleRate(sampleRate) {
    if (this.sampleRate !== sampleRate) {
      this.sampleRate = sampleRate;
      this.jsDsp = new MasteringDSP(this.sampleRate, this.channelCount, this.params);
      if (this.wasmBridge) {
        this.wasmBridge.setSampleRate(this.sampleRate);
        this.wasmBridge.setParameters(
          this.params.low,
          this.params.mid,
          this.params.high,
          this.params.threshold,
          this.params.ratio,
          this.params.gain
        );
      }
    }
  }

  validateParams(params) {
    const validated = { ...this.params };
    if (typeof params.low === 'number') validated.low = Math.max(-12, Math.min(12, params.low));
    if (typeof params.mid === 'number') validated.mid = Math.max(-12, Math.min(12, params.mid));
    if (typeof params.high === 'number') validated.high = Math.max(-12, Math.min(12, params.high));
    if (typeof params.threshold === 'number') validated.threshold = Math.max(-60, Math.min(0, params.threshold));
    if (typeof params.ratio === 'number') validated.ratio = Math.max(1, Math.min(20, params.ratio));
    if (typeof params.gain === 'number') validated.gain = Math.max(0, Math.min(24, params.gain));
    return validated;
  }

  updateParams(newParams) {
    this.params = this.validateParams(newParams);
    
    // Update JS DSP
    if (this.jsDsp) {
      this.jsDsp.update(this.params);
    }

    // Update WASM C++ Engine
    if (this.wasmBridge) {
      this.wasmBridge.setParameters(
        this.params.low,
        this.params.mid,
        this.params.high,
        this.params.threshold,
        this.params.ratio,
        this.params.gain
      );
    }
  }

  reset() {
    if (this.jsDsp) {
      this.jsDsp = new MasteringDSP(this.sampleRate, this.channelCount, this.params);
    }
    if (this.wasmBridge) {
      this.wasmBridge.reset();
    }
  }

  /**
   * Synchronous stereo frame processing
   */
  process(inputs, outputs) {
    if (!inputs || !inputs[0] || !outputs || !outputs[0]) return;

    const leftIn = inputs[0];
    const rightIn = inputs[1] || inputs[0];
    const leftOut = outputs[0];
    const rightOut = outputs[1] || outputs[0];
    const numSamples = leftIn.length;

    if (this.activeEngine === 'wasm' && this.wasmBridge) {
      try {
        this.wasmBridge.process(leftIn, rightIn, leftOut, rightOut, numSamples);
        return;
      } catch (err) {
        console.error('[MasteringEngine] WASM processing error, falling back to JS DSP:', err);
        this.activeEngine = 'js';
      }
    }

    // Fallback or explicit JS DSP execution
    this.jsDsp.process([leftIn, rightIn], [leftOut, rightOut]);
  }

  /**
   * Process a large audio buffer with chunking and progress reporting
   */
  async processBuffer(inputs, onProgress, chunkSize = 8192) {
    const frameCount = inputs[0]?.length || 0;
    const outputs = [
      new Float32Array(frameCount),
      new Float32Array(frameCount),
    ];

    const inL = inputs[0];
    const inR = inputs[1] || inL;
    let offset = 0;

    while (offset < frameCount) {
      const end = Math.min(offset + chunkSize, frameCount);
      const chunkLen = end - offset;

      const chunkInL = inL.subarray(offset, end);
      const chunkInR = inR.subarray(offset, end);
      const chunkOutL = new Float32Array(chunkLen);
      const chunkOutR = new Float32Array(chunkLen);

      this.process([chunkInL, chunkInR], [chunkOutL, chunkOutR]);

      outputs[0].set(chunkOutL, offset);
      outputs[1].set(chunkOutR, offset);

      offset = end;
      if (onProgress && frameCount > 0) {
        onProgress(Math.min(100, Math.round((offset / frameCount) * 100)));
      }

      // Yield event loop every 64k frames
      if (offset % 65536 === 0) {
        await new Promise((r) => setTimeout(r, 0));
      }
    }

    return outputs;
  }

  dispose() {
    if (this.wasmBridge) {
      this.wasmBridge.dispose();
      this.wasmBridge = null;
    }
    this.wasmModule = null;
    this.jsDsp = null;
  }
}
