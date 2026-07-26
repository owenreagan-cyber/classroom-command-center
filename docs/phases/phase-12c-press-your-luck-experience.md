# Phase 12C — Press Your Luck Experience Layer

## Goal

Transform the Prize Board foundation into an engaging classroom game-show experience while preserving local-first architecture, privacy boundaries, and iPad/AirPlay performance.

## Scope (this phase)

- Press Your Luck state machine (`idle` → `ready` → `spinning` → `stopping` → `revealing` → `celebrating` / `miss`)
- Fullscreen projector mode on `/display` during active spins
- Board scanning animation (rAF, transform/glow only)
- Secret teacher stop zone (invisible, control-only)
- Rarity-based prize reveal experiences
- Mystery Box multi-stage reveal
- Whammy foundation (state machine + placeholder visuals)
- Classroom-safe Web Audio manager (generated tones, sound toggle)
- Teacher controls in `/control` only
- Cross-tab state sync for control ↔ display windows

## Out of scope

- AI image generation
- Backend services / external APIs
- Final Whammy artwork
- External audio files
- Replacing Prize Board architecture from Phase 12B

## Game states

| State | Description |
|-------|-------------|
| `idle` | No active game |
| `ready` | Pool selected, awaiting spin |
| `spinning` | Board scan animation running |
| `stopping` | Early stop deceleration (800ms) |
| `revealing` | Outcome reveal (prize, student, mystery, whammy) |
| `celebrating` | Rarity-scaled celebration |
| `miss` | Empty tile or whammy consequence |

## Projector behavior

When spin begins, `/display` hides the normal board workspace and shows only:

- 100-tile board with highlight effects
- Game status header
- Reveal overlays (prize, mystery, whammy, miss)

Hidden on `/display`:

- TeacherDock, settings, prize editor, controls, private fields

## Privacy rules

- Display tiles use `stripPrivateBoardFields()` — unrevealed prizes masked as empty
- No `studentId`, `prizeId`, or teacher control IDs on display DOM
- Secret stop zone mounts only in `/control`
- Test celebration tools are teacher-only

## Audio behavior

- Web Audio API generated tones (no external files)
- Initializes after user interaction (`unlockAudio`)
- Respects `soundEnabled` toggle (persisted)
- Silent when disabled — no autoplay failures

## Whammy foundation

Sequence: fake reward → alarm → whammy appear → message → consequence

Configurable consequences: `loseSpin`, `consolationPrize`, `downgradePrize`

Placeholder emoji/CSS character — final artwork deferred to Phase 12D.

## Validation

```bash
npm run build
npm run lint
npm run test:student-picker
npm run test:prize-board
npm run test:local-packets
```

## Next phase (12D)

- Final Whammy artwork and sound design
- External audio asset option
- Drumroll / suspense layering
- Advanced particles and game-show lighting
- E2E display snapshot tests for projector mode
