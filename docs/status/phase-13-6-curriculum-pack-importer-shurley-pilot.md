# Phase 13.6 — Curriculum Pack Importer (Shurley Pilot)

**Branch:** `phase-13-6-curriculum-pack-importer-shurley-pilot`  
**Status:** Pilot complete — metadata-only import, no copyrighted content in repo

## Goal

First real curriculum importer using the Shurley Chapter 1 Teacher Resource Pack as pilot. Creates **metadata only** — filenames, paths, and lesson structure — without copying copyrighted curriculum into GitHub.

## Source Format

Pilot source (local, outside repo):

```
~/Projects/shurley-packet-system/exports/teacher-resource-packs/Shurley_Chapter_1_Teacher_Resource_Pack/
```

Standard Teacher Resource Pack sections:

| Folder | Purpose |
|--------|---------|
| `00_Teacher_Start_Here` | Lesson entry points |
| `01_Lesson_Plans` | Planning docs |
| `02_Teacher_Scripts` | Teacher scripts |
| `03_Student_Resources` | Student packet / worksheets |
| `04_Teacher_Keys` | Teacher edition / keys |
| `05_Presentations` | Slide decks per lesson |
| `06_Visual_References` | Reference sheets |
| `07_Assessments` | Chapter assessments |
| `08_Teacher_Planning` | Build / QA artifacts |

Repository fixture (metadata only):  
`src/features/curriculum-pack-importer/fixtures/shurleyChapter1.fixture.ts`

## Detection Rules

1. **Pack root** — folder name matches `Shurley_Chapter_{N}_Teacher_Resource_Pack`
2. **Curriculum** — `Shurley English`
3. **Chapter** — parsed from pack root name (pilot: Chapter 1)
4. **Lessons** — from `05_Presentations` filenames matching `Lesson_{N}` (pilot: 3, 4, 5, 6)
5. **Lesson titles** — parsed from presentation filename suffix (e.g. `Complete Sentences`)

## Resource Mapping

| Pack Section | Resource Type |
|--------------|---------------|
| `05_Presentations` | `presentation` |
| `02_Teacher_Scripts` | `teacher-notes` |
| `03_Student_Resources` | `student-resource` |
| `04_Teacher_Keys` | `teacher-key` |
| `07_Assessments` | `assessment` |

Chapter-level resources (scripts, packet, keys, assessments) attach to each detected lesson. Lesson-specific presentations attach per lesson number.

## Lesson Package Output

Module: `src/features/curriculum-pack-importer/`

Example output (`CurriculumLessonPackage`):

```json
{
  "id": "shurley-ch1-lesson-03",
  "title": "Shurley Chapter 1 Lesson 3 - Complete Sentences",
  "subject": "shurley",
  "curriculum": "Shurley English",
  "chapter": 1,
  "lessonNumber": 3,
  "workspace": "shurley",
  "resources": ["presentation", "teacher-notes", "student-resource", "teacher-key", "assessment"],
  "omninoteReady": true
}
```

Detected pilot lessons:

| Lesson | Title |
|--------|-------|
| 3 | Complete Sentences |
| 4 | Analogies |
| 5 | Capitalization Editing |
| 6 | Mixed Editing |

## Command Center Integration

- **Today Prep** — writing screen shows Shurley chapter/lesson, resource checklist, Ready status, and Open Lesson / Open Materials / Open OmniNote actions
- **Library index** — Shurley packages merged into fetcher pilot index via `packIndexBridge.ts`
- **Teacher Dock** — new **Shurley Workspace** with promoted OmniNote, Materials, Display, Timer

## Google Drive Preparation

No OAuth implemented. Export/import contract only:

- `src/features/curriculum-pack-importer/driveContract.ts`
- `exportPackTreeFromDrive()` converts a future Drive listing → `TeacherResourcePackTree`
- Same scanner → lesson detector → resource mapper → lesson package builder pipeline

Future flow:

```
Google Drive folder → exportPackTreeFromDrive() → TeacherResourcePackTree
  → packScanner / lessonDetector / resourceMapper / lessonPackageBuilder
  → library index merge
```

## Tests

```bash
npm run test:curriculum-pack-importer
npm run test:curriculum   # includes pack importer
```

Coverage:

- Shurley pack detected
- Chapter detected
- Lesson numbers 3–6 detected
- Presentation / teacher script / student resources mapped
- LessonPackage created
- OmniNote payload created
- Library bridge + Drive contract export

## Validation

```bash
npm run build
npm run lint
npm run test:curriculum
npm run test:teacher-workstation
npm run test:e2e
```
