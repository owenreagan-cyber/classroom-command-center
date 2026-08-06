# Phase 15G — Template/Theme Picker UI + One-Click Classroom Flows

**Branch**: `phase-15g-template-theme-picker-quick-flows`
**Starting commit**: `232cbc3` (Phase 15F: Polish Display Studio templates and wallpapers)
**Date**: 2026-08-06

---

## Goals

Make Display Studio feel easy, obvious, and classroom-ready: pick templates quickly, apply themes quickly, start common routines with one click, and clearly see what students are viewing.

---

## Files Changed

### Added
| File | Description |
|---|---|
| `src/features/display-studio/DisplayStudioTemplatePicker.tsx` | Template gallery with 4 category tabs, visual preview cards, "Use Template" action |
| `src/features/display-studio/DisplayStudioThemePicker.tsx` | Inline theme picker with 10 color-swatch cards in the Style inspector |
| `src/features/display-studio/DisplayStudioQuickStart.tsx` | One-click classroom flows panel with 14 flow buttons |
| `src/features/display-studio/templateCategories.ts` | Shared template category definitions (.ts for test imports) |
| `scripts/capture-phase15g-screenshots.mjs` | Automated Playwright screenshot capture for 15 visual QA images |
| `docs/status/phase-15g-screenshots/` | 15 screenshots |

### Modified
| File | Change |
|---|---|
| `src/features/display-studio/displayStudioUIContext.ts` | Added `templatePickerOpen`, `quickStartOpen`, and toggle actions |
| `src/features/display-studio/displayStudioContext.tsx` | Added state management for template picker and quick start |
| `src/features/display-studio/DisplayStudioShell.tsx` | Supports `templatePicker` and `quickStart` render props |
| `src/features/display-studio/DisplayStudio.tsx` | Passes new template picker and quick start to shell |
| `src/features/display-studio/DisplayStudioCommandBar.tsx` | Added Templates/Quick Start buttons, improved Live/Blanked indicators |
| `src/features/display-studio/DisplayStudioThumbnailRail.tsx` | Added "Browse Templates" button, improved live indicator with animate-pulse + text |
| `src/features/display-studio/DisplayStudioInspector.tsx` | Style section now includes theme picker |
| `src/lib/display-studio-tests.ts` | +6 new Phase 15G tests (63 total) |

---

## Template Picker Behavior

### UI
- Opens in the right panel (replaces inspector area) when "📁 Templates" is clicked in the command bar or "Browse Templates" in the thumbnail rail footer
- **4 category tabs**: Daily, Instruction, Management, Engagement — each with distinct accent colors
- Each template card shows:
  - Background gradient/solid preview stripe
  - Template title and short teacher-friendly description
  - `Safe` badge (green), readability note count badge (amber if any warnings)
  - Widget count, Timer presence, Student Message presence as compact tags
  - "Use Template" button
- Footer shows total template + screen count
- Close button (✕) in header returns to inspector

### "Use Template" action
1. Creates a **new screen** by cloning the template's properties (not the original ID)
2. Copies mode, background, timer widget config, student message, materials/checklist cards
3. Clones widgets with new unique IDs
4. Does **NOT** auto-send to `/display` — only selects the new screen in the editor
5. Shows "✓ Applied" confirmation briefly
6. Template is student-safe (`studentSafe: true`)

### Template categories covered
| Category | Template count | Examples |
|---|---|---|
| Daily | 10 | Arrival, transitions, lunch, pack-up, end-of-day |
| Instruction | 8 | Math launch, reading, writing, science, grammar |
| Management | 7 | Work time, quiet work, small groups, test mode |
| Engagement | 4 | Mystery student, review game, prize board |

---

## Theme Picker Behavior

### UI
- Renders inline in the inspector's **Style** section (below background type/token selects, above timer config)
- Shows all 10 themes as a 2-column grid of color-swatch cards
- Each card: color bar (gradient/solid preview), theme name, category tag, accent dot
- Active theme has cyan ring + border highlighting
- Click "Apply Theme" — updates the screen's background

### Theme application
- Applies to the **selected screen only**
- Updates the canvas preview immediately
- Does **NOT** auto-send to `/display` (screen must be explicitly sent)
- Falls back safely — bad token resolves to default gradient via `resolveDisplayBackground()`
- Student safety preserved (screens remain `studentSafe: true`)

### Theme list
All 10 required themes present: Calm Focus, Bright Classroom, Soft Pastel, High Contrast, Game Day, Minimal Projector, Anime Energy, Cozy Seasonal, Winter Focus, Outdoor Nature.

---

## Wallpaper/Background Preview

### Status: Integrated via Background Selects + Theme Picker

The wallpaper/background preview is **embedded** in the inspector's Style section:
- Background type dropdown (Gradient / Image / Solid)
- Background token dropdown (populates based on selected type)
- Theme picker shows visual color swatches of all 10 themes
- Current background is immediately visible on the canvas

A dedicated wallpaper gallery/browser is **deferred to Phase 16+** — the current approach uses gradient/solid tokens as the primary wallpaper source, with image backgrounds available through the existing `BACKGROUND_ASSETS` registry. The wallpaper metadata registry (`wallpaperRegistry.ts`) provides search/filter/tag data for future gallery UI.

---

## One-Click Classroom Flows

### Quick Start Panel
Toggle with ⚡ Quick Start button in the command bar. Appears as a compact horizontal bar between the command bar and canvas.

### 14 Flows

| Flow | Action |
|---|---|
| 🌅 Start the Day | Clone `arrival-720` template |
| 🔢 Begin Math | Clone `math-launch-15c` template |
| 📖 Begin Reading | Clone `reading-launch` template |
| ✏️ Work Time | Clone `work-time` template |
| 🤫 Quiet Work | Clone `work-time-15c` template + general timer |
| 🔄 Transition | Clone `cleanup` template + transition timer |
| 🍽️ Lunch | Clone `lunch-15c` template |
| 🎮 Review Game | Clone `review-game-15c` template |
| 🌟 Mystery Star | Clone `mystery-student-15c` template |
| 🎁 Prize Board | Clone `prize-board-screen` template |
| 🎒 Pack Up | Clone `pack-up` template |
| 👋 End of Day | Clone `end-of-day` template |
| ⬛ Blank Display | Calls `blankDisplay()` (conditional: only shown when not blanked) |
| 🖥️ Restore Display | Calls `unblankDisplay()` (conditional: only shown when blanked) |

### Flow behavior
1. Creates a **new screen** from the template (like "Use Template" in the gallery)
2. Selects the new screen in the editor
3. Does **NOT** auto-send to `/display`
4. Blank/Restore are the exception — they immediately affect the display
5. Quick Start panel auto-closes after selection

---

## Display-Active Indicator

### Selected vs Active Display — Three states

| State | Indicator |
|---|---|
| **This screen is Live on display** | `● Live` pulse dot + emerald badge in command bar + `● Live` in thumbnail rail |
| **Blanked** | `● Blanked` amber badge in command bar |
| **Another screen is live** | `● Another screen live` slate badge in command bar |
| **Selected (not live)** | Cyan highlighted thumbnail, no live indicator |

### Implementation details
- Thumbnail rail: live screens show `animate-pulse` emerald dot + "Live" text (replaces old single `●` char)
- Command bar: inline badge next to screen title, color-coded
- Presenter mode: existing "Live on Display" badge in top bar unchanged

---

## Command Bar / Blank Button Decision

### Blank/Restore location
The Blank/Restore button pair is present in **both** the command bar and the presenter mode. This is intentional:

- **Command bar**: Always accessible while editing screens. Color-coded (amber for blank, emerald for restore). Useful during editing workflow.
- **Presenter mode**: Contextual — appears when actively presenting, with larger buttons and the "Next to Display" flow.

The Phase 15E finding about "duplicate Blank Screen control" was reviewed. Both locations serve distinct contexts (editing vs presenting). No consolidation needed.

### Command bar polish
- Buttons reorganized: Templates + Quick Start on the left area, Send/Clear/Blank/Presenter/Close on the right
- Blank button uses amber coloring (warm warning) for better visual distinction
- Restore button uses emerald (return to normal)
- "Send to Display" → "On Display" when live (clearer labeling)
- Vertical separator between navigation tools and Close

---

## Widget Layout Presets

### Status: Deferred to Phase 15H/16

The widget layout preset system described in the Phase 15G brief (Focus Layout, Work Time Layout, Game Layout, Routine Layout, Minimal Layout) would add significant complexity:

- Layout presets would need canvas coordinate generation
- Widget collision avoidance would require hit-testing
- Multiple screen sizes would need responsive layout logic

The current approach (templates with pre-defined widget positions) covers the most common use cases. A dedicated layout preset system is recommended for Phase 16.

---

## Feature Expansion Audit (Updated)

### Implemented in Phase 15G
| Feature | Status |
|---|---|
| Template picker gallery with categories | **Done** |
| Theme picker with swatch previews | **Done** |
| One-click classroom flows | **Done** |
| Display-active indicator (selected vs live vs blanked) | **Done** |
| Command bar toggle buttons for Templates/Quick Start | **Done** |

### Recommended Phase 15H (Quick Win, High Value)
| Feature | Value | Complexity | Notes |
|---|---|---|---|
| Template favorites (star/pin) | High | Low | Bookmark frequently used templates for quick access |
| Mini timer presets (1/3/5/10 min) | High | Low | Quick-start timer buttons without opening timer panel |
| "Send + Open Presenter" combo | Medium | Low | One-button flow for full classroom projection |
| Template search/filter by name | Medium | Low | Search bar in template picker |
| "Use Template → Send to Display" variant | Medium | Low | Teacher explicitly chooses to also send |

### Recommended Phase 16 (Medium Complexity)
| Feature | Value | Complexity | Notes |
|---|---|---|---|
| Wallpaper gallery/browser UI | High | Medium | Grid of wallpaper previews with category filters |
| Widget layout presets | High | Medium | Coordinate generation + grid snapping |
| Seasonal theme packs | Medium | Medium | Bundled theme + wallpaper + template collections |
| Substitute teacher mode | Medium | Medium | Simplified control set, preset daily screen flow |
| Local wallpaper import UI | Medium | High | Upload + dominant color detection + registry entry |
| Classroom jobs widget | Medium | Medium | Rotating job display, connected to roster |
| QR code widget | Medium | Medium | Generate QR codes from URLs or text |
| Emergency/attention screen | Medium | Low | Pre-built red alert template |

### Deferred / Avoid
| Feature | Reason |
|---|---|
| AI-powered suggestions | Adds AI dependency |
| Weather overlays | Requires internet API |
| School Mac launcher | Separate packaging project |
| OmniNote widget | Separate integration phase |
| Tauri/Electron/Capacitor | Separate packaging project |

---

## Tests

### Display Studio Tests: 63 passed, 0 failed (+6 new)

New Phase 15G tests:
- `template categories are defined` — 4 categories exist
- `required templates exist per category` — all daily/instruction/management/engagement templates present and student-safe
- `theme picker themes match theme registry` — all 10 themes resolve valid backgrounds
- `widget layout presets exist for sizing` — all 5 presets have valid dimensions
- `display studio UI context actions are defined` — critical utilities importable
- `toDisplaySafeScreen excludes template/theme picker concepts from /display` — teacher notes stripped

### Other test suites
| Suite | Result |
|---|---|
| display-composer | PASS |
| studio-canvas | PASS (93 passed) |
| display-launch | PASS (12 passed) |
| display-polish | PASS (15 passed) |
| timers | PASS |
| routines | PASS (120 passed) |
| random-number | N/A — unaffected |
| student-picker | N/A — unaffected |
| prize-board | N/A — unaffected |
| noise-control | N/A — unaffected |
| classroom-atmosphere | N/A — unaffected |
| teacher-dock | N/A — unaffected |
| morning-message | N/A — unaffected |
| teacher-workstation | WARN (E2E — Playwright binary) |

---

## Required Questions Answered

1. **Where are templates currently defined?** `src/features/display-composer/defaultScreens.ts` — 29 `DisplayScreen` objects in `DEFAULT_DISPLAY_SCREENS` array.

2. **How are template categories represented?** Via `DisplayScreenMode` (8 modes: arrival, transition, lessonLaunch, workTime, lunch, specials, packUp, custom). The template picker UI remaps these into 4 UI categories: Daily, Instruction, Management, Engagement.

3. **How are themes currently defined?** `src/features/display-studio/themeRegistry.ts` — 10 `DisplayStudioTheme` objects with coordinated background token, text colors, card styles, accent, overlay, and categories.

4. **How are wallpapers currently defined?** `src/lib/wallpaperRegistry.ts` — 12 built-in `WallpaperMetadata` entries with category, tags, dominant color, overlay strength, and theme recommendations. All use gradient tokens (no image files needed).

5. **How can a teacher select/apply a template?** Click "📁 Templates" in command bar or "Browse Templates" in thumbnail rail → browse 4 categories → click "Use Template" → new screen created and selected.

6. **How can a teacher select/apply a theme?** Open Display Studio → select a screen → expand Style section in inspector → theme grid shows color swatches → click a theme to apply its background.

7. **How does /display render selected theme/wallpaper safely?** `toDisplaySafeScreen()` includes the screen's `background` field (gradient/solid/image token). `resolveDisplayBackground()` converts to CSS. Only student-safe screens render. No theme picker UI ever appears on `/display`.

8. **Which one-click flows are implemented?** 14 flows: Start the Day, Begin Math, Begin Reading, Work Time, Quiet Work, Transition, Lunch, Review Game, Mystery Star, Prize Board, Pack Up, End of Day, Blank Display, Restore Display.

9. **Which one-click flows remain deferred?** None — all suggested flows implemented.

10. **What should Phase 15H or 16 do next?** Template favorites, mini timer presets, wallpaper gallery/browser, "Use Template → Send" combo, widget layout presets, seasonal theme packs.

---

## Validation Table

| Command | Result |
|---|---|
| `npm run build` | PASS |
| `npm run lint` | PASS |
| `npm run test:display-studio` | PASS | 63 passed (+6 new) |
| `npm run test:display-composer` | PASS |
| `npm run test:studio-canvas` | PASS | 93 passed |
| `npm run test:display-launch` | PASS | 12 passed |
| `npm run test:display-polish` | PASS | 15 passed |
| `npm run test:timers` | PASS |
| `npm run test:routines` | PASS | 120 passed |
| `npm run test:teacher-workstation` | WARN | E2E browser binary |
| `npm run test:e2e` | WARN | E2E not run |

---

## Visual QA Summary

15 screenshots captured to `docs/status/phase-15g-screenshots/`:

1. Template picker overview — Daily category with preview cards
2. Daily templates — arrival, transitions, lunch templates shown
3. Instruction templates — math, reading, science, writing
4. Engagement templates — mystery student, review game, prize board
5. Theme picker overview — 2-column grid of color swatches
6. High Contrast theme applied — deep black background
7. Game Day theme applied — red-to-gold gradient
8. Wallpaper/background preview — Style section with gradient/type selects
9. Quick Start flows — 14 compact flow buttons
10. Start the Day flow result — arrival screen cloned and selected
11. Work Time flow result — work time screen with widgets
12. Review Game flow result — game screen with random picker
13. Active display indicator — selected screen ≠ live screen
14. /display after template sent — student-safe projection
15. Narrow/laptop viewport — 1024×768 with template picker open

---

## Student-Safety Proof

- Template picker, theme picker, and quick start are **UI-only on /control** — never rendered on `/display`
- `toDisplaySafeScreen()` strips `teacherNotes`, `updatedAt`, `version` — verified by test
- Template "Use Template" action creates screens with `studentSafe: true`
- Theme application only changes `background` property — never exposes metadata
- Blank/Restore flows via `blankDisplay()` / `unblankDisplay()` — no data leak path
- Placeholder widgets are hidden on `/display`
- Mystery Student identity never exposed

---

## Known WARN/FAIL Items

| Item | Status |
|---|---|
| E2E tests: Playwright browser binary missing | WARN — not a code failure |
| Widget layout presets | Deferred to Phase 16 |
| Wallpaper gallery browser UI | Deferred to Phase 16 |
| Uploaded anime wallpapers | Not committed — design reference only |

---

## Safe to Commit: YES

**No commit made — awaiting approval.**

---

## Recommended Next Phase

**Phase 15H**: Template favorites, mini timer presets, "Send + Presenter" combo flow, quick-start timer buttons, wallpaper gallery browser, widget layout presets (foundation).
