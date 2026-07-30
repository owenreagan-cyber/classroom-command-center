#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/.local/random-number-tests"

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
  "$ROOT/src/features/random-number/types.ts" \
  "$ROOT/src/features/random-number/randomNumberLogic.ts" \
  "$ROOT/src/features/random-number/displaySafe.ts" \
  "$ROOT/src/features/random-number/randomNumberStore.ts" \
  "$ROOT/src/features/random-number/tests.ts"

printf '{"type":"commonjs"}\n' > "$OUT/package.json"

TEST_FILE="$(find "$OUT" -type f -path "*/random-number/tests.js" -print -quit)"
node "$TEST_FILE"
echo "Random number selector tests passed."
