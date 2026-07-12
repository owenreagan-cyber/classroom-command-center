#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/.local/local-packet-tests"

rm -rf "$OUT"
mkdir -p "$OUT"

failure=0

cleanup() {
  rm -rf "$OUT"
}
trap cleanup EXIT

# Compile all packet source files plus both test files
"$ROOT/node_modules/.bin/tsc" \
  --ignoreConfig \
  --target ES2022 \
  --module CommonJS \
  --moduleResolution Node \
  --ignoreDeprecations "6.0" \
  --esModuleInterop \
  --skipLibCheck \
  --outDir "$OUT" \
  "$ROOT/src/features/local-packets/types.ts" \
  "$ROOT/src/features/local-packets/packetVersion.ts" \
  "$ROOT/src/features/local-packets/packetValidation.ts" \
  "$ROOT/src/features/local-packets/packetApplyPlan.ts" \
  "$ROOT/src/features/local-packets/packetExport.ts" \
  "$ROOT/src/features/local-packets/packetImport.ts" \
  "$ROOT/src/features/local-packets/integration-tests.ts" \
  "$ROOT/src/features/local-packets/tests.ts"

printf '{"type":"commonjs"}\n' > "$OUT/package.json"

# Run integration tests first
INT_FILE="$OUT/features/local-packets/integration-tests.js"
if [ -f "$INT_FILE" ]; then
  node "$INT_FILE" || failure=1
else
  echo "WARNING: Integration test file not found at $INT_FILE"
fi

# Run the original pure tests
TEST_FILE="$OUT/features/local-packets/tests.js"
if [ -f "$TEST_FILE" ]; then
  node "$TEST_FILE" || failure=1
else
  echo "WARNING: Pure test file not found at $TEST_FILE"
  failure=1
fi

exit $failure
