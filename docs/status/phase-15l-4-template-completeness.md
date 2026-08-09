# Phase 15L.4 — Template Completeness Audit and Layout Cleanup

**Status**: Implementation complete. Not committed.

**Branch**: `phase-15l-4-template-completeness`

**Parent**: 67f3b67 (Phase 15L.3 — Add Display Studio status widget slots)

---

## Summary

Phase 15L.4 completes the Display Studio template cleanup deferred from Phases 15L.2 and 15L.3. Four categories of fixes were applied:

1. **17 content widgets moved below the Title Bar zone** (y=5 → y=14) across 13 templates.
2. **Hollow `review-game-15c` template filled** with directions-text, checklist, and repositioned widgets.
3. **Sparse transition screens filled** (`movement-to-spelling-reading`, `specials`) with student messages.
4. **Baked-in-text background risks documented** as deferred (asset-level fix — PNG files not modifiable in code).

`/display` is unchanged. No model changes, no new dependencies, no state migration.

---

## A. Audit Findings — Full Template Inventory (28 Screens)

| # | ID | Title | Widgets | Student Message | Checklist | Materials | Timer | Zone Clean? |
|---|-----|-------|---------|-----------------|-----------|-----------|-------|-------------|
| 1 | arrival-720 | 7:20 Arrival | 2 (work-symbols, directions) | Yes | Yes | Yes | General | Yes (15L.3 slots) |
| 2 | morning-work-to-math | Morning Work→Math | 1 (noise-meter) | — | Yes | Yes | Transition | Yes (15L.3 slots) |
| 3 | math-to-snack-shurley | Math→Snack+Shurley | 0 | — | Yes | Yes | Transition | Clean (no widgets) |
| 4 | shurley-to-movement-spelling-reading | Shurley→Movement | 0 | — | Yes | Yes | Transition | Clean (no widgets) |
| 5 | movement-to-spelling-reading | Movement→Spelling | 0 | **Added** | Yes | — | Transition | Clean (no widgets) |
| 6 | spelling-reading-to-lunch | Spelling→Lunch | 0 | — | Yes | — | Routine | Clean (no widgets) |
| 7 | specials | Specials | 0 | **Added** | Yes | — | General | Clean (no widgets) |
| 8 | lesson-launch | Lesson Launch | 1 (directions at y=30¹) | Yes | Yes | — | General | Yes |
| 9 | work-time | Work Time | 2 (work-symbols, noise-meter) | Yes | Yes | — | General | Yes (15L.3 slots) |
| 10 | partner-talk | Partner Talk | 0 | Yes | — | Yes | General | Clean (no widgets) |
| 11 | cleanup | Cleanup | 0 | Yes | Yes | — | Transition | Clean (no widgets) |
| 12 | pack-up | Pack Up | 0 | Yes | Yes | — | General | Clean (no widgets) |
| 13 | end-of-day | End of Day | 0 | Yes | Yes | — | None | Clean (no widgets) |
| 14 | game-review | Review Game | 2 (random-picker, 100-board) | Yes | Yes | — | General | **Fixed** (y:5→14) |
| 15 | prize-board-screen | Prize Board | 1 (prize-board) | Yes | — | Yes | None | Yes |
| 16 | math-launch-15c | Math Launch | 2 (countdown-timer, materials) | Yes | Yes | — | None | **Fixed** (y:5→14) |
| 17 | work-time-15c | Quiet Work | 3 (timer, symbol, noise) | Yes | — | — | None | **Fixed** (timer y:5→14) |
| 18 | mystery-student-15c | Mystery Student | 1 (mystery-student at y=20) | Yes | Yes | — | None | **Clean** (already clean) |
| 19 | review-game-15c | Review Game | **3¹** (picker, board, directions) | Yes | **Added** | — | None | **Fixed** (y:5→14 + filled) |
| 20 | lunch-15c | Lunch Routine | 2 (routine-timer, noise-meter) | Yes | Yes | — | None | **Fixed** (timer y:5→14) |
| 21 | reading-launch | Reading Launch | 2 (directions, countdown-timer) | Yes | Yes | — | General | **Fixed** (both y:5→14) |
| 22 | writing-workshop | Writing Workshop | 1 (directions) | Yes | Yes | — | General | **Fixed** (y:5→14) |
| 23 | shurley-grammar | Shurley/Grammar | 1 (directions) | Yes | Yes | Yes | General | **Fixed** (y:5→14) |
| 24 | science-launch | Science Launch | 1 (directions) | Yes | — | Yes | General | **Fixed** (y:5→14) |
| 25 | history-launch | History/Social Stud. | 1 (directions) | Yes | — | — | General | **Fixed** (y:5→14) |
| 26 | spelling-word-work | Spelling/Word Work | 1 (directions) | Yes | Yes | — | General | **Fixed** (y:5→14) |
| 27 | independent-practice | Independent Pract. | 2 (work-symbols, countdown-timer) | Yes | Yes | Yes | General | **Fixed** (timer y:5→14, symbol→y:70) |
| 28 | small-groups | Small Groups | 2 (work-symbols, noise-meter) | Yes | — | Yes | General | Yes (15L.3 slots) |
| 29 | test-mode | Test/Assessment | 2 (work-symbols, directions) | Yes | Yes | — | General | **Fixed** (directions y:5→14) |

¹ `lesson-launch` directions-text was already at y=30 (never in title zone).
² `review-game-15c` increased from 2→3 widgets (added directions-text).

### Pre-Fix Zone Overlap Summary

Before this phase, **17 visible CanvasWidgets across 13 templates** sat at y=5, overlapping the Title Bar reserved zone (0,0,100,10):

| Template | Widgets at y=5 |
|----------|---------------|
| game-review | 2 (random-picker, 100-board) |
| math-launch-15c | 2 (countdown-timer, materials) |
| work-time-15c | 1 (countdown-timer) |
| review-game-15c | 2 (random-picker, 100-board) |
| lunch-15c | 1 (routine-timer) |
| reading-launch | 2 (directions, countdown-timer) |
| writing-workshop | 1 (directions) |
| shurley-grammar | 1 (directions) |
| science-launch | 1 (directions) |
| history-launch | 1 (directions) |
| spelling-word-work | 1 (directions) |
| independent-practice | 1 (countdown-timer) |
| test-mode | 1 (directions) |

All 17 widgets moved to y=14. One additional layout adjustment (independent-practice work-symbols relocated from y=14 to y=70) was needed to avoid crowding after the countdown-timer moved into the y=14 row — this is a separate slot reposition, not part of the 17 y:5→14 moves.

### Post-Fix Zone Verification

Test: `no default template widgets intrude into reserved zones (all types)` — asserts ALL visible widgets in ALL templates produce zero reserved-zone warnings. **PASS**.

---

## B. Hollow Templates Fixed

### review-game-15c

**Before:**
- 2 widgets (random-picker, 100-board), both at y=5
- No checklist, no directions-text
- Only `studentMessage` was present

**After:**
- 3 widgets: random-picker at (2,14), 100-board at (50,14), directions-text at (2,55) with gameplay instructions
- Added `checklistCard` (Review Rules: raise hand, listen, celebrate)
- Widgets repositioned below Title Bar zone

### movement-to-spelling-reading

**Before:** No widgets, no student message. Only a checklist.
**After:** Added `studentMessage: 'Return to your seat and get ready for spelling and reading.'`

### specials

**Before:** No widgets, no student message. Only a checklist.
**After:** Added `studentMessage: 'Time for specials! Walk quietly in line and follow directions.'`

### Verified: No Template Is Hollow

Test: `no default template looks hollow` — asserts every template has at least one of: widgets, student message, checklist, materials card, or timer kind. **PASS** (all 29 templates).

---

## C. Baked-in-Text Background Risks

### Audited Assets

The 14 `BACKGROUND_ASSETS` in `src/data/backgroundAssets.ts` reference 5 unique PNG files:

| PNG File | Used By | Risk |
|----------|---------|------|
| `homeroom-morning-briefing.png` | arrival-720, end-of-day, recess-play, homework-station, pack-up-station (5) | None noted |
| `math-training-lab.png` | morning-work-to-math, science-lab (2) | None noted |
| `reading-sky-book-world.png` | writing-workshop, social-studies-map (2) | None noted |
| `snack-lunch-flow-control.png` | math-to-snack-shurley, spelling-reading-to-lunch, lunch-15c, centers-rotations (4) | **Confirmed** baked-in title text ("Snack Lunch Flow") |
| `ready-position-expectations.png` | shurley-to-movement-spelling-reading, assessment-mode (2) | None noted |

The `snack-lunch-flow-control.png` asset was visually inspected and confirmed to contain baked-in title text: **"Snack Lunch Flow"** rendered directly in the PNG. This is not resolved by Phase 15L.4. All instructional and timing text should be kept editable in React/widgets going forward.

**Decision: Deferred.** Replacing the PNG requires a new text-free background asset, which is out of scope for code-only phases. When a replacement is available, the baked-in title text will be moved into an editable `studentMessage` or screen `title` field.

### Background Texture Audit

All 29 templates use either gradient, solid, or image backgrounds. None use CSS-only backgrounds with text. Gradients are pure CSS linear-gradient() strings with no text or images. Solids are single hex colors. This means there is **no baked-in-text background pattern that can be statically detected** in the code.

---

## D. Known Deferred Screen Outcomes

### Math Launch (math-launch-15c)

- **Fix**: Both widgets moved from y=5 to y=14 (Title Bar zone → safe zone)
- **Tested**: `Math Launch countdown-timer is outside reserved zones after 15L.4` — PASS
- **Remaining risk**: Minimal. The countdown-timer at (2,14,30,30) and materials at (68,14,30,30) are now well below the title bar. The `showClock` boolean still renders the clock in the header as fixed chrome, but no widgets collide with it.
- **Outcome**: Resolved.

### Mystery Student (mystery-student-15c)

- **Fix**: None needed. The mystery-student widget is at y=20, well below the Title Bar (h=10).
- **Tested**: `Mystery Student is clean after 15L.4 audit` — PASS
- **Outcome**: Already clean. Confirmed in this audit.

### Lunch (lunch-15c)

- **Fix**: Routine-timer moved from y=5 to y=14 (noise-meter already at y=14 from 15L.3).
- **Tested**: `Lunch routine-timer is outside reserved zones after 15L.4` — PASS
- **Remaining risk**: Minimal. The routine-timer at (2,14,45,45) and noise-meter at (72,14,20,16) are clear of reserved zones. The `lunch-flow-control` background image risk is deferred (see Section C).
- **Outcome**: Resolved in code; background asset risk deferred.

### Review Game (review-game-15c)

- **Fix**: Widgets moved from y=5 to y=14. Added directions-text and checklist. Template is no longer hollow.
- **Tested**: `review-game-15c is not hollow after 15L.4` — PASS. `review-game-15c widgets are outside reserved zones after 15L.4` — PASS.
- **Outcome**: Resolved.

### Current Time (clock chrome)

- Not a separate screen. Clock is always fixed chrome via `showClock` boolean.
- Widget-vs-clock collision is now zero across all templates (all y≥14 widgets are below Clock Chrome zone at y=0,h=12).
- **Outcome**: Resolved.

---

## E. Validation Results

```
npm run test:display-studio   → PASS  (100 tests, 0 failed)
  - 15L.2 overlap detection: 14 tests
  - 15L.3 slot system: 15 tests
  - 15L.4 template audit: 7 tests
  - Earlier templates/readability/scorecard: 64 tests
npm run test:display-composer → PASS
npm run build                 → PASS
Leak guard                    → PASS
Decorative test removal       → CONFIRMED (0 matches)
Duplicate chrome guards       → PASS
Slot-zone alignment           → PASS
All templates zone-clean      → PASS
No hollow templates           → PASS
```

---

## F. Files Changed

| File | Change |
|------|--------|
| `src/features/display-composer/defaultScreens.ts` | 17 widget y:5→14 repositionings; review-game-15c filled (directions + checklist); independent-practice symbol moved to y=70; movement-to-spelling-reading and specials added studentMessage; game-review widgets repositioned |
| `src/lib/display-studio-tests.ts` | Updated widget count expectation for review-game-15c (2→3). Added 7 Phase 15L.4 template audit tests |
| `docs/status/phase-15l-4-template-completeness.md` | This document |

**No changes to**: `/display`, Board/Scene/Widget model, state migration, routes, dependencies. No external assets added.

---

## G. Deferred Items

### To Phase 15M (tldraw Editor Spike, `/control` only)

- No template items deferred — template completeness is resolved.

### To Phase 15N (Model Unification)

- PageWidget overlap detection
- Unified overlap engine across CanvasWidget and PageWidget

### Asset-Level (Not Code-Fixable)

- `snack-lunch-flow-control.png` background: confirmed baked-in title text ("Snack Lunch Flow") rendered directly in the PNG. Requires new text-free background asset.
- Several background assets are "Phase 4A lightweight alias" reuses (e.g., reading-sky-book-world.png used for writing and social-studies). Custom backgrounds deferred to design.
- All 5 unique PNG files are served as-is from `/assets/backgrounds/`. Not modifiable in code.

---

## H. Confirmation

- No tldraw installed or imported
- No Konva installed or imported
- No new dependencies
- No PageWidget migration
- No `/display` behavior change
- No Board/Scene/Widget target-model change
- No state migration
- No external assets added
- No commit made
