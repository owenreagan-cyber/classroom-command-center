# Phase 8B — Teacher Control / Student Display Route Split

Status: COMPLETE

## Goal

Establish a structural route boundary between teacher workspace (`/control`) and student/projector display (`/display`). Route safety is enforced by composition — teacher-only components are not mounted on `/display`.

This is a projector-safety boundary, not authentication. Anyone with local machine access can still navigate to `/control`.

## Route Table

| Path | Route | Behavior |
|------|-------|----------|
| `/control` | `control` | Full teacher workspace with Teacher Dock |
| `/control/` | `control` | Trailing slash normalized |
| `/display` | `display` | Student-safe projector view |
| `/display/` | `display` | Trailing slash normalized |
| `/` | `root` | Redirects to `/control` via `history.replaceState` |
| Unknown | `root` | Redirects to `/control` |

## Root and Unknown Path Behavior

- `getAppRoute()` returns `root` for `/` and unknown paths.
- `RootRedirect` calls `redirectRootToControl()` (`window.history.replaceState`) and dispatches `popstate`.
- No redirect loops: only `/` and unknown paths redirect; `/control` and `/display` render directly.

## Privacy Boundary

`/display` does **not mount**:

- `TeacherDock`
- `BoardBackupPanel` / backup-restore tools
- `LocalPacketPanel`
- `StudentPickerPanel`
- Mystery Star / coaching controls (`CoachingCard`, `MysteryRevealStage` in `BoardFrame`)
- `StudioToolbar` / `StudioInspector` (via forced display mode → `ClassroomCanvas`)
- `TeacherNotesPanel`
- Edit entry button on board header

`/display` **does render**:

- Active classroom screen and nested vibe page
- Persisted board state from Zustand
- `ClassroomCanvas` (read-only widget geometry)
- Student-facing timers, instructions, and approved widgets

Route safety does **not** rely solely on the Display/Edit toggle. `/display` forces effective display mode even when persisted mode is `edit`, without mutating persisted mode.

## Shared State Behavior

- Single Zustand store; no display-specific store fork.
- Route changes do not reset screen, page, picker sessions, Mystery Star, or board content.
- URL is the source of truth for route (not stored in Zustand).

## Studio Canvas Behavior

- `/control` + edit mode: `StudioCanvas` with toolbar and inspector
- `/control` + display mode: `ClassroomCanvas` via mode toggle
- `/display`: always `ClassroomCanvas`; no studio editing chrome

## Implementation Files

| File | Role |
|------|------|
| `src/app/appRoute.ts` | Pathname → route utility |
| `src/app/appRouteShell.ts` | Composition helpers (`shouldMountTeacherDock`, `getEffectiveBoardMode`) |
| `src/app/useAppRoute.ts` | Reactive route hook |
| `src/app/RootRedirect.tsx` | Root/unknown path redirect |
| `src/app/AppShell.tsx` | Routes to control or display shell |
| `src/app/TeacherControlShell.tsx` | Teacher workspace + dock |
| `src/app/StudentDisplayShell.tsx` | Display-only workspace |
| `src/app/BoardWorkspace.tsx` | Shared active screen rendering |

## Tests Added

| Test | Command |
|------|---------|
| Route utility | `bash scripts/test-app-route.sh` |
| Shell composition + state invariants | `bash scripts/test-app-route-shell.sh` |
| E2E control/display routes | `npm run test:e2e -- tests/e2e/control-display-routes.spec.ts` |

Shell tests cover: route mapping, TeacherDock mount rules, effective mode forcing, persisted mode preservation, studio edit gating.

E2E tests cover: teacher controls on `/control`, absent on `/display`, classroom content on `/display`, root/unknown redirect, mode preserved after route round-trip.

## Validation Results

See final report in conversation / run locally:

```bash
npm run build
npm run lint
npm run test:app-route
npm run test:e2e -- tests/e2e/control-display-routes.spec.ts
```

## Known Limitations

- No deep-link sync between tabs beyond shared localStorage persistence
- Static hosting must serve `index.html` for `/control` and `/display`
- `/display` does not block manual navigation to `/control` on the projector browser
- No PIN, password, or account system

## Recommended Next Step

Phase 8C — Today Prep + Teacher Material Launcher, or add explicit `/control` ↔ `/display` links in Teacher Dock for classroom workflow.
