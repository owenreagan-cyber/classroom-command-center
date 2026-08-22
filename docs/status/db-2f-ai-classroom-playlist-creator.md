# DB-2F — AI Classroom Playlist Creator

## Feature purpose

Add an AI-assisted planning layer on top of the existing DB-2C Spotify Playlist
Builder. A teacher describes a classroom need in free text; the app produces a
structured **search strategy** (not final tracks, not a playlist). The strategy
feeds the existing Spotify track search, and every track still flows through the
teacher review/staging/approval flow before any playlist is created.

AI **never** creates a playlist or adds tracks without teacher approval.

## Architecture

```
Teacher prompt
      ↓
playlistAiProvider.generatePlan(input)   ← provider abstraction (deterministic fallback)
      ↓
PlaylistPlan { title, classroomPurpose, durationMinutes, energy,
               requirements[], searchQueries[], teacherNotes }
      ↓
AiPlaylistPromptBuilder → searchForTracks(query)   ← existing spotifyStore action
      ↓
existing Spotify search results → teacher staging → teacher approval
      ↓
existing addTracksToPlaylist() / createPlaylist()
```

## AI / provider boundary

- `playlistAiProvider.ts` defines `PlaylistPromptGenerator` (an interface with
  `generatePlan(input): Promise<PlaylistPlan>`).
- `deterministicPlaylistGenerator` implements it offline with no API key: it
  keyword-matches the goal against the recipe library, falls back to the
  requested energy band, and emits a plan.
- `playlistPromptGenerator` is the default export — a live vendor can be
  swapped in later without changing the UI or the review/safety path.
- Plans are validated and sanitized via `isValidPlaylistPlan` /
  `sanitizePlaylistPlan` before entering app state.

## Playlist workflow

1. Teacher enters a goal, duration, energy, and restrictions.
2. Click **Generate Playlist Plan**.
3. A plan card renders: title, purpose, requirements, and clickable search
   queries.
4. Each search query triggers the existing Spotify track search.
5. Teacher stages candidates for review (explicit tracks stay visible/flagged).
6. Teacher approves, and the existing builder creates a **private** playlist and
   adds the approved tracks.

## Safety rules

- Explicit tracks remain visible — never hidden.
- Teacher approval is required before any tracks are added.
- Present mode receives no AI controls: `AiPlaylistPromptBuilder` is rendered
  only inside `SpotifyPlaylistBuilder`, which is mounted only inside the
  teacher panel (edit mode). It is never part of the board/present projection.
- AI-generated text never reaches the student display.
- No student data enters prompts; `PlaylistPromptInput` carries only a goal
  string, duration, energy, and restriction strings.
- No tokens/secrets are logged. `sanitizePlaylistPlan` drops forbidden keys
  (token, secret, email, student data, device/user ids).
- No secrets stored in board state; plans live only in teacher-panel React state.

## Fallback behavior

- The default generator is deterministic and requires no network or API key.
- Tests and the classroom flow work offline.
- A live AI API can be added later by implementing `PlaylistPromptGenerator`.

## Files

- `src/features/clean-board/spotify/playlistAiProvider.ts` (new) — plan types,
  validation/sanitization, deterministic generator.
- `src/features/clean-board/spotify/AiPlaylistPromptBuilder.tsx` (new) — teacher
  prompt form + plan card.
- `src/features/clean-board/spotify/SpotifyPlaylistBuilder.tsx` — mounts the AI
  builder above the manual sections.
- `src/features/clean-board/spotify/playlistRecipes.ts` — expanded to 11 recipes
  with `category` (reading, seasonal fall/winter/spring, etc.).
- `src/features/clean-board/spotify/spotifyTypes.ts` — added `PlaylistCategory`
  and the `category` field.
- `src/features/clean-board/spotify/spotifyTests.ts` — added AI plan tests.
- `scripts/test-clean-board-spotify.sh` — added `playlistAiProvider.ts` to the
  compile list.

## Validation results

| Command | Result |
| --- | --- |
| `test:clean-board-spotify` | 69 passed, 0 failed |
| `test:clean-board` | 20 passed, 0 failed |
| `build` | PASS (BoardLabPage gzip 15.39 kB) |
| `test:display-import-guard` | PASS |
| `test:display-bundle-guard` | PASS |
| `test:teacher-dock` | PASS |
| `test:display-studio` | 124 passed |
| `test:display-composer` | PASS |
| `lint` | 3 pre-existing canvas-spike fast-refresh errors only |

## PASS / WARN / FAIL

- **PASS:** teacher prompt → structured plan → search queries → existing review
  flow; present mode stays student-safe; no secrets; existing Spotify features
  unchanged.
- **WARN:** the AI provider is a deterministic fallback (no live vendor yet);
  generated search results remain teacher-reviewed; plan titles come from the
  matched recipe template.
- **FAIL:** none.

## No-secrets confirmation

- No `.env`/`.env.local`, tokens, auth codes, client secret, emails, or private
  screenshots committed.
- `sanitizePlaylistPlan` and `planHasNoForbiddenKeys` enforce no token/secret/
  student-data fields in plans, covered by unit tests.
