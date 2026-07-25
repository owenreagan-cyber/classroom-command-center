# OmniNote Handoff Architecture

## Purpose

Classroom Command Center and OmniNote should work together without becoming one tangled app.

Command Center should manage classroom flow. OmniNote should handle iPad-native Apple Pencil annotation and clean presentation output.

## App Roles

### Classroom Command Center

Command Center is the teacher's classroom hub.

Responsibilities:

- classroom routines
- timers
- screen/vibe selection
- Morning Message
- Today Prep
- Open With resource launcher
- Now Showing student-safe display label
- future handoff controls for OmniNote

Command Center should not become the main Apple Pencil annotation surface.

### OmniNote

OmniNote is the native iPad teaching canvas.

Responsibilities:

- Apple Pencil annotation
- PDFs
- worksheets
- slide decks exported as PDFs
- blank teaching canvas
- external display output
- teacher/private editor vs clean student presentation

OmniNote should not become the full classroom command hub.

## Preferred First Bridge

The safest first bridge is a resource handoff model:

1. Teacher stores a resource in Command Center.
2. Teacher marks it as Now Showing or Now Annotating.
3. Teacher opens the same resource in OmniNote on iPad.
4. The student display shows only a safe label:
   - Now Showing: Chapter 2 Slides
   - Now Annotating: Mountain Engineering Worksheet

No URLs, notes, teacher controls, or launch buttons should appear on `/display`.

## Possible Handoff Levels

### Level 1 — Manual Handoff

Command Center shows the resource label and teacher opens the file manually on iPad.

Pros:
- safest
- no new dependencies
- works immediately
- no cross-device complexity

Cons:
- not automatic

### Level 2 — Link/File Prep Handoff

Command Center stores a resource with a label, preset, and safe metadata. OmniNote receives the same resource through Files, Share Sheet, AirDrop, iCloud Drive, or manual open.

Pros:
- practical for classroom use
- keeps apps separate
- works with PDFs and exported slide decks

Cons:
- still not fully automatic

### Level 3 — Custom URL Scheme / Deep Link

OmniNote supports a custom URL scheme such as:

- `omninote://open?...`
- `omninote://new-note?...`
- `omninote://import?...`

Command Center can offer an "Open in OmniNote" button for supported resources.

Pros:
- one-click workflow
- strong teacher experience

Cons:
- requires native iOS work
- must validate URLs carefully
- must handle device availability/failure gracefully

### Level 4 — Shared Local Package

Command Center and OmniNote read/write a shared lesson package format.

Pros:
- strong long-term architecture
- enables reusable teaching packages

Cons:
- bigger implementation
- needs careful versioning
- requires cross-repo coordination

### Level 5 — Realtime Cross-Device Sync

Command Center and OmniNote sync live status or ink.

Pros:
- powerful

Cons:
- too complex for now
- likely needs networking/backend or local peer protocol
- not recommended until both apps are mature

## Recommended Path

Recommended sequence:

1. Phase 11A — architecture and roadmap.
2. Phase 11B — Command Center "Now Annotating" label and handoff metadata.
3. OmniNote Phase — define/import a simple lesson resource package or deep-link target.
4. Phase 11C — Command Center "Open in OmniNote" button for supported resources.
5. Later — shared lesson package standard.

## Privacy Rules

`/display` may show:

- safe resource label
- safe preset label
- Now Showing / Now Annotating status

`/display` must not show:

- resource URL
- private note
- copy button
- open button
- edit controls
- teacher dock
- launch controls
- student roster private details
- hidden Mystery Star identity

## Classroom Hardware Workflow

Likely classroom setup:

- MacBook runs Command Center `/control`.
- Projector or display shows Command Center `/display`.
- iPad runs OmniNote for Apple Pencil annotation.
- iPad connects through AirPlay, USB-C/HDMI, or classroom display switching.

Two display modes are possible:

1. Command Center remains on the classroom screen while OmniNote is used separately.
2. Teacher switches projector input/AirPlay to OmniNote during annotation, then returns to Command Center.

## Open Questions

- Should Command Center say "Now Showing" or "Now Annotating" when OmniNote is active?
- Should one resource support both `nowShowingResourceId` and `nowAnnotatingResourceId`?
- Should OmniNote receive PDFs only at first?
- Should slide decks be exported to PDF before OmniNote use?
- Should handoff use Share Sheet, Files/iCloud, AirDrop, or custom URL scheme first?

## Non-Goals

- No embedded PDF viewer in Command Center for this bridge.
- No YouTube embed work in this bridge.
- No Google Drive API.
- No Canvas API.
- No backend sync.
- No realtime ink streaming.
