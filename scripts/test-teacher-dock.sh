#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/.local/teacher-dock-tests"

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
  "$ROOT/src/app/appRoute.ts" \
  "$ROOT/src/app/appRouteShell.ts" \
  "$ROOT/src/features/teacher-dock/types.ts" \
  "$ROOT/src/features/teacher-dock/toolRegistry.ts" \
  "$ROOT/src/features/teacher-dock/toolPanelIds.ts" \
  "$ROOT/src/features/teacher-dock/dockPersistence.ts" \
  "$ROOT/src/features/teacher-dock/tests.ts"

printf '{"type":"commonjs"}\n' > "$OUT/package.json"

TEST_FILE="$(find "$OUT" -type f -path "*/teacher-dock/tests.js" -print -quit)"
node "$TEST_FILE"
echo "Teacher command dock tests passed."
