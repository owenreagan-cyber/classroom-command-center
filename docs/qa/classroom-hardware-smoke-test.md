# Classroom Hardware Smoke Test

Repeatable manual validation for Owen’s teacher Mac, classroom projector or external display, and optional iPad browser view. OmniNote is **not** required.

Automated prerequisites: `npm run smoke:classroom` (build, lint, host Playwright diagnosis, noise tests, core unit tests).

## Setup

1. From the repo root, install dependencies if needed: `npm install`
2. Start the dev server (local only by default):

   ```bash
   npm run dev
   ```

   Teacher Control: [http://127.0.0.1:5173/control](http://127.0.0.1:5173/control)  
   Student Display: [http://127.0.0.1:5173/display](http://127.0.0.1:5173/display)

3. Open **two windows**: teacher laptop on `/control`, projector or second monitor on `/display`.

### Optional iPad browser (LAN)

Use only on a **trusted local network**. Do not expose the dev server to the public internet. Firewall settings may apply.

```bash
npm run dev -- --host 0.0.0.0
```

Find your Mac’s LAN IP and open `http://<lan-ip>:5173/display` on the iPad. OmniNote handoff is optional and not part of this checklist.

---

## Startup

| Check | Pass |
|-------|------|
| App loads without console errors | |
| `/control` loads | |
| `/display` loads | |
| Refresh restores current route and state | |
| App works offline after required assets are loaded (where supported) | |

---

## Classroom Screens

Verify navigation and content on both control and display where applicable:

- Homeroom
- Math
- Reading
- Snack / Lunch
- Ready Position
- Vibe or atmosphere page

---

## Content

- Morning Message
- Do Now
- Materials
- Reminder
- Lesson Card
- Vocabulary
- Card visibility toggles
- Inline editing
- Beautify
- Undo

---

## Timers

- Start, pause, resume
- Add time, reset
- Refresh while running
- Zero state
- Phase Timer
- Sound disabled/enabled (where supported)
- Display synchronization

---

## Noise (Teacher Dock → Noise Control)

Voice levels (canonical): **Silent**, **Whisper**, **Normal Voice**, **Off / Inactive**. No microphone is used.

| Check | Pass |
|-------|------|
| Homeroom level sets independently of Math and Reading | |
| Math level sets independently | |
| Reading level sets independently | |
| Traffic light / voice widget on student display | |
| Reset requires confirmation on control; **not** shown on display | |
| Active screen maps to correct tracker (e.g. Math screen → Math tracker) | |
| Refresh restores each tracker | |

---

## Student Picker

- Independent class pools
- Absent toggle
- Quick Picker
- History
- No-repeat / fairness
- Refresh persistence

---

## Mystery Star

- Hidden identity on display until revealed
- Refresh restoration
- Earned / Did Not Earn
- Correction / undo
- No private display leakage

---

## Prize Board

- Setup, display launch
- Spin, reveal, rare, legendary, Whammy
- Reset confirmation
- Refresh recovery
- No hidden prize leakage on display

---

## Random Number

- Default 1–100, custom range
- No-repeat, history, undo, exhaustion, reset
- Student display sync
- Hide from display

---

## Display

- Fullscreen
- Blocked-popup fallback
- **1920×1080** readability
- **1366×768** readability
- No teacher-only information
- No clipped primary content

---

## Sign-off

| Layer | Result |
|-------|--------|
| Automated (`npm run smoke:classroom`) | |
| Browser (agent or local) | |
| Manual hardware (projector + teacher Mac) | |

Record date, viewport sizes tested, and any defects in `docs/status/classroom-command-center-v1-0-1-operational-polish.md`.
