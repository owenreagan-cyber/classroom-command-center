# Canvas Engine Decision

**Phase:** 15L.1 — Canvas Engine Decision + Board/Scene/Widget Target Model
**Date:** 2026-08-08
**Status:** Documentation-only architecture decision package
**No application code changed.** No dependencies installed.

---

## Context

The current-state review (`docs/review/current-state-review.md`) found the application uses a hand-rolled React/DOM canvas across three parallel systems:

| System | Container | Widget Model |
|--------|-----------|-------------|
| Display Composer | `DisplayScreen` → `CanvasWidget[]` | `CanvasWidget` (x/y/w/h percentage, zIndex, visible, locked) |
| Classroom Screens | `ScreenId` → `BoardState` → `ScreenContents` | `PageWidget` (x/y/width/height pixel, zIndex, locked, visible) |
| Studio Canvas | `ClassWorkspace` → `VibePage` | `PageWidget[]` per page |

None of these provides selection, pan/zoom, resize handles, camera control, spatial indexing, undo/redo, or frame management. Widget renderers use separate manual switch statements in `WidgetCanvasCard.tsx` and `WidgetDisplayOverlay.tsx`. There is no shared display-safe projection protocol.

A dedicated canvas engine (rather than a grow-your-own DOM layout) would provide spatial primitives and unify the three parallel systems under one Board > Scene > Widget model.

---

## Options Evaluated

### Option A — Continue hand-rolled React/DOM canvas

**Summary:** Keep the existing CSS-positioned, percentage-based widget layout as-is. Build selection, pan/zoom, resize, and camera behavior from scratch with React state + pointer events.

**What we gain:**
- Zero new dependencies, zero licensing questions
- Full control over every pixel and behavior
- No watermark, no commercial restriction
- Existing tests continue to work unchanged
- No migration cost

**What we lose:**
- Must build selection rectangle, lasso, multi-select, resize handles, rotation, snap-to-grid, spatial index, camera/viewport, pan, zoom, minimap, and undo/redo by hand
- High ongoing maintenance burden for interaction edge cases (touch, stylus, Safari, concurrent pointer events, scroll prevention, focus traps, keyboard shortcuts)
- No existing ecosystem of shape primitives, connectors, or collaboration tools
- Widget overlap/collision issues (found in current-state review) remain our problem to solve
- Background images with baked-in text and hollow templates remain hard to detect and replace programmatically
- Display-safe projection stays ad-hoc per widget type

**Licensing/cost/privacy:** MIT (all code is ours). No external constraints.

**Fit for single-teacher local-first classroom use:** Excellent — no cloud sync, no external services.

**Fit for live classroom widgets:** Hand-rolled drag/resize/zoom is weak for authoring-time interactions (drag, resize, zoom, camera, stylus). It is not necessarily weak for existing live classroom widgets themselves, because many live interactions are regular React components: Mystery Star, Lotto, 100 Board, Prize Board, Jobs, timers, etc. These widgets respond to clicks and state changes — not to canvas-level gestures. The risk is long-term authoring/editor complexity, not current live-widget click behavior.

**Fit for iPad/Mac teaching workflow:** Weak — no gesture system, no native-feeling canvas interactions for authoring. Live-widget tap interactions (clicking a prize tile, picking a student) work fine as plain DOM events.

**Fit for /control and /display split:** Same as today — two separate rendering paths with no shared canvas instance.

**Migration complexity:** None (status quo).

**Test impact:** None — existing 1,028 assertions continue to pass.

**Risk level:** Low short-term, high long-term. Accumulates technical debt in the canvas interaction layer.

**Recommendation:** Only choose if both tldraw and Konva are ruled out for licensing reasons.

---

### Option B — tldraw

**Summary:** Adopt [tldraw](https://tldraw.dev) as the canvas engine. tldraw provides a complete React canvas with shape primitives, selection, pan/zoom, camera, resize, rotation, spatial indexing, undo/redo, and a plugin system (`ShapeUtil`) for custom widgets.

**What we gain:**
- Production-grade canvas interactions out of the box: selection (click, marquee, shift-click), resize handles, rotation, drag, pan (scroll wheel, two-finger, middle-click), zoom, camera/viewport, minimap, grid, snap
- Shape primitives: rectangles, frames, arrows, text, images, groups
- Custom `ShapeUtil` classes for classroom widgets — each widget type becomes a tldraw shape with its own rendering, geometry, and interaction behavior
- `Editor` API for programmatic camera control, zoom-to-fit, frame navigation, and spatial queries
- Frames map naturally to our Scene concept — one frame per scene, camera snaps to active frame
- Built-in undo/redo stack
- Spatial indexing (rtree) for efficient hit-testing and collision detection
- Active open-source community and regular releases
- Documented plugin architecture with React context for toolbars and menus
- TypeScript-first API
- Local-first by default — no cloud sync required
- License key validation is client-side and works offline

**What we lose:**
- **tldraw is NOT standard MIT open source.** The tldraw SDK is source-available under the [tldraw SDK License](https://github.com/tldraw/tldraw/blob/main/LICENSE.md). Commercial use requires a paid license. Hobby/non-commercial use may be free but requires application and approval, and includes a visible "Made with tldraw" watermark in the bottom-right corner.
- The watermark is always visible on the canvas — it cannot be hidden without a paid license
- tldraw sync (multiplayer/collaboration) is a separate paid service and should NOT be adopted by default
- Custom ShapeUtil widgets must be built for each classroom widget type (clock, timer, 100-board, etc.)
- The tldraw toolbar and menus must be suppressed or customized for classroom use — the default chrome is designed for a drawing/whiteboard tool, not a teacher dashboard
- Bundle size: tldraw is ~500KB gzipped (larger than Konva ~180KB or hand-rolled 0KB)
- tldraw's `store` model (shapes, bindings, assets) is its own data structure — all existing widget state must be migrated into tldraw records
- The /control and /display split needs careful design — tldraw renders one `Editor` instance, so the display view must be a read-only projection of the same document, not a separate renderer

**Licensing/cost/privacy implications:**

| Aspect | Detail |
|--------|--------|
| License type | Source-available, NOT open-source (not MIT/Apache/GPL) |
| Hobby/non-commercial | Free with application, visible watermark |
| Commercial use | Requires paid license |
| Watermark | "Made with tldraw" always visible in bottom-right (cannot be removed without license) |
| Cloud sync | Separate paid service — **do not adopt tldraw sync** |
| License validation | Client-side, works offline |
| Privacy | Local-first, no telemetry by default, no data sent to tldraw servers (unless sync is enabled) |

**Critical question: Is the watermark acceptable when projected in a classroom?**

For /control (teacher-only view): The watermark is acceptable — it's a teacher workspace, not a student-facing surface.

For /display (projected student view): Under the Display Boundary Decision (see below), /display does not load tldraw. It renders a student-safe lightweight projection that is engine-agnostic. Therefore the tldraw watermark does not appear on the student-facing /display route. This substantially lowers the projector watermark risk.

The tldraw decision should still consider license terms, hobby approval, and whether the teacher/editor watermark is acceptable on /control. If tldraw is ever used to power a student-facing surface directly (for example, a shared iPad used by students to annotate), that would be a new watermark question to evaluate on its own — this analysis covers /display only.

**Fit for single-teacher local-first classroom use:** Good. tldraw is local-first by default. License keys are validated client-side. No cloud dependency unless sync is explicitly added.

**Fit for live classroom widgets:** Excellent. tldraw shapes are reactive React components. Custom `ShapeUtil` classes can render timers, games, and interactive tools. The Editor API provides programmatic updates for live state changes.

**Fit for iPad/Mac teaching workflow:** Good. tldraw has built-in touch and stylus support, pinch-to-zoom, and Apple Pencil pressure sensitivity. Test extensively on iPad before committing.

**Fit for /control and /display split:** The /control route may use tldraw for authoring. The /display route remains a separate engine-agnostic renderer that projects DisplaySafeScene/DisplaySafeWidget through a lightweight renderer and does not load tldraw Editor, Konva Stage, or any editing engine. This means:
- /control renders the tldraw `Editor` in editable mode with toolbar/sidebar
- /display renders a read-only projection of the same document's shapes without loading tldraw
- Display-safe projection: each shape type exposes `displayProps` via its `ShapeUtil`, and a shared `toDisplaySafe()` filter strips teacher-only fields
- Camera states can differ: instructor sees one scene, students see another (controlled via `displaySceneId`)
- Keeping /display engine-agnostic is the Display Boundary Decision (see below) — it also eliminates the projector watermark risk if tldraw is scoped to /control only

**Migration complexity:** High but structured:
- All `CanvasWidget` and `PageWidget` instances must be converted to tldraw shapes
- Each widget type needs a `ShapeUtil` implementation
- Existing display renderers are replaced by tldraw shape rendering
- Display-safe projection must be built once as a shared protocol
- localStorage persistence must be migrated from Zustand shape to tldraw's `TLStore` snapshot shape

**Test impact:** High — existing unit tests for `WidgetCanvasCard.tsx`, `WidgetDisplayOverlay.tsx`, and widget interactions must be redesigned around tldraw's `Editor` and shape model. tldraw has its own test utilities.

**Risk level:** Medium. tldraw is well-maintained and documented. The primary risk is the licensing/watermark issue and the migration effort for custom ShapeUtil widgets.

**Recommendation:** Preferred option. tldraw can power /control authoring and potentially future iPad annotation. /display remains a separate engine-agnostic renderer (Display Boundary Decision). The watermark is no longer treated as a student-projector blocker because /display does not load tldraw. License terms, hobby approval, and teacher/editor watermark acceptability still need confirmation.

---

### Option C — React-Konva

**Summary:** Adopt [React-Konva](https://konvajs.org/docs/react/) (the React binding for [Konva.js](https://konvajs.org/)) as the canvas engine. Konva provides a 2D canvas library with layers, shapes, transforms, events, and animation — but does NOT provide built-in selection, resize handles, pan/zoom, or camera management.

**What we gain:**
- MIT license — truly open source, no watermark, no commercial restrictions
- HTML5 Canvas rendering (hardware-accelerated via GPU)
- Layer system for grouping and z-ordering
- Built-in shape primitives: Rect, Circle, Text, Image, Line, Group, Transformer (resize/rotate handles)
- Event system with hit detection and bubbling
- Tween/animation system
- Drag-and-drop support with drag bounds and event hooks
- Caching for performance with complex shapes
- Pixel-perfect rendering (no CSS layout quirks)
- TypeScript definitions included
- ~180KB gzipped (smaller than tldraw, larger than hand-rolled)
- Works in all browsers including Safari on iPad

**What we lose:**
- Must build selection (marquee, click-to-select, multi-select), resize handles (Konva's Transformer helps but needs wiring), pan/zoom (must implement with stage scale/position transforms), camera/viewport, undo/redo, minimap, snap-to-grid, and spatial indexing by hand
- No built-in frame/page concept — must implement scene boundaries and camera transitions
- No built-in shape serialization for custom widget types — must define our own JSON schema
- No built-in editor toolbar or menus — everything must be custom React UI
- Konva Transformer (resize/rotate) must be wired per-selection, including touch/stylus support
- Less ecosystem momentum than tldraw
- Gesture handling (pinch-zoom, two-finger pan) requires custom touch event handling
- Konva's `Stage` uses imperative imperative API for some operations (`.toDataURL()`, `.getPointerPosition()`) — less idiomatic React than tldraw

**Licensing/cost/privacy:** MIT — completely free, no watermark, no commercial restrictions, no application required.

**Fit for single-teacher local-first classroom use:** Excellent — no external dependencies, all state stays local.

**Fit for live classroom widgets:** Good. Konva shapes can re-render on state changes. Animations and transitions are built-in. Custom shape drawing is straightforward.

**Fit for iPad/Mac teaching workflow:** Moderate. Konva supports touch events, but gesture handling (pinch-zoom, two-finger pan) must be implemented manually. Multi-touch is supported but requires explicit event wiring.

**Fit for /control and /display split:** Good — same approach as hand-rolled but with a real canvas layer. Two `Stage` instances (one on /control, one on /display) can share the same shape model. Display-safe projection is a filter on the shape tree.

**Migration complexity:** Medium:
- `CanvasWidget` and `PageWidget` must be converted to Konva shape configs
- Each widget type needs a Konva rendering component
- Selection, resize, pan/zoom must be built
- Undo/redo must be added
- localStorage snapshot must be serializable Konva state
- Display-safe projection built once as shared protocol

**Test impact:** Medium — existing unit tests for `WidgetCanvasCard.tsx` and `WidgetDisplayOverlay.tsx` are replaced by Konva shape renderers. Konva has canvas-based testing utilities and `react-konva` supports `react-test-renderer` snapshots.

**Risk level:** Low-medium. Konva is mature (v9+), well-tested, and MIT-licensed. The main risk is the amount of custom editor behavior we must build on top.

**Recommendation:** Fallback option if tldraw's watermark/licensing is unacceptable. Prefer Konva over hand-rolled DOM for its hardware-accelerated rendering, shape primitives, and event system.

---

## Decision Matrix

| Criterion | A: Hand-rolled | B: tldraw | C: React-Konva |
|-----------|---------------|-----------|----------------|
| License | MIT (owned) | Source-available, commercial | MIT |
| Watermark | None | "Made with tldraw" | None |
| Selection/DnD | Build from scratch | Built-in | Partial (Transformer) |
| Pan/Zoom/Camera | Build from scratch | Built-in | Build from scratch |
| Undo/Redo | Build from scratch | Built-in | Build from scratch |
| Spatial index | Build from scratch | Built-in (rtree) | Build from scratch |
| Shape primitives | None (DOM) | Rich | Good |
| Custom widgets | React components | ShapeUtil classes | Konva shapes |
| Touch/Stylus | Manual | Good | Manual |
| Bundle size | 0 KB | ~500 KB gzipped | ~180 KB gzipped |
| Migration effort | None | High | Medium |
| Test impact | None | High | Medium |
| Maintenance burden | High (long-term) | Low | Medium |
| Community/ecosystem | None | Active | Mature |

---

## Explicit Answers

### Will the tldraw watermark be acceptable?

**Yes, under the Display Boundary Decision.** Because /display does not load tldraw (it renders a student-safe lightweight projection), the watermark does not appear on the student-facing projector route. The watermark would only appear on /control (teacher editing surface). This substantially lowers the projector watermark risk. The recommendation is:

1. If the watermark is acceptable on /control: choose **tldraw** (Option B).
2. If the watermark is unacceptable on /control: choose **React-Konva** (Option C).
3. If both tldraw and Konva are ruled out: continue **hand-rolled** (Option A) with explicit acceptance of the long-term maintenance burden.

### Can tldraw handle live classroom widgets?

Yes. tldraw's `ShapeUtil` classes render React components that re-render on state changes. Widgets like countdown timers, noise meters, and random pickers update in real-time. The `Editor` API supports programmatic shape mutations (`editor.updateShape`, `editor.createShapes`, `editor.deleteShapes`). For high-frequency updates (e.g., timer ticking every second), batch updates should be used to avoid excessive re-renders.

### How do scenes map to tldraw frames/camera states?

tldraw's `Frame` shape is the natural mapping for a classroom Scene:
- Each `Scene` becomes a `Frame` on the canvas
- The active scene (teacher editing) is `editor.setCurrentTool(null)` + `editor.zoomToBounds(frameBounds)` to snap the camera to that frame
- The display scene (student projection) is a separate camera state pointing to a different frame
- Scene transitions are smooth camera animations between frames
- Frame geometry defines the scene's visible area — widgets placed inside a frame belong to that scene

### How do we preserve existing tests?

All existing test suites (display-studio: 63 assertions, display-composer: all passing, display-launch: 12 assertions, display-polish: 15 assertions, and 8 other suites totaling ~1,028 assertions) continue to pass during the documentation and planning phases. No test is modified in Phase 15L.1.

When an engine is adopted (Phase 15N):
- Existing unit tests for `WidgetCanvasCard.tsx` and `WidgetDisplayOverlay.tsx` must be redesigned around the new engine's API
- New tests must be written for custom ShapeUtil (tldraw) or Konva shape (Konva) widgets
- The test coverage target of ~1,000+ assertions must be maintained
- Migration tests (old state → new engine state) must be added

### What gets migrated first?

Phase 15M (spike/prototype):
1. A single display screen (e.g., "Morning Arrival") with 2-3 simple widgets (clock, directions-text, timer)
2. Display-safe projection from one scene
3. Camera navigation between two scenes
4. No production data migration — spike runs on sample data

Phase 15N (production migration, order TBD):
1. Data migration: convert `CanvasWidget[]` → engine shapes; `DisplayScreen` → engine frames/scenes
2. Widget renderers: one ShapeUtil/Konva component per `CanvasWidgetType`
3. Display-safe protocol: single `toDisplaySafe()` filter chain
4. Remove `WidgetCanvasCard.tsx` and `WidgetDisplayOverlay.tsx` switch statements
5. Remove `PageWidget` — all widget instances use the unified model

### What remains outside the canvas?

These components stay in React/DOM, not on the canvas:
- **Teacher Command Dock** — sidebar panels, tool launchers, workspace selector
- **App shell/routing** — `TeacherControlShell`, `StudentDisplayShell`, route dispatch
- **Settings/preferences** — AI provider settings, device roles, curriculum pacing
- **Local storage/status scripts** — `boardStorageHealth.ts`, backup export/import
- **Background stores** — game state stores (hundredBoardStore, lottoBoardStore, prizeBoardStore, pressYourLuckStore) remain Zustand stores but their display widgets render as canvas shapes
- **Blank/Prize Board/Random Number overlays** — full-screen overlays on /display (not canvas widgets)
- **Timer engine** — `timerStore.ts` remains a Zustand store; timer widgets read from it

### How do /control and /display project student-safe state?

The shared protocol is:
1. Each widget type has a `teacherProps` and `displayProps` shape (typed, not `Record<string, unknown>`)
2. A single `toDisplaySafeWidget(widget: Widget): DisplaySafeWidget` function filters teacher-only fields
3. The canvas engine renders the filtered shape tree on /display
4. Teacher-only fields include: internal IDs, point values, student PII, coaching hints, storage internals, raw settings
5. This replaces the current ad-hoc per-widget manual projection in `WidgetDisplayOverlay.tsx`

---

## Display Boundary Decision

The /control and /display routes serve different audiences and have different engine requirements. This boundary was clarified after the original Phase 15L.1 decision package based on external review feedback.

### /control (teacher authoring)

/control may use the selected canvas/editor engine (tldraw, React-Konva, or hand-rolled DOM). This is the teacher's authoring surface — it needs selection, drag, resize, zoom, camera, inspector panels, and full widget editing.

### /display (student projection)

/display must remain engine-agnostic and student-safe. It renders DisplaySafeScene / DisplaySafeWidget through a lightweight renderer. It should not load tldraw Editor, Konva Stage, or the editing engine unless a later explicit decision reverses this.

### Rationale

1. The target model (Board > Scene > Widget) already defines engine-agnostic DisplaySafeScene and DisplaySafeWidget style projection.
2. Keeping /display engine-agnostic means /display can be a simple React/DOM renderer regardless of what powers /control.
3. This boundary is how we keep /display watermark-free if tldraw is used only in /control.

### Watermark implication for tldraw

If tldraw is chosen, its "Made with tldraw" watermark is expected to affect the teacher/editor surface only, not the student-facing /display route, because /display does not load tldraw. This substantially lowers the projector watermark risk. The tldraw decision should still consider:
- License terms and hobby/non-commercial approval
- Whether the teacher/editor watermark is acceptable on /control
- tldraw sync remains explicitly deferred; no tldraw sync adoption in this amendment

### Scope caveat

This conclusion applies to /display as currently scoped. It does not automatically extend to every future surface. If tldraw is ever used to power a student-facing surface directly (for example, a shared iPad used by students for annotation), that is a new watermark question to evaluate on its own, not one this amendment has already answered.

### Engine independence

The Display Boundary Decision is engine-independent. It applies equally to tldraw, React-Konva, or hand-rolled DOM. Regardless of which engine powers /control, /display renders the student-safe projection without loading the editor engine.

---

## No Final Dependency Adoption

**This phase (15L.1) is documentation-only.** No tldraw, Konva, or any other new dependency is installed. The decision is deferred to Phase 15N after:
- Watermark/licensing decision is made by the product owner
- Phase 15M spike validates the chosen engine with real classroom widgets on iPad/Mac
- Phase 15L.2 (visual safety fixes) and 15L.3 (widget contract planning) are complete
