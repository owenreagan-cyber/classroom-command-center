# Phase 13 — System Audit

**Branch:** `phase-13-teacher-workstation-consolidation`  
**Audit date:** 2026-07-26  
**Purpose:** Complete repository audit before teacher workstation consolidation.

---

## Executive Summary

Classroom Command Center is a local-first Vite/React SPA with two routes (`/control`, `/display`), five Zustand stores, and 15 in-app screens. Core classroom display, teacher control, Mystery Star, Prize Board, Morning Message, Today Prep, and Studio Canvas are **Complete** or **Partial**. Missing: Teacher Dashboard, Classroom Music, OmniNote bridge UI, stopwatch/interval timers, and centralized settings.

---

## Route Architecture

| Route | Shell | Status | Notes |
|-------|-------|--------|-------|
| `/control` | `TeacherControlShell` + `TeacherDock` | **Complete** | Full teacher workspace |
| `/display` | `StudentDisplayShell` | **Complete** | Forces display mode; no dock |
| `/` | `RootRedirect` → `/control` | **Complete** | Trailing slashes normalized |

No React Router — pathname-based routing via `useSyncExternalStore`.

---

## CLASSROOM DISPLAY

| Feature | Status | Audit Notes |
|---------|--------|-------------|
| `/display` route | **Complete** | Separate shell, privacy E2E verified |
| Projector privacy | **Complete** | Route + visibility + displaySafe + displayPrivacy layers |
| Layout scaling | **Complete** | 16:9 `BoardFrame` canvas; responsive typography |
| 16:9 support | **Complete** | E2E snapshots at 1920×1080 |
| 4:3 support | **Partial** | Snapshots at 1024×768; no dedicated 4:3 layout tuning |
| iPad compatibility | **Partial** | Prize board iPad landscape QA complete; general iPad untested |
| AirPlay workflow | **Missing** | No AirPlay detection or guidance; manual display launch only |
| Fullscreen button | **Complete** | `StudentDisplayShell` |
| Now Showing label | **Complete** | Label-only; no URLs on display |
| Prize Board projector | **Complete** | Fullscreen overlay during spin phases |

---

## TEACHER CONTROL

| Feature | Status | Audit Notes |
|---------|--------|-------------|
| `/control` route | **Complete** | TeacherControlShell |
| TeacherDock | **Complete** | 16 sections; edit mode only |
| Teacher Dashboard | **Missing** | No "what do I need today?" landing view |
| Today Prep | **Complete** | Scoped checklist, active context banner |
| Open With | **Complete** | Resource presets, URL inference, Now Showing |
| Widgets (Studio Canvas) | **Partial** | 12 widget types; LauncherDock placeholders |
| Settings | **Partial** | Feature-scoped only (picker, prize board, card visibility) |
| Navigation | **Complete** | Screen nav + vibe page nav + keyboard shortcuts |
| Display Launch | **Complete** | Open/copy/focus display window |
| Local Packet Backup | **Complete** | Export/import board + timers + picker |
| Board Presets | **Complete** | Daily + custom presets |
| Daily Brief | **Complete** | Intake form → board contents |

---

## WIDGET AUDIT

### Timers & Clocks

| Widget | Renders | Empty State | Persistence | Display Privacy | Mobile/iPad | Status |
|--------|---------|-------------|-------------|-----------------|-------------|--------|
| Simple countdown (`TimerWidget`) | Yes | Running/finished states | `timerStore` | Teacher hints hidden | Large display typography | **Complete** |
| Phase timer (`PhaseTimerCard`) | Yes | "Routine Complete" | `timerStore` | Config hidden on display | Yes | **Complete** |
| Scheduled routines (`RoutineBanner`) | Yes | Null when inactive | Wall-clock computed | Suggestion = teacher action | Yes | **Complete** |
| Real clock (`CompactRealClock`) | Yes | N/A | Session tick | Student-visible | Yes | **Complete** |
| Block routine strip | Yes | Null when inactive | Wall-clock computed | Student-visible | Yes | **Partial** (lightly used) |
| Stopwatch | — | — | — | — | — | **Missing** |
| Interval timer | — | — | — | — | — | **Missing** |
| Scheduled bell timers | Partial | Daily blocks exist | `CANONICAL_DAILY_BLOCKS` | Student-visible labels | Yes | **Partial** |

### Content Widgets

| Widget | Renders | Empty State | Persistence | Display Privacy | Mobile/iPad | Status |
|--------|---------|-------------|-------------|-----------------|-------------|--------|
| Do Now | Yes | SmartTextCard placeholder | `boardStore` | Student | Responsive | **Complete** |
| Reminders | Yes | Empty bullets placeholder | `boardStore` | Student | Responsive | **Complete** |
| Materials | Yes | Section placeholders | `boardStore` | Student | Responsive | **Complete** |
| Ready Position | Yes | SmartTextCard placeholder | `boardStore` | Student | Responsive | **Complete** |
| Lesson / Focus | Yes | UnavailablePlaceholder | `boardStore` | Student | Responsive | **Complete** |
| Lesson Card | Yes | Returns null | `boardStore` | Student | Responsive | **Complete** |
| Vocabulary Card | Yes | Returns null | `boardStore` | Student | Responsive | **Complete** |
| Morning Message | Yes | "No sections enabled" | `boardStore` | Section flags | Density modes | **Complete** |
| Compact Cue | Yes | SmartTextCard placeholder | `boardStore` | Student | Responsive | **Complete** |

### Classroom Tools

| Widget | Renders | Empty State | Persistence | Display Privacy | Mobile/iPad | Status |
|--------|---------|-------------|-------------|-----------------|-------------|--------|
| Voice Level (traffic light) | Yes | Hidden when off | `boardStore.noiseTrackers` | Student-facing guide | Yes | **Complete** |
| Noise Tower Defense | Defined | — | — | — | — | **Broken** (orphaned `NoiseStatusCard`) |
| Random Picker | Yes | Empty roster prompt | `pickerStore` | Teacher-only panel | Control route | **Complete** |
| Mystery Star | Yes | No active session | `pickerStore` | Identity hidden on display | Badge only | **Complete** |
| Prize Board | Yes | Empty board state | `prizeBoardStore` | IDs stripped on display | Projector mode | **Complete** |
| Press Your Luck | Yes | Idle phase | `pressYourLuckStore` | Full privacy layer | Projector + iPad QA | **Complete** |
| Studio Canvas | Yes | Seed layouts | `boardStore.classWorkspaces` | Edit chrome hidden | Control only | **Complete** |
| Music / Atmosphere | — | — | — | — | — | **Missing** |

### Placeholder Widgets (LauncherDock)

| Widget | Status |
|--------|--------|
| Group Maker | **Missing** (UI placeholder only) |
| Random Reader page | **Missing** ("coming soon" in pageSequences) |
| Music launcher | **Missing** (UI placeholder only) |

---

## TIMER SYSTEM AUDIT

| Requirement | Status | Notes |
|-------------|--------|-------|
| Countdown | **Complete** | Preset/custom, start/pause/resume, ±1 min |
| Stopwatch | **Missing** | Not implemented |
| Interval timer | **Missing** | Not implemented |
| Lesson timer (phase) | **Complete** | Multi-phase sequential countdown |
| Transition timer | **Complete** | Phase style token `transition` |
| Scheduled timers | **Partial** | `CANONICAL_DAILY_BLOCKS` (7:20–dismissal); no teacher-editable bell schedule UI |
| Survive refresh | **Complete** | `endsAt` recovery in `timerStore` |
| Recover after sleep | **Complete** | `recoverSimple()`, `recoverPhase()`, wall-clock routines |
| Display on projector | **Complete** | Large typography; Start/Pause visible (intentional) |
| Teacher controls hidden | **Partial** | Config/reset hidden; Start/Pause remain on display |

**Test coverage:** 88 routine asserts; no dedicated timer unit tests.

---

## LOCAL PERSISTENCE

| Store | Key | Version | Status |
|-------|-----|---------|--------|
| `boardStore` | `classroom-command-center-lite` | 11 | **Complete** |
| `timerStore` | `classroom-command-center-timers` | 1 | **Complete** |
| `pickerStore` | `classroom-picker-storage-v3` | 1 | **Complete** |
| `prizeBoardStore` | `classroom-prize-board-storage-v1` | 1 | **Complete** |
| `pressYourLuckStore` | `classroom-press-your-luck-v1` | 1 | **Complete** |
| Daily Brief draft | `cc_daily_brief_draft` | — | Ad-hoc |
| Music store | — | — | **Missing** (Phase 13) |

Prize board and PYL not yet in full-backup packet categories.

---

## FEATURE FLAGS

No centralized feature-flag system. Behavior controlled by:

- `import.meta.env.DEV` — Press Your Luck dev hooks
- `AppMode` (`edit`/`display`) — boardStore
- Route shell helpers — control vs display
- `Visibility` enum — per-content student/teacher/hidden
- `cardVisibility` — per-screen widget toggles
- Feature-scoped toggles (coaching, routines, sound, reducedMotion)

---

## TEST COVERAGE

| Area | Unit Tests | E2E | Status |
|------|-----------|-----|--------|
| Routines | 88 asserts | — | **Complete** |
| Student Picker | ~36 asserts | Privacy checks | **Complete** |
| Prize Board / PYL | ~54 asserts | Projector + iPad | **Complete** |
| Morning Message | ~35 asserts | Studio + snapshots | **Complete** |
| Studio Canvas | Yes | 6 tests | **Complete** |
| Display polish | Yes | Snapshots + visual QA | **Complete** |
| App routing | Yes | 10 tests | **Complete** |
| Today Prep | Yes | — | **Complete** |
| Local packets | Yes + integration | — | **Complete** |
| Timers | **None** | Visual only | **Partial** |
| Voice Level | **None** | — | **Missing** |
| Music | **None** | — | **Missing** |
| OmniNote bridge | **None** | — | **Missing** |
| Teacher Dashboard | **None** | — | **Missing** |

**E2E total:** 58+ Playwright tests reported PASS.

---

## DOCUMENTATION

| Area | Status | Notes |
|------|--------|-------|
| Phase specs (`docs/phases/`) | **Complete** | ~25 phase design docs |
| Status audits (`docs/status/`) | **Complete** | ~35 completion audits |
| Architecture plans | **Complete** | 11 architecture docs |
| OmniNote handoff plan | **Complete** | `docs/architecture/omninote-handoff-architecture.md` |
| Spotify/audio plan | **Complete** | `docs/architecture/classroom-audio-spotify-plan.md` |
| Shared lesson package spec | **Complete** | `docs/architecture/shared-lesson-package-spec.md` |
| Root README | **Broken** | Still default Vite template |
| Device workflow doc | **Missing** | Phase 13 deliverable |
| OmniNote GoodNotes plan | **Missing** | Phase 13 deliverable |

---

## DISPLAY PRIVACY AUDIT

**Layers:**
1. Route split — dock never mounts on `/display`
2. `Visibility` enum — `teacherOnly` filtered in display mode
3. `displaySafe.ts` — strips prize/student IDs
4. `displayPrivacy.ts` — PYL field patterns + control IDs
5. E2E assertions — DOM + HTML pattern checks

**Verified hidden on `/display`:**
- Teacher dock and all panels
- Student names and roster details
- Resource URLs and launch buttons
- Teacher notes and prep items (default `teacherOnly`)
- Mystery Star identity
- Prize board private fields
- PYL teacher controls and SecretStop

**Shown on `/display`:**
- Student-visible widgets and content
- Now Showing label (text only)
- Timer countdown (Start/Pause intentional)
- Voice level guide (when active)
- Prize board projector mode (stripped)
- Morning message (enabled sections)

---

## OMNINOTE READINESS

| Level | Status | Notes |
|-------|--------|-------|
| Architecture doc | **Complete** | 5 handoff levels defined |
| Lesson package spec | **Complete** | TypeScript planning types |
| Now Showing label | **Complete** | Student-safe display |
| Now Annotating label | **Missing** | Phase 13 |
| Open in OmniNote button | **Missing** | Phase 13 |
| Deep link support | **Missing** | Requires native OmniNote app |
| Shared package format | **Partial** | Spec only; no runtime bridge |

---

## SPOTIFY / MUSIC READINESS

| Level | Status | Notes |
|-------|--------|-------|
| Architecture plan | **Complete** | Level 1–3 roadmap |
| Playlist manifest | **Missing** | Phase 13 |
| MusicWidget | **Missing** | Phase 13 |
| Spotify embed | **Missing** | Phase 13 |
| MusicProvider interface | **Missing** | Phase 13 |
| Teacher controls | **Missing** | Phase 13 |
| Display indicator | **Missing** | Phase 13 |

---

## DEVICE WORKFLOW READINESS

| Device | Role | Status |
|--------|------|--------|
| MacBook | Teacher command center (`/control`) | **Complete** |
| Projector | Student display (`/display`) | **Complete** (manual launch) |
| iPad | OmniNote control surface | **Missing** (no bridge) |
| AirPlay | Display mirroring | **Missing** (no detection/guidance) |
| Apple Pencil | Annotation | **Missing** (OmniNote not built) |
| External display | Multi-monitor | **Partial** (display launch opens new window) |

---

## RECOMMENDED PHASE 13 PRIORITIES

1. **Teacher Dashboard** — "What do I need today?" landing view
2. **Classroom Atmosphere Module** — Spotify embed Level 1
3. **OmniNote Bridge** — LessonPackage model + Open in OmniNote
4. **Scheduled Timer UI** — Bell schedule visibility in dashboard
5. **Master Validation Script** — `test-teacher-workstation.sh`
6. **Device Workflow Doc** — Hardware ecosystem guide
7. **OmniNote Requirements Doc** — GoodNotes-superior feature plan

**Deferred to future phases:**
- Stopwatch and interval timer
- Spotify OAuth / Web Playback SDK
- Realtime cross-device sync
- AirPlay detection
- NoiseStatusCard integration or removal
