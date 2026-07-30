#!/usr/bin/env bash
# Prefer native Playwright browser cache on the host when Cursor sandbox overrides the path.
# Safe to source from test scripts; does not delete browsers or install packages.

if [[ -n "${PLAYWRIGHT_BROWSERS_PATH:-}" ]] && [[ "$PLAYWRIGHT_BROWSERS_PATH" == *cursor-sandbox-cache* ]]; then
  echo "WARN: PLAYWRIGHT_BROWSERS_PATH points at Cursor sandbox cache; using default Playwright browser location."
  unset PLAYWRIGHT_BROWSERS_PATH
fi
