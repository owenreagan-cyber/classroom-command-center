# Manual QA — Phase 6B/6C Backup Safety + Storage Health

Use this checklist after `npm run dev`.

## Storage health panel

- [ ] Backup / Restore panel appears in edit mode.
- [ ] Storage status appears as Saved or Empty.
- [ ] Approximate storage size appears.
- [ ] Custom preset count appears.
- [ ] Teacher note count appears.
- [ ] Storage key appears.
- [ ] Storage version appears.
- [ ] Active screen appears.

## Export

- [ ] Export board JSON downloads a `.json` file.
- [ ] Export status mentions custom preset count.
- [ ] Export still includes board contents, visibility, notes, and custom presets.

## Import confirmation

- [ ] Selecting a valid export does not immediately replace board state.
- [ ] Restore confirmation appears.
- [ ] Restore confirmation shows exported date.
- [ ] Restore confirmation shows active screen.
- [ ] Restore confirmation shows custom preset count.
- [ ] Restore confirmation shows teacher note count.
- [ ] Cancel leaves the current board unchanged.
- [ ] Confirm restore replaces the board state.

## Invalid imports

- [ ] Invalid JSON shows a safe error.
- [ ] Wrong app/version JSON shows a safe error.
- [ ] Import failure does not crash the app.
- [ ] File input resets after invalid import.

## Privacy/display

- [ ] Display mode hides Teacher Dock.
- [ ] Display mode hides Backup / Restore.
- [ ] Display mode hides Quick Setup.
- [ ] Display mode hides teacher-only notes and hints.

## Validation

- [ ] `npm run build` passes.
- [ ] `npm run lint` passes.
