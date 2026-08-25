/**
 * Lossless WAV Encoder for 16-bit, 24-bit PCM and 32-bit IEEE Float32
 */

export function encodeWavFile(
  leftChannel: Float32Array,
  rightChannel: Float32Array,
  sampleRate: number,
  bitDepth: 16 | 24 | 32 = 24
): Blob {
  const numChannels = 2;
  const length = Math.min(leftChannel.length, rightChannel.length);
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = length * blockAlign;
  const bufferSize = 44 + dataSize;

  const arrayBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(arrayBuffer);

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, bitDepth === 32 ? 3 : 1, true); // AudioFormat: 1 for PCM, 3 for IEEE float
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < length; i++) {
    const samples = [leftChannel[i], rightChannel[i]];
    for (let channel = 0; channel < 2; channel++) {
      const sample = Math.max(-1, Math.min(1, samples[channel]));
      if (bitDepth === 16) {
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(offset, intSample, true);
        offset += 2;
      } else if (bitDepth === 24) {
        const intSample = Math.floor(sample < 0 ? sample * 0x800000 : sample * 0x7fffff);
        view.setUint8(offset, intSample & 0xff);
        view.setUint8(offset + 1, (intSample >> 8) & 0xff);
        view.setUint8(offset + 2, (intSample >> 16) & 0xff);
        offset += 3;
      } else if (bitDepth === 32) {
        view.setFloat32(offset, sample, true);
        offset += 4;
      }
    }
  }

  return new Blob([view], { type: 'audio/wav' });
}

export function audioBufferToWav(buffer: AudioBuffer, bitDepth: 16 | 24 | 32 = 16): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const length = buffer.length;

  if (numChannels === 2) {
    return encodeWavFile(buffer.getChannelData(0), buffer.getChannelData(1), sampleRate, bitDepth);
  }

  const monoData = buffer.getChannelData(0);
  return encodeWavFile(monoData, monoData, sampleRate, bitDepth);
}

function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
