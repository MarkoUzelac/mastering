import { MasteringEngine } from './MasteringEngine.js';

let engine = null;

/**
 * Mastering Dedicated Worker
 * Supports unified execution across C++ WebAssembly and JS Reference DSP.
 */
self.onmessage = async (e) => {
  const { id, type, payload } = e.data || {};

  try {
    switch (type) {
      case 'INIT': {
        const { sampleRate, channelCount, params, engine: enginePref, wasmModule } = payload || {};
        if (engine) {
          engine.dispose();
        }
        engine = new MasteringEngine({
          sampleRate: sampleRate || 48000,
          channelCount: channelCount || 2,
          params: params || {},
          engine: enginePref || 'auto',
          wasmModule: wasmModule || null,
        });

        const status = engine.getEngineStatus();
        self.postMessage({ id, type: 'INIT_DONE', success: true, status });
        break;
      }

      case 'SET_ENGINE': {
        if (!engine) {
          engine = new MasteringEngine();
        }
        const result = engine.setEngineType(payload.engine);
        self.postMessage({ id, type: 'SET_ENGINE_DONE', ...result });
        break;
      }

      case 'GET_STATUS': {
        const status = engine ? engine.getEngineStatus() : { status: 'uninitialized' };
        self.postMessage({ id, type: 'STATUS', status });
        break;
      }

      case 'UPDATE_PARAMS': {
        if (engine && payload.params) {
          engine.updateParams(payload.params);
        }
        self.postMessage({ id, type: 'UPDATE_DONE', success: true });
        break;
      }

      case 'RESET': {
        if (engine) {
          engine.reset();
        }
        self.postMessage({ id, type: 'RESET_DONE', success: true });
        break;
      }

      case 'PROCESS': {
        if (!engine) {
          engine = new MasteringEngine({
            sampleRate: payload.sampleRate || 48000,
            params: payload.params,
            engine: payload.engine || 'auto',
          });
        }
        if (payload.params) {
          engine.updateParams(payload.params);
        }

        const { left, right } = payload;
        const len = left.length;
        const outLeft = new Float32Array(len);
        const outRight = new Float32Array(len);

        const startTime = performance.now();
        engine.process([left, right], [outLeft, outRight]);
        const elapsedMs = performance.now() - startTime;

        const engineStatus = engine.getEngineStatus();

        self.postMessage(
          { 
            id, 
            type: 'PROCESS_RESULT', 
            outLeft, 
            outRight,
            elapsedMs,
            engineUsed: engineStatus.activeEngine,
          },
          [outLeft.buffer, outRight.buffer]
        );
        break;
      }

      case 'PROCESS_BUFFER': {
        if (!engine) {
          engine = new MasteringEngine({
            sampleRate: payload.sampleRate || 48000,
            params: payload.params,
            engine: payload.engine || 'auto',
          });
        }
        if (payload.params) {
          engine.updateParams(payload.params);
        }

        const { inputs } = payload;
        const startTime = performance.now();

        const outputs = await engine.processBuffer(
          inputs,
          (percent) => {
            self.postMessage({ id, type: 'PROGRESS', percent });
          },
          payload.chunkSize || 8192
        );

        const elapsedMs = performance.now() - startTime;
        const engineStatus = engine.getEngineStatus();

        self.postMessage(
          {
            id,
            type: 'PROCESS_DONE',
            outputs,
            elapsedMs,
            engineUsed: engineStatus.activeEngine,
          },
          [outputs[0].buffer, outputs[1].buffer]
        );
        break;
      }

      case 'DISPOSE': {
        if (engine) {
          engine.dispose();
          engine = null;
        }
        self.postMessage({ id, type: 'DISPOSE_DONE', success: true });
        break;
      }

      default:
        self.postMessage({ id, type: 'ERROR', error: `Unknown worker action: ${type}` });
        break;
    }
  } catch (err) {
    self.postMessage({
      id,
      type: 'ERROR',
      error: err instanceof Error ? err.message : String(err),
    });
  }
};
