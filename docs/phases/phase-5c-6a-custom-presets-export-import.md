# Command Center Phase 5C/6A — Custom Presets + Board Export/Import Foundation

## Purpose

Phase 5C/6A adds local custom presets and a local JSON backup/restore foundation.

This makes the classroom board more useful without adding backend storage, cloud sync, authentication, or external APIs.

## What was added

### Custom presets

Teachers can now:

- save the current screen as a custom preset
- apply a custom preset
- delete a custom preset

Custom presets are stored in local Zustand persistence and stay in the browser.

### Board export/import

Teachers can now:

- export the full board state as a JSON file
- import a previously exported board JSON file

Import replaces the current board state.

## Safety behavior

This phase remains local-only.

It does not add:

- backend
- cloud sync
- APIs
- auth
- Drive/Canvas integrations
- external storage
- new npm dependencies

Display mode still hides Teacher Dock, Quick Setup, Backup/Restore, edit controls, and teacher-only content.

## Export contents

The export includes:

- mode
- active screen
- background
- board contents
- teacher notes
- card visibility
- custom presets

## Out of scope

This phase does not add:

- cross-device sync
- iCloud/Drive sync
- automatic backups
- scheduled backups
- preset sharing service
- per-file encryption
- custom preset rename
- custom preset folders
- partial import tools

## Validation

Required validation:

```bash
npm run build
npm run lint
```

Manual QA checklist:

```bash
docs/qa/phase-5c-6a-custom-presets-export-import-qa.md
```
