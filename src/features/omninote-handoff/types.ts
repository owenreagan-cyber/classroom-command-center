/** OmniNote Phase 10 — exported lesson package JSON (Command Center → OmniNote). */

export type OmniNoteExportResourceKind =
  | 'presentation'
  | 'slideDeck'
  | 'pdf'
  | 'worksheet'
  | 'studentResource'
  | 'image'
  | 'blankCanvas'
  | 'teacherNotes'
  | 'teacherKey'
  | 'answerKey'

export type OmniNoteExportAnnotationMode = 'annotate' | 'present' | 'read-only'

export type OmniNoteExportDisplayMode = 'student-safe' | 'teacher-only' | 'none'

export interface OmniNoteExportResource {
  id: string
  title?: string
  type: OmniNoteExportResourceKind
  file: string
  studentVisible: boolean
  teacherOnly: boolean
}

/** Student-safe package written for OmniNote handoff. */
export interface OmniNoteExportLessonPackage {
  id: string
  title: string
  subject: string
  curriculum: string
  grade?: string
  track?: string
  week?: number
  lessonNumber: string
  workspace: string
  annotationMode: OmniNoteExportAnnotationMode
  displayMode: OmniNoteExportDisplayMode
  resources: readonly OmniNoteExportResource[]
}

export interface OmniNoteLessonHandoffPlan {
  package: OmniNoteExportLessonPackage
  packageJson: string
  localPackagePath: string
  deepLink: string
  primaryResourceFilename: string | null
}

export interface OmniNoteHandoffExportResult {
  plan: OmniNoteLessonHandoffPlan
  writtenFiles: readonly string[]
}
