// ── Local Packets Integration Tests ─────────────────────────────────────
// Tests the packetStoreAdapter surface API.
// These test API contract correctness against real stores.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const process: any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const global: any

// Mock localStorage for Zustand persistence before imports
const storage: Record<string, string> = {}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalObj = global as any
globalObj.window = globalObj
globalObj.localStorage = {
  getItem: (key: string) => storage[key] || null,
  setItem: (key: string, value: string) => { storage[key] = value },
  removeItem: (key: string) => { delete storage[key] },
  clear: () => { for (const key in storage) delete storage[key] },
  length: 0,
  key: (index: number) => Object.keys(storage)[index] || null,
}

import { takePreImportSnapshot, applyUndo, getUndoSlot, clearUndoSlot, applyDailyBriefToStores, restoreBackupToStores, getActiveState } from './packetStoreAdapter'
import { createBackupPayload } from './packetExport'
import type { DailyBriefPacketPayload, FullBackupPacketPayload, FullBackupCategories } from './types'
import type { PickerClassId, MysterySession } from '../student-picker/types'
import { useBoardStore } from '../../store/boardStore'
import { useTimerStore } from '../../store/timerStore'
import { usePickerStore } from '../student-picker/pickerStore'

let passed = 0
let failed = 0

function assert(label: string, condition: boolean) {
  if (condition) {
    passed++
  } else {
    failed++
    console.error(`FAIL: ${label}`)
  }
}

function assertEq(label: string, a: unknown, b: unknown) {
  if (a === b) {
    passed++
  } else {
    failed++
    console.error(`FAIL: ${label} — expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`)
  }
}

// ═══════════════════════════════════════════════════════════════════════
// Integration: Undo lifecycle
// ═══════════════════════════════════════════════════════════════════════

;(() => {
  clearUndoSlot()
  assert('INT-01: getUndoSlot null after clear', getUndoSlot() === null)

  takePreImportSnapshot('Test snapshot', ['coachingConfig'])
  const slot = getUndoSlot()
  assert('INT-02: getUndoSlot has label', slot?.label === 'Test snapshot')
  assert('INT-03: getUndoSlot has categories', slot !== null && slot.categories.includes('coachingConfig'))
  assert('INT-04: getUndoSlot timestamp is number', slot !== null && typeof slot.timestamp === 'number')

  // Apply undo
  const result = applyUndo()
  assert('INT-05: applyUndo returns restored array', Array.isArray(result.restored))
  assert('INT-06: applyUndo returns errors array', Array.isArray(result.errors))
  // After successful undo, slot is cleared
})()

// ═══════════════════════════════════════════════════════════════════════
// Integration: Second snapshot replaces first
// ═══════════════════════════════════════════════════════════════════════

;(() => {
  clearUndoSlot()
  takePreImportSnapshot('First import', ['timers'])
  takePreImportSnapshot('Second import', ['board'])

  const slot = getUndoSlot()
  assert('INT-07: Second import replaces label', slot?.label === 'Second import')
  assert('INT-08: Second import has only board', slot?.categories.length === 1)
  assert('INT-09: Second import category is board', slot?.categories[0] === 'board')
})()

// ═══════════════════════════════════════════════════════════════════════
// Integration: applyDailyBriefToStores returns structured result
// ═══════════════════════════════════════════════════════════════════════

;(() => {
  clearUndoSlot()

  const payload: DailyBriefPacketPayload = {
    metadata: {
      packetId: 'test-001',
      title: 'Test Brief',
      createdAt: new Date().toISOString(),
    },
    targetScreens: ['homeroom'],
    content: {},
  }

  const result = applyDailyBriefToStores({
    packet: payload,
    selectedFieldGroups: [{ screenId: 'homeroom', groupId: 'doNow' }],
  })

  assert('INT-10: applyDailyBriefToStores returns success of type boolean', typeof result.success === 'boolean')
  assert('INT-11: applyDailyBriefToStores returns errors array', Array.isArray(result.errors))
})()

// ═══════════════════════════════════════════════════════════════════════
// Integration: restoreBackupToStores returns structured result
// ═══════════════════════════════════════════════════════════════════════

;(() => {
  clearUndoSlot()

  const cats: FullBackupCategories = {
    board: { mode: 'edit' },
  }

  const payload: FullBackupPacketPayload = {
    categories: cats,
    exportedCategories: ['board'],
  }

  const result = restoreBackupToStores({
    packet: payload,
    selectedCategories: ['board'],
    replaceTimerRuntime: false,
    replaceActiveMystery: false,
  })

  assert('INT-12: restoreBackupToStores returns success of type boolean', typeof result.success === 'boolean')
  assert('INT-13: restoreBackupToStores returns errors array', Array.isArray(result.errors))
})()

// ═══════════════════════════════════════════════════════════════════════
// Integration: getActiveState returns structured result
// ═══════════════════════════════════════════════════════════════════════

;(() => {
  const state = getActiveState()
  assert('INT-14: getActiveState has activeTimers array', Array.isArray(state.activeTimers))
  assert('INT-15: getActiveState has activeMysterySessions array', Array.isArray(state.activeMysterySessions))
  assert('INT-16: getActiveState has revealInProgress boolean', typeof state.revealInProgress === 'boolean')
  assert('INT-17: getActiveState has quickPickPending boolean', typeof state.quickPickPending === 'boolean')
})()

// ═══════════════════════════════════════════════════════════════════════
// Integration: applyUndo with no snapshot
// ═══════════════════════════════════════════════════════════════════════

;(() => {
  clearUndoSlot()
  const result = applyUndo()
  assert('INT-18: applyUndo with no snapshot returns error message', result.errors.length > 0)
  assert('INT-19: applyUndo with no snapshot returns string error', typeof result.errors[0] === 'string')
})()

// ═══════════════════════════════════════════════════════════════════════
// Scenario-based Deep Store Tests
// ═══════════════════════════════════════════════════════════════════════

;(() => {
  // Reset stores to a known state
  useBoardStore.getState().resetToDefaults()
  useTimerStore.getState().resetAllTimers()
  usePickerStore.setState({
    students: [
      { id: 'johnny', displayName: 'Johnny', isActive: true, classes: ['homeroom', 'math'], isAbsent: false },
      { id: 'sarah', displayName: 'Sarah', isActive: true, classes: ['homeroom', 'reading'], isAbsent: false },
      { id: 'bobby', displayName: 'Bobby', isActive: true, classes: ['homeroom', 'math', 'reading'], isAbsent: false },
    ],
    fairnessHistory: [],
    activeMysterySessions: { homeroom: null, math: null, reading: null },
  })

  // 1. Real Zustand board mutation
  const dbPayload: DailyBriefPacketPayload = {
    metadata: { packetId: 'db-1', title: 'Daily Brief Test', createdAt: new Date().toISOString() },
    targetScreens: ['homeroom'],
    content: {
      homeroom: { doNow: 'Read a book', doNowTitle: 'Morning Work' }
    }
  }
  applyDailyBriefToStores({
    packet: dbPayload,
    selectedFieldGroups: [{ screenId: 'homeroom', groupId: 'doNow' }]
  })
  assert('Test 1: Board content updated in store', useBoardStore.getState().contents.homeroom.doNow === 'Read a book')

  // 2. Real timer mutation (config only)
  useTimerStore.setState({
    simpleTimers: {
      homeroom: { presetId: 'custom', label: 'Old', durationMs: 60000, remainingMs: 60000, status: 'idle', endsAt: null, appearance: 'calm', chimeEnabled: true },
      math: { presetId: 'custom', label: 'Math', durationMs: 60000, remainingMs: 60000, status: 'idle', endsAt: null, appearance: 'calm', chimeEnabled: true },
      reading: { presetId: 'custom', label: 'Reading', durationMs: 60000, remainingMs: 60000, status: 'idle', endsAt: null, appearance: 'calm', chimeEnabled: true },
      spelling: { presetId: 'custom', label: 'Spelling', durationMs: 60000, remainingMs: 60000, status: 'idle', endsAt: null, appearance: 'calm', chimeEnabled: true },
    }
  })
  const timerBackup: FullBackupPacketPayload = {
    categories: {
      timers: {
        simpleTimers: {
          homeroom: { presetId: 'custom', label: 'New', durationMs: 120000, remainingMs: 120000, status: 'idle', endsAt: null, appearance: 'bold', chimeEnabled: false }
        }
      }
    },
    exportedCategories: ['timers']
  }
  restoreBackupToStores({
    packet: timerBackup,
    selectedCategories: ['timers'],
    replaceTimerRuntime: false,
    replaceActiveMystery: false
  })
  assert('Test 2: Timer label updated', useTimerStore.getState().simpleTimers.homeroom.label === 'New')

  // 3. Category replacement semantics (pickerHistory)
  usePickerStore.setState({
    fairnessHistory: [{ id: 'h1', studentId: 'johnny', classId: 'homeroom', timestamp: 100, role: 'quick-pick', outcome: 'quick-picked' }]
  })
  const historyBackup: FullBackupPacketPayload = {
    categories: {
      pickerHistory: [{ id: 'h2', studentId: 'sarah', classId: 'homeroom', timestamp: 200, role: 'quick-pick', outcome: 'quick-picked' }]
    },
    exportedCategories: ['pickerHistory']
  }
  restoreBackupToStores({
    packet: historyBackup,
    selectedCategories: ['pickerHistory'],
    replaceTimerRuntime: false,
    replaceActiveMystery: false
  })
  assert('Test 3: Picker history replaced, not merged', usePickerStore.getState().fairnessHistory.length === 1 && usePickerStore.getState().fairnessHistory[0].id === 'h2')

  // 4. Unselected category preservation
  const prevMode = useBoardStore.getState().mode
  const boardBackup: FullBackupPacketPayload = {
    categories: { board: { mode: prevMode === 'edit' ? 'display' : 'edit' } },
    exportedCategories: ['board']
  }
  restoreBackupToStores({
    packet: boardBackup,
    selectedCategories: [], // None selected
    replaceTimerRuntime: false,
    replaceActiveMystery: false
  })
  assert('Test 4: Unselected category preserved', useBoardStore.getState().mode === prevMode)

  // 5. Absent category exclusion
  const res5 = restoreBackupToStores({
    packet: { categories: {}, exportedCategories: [] },
    selectedCategories: ['board'], // Selected but absent in packet
    replaceTimerRuntime: false,
    replaceActiveMystery: false
  })
  assert('Test 5: Absent category reported as skipped', res5.skipped?.includes('board') === true)

  // 6. Stale-preview protection (Timers)
  useTimerStore.setState({
    simpleTimers: {
      homeroom: { presetId: 'custom', label: 'Running', durationMs: 60000, remainingMs: 30000, status: 'running', endsAt: Date.now() + 30000, appearance: 'calm', chimeEnabled: true },
      math: { presetId: 'custom', label: 'Math', durationMs: 60000, remainingMs: 60000, status: 'idle', endsAt: null, appearance: 'calm', chimeEnabled: true },
      reading: { presetId: 'custom', label: 'Reading', durationMs: 60000, remainingMs: 60000, status: 'idle', endsAt: null, appearance: 'calm', chimeEnabled: true },
      spelling: { presetId: 'custom', label: 'Spelling', durationMs: 60000, remainingMs: 60000, status: 'idle', endsAt: null, appearance: 'calm', chimeEnabled: true },
    }
  })
  const staleTimerBackup: FullBackupPacketPayload = {
    categories: {
      timers: {
        simpleTimers: {
          homeroom: { presetId: 'custom', label: 'Incoming', durationMs: 120000, remainingMs: 120000, status: 'idle', endsAt: null, appearance: 'bold', chimeEnabled: false }
        }
      }
    },
    exportedCategories: ['timers']
  }
  restoreBackupToStores({
    packet: staleTimerBackup,
    selectedCategories: ['timers'],
    replaceTimerRuntime: false, // Protected
    replaceActiveMystery: false
  })
  assert('Test 6: Active timer runtime protected at apply time', useTimerStore.getState().simpleTimers.homeroom.status === 'running')

  // 7. Genuine partial-mutation rollback (board mutates, timers fails)
  // Set board state and timer state to known values
  useBoardStore.setState({ mode: 'edit' })
  useBoardStore.setState({ activeScreen: 'homeroom' })

  // Create a timers object with a getter that only throws when
  // the code reaches the timer section (after board has been applied)
  const throwingTimersPacket: FullBackupPacketPayload = {
    categories: {
      board: { mode: 'display', activeScreen: 'math' },
      timers: {
        simpleTimers: {
          homeroom: {
            get label() { throw new Error('Timer mutation failed') },
            presetId: 'custom',
            durationMs: 60000,
            remainingMs: 60000,
            status: 'idle',
            endsAt: null,
            appearance: 'calm',
            chimeEnabled: true
          }
        } as Record<string, unknown>,
        phaseTimer: {}
      } as unknown as FullBackupCategories['timers']
    },
    exportedCategories: ['board', 'timers']
  }

  // Record original state for comparison
  const origMode = useBoardStore.getState().mode
  const origActiveScreen = useBoardStore.getState().activeScreen
  const origTimerLabel = useTimerStore.getState().simpleTimers.homeroom?.label

  // Execute restore — should apply board then fail on timers
  const partialResult = restoreBackupToStores({
    packet: throwingTimersPacket,
    selectedCategories: ['board', 'timers'],
    replaceTimerRuntime: false,
    replaceActiveMystery: false
  })

  // Verify result
  assert('Test 7a: Partial mutation restore returns failure', partialResult.success === false)
  assert('Test 7b: Partial mutation restore has errors', partialResult.errors.length > 0)
  assert('Test 7c: Partial mutation rollback did not error', partialResult.rollbackFailed !== true)

  // Verify board was rolled back to pre-operation state
  assert('Test 7d: Board mode rolled back', useBoardStore.getState().mode === origMode)
  assert('Test 7e: Board activeScreen rolled back', useBoardStore.getState().activeScreen === origActiveScreen)

  // Verify timer state equals pre-operation state
  assert('Test 7f: Timer state unchanged after rollback', useTimerStore.getState().simpleTimers.homeroom?.label === origTimerLabel)

  // Verify rollbackFailedCategories is populated
  assert('Test 7g: rollbackFailedCategories is array', Array.isArray(partialResult.rollbackFailedCategories))
  assert('Test 7h: rollbackFailedCategories empty (all restored)', partialResult.rollbackFailedCategories?.length === 0)

  // 8. Prior Undo retained after later partial-mutation failure
  takePreImportSnapshot('Prior Successful', ['board'])
  const partialResult2 = restoreBackupToStores({
    packet: throwingTimersPacket,
    selectedCategories: ['board', 'timers'],
    replaceTimerRuntime: false,
    replaceActiveMystery: false
  })
  assert('Test 8a: Second partial mutation restore returns failure', partialResult2.success === false)
  const priorSlot = getUndoSlot()
  assert('Test 8b: Prior undo label retained after failed partial mutation', priorSlot?.label === 'Prior Successful')
  assert('Test 8c: Prior undo categories still present', priorSlot !== null && priorSlot.categories.includes('board'))
  // Verify no candidate Undo from the failed operation was installed
  assert('Test 8d: Undo slot label not overwritten by failed op', priorSlot !== null && priorSlot.label !== 'Full Backup Restore')

  // 9. Undo against real stores
  useBoardStore.setState({ mode: 'display' })
  takePreImportSnapshot('Before Undo Test', ['board'])
  useBoardStore.setState({ mode: 'edit' })
  applyUndo()
  assert('Test 9: Undo restored real store state', useBoardStore.getState().mode === 'display')

  // 10. Rollback diagnostics consistency (rollbackFailed derived from list)
  assert('Test 10a: rollbackFailed is derived from rollbackFailedCategories length',
    partialResult.rollbackFailed === (partialResult.rollbackFailedCategories!.length > 0))

})()

// ═══════════════════════════════════════════════════════════════════════
// Export → Restore Mystery Session round-trip (production path)
// ═══════════════════════════════════════════════════════════════════════

;(() => {
  // Reset picker store to known state
  usePickerStore.setState({
    students: [
      { id: 'sid-a', displayName: 'Alice', isActive: true, classes: ['homeroom', 'math'], isAbsent: false },
      { id: 'sid-b', displayName: 'Bob', isActive: true, classes: ['homeroom', 'reading'], isAbsent: false },
      { id: 'sid-c', displayName: 'Carol', isActive: true, classes: ['homeroom', 'math', 'reading'], isAbsent: false },
      { id: 'sid-d', displayName: 'Dave', isActive: true, classes: ['math', 'reading'], isAbsent: false },
    ],
    fairnessHistory: [],
    activeMysterySessions: { homeroom: null, math: null, reading: null },
  })

  // Build three distinct Mystery sessions
  const homeroomSession: MysterySession = {
    id: 'ms-hr-1',
    classId: 'homeroom',
    date: '2026-07-12',
    status: 'revealed-2' as const,
    slots: {
      'high-flier-1': { studentId: 'sid-a', status: 'earned' as const, reason: 'Great focus', observations: [] },
      'high-flier-2': { studentId: 'sid-b', status: 'hidden' as const, observations: [] },
      'star': {
        studentId: 'sid-c',
        status: 'hidden' as const,
        observations: [{ behaviorId: 'b1', value: 'positive' as const, context: 'Helped peer' }],
      },
    },
  }

  const mathSession: MysterySession = {
    id: 'ms-m-1',
    classId: 'math',
    date: '2026-07-12',
    status: 'active' as const,
    slots: {
      'high-flier-1': { studentId: 'sid-a', status: 'hidden' as const, observations: [] },
      'high-flier-2': { studentId: 'sid-c', status: 'hidden' as const, observations: [] },
      'star': { studentId: 'sid-d', status: 'earned' as const, reason: 'Math whiz', observations: [] },
    },
  }

  const readingSession: MysterySession = {
    id: 'ms-r-1',
    classId: 'reading',
    date: '2026-07-12',
    status: 'revealed-1' as const,
    slots: {
      'high-flier-1': { studentId: 'sid-b', status: 'did-not-earn' as const, reason: 'Needs practice', observations: [] },
      'high-flier-2': { studentId: 'sid-c', status: 'earned' as const, observations: [{ behaviorId: 'b2', value: 'positive' as const }] },
      'star': { studentId: 'sid-d', status: 'hidden' as const, observations: [] },
    },
  }

  const exportSessions: Record<PickerClassId, MysterySession | null> = {
    homeroom: homeroomSession,
    math: mathSession,
    reading: readingSession,
  }

  // Use the real production export function
  const packet = createBackupPayload(
    {
      activeMysterySessions: exportSessions as unknown,
    },
    ['activeMysterySessions'],
  )

  // Assert export shape
  assert('Test 11a: exportedCategories includes activeMysterySessions',
    packet.exportedCategories.includes('activeMysterySessions'))
  assert('Test 11b: categories.activeMysterySessions exists',
    packet.categories.activeMysterySessions !== undefined)
  assert('Test 11c: activeSessions wrapper present',
    (packet.categories.activeMysterySessions as Record<string, unknown>).activeSessions !== undefined)

  // Save expected exported sessions for comparison
  const expectedMath = mathSession
  const expectedReading = readingSession

  // Now change current store: Homeroom gets a different session, Math null, Reading null
  const currentHRSession: MysterySession = {
    id: 'ms-hr-current',
    classId: 'homeroom',
    date: '2026-07-12',
    status: 'active' as const,
    slots: {
      'high-flier-1': { studentId: 'sid-b', status: 'hidden' as const, observations: [] },
      'high-flier-2': { studentId: 'sid-c', status: 'hidden' as const, observations: [] },
      'star': { studentId: 'sid-a', status: 'hidden' as const, observations: [] },
    },
  }

  usePickerStore.setState({
    activeMysterySessions: {
      homeroom: currentHRSession,
      math: null,
      reading: null,
    },
  })

  // Restore via real coordinator with protection enabled
  const restoreResult = restoreBackupToStores({
    packet,
    selectedCategories: ['activeMysterySessions'],
    replaceTimerRuntime: false,
    replaceActiveMystery: false,
  })

  // Assert restore result
  assert('Test 11d: Mystery restore succeeded', restoreResult.success === true)
  assert('Test 11e: Mystery restore has no errors', restoreResult.errors.length === 0)
  assert('Test 11f: Mystery restore reported in restored', restoreResult.restored?.includes('activeMysterySessions') === true)
  assert('Test 11g: Mystery restore no skipped', restoreResult.skipped?.length === 0 || restoreResult.skipped === undefined)

  // Assert Homeroom protected (unchanged from current)
  const currentHR = usePickerStore.getState().activeMysterySessions['homeroom']!
  assert('Test 11h: Homeroom protected (not null)', currentHR !== null)
  assertEq('Test 11i: Homeroom ID unchanged (protected)', currentHR.id, currentHRSession.id)
  assertEq('Test 11j: Homeroom classId preserved', currentHR.classId, 'homeroom')
  assertEq('Test 11k: Homeroom status unchanged (protected)', currentHR.status, currentHRSession.status)
  assertEq('Test 11l: Homeroom slot1 studentId unchanged', currentHR.slots['high-flier-1']!.studentId, currentHRSession.slots['high-flier-1']!.studentId)

  // Assert Math restored from backup
  const currentMath = usePickerStore.getState().activeMysterySessions['math']!
  assert('Test 11m: Math restored (not null)', currentMath !== null)
  assertEq('Test 11n: Math ID from backup', currentMath.id, expectedMath.id)
  assertEq('Test 11o: Math classId correct', currentMath.classId, 'math')
  assertEq('Test 11p: Math status from backup', currentMath.status, expectedMath.status)
  assertEq('Test 11q: Math slot1 studentId from backup', currentMath.slots['high-flier-1']!.studentId, expectedMath.slots['high-flier-1']!.studentId)
  assertEq('Test 11r: Math slot3 reason from backup', currentMath.slots['star']!.reason, expectedMath.slots['star']!.reason)

  // Assert Reading restored from backup
  const currentReading = usePickerStore.getState().activeMysterySessions['reading']!
  assert('Test 11s: Reading restored (not null)', currentReading !== null)
  assertEq('Test 11t: Reading ID from backup', currentReading.id, expectedReading.id)
  assertEq('Test 11u: Reading classId correct', currentReading.classId, 'reading')
  assertEq('Test 11v: Reading status from backup', currentReading.status, expectedReading.status)
  assertEq('Test 11w: Reading slot2 studentId from backup', currentReading.slots['high-flier-2']!.studentId, expectedReading.slots['high-flier-2']!.studentId)

  // Assert observations survive
  assertEq('Test 11x: Homeroom star observation survives (protected)',
    currentHR.slots['star']!.observations.length, currentHRSession.slots['star']!.observations.length)
  assertEq('Test 11y: Reading slot2 observation from backup',
    currentReading.slots['high-flier-2']!.observations.length, expectedReading.slots['high-flier-2']!.observations.length)
  assertEq('Test 11z: Reading observation behaviorId',
    currentReading.slots['high-flier-2']!.observations[0].behaviorId, 'b2')

  // Assert no class mixing
  assert('Test 11aa: No class ID mixing', currentHR.classId !== currentMath.classId)
  assert('Test 11ab: Math and Reading class IDs distinct', currentMath.classId !== currentReading.classId)
  assert('Test 11ac: Homeroom and Reading class IDs distinct', currentHR.classId !== currentReading.classId)
})()

// ═══════════════════════════════════════════════════════════════════════
// Studio Canvas layout backup/restore round trip (production path)
//
// LocalPacketPanel's Full Backup export previously omitted classWorkspaces
// entirely (the "board" source object built from component props never
// included it, even though restoreBackupToStores/normalizeClassWorkspacesGeometry
// on the import side always supported it) — layouts a teacher customized in
// Studio silently vanished from every downloaded backup file. These tests
// exercise the real production functions (createBackupPayload,
// restoreBackupToStores) the way the fixed LocalPacketPanel now calls them.
// ═══════════════════════════════════════════════════════════════════════

;(() => {
  useBoardStore.getState().resetToDefaults()

  const HOMEROOM = 'homeroom'
  const MATH = 'math'
  const hrWs = useBoardStore.getState().classWorkspaces[HOMEROOM]!
  const mathWs = useBoardStore.getState().classWorkspaces[MATH]!
  const hrPageId = hrWs.pages[0].id
  const hrWidgetId = hrWs.pages[0].widgets[0].id
  const mathPageId = mathWs.pages[0].id
  const mathWidgetId = mathWs.pages[0].widgets[0].id

  // Customize layouts on two different classes/pages via the real store action.
  // Geometry is set before locking — setWidgetGeometry is a no-op on a
  // locked widget, matching the product's own "locked widgets cannot move" rule.
  useBoardStore.getState().updatePageWidgetGeometry(HOMEROOM, hrPageId, hrWidgetId, { x: 222, y: 111 })
  useBoardStore.getState().updatePageWidgetGeometry(MATH, mathPageId, mathWidgetId, { x: 333, y: 44 })
  useBoardStore.getState().setPageWidgetLocked(MATH, mathPageId, mathWidgetId, true)

  const hrCustomX = useBoardStore.getState().classWorkspaces[HOMEROOM]!.pages[0].widgets.find(w => w.id === hrWidgetId)!.x
  assert('STUDIO-01: Homeroom widget geometry customized before export', hrCustomX === 222)

  // Export exactly like the (fixed) LocalPacketPanel BackupTab does: pull
  // classWorkspaces from board state into the "board" source category.
  const boardState = useBoardStore.getState()
  const packet = createBackupPayload(
    {
      board: {
        mode: boardState.mode,
        activeScreen: boardState.activeScreen,
        activePageId: boardState.activePageId,
        classWorkspaces: boardState.classWorkspaces as unknown,
        backgroundId: boardState.backgroundId,
        contents: boardState.contents as unknown,
        teacherNotes: boardState.teacherNotes as unknown[],
        cardVisibility: boardState.cardVisibility as unknown,
        customPresets: boardState.customPresets as unknown[],
        noiseTrackers: boardState.noiseTrackers as unknown,
      },
    },
    ['board'],
  )

  assert('STUDIO-02: Full Backup export includes classWorkspaces', packet.categories.board?.classWorkspaces !== undefined)

  // Mutate the layouts away from what was exported.
  useBoardStore.getState().updatePageWidgetGeometry(HOMEROOM, hrPageId, hrWidgetId, { x: 999, y: 999 })
  useBoardStore.getState().setPageWidgetLocked(MATH, mathPageId, mathWidgetId, false)

  const restoreResult = restoreBackupToStores({
    packet,
    selectedCategories: ['board'],
    replaceTimerRuntime: false,
    replaceActiveMystery: false,
  })
  assert('STUDIO-03: Restore of Studio layout backup succeeds', restoreResult.success === true)

  const restoredHr = useBoardStore.getState().classWorkspaces[HOMEROOM]!.pages.find(p => p.id === hrPageId)!.widgets.find(w => w.id === hrWidgetId)!
  const restoredMath = useBoardStore.getState().classWorkspaces[MATH]!.pages.find(p => p.id === mathPageId)!.widgets.find(w => w.id === mathWidgetId)!

  assertEq('STUDIO-04: Homeroom layout restored to exported x under its stable page/class id', restoredHr.x, 222)
  assertEq('STUDIO-05: Math layout restored to exported x under its stable page/class id', restoredMath.x, 333)
  assert('STUDIO-06: Math lock state restored', restoredMath.locked === true)

  // Restoring the board category must not touch picker/timer state unless
  // those categories were also selected.
  usePickerStore.setState({ fairnessHistory: [{ id: 'guard-1', studentId: 'x', classId: 'homeroom', timestamp: 1, role: 'quick-pick', outcome: 'quick-picked' }] })
  const guardHistory = usePickerStore.getState().fairnessHistory
  useTimerStore.setState({ simpleTimers: { ...useTimerStore.getState().simpleTimers, homeroom: { ...useTimerStore.getState().simpleTimers.homeroom, label: 'Guard Label' } } })
  const guardTimerLabel = useTimerStore.getState().simpleTimers.homeroom.label

  restoreBackupToStores({
    packet,
    selectedCategories: ['board'],
    replaceTimerRuntime: false,
    replaceActiveMystery: false,
  })
  assert('STUDIO-07: Board-only restore leaves picker history unchanged', usePickerStore.getState().fairnessHistory === guardHistory)
  assertEq('STUDIO-08: Board-only restore leaves timer state unchanged', useTimerStore.getState().simpleTimers.homeroom.label, guardTimerLabel)
})()

;(() => {
  // An old backup exported before Studio Canvas existed has no
  // classWorkspaces field at all on its "board" category. It must still
  // restore successfully and must not wipe out the current Studio layout.
  useBoardStore.getState().resetToDefaults()
  const HOMEROOM = 'homeroom'
  const hrWs = useBoardStore.getState().classWorkspaces[HOMEROOM]!
  const hrPageId = hrWs.pages[0].id
  const hrWidget = hrWs.pages[0].widgets[0]
  const hrWidgetId = hrWidget.id
  // Small in-bounds offset relative to the widget's own seeded position —
  // an absolute target could legitimately get clamped back on-canvas for a
  // wide/tall seeded widget, which would make this a false failure.
  const targetX = hrWidget.x + 12
  useBoardStore.getState().updatePageWidgetGeometry(HOMEROOM, hrPageId, hrWidgetId, { x: targetX, y: hrWidget.y })

  const oldBackup: FullBackupPacketPayload = {
    categories: {
      board: { mode: 'display', activeScreen: 'homeroom' }, // no classWorkspaces key
    },
    exportedCategories: ['board'],
  }

  const result = restoreBackupToStores({
    packet: oldBackup,
    selectedCategories: ['board'],
    replaceTimerRuntime: false,
    replaceActiveMystery: false,
  })
  assert('STUDIO-09: Old backup without classWorkspaces restores successfully', result.success === true)

  const widgetAfter = useBoardStore.getState().classWorkspaces[HOMEROOM]!.pages.find(p => p.id === hrPageId)!.widgets.find(w => w.id === hrWidgetId)!
  assertEq('STUDIO-10: Old backup without classWorkspaces does not wipe the existing Studio layout', widgetAfter.x, targetX)
})()

;(() => {
  // Malformed Studio layout data (non-finite coordinates, an unknown extra
  // widget) must be repaired rather than applied verbatim or crashing the
  // restore.
  useBoardStore.getState().resetToDefaults()
  const HOMEROOM = 'homeroom'
  const hrWs = useBoardStore.getState().classWorkspaces[HOMEROOM]!
  const hrPageId = hrWs.pages[0].id
  const hrWidgetId = hrWs.pages[0].widgets[0].id

  const malformedWorkspaces = structuredClone(useBoardStore.getState().classWorkspaces) as Record<string, unknown>
  const hrPage = (malformedWorkspaces[HOMEROOM] as { pages: { id: string; widgets: { id: string; x: number; y: number; width: number; height: number }[] }[] }).pages.find(p => p.id === hrPageId)!
  const widget = hrPage.widgets.find(w => w.id === hrWidgetId)!
  widget.x = Number.NaN
  widget.y = Number.POSITIVE_INFINITY
  widget.width = -5
  widget.height = 0

  const malformedBackup: FullBackupPacketPayload = {
    categories: {
      board: { mode: 'edit', activeScreen: 'homeroom', classWorkspaces: malformedWorkspaces },
    },
    exportedCategories: ['board'],
  }

  let threw = false
  let result
  try {
    result = restoreBackupToStores({
      packet: malformedBackup,
      selectedCategories: ['board'],
      replaceTimerRuntime: false,
      replaceActiveMystery: false,
    })
  } catch {
    threw = true
  }
  assert('STUDIO-11: Malformed Studio layout backup does not crash restore', !threw)
  assert('STUDIO-12: Malformed Studio layout backup restore reports success (repaired, not rejected)', result?.success === true)

  const repaired = useBoardStore.getState().classWorkspaces[HOMEROOM]!.pages.find(p => p.id === hrPageId)!.widgets.find(w => w.id === hrWidgetId)!
  assert('STUDIO-13: Malformed widget geometry repaired to finite values', Number.isFinite(repaired.x) && Number.isFinite(repaired.y) && Number.isFinite(repaired.width) && Number.isFinite(repaired.height))
  assert('STUDIO-14: Malformed widget geometry repaired to positive size', repaired.width > 0 && repaired.height > 0)
})()

// ── Report ───────────────────────────────────────────────────────────

console.log(`\n=== Local Packets Integration Tests ===`)
console.log(`Passed: ${passed}, Failed: ${failed}`)

if (failed > 0) {
  process.exit(1)
}
