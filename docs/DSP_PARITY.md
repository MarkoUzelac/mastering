# DSP Parity Specification & Verification Contract

## 1. Overview & Numerical Truth
The numerical source of truth for MasteringPro Local is defined in `src/audio/dsp-core.js`.
The C++ / WebAssembly DSP engine in `src/dsp/mastering.cpp` and `tests/production_engine.cpp` must deliver bit-equivalent floating-point outputs under the identical double-precision mathematical contract before single-precision Float32 boundary conversion.

## 2. Release Gates

| Gate | Target | Tolerance | Verification Metric |
| :--- | :--- | :--- | :--- |
| **GATE 1 — Coefficients** | LowShelf, Peaking, HighShelf RBJ | `maxAbsError < 1e-12` | Analytical Coefficient Diff |
| **GATE 2 — EQ Output** | 1024-sample Dirac Impulse & 100k test | `maxAbsError < 1e-6` | DF2T State Response |
| **GATE 3 — Compressor** | Stereo-linked RMS feedback dynamics | `maxAbsError < 1e-6` | Attack/Release Ballistics |
| **GATE 4 — Limiter** | -1.0 dBFS Peak Ceiling Clamp | `maxAbsError < 1e-6` | Peak Recovery Invariant |
| **GATE 5 — Full Chain** | 100,000 Deterministic Samples | `maxAbsError < 1e-6` | Combined Stereo L/R |
| **GATE 6 — Web Worker** | Threaded Master Processing | `maxAbsError < 1e-6` | Off-thread Execution |
| **GATE 7 — E2E UI** | Interactive Mastering & Scrubber | `Functional PASS` | End-to-End User Flow |
| **GATE 8 — Release** | Production Deployment | `All Gates Green` | Production Release |

## 3. Absolute Rule: No Measurement = No Pass
Never assume or fabricate metrics. Parity status must be established by actual executed sample differentials:
```
samples:      100000
maxAbsError:  <measured scientific notation>
meanAbsError: <measured scientific notation>
rmsError:     <measured scientific notation>
```
