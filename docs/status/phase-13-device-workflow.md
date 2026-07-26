# Phase 13 — Device Workflow

**Status:** Hardware ecosystem documentation  
**Purpose:** Define how MacBook, iPad, and projector work together in the classroom.

---

## Hardware Roles

| Device | Role | Software | Route |
|--------|------|----------|-------|
| MacBook | Teacher command center | Classroom Command Center | `/control` |
| Projector / TV | Student display | Classroom Command Center | `/display` |
| iPad | Annotation control surface | OmniNote (future) | Native app |
| Apple Pencil | Writing and markup | OmniNote | Pencil input |

---

## Typical Classroom Setup

```
┌─────────────┐     AirPlay / HDMI      ┌──────────────┐
│   MacBook   │ ──────────────────────► │  Projector   │
│  /control   │                         │  /display    │
└─────────────┘                         └──────────────┘
       │                                        ▲
       │  Display Launch                        │  Student view
       │  (opens /display window)               │
       └────────────────────────────────────────┘

┌─────────────┐     Share Sheet / AirDrop
│    iPad     │ ◄──────────────────────────── MacBook
│  OmniNote   │
└─────────────┘
       │
       │  AirPlay / USB-C
       ▼
┌──────────────┐
│  Projector   │  (optional: switch input to iPad during annotation)
└──────────────┘
```

---

## Workflow 1: Standard Classroom Display

1. Teacher opens Command Center on MacBook at `/control`
2. Teacher clicks **Display Launch** → opens `/display` in new window
3. Teacher drags display window to projector (AirPlay or extended desktop)
4. Students see the classroom board, timers, morning message, etc.
5. Teacher controls everything from the dock on MacBook

**Validated:** Display Launch panel, `/display` route privacy, fullscreen button.

---

## Workflow 2: Resource Presentation

1. Teacher adds resource link in **Today Prep** (Google Slides, PDF, etc.)
2. Teacher clicks **Show on Display** → safe label appears on projector
3. Teacher opens resource in browser on MacBook (teacher-only)
4. Students see only "Now Showing: Chapter 5 Slides" — no URL

**Validated:** Now Showing label, display privacy E2E, teacher-only resource links.

---

## Workflow 3: OmniNote Annotation (Future)

1. Teacher prepares worksheet/PDF in Today Prep
2. Teacher clicks **Open in OmniNote** → link copied or deep link generated
3. Teacher opens resource on iPad in OmniNote
4. Teacher annotates with Apple Pencil
5. Optional: AirPlay iPad to projector for live annotation
6. Command Center display shows "Now Annotating: Mountain Worksheet"
7. After annotation, teacher switches projector back to Command Center display

**Status:** Bridge foundation in Phase 13; native OmniNote app not yet built.

---

## Workflow 4: Prize Board / Press Your Luck

1. Teacher configures prize board in dock on MacBook
2. Display window shows fullscreen projector mode during spin
3. Teacher uses Secret Stop (invisible control on MacBook) during spin
4. Students see safe tile labels only — no student IDs or prize IDs

**Validated:** Projector mode E2E, iPad landscape control QA, display privacy.

---

## Workflow 5: Music Atmosphere

1. Teacher selects music mode in **Classroom Atmosphere** panel
2. Spotify embed plays on MacBook (teacher hears audio)
3. Optional: "Show music indicator on display" → students see "Focus Music" badge
4. No URLs or controls visible on display

**Status:** Phase 13 implementation.

---

## AirPlay Considerations

| Scenario | Method | Status |
|----------|--------|--------|
| MacBook → Projector | AirPlay or HDMI extended display | Manual (no auto-detect) |
| iPad → Projector | AirPlay mirroring | Manual (OmniNote future) |
| Display window placement | Drag to external monitor | Manual |
| Fullscreen on projector | Browser fullscreen button on `/display` | Supported |

**Not yet implemented:**
- AirPlay device detection
- Automatic display window placement on external monitor
- Display arrangement guidance UI

---

## Touch Workflow (iPad Control)

| Action | iPad Support | Notes |
|--------|-------------|-------|
| Command Center `/control` | Partial | Prize board iPad landscape QA done |
| Command Center `/display` | Yes | Snapshots at iPad viewport |
| OmniNote annotation | Future | Requires native app |
| Apple Pencil input | Future | OmniNote only |

---

## Validation Checklist

- [x] `/control` and `/display` route separation
- [x] Display Launch opens new window
- [x] Fullscreen button on display shell
- [x] No teacher controls on `/display`
- [x] Now Showing label (no URLs)
- [x] Prize board projector privacy
- [x] iPad landscape control usability (prize board)
- [ ] AirPlay detection / guidance
- [ ] Automatic external display placement
- [ ] OmniNote Share Sheet handoff
- [ ] Apple Pencil annotation workflow
- [ ] Display input switching guidance

---

## Recommended Hardware

| Item | Recommendation |
|------|---------------|
| MacBook | Any Apple Silicon MacBook (M1+) |
| iPad | iPad Pro or iPad Air with Apple Pencil 2 / Pro |
| Projector | Any HDMI or AirPlay-compatible display |
| Audio | MacBook speakers or classroom PA via Bluetooth/AUX |
| Network | School Wi-Fi (Spotify embed requires internet) |
