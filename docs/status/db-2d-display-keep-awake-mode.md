# DB-2D — Display Keep Awake Mode

**Branch:** `db-2d-display-keep-awake-mode`
**Base:** `main` (`295a5cf Add classroom Spotify playlist builder`)

## Summary

Added a teacher-only **Keep Awake** toggle to the `/board-lab` edit controls.
When enabled, the board requests a browser screen wake lock
(`navigator.wakeLock.request('screen')`) where supported, so the display and
the Spotify session are less likely to sleep during classroom use.

This is scoped to the Mac/browser display flow. It does **not** introduce a
Tauri/native shell and does **not** run macOS `caffeinate`.

## What the toggle does

- **Enabled + supported browser** → requests a screen wake lock and shows
  "Keep Awake active".
- **Unsupported browser** → shows "Wake Lock unsupported in this browser".
- **Browser/OS releases the lock** → shows "Wake Lock released; click to
  re-enable".
- **Tab returns to foreground while enabled** → re-acquires the lock and shows
  "Reacquiring…".
- **Disabled or component unmount** → releases the lock.

The toggle lives in the edit-only toolbar row in `BoardLabPage` and is never
rendered in present/student mode.

## Files

- `src/features/clean-board/wakeLockState.ts` *(new)* — pure status type +
  `isWakeLockSupported`, `describeWakeLockStatus`, `shouldReacquire`.
- `src/features/clean-board/useWakeLock.ts` *(new)* — the `useWakeLock(enabled)`
  hook: request/release/re-acquire lifecycle with no throw on SSR/build/tests.
- `src/features/clean-board/KeepAwakeToggle.tsx` *(new)* — the toggle + status
  UI.
- `src/features/clean-board/BoardLabPage.tsx` — mounted `<KeepAwakeToggle />`
  in the edit-only toolbar row.
- `src/features/clean-board/boardLabTests.ts` — 3 new pure-logic tests.
- `scripts/test-clean-board.sh` — added `wakeLockState.ts` to the compile list.

## Browser Wake Lock limitations

- The Screen Wake Lock API is best-effort: the browser or OS may release it at
  any time (low battery, system policy, or when the tab is hidden).
- Safari support is limited and iPad/iOS behavior varies; the hook degrades to
  the "unsupported" warning rather than crashing.
- The lock only applies while the tab is open and active.

## Why browser cannot run `caffeinate` directly

`caffeinate` is a macOS command-line utility. Browser JavaScript runs in a
sandbox and has no access to the local shell or process control, so it cannot
invoke `caffeinate`. The only browser-native mechanism for keeping the display
awake is the Screen Wake Lock API.

## Manual `caffeinate` fallback

For a stronger, browser-independent keep-awake during a lesson, run this in a
terminal on the Mac display host:

```bash
caffeinate -dimsu
```

- `-d` prevent the display from sleeping
- `-i` prevent the system from idle sleeping
- `-m` prevent the disk from sleeping
- `-s` keep the system awake on AC power
- `-u` declare the user is active

Stop it with `Control+C`.

## Future Tauri/native `caffeinate` path

Full macOS `caffeinate` integration should wait for the future Tauri/native
Command Center shell, which can spawn `caffeinate` directly (or use the
Tauri system-power APIs). This phase deliberately only adds the browser Wake
Lock path plus documentation.

## Validation results

| Command | Result |
| --- | --- |
| `npm run test:clean-board` | PASS — 19 passed, 0 failed |
| `npm run test:clean-board-spotify` | PASS — 53 passed, 0 failed |
| `npm run build` | PASS — `tsc -b && vite build` |
| `npm run test:display-import-guard` | PASS |
| `npm run test:display-bundle-guard` | PASS |
| `npm run test:teacher-dock` | PASS |
| `npm run lint` | 3 pre-existing canvas-spike fast-refresh errors (unchanged) |

## PASS / WARN / FAIL

**PASS**

- Teacher can enable Keep Awake in board edit/teacher mode.
- Supported browsers request a screen wake lock.
- Unsupported browsers show a clear warning (no crash).
- Wake lock is released when disabled.
- Wake lock re-acquires after visibility returns.
- Present mode remains clean/student-safe (toggle is edit-only).
- Build/tests pass.

**WARN**

- Browser may release the wake lock due OS/browser policy.
- Safari/iPad behavior may vary.
- True macOS `caffeinate` integration is deferred until the Tauri/native shell.

**FAIL**

- None.

## No-secrets confirmation

No `.env`, tokens, screenshots with private data, or unrelated files were
committed. No client secret. No shell/process execution was attempted from
browser code.
