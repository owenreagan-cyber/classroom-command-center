#!/usr/bin/env bash
# Stage 2 cross-device sync server -- one process, one port, serving the
# production build of /control and /display AND hosting the WebSocket sync
# endpoint (server/classroomSyncServer.ts). Replaces `vite preview` for
# classroom use once cross-device sync is in play.
#
# Usage:
#   npm run classroom:serve
# Env:
#   CLASSROOM_SYNC_PORT   default 4180
#   CLASSROOM_SYNC_HOST   default 0.0.0.0 (LAN-reachable, e.g. from an iPad)
#   SKIP_BUILD=1          skip the build step (use the existing dist/ as-is)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [ "${SKIP_BUILD:-0}" != "1" ]; then
  echo "Building production bundle..."
  npm run build
fi

echo "Starting classroom sync server..."
exec node "$ROOT/server/classroomSyncServer.ts"
