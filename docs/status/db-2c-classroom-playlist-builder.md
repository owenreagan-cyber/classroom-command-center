# DB-2C — Classroom Playlist Builder + Spotify Playlist API

**Branch:** `db-2c-classroom-playlist-builder`
**Base:** `db-2b-live-spotify-validation` (DB-2B not yet merged to `main` at time of work)

## Summary

Added a teacher-only classroom playlist builder to the Clean Board Spotify
integration. Teachers can load their existing Spotify playlists, create a new
**private** classroom playlist, search tracks, stage tracks for explicit review,
add approved tracks, save playlists as local presets, and launch a playlist
through the existing playback path.

This is a teacher-reviewed, school-safe workflow — **not** an autonomous DJ and
**not** a public playlist generator.

## Scopes added

Added to `SPOTIFY_SCOPES` in `spotifyTypes.ts` (alongside the existing playback
scopes):

- `playlist-read-private`
- `playlist-modify-private`

`playlist-modify-public` is **not** requested. Playlists always default private
in this phase.

## Playlist API functions added (`spotifyApi.ts`)

| Function | Endpoint | Notes |
| --- | --- | --- |
| `fetchUserProfile` | `GET /v1/me` | Used only to get the user id for playlist creation |
| `fetchUserPlaylists` | `GET /v1/me/playlists` | Maps `public` flag + owner name |
| `searchTracks` | `GET /v1/search?type=track` | Maps explicit flag, duration, artwork |
| `createPlaylist` | `POST /v1/users/{id}/playlists` | Body always `public: false` |
| `addTracksToPlaylist` | `POST /v1/playlists/{id}/tracks` | Body `{ uris }` |
| `play` (existing) | `PUT /v1/me/player/play` | Reused for `context_uri` launch |

Pure body builders `buildCreatePlaylistBody` and `buildAddTracksBody` are
exported for request-shape testing.

## Teacher workflow

1. In the teacher-only Spotify panel (Edit mode), a **Playlist builder** section
   appears when connected.
2. **Load mine** fetches the teacher's playlists; each shows a `private` badge.
3. **Create** makes a new private playlist (default-private, no public toggle).
4. **Search tracks** returns candidate cards with title, artist, album art,
   duration, and a red **explicit** badge.
5. Tracks are **staged** (not added). A staged list titled "Needs teacher review"
   collects them; only an explicit **Add N track(s)** commit issues the API call.
6. **Save** stores a playlist as a local preset (by `spotify:playlist:<id>` URI).
7. Presets can be **launched** through the existing playback path.
8. Present mode never renders the builder — the teacher panel is not mounted in
   present mode, and the student-safe now-playing projection is whitelist-only.

## AI design

`playlistRecipes.ts` provides 7 deterministic recipe templates:

- Morning Arrival Calm
- Independent Work Focus
- Math Work Instrumental
- Writing Time Piano
- Clean Up Cue
- Rainy Day Calm
- Test Mode Quiet

Each recipe includes title, classroom use, suggested duration, energy level, an
avoid list, search queries, and a teacher note. Every recipe carries
"Needs teacher review" language. No external AI API is wired; recipes are
template-based starting points for search queries only.

## Privacy / safety rules

- School playlists default **private** (no public write scope).
- Tracks are never auto-added — search only reads; add requires explicit review.
- Explicit tracks are surfaced (not hidden).
- No recommendation endpoints used; only search queries + teacher judgment.
- Presets are stored under `clean-board.spotify.playlist_presets` and
  whitelist-validated (`sanitizePresets` / `isValidPresetUri`), so no token or
  account data can persist in a preset.
- Account-derived state (playlists, search results, user profile) is cleared on
  disconnect.

## Validation results

| Command | Result |
| --- | --- |
| `npm run test:clean-board-spotify` | PASS — 53 passed, 0 failed |
| `npm run test:clean-board` | PASS — 16 passed, 0 failed |
| `npm run build` | PASS — `tsc -b && vite build` |
| `npm run test:display-import-guard` | PASS |
| `npm run test:display-bundle-guard` | PASS |
| `npm run test:teacher-dock` | PASS |
| `npm run test:display-studio` | PASS — 124 passed |
| `npm run test:display-composer` | PASS |
| `npm run lint` | 3 pre-existing canvas-spike fast-refresh errors (unchanged) |

## Tests added (`spotifyTests.ts`)

- Scopes include private read/write, never public write.
- `buildCreatePlaylistBody` always defaults private.
- `buildAddTracksBody` wraps track URIs.
- `createPlaylist` posts a private-only body.
- `addTracksToPlaylist` posts URIs to the correct endpoint.
- `searchTracks` surfaces the explicit flag and metadata.
- `searchTracks` only reads — never auto-adds.
- Launching a playlist uses a context URI, not a secret.
- API headers carry only the bearer token, never a client secret.
- `fetchUserPlaylists` maps the private flag and owner.
- `isValidPresetUri` / `sanitizePresets` validation.
- Recipes are deterministic and mark teacher review.
- Student-safe projection drops playlist-builder fields.

## PASS / WARN / FAIL

**PASS**

- Teacher can list/load existing playlists.
- Teacher can create a private playlist.
- Teacher can search tracks.
- Teacher can review and add tracks.
- Explicit tracks are visible/flagged.
- Teacher can save a playlist preset.
- Teacher can launch a playlist preset.
- Present mode remains student-safe.
- Tests/build pass.
- No secrets/tokens/.env committed.

**WARN**

- AI is template-based recipes only.
- Spotify search results still require teacher judgment.
- Public playlist creation deferred.
- Playlist cover images / editing deferred.

**FAIL**

- None.

## No-secrets confirmation

No `.env`, `.env.local`, access tokens, refresh tokens, auth codes, account
email, raw device IDs, or private screenshots were committed. No client secret
was introduced. The Authorization Code with PKCE flow is unchanged.
