#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/.local/student-picker-tests"

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
  --ignoreDeprecations 6.0 \
  --esModuleInterop \
  --skipLibCheck \
  --resolveJsonModule \
  --outDir "$OUT" \
  "$ROOT/src/features/roster/types.ts" \
  "$ROOT/src/features/roster/normalize.ts" \
  "$ROOT/src/features/roster/poolKey.ts" \
  "$ROOT/src/features/roster/importRoster.ts" \
  "$ROOT/src/features/roster/displaySafe.ts" \
  "$ROOT/src/features/roster/sampleRoster.fixture.ts" \
  "$ROOT/src/features/student-picker/types.ts" \
  "$ROOT/src/features/student-picker/randomizerEngine.ts" \
  "$ROOT/src/features/student-picker/fairnessEngine.ts" \
  "$ROOT/src/features/student-picker/pickerStore.ts" \
  "$ROOT/src/features/student-picker/tests.ts"

printf '{"type":"commonjs"}\n' > "$OUT/package.json"

TEST_FILE="$(find "$OUT" -type f -path "*/student-picker/tests.js" -print -quit)"

if [ -z "$TEST_FILE" ]; then
  echo "FAIL: compiled student-picker test file was not found."
  find "$OUT" -type f -print
  exit 1
fi

node "$TEST_FILE"
