import { MasteringDSP, DEFAULT_PARAMS } from './dsp-core.js';
import { MasteringEngine } from '../workers/MasteringEngine.js';

/**
 * Engine Adapter
 * 
 * Abstraction layer between UI components and the mastering DSP engine.
 * Translates high-level mastering parameters into engine execution, managing
 * both Web Worker asynchronous processing and direct in-memory execution.
 * Explicitly supports swapping between C++ WebAssembly and JS Reference DSP.
 */
export class EngineAdapter {
  constructor(sampleRate = 48000, channelCount = 2, engineType = 'auto') {
    this.sampleRate = sampleRate;
    this.channelCount = channelCount;
    this.params = { ...DEFAULT_PARAMS };
    this.engineType = engineType;

    // Direct local engine instance
    this.engine = new MasteringEngine({
      sampleRate: this.sampleRate,
      channelCount: this.channelCount,
      params: this.params,
      engine: this.engineType,
    });

    this.worker = null;
    this.isWorkerBusy = false;
    this.initWorker();
  }

  initWorker() {
    try {
      if (typeof window !== 'undefined' && window.Worker) {
        this.worker = new Worker(
          new URL('../workers/mastering.worker.js', import.meta.url),
          { type: 'module' }
        );
        this.worker.postMessage({
          type: 'INIT',
          payload: {
            sampleRate: this.sampleRate,
            channelCount: this.channelCount,
            params: this.params,
            engine: this.engineType,
          },
        });
      }
    } catch {
      // Graceful fallback to direct main-thread processing
      this.worker = null;
    }
  }

  /**
   * Explicitly swap DSP engine between WebAssembly C++ and Reference JS
   * @param {'wasm' | 'js'} type 
   */
  setEngineType(type) {
    this.engineType = type;
    const localResult = this.engine.setEngineType(type);
    if (this.worker) {
      this.worker.postMessage({
        type: 'SET_ENGINE',
        payload: { engine: type },
      });
    }
    return localResult;
  }

  getEngineStatus() {
    return this.engine.getEngineStatus();
  }

  setSampleRate(sampleRate) {
    if (this.sampleRate !== sampleRate) {
      this.sampleRate = sampleRate;
      this.engine.setSampleRate(sampleRate);
      if (this.worker) {
        this.worker.postMessage({
          type: 'INIT',
          payload: {
            sampleRate: this.sampleRate,
            channelCount: this.channelCount,
            params: this.params,
            engine: this.engineType,
          },
        });
      }
    }
  }

  setParameters(params) {
    this.params = { ...this.params, ...params };
    this.engine.updateParams(this.params);
    if (this.worker) {
      this.worker.postMessage({
        type: 'UPDATE_PARAMS',
        payload: { params: this.params },
      });
    }
  }

  getParameters() {
    return { ...this.params };
  }

  /**
   * Synchronous audio frame processing (for AudioWorklet / ScriptProcessor)
   */
  processFrames(inputs, outputs) {
    if (!this.engine) return;
    this.engine.process(inputs, outputs);
  }

  /**
   * Asynchronous buffer processing (delegates to worker or main thread)
   */
  async processBuffer(inputs, onProgress) {
    if (this.worker && !this.isWorkerBusy) {
      this.isWorkerBusy = true;
      return new Promise((resolve, reject) => {
        const msgId = Math.random().toString(36).slice(2);

        const handleMsg = (e) => {
          const { id, type, outputs, percent, error } = e.data || {};
          if (id !== msgId) return;

          if (type === 'PROGRESS' && onProgress) {
            onProgress(percent);
          } else if (type === 'PROCESS_DONE' || type === 'PROCESS_RESULT') {
            this.worker.removeEventListener('message', handleMsg);
            this.isWorkerBusy = false;
            resolve(outputs || [e.data.outLeft, e.data.outRight]);
          } else if (type === 'ERROR') {
            this.worker.removeEventListener('message', handleMsg);
            this.isWorkerBusy = false;
            reject(new Error(error || 'Worker processing error'));
          }
        };

        this.worker.addEventListener('message', handleMsg);
        this.worker.postMessage({
          id: msgId,
          type: 'PROCESS_BUFFER',
          payload: {
            inputs: [inputs[0], inputs[1] || inputs[0]],
            params: this.params,
            sampleRate: this.sampleRate,
            engine: this.engineType,
          },
        });
      });
    }

    // Direct fallback processing via unified engine
    return this.engine.processBuffer(inputs, onProgress);
  }

  terminate() {
    if (this.worker) {
      this.worker.postMessage({ type: 'DISPOSE' });
      this.worker.terminate();
      this.worker = null;
    }
    if (this.engine) {
      this.engine.dispose();
      this.engine = null;
    }
  }
}
