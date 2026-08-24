# DB-5B — Clean Board Template Visual Polish + Thumbnails

> Status: **COMPLETE**
> Phase: DB-5B — polish the Template Packs picker

## Summary

Polished the DB-5A Template Packs picker so teachers can browse and choose
classroom templates at a glance. The picker now renders category-grouped preview
cards, each with a CSS-only mini board thumbnail, a scannable short label, and a
compact "included pieces" chip row. Selecting a card expands a slightly more
detailed preview; applying remains an explicit button. This is visual/product
polish only — no new state model, widget type, remote assets, or runtime.

## Files changed

- `src/features/clean-board/templatePacks.ts` — added `TemplateVisualTone`,
  `shortLabel`, `teacherUseCase`, `previewBullets` metadata to every template;
  added pure helpers `getTemplatePreviewSummary`, `getTemplatesByCategory`, and
  the `TemplatePreviewSummary` / `TemplateCategoryGroup` types; reordered
  categories to Daily Routines → Instruction Blocks → Assessment → Transitions.
- `src/features/clean-board/TemplatePacksPanel.tsx` — rebuilt from a single
  `<select>` into category-grouped preview cards with CSS thumbnails.
- `src/features/clean-board/boardLabTests.ts` — 8 new DB-5B tests.

## UI changes

- Category grouping with four section headers: Daily Routines, Instruction
  Blocks, Assessment, Transitions.
- One preview card per template: 16:9 CSS-only thumbnail (built from the
  template's background preset CSS + theme accent), template name, category
  pill, short label, and chips for mode / timer / message / Spotify (when
  included).
- Selecting a card expands an inline detail: description, "When to use"
  guidance, bullet list, background name, keep-awake recommendation, and the
  explicit **Apply Template** button.
- No accidental apply on click — selection and apply are separate actions.

## Template preview card behavior

- Thumbnail is CSS-only: `background: <preset css>` plus small translucent
  blocks for heading, message card, timer, and an optional Spotify strip. No
  image files, no screenshots, no remote URLs.
- `getTemplatePreviewSummary(template)` returns deterministic, safe data derived
  entirely from the existing background / theme / timer / display-mode catalogs.
- Visual metadata (`visualTone`, `shortLabel`, `teacherUseCase`,
  `previewBullets`) is required on every template and never leaks into board
  state (it is picker-only; `templateToBoardPage` does not copy it).

## Category grouping

`getTemplatesByCategory()` maps the 8 templates into 4 groups in display order:

| Category | Templates |
|----------|-----------|
| Daily Routines | Morning Arrival |
| Instruction Blocks | Math Workshop, Reading Block, Writing Block, Independent Work |
| Assessment | Assessment Mode |
| Transitions | Cleanup, Dismissal |

## iPad behavior

- The picker lives inside the Saved Boards panel, which already uses the
  responsive drawer on iPad (portrait 820px and landscape 1180px). No new tab,
  no board collapse.
- Cards are single-column and full-width; rendered QA confirmed no horizontal
  overflow and all 8 cards / 4 categories visible at both iPad viewports.

## Present-mode safety

The picker is rendered only inside `SavedBoardsPanel`, which is edit-mode-only.
Present mode shows no template cards, no apply button, and no teacher controls
(existing `showTeacherControls` gate unchanged).

## Validation

| Check | Result |
|-------|--------|
| `npm run test:clean-board` | PASS (140 tests) |
| `npm run test:clean-board-spotify` | PASS (69 tests) |
| `npm run build` | PASS |
| `npm run test:display-import-guard` | PASS |
| `npm run test:display-bundle-guard` | PASS |
| `npm run test:teacher-dock` | PASS |
| `npm run test:display-studio` | PASS (124 tests) |
| `npm run test:display-composer` | PASS |
| `npm run lint` | WARN — 3 pre-existing canvas-spike fast-refresh errors |
| Rendered QA (Playwright, headless) | PASS (10/10 across desktop 1440×900, iPad 820×1180, iPad 1180×820) |

Rendered QA covered: picker + 8 cards + 4 categories visible in edit mode; card
select shows detail; apply updates the board; present mode hides the picker; no
horizontal overflow at any viewport. Screenshots were captured to `/tmp` only and
not committed.

## Acceptance

- PASS — template picker is visually clearer and more polished.
- PASS — each template has a readable preview card with a CSS-only thumbnail.
- PASS — templates grouped by category (4 groups).
- PASS — teacher can still explicitly apply templates.
- PASS — no remote images or screenshots used.
- PASS — applied templates still create normal editable board state.
- PASS — present mode remains student-safe.
- PASS — iPad edit layout remains stable (no horizontal overflow).
- PASS — automated validation passes.
- PASS — no screenshots/temp QA files committed.
- WARN — true generated thumbnail images deferred; grade-level variants
  deferred; AI template generation deferred; cloud/shared library deferred;
  AirPlay/projector distance check remains manual.
- FAIL — none.

## Deferred

- Real generated template thumbnail images.
- Template marketplace/library and shared/cloud libraries.
- Grade-level template variants.
- AI-generated templates.
- Physical AirPlay/projector distance-readability check (not run this phase).
