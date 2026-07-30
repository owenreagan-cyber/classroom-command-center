#!/usr/bin/env bash
# Repeatable classroom hardware smoke-test helper (automated checks + manual checklist).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# shellcheck source=scripts/ensure-playwright-host-env.sh
source "$ROOT/scripts/ensure-playwright-host-env.sh"

HOST="${CLASSROOM_SMOKE_HOST:-127.0.0.1}"
PORT="${CLASSROOM_SMOKE_PORT:-5173}"
TEACHER_URL="http://${HOST}:${PORT}/control"
DISPLAY_URL="http://${HOST}:${PORT}/display"

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

echo "========================================"
echo "  Classroom Hardware Smoke Workflow"
echo "========================================"
echo ""

run_step "Dependencies (node + npm)" bash -c 'command -v node >/dev/null && command -v npm >/dev/null'
run_step "Build" npm run build
run_step "Lint" npm run lint
run_step "Playwright host diagnosis" npm run test:playwright-host
run_step "Noise control tests" npm run test:noise-control
run_step "Launch readiness (subset)" bash -c '
  npm run test:routines
  npm run test:student-picker
  npm run test:random-number
  npm run test:teacher-dock
  npm run test:timers
'

echo "----------------------------------------"
echo "  Local dev server"
echo "----------------------------------------"
echo ""
echo "Start the Vite dev server in a separate terminal:"
echo "  cd \"$ROOT\" && npm run dev"
echo ""
echo "Default bind: 127.0.0.1 (local only)."
echo ""
echo "Optional LAN access for iPad browser testing (trusted network only):"
echo "  npm run dev -- --host 0.0.0.0"
echo "  Do not expose the dev server to the public internet."
echo "  OmniNote is not required for this smoke test."
echo ""
echo "Teacher Control URL:  $TEACHER_URL"
echo "Student Display URL:  $DISPLAY_URL"
echo ""
echo "Full manual checklist:"
echo "  docs/qa/classroom-hardware-smoke-test.md"
echo ""
echo "----------------------------------------"
echo "  Manual checklist (abbreviated)"
echo "----------------------------------------"
cat <<'CHECKLIST'

Startup
  [ ] /control and /display load without console errors
  [ ] Refresh restores route and persisted state
  [ ] Offline works after initial load (where supported)

Classroom screens
  [ ] Homeroom, Math, Reading, Snack/Lunch, Ready Position, Vibe/atmosphere

Content & timers
  [ ] Morning Message, Do Now, Materials, cards, inline edit, Beautify, Undo
  [ ] Timers: start/pause/resume/add/reset/sync across display

Noise (Teacher Dock → Noise Control)
  [ ] Homeroom / Math / Reading levels independent
  [ ] Traffic light on student display; no teacher reset controls on /display
  [ ] Refresh restores each tracker

Student tools
  [ ] Student Picker, Mystery Star, Prize Board, Random Number — display privacy OK

Display
  [ ] Fullscreen / popup fallback
  [ ] Readable at 1920×1080 and 1366×768
  [ ] No teacher-only information on /display

CHECKLIST

echo "========================================"
if [ "$FAIL" -eq 0 ]; then
  echo "  AUTOMATED SMOKE CHECKS PASSED"
  echo "  MANUAL HARDWARE CHECK REQUIRED — see docs/qa/classroom-hardware-smoke-test.md"
else
  echo "  AUTOMATED SMOKE CHECKS FAILED"
  exit 1
fi
echo "========================================"
