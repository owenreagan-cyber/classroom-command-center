# Command Center Phase 7C/7D — Noise Tower Defense + Premium Student Display

## Purpose

Phase 7C/7D upgrades the manual noise tracker into the first local tower defense model for Classroom Command Center.

This phase stays fully local:

- no microphone
- no WebRTC
- no cloud sync
- no API keys or external services
- no new dependencies

Manual fallback controls stay intact so the board remains usable even before any future sensing work.

## What changed

### Tower model

Each tracker now carries a local tower line with five original letters:

- N
- O
- I
- S
- E

Each tower has 2 HP and can display as:

- intact
- damaged
- destroyed

Old saved boards without tower data migrate safely to the new shape.

### Tower rules

- Noisy points still increment the tracker count.
- The first non-destroyed tower takes damage from left to right.
- Destroying a tower adds 2 lap minutes.
- Repair ticks heal towers from right to left.
- A destroyed tower only removes 2 lap minutes when it is fully rebuilt.
- Manual lap `+/-` controls still work.
- Lap minutes never go below zero.

### Teacher controls

The Noise Trackers panel now includes:

- tower health summary
- noisy point button
- repair tick button
- reset tracker button with warning copy
- voice level controls
- manual meter slider
- lap `+/-` controls
- Served reset

### Student display

The student-facing noise card is now a premium tower defense HUD designed for projector readability.

It shows:

- tracker label
- voice level badge
- large meter
- all five NOISE towers
- tower state and HP
- noisy points
- lap minutes
- status message

## Visual quality bar

The tower display should feel:

- original
- cyber-academy inspired
- high contrast
- readable from the back of the room
- spacious enough to avoid cramped or clipped labels

## Out of scope

This phase does not add:

- microphone sensing
- WebRTC remote sensing
- cloud features
- API-based automation
- new packages
- direct anime names, characters, logos, or quotes

## Validation

Required validation:

```bash
npm run build
npm run lint
```

Manual QA checklist:

```bash
docs/qa/phase-7c-7d-noise-tower-defense-qa.md
```
