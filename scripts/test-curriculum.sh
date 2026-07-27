#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/.local/curriculum-tests"

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
  "$ROOT/src/features/teacher-dock/types.ts" \
  "$ROOT/src/features/curriculum/types.ts" \
  "$ROOT/src/features/curriculum/curriculumRegistry.ts" \
  "$ROOT/src/features/curriculum/lessonPlan.ts" \
  "$ROOT/src/features/curriculum/lessonPackage.ts" \
  "$ROOT/src/features/curriculum/pacingResolver.ts" \
  "$ROOT/src/features/curriculum/pacingStore.ts" \
  "$ROOT/src/features/curriculum/tests.ts"

printf '{"type":"commonjs"}\n' > "$OUT/package.json"

TEST_FILE="$(find "$OUT" -type f -path "*/curriculum/tests.js" -print -quit)"
node "$TEST_FILE"
echo "Curriculum pacing tests passed."

bash "$ROOT/scripts/test-curriculum-pack-importer.sh"
bash "$ROOT/scripts/test-curriculum-readiness.sh"
