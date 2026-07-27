# Phase 13.5.1 — Curriculum Resource Fetcher Pilot

Status: complete (fixture-based discovery pipeline)  
Branch: `phase-13-5-1-curriculum-resource-fetcher-pilot`  
Date: 2026-07-26

## Goal

First curriculum resource discovery pipeline using local fixtures that represent Google Drive folder structure. Pilot scope: **Saxon Math Lessons 2–6 only**. No Google Drive OAuth.

## Architecture

```
DriveFolderTree (fixture)
        │
        ▼
  resourceScanner.ts     → detect subject, curriculum, lesson number
        │
        ▼
  resourceClassifier.ts  → classify filenames (presentation, teacher-notes, etc.)
        │
        ▼
  lessonPackageBuilder.ts → LibraryLessonPackage + omninoteReady
        │
        ▼
  libraryIndexStore.ts   → persisted index, Today Prep + workspace integration
```

## Module

| File | Role |
|------|------|
| `types.ts` | `LessonResource`, `LibraryLessonPackage`, `DriveFolderTree` |
| `resourceScanner.ts` | Walk folder tree, parse lesson folders, pilot filter |
| `resourceClassifier.ts` | Filename rules (slides→presentation, script→teacher-notes) |
| `lessonPackageBuilder.ts` | Build packages + OmniNote payload |
| `libraryIndexStore.ts` | Zustand persist, bootstrap from fixture |
| `fixtures/saxonMathLessons.fixture.ts` | Saxon Math Lessons 2–6 fake file names |
| `tests.ts` | 13 assertion tests |

## Resource model

```typescript
LessonResource {
  id, filename, type, path
}
```

Types: `presentation`, `pdf`, `teacher-notes`, `worksheet`, `assessment`, `image`, `video`

## Classifier rules

| Pattern | Type |
|---------|------|
| slideshow, slides, presentation | `presentation` |
| script, teacher, notes | `teacher-notes` |
| worksheet, practice | `worksheet` |
| assessment, quiz, test | `assessment` |

## Lesson detection results (pilot fixture)

| Lesson | Resources | OmniNote Ready |
|--------|-----------|----------------|
| 2 | slides, script, practice | ✓ |
| 3 | presentation, teacher-notes, worksheet, assessment | ✓ |
| 4 | slideshow, script, practice | ✓ |
| 5 | slides, teacher-script, worksheet | ✓ |
| 6 | presentation, notes, practice, quiz | ✓ |

Lessons 1, 7, and Reading Mastery are excluded by pilot filter.

## Command Center integration

**Today Prep** (`TodayPrepPanel.tsx`) uses `useLibraryIndexStore` + `resolveFetchedLessonForScreen`:

```
Math
Saxon Math Lesson 2
Ready
[Open Lesson] [Open Materials] [Open OmniNote]
```

**Teacher Dock** — existing `SUBJECT_PROMOTED_TOOLS` promotes OmniNote, Materials, Timer, Display for math mode when lesson context exists via pacing.

## OmniNote readiness

- `omninoteReady: true` when presentation/pdf/worksheet primary resource exists
- `buildOmniNotePayload()` produces handoff payload (teacher-notes excluded)
- `toBridgeLessonPackageFromFetcher()` bridges to existing OmniNote handoff layer

## Future: Google Drive API integration

1. Replace `SAXON_MATH_DRIVE_FIXTURE` with Drive API folder listing
2. Map Drive file IDs into `LessonResource.driveFileId`
3. OAuth scope: read-only access to `Teacher AI Workstation/` root
4. Incremental scan on app launch or manual refresh
5. Expand pilot beyond Saxon Math 2–6 after validation

## Validation

```bash
npm run build
npm run lint
npm run test:curriculum
npm run test:curriculum-fetcher
npm run test:teacher-workstation
npm run test:e2e
```

## Privacy

Fixtures contain filenames only — no copyrighted PDF content. Actual curriculum files remain in Google Drive.
