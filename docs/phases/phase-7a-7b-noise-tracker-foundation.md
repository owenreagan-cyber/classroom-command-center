# Command Center Phase 7A/7B — Noise Tracker Foundation + Manual Voice Controls

## Purpose

Phase 7A/7B adds the first classroom noise tracking foundation to Command Center.

This phase intentionally stays local and manual:

- no microphone
- no WebRTC
- no cloud
- no AI/API dependency
- no copyrighted anime/IP dependency

The goal is to create durable saved state, teacher controls, and a polished student-facing noise status display before adding tower damage, repair crews, microphone sensing, or remote iPad sensors.

## What was added

### Trackers

Three saved noise trackers were added:

- Homeroom
- Math
- Reading

Each tracker stores:

- tracker id
- label
- voice level
- noisy points
- lap minutes
- meter level
- paused/off state

### Voice levels

Supported voice levels:

- Silent
- Whisper
- Normal
- Off

These are manual controls in this phase. Microphone sensitivity mapping comes later.

### Teacher controls

The Teacher Dock now includes a Noise Trackers panel with:

- Homeroom, Math, and Reading tracker controls
- voice level selection
- manual meter slider
- `+ noisy` button
- `-2 min` button
- `+2 min` button
- `Served` button to reset lap minutes

### Student-facing display

A polished `NoiseStatusCard` was added for:

- Homeroom
- Math
- Reading

The card shows:

- Noise Defense label
- tracker name
- voice level badge
- large meter bar
- noisy point count
- lap minutes
- student-facing status message

The visual design is intentionally more polished than a plain counter box and prepares for the later anime-inspired tower defense card.

## Carryover model

This phase supports separate tracker state for:

- Homeroom
- Math
- Reading

Homeroom can later become the shared/default tracker across most non-vibe pages, while Math and Reading can remain isolated for their dedicated vibe modes.

## Out of scope

This phase does not add:

- microphone input
- iPad remote sensor
- PeerJS/WebRTC
- HTTPS local certificate setup
- tower damage/repair visuals
- automatic green-zone repair
- custom tracker creation
- seasonal/noise defense themes
- direct anime character names, quotes, or branded visuals

## Visual quality bar

Noise display work must remain:

- readable from the back of the room
- large enough for projector use
- visually polished
- not cramped
- not a cheap/plain HTML counter
- compatible with future premium tower visuals

## Validation

Required validation:

```bash
npm run build
npm run lint
```

Manual QA checklist:

```bash
docs/qa/phase-7a-7b-noise-tracker-foundation-qa.md
```
