#!/usr/bin/env bash
# Kiosk launcher for the classroom TV -- /display, no browser chrome.
#
# Builds (if needed) and serves the app, then opens /display in Google
# Chrome kiosk mode: fullscreen, no address bar, no tabs, no menu bar --
# positioned on the external display (the TV, via AirPlay or HDMI extended
# display), so it comes up truly full screen with no manual step.
#
# Usage:
#   npm run display:launch
# Or double-click a launcher on the M1 -- see "Classroom display setup" in
# the README for how to set that up.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PORT="${DISPLAY_PORT:-4173}"
URL="http://localhost:${PORT}/display"

# ── Where is the TV? ──────────────────────────────────────────────────
# Chrome's --window-position places the window's top-left corner in macOS's
# combined desktop coordinate space (all displays laid out side by side per
# System Settings -> Displays -> arrangement). To find the right value:
#
#   1. Open System Settings -> Displays -> arrangement tab and confirm how
#      the TV is positioned relative to the M1's built-in display (usually
#      placed directly to one side).
#   2. If the TV is to the RIGHT of the built-in display, its X offset is
#      the built-in display's width IN POINTS (not pixels -- Retina
#      displays report resolution in pixels, which is 2x points). Run:
#        system_profiler SPDisplaysDataType | grep -A2 Resolution
#      and check "UI Looks like" for the points value, e.g. a MacBook Air
#      M1's built-in display is usually "1440 x 900" in points even though
#      its pixel resolution is higher.
#   3. Set DISPLAY_POSITION_X (and _Y, usually 0) below to match, or
#      override per run without editing the script:
#        DISPLAY_POSITION_X=1440 npm run display:launch
DISPLAY_POSITION_X="${DISPLAY_POSITION_X:-1440}"
DISPLAY_POSITION_Y="${DISPLAY_POSITION_Y:-0}"

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
if [ ! -x "$CHROME" ]; then
  echo "FAIL: Google Chrome not found at:"
  echo "  $CHROME"
  echo "Install Chrome, or edit CHROME= at the top of this script if it's"
  echo "installed somewhere else."
  exit 1
fi

# ── Ensure the server is running ──────────────────────────────────────
if ! curl -sf "http://localhost:${PORT}" >/dev/null 2>&1; then
  echo "No server on port ${PORT} yet -- building and starting one..."
  npm run build
  npm run preview -- --port "$PORT" --strictPort >/dev/null 2>&1 &
  SERVER_PID=$!
  echo "Preview server started (pid ${SERVER_PID}). It keeps running after"
  echo "this script exits, so the display can reload/reconnect on its own --"
  echo "stop it later with: kill ${SERVER_PID}"
  for _ in $(seq 1 30); do
    curl -sf "http://localhost:${PORT}" >/dev/null 2>&1 && break
    sleep 0.5
  done
fi

echo "Launching ${URL} in Chrome kiosk mode at position ${DISPLAY_POSITION_X},${DISPLAY_POSITION_Y}..."
"$CHROME" \
  --kiosk \
  --app="$URL" \
  --window-position="${DISPLAY_POSITION_X},${DISPLAY_POSITION_Y}" \
  --no-first-run \
  --disable-session-crashed-bubble \
  --disable-infobars \
  >/dev/null 2>&1 &

echo "Chrome kiosk launched. To exit: Cmd+Q (there is no window chrome to click)."
