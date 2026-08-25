from pathlib import Path
import numpy as np

ref=np.fromfile(Path('tests/reference-output.bin'),dtype=np.float32)
wasm=np.fromfile(Path('tests/wasm-output.bin'),dtype=np.float32)
if ref.shape!=wasm.shape: raise SystemExit(f'Length mismatch: {ref.shape} != {wasm.shape}')
diff=np.abs(ref.astype(np.float64)-wasm.astype(np.float64))
max_err=float(np.max(diff)); mean_err=float(np.mean(diff)); rms_err=float(np.sqrt(np.mean(diff**2)))
print(f'samples:      {len(ref)}')
print(f'maxAbsError:  {max_err:.12e}')
print(f'meanAbsError: {mean_err:.12e}')
print(f'rmsError:     {rms_err:.12e}')
if not np.all(np.isfinite(diff)): raise SystemExit('FAIL: non-finite error')
if max_err>=1e-6: raise SystemExit('FAIL: EQ parity threshold exceeded')
print('PASS: maxAbsError < 1e-6')
