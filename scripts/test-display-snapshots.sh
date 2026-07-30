#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=scripts/ensure-playwright-host-env.sh
source "$ROOT/scripts/ensure-playwright-host-env.sh"
SNAPSHOT_DIR="$ROOT/tests/e2e/display-snapshots.spec.ts-snapshots"

echo "Phase 9C.1 display snapshot baselines — snapshot directory: $SNAPSHOT_DIR"

"$ROOT/node_modules/.bin/playwright" test tests/e2e/display-snapshots.spec.ts

echo ""
echo "Tracked baseline snapshots:"
find "$SNAPSHOT_DIR" -type f -name '*.png' 2>/dev/null | sort || true
