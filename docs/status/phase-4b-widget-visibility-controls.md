# Phase 4B — Widget Visibility Toggles / Basic Inline Editing Status

Status: PASS  
Branch: command-center-widget-visibility-controls  
Date: 2026-07-09

## Checklist

- [x] widget/card ID model added
- [x] card visibility state added
- [x] edit-mode controls added
- [x] display mode hides disabled cards
- [x] teacher-only privacy preserved
- [x] existing screens preserved
- [x] Phase 4A subject screens preserved
- [x] build PASS
- [x] lint PASS
- [x] no new dependencies
- [x] phase report saved

## Files Changed

- `docs/phases/phase-4b-widget-visibility-controls.md`
- `docs/status/phase-4b-widget-visibility-controls.md`
- `src/data/types.ts`
- `src/data/defaults.ts`
- `src/store/boardStore.ts`
- `src/app/AppShell.tsx`
- `src/board/TeacherDock.tsx`
- `src/board/CardVisibilityPanel.tsx`
- `src/screens/ActiveScreen.tsx`
- `src/screens/HomeroomScreen.tsx`
- `src/screens/MathScreen.tsx`
- `src/screens/ReadingScreen.tsx`
- `src/screens/SnackLunchScreen.tsx`
- `src/screens/ReadyPositionScreen.tsx`
- `src/screens/SubjectScreen.tsx`

## What Changed

Phase 4B adds lightweight show/hide controls for student board cards.

Added:
- `CardId`
- `ScreenCardVisibility`
- `CardVisibilityOption`
- `DEFAULT_CARD_VISIBILITY`
- `CARD_VISIBILITY_OPTIONS`
- persisted `cardVisibility` state in `boardStore`
- `setCardVisible(screenId, cardId, visible)` store action
- migration to persisted store version 5
- `CardVisibilityPanel` in the edit-only Teacher Dock
- card visibility wiring through `AppShell` and `ActiveScreen`
- conditional rendering in existing screens and Phase 4A subject screens

## Student Display Protection

When a teacher disables a card in the Teacher Dock:
- that card is not rendered by the active screen
- display mode receives the same visibility state
- hidden cards stay off the student board
- teacher-only hints remain protected by the Phase 3A `TeacherHint`, `VisibilityGate`, and `SmartTextCard` filtering model

## Cards Supported

Homeroom:
- Do Now
- Reminders
- Materials
- Ready Position
- Timer

Math:
- Lesson
- Materials
- Timer

Reading:
- Reading focus
- Materials
- Ready Position
- Timer

Snack / Lunch:
- Cleanup reminders
- Routine
- Phase timer

Ready Position:
- Ready Position checklist
- Compact cue

Expanded subject screens:
- Focus task
- Agenda
- Materials

## Validation

```text
npm run build  → PASS
npm run lint   → PASS
```

## Risks and Limitations

- This phase adds show/hide toggles only.
- It does not add full inline editing yet.
- Hidden card layout gaps may remain because this is a simple visibility foundation, not a layout reflow engine.
- No drag-and-drop layout editing was added.
- No Today Prep or Teacher Material Launcher was added.
- No new dependencies were added.

## Next Recommended Command Center Phase

Phase 4C — Basic Inline Editing Foundation

Suggested scope:
- edit a small set of student-facing fields directly in edit mode
- start with subject focus task and agenda text
- preserve visibility/privacy behavior
- keep local-first persistence through existing store
- no rich text editor
- no backend
