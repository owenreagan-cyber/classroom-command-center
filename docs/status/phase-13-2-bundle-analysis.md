# Phase 13.2 — Bundle Analysis

**Date:** 2026-07-26  
**Branch:** `phase-13-2-teacher-command-dock`  
**Current main bundle:** ~582 KB minified (~154 KB gzip)

## Summary

The Teacher Command Dock adds ~14 tool panel wrappers to the main chunk because all panels are statically imported via `toolPanels/index.ts`. The dock itself is lightweight; the bundle size is dominated by pre-existing feature modules that were always imported when the monolithic `TeacherDock` mounted everything at once.

**Phase 13.2 did not materially increase bundle size** — the old dock eagerly mounted the same panels. The new architecture is structured for lazy loading in a follow-up phase.

## Build output

| Asset | Size (min) | Gzip |
|-------|------------|------|
| `index-*.js` | 582 KB | 154 KB |
| `index-*.css` | 130 KB | 19 KB |

Vite warning: chunk > 500 KB.

## Largest source contributors (by line count)

| Module | Lines | Role |
|--------|-------|------|
| `store/boardStore.ts` | 1,047 | Core board state |
| `features/local-packets/integration-tests.ts` | 755 | Test file (not in bundle) |
| `store/timerStore.ts` | 749 | Timer state + logic |
| `features/local-packets/LocalPacketPanel.tsx` | 692 | Board Control tool |
| `board/TodayPrepPanel.tsx` | 586 | Today Prep / Materials |
| `features/student-picker/pickerStore.ts` | 564 | Mystery Star / Picker |
| `board/DailyBriefPanel.tsx` | 538 | Jobs tool |
| `features/morning-message/MorningMessageStudioPanel.tsx` | 481 | Morning Message |
| `features/prize-board/tests.ts` | 456 | Test file (not in bundle) |
| `features/prize-board/components/PrizeBoardPanel.tsx` | 342 | Prize Board |

## Teacher Dock import graph

```
TeacherControlShell
└── TeacherCommandDock (static)
    └── toolPanels/index.ts (static Record — all 14 panels)
        ├── PrizeBoardPanel + pressYourLuck stack
        ├── StudentPickerPanel + pickerStore
        ├── TodayPrepPanel + routineEngine
        ├── MorningMessageStudioPanel
        ├── ClassroomAtmospherePanel + Spotify embed
        ├── BoardControlToolPanel (presets, backup, packets, notes)
        └── …
```

**Key finding:** `DockToolWorkspace` only *renders* the active panel, but webpack/vite still bundles all panels because of static imports in `toolPanels/index.ts`.

## Lazy-load candidates (recommended Phase 13.3+)

| Priority | Module | Est. savings | Rationale |
|----------|--------|--------------|-----------|
| 1 | Prize Board + Press Your Luck | High | Largest game UI, audio hooks, spin engine |
| 2 | Local Packets / Board Backup | Medium | Heavy panel, rarely opened |
| 3 | Student Picker + pickerStore | Medium | Large store, tab UI |
| 4 | Morning Message Studio | Medium | Studio editor, preview |
| 5 | Classroom Atmosphere | Low–Medium | Spotify embed player |
| 6 | OmniNote bridge | Low | Small panel today; grows with Level 2+ |
| 7 | Timer widgets (×3 + phase) | Low | Already on board screens too |

## Recommended approach

```typescript
// Future pattern for toolPanels/index.ts
const TOOL_PANEL_LOADERS: Record<ToolId, () => Promise<{ default: ComponentType }>> = {
  'prize-board': () => import('./PrizeBoardToolPanel'),
  // ...
}
```

Wrap `DockToolWorkspace` in `<Suspense>` (already planned). Display route (`StudentDisplayShell`) never imports `TeacherCommandDock`, so lazy dock panels do not affect projector bundle.

## Not recommended for lazy load

- Dashboard, Display, Timers — small, frequently used
- Dock shell components — tiny, always needed on `/control`

## Action for this phase

Document only. No code splitting in 13.2 to keep merge scope focused on architecture validation.
