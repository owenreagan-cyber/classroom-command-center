#!/usr/bin/env bash
# Stage 2 cross-device sync — server + protocol + privacy filtering tests.
#
# Unlike this repo's other test:* scripts, this does NOT go through the
# tsc-compile-to-CommonJS-then-node pattern: the server
# (server/classroomSyncServer.ts) is a real ESM module using import.meta.url,
# and the whole point of the live integration test below is to exercise the
# actual server process as it really runs in production (`node
# server/classroomSyncServer.ts`), not a recompiled stand-in. Node 26's
# native TypeScript support (unflagged, confirmed via `node --version`) runs
# these .ts files directly.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "== sanitizer unit tests (poisoned payloads, Blank precedence) =="
node "$ROOT/src/lib/sync/sanitize-tests.ts"

echo
echo "== live integration test (real server + 2 real WebSocket clients) =="
node "$ROOT/scripts/classroom-sync-livetest.ts"
