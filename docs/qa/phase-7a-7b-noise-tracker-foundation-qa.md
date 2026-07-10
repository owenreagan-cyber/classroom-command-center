# Manual QA — Phase 7A/7B Noise Tracker Foundation

Use this checklist after `npm run dev`.

## Teacher Dock controls

- [ ] Noise Trackers panel appears in edit mode.
- [ ] Homeroom tracker controls appear.
- [ ] Math tracker controls appear.
- [ ] Reading tracker controls appear.
- [ ] Silent voice level can be selected.
- [ ] Whisper voice level can be selected.
- [ ] Normal voice level can be selected.
- [ ] Off voice level can be selected.
- [ ] Manual meter slider updates the selected tracker.
- [ ] `+ noisy` increases noisy points.
- [ ] `+ noisy` adds 2 lap minutes.
- [ ] `-2 min` lowers lap minutes but not below zero.
- [ ] `+2 min` adds lap minutes.
- [ ] `Served` resets lap minutes to zero.

## Student-facing display

- [ ] Homeroom shows the Noise Defense card when visible.
- [ ] Math shows the Noise Defense card when visible.
- [ ] Reading shows the Noise Defense card when visible.
- [ ] Noise card text is readable from the back of the room.
- [ ] Voice level badge is clear.
- [ ] Meter bar is clear.
- [ ] Noisy point count is large enough.
- [ ] Lap minutes are large enough.
- [ ] Warning state appears when meter reaches 65+.
- [ ] Critical state appears when meter reaches 85+.
- [ ] Off mode shows paused/off language.

## Visibility and privacy

- [ ] Noise card can be hidden from Homeroom through Student Board Cards.
- [ ] Noise card can be hidden from Math through Student Board Cards.
- [ ] Noise card can be hidden from Reading through Student Board Cards.
- [ ] Display mode hides Teacher Dock.
- [ ] Display mode hides noise controls.
- [ ] Display mode shows only the student-facing card.

## Persistence

- [ ] Refresh keeps voice level choices.
- [ ] Refresh keeps noisy points.
- [ ] Refresh keeps lap minutes.
- [ ] Refresh keeps meter level.
- [ ] Reset to defaults resets noise trackers.

## Safety

- [ ] No microphone permission prompt appears.
- [ ] No network/API calls are required.
- [ ] No cloud sync is required.
- [ ] No new dependencies were added.

## Validation

- [ ] `npm run build` passes.
- [ ] `npm run lint` passes.
