# Classroom Command Center — Current State Audit

Status: reconciled after Phase 12C.1.1 iPad Landscape QA  
Date: 2026-07-25  
Project: `~/Projects/classroom-command-center`

## Current Repo State

Latest phase branch:

- `phase-12c-press-your-luck-experience`
- Phase 12C.1.1: iPad landscape (1366×1024) teacher control QA — overflow, usability, SecretStopZone, projector privacy E2E; 2 control snapshot baselines
- Phase 12C.1: Playwright projector snapshots (5), SecretStopZone workflow E2E, interrupted spin recovery, spin animation timer fallbacks
- Phase 12C: Press Your Luck state machine, projector mode on `/display`, board scan animation, secret stop, rarity reveals, Mystery Box sequence, Whammy foundation, Web Audio manager, teacher controls
- `phase-12b-prize-board-foundation`
- Phase 12B: title banks (class-locked + shared), default prize bank, Mystery Box container, 100-tile Prize Board with teacher panel in `/control`, display-safe helpers
- Phase 12A: typed rosters with preferred names, local roster import, Reading section pools (RM4/SM5), enhanced Mystery Star control panel, display-safe status
- Phase 10A: teacher-only Open With workflow integrated into Material Launcher with resource type presets
- Phase 9C.1: Playwright `toHaveScreenshot` baseline snapshots for `/display` at key viewports
- Phase 9C: Playwright visual QA screenshots, viewport privacy checks, `/control` workflow smoke tests
- Phase 9B: Morning Message Studio, templates, student display widget, backup integration
- Phase 9A: projector-safe design tokens, vibe-page navigation polish, fullscreen workflow, Homeroom density fix, Mystery Student active badge
- `npm run build` — PASS
- `npm run lint` — PASS
- `npm run test:display-polish` — PASS
- `npm run test:visual-qa` — PASS (8)
- `npm run test:display-snapshots` — PASS (4)
- `npm run test:e2e` — PASS (58)
- `npm run test:prize-board-projector-snapshots` — PASS (7)

Important: this repo is now beyond the older Phase 4C/4D roadmap. Basic inline editing, widget visibility, routine-aware pages, backup/restore, random picker/Mystery Star, local packets, noise widgets, Studio Canvas, and Studio Canvas repair work have already been implemented or superseded.

For the reconciled build checklist, see:

- `docs/roadmap/classroom-command-center-build-state-checklist.md`

## Validation

Latest confirmed local checks:

- `npm run build` — PASS
- `npm run lint` — PASS
- `npm run test:display-polish` — PASS
- `npm run test:visual-qa` — PASS (8)
- `npm run test:display-snapshots` — PASS (4)
- `npm run test:e2e` — PASS (58)
- `npm run test:prize-board-projector-snapshots` — PASS (7)

Phase 12C.1.1 docs:

- `docs/status/phase-12c1-1-ipad-landscape-qa.md`

Phase 12C.1 docs:

- `docs/status/phase-12c1-projector-qa.md`

Phase 9C.1 docs:

- `docs/phases/phase-9c1-screenshot-baselines.md`
- `docs/status/phase-9c1-screenshot-baselines.md`

Phase 9C docs:

- `docs/phases/phase-9c-automated-visual-qa.md`
- `docs/status/phase-9c-automated-visual-qa.md`

Phase 9B docs:

- `docs/phases/phase-9b-morning-message-studio.md`
- `docs/status/phase-9b-morning-message-studio.md`

Phase 9A docs:

- `docs/phases/phase-9a-display-screen-polish.md`
- `docs/status/phase-9a-display-screen-polish.md`

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
- automated Playwright visual QA (`test:visual-qa`) with `/display` screenshots at 1920×1080, 1366×768, 1024×768
- Playwright snapshot baselines (`test:display-snapshots`) for approved `/display` scenes with pixel-diff regression
- build/lint validation
- Teacher Control / Student Display route split (`/control`, `/display`)
- Today Prep dashboard and Teacher Material Launcher (Phase 8C)
- Open With resource presets and safe launch workflow in Material Launcher (Phase 10A)

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

- YouTube/media page (embedded player)
- PDF/HTML viewer
- basic annotation layer
- Classroom Audio / Spotify Level 1 launcher
- richer widget library
- Studio Canvas template packs

Deferred from Phase 10A (now complete):

- ~~Open With resource menu~~
- ~~resource type presets (Google Slides, Docs, Drive, YouTube, PDF, Website, Other)~~
- ~~safe Open With launch from `/control`~~

Deferred from Phase 9C.1 (now complete):

- ~~Playwright snapshot baselines for approved display scenes~~

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

**Phase 10B — Student-safe “Now Showing” or embedded media viewers**

Rationale:

Phase 10A added teacher-only Open With presets and safe external launch from Material Launcher. The next high-value step is either student-visible “now showing” labels (without exposing launcher controls) or embedded viewers (YouTube/PDF) while preserving `/display` privacy and snapshot stability.

Suggested Phase 10B scope:

- optional student-safe “Now Showing” card on `/display`
- or embedded YouTube/PDF viewer phase
- preserve `/control` / `/display` route safety
- no backend, no cloud, no new heavy dependencies

---

## Phase 11A — OmniNote Handoff Planning

Phase 11A documents the planned bridge between Classroom Command Center and OmniNote.

Command Center remains the classroom workflow hub for routines, timers, Morning Message, Today Prep, Open With resources, and student-safe display labels.

OmniNote remains the native iPad Apple Pencil annotation and presentation app for PDFs, worksheets, slide exports, and blank teaching canvases.

The recommended first bridge is a safe resource handoff model: Command Center tracks the teaching resource and student-safe label, while OmniNote handles iPad annotation/presentation. `/display` should show only safe labels such as "Now Showing" or future "Now Annotating" text, not URLs, notes, launch controls, or teacher-only metadata.

No runtime handoff behavior was added in Phase 11A.
