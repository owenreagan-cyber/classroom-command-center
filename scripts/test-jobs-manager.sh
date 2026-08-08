#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/.local/jobs-manager-tests"

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
  --outDir "$OUT" \
  "$ROOT/src/features/student-picker/types.ts" \
  "$ROOT/src/features/jobs-manager/types.ts" \
  "$ROOT/src/features/jobs-manager/defaultJobs.ts" \
  "$ROOT/src/features/jobs-manager/smartAssign.ts" \
  "$ROOT/src/features/jobs-manager/jobsManagerTests.ts"

printf '{"type":"commonjs"}\n' > "$OUT/package.json"

TEST_FILE="$(find "$OUT" -type f -path "*/jobs-manager/jobsManagerTests.js" -print -quit)"

if [ -z "$TEST_FILE" ]; then
  echo "FAIL: compiled jobs-manager test file was not found."
  find "$OUT" -type f -print
  exit 1
fi

node "$TEST_FILE"
