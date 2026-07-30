# Classroom Command Center v1.0 Release Candidate

Status: Release Candidate  
Date: 2026-07-30  
Branch: `feat/classroom-command-center-v1-release-candidate`  
Baseline: `007fdb1`

## Baseline State

| Check | Result |
|-------|--------|
| `npm install` | PASS (pre-existing) |
| `npm run build` | PASS — 631 kB JS chunk (non-blocking warning) |
| `npm run lint` | PASS — 0 errors, 0 warnings |
| `npm run test:launch-readiness` | **Partial locally** — build/lint/unit pass; Playwright requires local Chromium install |

## Linux Playwright Snapshot Baselines

Added **12 reviewed `*-chromium-linux.png`** baselines generated in GitHub Actions Ubuntu (run `30576243669`) and compared against existing Darwin baselines before acceptance.

| Spec | Linux baselines |
|------|----------------|
| `display-snapshots.spec.ts` | 5 |
| `prize-board-ipad-landscape-snapshots.spec.ts` | 2 |
| `prize-board-projector-snapshots.spec.ts` | 5 |

**Visual review:** All Linux captures show the correct route/state (Homeroom display, Morning Message, Now Showing, Prize Board idle/spinning control, projector default/spin/rare/legendary/whammy). No blank screens, error overlays, teacher-only leakage, or unintended animation frames. Platform font antialiasing differs from Darwin as expected; layout and content match.

**Maintenance:** `.github/workflows/playwright-linux-snapshots.yml` (workflow_dispatch) and CI failure artifact `playwright-snapshot-actuals` support future baseline regeneration without auto-updating PR checks.

## Feature Audit Summary

See full audit: [`classroom-command-center-v1-audit.md`](./classroom-command-center-v1-audit.md)

- **18 features COMPLETE** — classroom screens, messages, timers, picker, Mystery Star, prize board, dock, canvas, display, backup, curriculum tooling
- **1 feature ADDED** — Random Number Selector (was MISSING)
- **2 FROZEN — OMNINOTE** — bridge and handoff (regression-tested, not expanded)
- **0 BROKEN**

## Features Repaired

| Issue | Fix |
|-------|-----|
| ESLint react-hooks warnings in `TodayPrepPanel.tsx`, `DockLauncherPanel.tsx` | Removed unnecessary `useMemo` around `scorePackage()` — zustand action reads live override state on each render |

No other confirmed defects required code changes during this RC pass.

## Random Number Selector

**Location:** `src/features/random-number/`

| Requirement | Implementation |
|-------------|----------------|
| Default range 1–100 | `DEFAULT_MIN` / `DEFAULT_MAX` in store |
| Configurable min/max with validation | Panel inputs + `validateRange()` |
| Draw Number | `drawNumber()` action |
| Large student display | `RandomNumberDisplay` overlay on `/display` |
| No-repeat mode | `preventRepeat` + exhaustion detection |
| Draw history / undo / reset | Store actions + confirmation UI |
| Persistence | `classroom-random-number-v1` localStorage key |
| Teacher Dock | Tool id `random-number` in Students category |
| Tests | 29 assertions in `tests.ts`, `npm run test:random-number` |

**Display privacy:** Only the drawn number reaches `/display`. History, bounds, and config are teacher-only on `/control`.

## Files Changed

### New
- `src/features/random-number/` (types, logic, store, displaySafe, components, tests)
- `src/features/teacher-dock/toolPanels/RandomNumberToolPanel.tsx`
- `scripts/test-random-number.sh`
- `docs/status/classroom-command-center-v1-audit.md`
- `docs/status/classroom-command-center-v1-release-candidate.md`

### Modified
- Teacher dock registry, capabilities, panels, types, tests
- `StudentDisplayShell.tsx` — mounts `RandomNumberDisplay`
- `TodayPrepPanel.tsx`, `DockLauncherPanel.tsx` — lint fix
- `package.json` — `test:random-number` script
- `tests/e2e/launch-readiness.spec.ts` — Random Number dock smoke test

## Persistence Changes

| Key | New/Existing | Notes |
|-----|--------------|-------|
| `classroom-random-number-v1` | **New** | min, max, preventRepeat, history, lastResult, showOnDisplay |

No changes to existing persistence keys or schemas.

## Privacy Checks

- Random number display exposes only `value` (via `displaySafe.ts`)
- Prize board, Mystery Star, readiness, and dock registry privacy tests unchanged and passing
- `DISPLAY_FORBIDDEN_KEYS` unchanged — random number uses shared zustand store read on display route (same pattern as prize board overlay)

## Visual Checks

- Random number overlay uses projector-safe typography (`clamp(4rem, 18vw, 12rem)`)
- No wholesale redesign applied
- Full viewport Playwright snapshots not re-run locally (browser install unavailable in agent environment)

## Performance Findings

- Bundle: **631 kB** minified (167 kB gzip) — unchanged within noise of baseline
- **Decision:** No code splitting in RC — curriculum/canvas lazy boundaries exist but risk display startup and offline stability
- Documented as non-blocking

## Validation Commands and Outcomes

| Command | Result |
|---------|--------|
| `npm run build` | PASS |
| `npm run lint` | PASS (0 warnings) |
| `npm run test:routines` | PASS (120) |
| `npm run test:student-picker` | PASS (36) |
| `npm run test:prize-board` | PASS (122) |
| `npm run test:pages` | PASS (153) |
| `npm run test:studio-canvas` | PASS (93) |
| `npm run test:app-route` | PASS |
| `npm run test:display-launch` | PASS (12) |
| `npm run test:display-polish` | PASS (15) |
| `npm run test:morning-message` | PASS (34) |
| `npm run test:timers` | PASS |
| `npm run test:classroom-atmosphere` | PASS |
| `npm run test:teacher-dock` | PASS |
| `npm run test:device-manager` | PASS |
| `npm run test:workspace` | PASS |
| `npm run test:random-number` | PASS (29) |
| `npm run test:omninote-bridge` | PASS |
| `npm run test:omninote-handoff` | PASS |
| `npm run test:omninote-command-center-handoff` | PASS (xcodebuild simulator unavailable — WARN) |
| `npm run test:launch-readiness` | **Not fully run** — Playwright Chromium missing in sandbox |
| Playwright e2e / visual QA | **Skipped locally** — run `npx playwright install chromium` then `npm run test:e2e` |

## Remaining Warnings

- Vite chunk size > 500 kB (non-blocking, documented)
- OmniNote iOS simulator validation WARN (environment limitation)

## Known Limitations

- Teacher Dock **Noise Control** tool remains `inactive` — voice level controlled via board widgets
- Legacy screen components in `src/screens/` unused at runtime (Studio Canvas supersedes)
- Playwright e2e requires local browser install for full RC proof

## Deferred OmniNote Work

Per OmniNote freeze:
- No handoff contract changes
- No new OmniNote features
- Existing dock panel and tests preserved
- Command Center operates fully without OmniNote

## Recommended v1.1 Roadmap

1. Activate Noise Control dock tool or consolidate with board widgets
2. Safe route-level code splitting for curriculum library
3. Playwright e2e for Random Number display workflow
4. Resume OmniNote handoff when freeze lifts
5. Optional microphone voice-level monitoring (explicitly out of v1.0 scope)

## v1.0 Scope Statement

**Full Classroom Command Center features remain in v1.0.**  
Only further OmniNote handoff development is paused.
