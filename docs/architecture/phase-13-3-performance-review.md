# Phase 13.3 — Performance Review

Scope: Teacher Dock, Workspace store, Device Manager (architecture layer).  
Action: document findings only — no non-trivial optimizations implemented in this phase.

## Teacher Dock

**Current behavior**

- `TeacherCommandDock` uses `memo`, selector-based Zustand subscriptions, and `useMemo` for context — good baseline.
- `DockToolWorkspace` mounts **only the active tool panel** — inactive panels are not rendered.
- `DockLauncherPanel` and `DockEdgeLauncher` each subscribe to `useWorkspaceStore` independently — acceptable at current scale.

**Findings**

| Area | Observation | Risk |
|------|-------------|------|
| Tool panel imports | `toolPanels/index.ts` statically imports all 14 panels | Increases initial bundle; all panel code loads even when dock closed |
| Launcher recompute | `getWorkspaceAwareLauncherTools` runs on every dock order / workspace change | Low — pure function, small registry |
| Context value | `TeacherDockProvider` value merges dock context + callback | Low — stable when deps unchanged |

**Future (not implemented)**

- **Lazy loading:** `React.lazy()` per tool panel with `Suspense` fallback in `DockToolWorkspace`
- **Dynamic imports:** `import(\`./toolPanels/${toolId}ToolPanel\`)` behind a loader map
- **Bundle splitting:** Vite manual chunks for `teacher-dock` vs `device-manager` vs heavy tools (prize board, atmosphere)

## Workspace

**Current behavior**

- `useWorkspaceStore` is a small persisted Zustand slice (active/favorite workspace ids).
- Resolver functions are pure — no subscriptions inside resolver layer.

**Findings**

| Area | Observation | Risk |
|------|-------------|------|
| Duplicate store reads | Dock launcher + edge launcher both read workspace id | Low — two selectors, same store |
| Registry lookup | `getWorkspaceById` on each workspace change in panel | Negligible — Map lookup |

**Future**

- Single `useWorkspaceLauncher()` hook combining workspace id + sorted tools if dock grows beyond ~20 tools
- Memoize promoted tools per workspace id if profiling shows hot path

## Device Manager

**Current behavior**

- `useDeviceStore` persists preferences only; `getDevices()` hydrates registry on call.
- Launch/display resolution is synchronous pure logic — suitable for unit tests, no render cost.

**Findings**

| Area | Observation | Risk |
|------|-------------|------|
| Store hydration | `getDevices()` rebuilds array from registry + overrides each call | Low at 3 default devices |
| No React integration yet | Launch resolver not wired into dock activate handler | N/A for perf; future wiring should debounce repeated launches |

**Future**

- Cache hydrated device list in store if device count or override churn increases
- Selectors: `selectDevicesForRole(role)` to avoid full list scans in UI

## Inactive tool loading

- `noise` is registered but `inactive` — excluded from launcher via `isToolLaunchable`.
- Panel component still bundled via static import — lazy panels would skip inactive tool code entirely.

## Summary

No critical render loops or duplicate subscription bugs found. Primary optimization opportunity is **lazy/dynamic tool panel loading** when bundle size or Time-to-Interactive becomes a concern. Architecture layers (device + workspace resolvers) are lightweight and test-friendly.
