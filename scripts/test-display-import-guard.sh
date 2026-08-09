#!/usr/bin/env bash
# Phase 15M: /display import guard
# Fails if /display route or StudentDisplayShell imports tldraw, @tldraw/*, konva, or react-konva.
# This enforces the canvas engine Display Boundary Decision:
# /display must remain engine-agnostic, student-safe, and watermark-free.

set -euo pipefail

echo "== /display import guard =="

DISPLAY_GUARD_PATTERN='tldraw|@tldraw|konva|react-konva'
PROTECTED_DIRS=(
  "src/app/StudentDisplayShell.tsx"
  "src/features/student-display"
  "src/features/display"
)

VIOLATIONS=$(grep -RIn -E "$DISPLAY_GUARD_PATTERN" "${PROTECTED_DIRS[@]}" 2>/dev/null || true)

if [ -n "$VIOLATIONS" ]; then
  echo "FAIL: /display imports a disallowed engine dependency:"
  echo "$VIOLATIONS"
  exit 1
else
  echo "PASS: /display is clean — no tldraw, @tldraw/*, konva, or react-konva imports"
fi
