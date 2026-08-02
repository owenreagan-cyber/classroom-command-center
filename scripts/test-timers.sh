#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/.local/timer-tests"

rm -rf "$OUT"
mkdir -p "$OUT"

cleanup() { rm -rf "$OUT"; }
trap cleanup EXIT

"$ROOT/node_modules/.bin/tsc" \
  --ignoreConfig \
  --target ES2022 \
  --module CommonJS \
  --moduleResolution Node \
  --ignoreDeprecations 6.0 \
  --esModuleInterop \
  --skipLibCheck \
  --outDir "$OUT" \
  "$ROOT/src/data/timerTypes.ts" \
  "$ROOT/src/data/timerDefaults.ts" \
  "$ROOT/src/data/routineSchedule.ts" \
  "$ROOT/src/lib/timerFormat.ts" \
  "$ROOT/src/store/timerRecovery.ts" \
  "$ROOT/src/lib/timer-tests.ts"

printf '{"type":"commonjs"}\n' > "$OUT/package.json"

node "$OUT/lib/timer-tests.js"
echo "Timer tests passed."
