# Lesson Package Standard

Status: Phase 13.5 — Curriculum Library foundation  
Purpose: define how Google Drive curriculum folders map to launchable lesson metadata in Command Center.

## Overview

A **LessonPackage** is the unit Command Center uses to discover, organize, and launch lesson materials. Actual curriculum files live in Google Drive; the repository stores schemas, templates, and sample metadata only.

```
Google Drive folder          LessonScanner           LibraryLessonPackage
Saxon Math/Lesson 02    →    resourceClassifier  →   { subject, resources, workspace }
```

## LessonPackage schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | yes | Stable package id, e.g. `saxon-math-lesson-02` |
| `title` | `string` | yes | Teacher-facing title |
| `subject` | `CurriculumSubjectId` | yes | `math`, `reading`, `spelling`, `shurley`, `history`, `science` |
| `curriculum` | `string` | yes | Program name, e.g. `Saxon Math`, `Reading Mastery` |
| `grade` | `string` | no | Grade level label, e.g. `4` |
| `track` | `string` | no | Curriculum track id when applicable |
| `week` | `number` | no | School week number |
| `lessonNumber` | `number \| string` | yes | Lesson sequence within program |
| `resources` | `LibraryResource[]` | yes | Classified files in the lesson folder |
| `workspace` | `TeachingWorkspaceId` | yes | Dock workspace for this lesson |
| `annotationMode` | `'annotate' \| 'present' \| 'read-only'` | yes | OmniNote open mode |
| `displayMode` | `'student-safe' \| 'teacher-only' \| 'none'` | yes | Student display routing |

### Example — Saxon Math Lesson 2

```json
{
  "id": "saxon-math-lesson-02",
  "title": "Saxon Math Lesson 2",
  "subject": "math",
  "curriculum": "Saxon Math",
  "grade": "4",
  "lessonNumber": "2",
  "workspace": "math",
  "annotationMode": "annotate",
  "displayMode": "student-safe",
  "resources": [
    { "id": "res-1", "type": "presentation", "file": "lesson2-slides.pdf" },
    { "id": "res-2", "type": "teacher-notes", "file": "lesson2-script.pdf" },
    { "id": "res-3", "type": "practice", "file": "lesson2-practice.pdf" }
  ]
}
```

Note: `practice` maps to resource type `worksheet` in the classifier. The example above uses the teacher-facing alias; stored packages use canonical types.

## Supported resource types

| Type | Use | Typical filename patterns |
|------|-----|---------------------------|
| `presentation` | Slide decks, exported presentations | `*slides*`, `*presentation*`, `*.pptx` |
| `pdf` | Generic PDF handouts | `*.pdf` (fallback) |
| `teacher-notes` | Teacher script, answer guide | `*script*`, `*teacher*`, `*notes*` |
| `worksheet` | Student practice, worksheets | `*practice*`, `*worksheet*`, `*ws*` |
| `answer-key` | Teacher-only keys | `*answer*`, `*key*` |
| `image` | Single images | `*.png`, `*.jpg`, `*.webp` |
| `video` | Instructional video | `*.mp4`, `*.mov`, `*.webm` |
| `audio` | Audio clips, read-aloud | `*.mp3`, `*.wav`, `*.m4a` |
| `template` | Reusable blank forms | `*template*` |
| `blank-canvas` | Empty teaching surface | `*canvas*`, `*blank*` |

Each resource includes:

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique within package |
| `type` | `LibraryResourceType` | Canonical type from table above |
| `file` | `string` | Filename or Drive-relative path |
| `title` | `string` | Optional display title |
| `driveFileId` | `string` | Optional Google Drive file id |
| `mimeType` | `string` | Optional MIME hint |

## Readiness states

| State | Meaning |
|-------|---------|
| `ready` | Primary presentation + at least one student resource detected |
| `partial` | Some resources found; missing primary presentation |
| `missing` | Folder scanned but no classifiable resources |

## Workspace routing

| Subject | Default workspace |
|---------|-------------------|
| `math` | `math` |
| `reading` | `reading` |
| `spelling`, `shurley`, `history`, `science` | `morning` |

## Privacy

- **Google Drive** holds actual curriculum files (copyrighted publisher content).
- **GitHub** holds schemas, templates, import structures, and fake fixtures only.
- Do not commit student data, private notes, or parent information.

## Related modules

| Module | Path |
|--------|------|
| Curriculum pacing | `src/features/curriculum/` |
| Curriculum library import | `src/features/curriculum-library/` |
| OmniNote handoff contract | `docs/design/omninote-integration-contract.md` |
| Drive folder layout | `docs/design/google-drive-curriculum-library.md` |
| Sample metadata | `examples/curriculum-library/` |
