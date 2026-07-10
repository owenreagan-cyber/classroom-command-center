# Classroom Command Center + OmniNote — Level Feature Matrix

Status: master planning document  
Purpose: make sure both apps have Level 1, Level 2, and Level 3 plans.

## Level Definitions

Level 1:
- basic features
- reliable
- classroom usable
- local-first when possible
- low risk

Level 2:
- more teacher control
- better appearance
- stronger workflow
- more customization
- still reliable

Level 3:
- fully decked out
- automation
- sync
- AI/imports
- deeper integrations
- build only after Level 1 and 2 foundations are stable

---

# App 1: Classroom Command Center

## Role

Classroom Command Center is the daily student-facing classroom operating board and teacher launcher.

Runs primarily on MacBook with extended display:
- public student display on projector/TV
- private teacher controls on MacBook screen

## Level 1 — Command Center

Already built or near-term MVP:
- Vite + React + TypeScript app
- local-first
- Display/Edit mode
- student-facing board
- Homeroom screen
- Math screen
- Reading screen
- Snack/Lunch screen
- Ready Position screen
- Canva backgrounds
- background manifest
- SmartTextCard
- AutoFitText with no silent clipping
- MaterialsCard
- ReminderCard
- DoNowCard
- ReadyPositionCard
- conservative Beautify
- Undo Beautify
- TimerWidget countdown
- PhaseTimerCard / RoutineTimerCard
- wall-clock timer reload recovery
- local persistence
- Reward Maker Studio parked
- no hardcoded school schedule times

Next Level 1 additions:
- display layout polish
- projector readability
- Homeroom density fix
- Spelling screen
- Shurley screen
- Science screen
- History screen
- Science/History active toggle
- Teacher-only resource drawer foundation
- resource checklist fields
- manual URL/file resource entry
- basic Open With menu
- curated Spotify playlist launcher/embed
- YouTube media page Level 1
- teacher notes marked teacher-only
- widget visibility: student / teacherOnly / hidden

## Level 2 — Command Center

Polished workflow:
- separate Student Display view and Teacher Control view
- `/display` route
- `/control` route
- extended-display-friendly layout
- widget visibility toggles
- basic inline card editing
- reusable day templates
- Today Prep dashboard
- active subject picker
- expected resource slots
- missing-link warnings
- + Page duplication per subject
- subject-specific vibe/background/message
- background/theme rotation
- safe-zone background validation
- timer progress ring/bar
- optional chime
- Time’s Up visual animation
- MusicWidget compact/full modes
- classroom playlist categories
- Voice Level / Traffic Light
- Daily Brief manual paste
- lesson card
- vocabulary card
- Random Picker session-only
- basic Command Center annotation:
  - pen
  - highlighter
  - laser pointer
  - clear annotations
- PDF preview
- HTML lesson viewer
- YouTube focus questions
- media page templates

## Level 3 — Command Center

Fully decked out:
- Canvas/email/agenda ingestion
- screenshot agenda intake with OCR/AI
- Google Drive/NAS checking
- Chief of Staff daily prep generator
- automatic missing-file detection
- auto-build Today Prep draft
- resource validation
- subject flow generated from planner
- schedule-aware screen suggestions
- iPad remote/controller
- satellite iPad noise meter
- browser/native noise meter
- Spotify OAuth / Web Playback SDK
- Spotify Connect controls
- auto playlist by routine/subject
- teacher-only private control surface
- local Mac app wrapper if needed
- deep handoff to OmniNote
- QR/Reward/Prize Wheel integrations
- Reward Maker Studio integration
- ClassPass integration
- AI Beautify / projector-ready rewrite
- Canva/asset automation
- seasonal theme packs
- animated Rive/Lottie accents

---

# App 2: OmniNote

## Role

OmniNote is the native iPad teaching canvas for Apple Pencil, PDF/slides, and clean student presentation output.

It should be developed separately from Command Center but aligned through a shared lesson package.

## Level 1 — OmniNote

MVP:
- separate Xcode/iPadOS project
- SwiftUI/UIKit
- PencilKit canvas
- PDFKit import/viewer
- basic notebook library
- folders/classes/recent/starred lessons
- import PDFs/slides exported as PDFs
- Apple Pencil pen
- highlighter
- eraser
- lasso/select
- colors
- stroke widths
- save ink per page
- simple movable/collapsible teacher toolbar
- page navigation
- basic external display detection
- clean student output
- teacher toolbar hidden from student display
- open one file at a time
- local-first document storage

Critical Level 1 classroom goal:
- teacher can open a PDF/slide deck
- write with Apple Pencil
- students see clean page
- teacher controls stay private

## Level 2 — OmniNote

Teacher workflow:
- persistent tabs
- Smart Tabs / subject tabs:
  - Math
  - Shurley
  - Reading
  - Spelling
  - Science/History
- Lesson Deck / workspace saver
- background preloading of large files
- lazy PDF rendering
- vector ink layer separate from PDF
- Open from iCloud/Files/Google Drive/NAS provider
- direct-drive style file workflow where possible
- better external display presentation
- Mirror Full Page mode
- teacher can zoom/pan privately
- projected page stays stable
- ink maps correctly to full projected page
- laser pointer
- Screen Curtain
- Active Recall Tape / Block Box
- tap-to-disappear reveal animation
- screen shade with teacher preview / student opaque output
- insert image from camera
- document scanner
- insert image/video node
- hyperlink objects
- font/text box styles
- basic shape snap
- movable collapsible toolbar
- mode-based toolbar:
  - Standard
  - Math
  - Presentation
  - Reading

## Level 3 — OmniNote

Fully decked out:
- smart shapes
- partial eraser
- ruler
- protractor
- compass
- manipulatable clock
- fraction factory
- math symbol keyboard
- exponents/square roots/comparison symbols/degrees
- dice/coin/spinner
- calculator widget
- quick table maker
- graph maker
- line plot maker
- pie chart maker
- Apple Charts integration
- OCR handwriting search
- math conversion to LaTeX/MathML
- audio-stroke recording/sync
- lesson replay
- student response zones
- AI quiz generation
- answer zones
- collaboration
- CloudKit/iCloud sync
- Google Drive export/import polish
- NAS/local sync polish
- Command Center deep link handoff
- shared lesson package importer
- OmniNote receives lesson from Command Center
- custom URL schemes/universal links
- local network sync
- satellite iPad support
- optional CoreML/Vision tools

---

# Shared Backbone

Both apps should share the concept of:

- LessonPackage
- LessonResource
- SubjectMode
- DailyPrepPackage
- TeacherNote
- WidgetVisibility
- OpenWithOption
- MediaResource
- ClassroomPlaylist

## Level 1 — Shared Backbone

- documented TypeScript-style schema
- manual resource entry
- teacher-only vs student-visible
- Open With menu
- no automation

## Level 2 — Shared Backbone

- lesson package JSON export/import
- Command Center can create a lesson package
- OmniNote can import a lesson package manually
- subject workspaces
- resource checklists
- playlist/media resources
- focus questions

## Level 3 — Shared Backbone

- automatic handoff
- deep links
- local network sync
- CloudKit/shared folder sync
- Chief of Staff generated daily package
- Canvas/Drive/NAS validation
- OmniNote opens correct lesson/file/page directly from Command Center

---

# Build Priority

Do not build Level 3 before Level 1 and 2 are excellent.

Recommended near-term sequence:

1. Command Center display layout polish
2. Command Center student/teacher visibility model
3. Command Center subject expansion
4. Command Center Today Prep foundation
5. Command Center Teacher Material Launcher
6. Command Center Classroom Audio / Spotify Level 1
7. Command Center YouTube media page
8. Command Center PDF/HTML viewer
9. OmniNote Level 1 Xcode project
10. OmniNote PencilKit + PDFKit proof
11. Shared lesson package import/export
12. OmniNote presentation masking proof
