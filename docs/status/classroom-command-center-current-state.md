# Classroom Command Center — Current State Audit

Status: reconciled after Phase 8C Today Prep + Material Launcher
Date: 2026-07-25
Project: `~/Projects/classroom-command-center`

## Current Repo State

Latest confirmed main before Phase 8A:

- `1171c48 Fix Studio Canvas history and backup integrity (#7)`
- `npm run build` — PASS
- `npm run lint` — PASS

Important: this repo is now beyond the older Phase 4C/4D roadmap. Basic inline editing, widget visibility, routine-aware pages, backup/restore, random picker/Mystery Star, local packets, noise widgets, Studio Canvas, and Studio Canvas repair work have already been implemented or superseded.

For the reconciled build checklist, see:

- `docs/roadmap/classroom-command-center-build-state-checklist.md`

## Validation

Latest confirmed local checks:

- `npm run build` — PASS
- `npm run lint` — PASS

Previously documented broader validation after Studio Canvas repair:

- `npm run test:routines` — PASS
- `npm run test:pages` — PASS
- `npm run test:student-picker` — PASS
- `npm run test:local-packets` — PASS
- `npm run test:studio-canvas` — PASS
- `npm run test:e2e` — PASS, Chromium/dev-server dependent
- `git diff --check` / `git diff --cached --check` — PASS

## Dependency State

Current runtime dependencies remain lightweight:

- react
- react-dom
- zustand

Current dev/build dependencies:

- vite
- typescript
- eslint
- tailwindcss
- React/Vite/types tooling

Not currently added:

- Dexie
- Zod
- React Hook Form
- PDF.js
- Lottie
- Rive
- Spotify SDK
- Tauri
- Konva
- tldraw
- Firebase
- Supabase

The app remains local-first and classroom-reliable.

## Current Implemented Capabilities

Implemented:

- local-first Vite/React/TypeScript app
- board display shell
- Teacher Dock
- Display/Edit mode
- background manifest and Canva-exported background support
- nested vibe page architecture
- routine-aware classroom flows
- Previous/Next page navigation
- stable vibe page IDs
- Homeroom, Math, Reading, Snack, Lunch, Homework, Pack Up, Spelling, and Ready Position flows
- SmartTextCard system
- AutoFitText with overflow fallback behavior
- MaterialsCard
- ReminderCard
- DoNowCard
- ReadyPositionCard
- Lesson Card
- Vocabulary Card
- conservative local Beautify and Undo Beautify
- TimerWidget
- PhaseTimerCard / RoutineTimerCard
- wall-clock timer reload recovery
- routine engine with canonical block timing and transition routines
- widget visibility toggles and placeholders
- inline editing and inline editing polish
- student/teacher visibility model
- teacher-only notes
- Voice Level / Traffic Light Widget
- Noise tracker foundation
- Noise tower defense phase
- Daily Brief Intake and routine templates
- daily board presets
- custom presets export/import
- Random Picker and Mystery Star
- roster, fairness, picker history, and coaching systems
- Local Packet Backup and Restore
- Daily Brief import/export
- full local backup/restore with validation and undo
- Studio Canvas foundation
- bounded 16:9 authoring surface
- seeded draggable page widgets
- snap-to-grid
- alignment guides
- lock/unlock
- keyboard movement
- undo/redo
- reset page layout
- responsive coordinate scaling
- read-only Classroom Canvas rendering
- Studio Canvas backup integrity repair
- Studio Canvas cross-page undo/redo repair
- Agent Eyes visual QA planning docs
- build/lint validation
- Teacher Control / Student Display route split (`/control`, `/display`)
- Today Prep dashboard and Teacher Material Launcher (Phase 8C)

## Current Source Areas

Core app:

- `src/App.tsx`
- `src/main.tsx`
- `src/app/AppShell.tsx`
- `src/app/appRoute.ts`
- `src/app/useAppRoute.ts`
- `src/app/RootRedirect.tsx`

Board and teacher panels:

- `src/board/`
- `src/store/boardStore.ts`
- `src/store/timerStore.ts`

Screens and routines:

- `src/screens/`
- `src/components/routines/`
- `src/data/pageSequences.ts`
- `src/data/routineSchedule.ts`

Widgets:

- `src/widgets/`
- `src/components/editing/`

Features:

- `src/features/student-picker/`
- `src/features/local-packets/`
- `src/features/studio-canvas/`

Studio Canvas logic:

- `src/lib/studioCanvasActions.ts`
- `src/lib/studioCanvasGeometry.ts`
- `src/lib/studioCanvasMigration.ts`
- `src/lib/studioLayoutSeeds.ts`
- `src/lib/studio-canvas-tests.ts`

## Still Open / Not Yet Built

High-value remaining work:

- Open With resource menu
- YouTube/media page
- PDF/HTML viewer
- basic annotation layer
- Classroom Audio / Spotify Level 1 launcher
- richer widget library
- Studio Canvas template packs
- visual QA screenshot run against the current UI
- production teacher workflow smoke test

Deferred from Phase 8C (now complete):

- ~~Today Prep dashboard~~
- ~~Teacher Material Launcher~~
- ~~manual resources per class/page~~
- ~~missing-link warnings~~

Deferred future work:

- Tauri wrapper
- PDF.js
- Dexie
- Zod
- React Hook Form
- Lottie/Rive
- Spotify SDK/OAuth
- cloud sync
- backend/accounts
- Canvas URL ingestion

## Recommended Next Phase

Recommended next implementation phase:

**Phase 8D — Media workflow or Open With launcher**

Rationale:

Phase 8C added Today Prep and Material Launcher on `/control`. The next high-value step is richer media opening (Open With menu, YouTube/media page, or PDF viewer) while preserving route safety.

Suggested Phase 8D scope:

- Open With resource menu
- YouTube/media page (no embedded player if constraints remain)
- preserve `/control` / `/display` route safety
- no backend, no cloud, no new heavy dependencies
