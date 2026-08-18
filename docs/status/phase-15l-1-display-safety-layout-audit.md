# Phase 15L.1 — Student Display Safety, Layout, & Template Audit

**Branch**: `phase-15l-premium-display-hub`
**Scope**: safety/layout hardening only — no redesign, no new widgets, no features, no tldraw/Konva.

---

## Summary

This phase hardens the student-facing `/display` route and the Display Composer /
Display Studio editor so that (1) no teacher-only or implementation text can leak
to the projector, (2) overlapping widgets are detected and surfaced to the
teacher, (3) always-present status elements have a shared slot/stacking primitive,
and (4) every shipped template is honestly audited and classified.

Prior phases 15L.2–15L.4 had already built most of the overlap detector, status
slots, and template cleanup. This phase consolidates and completes the remaining
gaps: an executable safety-rule module + broader file-scan guard, a teacher-side
overlap warning in the Inspector, a slot *stacking* helper, and a full template
audit report.

**No application behavior on `/display` was changed.** No new widgets, features,
dependencies, routes, or state migrations were added.

---

## Files Changed

| File | Change |
|------|--------|
| `src/features/display-composer/displaySafetyRules.ts` | **New.** Forbidden phrases/keys + `scanForForbiddenPhrases` / `hasForbiddenDisplayKeys` (executable, not comments). |
| `src/lib/displayTemplateAudit.ts` | **New.** Template audit utility: `auditScreen`, `auditAllTemplates`, classification + risk flags. |
| `src/lib/display-studio-tests.ts` | Added Phase 15L.1 tests: display-safety (9), slot stacking (4), template audit (7). 119 total. |
| `src/lib/statusWidgetSlots.ts` | Added `DisplaySlot` corner vocabulary, `DISPLAY_SLOT_TO_STATUS_SLOT`, and `stackInSlot` stacking helper. |
| `src/features/display-studio/DisplayStudioInspector.tsx` | Surface `data-overlap-warnings` panel (teacher-only) next to readability warnings in the Display section. |
| `scripts/test-display-studio.sh` | Broader student-facing renderer file scan (11 files × 5 forbidden phrases). Compiles the two new modules. |
| `scripts/capture-phase15l1-screenshots.mjs` | **New.** Playwright screenshot capture for the required `/control` + `/display` views. |
| `docs/status/phase-15l-1-screenshots/` | **New.** 13 captured screenshots (see Screenshots section). |
| `docs/status/phase-15l-1-display-safety-layout-audit.md` | This document. |

No change to: `/display`, the Board > Scene > Widget model, `displaySafe.ts` logic,
or the renderer output.

---

## Safety Checks Added

1. **Forbidden-phrase module** (`displaySafetyRules.ts`) centralizes the leaked
   implementation-note phrases plus `teacherNotes` and `console.log`. It is
   executable — consumed by both the shell guard and the test suite.

2. **Broader file scan** (`test-display-studio.sh`) now scans 11 student-facing
   renderer files for 5 forbidden phrases, replacing the original single-file
   guard. The leaked-note regression cannot return without failing this scan.

3. **DisplaySafeScreen key enforcement** — tests assert every default screen
   projects through `toDisplaySafeScreen` with no `updatedAt`/`version`/
   `teacherNotes` key, using `displaySafeScreenHasNoForbiddenKeys` and
   `hasForbiddenDisplayKeys`.

4. **`/display` projection is display-safe only** — `DisplayComposerOverlay`
   (mounted on `/display`) calls `toDisplaySafeScreen(screen)` and bails when it
   returns `null`, so `studentSafe=false` and teacher-only data never render.

---

## Overlap Detector Behavior

Reuses the existing `src/lib/canvasWidgetOverlapDetector.ts` (from Phase 15L.2):

- Percentage-based `x/y/w/h` bounding boxes on the 100×100 canvas.
- Ignores hidden widgets (locked widgets are still detected).
- Reports widget-vs-widget overlap and widget-vs-reserved-zone collisions
  (Title Bar, Clock Chrome).
- `severity`: `overlap` | `touching` | `near-collision`.
- Pure functions — no React/store/DOM.

The new `displayTemplateAudit.ts` consumes this detector to flag
`hasOverlapWarning`. The Inspector and the Display Studio canvas both render the
warning list to the teacher (never on `/display`).

---

## Status Slot Behavior

Reuses the existing `src/lib/statusWidgetSlots.ts` (from Phase 15L.3) plus a new
stacking primitive:

- `StatusSlot` — pre-calculated safe positions (top/bottom-left/right) outside
  the reserved title/clock zones.
- `MANAGED_STATUS_TYPES` — `noise-meter` (top-right) and `work-symbols`
  (top-left) are slot-managed.
- **New** `DisplaySlot` corner vocabulary + `DISPLAY_SLOT_TO_STATUS_SLOT` map.
- **New** `stackInSlot(slotId, count, itemH, gap)` — stacks multiple
  always-present status items in one slot with safe spacing instead of letting
  them collide in the same corner.

Default screens already position their status widgets at non-colliding
coordinates (from 15L.3/15L.4), so the slot helper is the shared primitive that
future template work should use; the current output is unchanged.

---

## Template Audit Table

34 entries: 29 default screens + 5 quick-start templates.

**Status rubric**: `unsafe` = `studentSafe:false`; `hollow` = no widgets/message/
checklist/materials/timer; `complete` = has student message **and** a structural
element (checklist, materials, or timer); `partial` = has content but not complete.

| # | ID | Status | Overlap | BG-Text | Placeholder | No-Cards |
|---|-----|--------|---------|---------|-------------|----------|
| 1 | arrival-720 | complete | — | — | — | — |
| 2 | morning-work-to-math | partial | — | — | — | — |
| 3 | math-to-snack-shurley | partial | — | **risk** | — | — |
| 4 | shurley-to-movement-spelling-reading | partial | — | — | — | — |
| 5 | movement-to-spelling-reading | complete | — | — | — | — |
| 6 | spelling-reading-to-lunch | partial | — | **risk** | — | — |
| 7 | specials | complete | — | — | — | — |
| 8 | lesson-launch | complete | — | — | **yes** | — |
| 9 | work-time | complete | — | — | — | — |
| 10 | partner-talk | complete | — | — | — | — |
| 11 | cleanup | complete | — | — | — | — |
| 12 | pack-up | complete | — | — | — | — |
| 13 | end-of-day | complete | — | — | — | — |
| 14 | game-review | complete | — | — | — | — |
| 15 | prize-board-screen | complete | — | — | — | — |
| 16 | math-launch-15c | complete | — | — | — | — |
| 17 | work-time-15c | partial | — | — | — | **yes** |
| 18 | mystery-student-15c | complete | — | — | — | — |
| 19 | review-game-15c | complete | — | — | — | — |
| 20 | lunch-15c | complete | — | **risk** | — | — |
| 21 | reading-launch | complete | — | — | — | — |
| 22 | writing-workshop | complete | — | — | — | — |
| 23 | shurley-grammar | complete | — | — | — | — |
| 24 | science-launch | complete | — | — | — | — |
| 25 | history-launch | complete | — | — | — | — |
| 26 | spelling-word-work | complete | — | — | — | — |
| 27 | independent-practice | complete | — | — | — | — |
| 28 | small-groups | complete | — | — | — | — |
| 29 | test-mode | complete | — | — | — | — |
| 30 | blank-transition (QS) | partial | — | — | — | — |
| 31 | blank-lesson-launch (QS) | partial | — | — | — | — |
| 32 | checklist-only (QS) | partial | — | — | — | — |
| 33 | materials-only (QS) | partial | — | — | — | — |
| 34 | message-only (QS) | partial | — | — | **yes** | **yes** |

(QS = quick-start template — intentionally blank scaffolding.)

### Totals

- `complete`: 24 · `partial`: 10 · `hollow`: 0 · `unsafe`: 0
- overlap warnings: **0** (all default screens overlap-clean)
- background-text risk: **3**
- placeholder message: **2**
- no-cards placeholder: **2**

### Findings (honest)

- **Partial (by design)** — transition screens (`morning-work-to-math`,
  `math-to-snack-shurley`, `shurley-to-movement-spelling-reading`,
  `spelling-reading-to-lunch`) intentionally omit a student message; the
  completeness rubric marks them partial.
- **`work-time-15c` (Quiet Work)** — has 3 widgets + a message but no
  checklist/materials/timer, so `DisplayScreenRenderer` also shows the
  "No cards added to this screen yet." fallback under the widget overlay. This
  is a known visual wart, not a safety issue.
- **Background-text risk** — 3 templates use `snack-lunch-flow-control.png`
  (confirmed baked-in "Snack Lunch Flow" title text). Asset-level, not code-fixable.
- **Placeholder message** — `lesson-launch` ("Today we are learning about…") and
  the `message-only` quick-start ("Add your message here.") ship generic text.

---

## PASS / WARN / FAIL

| Area | Status | Notes |
|------|--------|-------|
| No leaked implementation note | **PASS** | Broad scan + unit tests both verify |
| `/display` teacherNotes exclusion | **PASS** | `toDisplaySafeScreen` + tests |
| Forbidden-phrase guard | **PASS** | 11 files × 5 phrases, executable |
| Overlap utility + tests | **PASS** | existing detector + audit integration |
| Teacher-side overlap warning | **PASS** | canvas + Inspector |
| `/display` excludes teacher warnings | **PASS** | warnings only in `/control` components |
| Status slot stacking helper | **PASS** | `stackInSlot` + tests |
| Template audit doc | **PASS** | this document |
| `build` / `lint` / suites | **PASS** | build clean; suites pass; lint clean on changed files (3 pre-existing `canvas-spike` fast-refresh errors remain, out of scope) |
| Screenshots | **PASS** | 13 PNGs captured at 1440×900 and 1024×768 |
| Partial/hollow templates | **WARN** | 10 partial (mostly by design); 0 hollow |
| Pre-existing failures | **WARN** | `test:jobs-manager` JM-14 (81P 1F) is deterministic and unrelated to this phase |

No **FAIL** entries. No new widgets, features, or redesign.

---

## Known Limitations

- PageWidget (pixel-grid) overlap detection is still deferred (Phase 15N).
- `snack-lunch-flow-control.png` baked-in title text cannot be fixed in code.
- `stackInSlot` is a pure primitive; default screens still use hand-placed
  coordinates (equivalent output). Future template work should adopt it.
- The completeness rubric is a heuristic; "partial" transition screens are
  intentional, not defects.

---

## Deferred Items

- tldraw / Konva engine decision — deferred (unchanged).
- Board > Scene > Widget model migration — deferred (Phase 15N).
- Typed widget settings / display-safe widget protocol — deferred.
- PageWidget overlap engine — deferred.
- New text-free background asset for snack/lunch flow — deferred to design.

---

## Screenshots

Captured with Playwright (headless Chromium) against the local dev server. Stored
under `docs/status/phase-15l-1-screenshots/`:

- `control-overlap-warning-1440x900.png` — `/control` Display Studio with the
  teacher-side overlap warning visible for an injected two-widget overlap demo.
- `display-{morning-arrival,math-launch,work-time,lunch-routine,mystery-student,review-game}-{1440x900,1024x768}.png`
  — 6 required routine screens, each at two viewports.

Executable verification (not visual alone): `[data-overlap-warnings]` count is
`1` on `/control` (text: `Widget Overlap Warning (teacher-only) … "Widget A" and
"Widget B" overlap by ~27%`) and `0` on `/display`.
