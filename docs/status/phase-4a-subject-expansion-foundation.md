# Phase 4A — Subject Expansion Foundation Status

Status: PASS  
Branch: command-center-subject-expansion  
Date: 2026-07-09

## Checklist

- [x] new subject/page IDs planned
- [x] new screen defaults added
- [x] new screens/components added
- [x] navigation updated
- [x] display/edit privacy preserved
- [x] existing screens preserved
- [x] build PASS
- [x] lint PASS
- [x] no new dependencies
- [x] phase report saved

## Screens Added

- Writing
- Science
- Social Studies
- Intervention
- Assessment
- Flexible Groups
- Centers / Rotations
- Homework / Pack-Up

## Files Changed

- `docs/phases/phase-4a-subject-expansion-foundation.md`
- `docs/status/phase-4a-subject-expansion-foundation.md`
- `src/data/types.ts`
- `src/data/defaults.ts`
- `src/data/backgroundAssets.ts`
- `src/lib/displayLayout.ts`
- `src/screens/ActiveScreen.tsx`
- `src/screens/SubjectScreen.tsx`

## What Changed

Phase 4A expands the Command Center subject/page foundation beyond the original Homeroom, Math, Reading, Snack/Lunch, and Ready Position screens.

Added:
- expanded `ScreenId` union
- reusable `SubjectContent` type
- defaults for eight new classroom screens
- reusable `SubjectScreen` component
- navigation entries through `SCREEN_META`
- ActiveScreen routing for the new pages
- lightweight background aliases using existing local background images
- display layout fallback support for the expanded screen list
- teacher-only prep notes for the new pages

## Privacy / Presenter View Behavior

The new subject screens preserve the Phase 3A visibility model.

Student-facing content:
- focus task
- agenda
- materials

Teacher-only content:
- teacher hints
- prep notes
- answer-key/safety/grouping reminders

Teacher-only content is routed through existing `TeacherHint`, `VisibilityGate`, and `SmartTextCard` visibility filtering.

## Validation

```text
npm run build  → PASS
npm run lint   → PASS
```

## Risks and Limitations

- New screens use lightweight placeholder/default content.
- New backgrounds are aliases that reuse existing local Canva exports.
- No custom artwork was added for the new subjects.
- No editable subject-content UI was added.
- No Today Prep, Material Launcher, PDF viewer, YouTube page, Spotify widget, backend, or cloud integration was added.
- Layouts are projector-safe foundations but still need future visual polish after real classroom use.

## Next Recommended Command Center Phase

Phase 4B — Widget Visibility Toggles / Basic Inline Editing

Suggested scope:
- let teacher show/hide selected cards per screen
- keep hidden content out of display mode
- add simple edit affordances without building the full Teacher Material Launcher
