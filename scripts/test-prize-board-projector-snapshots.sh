#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=scripts/ensure-playwright-host-env.sh
source "$ROOT/scripts/ensure-playwright-host-env.sh"
SNAPSHOT_DIR="$ROOT/tests/e2e/prize-board-projector-snapshots.spec.ts-snapshots"
IPAD_SNAPSHOT_DIR="$ROOT/tests/e2e/prize-board-ipad-landscape-snapshots.spec.ts-snapshots"

echo "Phase 12C.1 prize board projector snapshot baselines — snapshot directory: $SNAPSHOT_DIR"
echo "Phase 12C.1.1 iPad landscape control snapshots — snapshot directory: $IPAD_SNAPSHOT_DIR"

"$ROOT/node_modules/.bin/playwright" test tests/e2e/prize-board-projector-snapshots.spec.ts
"$ROOT/node_modules/.bin/playwright" test tests/e2e/prize-board-ipad-landscape-snapshots.spec.ts

echo ""
echo "Tracked baseline snapshots:"
find "$SNAPSHOT_DIR" "$IPAD_SNAPSHOT_DIR" -type f -name '*.png' 2>/dev/null | sort || true
