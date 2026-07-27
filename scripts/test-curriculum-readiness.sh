#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/.local/curriculum-readiness-tests"

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
  "$ROOT/src/features/teacher-dock/toolCapabilities.ts" \
  "$ROOT/src/features/workspace/types.ts" \
  "$ROOT/src/features/curriculum/types.ts" \
  "$ROOT/src/features/curriculum/curriculumRegistry.ts" \
  "$ROOT/src/features/curriculum/lessonPlan.ts" \
  "$ROOT/src/features/curriculum/lessonPackage.ts" \
  "$ROOT/src/features/curriculum/pacingResolver.ts" \
  "$ROOT/src/features/curriculum/pacingStore.ts" \
  "$ROOT/src/features/curriculum-readiness/types.ts" \
  "$ROOT/src/features/curriculum-readiness/readinessRules.ts" \
  "$ROOT/src/features/curriculum-readiness/readinessScorer.ts" \
  "$ROOT/src/features/curriculum-readiness/readinessStore.ts" \
  "$ROOT/src/features/curriculum-library-fetcher/types.ts" \
  "$ROOT/src/features/curriculum-library-fetcher/resourceClassifier.ts" \
  "$ROOT/src/features/curriculum-library-fetcher/resourceScanner.ts" \
  "$ROOT/src/features/curriculum-library-fetcher/lessonPackageBuilder.ts" \
  "$ROOT/src/features/curriculum-library-fetcher/libraryIndexStore.ts" \
  "$ROOT/src/features/curriculum-library-fetcher/fixtures/saxonMathLessons.fixture.ts" \
  "$ROOT/src/features/curriculum-library-fetcher/drive/driveSync.ts" \
  "$ROOT/src/features/curriculum-library-fetcher/drive/driveCache.ts" \
  "$ROOT/src/features/curriculum-library-fetcher/drive/driveMapper.ts" \
  "$ROOT/src/features/curriculum-library-fetcher/drive/types.ts" \
  "$ROOT/src/features/curriculum-pack-importer/types.ts" \
  "$ROOT/src/features/curriculum-pack-importer/packScanner.ts" \
  "$ROOT/src/features/curriculum-pack-importer/lessonDetector.ts" \
  "$ROOT/src/features/curriculum-pack-importer/resourceMapper.ts" \
  "$ROOT/src/features/curriculum-pack-importer/lessonPackageBuilder.ts" \
  "$ROOT/src/features/curriculum-pack-importer/packIndexBridge.ts" \
  "$ROOT/src/features/curriculum-pack-importer/fixtures/shurleyChapter1.fixture.ts" \
  "$ROOT/src/features/device-manager/types.ts" \
  "$ROOT/src/features/device-manager/capabilities.ts" \
  "$ROOT/src/features/device-manager/displayTargetService.ts" \
  "$ROOT/src/features/curriculum-readiness/tests.ts"

printf '{"type":"commonjs"}\n' > "$OUT/package.json"

TEST_FILE="$(find "$OUT" -type f -path "*/curriculum-readiness/tests.js" -print -quit)"
node "$TEST_FILE"
echo "Curriculum readiness tests passed."
