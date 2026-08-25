import { readFile, writeFile } from 'node:fs/promises';
import createModule from './biquad_engine.js';

const module = await createModule();
const inputBuffer = await readFile('tests/reference-input.bin');
if (inputBuffer.byteLength % 4 !== 0) throw new Error('Invalid float32 input');
const input = new Float32Array(inputBuffer.buffer, inputBuffer.byteOffset, inputBuffer.byteLength / 4);
const inputPtr = module._malloc(input.byteLength);
if (!inputPtr) throw new Error('WASM input allocation failed');
let outputPtr = 0;
try {
  module.HEAPF32.set(input, inputPtr / 4);
  outputPtr = module._run_eq_test(inputPtr,input.length,48000,120,3,0.707,1200,-2,0.8,8500,1.5,0.707);
  if (!outputPtr) throw new Error('run_eq_test returned null');
  const output=module.HEAPF32.slice(outputPtr/4,outputPtr/4+input.length);
  await writeFile('tests/wasm-output.bin',Buffer.from(output.buffer));
} finally {
  if(outputPtr) module._free_buffer(outputPtr);
  module._free(inputPtr);
}
