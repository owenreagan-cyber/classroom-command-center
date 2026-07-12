import type { FairnessEntry, PickerClassId, Student } from './types'
import { shuffle } from './randomizerEngine'

export function getEligibleStudents(
  students: Student[],
  classId: PickerClassId,
  history: FairnessEntry[],
  excludeStudentIds: string[] = []
): Student[] {
  const classStudents = students.filter(
    (s) => s.isActive && !s.isAbsent && s.classes.includes(classId)
  )

  const classHistory = history.filter((h) => h.classId === classId)

  // Count opportunities
  const opportunities = new Map<string, number>()
  // Include earned, did-not-earn, and quick-picked. Exclude absent-replaced.
  for (const entry of classHistory) {
    if (entry.outcome !== 'absent-replaced') {
      opportunities.set(entry.studentId, (opportunities.get(entry.studentId) || 0) + 1)
    }
  }

  // Find min opportunities among eligible
  let minOpps = Infinity
  for (const s of classStudents) {
    if (excludeStudentIds.includes(s.id)) continue
    const opps = opportunities.get(s.id) || 0
    if (opps < minOpps) {
      minOpps = opps
    }
  }

  // If no one is eligible (e.g. all absent or excluded), return empty
  if (minOpps === Infinity) return []

  // Get all students with min opportunities
  const eligible = classStudents.filter((s) => {
    if (excludeStudentIds.includes(s.id)) return false
    const opps = opportunities.get(s.id) || 0
    return opps === minOpps
  })

  // If we only have 1 or 2 eligible students, we might be at a cycle boundary.
  // We return them. The caller can pick from them.
  return eligible
}

export function pickRandomEligible(
  students: Student[],
  classId: PickerClassId,
  history: FairnessEntry[],
  count: number,
  excludeStudentIds: string[] = []
): Student[] {
  const picked: Student[] = []
  const currentExcluded = [...excludeStudentIds]

  while (picked.length < count) {
    const eligible = getEligibleStudents(students, classId, history, currentExcluded)
    if (eligible.length === 0) break // No more students available

    const shuffled = shuffle(eligible)
    const needed = count - picked.length
    const selected = shuffled.slice(0, needed)

    picked.push(...selected)
    currentExcluded.push(...selected.map((s) => s.id))
  }

  return picked
}
