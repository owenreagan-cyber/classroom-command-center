# Clean Display Board — Spotify Level 2 Architecture

> Phase: **DB-0** — architecture only. No OAuth implementation yet.
> Level 1 today: `src/features/classroom-atmosphere/` uses Spotify **embeds** (iframe) with no OAuth.

## 1. What "Level 2" means

Level 1 (current) = Spotify **embed iframe**; playback happens inside the embed; no API access.

Level 2 (target) = Spotify **Web API + Web Playback SDK**:

- OAuth **Authorization Code with PKCE** (no client secret in the browser).
- Spotify **Connect device selection**.
- Playback controls: **play / pause / skip**.
- **Current track metadata**.
- Playlist presets / modes.
- **Teacher-only controls** + optional **student-safe now-playing widget**.
- Graceful handling of the **Spotify Premium requirement**.

## 2. Constraints (hard)

- No client secret in the browser — PKCE only.
- No secrets committed — client id comes from environment/build config, never `.env` committed.
- No hardcoded real account data.
- No school private data.
- No OAuth token printed to logs.
- Tokens stored only in local/dev-safe storage for MVP, with the risk documented.

## 3. OAuth flow — Authorization Code + PKCE

```
[Teacher clicks "Connect Spotify"]
        │
        ▼
1. Generate code_verifier (random 43–128 chars) + code_challenge = SHA256(verifier), base64url
        │
        ▼
2. Redirect to https://accounts.spotify.com/authorize
   params: response_type=code, client_id, redirect_uri, code_challenge,
           code_challenge_method=S256, scope, state (CSRF nonce)
        │
        ▼
3. Spotify redirects back to the app with ?code=...&state=...
   app verifies state nonce matches
        │
        ▼
4. Exchange code for tokens: POST https://accounts.spotify.com/api/token
   body: grant_type=authorization_code, code, redirect_uri, client_id, code_verifier
        │
        ▼
5. Store { access_token, refresh_token, expires_in } in teacher-only local storage
        │
        ▼
6. Refresh access token silently: grant_type=refresh_token + refresh_token (no client secret)
```

### 3.1 Scopes (minimum viable)

```
user-read-playback-state    # read current track / playback position
user-modify-playback-state  # play / pause / skip
user-read-currently-playing # now-playing metadata
```

Optionally (defer unless needed): `streaming` is **not** an OAuth scope — Web Playback SDK access is
gated by account tier (Premium), not a scope.

## 4. Client architecture

```
src/features/board-lab/spotify/
├── types.ts            # SpotifyState, NowPlaying, connection status (see data model doc)
├── pkce.ts             # generateCodeVerifier / generateCodeChallenge (pure, testable)
├── oauth.ts            # buildAuthorizeUrl, exchangeCodeForToken, refreshToken
├── tokenStore.ts       # teacher-only local storage for tokens; never logged, never committed
├── sdk.ts              # Web Playback SDK loader + player lifecycle (device_id capture)
├── connect.ts          # device selection via Spotify Connect (GET /v1/me/player/devices)
├── playback.ts         # play/pause/skip + transfer playback (PUT /v1/me/player)
├── nowPlaying.ts       # poll GET /v1/me/player/currently-playing
└── spotifyStore.ts     # zustand store — teacher view (with token) and student view (metadata only)
```

## 5. Web Playback SDK (browser Spotify Connect device)

- The Web Playback SDK lets the browser act as a Spotify Connect device, so the teacher can start
  playback from the board app itself and control it via the Web API.
- Loading the SDK: include the Spotify Web Playback SDK script (loaded lazily), create a `Player`,
  `player.connect()`, then read `player.deviceId` after the `ready` event.
- **Premium requirement:** playback via the SDK **requires Spotify Premium**. Detect a non-premium
  account early and surface a **clear, calm "Spotify Premium required"** message rather than erroring.
- Because SDK playback is device-driven, the app can also fall back to **Spotify Connect** (start
  playback on another device the account owns) if the browser device is unavailable.

### 5.1 Premium handling (graceful)

1. On connect, if token exchange or SDK init indicates a free account, set status `premiumRequired`.
2. Teacher UI shows a single, friendly message with a link to Spotify Premium.
3. The student-safe now-playing widget simply shows nothing (or a neutral "Music" state).
4. No retry loop — do not repeatedly re-attempt SDK init for a free account.

## 6. Device selection (Spotify Connect)

```
GET /v1/me/player/devices   → list of available devices (id, name, type, is_active)
PUT /v1/me/player           → { device_ids: [id] } to transfer playback to a chosen device
```

- The browser SDK device (if active) is one selectable device.
- Teacher picks a target device from a compact list; the app remembers the last selection.

## 7. Playback controls

```
PUT /v1/me/player/play      → play (optionally with context_uri for a playlist preset)
PUT /v1/me/player/pause     → pause
POST /v1/me/player/next     → skip next
POST /v1/me/player/previous → skip previous (optional)
PUT /v1/me/player/volume    → set volume (see §10 iPad caveat)
```

## 8. Now-playing widget (student-safe)

- Poll `GET /v1/me/player/currently-playing` at a low frequency (e.g. 10–15s) **only** when connected.
- Render **only** safe fields: track name, artist name, album art URL. Never render tokens, device ids,
  or teacher-only state.
- The student-safe projection is a **separate** `NowPlaying` object (see data model), never the raw API
  payload.

## 9. Playlist presets / modes

- Reuse the **concept** of `CLASSROOM_PLAYLISTS` from `src/features/classroom-atmosphere/playlists.ts`
  (curated, school-safe, mode-tagged), but store the Spotify **playlist URI** (`spotify:playlist:...`)
  instead of embed URIs, since Level 2 starts playback via the Web API `context_uri`.
- Presets map to classroom modes: calm arrival, independent work, reading, math focus, cleanup,
  celebration (the existing `MusicMode` set is a good starting taxonomy).
- Teacher can override with a custom playlist URI.

## 10. iOS / iPad volume caveat

- On iOS/iPad, volume is typically controlled by the **physical device** (and the system may restrict
  programmatic volume changes). **Do not promise full iPad volume control** in the product.
- The UI should treat volume as best-effort and hide/disable the volume control on platforms that don't
  support it.

## 11. Security & secret handling

- **Client id** is not secret and is provided at build time (e.g. `import.meta.env.VITE_SPOTIFY_CLIENT_ID`),
  documented as non-secret. It is the only Spotify value in the frontend build config.
- **No client secret** is used at any point (PKCE flow).
- **Tokens** (access + refresh) live in teacher-only local storage for MVP. Documented risks:
  - Local storage is accessible to any JS on the origin (XSS risk).
  - Refresh token longevity means a leak is higher-impact than an access token leak.
  - MVP accepts this; a server-side token proxy is the later hardening path.
- **Logging:** no `console.log` of tokens, authorization codes, or full auth URLs. A code/state
  scrubber is applied before any diagnostics.
- **.env:** never committed. A `.env.example` documents the one non-secret variable; real values are
  excluded via `.gitignore`.

## 12. State machine

```
disconnected → authenticating → authenticated ──► premiumRequired (if free account)
                                   │
                                   ├──► active (playing / paused)
                                   │        └──► error (recoverable)
                                   └──► error (unrecoverable)
```

- `authenticating` is transient; on failure return to `disconnected` or `error`.
- `premiumRequired` is terminal for SDK playback but the teacher may still use Spotify Connect to another
  owned device.

## 13. Out of scope for DB-0

- No OAuth code, no SDK loading, no API calls implemented yet.
- No server-side proxy (documented as the later hardening path).
- No secret values of any kind.
