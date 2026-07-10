# Command Center Phase 4D/4E — Inline Editing Polish + Classroom Board Usability

## Purpose

This combined phase improves the Phase 4C inline editing foundation and adds a classroom-board usability pass.

The goal is to keep the app lightweight while making editing safer, clearer, and more usable during real teacher prep.

## What changed

### Inline editing polish

- Added clearer edit-panel styling inside editable cards.
- Added helper text to editable fields.
- Improved focus-ring styling for edit controls.
- Added draft-safe list editing so blank lines do not immediately make typing feel broken.
- Normalized list inputs on blur.
- Kept edit controls restricted to edit mode.

### Empty-state behavior

Student-facing cards now handle empty edited content more gracefully.

When a teacher clears a list or text field, display cards show a simple fallback such as:

```text
Add details in edit mode.
```

Materials lists show:

```text
Add items in edit mode.
```

This prevents cards from appearing broken or visually empty after edits.

### Teacher Dock usability

The reset area now explains that reset restores the starter board, clears inline edits, and resets timers.

The Teacher Dock copy also states that display mode hides edit controls.

## Preserved behavior

This phase preserves:

- local-first storage
- existing Zustand persistence
- existing timer behavior
- Teacher Dock hidden in display mode
- teacher-only note/hint privacy
- Phase 4B hidden-card behavior
- existing screen expansion
- no new dependencies

## Out of scope

This phase does not add:

- backend/cloud/API
- route split
- authentication
- rich text
- markdown
- drag-and-drop layout editing
- AI editing
- curriculum editor
- material launcher
- Today Prep
- OmniNote
- Google Drive, Canvas, Spotify, YouTube, or PDF integrations

## Validation

Required validation:

```bash
npm run build
npm run lint
```

Manual QA checklist:

```bash
docs/qa/phase-4d-4e-inline-editing-polish-qa.md
```
