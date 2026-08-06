/**
 * Local-only roster import validator.
 *
 * Reads from .local/classroom-data/rosters.json (never committed).
 * Provides validation, import, and status reporting.
 *
 * Student Safety:
 * - This file is /control-only. Import controls never render on /display.
 * - Import results are stored in .local/ only.
 * - Real student names must never be committed.
 */

import type { LocalRosterFile, NormalizedRosterStudent } from '../features/roster/types'
import { importRosterFromFile, parseLocalRosterFile } from '../features/roster/importRoster'

export interface RosterImportValidation {
  valid: boolean
  students: NormalizedRosterStudent[]
  errors: string[]
  warnings: string[]
  studentCount: number
  classCount: number
}

export interface RosterSource {
  type: 'sample' | 'local' | 'none'
  label: string
  studentCount: number
  classLabels: string[]
}

/**
 * Validate a parsed roster file. Returns all errors and warnings.
 */
export function validateRosterImport(file: LocalRosterFile): RosterImportValidation {
  const result = importRosterFromFile(file)
  const warnings: string[] = []

  // Check for duplicate students within the same class group
  const idSet = new Set<string>()
  const dupes = new Set<string>()
  for (const s of result.students) {
    const key = `${s.classGroup}:${s.id}`
    if (idSet.has(key)) {
      dupes.add(s.displayName)
    }
    idSet.add(key)
  }
  if (dupes.size > 0) {
    warnings.push(`Duplicate students found: ${[...dupes].join(', ')}`)
  }

  // Check for empty classes
  const classCounts = new Map<string, number>()
  for (const s of result.students) {
    classCounts.set(s.classGroup, (classCounts.get(s.classGroup) ?? 0) + 1)
  }
  // Reading section handled differently — check reading sections
  const readingDef = file.classes.reading
  if (readingDef?.sections) {
    for (const section of result.sectionsFound) {
      const count = result.students.filter(
        (s) => s.classGroup === 'reading' && s.section === section,
      ).length
      if (count === 0) {
        warnings.push(`Reading section ${section} has 0 students`)
      }
    }
  }

  const classLabels = classCounts.size > 0
    ? [...classCounts.keys()]
    : []

  return {
    valid: result.errors.length === 0,
    students: result.students,
    errors: result.errors,
    warnings,
    studentCount: result.students.length,
    classCount: classLabels.length,
  }
}

/**
 * Attempt to read a roster from JSON string.
 */
export function tryImportRoster(raw: string): RosterImportValidation {
  const parsed = parseLocalRosterFile(raw)
  if (parsed.errors.length > 0) {
    return {
      valid: false,
      students: [],
      errors: parsed.errors,
      warnings: [],
      studentCount: 0,
      classCount: 0,
    }
  }
  if (!parsed.file) {
    return {
      valid: false,
      students: [],
      errors: ['Missing roster file data'],
      warnings: [],
      studentCount: 0,
      classCount: 0,
    }
  }
  return validateRosterImport(parsed.file)
}

/**
 * Determine current roster source status for teacher UI.
 * Called only from /control (teacher-facing).
 */
export function getRosterSource(studentCount: number, hasImportedMeta: boolean): RosterSource {
  if (studentCount === 0) {
    return { type: 'none', label: 'No roster loaded', studentCount: 0, classLabels: [] }
  }
  if (hasImportedMeta) {
    return {
      type: 'local',
      label: 'Local roster imported',
      studentCount,
      classLabels: [], // Populated by store
    }
  }
  return {
    type: 'sample',
    label: 'Using sample roster',
    studentCount,
    classLabels: [],
  }
}

/** Local-only file paths for roster data (never committed). */
export const LOCAL_ROSTER_PATH = '.local/classroom-data/rosters.json'

/** Sample fixture path for tests and documentation. */
export const SAMPLE_ROSTER_PATH = 'tests/fixtures/classroom-rosters.sample.json'
