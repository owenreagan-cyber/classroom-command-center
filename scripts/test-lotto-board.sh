#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/.local/lotto-board-tests"

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
  "$ROOT/src/features/prize-board/types.ts" \
  "$ROOT/src/features/prize-board/defaultPrizes.ts" \
  "$ROOT/src/features/prize-board/prizeBank.ts" \
  "$ROOT/src/features/lotto-board/types.ts" \
  "$ROOT/src/features/lotto-board/drawLogic.ts" \
  "$ROOT/src/features/lotto-board/lottoBoardStore.ts" \
  "$ROOT/src/features/lotto-board/lottoBoardTests.ts"

printf '{"type":"commonjs"}\n' > "$OUT/package.json"

TEST_FILE="$(find "$OUT" -type f -path "*/lotto-board/lottoBoardTests.js" -print -quit)"

if [ -z "$TEST_FILE" ]; then
  echo "FAIL: compiled lotto-board test file was not found."
  find "$OUT" -type f -print
  exit 1
fi

node "$TEST_FILE"
