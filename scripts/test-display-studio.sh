#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/.local/display-studio-tests"

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
  "$ROOT/src/features/display-composer/types.ts" \
  "$ROOT/src/features/display-composer/backgroundStyles.ts" \
  "$ROOT/src/features/display-composer/defaultScreens.ts" \
  "$ROOT/src/features/display-composer/displayComposerLogic.ts" \
  "$ROOT/src/features/display-composer/displaySafe.ts" \
  "$ROOT/src/features/display-studio/studioWidgets.ts" \
  "$ROOT/src/features/display-studio/displayStudioTypes.ts" \
  "$ROOT/src/lib/displayStudioTestHelpers.ts" \
  "$ROOT/src/lib/display-studio-tests.ts"

printf '{"type":"commonjs"}\n' > "$OUT/package.json"

TEST_FILE="$(find "$OUT" -type f -path "*/lib/display-studio-tests.js" -print -quit)"

if [ -z "$TEST_FILE" ]; then
  echo "FAIL: compiled display studio test file was not found."
  find "$OUT" -type f -print
  exit 1
fi

node "$TEST_FILE"


echo "Checking student-facing renderer for leaked implementation notes..."
if grep -RIn \
  "I'll actually do this differently\|actually do this differently\|update key layout areas" \
  src/features/display-composer/DisplayScreenRenderer.tsx; then
  echo "FAIL: leaked implementation note text found in student-facing display renderer"
  exit 1
fi

