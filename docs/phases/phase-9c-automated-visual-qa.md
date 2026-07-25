# Phase 9C — Automated Visual QA + Classroom Workflow Smoke Test

Status: ready

## Goal

Use testing software to verify the Classroom Command Center student display and teacher workflow after Phases 8C, 9A, and 9B.

This phase should rely on automated Playwright screenshot capture and automated assertions, not manual-only visual review.

## In Scope

- Playwright visual QA screenshot capture
- `/display` viewport coverage:
  - 1920x1080
  - 1366x768
  - 1024x768
- `/control` workflow smoke tests
- Morning Message display smoke test
- Today Prep / Material Launcher privacy checks
- teacher-only UI absence checks on `/display`
- screenshot artifact output under a gitignored/local QA folder if appropriate
- docs/status update
- validation scripts

## Out of Scope

- app redesign
- new features
- screenshot image-diff thresholds unless already easy and stable
- external services
- API calls
- cloud sync
- auth
- new npm dependencies unless Playwright is already present
- visual changes beyond tiny testability fixes

## Success Criteria

- automated tests capture screenshots for key `/display` states
- screenshots are saved to a predictable local QA directory
- no horizontal overflow at target viewport sizes
- `/display` does not show Teacher Dock
- `/display` does not show Studio toolbar/inspector
- `/display` does not show teacher notes or material launcher controls
- Morning Message renders on `/display`
- fullscreen control exists on `/display`
- `/control` smoke flow verifies Morning Message Studio and display launch controls
- existing tests still pass
- build passes
- lint passes
