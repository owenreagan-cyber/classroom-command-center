# Phase 10A — Open With + Media Workflow

Status: ready

## Goal

Add a teacher-only Open With workflow for quickly launching lesson materials from `/control` while preserving `/display` privacy and visual safety.

This phase should improve daily teaching flow without adding embedded media viewers or external integrations.

## In Scope

- Teacher-only Open With panel or section
- Resource type presets such as:
  - Google Slides
  - Google Docs
  - Google Drive file/folder
  - YouTube link
  - PDF/file link
  - Website
  - Other
- Per-resource Open button
- Copy link button if useful
- simple URL validation
- optional active screen/page scoping
- local-first persistence using existing store patterns
- backup/restore compatibility review
- `/display` privacy checks
- tests and docs

## Out of Scope

- YouTube embedded player
- PDF viewer
- Spotify SDK/OAuth
- Google Drive API
- Canvas ingestion
- file upload/sync
- backend
- auth/accounts
- AI/OCR
- Tauri
- new npm dependencies
- student display resource controls

## Success Criteria

- `/control` includes teacher-only Open With workflow
- resource presets are easy to choose
- resources can be opened safely in a new tab/window
- invalid or blank URLs warn only in `/control`
- `/display` does not show Open With controls, resource links, teacher notes, or material launcher UI
- existing Today Prep + Material Launcher remains intact or is cleanly integrated
- existing tests still pass
- visual QA and screenshot baseline tests still pass
- build passes
- lint passes
