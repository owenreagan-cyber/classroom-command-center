# Classroom System — Dependency and Repo Plan

Status: active planning document  
Apps:
- Classroom Command Center
- OmniNote

## Architecture Summary

Classroom Command Center:
- Vite
- React
- TypeScript
- Zustand
- local-first
- Mac/web classroom board
- future teacher control view
- future resource launcher and Today Prep

OmniNote:
- Xcode iPadOS app
- SwiftUI + UIKit
- PencilKit
- PDFKit
- native Apple Pencil teaching/presentation app

Shared:
- LessonPackage spec
- LessonResource spec
- SubjectMode spec
- DailyScheduleTemplate spec
- Resource launcher/handoff metadata

## Classroom Command Center Current Stack

Keep:
- Vite
- React
- TypeScript
- Zustand
- ESLint
- localStorage for small state
- static assets in `public/`

Current completed foundation:
- Canva backgrounds
- background manifest
- SmartTextCard
- AutoFitText
- no silent clipping
- MaterialsCard
- ReminderCard
- DoNowCard
- ReadyPositionCard
- conservative Beautify
- Undo Beautify
- TimerWidget
- PhaseTimerCard
- Display/Edit modes
- local persistence

## Classroom Command Center Future Dependencies

### Near-term: local data and forms

Install when Today Prep / resource launcher begins:

```bash
npm install dexie zod react-hook-form
```

Use cases:
- lesson packages
- resource manifests
- day templates
- teacher notes
- expected resource slots
- missing-link warnings
- resource launcher forms
- Canvas/agenda import validation

Roles:
- Dexie = IndexedDB/local-first larger storage
- Zod = schema validation
- React Hook Form = teacher-friendly edit/setup forms

### PDF preview

Install when PDF/resource preview begins:

```bash
npm install pdfjs-dist
```

Use cases:
- textbook preview
- handout preview
- student note sheet preview
- teacher preview
- view-only PDFs in Command Center

Full serious annotation should remain in OmniNote.

### Small animations

Install later if needed:

```bash
npm install lottie-react
```

Use cases:
- timer complete animation
- checkmark animation
- subtle reward/sticker effects
- transition polish

### Interactive vector animation

Install later if needed:

```bash
npm install @rive-app/react-canvas
```

Use cases:
- small animated mascots
- badge animations
- voice level indicators
- timer celebration
- reward reveal

### Basic web annotation candidates

Consider later:
- custom canvas layer
- Konva / react-konva
- Fabric.js
- tldraw

Recommendation:
- Level 1 Command Center annotation: custom canvas layer or Konva
- Level 2 whiteboard/media canvas: tldraw
- Level 3 serious note app: OmniNote native PencilKit

Do not install heavy drawing libraries until after display polish, subject modes, and resource launcher foundation are stable.

### Future desktop wrapper

Consider much later:
- Tauri

Use cases:
- open local files more reliably
- interact with local/NAS folders
- launch apps/files better from Mac
- package Command Center as a Mac app

Do not add Tauri until web app is stable.

### Satellite iPad / noise monitoring

Plan later:
- WebRTC data channels
- local WebSocket server
- native MultipeerConnectivity for iOS
- AVAudioEngine in native iOS helper

Recommendation:
- Level 1: manual Voice Level widget
- Level 2: MacBook mic noise meter
- Level 3: satellite iPad noise meter sending only noise scores, no recordings

Do not store audio.
Do not record student audio.
Only send live decibel/noise-level scores.

## OmniNote Core Dependencies

Use official Apple frameworks first:
- SwiftUI
- UIKit
- PencilKit
- PDFKit
- AVFoundation
- Vision later
- CoreML later
- SwiftData or local document storage
- MultipeerConnectivity later
- CloudKit later

### OmniNote Level 1

Frameworks:
- SwiftUI
- UIKit as needed
- PencilKit
- PDFKit
- FileImporter
- SwiftData/local storage

Features:
- open PDF
- Apple Pencil drawing
- highlighter
- eraser
- page navigation
- save drawing per page
- local-first

### OmniNote Level 2

Frameworks:
- UIScreen / UIWindow external display APIs
- AVFoundation
- Vision optional

Features:
- student presentation output
- teacher toolbar hidden from student display
- laser pointer
- basic shapes
- media nodes
- clean PDF/slide presentation mode

### OmniNote Level 3

Frameworks:
- MultipeerConnectivity
- CloudKit
- CoreML/Vision
- custom URL schemes / universal links

Features:
- Command Center handoff
- live iPad controller
- shared lesson package
- satellite iPad support
- OCR/math tools
- teacher-private presenter mode

## Repos / Libraries to Avoid Too Early

Avoid adding early:
- full collaborative whiteboard stack
- complex drag/resize builder
- heavy 3D/WebGL backgrounds everywhere
- Firebase/Supabase
- paid PDF SDKs
- real-time cloud sync
- WebRTC mesh networking
- AI API dependencies
- Canvas API integration inside the display app

Reason:
Classroom reliability matters more than a huge dependency footprint.

## Recommended Near-Term Install Strategy

Do not install new packages until the feature phase needs them.

Next likely install:
```bash
npm install dexie zod react-hook-form
```

Only when beginning:
- Today Prep
- resource launcher
- lesson package validation
- teacher notes/checklists

Then later:
```bash
npm install pdfjs-dist
```

Only when beginning:
- PDF preview/viewer

Then later:
```bash
npm install lottie-react
```

Only when beginning:
- timer polish animations
- small visual effects

## Repo Structure Recommendation

Current repo:
- `~/Projects/classroom-command-center`

Future separate repo:
- `~/Projects/omninote`

Do not merge OmniNote into Command Center.

Possible future shared folder/spec:
- `docs/architecture/shared-lesson-package-spec.md`
- later duplicated into both repos or moved into a shared package

## Development Course of Action

Command Center:
1. Display layout polish
2. Architecture docs
3. Visual design system docs
4. Subject modes
5. Visibility model
6. Today Prep
7. Teacher Resource Launcher
8. YouTube media page
9. PDF/HTML viewer
10. Basic annotation

OmniNote:
1. Create separate Xcode project
2. PencilKit proof
3. PDFKit proof
4. Save ink per page
5. Presentation masking proof
6. Lesson package importer
7. Handoff from Command Center

## MongoDB Atlas Addendum

MongoDB Atlas is a future Level 3 option, not a current dependency.

Use later for:
- shared metadata
- lesson package records
- resource indexes
- Today Prep history
- playlist catalogs
- teacher settings
- sync logs

Do not install MongoDB dependencies in Command Center yet.

Do not use MongoDB as the first storage layer for OmniNote.

Do not store large curriculum files or raw ink in MongoDB at first.

See:
- `docs/architecture/mongodb-atlas-plan.md`
