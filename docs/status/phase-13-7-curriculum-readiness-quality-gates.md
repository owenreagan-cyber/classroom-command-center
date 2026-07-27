# Phase 13.7 — Curriculum Readiness + Quality Gates

**Branch:** `phase-13-7-curriculum-readiness-quality-gates`  
**Status:** Complete — metadata scoring only; does not build OmniNote

## Goal

Verify lessons are complete before classroom use. Every lesson package answers: **"Is this lesson ready to teach?"**

## Readiness Model

Module: `src/features/curriculum-readiness/`

`LessonReadiness` fields:

| Field | Purpose |
|-------|---------|
| `lessonId` | Package identifier |
| `score` | 0–100 quality score |
| `status` | `ready` \| `warning` \| `incomplete` |
| `requiredResources` | Required resource labels |
| `availableResources` | Detected readiness slots |
| `missingResources` | Missing required items |
| `missingRecommended` | Missing recommended items |
| `omninoteReady` | Can hand off to OmniNote (presentation/pdf/worksheet) |
| `displayReady` | Has student-safe display resource |
| `teacherReady` | Has teacher notes or teacher key |
| `teacherOverride` | Teacher marked ready despite gaps |

Compact summary attached to packages as `readiness?: { status, score, omninoteReady, displayReady, teacherReady }`.

## Readiness Scoring

| Condition | Status | Score |
|-----------|--------|-------|
| All required + recommended present | `ready` | 100 |
| Required present, recommended missing | `warning` | 70–85 |
| Any required missing | `incomplete` | 0–50 |
| Teacher override active | `ready` | 100 |

## Resource Rules (by subject)

### Math
- **Required:** Presentation, Student Resource
- **Recommended:** Teacher Notes, Practice

### Shurley
- **Required:** Presentation, Student Resource
- **Recommended:** Teacher Script, Teacher Key

### Reading
- **Required:** Presentation OR Lesson Resource, Student Resource
- **Recommended:** Teacher Notes

### History / Science
- **Required:** Presentation OR PDF, Student Resource
- **Recommended:** Teacher Notes

## Warning States

- **READY ✓** — all gates passed
- **WARNING ⚠** — teachable but missing recommended materials (e.g. Teacher Notes)
- **INCOMPLETE** — missing required resources (e.g. Presentation)

Warnings do **not** block Open Lesson, Open Materials, or Open OmniNote.

## Teacher Override

Teachers can click **Mark ready anyway** in Today Prep when a lesson has warnings or incomplete status. Override is persisted in `classroom-curriculum-readiness-v1` and applies per lesson id. Actions remain available regardless of status.

## Integrations

### Lesson packages
- `LessonPackage.readiness` (curriculum module)
- `LibraryLessonPackage.readiness` (fetcher / pack importer)

### Today Prep
- Resource checklist with ✓ / ○ / ✗
- Status badge (READY / WARNING / INCOMPLETE)
- Missing + recommended lists
- Override button

### Teacher Dock
- Lesson context panel under workspace selector
- Shows lesson title + READY ✓ or ⚠ Resources Missing

### Display privacy
Readiness keys added to `DISPLAY_FORBIDDEN_KEYS`:
`readiness`, `lessonReadiness`, `missingResources`, `missingRecommended`, `curriculumReadiness`, `teacherOverride`

Never exposed on `/display`.

## Tests

```bash
npm run test:curriculum-readiness
npm run test:curriculum   # includes readiness
```

Coverage:
- Complete lesson scores 100
- Missing teacher notes → warning
- Missing presentation → incomplete
- OmniNote / display / teacher readiness detection
- Saxon Lesson 2 + Shurley Lesson 3 integration
- Display route blocks readiness metadata

## Validation

```bash
npm run build
npm run lint
npm run test:curriculum
npm run test:curriculum-fetcher
npm run test:teacher-workstation
npm run test:e2e
```

## OmniNote Impact

This phase **does not build OmniNote**. It adds `omninoteReady` as one readiness signal (existing classifier logic). OmniNote handoff behavior is unchanged; readiness only surfaces whether a primary resource exists.

## Remaining Limitations

- Spelling uses generic fallback rules until a dedicated curriculum pack exists
- History/science pilot packages not in fetcher index — rules apply when packages are added
- Override is binary per lesson; no per-resource override
- Readiness re-scored on package load; live Drive sync may lag until re-index
