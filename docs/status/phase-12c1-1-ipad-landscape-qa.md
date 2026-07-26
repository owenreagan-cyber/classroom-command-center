# Phase 12C.1.1 Status — iPad Landscape QA

**Branch:** `phase-12c-press-your-luck-experience`  
**Date:** 2026-07-25  
**Status:** Validation complete

## Viewport tested

**1366×1024** — classroom iPad landscape (teacher control device)

## Delivered

### Workflow E2E tests (4 tests)

| Test | Verifies |
|------|----------|
| No horizontal overflow on `/control` | `document.documentElement.scrollWidth` ≤ viewport + 2px |
| Prize Board controls usability | Teacher Dock, Start Spin, Remaining Spins, Sound toggle visible and laid out |
| SecretStopZone reachable during spin | Stop zone attached and positioned in bottom-right quadrant during `spinning` |
| Projector privacy at iPad landscape | `/display` student-safe, no teacher controls, no internal identifiers |

Run: `npm run test:e2e -- tests/e2e/prize-board-ipad-landscape.spec.ts`

### Control snapshot baselines (2)

| Snapshot | Scene |
|----------|-------|
| `control-prize-board-idle-1366x1024.png` | Prize Board panel idle, deterministic tile pattern |
| `control-prize-board-spinning-1366x1024.png` | Mid-spin highlight, secret stop attached |

Run: `npm run test:prize-board-projector-snapshots` (includes iPad control snapshots)

Snapshot stability:
- `animations: 'disabled'`
- `document.fonts.ready` before capture
- `prefers-reduced-motion: reduce` emulated
- Deterministic homeroom board (fixed prize tile pattern) for idle/spinning baselines
- Serial test mode to avoid Teacher Dock scroll race
- Spinning snapshot seeds PYL state via `__setPylState` (avoids animation timing drift)

### Shared helpers extended

`tests/e2e/helpers/prize-board-e2e.ts`:
- `IPAD_LANDSCAPE_VIEWPORT`
- `assertNoHorizontalOverflow`
- `assertControlPrizeBoardUsability`
- `assertSecretStopZoneReachable`
- `scrollPrizeBoardPanelIntoView`
- `prepareStableControl` / `assertControlReadyForSnapshot`
- `generateDeterministicHomeroomBoard`

## Validation results

| Command | Result |
|---------|--------|
| `npm run build` | PASS |
| `npm run lint` | PASS |
| `npm run test:prize-board` | PASS (122) |
| `npm run test:student-picker` | PASS (36) |
| `npm run test:local-packets` | PASS (167) |
| `npm run test:e2e` | PASS (58) |
| `npm run test:prize-board-projector-snapshots` | PASS (7: 5 projector + 2 iPad control) |

## Privacy confirmation

`/display` iPad landscape test asserts:
- No Teacher Dock, Prize Settings, SecretStopZone, or `data-control-id` controls
- No `studentId`, `prizeId`, or internal prize IDs in HTML
- Prize Board projector mode visible without teacher metadata

`/control` tests confirm teacher-only affordances (Start Spin, Remaining Spins, Sound toggle, SecretStopZone) are present and reachable — never on `/display`.

## Remaining Phase 12D polish

- Final Whammy artwork and external audio assets
- Drumroll / suspense layering
- Additional projector viewport baselines (1366×768, 1024×768)
- Code-split prize-board bundle (~540KB warning)
- Production tree-shake of dev hooks (currently gated by `import.meta.env.DEV`)
- Live spin interaction snapshot (currently seeded for stability)

## Changed files (Phase 12C.1.1)

- `tests/e2e/prize-board-ipad-landscape.spec.ts` (new)
- `tests/e2e/prize-board-ipad-landscape-snapshots.spec.ts` (new)
- `tests/e2e/prize-board-ipad-landscape-snapshots.spec.ts-snapshots/*.png` (2 baselines)
- `tests/e2e/helpers/prize-board-e2e.ts` — iPad helpers + deterministic board
- `scripts/test-prize-board-projector-snapshots.sh` — runs iPad snapshot spec
- `.gitignore` — iPad snapshot directory
