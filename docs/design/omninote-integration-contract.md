# OmniNote Integration Contract

Status: readiness spec (Phase 13.5)  
Purpose: define what Command Center sends to OmniNote without building OmniNote itself.

## Overview

```
Command Center (teacher Mac)
        │
        ▼
   LessonPackage
        │
        ▼
   OmniNote (iPad — omninote-controller role)
        │
        ▼
   Apple Pencil + optional student display
```

Command Center owns classroom flow. OmniNote owns annotation and clean presentation on iPad. Student display receives only sanitized, student-safe output routed through `resolveDisplayTarget()`.

## LessonPackage

Command Center sends a **LessonPackage** when handing off to OmniNote:

| Field | Type | Description |
|-------|------|-------------|
| `title` | `string` | Lesson or resource title shown to teacher and display label |
| `subject` | `string` | Subject id (e.g. `math`, `reading`) |
| `grade` | `string` | Grade level label |
| `resources` | `LessonResource[]` | Attachments OmniNote can open |
| `annotationMode` | `'annotate' \| 'present' \| 'read-only'` | How OmniNote should open the surface |
| `displayMode` | `'student-safe' \| 'teacher-only' \| 'none'` | Whether output may route to student display |

### Example — Math block

```json
{
  "title": "Fractions on the Number Line",
  "subject": "math",
  "grade": "4",
  "resources": [
    { "kind": "pdf", "title": "Worksheet", "localPath": "/packets/fractions-ws.pdf" },
    { "kind": "slides", "title": "Lesson slides", "localPath": "/packets/fractions-slides.pdf" }
  ],
  "annotationMode": "annotate",
  "displayMode": "student-safe"
}
```

**Flow:**

1. Teacher in **Math Mode** taps **Open OmniNote**
2. `resolveToolLaunch('omninote')` → control: iPad (`omninote-controller`), display: `student-display`
3. Command Center sends `LessonPackage` to OmniNote bridge (handoff layer)
4. OmniNote opens resource; teacher annotates with Apple Pencil
5. Student display shows approved visual only — never teacher controls

## Resource kinds

OmniNote should accept these resource entries inside `LessonPackage.resources`:

| Kind | Use |
|------|-----|
| `pdf` | Worksheets, exported decks, handouts |
| `slides` | Slide content (typically PDF export) |
| `worksheet` | Structured worksheet packet |
| `image` | Single image reference |
| `blank-canvas` | Empty teaching surface |

Each resource should include at minimum: `id`, `kind`, `title`, and one of `localPath`, `url`, or embed reference compatible with existing Command Center packet storage.

## Device and workspace requirements

| Requirement | Contract |
|-------------|----------|
| Control device | `omninote-controller` (iPad) |
| Display target | `student-display` when `displayMode === 'student-safe'` |
| Supported workspaces | `math`, `reading` |
| iPad offline | Launch blocked; message: *"OmniNote controller unavailable"* |

## Privacy boundaries

LessonPackage sent to OmniNote may include teacher-only metadata. Payloads routed to **student display** must pass `sanitizeForDisplayRoute()` and must not include:

- `teacherDock`, `toolRegistry`, `deviceRegistry`
- `teacherSettings`, roster raw data, private ids

OmniNote display output should follow the same student-safe rules as Command Center `/display`.

## Phase 13.5 — Curriculum Library handoff

When a lesson is resolved from pacing + Google Drive import, Command Center builds an **OmniNoteLessonHandoff** payload:

| Field | Source |
|-------|--------|
| `title` | `LibraryLessonPackage.title` |
| `subject` | `LibraryLessonPackage.subject` |
| `grade` | `LibraryLessonPackage.grade` (optional) |
| `resources` | Student-safe resources only (excludes teacher-notes, answer-key) |
| `annotationMode` | `LibraryLessonPackage.annotationMode` |
| `displayMode` | `LibraryLessonPackage.displayMode` |
| `primaryResource` | First presentation, pdf, or worksheet |

**Today Prep flow:**

1. Teacher on Math screen sees `Math` → `Saxon Math Lesson 2` → `Ready`
2. Taps **Open OmniNote**
3. `buildOmniNoteHandoffPayload()` → `toBridgeLessonPackage()` → `executeHandoff()`
4. OmniNote receives title, subject, primary resource, annotation + display modes

**Bridge adapter:** `src/features/curriculum-library/omninoteHandoff.ts` maps library types to bridge kinds (`presentation` → `slide-deck`, etc.).

## Not in scope (this phase)

- OmniNote application binary
- Bluetooth or AirPlay device pairing
- Cloud sync or authentication
- Automatic hardware discovery

## Related code

| Module | Path |
|--------|------|
| Launch resolver | `src/features/device-manager/launchResolver.ts` |
| Display routing | `src/features/device-manager/displayTargetService.ts` |
| Tool capabilities | `src/features/teacher-dock/toolCapabilities.ts` |
| Workspace promotion | `src/features/workspace/workspaceRegistry.ts` |
| Curriculum library import | `src/features/curriculum-library/` |
| OmniNote handoff adapter | `src/features/curriculum-library/omninoteHandoff.ts` |
| Lesson package standard | `docs/design/lesson-package-standard.md` |
