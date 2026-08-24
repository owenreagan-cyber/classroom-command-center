#!/usr/bin/env bash
# DB-1 — Clean Board Lab tests.
# 1) Import guard: the clean-board lane must not import old hub/studio/composer shells.
# 2) Compile + run pure-logic tests (geometry, safety projection, seed data).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/.local/clean-board-tests"

rm -rf "$OUT"
mkdir -p "$OUT"

cleanup() {
  rm -rf "$OUT"
}
trap cleanup EXIT

# ── Import guard ──
echo "== clean-board import guard =="
FORBIDDEN_IMPORT='classroom-atmosphere|SpotifyEmbedPlayer|SpotifyProvider|presentation-hub|display-studio|display-composer'
if grep -RInE "$FORBIDDEN_IMPORT" "$ROOT/src/features/clean-board" 2>/dev/null; then
  echo "FAIL: clean-board imports/references old classroom-atmosphere embed or hub/studio/composer shell"
  exit 1
fi
echo "PASS: clean-board has no old shell or spotify embed imports"

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
  "$ROOT/src/features/clean-board/types.ts" \
  "$ROOT/src/features/clean-board/backgrounds.ts" \
  "$ROOT/src/features/clean-board/themes.ts" \
  "$ROOT/src/features/clean-board/messageCards.ts" \
  "$ROOT/src/features/clean-board/timerPresets.ts" \
  "$ROOT/src/features/clean-board/images.ts" \
  "$ROOT/src/features/clean-board/displayModes.ts" \
  "$ROOT/src/features/clean-board/templatePacks.ts" \
  "$ROOT/src/features/clean-board/boardGeometry.ts" \
  "$ROOT/src/features/clean-board/editLayout.ts" \
  "$ROOT/src/features/clean-board/boardSafety.ts" \
  "$ROOT/src/features/clean-board/wakeLockState.ts" \
  "$ROOT/src/features/clean-board/seedBoard.ts" \
  "$ROOT/src/features/clean-board/storage/boardSerialization.ts" \
  "$ROOT/src/features/clean-board/storage/boardMigrations.ts" \
  "$ROOT/src/features/clean-board/storage/boardStorage.ts" \
  "$ROOT/src/features/clean-board/boardLabTests.ts"

printf '{"type":"commonjs"}\n' > "$OUT/package.json"

TEST_FILE="$(find "$OUT" -type f -name "boardLabTests.js" -print -quit)"
if [ -z "$TEST_FILE" ]; then
  echo "FAIL: compiled clean-board test file not found."
  find "$OUT" -type f -print
  exit 1
fi

node "$TEST_FILE"
