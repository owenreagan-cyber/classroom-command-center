#!/usr/bin/env bash
# Complete execution matrix for Phase 2 Visual Preflight.
set -euo pipefail

echo "==> Running Phase 2 Visual Preflight Testing Matrix..."

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

BASELINE_BRANCH="$(git branch --show-current)"
BASELINE_STATUS="$(git status --porcelain | grep -vE '^\?\? \.local/' || true)"
BASELINE_STASH="$(git stash list)"

mkdir -p .local/artifact-quality
FIXTURES="tests/fixtures/artifact_quality"
OUT_ROOT=".local/artifact-quality/phase2-suite"

python3 - <<'PY'
from pathlib import Path
import sys
sys.path.insert(0, str(Path.cwd()))
from scripts.artifact_quality.fixture_builder import ensure_phase2_fixtures, ensure_all_fixtures
ensure_phase2_fixtures(Path("tests/fixtures/artifact_quality"))
ensure_all_fixtures(Path("fixtures/artifact-quality"))
PY

# 1. Python unit and integration tests.
ARTIFACT_QUALITY_INSIDE_PHASE2_SUITE=1 python3 -m pytest tests/artifact_quality/ -v

# 2. CLI help and argument parsing.
python3 scripts/artifact_quality/run_preflight.py --help > /dev/null

# 3. PASS fixture.
python3 scripts/artifact_quality/run_preflight.py \
  --input "${FIXTURES}/pass_worksheet.pdf" \
  --profile worksheet-letter \
  --output-dir "${OUT_ROOT}/pass" \
  --annotate \
  --contact-sheet \
  --render \
  --json

# 4. WARN fixture.
python3 scripts/artifact_quality/run_preflight.py \
  --input "${FIXTURES}/warn_whitespace.pdf" \
  --profile worksheet-letter \
  --output-dir "${OUT_ROOT}/warn" \
  --json

# 5. FAIL fixture.
if python3 scripts/artifact_quality/run_preflight.py \
  --input "${FIXTURES}/fail_clipping.pdf" \
  --profile worksheet-letter \
  --output-dir "${OUT_ROOT}/fail" \
  --strict; then
  echo "FAIL: Clipped fixture unexpectedly passed."
  exit 1
else
  echo "PASS: Clipped fixture failed as expected."
fi

# 6. Student/key page-count mismatch.
if python3 scripts/artifact_quality/run_preflight.py \
  --student "${FIXTURES}/student_two_pages.pdf" \
  --teacher "${FIXTURES}/key_three_pages.pdf" \
  --profile teacher-key-letter \
  --output-dir "${OUT_ROOT}/page-mismatch" \
  --visual-compare \
  --strict; then
  echo "FAIL: Student/key page mismatch unexpectedly passed."
  exit 1
else
  echo "PASS: Student/key page mismatch failed as expected."
fi

# 7. Output boundary verification.
UNAPPROVED_FILES="$(
  git status --porcelain |
  grep -vE '^\?\? \.local/' |
  grep -vE '^\?\? tests/fixtures/artifact_quality/.*\.pdf$' |
  grep -vE '^\?\? fixtures/artifact-quality/' || true
)"

if [[ "$UNAPPROVED_FILES" != "$BASELINE_STATUS" && -n "$UNAPPROVED_FILES" ]]; then
  echo "FAIL: Unexpected working-tree changes:"
  echo "$UNAPPROVED_FILES"
  exit 1
fi

# 8. Git-state preservation.
FINAL_BRANCH="$(git branch --show-current)"
FINAL_STASH="$(git stash list)"

if [[ "$FINAL_BRANCH" != "$BASELINE_BRANCH" ]]; then
  echo "FAIL: Branch changed during the suite."
  exit 1
fi

if [[ "$FINAL_STASH" != "$BASELINE_STASH" ]]; then
  echo "FAIL: Stash list changed during the suite."
  exit 1
fi

echo "==> ALL PHASE 2 TESTS PASSED SUCCESSFULLY."
