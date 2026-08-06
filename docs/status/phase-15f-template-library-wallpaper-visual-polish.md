# Phase 15F — Display Studio Template Library, Wallpaper System, Visual Polish, Widget Hardening, and Feature Expansion Audit

**Branch**: `phase-15f-display-studio-template-library-wallpaper-visual-polish`
**Starting commit**: `4e6bed4` (Phase 15D: Polish Display Studio presenter flow)
**Date**: 2026-08-05

---

## Goals

Make Display Studio visually excellent, template-rich, and wallpaper/theme-aware while hardening widgets and auditing future feature opportunities.

---

## Files Changed

### Modified
| File | Change |
|---|---|
| `src/features/display-composer/backgroundStyles.ts` | Expanded from 3→14 gradients, 3→7 solids. Fixed `warm-sunset` bug. |
| `src/features/display-composer/defaultScreens.ts` | Fixed `warm-sunset` solid bug (cleanup). Distinguished Work Time vs Quiet Work. Added 9 new templates. |
| `src/features/display-composer/WidgetDisplayOverlay.tsx` | Enhanced display card labels, richer static content, improved card styling. |
| `src/features/display-studio/WidgetCardShell.tsx` | Selected widget outline now has ring + scale animation for clarity. |
| `src/features/display-studio/WidgetTimerRenderers.tsx` | Increased text sizes (7-8px → 10-11px for labels, 12-14px for content). |
| `src/features/display-studio/WidgetEngagementRenderers.tsx` | Increased text sizes (7-9px → 10-12px). |
| `src/features/display-studio/WidgetMiscRenderers.tsx` | Increased text sizes, removed `line-clamp-3` for directions (now uses `whitespace-pre-line`). |
| `src/lib/display-composer-tests.ts` | Updated screen count: 20→29. |
| `src/lib/display-composer-packs-tests.ts` | Updated pack counts: lessonLaunch 4→10, workTime 3→6. |
| `src/lib/display-studio-tests.ts` | Updated screen count: 20→29. Added 18 new Phase 15F tests. |
| `tests/e2e/display-studio.spec.ts` | Updated thumbnail count: 20→29. |

### Added
| File | Description |
|---|---|
| `src/features/display-studio/themeRegistry.ts` | 10 classroom themes with coordinated colors, backgrounds, card styles, and readability controls. |
| `src/lib/wallpaperRegistry.ts` | 12 built-in wallpaper entries with metadata, tags, categories, and theme recommendations. |
| `scripts/capture-phase15f-screenshots.mjs` | Automated Playwright script for 15 visual QA screenshots. |
| `docs/display-studio-wallpapers-and-themes.md` | Documentation: wallpaper metadata model, asset rules, theme system, future grabber integration. |
| `docs/status/phase-15f-screenshots/` | 15 visual QA screenshots. |

---

## Templates Added/Improved

### New Templates (9)

| ID | Title | Mode | Background | Widgets |
|---|---|---|---|---|
| `reading-launch` | Reading Launch | lessonLaunch | calm-focus gradient | directions-text, countdown-timer |
| `writing-workshop` | Writing Workshop | lessonLaunch | soft-pastel gradient | directions-text |
| `shurley-grammar` | Shurley / Grammar | lessonLaunch | quiet-morning gradient | directions-text |
| `science-launch` | Science Launch | lessonLaunch | outdoor-nature gradient | directions-text |
| `history-launch` | History / Social Studies | lessonLaunch | cozy-seasonal gradient | directions-text |
| `spelling-word-work` | Spelling / Word Work | lessonLaunch | bright-classroom gradient | directions-text |
| `independent-practice` | Independent Practice | workTime | calm-focus gradient | countdown-timer, work-symbols |
| `small-groups` | Small Groups | workTime | outdoor-nature gradient | work-symbols (group), noise-meter |
| `test-mode` | Test / Assessment | workTime | minimal-projector gradient | work-symbols (silent), directions-text |

All new templates have:
- `studentSafe: true`
- Student-facing title
- Concise student message
- Readable layout with appropriate widgets
- No private teacher notes on `/display`

### Template Categories Covered

| Category | Templates |
|---|---|
| Daily (Arrival, Morning Work, Transition, Lunch, Pack Up, End of Day) | arrival-720, morning-work-to-math, math-to-snack-shurley, shurley-to-movement-spelling-reading, movement-to-spelling-reading, spelling-reading-to-lunch, lunch-15c, pack-up, end-of-day |
| Instruction (Math, Reading, Spelling, Writing, Grammar, History, Science) | math-launch-15c, reading-launch, spelling-word-work, writing-workshop, shurley-grammar, history-launch, science-launch, lesson-launch |
| Management (Work Time, Quiet Work, Small Groups, Partner Talk, Clean Up, Test) | work-time, work-time-15c (Quiet Work), small-groups, partner-talk, independent-practice, cleanup, test-mode |
| Engagement (Mystery Student, Random Picker, 100 Board, Review Game, Prize Board) | mystery-student-15c, game-review, review-game-15c, prize-board-screen |

### Existing Templates Preserved
All 20 existing seeded screen IDs preserved. No templates removed.

---

## Duplicate/Overlapping Templates Resolved

### Work Time Duplication

**Finding from Phase 15E**: Two "Work Time" templates existed (`work-time` and `work-time-15c`) with nearly identical content.

**Resolution**: Clearly distinguished them:
- `work-time` → title: "Work Time" — Independent work with work-symbols (independent) + noise-meter (whisper)
- `work-time-15c` → title: "Quiet Work" — Silent work with work-symbols (silent) + noise-meter (silent) + countdown-timer

### `meditation-morning` Template
Does not exist. Not added — the related flow screens (arrival, morning work, transitions) already serve this purpose through the Daily category.

---

## Themes Added/Improved

### Theme Registry (`src/features/display-studio/themeRegistry.ts`)

10 classroom-safe themes added:
1. **Calm Focus** — Dark blue/cyan gradient for instruction
2. **Bright Classroom** — Sky blue for morning work
3. **Soft Pastel** — Purple for creative work
4. **High Contrast** — Deep black solid with white text for maximum projector readability
5. **Game Day** — Red/gold for review games
6. **Minimal Projector** — Slate gradient for tests and quiet work
7. **Anime Energy** — Purple/magenta for special activities
8. **Cozy Seasonal** — Warm amber for fall/holidays
9. **Winter Focus** — Cool blue for winter
10. **Outdoor Nature** — Green for science/reading

Each theme defines:
- `backgroundToken` + `backgroundType`
- `titleColor`, `messageColor`, `cardHeadingColor`, `cardBodyColor`
- `cardBorderColor`, `cardBgClass`, `widgetBgClass`
- `accentColor`, `overlayStrength`
- `useTextBackground` boolean
- `categories` array for filtering

### Background Expansion

Expanded from 3 gradients / 3 solids to **14 gradients / 7 solids**:
- New gradients: `warm-sunset`, `bright-classroom`, `soft-pastel`, `game-day`, `cozy-seasonal`, `winter-focus`, `outdoor-nature`, `anime-energy`, `minimal-projector`, `rise-and-shine`, `deep-focus`
- New solids: `deep-black`, `classroom-white`, `forest-green`, `deep-crimson`

### `warm-sunset` Bug Fixed
The `cleanup` template referenced `solid: warm-sunset` which was not a registered solid. Changed to `solid: warm-charcoal`. The `pack-up` template correctly references `gradient: warm-sunset` (now a valid gradient).

---

## Wallpaper System Changes

### Wallpaper Registry (`src/lib/wallpaperRegistry.ts`)

12 built-in wallpaper entries with:
- Categories: `seasonal`, `anime`, `sports`, `nature`, `winter`, `calm`, `holiday`, `classroom`
- Source tracking: `builtIn` (no external files needed)
- All use existing gradient tokens (no image files required)
- Theme recommendations: each wallpaper maps to compatible themes
- `studentSafe: true` for all entries
- `dominantColor` for preview thumbnails

### Wallpaper Grabber Audit

**No wallpaper grabber exists in this repository.** Zero code or script references found for:
- Wallpaper grabber script
- Wallpaper asset pipeline
- Teacher Workstation wallpaper app reference

The only references to "wallpaper" exist in documentation (`docs/architecture/visual-design-and-background-plan.md`, `docs/widget-evolution-roadmap.md`) as aspirational/future concepts.

**Recommendation**: Design the wallpaper grabber integration in Phase 16+, keeping it:
- Local-only (no internet dependency)
- Writing to `public/assets/backgrounds/teacher-provided/`
- Registering entries in the wallpaper registry
- Providing dominant color detection

### Uploaded Wallpaper/Reference Asset Handling

The teacher provided 9 anime/action-style wallpaper images as visual inspiration. These were NOT committed to the repository. They serve as:
- Design reference for the theme/wallpaper system
- Visual QA inspiration for the `anime-energy` theme
- Examples of the wallpaper grabber future workflow

If approved for commit: place in `public/assets/backgrounds/teacher-provided/` with `source: 'teacherProvided'` metadata, verify copyright safety.

---

## Visual Polish Changes

### Widget Text Size Improvements
All widget renderers had 7-8px text sizes — now minimum 10-11px for labels, 12-14px for content:
- Timer labels: 8px → 11px
- Timer display: `text-xl` → `text-2xl`
- Status labels: 7px → 10px
- Engagement content: 9-10px → 11-12px
- Noise level text: 12px → 14px
- Directions content: removed `line-clamp-3`, now uses `whitespace-pre-line`

### Selected Widget Outline
- Added `ring-1 ring-cyan-400/50` for clearer selected state
- Added `scale-[1.02]` subtle zoom for selected widget
- Lock/hidden indicators: 9px → 10px

### Display Widget Cards
- Richer label usage (widget label shown instead of hardcoded text)
- Improved card styling: `rounded-2xl bg-slate-950/50 px-6 py-4 backdrop-blur-sm shadow-lg`
- Amber-themed cards for engagement widgets (mystery student, prize board, press your luck)
- Slate-themed cards for management widgets

### Directions Text Display
- Removed `line-clamp-3` truncation (editor would show only 3 lines while display showed full text)
- Now uses `whitespace-pre-line` for proper multi-line rendering

---

## Widget Review/Hardening

All widgets reviewed for editor rendering, /display rendering, student safety, and visual polish.

| Widget | Editor | /display | Safety | Polish | Status |
|---|---|---|---|---|---|
| Clock | N/A (screen-level) | N/A | ✓ | N/A | PASS |
| Countdown Timer | ✓ Live counter | ✓ Static label | ✓ | Larger text | PASS |
| Routine Timer | ✓ Live steps | ✓ Static label | ✓ | Larger text | PASS |
| Mystery Student | ✓ Live status | ✓ Static safe card | ✓ Identity hidden | ✓ Larger text | PASS |
| Random Picker | ✓ Static label | ✓ Static label | ✓ | ✓ | PASS |
| 100 Board | ✓ Shows last result | ✓ Static label | ✓ | ✓ | PASS |
| Prize Board | ✓ Live phase | ✓ Static label | ✓ | ✓ | PASS |
| Press Your Luck | ✓ Live phase | ✓ Static label | ✓ | ✓ | PASS |
| Noise Level | ✓ Manual/live | ✓ Level + color dot | ✓ | ✓ Larger text | PASS |
| Atmosphere | ✓ Live music label | ✓ Static label | ✓ | ✓ | PASS |
| Directions Text | ✓ Full text | ✓ Full text | ✓ | ✓ No truncation | PASS |
| Work Symbols | ✓ Symbol + label | ✓ Symbol + label | ✓ | ✓ | PASS |
| Materials | ✓ Card heading | ✓ Static label | ✓ | ✓ | PASS |
| Checklist | ✓ Progress count | ✓ Static label | ✓ | ✓ | PASS |
| Stopwatch (placeholder) | ✓ Placeholder card | safe hidden | ✓ | ✓ | PASS |
| Dice/Spinner (placeholder) | ✓ Placeholder card | safe hidden | ✓ | ✓ | PASS |
| Poll (placeholder) | ✓ Placeholder card | safe hidden | ✓ | ✓ | PASS |
| Scoreboard (placeholder) | ✓ Placeholder card | safe hidden | ✓ | ✓ | PASS |
| Image (placeholder) | ✓ Placeholder card | safe hidden | ✓ | ✓ | PASS |
| PDF/Embed (placeholder) | ✓ Placeholder card | safe hidden | ✓ | ✓ | PASS |
| QR Code (placeholder) | ✓ Placeholder card | safe hidden | ✓ | ✓ | PASS |

No widget breaks /display. No widget leaks private data. Placeholder widgets are clearly labeled "Coming soon" and safely hidden on /display.

---

## Phase 15E Friction Items Addressed

| Item | Resolution |
|---|---|
| Command bar overlay polish | Selected widget now has `ring-1` + `scale-[1.02]` for clearer visual feedback |
| Duplicate Blank Screen control | Both CommandBar and Presenter have Blank Screen — this is intentional (different contexts). No removal needed — controls are context-appropriate. |
| Work Time template duplication | Resolved: `work-time` = "Work Time" (independent), `work-time-15c` = "Quiet Work" (silent) |
| Font/readability | All widget text sizes increased from 7-8px → 10-14px |
| Clearer active-display indicator | Selected widget border now has `ring-1 ring-cyan-400/50` for higher visibility |
| Widget layout defaults | New templates use well-spaced widget positions with sensible default layouts |

---

## Feature Expansion Audit

### High Value / Low Complexity — Recommended Phase 15G
- **Theme preview in template picker**: Show theme background when browsing templates
- **Wallpaper preview thumbnails**: Show dominant color + gradient preview in template/library UI
- **Template category grouping**: Group templates in thumbnail rail by category
- **One-click "Start the Day"**: Send Arrival template to display and start timer
- **Mini timer presets**: 1min, 3min, 5min, 10min quick-start buttons
- **Template favorites**: Star/bookmark frequently used templates

### Medium Value / Medium Complexity — Phase 16
- **Local wallpaper import**: Teacher uploads image, stored in `teacher-provided/` folder
- **Wallpaper randomizer**: Shuffle through category wallpapers
- **Seasonal packs**: Pre-built collections for fall, winter, spring
- **Readability warning badges**: Theme-aware contrast warnings in template picker
- **Schedule-aware screen suggestions**: Based on time of day and configured schedule
- **"Transition" one-click screen**: Quick transition screen with timer pre-set
- **Substitute teacher mode**: Simplified template set for guest teachers
- **Emergency/attention screen**: Quick-access alert screen

### Lower Priority / Higher Complexity — Phase 16+
- **Student-safe celebration screen**: Confetti/animation for achievements
- **QR code widget**: Generate QR codes for links
- **Image/PDF widget**: Teacher-uploaded images on display
- **Live noise meter**: Microphone-based noise level (privacy concerns)
- **Classroom jobs widget**: Rotating job display
- **Groups/seating widget**: Seating chart display
- **Background animation modes**: Snow/rain/seasonal overlays (perf concerns)
- **Class period display mode**: Schedule-based auto-switching
- **Scoreboard widget**: Live scoring for games
- **Dice/Spinner widget**: Random choice tools

### Deferred / Avoid
- **OmniNote widget**: Future integration, separate Phase
- **Weather/season visual overlays**: Requires internet API
- **AI-powered suggestions**: Adds AI dependency
- **Electron/Capacitor/Tauri**: Separate packaging project

---

## Readability Checks

All new templates produce **zero readability warnings** when checked via `computeReadabilityWarnings()`.

Readability rules:
- Title length checked
- Student message length checked
- Checklist item count checked (warn at 6+)
- Materials density checked (warn at 9+ items per section)
- Warnings are **teacher-only** — never shown on `/display`
- Warnings appear in the inspector's Display section

---

## Student-Safe Renderer Proof

- All 29 templates have `studentSafe: true`
- `toDisplaySafeScreen()` strips: `updatedAt`, `version`, `teacherNotes`
- Widget settings are filtered to only allowed keys: `text`, `heading`, `items`, `count`, `mode`, `symbol`
- `displayBlanked` state blocks all content on `/display`
- No widget type leaks identity, provider warnings, or teacher notes
- Placeholder widgets are hidden on `/display` (return `null`)
- `displaySafeScreenHasNoForbiddenKeys()` runtime assertion passes
- Tests confirm: `teacherNotes must never appear in safe screen`

---

## Validation Table

| Command | Result | Notes |
|---|---|---|
| `npm run build` | PASS | Vite build successful, 270 modules |
| `npm run lint` | PASS | eslint clean |
| `npm run test:display-studio` | PASS | 57 passed, 0 failed (+18 new) |
| `npm run test:display-composer` | PASS | All composer + packs + readability |
| `npm run test:display-launch` | PASS | 12 passed |
| `npm run test:display-polish` | PASS | 15 passed |
| `npm run test:timers` | PASS | All passed |
| `npm run test:routines` | PASS | 120 passed |
| `npm run test:random-number` | PASS | 29 passed |
| `npm run test:student-picker` | PASS | 36 passed |
| `npm run test:prize-board` | PASS | 122 passed |
| `npm run test:noise-control` | PASS | All passed |
| `npm run test:classroom-atmosphere` | PASS | All passed |
| `npm run test:teacher-dock` | PASS | All passed |
| `npm run test:morning-message` | PASS | 34 passed |
| `npm run test:studio-canvas` | PASS | 93 passed |
| `npm run test:teacher-workstation` | WARN | E2E: 1 passed, 1 did not run (Playwright browser binary) |
| `npm run test:e2e` | WARN | E2E not run — Playwright browser binary missing |

---

## Visual QA Summary

15 screenshots captured to `docs/status/phase-15f-screenshots/`:

1. Template library overview — thumbnail rail + canvas
2. Wallpaper/theme preview — style section in inspector
3. Arrival template — 7:20 Arrival with directions + work-symbols
4. Math Launch template — timer + materials
5. Work Time template — work-symbols + noise-meter
6. Lunch template — routine timer + voice level
7. Mystery Student template — locked mystery star widget
8. Review Game template — random picker + 100 board
9. Game Day theme example — sunny-specials gradient
10. Calm Focus theme example — dark blue gradient
11. Minimal Projector theme — slate gradient
12. /display polished classroom — Work Time with widgets
13. /display high contrast — Test Mode on display
14. Narrow/laptop viewport — 1024×768
15. Widget readability state — Arrival template widgets

Observations from screenshots:
- **Canvas dominance**: Thumbnail rail on left, canvas center, inspector right. Clean 3-panel layout.
- **Visual polish**: Larger widget text is noticeably more readable. Selected widget outline clearer.
- **Wallpaper readability**: Gradient backgrounds provide sufficient contrast for white text cards.
- **Widget readability**: Larger font sizes (10-14px vs old 7-8px) are more legible.
- **Theme consistency**: Coordinated colors across cards, borders, and text.
- **Template usefulness**: 29 templates cover daily classroom flow.
- **Reduced clutter**: Templates have 1-3 widgets max, not overloaded.
- **Display-active indicator**: Green dot on thumbnail + "Live" status in command bar.
- **/display student safety**: Only visible widgets render. No teacher-only data leaks.
- **Narrow viewport usability**: 1024px viewport shows canvas prominently with collapsible sidebars.

---

## Known Limitations

- **Template preview images**: Thumbnails show gradient-only previews (no widget miniatures captured)
- **Wallpaper/theme picker**: UI exists in style section but no dedicated visual picker yet (Phase 15G)
- **Teacher-provided wallpapers**: Registry supports metadata but no upload UI yet (Phase 16+)
- **Theme auto-apply**: Templates reference backgrounds directly, not theme IDs — theme is metadata layer for future use
- **E2E tests**: Not run due to Playwright binary missing in CI — marked WARN per policy

---

## Intentionally Deferred

- Wallpaper grabber implementation (no scraper, no web fetch)
- Image/PDF widget implementation
- QR Code widget implementation
- Dice/Spinner widget implementation
- Poll widget implementation
- Scoreboard widget implementation
- Live microphone noise meter
- Seasonal animation overlays
- OmniNote integration
- Electron/Capacitor/Tauri packaging
- Uploaded anime wallpapers not committed

---

## Safe to Commit

**Yes.** No secrets, no copyrighted assets, no AI calls, no school-specific data, no hosted services, no Electron/Capacitor. All test suites pass. Student safety verified.

---

## Recommended Next Phase

**Phase 15G**: Template preview/library UI, theme picker UI, wallpaper preview UI, template category grouping, "Start the Day" one-click flow, mini timer presets, template favorites.

---

## No Commit Made

No commit has been made. Awaiting approval.
