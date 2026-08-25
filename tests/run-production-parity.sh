#!/usr/bin/env bash
set -euo pipefail

IMAGE="emscripten/emsdk:4.0.15"

echo "[1/4] Pull Emscripten image"
docker pull "$IMAGE"

echo "[2/4] Generate JS production reference"
docker run --rm \
  -v "$PWD":/src \
  -w /src \
  "$IMAGE" \
  bash -lc '
    python3 -m pip install --disable-pip-version-check --no-cache-dir numpy >/dev/null &&
    node tests/production_reference.js
  '

echo "[3/4] Build and run C++ WASM production engine"
docker run --rm \
  -v "$PWD":/src \
  -w /src \
  "$IMAGE" \
  bash -lc '
    em++ tests/production_engine.cpp \
      -O3 \
      -std=c++17 \
      -sWASM=1 \
      -sMODULARIZE=1 \
      -sEXPORT_ES6=1 \
      -sENVIRONMENT=node \
      -sEXPORTED_FUNCTIONS='\''["_run_production_test","_free_buffer","_malloc","_free"]'\'' \
      -o tests/production_engine.js &&
    node tests/run_production_wasm.js
  '

echo "[4/4] Compare outputs"
docker run --rm \
  -v "$PWD":/src \
  -w /src \
  "$IMAGE" \
  bash -lc '
    python3 -m pip install --disable-pip-version-check --no-cache-dir numpy >/dev/null &&
    python3 tests/production_diff.py
  '
