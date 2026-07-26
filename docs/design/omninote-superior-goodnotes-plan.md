# OmniNote — Superior GoodNotes Plan

**Status:** Requirements document  
**Purpose:** Define the feature set OmniNote must deliver to exceed GoodNotes for classroom teaching.

---

## Vision

OmniNote is the native iPad teaching canvas. It receives resources from Classroom Command Center and provides Apple Pencil-first annotation with clean student-facing presentation output.

GoodNotes is the benchmark. OmniNote must match or exceed every classroom-critical capability.

---

## Apple Pencil

| Feature | Requirement | Priority |
|---------|-------------|----------|
| Pressure support | Variable stroke width from Pencil pressure | P0 |
| Palm rejection | Ignore palm contact while writing | P0 |
| Pen tools | Ballpoint, fountain, brush presets | P0 |
| Highlighter | Semi-transparent overlay strokes | P0 |
| Eraser | Stroke eraser + pixel eraser | P0 |
| Lasso | Select, move, resize, delete stroke groups | P0 |
| Tilt support | Shading with Apple Pencil tilt | P1 |
| Double-tap tool switch | Pencil double-tap toggles pen/eraser | P1 |

---

## Tools

| Tool | Requirement | Priority |
|------|-------------|----------|
| Shapes | Rectangle, circle, triangle, arrow | P0 |
| Straight lines | Snap-to-angle line drawing | P0 |
| Ruler | On-screen ruler overlay for straight edges | P1 |
| Protractor | Angle measurement overlay | P2 |
| Text box | Typed text with font/size/color | P0 |
| Sticky notes | Quick annotation cards | P2 |
| Laser pointer | Presentation-only pointer (no ink) | P1 |

---

## Pages

| Template | Requirement | Priority |
|----------|-------------|----------|
| Notebook paper | Lined, college-ruled, wide-ruled | P0 |
| Graph paper | Standard grid (5mm, 1cm) | P0 |
| Dotted paper | Dot grid for flexible layout | P0 |
| Blank | Clean white canvas | P0 |
| Custom backgrounds | Import image as page background | P1 |
| Cornell notes | Structured note-taking layout | P2 |
| Music staff | For music class integration | P3 |

---

## Media

| Feature | Requirement | Priority |
|---------|-------------|----------|
| Insert images | From Photos, Files, clipboard, camera | P0 |
| Resize images | Drag handles with aspect ratio lock | P0 |
| Crop images | In-place crop tool | P1 |
| Rotate images | 90° increments + free rotate | P1 |
| Layer ordering | Bring forward / send backward | P1 |
| GIF support | Animated images (display only) | P3 |

---

## Presentation

| Feature | Requirement | Priority |
|---------|-------------|----------|
| Receive Command Center slides | Import slide deck from handoff | P0 |
| Annotate while presenting | Draw over slides during class | P0 |
| Hide teacher controls | Clean student-facing output | P0 |
| Student-facing output | AirPlay / external display mirroring | P0 |
| Page navigation | Swipe or button to advance slides | P0 |
| Presentation timer | Optional countdown overlay | P2 |
| Laser pointer mode | Highlight without leaving marks | P1 |

---

## PDF

| Feature | Requirement | Priority |
|---------|-------------|----------|
| Import PDF | From Files, Share Sheet, Command Center handoff | P0 |
| Markup | Full Pencil annotation on PDF pages | P0 |
| Page thumbnails | Sidebar thumbnail navigation | P0 |
| Bookmarks | Named bookmarks within document | P1 |
| Search | Text search within PDF content | P1 |
| Form filling | Write on PDF form fields | P2 |
| Multi-page scroll | Continuous vertical scroll mode | P1 |
| Export annotated PDF | Share marked-up version | P0 |

---

## Command Center Integration

| Feature | Requirement | Priority |
|---------|-------------|----------|
| Deep link open | `omninote://open?title=...&source=...` | P1 |
| Lesson package import | Read shared LessonPackage JSON | P1 |
| Now Annotating label | Command Center shows safe label on display | P1 |
| Share Sheet handoff | Receive PDF from Command Center via Share | P0 |
| Return to Command Center | Switch display back after annotation | P2 |

---

## Non-Goals (v1)

- Cloud sync / multi-device realtime ink
- Collaborative editing (multi-teacher)
- AI handwriting recognition
- Built-in classroom timers or widgets
- Student roster management
- Backend / account system

---

## Success Criteria

OmniNote v1 is ready when a teacher can:

1. Receive a PDF worksheet from Command Center
2. Annotate it with Apple Pencil (pressure, palm rejection, highlighter)
3. Present annotated slides on the classroom projector
4. Hide all teacher controls from student view
5. Export the annotated PDF for later reference

This matches GoodNotes classroom workflow with tighter Command Center integration.
