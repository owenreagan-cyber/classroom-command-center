# Phase 14F: Classroom Display Field Test + Launch Readiness

**Branch:** `phase-14f-display-field-test-launch-readiness`
**Starting commit:** `ea35f77` — "Add cost-safe AI provider controls" (main, clean)
**Type:** QA / reliability / launch-readiness pass — no new features.

## Workflow checklist

| # | Workflow | Result |
|---|---|---|
| 1 | Arrival (7:20 Arrival → Send to Display) | PASS |
| 2 | Transition (Math → Snack and Shurley, timer started, sent) | PASS |
| 3 | Lesson launch (Lesson Message Generator, deterministic, sample Saxon Math Lesson 5) | PASS |
| 4 | Work time (quick-start "Blank Lesson Launch") | **PASS after fix** (see Bugs found) |
| 5 | Lunch / routine timer (Spelling/Reading → Lunch, switch tools mid-timer) | PASS |
| 6 | Safety/privacy (studentSafe=false, overlay precedence) | PASS |
| 7 | Runtime resilience (reload /display and /control, switch tools while timer running, clear display) | PASS |

## PASS/WARN/FAIL table (validation commands)

| Check | Result |
|---|---|
| `test:display-composer` | PASS |
| `test:timers` | PASS |
| `test:display-launch` | PASS |
| `test:display-polish` | PASS |
| `test:teacher-dock` | PASS |
| `test:studio-canvas` | PASS |
| `test:morning-message` | PASS |
| `test:teacher-workstation` (master) | PASS |
| `test:e2e` | PASS |
| `build` | PASS (known bundle-size WARN only, unchanged class) |
| `lint` | PASS |

**E2E count:** 96 passed (baseline 94 + 2 new regression tests).

## Bugs found and fixed

1. **Real bug — quick-start templates promised a timer that never rendered.** "Blank Transition" and "Blank Lesson Launch" quick-start templates set a timer `kind` but no `timerId`. `TimerSlot` correctly rendered nothing (by design), but `DisplayScreenRenderer`'s layout still reserved a grid column for it — the result was a large blank gap where a timer should have been, discovered while field-testing the Work Time workflow.
   - **Fix 1** (`quickStartTemplates.ts`): added `finalizeQuickStartPatch()`, a pure function that fills in a real per-instance `timerId` once the new screen's id is known, so the promised timer actually appears.
   - **Fix 2** (`DisplayScreenRenderer.tsx`): `hasTimer` now also requires a `timerId` to be present before reserving a layout column — closes the same gap for the manual-editing path too (a teacher picking a timer kind from the dropdown without typing an id).
   - Both fixes are small, additive, and do not touch the timer widgets themselves.
2. No other bugs found. All other workflows passed cleanly on the first pass.

## Known limitations (not fixed — out of scope per guardrails)

- **Timer label sharing**: `general` and `transition` timer kinds both render through the same shared `TransitionTimerWidget`, which always displays the label "Transition" regardless of kind (e.g. a Work Time screen's general timer visually reads "TRANSITION"). This is a pre-existing, deliberate tradeoff from Phase 14B (documented in `TimerSlot.tsx`) and fixing it would mean modifying the shared timer widget, which this phase's guardrails explicitly forbid ("Do not rebuild timers"). Recommended as a candidate for a future phase if label-aware timer widgets are wanted.

## Screenshot paths

All captured at 1920×1080 in `/private/tmp/claude-501/-Users-owen/d6cadbcf-1b9a-4d3d-9f8f-721d3dfc8a2c/scratchpad/phase-14f-screenshots/`:
- `00-control-display-screens-panel.png` — /control Display Screens panel
- `01-display-arrival.png` — /display Arrival screen
- `03-display-transition-timer.png` — /display Math → Snack and Shurley transition timer (running)
- `04b-control-lesson-launch-draft-preview.png` — /control Lesson Message Generator draft (sample Saxon Math Lesson 5 input)
- `06-display-lesson-launch-sent.png` — /display generated lesson launch screen
- `08-display-work-time.png` — /display Work Time screen (post-fix, timer visible, balanced layout)
- `09-display-lunch-routine.png` — /display Lunch routine screen
- `13-display-cleared-fallback-board.png` — /display fallback/normal board after clearing display
- `14-display-privacy-proof.png` + explicit body-text leak checks (teacher rationale, teacher-only label, provider status, warnings, drafts-used counter — all confirmed absent)
- Additional supporting captures: `02`, `05`, `07`, `10`, `11`, `12` (intermediate workflow states)

## Classroom readiness recommendation

**Ready for real classroom use.** All 7 primary workflows work end-to-end without a blank display, stale state, or crash. The one real bug found (missing quick-start timer id) was exactly the kind of issue this field-test phase exists to catch, and is now fixed with test coverage. Student-safe `/display` boundaries hold under every tested condition, including reload, tool-switching mid-timer, and explicit privacy/fallback scenarios.

## Next phase recommendation

No urgent follow-up required. If a future phase revisits timers, consider making the transition/general timer widget label itself based on the composer's declared kind (currently a shared, hardcoded "Transition" label) — purely cosmetic, not a functional risk.

## Commit status

Not committed. Awaiting explicit approval per instructions.
