# DB-7C — Prompt-Based Routine Builder for Clean Board

> Status: **COMPLETE**
> Phase: DB-7C — deterministic, offline prompt-to-routine setup for Clean Board

## Purpose

Let a teacher type what they want for the classroom display in plain language
and get a previewable, editable routine scene — without manually dragging canvas
objects. The feature runs fully **offline/local**: no AI provider, no API key,
no billing, no network calls. A deterministic parser turns keywords, dates,
checklists, timers, and style/music hints into a structured `RoutinePlan`, which
then produces ordinary Clean Board state.

```
teacher prompt
      ↓
parseRoutinePrompt  (deterministic local rules)
      ↓
RoutinePlan  (editable preview)
      ↓
routinePlanToBoardPage / SavedLayout / Scene
      ↓
normal Clean Board state → autosave / scene / present / host display
```

There is **no parallel runtime or prompt-only display layer** — the result flows
through the exact same autosave, scene, present-projection, and `/display` host
paths as hand-authored content.

## How to use

1. Open `/board-lab?mode=edit` (iPad: the **Routine Builder** drawer tab;
   desktop: the left panel's **Routine Builder** tab).
2. Type a request into **"Tell Clean Board what to set up"**.
3. Press **Generate Preview**.
4. Edit any field (scene name, title, intro, checklist, closing, timers,
   background/theme, sticker suggestion, music).
5. **Apply to Board** (edits the active page), **Save as Scene** (persists +
   activates the scene), or **Open Display** (opens `/display`).

## Sample prompt

```text
Set up morning arrival for August 27th, 2026.
Please complete your morning routines:
- Complete and turn in your History Chapter 2 and 3 worksheet
- Complete the Shurley review worksheet
- Stay seated and work quietly
- Sharpen pencils and use the bathroom before we begin
Be ready for math!
Use a 25-minute Quiet Morning Work timer.
Use a calm, premium, readable classroom morning background.
Add a small sensible school sticker or graphic like a pencil, notebook, sun, or good-morning accent.
Use calm instrumental, acoustic, or piano music.
```

This produces:

- **Title**: `August 27th, 2026`
- **Scene name**: `Morning Arrival — Aug 27`
- **Checklist**: History worksheet, Shurley worksheet, stay seated, sharpen pencils
- **Closing**: `Be ready for math!`
- **Timer**: `Quiet Morning Work` — 25:00
- **Visual style**: `morning-glow` background + `minimal-light` theme (calm)
- **Sticker**: suggestion only — `A small, sensible school-themed accent (e.g. pencil, notebook, sun).`
- **Music**: enabled — `Morning Arrival Calm` / calm, instrumental, acoustic, piano

## What local deterministic planning supports

- **Date detection** — `August 27th, 2026`, `Aug 27`, and `today`/`tomorrow`
  (using the local JS clock, injectable for tests).
- **Routine detection** — `morning`/`arrival` → morning arrival, `assessment`/`test`/`quiz` → assessment,
  `cleanup`/`pack up`, `reading`, `writing`, `math`.
- **Checklist detection** — bullet lines (`-`, `✓`, `*`, `•`, `1.`), plus
  `students should …` directives split on commas/`and`/`then`.
- **Timer detection** — `25-minute … timer`, `for 25 minutes`, `N minute(s)`;
  minutes clamped to 1–120; morning arrival defaults to a 25-minute timer.
- **Music detection** — `spotify`/`playlist`/`music`/`piano`/`instrumental`/`acoustic`/…
  produce a suggested playlist name + search terms; never auto-plays.
- **Visual-style detection** — `calm`/`soft`/`morning`/`premium`/`readable` →
  `morning-glow` + `minimal-light`; `focus`/`minimal` → `slate-focus`;
  `reading`/`cream` → `reading-cream`; `bright`/`celebration` → `warm-neutral`.
- **Accent-graphic suggestion** — `sticker`/`graphic`/`pencil`/`notebook`/`sun` →
  stored as a suggestion only (no fake art, no generated image assets).
- **Empty/missing prompt** — produces a safe default morning-arrival plan.

## Spotify note

Playlist suggestions (`Morning Arrival Calm`, etc.) are **generated locally** as
references into the existing classroom playlist recipes. Live Spotify
connection/playback still requires the M1 display host session and local
`.env.local`; this phase never stores tokens, auth data, account identifiers, or
device IDs.

## Files changed

- `src/features/clean-board/routinePromptPlanner.ts` (new) — pure parser/planner:
  `parseRoutinePrompt`, `buildRoutineMessage`, `routinePlanToBoardPage`,
  `routinePlanToSavedLayout`, `routinePlanToScene`, `routinePlanToObjects`,
  `displayModeIdForRoutine`, plus `RoutinePlan`/`RoutineKind`/`RoutineMusic`/
  `RoutineVisualStyle` types.
- `src/features/clean-board/RoutinePromptPanel.tsx` (new) — teacher-facing prompt
  surface (textarea, generate/clear, editable preview, apply/save/open display).
- `src/features/clean-board/BoardLabPage.tsx` — `applyRoutinePage` handler; wired
  the panel into the responsive drawer tab and the desktop left tab.
- `src/features/clean-board/editLayout.ts` — added the `prompt` drawer tab.
- `scripts/test-clean-board.sh` — compiles `routinePromptPlanner.ts`.
- `src/features/clean-board/boardLabTests.ts` — 12 new planner tests.

## Safety

- Plans are built only from whitelisted Clean Board object types (message card,
  timer, text heading, background, theme, display mode, Spotify placeholder).
- Message text passes through `sanitizePlainText` (no HTML/scripts/URLs).
- Durations are clamped (`clampTimerMinutes`, 1–120).
- The accent graphic is a **suggestion string**, never rendered or persisted as
  art; no external assets or remote URLs.
- Applying produces normal `BoardPage`/`SavedLayout`/`BoardScene` state that is
  sanitized and student-safe-projected exactly like hand-authored content.

## Validation

- `npm run test:clean-board` — **166 passed, 0 failed** (12 new planner tests).
- `npm run test:clean-board-spotify` — **69 passed, 0 failed**.
- `npm run build` — **passes** (`RoutinePromptPanel` bundled in the `BoardLabPage` chunk).
- `npm run test:display-import-guard` / `test:display-bundle-guard` — pass.
- `npm run test:teacher-dock` / `test:display-studio` / `test:display-composer` — pass.
- `npm run lint` — only the 3 pre-existing `canvas-spike` fast-refresh errors remain (WARN).
- Headless browser verification — `/board-lab?mode=edit` prompt → preview → apply
  → `/display` passes; no teacher chrome on `/display`.

## Deferred

- Real OpenAI/AI provider integration (DB-7F).
- Automatic background image generation / web search (DB-7G).
- Automatic Spotify playlist creation + live now-playing sync (DB-7H).
- iPad remote/network sync (DB-7B / DB-7E).
- macOS auto-launch appliance (DB-7D).
- Classroom schedule/calendar integration.
