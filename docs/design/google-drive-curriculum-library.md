# Google Drive Curriculum Library Structure

Status: Phase 13.5 — staging architecture  
Purpose: recommended folder layout for Teacher AI Workstation curriculum storage.

## Root layout

All curriculum content lives under a single Drive root folder:

```
Teacher AI Workstation/
├── Curriculum/
│   ├── Math/
│   │   └── Saxon Math/
│   │       ├── Lesson 01/
│   │       ├── Lesson 02/
│   │       └── Lesson 03/
│   ├── Reading/
│   │   └── Reading Mastery/
│   ├── Spelling/
│   ├── Shurley/
│   ├── History/
│   └── Science/
├── Lesson Packages/
├── Teacher Scripts/
├── Student Resources/
├── Assessments/
└── Classroom Assets/
    ├── Images/
    ├── Audio/
    ├── Backgrounds/
    └── Templates/
```

## Folder conventions

### Curriculum/{Subject}/{Program}/Lesson NN/

Each lesson folder contains the files for one instructional session. Command Center scans these folders via `lessonScanner.ts` and builds `LibraryLessonPackage` metadata.

**Naming rules:**

- Subject folder matches curriculum subject: `Math`, `Reading`, `Spelling`, `Shurley`, `History`, `Science`
- Program folder matches publisher/series: `Saxon Math`, `Reading Mastery`
- Lesson folder: `Lesson 01`, `Lesson 02`, … (zero-padded preferred)
- Files use descriptive names: `lesson2-slides.pdf`, `lesson2-script.pdf`, `lesson2-practice.pdf`

### Lesson Packages/

Exported or bundled lesson packages (JSON metadata + resource references). Used when a lesson spans multiple Drive locations or includes pre-built widget configs.

### Teacher Scripts/

Teacher-only scripts and answer keys. These folders are imported with `displayMode: teacher-only` and never route to student display.

### Student Resources/

Worksheets, practice packets, and student-facing PDFs that may be shown on display when `displayMode: student-safe`.

### Assessments/

Formative and summative assessment materials. Classified as `worksheet` or `answer-key` depending on filename.

### Classroom Assets/

Shared media not tied to a single lesson:

| Subfolder | Resource type |
|-----------|---------------|
| `Images/` | `image` |
| `Audio/` | `audio` |
| `Backgrounds/` | `image` |
| `Templates/` | `template` |

## Import flow

```
1. Teacher connects Drive root "Teacher AI Workstation"
2. driveImport.ts walks Curriculum/{Subject}/{Program}/Lesson NN/
3. lessonScanner.ts extracts lesson number from folder name
4. resourceClassifier.ts maps each file to a resource type
5. libraryStore.ts indexes LibraryLessonPackage entries
6. pacingResolver.ts matches today's lesson → library package
7. Today Prep shows lesson label + readiness + launch buttons
```

## Sample metadata (repository)

Fake fixtures for development and tests — no copyrighted content:

| File | Purpose |
|------|---------|
| `examples/curriculum-library/saxon-math-lesson-02.sample.json` | Complete lesson package metadata |
| `examples/curriculum-library/drive-folder-index.sample.json` | Simulated Drive tree for import tests |
| `templates/curriculum-library/README.md` | Empty folder scaffold instructions |

## What stays in Drive vs GitHub

| Location | Contents |
|----------|----------|
| **Google Drive** | Actual PDFs, slides, videos, audio, publisher curriculum |
| **GitHub** | Schemas, import code, documentation, sample metadata, fake fixtures |
