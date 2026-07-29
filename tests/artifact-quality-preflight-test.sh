#!/usr/bin/env bash
# Tests for Instructional Artifact Quality preflight validators.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
cd "${repo_root}"

echo "Running artifact quality preflight tests..."

python3 -m pytest tests/artifact_quality/test_preflight.py tests/artifact_quality/test_visual_geometry.py tests/artifact_quality/test_educational_layout.py -v || {
  echo "FAIL: artifact quality preflight unit tests failed"
  exit 1
}

fixtures_root="tests/fixtures/artifact_quality"
legacy_root="fixtures/artifact-quality"
python3 - <<'PY'
from pathlib import Path
import sys
sys.path.insert(0, str(Path.cwd()))
from scripts.artifact_quality.fixture_builder import ensure_phase2_fixtures, ensure_all_fixtures
ensure_phase2_fixtures(Path("tests/fixtures/artifact_quality"))
ensure_all_fixtures(Path("fixtures/artifact-quality"))
PY

for bucket in passing warning failing; do
  [[ -d "${legacy_root}/${bucket}" ]] || {
    echo "FAIL: missing fixture bucket ${bucket}"
    exit 1
  }
done

pass_out="$(mktemp "${TMPDIR:-/tmp}/artifact-pass.XXXXXX")"
python3 scripts/artifact_quality/run_preflight.py \
  --profile worksheet-letter \
  --input "${fixtures_root}/pass_worksheet.pdf" >"${pass_out}" 2>&1
grep -q 'FINAL STATUS: PASS' "${pass_out}" || {
  echo "FAIL: passing fixture did not PASS"
  cat "${pass_out}"
  rm -f "${pass_out}"
  exit 1
}
rm -f "${pass_out}"

warn_out="$(mktemp "${TMPDIR:-/tmp}/artifact-warn.XXXXXX")"
python3 scripts/artifact_quality/run_preflight.py \
  --profile worksheet-letter \
  --input "${fixtures_root}/warn_whitespace.pdf" >"${warn_out}" 2>&1 || true
grep -q 'FINAL STATUS: WARN' "${warn_out}" || {
  echo "FAIL: warning fixture did not WARN"
  cat "${warn_out}"
  rm -f "${warn_out}"
  exit 1
}
rm -f "${warn_out}"

fail_out="$(mktemp "${TMPDIR:-/tmp}/artifact-fail.XXXXXX")"
set +e
python3 scripts/artifact_quality/run_preflight.py \
  --profile worksheet-letter \
  --input "${fixtures_root}/fail_clipping.pdf" >"${fail_out}" 2>&1
fail_code=$?
set -e
[[ "${fail_code}" -ne 0 ]] || {
  echo "FAIL: failing fixture must exit nonzero"
  cat "${fail_out}"
  rm -f "${fail_out}"
  exit 1
}
grep -q 'FINAL STATUS: FAIL' "${fail_out}" || {
  echo "FAIL: failing fixture did not report FAIL"
  cat "${fail_out}"
  rm -f "${fail_out}"
  exit 1
}
rm -f "${fail_out}"

compare_out="$(mktemp "${TMPDIR:-/tmp}/artifact-compare.XXXXXX")"
python3 scripts/artifact_quality/run_preflight.py \
  --profile teacher-key-letter \
  --subject shurley \
  --student "${legacy_root}/passing/guided-notes-two-page.pdf" \
  --teacher "${legacy_root}/passing/teacher-key-two-page.pdf" >"${compare_out}" 2>&1
grep -q 'Student and teacher pagination match' "${compare_out}" || {
  echo "FAIL: student/key comparison missing expected PASS line"
  cat "${compare_out}"
  rm -f "${compare_out}"
  exit 1
}
rm -f "${compare_out}"

echo "PASS: artifact quality preflight tests complete"
