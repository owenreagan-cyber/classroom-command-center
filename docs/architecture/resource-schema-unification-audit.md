# Resource Schema Unification Audit

**Phase:** 16B.2 — Audit & Recommendation
**Date:** 2026-08-11
**Branch:** `phase-16b-2-resource-schema-unification-audit`
**Status:** Complete (docs-only, no implementation)

---

## 1. Current State Summary

### 1.1 What resource model(s) exist now

The codebase has **seven distinct resource-like models** spread across multiple features (five previously identified, plus two live types confirmed by direct import-site verification — see corrected count below):

| # | Model | File | Purpose |
|---|---|---|---|
| A | `TeacherMaterialLink` | `src/data/types.ts:364` | Manual resource links in Today Prep / Resource Drawer |
| B | `TeacherResourceLink` | `src/data/types.ts:347` | Older resource link type (Phase 3A, not actively rendered) |
| C | `LessonResource` (curriculum) | `src/features/curriculum/types.ts:33` | Curriculum pacing — lesson-level resources |
| D | `LessonResource` (library fetcher) | `src/features/curriculum-library-fetcher/types.ts:15` | Drive-scanned curriculum packages |
| E | `OmniNoteExportResource` | `src/features/omninote-handoff/types.ts:19` | OmniNote handoff payload |
| F | `LessonResource` (omninote-bridge) | `src/features/omninote-bridge/types.ts:15` | OmniNote handoff bridge resources — **third distinct type named `LessonResource`**, different shape again |
| G | `PackResource` | `src/features/curriculum-pack-importer/types.ts:27` | Teacher Resource Pack import (scanned pack folders) |

F and G were missing from the original pass of this audit despite being live, actively-imported types — not a hypothetical gap. See §2 for call sites and full shapes.

### 1.2 Where resources are stored

- **TeacherMaterialLink**: stored in Zustand `boardStore.todayPrep.resourceLinks[]`, persisted to localStorage under the board persistence key
- **LessonResource (curriculum)**: derived from pacing engine + fixture data in `src/features/curriculum/lessonPackage.ts`
- **Library LessonResource**: stored in `libraryIndexStore` (Zustand), persisted to `classroom-curriculum-library-fetcher-v1` localStorage key
- **OmniNoteExportResource**: ephemeral — built at handoff time, never persisted in Command Center state

### 1.3 How ResourcesPopover currently scopes them

The ResourcesPopover (`src/app/ResourcesPopover.tsx`) filters by `screenId`:

```ts
const screenResources = useMemo(
  () => resourceLinks.filter((link) => link.screenId === activeScreen),
  [resourceLinks, activeScreen],
)
```

It accesses `boardStore.todayPrep.resourceLinks` (model A) and renders `TeacherMaterialLink` cards with:
- Display label (`link.label`)
- Optional note (`link.note`)
- Preset badge (`link.preset` → resolved via `getResourcePresetMeta`)
- Visibility badge (`link.visibility` via `VISIBILITY_LABEL`)

### 1.4 What fields exist today

**TeacherMaterialLink** (the active, in-use model):

```ts
interface TeacherMaterialLink extends WithVisibility {
  id: string
  label: string
  url: string
  preset?: ResourceOpenPreset          // Open With preset
  note?: string
  screenId?: ScreenId
  pageId?: VibePageId
}
// WithVisibility adds: visibility?: 'student' | 'teacherOnly' | 'hidden'
```

**ResourceOpenPreset** enum:

```ts
'google-slides' | 'google-docs' | 'google-drive' | 'youtube' | 'pdf' | 'website' | 'other'
```

### 1.5 What UI labels currently imply about future resources

- **ResourcesPopover setup stub** (Phase 16B.1): Slides, PDF / Worksheet, Video, Teacher Notes, OmniNote Package
- **ResourceOpenPresets** (Phase 10A): Google Slides, Google Docs, Google Drive, YouTube, PDF / File Link, Website, Other
- **Curriculum resource kinds**: slides, pdf, worksheet, teacher-notes, answer-key, image
- **Library fetcher types**: presentation, pdf, teacher-notes, worksheet, assessment, image, video
- **OmniNote export kinds**: presentation, slideDeck, pdf, worksheet, studentResource, image, blankCanvas, teacherNotes, teacherKey, answerKey
- **Teaching Block spec** (Phase 16A.0): presentation, pdf, video, omninote-package, worksheet, teacher-notes, web-link, local-file, google-drive-file

**Key observation:** Five different type enums/lists, each with slightly different names for overlapping concepts. "Slides" in the setup stub maps to "google-slides" in the preset enum, "presentation" in the curriculum fetcher, and "slideDeck" / "presentation" in OmniNote.

### 1.6 This problem recurred in real time during this same audit window

This is not only a historical pattern to fix — it happened again, live, while this document was being written. An independent, uncommitted implementation of the same ResourcesPopover "resource type setup stub" feature was built in parallel on the same working directory, using its own type vocabulary:

```ts
// Abandoned — never committed, never merged. Found only in a git stash
// (stash@{0}) tied to a since-deleted local branch.
type ResourceTypeStub = 'slides' | 'pdf-worksheet' | 'video' | 'teacher-notes' | 'omninote'
```

This is a *different* set of keys from what actually shipped and is live today in `src/app/ResourcesPopover.tsx` (PR #52, merged):

```ts
const RESOURCE_TYPES = [
  { key: 'slides', ... }, { key: 'pdf', ... }, { key: 'video', ... },
  { key: 'notes', ... }, { key: 'omni', ... },
] as const
```

Worth noting the irony directly: the abandoned stash's naming (`pdf-worksheet`, `teacher-notes`, `omninote`) is *closer* to this very document's own original §5.1 proposal (`pdf-worksheet`, `teacher-notes`, `omninote-package`) than the code that actually shipped is. Two independent efforts converged on similar-but-not-identical descriptive naming; the live implementation went a third, terser direction.

**This is not a type to migrate.** The stashed `ResourceTypeStub` never merged, represents no live code, and has no call sites — it should not appear anywhere in the migration plan (§4, §9) as something to reconcile. It's included here only as current, dated evidence (this audit's own working window) that the duplication problem this document exists to fix is an active, ongoing risk — not just something that accumulated in the past and needs a one-time cleanup. Any process fix that comes out of this unification effort should account for *why* two independent implementations of the same small feature happened within hours of each other, not only fix the types that already exist.

---

## 2. Resource-Like Concepts Inventory

| Concept | File/Location | Shape | Purpose | Risk/Overlap |
|---|---|---|---|---|
| `TeacherMaterialLink` | `src/data/types.ts:364` | id, label, url, preset, note, screenId, pageId, visibility (enum: student/teacherOnly/hidden) | Manual resource links rendered in ResourcesPopover and Today Prep panel | **Primary active model.** Has URL-only source (no local file, no Drive ID, no OmniNote ref). screenId scoping. |
| `TeacherResourceLink` | `src/data/types.ts:347` | id, label, url, visibility (inherited) | Older link type from Phase 3A | **Dead code.** Not rendered or used. Overlaps with TeacherMaterialLink. |
| `LibraryResource` | `src/features/curriculum-library/types.ts:21` | id, type (LibraryResourceType: presentation/pdf/teacher-notes/worksheet/answer-key/image/video/audio/template/blank-canvas), file, title?, driveFileId?, mimeType? | Curriculum library import (non-fetcher module) | **Dead code**, confirmed by import-site check: `useLibraryStore` and this type are never imported outside `src/features/curriculum-library/` itself — zero external call sites found anywhere in `src/`. A second, entirely separate dead module beyond `TeacherResourceLink`, missed in the original pass of this audit. Superseded by `curriculum-library-fetcher`, which is the live sibling module. |
| `ResourceOpenPreset` | `src/data/types.ts:354` | enum: google-slides, google-docs, google-drive, youtube, pdf, website, other | Open With preset for Material Launcher links | Narrow scope — only describes how to open a URL, not what the resource *is*. Maps to setup stub types inconsistently. |
| `LessonResource` (curriculum) | `src/features/curriculum/types.ts:33` | id, title, kind (slides/pdf/worksheet/teacher-notes/answer-key/image), source | Curriculum pacing engine resources | Scoped to curriculum layer. No visibility field. No URL. `kind` enum differs from all other type enums. |
| `LessonResource` (fetcher) | `src/features/curriculum-library-fetcher/types.ts:15` | id, filename, type (presentation/pdf/teacher-notes/worksheet/assessment/image/video), path | Drive-scanned curriculum files | Different `type` enum from curriculum LessonResource. Drive-path-based, no URL. |
| `LessonResource` (omninote-bridge) | `src/features/omninote-bridge/types.ts:15` | id, title, kind (pdf/worksheet/slide-deck/blank-canvas/google-slides/google-docs), source?, webUrl? | OmniNote handoff bridge — lesson package resources for the deep-link/bridge path | **Same type name as `LessonResource` (curriculum) with a completely different shape** — this is the exact "same name, different type" duplication pattern this document exists to fix. Live, actively imported by `src/board/TeacherDashboardPanel.tsx`, `src/board/TodayPrepPanel.tsx`, `src/features/teacher-dock/toolPanels/OmniNoteToolPanel.tsx`, and `src/features/curriculum-library-fetcher/libraryIndexStore.ts` — not dead code. |
| `PackResource` | `src/features/curriculum-pack-importer/types.ts:27` | id, filename, type (PackResourceType: presentation/teacher-notes/student-resource/teacher-key/assessment), path, section | Teacher Resource Pack import (scanned pack folder structure) | Fourth distinct `type`/`kind` enum for the same underlying "what is this resource" concept. Live, imported by `src/board/TodayPrepPanel.tsx` and `src/features/curriculum-library-fetcher/libraryIndexStore.ts` — not dead code. |
| `LessonPackage` (curriculum) | `src/features/curriculum/types.ts:87` | id, title, subject, curriculum, lessonNumber, resources[], annotationMode, displayMode, readiness | Unit of curriculum organization | Resources array uses curriculum `LessonResource`. `displayMode` is its own visibility concept. |
| `LibraryLessonPackage` (fetcher) | `src/features/curriculum-library-fetcher/types.ts:24` | id, title, subject, curriculum, lessonNumber, workspace, resources[], omninoteReady, readiness, drivePath | Fetcher-scanned lesson package | Uses fetcher `LessonResource`. Has separate `omninoteReady` boolean. |
| `OmniNoteExportResource` | `src/features/omninote-handoff/types.ts:19` | id, title, type (OmniNoteExportResourceKind), file, studentVisible (bool), teacherOnly (bool) | OmniNote handoff payload | Uses **two booleans** for visibility — can represent contradictory `studentVisible: true, teacherOnly: true`. Different type enum (presentation, slideDeck, studentResource, teacherNotes, teacherKey, answerKey). |
| `OmniNoteExportLessonPackage` | `src/features/omninote-handoff/types.ts:29` | id, title, subject, curriculum, grade, track, week, lessonNumber, workspace, annotationMode, displayMode, resources[] | OmniNote handoff envelope | `displayMode` is yet another visibility concept. |
| Classroom Screen "materials" | `src/data/types.ts:230` | materialsTitle, materials (haveOut, putAway string arrays) | What students should have on desks | NOT a resource link. Visual classroom management content, not a file/source reference. |
| Prep checklist items | `src/data/types.ts:375` | id, text, completed, screenId, pageId | Teacher to-do checklist | Separate concept. Not a resource, but co-located in `TodayPrepState` with resourceLinks. |
| Teacher Notes (prep hints) | `src/data/defaults.ts:376` | id, screenId, visibility: 'teacherOnly', text | Default prep reminders | Not a resource link. Static default teacher hints. Uses same `WithVisibility` as TeacherMaterialLink. |

---

## 3. Visibility Inventory

### 3.1 Current visibility models

| Location | Model | Values | Risk |
|---|---|---|---|
| `src/data/types.ts:6` — `Visibility` type | Single enum | `'student'` \| `'teacherOnly'` \| `'hidden'` | Three values. "student" is ambiguous (student-visible on screen vs student-safe for /display). Used by `WithVisibility` interface. |
| `TeacherMaterialLink.visibility` | Inherits `WithVisibility` | `'student'` \| `'teacherOnly'` \| `'hidden'` | Defaults to `'teacherOnly'` in boardStore normalization (line 271). "hidden" is referenced in VISIBILITY_LABEL but unclear when it applies to resource links. |
| `docs/architecture/teaching-block-resource-rundown-model.md` §4.2 | Spec | `'teacher-only'` \| `'student-safe'` | Two values only. Explicitly says "Do not use separate teacherOnly and studentSafe booleans." Uses kebab-case (different from code's camelCase). |
| `OmniNoteExportResource` | Two booleans | `studentVisible: boolean`, `teacherOnly: boolean` | **High risk.** Contradictory states possible (both true, both false). `validateExportPrivacy` catches some. |
| `OmniNoteExportDisplayMode` | Enum | `'student-safe'` \| `'teacher-only'` \| `'none'` | Package-level display mode. Different from per-resource visibility. |
| `LessonDisplayMode` (curriculum) | Enum | `'student-safe'` \| `'teacher-only'` \| `'none'` | Same values as OmniNoteExportDisplayMode. |
| `src/features/curriculum-readiness/privacy.ts` | Field filter | Filters `teacherOnly` and `teacher-notes` kind from exports | Runtime enforcement. Multiple places check `r.teacherOnly` (boolean) to decide filtering. |

### 3.2 Visibility assessment

| Concern | Severity | Details |
|---|---|---|
| Multiple naming conventions | **WARN** | CamelCase in code (`teacherOnly`), kebab-case in spec (`teacher-only`), boolean field name in OmniNote (`teacherOnly` as boolean, not visibility enum) |
| Three-value enum vs two-value spec | **WARN** | Code has `'hidden'` as third visibility value; Teaching Block spec says only two. Unclear when `'hidden'` applies to resources (vs card visibility). |
| OmniNote double-boolean | **FAIL** | `studentVisible: boolean` + `teacherOnly: boolean` allows 4 states, including contradictory ones. This is the export format from an external contract and may be beyond our control, but the import/mapping layer must reconcile it to a single enum. |
| No unified visibility story | **WARN** | Three different visibility systems: `WithVisibility` enum (for links/notes), OmniNote booleans (for handoff), and `displayMode` enums (for curriculum packages). They serve different purposes but no document explains the relationship. |

---

## 4. Proposed Unified ResourceLink Direction

### 4.1 Recommended schema

```ts
type ResourceLinkType =
  | 'slides'
  | 'pdf-worksheet'
  | 'video'
  | 'teacher-notes'
  | 'omninote-package'
  | 'other'

type ResourceSourceKind =
  | 'placeholder'       // no real source yet (setup stub)
  | 'url'               // external URL (Google Slides, YouTube, etc.)
  | 'curriculum'        // linked from curriculum library package
  | 'omninote-package'  // OmniNote handoff target
  // Future (not now):
  // | 'local-file'
  // | 'google-drive'

type ResourceVisibility = 'teacher-only' | 'student-safe'

interface ResourceLink {
  id: string
  screenId: ScreenId           // transitional scope (→ blockId later)
  label: string
  type: ResourceLinkType
  sourceKind: ResourceSourceKind
  visibility: ResourceVisibility
  note?: string
  /** URL when sourceKind is 'url'; curriculum resource id when 'curriculum'; etc. */
  target?: string
  /** Curriculum lesson this resource is associated with (optional). */
  lessonId?: string
  createdAt?: string
  updatedAt?: string
}
```

### 4.2 How this unifies existing models

| Existing model | Unification strategy |
|---|---|
| `TeacherMaterialLink` | Fields map directly: `label`, `url`→`target`, `note`, `screenId`. `preset` is replaced by `type` + `sourceKind`. `visibility` drops `'hidden'` value. |
| `TeacherResourceLink` | Removed — dead code superseded by this schema. |
| `ResourceOpenPreset` | Replaced by `type` enum (what is it?) + `sourceKind` enum (where does it come from?). The old preset confused "how to open" with "what is it." |
| Curriculum `LessonResource` | A curriculum LessonResource is not a ResourceLink yet. When linked to a screen, a ResourceLink is created with `sourceKind: 'curriculum'`, `target: lessonResource.id`. |
| `OmniNoteExportResource` | Mapping layer at handoff time: ResourceLink → OmniNoteExportResource with `studentVisible`, `teacherOnly` derived from single `visibility` field. |

### 4.3 Type vs sourceKind separation

**`type`** answers "What kind of teaching resource is this?" (teacher mental model):
- slides, pdf-worksheet, video, teacher-notes, omninote-package, other

**`sourceKind`** answers "Where does it actually live?" (technical routing):
- placeholder (setup stub, not yet real)
- url (external link — current behavior)
- curriculum (linked from curriculum library)
- omninote-package (linked from OmniNote handoff)

This replaces the old `ResourceOpenPreset` which conflated type (pdf, youtube) with source (google-slides, google-docs, google-drive).

---

## 5. Naming Recommendation

### 5.1 User-facing labels

| Concept | Recommended label | Why |
|---|---|---|
| A single resource linked to a block | **"Resource"** | Familiar, matches button label already in use. Shorter than "teaching material." |
| The drawer/popover | **"Resources drawer"** | Already named this in ResourcesPopover. |
| Adding a resource | **"Link resource"** or **"Add resource"** | "Link" emphasizes the connection, not a copy. "Plan resource link" from setup stub. |
| Resource type choices | Use existing labels: **Slides**, **PDF / Worksheet**, **Video**, **Teacher Notes**, **OmniNote Package** | Display labels already established in 16B.1 setup stub and unchanged here. **Correction:** the underlying `type` enum values proposed in §4.1 (`'pdf-worksheet'`, `'teacher-notes'`, `'omninote-package'`) do **not** match the live setup stub's actual keys — `RESOURCE_TYPES` in `src/app/ResourcesPopover.tsx` currently uses `'pdf'`, `'notes'`, `'omni'` (PR #52, merged). This is not "minor normalization" of something already aligned; adopting the more descriptive `§4.1` values means renaming the live stub's keys as part of migration, not just formalizing what's already there. The more descriptive naming is still recommended for the reasons in §5.2 (clearer, self-documenting identifiers), but the claim that it already matches live code was false and is corrected here. |
| Visibility toggle | **"Student-safe"** / **"Teacher only"** | Teaching Block spec terminology. Clear intent. |

### 5.2 Code labels

| Concept | Recommended code identifier |
|---|---|
| Resource link type | `ResourceLinkType` |
| Source kind (where it lives) | `ResourceSourceKind` |
| Visibility | `ResourceVisibility` (two values: `'teacher-only'`, `'student-safe'` — kebab-case for code consistency with docs) |
| Resource link interface | `ResourceLink` |
| Resource links collection | `resourceLinks` (already used in `TodayPrepState`) |

### 5.3 What to avoid

- **"Material"** — already used for "materials" (desk items, classroom visuals). Avoid confusion.
- **"Link"** alone — ambiguous whether it's a URL hyperlink or a resource association.
- **Separate `teacherOnly` / `studentSafe` booleans** — Teaching Block spec §4.2 explicitly says "Do not use separate…booleans."

---

## 6. Action Recommendation

### 6.1 Actions by type (now, next, future)

| Resource Type | Now (current) | Next (16B.3+) | Future |
|---|---|---|---|
| Slides | — | Present / Open link in new tab | Open in embedded viewer, Send to /display |
| PDF / Worksheet | — | Open link in new tab | Print, Send to OmniNote, Preview inline |
| Video | — | Open link in new tab | Embedded preview, Queue for class |
| Teacher Notes | Edit in Studio (existing) | Open private note panel | Inline editable teacher notes |
| OmniNote Package | — | Send to iPad (OmniNote handoff) | Open directly on paired iPad |
| Other | — | Open link in new tab | Type-specific actions |

**Now:** Edit in Studio routes to dashboard (existing behavior for resources with data).
**Next:** "Done for now" (setup stub) + Open-in-tab for URL-backed resources.
**Future:** iPad handoff, embedded preview, student-safe projection to /display.

### 6.2 Action labels

| Action | Label | When |
|---|---|---|
| Close drawer with no changes | "Done for now" | Now (16B.1) |
| Route to edit surface | "Edit in Studio" | Now (existing, unchanged) |
| Open resource in new tab | "Open" | Next (16B.3) |
| Link resource from curriculum | "Link from curriculum" | Future |
| Send to OmniNote iPad | "Send to iPad" | Future |
| Show on student display | "Show to class" | Future (student-safe only) |

---

## 7. Relationship to Teaching Block

### 7.1 Current limitation

Resources are scoped by `screenId`:

```ts
resourceLinks.filter((link) => link.screenId === activeScreen)
```

`screenId` is a `ScreenId` from the legacy board model (homeroom, math, reading, etc.). The Teaching Block model (Phase 16A.0) proposes scoping by `blockId` instead, with a fallback chain through `lessonId` → `subjectId` → recent resources.

### 7.2 Transitional acceptability

`screenId` is acceptable as transitional scope because:
- Each Teaching Block maps to one screen (`screenId` ≈ `blockId` for single-screen blocks).
- Multi-screen blocks (slide sequences) are future scope.
- Changing to `blockId` now would require building the full Teaching Block model first (out of scope).

### 7.3 Future direction

When Teaching Blocks are implemented:
1. Add `blockId` to `ResourceLink` as the canonical scope.
2. ResourcesPopover resolves resources: blockId match → lessonId match → subject defaults → recent.
3. `screenId` becomes a display-only hint, not the primary scope key.

---

## 8. Risks / Anti-Goals

| Risk | Mitigation |
|---|---|
| **Turning Resources into a global file browser** | Resources are always scoped to the active block/screen. No global resource browser. No file tree. |
| **Querying Google Drive live during teaching** | All resource metadata is local-first. Drive is an import source, not a live dependency. |
| **Exposing teacher-only resources on /display** | Enforce visibility at the rendering boundary. `toDisplaySafe` must filter `visibility: 'teacher-only'`. |
| **Multiple conflicting visibility booleans** | Single `visibility` enum. No `teacherOnly` + `studentVisible` boolean pairs. Map OmniNote's dual-boolean format at the export boundary only. |
| **Building cloud/backend dependency** | All resource data is local (Zustand + localStorage). No server, no database, no login required. |
| **Routing teacher unexpectedly into old cockpit** | "Edit in Studio" is the honest label. Do not reintroduce "Open Dashboard" as a resource action. |
| **Adding the `hidden` visibility value to resources** | Remove `'hidden'` from the resource visibility enum. It applies to card visibility (ScreenCardVisibility), not resources. |

---

## 9. Recommended Next Implementation Phase

**Phase 16B.3 — Local ResourceLink schema cleanup / type alignment**

Scope:
1. Add `ResourceLinkType`, `ResourceSourceKind`, and `ResourceVisibility` types to `src/data/types.ts` (or a new `src/data/resourceTypes.ts`).
2. Update `TeacherMaterialLink` → alias or migrate to new `ResourceLink` interface (backward-compatible).
3. Remove dead `TeacherResourceLink` type (`src/data/types.ts:347`) and dead `LibraryResource`/`LibraryLessonPackage`/`useLibraryStore` module (`src/features/curriculum-library/`, confirmed zero external call sites in §2) — both confirmed dead, both removed in the same step.
4. Map `ResourceOpenPreset` to `ResourceLinkType` + `ResourceSourceKind` (keep preset as deprecated alias during transition).
5. Normalize visibility: drop `'hidden'` from resource visibility, keep it for card visibility only.
6. Add mapping documentation between:
   - `ResourceLink` ↔ `LessonResource` (curriculum)
   - `ResourceLink` ↔ `OmniNoteExportResource` (handoff boundary)
7. Zero runtime behavior change. Type-only and normalization-only.

Estimated: ~3 files changed (`src/data/types.ts`, `src/store/boardStore.ts`, new `src/data/resourceTypes.ts`).
