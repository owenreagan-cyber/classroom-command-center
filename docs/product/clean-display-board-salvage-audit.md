# Clean Display Board — Salvage Audit

> Phase: **DB-0** — repo-grounded classification of what to reuse from the old build.
> Classification: **Salvage directly** · **Salvage concept only** · **Do not reuse** · **Deferred**

## 0. How to read this

- **Salvage directly** = copy/import the code nearly as-is into the new lane (or keep it shared).
- **Salvage concept only** = the idea/model is right, but the coupling to the old hub/screen model means
  we reimplement a cleaner version in `src/features/board-lab/`.
- **Do not reuse** = the item embodies the clutter we're escaping, or is spike-only.
- **Deferred** = useful later, but not for the board lab.

---

## 1. `src/features/display-composer/` — the screen builder

| File | Verdict | Notes |
| --- | --- | --- |
| `types.ts` | **Salvage concept only** | `CanvasWidget` + `CanvasWidgetType` union is the right *shape*, but uses a stringly-typed `settings: Record<string, unknown>`. Rebuild as a discriminated `kind` + typed `config`. Position/size/layer/visible/locked fields carry over. |
| `displaySafe.ts` | **Salvage directly** | `toDisplaySafeScreen` is the canonical student-safe projection. Copy the pattern (strip `teacherNotes`/`updatedAt`/`version`, enforce `studentSafe`) for the board's `toBoardSafePage`. |
| `displaySafetyRules.ts` | **Salvage directly** | `DISPLAY_FORBIDDEN_KEYS`, `DISPLAY_FORBIDDEN_PHRASES`, `scanForForbiddenPhrases`, `hasForbiddenDisplayKeys` are pure and reusable as-is. |
| `readabilityChecks.ts` | **Salvage concept only** | `computeReadabilityWarnings` proves the "warn on too-long/dense" pattern. Reimplement for the object model (too-small text, low contrast, too-dense page). |
| `backgroundStyles.ts` | **Salvage concept only** | Gradient/solid token maps are reusable in spirit; new board needs the expanded wallpaper category model. |
| `screenPacks.ts` / `quickStartTemplates.ts` / `defaultScreens.ts` | **Do not reuse** | These encode the old screen-mode taxonomy (`arrival`/`workTime`/`lunch`/…) that the clean board is deliberately moving away from. |
| `aiProviderConfig.ts`, `aiProviderUsage.ts`, `aiProviderSettingsStore.ts`, `aiLessonMessage*`, `aiOutputValidator.ts`, `aiPrivacyScrubber.ts`, `httpLessonMessageProvider.ts`, `LessonMessageGeneratorPanel.tsx` | **Deferred** | AI lesson-message generation is out of scope for DB-0 and DB-1; revisit later. |
| `DisplayComposerOverlay.tsx`, `DisplayComposerPanel.tsx`, `DisplayScreenRenderer.tsx`, `displayComposerStore.ts`, `displayComposerLogic.ts` | **Do not reuse** | These are the old composer UI/store. The new board lab must not import them. |
| `elements/ClockBlock.tsx`, `elements/TimerSlot.tsx`, `elements/MaterialsCardView.tsx`, `elements/ChecklistCardView.tsx`, `HundredBoardDisplayWidget.tsx`, `WidgetDisplayOverlay.tsx` | **Salvage concept only** | Individual widget renderers are useful references for clock/timer rendering, but they're bound to the old screen model. Rebuild clean widget renderers. |

## 2. `src/features/display-studio/` — the editor

| File | Verdict | Notes |
| --- | --- | --- |
| `widgetRegistry.ts` | **Salvage concept only** | `WIDGET_REGISTRY` (typed config with `studentSafe` flag) is the right pattern for a widget catalog. But it's tied to `CanvasWidgetType`. Rebuild a `BoardWidgetKind` registry with only the v1 widgets (clock, timer, routine timer, spotify). |
| `displayStudioTypes.ts` | **Do not reuse** | Only holds inspector section ids — thin and hub-specific. |
| `DisplayStudioCanvas.tsx`, `DisplayStudio.tsx`, `DisplayStudioShell.tsx` | **Do not reuse** | The old studio shell is part of the clutter. The board editor is a fresh, simpler surface. |
| `DisplayStudioInspector.tsx` | **Salvage concept only** | The "inspector only when needed" idea is exactly the target; rebuild a leaner inspector for board objects. |
| `DisplayStudioTemplatePicker.tsx`, `DisplayStudioThemePicker.tsx`, `DisplayStudioThumbnailRail.tsx`, `DisplayStudioQuickStart.tsx`, `templateCategories.ts`, `themeRegistry.ts` | **Do not reuse** | Template/theme picker complexity is what made the old studio feel heavy. Not in v1. |
| `studioWidgets.ts`, `WidgetTimerRenderers.tsx`, `WidgetMiscRenderers.tsx`, `WidgetEngagementRenderers.tsx`, `WidgetCanvasCard.tsx`, `WidgetCardShell.tsx`, `DisplayStudioPresenter.tsx`, `DisplayStudioWidgetLibrary.tsx`, `displayStudioContext.tsx`, `displayStudioUIContext.ts`, `useDisplayStudioUI.ts`, `DisplayStudioCommandBar.tsx` | **Salvage concept only** | Useful patterns, but tightly coupled to the old widget/engagement sprawl. Rebuild the minimal set. |

## 3. `src/features/presentation-hub/` — the current /control home

| File | Verdict | Notes |
| --- | --- | --- |
| `PresentationHub.tsx` | **Do not reuse** | This is the hub the user found cluttered. The board lab replaces it, not refines it. |
| `presentationHubLogic.ts` | **Salvage concept only** | `resolvePresentationStatus` / `isScreenLive` "live vs ready vs blanked" idea is worth keeping conceptually (present vs. edit state), but the send/blank/clear mechanics are hub-specific. |

## 4. `src/features/classroom-atmosphere/` — music (Spotify Level 1)

| File | Verdict | Notes |
| --- | --- | --- |
| `types.ts` | **Salvage concept only** | `MusicMode` taxonomy and `ClassroomPlaylist` shape are good; extend for Level 2 (playlist URI instead of embed URI). |
| `playlists.ts` | **Salvage concept only** | `CLASSROOM_PLAYLISTS` curation + `schoolSafe` flag carry over; replace embed URIs with Spotify playlist URIs for Web API playback. |
| `SpotifyProvider.ts` | **Do not reuse** | Level 1 embed provider — no OAuth, no real playback control. Superseded by Level 2 architecture. |
| `SpotifyEmbedPlayer.tsx` | **Do not reuse** | iframe embed. Replaced by Web Playback SDK / Connect. |
| `atmosphereStore.ts` | **Salvage concept only** | The `showOnDisplay` teacher/student split and `getDisplayMusicLabel` student-safe label are reusable ideas; the state itself is Level 1. |
| `MusicDisplayIndicator.tsx`, `ClassroomAtmospherePanel.tsx`, `tests.ts` | **Salvage concept only / Do not reuse** | Panel is old UI; tests validate Level 1 only. |

## 5. Timers

| File | Verdict | Notes |
| --- | --- | --- |
| `src/data/timerTypes.ts` | **Salvage directly** | `TimerStatus`, `SimpleTimerState`, `PhaseTimerState`, `TaskTimerState`, `RoutineTimerState` are clean, decoupled types. Reuse for the board's timer/routine widgets. |
| `src/data/timerDefaults.ts`, `src/data/timerTypes.ts` presets | **Salvage directly** | Timer presets (2/5/10/15/20 min) and default durations are reusable. |
| `src/store/timerStore.ts` | **Salvage concept only** | Large (42k) store bound to screen ids and many timer families. The board only needs simple + routine timers; extract the relevant logic, don't import the whole store. |
| `src/store/timerRecovery.ts` | **Salvage concept only** | Recovery-on-hydrate pattern is valuable; reimplement for the board's timer widgets. |
| `src/lib/timerFormat.ts` | **Salvage directly** | `formatTimerMs` / `minutesToMs` are pure and reusable. |
| `src/lib/routineEngine.ts` | **Salvage concept only** | The routine timeline engine (`getRoutineTimeline`, `buildManualRoutineControl`, etc.) is solid but coupled to `routineSchedule`/`routineTypes` screen model. Reimplement a lean version for `RoutineTimer` + `RoutineTimerSchedule`. |
| `src/data/routineTypes.ts`, `src/data/routineSchedule.ts` | **Salvage concept only** | `RoutinePhaseDefinition` / `RoutineSchedule` concepts carry over; decouple from `ScreenId`/`VibePageId`/curriculum tracks. |

## 6. Wallpaper / backgrounds

| File | Verdict | Notes |
| --- | --- | --- |
| `src/lib/wallpaperRegistry.ts` | **Salvage concept only** | `WallpaperMetadata` + `BUILT_IN_WALLPAPERS` is the strongest wallpaper starting point, but built-in only and missing the expanded school/subject/seasonal/holiday/weather/mood categories and the source/query/result split. Extend into the new model. |
| `src/data/backgroundAssets.ts` | **Do not reuse** | Bound to legacy screen ids (`homeroom`, `math`, `snack`, …) and Canva exports. The new library replaces this. |

## 7. Display safety guards & tests

| File | Verdict | Notes |
| --- | --- | --- |
| `scripts/test-display-import-guard.sh` | **Salvage directly** | Keep enforcing the engine boundary; add `/board-lab` to the protected list in a later phase. |
| `scripts/test-display-bundle-guard.sh` | **Salvage directly** | Keep; verifies tldraw stays isolated to the spike chunk. |
| `src/lib/display-studio-tests.ts` | **Salvage concept only** | Executable regression tests are the right approach; add board-lab equivalents when the board exists. |
| `scripts/test-display-studio.sh`, `scripts/test-display-composer.sh` | **Do not reuse (keep running)** | These validate the old modules; keep them green for now but don't extend them for the board. |

## 8. Routing shell

| File | Verdict | Notes |
| --- | --- | --- |
| `src/app/appRoute.ts`, `useAppRoute.ts`, `RootRedirect.tsx` | **Salvage directly** | The pathname→route pattern is clean. Add a `boardLab` route entry without making it the default. |
| `src/app/appRouteShell.ts` | **Salvage concept only** | The "teacher chrome only on control, read-only on display" idea carries over to `/board-lab/present` vs `/board-lab/edit`. |
| `src/app/AppShell.tsx`, `TeacherControlShell.tsx`, `StudentDisplayShell.tsx` | **Do not reuse (for the board)** | Old shells. The board lab mounts its own isolated shell; don't wire it through these. |
| `src/features/canvas-spike/` | **Do not reuse** | tldraw spike — explicitly deferred (no tldraw/Konva migration now). |

## 9. Summary table

| Area | Salvage directly | Concept only | Do not reuse | Deferred |
| --- | --- | --- | --- | --- |
| display-composer | `displaySafe.ts`, `displaySafetyRules.ts` | `types.ts`, `readabilityChecks.ts`, `backgroundStyles.ts`, widget renderers | screen packs, defaults, composer UI/store, panels | AI lesson-message stack |
| display-studio | — | `widgetRegistry.ts`, `Inspector`, widget renderer patterns | studio shell/canvas, template/theme pickers | — |
| presentation-hub | — | `presentationHubLogic.ts` | `PresentationHub.tsx` | — |
| classroom-atmosphere | — | `types.ts`, `playlists.ts`, `atmosphereStore.ts` | `SpotifyProvider.ts`, `SpotifyEmbedPlayer.tsx`, panel | — |
| timers | `timerTypes.ts`, `timerDefaults.ts`, `timerFormat.ts` | `timerStore.ts`, `timerRecovery.ts`, `routineEngine.ts`, `routineTypes.ts`, `routineSchedule.ts` | — | — |
| wallpaper | — | `wallpaperRegistry.ts` | `backgroundAssets.ts` | wallpaper fetcher |
| safety/tests | import guard, bundle guard | `display-studio-tests.ts` | old display test scripts (keep green, don't extend) | — |
| routing | `appRoute.ts`, `useAppRoute.ts`, `RootRedirect.tsx` | `appRouteShell.ts` | `AppShell.tsx`, control/display shells, canvas-spike | tldraw/Konva |

## 10. Guiding principle

**Copy concepts, don't extend the old module graph.** The new `board-lab` must not import from
`display-composer`, `display-studio`, or `presentation-hub`. Where a pattern is proven (safety
projection, forbidden-key scan, timer types, wallpaper metadata), lift the *pure, decoupled* parts into
shared locations or reimplement them cleanly.
