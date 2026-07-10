# Classroom Command Center — Visual Design and Background Plan

Status: active planning document

## Core Visual Decision

Keep Canva, but use it correctly.

Canva is the static visual asset factory.

React/Command Center owns:
- widgets
- live timers
- student directions
- teacher controls
- resource launcher
- annotations
- state
- interactions

OmniNote owns:
- Apple Pencil annotation
- PDF/slides teaching
- presentation masking
- teacher-private tools

## Canva Role

Use Canva for:
- static polished 1920x1080 backgrounds
- subject theme packs
- printable posters
- badges
- reward/pass designs later
- safe-zone board wallpapers

Do not use Canva for:
- live widgets
- timers
- lesson data
- editable daily text
- annotation
- student-facing live controls
- runtime app logic

## Layered Visual System

Use this layered model:

1. Static background art
2. Subtle procedural/animated overlay
3. React widgets/cards
4. Teacher controls, hidden from students
5. Annotation layer, later

This keeps visuals rich without making the board unreadable.

## Background Families

Create three main visual families:

1. Calm Classroom
2. Hero / Anime Training Academy
3. Professional Cyber-Slate

Each subject can have variants.

## Subject Theme Ideas

Homeroom:
- warm morning board
- calm classroom
- sunrise / morning briefing

Math:
- training lab
- precision grid
- hero academy calculation room
- energetic but readable

Reading:
- cozy library
- sky book world
- calm story studio

Spelling:
- word forge
- pattern lab
- vocabulary workshop

Science:
- lab
- discovery station
- field research
- experiment board

History:
- archive room
- map room
- museum wall
- explorer desk

Snack/Lunch:
- calm flow board
- cafeteria routine
- quiet reset

Ready Position:
- expectation poster
- focus board
- clean heroic stance

## Background Requirements

Every background should:
- be 1920x1080
- leave safe zones for live React cards
- avoid baked daily text
- avoid important art behind card zones
- keep the center and left-third readable
- use decorative detail around edges
- support high contrast cards
- work from the back of the classroom
- feel polished but not distracting

## Safe-Zone Rule

Canva provides atmosphere.
React provides information.

If a background has:
- text under text
- faces under cards
- bright busy areas under white cards
- important details hidden by widgets
- baked titles conflicting with React titles

then it should be refined.

## Current Background Pipeline

Current asset folder:
- `public/assets/backgrounds/`

Current manifest:
- `src/data/backgroundAssets.ts`

Current exported backgrounds:
- homeroom-morning-briefing.png
- math-training-lab.png
- reading-sky-book-world.png
- snack-lunch-flow-control.png
- ready-position-expectations.png

## Visual Levels

### Level 1

- Canva static backgrounds
- fallback gradients
- background manifest
- manual background picker

### Level 2

- safe-zone optimized backgrounds
- multiple variants per screen
- subject theme packs
- calm/professional/anime modes
- background preview
- subtle CSS/React overlays
- high-contrast card zones
- optional subtle motion toggle

### Level 3

- Rive/Lottie animated accents
- seasonal theme packs
- reward-unlocked themes
- Canva + Chief-of-Staff asset pipeline
- rare Spline/3D showcase screens
- auto-registered new backgrounds

## Additional Visual Tools

### CSS / React Background Components

Use for:
- subtle aurora
- mesh gradients
- starfields
- soft particles
- subject energy overlays

Prefer copy-paste/lightweight components before installing large dependencies.

### Lottie

Use later for:
- timer complete animation
- checkmarks
- transitions
- reward effects
- small sticker/badge motion

### Rive

Use later for:
- small animated mascots
- interactive badge animations
- voice level indicator
- timer celebration
- reward reveal

### Spline / 3D

Use rarely.

Possible uses:
- special hero screens
- reward reveal
- one-off showcase board

Avoid using 3D for every daily background because:
- it may distract students
- it may slow devices/projectors
- it may compete with widgets

## Background Strategy Recommendation

Use:
- Canva for static subject art
- React/CSS for subtle overlays
- Lottie/Rive for small animated accents
- Spline only for rare special visuals

Do not make every background animated.

The classroom board should be:
- amazing
- readable
- calm enough to teach from
- reliable every day

## Future Canva Improvements

Create Canva prompts that request:
- smartboard-safe background
- empty safe zones
- no large central text
- no daily lesson text
- decorative edges
- high contrast behind cards
- subject mood
- student-friendly, anime-inspired, but readable

## Example Canva Prompt Pattern

Create a 1920x1080 classroom smartboard background for [SUBJECT].  
Style: [calm classroom / anime training academy / cyber-slate].  
Leave large empty safe zones for live React cards.  
Do not include daily lesson text.  
Keep the center and left third readable.  
Use decorative details around the edges.  
Make it polished, student-friendly, and projector-readable.  
