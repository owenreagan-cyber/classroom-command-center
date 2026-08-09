#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/.local/curriculum-fetcher-tests"

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
  "$ROOT/src/features/workspace/types.ts" \
  "$ROOT/src/features/curriculum/types.ts" \
  "$ROOT/src/features/curriculum/curriculumRegistry.ts" \
  "$ROOT/src/features/curriculum/lessonPlan.ts" \
  "$ROOT/src/features/curriculum/lessonPackage.ts" \
  "$ROOT/src/features/curriculum/pacingResolver.ts" \
  "$ROOT/src/features/curriculum/pacingStore.ts" \
  "$ROOT/src/features/omninote-bridge/types.ts" \
  "$ROOT/src/features/curriculum-library-fetcher/types.ts" \
  "$ROOT/src/features/curriculum-library-fetcher/resourceClassifier.ts" \
  "$ROOT/src/features/curriculum-library-fetcher/resourceScanner.ts" \
  "$ROOT/src/features/curriculum-library-fetcher/lessonPackageBuilder.ts" \
  "$ROOT/src/features/curriculum-library-fetcher/fixtures/saxonMathLessons.fixture.ts" \
  "$ROOT/src/features/curriculum-pack-importer/types.ts" \
  "$ROOT/src/features/curriculum-pack-importer/packScanner.ts" \
  "$ROOT/src/features/curriculum-pack-importer/lessonDetector.ts" \
  "$ROOT/src/features/curriculum-pack-importer/resourceMapper.ts" \
  "$ROOT/src/features/curriculum-pack-importer/lessonPackageBuilder.ts" \
  "$ROOT/src/features/curriculum-pack-importer/packIndexBridge.ts" \
  "$ROOT/src/features/curriculum-pack-importer/fixtures/shurleyChapter1.fixture.ts" \
  "$ROOT/src/features/curriculum-readiness/types.ts" \
  "$ROOT/src/features/curriculum-readiness/readinessRules.ts" \
  "$ROOT/src/features/curriculum-readiness/readinessScorer.ts" \
  "$ROOT/src/features/curriculum-readiness/readinessStore.ts" \
  "$ROOT/src/features/curriculum-library-fetcher/drive/types.ts" \
  "$ROOT/src/features/curriculum-library-fetcher/drive/driveProvider.ts" \
  "$ROOT/src/features/curriculum-library-fetcher/drive/driveMapper.ts" \
  "$ROOT/src/features/curriculum-library-fetcher/drive/driveCache.ts" \
  "$ROOT/src/features/curriculum-library-fetcher/drive/driveSync.ts" \
  "$ROOT/src/features/curriculum-library-fetcher/drive/tests.ts" \
  "$ROOT/src/features/curriculum-library-fetcher/libraryIndexStore.ts" \
  "$ROOT/src/features/curriculum-library-fetcher/tests.ts"

printf '{"type":"commonjs"}\n' > "$OUT/package.json"

TEST_FILE="$(find "$OUT" -type f -path "*/curriculum-library-fetcher/drive/tests.js" -print -quit)"
node "$TEST_FILE"
TEST_FILE="$(find "$OUT" -type f -path "*/curriculum-library-fetcher/tests.js" -print -quit)"
node "$TEST_FILE"
echo "Curriculum library fetcher tests passed."

echo "Checking curriculum library storage keys are distinct..."
python3 - <<'INNER_PY'
from pathlib import Path
import re
import sys

library_types = Path("src/features/curriculum-library/types.ts").read_text()
fetcher_types = Path("src/features/curriculum-library-fetcher/types.ts").read_text()

library_match = re.search(r"LIBRARY_STORAGE_KEY = '([^']+)'", library_types)
fetcher_match = re.search(r"FETCHER_STORAGE_KEY = '([^']+)'", fetcher_types)

if not library_match or not fetcher_match:
    print("FAIL: could not find curriculum storage key constants")
    sys.exit(1)

library_key = library_match.group(1)
fetcher_key = fetcher_match.group(1)

if library_key == fetcher_key:
    print(f"FAIL: curriculum library and fetcher storage keys collide: {library_key}")
    sys.exit(1)

print(f"PASS: library key ({library_key}) and fetcher key ({fetcher_key}) are distinct")
INNER_PY
