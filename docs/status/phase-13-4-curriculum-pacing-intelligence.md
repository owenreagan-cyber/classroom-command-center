# Phase 13.4 — Curriculum Pacing Intelligence

**Branch:** `phase-13-4-curriculum-pacing-intelligence`  
**Status:** Validated — lesson-aware pacing layer ready for OmniNote handoff

## Summary

Classroom Command Center now answers **"What lesson am I teaching today?"** in addition to schedule blocks and curriculum tracks. A pacing engine resolves date → track → school week → subject → current lesson, surfaces lesson labels in Today Prep, and promotes subject-appropriate dock tools.

## Architecture

```
Date
 ↓
School Week (Q1W1 anchor: July 20, 2026)
 ↓
Track (1–4, History/Science rotation)
 ↓
Subject Plan
 ↓
LessonPlan + LessonPackage
```

| Module | Path | Role |
|--------|------|------|
| Types | `src/features/curriculum/types.ts` | SchoolYear, Track, WeekPlan, LessonPlan, LessonPackage |
| Registry | `src/features/curriculum/curriculumRegistry.ts` | 2026–2027 school year, subject programs |
| Lesson plan | `src/features/curriculum/lessonPlan.ts` | Labels and plan builders |
| Lesson package | `src/features/curriculum/lessonPackage.ts` | Resource bundles for OmniNote |
| Pacing resolver | `src/features/curriculum/pacingResolver.ts` | Date → lesson resolution |
| Pacing store | `src/features/curriculum/pacingStore.ts` | Optional lesson overrides (local) |

## Lesson model

### Supported curricula

| Subject | Program | Example label |
|---------|---------|---------------|
| Math | Saxon Math | Saxon Lesson 2 |
| Reading | Reading Mastery | Lesson 2 |
| Spelling | Spelling curriculum | Lesson 2 |
| Shurley | Shurley English | Sentence Patterns Unit 1 |
| History | Units / chapters | Exploring Maps Chapter 1 |
| Science | Units / lessons | Plant Structures Lesson 2 |

### LessonPackage

```typescript
{
  id: 'package-math-week-2',
  title: 'Saxon Lesson 2',
  subject: 'math',
  curriculum: 'saxon-math',
  lessonNumber: 2,
  resources: [
    { kind: 'slides', source: 'math/lesson-2/presentation.pdf' },
    { kind: 'pdf', source: 'math/lesson-2/practice.pdf' },
    { kind: 'teacher-notes', source: 'math/lesson-2/teacher-notes.pdf' },
  ],
  annotationMode: 'annotate',
  displayMode: 'student-safe',
}
```

Resource kinds: `slides`, `pdf`, `worksheet`, `teacher-notes`, `answer-key`, `image`.

## Pacing example

**Date:** July 27, 2026 (school week 2, track 2)

| Subject | Resolved lesson |
|---------|-----------------|
| Math | Saxon Lesson 2 |
| Reading | Lesson 2 |
| Spelling | Lesson 2 |
| History/Science block | Science — Plant Structures Lesson 2 |

On track 1 weeks (e.g. July 24), History block shows: **History — Our Community Chapter 1**.

Week 2 history content (*Exploring Maps Chapter 1*) appears when track rotates to history.

## Integrations

### Today Prep

Active context banner shows lesson-aware labels:

- `Math — Saxon Lesson 2` (not just "Math")
- `History — Our Community Chapter 1` (not "History/Science")
- `Science — Plant Structures Lesson 2`

Pacing summary line: `Track 2 · Week 2 · Science block`.

### Teacher Dock

When the active screen maps to a subject, dock promotion uses lesson context:

| Subject | Promoted tools |
|---------|----------------|
| Math | OmniNote, Materials, Timer, Display |
| Reading | OmniNote, Materials, Atmosphere, Mystery Star |
| History / Science | OmniNote, Materials, Display |

Implemented via `getLessonAwarePromotedTools()` and `getLessonAwareLauncherTools()` in `workspaceResolver.ts`.

## Persistence

| Key | Version | Fields |
|-----|---------|--------|
| `classroom-curriculum-pacing-v1` | 1 | `lessonOverrides` (optional per-date lesson number overrides) |

## OmniNote readiness

| Ready | Not built |
|-------|-----------|
| `LessonPackage` with multi-resource bundles | OmniNote native app |
| Subject + lesson number in package metadata | Cloud curriculum sync |
| Math/Reading/History lesson labels in Today Prep | Automatic resource file discovery |
| Pacing → workspace tool promotion | Live handoff wiring from Today Prep |

Phase 13.4 extends the Phase 13.3 device routing contract with **what** to teach. OmniNote integration receives a structured `LessonPackage` when handoff is wired.

## Validation

```bash
npm run build
npm run lint
npm run test:curriculum
npm run test:teacher-workstation
npm run test:e2e
```

## Limits (intentional)

- Curriculum content is registry-driven, not imported from publisher APIs
- School week anchor is fixed for 2026–2027; no teacher calendar editor yet
- Schedule track (`resolveCurriculumTrack` from Aug 17 epoch) still drives block labels; pacing track uses school-week rotation for lesson content
- Lesson overrides are local only
