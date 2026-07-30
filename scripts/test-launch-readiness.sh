#!/usr/bin/env bash
# Phase 11D — Launch readiness validation (build, lint, route smoke, privacy, handoff).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# shellcheck source=scripts/ensure-playwright-host-env.sh
source "$ROOT/scripts/ensure-playwright-host-env.sh"

echo "========================================"
echo "  Launch Readiness — Phase 11D"
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
run_step "Route + launch smoke (e2e)" npx playwright test tests/e2e/launch-readiness.spec.ts
run_step "Display privacy regression (e2e)" npx playwright test tests/e2e/display-privacy-regression.spec.ts
run_step "OmniNote handoff unit tests" npm run test:omninote-handoff
run_step "OmniNote command-center handoff" npm run test:omninote-command-center-handoff
run_step "Offline curriculum cache smoke" bash "$ROOT/scripts/test-offline-cache-smoke.sh"

echo "========================================"
if [ "$FAIL" -eq 0 ]; then
  echo "  LAUNCH READINESS PASSED"
else
  echo "  LAUNCH READINESS FAILED — see errors above"
  exit 1
fi
echo "========================================"
