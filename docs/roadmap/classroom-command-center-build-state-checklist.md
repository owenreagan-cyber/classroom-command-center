# Classroom Command Center — Build State Checklist

Status: reconciled after Studio Canvas audit repair  
Date: 2026-07-24

## Current Confirmed Main State

Latest confirmed main before this docs phase:

- `1171c48 Fix Studio Canvas history and backup integrity (#7)`
- Build: PASS
- Lint: PASS

The app is no longer at the old Phase 4C stage. Phase 4C and several later phases have already been built or superseded.

## Built / Implemented

### Core App Foundation

- [x] Vite + React + TypeScript foundation
- [x] local-first architecture
- [x] Zustand persistence
- [x] Display/Edit mode
- [x] Teacher Dock
- [x] projector-safe classroom display shell
- [x] local Canva/background asset support

### Visibility and Classroom Safety

- [x] student/teacher visibility model
- [x] teacher-only notes
- [x] display-mode protection
- [x] widget visibility toggles
- [x] hidden-card placeholders in edit mode

### Subject and Page System

- [x] Homeroom
- [x] Math
- [x] Reading
- [x] Snack
- [x] Lunch
- [x] Homework
- [x] Pack Up
- [x] Spelling
- [x] Ready Position
- [x] nested vibe page architecture
- [x] routine-aware page flows
- [x] Previous/Next page controls
- [x] page dots and page counts
- [x] stable vibe page IDs

### Editing and Widgets

- [x] basic inline editing
- [x] inline editing polish
- [x] editable text
- [x] editable lists
- [x] editable materials
- [x] Lesson Card
- [x] Vocabulary Card
- [x] Voice Level / Traffic Light Widget
- [x] Noise tracker foundation
- [x] Noise tower defense phase
- [x] Timer widgets
- [x] Routine timer widgets
- [x] Materials / reminders / do-now cards
- [x] Ready Position cards

### Student Picker

- [x] Random Picker
- [x] Mystery Star
- [x] roster handling
- [x] fairness logic
- [x] picker history
- [x] coaching panel
- [x] local persistence
- [x] privacy boundary

### Local Packets / Backup

- [x] Daily Brief import/export
- [x] full local backup
- [x] restore
- [x] validation
- [x] undo restore
- [x] local packet safety
- [x] Studio Canvas layout included in full backup
- [x] repair pass for backup omission defect

### Studio Canvas

- [x] bounded 16:9 Studio Canvas
- [x] seeded page widget geometry
- [x] draggable widgets
- [x] snap-to-grid
- [x] alignment guides
- [x] lock/unlock
- [x] keyboard movement
- [x] undo/redo
- [x] reset page layout
- [x] responsive coordinate scaling
- [x] classroom display renders persisted geometry read-only
- [x] repair pass for cross-page undo/redo bleed
- [x] Studio Canvas tests

### QA and Validation

- [x] routine tests
- [x] page architecture tests
- [x] student picker tests
- [x] local packet tests
- [x] Studio Canvas tests
- [x] Playwright e2e coverage
- [x] Agent Eyes visual QA plan
- [x] design-reviewer prompt/playbook
- [x] screenshot artifact rules
- [x] build/lint validation

## Built or Superseded Older Roadmap Items

These were listed in older docs as planned, but the current app has already built or superseded them:

- [x] display layout polish — superseded by nested vibe pages and Studio Canvas
- [x] projector readability pass — partially built through display shell and Studio Canvas
- [x] widget visibility model — built
- [x] Spelling screen — built
- [x] Snack/Lunch split — built
- [x] Homework/Pack Up split — built
- [x] inline editing — built
- [x] daily board presets — built
- [x] custom presets export/import — built
- [x] backup safety/storage health — built
- [x] random picker/Mystery Star — built
- [x] Studio Canvas foundation — built
- [x] Studio Canvas repair pass — built

## Still Open / Not Yet Built

### High-Value Classroom Build Candidates

- [ ] true Teacher Control / Student Display route split
- [ ] Today Prep dashboard
- [ ] Teacher Material Launcher
- [ ] Open With resource menu
- [ ] manual resource links per class/page
- [ ] missing-link warnings
- [ ] YouTube/media page
- [ ] PDF/HTML viewer
- [ ] basic annotation layer
- [ ] Classroom Audio / Spotify Level 1 link launcher
- [ ] richer widget library
- [ ] better Studio Canvas templates/layout packs
- [ ] visual QA screenshot run against current UI
- [ ] production teacher workflow smoke test

### Subject / Routine Expansion Candidates

- [ ] Shurley/Writing screen hardening
- [ ] Science screen hardening
- [ ] History/Social Studies screen hardening
- [ ] Specials screen
- [ ] Cleanup screen
- [ ] Carpool screen
- [ ] class-start and class-end routine presets per subject
- [ ] Lunch phased timer refinement if needed

### Future / Deferred

- [ ] Tauri wrapper
- [ ] PDF.js
- [ ] Dexie
- [ ] Zod
- [ ] React Hook Form
- [ ] Lottie/Rive
- [ ] Spotify SDK/OAuth
- [ ] cloud sync
- [ ] backend
- [ ] account system
- [ ] Canvas URL ingestion

## Recommended Next Build Phase

Recommended next implementation phase:

**Phase 8B — Teacher Control / Student Display Route Split**

Why:
- The app already has rich teacher controls.
- Studio Canvas and classroom mode are now powerful enough to need a cleaner display boundary.
- A route split would reduce risk of teacher-only UI appearing on the projector.
- It creates a stronger foundation for future media/resources/presentation tools.

Suggested scope:
- `/control` teacher workspace
- `/display` student-facing projector route
- shared store state
- display route hides Teacher Dock and editing controls
- control route can switch active screen/page
- preserve current single-window behavior if needed
- no backend
- no sync
- no new heavy dependencies

Alternative next phase:

**Phase 8C — Today Prep + Teacher Material Launcher**

Choose this if daily classroom workflow matters more than display-route architecture right now.
