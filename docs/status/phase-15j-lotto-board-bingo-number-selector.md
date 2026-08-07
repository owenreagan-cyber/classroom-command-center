# Phase 15J — Lotto Board / Bingo Number Selector — Local-First 1–100 Draw Tool

- **Branch:** `phase-15j-lotto-board-bingo-number-selector`
- **Starting commit:** `65f24a0` (Add 100 Board game runtime)
- **Status:** Complete, not committed

## Goals

Build a dedicated Bingo/Lotto-style number selector for classroom use. The teacher sets a weekly draw count, draws unique random numbers 1–100, and confirms ("Done") to permanently remove them from the available pool. State persists locally.

## Feature Summary

- **Core draw flow:** Set count → Draw balls → Done (remove) → Repeat
- **100 numbered balls** with available/pending/used state tracking
- **Persistence** via Zustand + localStorage (`classroom-lotto-board-v1`)
- **Teacher controls:** Set weekly count, draw, done/confirm, clear pending, undo last, reset
- **Student display:** Safe lotto balls with ready/drawing/complete states
- **Display Studio integration:** Widget in Engagement category, editor renderer, /display renderer
- **Teacher Dock integration:** Full tool panel accessible from dock

## Audit Results

### Noise App
**COMPLETE.** Noise Control exists as a full tool with `NoiseToolPanel` → `NoiseControlPanel`, `board/NoiseControlPanel.tsx`, `lib/noiseTowers.ts`, and 21 passing tests in `features/noise-control/tests.ts`. Integrated into teacher dock as tool `'noise'`. It handles voice level tracking per classroom (homeroom/math/reading) with reset capability.

### Jobs App
**PARTIAL / THIN WRAPPER.** Jobs exists as `JobsToolPanel` → `DailyBriefPanel` which provides daily brief templates and classroom job prompts. It is NOT a full classroom jobs manager with roster integration, assignments, or cycle management. The uploaded `Index (2).tsx` prototype was inspected and is correctly parked — its Firebase, Gemini, speech synthesis, and image asset architecture was NOT copied and should never be copied.

### Lotto/Bingo Existing Tool
**ABSENT.** No bingo or lotto tool existed before Phase 15J. The closest tool is `random-number` (Random Number Tool) which draws single random numbers with no-repeat mode but lacks the batch draw → confirm → remove flow. The Phase 15I 100 Board is a prize/game board, a completely different tool.

## Data Model

```
LottoBoardState:
  boardId, rangeStart: 1, rangeEnd: 100
  availableNumbers: number[]     // pool not yet drawn
  pendingNumbers: number[]       // drawn but not confirmed (replaceable)
  usedNumbers: number[]          // confirmed and removed from pool
  drawHistory: LottoDrawRecord[] // undoable confirmation log
  weeklyDrawCount: number        // how many to draw per batch

LottoDrawRecord:
  id, numbers[], confirmedAt, drawCount, remainingAfter

DisplaySafeLottoState:
  pendingNumbers, remainingCount, usedCount, weeklyDrawCount, status
```

## Draw Rules

1. `drawNumbers()` selects `weeklyDrawCount` unique numbers from `availableNumbers` using Fisher-Yates partial shuffle
2. Drawn numbers become `pendingNumbers` — no removal from `availableNumbers` yet
3. `confirmPendingDraw()` moves pending to used, removing from available
4. `clearPendingDraw()` discards pending without affecting available
5. `undoLastConfirm()` restores last confirmed set to available, removes from history
6. If draw count exceeds remaining, only remaining are drawn (safe behavior)
7. `resetBoard()` restores full 1–100 pool

## Persistence

Zustand `persist` middleware → localStorage key `classroom-lotto-board-v1`.
Survives page reload. No cloud services.

## Display Studio Integration

- **Widget registry:** `'lotto-board'` type, Engagement category, studentSafe: true
- **Editor renderer:** `LottoBoardContent` in `WidgetEngagementRenderers.tsx` — shows pending numbers, remaining/used counts, or "Open Lotto Board to draw" placeholder
- **Display renderer:** `LottoBoardStudentDisplay` in `WidgetDisplayOverlay.tsx` — shows ready/drawing/complete states with large lotto balls
- **Widget library:** `WIDGET_TYPE_MAP` includes lotto-board with medium default size

## Student-Safety Proof

- `/display` receives only `DisplaySafeLottoState` (pendingNumbers, remainingCount, usedCount, weeklyDrawCount, status)
- No `boardId`, `availableNumbers`, `usedNumbers` arrays, `drawHistory`, or internal fields
- No teacher controls (draw/done/undo/reset) visible on /display
- No local storage/debug JSON exposed
- No private roster data
- Verified by tests LB-52 through LB-67

## Files Changed

| File | Status | Description |
|------|--------|-------------|
| `src/features/lotto-board/types.ts` | NEW | State model types |
| `src/features/lotto-board/drawLogic.ts` | NEW | Pure draw functions (testable) |
| `src/features/lotto-board/lottoBoardStore.ts` | NEW | Zustand store + localStorage |
| `src/features/lotto-board/LottoBoardTeacherPanel.tsx` | NEW | Teacher UI panel |
| `src/features/lotto-board/LottoBoardStudentDisplay.tsx` | NEW | Student display widget |
| `src/features/lotto-board/lottoBoardTests.ts` | NEW | 166 unit tests |
| `src/features/display-composer/types.ts` | MODIFIED | Added 'lotto-board' to CanvasWidgetType |
| `src/features/display-studio/studioWidgets.ts` | MODIFIED | Added lotto-board widget definition |
| `src/features/display-studio/widgetRegistry.ts` | MODIFIED | Added lotto-board widget config |
| `src/features/display-studio/WidgetCanvasCard.tsx` | MODIFIED | Added case for lotto-board |
| `src/features/display-studio/WidgetEngagementRenderers.tsx` | MODIFIED | Added LottoBoardContent renderer |
| `src/features/display-composer/WidgetDisplayOverlay.tsx` | MODIFIED | Added lotto-board display case |
| `src/features/display-studio/DisplayStudioWidgetLibrary.tsx` | MODIFIED | Added to WIDGET_TYPE_MAP |
| `src/features/teacher-dock/types.ts` | MODIFIED | Added 'lotto-board' to ToolId |
| `src/features/teacher-dock/toolPanelIds.ts` | MODIFIED | Added 'lotto-board' to registered IDs |
| `src/features/teacher-dock/toolRegistry.ts` | MODIFIED | Added tool definition |
| `src/features/teacher-dock/toolCapabilities.ts` | MODIFIED | Added capability entry |
| `src/features/teacher-dock/toolPanels/index.ts` | MODIFIED | Registered LottoBoardToolPanel |
| `src/features/teacher-dock/toolPanels/LottoBoardToolPanel.tsx` | NEW | Panel wrapper |
| `scripts/test-lotto-board.sh` | NEW | Test runner |
| `package.json` | MODIFIED | Added test:lotto-board script |

## Validation Table

| Validation | Result |
|-----------|--------|
| `test:lotto-board` | PASS (166/0) |
| `test:hundred-board` | PASS (387/0) |
| `test:prize-board` | PASS (238/0) |
| `test:display-studio` | PASS (63/0) |
| `test:display-composer` | PASS |
| `test:display-launch` | PASS (12/0) |
| `test:display-polish` | PASS (15/0) |
| `test:studio-canvas` | PASS (93/0) |
| `test:student-picker` | PASS (36/0) |
| `test:random-number` | PASS |
| `test:teacher-dock` | PASS |
| `npm run build` | PASS |
| `npm run lint` | PASS |
| Privacy scan (cloud/AI) | CLEAN |
| Privacy scan (real names) | CLEAN |

## Screenshot Coverage

**WARN:** 0/10 screenshots captured. Dev server available on port 5200 but browser MCP session expired. Screenshots can be captured manually with:
- `open http://localhost:5200/control` → Open Lotto Board tool → capture each state

## Known WARN/FAIL Items

- **Screenshot coverage WARN:** 0/10 captured (browser automation time constraints)
- **Teacher Workstation E2E:** Known pre-existing Playwright SEGV (not code-related)

## Deferred Items

- Phase 15K — Local-first Jobs Manager (park the Firebase/Gemini prototype as reference only)
- Full roster import UX
- Prize redemption
- Classroom economy ledger

## Safe to Commit?

**Yes.** No real names, no cloud/AI code, no .local files, all tests pass, build/lint clean, no regressions.

## Explicit Statement

**No commit was made.** Awaiting approval.
