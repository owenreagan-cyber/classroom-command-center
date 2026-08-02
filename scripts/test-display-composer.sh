#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/.local/display-composer-tests"

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
  "$ROOT/src/data/types.ts" \
  "$ROOT/src/data/backgroundAssets.ts" \
  "$ROOT/src/features/display-composer/types.ts" \
  "$ROOT/src/features/display-composer/backgroundStyles.ts" \
  "$ROOT/src/features/display-composer/defaultScreens.ts" \
  "$ROOT/src/features/display-composer/displayComposerLogic.ts" \
  "$ROOT/src/features/display-composer/displaySafe.ts" \
  "$ROOT/src/features/display-composer/messageDraft.ts" \
  "$ROOT/src/features/display-composer/aiLessonMessageTypes.ts" \
  "$ROOT/src/features/display-composer/aiLessonMessagePrompt.ts" \
  "$ROOT/src/features/display-composer/aiLessonMessageFallbacks.ts" \
  "$ROOT/src/features/display-composer/aiLessonMessageGenerator.ts" \
  "$ROOT/src/features/display-composer/aiLessonMessageMapping.ts" \
  "$ROOT/src/lib/display-composer-tests.ts" \
  "$ROOT/src/lib/ai-lesson-message-tests.ts"

printf '{"type":"commonjs"}\n' > "$OUT/package.json"

TEST_FILE="$(find "$OUT" -type f -path "*/lib/display-composer-tests.js" -print -quit)"
AI_TEST_FILE="$(find "$OUT" -type f -path "*/lib/ai-lesson-message-tests.js" -print -quit)"

if [ -z "$TEST_FILE" ]; then
  echo "FAIL: compiled display composer test file was not found."
  find "$OUT" -type f -print
  exit 1
fi

if [ -z "$AI_TEST_FILE" ]; then
  echo "FAIL: compiled AI lesson message test file was not found."
  find "$OUT" -type f -print
  exit 1
fi

node "$TEST_FILE"
node "$AI_TEST_FILE"
