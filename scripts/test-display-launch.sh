#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/.local/display-launch-tests"

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
  --lib ES2022,DOM \
  --esModuleInterop \
  --skipLibCheck \
  --outDir "$OUT" \
  "$ROOT/src/app/appRoute.ts" \
  "$ROOT/src/app/displayLaunch.ts" \
  "$ROOT/src/lib/display-launch-tests.ts"

printf '{"type":"commonjs"}\n' > "$OUT/package.json"

TEST_FILE="$(find "$OUT" -type f -path "*/lib/display-launch-tests.js" -print -quit)"

if [ -z "$TEST_FILE" ]; then
  echo "FAIL: compiled display launch test file was not found."
  find "$OUT" -type f -print
  exit 1
fi

node "$TEST_FILE"
