# Display Overlay Pipeline — Final Report

> **Reviewed and committed 2026-09-23.** Traced every overlay layer's data
> source end to end and confirmed the student-safe boundary genuinely holds
> (no roster, fairness history, stamps map, tokens, or teacher notes reach
> `/display` through any layer). Found and fixed one real precedence bug
> this report's own table didn't catch: `PrizeBoardProjectorMode` (z-[60])
> and `RandomNumberDisplay` (z-[55]) were mounted unconditionally with no
> awareness of `displayBlanked`, so Blank (z-50) did not actually always win
> against them as documented — fixed in `DisplayOverlayHost.tsx` by gating
> both on `!displayBlanked`, and Random Number additionally on
> `!projectorActive` to keep the Prize Board > Random Number ordering true
> in the DOM when both are flagged active at once, not just visually true by
> z-index coincidence. The widget-library toggle fix (§9) was confirmed
> correct and now has a dedicated regression test in `display-studio.spec.ts`
> ("category tab switches category while open; same category closes"). The
> `test:clean-board` import guard (§13 context) now allowlists this file's
> one intentional `display-composer` bridge explicitly, instead of being
> blocked by the blanket ban.

## 1. Root cause

`/display` was migrated to `BoardHostDisplay` (Clean Board host), but the
student-facing "cast-to-display" overlay stack that used to render through
`StudentDisplayShell` was never re-composed into the new host. All the
underlying projection/cast **state** remained intact and correctly populated
from `/control`; only the `/display` renderer was missing. This produced
`[data-display-screen-id]`, `[data-projector-mode="prize-board"]`,
`morning-message-display`, and `now-showing-display` never appearing on
`/display`.

## 2. Architecture before / after

- **Before (pre-Clean-Board):** `App.tsx` → `StudentDisplayShell`, which
  composed Blank > Prize Board > Random Number > Display Composer > normal
  board (`BoardFrame` carrying Now Showing + Morning Message).
- **After (Clean Board):** `App.tsx` → `BoardHostDisplay` (Clean Board canvas +
  stamp/QR overlays), with the modal/content overlays orphaned.
- **Now:** `BoardHostDisplay` renders the base Clean Board and layers
  `DisplayOverlayHost`, which re-composes the same student-facing overlays at
  the same precedence. `StudentDisplayShell` remains unreachable/retired.

## 3. Display overlay precedence

Verified against `display-composer.spec.ts:320` and the historical
`StudentDisplayShell` contract:

```
1. Blank screen            (z-50)
2. Prize Board projector   (z-[60], fixed)
3. Random Number           (z-[55], fixed)
4. Display Composer screen (z-30, absolute) — only when no projector/random/blank
5. Morning Message         (content overlay, replaces board area)
6. Now Showing badge       (content overlay, floats over board)
7. base Clean Board        (default)
```

## 4. Features restored

- Display Composer / Display Studio **sent screen** (`[data-display-screen-id]`).
- **Clear Display** → returns to base Clean Board.
- **Morning Message** (`morning-message-display`).
- **Now Showing** (`now-showing-display`, student-safe label + preset only).
- **Prize Board projector** (`[data-projector-mode="prize-board"]`).
- **Random Number** projector (restored through the same composer; no
  regression).

## 5. Components reused

- `PrizeBoardProjectorMode`, `RandomNumberDisplay`, `DisplayComposerOverlay`,
  `MorningMessageDisplay`, `NowShowingDisplayLabel` — all reused unchanged.
- `DisplayComposerOverlay` continues to route through `toDisplaySafeScreen`.

## 6. Components retired

- `StudentDisplayShell.tsx` — left unreachable (not deleted, but no longer the
  top-level `/display` route). Its composition logic was ported to
  `DisplayOverlayHost`.
- `.classroom-canvas-frame` / `Enter fullscreen` — already removed from tests
  in the prior route-migration pass; not restored.

## 7. Persistence behavior

- Sent screen persists across `/display` reload (unchanged store).
- Timer recovery stays wall-clock based (unchanged `TimerSlot`).
- Prize Board `recoverInterruptedSpin` unchanged.
- `clearDisplay()` sets `activeScreenId: null, displayBlanked: false` → base
  Clean Board.

## 8. Privacy validation

All overlays reuse their existing student-safe renderers:
`toDisplaySafeScreen` (strips `teacherNotes`, enforces `studentSafe`),
`stripPrivateBoardFields` + `getDisplayGameStatus` (Prize Board), label-only
`NowShowingDisplayLabel`, and section-filtered `MorningMessageDisplay`. No
teacher chrome, edit controls, URLs, or provider/debug state is mounted on
`/display`. `display-privacy-regression` and `visual-qa-display` privacy
assertions all pass.

## 9. Widget-library fix

`DisplayStudioUIProvider.toggleWidgetLibrary(category)` now:
- closed → opens on the requested category;
- open + different category → switches category (stays open);
- open + same category (or no category) → closes.

This fixes the category-tab toggle bug. `Noise Meter` → `Noise Level` rename is
intentional and already reconciled in the source; the placeholder-widget test
now targets `QR Code` (a current `placeholder` widget).

## 10. Targeted test results

`display-composer`, `display-studio`, `morning-message-studio`,
`visual-qa-display`, `prize-board-projector`, `display-privacy-regression`,
`display-polish` (67 tests):

- **44 passed / 23 failed**.
- All failures are `display-composer.spec.ts` — the retired legacy panel
  (see §13), NOT the `/display` pipeline.
- Every overlay-dependent `/display` assertion is green, including the
  projector snapshot specs.

## 11. Full Chromium result

`npx playwright test --project=chromium --workers=2` (111 tests / 14 files):

| Metric | Route-migration baseline | After this pass |
|--------|--------------------------|-----------------|
| passed | 68 | **86** |
| failed | 42 | **24** |
| did not run | 1 | 1 |
| duration | ~6.2m | ~5.3m |

**18 failures resolved** by restoring the overlay pipeline.

## 12. Static validation

- `git diff --check` — clean (exit 0).
- `npx tsc -b` — passes (exit 0).
- `npm run lint` — 3 errors, all **pre-existing**
  (`src/features/canvas-spike/{ClockShape,CountdownTimerShape,DirectionsTextShape}.tsx`,
  `react-refresh/only-export-components`); 0 new errors.
- `npm test` — not applicable (no such script; this repo uses per-feature
  `test:*` bash scripts and Playwright).

## 13. Remaining WARN/FAIL items

All 24 remaining failures are **pre-existing** and **outside the `/display`
overlay-pipeline scope**:

1. **`display-composer.spec.ts` (23 tests)** — drive the legacy Display
   Composer dock panel (Phase 14B–14F: Lesson Message Generator, Provider
   status controls, Screen Packs filter, Readability warnings, quick-start
   templates). That panel was replaced by the Display Studio overlay
   (Phase 15A): `DisplayComposerToolPanel` now only launches the overlay, and
   the legacy `DisplayComposerPanel` is orphaned (never rendered). The
   `/display` behaviors these tests assert are already covered by the passing
   `display-studio.spec.ts`. **Disposition requires a product decision**:
   retire the legacy panel + tests, migrate the tests to drive Display Studio,
   or re-wire the legacy panel. Category: TEST DRIFT (retired feature).

2. **`prize-board-ipad-landscape-snapshots.spec.ts:25` (1 test)** — `/control`
   Prize Board idle landscape snapshot: element size changed 288×979px →
   288×859px (ratio 0.11). A `/control`-side panel layout change, unrelated to
   `/display`. Category: SNAPSHOT BASELINE DRIFT.

## Final verdict

**WARN — CORE DISPLAY RESTORED, GAPS REMAIN**

The `/display` overlay pipeline is fully restored and verified green: Display
Composer/Studio sent screens, Morning Message, Now Showing, and Prize Board
projector all render on `/display` again with student-safety invariants intact
(86/111 passing, +18 from the route-migration baseline). The 24 remaining
failures are pre-existing and independent of this repair — a retired legacy
Display Composer panel (23 tests, awaiting a product decision) and one
`/control` snapshot-baseline drift. No production behavior was reverted, no
test was weakened, and no obsolete component was resurrected.
