# Classroom Command Center — Widget Evolution Roadmap

Status: active planning document
App: `~/Projects/classroom-command-center`

## Current Build Foundation

Completed:
- Canva-generated classroom backgrounds in `public/assets/backgrounds/`
- Background manifest: `src/data/backgroundAssets.ts`
- SmartTextCard system
- AutoFitText with no silent clipping
- Visible `+ more` overflow indicator
- Conservative local Beautify
- Undo Beautify in edit mode
- MaterialsCard
- ReminderCard
- DoNowCard
- ReadyPositionCard
- Homeroom screen
- Math screen
- Reading screen
- Snack/Lunch screen
- Ready Position screen
- Display/Edit modes
- Local persistence
- TimerWidget
- PhaseTimerCard / RoutineTimerCard
- Timer reload recovery using wall-clock `endsAt`
- Widget visibility toggles and Edit mode placeholders
- Inline editing polish (labels, focus, placeholders)
- Voice Level / Traffic Light widget (microphone-free student voice expectations guide)
- Build and lint passing

Parked:
- Reward Maker Studio
- Coupon/pass generator
- QR job badges
- Canvas/Gmail integrations
- AI/API Beautify
- local LLM
- iPad remote
- Xcode/native wrapper
- schedule automation

Hard rule:
Do not hardcode snack, lunch, dismissal, transition, ClassPass, or job-check clock times. Any timing must be editable duration/preset content only until the current school year schedule is known.

---

## Level System

Level 1 = basic features / gets the job done
Level 2 = more features, appearance changes, better teacher control
Level 3 = maxed out / fully decked out / automated or integrated

---

## Current Priority Order

1. Daily Brief Intake
2. Lesson Card
3. Vocabulary Card
4. Random Picker

Do not chase Level 3 features until the MVP board els excellent.

---

## Widget Roadmap

### Screen Navigation / Subject Boards

Level 1:
- Manual screen switching
- Saved selected screen
- Homeroom, Math, Reading, Snack/Lunch, Ready Position

Level 2:
- Custom screen names
- Reorder screens
- Duplicate screen templates
- Projector readability modes

Level 3:
- Schedule-aware auto-switching
- Canvas/Chief-of-Staff daily lesson screens
- iPad remote control

---

### Background / Theme System

Level 1:
- Local Canva-exported PNG backgrounds
- Background manifest
- Fallback gradients
- Per-screen backgrounds

Level 2:
- Better background picker
- Safe-zone overlays
- Subject theme packs
- Card contrast modes
- Canva refinement pass

Level 3:
- Automated Canva/Chief-of-Staff asset pipeline
- Seasonal wallpaper factory
- Reward-unlocked themes

---

### Display / Edit Mode

Level 1:
- Toggle display/edit
- Hide teacher controls in display mode

Level 2:
- Full-screen projector mode
- Keyboard shortcuts
- Lock board mode
- Simplified teacher dock

Level 3:
- iPad remote
- Teacher-only private controls
- Showtime mode

---

### AutoFitText

Level 1:
- Scale text to fit
- Prevent silent clipping
- Report overflow
- Show `+ more`

Level 2:
- Fit strategy presets
- Compact mode
- Hero mode
- Two-column mode
- Dense mode

Level 3:
- AI layout optimizer
- Projector calibration
- Automatic screen-wide reflow

---

### SmartTextCard

Level 1:
- Title/body/bullets
- Locked content
- Display/edit variants
- No silent clipping

Level 2:
- Inline editing
- Card style picker
- Alignment picker
- Duplicate card
- Compact/hero variants

Level 3:
- Drag/resize layout editor
- AI beautify
- Auto-layout suggestions
- Screen design optimizer

---

### Beautify

Level 1:
- Trim whitespace
- Normalize bullets
- Preserve card type
- Undo Beautify

Level 2:
- Preview before apply
- Per-card Beautify
- Screen-wide Beautify
- Style presets

Level 3:
- AI rewrite
- Grade-level wording
- Canvas/email/lesson cleanup
- Projector-ready scoring

---

### ReminderCard

Level 1:
- Title and bullet reminders

Level 2:
- Icons
- Priority markers
- Compact/large variants
- Check-off mode

Level 3:
- Pull reminders from Daily Brief, calendar, Canvas, or email

---

### DoNowCard

Level 1:
- One clear task

Level 2:
- Prompt style options
- Writing lines
- Timer pairing
- Subject variants

Level 3:
- Generated from lesson plan or Canvas
- Saved Do Now library
- Standards/DOK tagging

---

### MaterialsCard

Level 1:
- Have Out list
- Put Away list
- Compact fallback
- No clipping

Level 2:
- Icons
- Columns
- Subject presets
- Strong out/away visual contrast

Level 3:
- Auto-filled from lesson plan, Canvas files/modules, or daily brief

---

### ReadyPositionCard

Level 1:
- Full and compact Ready Position display

Level 2:
- Icon badges
- Poster mode
- Call-and-response display

Level 3:
- Behavior system integration
- Glow/Grow integration
- Noise meter response
- Class streak tracking

---

### TimerWidget

Level 1:
- Countdown
- Start/pause/resume/reset
- Presets
- Custom duration
- Add/subtract minute
- Time’s Up
- Reload recovery

Level 2:
- Progress ring/bar
- Appearance presets
- Optional chime
- Visual Time’s Up animation
- Compact/hero modes

Level 3:
- Multiple timers
- Stopwatch/count-up
- Clock mode
- Schedule routines
- Student pacing analytics

---

### PhaseTimerCard / RoutineTimerCard

Level 1:
- Editable phases
- Start/pause/resume/reset
- Auto-advance
- Routine Complete

Level 2:
- Add/remove/reorder phases
- Preset routine library
- Phase colors/icons
- Better progress display

Level 3:
- Schedule-linked routines
- ClassPass integration
- Automatic screen transitions
- iPad remote status

---

### Clock Widget

Level 1:
- Current time/date

Level 2:
- Analog/digital styles
- Compact/large modes
- School day label

Level 3:
- Schedule countdown
- Next transition
- ClassPass/screen automation

---

### Voice Level / Traffic Light

Level 1:
- Manual status: Silent, Whisper, Partner, Group, Free

Level 2:
- Icons
- Color themes
- One-click classroom modes

Level 3:
- Linked to noise meter
- Linked to routines
- Schedule-aware classroom modes

---

### Noise Meter

Level 1:
- Manual noise status

Level 2:
- Microphone-based meter
- Threshold settings
- Visual gauge
- No storage

Level 3:
- Class streaks
- Visual effects
- Routine-linked noise response

---

### Random Picker

Level 1:
- Paste list
- Pick one randomly
- Session-only by default

Level 2:
- Groups
- Exclude absent students
- History
- Reset bag

Level 3:
- Fairness balancing
- Participation tracking
- Team generator
- Glow/Grow integration

---

### Group Maker

Level 1:
- Paste list
- Choose group size
- Generate groups

Level 2:
- Save group presets
- Avoid repeats
- Absent toggle

Level 3:
- Behavior/academic balancing
- Canvas roster import
- Seating chart integration

---

### ClassPass / Hall Pass

Level 1:
- Manual pass status: Available / In Use / Closed

Level 2:
- Bathroom/locker/nurse icons
- Capacity limits
- Timer per pass

Level 3:
- iPad check-in/out
- QR badges
- Schedule-aware modes
- Chief-of-Staff logs

---

### Reward / Coupon Display

Level 1:
- Display reward card or homework pass image

Level 2:
- Reward picker
- Sticker/badge preview
- Printable link

Level 3:
- Full Reward Maker Studio
- QR job badges
- Printable sheets
- Reward economy

Status:
Parked for later.

---

### Prize Wheel

Level 1:
- Manual wheel items
- Spin and select

Level 2:
- Save wheels
- Sound/animation toggle
- Class-safe presets

Level 3:
- Reward economy
- Rarity
- Gacha reveal
- Canva/Reward Maker assets

---

### Glow / Grow

Level 1:
- Manual positive note / growth note

Level 2:
- Quick templates
- Copy-to-email
- Private mode

Level 3:
- Parent communication generator
- Behavior trend summaries
- Reward integration

---

### Daily Brief Intake

Level 1:
- Paste daily lesson info and populate cards manually

Level 2:
- Parse pasted text into Do Now, materials, lesson, reminders

Level 3:
- Pull from Canvas files/modules, email, and calendar through Chief of Staff

---

### Lesson Card

Level 1:
- Lesson title/objective

Level 2:
- Objective
- Agenda
- Vocabulary
- Page numbers
- Homework

Level 3:
- Canvas/lesson-plan integrated
- Subject-specific modes
- Auto-updated from Daily Brief

---

### Vocabulary / Word Card

Level 1:
- Word and definition

Level 2:
- Multiple cards
- Flip mode
- Subject theme
- Pronunciation clue

Level 3:
- Reading/spelling importer
- Quiz mode
- Spaced review

---

### PDF / Document Viewer

Level 1:
- Link or placeholder for local document

Level 2:
- Local file display
- Page navigation
- Zoom

Level 3:
- Canvas files/modules ingestion
- Annotation
- Apple Pencil/native wrapper

---

### Layout Editor

Level 1:
- Fixed screen templates

Level 2:
- Choose layout templates
- Compact/standard/hero modes
- Show/hide cards

Level 3:
- Drag/resize widgets
- Snap grid
- Lock layers
- Save custom layouts

---

### Widget Visibility / Screen Builder

Level 1:
- Default widgets per screen

Level 2:
- Toggle widgets on/off per screen

Level 3:
- Add any widget to any screen
- Custom layouts
- Saved board presets

---

### Theme / Appearance Controls

Level 1:
- Pick background/theme

Level 2:
- Card style presets
- Text contrast modes
- Display density
- Anime/calm/professional modes

Level 3:
- Canva theme packs
- Student reward-unlocked themes
- AI-generated seasonal designs

---

### Canva Asset Pipeline

Level 1:
- Canva-exported backgrounds stored locally and registered in manifest

Level 2:
- Better Canva prompts
- Safe-zone validation
- Asset folders for badges/rewards/passes

Level 3:
- Canva MCP/Chief-of-Staff fetcher
- Automated export/register
- Seasonal wallpaper factory

---

### Chief of Staff Integration

Level 1:
- Chief of Staff can report app status and asset presence

Level 2:
- Launch app
- Validate manifests
- Check local assets
- Generate daily board data

Level 3:
- Canvas/email/calendar fetcher
- Automatic daily board creation
- Asset generation pipeline

---

### iPad Remote

Level 1:
- Same app opens on iPad browser manually

Level 2:
- Simple remote control page over local network

Level 3:
- Native iPad companion
- Apple Pencil
- ClassPass
- Scan/check-in workflows

---

## Recommended Near-Term Build Sequence

1. Display Layout Polish
2. Timer Polish Phase 2
3. Widget Visibility Toggles
4. Basic Inline Editing
5. Voice Level / Traffic Light
6. Daily Brief Intake
7. Lesson Card
8. Vocabulary Card
9. Random Picker

