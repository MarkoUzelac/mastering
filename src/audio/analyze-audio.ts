import type { StructuredAudioSnapshot } from '../ai/contracts';
import { analyzeEbuLufs, type EbuLufsResult } from './EbuLufsMeter';

export function analyzeAudioBuffer(buffer: AudioBuffer): EbuLufsResult {
  const left = buffer.getChannelData(0);
  const right = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : left;
  return analyzeEbuLufs(left, right, buffer.sampleRate);
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
