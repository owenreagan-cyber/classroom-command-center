# Phase 16B.2 — Resource Schema Unification Audit

**Date:** 2026-08-11
**Branch:** `phase-16b-2-resource-schema-unification-audit`
**Status:** Complete (docs-only, no implementation)

---

## Summary

Audited all resource-like concepts across the codebase. Identified five distinct resource models with overlapping type enums, three conflicting visibility systems, and dead code. Produced a unified schema recommendation in `docs/architecture/resource-schema-unification-audit.md`. Zero runtime behavior changes.

---

## Scope

- Search and inventory all resource-like concepts in `src/`, `docs/`, and `scripts/`
- Inspect type definitions, store schemas, UI components, and architecture docs
- Document current state, overlaps, risks
- Propose unified schema direction
- Recommend next implementation phase

Explicitly out of scope:
- No code changes
- No schema implementation
- No runtime behavior changes
- No `/display` changes
- No dependency changes
- No OmniNote, tldraw, or teacher-ai-workstation changes
- No stash modifications

---

## Files Changed

| File | Action |
|---|---|
| `docs/architecture/resource-schema-unification-audit.md` | Created |
| `docs/status/phase-16b-2-resource-schema-unification-audit.md` | Created |

---

## PASS/WARN/FAIL

### PASS

- **PASS** — Build succeeds (`npm run build`)
- **PASS** — All app route tests pass (`npm run test:app-route`)
- **PASS** — Display bundle guard pass (`npm run test:display-bundle-guard`)
- **PASS** — Display import guard pass (`npm run test:display-import-guard`)
- **PASS** — Docs-only diff (no source code changes)
- **PASS** — No runtime behavior changes
- **PASS** — No dependency changes
- **PASS** — No `/display` changes
- **PASS** — No OmniNote, tldraw, or teacher-ai-workstation changes
- **PASS** — Stashes preserved (stash@{0} untouched)
- **PASS** — No commit made

### WARN

- **WARN** — Five distinct resource type enums exist across the codebase with overlapping but inconsistent naming (`slides` vs `presentation` vs `slideDeck`, `teacher-notes` vs `teacherNotes`, etc.)
- **WARN** — Three visibility systems coexist: `WithVisibility` enum (3 values), OmniNote dual-boolean (`studentVisible` + `teacherOnly`), and `displayMode` enums
- **WARN** — `TeacherResourceLink` (types.ts:347) is dead code from Phase 3A, never rendered or used
- **WARN** — `ResourceOpenPreset` conflates type (pdf, youtube) with source (google-slides, google-drive); should be split into `type` + `sourceKind`

### FAIL

- **FAIL** — `OmniNoteExportResource` uses two booleans (`studentVisible`, `teacherOnly`) for visibility, allowing contradictory states (both true, both false). This is an external contract (OmniNote handoff format) and may be beyond our control, but the import/mapping layer must reconcile to a single enum.

---

## Key Findings

1. **Five resource models** overlap: `TeacherMaterialLink` (active), `TeacherResourceLink` (dead), curriculum `LessonResource`, fetcher `LessonResource`, `OmniNoteExportResource`.

2. **Visibility is fractured**: camelCase enum (code), kebab-case spec, dual-boolean (OmniNote), package-level `displayMode` enums. No document explains the relationship.

3. **`screenId` scoping** is transitional — the Teaching Block model wants `blockId`, but `screenId` is acceptable until Teaching Blocks are implemented.

4. **Recommended unified schema**: `ResourceLink` with `type` (slides, pdf-worksheet, video, teacher-notes, omninote-package, other), `sourceKind` (placeholder, url, curriculum, omninote-package), and `visibility` (teacher-only, student-safe).

---

## Recommended Next Phase

**Phase 16B.3 — Local ResourceLink schema cleanup / type alignment**

- Add unified `ResourceLinkType`, `ResourceSourceKind`, `ResourceVisibility` types
- Alias/migrate `TeacherMaterialLink` → `ResourceLink` (backward-compatible)
- Remove dead `TeacherResourceLink`
- Map `ResourceOpenPreset` → `type` + `sourceKind`
- Normalize visibility: drop `'hidden'` from resource visibility
- Document mapping between ResourceLink ↔ curriculum/fetcher/OmniNote models
- Zero runtime behavior change
