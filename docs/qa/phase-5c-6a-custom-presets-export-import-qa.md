# Manual QA — Phase 5C/6A Custom Presets + Export/Import

Use this checklist after `npm run dev`.

## Custom presets

- [ ] Teacher Dock appears in edit mode.
- [ ] Save current screen custom preset appears in Quick Setup.
- [ ] Saving a custom preset adds it to the active screen list.
- [ ] Applying a custom preset restores saved screen content.
- [ ] Deleting a custom preset removes it.
- [ ] Custom presets persist after browser refresh.
- [ ] Custom presets only appear on their matching screen.

## Export

- [ ] Export board JSON downloads a `.json` file.
- [ ] Export includes board contents.
- [ ] Export includes card visibility.
- [ ] Export includes teacher notes.
- [ ] Export includes custom presets.

## Import

- [ ] Importing a valid export restores board state.
- [ ] Importing an invalid JSON file shows a safe error.
- [ ] Importing does not crash the app.
- [ ] Imported custom presets appear in Quick Setup.
- [ ] Imported card visibility settings are restored.

## Privacy/display

- [ ] Display mode hides Teacher Dock.
- [ ] Display mode hides Quick Setup.
- [ ] Display mode hides Backup / Restore.
- [ ] Display mode hides teacher-only notes and hints.
- [ ] Hidden cards remain hidden after import.

## Validation

- [ ] `npm run build` passes.
- [ ] `npm run lint` passes.
