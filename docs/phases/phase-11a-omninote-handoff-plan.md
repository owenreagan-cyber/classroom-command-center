# Phase 11A — Command Center ↔ OmniNote Handoff Plan

Status: ready

## Goal

Design the first safe bridge between Classroom Command Center and OmniNote so the teacher can use Command Center as the classroom hub and OmniNote as the Apple Pencil annotation/presentation surface.

This phase is documentation/planning first. It should not implement cross-app behavior yet.

## Core Idea

Classroom Command Center remains the teacher workflow and student display hub.

OmniNote remains the native iPad annotation app for Apple Pencil, PDFs, worksheets, slide exports, blank teaching canvases, and clean external display output.

The first integration should be a handoff workflow:

- Teacher selects or launches a resource in Command Center.
- Teacher marks it as Now Showing / Now Annotating.
- Teacher opens or prepares that same resource in OmniNote on iPad.
- Student display shows only safe labels, not URLs, notes, or teacher controls.

## In Scope

- Define Command Center responsibilities.
- Define OmniNote responsibilities.
- Define handoff options.
- Define privacy boundaries.
- Define student display behavior.
- Define local-first constraints.
- Define likely future phases.
- Document which implementation belongs in which repo.
- Identify safest first implementation path.

## Out of Scope

- Building the actual handoff.
- Deep-link implementation.
- iCloud sync.
- Google Drive API.
- Canvas API.
- YouTube/PDF embedded viewer.
- Live whiteboard sync.
- Cross-device realtime networking.
- New dependencies.

## Success Criteria

- Clear architecture doc exists.
- Clear implementation sequence exists.
- Command Center and OmniNote boundaries are documented.
- Student privacy model is preserved.
- Next implementation phase is clearly recommended.
