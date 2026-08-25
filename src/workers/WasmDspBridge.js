/**
 * WasmDspBridge - Memory & ABI Bridge for C++ WebAssembly Mastering Engine
 * 
 * Complies with the production C ABI:
 * - create_mastering_processor(double sampleRate) -> void*
 * - set_parameters(void* proc, double low, double mid, double high, double threshold, double ratio, double gain)
 * - reset_state(void* proc)
 * - process_audio_stereo(void* proc, const float* left, const float* right, float* leftOut, float* rightOut, int numSamples)
 * - destroy_processor(void* proc)
 * - _malloc(size_t bytes) -> void*
 * - _free(void* ptr)
 */

export class WasmDspBridge {
  constructor(wasmModule, sampleRate = 48000) {
    this.module = wasmModule;
    this.sampleRate = sampleRate;
    this.processorPtr = null;

    // Allocated WASM heap pointers
    this.leftInPtr = 0;
    this.rightInPtr = 0;
    this.leftOutPtr = 0;
    this.rightOutPtr = 0;
    this.allocatedCapacitySamples = 0;

    this.initProcessor();
  }

  initProcessor() {
    if (!this.module) return;

    if (typeof this.module._create_mastering_processor === 'function') {
      this.processorPtr = this.module._create_mastering_processor(this.sampleRate);
    } else if (typeof this.module.create_mastering_processor === 'function') {
      this.processorPtr = this.module.create_mastering_processor(this.sampleRate);
    }
  }

  setSampleRate(sampleRate) {
    if (this.sampleRate === sampleRate) return;
    this.sampleRate = sampleRate;
    if (this.processorPtr) {
      this.destroyProcessor();
    }
    this.initProcessor();
  }

  ensureBufferCapacity(numSamples) {
    if (this.allocatedCapacitySamples >= numSamples && this.leftInPtr !== 0) {
      return;
    }

    this.freeBuffers();

    const byteLength = numSamples * 4; // 4 bytes per Float32
    const malloc = this.module._malloc || this.module.malloc;
    if (!malloc) {
      throw new Error('WASM module missing malloc export');
    }

    this.leftInPtr = malloc(byteLength);
    this.rightInPtr = malloc(byteLength);
    this.leftOutPtr = malloc(byteLength);
    this.rightOutPtr = malloc(byteLength);

    if (!this.leftInPtr || !this.rightInPtr || !this.leftOutPtr || !this.rightOutPtr) {
      this.freeBuffers();
      throw new Error(`WASM out of memory allocating ${byteLength * 4} bytes for ${numSamples} frames`);
    }

    this.allocatedCapacitySamples = numSamples;
  }

  freeBuffers() {
    const free = this.module?._free || this.module?.free;
    if (free) {
      if (this.leftInPtr) free(this.leftInPtr);
      if (this.rightInPtr) free(this.rightInPtr);
      if (this.leftOutPtr) free(this.leftOutPtr);
      if (this.rightOutPtr) free(this.rightOutPtr);
    }
    this.leftInPtr = 0;
    this.rightInPtr = 0;
    this.leftOutPtr = 0;
    this.rightOutPtr = 0;
    this.allocatedCapacitySamples = 0;
  }

  setParameters(low, mid, high, threshold, ratio, gain) {
    if (!this.processorPtr) return;

    const fn = this.module._set_parameters || this.module.set_parameters;
    if (typeof fn === 'function') {
      fn(this.processorPtr, low, mid, high, threshold, ratio, gain);
    }
  }

  reset() {
    if (!this.processorPtr) return;
    const fn = this.module._reset_state || this.module.reset_state;
    if (typeof fn === 'function') {
      fn(this.processorPtr);
    }
  }

  process(leftIn, rightIn, leftOut, rightOut, numSamples) {
    if (!this.processorPtr) {
      throw new Error('WASM MasteringProcessor instance not initialized');
    }

    this.ensureBufferCapacity(numSamples);

    const heapF32 = this.module.HEAPF32;
    if (!heapF32) {
      throw new Error('WASM HEAPF32 view is not available on module');
    }

    const inLIdx = this.leftInPtr >> 2;
    const inRIdx = this.rightInPtr >> 2;
    const outLIdx = this.leftOutPtr >> 2;
    const outRIdx = this.rightOutPtr >> 2;

    // Fast copy into WASM linear heap
    heapF32.set(leftIn.subarray(0, numSamples), inLIdx);
    heapF32.set(rightIn.subarray(0, numSamples), inRIdx);

    const processFn = this.module._process_audio_stereo || this.module.process_audio_stereo;
    if (typeof processFn !== 'function') {
      throw new Error('WASM module missing process_audio_stereo export');
    }

    processFn(
      this.processorPtr,
      this.leftInPtr,
      this.rightInPtr,
      this.leftOutPtr,
      this.rightOutPtr,
      numSamples
    );

    // Copy processed stereo frame data out of WASM linear heap
    leftOut.set(heapF32.subarray(outLIdx, outLIdx + numSamples));
    rightOut.set(heapF32.subarray(outRIdx, outRIdx + numSamples));
  }

  destroyProcessor() {
    if (this.processorPtr) {
      const destroyFn = this.module._destroy_processor || this.module.destroy_processor;
      if (typeof destroyFn === 'function') {
        destroyFn(this.processorPtr);
      }
      this.processorPtr = null;
    }
  }

  dispose() {
    this.freeBuffers();
    this.destroyProcessor();
    this.module = null;
  }
}
