# Phase 8B — Teacher Control / Student Display Route Split

Status: COMPLETE

## Goal

Add a safer local route split between teacher controls and student/projector display.

Routes:

- `/control` — teacher workspace
- `/display` — student-facing projector view

This phase should preserve the existing local-first app while making it harder for teacher-only UI to accidentally appear on the projector.

## Scope

In scope:
- lightweight route detection from `window.location.pathname`
- `/control` teacher route
- `/display` student route
- redirect/fallback behavior for `/`
- preserve existing display/edit mode behavior where practical
- keep all state local
- keep existing Zustand stores
- protect Teacher Dock, backup controls, picker controls, Studio Canvas editing chrome, and teacher-only panels from `/display`
- update docs/status
- build/lint validation

Out of scope:
- React Router dependency
- backend
- cloud sync
- accounts
- login
- auth
- classroom roster sync
- Canvas ingestion
- media launcher
- PDF viewer
- annotation system
- large redesign
- new npm dependencies

## Success Criteria

- `/control` opens teacher workspace
- `/display` opens student/projector display
- `/display` does not render Teacher Dock
- `/display` does not render backup/restore controls
- `/display` does not render picker/coaching controls
- `/display` does not render Studio Canvas editing controls
- `/display` can show the active class/page display view
- existing root path behavior is safe and documented
- build passes
- lint passes
- no new dependencies
