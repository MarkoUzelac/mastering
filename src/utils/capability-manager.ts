export interface HardwareCapabilities {
  hasWebGPU: boolean;
  hasWasm: boolean;
  hasAudioWorklet: boolean;
  hasSharedArrayBuffer: boolean;
}

export type ProcessingMode = 'webgpu' | 'wasm' | 'js';

export interface FallbackConfig {
  primary: ProcessingMode;
  fallback: ProcessingMode;
  ultimateFallback: ProcessingMode;
}

export class CapabilityManager {
  private static capabilities: HardwareCapabilities | null = null;

  /**
   * Asynchronously detects the hardware capabilities of the browser,
   * including WebGPU, WASM, and AudioWorklet support.
   */
  public static async detectCapabilities(): Promise<HardwareCapabilities> {
    if (this.capabilities) return this.capabilities;

    let hasWebGPU = false;
    if ('gpu' in navigator) {
      try {
        // We do not strictly await requestAdapter in a way that blocks indefinitely if unavailable,
        // but try/catch protects against environments where it throws.
        const adapter = await (navigator as any).gpu.requestAdapter();
        hasWebGPU = !!adapter;
      } catch (e) {
        hasWebGPU = false;
      }
    }

    const hasWasm = typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function';
    const hasAudioWorklet = !!(window.AudioContext && AudioContext.prototype.hasOwnProperty('audioWorklet'));
    const hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';

    this.capabilities = {
      hasWebGPU,
      hasWasm,
      hasAudioWorklet,
      hasSharedArrayBuffer,
    };

    return this.capabilities;
  }

  /**
   * Returns the optimal processing mode based on detected capabilities.
   * Prefers WebGPU -> WASM -> JS.
   */
  public static getOptimalProcessingMode(): ProcessingMode {
    if (!this.capabilities) {
      return 'js'; // Default safe mode
    }

    if (this.capabilities.hasWebGPU) {
      return 'webgpu';
    } else if (this.capabilities.hasWasm) {
      return 'wasm';
    } else {
      return 'js';
    }
  }

  /**
   * Returns the standard fallback configuration pipeline.
   */
  public static getFallbackConfiguration(): FallbackConfig {
    return {
      primary: 'webgpu',
      fallback: 'wasm',
      ultimateFallback: 'js'
    };
  }

  /**
   * Returns a safe fallback processing mode if the current mode fails.
   */
  public static getSafeFallbackMode(failedMode: ProcessingMode): ProcessingMode {
    if (failedMode === 'webgpu') {
      return this.capabilities?.hasWasm ? 'wasm' : 'js';
    }
    return 'js';
  }
}
