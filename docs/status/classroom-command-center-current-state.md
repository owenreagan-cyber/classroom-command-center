# Classroom Command Center — Current State Audit

Status: corrective pass completed; Studio Canvas adversarial audit and repair validation completed 2026-07-18
Date: 2026-07-13 (see `docs/status/studio-canvas-foundation.md` for the 2026-07-18 audit)
Project: `~/Projects/classroom-command-center`

## Validation

Latest confirmed local checks (2026-07-18, post-audit):
- `npm run test:routines` — PASS (87)
- `npm run test:pages` — PASS (148)
- `npm run test:student-picker` — PASS (68)
- `npm run test:local-packets` — PASS (82 integration + 85 unit)
- `npm run test:studio-canvas` — PASS (92)
- `npm run test:e2e` — PASS (6) [chromium only, requires dev server]
- `npm run lint` — PASS
- `npm run build` — PASS
- `git diff --check` / `git diff --cached --check` — PASS

The 2026-07-18 audit found and repaired two defects: cross-page undo/redo bleed and Full Backup export silently omitting Studio layouts. See `docs/status/studio-canvas-foundation.md` for details.

## Dependency State

Current runtime dependencies:
- react
- react-dom
- zustand

Current dev/build dependencies:
- vite
- typescript
- eslint
- tailwindcss
- react/vite/types tooling

Important:
No heavy future dependencies have been added yet.

Not yet installed:
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

This is good. The app remains lightweight and classroom-reliable.

## Current Source Tree

Core app:
- `src/App.tsx`
- `src/main.tsx`
- `src/app/AppShell.tsx`

Board:
- `src/board/BoardFrame.tsx`
- `src/board/DailyBriefPanel.tsx`
- `src/board/TeacherDock.tsx`

Components:
- `src/components/VisibilityGate.tsx`
- `src/components/editing/EditableList.tsx`
- `src/components/editing/EditableMaterials.tsx`
- `src/components/editing/EditableText.tsx`
- `src/components/editing/HiddenCardPlaceholder.tsx`

Data:
- `src/data/backgroundAssets.ts`
- `src/data/boardPresets.ts`
- `src/data/dailyBriefTemplates.ts`
- `src/data/defaults.ts`
- `src/data/pageSequences.ts`
- `src/data/routineSchedule.ts`
- `src/data/routineTypes.ts`
- `src/data/timerDefaults.ts`
- `src/data/timerTypes.ts`
- `src/data/types.ts`

Screens:
- `src/screens/ActiveScreen.tsx`
- `src/screens/HomeroomScreen.tsx`
- `src/screens/MathScreen.tsx`
- `src/screens/ReadingScreen.tsx`
- `src/screens/ReadyPositionScreen.tsx`
- `src/screens/SubjectScreen.tsx`
- `src/screens/VibePageScreen.tsx`
- `src/screens/SnackLunchDisplayView.tsx`

Stores:
- `src/store/boardStore.ts`
- `src/store/timerStore.ts`

Hooks/libs:
- `src/hooks/useClockTick.ts`
- `src/lib/beautify.ts`
- `src/lib/routineEngine.ts`
- `src/lib/timerFormat.ts`

Routines:
- `src/components/routines/BlockRoutineStrip.tsx`
- `src/components/routines/CompactRealClock.tsx`
- `src/components/routines/LauncherDock.tsx`
- `src/components/routines/PageNavigation.tsx`
- `src/components/routines/RoutineBanner.tsx`

Widgets:
- `src/widgets/AutoFitText.tsx`
- `src/widgets/DoNowCard.tsx`
- `src/widgets/MaterialsCard.tsx`
- `src/widgets/PhaseTimerCard.tsx`
- `src/widgets/ReadyPositionCard.tsx`
- `src/widgets/ReminderCard.tsx`
- `src/widgets/SmartTextCard.tsx`
- `src/widgets/TimerWidget.tsx`
- `src/widgets/VoiceLevelWidget.tsx`

Features:
- `src/features/student-picker/` — Random Picker, Mystery Star, Roster, History, Coaching
- `src/features/local-packets/` — Daily Brief Import/Export, Full Backup/Restore

Styles:
- `src/styles/index.css`

## Current Implemented Features

Implemented:
- local-first Vite/React/TypeScript app
- board display shell
- Teacher Dock
- Display/Edit mode
- background manifest
- Canva-exported background support
- Nested vibe page architecture (ClassWorkspace → VibePage → slide)
- Page navigation with Previous/Next buttons, dots, page count
- 33 stable vibe page IDs across 15 class workspaces
- Layout presets (centered-message, message-plus-timer, etc.)
- Display mode renders clean slides per active page
- Homeroom screen (5 pages)
- Math screen
- Reading screen
- Snack screen (split from Snack/Lunch)
- Lunch screen (split from Snack/Lunch)
- Homework screen (split from Homework/Pack-Up)
- Pack Up screen (split from Homework/Pack-Up)
- Spelling screen
- Ready Position screen
- SmartTextCard system
- AutoFitText with no silent clipping
- visible compact/overflow fallback behavior
- MaterialsCard
- ReminderCard
- DoNowCard
- ReadyPositionCard
- conservative local Beautify
- Undo Beautify
- TimerWidget
- PhaseTimerCard / RoutineTimerCard
- wall-clock timer reload recovery
- Routine engine with canonical block timing and transition routines
- Recess destination and Group Work runtime rename
- local persistence with Zustand
- reset clears timers
- Widget visibility toggles and placeholders
- Inline editing polish
- Voice Level / Traffic Light Widget (microphone-free student voice expectations indicator)
- Daily Brief Intake & Routine Templates (offline-ready template presets for daily board setups)
- Lesson Card + Vocabulary Card (student-facing widgets for tracking objectives and keywords)
- Random Picker + Mystery Star Student Tracker
- Local Packet Backup & Restore (Daily Brief import/export, full backup/restore, validation, undo, privacy boundary)
- Deterministic routine tests for date-driven coverage
- Page architecture tests (148 tests, all passing)
- Studio Canvas Foundation — bounded 16:9 authoring surface in Studio Mode
  with draggable/seeded page widgets, snap-to-grid, alignment guides,
  lock/unlock, keyboard movement, undo/redo, reset-page-layout, and
  responsive coordinate scaling; Classroom Mode now renders the same
  persisted widget geometry read-only. See
  `docs/status/studio-canvas-foundation.md`.
- Build and lint currently passing locally
- widget evolution roadmap
- Reward Maker Studio parking-lot doc

## Current Planning Docs

Architecture:
- `docs/architecture/classroom-system-architecture-plan.md`
- `docs/architecture/dependency-and-repo-plan.md`
- `docs/architecture/visual-design-and-background-plan.md`
- `docs/architecture/shared-lesson-package-spec.md`
- `docs/architecture/roadmap-next-phases.md`
- `docs/architecture/classroom-audio-spotify-plan.md`
- `docs/architecture/level-feature-matrix.md`

Product docs:
- `docs/classroom-command-center-mvp-plan.md`
- `docs/widget-evolution-roadmap.md`

Future modules:
- `docs/future-modules/reward-maker-studio-parking-lot.md`

## Planned But Not Yet Built

Command Center:
- display layout polish
- projector readability pass
- Homeroom density fix
- Student Display vs Teacher Control split
- widget visibility model:
  - student
  - teacherOnly
  - hidden
- Spelling screen
- Shurley screen
- Science screen
- History screen
- Science/History active toggle
- Specials screen
- Cleanup screen
- Carpool screen
- Today Prep foundation
- editable day template
- active subject selector
- resource checklist
- missing-link warnings
- teacher-only notes
- Teacher Material Launcher
- Open With menu
- manual resources
- YouTube media page
- Classroom Audio / Spotify Level 1
- PDF/HTML viewer
- basic annotation layer

OmniNote:
- separate Xcode project
- PencilKit canvas proof
- PDFKit viewer proof
- movable collapsible toolbar
- presentation output proof
- Mirror Full Page mode
- Screen Curtain
- Active Recall Tape / Block Box
- Laser Pointer
- tabs/workspaces
- shared lesson package import

Shared:
- example lesson package JSON files
- Command Center export
- OmniNote import
- deep link handoff later

Not built:
- Tauri wrapper
- Spotify SDK integration
- full Group Maker
- full Random Reader
- automatic class switching

## Recommended Next Phase

Next phase:
Command Center Display Layout Polish & Projector Readability Pass

Why:
Now that the Local Packet Import/Export and Full Backup/Restore system is completely wired, integrated with real stores, and transactionally rollback-safe, the next phase is to polish the display layout and perform a projector readability pass to ensure high-contrast visibility for students in real classrooms.

## Recommended Phase Order

1. Command Center Display Layout Polish
2. OmniNote planning repo setup
3. Shared lesson package examples
4. Command Center Student/Teacher Visibility Model
5. OmniNote PencilKit/PDFKit proof
6. Command Center Subject Expansion
7. OmniNote Toolbar Level 1
8. Command Center Today Prep + Resource Launcher
9. OmniNote Presentation Output Proof
10. Shared Command Center ↔ OmniNote handoff

## Credit-Saving Rule

Use ChatGPT + Terminal for:
- docs
- audits
- snapshots
- status reports
- simple data/schema files
- validation

Use Cursor/Codex only for:
- larger UI work
- multi-file feature implementation
- complex refactors
- visual layout polish
- Xcode/Swift app build phases

## Future Intake Architecture Note

Daily Brief Intake should eventually support a Daily Brief Packet workflow.

The recommended boundary is:
- Classroom Command Center remains the local-first display/control app.
- Teacher AI Workstation / Chief of Staff prepares reviewed packets from Canvas files/modules, uploaded files, email, calendar notes, or teacher notes.
- Command Center previews and applies packets only after teacher approval.

See: `docs/architecture/daily-brief-packet-intake-plan.md`
