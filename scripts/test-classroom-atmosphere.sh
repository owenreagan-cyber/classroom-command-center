#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/.local/atmosphere-tests"

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
  "$ROOT/src/features/classroom-atmosphere/types.ts" \
  "$ROOT/src/features/classroom-atmosphere/playlists.ts" \
  "$ROOT/src/features/classroom-atmosphere/atmosphereStore.ts" \
  "$ROOT/src/features/classroom-atmosphere/tests.ts"

printf '{"type":"commonjs"}\n' > "$OUT/package.json"

TEST_FILE="$(find "$OUT" -type f -path "*/classroom-atmosphere/tests.js" -print -quit)"
node "$TEST_FILE"
echo "Classroom atmosphere tests passed."
