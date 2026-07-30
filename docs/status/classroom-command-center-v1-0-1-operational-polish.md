# Classroom Command Center v1.0.1 — Operational Polish

**Date:** 2026-07-30  
**Branch:** `feat/classroom-command-center-v1-0-1-operational-polish`  
**Baseline commit:** `0d4c465d71b1c9fe1b52b5bd1997d0cb23cc360f` (v1.0 RC, PR #14)

## Scope

Narrow operational-hardening pass for classroom hardware validation:

1. Local Playwright reliability on Apple Silicon Mac
2. Noise / Voice Level Teacher Dock activation
3. Repeatable classroom smoke-test workflow
4. Confirmed-defect fixes from validation (e2e test updates for noise activation)

OmniNote remains **frozen** — no expansion, no handoff contract changes.

---

## Host Architecture Diagnosis

| Check | Result |
|-------|--------|
| `uname -m` | arm64 |
| `node -p process.arch` | arm64 |
| Node | v26.4.0 |
| Playwright | 1.61.1 |
| Native Chromium cache | `~/Library/Caches/ms-playwright/chromium_headless_shell-1228` (arm64) |

**Root cause of prior local failures:** Cursor agent sandbox sets `PLAYWRIGHT_BROWSERS_PATH` to a sandbox cache that can mismatch host architecture. Native arm64 browsers in `~/Library/Caches/ms-playwright` are correct.

**Repair:** `scripts/ensure-playwright-host-env.sh` unsets sandbox override; `scripts/diagnose-playwright-host.sh` reports PASS/WARN/FAIL and verifies Chromium launch. `npm run test:playwright-host` added.

---

## Local Playwright Repair

- Added `scripts/diagnose-playwright-host.sh` + `scripts/ensure-playwright-host-env.sh`
- Wired ensure-host into `test:launch-readiness`, snapshot scripts, and `test:e2e`
- **AUTOMATED PASS:** `npm run test:playwright-host` — Chromium launch OK
- **AUTOMATED PASS:** 73/73 Playwright e2e tests locally (darwin)
- **AUTOMATED PASS:** Darwin display + prize-board snapshot specs (no baseline updates)

---

## Noise Dock Audit & Activation

**Before:** `noise` tool registered with panel wiring but `status: 'inactive'` in `toolRegistry.ts`.

**After:** `status: 'docked'` — launchable from Teacher Dock, uses existing `boardStore.noiseTrackers` and `NoiseControlPanel` (no duplicate store, no microphone).

**Canonical voice levels (unchanged):** `silent`, `whisper`, `normal`, `off`  
**Labels:** 0 Silent, 1 Whisper, 2 Normal Voice, Off / Inactive

**Trackers:** Homeroom, Math, Reading — independent persistence via `normalizeNoiseTrackerMap`.

---

## Files Changed

| Area | Files |
|------|-------|
| Playwright host | `scripts/diagnose-playwright-host.sh`, `scripts/ensure-playwright-host-env.sh`, `package.json`, snapshot/launch scripts |
| Noise activation | `src/features/teacher-dock/toolRegistry.ts` |
| Noise tests | `src/features/noise-control/tests.ts`, `scripts/test-noise-control.sh`, `scripts/validate-noise-rules.ts` |
| Dock tests | `src/features/teacher-dock/tests.ts` |
| E2E | `tests/e2e/control-display-routes.spec.ts`, `tests/e2e/launch-readiness.spec.ts`, `tests/e2e/helpers/teacher-dock-e2e.ts` |
| Smoke workflow | `docs/qa/classroom-hardware-smoke-test.md`, `scripts/run-classroom-smoke.sh` |

---

## Tests Added / Updated

- `npm run test:playwright-host` — host diagnosis + Chromium launch probe
- `npm run test:noise-control` — 36 unit assertions + screen-assignment validation
- Teacher dock unit tests — noise launchable, persistence, panel registered
- E2e — Noise Control in launcher + panel renders on `/control`
- Updated e2e inactive-tool expectation (noise now active)

---

## Smoke-Test Workflow

- **Guide:** `docs/qa/classroom-hardware-smoke-test.md`
- **Script:** `npm run smoke:classroom` — build, lint, host diagnosis, noise tests, core unit tests, manual checklist URLs (127.0.0.1 default)

---

## Browser Verification

**BROWSER PASS** (automated screenshots under `.local/visual-qa/v1-0-1/`, not committed):

- 1440×900 `/control`
- 1920×1080 `/display` (projector)
- 1366×768 `/display`
- 1180×820 `/control` (tablet landscape)
- Noise Control panel open at 1440×900

No UI redesign; no Darwin baseline updates required.

---

## Defects Repaired

1. **Local Playwright sandbox path mismatch** — ensure-host env helper (operational, not product defect)
2. **Noise Dock inactive** — activated in registry; e2e updated
3. **validate-noise-rules.ts stale screen IDs** — aligned with current `ScreenId` type

No privacy leaks, state-loss, or timer regressions found in automated validation.

---

## Privacy & Persistence Verification

- **AUTOMATED PASS:** Display privacy regression e2e (3 tests)
- **AUTOMATED PASS:** Noise unit tests — tracker independence, malformed state normalization, reset isolation
- Student display uses `VoiceLevelWidget` only; `NoiseControlPanel` is control-route / dock only
- No microphone APIs added

---

## Validation Results (local, arm64 Mac)

| Command | Result |
|---------|--------|
| `npm run build` | PASS |
| `npm run lint` | PASS (0 warnings) |
| `npm run test:playwright-host` | PASS |
| `npm run test:noise-control` | PASS (36 + screen rules) |
| `npm run test:teacher-dock` | PASS |
| `npm run test:e2e` | PASS (73/73) |
| `npm run test:launch-readiness` | PASS |
| `npm run test:display-snapshots` | PASS (5/5, darwin baselines unchanged) |
| `npm run test:prize-board-projector-snapshots` | PASS |
| Core unit scripts (routines, picker, prize-board, random-number, pages, timers, etc.) | PASS |

---

## Dependency Audit

**2 high-severity npm vulnerabilities** (unchanged):

| Package | Severity | Exposure |
|---------|----------|----------|
| `brace-expansion` ≤5.0.7 | high | Dev transitive (eslint/minimatch chain); DoS via pathological expansion — low runtime risk in local-first app |
| `postcss` ≤8.5.17 | high | Dev/build (Tailwind/Vite); source-map path traversal during **build** only |

**Recommendation:** `npm audit fix` (non-force) in a future maintenance window after lockfile review. **Not applied** in this pass to avoid unintended dependency churn.

**Vite bundle warning:** main chunk ~631 kB gzip ~168 kB — documented, deferred (no performance refactor in v1.0.1).

---

## Remaining Warnings

- Vite chunk size > 500 kB
- OmniNote iPad physical device validation: **WARN** (simulator OK; handoff frozen)
- `npm warn Unknown env config "devdir"` — local npm config, non-blocking
- **MANUAL HARDWARE CHECK REQUIRED:** projector + two-window classroom workflow per `docs/qa/classroom-hardware-smoke-test.md`

---

## OmniNote Freeze Confirmation

No OmniNote functionality added. Handoff scripts run as WARN for physical iPad only. Standalone Command Center does not depend on OmniNote.

---

## Sign-off Layers

| Layer | Status |
|-------|--------|
| AUTOMATED PASS | Build, lint, unit, e2e, snapshots, host Playwright |
| BROWSER PASS | Preview screenshots + Playwright viewport tests |
| MANUAL HARDWARE CHECK REQUIRED | Owen — teacher Mac + classroom projector/display |
