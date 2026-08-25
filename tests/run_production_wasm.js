import { readFile, writeFile } from 'node:fs/promises';
import createModule from './production_engine.js';

const module = await createModule();

async function readFloat32(path) {
  const buffer = await readFile(path);
  if (buffer.byteLength % 4 !== 0) throw new Error(`Invalid Float32 file: ${path}`);
  return new Float32Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / 4);
}

const left = await readFloat32('tests/production-input-left.bin');
const right = await readFloat32('tests/production-input-right.bin');
if (left.length !== right.length) throw new Error('Stereo input length mismatch');

const leftPtr = module._malloc(left.byteLength);
const rightPtr = module._malloc(right.byteLength);
if (!leftPtr || !rightPtr) throw new Error('WASM input allocation failed');

let outputPtr = 0;
try {
  module.HEAPF32.set(left, leftPtr / 4);
  module.HEAPF32.set(right, rightPtr / 4);

  outputPtr = module._run_production_test(
    leftPtr,
    rightPtr,
    left.length,
    48000,
    3.0,
    -2.0,
    1.5,
    -24.0,
    3.0,
    0.0,
  );

  if (!outputPtr) throw new Error('run_production_test returned null');

  const leftOutput = module.HEAPF32.slice(
    outputPtr / 4,
    outputPtr / 4 + left.length,
  );
  const rightOutput = module.HEAPF32.slice(
    outputPtr / 4 + left.length,
    outputPtr / 4 + left.length * 2,
  );

  await writeFile('tests/production-wasm-left.bin', Buffer.from(leftOutput.buffer));
  await writeFile('tests/production-wasm-right.bin', Buffer.from(rightOutput.buffer));
} finally {
  if (outputPtr) module._free_buffer(outputPtr);
  module._free(leftPtr);
  module._free(rightPtr);
}
