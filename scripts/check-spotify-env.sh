#!/usr/bin/env bash
# DB-2B — Spotify local env sanity check (no values printed).
#
# Verifies the local Vite env file is present and populated for the live
# Spotify Level 2 validation, WITHOUT echoing any client id or redirect value.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT/.env.local"

fail=0

if [ ! -f "$ENV_FILE" ]; then
  echo "MISSING: .env.local (copy .env.example to .env.local and fill in values)"
  exit 1
fi

check_var() {
  local key="$1"
  # Extract a non-empty value after 'KEY=' without printing it.
  if ! grep -qE "^${key}=[^[:space:]]+" "$ENV_FILE"; then
    echo "MISSING/EMPTY: $key"
    fail=1
  else
    echo "OK: $key is set"
  fi
}

check_var VITE_SPOTIFY_CLIENT_ID
check_var VITE_SPOTIFY_REDIRECT_URI

echo ""
if [ "$fail" -ne 0 ]; then
  echo "FAIL: Spotify env is not fully configured. See .env.example."
  exit 1
fi

echo "PASS: Spotify env is configured (values not printed)."
echo "Remember to register the redirect URI in the Spotify Developer Dashboard:"
echo "  http://localhost:5173/board-lab"
echo "  http://127.0.0.1:5173/board-lab"
