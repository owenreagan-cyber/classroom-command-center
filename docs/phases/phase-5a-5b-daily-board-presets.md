# Command Center Phase 5A/5B — Daily Board Presets + Quick Screen Setup

## Purpose

Phase 5A/5B adds local quick setup presets for common classroom board moments.

This phase builds directly on Phase 4C/4D/4E inline editing. Presets give the teacher a fast starting point, then inline editing can adjust wording for the day.

## What was added

### Local preset model

A small local preset model was added:

- `BoardPresetId`
- `BoardPreset`
- `BOARD_PRESETS`
- `getPresetsForScreen(screenId)`
- `applyBoardPresetToContents(contents, presetId)`

### Quick Setup panel

Teacher Dock now includes a Quick Setup panel.

The panel shows presets only for the active screen.

### Presets included

- Morning Arrival
- Math Warm-Up
- Reading Rotation
- Pack-Up
- Assessment Mode
- Snack / Lunch Routine
- Ready Position Reset

## Safety behavior

Applying a preset:

- updates the current preset target screen content
- preserves card visibility settings
- preserves timers
- preserves Teacher Dock mode
- preserves teacher notes
- uses existing local persistence
- does not call any backend, API, cloud service, or external integration

The panel includes warning copy explaining that presets overwrite text/materials on the target screen.

## Out of scope

This phase does not add:

- custom user-created presets
- preset import/export
- scheduled presets
- backend/cloud/API
- route split
- authentication
- AI generation
- curriculum editor
- Today Prep
- OmniNote
- Google Drive, Canvas, YouTube, Spotify, or PDF integrations

## Validation

Required validation:

```bash
npm run build
npm run lint
```

Manual QA checklist:

```bash
docs/qa/phase-5a-5b-daily-board-presets-qa.md
```
