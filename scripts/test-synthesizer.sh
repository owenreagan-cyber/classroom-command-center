#!/usr/bin/env bash
# Phase 1 — Web Audio synthesizer pure-logic tests (note sequences for tier
# unlocks and the victory fanfare, plus a no-window/no-AudioContext safety
# check since that's the environment these compiled tests run in).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/.local/synthesizer-tests"

rm -rf "$OUT"
mkdir -p "$OUT"

cleanup() {
  rm -rf "$OUT"
}
trap cleanup EXIT

"$ROOT/node_modules/.bin/tsc" \
  --ignoreConfig \
  --target ES2022 \
  --module CommonJS \
  --moduleResolution Node \
  --ignoreDeprecations "6.0" \
  --esModuleInterop \
  --skipLibCheck \
  --outDir "$OUT" \
  "$ROOT/src/lib/audio/synthesizer.ts" \
  "$ROOT/src/lib/audio/tests.ts"

printf '{"type":"commonjs"}\n' > "$OUT/package.json"

TEST_FILE="$(find "$OUT" -type f -name "tests.js" -print -quit)"
if [ -z "$TEST_FILE" ]; then
  echo "FAIL: compiled synthesizer test file not found."
  find "$OUT" -type f -print
  exit 1
fi

node "$TEST_FILE"
