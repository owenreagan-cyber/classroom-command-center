# Nested Vibe Pages Foundation

Status: implemented and validated
Date: 2026-07-12
Branch: `focused-vibe-pages-routine-engine`

## Architecture

The app has moved from a "one class = one crowded dashboard" model to a
"class → ordered vibe pages → slide-like presentation" model.

### Core Types (`src/data/types.ts`)

```
ClassWorkspace  →  ordered pages, active page id, navigation hints
VibePage        →  title, subtitle, primary message, supporting content,
                   layout preset, widgets, routine phase ids, visibility
VibePageId      →  union of ~33 stable string literal page IDs
PageLayoutPreset → centered-message, message-plus-timer, message-plus-materials,
                   split-content, full-focus, cleanup-checklist
PageWidget      →  id, type, x, y, width, height, zIndex, locked, visible,
                   snapRegion, contentRef (prepared for future drag/drop)
```

### Page Sequences (`src/data/pageSequences.ts`)

| Class | Pages |
|---|---|
| Homeroom | 5 — Morning Arrival, Silent Work, Clean Up for Math, Morning Message, Announcements |
| Math | 6 — Get Ready, Warm-Up, Lesson, Guided Practice, Independent Work, Wrap Up |
| Reading | 6 — Get Ready, Reading Focus, Random Reader (placeholder), Independent Reading, Response Prompt, Wrap Up |
| Snack | 2 — Quiet Snack, Silent Clean Up |
| Lunch | 4 — Quiet Lunch, Silent Chew, Quiet Lunch, Silent Clean Up |
| Homework | 3 — Copy Homework, Check Planner, Pack Materials |
| Pack Up | 3 — Pack Up, Ready Position, Dismissal |
| History/Science | 4 — Get Ready, Lesson Focus, Activity, Wrap Up |
| Spelling | 3 — Get Ready, Spelling Focus, Practice |
| Shurley/Writing | 4 — Get Ready, Writing Focus, Independent Work, Wrap Up |
| Social Studies | 1 — Lesson Focus |
| Assessment | 1 — Assessment Mode |
| Centers | 1 — Group Work |
| Recess | 1 — Recess |
| Ready Position | 1 — Ready Position |

### Navigation (`src/components/routines/PageNavigation.tsx`)

- **Previous / Next buttons** — large, teacher-accessible, keyboard-accessible
- **Current page title and count** — e.g. "2 of 6"
- **Page dots** — visible on medium+ screens, hidden in display mode for single-page
- **Classroom mode** — minimal, semi-transparent navigation
- **No forced page transitions** — routine engine may suggest next page; teacher must confirm
- **Edit mode** — always visible navigation with full dot controls
- **Display mode** — navigation is semi-transparent with hover reveal

### Screen Splits

Combined screens have been split into independent destinations:

| Legacy ID | Maps To |
|---|---|
| `snack-lunch` | `snack` (content preserved) |
| `homework-pack-up` / `homework-packup` | `homework` (content preserved) |

New independent destinations:
- `snack` — Quiet Snack + Silent Clean Up
- `lunch` — Quiet Lunch, Silent Chew, Quiet Lunch, Silent Clean Up
- `homework` — Copy Homework, Check Planner, Pack Materials
- `pack-up` — Pack Up, Ready Position, Dismissal
- `spelling` — Get Ready, Spelling Focus, Practice

### Routine Phase to Page Mapping

| Phase | Screen | Page |
|---|---|---|
| silent-work | homeroom | homeroom-silent-work |
| clean-up | homeroom | homeroom-clean-up-math |
| quiet-snack | snack | snack-quiet-snack |
| silent-clean-up | snack | snack-silent-clean-up |
| quiet-lunch-a | lunch | lunch-quiet-lunch-a |
| silent-chew | lunch | lunch-silent-chew |
| quiet-lunch-b | lunch | lunch-quiet-lunch-b |
| silent-clean-up-lunch | lunch | lunch-silent-clean-up |

### Block to Page Suggestions

| Block | Screen | Page |
|---|---|---|
| carpool-homeroom | homeroom | homeroom-morning-arrival |
| math | math | math-get-ready |
| snack | snack | snack-quiet-snack |
| lunch | lunch | lunch-quiet-lunch-a |
| reading | reading | reading-get-ready |
| history-science | science | history-science-get-ready |
| writing | writing | shurley-get-ready |
| spelling | spelling | spelling-get-ready |
| pack-up | pack-up | pack-up-pack-up |
| recess | recess | recess-play |

### Migration Behavior

The board store (`src/store/boardStore.ts`) normalizes legacy persisted state:

1. **Screen IDs**: `snack-lunch` → `snack`, `homework-packup` → `homework`
2. **Background IDs**: legacy combined IDs normalized to new split IDs
3. **Contents**: combined `SnackLunchContent` split into `SnackContent` + `LunchContent`
4. **Routine suggestions**: legacy page IDs like `carpool-checkout` → `recess-play`,
   `homeroom-arrival` → `homeroom-morning-arrival`
5. **Card visibility**: merged from legacy combined screens to new individual ones
6. **Class workspaces**: rebuilt from page sequence definitions on migration

### Basic Layout Model

- **Layout presets**: `centered-message`, `message-plus-timer`, `message-plus-materials`,
  `split-content`, `full-focus`, `cleanup-checklist`
- **In display mode**: each page renders as a clean slide showing `primaryMessage`,
  `subtitle`, and `supportingContent` in a layout appropriate to the preset
- **Edit mode**: the old dashboard-style grid remains for widget configuration
- **Widget position data** (`PageWidget.x/y/width/height/zIndex`) is prepared for future drag/drop
- **No full drag-and-drop UI** yet — a simple layout preset selector is acceptable

### Privacy Boundaries

The page model does not expose:
- Student observations
- Fairness history
- Mystery identities
- Private grouping exclusions
- Archived student records
- Teacher-private notes

Random Reader and Group Maker remain placeholders.

### Test Coverage

`npm run test:pages` — 148 tests covering:
1. Nested page ordering
2. Previous/next navigation
3. First-page previous behavior
4. Last-page next behavior
5. Persisted active page
6. Old single-screen state migration
7. Legacy snack-lunch migration
8. Legacy homework-pack-up migration
9. Routine phase to page mapping
10. No forced navigation
11. Current-page suggestion
12. Class-independent page state
13. Layout preset persistence
14. Projector-safe display model
15. No private data leakage
16. No fairness-history mutation
17. No Mystery-session mutation
18. Local Packet round-trip with new page state
19. Removed old screen IDs do not crash
20. Page ID uniqueness
21. Title/slide coverage for all sequences
22. Cross-workspace page lookup

### Limitations

- **Superseded by Studio Canvas Foundation** (see
  `docs/status/studio-canvas-foundation.md`): drag-and-drop, seeded
  per-preset widget geometry, snap-to-grid, alignment guides, lock/unlock,
  keyboard movement, undo/redo, reset-page-layout, and widget-based
  Classroom Mode rendering are now implemented. The two items below are
  no longer accurate as written — kept for historical context:
  - ~~Full drag-and-drop is not yet implemented~~ → implemented.
  - ~~Display mode slides show only primaryMessage/supportingContent~~ →
    Classroom Mode now renders full per-widget content via the persisted
    widget geometry (falls back to a single `message` widget carrying
    primaryMessage/supportingContent only for pages with no declared
    content widgets).
- **Tauri is not included** — no desktop/native wrapper.
- **Spotify is not included** — music launcher is a placeholder.
- **Group Maker is not implemented** — no group generation algorithm.
- **Random Reader is not implemented** — placeholder page exists.
- **Automatic class/page switching is not enabled** — teacher must navigate manually.
- **Layout preset selector** — still not exposed as a UI control; changing
  a page's `layoutPreset` requires editing `src/data/pageSequences.ts`.
