# DB-5A — Clean Board Classroom Template Packs

> Status: **COMPLETE**
> Phase: DB-5A — ready-to-use classroom template packs

## Purpose

Let a teacher create a polished classroom setup from a single template (Morning
Arrival, Math Workshop, Reading Block, Writing Block, Independent Work,
Assessment Mode, Cleanup, Dismissal). Choosing a template produces a coherent
board — background, theme/display mode, message card, timer preset, optional
Spotify placeholder, and a keep-awake recommendation — built entirely from
existing object types.

## Architecture

Template packs are **starting points, not hidden live state**. A template is
pure data that produces normal Clean Board state:

```
Template ──► BoardPage / SavedLayout / BoardScene  (existing typed objects)
```

Applying a template runs the exact same autosave / saved-layout / scene /
present-projection paths as anything authored by hand. There is no parallel
template runtime, no new widget kind, and no extra persisted template metadata
required for rendering.

## Template list

| Template | Display mode | Background | Theme | Message kind | Timer | Spotify | Keep awake |
|----------|-------------|------------|-------|-------------|-------|---------|-----------|
| Morning Arrival | morningArrival | morning-glow | minimal-light | doNow | Morning Work (10m) | on | recommended |
| Math Workshop | focus | slate-focus | minimal-dark | objective | Math Sprint (5m) | off | off |
| Reading Block | reading | reading-cream | minimal-light | objective | Reading Stamina (15m) | off | off |
| Writing Block | focus | slate-focus | minimal-dark | directions | Quiet Writing (12m) | on | off |
| Independent Work | focus | slate-focus | minimal-dark | reminder | Independent Work (20m) | on | off |
| Assessment Mode | assessment | clean-white | minimal-light | directions | Exit Ticket (5m) | off | off |
| Cleanup | cleanup | warm-neutral | minimal-light | transition | Cleanup (3m) | on | off |
| Dismissal | transition | transition-dark | minimal-dark | transition | Transition (2m) | on | off |

Template backgrounds match each display mode's recommended background so edit
and present render the same coherent board.

## Model + helpers (`src/features/clean-board/templatePacks.ts`)

```ts
type ClassroomTemplateId =
  | 'morningArrival' | 'mathWorkshop' | 'readingBlock' | 'writingBlock'
  | 'independentWork' | 'assessmentMode' | 'cleanup' | 'dismissal'

interface ClassroomTemplatePack {
  id: ClassroomTemplateId
  name: string
  heading: string
  category: 'daily' | 'instruction' | 'transition' | 'assessment'
  description: string
  displayModeId: DisplayModeId
  backgroundPresetId: BackgroundPresetId
  themeId: BoardThemeId
  messageCardKind: MessageCardKind
  messageTitle: string
  messageBody: string
  timerPresetId: TimerPresetId
  includeSpotify: boolean
  keepAwakeRecommended: boolean
}
```

Helpers:

- `getTemplatePack(id)` / `sanitizeTemplateId(value)` / `isTemplateId(value)` —
  catalog lookup and safe id sanitization (unknown → `morningArrival`).
- `createTemplateObjects(template)` — builds heading (text), message card,
  timer, and optional Spotify placeholder with unique ids and non-overlapping
  default placement on the 1920×1080 canvas.
- `templateToBoardPage(template, existingPage?)` — a normal `BoardPage`
  (preserves an existing page id when applying in place; never sets `teacherNotes`).
- `templateToSavedLayout(template)` — a persisted `SavedLayout` carrying `displayModeId`.
- `templateToScene(template)` — a `BoardScene` referencing the template layout.

## Object placement

- Heading: top-center (`x=360, y=90, w=1200`), layer 1.
- Message card: centered upper-middle (`x=560, y=360, w=800`), layer 2.
- Timer: top-right (`x=1600, y=90, w=280`), layer 2.
- Spotify (when included): bottom-left (`x=80, y=880, w=520`), layer 2.

All boxes stay within canvas bounds and do not overlap.

## UI

`TemplatePacksPanel.tsx` — a compact "choose → preview → apply" control rendered
inside the Saved Boards panel. It is teacher-only by construction: Saved Boards
only mounts in edit mode, so the picker never appears in present mode. It is
reachable in both desktop side-panel and iPad responsive-drawer layouts via the
existing "Saved Boards" tab (no new drawer tab, no board collapse).

## Persistence + safety

- Template-created boards flow through autosave, saved layouts, and scenes, and
  serialize/deserialize through `boardSerialization.ts` unchanged.
- `templateToScene` records `displayModeId`, `timerPresetRef`,
  `backgroundPresetId`, `keepAwake`, and `studentSafe: true`.
- Templates contain no Spotify tokens/auth, device ids, remote URLs, file paths,
  uploaded image data, private notes, roster data, unsafe HTML, or scripts.
  Message/heading text is plain, classroom-safe prose.
- Present projection of a template board passes `toSafeBoardPage` with no
  forbidden keys and no teacher notes.

## Files changed

- `src/features/clean-board/templatePacks.ts` — new (catalog + sanitize + helpers)
- `src/features/clean-board/TemplatePacksPanel.tsx` — new (teacher-only picker)
- `src/features/clean-board/SavedBoardsPanel.tsx` — hosts the picker via `onApplyTemplate`
- `src/features/clean-board/BoardLabPage.tsx` — `applyTemplate` handler wiring
- `src/features/clean-board/boardLabTests.ts` — DB-5A tests
- `scripts/test-clean-board.sh` — compile `templatePacks.ts`

## Validation

| Check | Result |
|-------|--------|
| `npm run test:clean-board` | PASS (132 tests) |
| `npm run test:clean-board-spotify` | PASS (69 tests) |
| `npm run build` | PASS |
| `npm run test:display-import-guard` | PASS |
| `npm run test:display-bundle-guard` | PASS |
| `npm run test:teacher-dock` | PASS |
| `npm run test:display-studio` | PASS (124 tests) |
| `npm run test:display-composer` | PASS |
| `npm run lint` | WARN — 3 pre-existing canvas-spike fast-refresh errors |
| Rendered smoke (Playwright, headless) | PASS (3/3) |

Rendered smoke covered: edit mode shows the picker and applies Assessment;
present mode hides the picker; applying Morning Arrival then switching to
present keeps the board student-safe. No screenshots were committed.

## Acceptance

- PASS — teacher can apply templates in edit mode (picker in Saved Boards).
- PASS — templates create normal editable board state (existing object types).
- PASS — all eight required templates exist.
- PASS — templates combine display mode, background, message, timer, and Spotify.
- PASS — template boards persist through autosave/layouts/scenes.
- PASS — present mode stays student-safe; picker/controls gated behind edit.
- PASS — iPad edit layout stable (picker via existing Saved Boards tab).
- PASS — no remote/private/secret data enters templates.
- PASS — existing DB-4A through DB-4F features remain green.
- WARN — template thumbnails deferred; grade-level variants deferred; AI
  template generation deferred; cloud/shared template libraries deferred.
- FAIL — none.

## Deferred

- Template marketplace/library and shared packs.
- AI-generated templates.
- Google Drive / cloud sync.
- School-specific and grade-level template variants.
- Template thumbnails.
- Physical projector/AirPlay distance-readability check (not run this phase).
