import type { StructuredAudioSnapshot } from '../ai/contracts';
import { analyzeEbuLufs, type EbuLufsResult } from './EbuLufsMeter';
import LufsWorker from '../workers/lufs.worker?worker';

export function analyzeAudioBuffer(buffer: AudioBuffer): EbuLufsResult {
  const left = buffer.getChannelData(0);
  const right = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : new Float32Array(0);
  return analyzeEbuLufs(left, right, buffer.sampleRate);
}

let workerInstance: Worker | null = null;
let nextRequestId = 1;

interface PendingRequest {
  resolve: (result: EbuLufsResult) => void;
  reject: (error: Error) => void;
}

const pendingRequests = new Map<number, PendingRequest>();

function getLufsWorker(): Worker {
  if (!workerInstance) {
    workerInstance = new LufsWorker();
    workerInstance.onmessage = (event: MessageEvent) => {
      const { id, type, payload, error } = event.data ?? {};
      if (typeof id !== 'number') return;

      const request = pendingRequests.get(id);
      if (!request) return;

      pendingRequests.delete(id);
      if (type === 'SUCCESS') {
        request.resolve(payload as EbuLufsResult);
      } else {
        request.reject(new Error(typeof error === 'string' ? error : 'LUFS worker analysis failed.'));
      }
    };

    workerInstance.onerror = (event) => {
      const error = new Error(event.message || 'LUFS worker execution failed.');
      for (const [id, request] of pendingRequests) {
        pendingRequests.delete(id);
        request.reject(error);
      }
      workerInstance?.terminate();
      workerInstance = null;
    };
  }

  return workerInstance;
}

export function analyzeAudioBufferAsync(buffer: AudioBuffer): Promise<EbuLufsResult> {
  return new Promise((resolve, reject) => {
    let leftCopy: Float32Array | null = null;
    let rightCopy: Float32Array | null = null;
    const id = nextRequestId++;

    try {
      const left = buffer.getChannelData(0);
      leftCopy = left.slice();
      rightCopy = buffer.numberOfChannels > 1
        ? buffer.getChannelData(1).slice()
        : new Float32Array(0);

      pendingRequests.set(id, { resolve, reject });

      const worker = getLufsWorker();
      worker.postMessage(
        {
          id,
          left: leftCopy,
          right: rightCopy,
          sampleRate: buffer.sampleRate,
        },
        [leftCopy.buffer, rightCopy.buffer],
      );

      leftCopy = null;
      rightCopy = null;
    } catch (error: unknown) {
      pendingRequests.delete(id);
      leftCopy = null;
      rightCopy = null;
      reject(error instanceof Error ? error : new Error('Failed to initialize LUFS analysis.'));
    }
  });
}

export async function toStructuredAudioSnapshotAsync(
  buffer: AudioBuffer,
): Promise<StructuredAudioSnapshot | null> {
  const result = await analyzeAudioBufferAsync(buffer);
  if (!result.valid) return null;

  return {
    durationSeconds: result.durationSeconds,
    sampleRate: result.sampleRate,
    channels: result.channels,
    integratedLufs: result.integratedLufs,
    momentaryLufs: result.momentaryLufs,
    truePeakDbtp: result.truePeakDbtp,
    rmsDb: result.rmsDb,
    crestFactorDb: result.crestFactorDb,
    clippingDetected: result.clippingDetected,
    dcOffsetDetected: result.dcOffsetDetected,
    stereoWidth: result.stereoWidth,
    dynamicRangeDb: result.dynamicRangeDb,
  };
}

export function toStructuredAudioSnapshot(buffer: AudioBuffer): StructuredAudioSnapshot | null {
  const result = analyzeAudioBuffer(buffer);
  if (!result.valid) return null;
  return {
    durationSeconds: result.durationSeconds,
    sampleRate: result.sampleRate,
    channels: result.channels,
    integratedLufs: result.integratedLufs,
    momentaryLufs: result.momentaryLufs,
    truePeakDbtp: result.truePeakDbtp,
    rmsDb: result.rmsDb,
    crestFactorDb: result.crestFactorDb,
    clippingDetected: result.clippingDetected,
    dcOffsetDetected: result.dcOffsetDetected,
    stereoWidth: result.stereoWidth,
    dynamicRangeDb: result.dynamicRangeDb,
  };
}
