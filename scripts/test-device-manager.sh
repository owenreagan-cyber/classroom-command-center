#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/.local/device-manager-tests"

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
  "$ROOT/src/features/device-manager/types.ts" \
  "$ROOT/src/features/device-manager/capabilities.ts" \
  "$ROOT/src/features/device-manager/deviceRegistry.ts" \
  "$ROOT/src/features/device-manager/devicePersistence.ts" \
  "$ROOT/src/features/device-manager/displayTargetService.ts" \
  "$ROOT/src/features/device-manager/launchResolver.ts" \
  "$ROOT/src/features/teacher-dock/types.ts" \
  "$ROOT/src/features/teacher-dock/toolCapabilities.ts" \
  "$ROOT/src/features/workspace/types.ts" \
  "$ROOT/src/features/workspace/workspaceRegistry.ts" \
  "$ROOT/src/features/device-manager/tests.ts"

printf '{"type":"commonjs"}\n' > "$OUT/package.json"

TEST_FILE="$(find "$OUT" -type f -path "*/device-manager/tests.js" -print -quit)"
node "$TEST_FILE"
echo "Device manager tests passed."
