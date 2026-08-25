import { MasteringEngine } from '../workers/MasteringEngine.js';

/**
 * Engine Worker Script
 * Unified offline and realtime chunk audio mastering processor.
 */
let engine = null;

self.onmessage = async (event) => {
  const { id, type, payload } = event.data || {};

  try {
    switch (type) {
      case 'INIT': {
        const { sampleRate, channelCount, params, engine: enginePref, wasmModule } = payload || {};
        if (engine) engine.dispose();
        engine = new MasteringEngine({
          sampleRate: sampleRate || 48000,
          channelCount: channelCount || 2,
          params: params || {},
          engine: enginePref || 'auto',
          wasmModule: wasmModule || null,
        });
        self.postMessage({ id, type: 'INIT_DONE', success: true, status: engine.getEngineStatus() });
        break;
      }

      case 'SET_ENGINE': {
        if (!engine) engine = new MasteringEngine();
        const result = engine.setEngineType(payload.engine);
        self.postMessage({ id, type: 'SET_ENGINE_DONE', ...result });
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
        if (engine) engine.reset();
        self.postMessage({ id, type: 'RESET_DONE', success: true });
        break;
      }

      case 'PROCESS_BUFFER': {
        const { inputs, params, sampleRate, engine: enginePref, chunkSize } = payload;
        if (!engine) {
          engine = new MasteringEngine({
            sampleRate: sampleRate || 48000,
            channelCount: inputs.length || 2,
            params,
            engine: enginePref || 'auto',
          });
        }
        if (params) engine.updateParams(params);

        const startTime = performance.now();
        const outputs = await engine.processBuffer(
          inputs,
          (percent) => {
            self.postMessage({ id, type: 'PROGRESS', percent });
          },
          chunkSize || 8192
        );
        const elapsedMs = performance.now() - startTime;
        const status = engine.getEngineStatus();

        self.postMessage(
          {
            id,
            type: 'PROCESS_DONE',
            outputs,
            elapsedMs,
            engineUsed: status.activeEngine,
          },
          [outputs[0].buffer, outputs[1].buffer]
        );
        break;
      }

      default:
        self.postMessage({ id, type: 'ERROR', error: `Unknown event: ${type}` });
    }
  } catch (err) {
    self.postMessage({
      id,
      type: 'ERROR',
      error: err instanceof Error ? err.message : String(err),
    });
  }
};
