# DB-7A — Clean Board Host Display Mode for M1

> Status: **COMPLETE**
> Phase: DB-7A — dedicated student display route for the MacBook Air M1

## Purpose

Turn Clean Board into a true classroom display host for the MacBook Air M1. The
M1 should no longer show the older Classroom Command Center dashboard/editor
shell when it is projecting to a room. Instead, opening `/display` presents a
clean, large, readable, student-safe Clean Board with zero teacher chrome.

```
MacBook Pro = development machine
MacBook Air M1 = classroom display host
iPad = teacher remote/controller  (future phase)
```

## Route to open on the M1

```bash
cd ~/Projects/classroom-command-center
npm run dev -- --host 0.0.0.0
```

- M1 local route: `http://localhost:5173/display`
- Network / iPad route: `http://M1_IP_ADDRESS:5173/display`

## How this differs from editor mode

| Concern | `/board-lab?mode=edit` | `/board-lab?mode=present` | `/display` (host) |
|---------|------------------------|---------------------------|-------------------|
| Board content | teacher-authored page | projected page | projected page |
| Header / mode toggle | visible | visible | **none** |
| Template / saved-boards panels | visible | hidden | **none** |
| Editor toolbar / image upload | visible | hidden | **none** |
| Spotify builder / timer / message editors | visible | hidden | **none** |
| Page dots | visible | visible | **none** |
| Full-bleed, no scrollbars | — | — | **yes** |
| Auto keep-awake | teacher toggle | — | **on (silent)** |

The host route is **student-facing by default**: it never mounts teacher-only
components, and it reuses the exact same student-safe projection path as
`/board-lab?mode=present` (`toSafeBoardPage` → `projectPageForDisplayMode`).

## State model — no parallel system

The display route consumes normal Clean Board state:

```
template / scene / page
        ↓
normal Clean Board state  (clean-board.board.state / .autosave)
        ↓
projection / display helpers  (displayHost.ts)
        ↓
student display route  (/display)
```

`resolveHostDisplayPage` resolves the active board in priority order and never
throws:

1. active **scene** → its referenced layout + the scene's display mode
2. active **layout** → that layout + its display mode
3. **autosave** → the last teacher-authored page
4. **default** → "Morning Arrival — New Classroom" template

On a fresh M1 with no saved state, `/display` therefore shows the Morning
Arrival welcome board immediately (welcome message card, three-timer morning
routine, `morning-glow` background, Spotify placeholder).

## Files changed

- `src/features/clean-board/displayHost.ts` (new) — pure state resolver
  (`resolveHostDisplayPage`, `projectHostDisplayPage`, `defaultHostDisplayPage`,
  `loadHostDisplayState`).
- `src/features/clean-board/BoardHostDisplay.tsx` (new) — full-bleed,
  present-only host component (renders `BoardCanvas`, no chrome, silent wake lock).
- `src/App.tsx` — routes `/display` to the lazy-loaded `BoardHostDisplay`.
- `scripts/test-clean-board.sh` — compiles `displayHost.ts` in the test lane.
- `src/features/clean-board/boardLabTests.ts` — 8 new host-display tests.

## Safety

- The host never renders teacher-only components, template/saved-boards panels,
  the Spotify builder, image upload, or debug controls.
- The projected page is sanitized via `toSafeBoardPage` (teacher notes stripped,
  hidden objects dropped, widget configs whitelisted) then filtered by the
  active display mode (e.g. assessment hides Spotify/images).
- `resolveHostDisplayPage` recovers gracefully from missing/corrupt active ids,
  falling back to the safe default template.

## Validation

- `npm run test:clean-board` — 154 passed, 0 failed (8 new host-display tests).
- `npm run test:clean-board-spotify` — 69 passed, 0 failed.
- `npm run build` — passes; `BoardHostDisplay` emitted as a 1.4 kB lazy chunk.
- `npm run test:display-import-guard` / `test:display-bundle-guard` — pass.
- `npm run test:teacher-dock` / `test:display-studio` / `test:display-composer` — pass.
- `npm run lint` — only the 3 pre-existing `canvas-spike` fast-refresh errors remain.

## Deferred (next phases)

- **DB-7B — Teacher Remote Control**: full iPad remote control of the host.
- **DB-7C — Prompt-Based Routine Builder**: AI routine generation.
- **DB-7D — M1 Auto-Launch Classroom Appliance**: LaunchAgent auto-start + `.app`.

Also deferred: live Spotify now-playing sync onto the host (the placeholder
renders as an idle "Classroom Music / Nothing playing" card until DB-7B pushes
playback state), websocket/live sync, generated backgrounds, and packaged launcher.
