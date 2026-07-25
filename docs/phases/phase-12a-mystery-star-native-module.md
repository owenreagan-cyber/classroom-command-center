# Phase 12A — Mystery Star Native Module + Local Roster Import

## Goal

Improve the native Mystery Star / Mystery Student module inside Classroom Command Center with typed rosters, preferred-name display, reading section pools, and local roster import — without embedding the standalone HTML reference.

## Scope

- Shared roster foundation (Homeroom, Math, Reading with RM4/SM5 sections)
- Versioned picker storage key (`classroom-picker-storage-v3`)
- Mystery Star draw/reveal/outcome workflow in `/control`
- Display-safe generic status on `/display`
- Sample roster fixture + local import docs
- Schedule change notes (Shurley / History-Science swap pending confirmation)

## Out of scope

- Backend, Canvas, Google Drive, network APIs
- Prize Board / Press Your Luck (next phase)

## Privacy boundaries

- Hidden identities never on `/display`
- Real rosters stay in `.local/` only
- UI uses `displayName` (= preferredName || firstName)
- State keyed by stable student ids

## Validation

- `npm run build`
- `npm run lint`
- `npm run test:student-picker`
- Privacy grep for real legal names in tracked files

## Next phase

Prize Board / Press Your Luck reward game.
