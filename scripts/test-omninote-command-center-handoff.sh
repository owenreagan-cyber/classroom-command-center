#!/usr/bin/env bash
# End-to-end Command Center → OmniNote local handoff validation.
set -euo pipefail

CC_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OMNI_ROOT="${OMNI_ROOT:-$HOME/Projects/omninote}"
HANDOFF_DIR="$CC_ROOT/.local/omninote-handoff"
OUT="$CC_ROOT/.local/omninote-handoff-build"

pass() { printf 'PASS: %s\n' "$*"; }
warn() { printf 'WARN: %s\n' "$*"; }
fail() { printf 'FAIL: %s\n' "$*"; }
section() { printf '\n=== %s ===\n' "$1"; }

section 'Command Center handoff export tests'
if bash "$CC_ROOT/scripts/test-omninote-handoff.sh"; then
  pass "Command Center omninote-handoff unit tests"
else
  fail "Command Center omninote-handoff unit tests"
  exit 1
fi

section 'Write Saxon + Shurley packages to .local/'
mkdir -p "$HANDOFF_DIR"
rm -rf "$OUT"
mkdir -p "$OUT"

"$CC_ROOT/node_modules/.bin/tsc" \
  --ignoreConfig \
  --target ES2022 \
  --module CommonJS \
  --moduleResolution Node \
  --ignoreDeprecations 6.0 \
  --esModuleInterop \
  --skipLibCheck \
  --types node \
  --outDir "$OUT" \
  "$CC_ROOT/src/features/curriculum/types.ts" \
  "$CC_ROOT/src/features/workspace/types.ts" \
  "$CC_ROOT/src/features/curriculum-readiness/types.ts" \
  "$CC_ROOT/src/features/curriculum-readiness/readinessScorer.ts" \
  "$CC_ROOT/src/features/curriculum-readiness/readinessRules.ts" \
  "$CC_ROOT/src/features/curriculum-readiness/readinessStore.ts" \
  "$CC_ROOT/src/features/curriculum-library-fetcher/types.ts" \
  "$CC_ROOT/src/features/curriculum-library-fetcher/resourceClassifier.ts" \
  "$CC_ROOT/src/features/curriculum-library-fetcher/resourceScanner.ts" \
  "$CC_ROOT/src/features/curriculum-library-fetcher/lessonPackageBuilder.ts" \
  "$CC_ROOT/src/features/curriculum-library-fetcher/fixtures/saxonMathLessons.fixture.ts" \
  "$CC_ROOT/src/features/curriculum-library-fetcher/drive/driveCache.ts" \
  "$CC_ROOT/src/features/curriculum-library-fetcher/drive/driveSync.ts" \
  "$CC_ROOT/src/features/curriculum-library-fetcher/drive/driveProvider.ts" \
  "$CC_ROOT/src/features/curriculum-library-fetcher/drive/driveMapper.ts" \
  "$CC_ROOT/src/features/curriculum-library-fetcher/libraryIndexStore.ts" \
  "$CC_ROOT/src/features/curriculum-pack-importer/types.ts" \
  "$CC_ROOT/src/features/curriculum-pack-importer/lessonDetector.ts" \
  "$CC_ROOT/src/features/curriculum-pack-importer/packScanner.ts" \
  "$CC_ROOT/src/features/curriculum-pack-importer/resourceMapper.ts" \
  "$CC_ROOT/src/features/curriculum-pack-importer/lessonPackageBuilder.ts" \
  "$CC_ROOT/src/features/curriculum-pack-importer/packIndexBridge.ts" \
  "$CC_ROOT/src/features/curriculum-pack-importer/fixtures/shurleyChapter1.fixture.ts" \
  "$CC_ROOT/src/features/omninote-handoff/types.ts" \
  "$CC_ROOT/src/features/omninote-handoff/privacy.ts" \
  "$CC_ROOT/src/features/omninote-handoff/omniNoteUrl.ts" \
  "$CC_ROOT/src/features/omninote-handoff/lessonPackageExport.ts" \
  "$CC_ROOT/src/features/omninote-handoff/localHandoffWriter.ts"

printf '{"type":"commonjs"}\n' > "$OUT/package.json"

CC_ROOT="$CC_ROOT" OUT="$OUT" node <<'NODE'
const ccRoot = process.env.CC_ROOT;
const outDir = process.env.OUT;
const fs = require('fs');
const path = require('path');
const { bootstrapPilotIndex, findFetchedLesson } = require(path.join(outDir, 'features/curriculum-library-fetcher/libraryIndexStore.js'));
const { prepareOmniNoteLessonHandoff, validateExportPrivacy } = require(path.join(outDir, 'features/omninote-handoff/lessonPackageExport.js'));
const { writeHandoffPackageToDisk } = require(path.join(outDir, 'features/omninote-handoff/localHandoffWriter.js'));

const state = bootstrapPilotIndex();
const saxon = findFetchedLesson(state.packages, 'math', 2);
const shurley = findFetchedLesson(state.packages, 'shurley', 3);
if (!saxon || !shurley) {
  console.error('FAIL: missing pilot lessons');
  process.exit(1);
}

for (const pkg of [saxon, shurley]) {
  const plan = prepareOmniNoteLessonHandoff(pkg, ccRoot);
  const errors = validateExportPrivacy(plan.package);
  if (errors.length) {
    console.error('FAIL: privacy', pkg.id, errors.join('; '));
    process.exit(1);
  }
  writeHandoffPackageToDisk(plan);
  fs.writeFileSync(path.join(path.dirname(plan.localPackagePath), 'omninote.url.txt'), plan.deepLink, 'utf8');
  console.log('PASS: wrote', plan.localPackagePath);
  console.log('LINK:', plan.deepLink);
}
NODE

section 'Privacy grep on generated packages'
PRIV_FAIL=0
for pkg in "$HANDOFF_DIR"/*/package.json; do
  if [[ ! -f "$pkg" ]]; then continue; fi
  if grep -Eiq 'access_token|bearer |canvas\.instructure|teacher-notes|answer-key|readiness|drivePath|@.*\.' "$pkg"; then
    fail "privacy violation in $pkg"
    PRIV_FAIL=1
  else
    pass "privacy clean: $pkg"
  fi
done
if [[ "$PRIV_FAIL" -ne 0 ]]; then exit 1; fi

section 'OmniNote compatibility validation'
if [[ -d "$OMNI_ROOT" ]]; then
  SAXON_PKG="$HANDOFF_DIR/saxon-math-lesson-02/package.json"
  if [[ -f "$SAXON_PKG" ]]; then
    if bash "$OMNI_ROOT/scripts/validate-omninote-handoff.sh" --package "$SAXON_PKG"; then
      pass "OmniNote validation script accepted Command Center package"
    else
      warn "OmniNote validation script reported warnings (see output above)"
    fi
  else
    warn "Saxon package not found at $SAXON_PKG"
  fi
else
  warn "OmniNote repo not found at $OMNI_ROOT — skipping OmniNote script"
fi

section 'Manual simulator commands'
if [[ -f "$HANDOFF_DIR/saxon-math-lesson-02/omninote.url.txt" ]]; then
  printf 'Saxon Math Lesson 2:\n  %s\n' "$(cat "$HANDOFF_DIR/saxon-math-lesson-02/omninote.url.txt")"
fi
if [[ -f "$HANDOFF_DIR/shurley-ch1-lesson-03/omninote.url.txt" ]]; then
  printf 'Shurley Chapter 1 Lesson 3:\n  %s\n' "$(cat "$HANDOFF_DIR/shurley-ch1-lesson-03/omninote.url.txt")"
fi
warn "iOS Simulator may require tapping Open on \"Open in OmniNote?\" confirmation"
warn "Physical iPad validation not run — remains WARN"

pass "End-to-end local handoff script complete"
