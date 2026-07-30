#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/.local/noise-control-tests"

rm -rf "$OUT"
mkdir -p "$OUT"

cleanup() { rm -rf "$OUT"; }
trap cleanup EXIT

"$ROOT/node_modules/.bin/tsc" \
  --ignoreConfig \
  --target ES2022 \
  --module CommonJS \
  --moduleResolution Node \
  --rootDir "$ROOT" \
  --ignoreDeprecations 6.0 \
  --esModuleInterop \
  --skipLibCheck \
  --outDir "$OUT" \
  "$ROOT/src/data/types.ts" \
  "$ROOT/src/lib/noiseTowers.ts" \
  "$ROOT/src/features/noise-control/tests.ts" \
  "$ROOT/scripts/validate-noise-rules.ts"

printf '{"type":"commonjs"}\n' > "$OUT/package.json"

TEST_FILE="$(find "$OUT" -type f -path "*/features/noise-control/tests.js" -print -quit)"
node "$TEST_FILE"

echo "▸ Screen assignment rules (validate-noise-rules.ts)"
RULES_FILE="$(find "$OUT" -type f -path "*/scripts/validate-noise-rules.js" -print -quit)"
node "$RULES_FILE"

echo "Noise control tests passed."
