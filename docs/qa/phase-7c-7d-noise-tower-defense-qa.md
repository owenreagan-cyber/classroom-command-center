# Manual QA — Phase 7C/7D Noise Tower Defense

Use this checklist after `npm run dev`.

## Teacher Dock controls

- [ ] Noise Trackers panel appears in edit mode.
- [ ] Homeroom tracker controls appear.
- [ ] Math tracker controls appear.
- [ ] Reading tracker controls appear.
- [ ] Tower health summary is visible for each tracker.
- [ ] Silent voice level can be selected.
- [ ] Whisper voice level can be selected.
- [ ] Normal voice level can be selected.
- [ ] Off voice level can be selected.
- [ ] Manual meter slider updates the selected tracker.
- [ ] `+ noisy` increases noisy points.
- [ ] `+ noisy` damages the first non-destroyed tower from left to right.
- [ ] Destroying a tower adds 2 lap minutes.
- [ ] `Repair tick` restores 1 HP to the first non-full tower from right to left.
- [ ] Rebuilding a destroyed tower removes 2 lap minutes.
- [ ] `-2 min` lowers lap minutes but not below zero.
- [ ] `+2 min` adds lap minutes.
- [ ] `Served` resets lap minutes to zero.
- [ ] `Reset tracker` clears towers, noisy points, lap minutes, meter, and pause state.

## Student-facing display

- [ ] Homeroom shows the tower HUD when visible.
- [ ] Math shows the tower HUD when visible.
- [ ] Reading shows the tower HUD when visible.
- [ ] Tracker label is readable from the back of the room.
- [ ] Voice level badge is clear.
- [ ] Meter bar is large and clear.
- [ ] All five NOISE towers appear.
- [ ] Each tower shows its letter clearly.
- [ ] Each tower state is visually distinct.
- [ ] Noisy point count is large enough.
- [ ] Lap minutes are large enough.
- [ ] Status message is readable.
- [ ] Damaged state appears when a tower has 1 HP.
- [ ] Destroyed state appears when a tower reaches 0 HP.

## Visibility and placement

- [ ] Noise card can be hidden from Homeroom through Student Board Cards.
- [ ] Noise card can be hidden from Math through Student Board Cards.
- [ ] Noise card can be hidden from Reading through Student Board Cards.
- [ ] Display mode hides Teacher Dock.
- [ ] Display mode hides noise controls.
- [ ] The tower card does not clip critical text.
- [ ] The tower card remains readable without covering essential content too aggressively.

## Persistence

- [ ] Refresh keeps voice level choices.
- [ ] Refresh keeps noisy points.
- [ ] Refresh keeps lap minutes.
- [ ] Refresh keeps meter level.
- [ ] Refresh keeps tower HP state.
- [ ] Reset to defaults restores default towers.

## Safety

- [ ] No microphone permission prompt appears.
- [ ] No WebRTC prompt appears.
- [ ] No network/API calls are required.
- [ ] No cloud sync is required.
- [ ] No new dependencies were added.

## Validation

- [ ] `npm run build` passes.
- [ ] `npm run lint` passes.
