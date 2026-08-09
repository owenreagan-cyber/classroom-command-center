# Phase 15L.3 — Status Widget Slot System

**Status**: Implementation complete. Not committed.

**Branch**: `phase-15l-3-status-widget-slots`

**Parent**: 12c0c81 (Phase 15L.2 — Add Display Studio overlap warnings and collapse duplicate chrome)

---

## Summary

Phase 15L.3 introduces a slot system that gives always-on status widgets (noise-meter, work-symbols) pre-calculated safe positions outside the title bar and clock chrome areas. It also refines the Phase 15L.2 reserved zones for alignment with the new slot layout.

Four pre-existing status-adjacent elements were audited:

| Element | Implementation | In Scope? | Resolution |
|---------|---------------|-----------|------------|
| Clock (Current Time) | Fixed chrome — `ClockBlock` rendered in `DisplayScreenRenderer` header via `showClock` boolean | No | Stays as fixed chrome. Reserved zones refined to clarify clock chrome boundaries. |
| Voice-Level Badge (noise-meter) | CanvasWidget — 5 screens, all at y=5 (overlapping title/clock chrome) | Yes | All y=5 noise-meter widgets moved to `slot-top-right-status` (72,14,20,16). |
| Mode Badge (work-symbols) | CanvasWidget — 6 screens, 5 at y=5 (overlapping), 1 at y=60 (clean). One at y=5 also conflicts with directions-text at top-left. | Yes | 4 moved to `slot-top-left-status` (2,14,20,16), 1 moved to `slot-bottom-right-status` (72,70,20,16), 1 already at y=60 kept as-is. |
| Materials Icon | `DisplayScreen.materialsCard` model field rendered as grid card. `'materials'` CanvasWidget wrapper rarely used. | No | Not a free-positioned status element — left as-is. |

`/display` is unchanged. The slot system is teacher-side (`/control`) only.

---

## A. Audit Findings

### Element-by-Element

#### Clock / Current Time

- **Implementation**: Fixed React chrome. Rendered as `<ClockBlock large />` inside the `<header>` of `DisplayScreenRenderer.tsx` (line 57), using CSS flexbox `justify-between` with the title.
- **Model**: `showClock: boolean` on `DisplayScreen`. No CanvasWidget with x/y/w/h.
- **`'clock'` CanvasWidgetType**: Exists in the type union but is never instantiated as a widget. Widget library treats clock click as a `showClock` toggle.
- **Rendered on `/display`**: Yes — same component, same position.
- **Position**: Top-right of header, approximately (60-95, 0-10) on the percentage canvas.
- **Slot-managed?**: No. Clock stays as fixed chrome. Reserved zone `zone-clock-chrome` defines the region widgets should avoid.

#### Voice-Level Badge (noise-meter)

- **Implementation**: `CanvasWidget` type `'noise-meter'`. Fully positioned in `widgets[]`.
- **Default screens with noise-meter**:

| Screen | Widget ID | Old Position | Overlaps Reserved Zones? |
|--------|-----------|-------------|--------------------------|
| morning-work-to-math | `mw-nm` | (78,5,20,20) | Title Bar + Clock Chrome |
| work-time | `wt-noise` | (78,5,20,20) | Title Bar + Clock Chrome |
| work-time-15c | `wt-noise` | (68,5,20,20) | Clock Chrome |
| lunch-15c | `lr-noise` | (68,5,20,20) | Clock Chrome |
| small-groups | `sgr-noise` | (78,30,20,20) | None (y=30 clean) |

- **Settings**: `mode: 'manual'/'live'`, `level: 'silent'/'whisper'/'normal'/'loud'`
- **Rendered on `/display`**: Yes, via `WidgetDisplayOverlay`. However, `level` setting is stripped by `displaySafe.ts` (allowed keys: `text`, `heading`, `items`, `count`, `mode`, `symbol`). Falls back to `'whisper'`.

#### Mode Badge (work-symbols)

- **Implementation**: `CanvasWidget` type `'work-symbols'`. Fully positioned.
- **Default screens with work-symbols**:

| Screen | Widget ID | Old Position | Overlaps? |
|--------|-----------|-------------|-----------|
| arrival-720 | `ar-symbol` | (75,5,22,18) | Title Bar + Clock Chrome |
| work-time | `wt-symbol` | (2,5,20,20) | Title Bar |
| work-time-15c | `wt-symbols` | (2,60,20,20) | None |
| independent-practice | `ip-symbol` | (78,5,20,20) | Title Bar + Clock Chrome |
| small-groups | `sgr-symbol` | (78,5,20,20) | Title Bar + Clock Chrome |
| test-mode | `tm-symbol` | (78,5,20,20) | Title Bar + Clock Chrome |

- **Settings**: `symbol: 'silent'/'whisper'/'partner'/'group'/'independent'`
- **Rendered on `/display`**: Yes, via `WidgetDisplayOverlay`. `symbol` setting preserved by `displaySafe.ts`.

#### Materials Icon

- **Implementation**: `DisplayScreen.materialsCard` model field (not a CanvasWidget). Rendered via `MaterialsCardView` in a dedicated CSS grid column in `DisplayScreenRenderer.tsx`.
- **`'materials'` CanvasWidget**: Exists as a thin wrapper (one template: `math-launch-15c`), but mostly serves as a library toggle for the `materialsCard` model.
- **In scope for slots?**: No. The materials card is a content card in the grid, not a free-positioned status badge.

### Screen-to-Scope Mapping (Four Known Risk Screens)

| Screen | Issue | 15L.3 Status | Rationale |
|--------|-------|-------------|-----------|
| **Math Launch** (math-launch-15c) | Title/timer overlap: `ml-timer` countdown-timer at (2,5,30,30) overlaps Title Bar zone | **Partially resolved** | Reserved-zone detection warns about the title overlap. The countdown-timer is a content widget (not status), so it's not slot-managed. The materials widget at (68,5,30,30) also overlaps Title Bar + Clock Chrome — but materials is a model card, not a slot-managed status badge. These are template layout issues → 15L.4. |
| **Mystery Student** (mystery-student-15c) | Title/status vs widget: single mystery-student widget at (35,20,30,30) | **Clean** | Widget at y=20 is well below title zone (h=10) and clear of clock chrome. No slots needed. |
| **Lunch** (lunch-15c) | Title/background/timer crowding: `lr-noise` noise-meter at (68,5,20,20) and `lr-timer` routine-timer at (2,5,45,45) both overlap Title Bar | **Partially resolved** | Noise-meter moved to `slot-top-right-status` (72,14). Routine-timer at (2,5,45,45) is a content widget, not status — it overlaps Title Bar but is not slot-managed. Template layout → 15L.4. |
| **Current Time** (clock in header) | Badge collision with clock chrome area | **Resolved** | Noise-meter widgets moved below the Clock Chrome zone. Reserved zone `zone-clock-chrome` (65,0,35,12) now clearly marks the clock region. Work-symbols moved to top-left, away from clock. |

---

## B. Slot System Design

### Slot Definitions (`src/lib/statusWidgetSlots.ts`)

Pure data utility — no React, no store, no DOM dependency.

| Slot | Position | Purpose |
|------|----------|---------|
| `slot-top-right-status` | (72, 14, 20, 16) | Below clock chrome — noise-meter, voice-level |
| `slot-top-left-status` | (2, 14, 20, 16) | Below title bar — work-symbols, mode badge |
| `slot-bottom-right-status` | (72, 70, 20, 16) | Alternative bottom-right slot |
| `slot-bottom-left-status` | (2, 70, 20, 16) | Alternative bottom-left slot |

### Default Type-to-Slot Mapping

| Widget Type | Default Slot |
|-------------|-------------|
| `noise-meter` | `slot-top-right-status` |
| `work-symbols` | `slot-top-left-status` |

### Slot-Zone Validation

All four slots are positioned **outside** both reserved zones:
- Title Bar: (0, 0, 100, 10) — all slots at y ≥ 14 > 10
- Clock Chrome: (65, 0, 35, 12) — all slots at y ≥ 14 > 12, or x < 65

Verified by `validateSlotsAgainstZones()` — tested.

### Template Widget Migration

#### noise-meter (all y=5 widgets → `slot-top-right-status`)

| Screen | Widget | Old | New |
|--------|--------|-----|-----|
| morning-work-to-math | `mw-nm` | (78,5,20,20) | (72,14,20,16) |
| work-time | `wt-noise` | (78,5,20,20) | (72,14,20,16) |
| work-time-15c | `wt-noise` | (68,5,20,20) | (72,14,20,16) |
| lunch-15c | `lr-noise` | (68,5,20,20) | (72,14,20,16) |
| small-groups | `sgr-noise` | (78,30,20,20) | Unchanged (already safe) |

#### work-symbols (y=5 overlappers → top-left or bottom-right)

| Screen | Widget | Old | New | Why bottom-right? |
|--------|--------|-----|-----|-------------------|
| arrival-720 | `ar-symbol` | (75,5,22,18) | (2,14,20,16) | — |
| work-time | `wt-symbol` | (2,5,20,20) | (2,14,20,16) | — |
| work-time-15c | `wt-symbols` | (2,60,20,20) | Unchanged | Already clean at y=60 |
| independent-practice | `ip-symbol` | (78,5,20,20) | (2,14,20,16) | — |
| small-groups | `sgr-symbol` | (78,5,20,20) | (2,14,20,16) | — |
| test-mode | `tm-symbol` | (78,5,20,20) | (72,70,20,16) | Directions-text at (2,5) occupies top-left; bottom-right avoids collision |

---

## C. Reserved-Zone Update

### Zone Renamed

The `zone-top-right-status` reserved zone from 15L.2 was renamed to `zone-clock-chrome` with clarified dimensions:

| Field | 15L.2 | 15L.3 |
|-------|-------|-------|
| ID | `zone-top-right-status` | `zone-clock-chrome` |
| Label | Top-Right Status | Clock Chrome |
| x | 70 | 65 |
| w | 30 | 35 |
| Description | "Clock, voice-level badge…" | "Clock display rendered in the screen header (fixed chrome, not a widget)" |

The zone now accurately represents the clock's rendered region in the header. Voice-level badges are no longer expected in this zone — they are slot-managed below it.

### Alignment Guarantee

The slot system and reserved-zone detector agree: no slot-managed widget triggers a reserved-zone warning. Verified by two tests:
1. `validateSlotsAgainstZones` — all slots outside all zones
2. `default templates with slot-managed widgets are zone-clean` — all noise-meter/work-symbols widgets are zone-clean after migration

---

## D. Validation Results

```
npm run test:display-studio   → PASS  (91 tests, 0 failed)
npm run test:display-composer → PASS
npm run build                 → PASS
Leak guard                    → PASS
Decorative test removal       → CONFIRMED (0 matches)
Duplicate chrome guards       → PASS
Slot-zone alignment           → PASS (all slots outside reserved zones)
Slot-managed templates clean  → PASS (no zone warnings after migration)
```

---

## E. Files Changed

| File | Change |
|------|--------|
| `src/lib/statusWidgetSlots.ts` | New file — slot definitions, type-to-slot mapping, validation utility |
| `src/lib/canvasWidgetOverlapDetector.ts` | Renamed zone `zone-top-right-status` → `zone-clock-chrome`, adjusted dimension, updated description; updated known-limitations comment |
| `src/features/display-composer/defaultScreens.ts` | 9 widget position migrations (4 noise-meter, 5 work-symbols) from y=5 (chrome overlap) to safe slot positions |
| `src/lib/display-studio-tests.ts` | Updated zone name in test; added 13 slot system tests; added template zone-clean test |
| `scripts/test-display-studio.sh` | Added `statusWidgetSlots.ts` to compilation list; updated section heading |
| `docs/status/phase-15l-3-status-widget-slots.md` | This document |

**No changes to**: `/display`, Board/Scene/Widget model, state migration, routes, dependencies.

---

## F. Deferred Items

### To Phase 15L.4 (Template Completeness Audit)

- Math Launch countdown-timer at y=5 overlapping Title Bar (content widget, not slot-managed)
- Lunch routine-timer at y=5 overlapping Title Bar (content widget, not slot-managed)
- Hollow templates like Review Game
- Baked-in-text background images
- General template layout cleanup

### To Phase 15N (Model Unification)

- PageWidget overlap detection (pixel-grid coordinate system)
- Unified overlap engine across CanvasWidget and PageWidget

### Not Deferred (Resolved in This Phase)

- ~~Top-right crowding~~ → noise-meter and work-symbols now in distinct slots (top-right and top-left)
- ~~Noise-meter/clock collision~~ → noise-meter moved below Clock Chrome zone
- ~~Title bar overlap from status widgets~~ → status widgets moved to y ≥ 14 slots
- ~~Reserved-zone contradictions~~ → zones refined and slots validated against them

---

## G. Confirmation

- No tldraw installed or imported
- No Konva installed or imported
- No new dependencies
- No PageWidget migration
- No `/display` behavior change
- No Board/Scene/Widget target-model change
- No state migration
- No commit made
