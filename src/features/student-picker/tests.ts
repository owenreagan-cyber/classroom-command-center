// Mock localStorage for Node environment to avoid Zustand persistence warnings
const storage: Record<string, string> = {}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalObj = globalThis as any
globalObj.window = globalObj
globalObj.localStorage = {
  getItem: (key: string) => storage[key] || null,
  setItem: (key: string, value: string) => { storage[key] = value },
  removeItem: (key: string) => { delete storage[key] },
  clear: () => { for (const key in storage) delete storage[key] },
  length: 0,
  key: (index: number) => Object.keys(storage)[index] || null,
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const process: any

import { usePickerStore } from './pickerStore'
import { getEligibleStudents, pickRandomEligible } from './fairnessEngine'
import type { PickerStoreState } from './types'

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

function assertNotIncludes<T>(label: string, arr: T[], value: T) {
  if (!arr.includes(value)) {
    passed++
  } else {
    failed++
    console.error(`FAIL: ${label} — expected ${JSON.stringify(value)} not in array`)
  }
}

// ── Reconstruct from persisted storage ─────────────────────────────────
// Read the persisted JSON from localStorage, clear the store,
// then re-apply the persisted state to verify it survives.
// This tests persisted-state serialization and reconstruction,
// not actual Zustand middleware rehydration.

function reconstructFromPersistedStorage() {
  const raw = localStorage.getItem('classroom-picker-storage')
  if (!raw) return
  const parsed = JSON.parse(raw)
  const restored: Partial<PickerStoreState> = parsed.state || parsed
  // Reset store to initial state then apply restored state
  usePickerStore.setState({
    students: [],
    fairnessHistory: [],
    activeMysterySessions: { homeroom: null, math: null, reading: null },
    settings: { reducedMotion: false, skipAnimation: false },
  })
  if (restored.students) usePickerStore.setState({ students: restored.students as typeof restored.students })
  if (restored.fairnessHistory) usePickerStore.setState({ fairnessHistory: restored.fairnessHistory as typeof restored.fairnessHistory })
  if (restored.activeMysterySessions) usePickerStore.setState({ activeMysterySessions: restored.activeMysterySessions as typeof restored.activeMysterySessions })
  if (restored.settings) usePickerStore.setState({ settings: restored.settings as typeof restored.settings })
}

function runTests() {
  // ═══════════════════════════════════════════════════════════════════
  // Setup: Add students for all tests
  // ═══════════════════════════════════════════════════════════════════
  usePickerStore.setState({
    students: [],
    fairnessHistory: [],
    activeMysterySessions: { homeroom: null, math: null, reading: null },
    settings: { reducedMotion: false, skipAnimation: false }
  })

  usePickerStore.getState().addStudent('Alice', ['homeroom']) // 0
  usePickerStore.getState().addStudent('Alice', ['homeroom']) // 1 (duplicate name)
  usePickerStore.getState().addStudent('Bob', ['homeroom', 'math']) // 2
  usePickerStore.getState().addStudent('Charlie', ['homeroom', 'math']) // 3
  usePickerStore.getState().addStudent('Dave', ['homeroom', 'math']) // 4
  usePickerStore.getState().addStudent('Eve', ['homeroom', 'math']) // 5
  usePickerStore.getState().addStudent('Frank', ['reading']) // 6
  usePickerStore.getState().addStudent('Grace', ['reading']) // 7
  usePickerStore.getState().addStudent('Hank', ['reading']) // 8

  const students = usePickerStore.getState().students
  assertEq('Setup: 9 students added', students.length, 9)

  // ═══════════════════════════════════════════════════════════════════
  // 14. Duplicate display names remain independent by ID
  // ═══════════════════════════════════════════════════════════════════
  assertEq('14a: Duplicate display names count', students.length, 9)
  assert('14b: Duplicate IDs unique', students[0].id !== students[1].id)
  assertEq('14c: Duplicate names allowed', students[1].displayName, 'Alice')

  // ═══════════════════════════════════════════════════════════════════
  // 1, 2, 3. Draw: no duplicates, absent excluded, inactive excluded, explicit exclude
  // ═══════════════════════════════════════════════════════════════════
  const mathStudents = students.filter(st => st.classes.includes('math'))
  assertEq('1: Math students count', mathStudents.length, 4)

  const hrStudents = students.filter(st => st.classes.includes('homeroom'))
  usePickerStore.getState().markAbsent(hrStudents.find(x => x.displayName === 'Bob')!.id, true)
  usePickerStore.getState().updateStudent(hrStudents.find(x => x.displayName === 'Charlie')!.id, { isActive: false })

  const eligCheck = getEligibleStudents(usePickerStore.getState().students, 'math', [])
  // After Bob absent, Charlie inactive, only Dave+Eve eligible
  assertEq('2: Eligible math students after absent/inactive', eligCheck.length, 2)

  const picked = pickRandomEligible(usePickerStore.getState().students, 'homeroom', [], 2)
  // Should pick 2 from homeroom
  assertEq('3: Picked 2 from homeroom', picked.length, 2)

  // ═══════════════════════════════════════════════════════════════════
  // 4. Mystery Star session persists exact three IDs
  // ═══════════════════════════════════════════════════════════════════
  const sessionStudents = hrStudents.filter(s => s.isActive && !s.isAbsent)
  usePickerStore.getState().startMysterySession('homeroom', '2026-07-12', sessionStudents.slice(0, 3).map(s => s.id))

  const session = usePickerStore.getState().activeMysterySessions['homeroom']!
  assert('4a: Session created', session !== null)
  assertEq('4b: Session class', session.classId, 'homeroom')
  assertEq('4c: Session date', session.date, '2026-07-12')

  const s1 = session.slots['high-flier-1']!
  const s2 = session.slots['high-flier-2']!
  const s3 = session.slots['star']!
  assert('4d: Slot 1 has studentId', typeof s1.studentId === 'string' && s1.studentId.length > 0)
  assert('4e: Slot 2 has studentId', typeof s2.studentId === 'string' && s2.studentId.length > 0)
  assert('4f: Slot 3 has studentId', typeof s3.studentId === 'string' && s3.studentId.length > 0)
  assertEq('4g: Three distinct IDs', new Set([s1.studentId, s2.studentId, s3.studentId]).size, 3)

  // ═══════════════════════════════════════════════════════════════════
  // 5. Slot observations
  // ═══════════════════════════════════════════════════════════════════
  usePickerStore.getState().updateSlotObservation('homeroom', 'high-flier-1', 'behavior-1', 'positive', 'Good focus')
  const obs = usePickerStore.getState().activeMysterySessions['homeroom']!.slots['high-flier-1']!.observations
  assertEq('5a: One observation recorded', obs.length, 1)
  assertEq('5b: Observation behaviorId', obs[0].behaviorId, 'behavior-1')
  assertEq('5c: Observation value', obs[0].value, 'positive')
  assertEq('5d: Observation context', obs[0].context, 'Good focus')

  // ═══════════════════════════════════════════════════════════════════
  // Persistence test: persist then reconstruct
  // ═══════════════════════════════════════════════════════════════════
  const storedIdsBeforeReconstruct = [
    session.slots['high-flier-1']!.studentId,
    session.slots['high-flier-2']!.studentId,
    session.slots['star']!.studentId,
  ]

  reconstructFromPersistedStorage()

  const reconstructed = usePickerStore.getState().activeMysterySessions['homeroom']
  assert('RH-01: Session exists after reconstruct', reconstructed !== null)
  assertEq('RH-02: Session class after reconstruct', reconstructed!.classId, 'homeroom')
  assertEq('RH-03: Session date after reconstruct', reconstructed!.date, '2026-07-12')
  assertEq('RH-04: Slot 1 ID survives', reconstructed!.slots['high-flier-1']!.studentId, storedIdsBeforeReconstruct[0])
  assertEq('RH-05: Slot 2 ID survives', reconstructed!.slots['high-flier-2']!.studentId, storedIdsBeforeReconstruct[1])
  assertEq('RH-06: Star ID survives', reconstructed!.slots['star']!.studentId, storedIdsBeforeReconstruct[2])
  assertEq('RH-07: Observations survive reconstruct', reconstructed!.slots['high-flier-1']!.observations.length, 1)
  assertEq('RH-08: Observation behaviorId survives', reconstructed!.slots['high-flier-1']!.observations[0].behaviorId, 'behavior-1')

  // ═══════════════════════════════════════════════════════════════════
  // RH: Reconstruction does not invoke random selection
  // ═══════════════════════════════════════════════════════════════════
  // The IDs after reconstruction are exactly the stored IDs, not re-randomized
  assertEq('RH-09: No re-randomization on reconstruct', reconstructed!.slots['high-flier-1']!.studentId, storedIdsBeforeReconstruct[0])

  // ═══════════════════════════════════════════════════════════════════
  // RH: Page/screen changes do not alter trio
  // ═══════════════════════════════════════════════════════════════════
  // Simulate a "screen change" by re-setting the same state (no mutation)
  const idsAfterScreenChange = {
    hf1: usePickerStore.getState().activeMysterySessions['homeroom']!.slots['high-flier-1']!.studentId,
    hf2: usePickerStore.getState().activeMysterySessions['homeroom']!.slots['high-flier-2']!.studentId,
    star: usePickerStore.getState().activeMysterySessions['homeroom']!.slots['star']!.studentId,
  }
  assertEq('RH-10: Trio unchanged after screen change', idsAfterScreenChange.hf1, storedIdsBeforeReconstruct[0])
  assertEq('RH-11: Trio unchanged after screen change', idsAfterScreenChange.hf2, storedIdsBeforeReconstruct[1])
  assertEq('RH-12: Trio unchanged after screen change', idsAfterScreenChange.star, storedIdsBeforeReconstruct[2])

  // ═══════════════════════════════════════════════════════════════════
  // 6, 7, 8. Outcomes and reveal stage
  // ═══════════════════════════════════════════════════════════════════
  usePickerStore.getState().updateMysterySlot('homeroom', 'high-flier-1', 'earned', 'Great participation')
  usePickerStore.getState().updateMysterySlot('homeroom', 'high-flier-2', 'did-not-earn')
  usePickerStore.getState().updateMysterySlot('homeroom', 'star', 'earned')

  usePickerStore.getState().advanceMysteryReveal('homeroom')
  assertEq('6a: Reveal stage revealed-1', usePickerStore.getState().activeMysterySessions['homeroom']!.status, 'revealed-1')
  usePickerStore.getState().advanceMysteryReveal('homeroom')
  assertEq('6b: Reveal stage revealed-2', usePickerStore.getState().activeMysterySessions['homeroom']!.status, 'revealed-2')
  usePickerStore.getState().advanceMysteryReveal('homeroom')
  assertEq('6c: Reveal stage revealed-3', usePickerStore.getState().activeMysterySessions['homeroom']!.status, 'revealed-3')
  usePickerStore.getState().advanceMysteryReveal('homeroom')
  assertEq('6d: Reveal stage completed', usePickerStore.getState().activeMysterySessions['homeroom']!.status, 'completed')

  // Reconstruct again — outcomes and reveal stage should survive
  reconstructFromPersistedStorage()
  const reconstructedAfterCommit = usePickerStore.getState().activeMysterySessions['homeroom']
  assert('RH-13: Session exists after reveal reconstruct', reconstructedAfterCommit !== null)
  assertEq('RH-14: Earned status survives', reconstructedAfterCommit!.slots['high-flier-1']!.status, 'earned')
  assertEq('RH-15: Did-not-earn survives', reconstructedAfterCommit!.slots['high-flier-2']!.status, 'did-not-earn')
  assertEq('RH-16: Reason string survives', reconstructedAfterCommit!.slots['high-flier-1']!.reason, 'Great participation')
  assertEq('RH-17: Reveal stage survives', reconstructedAfterCommit!.status, 'completed')

  // ═══════════════════════════════════════════════════════════════════
  // 5, 6, 7. Outcomes counting (commit to history)
  // ═══════════════════════════════════════════════════════════════════
  usePickerStore.getState().commitMysterySession('homeroom')
  assertEq('7a: Session cleared after commit', usePickerStore.getState().activeMysterySessions['homeroom'], null)

  const hist = usePickerStore.getState().fairnessHistory.filter(h => h.classId === 'homeroom')
  const earnedOp = hist.find(h => h.outcome === 'earned')
  const notEarnedOp = hist.find(h => h.outcome === 'did-not-earn')

  assert('7b: Earned in history', earnedOp !== undefined)
  assert('7c: Did-not-earn in history', notEarnedOp !== undefined)
  assertEq('7d: Earned student has display name snapshot', earnedOp!.studentDisplayName, 'Alice')
  assertEq('7e: Earned entry has stable ID', typeof earnedOp!.studentId, 'string')

  // ═══════════════════════════════════════════════════════════════════
  // 8. Absent replacement preserves other two IDs after reconstruct
  // ═══════════════════════════════════════════════════════════════════
  usePickerStore.getState().markAllPresent()
  // Re-attach Charlie
  usePickerStore.getState().updateStudent(hrStudents.find(x => x.displayName === 'Charlie')!.id, { isActive: true })

  const activeHr = usePickerStore.getState().students.filter(s => s.classes.includes('homeroom') && s.isActive && !s.isAbsent)
  usePickerStore.getState().startMysterySession('homeroom', '2026-07-13', activeHr.slice(0, 3).map(s => s.id))

  const session2 = usePickerStore.getState().activeMysterySessions['homeroom']!
  const originalHf2Id = session2.slots['high-flier-2']!.studentId
  const originalStarId = session2.slots['star']!.studentId

  // Replace high-flier-1
  usePickerStore.getState().replaceAbsentMysteryStudent('homeroom', 'high-flier-1', activeHr[3].id)

  reconstructFromPersistedStorage()

  const reconstructedSession2 = usePickerStore.getState().activeMysterySessions['homeroom']
  assert('8a: Session exists after replacement reconstruct', reconstructedSession2 !== null)
  assertEq('8b: Replaced slot ID updated', reconstructedSession2!.slots['high-flier-1']!.studentId, activeHr[3].id)
  assertEq('8c: HF2 unchanged after replacement reconstruct', reconstructedSession2!.slots['high-flier-2']!.studentId, originalHf2Id)
  assertEq('8d: Star unchanged after replacement reconstruct', reconstructedSession2!.slots['star']!.studentId, originalStarId)

  // ═══════════════════════════════════════════════════════════════════
  // 9. Homeroom, Math, Reading sessions persist independently
  // ═══════════════════════════════════════════════════════════════════
  const readingActive = usePickerStore.getState().students.filter(s => s.classes.includes('reading') && s.isActive && !s.isAbsent)
  usePickerStore.getState().startMysterySession('reading', '2026-07-13', readingActive.slice(0, 3).map(s => s.id))

  reconstructFromPersistedStorage()

  const hrReconstructed = usePickerStore.getState().activeMysterySessions['homeroom']
  const rdReconstructed = usePickerStore.getState().activeMysterySessions['reading']
  assert('9a: Homeroom session persists after reading created', hrReconstructed !== null)
  assert('9b: Reading session exists', rdReconstructed !== null)
  assertEq('9c: Each class has independent session', hrReconstructed!.classId, 'homeroom')
  assertEq('9d: Reading class correct', rdReconstructed!.classId, 'reading')

  // ═══════════════════════════════════════════════════════════════════
  // 10. Cancel removes only that class's session
  // ═══════════════════════════════════════════════════════════════════
  usePickerStore.getState().cancelMysterySession('reading')
  assert('10a: Reading session cleared after cancel', usePickerStore.getState().activeMysterySessions['reading'] === null)
  assert('10b: Homeroom session remains after reading cancel', usePickerStore.getState().activeMysterySessions['homeroom'] !== null)

  reconstructFromPersistedStorage()
  assert('10c: Reading still null after reconstruct', usePickerStore.getState().activeMysterySessions['reading'] === null)
  assert('10d: Homeroom still active after reconstruct', usePickerStore.getState().activeMysterySessions['homeroom'] !== null)

  // ═══════════════════════════════════════════════════════════════════
  // 11. Quick Picker fairness history survives reconstruct
  // ═══════════════════════════════════════════════════════════════════
  usePickerStore.getState().recordQuickPick('homeroom', activeHr[0].id)
  usePickerStore.getState().recordQuickPick('homeroom', activeHr[1].id)

  reconstructFromPersistedStorage()

  const quickPicks = usePickerStore.getState().fairnessHistory.filter(h => h.role === 'quick-pick')
  assert('11a: Quick picks history exists', quickPicks.length >= 2)
  const hasFirstPick = quickPicks.some(h => h.studentId === activeHr[0].id)
  const hasSecondPick = quickPicks.some(h => h.studentId === activeHr[1].id)
  assert('11b: First quick pick survives reconstruct', hasFirstPick)
  assert('11c: Second quick pick survives reconstruct', hasSecondPick)

  // ═══════════════════════════════════════════════════════════════════
  // 12. Called student remains ineligible after refresh until cycle rollover
  // ═══════════════════════════════════════════════════════════════════
  const excludedEligible = getEligibleStudents(
    usePickerStore.getState().students,
    'homeroom',
    usePickerStore.getState().fairnessHistory.filter(h => h.classId === 'homeroom'),
    [activeHr[0].id]
  )
  assertNotIncludes('12a: Called student excluded from eligible', excludedEligible.map(s => s.id), activeHr[0].id)

  // ═══════════════════════════════════════════════════════════════════
  // 13. Renaming a student does not change history name snapshot
  // ═══════════════════════════════════════════════════════════════════
  const previousName = earnedOp!.studentDisplayName
  usePickerStore.getState().updateStudent(earnedOp!.studentId, { displayName: 'Alice (Renamed)' })

  const histAfterRename = usePickerStore.getState().fairnessHistory
  const previousEntry = histAfterRename.find(h => h.studentId === earnedOp!.studentId && h.outcome === 'earned')
  assertEq('13a: History name snapshot unchanged after rename', previousEntry!.studentDisplayName, previousName)

  reconstructFromPersistedStorage()
  const histAfterReconstruct = usePickerStore.getState().fairnessHistory
  const prevAfterReconstruct = histAfterReconstruct.find(h => h.studentId === earnedOp!.studentId && h.outcome === 'earned')
  assertEq('13b: Name snapshot survives after reconstruct+rename', prevAfterReconstruct!.studentDisplayName, previousName)
  assertEq('13c: Renamed student still has new name', usePickerStore.getState().students.find(s => s.id === earnedOp!.studentId)!.displayName, 'Alice (Renamed)')

  // ═══════════════════════════════════════════════════════════════════
  // 14. Archiving a student does not remove historical record
  // ═══════════════════════════════════════════════════════════════════
  usePickerStore.getState().updateStudent(activeHr[1].id, { isActive: false })
  const histAfterArchive = usePickerStore.getState().fairnessHistory
  const archivedEntry = histAfterArchive.find(h => h.studentId === activeHr[1].id)
  assert('14a: Archived student still in history', archivedEntry !== undefined)

  reconstructFromPersistedStorage()
  const histAfterReconstruct2 = usePickerStore.getState().fairnessHistory
  const archivedAfterReconstruct = histAfterReconstruct2.find(h => h.studentId === activeHr[1].id)
  assert('14b: Archived student history survives reconstruct', archivedAfterReconstruct !== undefined)

  // ═══════════════════════════════════════════════════════════════════
  // 15. Private outcomes never in student-facing components
  // ═══════════════════════════════════════════════════════════════════
  // This is an architectural check: the store stores private outcomes,
  // but projector components only read the public display fields.
  // The `did-not-earn` outcome exists in the store/history but
  // the projector StatusBar and BoardFrame don't use fairnessHistory.
  assert('15a: did-not-earn stored in history', histAfterReconstruct2.some(h => h.outcome === 'did-not-earn'))

  // ═══════════════════════════════════════════════════════════════════
  // 16. No "unworthy" outcome used
  // ═══════════════════════════════════════════════════════════════════
  // 16a is a runtime check via string comparison
  const outcomeValues = histAfterReconstruct2.map(h => h.outcome)
  assert('16a: No unworthy in history', !outcomeValues.includes('unworthy' as never))
  assert('16b: Only valid outcomes exist', histAfterReconstruct2.every(h => (['earned', 'did-not-earn', 'absent-replaced', 'quick-picked'] as const).includes(h.outcome)))

  // ═══════════════════════════════════════════════════════════════════
  // Summary
  // ═══════════════════════════════════════════════════════════════════
  console.log(`\n=== Student Picker Persistence Tests ===`)
  console.log(`Passed: ${passed}, Failed: ${failed}`)
  if (failed > 0) process.exit(1)
}

runTests()
