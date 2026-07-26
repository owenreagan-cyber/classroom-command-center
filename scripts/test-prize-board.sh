#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/.local/prize-board-tests"

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
  "$ROOT/src/features/roster/types.ts" \
  "$ROOT/src/features/roster/poolKey.ts" \
  "$ROOT/src/features/titles/types.ts" \
  "$ROOT/src/features/titles/defaultTitles.ts" \
  "$ROOT/src/features/titles/titleBank.ts" \
  "$ROOT/src/features/prize-board/types.ts" \
  "$ROOT/src/features/prize-board/defaultPrizes.ts" \
  "$ROOT/src/features/prize-board/prizeBank.ts" \
  "$ROOT/src/features/prize-board/boardGenerator.ts" \
  "$ROOT/src/features/prize-board/displaySafe.ts" \
  "$ROOT/src/features/prize-board/pressYourLuck/types.ts" \
  "$ROOT/src/features/prize-board/pressYourLuck/spinEngine.ts" \
  "$ROOT/src/features/prize-board/pressYourLuck/mysteryReveal.ts" \
  "$ROOT/src/features/prize-board/pressYourLuck/whammyState.ts" \
  "$ROOT/src/features/prize-board/pressYourLuck/pressYourLuckLogic.ts" \
  "$ROOT/src/features/prize-board/pressYourLuck/pressYourLuckStore.ts" \
  "$ROOT/src/features/prize-board/pressYourLuck/displayPrivacy.ts" \
  "$ROOT/src/features/prize-board/prizeBoardStore.ts" \
  "$ROOT/src/features/student-picker/randomizerEngine.ts" \
  "$ROOT/src/features/student-picker/types.ts" \
  "$ROOT/src/features/student-picker/defaults.ts" \
  "$ROOT/src/features/student-picker/pickerStore.ts" \
  "$ROOT/src/features/prize-board/tests.ts"

printf '{"type":"commonjs"}\n' > "$OUT/package.json"

TEST_FILE="$(find "$OUT" -type f -path "*/prize-board/tests.js" -print -quit)"

if [ -z "$TEST_FILE" ]; then
  echo "FAIL: compiled prize-board test file was not found."
  find "$OUT" -type f -print
  exit 1
fi

node "$TEST_FILE"
