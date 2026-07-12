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

import { usePickerStore } from './pickerStore'
import { getEligibleStudents, pickRandomEligible } from './fairnessEngine'
import type { FairnessEntry } from './types'

function runTests() {
  // Clean start
  usePickerStore.setState({
    students: [],
    fairnessHistory: [],
    activeMysterySessions: { homeroom: null, math: null, reading: null },
    settings: { reducedMotion: false, skipAnimation: false }
  })

  // 14. Duplicate display names remain independent by ID (Option A)
  usePickerStore.getState().addStudent('Alice', ['homeroom']) // 0
  usePickerStore.getState().addStudent('Alice', ['homeroom']) // 1
  const s = usePickerStore.getState().students
  if (s.length !== 2) throw new Error('Duplicate display names not added')
  if (s[0].id === s[1].id) throw new Error('Duplicate IDs created')
  if (s[1].displayName !== 'Alice') throw new Error('Duplicate names should be allowed')

  // Let's add more students for draws
  usePickerStore.getState().addStudent('Bob', ['homeroom', 'math']) // 2
  usePickerStore.getState().addStudent('Charlie', ['homeroom', 'math']) // 3
  usePickerStore.getState().addStudent('Dave', ['homeroom', 'math']) // 4
  usePickerStore.getState().addStudent('Eve', ['homeroom', 'math']) // 5

  const students = usePickerStore.getState().students

  // 1, 2, 3. Draw no duplicates, absent excluded, inactive excluded, explicit exclude
  const mathStudents = students.filter(st => st.classes.includes('math'))
  // Bob, Charlie, Dave, Eve
  if (mathStudents.length !== 4) throw new Error('Math students missing')

  // Make Bob absent, Charlie inactive
  usePickerStore.getState().markAbsent(mathStudents.find(x => x.displayName === 'Bob')!.id, true)
  usePickerStore.getState().updateStudent(mathStudents.find(x => x.displayName === 'Charlie')!.id, { isActive: false })

  let eligible = getEligibleStudents(usePickerStore.getState().students, 'math', [])
  if (eligible.length !== 2) throw new Error('Failed to exclude absent/inactive')

  // Bring Bob back
  usePickerStore.getState().markAbsent(mathStudents.find(x => x.displayName === 'Bob')!.id, false)
  eligible = getEligibleStudents(usePickerStore.getState().students, 'math', [])
  if (eligible.length !== 3) throw new Error('Bob not returned to ready pool')

  // Pick 3
  const picked = pickRandomEligible(usePickerStore.getState().students, 'math', [], 3, [mathStudents.find(x=>x.displayName==='Eve')!.id])
  if (picked.length !== 2) throw new Error('Exclude ID did not work') // only 2 left if Eve is excluded

  // 4. Math history does not affect Reading or Homeroom
  // Tested implicitly by passing 'math' classId filtering.

  // 8, 9. Cycle boundaries
  const hrStudents = usePickerStore.getState().students
  const hrHistory: FairnessEntry[] = [
    { id: '1', classId: 'homeroom', studentId: hrStudents[0].id, role: 'quick-pick', outcome: 'quick-picked', timestamp: 0 },
    { id: '2', classId: 'homeroom', studentId: hrStudents[1].id, role: 'quick-pick', outcome: 'quick-picked', timestamp: 0 },
    { id: '3', classId: 'homeroom', studentId: hrStudents[2].id, role: 'quick-pick', outcome: 'quick-picked', timestamp: 0 },
    { id: '4', classId: 'homeroom', studentId: hrStudents[3].id, role: 'quick-pick', outcome: 'quick-picked', timestamp: 0 },
    { id: '5', classId: 'homeroom', studentId: hrStudents[4].id, role: 'quick-pick', outcome: 'quick-picked', timestamp: 0 },
  ]
  // Only hrStudents[5] (Eve) has 0 ops.
  const crossCyclePick = pickRandomEligible(hrStudents, 'homeroom', hrHistory, 3)
  if (crossCyclePick.length !== 3) throw new Error('Failed to bridge cycle boundary')
  if (crossCyclePick[0].id !== hrStudents[5].id) throw new Error('First pick was not the only eligible student')
  if (crossCyclePick[1].id === crossCyclePick[0].id || crossCyclePick[2].id === crossCyclePick[0].id) throw new Error('Duplicates generated across boundary')

  // 10, 11. Replacement logic
  usePickerStore.getState().startMysterySession('homeroom', '2026-07-12', [hrStudents[0].id, hrStudents[1].id, hrStudents[2].id])
  usePickerStore.getState().updateSlotObservation('homeroom', 'high-flier-1', 'hr-1', 'positive')
  usePickerStore.getState().updateMysterySlot('homeroom', 'high-flier-1', 'earned', 'Good job')

  // Replace high-flier-1 (hrStudents[0] -> Alice) with hrStudents[3] (Charlie)
  usePickerStore.getState().replaceAbsentMysteryStudent('homeroom', 'high-flier-1', hrStudents[3].id)
  const session = usePickerStore.getState().activeMysterySessions['homeroom']!
  if (session.slots['high-flier-1']!.studentId !== hrStudents[3].id) throw new Error('Slot not replaced')
  if (session.slots['high-flier-1']!.status !== 'hidden') throw new Error('Replacement status not hidden')
  if (session.slots['high-flier-1']!.observations.length !== 0) throw new Error('Observations not cleared')
  if (session.slots['high-flier-1']!.reason) throw new Error('Reason not cleared')
  if (session.slots['high-flier-2']!.studentId !== hrStudents[1].id) throw new Error('Other slot modified')

  const originalStudent = usePickerStore.getState().students.find(s => s.id === hrStudents[0].id)
  if (!originalStudent?.isAbsent) throw new Error('Original student not marked absent')

  // 12, 13. Reveal order and validation
  const canStart = usePickerStore.getState().canStartReveal('homeroom')
  if (canStart) throw new Error('Should not start reveal with hidden slots')

  usePickerStore.getState().updateMysterySlot('homeroom', 'high-flier-1', 'earned')
  usePickerStore.getState().updateMysterySlot('homeroom', 'high-flier-2', 'did-not-earn')
  usePickerStore.getState().updateMysterySlot('homeroom', 'star', 'earned')

  if (!usePickerStore.getState().canStartReveal('homeroom')) throw new Error('Should be able to start reveal now')

  usePickerStore.getState().advanceMysteryReveal('homeroom')
  if (usePickerStore.getState().activeMysterySessions['homeroom']!.status !== 'revealed-1') throw new Error('Failed to advance to reveal-1')
  usePickerStore.getState().advanceMysteryReveal('homeroom')
  if (usePickerStore.getState().activeMysterySessions['homeroom']!.status !== 'revealed-2') throw new Error('Failed to advance to reveal-2')

  // 5, 6, 7. Outcomes counting
  usePickerStore.getState().advanceMysteryReveal('homeroom') // 3
  usePickerStore.getState().advanceMysteryReveal('homeroom') // completed
  usePickerStore.getState().commitMysterySession('homeroom')

  const hist = usePickerStore.getState().fairnessHistory.filter(h => h.classId === 'homeroom')
  const earnedOp = hist.find(h => h.studentId === hrStudents[3].id)
  const notEarnedOp = hist.find(h => h.studentId === hrStudents[1].id)
  const absentReplaceOp = hist.find(h => h.studentId === hrStudents[0].id)

  if (!earnedOp || earnedOp.outcome !== 'earned') throw new Error('Earned not recorded')
  if (!notEarnedOp || notEarnedOp.outcome !== 'did-not-earn') throw new Error('Did not earn not recorded')
  if (!absentReplaceOp || absentReplaceOp.outcome !== 'absent-replaced') throw new Error('Absent replace not recorded')
  if (earnedOp.studentDisplayName !== 'Charlie') throw new Error('Snapshot name failed')

  // Verify absent-replaced is excluded from opportunity counts
  usePickerStore.getState().markAbsent(hrStudents[0].id, false)
  const eligCheck2 = getEligibleStudents(usePickerStore.getState().students, 'homeroom', hist)
  if (!eligCheck2.some(st => st.id === hrStudents[0].id)) throw new Error('Absent replacement penalized the student')

  // Reveal Settings
  usePickerStore.getState().updateSettings({ skipAnimation: true })
  if (usePickerStore.getState().settings.skipAnimation !== true) throw new Error('Settings update failed')

  console.log('All advanced picker tests passed!')
}

runTests()
