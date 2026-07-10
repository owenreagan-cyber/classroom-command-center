# Phase 4A — Subject Expansion Foundation

Status: ready  
App: Classroom Command Center  
Branch: command-center-subject-expansion

## Goal

Expand Command Center from the current core screens into a broader classroom subject/page foundation.

This phase should add subject structure and simple ready-to-use screens without adding integrations, storage complexity, or heavy UI systems.

## Definition of Done

PASS when:
- additional subject/page entries exist
- new screens are simple and projector-safe
- new screens preserve display/edit privacy behavior
- existing screens still work
- build passes
- lint passes
- no new dependencies are added

## In Scope

Add lightweight support for some or all of:

- Writing
- Science
- Social Studies
- Intervention
- Assessment
- Flexible Groups
- Centers / Rotations
- Homework / Pack-Up

Potential implementation:
- extend screen/page identifiers
- add defaults for new screens
- add simple placeholder-ready screen components
- reuse existing cards/widgets where possible
- keep layouts readable for projector use
- keep teacher-only hints private

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
- complex schedule automation
- new npm dependencies
- new storage system

## Notes

This is a subject/page foundation phase.

The goal is not perfect final content. The goal is to make the app feel expandable across the school day while preserving the clean Presenter View model.
