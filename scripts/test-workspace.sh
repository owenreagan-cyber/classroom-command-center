#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/.local/workspace-tests"

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
  "$ROOT/src/data/types.ts" \
  "$ROOT/src/data/routineTypes.ts" \
  "$ROOT/src/data/scheduleModel.ts" \
  "$ROOT/src/features/curriculum/types.ts" \
  "$ROOT/src/features/curriculum/curriculumRegistry.ts" \
  "$ROOT/src/features/curriculum/lessonPlan.ts" \
  "$ROOT/src/features/curriculum/pacingResolver.ts" \
  "$ROOT/src/features/teacher-dock/types.ts" \
  "$ROOT/src/features/teacher-dock/toolRegistry.ts" \
  "$ROOT/src/features/teacher-dock/toolCapabilities.ts" \
  "$ROOT/src/features/workspace/types.ts" \
  "$ROOT/src/features/workspace/workspaceRegistry.ts" \
  "$ROOT/src/features/workspace/workspacePersistence.ts" \
  "$ROOT/src/features/workspace/workspaceResolver.ts" \
  "$ROOT/src/features/workspace/tests.ts"

printf '{"type":"commonjs"}\n' > "$OUT/package.json"

TEST_FILE="$(find "$OUT" -type f -path "*/workspace/tests.js" -print -quit)"
node "$TEST_FILE"
echo "Workspace intelligence tests passed."
