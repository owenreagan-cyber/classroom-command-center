#!/usr/bin/env bash
# Phase 1 — Stamp tracker state foundation.
# 1) Isolation guard: /display must never import the stamp store/logic directly
#    (it may only ever read a teacher-set activeProjection, never the private
#    per-student `students` map) — see stampStore.ts's StampProjection doc.
# 2) Compile + run the pure stamp-logic tests (balances, milestone redemption).
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
FORBIDDEN_IMPORT='stampStore|stampLogic'
if grep -RInE "$FORBIDDEN_IMPORT" "$ROOT/src/features/display" "$ROOT/src/app/StudentDisplayShell.tsx" 2>/dev/null; then
  echo "FAIL: /display references the stamp store/logic directly"
  exit 1
fi
echo "PASS: /display has no direct stamp store/logic imports"

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
  "$ROOT/src/store/stampLogic-tests.ts"

printf '{"type":"commonjs"}\n' > "$OUT/package.json"

TEST_FILE="$(find "$OUT" -type f -name "stampLogic-tests.js" -print -quit)"
if [ -z "$TEST_FILE" ]; then
  echo "FAIL: compiled stamp logic test file not found."
  find "$OUT" -type f -print
  exit 1
fi

node "$TEST_FILE"
