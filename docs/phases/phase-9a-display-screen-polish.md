# Phase 9A — Display and Screen Polish

Status: PASS  
Branch: `command-center-phase-9a-display-screen-polish`  
Base: `8bd7f7d` (Phase 8C Today Prep + Material Launcher)  
Date: 2026-07-25

## Goal

Improve projector readability, layout consistency, vibe-page navigation, fullscreen workflow, and display/control privacy without new major features or dependencies.

## Projector-Safe Design Rules

Defined in `src/styles/index.css` (CSS variables) and `src/lib/displayLayout.ts` (`DISPLAY_DESIGN`):

| Token | Rule |
|-------|------|
| Outer padding | `--board-safe-x` (4.5% display), `--board-safe-bottom` (5.5% display) |
| Max content width | `--display-max-content-width: 92%` |
| Screen title | ~42–64px via `--display-title-min/max` |
| Card title | ~28–40px via `--display-card-title-min/max` |
| Body text | ~22–30px via `--display-body-min/max` |
| Timer numerals | ~64–120px via `--display-timer-min/max` |
| Small labels | ≥18px (`DISPLAY_DESIGN.labelMinPx`) |
| Card gap | `--display-card-gap` (1–1.25rem) |
| Section gap | `--display-section-gap` |
| Card radius | `--display-card-radius: 1.5rem` |
| Max primary cards | 4 per screen (`DISPLAY_DESIGN.maxPrimaryCards`) |
| Safe line length | ~72 characters |
| Studio Canvas display | `.classroom-canvas-frame` centers content, max-width aligned |
| Reduced motion | `.vibe-page-transition` disabled under `prefers-reduced-motion` |

Consistency through shared tokens — not a rigid single template per screen.

## Initial Screen Audit (pre-change)

1. **Display shell:** `StudentDisplayShell` → `BoardWorkspace(studentDisplay)` → `BoardFrame` → `VibePageScreen` → `ClassroomCanvas`
2. **Screen families:** Nested vibe pages per class (Homeroom, Math, Reading, Writing, Science, Snack, Lunch, Ready Position, etc.)
3. **Layout patterns:** Studio-seeded widget geometry; legacy grid screens exist but are unused in live path
4. **Inconsistent spacing:** Voice level labels at 10px; mixed card padding across widgets
5. **Excessive density:** Homeroom Morning Arrival had do-now + materials competing at arrival
6. **Excessive empty space:** Ready Position and full-focus pages generally good
7. **Projector risks:** Small voice-level labels; bottom-edge crop on some projectors
8. **Mobile/tablet risks:** Teacher dock width; board collapses grids under 900px
9. **Fullscreen:** Not implemented before Phase 9A
10. **Reusable components:** `boardCardShell`, `displayFontRange`, `SmartTextCard`, `PageNavigation`, `ClassroomCanvas`

## Screen Audit Results

| Screen / page | Classification | Notes |
|---------------|----------------|-------|
| Morning Arrival | Hierarchy revision | Do Now hero only; materials moved to Silent Work |
| Homeroom (other pages) | Minor polish | Page nav + transitions |
| Math / Reading / Writing / History-Science | Minor polish | Existing widget cards + tokens |
| Snack / Lunch | Minor polish | Phase timer prominence preserved |
| Clean Up / Ready Position | Good as-is | Minimal checklist pattern |
| Studio Canvas classroom | Minor polish | Display framing wrapper |

## Homeroom Density Changes

- **Morning Arrival:** `full-focus` layout, `do-now` widget only
- **Silent Work:** `timer` + `materials` (materials deferred from arrival)
- Hierarchy: greeting/page title → Do Now → reminders on later pages → materials/timer on follow-on pages

## Vibe-Page Navigation

- **/control:** Previous/Next, page title, `N of M`, dot shortcuts, arrow keys (skipped while typing in inputs)
- **/display:** No navigation chrome; content only with subtle fade transition

## Fullscreen Behavior

- **/control:** Open Student Display, Open Display for Fullscreen, Copy Display Link — no forced fullscreen
- **/display:** Student-safe **Enter Fullscreen** button; graceful unavailable/denied messages; no state mutation

## Transitions

- Short fade + 6px vertical shift on vibe page change (display route)
- Disabled under `prefers-reduced-motion`

## Noise Widget

- `VoiceLevelWidget` display text enlarged; traffic-light position + text labels (color-independent)
- `NoiseStatusCard` remains teacher-only (not mounted on `/display`)
- Mic-unavailable: voice level `off` hides widget on display

## Mystery Student Display

- New `MysteryStudentActiveBadge` on `/display` when session status is `active`
- Does not expose identity, notes, or history
- `MysteryRevealStage` remains teacher-only on `/control`

## Tests

- `npm run test:display-polish` — 15 assertions
- E2E: `tests/e2e/display-polish.spec.ts`
- Updated studio-canvas E2E navigation helper

## Known Limitations

- Legacy per-screen components (`HomeroomScreen`, etc.) remain in repo but are not mounted
- Fullscreen cannot be triggered remotely from `/control` (browser security)
- Visual QA is automated for overflow; human projector pass still recommended
- Page widget geometry for existing persisted boards migrates on load; Morning Arrival seed changes apply to fresh/default workspaces

## Next Step

**Phase 9B — Morning Message Studio** (do not start in 9A)
