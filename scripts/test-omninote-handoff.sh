#!/usr/bin/env bash
# Compile and run OmniNote handoff export tests (Phase 11C).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/.local/omninote-handoff-tests"

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
  --types node \
  --outDir "$OUT" \
  "$ROOT/src/features/curriculum/types.ts" \
  "$ROOT/src/features/workspace/types.ts" \
  "$ROOT/src/features/curriculum-readiness/types.ts" \
  "$ROOT/src/features/curriculum-readiness/readinessScorer.ts" \
  "$ROOT/src/features/curriculum-readiness/readinessRules.ts" \
  "$ROOT/src/features/curriculum-readiness/readinessStore.ts" \
  "$ROOT/src/features/curriculum-library-fetcher/types.ts" \
  "$ROOT/src/features/curriculum-library-fetcher/resourceClassifier.ts" \
  "$ROOT/src/features/curriculum-library-fetcher/resourceScanner.ts" \
  "$ROOT/src/features/curriculum-library-fetcher/lessonPackageBuilder.ts" \
  "$ROOT/src/features/curriculum-library-fetcher/fixtures/saxonMathLessons.fixture.ts" \
  "$ROOT/src/features/curriculum-library-fetcher/drive/driveCache.ts" \
  "$ROOT/src/features/curriculum-library-fetcher/drive/driveSync.ts" \
  "$ROOT/src/features/curriculum-library-fetcher/drive/driveProvider.ts" \
  "$ROOT/src/features/curriculum-library-fetcher/drive/driveMapper.ts" \
  "$ROOT/src/features/curriculum-library-fetcher/libraryIndexStore.ts" \
  "$ROOT/src/features/curriculum-pack-importer/types.ts" \
  "$ROOT/src/features/curriculum-pack-importer/lessonDetector.ts" \
  "$ROOT/src/features/curriculum-pack-importer/packScanner.ts" \
  "$ROOT/src/features/curriculum-pack-importer/resourceMapper.ts" \
  "$ROOT/src/features/curriculum-pack-importer/lessonPackageBuilder.ts" \
  "$ROOT/src/features/curriculum-pack-importer/packIndexBridge.ts" \
  "$ROOT/src/features/curriculum-pack-importer/fixtures/shurleyChapter1.fixture.ts" \
  "$ROOT/src/features/omninote-handoff/types.ts" \
  "$ROOT/src/features/omninote-handoff/privacy.ts" \
  "$ROOT/src/features/omninote-handoff/omniNoteUrl.ts" \
  "$ROOT/src/features/omninote-handoff/lessonPackageExport.ts" \
  "$ROOT/src/features/omninote-handoff/localHandoffWriter.ts" \
  "$ROOT/src/features/omninote-handoff/tests.ts"

printf '{"type":"commonjs"}\n' > "$OUT/package.json"

TEST_FILE="$(find "$OUT" -type f -path "*/omninote-handoff/tests.js" -print -quit)"
node "$TEST_FILE"
echo "OmniNote handoff export tests passed."
