# Phase 9C.1 — Playwright Screenshot Baseline Snapshots

Status: ready

## Goal

Add Playwright screenshot baseline testing for approved classroom display screens.

Phase 9C captured screenshots as artifacts. Phase 9C.1 should add stable baseline snapshot tests so future visual regressions can be detected by testing software.

## In Scope

- Playwright screenshot baseline tests
- `/display` snapshot coverage for key viewport sizes
- Morning Message display snapshot coverage
- privacy assertions before snapshots
- documentation of how to update snapshots intentionally
- validation scripts
- no app feature work unless tiny testability fixes are required

## Out of Scope

- app redesign
- new classroom features
- external integrations
- backend/cloud/auth
- manual-only visual QA
- committing `.local` runtime screenshots

## Success Criteria

- snapshot test script exists
- baseline snapshots are generated in Playwright’s expected snapshot location
- tests fail on visual changes beyond approved threshold
- `/display` privacy checks run before snapshots
- existing Phase 9C artifact capture still works
- existing tests still pass
- build passes
- lint passes
