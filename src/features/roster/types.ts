export type ClassGroup = 'homeroom' | 'math' | 'reading'

export type ReadingSection = 'RM4' | 'SM5'

/** Pool key for independent draw/history state. Reading sections stay separate. */
export type PickerPoolKey = ClassGroup | `reading:${ReadingSection}`

export interface RosterStudentInput {
  firstName: string
  lastName: string
  preferredName?: string
}

export interface NormalizedRosterStudent extends RosterStudentInput {
  id: string
  displayName: string
  classGroup: ClassGroup
  section?: ReadingSection
}

export interface ClassRosterDefinition {
  label: string
  uses?: readonly string[]
  students?: readonly RosterStudentInput[]
  sections?: Partial<Record<ReadingSection, readonly RosterStudentInput[]>>
}

export interface LocalRosterFile {
  schoolYear?: string
  privacy?: string
  classes: Partial<Record<ClassGroup, ClassRosterDefinition>>
  scheduleChanges?: Array<{ change: string; status?: string }>
}
