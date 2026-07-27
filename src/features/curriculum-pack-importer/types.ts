import type { CurriculumSubjectId } from '../curriculum/types'
import type { TeachingWorkspaceId } from '../workspace/types'

/** Standard Teacher Resource Pack section folder names. */
export const PACK_SECTION_FOLDERS = [
  '00_Teacher_Start_Here',
  '01_Lesson_Plans',
  '02_Teacher_Scripts',
  '03_Student_Resources',
  '04_Teacher_Keys',
  '05_Presentations',
  '06_Visual_References',
  '07_Assessments',
  '08_Teacher_Planning',
] as const

export type PackSectionFolder = (typeof PACK_SECTION_FOLDERS)[number]

/** Resource types mapped from pack section folders. */
export type PackResourceType =
  | 'presentation'
  | 'teacher-notes'
  | 'student-resource'
  | 'teacher-key'
  | 'assessment'

export interface PackResource {
  id: string
  filename: string
  type: PackResourceType
  /** Path relative to pack root (section/filename). */
  path: string
  section: PackSectionFolder
}

export interface PackSectionNode {
  section: PackSectionFolder
  folderName: string
  files: readonly string[]
}

/** Metadata-only tree describing a Teacher Resource Pack folder. */
export interface TeacherResourcePackTree {
  rootName: string
  packPath: string
  sections: readonly PackSectionNode[]
}

export interface DetectedPackMetadata {
  curriculum: string
  chapter: number
  packPath: string
  rootName: string
  sectionsFound: readonly PackSectionFolder[]
}

export interface DetectedLesson {
  lessonNumber: number
  title: string
  chapter: number
  curriculum: string
  subject: CurriculumSubjectId
}

/** Lesson package built from scanned Teacher Resource Pack metadata. */
export interface CurriculumLessonPackage {
  id: string
  title: string
  subject: CurriculumSubjectId
  curriculum: string
  chapter: number
  lessonNumber: number
  workspace: TeachingWorkspaceId
  resources: readonly PackResource[]
  omninoteReady: boolean
  packPath: string
}

export interface OmniNotePackPayload {
  title: string
  subject: CurriculumSubjectId
  curriculum: string
  chapter: number
  lessonNumber: number
  primaryResource: PackResource | null
  resources: readonly PackResource[]
  omninoteReady: boolean
}

export const SHURLEY_PILOT_CURRICULUM = 'Shurley English' as const
export const SHURLEY_PILOT_SUBJECT: CurriculumSubjectId = 'shurley'
export const SHURLEY_PILOT_WORKSPACE: TeachingWorkspaceId = 'shurley'
export const SHURLEY_PILOT_CHAPTER = 1 as const
export const SHURLEY_PILOT_LESSON_RANGE = { min: 3, max: 6 } as const
