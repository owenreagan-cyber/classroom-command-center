# Classroom Command Center + OmniNote — System Architecture Plan

Status: active planning document  
Updated: 2026-07-09  
Primary apps:
- Classroom Command Center
- OmniNote

## Core Decision

Build this as a two-product classroom system:

1. Classroom Command Center
   - Mac/web classroom operating board
   - Student-facing display
   - Teacher launcher/control view
   - Timers, routines, widgets, materials, subject modes
   - Resource launcher
   - Today Prep workflow
   - Basic annotation later

2. OmniNote
   - Native iPadOS teaching canvas
   - Apple Pencil annotation
   - PDF/slides presentation
   - Teacher-private controls
   - Clean student-facing output
   - GoodNotes-style teaching workflow over time

Shared backbone:
- Lesson package
- Resource manifest
- Subject mode model
- Daily prep data
- Open With / handoff options

## Device Roles

### MacBook

Primary role:
- Runs Classroom Command Center
- Drives classroom display/projector/Apple TV
- Hosts teacher launcher
- Handles files, Drive, Canvas, planner, NAS/local resources
- Keeps private teacher work on built-in screen

Recommended display setup:
- Use Extended Display, not mirroring
- MacBook built-in screen = private teacher workspace
- Projector/TV/Apple TV = public student workspace

Student display should show:
- Board
- Directions
- Timers
- Routines
- Media pages
- Lesson content

Teacher screen may show:
- Email
- Gradebook
- Planner
- Teacher notes
- Resource launcher
- Missing-file warnings
- Prep checklist
- Next lesson resources

### iPad

Primary role:
- Runs OmniNote for Apple Pencil teaching
- Acts later as remote/controller for Command Center
- Can later become a noise-meter satellite
- Can later handle presenter/private tool workflow

OmniNote should run on iPad because:
- Apple Pencil input belongs on iPad
- PencilKit is native iPadOS
- Low-latency handwriting matters
- Teacher can walk around while teaching

## Privacy Architecture

Command Center should eventually mirror professional Presenter View behavior.

Presentation tools:
- Students see slide only
- Teacher sees notes, next slide, timer, controls

Command Center equivalent:
- Students see board only
- Teacher sees launcher, notes, prep checklist, controls

Future route model:
- `/display` = public student board
- `/control` = private teacher controls

## Visibility Model

Each widget/resource/note should eventually support:

- Show to Students
- Teacher Only
- Hidden

Examples:

| Item | Student Display | Teacher Control View |
|---|---:|---:|
| Timer | optional | controls available |
| Teacher notes | no | yes |
| Resource launcher | usually no | yes |
| Focus questions | optional | yes |
| Student directions | yes | yes |
| Prep checklist | no | yes |
| Missing file warnings | no | yes |
| Voice level | yes | yes |
| Star student note | optional | yes |

Example model:

```ts
type WidgetVisibility = "student" | "teacherOnly" | "hidden";

type BoardWidget = {
  id: string;
  type: string;
  title: string;
  visibility: WidgetVisibility;
  screenIds: string[];
};
```

## Typical Daily Workflow

### 7:00 Teacher Arrival

Teacher opens Command Center in private setup mode.

Today Prep shows:
- Today’s subjects
- Active History/Science toggle
- Lesson resources checklist
- Missing links/files warnings
- Morning board preview
- Timers/routines ready
- Background/theme rotation

Teacher confirms resources and presses Start Day.

### 7:20–7:50 Morning Arrival

Command Center student display:
- Good Morning
- Do Now
- Arrival routine
- Morning work
- Timer/clock
- Quiet expectations

Reusable arrival directions should reflect lockers:
- Put backpack and jacket in locker
- Turn in homework
- Bring morning folder and pencil
- Begin morning work
- Stay seated and silent

### 7:50–9:00 Math

Math Mode:
- Math background/vibe
- Math welcome message
- Materials card
- Warm-up / Do Now
- Timer
- Teacher resource tray hidden from students

Teacher resources:
- Math Lesson presentation
- Student note sheet
- Reference sheet
- Homework
- Exit ticket
- Teacher key

If Apple Pencil teaching is needed:
- Open in OmniNote on iPad
- Annotate slides/PDF with Pencil
- Students see clean lesson output

### 9:00–9:40 Shurley

Shurley or Grammar Mode:
- Sentence pattern
- Practice prompt
- Materials
- Timer
- Reference chart or chants

### 9:40–9:55 Snack

Snack Mode:
- Snack expectations
- Phase timer
- Calm background
- Voice level
- Cleanup countdown
- Optional calming music later

Reusable snack phases:
- Eating / Quiet Voices
- Silent Cleanup
- Bathroom / Locker
- Ready to transition

Teacher can privately check email or grades on MacBook built-in screen while students see Snack page on extended display.

### 9:55–10:25 Recess

Recess/Transition screen:
- Recess expectations
- Line-up reminder
- Timer until return
- Next subject reminder

### 10:25–11:15 Spelling

Spelling should be its own subject mode.

Student display:
- Weekly word list
- Pattern focus
- Practice directions
- Timer
- Voice level

Resources:
- Weekly word list
- Dictation sentences
- Practice sheet
- Test sheet
- Word study slides

### 11:15–12:15 Reading

Reading Mode:
- Materials
- Vocabulary
- Reading objective
- Timer
- Reading posture/Ready Position reminder

Resources:
- Reading passage
- Vocabulary list
- Comprehension questions
- Teacher guide
- Audio/video link
- Textbook page

OmniNote use:
- Annotate passage
- Highlight evidence
- Model written response
- Circle vocabulary

### 12:15–12:45 Lunch

Lunch Mode:
- Lunch expectations
- Cleanup timer
- Return routine
- After-lunch subject reminder

### 12:45–1:25 History or Science

History/Science should have active/inactive toggles.

Science Mode:
- Investigation question
- Materials
- Vocabulary
- Video/media page
- Timer

History Mode:
- Essential question
- Source/image/video
- Focus questions
- Timeline/map
- Timer

YouTube media page:
- Embedded video when possible
- Fallback open in new tab
- Focus questions
- Vocabulary
- Pause points
- After-video response

### 1:25–2:15 Specials

Specials screen:
- What to bring
- Line-up expectations
- Return reminder

### 2:15–2:30 Cleanup / Pack Up

Pack-up checklist:
- Clean desk
- Pack folder
- Jobs
- Backpack/lunchbox reminder
- Silent ready
- Looking for star students

### 2:30–3:05 Carpool

Carpool screen:
- Quiet activity
- Dismissal readiness
- Carpool expectations
- Calm visual

## Reusable Routine Presets

Create reusable routine presets for:

- Arrival Routine
- Get Ready to Switch
- Return to Homeroom
- Transition Ready
- Snack
- Lunch
- Pack Up
- Carpool
- Star Student Watch

Switching routine examples:
- Put away materials you do not need
- Take only required materials
- Push in chair
- Sit silently until dismissed
- I am looking for star students

Return to homeroom:
- Enter quietly
- Put materials where they belong
- Sit silently
- Wait for directions

## Today Prep Intelligence Levels

### Level 1: Manual setup / template based

Teacher chooses:
- Day template
- Active Science or History
- Lesson numbers
- Resource links/files
- Timer/routine presets
- Backgrounds

The app checks blanks and required fields.

### Level 2: Smart advance from yesterday

App suggests:
- Duplicate yesterday
- Advance lesson numbers by +1
- Keep same subject flow
- Keep same resource folder
- Rotate background/theme

All suggestions require teacher confirmation.

### Level 3: Canvas / Email / Drive / NAS import

Future connected workflow:
- Read Canvas daily/weekly email
- Parse weekly agenda screenshots
- Read Canvas modules/files
- Check Google Drive
- Check local Mac/NAS folders
- Suggest lesson packages
- Require review/approval before showing students

## Canvas / Agenda Intake Plan

### Level 1

Input methods:
- Paste Canvas email text
- Paste weekly agenda text
- Upload/copy screenshots of Canvas weekly agenda pages
- Manual teacher entry

Output:
- Imported draft
- Subject list
- Resource suggestions
- Missing-resource warnings
- Focus-question draft slots

### Level 2

Chief of Staff / Gmail reader:
- Finds Canvas agenda/onboarding emails
- Extracts likely subject flow, links, resources, dates
- Creates Today Prep draft
- Teacher reviews and approves

### Level 3

Connected import:
- Canvas modules/files
- Google Drive
- NAS/local folder
- Planner
- Calendar

## Resource Launcher

Each subject should have teacher-only resources.

Resource types:
- note document
- presentation
- handout
- textbook file
- web link
- YouTube video
- teacher key
- student notes
- reference sheet
- OmniNote lesson

Open With menu options:
- View in Command Center
- Open in new tab
- Open as Google Slides
- Open as Google Docs
- Open in PDF viewer
- Open in HTML viewer
- Open in OmniNote
- Open in GoodNotes later
- Copy link

Most resources start teacher-only. Some can be student-visible.

## YouTube / Media Page

A YouTube resource can become a Media Page with:
- embedded video
- fallback open in new tab
- title
- focus questions
- vocabulary
- watch-for prompt
- pause points
- after-video response
- timer

Important:
- YouTube embedding may fail because of school filters or video owner restrictions
- Always include open-in-new-tab fallback

## Command Center Apple Pencil Plan

Give Command Center basic annotation later.

Level 1:
- simple pen layer
- highlighter layer
- eraser/clear
- laser pointer / temporary mark
- draw over current board page
- save/discard annotations locally

Level 2:
- per-page annotation layers
- undo/redo
- pen colors
- pen widths
- export screenshot with annotations
- simple PDF/image annotation

Level 3:
- not in Command Center
- advanced Apple Pencil belongs in OmniNote

## OmniNote Role

OmniNote should handle:
- Apple Pencil teaching
- PDF/slide annotation
- GoodNotes-style note pages
- presentation masking
- external display output
- teacher-only toolbars
- smart shapes/highlighter/laser
- media nodes later
- lesson package import

Do not merge OmniNote into Command Center too early.

## Development Tracks

### Track A: Classroom Command Center

Near-term order:
1. Display layout polish / projector readability
2. Student Display vs Teacher Control visibility system
3. Subject mode expansion:
   - Spelling
   - Shurley
   - Science
   - History
   - Science/History active toggle
4. Today Prep foundation:
   - editable day template
   - expected resource slots
   - missing-link warnings
   - teacher-only notes
5. Teacher Material Launcher:
   - resource drawer
   - Open With menu
   - YouTube media page
6. Canvas/agenda intake Level 1:
   - paste text
   - upload screenshot/manual entry
   - draft extraction/review
7. Basic annotation layer:
   - pen
   - highlighter
   - laser pointer
   - clear
8. PDF/HTML viewer Level 1
9. iPad remote/controller later

### Track B: OmniNote

Build separately in Xcode.

Near-term order:
1. PencilKit canvas foundation
2. PDF import/viewer
3. Page navigation
4. Pen/highlighter/eraser tools
5. Presentation mode output
6. Teacher toolbar hidden from student display
7. Import lesson package from Command Center
8. Deep link handoff later

## Final Architecture Decision

Build as two connected apps:

- Classroom Command Center = daily hub, board, resource launcher, timers, media pages, basic annotation
- OmniNote = native iPad Pencil teaching, PDF/slides annotation, clean presentation output

Shared lesson package keeps them aligned.
