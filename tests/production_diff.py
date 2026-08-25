from pathlib import Path
import numpy as np


def read_f32(path: str) -> np.ndarray:
    data = np.fromfile(Path(path), dtype=np.float32)
    if data.size == 0:
        raise SystemExit(f'FAIL: empty file: {path}')
    if not np.all(np.isfinite(data)):
        raise SystemExit(f'FAIL: non-finite samples: {path}')
    return data


def metrics(name: str, reference: np.ndarray, actual: np.ndarray) -> None:
    if reference.shape != actual.shape:
        raise SystemExit(f'FAIL: {name} shape mismatch: {reference.shape} != {actual.shape}')

    diff = np.abs(reference.astype(np.float64) - actual.astype(np.float64))
    print(f'{name}.maxAbsError:  {np.max(diff):.12e}')
    print(f'{name}.meanAbsError: {np.mean(diff):.12e}')
    print(f'{name}.rmsError:     {np.sqrt(np.mean(diff ** 2)):.12e}')

    if not np.all(np.isfinite(diff)):
        raise SystemExit(f'FAIL: {name} non-finite diff')

    if np.max(diff) >= 1e-6:
        raise SystemExit(f'FAIL: {name} parity threshold exceeded')


left_ref = read_f32('tests/production-reference-left.bin')
right_ref = read_f32('tests/production-reference-right.bin')
left_wasm = read_f32('tests/production-wasm-left.bin')
right_wasm = read_f32('tests/production-wasm-right.bin')

if left_ref.size != right_ref.size:
    raise SystemExit('FAIL: reference stereo length mismatch')
if left_wasm.size != right_wasm.size:
    raise SystemExit('FAIL: WASM stereo length mismatch')

print(f'samples:      {left_ref.size}')
metrics('left', left_ref, left_wasm)
metrics('right', right_ref, right_wasm)

combined_ref = np.concatenate([left_ref, right_ref])
combined_wasm = np.concatenate([left_wasm, right_wasm])
combined_diff = np.abs(
    combined_ref.astype(np.float64) - combined_wasm.astype(np.float64)
)
combined_max = float(np.max(combined_diff))
combined_mean = float(np.mean(combined_diff))
combined_rms = float(np.sqrt(np.mean(combined_diff ** 2)))

print(f'maxAbsError:  {combined_max:.12e}')
print(f'meanAbsError: {combined_mean:.12e}')
print(f'rmsError:     {combined_rms:.12e}')

if combined_max >= 1e-6:
    raise SystemExit('FAIL: production parity threshold exceeded')

print('PASS: production DSP parity maxAbsError < 1e-6')
