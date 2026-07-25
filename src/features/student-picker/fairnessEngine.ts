import type { FairnessEntry, PickerPoolKey, Student } from './types'
import { parsePoolKey } from '../roster/poolKey'
import { shuffle } from './randomizerEngine'

export function studentMatchesPool(student: Student, poolKey: PickerPoolKey): boolean {
  const { classGroup, section } = parsePoolKey(poolKey)
  if (!student.classes.includes(classGroup)) return false
  if (classGroup === 'reading' && section) {
    return student.section === section
  }
  return true
}

export function getEligibleStudents(
  students: Student[],
  poolKey: PickerPoolKey,
  history: FairnessEntry[],
  excludeStudentIds: string[] = [],
): Student[] {
  const classStudents = students.filter(
    (s) => s.isActive && !s.isAbsent && studentMatchesPool(s, poolKey),
  )

  const poolHistory = history.filter((h) => (h.poolKey ?? h.classId) === poolKey)

  const opportunities = new Map<string, number>()
  for (const entry of poolHistory) {
    if (entry.outcome !== 'absent-replaced') {
      opportunities.set(entry.studentId, (opportunities.get(entry.studentId) || 0) + 1)
    }
  }

  let minOpps = Infinity
  for (const s of classStudents) {
    if (excludeStudentIds.includes(s.id)) continue
    const opps = opportunities.get(s.id) || 0
    if (opps < minOpps) {
      minOpps = opps
    }
  }

  if (minOpps === Infinity) return []

  return classStudents.filter((s) => {
    if (excludeStudentIds.includes(s.id)) return false
    const opps = opportunities.get(s.id) || 0
    return opps === minOpps
  })
}

export function countEligibleStudents(
  students: Student[],
  poolKey: PickerPoolKey,
  history: FairnessEntry[],
): number {
  return getEligibleStudents(students, poolKey, history).length
}

export function pickRandomEligible(
  students: Student[],
  poolKey: PickerPoolKey,
  history: FairnessEntry[],
  count: number,
  excludeStudentIds: string[] = [],
): Student[] {
  const picked: Student[] = []
  const currentExcluded = [...excludeStudentIds]

  while (picked.length < count) {
    const eligible = getEligibleStudents(students, poolKey, history, currentExcluded)
    if (eligible.length === 0) break

    const shuffled = shuffle(eligible)
    const needed = count - picked.length
    const selected = shuffled.slice(0, needed)

    picked.push(...selected)
    currentExcluded.push(...selected.map((s) => s.id))
  }

  return picked
}

export function getAvailableReadingSections(students: Student[]): Array<'RM4' | 'SM5'> {
  const sections = new Set<'RM4' | 'SM5'>()
  for (const student of students) {
    if (student.classes.includes('reading') && student.section) {
      sections.add(student.section)
    }
  }
  return [...sections]
}
