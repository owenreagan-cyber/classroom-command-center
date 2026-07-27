# Status — Phase 11C Command Center → OmniNote Handoff

Status: COMPLETE WITH WARNINGS

Date: 2026-07-27

## Goal

Connect the Command Center LessonPackage pipeline to OmniNote Phase 10 import via local JSON export and `omninote://lesson` deep links.

## Architecture

```
Today Prep / library index
        │
        ▼
buildStudentSafeExportPackage()
        │
        ▼
.local/omninote-handoff/{package-id}/package.json (+ sibling PDFs)
        │
        ▼
omninote://lesson?title=...&type=lessonPackage&source=file://...
        │
        ▼
OmniNote LessonPackageImporter
```

## Package Schema Emitted

Student-safe export only:

```json
{
  "id": "saxon-math-lesson-02",
  "title": "Saxon Math Lesson 2",
  "subject": "math",
  "curriculum": "Saxon Math",
  "lessonNumber": "2",
  "workspace": "math",
  "annotationMode": "annotate",
  "displayMode": "student-safe",
  "resources": [
    {
      "id": "saxon-math-lesson-02-res-1",
      "title": "lesson2-slides.pdf",
      "type": "presentation",
      "file": "lesson2-slides.pdf",
      "studentVisible": true,
      "teacherOnly": false
    }
  ]
}
```

Excluded from export: `readiness`, `drivePath`, teacher notes, answer keys, tokens, Canvas URLs.

## Files Added

- `src/features/omninote-handoff/types.ts`
- `src/features/omninote-handoff/privacy.ts`
- `src/features/omninote-handoff/lessonPackageExport.ts`
- `src/features/omninote-handoff/omniNoteUrl.ts`
- `src/features/omninote-handoff/localHandoffWriter.ts`
- `src/features/omninote-handoff/tests.ts`
- `scripts/test-omninote-handoff.sh`
- `scripts/test-omninote-command-center-handoff.sh`

## Files Updated

- `src/board/TodayPrepPanel.tsx` — Teach in OmniNote, Copy OmniNote Link, gating
- `src/features/teacher-dock/components/DockLauncherPanel.tsx` — OmniNote Ready indicator
- `package.json` — `test:omninote-handoff`, `test:omninote-command-center-handoff`

## Today Prep UI

- **Teach in OmniNote** — enabled when readiness is ready (or override), `omninoteReady`, and student-visible primary resource exists; copies student-safe JSON to clipboard
- **Copy OmniNote Link** — copies instructions to run local handoff script + open URL file
- **Legacy Copy** — prior bridge copy-link flow preserved
- Not shown on `/display`

## Validation

| Check | Result |
|-------|--------|
| `npm run test:omninote-handoff` | PASS |
| `npm run test:omninote-command-center-handoff` | PASS |
| Saxon Lesson 2 export + privacy | PASS |
| Shurley Lesson 3 export + privacy | PASS |
| Physical iPad | WARN — not run |

## Next Step

Physical iPad: run `scripts/test-omninote-command-center-handoff.sh`, copy generated `omninote.url.txt` to iPad workflow, tap **Open** on iOS confirmation.

## Ready to Commit?

No — per instructions.
