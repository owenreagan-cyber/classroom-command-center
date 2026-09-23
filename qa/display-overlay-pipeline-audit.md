# Display Overlay Pipeline — Architecture Audit

This audit reconstructs what `/display` rendered before and after the Clean
Board migration, and identifies exactly which projection/cast state still
exists so the pipeline can be re-composed into `BoardHostDisplay` without
resurrecting `StudentDisplayShell`.

## 1. What `/display` rendered before Clean Board

`App.tsx` routed `route === 'display'` to `StudentDisplayShell`, which composed
student-facing content in a fixed precedence (source-of-truth comment in
`StudentDisplayShell.tsx`):

```
Blank > Prize Board > Random Number > Display Composer > normal board
```

Concretely it rendered, in order:

1. **Blank screen** (`displayBlanked`, `useDisplayComposerStore`) — `z-50` black.
2. **Normal board** (`BoardWorkspace` → `BoardFrame`, `mode='display'`,
   `studentDisplay`) — rendered when no modal overlay was active. This was the
   fallback that carried:
   - **Now Showing** badge (`NowShowingDisplayLabel`, `data-testid="now-showing-display"`),
     rendered in the `BoardFrame` header when `studentDisplay && isDisplay`.
   - **Morning Message** (`MorningMessageWidget` → `MorningMessageDisplay`,
     `data-testid="morning-message-display"`), rendered as the page content when
     the active page was `homeroom-morning-message`.
3. **Display Composer overlay** (`DisplayComposerOverlay`,
   `[data-display-screen-id]`) — gated by `studentSafe` and absence of
   projector/random/blank.
4. **Prize Board projector** (`PrizeBoardProjectorMode`,
   `[data-projector-mode="prize-board"]`) — self-managing, `z-[60]`.
5. **Random Number** (`RandomNumberDisplay`,
   `[data-projector-mode="random-number"]`) — self-managing, `z-[55]`.
6. **Fullscreen button** (`Enter fullscreen`) — `StudentDisplayShell`-only markup.

## 2. What `/display` renders now

`App.tsx` routes `route === 'display'` to `BoardHostDisplay` (Clean Board
host). It renders:

- `BoardCanvas` (`[data-board-canvas]`) — the base Clean Board.
- `ProjectedStampCard`, `QRCodeWidget` — two teacher-cast overlays.
- A one-time "Tap to enable classroom sound" button (`[data-display-sound-unlock]`).

None of the old modal/cast overlays are composed. This is the regression.

## 3. Which overlay states still exist (and are healthy)

| Feature | Store | Signal | Persisted? | Cross-tab sync? |
|---|---|---|---|---|
| Blank screen | `useDisplayComposerStore` | `displayBlanked` | yes | yes |
| Display Composer/Studio sent screen | `useDisplayComposerStore` | `activeScreenId` + `screens[id].studentSafe` | yes | yes |
| Prize Board projector | `usePressYourLuckStore` | `phase` (`shouldShowProjectorMode`) | yes | yes |
| Random Number | `useRandomNumberStore` | `lastResult` + `showOnDisplay` | yes | no |
| Morning Message | `useBoardStore` | `activePageId === 'homeroom-morning-message'` | yes | — |
| Now Showing | `useBoardStore` | `todayPrep.nowShowingResourceId` + `resourceLinks` | yes | — |

All stores are intact, persisted via `zustand/persist`, and still populated
correctly from `/control` (send actions unchanged). Only the `/display`
renderer is missing.

## 4. Healthy but orphaned components

- `PrizeBoardProjectorMode` (`src/features/prize-board/components/`)
- `RandomNumberDisplay` (`src/features/random-number/components/`)
- `DisplayComposerOverlay` (`src/features/display-composer/`)
- `MorningMessageDisplay` / `MorningMessageWidget` (`src/features/morning-message/`)
- `NowShowingDisplayLabel` (`src/features/display/`)
- `BoardWorkspace` / `BoardFrame` — still used for `/control` edit mode.

## 5. Obsolete components / markup

- `StudentDisplayShell.tsx` — no longer reached; its composition logic must be
  ported to the new host, but the component itself is obsolete as the top-level
  display route.
- `.classroom-canvas-frame` — dead `StudentDisplayShell` markup.
- `Enter fullscreen` button — `StudentDisplayShell`-only; the Clean Board host
  has no fullscreen button (already removed from display-polish/visual-qa tests).

## 6. Current intended precedence

Verified against `display-composer.spec.ts:320` ("overlay precedence remains
Prize Board > Random Number > Display Composer > board") and the original
`StudentDisplayShell` logic:

```
1. Blank screen            (z-50)
2. Prize Board projector   (z-[60], fixed)
3. Random Number           (z-[55], fixed)
4. Display Composer screen (z-30, absolute) — only when no projector/random/blank
5. Morning Message         (content overlay, replaces board area)
6. Now Showing badge       (content overlay, floats over board)
7. base Clean Board        (default)
```

Morning Message and Now Showing are "content overlays" rendered only when no
higher-priority modal is active (mirroring the old "normal board" fallback).

## 7. Persistence expectations

- Sent screen: persists via `DISPLAY_COMPOSER_STORAGE_KEY` (survives reload;
  timer recovery is wall-clock based inside `TimerSlot`).
- Prize Board: `recoverInterruptedSpin` normalizes interrupted spins on rehydrate.
- Random Number: persists `showOnDisplay`/`lastResult`.
- Morning Message / Now Showing: persist in `useBoardStore`
  (`classroom-command-center-lite`).
- Clear: `clearDisplay()` sets `activeScreenId: null, displayBlanked: false` →
  falls back to base Clean Board.

## 8. Student-safety / privacy invariants

- `DisplayComposerOverlay` uses `toDisplaySafeScreen` (strips `teacherNotes`,
  enforces `studentSafe`, filters widget settings); returns `null` for
  non-student-safe screens.
- `PrizeBoardProjectorMode` uses `stripPrivateBoardFields` + `getDisplayGameStatus`.
- `NowShowingDisplayLabel` renders label + preset text only (no URL).
- `MorningMessageDisplay` renders only enabled, student-facing sections.
- Overlay host must never render `[data-teacher-command-dock]`, teacher
  controls, or edit chrome.

## 9. Widget-library toggle bug (separate)

`DisplayStudioUIProvider.toggleWidgetLibrary(category)` toggles open/closed
unconditionally, so clicking a category tab while the library is open closes it
instead of switching category. Label `Noise Meter` was intentionally renamed
`Noise Level` (and is now `connected`, not a placeholder).
