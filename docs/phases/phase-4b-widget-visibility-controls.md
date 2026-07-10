# Phase 4B — Widget Visibility Toggles / Basic Inline Editing

Status: ready  
App: Classroom Command Center  
Branch: command-center-widget-visibility-controls

## Goal

Add a small teacher-facing control foundation for showing and hiding classroom cards/widgets per screen.

This builds on:
- Phase 3A visibility model
- Phase 4A subject expansion foundation

The goal is not a full dashboard or Teacher Material Launcher. The goal is a lightweight local-first way to control what appears on the student board.

## Definition of Done

PASS when:
- widget/card visibility state exists
- teacher can hide/show selected cards in edit mode
- display mode does not render hidden cards
- existing screens still work
- new Phase 4A subject screens still work
- build passes
- lint passes
- no new dependencies are added

## In Scope

Possible lightweight implementation:
- define screen card IDs
- add card visibility state to board store
- add helper such as `isCardVisible(screenId, cardId)`
- add small edit-mode toggle controls
- hide cards in display mode when visibility is off
- preserve teacher-only/private visibility behavior
- optionally add basic inline editing for subject focus task only if simple

## Out of Scope

Do not add:
- backend/cloud/API
- Google Drive
- Canvas API
- PDF viewer
- YouTube page
- Spotify widget
- annotation tools
- Today Prep
- Teacher Material Launcher
- full editable curriculum editor
- drag-and-drop layout editing
- new npm dependencies

## Notes

This phase should remain lightweight.

The priority is safe display behavior:
hidden or teacher-only content must not appear on the student board.
