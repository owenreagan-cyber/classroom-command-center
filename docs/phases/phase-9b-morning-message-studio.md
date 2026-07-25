# Phase 9B — Morning Message Studio

Branch: `command-center-phase-9b-morning-message-studio`  
Base: Phase 9A (`3f7ace6`)

## Goal

Build a native Morning Message Studio for creating, saving, previewing, and displaying polished daily morning messages on the Homeroom Morning Message page.

## Data Model

- `MorningMessageState` — persisted in `BoardState.morningMessage` (Zustand board store, version 10)
- `MorningMessageContent` — today's editable message (text, bullets, visibility, date mode)
- `MorningMessageTemplate` — reusable saved templates with stable IDs
- `MorningMessageSectionVisibility` — per-section enabled/disabled flags

### Sections (optional, ordered)

greeting, date, mainMessage, doNow, announcements, questionOfTheDay, reminders, celebration, schedulePreview, materials, closing

## Teacher Workflow (`/control`)

1. Open **Morning Message Studio** in Teacher Dock
2. Edit section content and visibility toggles
3. Preview exact student-facing layout
4. Save / apply / rename / delete templates
5. **Send to Display** navigates to Homeroom → Morning Message and opens display window
6. Clear or restore defaults with confirmation

## Template Behavior

- Applying a template copies content into today's message (does not modify the source template)
- Saving over a template requires explicit **Overwrite** confirmation
- Deleting a template does not delete today's active message
- Six seed templates provided (Standard School Day, Monday Reset, etc.) — editable/deletable

## Display Behavior (`/display`)

- `MorningMessageDisplay` renders via `morning-message` widget on `homeroom-morning-message` page
- Composition-based: no editor controls, no template UI, no Today Prep data
- Projector-safe typography via existing display tokens
- Adaptive layout: sparse (2–3 sections), normal, dense (7+ with 2-column grid)
- Empty section headings never render

## Privacy Boundary

`/display` never mounts Morning Message Studio, TeacherDock, or Today Prep editor. Student view reads only `morningMessage.current` through the display widget.

## Persistence

- Store key: `classroom-command-center-lite`, version **10**
- Migration: version < 10 receives `DEFAULT_MORNING_MESSAGE`
- Widget type migration: existing `reminders` widgets on Morning Message page upgrade to `morning-message`

## Backup / Restore

- **Full local backup** and **board JSON export** include `morningMessage` state and templates
- **Daily Brief packets exclude** Morning Message data (separate workflow; no schema change)
- Older backups without `morningMessage` restore with sensible defaults

## Date Behavior

- Automatic local date (default) or teacher override via date input
- Format: `Saturday, July 25` — no date library

## Schedule Preview

- Manual bullet list with optional **Fill from homeroom page titles** action
- Does not build a new scheduling backend

## Tests

- `npm run test:morning-message` — data model, display logic, backup shape
- `npm run test:pages` — morning-message widget on page sequence
- `npm run test:e2e` — control/display privacy, preview toggle

## Known Limitations

- Morning Message is Homeroom-scoped (single daily message, not per-screen)
- OmniNote integration deferred to a future phase
- Visual QA screenshots require manual capture at 1920×1080, 1366×768, 1024×768
