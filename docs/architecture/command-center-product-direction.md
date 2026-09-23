# Command Center — Product Direction (Three Pillars)

**Date:** 2026-09-23
**Status:** Read-only research and design. No application code changed.
**Scope:** Command Center only. iPad/OmniNote handoff is out of scope entirely (backburner) — noted only where the codebase's own existing code already touches it.

---

## How to read this doc

Every claim below is grounded in the current codebase, checked directly (file reads, git history, or a small number of targeted commands) rather than assumed from older status docs. Where a claim depends on external research (library maintenance status, industry practice) it's marked and sourced. Recommendations are clearly separated from verified facts.

---

## Zeroth finding: `/display` is not one system — it's a layered composite of at least four

Before the three pillars make sense, one structural fact has to be stated up front, because it changes the shape of all three:

**Verified fact:** The live production `/display` route (`src/App.tsx`, `route === 'display'`) renders `BoardHostDisplay` from **Clean Board** (`src/features/clean-board/`) — not `StudentDisplayShell` from the Display Composer system that most of the architecture documentation (`board-scene-widget-target-model.md`) and most of the `/control` UI (Presentation Hub, Display Studio, the "Display Screens" dock tool) is built around. `StudentDisplayShell.tsx` still exists but is **unreachable dead code** — `AppShell.tsx`'s `route === 'display'` branch is never hit because `App.tsx` intercepts `'display'` earlier and returns first. This is documented and intentional (`qa/display-overlay-pipeline-audit.md`, "DB-7A" migration), not a bug — the team already found and fixed the regression this caused (`DisplayOverlayHost.tsx`, "DB-7B").

What actually composes `/display` today, in precedence order (verified in `DisplayOverlayHost.tsx` + `qa/display-overlay-pipeline-audit.md`):

```
1. Blank screen overlay        (useDisplayComposerStore.displayBlanked)
2. Prize Board projector       (usePressYourLuckStore)
3. Random Number display       (useRandomNumberStore)
4. Display Composer screen     (useDisplayComposerStore — "Send to Display" from /control)
5. Morning Message             (useBoardStore — the OLD classroom-screens system)
6. Now Showing badge           (useBoardStore)
7. base Clean Board canvas     (Clean Board's own board/scene/widget model — the default)
```

**This means there are at least five independently-implemented display-safety boundaries**, not one: Clean Board's `toSafeBoardPage` (`boardSafety.ts`), Display Composer's `toDisplaySafeScreen`/`toDisplaySafeWidget` (`displaySafe.ts`), Prize Board's `stripPrivateBoardFields`, Random Number's `shouldShowRandomNumberDisplay`, and Morning Message's own content-gating. Each one currently holds (see Pillar 1 below) — but each is a separate hand-maintained implementation, and none of the architecture-consolidation docs account for Clean Board at all: **`board-scene-widget-target-model.md` and `canvas-engine-decision.md` never mention Clean Board once.** The "three parallel data models" problem from the last architecture review is, in the part of the app students actually see today, closer to **four** systems layered by precedence rather than three sitting side by side.

This is the single most important thing to internalize before deciding what to build next in any of the three pillars: **the system most of the recent `/control` polish work (Presentation Hub, Display Studio) targets is not the system rendering the base of the screen students see.** It reaches students only as an overlay, when explicitly sent.

---

## Pillar 1 — Display Center (`/display`)

### Current-state audit

**Verified: the display-safe boundary holds, on every layer, right now.**
- Clean Board's `toSafeBoardPage()` strips `teacherNotes`, `accessToken`, `refreshToken`, `deviceId`, `accountId`, `clientSecret`, filters hidden objects, and re-whitelists (not blacklists) widget configs for message cards, timers, and images — a real allowlist approach, not a denylist, which is the safer default.
- Display Composer's `toDisplaySafeScreen`/widget projection strips `teacherNotes` and enforces `studentSafe`.
- One real leak was found and fixed earlier this year (`1468634`, "Fix leaked display renderer implementation note") — a single file (`DisplayScreenRenderer.tsx`), with a regression-guard test added. No occurrences of leaked internal strings exist in `src/` today (checked directly).
- `TEACHER_TOOL_REGISTRY` and the dock explicitly never mount on `/display` (`shouldExposeToolRegistryOnRoute`).

**Verified: legibility guarantees are inconsistent between the two content systems that reach `/display`.**
- Display Composer's renderer uses a fixed Tailwind type scale (e.g. `text-4xl md:text-6xl` for headline text) — legibility is guaranteed by construction, a teacher can't accidentally pick an unreadable size.
- Clean Board's renderer (`BoardObjectRenderer.tsx`) uses teacher-configurable `fontSize`/`titleSize`/`bodySize` values with no minimum-size clamp found in `messageCards.ts` or the teacher panel. **This needs a direct check on-device** (not confirmed as a live bug — the input path wasn't fully traced — but it's a real gap: nothing in the code guarantees a teacher can't set body text too small to read from the back of a classroom.)

**Verified: visual clutter/consistency risk comes from the layering itself, not from any single screen.** Because up to 7 precedence layers can each independently be "on" (a stale Random Number result, a Display Composer screen still marked active, Morning Message's `activePageId` check), the actual rendered output is the *emergent result of several independent stores*, not one screen's deliberate design. `qa/display-overlay-pipeline-audit.md` item 9 also flags a known, currently-unfixed UI bug: `DisplayStudioUIProvider.toggleWidgetLibrary(category)` toggles open/closed unconditionally, so switching category while the library is open closes it instead — a `/control`-side bug, listed here because it was found during this same review.

### Proposed target (using Classroomscreen/MyClassScreen as UX reference only)

Both reference products succeed by being **boringly consistent**: one visual language, one type scale, one background/theme system, regardless of which "widget" is on screen — the teacher never has to think about which underlying system is rendering. Recommendation:

1. **Collapse to one content system feeding `/display`**, once the Board/Scene/Widget consolidation (see below) is real — not five independent safety implementations, one shared `toDisplaySafeWidget()` protocol as the target model doc already specifies. This is the single highest-leverage legibility/consistency fix available, because it removes the *possibility* of five different type scales, not just today's instance of it.
2. **Enforce a minimum font size in the shared widget-settings type**, not as a UI convention — bake it into `WidgetSettings` validation so no widget type can render sub-legible text, on any engine.
3. Until consolidation happens, the cheap, immediate fix (**buildable now**, not blocked): add the same minimum-size clamp Display Composer gets "for free" from its fixed Tailwind scale to Clean Board's font-size inputs.

### Dependency on Board/Scene/Widget consolidation
- Fixing the *five-implementations* problem: **depends on consolidation** (it's the consolidation).
- Fixing Clean Board's specific font-size floor: **can be built now**, independent of consolidation — it's a one-file, low-risk clamp.
- Fixing the `toggleWidgetLibrary` category-switch bug: **can be built now**, unrelated to the model question.

---

## Pillar 2 — Easy Editing (`/control`)

### Current-state audit: the actual add/move/resize/remove/save/send flow, traced in code

**Add a widget:** 1 click (`handleWidgetAdd` in `DisplayStudioWidgetLibrary.tsx` → `addWidget()` auto-places it on the canvas). This part is already good.

**Move a widget:** Click to select, then mouse-down-drag. **Verified in `DisplayStudioCanvas.tsx`: this is implemented with `onMouseDown` / a raw `document.addEventListener('mousemove'/'mouseup')` pair — plain `MouseEvent` typing throughout, no `onTouchStart`, no `PointerEvent`, no touch handling anywhere in this file or in `WidgetCardShell.tsx`.** This means **a teacher cannot drag-reposition a widget on this canvas using an iPad touchscreen today** — only mouse/trackpad works. This is a significant, concrete finding: the rest of the codebase repeatedly treats iPad support as a hard requirement (canvas-spike's own validation gate is "iPad and Mac Safari testing must pass"; multiple Clean Board commits are explicitly "iPad hardening"), but the actual `/control` widget-canvas drag implementation was never given touch support.

**Resize a widget:** **Not a drag handle at all.** `WidgetCardShell.tsx` renders no resize handle. Resize is a `<select>` dropdown of size presets, located inside `DisplayStudioInspector.tsx` (772 lines) — `resizeWidget(screen.id, widget.id, preset)`. To resize, a teacher must: select the widget, locate/open the Inspector panel if it isn't already open, find the size control among a 772-line panel's worth of other controls, and choose a preset. No freeform resize exists.

**Remove a widget:** Also only in the Inspector (`removeWidget(...)` at `DisplayStudioInspector.tsx:469`) — no on-canvas delete button, no Delete-key shortcut, no right-click menu found.

**Save:** Implicit — Zustand `persist` middleware autosaves on every store mutation (`displayComposerStore` persists to `localStorage`). No explicit save step, which is good, but also means there's no undo-before-save checkpoint for a bad edit — worth knowing if "easy editing" work touches this later.

**Send to display:** 1 click. **Update, 2026-09-23 — fixed as part of Phase 1 hygiene:** there were briefly two separate, simultaneously-visible "Send to Display" buttons (`PresentationHub.tsx` and `DisplayStudioCommandBar.tsx`, both mounted at once in the default `EditorModeShell` layout, both calling the same `sendToDisplay()`). The Phase 15L.2 changelog in `board-scene-widget-target-model.md` claimed "Send to Display: 3 instances → 1" was already completed (merged at `12c0c81`) — that claim hadn't held in current code; the duplicate had been reintroduced when Presentation Hub was added afterward. `PresentationHub.tsx`'s copy has now been removed (Display Studio's `DisplayStudioCommandBar.tsx` is the one primary location — chosen because 7 existing Playwright assertions in `tests/e2e/display-studio.spec.ts` depend on it, versus zero for the Presentation Hub copy), and `scripts/test-display-studio.sh` now has a regression guard for both the removal and the survivor.

**Net assessment:** adding a widget is fast; everything else in the loop (resize, delete) routes through a large, general-purpose Inspector panel instead of direct on-canvas manipulation, and the canvas doesn't work on the one device class (iPad) this app is explicitly built for elsewhere in the codebase.

### Proposed target editing experience

For a single teacher making fast changes live during a lesson, the target should be: **every primitive action (move, resize, delete, duplicate) is available directly on the canvas, with the Inspector reserved for widget-specific settings** (timer duration, text content, image source) rather than for structural manipulation. Concretely:
- Drag to move (already exists, needs touch support added).
- Drag-corner to resize (doesn't exist yet — currently preset-only).
- Click-to-select shows inline delete/duplicate/lock icons on the widget itself, not buried in the Inspector.
- One "Send to Display" button, not two.

### Engine recommendation: DOM-based (react-rnd or dnd-kit) over Konva — for this specific goal

This is a narrower question than the earlier tldraw-vs-Konva canvas-engine decision, because Command Center's widgets are plain rectangular React components (timers, text cards, a clock, a noise meter), not freeform vector drawing.

**Verified research finding:** Konva's own documentation states react-konva "is not designed for drag-and-drop of every component, just for canvas drawings" — it renders to `<canvas>`, which means live, interactive React widget UI (a running timer's digits, a noise-meter's animation) can't be embedded as native DOM the way it can with a DOM-based drag library. For widgets that are themselves interactive React components rather than drawn shapes, this is a real architectural mismatch, independent of Konva's cost/licensing advantages over tldraw.

**Between the two DOM options, researched today (Sept 2026):**
- **react-rnd** handles drag + resize + select as a single component (closest out-of-the-box fit) but shows real maintenance-thinness signals: releases roughly every ~6 months, and an open GitHub issue explicitly asks whether the project is still maintained, with a contributor offering to build a replacement.
- **dnd-kit** is actively maintained (changelog activity as recently as Feb 2026) and ships built-in accessibility support, but its `Sortable` preset is reordering-focused; the underlying `useDraggable`/`useDroppable` primitives do support free positioning, but **it has no built-in resize** — that would need pairing with a small standalone resize implementation or a library like `re-resizable` (the same one react-rnd wraps internally).

**Recommendation:** build the target editing surface on **dnd-kit for drag + a small dedicated resize-handle component** (or `re-resizable` directly), rather than adopting react-rnd wholesale or moving to Konva. This keeps native DOM/CSS/accessibility for the widget content (which the app already relies on — see the current renderers in `WidgetMiscRenderers.tsx`/`WidgetEngagementRenderers.tsx`), avoids react-rnd's maintenance risk, and is a **strict upgrade of the existing hand-rolled `onMouseDown`/`mousemove` implementation already in place** — not a rewrite of the rendering model. This also sidesteps the entire tldraw licensing/watermark question for this pillar specifically, since Konva and tldraw are both weaker fits here regardless of cost.

### Dependency on Board/Scene/Widget consolidation
- Adding touch support to the existing drag implementation: **can be built now** — it's a change to `DisplayStudioCanvas.tsx`'s event handlers, independent of the data model.
- Adding drag-to-resize handles: **can be built now**, same reasoning — it's a UI change to `WidgetCardShell.tsx`, doesn't require the model to change first.
- Collapsing the two "Send to Display" buttons: **done** (2026-09-23, Phase 1 hygiene) — was pure UI cleanup, as predicted, no model dependency.
- Fully generalizing this editing surface to work identically for Clean Board's separate `BoardObjectRenderer` widgets too (so "easy editing" applies everywhere, not just Display Studio's screens): **depends on consolidation** — today it would mean building the same interaction twice, once per model.

---

## Pillar 3 — Teacher Launchpad

### Current-state inventory (verified directly against code, not the tool registry's marketing copy)

The canonical tool list lives in `src/features/teacher-dock/toolRegistry.ts` — **17 registered tools** across 4 categories (`daily`, `students`, `instruction`, `management`): Dashboard, Timers, Classroom Atmosphere, Morning Message, Today Prep, Curriculum Sync, Display Screens, Mystery Star, Quick Picker, Prize Board, Random Number, Lotto Board, Materials, Display, **OmniNote** ("Hand off lesson resources to OmniNote on iPad" — noted for completeness only, out of scope per this task), Jobs, Noise Control, Board Control.

**But this registry is not the whole picture — verified fact: there are currently at least four separate, simultaneously-existing "home base" surfaces on `/control`, not one:**

1. **`TeacherCommandDock`** — the 17-tool sidebar above, edge-launcher pattern.
2. **`PresentationHub`** — the actual center-column default view (mounted alongside the dock, per `TeacherControlShell.tsx`): live 16:9 preview, scene rail, Prev/Next, Send/Blank/Restore, plus its own entry buttons into "Teach Mode" and "Display Studio."
3. **`TeachModeShell`** — an entirely different UI, swapped in for the whole screen when `mode === 'teach'` (not composed with the dock or hub at all), containing `ResourcesPopover` (the "Resource Loader").
4. **Clean Board** (`/board-lab`, a separate route entirely) — its own **33-file** feature with its own toolbar (`BoardToolbar.tsx`), its own dock (`TeacherDockDrawer.tsx` — a second, separate dock component from `TeacherCommandDock`), its own Spotify controls, stamps, QR casting, templates, and routine prompts. Per its own commit history, this is explicitly "isolated, lazy-loaded, never wired as the default app" — yet it's what actually renders the base of `/display` (see the zeroth finding above).

**Resource Loader status, verified (not just a concept, and not fully built either):** `ResourcesPopover.tsx` has real, merged UI work (PRs #45–#52, most recently "Add resource linking setup stub #52"), but that most recent commit is explicitly described in its own message as "a non-persistent in-drawer resource linking setup stub... no Dashboard routing, persistence, APIs." It's real scaffolding, not a working feature.

**Spotify, verified:** already fully built and live-validated (real OAuth, playback, playlist builder — `399aaa2` through `10f1d64`), living inside Clean Board, not the main dock/registry.

**iPad handoff, verified (noted, not pursued per scope):** the codebase's own Phase 16A.0 spec lists "No OmniNote/iPad handoff" as explicitly out of scope for that phase, and the dock registry's own `omninote` tool entry exists already — meaning this feature is already partially scaffolded in the dock and is inherently a cross-project concern whenever it's picked back up.

### Proposed launchpad layout

Given a real single teacher needs fast transitions during live lessons, the launchpad should answer "where do I go to do X" with exactly one answer per X, not a choice between four surfaces. Recommendation, grounded in what's already built rather than invented from scratch:

- **One tap away (always visible, no drawer):** Send/Blank/Restore display, scene rail — i.e., keep Presentation Hub's current top-level layout, since it's already the right shape for "what's live right now."
- **One tap into a grouped drawer:** the 17 dock tools, grouped by the registry's existing 4 categories (daily/students/instruction/management) — this grouping already exists and is sound, it just needs to be the *only* place these tools live.
- **Lesson resources / external apps:** once Resource Loader gets persistence (see Part C priority order below), it belongs as a tab inside the same drawer, not a separate full-screen mode switch (`mode === 'teach'`) that hides the dock and hub entirely. Forcing a full mode switch to see lesson resources is itself a friction point worth removing.
- **Clean Board's tools (Spotify, stamps, QR, routine prompts):** these are real, working, well-built features stranded on an isolated route. They should be folded into the same single dock's category list once — this is the concrete, buildable expression of "consolidate the models," not an abstract data-migration exercise.

### Teacher Command Dock relationship: recommend **merge**, not replace or coexist

Coexistence is the current state, and it's demonstrably the source of confusion documented above (two Send-to-Display buttons, a mode switch that hides the dock, a second separate dock component inside Clean Board). Replacing the dock outright would throw away a working, well-organized 17-tool registry with real category/favorites/persistence logic already built (`dockStore.ts`, `dockPersistence.ts`). **Merge**: keep `TeacherCommandDock`'s registry-and-category pattern as the single dock, fold Clean Board's `TeacherDockDrawer` tools into the same registry as new entries, and fold Teach Mode's resource drawer in as a dock category instead of a full-screen mode swap.

### Dependency on Board/Scene/Widget consolidation
- Reorganizing the *existing* dock into better groups, removing the duplicate Send-to-Display button, and folding Teach Mode's resource drawer into the dock as a tab: **can be built now** — pure UI/composition changes, no data model changes required.
- Folding Clean Board's tools (Spotify, stamps, QR, routine prompts) into the same registry so they're reachable from one dock regardless of which underlying board model is active: **can be built now** at the UI-composition level (the dock can launch Clean Board's panels even while the two models stay separate underneath) — but doing it *cleanly*, without teleporting the teacher between two different underlying data models depending on which tool they clicked, **depends on consolidation**.
- Finishing Resource Loader's persistence/API layer: **can be built now**, independent of the canvas engine question, though see priority order below for why it should wait on the dock/mode-switch cleanup first.

---

## Dependency-ordered build sequence

Given the architecture is still fragmented and the engine choice is still unmade, here is the order that avoids rework, reasoned from what's blocked on what above:

1. **Cheap, isolated fixes with no dependencies** (do first, any order): touch support on the existing widget-canvas drag; collapse the duplicate Send-to-Display button; fix the `toggleWidgetLibrary` category-switch bug; add a minimum font-size floor to Clean Board's text config.
2. **Dock/launchpad consolidation at the UI layer** (depends only on #1's cleanup, not on the data model): merge Teach Mode's resource drawer into the dock as a category instead of a full-screen mode swap; reorganize the dock's categories; wire Clean Board's tools into the same dock registry as launch points (without touching their underlying store yet).
3. **Pick the canvas engine** (dnd-kit + resize, per Pillar 2) and add real drag-to-resize handles to the existing Display Studio canvas — this is additive to the current DOM-based approach, not a rewrite, so it doesn't need to wait on consolidation.
4. **Board/Scene/Widget consolidation itself** (Phase 15N, Strangler-Fig style — one feature ported at a time, starting with the simplest of the four systems, Display Composer, per the existing migration plan) — this is the long pole, and steps 1–3 all remain valid work regardless of when this starts.
5. **Only after #4**, finish Resource Loader's persistence layer, and only after that, consider new widget types (video) — building them against a model that's about to be replaced is the one sequencing mistake most worth avoiding here.

---

## Confirmation

No application code was changed while producing this document. All findings above were verified by reading the current source (file paths cited throughout), current git history, and the current `docs/`/`qa/` files — not assumed from prior status reports. This file itself is the only artifact written.
