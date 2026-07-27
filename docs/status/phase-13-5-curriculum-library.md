# Phase 13.5 — Curriculum Library + Google Drive Staging

Status: complete (schemas, import architecture, integration stubs)  
Date: 2026-07-26

## Delivered

| Area | Path |
|------|------|
| Lesson package standard | `docs/design/lesson-package-standard.md` |
| Drive folder layout | `docs/design/google-drive-curriculum-library.md` |
| Drive folder template | `templates/curriculum-library/README.md` |
| Sample metadata | `examples/curriculum-library/` |
| Import module | `src/features/curriculum-library/` |
| OmniNote handoff adapter | `src/features/curriculum-library/omninoteHandoff.ts` |
| Today Prep integration | `src/board/TodayPrepPanel.tsx` |
| Workspace lesson context | `src/features/workspace/workspaceResolver.ts` |
| Tests | `npm run test:curriculum-library` |

## Not built

- Google Drive OAuth / live API sync
- OmniNote native application
- Automatic file download from Drive
- Copyrighted curriculum file storage in GitHub

## Privacy

GitHub contains schemas and fake fixtures only. Actual curriculum files remain in Google Drive.
