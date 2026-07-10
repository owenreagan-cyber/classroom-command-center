# Classroom Command Center — July 20 MVP Plan

## July 20 MVP goal

Ship a local-first classroom display board that can replace a basic Classroomscreen-style board on a MacBook Air M1 / classroom projector.

Must-have by July 20:
- Full-screen 16:9 board
- Edit / Display modes
- Screen navigation (Homeroom, Math, Reading, Snack/Lunch, Ready Position)
- SmartTextCard system with auto-fit text
- Classroom cards: Reminders, Do Now, Materials, Ready Position
- Local Beautify (deterministic formatting only)
- Canva background asset pipeline + local manifest
- Local persistence
- Classroom timer + phase/routine timer (manual, duration-based)
- No backend, no AI API, no Canva runtime dependency

## SmartTextCard requirements

- `AutoFitText` scales content to the largest font that still fits the card.
- `SmartTextCard` owns title / subtitle / body / bullets / footer.
- Text never spills outside the card.
- Display mode shows clean cards only.
- Edit mode may show Beautify and minimal controls.
- Classroom wrappers:
  - `ReminderCard`
  - `DoNowCard`
  - `MaterialsCard` (Have Out / Put Away)
  - `ReadyPositionCard` (full checklist + compact cue)

## Canva background workflow

**Rule: Canva is asset production only, not a runtime dependency.**

1. Design 1920×1080 backgrounds in Canva (anime-inspired student display, edge decoration, large empty safe zones).
2. Export PNG pages.
3. Place files in `public/assets/backgrounds/` using the filenames in `src/data/backgroundAssets.ts`.
4. React loads the local PNG path; if the file is missing, the app uses `fallbackGradient`.

Do **not**:
- call Canva APIs at runtime
- bake daily lesson text into backgrounds
- hardcode snack/lunch/schedule times into artwork

## Asset folder locations

```
public/assets/backgrounds/   # Canva-exported 16:9 PNGs
public/assets/badges/        # future badge art (parked)
public/assets/rewards/       # future reward art (parked)
public/assets/passes/        # future pass/coupon art (parked)
```

Expected background filenames:
- `homeroom-morning-briefing.png`
- `math-training-lab.png`
- `reading-sky-book-world.png`
- `snack-lunch-flow-control.png`
- `ready-position-expectations.png`

## Background manifest

File: `src/data/backgroundAssets.ts`

Each entry includes:
- `id`
- `screenId`
- `label`
- `path`
- `fallbackGradient`
- `safeZones`
- `mood`
- `notes`

The board background picker and screen defaults read from this manifest.

## Timer system

Local-first countdown timers live in `src/store/timerStore.ts` (Zustand + localStorage key `classroom-command-center-timers`).

### TimerWidget (Homeroom / Math / Reading)

- Duration presets: 2 / 5 / 10 / 15 / 20 minutes + Custom
- Controls: Start, Pause, Resume, Reset, +1 min, −1 min (never below zero)
- Large readable display; edit mode shows label + preset controls; display mode hides edit fields
- When remaining hits zero → clear **Time’s Up** state (no audio / notifications yet)

### Reload recovery

While running, the store persists `endsAt` (wall-clock timestamp). On reload or tick:

`remainingMs = max(0, endsAt - Date.now())`

If remaining would go negative, the timer finishes at zero — no negative countdown.

### Phase / routine timer (Snack/Lunch)

`PhaseTimerCard` runs an ordered list of phases. Each phase has:

- `id`, `label`, `durationMinutes`, `instructions`, `styleToken`

Behavior:

- Shows current phase + next phase
- Advances automatically when a phase reaches zero
- Ends with **Routine Complete**
- Start / Pause / Resume / Reset
- Edit mode: edit routine title, phase labels, durations, instructions

**Critical rule:** phase durations are **editable duration presets**, not school bell / snack / lunch clock times. Default phases (Eating / Quiet Voices → Silent Cleanup → Bathroom / Locker) are starter content only.

### Persistence safety

Persisted: timer labels, preset durations, remaining time, `endsAt` when running, phase config, current phase index.

Safe reset choices:

- Changing a simple preset while idle resets remaining to that duration
- Editing a phase duration while paused/idle snaps that phase’s remaining to the new duration
- Board “Reset to defaults” also resets all timers
- Corrupt / empty phase lists fall back to defaults on migrate

## Schedule rule

**Do not hardcode school schedule times.**

Snack, lunch, dismissal, and transition times must stay editable duration/preset content until a real current-year schedule is provided.

### Manual use for July 20

Teachers start timers and routines by hand during class. There is no automatic start at a clock time and no bell-schedule engine.

### Future schedule engine (parked)

A schedule/clock-time automation engine is **parked** until the current school year schedule is known. Do not invent last year’s times.

## Reward / coupon app

Reward Maker Studio remains parked.

See: `docs/future-modules/reward-maker-studio-parking-lot.md`

Do not build coupon/pass generators in this MVP.

## Local Beautify rule

Beautify is **conservative, reversible, and layout-safe**:
- trim whitespace / collapse blank lines
- normalize bullets and light capitalization
- preserve useful phrases (e.g. “Morning folder”) — never token-split them
- preserve card type (Reminders stay lists, Do Now stays one instruction, Materials keep Have Out / Put Away)
- do not aggressively rewrite default classroom content
- do not add content that makes cards overflow
- no network, no cloud AI, no local LLM

**Undo Beautify** is available in edit mode after a Beautify pass (session-only undo snapshot). Display mode hides Beautify/Undo controls.

## SmartTextCard visual safety

- `SmartTextCard` / `AutoFitText` must **never silently clip** title, body, bullets, notes, or footer.
- Fit order: reduce font size → tighten spacing / compact layout → optional two-column Materials layout → visible `+ more` indicator as last resort.
- MaterialsCard must keep both Have Out and Put Away readable inside the card.

## Architecture reminder

- Canva = design factory for static assets
- React = live widgets, text, timers, layout, persistence
- Browser localStorage = persistence
- No Firebase / Supabase / Canvas API / Gmail / Ollama / native wrappers

## Known limitations (current)

- No timer audio chime
- No browser notifications
- No multi-room / multi-device sync
- No schedule/clock-time automation
- Ready Position screen intentionally omits a timer to avoid clutter
- Phase timer does not yet support add/remove/reorder phases in the UI (edit fields on the default three phases only)
- Homeroom is denser with five cards; projector readability should be checked in display mode
