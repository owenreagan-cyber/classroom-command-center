import { normalizeRosterStudent } from './normalize'
import type {
  ClassGroup,
  LocalRosterFile,
  NormalizedRosterStudent,
  ReadingSection,
  RosterStudentInput,
} from './types'

export interface RosterImportResult {
  students: NormalizedRosterStudent[]
  errors: string[]
  sectionsFound: ReadingSection[]
}

const READING_SECTIONS: ReadingSection[] = ['RM4', 'SM5']

function pushClassStudents(
  target: NormalizedRosterStudent[],
  classGroup: ClassGroup,
  inputs: readonly RosterStudentInput[] | undefined,
  section?: ReadingSection,
) {
  if (!inputs) return
  for (const input of inputs) {
    if (!input.firstName?.trim()) continue
    target.push(normalizeRosterStudent(input, classGroup, section))
  }
}

export function parseLocalRosterFile(raw: string): { file?: LocalRosterFile; errors: string[] } {
  try {
    const parsed = JSON.parse(raw) as LocalRosterFile
    if (!parsed.classes || typeof parsed.classes !== 'object') {
      return { errors: ['Roster file must include a classes object.'] }
    }
    return { file: parsed, errors: [] }
  } catch {
    return { errors: ['Failed to parse roster JSON.'] }
  }
}

export function importRosterFromFile(file: LocalRosterFile): RosterImportResult {
  const students: NormalizedRosterStudent[] = []
  const errors: string[] = []
  const sectionsFound: ReadingSection[] = []

  pushClassStudents(students, 'homeroom', file.classes.homeroom?.students)
  pushClassStudents(students, 'math', file.classes.math?.students)

  const reading = file.classes.reading
  if (reading?.sections) {
    for (const section of READING_SECTIONS) {
      const sectionStudents = reading.sections[section]
      if (sectionStudents && sectionStudents.length > 0) {
        sectionsFound.push(section)
        pushClassStudents(students, 'reading', sectionStudents, section)
      }
    }
  } else if (reading?.students) {
    pushClassStudents(students, 'reading', reading.students)
  }

  if (students.length === 0) {
    errors.push('No students found in roster file.')
  }

  return { students, errors, sectionsFound }
}

export function rosterStudentsToPickerStudents(students: NormalizedRosterStudent[]) {
  return students.map((s) => ({
    id: s.id,
    firstName: s.firstName,
    lastName: s.lastName,
    preferredName: s.preferredName,
    displayName: s.displayName,
    isActive: true,
    classes: [s.classGroup] as ClassGroup[],
    section: s.section,
    isAbsent: false,
  }))
}
