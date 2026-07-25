# Phase 10B — Student-Safe Now Showing Display Label

Status: ready

## Goal

Add a student-safe "Now Showing" label to `/display` that can show the label of the teacher-selected Open With resource without exposing URLs, launch controls, copy controls, notes, or editing UI.

## In Scope

- Teacher can mark one Material Launcher / Open With resource as Now Showing.
- `/display` may show a simple label such as:
  - Now Showing: Chapter 2 Slides
  - Now Showing: Mountain Engineering Video
- Optional preset icon/text may show if student-safe.
- No URLs on `/display`.
- No Open With button on `/display`.
- No Copy Link button on `/display`.
- No notes or teacher-only metadata on `/display`.
- Local persistence.
- Backup/restore compatibility.
- Privacy tests.
- Visual QA and screenshot baseline handling.

## Out of Scope

- embedded YouTube player
- embedded PDF viewer
- opening resources from `/display`
- student-facing link list
- API integrations
- backend/cloud/auth
- new npm dependencies
- Canvas/Google/Spotify integrations

## Success Criteria

- `/control` can select/clear a Now Showing resource.
- `/display` shows only a student-safe label when enabled.
- `/display` exposes no resource URLs, notes, launch buttons, copy buttons, selectors, or teacher controls.
- Full local backup/restore preserves the setting if it is part of board state.
- Daily Brief export remains teacher-safe.
- Tests pass.
- Screenshot baselines are updated intentionally if `/display` changes.
