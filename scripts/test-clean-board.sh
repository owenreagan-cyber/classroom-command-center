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

# DisplayOverlayHost.tsx (DB-7B) is the one deliberate, intentional bridge:
# it re-composes the cast-to-display overlay pipeline (Prize Board, Random
# Number, Display Composer, Morning Message, Now Showing) into the Clean
# Board host display, reusing Display Composer's existing student-safe
# projection (toDisplaySafeScreen) instead of duplicating it. It is the ONLY
# file allowed to import display-composer -- it must still fail on every
# other forbidden import below, and every other clean-board file must still
# fail on display-composer too. See qa/display-overlay-pipeline-audit.md.
ALLOWLISTED_BRIDGE_FILE="$ROOT/src/features/clean-board/DisplayOverlayHost.tsx"

FORBIDDEN_IMPORT='classroom-atmosphere|SpotifyEmbedPlayer|SpotifyProvider|presentation-hub|display-studio|display-composer'
FORBIDDEN_IMPORT_FOR_BRIDGE='classroom-atmosphere|SpotifyEmbedPlayer|SpotifyProvider|presentation-hub|display-studio'

IMPORT_GUARD_FAILED=0

# Every clean-board file except the one allowlisted bridge: full ban, unchanged.
if grep -RInE "$FORBIDDEN_IMPORT" "$ROOT/src/features/clean-board" 2>/dev/null \
  | grep -v "^${ALLOWLISTED_BRIDGE_FILE}:"; then
  echo "FAIL: clean-board imports/references old classroom-atmosphere embed or hub/studio/composer shell"
  IMPORT_GUARD_FAILED=1
fi

# The allowlisted bridge file itself: display-composer is the one permitted
# import; every other forbidden pattern must still fail here too.
if [ -f "$ALLOWLISTED_BRIDGE_FILE" ] \
  && grep -InE "$FORBIDDEN_IMPORT_FOR_BRIDGE" "$ALLOWLISTED_BRIDGE_FILE" 2>/dev/null; then
  echo "FAIL: DisplayOverlayHost.tsx imports something beyond its one allowlisted display-composer bridge"
  IMPORT_GUARD_FAILED=1
fi

if [ "$IMPORT_GUARD_FAILED" -eq 1 ]; then
  exit 1
fi
echo "PASS: clean-board has no old shell or spotify embed imports (DisplayOverlayHost.tsx's display-composer bridge is the one documented exception)"

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
  "$ROOT/src/features/clean-board/displayHost.ts" \
  "$ROOT/src/features/clean-board/routinePromptPlanner.ts" \
  "$ROOT/src/features/clean-board/boardLabTests.ts"

printf '{"type":"commonjs"}\n' > "$OUT/package.json"

TEST_FILE="$(find "$OUT" -type f -name "boardLabTests.js" -print -quit)"
if [ -z "$TEST_FILE" ]; then
  echo "FAIL: compiled clean-board test file not found."
  find "$OUT" -type f -print
  exit 1
fi

node "$TEST_FILE"
