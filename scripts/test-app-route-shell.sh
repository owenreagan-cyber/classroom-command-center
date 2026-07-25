#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/.local/app-route-shell-tests"

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
  "$ROOT/src/app/appRoute.ts" \
  "$ROOT/src/app/appRouteShell.ts" \
  "$ROOT/src/lib/app-route-shell-tests.ts" \
  "$ROOT/src/lib/today-prep-tests.ts" \
  "$ROOT/src/lib/resourceUrl.ts" \
  "$ROOT/src/lib/resourcePresets.ts"

printf '{"type":"commonjs"}\n' > "$OUT/package.json"

TEST_FILE="$(find "$OUT" -type f -path "*/lib/app-route-shell-tests.js" -print -quit)"
PREP_TEST_FILE="$(find "$OUT" -type f -path "*/lib/today-prep-tests.js" -print -quit)"

if [ -z "$TEST_FILE" ]; then
  echo "FAIL: compiled app route shell test file was not found."
  find "$OUT" -type f -print
  exit 1
fi

node "$TEST_FILE"

if [ -z "$PREP_TEST_FILE" ]; then
  echo "FAIL: compiled today prep test file was not found."
  find "$OUT" -type f -print
  exit 1
fi

node "$PREP_TEST_FILE"
