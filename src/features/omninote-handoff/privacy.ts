import type { FetcherResourceType } from '../curriculum-library-fetcher/types'
import type { OmniNoteExportLessonPackage, OmniNoteExportResourceKind } from './types'

/** Fetcher types that must never appear in student-safe OmniNote handoff export. */
export const TEACHER_ONLY_FETCHER_TYPES: readonly FetcherResourceType[] = [
  'teacher-notes',
] as const

export const TEACHER_ONLY_OMNINOTE_KINDS: readonly OmniNoteExportResourceKind[] = [
  'teacherNotes',
  'teacherKey',
  'answerKey',
] as const

/** Keys that must never appear in exported handoff JSON values. */
export const BLOCKED_EXPORT_VALUE_PATTERNS: readonly RegExp[] = [
  /access_token/i,
  /bearer\s+/i,
  /canvas\.instructure\.com/i,
  /https?:\/\//i,
  /@\w+\.\w+/,
] as const

export const BLOCKED_EXPORT_KEYS: readonly string[] = [
  'readiness',
  'drivePath',
  'driveFileId',
  'teacherOverride',
  'missingResources',
  'missingRecommended',
  'token',
  'access_token',
  'webUrl',
  'embedUrl',
  'url',
] as const

export function isTeacherOnlyFetcherType(type: FetcherResourceType): boolean {
  return TEACHER_ONLY_FETCHER_TYPES.includes(type)
}

export function isTeacherOnlyFilename(filename: string): boolean {
  const lower = filename.toLowerCase()
  return (
    /teacher|script|answer|key|planning|private/i.test(lower) &&
    !/student/i.test(lower)
  )
}

export function mapFetcherTypeToOmniNoteKind(
  type: FetcherResourceType,
  filename: string,
): OmniNoteExportResourceKind {
  if (isTeacherOnlyFetcherType(type) || isTeacherOnlyFilename(filename)) {
    if (/answer|key/i.test(filename)) return 'answerKey'
    if (/teacher-key|teacher_edition/i.test(filename)) return 'teacherKey'
    return 'teacherNotes'
  }
  switch (type) {
    case 'presentation':
      return 'presentation'
    case 'worksheet':
      return 'worksheet'
    case 'pdf':
      return 'pdf'
    case 'image':
      return 'image'
    case 'assessment':
      return /key|answer/i.test(filename) ? 'answerKey' : 'worksheet'
    default:
      return 'pdf'
  }
}

export function isTeacherOnlyOmniNoteKind(kind: OmniNoteExportResourceKind): boolean {
  return TEACHER_ONLY_OMNINOTE_KINDS.includes(kind)
}

/** Validate exported package contains no blocked metadata or teacher-only primary resource. */
export function validateExportPrivacy(pkg: OmniNoteExportLessonPackage): string[] {
  const errors: string[] = []
  const json = JSON.stringify(pkg)

  for (const key of BLOCKED_EXPORT_KEYS) {
    if (json.includes(`"${key}"`)) {
      errors.push(`blocked key present: ${key}`)
    }
  }

  for (const pattern of BLOCKED_EXPORT_VALUE_PATTERNS) {
    if (pattern.test(json)) {
      errors.push(`blocked value pattern: ${pattern}`)
    }
  }

  const studentVisible = pkg.resources.filter((r) => r.studentVisible && !r.teacherOnly)
  if (studentVisible.length === 0) {
    errors.push('no student-visible resources in export')
  }

  if (studentVisible.some((r) => isTeacherOnlyOmniNoteKind(r.type))) {
    errors.push('teacher-only kind in student-visible export')
  }

  for (const resource of pkg.resources) {
    if (resource.teacherOnly && resource.studentVisible) {
      errors.push(`resource ${resource.id} marked both teacherOnly and studentVisible`)
    }
  }

  return errors
}
