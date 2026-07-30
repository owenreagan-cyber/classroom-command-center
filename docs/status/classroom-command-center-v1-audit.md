# Classroom Command Center v1.0 — Feature Audit

Status: v1.0 Release Candidate audit  
Date: 2026-07-30  
Baseline commit: `007fdb1`  
Branch: `feat/classroom-command-center-v1-release-candidate`

## Summary

| Status | Count |
|--------|------:|
| COMPLETE | 18 |
| NEEDS POLISH | 2 |
| PARTIAL | 1 |
| BROKEN | 0 |
| MISSING | 1 → **added in RC** |
| FROZEN — OMNINOTE | 2 |

The application is a mature local-first classroom system. Runtime rendering uses Studio Canvas (`ActiveScreen` → `VibePageScreen` → `ClassroomCanvas` on display). Legacy screen components in `src/screens/` exist but are superseded.

---

## Classroom Screens

| Feature | Status | Primary files | Tests | Persistence | Teacher entry | Student behavior | Known issue | RC action |
|---------|--------|---------------|-------|-------------|---------------|------------------|-------------|-----------|
| Home / active screen | COMPLETE | `boardStore.ts`, `BoardWorkspace.tsx`, `ActiveScreen.tsx` | `test:pages`, `test:app-route`, e2e | `classroom-command-center-lite` v11 | Board + dock | Studio Canvas display | Legacy screens unused | Confirm via e2e |
| Homeroom | COMPLETE | `defaults.ts` SCREEN_META, `widgetContentAdapter.ts` | `test:pages`, e2e snapshots | boardStore | Screen switcher | Projector-safe widgets | — | Validated |
| Math / Reading / subjects | COMPLETE | Same as above + `pacingResolver.ts` | `test:pages`, `test:routines` | boardStore per-screen content | Screen switcher | Subject widgets on canvas | — | Validated |
| Snack / Lunch | COMPLETE | `defaults.ts`, vibe pages | `test:pages` | boardStore | Screen switcher | Display canvas | — | Validated |
| Ready Position | COMPLETE | `ReadyPositionCard.tsx`, screen meta | `test:pages` | boardStore | Screen switcher | Card on canvas | — | Validated |
| Vibe / atmosphere page | COMPLETE | `VibePageScreen.tsx`, `pageSequences.ts` | `test:pages`, `test:classroom-atmosphere` | boardStore | Board navigation | Background + widgets | — | Validated |
| Teacher Control | COMPLETE | `TeacherControlShell.tsx`, `/control` route | `test:app-route`, e2e | — | Default route | N/A | — | Validated |
| Student Display | COMPLETE | `StudentDisplayShell.tsx`, `/display` | `test:display-launch`, e2e privacy | Shared zustand stores | Display panel | Canvas + overlays | — | Validated |

---

## Message and Instruction Content

| Feature | Status | Primary files | Tests | Persistence | Teacher entry | Student behavior | Known issue | RC action |
|---------|--------|---------------|-------|-------------|---------------|------------------|-------------|-----------|
| Morning Message | COMPLETE | `morning-message/`, `morningMessage.ts` | `test:morning-message`, e2e | boardStore sections | Dock: Morning Message | Widget on display | — | Validated |
| Do Now / Materials / Reminder | COMPLETE | Widgets in `src/widgets/` | `test:pages` | boardStore contents | Inline edit + dock | Canvas widgets | — | Validated |
| Lesson / Vocabulary cards | COMPLETE | `LessonCard`, `VocabularyCard` | `test:pages` | boardStore | Inline edit | Display when visible | — | Validated |
| Daily Brief intake | COMPLETE | `dailyBriefTemplates.ts`, Jobs panel | `test:routines` | boardStore + draft key | Dock: Jobs | Prompts on board | — | Validated |
| Inline editing / Undo / Beautify | COMPLETE | `EditableList`, board actions | `test:pages` | boardStore | Canvas edit mode | N/A on display edit | — | Validated |
| Visibility controls | COMPLETE | `VisibilityGate`, card visibility | `test:pages` | boardStore | Inspector | Hidden widgets omitted | — | Validated |

---

## Timers

| Feature | Status | Primary files | Tests | Persistence | Teacher entry | Student behavior | Known issue | RC action |
|---------|--------|---------------|-------|-------------|---------------|------------------|-------------|-----------|
| Simple countdown timers | COMPLETE | `timerStore.ts`, `TimerWidget.tsx` | `test:timers` | `classroom-command-center-timers` v1 | Dock: Timers | Synced per screen | — | Validated |
| Phase Timer | COMPLETE | `PhaseTimerCard.tsx` | `test:timers` | timerStore merge/recover | Dock: Timers | Large display card | — | Validated |
| Wall-clock recovery | COMPLETE | `timerStore.ts` merge | `test:timers` | timerStore | — | Accurate after refresh | — | Validated |

---

## Voice Level and Traffic Light

| Feature | Status | Primary files | Tests | Persistence | Teacher entry | Student behavior | Known issue | RC action |
|---------|--------|---------------|-------|-------------|---------------|------------------|-------------|-----------|
| Homeroom / Math / Reading trackers | COMPLETE | Noise widgets, boardStore | `test:pages` | boardStore | Board widgets (dock noise inactive) | Traffic light on display | Dock noise tool inactive | Document; board widgets primary |
| Manual selection / reset | COMPLETE | Widget controls | `test:pages` | boardStore | Widget UI | Student-facing light | — | Validated |

---

## Student Picker

| Feature | Status | Primary files | Tests | Persistence | Teacher entry | Student behavior | Known issue | RC action |
|---------|--------|---------------|-------|-------------|---------------|------------------|-------------|-----------|
| Pools (HR/Math/Reading/sections) | COMPLETE | `pickerStore.ts`, `fairnessEngine.ts` | `test:student-picker` | `classroom-picker-storage-v3` | Dock: Quick Picker | Name reveal on pick | — | Validated |
| Fairness / no-repeat / history | COMPLETE | `fairnessEngine.ts` | `test:student-picker` | pickerStore | Quick Picker | — | — | Validated |
| Roster import | COMPLETE | `importRoster.ts` | `test:student-picker` | pickerStore | Picker panel | — | — | Validated |

---

## Mystery Star

| Feature | Status | Primary files | Tests | Persistence | Teacher entry | Student behavior | Known issue | RC action |
|---------|--------|---------------|-------|-------------|---------------|------------------|-------------|-----------|
| Hidden selection / sessions | COMPLETE | `pickerStore.ts`, `MysteryStarTab.tsx` | `test:student-picker` | pickerStore per pool | Dock: Mystery Star | Generic status only (`displaySafe.ts`) | — | Validated |
| Earned / Did Not Earn | COMPLETE | `MysteryObservationPanel.tsx` | `test:student-picker` | pickerStore history | Mystery Star tab | No identity leak | — | Validated |

---

## Prize Board / Press Your Luck

| Feature | Status | Primary files | Tests | Persistence | Teacher entry | Student behavior | Known issue | RC action |
|---------|--------|---------------|-------|-------------|---------------|------------------|-------------|-----------|
| Prize bank / board generation | COMPLETE | `prizeBoardStore.ts`, `boardGenerator.ts` | `test:prize-board` | `classroom-prize-board-storage-v1` | Dock: Prize Board | Safe grid snapshot | — | Validated |
| Press Your Luck / projector | COMPLETE | `pressYourLuck/`, `PrizeBoardProjectorMode.tsx` | `test:prize-board`, e2e snapshots | `classroom-press-your-luck-v1` | Prize Board panel | Projector overlay on `/display` | — | Validated |
| Privacy (hidden prizes) | COMPLETE | `displaySafe.ts`, `displayPrivacy.ts` | e2e privacy regression | — | — | Stripped fields | — | Validated |

---

## Random Number Selector

| Feature | Status | Primary files | Tests | Persistence | Teacher entry | Student behavior | Known issue | RC action |
|---------|--------|---------------|-------|-------------|---------------|------------------|-------------|-----------|
| Standalone selector | **ADDED RC** | `src/features/random-number/` | `test:random-number` | `classroom-random-number-v1` | Dock: Random Number | `RandomNumberDisplay` overlay | Was MISSING | Implemented |

---

## Teacher Dock

| Feature | Status | Primary files | Tests | Persistence | Teacher entry | Student behavior | Known issue | RC action |
|---------|--------|---------------|-------|-------------|---------------|------------------|-------------|-----------|
| Tool registry / panels | COMPLETE | `teacher-dock/` (16 tools) | `test:teacher-dock` | `teacher-command-dock-v1` | `/control` dock | Never on display | Noise inactive | Validated |
| Workspace-aware launcher | COMPLETE | `workspaceResolver.ts` | `test:teacher-dock`, `test:workspace` | workspace store | Dock launcher | — | — | Validated |

---

## Studio Canvas

| Feature | Status | Primary files | Tests | Persistence | Teacher entry | Student behavior | Known issue | RC action |
|---------|--------|---------------|-------|-------------|---------------|------------------|-------------|-----------|
| Widget placement / persistence | COMPLETE | `studio-canvas/`, `boardStore` layouts | `test:studio-canvas`, e2e | boardStore classWorkspaces | Edit mode | ClassroomCanvas read-only | — | Validated |

---

## Display System

| Feature | Status | Primary files | Tests | Persistence | Teacher entry | Student behavior | Known issue | RC action |
|---------|--------|---------------|-------|-------------|---------------|------------------|-------------|-----------|
| Control / Display shells | COMPLETE | `TeacherControlShell`, `StudentDisplayShell` | `test:display-launch`, e2e | — | Display panel | `/display` route | — | Validated |
| Launch / fullscreen / popup | COMPLETE | `displayLaunch.ts`, `DisplayLaunchPanel` | `test:display-launch`, e2e | — | Dock: Display | Fullscreen button on display | — | Validated |
| Privacy sanitization | COMPLETE | `displayTargetService.ts` | e2e privacy, unit tests | — | — | Forbidden keys stripped | — | Validated |

---

## Local-First Infrastructure

| Feature | Status | Primary files | Tests | Persistence | Teacher entry | Student behavior | Known issue | RC action |
|---------|--------|---------------|-------|-------------|---------------|------------------|-------------|-----------|
| Local packets / backup | COMPLETE | `local-packets/` | `test:local-packets` | Export/import files | Board control | — | — | Validated |
| Device manager | COMPLETE | `device-manager/` | `test:device-manager` | `classroom-device-manager-v1` | Display panel | Role routing | — | Validated |
| Workspace modes | COMPLETE | `workspace/` | `test:workspace` | `classroom-workspace-v1` | Dock launcher | — | — | Validated |
| Offline cache | COMPLETE | `curriculum-library-fetcher/` | launch-readiness smoke | library store | Curriculum sync | — | — | Validated |

---

## Curriculum Tooling

| Feature | Status | Primary files | Tests | Persistence | Teacher entry | Student behavior | Known issue | RC action |
|---------|--------|---------------|-------|-------------|---------------|------------------|-------------|-----------|
| Curriculum library / fetcher | COMPLETE | `curriculum-library-fetcher/` | `test:curriculum-fetcher` | library store | Dock: Curriculum Sync | — | Heavy bundle contributor | Document; no split in RC |
| Readiness gates | COMPLETE | `curriculum-readiness/` | `test:curriculum-readiness` | readiness store | Today Prep | Not on display | — | Validated |

---

## FROZEN — OMNINOTE

| Feature | Status | Primary files | Tests | Persistence | Teacher entry | Student behavior | Known issue | RC action |
|---------|--------|---------------|-------|-------------|---------------|------------------|-------------|-----------|
| OmniNote bridge | FROZEN — OMNINOTE | `omninote-bridge/` | `test:omninote-bridge` | — | Dock: OmniNote | Optional handoff | Expansion paused | Regression tests only |
| OmniNote handoff | FROZEN — OMNINOTE | `omninote-handoff/` | `test:omninote-handoff`, launch-readiness | — | OmniNote panel | — | Expansion paused | No contract changes |

---

## Performance Notes

- Production bundle: **631 kB** minified JS (non-blocking Vite warning > 500 kB).
- Safe lazy-loading candidates: curriculum library, Studio Canvas edit tooling, prize board effects.
- **RC decision:** No code splitting applied — risk to display startup and offline behavior outweighs warning.

---

## Lint / Build Baseline (pre-RC fixes)

- 2 react-hooks warnings in `TodayPrepPanel.tsx`, `DockLauncherPanel.tsx` — **fixed** by removing unnecessary `useMemo` (scorePackage reads live zustand state).
- Target: 0 errors, 0 warnings — **achieved**.
