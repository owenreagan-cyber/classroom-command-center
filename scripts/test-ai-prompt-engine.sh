#!/usr/bin/env bash
# Phase 3 — local AI prompt engine tests.
# Validates routinePlanSchema against well/malformed RoutinePlan shapes, and
# exercises the offline-fallback path deterministically against a closed
# port (not the real Ollama port), so this passes in CI whether or not a
# real local Ollama instance happens to be running. If one IS reachable on
# the real default port, it also runs a genuine live generation call as a
# best-effort integration check (skipped, not failed, when unreachable).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/.local/ai-prompt-engine-tests"

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
  "$ROOT/src/features/clean-board/boardGeometry.ts" \
  "$ROOT/src/features/clean-board/backgrounds.ts" \
  "$ROOT/src/features/clean-board/themes.ts" \
  "$ROOT/src/features/clean-board/messageCards.ts" \
  "$ROOT/src/features/clean-board/timerPresets.ts" \
  "$ROOT/src/features/clean-board/images.ts" \
  "$ROOT/src/features/clean-board/displayModes.ts" \
  "$ROOT/src/features/clean-board/storage/boardSerialization.ts" \
  "$ROOT/src/features/clean-board/routinePromptPlanner.ts" \
  "$ROOT/src/lib/ai/localPromptEngine.ts" \
  "$ROOT/src/lib/ai/tests.ts"

printf '{"type":"commonjs"}\n' > "$OUT/package.json"

TEST_FILE="$(find "$OUT" -type f -path "*/lib/ai/tests.js" -print -quit)"
if [ -z "$TEST_FILE" ]; then
  echo "FAIL: compiled AI prompt engine test file not found."
  find "$OUT" -type f -print
  exit 1
fi

node "$TEST_FILE"
