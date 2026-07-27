#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/.local/curriculum-pack-importer-tests"

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
  "$ROOT/src/features/teacher-dock/types.ts" \
  "$ROOT/src/features/workspace/types.ts" \
  "$ROOT/src/features/curriculum/types.ts" \
  "$ROOT/src/features/curriculum-library-fetcher/types.ts" \
  "$ROOT/src/features/curriculum-pack-importer/types.ts" \
  "$ROOT/src/features/curriculum-pack-importer/packScanner.ts" \
  "$ROOT/src/features/curriculum-pack-importer/lessonDetector.ts" \
  "$ROOT/src/features/curriculum-pack-importer/resourceMapper.ts" \
  "$ROOT/src/features/curriculum-pack-importer/lessonPackageBuilder.ts" \
  "$ROOT/src/features/curriculum-pack-importer/driveContract.ts" \
  "$ROOT/src/features/curriculum-pack-importer/packIndexBridge.ts" \
  "$ROOT/src/features/curriculum-pack-importer/fixtures/shurleyChapter1.fixture.ts" \
  "$ROOT/src/features/curriculum-pack-importer/tests.ts"

printf '{"type":"commonjs"}\n' > "$OUT/package.json"

TEST_FILE="$(find "$OUT" -type f -path "*/curriculum-pack-importer/tests.js" -print -quit)"
node "$TEST_FILE"
echo "Curriculum pack importer tests passed."
