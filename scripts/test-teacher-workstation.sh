#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "========================================"
echo "  Teacher Workstation — Master Validation"
echo "========================================"
echo ""

FAIL=0

run_step() {
  local label="$1"
  shift
  echo "▸ $label"
  if "$@"; then
    echo "  ✓ PASS"
  else
    echo "  ✗ FAIL"
    FAIL=1
  fi
  echo ""
}

run_step "Build" npm run build
run_step "Lint" npm run lint
run_step "Timer tests" npm run test:timers
run_step "Routine tests" npm run test:routines
run_step "Student picker tests" npm run test:student-picker
run_step "Prize board tests" npm run test:prize-board
run_step "Local packet tests" npm run test:local-packets
run_step "Morning message tests" npm run test:morning-message
run_step "App route tests" npm run test:app-route
run_step "Display polish tests" npm run test:display-polish
run_step "OmniNote bridge tests" npm run test:omninote-bridge
run_step "Classroom atmosphere tests" npm run test:classroom-atmosphere
run_step "Teacher dock tests" npm run test:teacher-dock
run_step "E2E tests" npm run test:e2e

echo "========================================"
if [ "$FAIL" -eq 0 ]; then
  echo "  ALL VALIDATION PASSED"
else
  echo "  VALIDATION FAILED — see errors above"
  exit 1
fi
echo "========================================"
