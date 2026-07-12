# Classroom Command Center — Current State Audit

Status: PASS
Date: 2026-07-11
Project: `~/Projects/classroom-command-center`

## Validation

Latest validation:
- `npm run build` — PASS
- `npm run lint` — PASS
- `git diff --check` — PASS

Production build output:
- `dist/index.html` — 0.47 kB / gzip 0.30 kB
- `dist/assets/index-BScqAiEL.css` — 32.74 kB / gzip 6.42 kB
- `dist/assets/index-BzYDAvY9.js` — 233.60 kB / gzip 71.27 kB

Build time:
- 77ms

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
- `src/data/dailyBriefTemplates.ts`
- `src/data/defaults.ts`
- `src/data/timerDefaults.ts`
- `src/data/timerTypes.ts`
- `src/data/types.ts`

Screens:
- `src/screens/ActiveScreen.tsx`
- `src/screens/HomeroomScreen.tsx`
- `src/screens/MathScreen.tsx`
- `src/screens/ReadingScreen.tsx`
- `src/screens/ReadyPositionScreen.tsx`
- `src/screens/SnackLunchScreen.tsx`

Stores:
- `src/store/boardStore.ts`
- `src/store/timerStore.ts`

Hooks/libs:
- `src/hooks/useTimerTick.ts`
- `src/lib/beautify.ts`
- `src/lib/timerFormat.ts`

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
- Homeroom screen
- Math screen
- Reading screen
- Snack/Lunch screen
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
- local persistence with Zustand
- reset clears timers
- Widget visibility toggles and placeholders
- Inline editing polish
- Voice Level / Traffic Light Widget (microphone-free student voice expectations indicator)
- Daily Brief Intake & Routine Templates (offline-ready template presets for daily board setups)
- Lesson Card + Vocabulary Card (student-facing widgets for tracking objectives and keywords)
- docs architecture bundle
- Spotify/Classroom Audio plan
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

## Recommended Next Phase

Next phase:
Local Daily Brief Packet import/export

Why:
With the lesson cards and daily brief panel built, creating a portable JSON packet import/export layer allows teachers to actually save their full day's plan out of the browser and re-import it safely without needing a backend.

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
