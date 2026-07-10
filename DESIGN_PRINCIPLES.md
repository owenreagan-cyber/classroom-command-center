# Design Principles — Classroom Command Center

Command Center is a classroom display app, not a SaaS dashboard.

It must be readable, fast to understand, and visually polished from across a real classroom.

## Viewing contexts

### Classroom display

Used on a projected or mirrored display. Viewed by students from 10–25 feet away and by the teacher while teaching.

Requirements:

- nothing subtle for student-critical information
- status must be understandable in under one second
- numbers and labels must be large
- display mode must hide teacher-only controls
- visual hierarchy matters more than feature density

### Teacher control panel

Used close-up by the teacher for quick adjustments during class.

Requirements:

- controls must be quick
- labels must be clear
- destructive actions need warning copy
- panels should be compact but not cramped

## Typography

Current display guidance:

- classroom-display critical labels: large, bold, high contrast
- classroom-display critical numbers: extra-large, tabular where useful
- classroom-display status messages: short, bold, readable
- teacher-panel text: compact but readable
- hierarchy should come from size, weight, spacing, and layout — not color alone

Avoid:

- tiny all-caps helper text as the only student-facing label
- long all-caps paragraphs
- low-opacity gray for student-critical text
- awkward wrapping or hyphenation

## Spacing

Use a consistent 4px/8px rhythm through Tailwind spacing.

Preferred:

- generous display-mode card padding
- clear separation between states
- enough breathing room around critical numbers
- consistent gaps between related controls

Avoid:

- cramped cards
- dense equal-size rectangles everywhere
- arbitrary one-off spacing unless there is a strong reason
- important content at the extreme projection edge

## Color

Status color is allowed, but color cannot be the only signal.

Noise states should pair color with text/state/shape:

- intact
- damaged
- destroyed
- warning
- critical
- paused/off

Avoid:

- default-looking purple/indigo AI gradients unless intentionally chosen
- washed-out low-contrast text
- glow effects that make text harder to read
- color choices that fail on a classroom projector

## Layout

Command Center should feel like a premium classroom display system, not a generic dashboard template.

Preferred:

- strong visual hierarchy
- large student-facing cards
- meaningful asymmetry where it improves focus
- clear safe zones for overlays
- consistent radius, borders, shadows, and padding across related cards

Avoid:

- generic centered-card layouts
- same-size boxes regardless of importance
- widgets that look bolted on
- overlay cards covering essential lesson content too aggressively

## Motion

Motion should support classroom awareness, not distract.

Preferred:

- small state transitions
- meter changes that feel smooth
- warning/critical emphasis that remains readable

Avoid:

- layout shift during class
- animation that makes text hard to read
- effects that compete with the lesson content

## Noise Tower Defense design rules

NoiseStatusCard, NoiseControlPanel, and tower visuals must look like one system across:

- Homeroom
- Math
- Reading

The student-facing Noise Tower Defense display must:

- show the tracker label clearly
- show voice level clearly
- show all five N/O/I/S/E towers clearly
- show intact/damaged/destroyed states clearly
- show noisy points clearly
- show lap minutes clearly
- show room meter clearly
- remain usable with manual controls only
- avoid direct anime IP names, logos, quotes, or character references

## Anti-patterns to reject

Reject these on sight:

- boxy, same-size dashboard rectangles everywhere
- default browser form controls beside styled controls
- student-critical text under 16px equivalent in display mode
- low-contrast gray labels on dark backgrounds
- important text clipped by fixed-height cards
- noisy decorative effects that reduce readability
- controls visible in display mode
- UI that compiles but looks like a generic AI template
