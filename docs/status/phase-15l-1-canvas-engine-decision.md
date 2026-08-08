# Phase 15L.1 — Canvas Engine Decision + Board/Scene/Widget Target Model

**Branch:** `phase-15l-1-canvas-engine-decision`
**Starting commit:** `1468634` — Fix leaked display renderer implementation note
**Date:** 2026-08-08

## Summary

Documentation-only architecture decision package. Evaluated three canvas engine options (hand-rolled React/DOM, tldraw, React-Konva) for the classroom display canvas and defined the target Board > Scene > Widget model to replace the three parallel board/scene/widget systems found in the current-state review.

## Status: Documentation-only — no application code changed

No application code was modified. No dependencies were installed. No routes, widgets, stores, or tests were changed.

## Files Added

| File | Purpose |
|------|---------|
| `docs/architecture/canvas-engine-decision.md` | Canvas engine comparison (3 options), licensing analysis, recommendation |
| `docs/architecture/board-scene-widget-target-model.md` | Target Board/Scene/Widget model, typed settings, display-safe protocol, migration plan |
| `docs/status/phase-15l-1-canvas-engine-decision.md` | This status report |

## What Was Evaluated

### Canvas Engine Options

| Option | License | Watermark | Recommendation |
|--------|---------|-----------|---------------|
| A: Hand-rolled React/DOM | MIT (owned) | None | Only if both tldraw and Konva are ruled out |
| B: tldraw | Source-available (not MIT) | "Made with tldraw" | **Preferred** if watermark is acceptable on /display |
| C: React-Konva | MIT | None | **Fallback** if watermark/licensing is unacceptable |

Key findings:
- tldraw provides production-grade canvas interactions (selection, pan/zoom, resize, camera, undo, spatial indexing) out of the box but is source-available, not open-source, and includes a visible watermark on the canvas
- React-Konva is MIT-licensed with no watermark but requires custom implementation of selection, pan/zoom, camera, and undo
- Both options require migrating `CanvasWidget` and `PageWidget` instances to the engine's shape model
- No dependency is adopted in this phase

### Target Model

The Board > Scene > Widget hierarchy was defined to replace the three parallel systems:

| Current System | Target Mapping |
|---------------|----------------|
| `DisplayComposerPersistedState` (flat screens) | `Board` with `Scene[]` |
| `BoardState` (monolithic bag) | `Board` per classroom screen |
| `ClassWorkspace` → `VibePage` | `Board` with `Scene[]` per ClassWorkspace |

New widget semantics added:
- **Pin:** widget appears on every Scene in a Board
- **Spotlight:** full-canvas solo mode for one widget on /display
- **Focus:** enlarged centered widget, others dimmed
- **Typed settings:** discriminated union replaces `Record<string, unknown>`
- **Shared display-safe protocol:** single `toDisplaySafeWidget()` replaces 15 manual switch-case projections

### Migration Plan

| Phase | Description | Code Change? |
|-------|-------------|-------------|
| 15L.2 | Visual/layout safety fixes, duplicate chrome cleanup | Yes |
| 15L.3 | Widget contract/type planning (documentation) | No |
| 15M | Canvas engine prototype/spike | Yes (isolated) |
| 15N | Production migration to chosen engine | Yes |

## What Was Deferred

- Adoption of tldraw, Konva, or any canvas engine dependency
- Data migration from `CanvasWidget`/`PageWidget` to `Widget`
- Removal of `WidgetCanvasCard.tsx` or `WidgetDisplayOverlay.tsx`
- Typed widget settings implementation
- Display-safe protocol implementation
- localStorage key collision fix (`classroom-curriculum-library-v1`)
- Pin/spotlight/focus feature implementation

## Validation

### Test Suites

| Command | Result | Notes |
|---------|--------|-------|
| `npm run test:display-studio` | PASS | 63 passed, 0 failed |
| `npm run test:display-composer` | PASS | All composer/pack/template/readability + AI safety tests pass |
| `npm run build` | PASS | tsc + vite build clean (789.97 kB JS, 163.18 kB CSS) |
| `npm run lint` | WARN | ESLint ENOENT for `.local/display-composer-tests/data/backgroundAssets.js` — pre-existing environment issue, not caused by this phase (no application code changed) |

### Leaked Display Implementation Note Check

```
grep -RIn "I'll actually do this differently\|actually do this differently\|update key layout areas" src scripts docs || true
```

Result: CLEAN in src/ and scripts/ (only matches are in `scripts/test-display-studio.sh:51` which is the guard script itself checking for the leaked phrase, a historical status reference).

### Explicit Statement

**No application code changed.** The only files modified are three new documentation files in `docs/architecture/` and `docs/status/`. No TypeScript, CSS, test, script, or configuration files were modified.

## PASS/WARN/FAIL Summary

| Check | Status | Notes |
|-------|--------|-------|
| Repo state | PASS | Working tree clean on `phase-15l-1-canvas-engine-decision` |
| Base commit | PASS | `1468634` — Fix leaked display renderer implementation note |
| Canvas engine decision doc | PASS | Created at `docs/architecture/canvas-engine-decision.md` |
| Board/Scene/Widget model doc | PASS | Created at `docs/architecture/board-scene-widget-target-model.md` |
| Status report | PASS | Created at `docs/status/phase-15l-1-canvas-engine-decision.md` |
| No application code changed | PASS | Only 3 doc files added, 0 source files modified |
| No dependencies installed | PASS | No npm/yarn runs |
| No commit made | PASS | Awaiting approval |
| Leaked display note check | PASS | CLEAN in src/ and scripts/ — only the guard script itself references the leaked phrase |
| `test:display-studio` | PASS | 63 passed, 0 failed |
| `test:display-composer` | PASS | All composer tests pass |
| `build` | PASS | tsc + vite build clean |
| `lint` | WARN | Pre-existing ENOENT for `.local/` test fixture — not introduced by this phase |
