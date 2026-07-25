# Phase 8C — Today Prep + Teacher Material Launcher

Status: ready

## Goal

Add a teacher-only prep layer for daily classroom workflow.

The goal is to help the teacher quickly prepare materials, links, and reminders for the active class/page without exposing teacher-only information on `/display`.

## Current Route Foundation

- `/control` — teacher workspace
- `/display` — student/projector view
- `/` — redirects safely to `/control`
- Teacher Dock includes an Open Student Display control from Phase 8B1.

## In Scope

- Today Prep panel in Teacher Dock or control workspace
- active screen/page awareness
- teacher-only material/resource checklist
- simple manual resource links
- missing-link warnings
- Open button for valid URLs
- local-first persistence
- backup/restore compatibility review
- no backend
- no cloud
- no new npm dependencies
- docs/status update
- validation

## Out of Scope

- PDF viewer
- YouTube embedded player
- Spotify SDK/OAuth
- Google Drive API
- Canvas ingestion
- file upload/sync
- backend
- accounts/auth
- AI
- OCR
- Tauri
- new dependencies
- student display resource controls

## Success Criteria

- `/control` shows teacher-only Today Prep / Material Launcher workflow
- `/display` does not show Today Prep or Material Launcher
- teacher can add/edit resource labels and URLs locally
- teacher can mark prep items complete/incomplete
- missing/invalid URL warnings appear only in `/control`
- active screen/page context is clear
- Open Student Display control remains intact
- existing route safety remains intact
- backup/restore is not broken
- build passes
- lint passes
