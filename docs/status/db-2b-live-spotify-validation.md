# DB-2B — Live Spotify OAuth + Premium Device Validation

Status: **Bugfix complete + non-live validation PASS — live OAuth pending a real
Client ID / Premium login.**

Branch: `db-2b-live-spotify-validation`

## Summary

DB-2B is the live-integration validation phase for the DB-2A Spotify Level 2
vertical slice. Before any live OAuth could succeed, code review surfaced three
real bugs that would have broken the flow. These are fixed here and covered by
the existing + new tests.

## Bugs fixed

1. **OAuth callback never processed on return (critical).**
   `init()` was only called from inside `SpotifyTeacherPanel`, which mounts only
   in Edit mode *and* when the Spotify object is selected. The redirect URI is
   `http://localhost:5173/board-lab` (Spotify rejects query-string redirect
   URIs), so the callback lands in Present mode with no panel mounted → the
   authorization code was never exchanged.
   - Fix: `init()` now runs once at the `BoardLabPage` shell level (all modes).
   - `readInitialMode()` routes `code`/`error` params back to Edit mode.
   - `handleCallback` restores `?mode=edit` after a successful exchange.
   - `handleCallback` is guarded against double-invocation (React StrictMode
     runs effects twice in dev).

2. **Web Playback SDK player reference dropped.**
   The SDK `Player` was a local variable, so the browser device could not be
   disconnected and risked being torn down.
   - Fix: player is retained at module scope; added `disconnectSdkPlayer()`,
     called from the store's `disconnect`. `createSdkPlayer` is deduped.
   - `getOAuthToken` now uses a live token getter so a mid-session refresh is
     picked up instead of a stale token.

3. **Raw device IDs rendered into the DOM.**
   The teacher panel rendered the Spotify Connect device ID as a
   `data-spotify-device` attribute and as the React key.
   - Fix: device IDs are no longer written to the DOM; keys use a non-secret
     name/index. Transfer still closes over the real device object.

4. **Transfer success shown as an error.**
   "Playback transferred — press Play to start" was rendered with error styling.
   - Fix: added a distinct `noticeMessage` (emerald) separate from `errorMessage`
     (red).

## Setup steps used

1. `VITE_SPOTIFY_CLIENT_ID` and `VITE_SPOTIFY_REDIRECT_URI` are read from
   `import.meta.env` (no client secret).
2. `.env.local` is the local-only location (gitignored); `.env.example` is the
   committed template.
3. Redirect URI registered in the Spotify Developer Dashboard:
   - `http://localhost:5173/board-lab`
   - `http://127.0.0.1:5173/board-lab`
4. Helper: `bash scripts/check-spotify-env.sh` verifies `.env.local` is
   populated **without printing values**.

## Live validation results

| Item | Result |
| --- | --- |
| Live OAuth login | **PENDING** — no Client ID / `.env.local` present during this pass |
| Return to `/board-lab` | **PENDING** (logic verified by tests; not exercised live) |
| Token stored under `clean-board.spotify.*` | **PENDING** (storage module unit-tested) |
| No tokens printed/logged | **PASS** (wrapper log-guard test + manual grep) |
| Spotify Connect devices loaded | **PENDING** |
| Web Playback SDK browser device | **PENDING** (Premium-dependent) |
| Transfer playback | **PENDING** |
| Play / pause / next / previous | **PENDING** |
| Current-track metadata in teacher panel | **PENDING** |
| Present mode student-safe only | **PASS** (config-missing state renders safe placeholder) |
| iPad present-mode safety | **NOT TESTED** |

The live rows above require (a) a Spotify Developer app Client ID placed in
`.env.local` and (b) a manual Spotify Premium sign-in approving the scopes —
both outside this agent's credentials. The validation harness (dev server,
screenshots, env-check) is ready to run once those are provided.

## Screenshots captured (safe, no tokens/private data)

![Present mode — student-safe now-playing placeholder](db-2b-screenshots/spotify-present-safe-now-playing.png)

![Edit mode — Spotify setup-needed teacher panel](db-2b-screenshots/spotify-edit-setup-needed.png)

Connected/device-list screenshots will be added after live OAuth, with device
IDs, email, and account data not rendered/captured.

## Validation commands / results

| Command | Result |
| --- | --- |
| `npm run build` | PASS |
| `npm run test:clean-board` | PASS (14/14) |
| `npm run test:clean-board-spotify` | PASS (20/20) |
| `npm run test:display-import-guard` | PASS |
| `npm run test:display-bundle-guard` | PASS |
| `npm run test:teacher-dock` | PASS |
| `npm run test:display-studio` | PASS |
| `npm run test:display-composer` | PASS |
| `npm run lint` | WARN (3 pre-existing canvas-spike fast-refresh errors; 0 new) |

## PASS / WARN / FAIL

**PASS**

- Critical OAuth callback bug fixed and tested.
- SDK player lifecycle fixed (retain/disconnect/dedupe/live-token getter).
- No raw device IDs in the DOM.
- `hasCallbackParams` + callback routing tested.
- No token/code logging (test + grep).
- Build + all clean-board/display guards pass.
- No secrets, `.env`, or tokens committed.
- Documentation + safe screenshots created.

**WARN**

- Live OAuth / Premium / device / playback not exercised — no Client ID provided
  in this pass.
- Web Playback SDK device and transfer unproven against a live Premium account.
- Transfer may not autoplay (documented UI hint added).

**FAIL**

None.

## Confirmations

- No client secret introduced anywhere.
- No `.env` committed (only `.env.example`; `.env`/`.env.*` gitignored).
- No token, code, email, account ID, or device ID in screenshots or docs.
- Student-safe now-playing still whitelists via `toSafeNowPlaying`.
