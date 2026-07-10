# Phase 2A — Display Layout Polish / Projector Readability

Status: PASS  
Branch: command-center-display-polish  
Date: 2026-07-09

## Goal

Make the student-facing Command Center board more polished, projector-readable, and classroom-ready before adding more workflow complexity.

## Summary

Phase 2A improved the display layout across the existing screens without adding new dependencies or backend/cloud features.

Validation:
- `npm run build` — PASS
- `npm run lint` — PASS

No new heavy dependencies were added.

## Files Changed

- `src/lib/displayLayout.ts`
- `src/styles/index.css`
- `src/board/BoardFrame.tsx`
- `src/screens/HomeroomScreen.tsx`
- `src/screens/MathScreen.tsx`
- `src/screens/ReadingScreen.tsx`
- `src/screens/SnackLunchScreen.tsx`
- `src/screens/ReadyPositionScreen.tsx`
- `src/widgets/SmartTextCard.tsx`
- `src/widgets/MaterialsCard.tsx`
- `src/widgets/DoNowCard.tsx`
- `src/widgets/ReadyPositionCard.tsx`
- `src/widgets/TimerWidget.tsx`
- `src/widgets/PhaseTimerCard.tsx`

## Improvements

### Board Frame

- Added safer main display area.
- Improved safe-zone spacing.
- Reduced visual weight of Edit entry in display mode.
- Gave student-facing content more room.

### Homeroom

- Replaced cramped equal-column layout with a more intentional classroom display layout.
- Do Now now acts as the hero card.
- Reminders, Timer, Materials, and Ready Position are more readable and less crowded.

### Subject Screens

- Math, Reading, Snack/Lunch, and Ready Position now use clearer layout patterns.
- Cards better align to safe zones.
- Timer placement is more intentional.

### Widgets

- SmartTextCard, MaterialsCard, DoNowCard, ReadyPositionCard, TimerWidget, and PhaseTimerCard received display-mode readability improvements.
- Display mode text scales larger.
- Timer digits are easier to read from the back of the classroom.
- Display mode controls are simplified.

## Intentional Limitations

- No `/display` and `/control` route split yet.
- No new subject screens yet.
- No Teacher Material Launcher yet.
- No Today Prep yet.
- No Spotify/YouTube/PDF/annotation features yet.
- Reset and timer adjustment controls are intentionally cleaner/less visible in display mode.
- Background safe zones are CSS-guided, not individually tuned per background image.

## Next Recommended Phase

Per the two-app concurrent phase plan, next phase should be:

Phase 2B — OmniNote Xcode Project Foundation

Then return to Command Center for:

Phase 3A — Student/Teacher Visibility Model
