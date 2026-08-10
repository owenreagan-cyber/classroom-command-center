# Teaching Block + Resource + Rundown Model

**Phase:** 16A.0 — Design & Architecture Spec
**Status:** Proposed (no implementation)
**Date:** 2026-08-09

---

## 1. Teaching Block

A **Teaching Block** is one teachable moment in the school day. It is the atomic unit of classroom orchestration.

### 1.1 Examples

| Block | Type | Typical Duration |
|---|---|---|
| Morning Arrival | Routine | 15–30 min |
| Class Welcome | Routine | 5–10 min |
| Math | Subject | 45–60 min |
| Reading | Subject | 45–60 min |
| Snack | Break | 15 min |
| Lunch | Break | 30–45 min |
| Transition | Routine | 3–5 min |
| Independent Work | Subject | 20–45 min |
| Test Mode | Assessment | varies |
| Cleanup | Routine | 5–10 min |
| Dismissal | Routine | 10–15 min |

### 1.2 Block Ownership

Every Teaching Block **owns**:

| Owned Element | Description |
|---|---|
| Classroom Screen | The live display rendered to `/display` for students |
| Linked Resources | Presentations, PDFs, videos, OmniNote packages, worksheets, teacher notes, links, Google Drive files |
| Tool Presets | Noise meter sensitivity, timer defaults, Mystery Star config, behavior tool state |
| Readiness Status | Prep checklist: is every required resource available and loaded? |
| Handoff Actions | Send to iPad, Open in OmniNote, cast to display |

### 1.3 Block Lifecycle

```
Pending → [Prep Check] → Ready → [Teacher activates] → Active → [Teacher advances] → Completed
```

- **Pending:** block exists in the rundown but no prep has been done.
- **Ready:** all required resources are linked and verified; teacher has reviewed.
- **Active:** the block's screen is live on `/display`; tools and resources are positioned for use.
- **Completed:** block is done; next block is pending activation.

---

## 2. Relationship to Existing Systems

### 2.1 Today's Rundown

The **Rundown** is the **ordered list of Teaching Blocks** for the current school day.

```
Today's Rundown = [Block₁, Block₂, Block₃, ..., Blockₙ]
```

- Blocks are ordered by scheduled start time.
- Only one block is Active at a time.
- The Rundown drives navigation (Previous, Next) and the prep checklist.

### 2.2 Resource Loader

The **Resource Loader** is the **resource drawer for the Active Teaching Block**.

- Opened from within Teach Mode.
- Shows resources resolved via the fallback chain (see §5).
- Displays available actions per resource type.
- Always scoped to the active block — it does not browse global resources.

### 2.3 Today Prep

**Today Prep** is the readiness checklist for the day's Teaching Blocks.

- Rendered in Dashboard Mode (overview).
- Shows, per block: resources linked ✓/✗, screen ready ✓/✗, tools configured ✓/✗.
- Single-tap to link or fix a missing resource.
- Flag blocks that are "not ready" so the teacher can fix them before class.

### 2.4 Curriculum Sync

**Curriculum Sync** is the future discovery/linking layer.

- Sources: Google Drive, district curriculum library, shared team folders.
- Purpose: suggest and auto-link resources to Teaching Blocks based on subject, grade, and pacing guide.
- Not required for Phase 16A.x slices; designed here for forward compatibility.
- When a block has no manually linked resource, Curriculum Sync results feed into the fallback chain at tier 3 (subject defaults) and tier 4 (recent resources).

### 2.5 Display Studio

**Display Studio** is the Classroom Screen editor.

- Create/edit screens attached to a Teaching Block.
- Each screen has reserved layout zones (see §3).
- Screens are stored by block ID; a block may have one screen or a sequence of slides.
- Display Studio operates in Studio Mode.

### 2.6 Classroom Atmosphere

**Classroom Atmosphere** is the music/mode preset attached to a Teaching Block.

- Presets: Quiet Work, Collaborative, Energizer, Test Mode, Transition.
- Each preset maps to: background music, volume level, noise meter threshold.
- Attached per block; changes when the active block changes.

### 2.7 Quick Tools (Behavior, Mystery Star, Noise, Timer)

Each Teaching Block carries its own **tool preset bag**:

| Tool | Preset |
|---|---|
| Noise Meter | Sensitivity threshold, auto-warning on/off |
| Timer | Default duration, count-up or count-down |
| Mystery Star | Enabled/disabled, selection pool |
| Behavior | Active behavior tracking mode (positive-only, warnings, etc.) |

When a block activates, the preset bag applies automatically.

---

## 3. Classroom Screen Layout Zones

Every Classroom Screen **must** divide its layout into reserved zones. No floating element may overlap dynamic content.

### 3.1 Zone Definitions

```
┌──────────────────────────────────────────────┐
│ HEADER / TITLE ZONE                          │
│ Block name, subject, grade                   │
├──────────────────────────────────────────────┤
│ STATUS / CLOCK / MUSIC / NOISE ZONE          │
│ Real-time indicators, always visible         │
├──────────────────────────────────────────────┤
│                                              │
│ MAIN CONTENT ZONE                            │
│ Presentation, PDF, video, text, slides       │
│ (takes remaining height)                     │
│                                              │
├──────────────────────────────────────────────┤
│ WIDGET / TOOL ZONE (optional, collapsible)   │
│ Timer, Mystery Star, behavior bar            │
├──────────────────────────────────────────────┤
│ FOOTER / REMINDER ZONE                       │
│ Next block preview, date, class motto        │
└──────────────────────────────────────────────┘
```

### 3.2 Non-Negotiable Rules

1. **No floating clock, badge, timer, or status element may overlap dynamic text.** Status elements must live in reserved rows, columns, or slots.
2. The header and status zones are always visible — they do not scroll.
3. The main content zone is the only zone that scrolls or paginates.
4. The widget/tool zone is collapsible per teacher preference.
5. The footer is always visible and shows at minimum the next-block preview.
6. All zone heights are configurable via Display Studio but must never collapse to zero in Teach Mode.

---

## 4. Resource Model

### 4.1 Core Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | ✓ | Unique resource identifier |
| `type` | enum | ✓ | One of the resource types below |
| `title` | string | ✓ | Display name |
| `source` | string | ✓ | URI, file path, or Google Drive ID |
| `visibility` | enum | ✓ | `'teacher-only'` or `'student-safe'` |
| `blockId` | string? | | Teaching Block this resource is linked to |
| `lessonId` | string? | | Lesson this resource is linked to |
| `subjectId` | string? | | Subject for default/recent fallback |
| `metadata` | object | | Type-specific metadata (page count, duration, etc.) |

### 4.2 Visibility

One field, two values:

- `'student-safe'` — safe to show on `/display` or share with students.
- `'teacher-only'` — visible only to the teacher (Teacher Mode, Dashboard Mode); never rendered to `/display`.

**Do not use** separate `teacherOnly` and `studentSafe` booleans. The enum prevents contradictory states.

### 4.3 Resource Types

| Type | Description |
|---|---|
| `presentation` | Google Slides, PowerPoint, Keynote |
| `pdf` | PDF document |
| `video` | YouTube, local MP4, embedded |
| `omninote-package` | OmniNote lesson package |
| `worksheet` | Printable or digital worksheet |
| `teacher-notes` | Private teacher reference |
| `web-link` | URL resource |
| `local-file` | Generic local file |
| `google-drive-file` | Google Drive reference (Docs, Sheets, etc.) |

### 4.4 Actions by Type

| Resource Type | Available Actions |
|---|---|
| `presentation` | Present, Open, Send to Display, Send to iPad (if supported) |
| `pdf` | Open, Print, Send to iPad, Open in OmniNote |
| `video` | Preview, Show to Class |
| `omninote-package` | Send to iPad, Open in OmniNote |
| `worksheet` | Open, Print, Send to iPad |
| `teacher-notes` | Open Privately |
| `web-link` | Open, Show to Class (if student-safe) |
| `local-file` | Open, Send to iPad |
| `google-drive-file` | Open in Drive, Send to Display |

---

## 5. Resource Fallback Logic

When a Teaching Block becomes active, resources are resolved in this order:

```
Tier 1: Resources linked directly to this Teaching Block (blockId match)
   ↓ fallback if empty
Tier 2: Resources linked to the current Lesson (lessonId match)
   ↓ fallback if empty
Tier 3: Subject defaults (pre-configured per subject, e.g., "Math → Number Talk slides")
   ↓ fallback if empty
Tier 4: Recent resources for this subject (last N used, recency-weighted)
   ↓ fallback if empty
Tier 5: Calm "Nothing linked yet" state with a single Add Resource CTA
```

The Resource Loader UI always shows which tier served the resources, so the teacher knows whether they're looking at explicitly linked resources or fallback suggestions.

---

## 6. Teach / Studio / Dashboard Modes

### 6.1 Teach Mode (default live classroom mode)

- **One clean screen** optimized for classroom use.
- **Previous / Next / Present** navigation through the Rundown.
- **Resources** button opens the Resource Loader drawer for the active block.
- **Quick Tools** floating bar: Timer, Noise Meter, Mystery Star, Behavior.
- The `/display` renders the active block's Classroom Screen.
- No editing controls, no settings panels, no sidebar — calm and focused.

### 6.2 Studio Mode (create/edit screens)

- **Slides-style editor** for Classroom Screens.
- **Thumbnail strip** along the left or bottom for multi-slide blocks.
- **Canvas** for direct visual editing of screen content.
- **Inspector panel** for zone properties, theme, wallpapers, and tool presets.
- A block must have at least one screen to be "screen-ready" in Today Prep.

### 6.3 Dashboard Mode (overview)

- **Schedule view** — the full day's blocks in order.
- **Prep checklist** — readiness per block (Today Prep).
- **System status** — display connection, iPad battery, app health.
- Available on launch but not the default live-teaching surface.
- Teacher can switch to Teach Mode from any active block in the dashboard.

---

## 7. First Implementation Slices

These are proposed as future phases, not implemented here:

| Phase | Scope |
|---|---|
| **16A.1** | Clean Teach Mode shell: single-screen layout with Previous/Next/Present navigation |
| **16A.2** | Classroom Screen reserved-zone layout: enforce zone rules on `/display` |
| **16B** | Resource Drawer for active Teaching Block: type-aware actions, fallback chain |
| **16C** | Today Prep readiness checklist: per-block resource/screen/tool status |
| **16D** | OmniNote/iPad handoff: send-to-iPad flow from Resource Loader |
| **16E** | Studio/Edit cleanup: thumbnail strip, inspector panel, canvas editing |

---

## 8. Design Principles

1. **Calm first.** The teacher should not hunt for anything during class.
2. **One active block at a time.** No split focus.
3. **Reserved zones prevent overlap.** No ad-hoc positioning of status elements.
4. **Fallback, not empty.** A block without resources still shows something useful.
5. **Visibility is an enum, not booleans.** One source of truth.
6. **Teach Mode is the default.** Studio and Dashboard are behind explicit navigation.
7. **Every block owns its screen, its resources, and its tool presets.** No global soup.
