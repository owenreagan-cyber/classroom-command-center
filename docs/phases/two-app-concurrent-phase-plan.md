# Two-App Concurrent Phase Plan

Status: active master phase plan  
Apps:
- Classroom Command Center
- OmniNote

## Strategy

Build both apps concurrently, but not randomly.

Use alternating phases:

1. Command Center phase
2. OmniNote phase
3. Shared bridge phase
4. Command Center phase
5. OmniNote phase
6. Validation/checkpoint

## Credit-Saving Rule

Use ChatGPT + Terminal for:
- docs
- audits
- snapshots
- status reports
- validators
- schemas
- examples
- lightweight changes

Use Cursor/Codex for:
- visual UI work
- multi-file implementation
- complex SwiftUI/UIKit work
- PencilKit/PDFKit features
- presentation masking
- larger refactors
- brittle bugs

## Current Status

### Command Center

Status: active app started

Completed:
- Vite/React/TypeScript app
- Zustand local state
- core screens
- Canva backgrounds
- SmartText/AutoFitText
- TimerWidget
- PhaseTimerCard
- architecture docs
- storage/sync docs
- Spotify/Classroom Audio plan
- MongoDB future plan
- shared lesson package examples

Current validation:
- build PASS
- lint PASS

### OmniNote

Status: planning repo initialized

Completed:
- planning repo
- architecture docs
- phase roadmap
- Xcode readiness PASS
- shared lesson package examples mirrored

Not yet started:
- Xcode project
- PencilKit
- PDFKit
- physical iPad test

### Shared Bridge

Completed:
- shared lesson package spec
- example JSON packages:
  - math lesson
  - spelling week
  - history video
  - classroom audio

## Alternating Phase Plan

### Phase 1A — Command Center Current-State Audit

Status: PASS

Goal:
Compare current Command Center app against roadmap.

Output:
- current status report
- source tree review
- build/lint proof

### Phase 1B — OmniNote Planning Repo Setup

Status: PASS

Goal:
Create OmniNote planning repo and docs.

Output:
- OmniNote architecture docs
- phase roadmap
- Xcode readiness status

### Phase 1C — Shared Lesson Package Examples

Status: PASS

Goal:
Create shared examples both apps can understand.

Output:
- math lesson example
- spelling week example
- history video example
- classroom audio example

### Phase 2A — Command Center Display Layout Polish

Status: NEXT HEAVY APP PHASE

Goal:
Make student-facing board projector-ready.

Likely Cursor/Codex because this is visual app work.

Includes:
- Homeroom density fix
- screen layout polish
- projector readability
- background safe-zone alignment
- display mode polish
- card spacing
- timer placement
- mobile/tablet/display responsive cleanup

Definition of done:
- build PASS
- lint PASS
- student display looks readable and polished
- edit controls do not clutter display mode

### Phase 2B — OmniNote Xcode Project Foundation

Status: NEXT OMNINOTE PHASE

Goal:
Create blank native iPadOS app and run it.

Prefer manual Xcode setup first, not Cursor.

Includes:
- create Xcode project
- app name OmniNote
- iPadOS target
- SwiftUI
- signing configured
- run blank app on physical iPad

Definition of done:
- blank OmniNote app launches on iPad
- Xcode build PASS
- status doc updated

### Phase 2C — Shared Package Validator

Status: planned terminal phase

Goal:
Create lightweight validation for lesson package examples.

Includes:
- JSON syntax validation
- required fields check
- teacherOnly visibility check
- resource kind check

Definition of done:
- script validates examples
- PASS/WARN/FAIL output

### Phase 3A — Command Center Student/Teacher Visibility Model

Status: planned mixed phase

Goal:
Prevent private teacher material from showing to students.

Includes:
- visibility values:
  - student
  - teacherOnly
  - hidden
- teacher notes hidden from display
- teacher resources hidden from display
- future /display and /control structure

Definition of done:
- teacher-only content never appears in display mode
- build/lint PASS

### Phase 3B — OmniNote PencilKit Canvas Proof

Status: planned Cursor/Xcode phase

Goal:
First real Apple Pencil proof.

Includes:
- PencilKit canvas
- pen
- highlighter
- eraser
- save/reload basic drawing

Definition of done:
- write on iPad with Apple Pencil
- close/reopen and ink remains

### Phase 4A — Command Center Subject Expansion

Status: planned Cursor phase

Goal:
Add real classroom subject modes.

Includes:
- Spelling
- Shurley
- Science
- History
- Science/History active toggle
- Specials
- Cleanup
- Carpool
- switching/locker routines

Definition of done:
- subject modes exist
- inactive Science/History can be hidden without deletion
- build/lint PASS

### Phase 4B — OmniNote PDFKit Proof

Status: planned Cursor/Xcode phase

Goal:
Open and annotate PDFs.

Includes:
- PDF import
- PDF page viewer
- PencilKit overlay
- page navigation
- save ink per page

Definition of done:
- PDF opens
- teacher writes on page
- ink persists per page

### Phase 5A — Command Center Today Prep Foundation

Status: planned mixed phase

Goal:
Build daily setup flow.

Includes:
- editable day template
- active subject toggle
- lesson number fields
- resource checklist
- missing-link warnings
- teacher-only notes
- morning preview

Definition of done:
- teacher can prep a day manually
- no live Canvas dependency
- build/lint PASS

### Phase 5B — OmniNote Movable Toolbar

Status: planned Cursor/Xcode phase

Goal:
Teacher-friendly floating toolbar.

Includes:
- movable/collapsible toolbar
- Standard mode
- Math mode placeholder
- Presentation mode placeholder
- Undo/Redo
- Curtain and Block Box always available as placeholders

Definition of done:
- toolbar is usable and does not block teaching

### Phase 6A — Command Center Teacher Material Launcher

Status: planned Cursor phase

Goal:
Open teaching materials quickly.

Includes:
- resource drawer
- Open With menu
- teacher-only resources
- student-visible optional resources
- Google Drive/Canvas/YouTube/Spotify links
- local/public resource path support

Definition of done:
- teacher can launch subject resources from Command Center
- private links do not show to students

### Phase 6B — OmniNote Presentation Output Proof

Status: planned heavy Cursor/Xcode phase

Goal:
Clean student projection.

Includes:
- detect external display
- hide teacher toolbar
- show clean page to students
- basic presentation mode

Definition of done:
- students see clean output
- teacher sees controls

### Phase 7A — Command Center Classroom Audio Level 1

Status: planned app phase

Goal:
Curated classroom playlists.

Includes:
- playlist manifest
- MusicWidget
- Spotify embed option
- open in Spotify/browser fallback
- schoolSafe flag

Definition of done:
- playlists can be launched/embedded without OAuth

### Phase 7B — OmniNote Teacher Superpowers Level 2

Status: planned heavy Cursor/Xcode phase

Goal:
Teacher tools beyond GoodNotes basics.

Includes:
- Screen Curtain
- Block Box / Active Recall Tape
- tap-to-disappear reveal
- Laser Pointer
- camera insert
- document scanner
- media/image nodes

Definition of done:
- teacher can hide/reveal content and point during presentation

### Phase 8A — Command Center YouTube Media Page

Status: planned app phase

Goal:
Instructional media page.

Includes:
- video embed
- fallback open in new tab
- focus questions
- vocabulary
- pause points
- timer

Definition of done:
- teacher can show a video with instructional supports

### Phase 8B — OmniNote Tabs and Workspaces

Status: planned heavy Cursor/Xcode phase

Goal:
Daily subject workflow.

Includes:
- tabs
- Math/Shurley/Reading/Spelling/Science-History workflow
- workspace saver
- lazy loading guardrails

Definition of done:
- teacher can switch between daily teaching files quickly

### Phase 9A — Command Center PDF/HTML Viewer

Status: planned app phase

Goal:
Preview lesson resources.

Includes:
- PDF preview
- HTML lesson viewer
- Open With integration

Definition of done:
- resources can be previewed without leaving board when appropriate

### Phase 9B — OmniNote Mirror Full Page

Status: planned major phase

Goal:
Core differentiator.

Includes:
- teacher private zoom/pan
- student locked full page
- coordinate-mapped ink
- external display stability

Definition of done:
- teacher zooms locally while students see stable full page

### Phase 10A — Command Center Basic Annotation

Status: planned app phase

Goal:
Quick board marking.

Includes:
- pen
- highlighter
- laser pointer
- clear

Definition of done:
- basic marks can be made on Command Center board
- OmniNote remains serious annotation app

### Phase 10B — Shared Lesson Package Import/Export

Status: planned bridge phase

Goal:
Connect both apps.

Includes:
- Command Center exports package
- OmniNote imports package
- manual first
- deep link later

Definition of done:
- one lesson package can travel between apps

## Parking Lot

Do not build yet:
- Firebase
- Supabase
- direct Google Drive API
- direct Canvas API
- NAS crawler
- MongoDB backend
- Spotify OAuth/Web Playback SDK
- WebRTC sync
- CloudKit conflict sync
- AI import automation
- full Reward Maker Studio
- ClassPass
- satellite iPad noise meter

These are Level 3 or later.
