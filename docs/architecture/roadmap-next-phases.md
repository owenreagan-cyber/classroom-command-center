# Classroom System — Next Phases Roadmap

Status: active planning document

## Current Foundation

Completed:
- Classroom Command Center Vite/React/TypeScript app
- Canva background assets
- background manifest
- SmartTextCard
- AutoFitText with no silent clipping
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
- build/lint passing

Parked:
- Reward Maker Studio
- coupon/pass generator
- QR job badges
- Level 3 Canvas/Gmail/Drive/NAS automation
- AI/API Beautify
- local LLM
- Xcode/native wrapper for Command Center
- schedule automation

## Hard Schedule Rule

Do not hardcode current-year schedule times.

Last year's schedule may be stored only as:
- example template
- editable reference
- planning model

Snack, lunch, dismissal, transition, ClassPass, and job-check timing must remain editable duration/preset content until current-year schedule is known.

## Recommended Command Center Build Order

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
7. Timer Polish Phase 2:
   - progress bar/ring
   - optional chime
   - appearance presets
   - Time's Up animation
8. Basic annotation layer:
   - pen
   - highlighter
   - laser pointer
   - clear
9. PDF/HTML viewer Level 1
10. iPad remote/controller later
11. satellite iPad/noise meter later

## Recommended OmniNote Build Order

1. Create separate Xcode project at `~/Projects/omninote`
2. PencilKit canvas foundation
3. PDFKit import/viewer proof
4. Page navigation
5. Save ink per PDF page
6. Pen/highlighter/eraser tools
7. Presentation mode output proof
8. Teacher toolbar hidden from student display
9. Shared lesson package importer
10. Command Center handoff
11. Deep link / local sync later

## Near-Term Cursor/Codex Guidance

Use Cursor for heavier UI/app work.

Use Terminal/ChatGPT guidance for:
- docs
- status scripts
- simple repo organization
- validation
- snapshots
- small code changes

Avoid broad autonomous prompts unless:
- multi-file UI implementation
- complex refactor
- brittle tests/debugging
- visual app work
- larger feature section

## Next Best Command Center Prompt

Display Layout Polish / Projector Readability remains the next best build phase.

Reason:
The app has enough function to test. It now needs to look excellent and readable on the classroom display before adding more workflow complexity.

## After Display Polish

Build:
- Student Display vs Teacher Control visibility model
- Subject mode expansion
- Today Prep foundation
- Teacher Material Launcher

These are now higher priority than novelty widgets because they solve the daily workflow problem of finding/launching lessons and keeping private materials hidden.

## Classroom Audio / Spotify Addendum

Add Classroom Audio / Spotify after Teacher Material Launcher foundation.

Level 1:
- curated playlist manifest
- teacher-only launch links
- optional Spotify embed
- fallback open in new tab
- schoolSafe playlist flag

Level 2:
- MusicWidget compact/full modes
- mood categories
- page-specific default playlists
- routine/phase playlist suggestions

Level 3:
- Spotify OAuth
- Web Playback SDK
- Spotify Connect controls
- now-playing metadata
- auto playlist by subject/routine

Do not build OAuth/player control until the app is stable.
