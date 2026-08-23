# DB-4D — Classroom Timer Presets

> Status: complete. Teacher-friendly classroom timer presets for Clean Board,
> built on the existing timer object, saved layouts/scenes, backgrounds/themes,
> message cards, Spotify, and iPad responsive drawer work.

## Purpose

Give teachers quick classroom timer routines (Morning Work, Math Sprint,
Independent Work, etc.) that can be started from a preset, edited
(title/duration/tone), and reused through autosave and saved layouts/scenes.
This is a "clean classroom timer preset system", not a redesign: no uploaded
images, no AI timer generation, no Spotify behavior changes, and no risky live
countdown mechanics beyond the existing static timer.

## Files changed

| File | Change |
| --- | --- |
| `src/features/clean-board/types.ts` | Added `TimerPresetId`, `TimerTone`, `TimerConfig`; timer object now carries `presetId`/`title`/`tone` alongside `durationMinutes`/`label`. |
| `src/features/clean-board/timerPresets.ts` | **New.** Preset catalog, guards, sanitizers, duration clamp/format, and config builders. |
| `src/features/clean-board/storage/boardSerialization.ts` | Timer config now sanitized via `sanitizeTimerConfig` (whitelist) instead of ad-hoc reads. |
| `src/features/clean-board/boardSafety.ts` | Present projection re-whitelists timer config (strips unknown/private keys). |
| `src/features/clean-board/BoardObjectRenderer.tsx` | Timer renders routine title + remaining time (no "Timer" placeholder subtitle). |
| `src/features/clean-board/TimerTeacherPanel.tsx` | **New.** Compact teacher editor (preset selector, quick-start, title, duration, tone, apply). |
| `src/features/clean-board/editLayout.ts` | Added `timer` drawer tab. |
| `src/features/clean-board/BoardLabPage.tsx` | "Add Timer" uses default preset; wired timer panel into desktop + drawer; tab routing. |
| `src/features/clean-board/seedBoard.ts` | Seed timers now use preset metadata. |
| `src/features/clean-board/boardLabTests.ts` | Added DB-4D tests (19 new assertions). |
| `scripts/test-clean-board.sh` | Compile `timerPresets.ts`. |

## Presets added

| presetId | label | duration | tone |
| --- | --- | --- | --- |
| `morningWork` | Morning Work | 10 min | calm |
| `mathSprint` | Math Sprint | 5 min | focus |
| `independentWork` | Independent Work | 20 min | focus |
| `readingStamina` | Reading Stamina | 15 min | calm |
| `cleanup` | Cleanup | 3 min | urgent |
| `transition` | Transition | 2 min | neutral |
| `exitTicket` | Exit Ticket | 5 min | urgent |
| `brainBreak` | Brain Break | 3 min | calm |
| `partnerTalk` | Partner Talk | 2 min | neutral |
| `quietWriting` | Quiet Writing | 12 min | calm |
| `custom` | Custom | 5 min (fallback) | neutral |

`DEFAULT_TIMER_PRESET_ID` is `morningWork`; the "Add Timer" button creates a
Morning Work (10 min) timer.

## Persistence behavior

Timers persist through the existing `SavedLayout` object list, so they flow
through autosave, saved layouts, scenes, load layout, and refresh with no new
storage surface. `durationMinutes` is kept (not `durationSeconds`) for backward
compatibility with the existing timer model; `label` is re-derived from the
sanitized duration on load.

## Present-mode safety

- Present projection re-whitelists the timer config through
  `sanitizeTimerConfig`, dropping unknown/private keys (no tokens, secrets, or
  teacher metadata beyond the safe `title`/`label`).
- The renderer shows only the routine title and remaining time — no preset
  selector, no controls, no teacher panel.
- `presetId`/`tone` are non-private (no `src`/`url`/`path`/token fields), so
  they are safe to carry into present mode, mirroring how message cards carry
  `cardKind`/`tone`/`textSize`.

## iPad behavior

- The timer editor is a drawer tab (like Spotify and Message Card), added only
  when a timer is selected.
- At iPad portrait (820×1180) the board remains full-width above the drawer; the
  panel does not crush the board (existing `responsivePanels` layout preserved).

## Sanitization rules

- Unknown `presetId` → `custom` (data-preserving).
- Invalid duration (non-number, negative, zero) → default preset duration
  (10 min); over-long → clamped to `TIMER_MAX_MINUTES` (120).
- Unknown `tone` → the resolved preset's tone.
- Unknown/private keys are dropped (whitelist rebuild).
- `label` is re-derived from `durationMinutes` via `formatTimerDuration`.

## Validation

| Command | Result |
| --- | --- |
| `npm run test:clean-board` | 86 passed, 0 failed |
| `npm run test:clean-board-spotify` | 69 passed, 0 failed |
| `npm run build` | PASS (`tsc -b && vite build`) |
| `npm run test:display-import-guard` | PASS |
| `npm run test:display-bundle-guard` | PASS |
| `npm run test:teacher-dock` | PASS |
| `npm run test:display-studio` | 124 passed |
| `npm run test:display-composer` | PASS |
| `npm run lint` | 3 pre-existing canvas-spike fast-refresh errors only |

## PASS / WARN / FAIL

**PASS**

- Timer presets added (10 routines + custom).
- Add Timer creates a classroom-useful preset timer (Morning Work, 10 min).
- Timer preset editor works in desktop edit mode and iPad drawer layout.
- Timer persists through autosave/saved layouts/scenes.
- Present mode remains clean and student-safe.
- Existing Spotify, backgrounds, themes, message cards, saved layouts, and iPad
  layout fix remain intact.
- Automated validation passes.

**WARN**

- Physical iPad automation may remain blocked until Web Inspector is enabled.
- Advanced sound/animation/multi-step routines deferred.
- Live Spotify playlist QA remains separate.

**FAIL**

- None.

## Deferred items

- Custom sound effects.
- Animated countdown modes.
- AI-generated routines.
- Multi-step lesson sequences.
- Drive/native sync.
- Advanced timer analytics.
