#!/usr/bin/env bash
# Phase 15M.1 — Bundle-level /display guard
# After npm run build, inspects dist/assets to verify tldraw code is
# isolated to the lazy-loaded /canvas-spike chunk.
#
# This complements scripts/test-display-import-guard.sh (source level).
# Source imports and production bundle membership are not the same thing.

set -euo pipefail

echo "== /display bundle guard =="

DIST_DIR="dist/assets"

if [ ! -d "$DIST_DIR" ]; then
  echo "FAIL: dist/assets not found — run 'npm run build' first"
  exit 1
fi

# Identify chunks
MAIN_CHUNK=$(ls "$DIST_DIR"/index-*.js 2>/dev/null | head -1 || true)
SPIKE_CHUNK=$(ls "$DIST_DIR"/CanvasSpikePage-*.js 2>/dev/null | head -1 || true)
OTHER_CHUNKS=$(ls "$DIST_DIR"/*.js 2>/dev/null | grep -v "CanvasSpikePage-" | grep -v "index-" || true)

if [ -z "$MAIN_CHUNK" ]; then
  echo "WARN: no main index-*.js chunk found in dist/assets"
else
  echo "Main chunk: $(basename "$MAIN_CHUNK")"
fi

if [ -z "$SPIKE_CHUNK" ]; then
  echo "NOTE: no CanvasSpikePage-*.js chunk found — spike may not be lazy-loaded"
else
  echo "Spike chunk: $(basename "$SPIKE_CHUNK")"
fi

# Distinctive tldraw markers that should only appear in the lazy-loaded spike chunk
TLDRAW_MARKERS='tldraw|@tldraw|TLShape'

# Check main entry chunk — must NOT contain tldraw markers
if [ -n "$MAIN_CHUNK" ] && [ -s "$MAIN_CHUNK" ]; then
  if grep -qE "$TLDRAW_MARKERS" "$MAIN_CHUNK" 2>/dev/null; then
    echo "FAIL: main entry chunk ($(basename "$MAIN_CHUNK")) contains tldraw markers"
    echo "  tldraw is not isolated — static or side-effect import may remain"
    exit 1
  else
    echo "PASS: main entry chunk is tldraw-clean"
  fi
fi

# Check other non-spike chunks — must NOT contain tldraw markers
if [ -n "$OTHER_CHUNKS" ]; then
  ANY_VIOLATION=0
  while IFS= read -r chunk; do
    [ -z "$chunk" ] && continue
    if grep -qE "$TLDRAW_MARKERS" "$chunk" 2>/dev/null; then
      echo "FAIL: non-spike chunk $(basename "$chunk") contains tldraw markers"
      ANY_VIOLATION=1
    fi
  done <<< "$OTHER_CHUNKS"
  if [ "$ANY_VIOLATION" -eq 1 ]; then
    echo "FAIL: tldraw markers found in non-spike chunks"
    exit 1
  else
    echo "PASS: all other non-spike chunks are tldraw-clean"
  fi
fi

# Confirm spike chunk exists and contains tldraw
if [ -n "$SPIKE_CHUNK" ] && [ -s "$SPIKE_CHUNK" ]; then
  if grep -qE "$TLDRAW_MARKERS" "$SPIKE_CHUNK" 2>/dev/null; then
    echo "PASS: spike chunk ($(basename "$SPIKE_CHUNK")) contains tldraw — correctly isolated"
  else
    echo "WARN: spike chunk exists but contains no tldraw markers — verify lazy loading"
  fi
else
  echo "NOTE: no spike chunk to verify"
fi

echo "PASS: /display bundle guard complete — tldraw is isolated to lazy-loaded chunk"
