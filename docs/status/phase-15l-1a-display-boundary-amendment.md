# Phase 15L.1A — Canvas Engine Display Boundary Amendment

**Branch:** `phase-15l-1a-display-boundary-amendment`
**Starting commit:** `ea2277c` — Fix curriculum fetcher storage key collision
**Date:** 2026-08-08

## Summary

Documentation-only amendment to the Phase 15L.1 canvas engine decision package. Clarifies the display boundary, corrects engine option ratings, and reconciles the migration phase sequence.

## Status: Documentation-only amendment — no application code changed

No application code was modified. No dependencies were installed. No routes, widgets, stores, or tests were changed.

## Files Changed

| File | Change |
|------|--------|
| `docs/architecture/canvas-engine-decision.md` | Added Display Boundary Decision section; refined Option A live classroom widget rating; refined Option B /display split and watermark analysis; updated Explicit Answers watermark question |
| `docs/architecture/board-scene-widget-target-model.md` | Added Student Display Projection Boundary section; revised Migration Plan to reconciled 15L.1A–15N sequence with explicit deliverable assignments |
| `docs/status/phase-15l-1a-display-boundary-amendment.md` | This status report (new) |

## Key Decision: /display Remains Engine-Agnostic

The /display route must not load tldraw Editor, Konva Stage, or any editing engine. It renders DisplaySafeScene / DisplaySafeWidget through a lightweight renderer, regardless of which engine powers /control. This is the Display Boundary Decision.

### tldraw Watermark Implication

Because /display does not load tldraw, the "Made with tldraw" watermark does not appear on the student-facing projector route. This substantially lowers the projector watermark risk.

**Caveat:** This conclusion applies to /display as currently scoped. It does not automatically extend to every future surface. If tldraw is ever used to power a student-facing surface directly (for example, a shared iPad used by students), that is a new watermark question to evaluate on its own, not one this amendment has already answered.

## Corrected Rating: Hand-Rolled Live Classroom Widgets

The original Phase 15L.1 decision doc rated hand-rolled React/DOM as "Weak" for live classroom widgets. This was overly broad. The correction:

- Hand-rolled drag/resize/zoom is weak for **authoring-time** interactions (selection, resize handles, camera, stylus).
- It is not necessarily weak for existing live classroom widget interactions, because many are regular React components that respond to clicks and state changes: Mystery Star, Lotto, 100 Board, Prize Board, Jobs, timers, etc.
- The risk is long-term authoring/editor complexity, not current live-widget click behavior.

## Reconciled Phase Sequence

The Migration Plan in `board-scene-widget-target-model.md` has been updated to match the sequence actually being followed. The original 15L.1 package defined: 15L.2 (visual safety fixes + duplicate chrome + hollow templates + baked-in-text backgrounds), 15L.3 (widget contract docs), 15M (spike), 15N (production migration).

The reconciled sequence splits the original 15L.2 into three focused phases, adds this amendment (15L.1A), and ensures every original deliverable is explicitly assigned:

| Phase | Deliverables | Original Scope Mapping |
|-------|-------------|----------------------|
| 15L.1A | Display boundary amendment (docs only) | New — post-15L.1 review feedback |
| 15L.2 | Widget overlap/collision safety audit + warnings; duplicate chrome collapse (Send to Display 3→1, Blank/Restore 2→1, Presenter 2→1, Clear Display 2→1, Browse Templates 2→1) | Overlap/collision + duplicate chrome from original 15L.2 |
| 15L.3 | Status widget slot system (shared docked-corner placement for clock, voice-level, mode badge, materials icon) | New scoped phase — replaces free positioning for always-on status widgets |
| 15L.4 | Template completeness audit (hollow templates like empty "Review Game" entry; background images with baked-in text replaced with text-free backgrounds) | Hollow templates + baked-in-text from original 15L.2 |
| 15M | Isolated tldraw editor spike (/control only, dev-only route) | Unchanged from original 15M |
| 15N | Production migration | Unchanged from original 15N |

No item from the original 15L.2 scope is dropped. Overlap/collision and duplicate chrome are in 15L.2. Hollow templates and baked-in-text backgrounds are in 15L.4. The original 15L.3 (widget contract/type planning docs) is deferred and will be scoped later.

## What Remains Deferred

- No tldraw dependency adoption
- No tldraw install
- No Konva dependency adoption
- No Konva install
- No route changes
- No runtime changes
- No code changes
- No widget changes
- No store changes
- No state migration
- No tldraw sync
- No implementation spike
- Widget contract/type planning documentation (original 15L.3 — deferred, not dropped)

## Validation

### Test Suites

| Command | Result | Notes |
|---------|--------|-------|
| `npm run test:display-studio` | PASS | 63 passed, 0 failed |
| `npm run test:display-composer` | PASS | All composer/pack/template/readability + AI safety tests pass |
| `npm run build` | PASS | tsc + vite build clean |

### Lint

| Command | Result | Notes |
|---------|--------|-------|
| `npm run lint` | WARN | Pre-existing ENOENT for `.local/display-composer-tests/data/backgroundAssets.js` — not introduced by this phase (no application code changed) |

### Leaked Display Implementation Note Check

```
grep -RIn "I'll actually do this differently\|actually do this differently\|update key layout areas" src scripts || true
```

Result: CLEAN in src/ and scripts/ (no matches).

### No Application Code Changed

Confirmed: only documentation files modified. No TypeScript, CSS, test, script, or configuration files were changed.

### No Dependencies Installed

Confirmed: no npm/yarn/pnpm runs.

### No Commit Made

Awaiting approval.

## PASS/WARN/FAIL Summary

| Check | Status | Notes |
|-------|--------|-------|
| Repo state | PASS | Working tree shows only doc changes on `phase-15l-1a-display-boundary-amendment` |
| Base commit | PASS | `ea2277c` — Fix curriculum fetcher storage key collision |
| Canvas engine decision doc | PASS | Updated with Display Boundary Decision, refined Option A/B |
| Board/Scene/Widget model doc | PASS | Updated with Student Display Projection Boundary, reconciled Migration Plan |
| Status report | PASS | Created at `docs/status/phase-15l-1a-display-boundary-amendment.md` |
| No application code changed | PASS | Only 2 docs modified + 1 status doc created, 0 source files changed |
| No dependencies installed | PASS | No npm/yarn runs |
| No commit made | PASS | Awaiting approval |
| Overlap/collision explicitly assigned | PASS | Assigned to 15L.2 |
| Duplicate chrome explicitly assigned | PASS | Assigned to 15L.2 (Send to Display 3→1, Blank/Restore 2→1, Presenter 2→1, Clear Display 2→1, Browse Templates 2→1) |
| Hollow templates explicitly assigned | PASS | Assigned to 15L.4 |
| Baked-in-text backgrounds explicitly assigned | PASS | Assigned to 15L.4 |
| Tldraw sync explicitly deferred | PASS | Stated in Display Boundary Decision |
| Leaked display note check | PASS | CLEAN in src/ and scripts/ |
| `test:display-studio` | PASS | 63 passed, 0 failed |
| `test:display-composer` | PASS | All composer tests pass |
| `build` | PASS | tsc + vite build clean |
| `lint` | WARN | Pre-existing ENOENT for `.local/` test fixture — not introduced by this phase |
