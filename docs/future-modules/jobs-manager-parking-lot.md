# Jobs Manager — Parking Lot

## Source
Uploaded `Index (2).tsx` prototype — classroom jobs management app.

## Current Status in Command Center
A thin wrapper exists: `JobsToolPanel` → `DailyBriefPanel` (daily brief templates and job prompts). Not a full jobs manager.

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

## Recommended Future Phase
**Phase 15K — Local-first Jobs Manager**

Build a local-only jobs management tool using the existing Zustand + localStorage pattern:
- Job definitions per classroom
- Student assignment rotation
- Weekly cycle reset
- Print/shareable job charts
- No cloud, no AI, no audio
- Student-safe display widget

The prototype should be used ONLY as conceptual reference, never as implementation source.
