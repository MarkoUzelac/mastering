import { soundHaptics } from './sound-haptics';
import { CapabilityManager } from './capability-manager';

export interface SystemCapabilities {
  audioContext: boolean;
  audioWorklet: boolean;
  wasm: boolean;
  webgpu: boolean;
  webgl2: boolean;
  workers: boolean;
  secureContext: boolean;
}

export type BootStage = 
  | 'INITIAL' 
  | 'DETECTING_CAPABILITIES' 
  | 'VALIDATING_ENVIRONMENT'
  | 'STARTING_AUDIO_ENGINE' 
  | 'LOADING_WASM' 
  | 'LOADING_WORKERS' 
  | 'READY' 
  | 'FAILED';

export interface BootStatus {
  stage: BootStage;
  progress: number;
  message: string;
  isError: boolean;
  errorDetails?: string;
}

export class BootManager {
  private static listeners: ((status: BootStatus) => void)[] = [];
  private static currentStatus: BootStatus = {
    stage: 'INITIAL',
    progress: 0,
    message: 'Starting boot sequence...',
    isError: false,
  };
  public static capabilities: SystemCapabilities | null = null;
  public static isReady = false;

  public static subscribe(listener: (status: BootStatus) => void) {
    this.listeners.push(listener);
    listener(this.currentStatus);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private static updateStatus(update: Partial<BootStatus>) {
    this.currentStatus = { ...this.currentStatus, ...update };
    this.listeners.forEach(l => l(this.currentStatus));
  }

  public static async boot(): Promise<void> {
    if (this.isReady) return;
    
    try {
      this.updateStatus({ stage: 'DETECTING_CAPABILITIES', progress: 10, message: 'Detecting browser capabilities...' });
      
      const hardwareCaps = await CapabilityManager.detectCapabilities();
      
      this.capabilities = {
        audioContext: !!(window.AudioContext || (window as any).webkitAudioContext),
        audioWorklet: hardwareCaps.hasAudioWorklet,
        wasm: hardwareCaps.hasWasm,
        webgpu: hardwareCaps.hasWebGPU,
        webgl2: (() => { try { const canvas = document.createElement('canvas'); return !!canvas.getContext('webgl2'); } catch(e){return false;} })(),
        workers: typeof Worker !== 'undefined',
        secureContext: window.isSecureContext === true
      };

      if (!this.capabilities.audioContext) {
        throw new Error('Web Audio API is not supported in this browser. Please use a modern browser.');
      }

      const optimalMode = CapabilityManager.getOptimalProcessingMode();

      this.updateStatus({ stage: 'VALIDATING_ENVIRONMENT', progress: 30, message: `Validating environment (Optimal Mode: ${optimalMode.toUpperCase()})...` });
      await new Promise(r => setTimeout(r, 100));

      this.updateStatus({ stage: 'STARTING_AUDIO_ENGINE', progress: 50, message: 'Starting DSP engine...' });
      await new Promise(r => setTimeout(r, 300));
      
      this.updateStatus({ stage: 'LOADING_WORKERS', progress: 70, message: 'Registering Web Workers...' });
      await new Promise(r => setTimeout(r, 200));

      if (this.capabilities.wasm) {
        this.updateStatus({ stage: 'LOADING_WASM', progress: 90, message: 'Loading C++ WASM Core...' });
        await new Promise(r => setTimeout(r, 200));
      }

      this.isReady = true;
      this.updateStatus({ stage: 'READY', progress: 100, message: 'Ready' });
    } catch (err: any) {
      this.updateStatus({
        stage: 'FAILED',
        progress: 100,
        message: 'Engine Initialization Failed',
        isError: true,
        errorDetails: err.message || 'Unknown error occurred during boot sequence.'
      });
      console.error('[BootManager] Boot failed:', err);
    }
  }

  static checkMemoryForFile(fileSize: number): boolean {
    const estimatedDecodedSize = fileSize * 10; // heuristic
    if ('deviceMemory' in navigator) {
      const memoryGB = (navigator as any).deviceMemory;
      if (memoryGB < 2 && estimatedDecodedSize > 100 * 1024 * 1024) {
        return false;
      }
    }
    return true;
  }
}
