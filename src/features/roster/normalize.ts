import type {
  ClassGroup,
  NormalizedRosterStudent,
  ReadingSection,
  RosterStudentInput,
} from './types'

export function computeDisplayName(student: Pick<RosterStudentInput, 'firstName' | 'preferredName'>): string {
  const preferred = student.preferredName?.trim()
  if (preferred) return preferred
  return student.firstName.trim()
}

export function generateStableStudentId(
  firstName: string,
  lastName: string,
  classGroup: ClassGroup,
  section?: ReadingSection,
): string {
  const seed = `${firstName}|${lastName}|${classGroup}|${section ?? ''}`.toLowerCase()
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0
  }
  return `stu-${Math.abs(hash).toString(36)}`
}

export function normalizeRosterStudent(
  input: RosterStudentInput,
  classGroup: ClassGroup,
  section?: ReadingSection,
): NormalizedRosterStudent {
  const firstName = input.firstName.trim()
  const lastName = input.lastName.trim()
  const preferredName = input.preferredName?.trim() || undefined

  return {
    id: generateStableStudentId(firstName, lastName, classGroup, section),
    firstName,
    lastName,
    preferredName,
    displayName: computeDisplayName({ firstName, preferredName }),
    classGroup,
    section,
  }
}
