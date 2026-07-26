# Phase 12B — Prize Board + Reward/Title Bank Foundation

## Goal

Build the foundation for a native Prize Board / Press Your Luck-style reward game connected to Phase 12A roster pools, plus expanded Mystery Star / High Flier title banks.

## Scope (this phase)

- Title bank model with class locks and rarity metadata
- Default prize bank with active/inactive prizes
- Mystery Box as a prize container
- 100-tile Prize Board with local-first persistence
- Teacher Prize Board panel in `/control`
- Display-safe helpers (full `/display` board view deferred)
- Focused tests

## Out of scope (Phase 12C)

- Complex Whammy animation
- Heavy sound engine / drumroll / suspense
- Advanced particles and game-show lighting
- Classroom-safe sound toggle
- Full cinematic Prize Board display view

## Title bank rules

- **Shared titles** appear in all class pools (homeroom, math, reading:RM4, reading:SM5).
- **Class-locked titles** only appear for matching class group:
  - `homeroom` — 30 homeroom-only titles
  - `reading` — 30 reading-only titles (both reading section pools)
  - `math` — 30 math-only titles
- **Rarity**: common, uncommon, rare, legendary
- **Reuse avoidance**: titles used in a pool within the last 14 days are depriorized
- Mystery Star slots auto-receive a title when marked **earned**

## Prize bank defaults

Active prizes: Medium/Small 3D Print, Treasure Box, Mystery Box, Lunch with Friend, Switch Seat Pass, +10/+5/+3 Stamps, Sticker or Small Prize, Stuffed Animal or Toy at Recess, No Shoes Pass (uncommon).

Inactive: Teacher Chair Pass.

Omitted: No Homework Pass, Read with a Friend, Class DJ Pick.

## Mystery Box

Mystery Box is a **container prize** (category: `container`). It appears on the board as a rare tile. The teacher opens it and selects from the mystery-eligible pool:

- +3 Stamps, +5 Stamps, Sticker or Small Prize, Treasure Box, Switch Seat Pass, Small 3D Print, Stuffed Animal or Toy at Recess

## Privacy boundaries

- State/history uses stable student ids
- UI labels use `displayName` / preferred names
- `/display` does not expose prize settings, hidden tiles, or teacher controls
- Display-safe board snapshot strips ids and unrevealed prizes

## Validation

- `npm run build`
- `npm run lint`
- `npm run test:student-picker`
- `npm run test:prize-board`
- `npm run test:local-packets`
- Privacy grep for real legal names

## Next phase

**Phase 12C** — visual/sound/suspense spectacle layer: lights, drumroll, Whammy fakeout, prize explosion animation, classroom-safe sound toggle, and student-safe Prize Board display view.
