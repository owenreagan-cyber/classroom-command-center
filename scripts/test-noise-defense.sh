#!/usr/bin/env bash
# Hero Academy Defense System (docs/architecture/noise-game-design.md) --
# Villain Pressure mechanics revision.
# 1) Isolation guard: the noise-defense feature must never depend on the
#    legacy manual "Noise Tower Defense" widget (src/lib/noiseTowers.ts,
#    src/board/NoiseControlPanel.tsx, src/widgets/NoiseStatusCard.tsx,
#    src/features/teacher-dock/toolPanels/NoiseToolPanel.tsx,
#    src/store/boardStore.ts) -- see the design doc's "critical distinction"
#    section: this is a new, separate feature area, not an extension of that
#    widget, and retiring that widget from the launcher never touches its
#    underlying files.
# 2) Compile + run three pure-logic (tsc + node, no browser/DOM) test files:
#    - tests.ts: the Villain Pressure engine (pressure fill/decay/dwell,
#      strikes, recovery, protocols, tower order/decay, Regroup, Comms
#      Jammer, manual overrides, mic-denied, mission-complete tiering).
#    - hudGate-tests.ts: Stage 0's per-screen HUD opt-in gate, including the
#      Assessment Mode structural-exclusion guarantee.
#    - micSession-tests.ts: mic shutdown -- every getUserMedia track is
#      actually stopped on pause/end/unmount (all three reach the same
#      `stop()` path -- see that file's header comment) and on device loss.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/.local/noise-defense-tests"

rm -rf "$OUT"
mkdir -p "$OUT"

cleanup() {
  rm -rf "$OUT"
}
trap cleanup EXIT

# ── Isolation guard ──
echo "== noise-defense / legacy noise tracker isolation guard =="
# Matches only actual import/require statements (not doc-comment prose that
# merely explains why the new feature avoids these files).
FORBIDDEN_IMPORTS="^\s*import .*(noiseTowers|NoiseControlPanel|NoiseStatusCard|NoiseToolPanel|boardStore)"
PROTECTED_PATHS=(
  "$ROOT/src/features/noise-defense"
)
if grep -RInE "$FORBIDDEN_IMPORTS" "${PROTECTED_PATHS[@]}" 2>/dev/null; then
  echo "FAIL: noise-defense references the legacy manual noise widget or boardStore"
  exit 1
fi
echo "PASS: noise-defense has no dependency on the legacy noise tracker"

# ── Compile + run pure-logic tests ──
"$ROOT/node_modules/.bin/tsc" \
  --ignoreConfig \
  --target ES2022 \
  --module CommonJS \
  --moduleResolution Node \
  --ignoreDeprecations "6.0" \
  --esModuleInterop \
  --skipLibCheck \
  --types node \
  --outDir "$OUT" \
  "$ROOT/src/features/noise-defense/types.ts" \
  "$ROOT/src/features/noise-defense/constants.ts" \
  "$ROOT/src/features/noise-defense/engine.ts" \
  "$ROOT/src/features/noise-defense/tests.ts" \
  "$ROOT/src/features/noise-defense/hudGate.ts" \
  "$ROOT/src/features/noise-defense/hudGate-tests.ts" \
  "$ROOT/src/features/noise-defense/micEngine.ts" \
  "$ROOT/src/features/noise-defense/micSession-tests.ts"

printf '{"type":"commonjs"}\n' > "$OUT/package.json"

run_compiled_test() {
  local basename="$1"
  local file
  file="$(find "$OUT" -type f -name "$basename" -print -quit)"
  if [ -z "$file" ]; then
    echo "FAIL: compiled test file $basename not found."
    find "$OUT" -type f -print
    exit 1
  fi
  echo "== running $basename =="
  node "$file"
}

run_compiled_test "tests.js"
run_compiled_test "hudGate-tests.js"
run_compiled_test "micSession-tests.js"
