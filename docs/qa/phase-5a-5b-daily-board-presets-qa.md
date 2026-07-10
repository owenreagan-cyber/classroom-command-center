# Manual QA — Phase 5A/5B Daily Board Presets + Quick Screen Setup

Use this checklist after `npm run dev`.

## Quick Setup panel

- [ ] Teacher Dock appears in edit mode.
- [ ] Quick Setup panel appears in Teacher Dock.
- [ ] Homeroom shows Morning Arrival.
- [ ] Math shows Math Warm-Up.
- [ ] Reading shows Reading Rotation.
- [ ] Homework / Pack-Up shows Pack-Up.
- [ ] Assessment shows Assessment Mode.
- [ ] Snack / Lunch shows Snack / Lunch Routine.
- [ ] Ready Position shows Ready Position Reset.
- [ ] Screens without presets show safe empty Quick Setup copy.

## Applying presets

- [ ] Applying Morning Arrival updates Homeroom text/materials.
- [ ] Applying Math Warm-Up updates Math text/materials.
- [ ] Applying Reading Rotation updates Reading text/materials.
- [ ] Applying Pack-Up updates Homework / Pack-Up text/materials.
- [ ] Applying Assessment Mode updates Assessment text/materials.
- [ ] Applying Snack / Lunch Routine updates Snack / Lunch cleanup/routine.
- [ ] Applying Ready Position Reset updates checklist and compact cue.

## Safety/regression

- [ ] Applying a preset does not change card visibility toggles.
- [ ] Applying a preset does not reset timers.
- [ ] Applying a preset does not expose teacher-only hints in display mode.
- [ ] Display mode hides Teacher Dock and Quick Setup controls.
- [ ] Inline editing still works after applying a preset.
- [ ] Refreshing the browser keeps the applied preset content.
- [ ] Reset to defaults still restores starter content and timers.

## Validation

- [ ] `npm run build` passes.
- [ ] `npm run lint` passes.
