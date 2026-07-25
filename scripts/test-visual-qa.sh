#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ARTIFACT_DIR="$ROOT/.local/visual-qa/phase-9c"

mkdir -p "$ARTIFACT_DIR"

echo "Phase 9C visual QA — artifact directory: $ARTIFACT_DIR"

"$ROOT/node_modules/.bin/playwright" test tests/e2e/visual-qa-display.spec.ts

echo ""
echo "Visual QA screenshots:"
find "$ARTIFACT_DIR" -type f -name '*.png' | sort
