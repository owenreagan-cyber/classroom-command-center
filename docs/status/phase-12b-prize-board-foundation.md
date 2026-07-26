# Phase 12B — Prize Board + Title Bank Foundation

Status: **COMPLETE (foundation)**  
Date: 2026-07-25  
Branch: `phase-12b-prize-board-foundation`

## What was built

### Title bank (`src/features/titles/`)

- 30 homeroom-only, 30 reading-only, 30 math-only, 20 shared titles
- Class-lock filtering per pool key
- 14-day recent-title avoidance per pool
- Auto-assignment on Mystery Star **earned** outcomes
- Title shown on display reveal stage

### Prize bank (`src/features/prize-board/`)

- Typed prize model with rarity, category, active flag, mystery eligibility
- Default bank with requested active/inactive/omitted prizes
- Mystery Box container + mystery-eligible sub-pool
- Rarity-weighted board generation

### Prize Board state

- Storage key: `classroom-prize-board-storage-v1`
- Per-pool boards: homeroom, math, reading, reading:RM4, reading:SM5
- 100 tiles: empty, student, prize, revealed
- Stable student ids + cached displayName on tiles
- Reveal history, prize active/inactive overrides

### Teacher UI

- `PrizeBoardPanel` in Teacher Dock (`/control`)
- Class + reading section selectors
- 10×10 grid, generate/reset, assign student, reveal, Mystery Box open
- Prize settings with active toggle, rarity badges, mystery marker

### Display safety

- `displaySafe.ts` helpers strip private fields
- Full projector Prize Board view **not built** — documented for Phase 12C/12D

## Privacy boundaries

- No real student names in tracked source/docs/tests
- `.local/` remains untracked
- `/display` unchanged for prize settings; existing Mystery Star display-safe rules preserved

## Validation results

- `npm run build` — PASS
- `npm run lint` — PASS
- `npm run test:student-picker` — PASS (36)
- `npm run test:prize-board` — PASS (58)
- `npm run test:local-packets` — PASS (167 total)
- Privacy grep for real legal names — PASS (no matches)
- `.local/` — ignored, not staged

## Known limitations

- No Whammy tiles or animation (Phase 12C)
- No sound/suspense layer (Phase 12C)
- Board generation uses fixed prize count (~24) — teacher can re-generate
- Display board view deferred to Phase 12C/12D
- `whammyEligible` field reserved but unused

## Next phase

Phase 12C: lights, suspense sounds, drumroll, Whammy fakeout, prize explosion animation, classroom-safe sound toggle, student-safe display board.
