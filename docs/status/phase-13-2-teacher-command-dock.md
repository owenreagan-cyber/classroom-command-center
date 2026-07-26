# Phase 13.2 — Teacher Command Dock

**Branch:** `phase-13-2-teacher-command-dock`  
**Status:** Validated — ready for commit

## Summary

Replaced the monolithic scrollable `TeacherDock` sidebar with a **Teacher Command Dock** — a deployable-tool operating system for `/control`. Tools register in a typed catalog, persist launcher preferences in versioned local storage, and **only the active tool panel mounts** at runtime.

## Architecture

```
TeacherControlShell
├── TeacherCommandDock          (/control + edit mode only)
│   ├── DockEdgeLauncher        (collapsed strip, favorites — data-dock-edge-tool)
│   ├── DockLauncherPanel       (expandable tool cards — data-dock-tool-card)
│   └── DockToolWorkspace       (single active tool — data-teacher-tool)
└── BoardWorkspace              (classroom canvas — flex-1 min-w-0)
```

| Module | Path | Role |
|--------|------|------|
| Types | `src/features/teacher-dock/types.ts` | Tool ids, categories, statuses, permissions |
| Registry | `src/features/teacher-dock/toolRegistry.ts` | Canonical tool definitions |
| Persistence | `src/features/teacher-dock/dockPersistence.ts` | Hydrate/sanitize persisted state |
| Store | `src/features/teacher-dock/dockStore.ts` | Zustand + localStorage (`teacher-command-dock-v1`) |
| Context | `src/features/teacher-dock/TeacherDockContext.tsx` | Shared props for active tool panels |
| Shell | `src/features/teacher-dock/TeacherCommandDock.tsx` | Composes launcher + workspace |
| Panels | `src/features/teacher-dock/toolPanels/*` | One wrapper per registered tool |

## Tool lifecycle

| Status | Behavior |
|--------|----------|
| `active` | Featured default; included in default favorites |
| `docked` | Available in launcher panel and edge strip (if favorited) |
| `inactive` | Registered in catalog; hidden from launcher; cannot be set active |

**Runtime flow:**
1. Tool declared in `TEACHER_TOOL_REGISTRY`
2. Launcher lists tools where `status !== 'inactive'`
3. Teacher selects tool → `dockStore.activeToolId` updates
4. `DockToolWorkspace` mounts **one** panel component
5. Stale/inactive `activeToolId` in storage → guard message, no panel mount

## Persistence

**Key:** `teacher-command-dock-v1` · **Version:** `1`

| Field | Purpose |
|-------|---------|
| `collapsed` | Edge-only vs expanded launcher (default: `true`) |
| `favoriteToolIds` | Starred tools (sorted first in launcher) |
| `dockOrder` | Custom tool ordering |
| `activeToolId` | Last opened tool |

Hydration (`dockPersistence.ts`) sanitizes unknown and inactive tool ids on load.

**Unit tests:** collapse, order/favorites, active tool, inactive rejection, invalid id sanitization.

## Privacy model

| Route | TeacherCommandDock | Tool panels | Registry |
|-------|-------------------|-------------|----------|
| `/control` + edit | ✓ | Active tool only | ✓ |
| `/control` + display mode | ✗ (null) | ✗ | ✗ |
| `/display` | ✗ | ✗ | ✗ |

- `shouldMountTeacherDock('display')` → `false`
- `shouldExposeToolRegistryOnRoute('display')` → `false`
- `StudentDisplayShell` has no dock import path
- E2E asserts `[data-teacher-command-dock]` count = 0 on `/display`

## Performance audit

| Check | Result |
|-------|--------|
| Only active tool renders | ✓ `DockToolWorkspace` conditional mount |
| Inactive tools blocked | ✓ Registry + hydrate + workspace guard |
| Selectors isolate subscriptions | ✓ `selectDockCollapsed`, `selectActiveToolId`, etc. |
| Memoized shell components | ✓ `memo` on launcher, cards, workspace |
| Context stability | ✓ `useMemo` in `TeacherControlShell` + `TeacherCommandDock` |
| Hidden tool mounting | ✗ Panels still in bundle (static imports) — see bundle analysis |
| Board workspace width | ✓ `flex-1 min-w-0` wrapper prevents canvas squeeze |

**Note:** Render isolation is correct; bundle still includes all panels until lazy loading (Phase 13.3+). See `docs/status/phase-13-2-bundle-analysis.md`.

## Migrated tools

| Category | Tools |
|----------|-------|
| Daily | Dashboard, Timers, Classroom Atmosphere, Morning Message, Today Prep |
| Students | Mystery Star, Quick Picker, Prize Board |
| Instruction | Materials, Display, OmniNote |
| Management | Jobs, Noise (inactive), Board Control |

## Validation results (final)

| Command | Result |
|---------|--------|
| `npm run build` | **PASS** |
| `npm run lint` | **PASS** |
| `npm run test:teacher-dock` | **PASS** (12 checks) |
| `npm run test:teacher-workstation` | **PASS** |
| `npm run test:routines` | **PASS** (120) |
| `npm run test:student-picker` | **PASS** (36) |
| `npm run test:prize-board` | **PASS** (122) |
| `npm run test:local-packets` | **PASS** (85) |
| `npm run test:e2e` | **PASS** (59/59) |

## E2E hardening

- `tests/e2e/helpers/teacher-dock-e2e.ts` — `openDockTool`, `dockToolWorkspace`, `expandDockLauncher`
- Stable attributes: `data-teacher-command-dock`, `data-teacher-tool`, `data-dock-edge-tool`, `data-dock-tool-card`
- Selectors scoped to tool workspace (no strict-mode collisions)
- `openDockTool` expands launcher when tool not in edge favorites

## Snapshot updates

- `control-prize-board-idle-1366x1024-chromium-darwin.png` — regenerated
- `control-prize-board-spinning-1366x1024-chromium-darwin.png` — regenerated

## Known limitations

- All tool panels statically imported (582 KB bundle — see bundle analysis)
- Noise Control inactive by default — no teacher toggle yet
- Drag-to-reorder dock cards not implemented (order via store API only)
- Edge launcher shows max 6 favorites when collapsed

## Recommended next phase

**Phase 13.3 — Dock UX polish & code splitting**

- Lazy-load tool panels (`React.lazy` + Suspense)
- Teacher toggle to activate inactive tools
- Drag-to-reorder dock cards
- Keyboard shortcuts for favorites
