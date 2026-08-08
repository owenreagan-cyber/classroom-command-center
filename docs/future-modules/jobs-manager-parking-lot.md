# Jobs Manager — Parking Lot

## Source
Uploaded `Index (2).tsx` prototype — classroom jobs management app.

## Current Status in Command Center

**Core Jobs Manager (Phase 15K) implemented.** Local-first Zustand + localStorage state model with:
- 9 default classroom jobs (Filer, Cleaner, Lunch Crew, Class Monitor, Distributor, Line Leader, Substitute, Hall Monitor, Door Holder)
- Manual assignment/unassignment with capacity enforcement
- Smart two-pass fairness-optimized auto-assign (no AI/network)
- Cycle lifecycle: start, end, archive, undo
- Student job history tracking
- Teacher Dock panel with class selector, job cards, assign/unassign modal, cycle controls
- Student-safe Display Studio widget for /display
- 82 unit tests

**Previously:** A thin wrapper (`JobsToolPanel` → `DailyBriefPanel`) existed — a daily brief editor, not a jobs manager. Replaced in Phase 15K.

## Prototype Architecture (NOT approved)

The uploaded prototype uses:
- Firebase / Firestore for data storage
- Gemini API for smart assignment suggestions
- `speechSynthesis` for spoken announcements
- Anime/hero image assets for character styling
- QR code / kiosk report flows
- Roster, Licenses, Payroll, Reports, Kiosk, Smart Assign, cycle reset concepts

## What Should NOT Be Copied

- Firebase/Firestore setup (`initializeApp`, `getFirestore`, `__firebase_config`)
- Gemini API (`generativelanguage`, `__gemini_api_key`)
- Speech synthesis (`speechSynthesis`, `SpeechSynthesisUtterance`)
- Copyrighted character/image assets
- Cloud data paths
- QR/kiosk report flows

## Remaining Deferred Items

These were not built in Phase 15K (core) and remain for future phases:

- **Payroll / points economy** — tracking earned points, job rewards
- **QR codes / student kiosk** — self-serve check-in terminal
- **Printable job cards** — physical handouts or badges
- **License cards** — character/role-based visual cards
- **Job badges** — visual indicators on student display
- **Behavior reports** — tied to job performance
- **AI briefings** — Gemini-powered job assignment suggestions
- **Voice / TTS announcements** — spoken job calls
- **Hero/anime image assets** — character styling
- **Economy integration** — Prize Board / points linkage
- **Advanced game features** — animated job reveal, weighted rotation

The prototype should be used ONLY as conceptual reference, never as implementation source.
