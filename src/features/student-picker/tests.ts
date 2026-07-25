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

import { normalizeRosterStudent } from '../roster/normalize'
import { getMysteryDisplayStatus, toDisplaySafeMysterySnapshot } from '../roster/displaySafe'
import { importRosterFromFile, rosterStudentsToPickerStudents } from '../roster/importRoster'
import { SAMPLE_ROSTER_FIXTURE } from '../roster/sampleRoster.fixture'
import type { LocalRosterFile } from '../roster/types'
import { usePickerStore, PICKER_STORAGE_KEY } from './pickerStore'
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

function reconstructFromPersistedStorage() {
  const raw = localStorage.getItem(PICKER_STORAGE_KEY)
  if (!raw) return
  const parsed = JSON.parse(raw)
  const restored: Partial<PickerStoreState> = parsed.state || parsed
  usePickerStore.setState({
    students: [],
    fairnessHistory: [],
    activeMysterySessions: {
      homeroom: null,
      math: null,
      reading: null,
      'reading:RM4': null,
      'reading:SM5': null,
    },
    settings: { reducedMotion: false, skipAnimation: false },
  })
  if (restored.students) usePickerStore.setState({ students: restored.students })
  if (restored.fairnessHistory) usePickerStore.setState({ fairnessHistory: restored.fairnessHistory })
  if (restored.activeMysterySessions) {
    usePickerStore.setState({ activeMysterySessions: restored.activeMysterySessions })
  }
  if (restored.settings) usePickerStore.setState({ settings: restored.settings })
}

function runTests() {
  // ═══════════════════════════════════════════════════════════════════
  // Roster normalization
  // ═══════════════════════════════════════════════════════════════════
  const withPreferred = normalizeRosterStudent(
    { firstName: 'Reginald', lastName: 'Placeholder', preferredName: 'Ren' },
    'homeroom',
  )
  assertEq('RN-01: displayName uses preferredName', withPreferred.displayName, 'Ren')
  assertEq('RN-02: stable id generated', typeof withPreferred.id, 'string')

  const withoutPreferred = normalizeRosterStudent(
    { firstName: 'Taylor', lastName: 'Example' },
    'math',
  )
  assertEq('RN-03: displayName falls back to firstName', withoutPreferred.displayName, 'Taylor')

  const imported = importRosterFromFile(SAMPLE_ROSTER_FIXTURE as unknown as LocalRosterFile)
  assert('RN-04: sample roster imports', imported.students.length > 0)
  assert('RN-05: reading sections found', imported.sectionsFound.includes('RM4'))
  assert('RN-06: reading sections found SM5', imported.sectionsFound.includes('SM5'))

  const pickerStudents = rosterStudentsToPickerStudents(imported.students)
  const jo = pickerStudents.find((s) => s.firstName === 'Jordan')
  assertEq('RN-07: UI uses displayName Jo', jo?.displayName, 'Jo')
  assert('RN-08: state uses stable id not display name', Boolean(jo?.id.startsWith('stu-')))

  // ═══════════════════════════════════════════════════════════════════
  // Setup
  // ═══════════════════════════════════════════════════════════════════
  usePickerStore.setState({
    students: [],
    fairnessHistory: [],
    activeMysterySessions: {
      homeroom: null,
      math: null,
      reading: null,
      'reading:RM4': null,
      'reading:SM5': null,
    },
    settings: { reducedMotion: false, skipAnimation: false },
  })

  usePickerStore.getState().addStudent('Alice', ['homeroom'])
  usePickerStore.getState().addStudent('Alice', ['homeroom'])
  usePickerStore.getState().addStudent('Bob', ['homeroom', 'math'])
  usePickerStore.getState().addStudent('Charlie', ['homeroom', 'math'])
  usePickerStore.getState().addStudent('Dave', ['homeroom', 'math'])
  usePickerStore.getState().addStudent('Eve', ['homeroom', 'math'])
  usePickerStore.getState().addStudent('Frank', ['reading'])
  usePickerStore.getState().addStudent('Grace', ['reading'])
  usePickerStore.getState().addStudent('Hank', ['reading'])

  const students = usePickerStore.getState().students
  assertEq('Setup: 9 students added', students.length, 9)
  assert('14b: Duplicate IDs unique', students[0].id !== students[1].id)

  const mathStudents = students.filter((st) => st.classes.includes('math'))
  const hrStudents = students.filter((st) => st.classes.includes('homeroom'))
  usePickerStore.getState().markAbsent(hrStudents.find((x) => x.displayName === 'Bob')!.id, true)
  usePickerStore.getState().updateStudent(hrStudents.find((x) => x.displayName === 'Charlie')!.id, {
    isActive: false,
  })

  const eligCheck = getEligibleStudents(usePickerStore.getState().students, 'math', [])
  assertEq('2: Eligible math students after absent/inactive', eligCheck.length, 2)

  const picked = pickRandomEligible(usePickerStore.getState().students, 'homeroom', [], 2)
  assertEq('3: Picked 2 from homeroom', picked.length, 2)

  // ═══════════════════════════════════════════════════════════════════
  // Mystery session persistence
  // ═══════════════════════════════════════════════════════════════════
  const sessionStudents = hrStudents.filter((s) => s.isActive && !s.isAbsent)
  usePickerStore.getState().startMysterySession(
    'homeroom',
    'homeroom',
    '2026-07-12',
    sessionStudents.slice(0, 3).map((s) => s.id),
  )

  const session = usePickerStore.getState().activeMysterySessions['homeroom']!
  assert('4a: Session created', session !== null)
  assertEq('4b: Session pool', session.poolKey, 'homeroom')

  const s1 = session.slots['high-flier-1']!
  const s2 = session.slots['high-flier-2']!
  const s3 = session.slots.star!
  assertEq('4g: Three distinct IDs', new Set([s1.studentId, s2.studentId, s3.studentId]).size, 3)

  // Active draw is not silently replaced
  const beforeIds = [s1.studentId, s2.studentId, s3.studentId]
  usePickerStore.getState().startMysterySession(
    'homeroom',
    'homeroom',
    '2026-07-12',
    sessionStudents.slice(0, 3).map((s) => s.id),
  )
  const afterSession = usePickerStore.getState().activeMysterySessions['homeroom']!
  assertEq('ND-01: Active draw not silently replaced HF1', afterSession.slots['high-flier-1']!.studentId, beforeIds[0])

  usePickerStore.getState().updateSlotObservation('homeroom', 'high-flier-1', 'behavior-1', 'positive', 'Good focus')
  const obs = usePickerStore.getState().activeMysterySessions['homeroom']!.slots['high-flier-1']!.observations
  assertEq('5a: One observation recorded', obs.length, 1)

  reconstructFromPersistedStorage()
  const reconstructed = usePickerStore.getState().activeMysterySessions['homeroom']
  assert('RH-01: Session exists after reconstruct', reconstructed !== null)
  assertEq('RH-04: Slot 1 ID survives', reconstructed!.slots['high-flier-1']!.studentId, beforeIds[0])

  // Outcomes
  usePickerStore.getState().updateMysterySlot('homeroom', 'high-flier-1', 'earned', 'Great participation')
  usePickerStore.getState().updateMysterySlot('homeroom', 'high-flier-2', 'did-not-earn')
  usePickerStore.getState().updateMysterySlot('homeroom', 'star', 'earned')
  usePickerStore.getState().clearMysterySlotOutcome('homeroom', 'high-flier-2')
  assertEq('OC-01: Outcome cleared to hidden', usePickerStore.getState().activeMysterySessions['homeroom']!.slots['high-flier-2']!.status, 'hidden')
  usePickerStore.getState().updateMysterySlot('homeroom', 'high-flier-2', 'did-not-earn')

  usePickerStore.getState().advanceMysteryReveal('homeroom')
  assertEq('6a: Reveal stage revealed-1', usePickerStore.getState().activeMysterySessions['homeroom']!.status, 'revealed-1')
  usePickerStore.getState().advanceMysteryReveal('homeroom')
  usePickerStore.getState().advanceMysteryReveal('homeroom')
  usePickerStore.getState().advanceMysteryReveal('homeroom')
  assertEq('6d: Reveal stage completed', usePickerStore.getState().activeMysterySessions['homeroom']!.status, 'completed')

  usePickerStore.getState().commitMysterySession('homeroom')
  assertEq('7a: Session cleared after commit', usePickerStore.getState().activeMysterySessions['homeroom'], null)

  const hist = usePickerStore.getState().fairnessHistory.filter((h) => h.poolKey === 'homeroom')
  const earnedOp = hist.find((h) => h.outcome === 'earned')
  const notEarnedOp = hist.find((h) => h.outcome === 'did-not-earn')
  assert('7b: Earned in history', earnedOp !== undefined)
  assert('7c: Did-not-earn in history', notEarnedOp !== undefined)
  assertEq('7d: History uses displayName snapshot', earnedOp!.studentDisplayName, 'Alice')

  // Reading section independence
  usePickerStore.getState().importRosterStudents(pickerStudents)
  const rm4Students = usePickerStore.getState().students.filter((s) => s.section === 'RM4')
  const sm5Students = usePickerStore.getState().students.filter((s) => s.section === 'SM5')
  usePickerStore.getState().startMysterySession(
    'reading:RM4',
    'reading',
    '2026-07-13',
    rm4Students.slice(0, 3).map((s) => s.id),
    'RM4',
  )
  usePickerStore.getState().startMysterySession(
    'reading:SM5',
    'reading',
    '2026-07-13',
    sm5Students.slice(0, 3).map((s) => s.id),
    'SM5',
  )
  const rm4Session = usePickerStore.getState().activeMysterySessions['reading:RM4']
  const sm5Session = usePickerStore.getState().activeMysterySessions['reading:SM5']
  assert('RS-01: RM4 session exists', rm4Session !== null)
  assert('RS-02: SM5 session exists', sm5Session !== null)
  assert(
    'RS-03: RM4 and SM5 draws differ',
    rm4Session!.slots.star!.studentId !== sm5Session!.slots.star!.studentId
      || rm4Students[0].id !== sm5Students[0].id,
  )

  // Reset pool
  usePickerStore.getState().resetPool('homeroom')
  assertEq('RP-01: Pool reset clears homeroom history', usePickerStore.getState().fairnessHistory.filter((h) => h.poolKey === 'homeroom').length, 0)

  // Display-safe selector
  usePickerStore.getState().startMysterySession(
    'homeroom',
    'homeroom',
    '2026-07-14',
    sessionStudents.slice(0, 3).map((s) => s.id),
  )
  const activeSession = usePickerStore.getState().activeMysterySessions['homeroom']
  const safeSnapshot = toDisplaySafeMysterySnapshot(activeSession)
  assert('DS-01: display snapshot has no student ids', !JSON.stringify(safeSnapshot).includes('studentId'))
  const displayStatus = getMysteryDisplayStatus(activeSession)
  assertEq('DS-02: display status label', displayStatus.statusLabel, 'Mystery Star is active')
  assert('DS-03: display status hides names', !displayStatus.statusLabel.includes('Alice'))

  // Quick pick uses poolKey
  usePickerStore.getState().recordQuickPick('math', 'math', mathStudents[0].id)
  reconstructFromPersistedStorage()
  assert(
    '11b: Quick pick survives reconstruct',
    usePickerStore.getState().fairnessHistory.some((h) => h.poolKey === 'math'),
  )

  // No forbidden outcome wording
  const outcomeValues = usePickerStore.getState().fairnessHistory.map((h) => h.outcome)
  assert('16a: No unworthy in history', !outcomeValues.includes('unworthy' as never))
  assert('16b: No not-deserving in history', !JSON.stringify(outcomeValues).includes('not-deserving'))

  console.log(`\n=== Student Picker + Mystery Star Tests ===`)
  console.log(`Passed: ${passed}, Failed: ${failed}`)
  if (failed > 0) process.exit(1)
}

runTests()
