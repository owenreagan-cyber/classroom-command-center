# Status — Local Packet Backup & Restore

## Date: Sunday, July 12, 2026

## Summary
Daily Brief Packet Import/Export + Full Backup/Restore system. Teachers can export/import instructional Daily Brief packets (public content only) and create/restore full local backups of selected Command Center categories. All processing is local — no cloud, network, or service calls.

## Files Created/Changed
- `src/features/local-packets/types.ts` — Packet envelope, Daily Brief payload, Full Backup payload types
- `src/features/local-packets/packetVersion.ts` — Version constants, migration function
- `src/features/local-packets/packetValidation.ts` — Runtime validation, sanitization, limits, privacy checks
- `src/features/local-packets/packetApplyPlan.ts` — Apply-plan creation, conflict detection, merge utilities
- `src/features/local-packets/packetExport.ts` — Envelope creation, export sanitizer, download helpers
- `src/features/local-packets/packetImport.ts` — File parsing, undo snapshot management (pure functions)
- `src/features/local-packets/packetStoreAdapter.ts` — **Store integration layer**: typed adapter functions (`applyDailyBriefToStores`, `restoreBackupToStores`, `applyUndo`, `getActiveState`) that call real Zustand stores via direct `getState`/`setState`
- `src/features/local-packets/LocalPacketPanel.tsx` — Teacher-facing UI with tabs: Export Brief, Import Brief, Backup, Restore. Uses `packetStoreAdapter` for all store mutations
- `src/features/local-packets/tests.ts` — 85 pure function assertions
- `src/features/local-packets/integration-tests.ts` — 68 integration tests against real stores
- `scripts/test-local-packets.sh` — Test runner
- `src/board/TeacherDock.tsx` — Added `LocalPacketPanel` with timer/picker state relay
- `src/app/AppShell.tsx` — Timer and picker store subscriptions wired to TeacherDock
- `src/board/BoardBackupPanel.tsx` — Labeled `[Legacy]`, import routed through unified coordinator
- `package.json` — Added `test:local-packets` script
- `.gitignore` — Added `.local/local-packet-tests`
- `src/features/student-picker/pickerStore.ts` — Added `correctOutcome` action
- `src/features/student-picker/types.ts` — Added `originalOutcome`, `correctedAt` fields, `correctOutcome` action
- `src/features/student-picker/components/HistoryTab.tsx` — Added outcome correction buttons

## Architecture / Data Flow

### Daily Brief Export (end-to-end live)
Teacher Dock → Export Brief tab → button click → `createDailyBriefPayload` → `createEnvelope` → `downloadPacket` (browser file save)

### Daily Brief Import → Apply (end-to-end live)
File selection → `parsePacketFile` (parse + validate + migrate) → preview with checkboxes → confirmation → **`applyDailyBriefToStores()`** → snapshot → `boardStore.setState(contents)` / `pickerStore.updateCoachingConfig()` → Undo available

### Full Backup Export (end-to-end live)
Teacher Dock → Backup tab → category checkboxes → `createBackupPayload` → `createEnvelope` → `downloadPacket`

### Full Backup Restore (end-to-end live)
File selection → `parsePacketFile` → preview with category checkboxes → confirmation → **`restoreBackupToStores()`** → snapshot → `boardStore.setState` / `timerStore.setState` / `pickerStore.setState` / `pickerStore.updateCoachingConfig` / `pickerStore.updateSettings` → Undo available

### Apply/Restore coordinator (`packetStoreAdapter.ts`)
All store mutations happen only after:
1. Successful validation
2. Explicit category selection
3. Conflict review (active timers/sessions)
4. Confirmation

### Undo Flow
`applyDailyBriefToStores()` or `restoreBackupToStores()` → local backup per category → on undo: `restoreCategory()` for each → clears Undo slot only on complete success. Prior Undo is preserved across a failed follow-up operation.

### Synchronous Multi-Store Apply with Rollback
- All mutations happen in sequence within the same synchronous function.
- Before mutation, a local backup of affected categories is created. If any category restore fails or throws, the stores are rolled back to pre-mutation state automatically.
- Partial state is never written. Undo slot is created only on complete success, and is retained across a later failure.
- All mutations use `structuredClone` to prevent reference sharing.
- Described as **synchronous multi-store apply with rollback**, not an enterprise atomic transaction.

### Active-State Protections
- Timers: current live state (`status`, `remainingMs`, `endsAt`) is re-read at apply time. If running/paused, config fields are updated but runtime is preserved unless `replaceTimerRuntime=true`.
- Mystery sessions: current sessions are re-read at apply time and preserved unless `replaceActiveMystery=true`.
- Apply-time recheck prevents stale-preview bypass.

### Storage Mock
Test process sets up a controlled `localStorage` mock before Zustand stores are imported, eliminating the `[zustand persist middleware] Unable to update item` warning. Tests use persisted-state serialization and reconstruction checks.

## Acceptance Matrix

| Requirement | Implementation | Enforcement | Test/Proof | Status |
| ----------- | -------------- | ----------- | ---------- | ------ |
| Daily Brief export | `packetExport.ts` + UI | Sanitization strips private keys | Test #28 (6 asserts) | **Implemented and validated** |
| Daily Brief file selection | `LocalPacketPanel.tsx` input[type=file] | Browser file picker | Manual | **Implemented and validated** |
| Parse/Validate/Migrate | `parsePacketFile` | `validatePacket` + `migratePacketPayload` | Tests #1-15 (30+ asserts) | **Implemented and validated** |
| Preview | `ImportBriefTab` state | Checkboxes per field group | Manual | **Implemented and validated** |
| Selection | Checkbox toggles per field group | Only selected groups applied | Test #20 | **Implemented and validated** |
| Confirmation | "Apply Selected" button calls adapter directly | Replaces old onApplyDailyBrief callback | Manual + INT-10 | **Implemented and validated** |
| Apply → live store update | `applyDailyBriefToStores()` → `useBoardStore.setState/updateContents` | Direct Zustand setState | Test 1 | **Implemented and validated** |
| Undo | Local backup + `applyUndo` + `restoreCategory` | Per-category snapshot + restore | INT-01-09, Test 8-9 | **Implemented and validated** |
| Prior Undo survives failed operation | Undo slot not cleared on failure | Flag-based preservation | Test 8 | **Implemented and validated** |
| Full Backup export | `createBackupPayload` + category UI | Category selection filtering | Test #29 | **Implemented and validated** |
| Full Backup restore | `restoreBackupToStores()` → all 3 stores | Present + selected only | INT-12-13, Test 3-4 | **Implemented and validated** |
| Board content restore | `restoreBackupToStores` case 'board' | Direct setState on boardStore | INT-12 | **Implemented and validated** |
| Timer config restore | `restoreBackupToStores` case 'timers' | Merge preserves runtime by default | Code path + UI checkbox | **Implemented and validated** |
| Timer runtime protection (apply-time) | `replaceTimerRuntime` flag + live recheck | Default false, rechecked at mutation | Test 6 | **Implemented and validated** |
| Roster restore | `restoreBackupToStores` case 'rosters' | Direct setState on pickerStore | Test 5 | **Implemented and validated** |
| History restore (replacement) | `restoreBackupToStores` case 'pickerHistory' | Full replacement, not merge | Test 3 | **Implemented and validated** |
| Coaching config restore | `restoreBackupToStores` case 'coachingConfig' | Calls `updateCoachingConfig()` | Code path | **Implemented and validated** |
| Picker settings restore | `restoreBackupToStores` case 'pickerSettings' | Calls `updateSettings()` | Code path | **Implemented and validated** |
| Active Mystery session restore | `restoreBackupToStores` case 'activeMysterySessions' | Only if `replaceActiveMystery=true` | Test #24-25 | **Implemented and validated** |
| Mystery export → restore round-trip | `createBackupPayload()` → `restoreBackupToStores()` via production code path | Homeroom protected, Math/Reading restored, IDs/stages/observations survive, classes don't mix | Test 11a-11ac | **Implemented and validated** |
| Mystery session protection (apply-time) | Live recheck at mutation time | Default preserve | Code path | **Implemented and validated** |
| Active-state detection | `getActiveState()` reads timers + sessions | Runs on every import/restore | INT-14-17 | **Implemented and validated** |
| Atomic rollback | Pre-mutation local backup + sequential apply | Automatic rollback on any failure | Test 7a-h (partial-mutation: board mutates, timers throws, both restored) | **Implemented and validated** |
| Rollback diagnostics | `rollbackFailedCategories` array + `rollbackFailed` boolean on `ApplyResult` | Category names collected when restore fails | Test 7g-h | **Implemented and validated** |
| Prior Undo survives failed partial mutation | Undo slot not cleared on failure | Preserved across failed multi-category apply | Test 8a-d | **Implemented and validated** |
| Legacy BoardBackupPanel | Routed through unified validator and coordinator (Outcome B) | Shares same validation, protection, and undo | Manual | **Implemented and validated** |
| Privacy: Daily Brief no private data | Sanitizer in `createDailyBriefPayload` | Reject at validation level | Test #13-15, #28, #28b | **Implemented and validated** |
| Privacy: sentinel private data excluded | Explicit sentinel ID/name not serialized | Verify sentinel strings absent | Test #28b | **Implemented and validated** |
| Privacy: no HTML injection | React default escaping | No dangerouslySetInnerHTML | Test #32 | **Implemented and validated** |
| Privacy: no URL fetching | Zero fetch/XMLHttpRequest in feature | Code search confirmed | Adversarial search | **Implemented and validated** |
| UI: buttons are functional | All buttons call real adapter functions | No dead callbacks | Code audit | **Implemented and validated** |
| UI: preview distinguishes data | Shows title, date, selected/protected/skipped | UI renders categories | Manual | **Implemented and validated** |
| Teacher Dock wiring | AppShell passes timer + picker state | Full store data flows to panel | Code path | **Implemented and validated** |
| Restore returns restored/skipped names | `restoreBackupToStores` returns `restored` and `skipped` arrays | Actual category names reported | Test 4, 5 | **Implemented and validated** |
| Absent categories never included | Filter: present && selected | Only present categories snapshotted/restored | Test 5 | **Implemented and validated** |
| No persistence warning in tests | Mock localStorage before imports | Controlled storage mock | Test output verified | **Implemented and validated** |
| Reversible outcome corrections | `correctOutcome` store action | Updates event, preserves original | Test 12 | **Implemented and validated** |
| Class isolation (Mystery) | Scoped by `classId` key | Independent sessions | Test 10 | **Implemented and validated** |

## Privacy Boundary (Audited)
- Daily Brief export strips: student names, IDs, rosters, fairness history, active mystery sessions, observations, attendance, private notes
- Daily Brief import validation rejects files containing private keys
- Sentinel private values verified absent in export JSON
- Full backup includes private categories *only when selected* by the teacher
- All rendering is via React JSX — no `dangerouslySetInnerHTML`, no `innerHTML`, no URL fetching
- No school Canvas URLs or real student names committed

## Tests
**Local-packets tests:** `npm run test:local-packets` — 85 assertions validating:
- Validation paths (JSON, format, kind, version, screens, coaching, sizes, private data)
- Export sanitization (no private keys in daily-brief, sentinel verification)
- Category selection, roster/history merge, plan structure, undo lifecycle
- XSS safety (sanitized text treated as text)

**Integration tests (real stores):** 68 assertions validating:
- Undo snapshot lifecycle (store, replace, apply, clear, survive failure)
- `applyDailyBriefToStores`, `restoreBackupToStores` returning structured results
- `getActiveState` returning typed arrays
- `applyUndo` with no snapshot returns error
- Real Zustand mutation (board, timer, picker)
- Category replacement vs merge semantics
- Absent category exclusion
- Apply-time active protection (timer runtime preserved)
- Genuine partial-mutation rollback: board mutates, timers throws, board state restored, timer state unchanged, prior Undo survives
- Prior Undo retained after later failure
- Undo restores real store state
- Rollback diagnostics consistency (`rollbackFailed` derived from `rollbackFailedCategories.length`)
- Export → restore Active Mystery session round-trip via production code path (`createBackupPayload` + `restoreBackupToStores`)
  - Homeroom protected when active session exists
  - Math and Reading restored from backup
  - Exact student IDs, reveal stages, observations survive
  - Class IDs do not mix

**Student-picker tests:** `npm run test:student-picker` — 68 assertions validating:
- Persisted-state serialization and reconstruction checks (not actual Zustand middleware rehydration — Zustand middleware initialization and migration are not directly exercised)
- Class isolation, absence, outcome corrections, Mystery sessions

## Exact Validation Results
| Command | Result |
|---|---|
| `npm run test:local-packets` | ✅ 68 integration + 85 pure = 153 total passed, 0 failed, 0 warnings |
| `npm run test:student-picker` | ✅ 68 passed, 0 failed, 0 warnings |
| `npm run lint` | ✅ 0 errors, 0 warnings |
| `npm run build` | ✅ |
| `git diff --check` | ✅ no whitespace errors |
| `git diff --cached --check` | ✅ empty index (nothing staged) |
| No `.local` test residue | ✅ EXIT trap removes all temp files; pre-existing `.local/` artifacts ignored |
| No network/cloud/auth/analytics | ✅ Zero instances in codebase |
| No dangerouslySetInnerHTML | ✅ Zero instances |
| No school Canvas URLs | ✅ Zero instances |
| No real student data | ✅ Zero instances |

## Remaining Limitations
1. **Undo is single-session in-memory** — does not survive page refresh
2. **App Preferences are not included** in this phase — no global app-preferences store exists
3. **No automated periodic backup scheduling** — manual only
4. **Timer presets in Daily Brief packets** are metadata-only; no live timer runtime included
5. **No drag-and-drop file handling** on import
6. **No import/export of the DailyBriefPanel localStorage draft** (`cc_daily_brief_draft`)
7. **Synchronous multi-store apply with rollback** — provides deterministic in-memory rollback, not database transaction isolation
