#!/usr/bin/env bash
# Phase 4 — Local QR code generator.
# 1) Isolation guard: /display (BoardHostDisplay.tsx, src/widgets/, and the
#    legacy StudentDisplayShell/display paths) must never import
#    QRCastTeacherPanel.tsx — the ONLY place the URL text input exists.
#    /display may read the cast URL (via qrCastStore) but must never collect
#    input of its own — see the Phase 4 "Projector Safety" invariant.
# 2) Compile + run the pure qrCastLogic tests (URL normalization).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/.local/qr-code-tests"

rm -rf "$OUT"
mkdir -p "$OUT"

cleanup() {
  rm -rf "$OUT"
}
trap cleanup EXIT

# ── Isolation guard ──
echo "== QR cast /display isolation guard =="
FORBIDDEN_IMPORT="QRCastTeacherPanel"
PROTECTED_PATHS=(
  "$ROOT/src/features/display"
  "$ROOT/src/app/StudentDisplayShell.tsx"
  "$ROOT/src/features/clean-board/BoardHostDisplay.tsx"
  "$ROOT/src/widgets"
)
if grep -RInE "$FORBIDDEN_IMPORT" "${PROTECTED_PATHS[@]}" 2>/dev/null; then
  echo "FAIL: /display references the QR cast teacher input panel directly"
  exit 1
fi
echo "PASS: /display never imports the QR cast text input"

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
  "$ROOT/src/store/qrCastLogic.ts" \
  "$ROOT/src/store/qrCastLogic-tests.ts"

printf '{"type":"commonjs"}\n' > "$OUT/package.json"

TEST_FILE="$(find "$OUT" -type f -name "qrCastLogic-tests.js" -print -quit)"
if [ -z "$TEST_FILE" ]; then
  echo "FAIL: compiled qrCastLogic test file not found."
  find "$OUT" -type f -print
  exit 1
fi

node "$TEST_FILE"
