# Command Center Phase 4C — Basic Inline Editing Foundation

## Purpose

Phase 4C adds a minimal inline editing foundation for core student-facing classroom board text.

This phase intentionally keeps editing lightweight. It does not introduce a curriculum editor, backend, cloud service, rich text editor, drag-and-drop layout editor, AI editing, authentication, or route split.

## What was added

Reusable edit components:

- `EditableText`
- `EditableList`
- `EditableMaterials`

These controls render only in edit mode and update the existing `boardStore.contents` object through the existing `updateContents(contents)` action.

## Editable student-facing fields

### Expanded subject screens

For Writing, Science, Social Studies, Intervention, Assessment, Flexible Groups, Centers / Rotations, and Homework / Pack-Up:

- focus task
- agenda items
- materials: Have Out
- materials: Put Away

### Homeroom

- Do Now prompt
- reminders
- materials: Have Out
- materials: Put Away

### Math

- lesson title
- materials: Have Out
- materials: Put Away

### Reading

- lesson title
- materials: Have Out
- materials: Put Away

### Snack / Lunch

- cleanup reminders
- routine

### Ready Position

- compact cue
- checklist steps

## Persistence

Edits flow through the existing Zustand store and persisted `contents` state.

No new storage layer was added.

## Display-mode protection

Display mode renders the clean board content only.

Display mode does not render:

- Teacher Dock
- edit inputs
- textareas
- teacher-only hints
- teacher-only notes
- hidden cards

Existing Phase 3A privacy helpers and Phase 4B card visibility behavior remain in place.

## Out of scope

This phase does not add:

- new npm dependencies
- backend/cloud/API
- Firebase
- Supabase
- MongoDB
- Google Drive API
- Canvas API
- PDF viewer
- YouTube page
- Spotify widget
- annotation tools
- Today Prep
- Teacher Material Launcher
- rich text editor
- drag-and-drop layout editor
- complex form library
- AI editing
- authentication
- `/display` and `/control` route split

## Validation

Required validation:

```bash
npm run build
npm run lint
```
