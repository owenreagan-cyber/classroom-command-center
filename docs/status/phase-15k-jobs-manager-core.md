# Phase 15K: Jobs Manager Core — Local-First Classroom Jobs, Assignment Cycles, and Teacher Dock Integration

**Branch:** `phase-15k-jobs-manager-core`  
**Starting commit:** `982c6ee` (Add Lotto Board number selector)  
**Date:** 2026-08-08

## Summary

Built a complete local-first Jobs Manager for classroom jobs. Replaced the thin DailyBriefPanel-based wrapper with a real Zustand + localStorage state model supporting manual assignment, smart automatic assignment, cycle lifecycle management, student history, and a student-safe display widget.

## Existing Jobs Audit

**Previous Jobs code:** A thin wrapper (`JobsToolPanel.tsx`) delegated entirely to `DailyBriefPanel` from `src/board/`. It was a daily brief editor, not a jobs manager. No job assignment logic, no roster connection, no cycle management, no smart assign, no student display.

**Verdict:** Placeholder/thin wrapper — not a full jobs manager.

## Uploaded Prototype Handling

The uploaded `Index (2).tsx` prototype was inspected for product inspiration only:

- **Used:** Default job role names (Filer, Cleaner, Lunch Crew, Class Monitor, Distributor, Line Leader, Substitute, Hall Monitor, Door Holder) and suggested capacities.
- **Not copied:** Firebase/Firestore, Gemini AI, speechSynthesis, hero/anime images, QR codes, kiosk, payroll, behavior reports, AI briefings.

All deferred items remain parked in `docs/future-modules/jobs-manager-parking-lot.md`.

## Implementation

### State Model

```
JobsManagerState {
  jobs: ClassroomJob[] — 9 default jobs with title, description, capacity, points, active, displayOrder, category, timestamps, displayEmoji
  activeCycle: JobCycle | null — current active cycle with assignments
  archivedCycles: JobCycle[] — completed cycles for history
  studentHistory: StudentJobHistory[] — per-student completed/recent job IDs and assignment counts
  selectedClassId: string | null — class filter (homeroom/math/reading)
  cycleLengthDays: number — defaults to 10
}
```

### Files Created

| File | Purpose |
|------|---------|
| `src/features/jobs-manager/types.ts` | All type definitions (ClassroomJob, JobAssignment, JobCycle, StudentJobHistory, JobsManagerState, SmartAssignReport, DisplaySafeJobsState, DisplaySafeJob) |
| `src/features/jobs-manager/defaultJobs.ts` | 9 default classroom jobs with capacities and emoji |
| `src/features/jobs-manager/smartAssign.ts` | Pure smart assignment function with fairness algorithm |
| `src/features/jobs-manager/jobsManagerStore.ts` | Zustand + localStorage store with all actions |
| `src/features/jobs-manager/JobsManagerTeacherPanel.tsx` | Teacher Dock panel UI |
| `src/features/jobs-manager/JobsManagerStudentDisplay.tsx` | Student-safe /display widget |
| `src/features/jobs-manager/jobsManagerTests.ts` | 82 unit tests |
| `scripts/test-jobs-manager.sh` | Test runner script |

### Files Modified

| File | Change |
|------|--------|
| `src/features/display-composer/types.ts` | Added `'jobs-manager'` to `CanvasWidgetType` |
| `src/features/display-studio/studioWidgets.ts` | Added `jobs-manager` widget definition |
| `src/features/display-studio/widgetRegistry.ts` | Added `jobs-manager` registry entry (classroom, large, studentSafe: true) |
| `src/features/display-studio/DisplayStudioWidgetLibrary.tsx` | Added `jobs-manager` to `WIDGET_TYPE_MAP` |
| `src/features/display-studio/WidgetCanvasCard.tsx` | Added `jobs-manager` case → `JobsManagerContent` |
| `src/features/display-studio/WidgetEngagementRenderers.tsx` | Added `JobsManagerContent` component |
| `src/features/display-composer/WidgetDisplayOverlay.tsx` | Added `jobs-manager` case → `JobsManagerStudentDisplay` |
| `src/features/teacher-dock/toolPanels/JobsToolPanel.tsx` | Replaced DailyBriefPanel delegate with `JobsManagerTeacherPanel` |
| `src/lib/display-studio-tests.ts` | Added `lotto-board` and `jobs-manager` to connected widget types set |
| `package.json` | Added `test:jobs-manager` script |

### Smart Assign Algorithm

Two-pass algorithm:

1. **Preserve:** Existing manual assignments are preserved (their student IDs are marked as already assigned).
2. **Pass 1 — Conflict avoidance:** Students are ranked by assignment count (fewer = higher priority), shuffled with provided RNG. Each active job is filled from the ranked pool, skipping students who had the same job in the immediately prior cycle.
3. **Pass 2 — Relaxed:** Remaining capacity is filled allowing prior-cycle jobs.
4. **Constraints:** Inactive/absent students are excluded. Job capacities are respected. Each student gets at most one assignment.
5. **Report:** Returns assignments made, unfilled jobs, and skipped students count.

**No AI, no network.** Pure deterministic function with injectable RNG for testability.

### Cycle Management

- **Start New Cycle:** Auto-archives current cycle if active, creates new cycle with label
- **End Cycle:** Archives current assignments, builds student history (completedJobIds, recentJobIds, assignmentCount), clears active cycle
- **Undo End Cycle:** Restores the most recently archived cycle back to active status
- **Cycle length:** Configurable 1-45 days (default 10)

### Student Display Safety

`getDisplaySafeJobsState(students)` returns only:

```typescript
{
  cycleLabel: string
  jobs: { title, description, capacity, assignedNames: string[], displayEmoji }[]
  totalAssigned: number
  totalSlots: number
}
```

**Never exposed:** Internal job IDs, points, teacher controls, student history, assignment scores, roster setup warnings, cycle internals, localStorage raw data.

### Display Studio Widget

- **Category:** Classroom
- **Icon:** 🧰
- **Default size:** large
- **Student safe:** true
- **Editor renderer:** Shows cycle label, assigned/total counts
- **Display renderer:** Shows job cards with student first names, empty state message "Jobs are ready to assign"

## Validation Table

| Command | Result |
|---------|--------|
| `npm run test:jobs-manager` | 82P 0F |
| `npm run test:hundred-board` | 387P 0F |
| `npm run test:lotto-board` | 166P 0F |
| `npm run test:prize-board` | 238P 0F |
| `npm run test:display-studio` | 63P 0F |
| `npm run test:display-composer` | All PASS |
| `npm run test:display-launch` | 12P 0F |
| `npm run test:display-polish` | 15P 0F |
| `npm run test:student-picker` | 36P 0F |
| `npm run test:random-number` | 29P 0F |
| `npm run test:teacher-dock` | All PASS |
| `npm run build` | PASS |
| `npm run lint` | PASS (0 errors) |

## Screenshot Table

| # | Description | Status |
|---|-------------|--------|
| 1 | Teacher Jobs Manager empty/no roster state | WARN |
| 2 | Teacher Jobs Manager with sample roster | WARN |
| 3 | Manual assignment modal/dropdown | WARN |
| 4 | Job cards after manual assignment | WARN |
| 5 | Smart Assign result | WARN |
| 6 | End Cycle confirmation | WARN |
| 7 | Cycle history / undo available | WARN |
| 8 | Student-safe /display jobs board | WARN |
| 9 | Display Studio widget/editor view | WARN |
| 10 | Narrow/laptop viewport | WARN |

**Coverage:** 0/10 — Playwright SEGV_MAPERR in sandbox (known pre-existing limitation). MacOS `screencapture` also blocked. Marked WARN.

## Privacy / Network / Safety Scan

```
grep -RInE "firebase|Firestore|getFirestore|initializeApp|Gemini|generativelanguage|OpenAI|speechSynthesis|SpeechSynthesisUtterance" src/features/jobs-manager/ 2>/dev/null
→ CLEAN: no cloud/AI/voice in jobs-manager

grep -RInE "<PRIVATE_STUDENT_NAME>|<PRIVATE_CLASS_NAME>|<PRIVATE_ROSTER_LABEL>" src docs tests scripts 2>/dev/null
→ CLEAN: no real names
```

- No Firebase imports added
- No Gemini/OpenAI calls added
- No speechSynthesis added
- No anime asset imports added
- No real roster names in committed files
- No `.local` files staged

## Deferred Items

Remain parked in `docs/future-modules/jobs-manager-parking-lot.md`:
- Payroll / points economy
- QR codes / student kiosk
- Printable job cards
- License cards
- Job badges
- Behavior reports
- AI briefings
- Voice / TTS announcements
- Hero/anime image assets
- Firebase/Gemini use

## Known WARN/FAIL

- **Screenshot coverage:** WARN — 0/10 captured. Playwright crashes (SEGV_MAPERR) in sandboxed environment; macOS automation blocked. This is a known pre-existing limitation across Phase 15H–K.
- **Teacher Workstation E2E:** Expected FAIL from pre-existing Playwright SEGV (not introduced by this phase).

No regressions in any existing test suite.

## Safe to Commit: Yes

All tests pass, lint clean, build passes, no cloud/AI/voice code, no real names, no security issues.

## Explicit Statement

**No commit was made.** Awaiting approval per the request.

## Answers to Report Questions

1. **What Jobs-related code already existed?** A thin wrapper (`JobsToolPanel.tsx`) that delegated to `DailyBriefPanel` — a daily brief template editor, not a jobs manager.

2. **Was it a full jobs manager or a placeholder/thin wrapper?** Placeholder/thin wrapper. No job assignment, roster connection, cycle management, or smart assign existed.

3. **What roster/class source did you connect to?** The existing `usePickerStore` (Zustand + localStorage). Students are accessed via `usePickerStore((s) => s.students)` with `id`, `displayName`, `firstName`, `classes`, `isActive`, `isAbsent` fields. Class filtering supports homeroom, math, reading.

4. **What job state model did you add?** `JobsManagerState` with `jobs` (9 default ClassroomJob entries), `activeCycle`, `archivedCycles`, `studentHistory`, `selectedClassId`, `cycleLengthDays`. All persisted to localStorage via Zustand.

5. **What assignment rules did you implement?** Manual (assign/unassign, capacity enforcement, inactive job blocking, missing roster empty state), move (student from one job to another), clear all, smart assign (fairness-optimized, two-pass algorithm).

6. **How does smart assign work?** Two-pass algorithm: preserves existing manual assignments, ranks students by assignment count, shuffles with injectable RNG, avoids prior-cycle job conflicts in pass 1, relaxes in pass 2. Respects capacity, filters inactive/absent. Returns structured report. Pure function, no network/AI.

7. **How does cycle history work?** End Cycle archives the active cycle's assignments into `archivedCycles` and builds `studentHistory` (completedJobIds, recentJobIds, assignmentCount). Undo End Cycle restores the most recent archived cycle as active. Cycle labels auto-increment.

8. **How is /display kept student-safe?** `getDisplaySafeJobsState(students)` returns only cycle label, job titles, descriptions, capacities, assigned first names, display emoji, and summary counts. No internal IDs, points, teacher controls, cycle history, assignment scores, or roster internals.

9. **What is deferred?** Payroll/points economy, QR codes, kiosk, printable cards, license cards, job badges, behavior reports, AI briefings, voice/TTS, hero/anime images, Firebase/Gemini integration. All parked in `docs/future-modules/jobs-manager-parking-lot.md`.
