import { analyzeEbuLufs } from '../audio/EbuLufsMeter';
import type { EbuLufsResult } from '../audio/EbuLufsMeter';

interface LufsWorkerRequest {
  id: number;
  left: Float32Array;
  right: Float32Array;
  sampleRate: number;
}

type LufsWorkerResponse =
  | { id: number; type: 'SUCCESS'; payload: EbuLufsResult }
  | { id: number; type: 'ERROR'; error: string };

self.onmessage = (event: MessageEvent<LufsWorkerRequest>) => {
  const { id, left, right, sampleRate } = event.data;

  try {
    if (!(left instanceof Float32Array) || !(right instanceof Float32Array) || !Number.isFinite(sampleRate)) {
      throw new Error('Invalid audio data provided to LUFS worker.');
    }

    const result = analyzeEbuLufs(left, right, sampleRate);
    self.postMessage({ id, type: 'SUCCESS', payload: result } satisfies LufsWorkerResponse);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'LUFS worker analysis failed.';
    self.postMessage({ id, type: 'ERROR', error: message } satisfies LufsWorkerResponse);
  }
};
