#!/usr/bin/env bash
# DB-2A — Clean Board Spotify Level 2 tests.
# 1) Import guard: clean-board must not pull the old atmosphere embed or shell.
# 2) Compile + run pure-logic Spotify tests (PKCE, config, expiry, API, safety).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/.local/clean-board-spotify-tests"

rm -rf "$OUT"
mkdir -p "$OUT"

cleanup() {
  rm -rf "$OUT"
}
trap cleanup EXIT

# ── Import guard ──
echo "== clean-board spotify import guard =="
FORBIDDEN_IMPORT='classroom-atmosphere|SpotifyEmbedPlayer|SpotifyProvider|presentation-hub|display-studio|display-composer'
if grep -RInE "$FORBIDDEN_IMPORT" "$ROOT/src/features/clean-board" 2>/dev/null; then
  echo "FAIL: clean-board imports/references old classroom-atmosphere embed or hub/studio/composer shell"
  exit 1
fi
echo "PASS: clean-board has no old spotify embed or shell imports"

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
  "$ROOT/src/features/clean-board/spotify/spotifyTypes.ts" \
  "$ROOT/src/features/clean-board/spotify/spotifyConfig.ts" \
  "$ROOT/src/features/clean-board/spotify/spotifyPkce.ts" \
  "$ROOT/src/features/clean-board/spotify/spotifySafety.ts" \
  "$ROOT/src/features/clean-board/spotify/spotifyStorage.ts" \
  "$ROOT/src/features/clean-board/spotify/spotifyApi.ts" \
  "$ROOT/src/features/clean-board/spotify/spotifyAuth.ts" \
  "$ROOT/src/features/clean-board/spotify/spotifyTests.ts"

printf '{"type":"commonjs"}\n' > "$OUT/package.json"

TEST_FILE="$(find "$OUT" -type f -name "spotifyTests.js" -print -quit)"
if [ -z "$TEST_FILE" ]; then
  echo "FAIL: compiled clean-board spotify test file not found."
  find "$OUT" -type f -print
  exit 1
fi

node "$TEST_FILE"
