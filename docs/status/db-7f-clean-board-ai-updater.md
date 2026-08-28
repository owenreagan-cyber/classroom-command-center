# DB-7F — Clean Board AI Updater / Board Assistant

> Status: **COMPLETE**
> Phase: DB-7F — in-app "Set Up Board" / Board Assistant workflow

## Purpose

Make daily classroom setup happen *inside* Clean Board, not through ChatGPT or
Cursor every morning. The teacher presses **✨ Set Up Board**, types what they
want, and Clean Board produces a previewable, editable routine scene — then the
teacher revises, applies, saves, or opens the display.

This phase keeps the engine **local and offline**. The UX feels like an AI
assistant, but there are no AI API calls, no API keys, no hidden billing, and no
external calls by default. The deterministic DB-7C planner is the engine; DB-7F
adds the conversational wrapper and local revision support on top of it.

```
teacher prompt
      ↓
parseRoutinePrompt  (deterministic local rules)
      ↓
RoutinePlan  (editable preview)
      ↓
reviseRoutinePlan  (local, deterministic revision)
      ↓
routinePlanToBoardPage / SavedLayout / Scene
      ↓
normal Clean Board state → autosave / scene / present / /display
```

## How the Board Assistant works

1. Open `/board-lab?mode=edit`.
2. Press **✨ Set Up Board** (edit toolbar), or open the **Board Assistant**
   tab (iPad drawer / desktop left panel).
3. Either pick an example chip (seeds the prompt box only) or type a request.
4. Press **Generate Setup** → a structured, editable preview appears
   (title, message/checklist, timers, background/theme, sticker suggestion,
   music suggestion).
5. Revise with a quick chip or free text ("make it shorter", "add turn in
   folders", "change timer to 20 minutes", "no music").
6. **Apply to Board** / **Save as Scene** / **Open Display**.

## Why it is local/offline for now

Real AI (OpenAI or another provider) is deferred to DB-7I. The assistant uses
the DB-7C deterministic parser/planner, so every result is safe, reproducible,
and free. `reviseRoutinePlan` adds deterministic revision rules on top. The
`RoutinePlan` shape and the `parseRoutinePrompt`/`reviseRoutinePlan` seam are
deliberately provider-agnostic so a future DB-7I can swap in a real AI call
without changing the state model or the UI.

## Example daily prompts

- **Morning Arrival** — "Set up morning arrival for today. Students should
  complete morning work, turn in folders, stay seated, sharpen pencils, and be
  ready for math. Use a 25-minute quiet work timer and calm instrumental music."
- **Math Workshop** — "Set up math workshop. Students should take out their
  materials, begin the warm-up, and work quietly. Use a 20-minute timer and
  focus instrumental music."
- **Reading Block** — "Set up reading block. Students should choose a book, read
  quietly, and build stamina. Use a 15-minute timer and calm acoustic music."
- **Assessment Mode** — "Set up assessment mode. Students should work silently,
  keep eyes on their own work, and raise their hand for help. Use a 45-minute
  timer. No music."
- **Cleanup** — "Set up cleanup. Students should put materials away, tidy their
  area, and wait quietly. Use a 3-minute timer and upbeat transition music."
- **Dismissal** — "Set up dismissal. Students should pack up, gather their
  belongings, and wait quietly for the bell. Use a 5-minute timer."

## Revision examples

`reviseRoutinePlan(plan, instruction)` supports, deterministically:

| Instruction | Effect |
|-------------|--------|
| `make it shorter` | keep first 3 checklist items, drop the closing line |
| `make it more serious` | focus tone |
| `make it friendlier` | calm tone |
| `add turn in folders` | append a checklist item |
| `add be ready for math` | set the closing line |
| `remove stay seated` | remove a matching checklist item |
| `change timer to 20 minutes` | set the first timer to 20:00 (clamped 1–120) |
| `change title to Welcome Back!` | set the title |
| `make the background calmer` | morning-glow + minimal-light, calm |
| `make it brighter` | warm-neutral + minimal-light, bright |
| `use piano music` | music on, piano/calm/instrumental terms |
| `use acoustic music` | music on, acoustic/calm/instrumental terms |
| `no music` | music off |

An unrecognised revision preserves the current plan and returns a friendly note:
`I could not confidently apply that revision. Try "add…", "remove…", or
"change timer to…"`.

## How output applies to normal Clean Board state

The assistant never creates a separate display layer. `routinePlanToBoardPage`
produces a normal `BoardPage` (heading text, message card, timer, optional
Spotify placeholder) which flows through `applyRoutinePage` into the BoardLab
deck, then autosaves and projects through the existing present-mode and
`/display` host paths. `routinePlanToSavedLayout` / `routinePlanToScene` produce
normal persisted `SavedLayout` / `BoardScene` records.

## Spotify note

The assistant only generates music *suggestions* (playlist name + search terms).
It never auto-plays, never creates Spotify playlists, and never requires a live
connection. Live Spotify setup/playback still happens on the M1 display host
session with local `.env.local`.

## Files changed

- `src/features/clean-board/routinePromptPlanner.ts` — added `tone` override to
  `RoutinePlan`, `reviseRoutinePlan` + `RevisionResult`,
  `ASSISTANT_EXAMPLE_PROMPTS`, `ASSISTANT_NOT_UNDERSTOOD_NOTE`, dismissal→cleanup
  mapping, and "no music" negation in `detectMusic`.
- `src/features/clean-board/RoutinePromptPanel.tsx` — renamed to **Board
  Assistant**; added example chips, revision input + quick revisions + note.
- `src/features/clean-board/BoardLabPage.tsx` — added the **✨ Set Up Board**
  entry point and `openAssistant`; renamed the desktop left tab.
- `src/features/clean-board/editLayout.ts` — drawer tab label → "Board Assistant".
- `src/features/clean-board/boardLabTests.ts` — 14 new DB-7F tests.
- `docs/status/db-7f-clean-board-ai-updater.md` — this doc.

## Validation

- `npm run test:clean-board` — **180 passed, 0 failed** (14 new DB-7F tests).
- `npm run test:clean-board-spotify` — **69 passed, 0 failed**.
- `npm run build` — passes.
- `npm run test:display-import-guard` / `test:display-bundle-guard` — pass.
- `npm run test:teacher-dock` / `test:display-studio` / `test:display-composer` — pass.
- `npm run lint` — only the 3 pre-existing `canvas-spike` fast-refresh errors (WARN).
- Headless browser — prompt → preview → revise (timer + checklist) → apply →
  `/display` (revised 20:00 timer, checklist item, no teacher chrome).

## Deferred

- Real OpenAI/AI provider calls (DB-7I).
- Background/sticker image generation (DB-7G).
- Automatic Spotify playlist creation + live playback sync (DB-7H).
- iPad/Mac network remote sync (DB-7J).
- macOS auto-launch (DB-7K).
- School calendar integration.
