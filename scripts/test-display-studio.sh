#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/.local/display-studio-tests"

rm -rf "$OUT"
mkdir -p "$OUT"

cleanup() {
  rm -rf "$OUT"
}
trap cleanup EXIT

"$ROOT/node_modules/.bin/tsc" \
  --ignoreConfig \
  --target ES2022 \
  --module CommonJS \
  --moduleResolution Node \
  --ignoreDeprecations "6.0" \
  --esModuleInterop \
  --skipLibCheck \
  --outDir "$OUT" \
  "$ROOT/src/data/types.ts" \
  "$ROOT/src/data/backgroundAssets.ts" \
  "$ROOT/src/features/display-composer/types.ts" \
  "$ROOT/src/features/display-composer/backgroundStyles.ts" \
  "$ROOT/src/features/display-composer/defaultScreens.ts" \
  "$ROOT/src/features/display-composer/displayComposerLogic.ts" \
  "$ROOT/src/features/display-composer/displaySafe.ts" \
  "$ROOT/src/features/display-composer/displaySafetyRules.ts" \
  "$ROOT/src/features/display-composer/quickStartTemplates.ts" \
  "$ROOT/src/features/display-studio/studioWidgets.ts" \
  "$ROOT/src/features/display-studio/displayStudioTypes.ts" \
  "$ROOT/src/lib/displayStudioTestHelpers.ts" \
  "$ROOT/src/lib/canvasWidgetOverlapDetector.ts" \
  "$ROOT/src/lib/statusWidgetSlots.ts" \
  "$ROOT/src/lib/displayTemplateAudit.ts" \
  "$ROOT/src/lib/display-studio-tests.ts"

printf '{"type":"commonjs"}\n' > "$OUT/package.json"

TEST_FILE="$(find "$OUT" -type f -path "*/lib/display-studio-tests.js" -print -quit)"

if [ -z "$TEST_FILE" ]; then
  echo "FAIL: compiled display studio test file was not found."
  find "$OUT" -type f -print
  exit 1
fi

node "$TEST_FILE"


# ── Phase 15L.1: Broader student-facing renderer safety scan ──
# Scans every file that can mount on /display for forbidden teacher-only or
# implementation phrases. This generalizes the earlier single-file hotfix guard
# so the leaked-note regression (and similar mistakes) cannot return.
echo "Checking student-facing renderer files for forbidden phrases..."
DISPLAY_RENDERER_FILES=(
  "src/app/StudentDisplayShell.tsx"
  "src/features/display-composer/DisplayScreenRenderer.tsx"
  "src/features/display-composer/WidgetDisplayOverlay.tsx"
  "src/features/display-composer/DisplayComposerOverlay.tsx"
  "src/features/display-composer/HundredBoardDisplayWidget.tsx"
  "src/features/display-composer/elements/ClockBlock.tsx"
  "src/features/display-composer/elements/TimerSlot.tsx"
  "src/features/display-composer/elements/MaterialsCardView.tsx"
  "src/features/display-composer/elements/ChecklistCardView.tsx"
  "src/features/lotto-board/LottoBoardStudentDisplay.tsx"
  "src/features/jobs-manager/JobsManagerStudentDisplay.tsx"
)

FORBIDDEN_PHRASES=(
  "I'll actually do this differently"
  "actually do this differently"
  "update key layout areas"
  "teacherNotes"
  "console.log"
)

SAFETY_FAILED=0
for file in "${DISPLAY_RENDERER_FILES[@]}"; do
  if [ ! -f "$ROOT/$file" ]; then
    echo "WARN: student-facing renderer file not found: $file"
    continue
  fi
  for phrase in "${FORBIDDEN_PHRASES[@]}"; do
    if grep -RInq -- "$phrase" "$ROOT/$file"; then
      echo "FAIL: forbidden phrase \"$phrase\" found in $file"
      SAFETY_FAILED=1
    fi
  done
done

if [ "$SAFETY_FAILED" -eq 1 ]; then
  echo "FAIL: student-facing renderer scan found forbidden phrases"
  exit 1
fi
echo "PASS: student-facing renderer files are clean"

echo ""
echo "Phase 15L.2-15L.3: Checking duplicate chrome collapse + slot system..."
FAILED=0

# Send to Display must NOT have active controls in Presenter or Inspector
if grep -qE "onClick=\{sendCurrentToDisplay\}|>Send to Display<" \
  src/features/display-studio/DisplayStudioPresenter.tsx; then
  echo "FAIL: Send to Display action still found in DisplayStudioPresenter.tsx"
  FAILED=1
fi
if grep -qE "sendToDisplay\(screen\.id\)|data-studio-action=\"send-to-display\"" \
  src/features/display-studio/DisplayStudioInspector.tsx; then
  echo "FAIL: Send to Display action still found in DisplayStudioInspector.tsx"
  FAILED=1
fi

# Clear Display must NOT have active controls in Presenter or Inspector
if grep -qE "onClick=\{clearDisplay\}|>Clear Display<" \
  src/features/display-studio/DisplayStudioPresenter.tsx; then
  echo "FAIL: Clear Display action still found in DisplayStudioPresenter.tsx"
  FAILED=1
fi
if grep -qE "onClick=\{clearDisplay\}|data-studio-action=\"clear-display\"" \
  src/features/display-studio/DisplayStudioInspector.tsx; then
  echo "FAIL: Clear Display action still found in DisplayStudioInspector.tsx"
  FAILED=1
fi

# Blank/Restore active controls must NOT be in Presenter
if grep -qE "onClick=\{blankDisplay\}|onClick=\{unblankDisplay\}|>Blank Screen<|>Restore Display<" \
  src/features/display-studio/DisplayStudioPresenter.tsx; then
  echo "FAIL: Blank/Restore active controls still found in DisplayStudioPresenter.tsx"
  FAILED=1
fi

# Templates button must NOT be in CommandBar
if grep -qE "toggleTemplatePicker|templatePickerOpen" \
  src/features/display-studio/DisplayStudioCommandBar.tsx; then
  echo "FAIL: Templates button still found in DisplayStudioCommandBar.tsx"
  FAILED=1
fi

# Inspector must NOT call togglePresenterMode
if grep -qE "togglePresenterMode" \
  src/features/display-studio/DisplayStudioInspector.tsx; then
  echo "FAIL: togglePresenterMode still found in DisplayStudioInspector.tsx"
  FAILED=1
fi

# Presenter must NOT import or call clearDisplay, blankDisplay, or unblankDisplay
if grep -qE "clearDisplay|blankDisplay|unblankDisplay" \
  src/features/display-studio/DisplayStudioPresenter.tsx; then
  echo "FAIL: clearDisplay/blankDisplay/unblankDisplay still found in DisplayStudioPresenter.tsx"
  FAILED=1
fi

# Browse Templates must remain in ThumbnailRail
if ! grep -qE "Browse Templates" \
  src/features/display-studio/DisplayStudioThumbnailRail.tsx; then
  echo "FAIL: Browse Templates missing from DisplayStudioThumbnailRail.tsx"
  FAILED=1
fi

if [ "$FAILED" -eq 0 ]; then
  echo "PASS: Duplicate chrome collapse guards verified"
else
  exit 1
fi

