#!/usr/bin/env bash
# Phase 1/4 — Stamp tracker state foundation + /display projection channel.
# 1) Isolation guard: /display (BoardHostDisplay.tsx, src/widgets/, and the
#    legacy StudentDisplayShell/display paths) must never import the stamp
#    store directly — only stampProjectionChannel.ts's narrow read-only
#    hooks, which resolve just the one teacher-cast student, never the full
#    `students` map. Plain `stampLogic` imports ARE allowed here: it's pure,
#    stateless domain constants/functions with no per-student data at all.
# 2) Compile + run the pure stamp-logic tests (balances, milestone redemption)
#    and the projection-channel's pure view-derivation tests.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/.local/stamps-tests"

rm -rf "$OUT"
mkdir -p "$OUT"

cleanup() {
  rm -rf "$OUT"
}
trap cleanup EXIT

# ── Isolation guard ──
echo "== stamp store /display isolation guard =="
FORBIDDEN_IMPORT="stampStore"
PROTECTED_PATHS=(
  "$ROOT/src/features/display"
  "$ROOT/src/app/StudentDisplayShell.tsx"
  "$ROOT/src/features/clean-board/BoardHostDisplay.tsx"
  "$ROOT/src/widgets"
)
if grep -RInE "$FORBIDDEN_IMPORT" "${PROTECTED_PATHS[@]}" 2>/dev/null; then
  echo "FAIL: /display references the stamp store directly (must go through stampProjectionChannel.ts)"
  exit 1
fi
echo "PASS: /display has no direct stamp store imports"

# ── Compile + run pure-logic tests ──
"$ROOT/node_modules/.bin/tsc" \
  --ignoreConfig \
  --target ES2022 \
  --module CommonJS \
  --moduleResolution Node \
  --ignoreDeprecations "6.0" \
  --esModuleInterop \
  --skipLibCheck \
  --outDir "$OUT" \
  "$ROOT/src/store/stampLogic.ts" \
  "$ROOT/src/store/stampLogic-tests.ts" \
  "$ROOT/src/store/stampStore.ts" \
  "$ROOT/src/store/stampProjectionChannel.ts" \
  "$ROOT/src/store/stampProjectionChannel-tests.ts"

printf '{"type":"commonjs"}\n' > "$OUT/package.json"

LOGIC_TEST_FILE="$(find "$OUT" -type f -name "stampLogic-tests.js" -print -quit)"
if [ -z "$LOGIC_TEST_FILE" ]; then
  echo "FAIL: compiled stamp logic test file not found."
  find "$OUT" -type f -print
  exit 1
fi
node "$LOGIC_TEST_FILE"

CHANNEL_TEST_FILE="$(find "$OUT" -type f -name "stampProjectionChannel-tests.js" -print -quit)"
if [ -z "$CHANNEL_TEST_FILE" ]; then
  echo "FAIL: compiled stamp projection channel test file not found."
  find "$OUT" -type f -print
  exit 1
fi
node "$CHANNEL_TEST_FILE"
