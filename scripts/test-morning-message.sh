#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/.local/morning-message-tests"

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
  "$ROOT/src/data/types.ts" \
  "$ROOT/src/data/backgroundAssets.ts" \
  "$ROOT/src/data/pageSequences.ts" \
  "$ROOT/src/data/morningMessage.ts" \
  "$ROOT/src/data/defaults.ts" \
  "$ROOT/src/lib/morning-message-tests.ts"

printf '{"type":"commonjs"}\n' > "$OUT/package.json"

TEST_FILE="$(find "$OUT" -type f -path "*/lib/morning-message-tests.js" -print -quit)"

if [ -z "$TEST_FILE" ]; then
  echo "FAIL: compiled morning message test file was not found."
  find "$OUT" -type f -print
  exit 1
fi

node "$TEST_FILE"
