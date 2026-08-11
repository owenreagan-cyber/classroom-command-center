# God-Tier Recommendations — Cross-Repo Audit

**Status:** Findings and recommendations only. No implementation plan, no code changes.
**Scope:** `classroom-command-center` (branch `phase-god-tier-audit`, based on `main` @ `a41f1b0`) and `~/Projects/omninote` (branch `phase-god-tier-audit`, based on `main` @ `700b749`).
**Method:** Two parallel read-only audits (one per repo) plus direct verification of the specific claims in the audit brief. No source files were modified in either repo to produce this document.

---

## Executive Summary — Top 5 Priorities

1. **Command Center's main production bundle has grown 39% past a previously-flagged, never-fixed regression** (582 KB → 809 KB gzip-relevant chunk) because `src/features/teacher-dock/toolPanels/index.ts` still statically imports all 17 tool panels, exactly as `docs/status/phase-13-2-bundle-analysis.md` warned two weeks ago. This is the single biggest concrete, already-diagnosed, still-open item in either repo — every `/control` user downloads this today.
2. **The Command Center ↔ OmniNote handoff schema mismatch is worse than assumed on both sides of the wire**, not just a naming quirk. Command Center itself emits two structurally incompatible payload shapes (`omninote-handoff` vs. `omninote-bridge`) from the same UI component, and OmniNote's own decoder silently drops fields (`url`, `visibleToStudents`) that Command Center's own example payloads use. This produces silent data loss, not visible errors — the highest-leverage architecture fix in this audit.
3. **OmniNote has zero automated test enforcement** — no XCTest target, no CI, and its own "persistence proofs" only run if a developer manually sets an environment variable before a DEBUG build. The documented "PASS" audit for autosave reliability is real in scope but has no guardrail against regressing it going forward.
4. **A `.omnilesson` package's non-primary contents (including potential teacher-only answer keys) are extracted to a `Documents/OmniNoteImports/` folder that is never cleaned up on success and is exposed via `UIFileSharingEnabled`/Files-app browsing** — the most concrete, previously-unknown privacy gap found in either repo.
5. **The Board/Scene/Widget ↔ Teaching Block reconciliation doc referenced in this project's own context does not exist**, and the two target-model docs never cross-reference each other despite both claiming ownership of overlapping concepts (Scene, Resource). This is a documentation/plan integrity gap that should be closed before Teaching Block implementation (16A.2+) proceeds further, since Command Center already has *six* independently-typed "lesson resource" concepts (not three) actively bridged by four ad hoc adapter functions.

---

## 1. Architecture Health

### Already known, confirmed still true
- The three named "lesson resource" type conflicts still exist exactly as described: `src/features/curriculum/types.ts` `LessonResource`, `src/features/omninote-handoff/types.ts` `OmniNoteExportResource`, `src/features/omninote-bridge/types.ts` `LessonResource` (same name, different shape).
- Board/Scene/Widget target model doc (`docs/architecture/board-scene-widget-target-model.md`) and Teaching Block doc (`docs/architecture/teaching-block-resource-rundown-model.md`) both exist.
- Phase 15M/15M.1 tldraw spike is merged and genuinely bundle-isolated (verified with a live build, not just code inspection — see §3).

### Newly found this pass
- **The reconciliation doc does not exist.** `docs/architecture/teaching-block-board-scene-widget-reconciliation.md` is not in the repo. The two target-model docs never mention each other's vocabulary, despite both claiming the "Scene"/"Resource" concept. This is a real, unresolved overlap, not just a missing filename.
- **The "three lesson resource types" claim understates the problem — it's at least six**, plus a duplicate-named package type:
  - `src/features/curriculum/types.ts:33-39` `LessonResource` — `kind: 'slides'|'pdf'|'worksheet'|'teacher-notes'|'answer-key'|'image'`
  - `src/features/omninote-handoff/types.ts:19-26` `OmniNoteExportResource` — `type: 'presentation'|'slideDeck'|'pdf'|'worksheet'|'studentResource'|'image'|'blankCanvas'|'teacherNotes'|'teacherKey'|'answerKey'` (camelCase)
  - `src/features/omninote-bridge/types.ts:15-23` `LessonResource` (same name, third shape) — `kind: 'pdf'|'worksheet'|'slide-deck'|'blank-canvas'|'google-slides'|'google-docs'` (kebab-case)
  - `src/features/curriculum-library-fetcher/types.ts:15-21` `LessonResource` (fourth shape, same name again) — `type: FetcherResourceType`, no `title` field (uses `filename`)
  - `src/features/curriculum-library/types.ts:21-29` `LibraryResource` — `type: LibraryResourceType`, adds `'answer-key'|'audio'|'template'|'blank-canvas'`
  - `src/features/curriculum-pack-importer/types.ts:27-34` `PackResource` — `type: PackResourceType`
  - `LibraryLessonPackage` is defined **twice** with two different shapes: `src/features/curriculum-library/types.ts:32-46` (has `grade?/track?/week?`) vs. `src/features/curriculum-library-fetcher/types.ts:24-38` (no `grade/track/week`). No compile error results from importing the wrong one.
  - **Concrete cost, not theoretical:** `src/board/TodayPrepPanel.tsx` uses three different "send to OmniNote" code paths in the same component (`handleOpenLessonInOmniNote`, `handleTeachInOmniNote`, `handleOpenInOmniNote`), the third of which builds a **fourth, inline, redundant** kind-mapping (lines 323-325) independent of the three existing mapper functions (`toBridgeLessonPackage`, `toBridgeLessonPackageFromFetcher`, `mapFetcherTypeToOmniNoteKind`).
- **Widget/geometry duplication is self-documented but unresolved**: `board-scene-widget-target-model.md:12-19` names `CanvasWidget` (`src/features/display-composer/types.ts:99-115`) vs. `PageWidget` (`src/data/types.ts:97`) as parallel systems the target model should collapse, plus tldraw's own shape types as a third. The migration phase that does this collapse (15N) has not started — only prep work (15L.1–15M) exists.
- **Teaching Block model is 100% unimplemented in code** (`docs/architecture/teaching-block-resource-rundown-model.md:4` self-reports "Proposed (no implementation)", confirmed by `grep -rl "TeachingBlock\|Rundown\|blockId"` across `src/` returning nothing). Only slice 16A.1 ("Clean Teach Mode shell") has landed, as literally the last commit on `main`. **Naming collision worth flagging before 16B**: an unrelated pre-existing `blockId` field already exists on `ScheduleBlock`-style types (`src/data/routineTypes.ts:19,93`, `src/data/scheduleModel.ts:57`) for time-schedule blocks — same word, different concept from the Teaching Block orchestration unit.
- **`/control`'s Dashboard-default bug — this context item is stale.** It was true until today; it was fixed in the very last commit on `main` (`a41f1b0`, same day as this audit — see §"Context Corrections" below for full detail).
- **On the OmniNote side, the same class of duplication exists internally, independent of Command Center**: `HandoffResourceType` (deep-link path, `HandoffResource.swift:10-20`) vs. `LessonPackageResourceKind` (package path, `LessonPackageResource.swift:10-23`) use different vocabularies for the same concept (`worksheetPDF` vs. `worksheet`; `slideDeckPDF` vs. `slideDeck`/`presentation`).
- **Dead code**: `TeachingToolsControlBar.swift` (177 lines) is never instantiated anywhere in OmniNote — superseded by `TeachingToolsMenuContent` inside `ClassroomToolbar.swift:249-338`.
- **Stale status doc**: `omninote/docs/status/omninote-current-state.md` says "Phase 8 completed... Next Step: Release," dated 2026-07-11, while the repo has since progressed through Phase 12D2. Would mislead anyone reading it as the canonical status entry point.
- **Command Center doc/commit status drift**: three Phase 15L status docs (`phase-15l-2-overlap-chrome-safety.md`, `phase-15l-3-status-widget-slots.md`, `phase-15l-4-template-completeness.md`) still say "Implementation complete. Not committed." even though all three are merged into `main` and referenced by commit hash elsewhere. Not functionally harmful, but a trust-the-doc-header trap.
- **Command Center git history**: two back-to-back, identically-messaged commits (`f480b1c`, `1468634`, one minute apart) touching the same files with the same diff — looks like a duplicate/failed-amend artifact, worth a housekeeping look, not a security concern.
- **OmniNote persistence/autosave — real but not enforced.** `NoteStore.swift`'s debounced `save()` (title/folder/background) vs. synchronous `saveImmediately()` (every ink stroke, via `persistNotesToDisk()`) design is sound and deliberate (protects against force-quit data loss — comment at `NoteStore.swift:334-335`). But: **there is no XCTest target anywhere in the OmniNote Xcode project**, no CI config, no `.xcscheme`. The "proofs" (`NoteStorePersistenceProof.swift`, 310 lines, 14 `verify...()` functions) only run when `OMNI_NOTE_RUN_PROOFS=1` is manually set (`OmniNoteProofRunner.swift:16-19`), and use `assert()`, which Release builds compile out entirely. The documented "PASS" matrix (`docs/status/phase-10-1-persistence-hardening-proof-audit.md`) reflects one point-in-time manual run, not an ongoing guarantee.

---

## 2. Visual / UX Polish

### Already known, confirmed still true
- 15L.2–15L.4 added `detectCanvasWidgetOverlaps`/`detectReservedZoneOverlaps` (`src/lib/canvasWidgetOverlapDetector.ts`), wired into `DisplayStudioCanvas.tsx`, plus slot-based placement for status widgets and template layout fixes (17 widgets moved across 13 templates).
- OmniNote has no custom visual design pass — confirmed independently via fresh greps (see below), matching the brief's claim almost exactly.

### Newly found this pass — Command Center
- **15L's own scope note says what it can't catch**, and this pass confirms those gaps are still open: `snack-lunch-flow-control.png` and 3 other templates still have baked-in title text burned into the PNG asset (not fixable in code, an asset-level fix), explicitly logged as "Deferred" in `phase-15l-2-overlap-chrome-safety.md`.
- **The overlap detector only covers `CanvasWidget` inside `DisplayStudioCanvas.tsx`.** Several screens/components with hand-rolled `absolute`/`z-*` positioning were never in its scope and carry the same collision risk:
  - Prize Board reveal overlays (`src/features/prize-board/components/MysteryBoxRevealOverlay.tsx:38`, `PrizeRevealOverlay.tsx`, `WhammyRevealOverlay.tsx`)
  - Student Picker's `MysteryRevealStage.tsx:120,122,127` and, notably, `MysteryStudentActiveBadge.tsx:33` — an always-on status badge positioned via raw CSS custom properties, completely outside the CanvasWidget slot system that 15L.3 built *specifically* to fix this exact class of always-on-badge overlap. Because it isn't a `CanvasWidget`, the 15L.3 audit never saw it.
  - The entire parallel "Studio Canvas" system (`src/features/studio-canvas/ClassroomCanvas.tsx`, `StudioCanvas.tsx`, `StudioWidgetFrame.tsx`) — a second positioning system operating on `PageWidget` (see §1), with its own drag/collision code, never touched by the Display Studio detector.
  - Standalone widgets outside the display-studio tree: `src/widgets/NoiseStatusCard.tsx`, `PhaseTimerCard.tsx`, `RoutineTimerWidget.tsx`, `TimerWidget.tsx`, `TransitionTimerWidget.tsx`, `VoiceLevelWidget.tsx`.
  - `src/screens/HomeroomScreen.tsx`, `src/app/QuickToolsPopover.tsx`, `src/app/StudentDisplayShell.tsx`.
- **No documented z-index scale — a latent source of the same bug class.** Tally across `src/`: `z-50`×11, `z-10`×8, `z-30`×5, `z-20`×3, `z-40`×2, plus arbitrary bracketed escape values `z-[100]`×2, `z-[60]`×2, `z-[55]`×1, `z-25`×1 — the bracketed values look like later insertions squeezed between Tailwind's fixed scale, a classic symptom of no stacking-context hierarchy.
- **Positive finding**: the newest UI surface, `src/app/CleanClassroomScreenPreview.tsx` (shipped same-day, same commit as the Teach Mode fix), uses zero `absolute`/`fixed` positioning — flex/grid throughout, consistent with the reserved-zone design principle in `teaching-block-resource-rundown-model.md` §8. It was built overlap-safe by construction, ahead of any automated check.

### Newly found this pass — OmniNote design direction
- **Verified independently, not just trusted**: 20 hits for `Color(.system*)`, 24 for `.accentColor`, zero custom hex/RGB colors anywhere, and `Assets.xcassets/AccentColor.colorset/Contents.json` is the unmodified Xcode-template default.
- **Two small exceptions worth building from, not around**: `.ultraThinMaterial` and `.shadow(...)` already appear in `TimerOverlayView.swift` (Phase 12D, a draggable floating timer) and `CoverBlockOverlayView.swift` — an ad hoc "floating glass" treatment that is inconsistent with the flat, bordered, opaque chrome used everywhere else. A design pass isn't starting from zero; it should generalize what `TimerOverlayView.swift` already improvised outward to the rest of the chrome, rather than inventing a new system.
- **Concrete redesign targets, by file**:
  1. `ClassroomToolbar.swift` (246 lines) — the primary toolbar; flat `HStack`/`VStack`, `.background(Color(.systemBackground))` + hairline `.border(...)`, plain `Circle()` color swatches with no grouping chrome. Biggest single target.
  2. `PresentationAidControlBar.swift` (97 lines) — laser/spotlight/ping picker, same flat pattern.
  3. `TeachingToolsControlBar.swift` (177 lines, dead code per §1) — structurally a reasonable reference for what a revived Reveal/Cover/Reset cluster should look like, if merged into the main toolbar redesign instead of being deleted outright.
  4. `FloatingToolContainer.swift`/`FloatingToolHandle.swift`/`FloatingToolState.swift` — the drag/resize framework built for the Timer tool; a floating tool-palette redesign should reuse this rather than build new drag logic.

  **Specific GoodNotes patterns worth naming** (not "add colors"): GoodNotes uses a *floating, pill-shaped, translucent-material toolbar* that docks to screen edges rather than a fixed top bar; tool groups are visually clustered with generous spacing and a selected-state background *fill* (not just an outline); the color picker opens as a *popover with recent colors persisted*, not a static row; ink/eraser size uses a *radial size preview* rather than a slider label. Every one of these is a chrome/materials/interaction pattern, not a palette swap — and every one maps directly to a named file above (`ClassroomToolbar.swift` for toolbar shape/docking, `FloatingToolContainer.swift` for the floating-and-draggable mechanic already built for Timer).

---

## 3. Performance

### Already known, confirmed still true
- Phase 15M.1 tldraw bundle isolation is real: `src/App.tsx:8` lazy-loads `CanvasSpikePage`, gated behind `Suspense`. Verified with a live build: `PASS: main entry chunk is tldraw-clean`, `PASS: spike chunk contains tldraw — correctly isolated` (both guard scripts run and passed).

### Newly found this pass
- **The bundle guard scripts exist but are not wired into CI at all.** Neither `.github/workflows/playwright.yml` nor `playwright-linux-snapshots.yml` runs `npm run build`, `test:display-bundle-guard`, or `test:display-import-guard`. The isolation is real today but enforced only by manual developer discipline — a regression (e.g., a shared util statically importing tldraw) would ship undetected.
- **A much larger, already-diagnosed, still-open bundle problem exists in the production main chunk** (this is the #1 executive-summary item): `docs/status/phase-13-2-bundle-analysis.md` (2026-07-26) measured the main chunk at 582 KB / 154 KB gzip and explicitly recommended lazy-loading the 5 heaviest tool panels via `src/features/teacher-dock/toolPanels/index.ts`, with a sample `TOOL_PANEL_LOADERS` pattern. Current state: **still 17 fully static imports, zero `import()`/`lazy()` calls** — exactly the flagged pattern, unfixed. Live build measurement this pass: main chunk is now **809.31 KB minified / 208.57 KB gzip**, a 39% increase since the doc's 2026-07-26 measurement, with no guard ever added to catch it (unlike tldraw, which got a dedicated guard script). The spike chunk itself is also large (1,688.79 KB / 501.93 KB gzip) but that's expected and correctly isolated from the main path.
- **No generalized "large dependency" guard exists.** `vite.config.ts` has no `manualChunks`, no bundle-visualizer, no `chunkSizeWarningLimit` override, and CI never runs `build` — so even Vite's default 500 KB warning is invisible in CI. Production dependency footprint is otherwise lean (`react`, `react-dom`, `tldraw`, `zustand` only) — a generalized guard mainly needs to cover (a) the tool-panel static-import bloat above and (b) any future addition to `dependencies`.

### OmniNote performance
- **Confirmed concern, previously undocumented**: `PencilCanvasView.Coordinator.canvasViewDrawingDidChange` (`PencilCanvasView.swift:103-112`) fires on every completed stroke and eventually triggers `NoteStore.saveImmediately()` → `persistNotesToDisk()` (`NoteStore.swift:198-228`), which does a **synchronous `JSONEncoder().encode()` of the entire notes array — every note's drawing data, not just the one being edited — plus an atomic disk write, on the main actor, on every stroke.** This is a deliberate reliability tradeoff (documented at `NoteStore.swift:334-335` to protect against force-quit data loss on the debounced path), but its cost scales with total ink across the whole library, not per-note. A teacher with dozens of annotated lessons will re-encode/re-write megabytes of unrelated data on every single stroke of whatever note is currently open.
- PDF rasterization is correctly backgrounded (`NoteBackgroundView.swift:151-168`, `DispatchQueue.global(qos: .userInitiated)`) and `PDFDocument` objects are cached (`LocalBackgroundStore.swift:11,120-131`) — good. But rendered bitmaps are not cached across page navigation, and page changes force a full view-identity teardown/rebuild (`.id(...)` on both background and canvas views), causing a `ProgressView()` flash on every page flip in multi-page documents — a UX-jank issue, not a memory-safety one (only one page is resident at a time).
- No perf-related tests, benchmarks, or TODO/FIXME comments exist anywhere near the drawing/canvas code — this class of issue has no self-documented awareness in the codebase today.

---

## 4. Security / Privacy

### Already known, confirmed still true
- The previously-fixed "leaked-note bug" is real and understood: commit `1468634` (plus an accidental duplicate `f480b1c`) removed a literal stray AI-authoring artifact (`"I'll actually do this differently, just update key layout areas."`) that had been pasted directly into `src/features/display-composer/DisplayScreenRenderer.tsx`, the student-facing `/display` renderer.
- OmniNote's `HandoffDeepLinkParser` safety checks are real and live-wired, not just documented: private-key blocklist (`note, notes, teachernote, teachernotes, privatenote, privatenotes, answerkey` — `HandoffDeepLinkParser.swift:144-152`) and scheme allowlist (`file, https, omninote` allowed; `http, javascript, data` blocked — lines 154-164) are both enforced in `validateSourceURL`, called from `parse()`, called from the app's real `.onOpenURL` handler chain (`OmniNoteApp.swift:24` → `AppModel.swift:53-71` → `HandoffRuntimeHandler.swift:140`). Confirmed as a live runtime path, not dead code.

### Newly found this pass
- **The Command Center leak-fix guard is narrow, not general.** It's a single grep in `scripts/test-display-studio.sh` for one hardcoded string in one file (`DisplayScreenRenderer.tsx`). A broad grep this pass for similar meta-commentary patterns (`"I'll actually", "let me actually", "wait, actually"`, etc.) across all of `src/` found zero current instances — but there is no guard that would catch a *new* stray note in any of the other 5 student-facing render surfaces (`StudentDisplayShell.tsx`, `WidgetDisplayOverlay.tsx`, `CanvasSpikeDisplayProjection.tsx`, `LottoBoardStudentDisplay.tsx`, `JobsManagerStudentDisplay.tsx`), or a differently-worded note anywhere.
- **`omninote-handoff`'s privacy validator doesn't cover `omninote-bridge`.** `src/features/omninote-handoff/privacy.ts`'s `validateExportPrivacy()` (blocked keys, blocked value patterns for tokens/URLs/emails, teacherOnly+studentVisible exclusivity check) is solid but only wired into the `omninote-handoff` path. `omninote-bridge`'s `buildLessonPackage`/`executeHandoff` has no equivalent filter and passes through whatever it's given. Since `TodayPrepPanel.tsx` actively uses the unvalidated `omninote-bridge` path for two of its three OmniNote flows, the copy-link/deep-link/manual-share flows never run any privacy check at all.
- **New OmniNote finding, previously unknown**: extracted `.omnilesson` package contents are left behind indefinitely. `OmniLessonPackageArchive.preparePackage` (`OmniLessonPackageArchive.swift:37-82`) extracts the **entire** zip — which per the manifest schema can legitimately include `teacherNotes`/`teacherKey`/`answerKey`/`privateNotes` resources sitting alongside the student-facing worksheet — into `Documents/OmniNoteImports/<uuid>/extracted/`. Only the primary student-visible resource is copied into permanent storage afterward; `removeItem(at: importFolder)` is only called on *failure* paths, never on success. Combined with `Config/Info.plist:49-52` setting `LSSupportsOpeningDocumentsInPlace = true` and `UIFileSharingEnabled = true` (making `Documents/` browsable via the iPad Files app and Finder/USB), this is a plausible path for a bundled answer key to sit, unencrypted and un-cleaned-up, somewhere a student with iPad access could browse to.
- **Real curriculum answer-key content is committed to git in Command Center**, not gitignored: `dist/omnilesson/saxon-math-5-lesson-07-teacher-map.json` and the paired `.omnilesson` zip contain real reveal/answer text (e.g. `"text": "$606"`). `.gitignore` only excludes `.local/`; `dist/` is tracked. Low-stakes (math answers, not PII) but worth adding to `.gitignore` on principle before this pattern is repeated with something more sensitive.
- No hardcoded real student PII was found in either repo. Command Center's roster fixtures are explicitly self-labeled fake (`"privacy": "safe-fixture-for-tests-and-docs"`, obviously fake names). OmniNote's `print`/`NSLog` calls (14 + 19 hits) are all diagnostic/lifecycle messages, none echoing raw handoff URLs or content.

---

## 5. Cross-Repo Integration

### Already known, confirmed still true
- The two apps' handoff schemas don't match, and "worksheet vs. worksheetPDF, slideDeck vs. slideDeckPDF" is a real, confirmed instance of the mismatch.

### Newly found this pass — precise scope of what unification requires

**Command Center emits two structurally incompatible payloads, not one, from the same UI:**

| Concept | Path A — `omninote-handoff` (full JSON export) | Path B — `omninote-bridge` (lightweight deep-link) |
|---|---|---|
| URL scheme | `omninote://lesson?...` | `omninote://open?...` |
| Resource "kind" field name | `type` | `kind` |
| Slide deck value | `'slideDeck'` (camelCase) | `'slide-deck'` (kebab-case) |
| Blank canvas value | `'blankCanvas'` | `'blank-canvas'` |
| Resources cardinality | array (`resources: OmniNoteExportResource[]`) | single (`resource: LessonResource`) |
| Display-mode enum | `'student-safe'\|'teacher-only'\|'none'` | `'projector'\|'ipad-only'\|'both'` |
| Annotation-mode enum | `'annotate'\|'present'\|'read-only'` | `'pen'\|'highlighter'\|'read-only'` |
| Lesson number type | `string` | (no field) |
| File-source param | `source` (file:// URL) | `source` (local path) + separate `url` (web) |

Both paths are simultaneously live, invoked from the same `src/board/TodayPrepPanel.tsx` component. Any OmniNote-side schema needs to reconcile against **both**, since Command Center itself has no single canonical shape.

**OmniNote has the mirror-image problem — two internal vocabularies, plus confirmed field-name mismatches against Command Center's own sample data:**
- `HandoffResourceType` (`HandoffResource.swift:10-20`, deep-link path) vs. `LessonPackageResourceKind` (`LessonPackageResource.swift:10-23`, package path) — different vocabularies for the same concept.
- `LessonPackageResource`'s decoder only reads `source`/`localPath` and `studentVisible`/`teacherOnly` (`LessonPackageResource.swift:87-92,127-128`). Command Center's own `examples/lesson-packages/*.example.json` sample files (4 files, Command-Center-shaped) consistently use `"url"` and `"visibleToStudents"` instead — **both fields are silently dropped on decode**, no error, no crash. Two additional un-anticipated `kind` values from the same samples (`"spotifyPlaylist"`, `"youtube"`) have no match in OmniNote's `fromCanonicalType` mapping and silently fall through to `.unknown`, which is excluded from both student-visible and teacher-only resource selection — an explicitly `visibleToStudents: true` resource would be dropped entirely.
- **Confirmed internal inconsistency inside OmniNote itself**: a real shipped package, `dist/omnilesson/saxon-math-5-lesson-07.omnilesson`'s `package.json`, already uses OmniNote-native field names correctly (`"type"`, `"file"`, `"studentVisible"`, `"teacherOnly"`) — so whatever produced that specific package speaks a different dialect than the `examples/lesson-packages/` samples in the same repo. No single canonical schema currently exists on either side of the integration, and not even consistently within OmniNote's own example/fixture data.

**Scope of unification, concretely** (not "make them match" — the actual list):
1. Pick one canonical field name for the resource-type discriminator (`type` vs. `kind`) and one casing convention (camelCase vs. kebab-case) — currently 4 different conventions across Command Center's 2 paths and OmniNote's 2 types.
2. Reconcile cardinality — array vs. single resource — since Command Center emits both depending on path.
3. Reconcile the 3 different enum pairs for display-mode and annotation-mode (2 in Command Center, both different from OmniNote's own).
4. Add the missing decode-key aliases OmniNote needs (`url`→`source`, `visibleToStudents`→`studentVisible`) or fix Command Center's example/emission data to match OmniNote's existing keys — whichever direction is chosen as canonical.
5. Extend `LessonPackageResourceKind.fromCanonicalType` (or replace it with a stricter contract) to either reject unknown kinds loudly (fail visibly) instead of silently defaulting to `.unknown` and dropping the resource, or expand its mapping table to cover Command Center's actual emitted vocabulary.
6. Decide which of Command Center's 6+ internal "lesson resource" types (§1) is the actual source of truth for what gets serialized to Omniue — right now `TodayPrepPanel.tsx` alone round-trips through 3 different mapper functions plus a 4th inline one before anything crosses the wire.

**Other assumed-shared concepts not yet verified to match**: given the display-mode and annotation-mode enum mismatches found above, any other cross-repo enum (e.g. visibility/privacy levels, subject/grade identifiers) should be treated as unverified until explicitly diffed — this audit only had scope to check the resource-type and mode enums specifically.

---

## 6. "God Tier" — Aspirational, Cross-Referencing Prior Research

**Important scoping note before the recommendations below**: the audit brief referenced several categories of "already researched" prior work — a Google Slides/PowerPoint/Canva/ClassroomScreen/GoodNotes/Explain Everything competitive analysis, Sidecar/Universal Control/Freeform research, the Nutrient/PSPDFKit SDK option, and reserved-zone/readability research. This pass searched both repos' `docs/` trees and this session's list of previously-published artifacts for all of these. Results:

- **Grounded and real**: reserved-zone/readability research (multiple docs, e.g. `docs/status/command-center-projector-readability-timer-polish.md`, referenced throughout `board-scene-widget-target-model.md`). A GoodNotes benchmark doc exists (`docs/design/omninote-superior-goodnotes-plan.md`) — but it's a feature-parity requirements list (P0/P1/P2 tables), not a toolbar-chrome/materials teardown; the OmniNote agent's own fresh code inspection (§2) is what actually grounds the toolbar-chrome recommendations below. A light Canva/Google Slides/Classroomscreen comparison exists (`docs/status/phase-15a-display-studio-redesign.md:12-14`), framed around the Display Studio editor layout, not competitive positioning generally.
- **Not found anywhere in either repo, and not among this session's published artifacts**: "Explain Everything" as a named competitor, "Sidecar," "Universal Control," "Freeform," "Nutrient," and "PSPDFKit." None of these terms appear in either repo's `docs/` tree.

Per the brief's own instruction not to introduce ungrounded new directions without flagging them, the recommendations below are restricted to what this pass could actually verify as grounded, or are explicitly flagged as new.

1. **Close the toolbar/chrome gap using OmniNote's own already-built floating-material mechanic, not a new design system.** `TimerOverlayView.swift` already has translucent-material + shadow treatment and a working drag/resize framework (`FloatingToolContainer.swift` family). Generalizing that existing pattern to `ClassroomToolbar.swift` and `PresentationAidControlBar.swift` is the highest-leverage, lowest-risk visual upgrade available — it reuses code that's already shipped and battle-tested for one tool, rather than researching a design system from scratch. *(Grounded in: §2 fresh code inspection; not the missing GoodNotes teardown, but a real, cited alternative basis.)*
2. **Fix the main-chunk bundle regression before adding any more UI surface area.** At 809 KB and climbing with no guard, every future feature (including any toolbar redesign) compounds an already-flagged, already-diagnosed problem. This is process, not vision, but it's the precondition for "feels fast and native" rather than "feels like a big web app." *(Grounded in: §3, `docs/status/phase-13-2-bundle-analysis.md`.)*
3. **Treat the handoff schema as the actual product surface between the two apps, and give it one owner.** Right now three different Command-Center code paths and two different OmniNote decoders all interpret "what is this resource" differently, with silent data loss on mismatch (§5). A best-in-class product wouldn't have a teacher's worksheet silently vanish because of a `url` vs. `source` key mismatch. This is the single most user-visible "feels broken" risk identified across both repos, and it's entirely within scope to fix without new research. *(Grounded in: §5, direct code evidence in both repos.)*
4. **Reserved-zone/readability research should extend past `CanvasWidget` to cover the full inventory of un-audited absolute-positioned surfaces found in §2** (Prize Board, Student Picker, Studio Canvas, standalone timer widgets). The research and tooling to do this already exists (`canvasWidgetOverlapDetector.ts`); it just hasn't been pointed at everything yet. *(Grounded in: existing reserved-zone docs + §2 findings.)*
5. **The PDFKit annotation gap is a real, cheap opportunity, confirmed this pass**: OmniNote already imports PDFKit in 4 files (`PageCanvasContainer.swift`, `LocalBackgroundStore.swift`, `NotePDFExporter.swift`, `NoteBackgroundView.swift`) but has zero `PDFAnnotation` usage anywhere, and zero ruler/shape-tool code exists at all — both independently re-confirmed this pass via direct grep, not just trusted from the brief. Native `PDFAnnotation` subtypes (`.square`, `.circle`, `.line`) are a plausible low-cost path to the "shapes" and "ruler"-adjacent gaps in `docs/design/omninote-superior-goodnotes-plan.md`'s own requirements table, without adding a new dependency. *(Grounded in: confirmed-true brief claim + the existing GoodNotes requirements doc.)*

**Explicitly flagged as new, not grounded in prior research found in this project**: nothing about Nutrient/PSPDFKit, Sidecar, Universal Control, or Freeform is recommended here, because no prior research on those topics could be located in either repo or this session's artifact history. If that research exists, it likely lives outside both repos (e.g., an un-saved chat conversation or an artifact not captured in this session's list) — worth confirming where it lives before the next phase treats it as established context.

---

## Context Corrections (stale premises from the audit brief)

- **`/control` no longer defaults to Dashboard.** `src/data/defaults.ts:394` sets `DEFAULT_MODE = 'teach'`, and `TeacherControlShell.tsx:16-23` renders the calm `TeachModeShell` by default. This was fixed in `a41f1b0 "Add clean Teach Mode shell (#45)"` — the literal last commit on `main`, landed the same day as this audit. Two caveats worth carrying forward: (1) a stashed, uncommitted WIP existed on `phase-16a-2-premium-teach-mode-polish` when this audit started (see below — it's visual polish only, doesn't touch this routing fix); (2) `boardStore.ts:978-981` migration logic forces Teach Mode only for persisted state below version 14 — existing users already on version ≥14 with `mode: 'edit'` persisted could still land on Dashboard until a fresh install clears it. Worth explicit QA before treating this as fully resolved for existing users, not just fresh installs.
- **The stashed Teach Mode WIP (on `phase-16a-2-premium-teach-mode-polish`, stashed before this audit began) does not address the Dashboard-default question** — it is purely visual polish to `TeachModeShell.tsx`, `CleanClassroomScreenPreview.tsx`, and `QuickToolsPopover.tsx` (spacing, border colors, gradients, button glyphs like "← Previous"). It presumes Teach Mode is already the active view; it contains no routing or default-mode logic. The stash was read via `git stash show -p` only (never applied) and remains intact — confirmed via `git stash list` before and after.
- **A newly-noticed, minor bug in that same commit**: `TeachModeShell.tsx:145-151`'s "Resources" button has no `onClick` handler at all, unlike its neighboring "Dashboard"/"Edit" buttons — dead/inert UI shipped same-day.
- **Phase 9F's actual status string is "COMPLETE WITH WARNINGS," not "pending."** `docs/status/phase-9f-handoff-validation-pack.md:3` reads `Status: COMPLETE WITH WARNINGS` — 9 of 11 checklist items complete; the 2 open items (blank-canvas and local-PDF handoff observed on a booted Simulator/device) are genuinely still open, so the brief's characterization is directionally right but the literal doc header differs from how it was paraphrased.
- **The "Curtain/Block Box" feature name in the brief doesn't match the code's own naming.** The actual implementation calls it the "Cover Block Tool"/"Reveal Tool" (`CoverBlockOverlayView.swift`, `RevealOverlayView.swift`) — zero hits for "curtain" anywhere in the OmniNote repo. Same feature, different vocabulary; worth using the code's actual names going forward.
- **The "Nutrient/PSPDFKit SDK option," "Sidecar/Universal Control/Freeform," and "Explain Everything" competitive research referenced in the brief could not be located in either repo or this session's published-artifact history** (see §6) — flagged rather than fabricated or silently worked around.

---

## New Parallel/Duplicate Systems Found Beyond Those Already Named

- Command Center: `LessonResource`/`LessonResourceKind`-family type count is 6, not 3 (see §1), plus a duplicate-named `LibraryLessonPackage` with two incompatible shapes.
- Command Center: `CanvasWidget` vs. `PageWidget` vs. tldraw's shape types — a third parallel geometry/widget system, self-documented in `board-scene-widget-target-model.md` but not yet resolved.
- Command Center: two live, structurally incompatible OmniNote-handoff emission paths (`omninote-handoff` vs. `omninote-bridge`), both used from the same component.
- OmniNote: `HandoffResourceType` vs. `LessonPackageResourceKind` — the same internal duplication pattern, independent of anything on the Command Center side.
- OmniNote: dead `TeachingToolsControlBar.swift`, superseded by `ClassroomToolbar.swift`'s `TeachingToolsMenuContent` but never removed.

---

## Validation

- `git status -sb` in `classroom-command-center`: clean except this new file (`docs/architecture/god-tier-recommendations.md`), on branch `phase-god-tier-audit`.
- `git status -sb` in `omninote`: clean, on branch `phase-god-tier-audit`, no files changed.
- No dependencies installed in either repo (Command Center's `npm run build` was run to verify the bundle-guard claim, using already-installed `node_modules` — no `npm install`/`npm ci` was run).
- No commits made in either repo.
- The pre-existing stash on `classroom-command-center` (`stash@{0}`, the WIP that was on `phase-16a-2-premium-teach-mode-polish` before this audit began) remains intact and unapplied.
