import type { CurriculumSubjectId } from '../curriculum/types'
import { resolveTeachingWorkspaceForSubject } from '../curriculum/pacingResolver'
import type { TeachingWorkspaceId } from '../workspace/types'
import { buildResourceFromFile, getPrimaryResource } from './resourceClassifier'
import type {
  DriveFolderEntry,
  LessonReadiness,
  LibraryLessonPackage,
  LibraryResource,
} from './types'
import { SUBJECT_FOLDER_MAP, SUBJECT_TO_WORKSPACE } from './types'

const LESSON_FOLDER_PATTERN = /Lesson\s*(\d+)/i

export interface ParsedLessonFolder {
  subject: CurriculumSubjectId
  curriculum: string
  lessonNumber: number
  drivePath: string
  files: readonly string[]
}

/** Detect subject from Drive path segment. */
export function detectSubjectFromPath(path: string): CurriculumSubjectId | null {
  const segments = path.split('/').map((s) => s.trim())
  for (const segment of segments) {
    const key = segment.toLowerCase()
    if (key in SUBJECT_FOLDER_MAP) return SUBJECT_FOLDER_MAP[key]!
  }
  return null
}

/** Extract lesson number from folder name like "Lesson 02". */
export function parseLessonNumber(folderName: string): number | null {
  const match = folderName.match(LESSON_FOLDER_PATTERN)
  if (!match?.[1]) return null
  const num = parseInt(match[1], 10)
  return Number.isFinite(num) && num > 0 ? num : null
}

/** Parse a Drive folder path into lesson metadata. */
export function parseLessonFolder(entry: DriveFolderEntry): ParsedLessonFolder | null {
  const segments = entry.path.split('/').filter(Boolean)
  if (segments.length < 3) return null

  const lessonFolder = segments[segments.length - 1]!
  const lessonNumber = parseLessonNumber(lessonFolder)
  if (lessonNumber === null) return null

  const subject = detectSubjectFromPath(entry.path)
  if (!subject) return null

  const curriculumIndex = segments.findIndex(
    (s) => detectSubjectFromPath(s) === subject,
  )
  const curriculum =
    curriculumIndex >= 0 && segments[curriculumIndex + 1]
      ? segments[curriculumIndex + 1]!
      : 'Unknown Program'

  return {
    subject,
    curriculum,
    lessonNumber,
    drivePath: entry.path,
    files: entry.files,
  }
}

/** Resolve workspace for a subject — uses pacing resolver when available. */
export function resolveWorkspaceForSubject(
  subject: CurriculumSubjectId,
): TeachingWorkspaceId {
  const fromPacing = resolveTeachingWorkspaceForSubject(subject)
  return SUBJECT_TO_WORKSPACE[subject] ?? fromPacing
}

/** Compute readiness from classified resources. */
export function computeReadiness(resources: readonly LibraryResource[]): LessonReadiness {
  if (resources.length === 0) return 'missing'
  const primary = getPrimaryResource(resources)
  if (primary?.type === 'presentation' || primary?.type === 'pdf') return 'ready'
  if (resources.length >= 1) return 'partial'
  return 'missing'
}

/** Build a LibraryLessonPackage from a parsed Drive lesson folder. */
export function buildLessonPackageFromFolder(
  parsed: ParsedLessonFolder,
  options: {
    grade?: string
    track?: string
    week?: number
  } = {},
): LibraryLessonPackage {
  const packageId = `${parsed.curriculum.toLowerCase().replace(/\s+/g, '-')}-lesson-${String(parsed.lessonNumber).padStart(2, '0')}`
  const resources = parsed.files.map((file, index) =>
    buildResourceFromFile(file, index, packageId),
  )
  const readiness = computeReadiness(resources)
  const workspace = resolveWorkspaceForSubject(parsed.subject)

  return {
    id: packageId,
    title: `${parsed.curriculum} Lesson ${parsed.lessonNumber}`,
    subject: parsed.subject,
    curriculum: parsed.curriculum,
    grade: options.grade,
    track: options.track,
    week: options.week,
    lessonNumber: parsed.lessonNumber,
    resources,
    workspace,
    annotationMode: 'annotate',
    displayMode: 'student-safe',
    readiness,
    drivePath: parsed.drivePath,
  }
}

/** Scan multiple Drive folder entries into lesson packages. */
export function scanLessonFolders(
  entries: readonly DriveFolderEntry[],
  options: { grade?: string; track?: string; week?: number } = {},
): LibraryLessonPackage[] {
  const packages: LibraryLessonPackage[] = []
  for (const entry of entries) {
    const parsed = parseLessonFolder(entry)
    if (!parsed) continue
    packages.push(buildLessonPackageFromFolder(parsed, options))
  }
  return packages
}

/** Find a package matching subject + lesson number. */
export function findPackageForLesson(
  packages: readonly LibraryLessonPackage[],
  subject: CurriculumSubjectId,
  lessonNumber: number,
): LibraryLessonPackage | undefined {
  return packages.find(
    (pkg) => pkg.subject === subject && Number(pkg.lessonNumber) === lessonNumber,
  )
}
