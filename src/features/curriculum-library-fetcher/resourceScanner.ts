import type { CurriculumSubjectId } from '../curriculum/types'
import type {
  DriveFolderNode,
  DriveFolderTree,
  ScannedLessonFolder,
} from './types'
import {
  PILOT_CURRICULUM,
  PILOT_LESSON_RANGE,
  PILOT_SUBJECT,
  SUBJECT_FOLDER_MAP,
} from './types'

const LESSON_FOLDER_PATTERN = /Lesson\s*(\d+)/i

/** Detect subject from Drive path segment. */
export function detectSubjectFromPath(path: string): CurriculumSubjectId | null {
  for (const segment of path.split('/')) {
    const key = segment.trim().toLowerCase()
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

/** Whether folder is in pilot scope (Saxon Math lessons 2–6). */
export function isPilotLessonFolder(parsed: ScannedLessonFolder): boolean {
  return (
    parsed.subject === PILOT_SUBJECT &&
    parsed.curriculum === PILOT_CURRICULUM &&
    parsed.lessonNumber >= PILOT_LESSON_RANGE.min &&
    parsed.lessonNumber <= PILOT_LESSON_RANGE.max
  )
}

/** Parse a single Drive folder entry into lesson metadata. */
export function parseLessonFolder(node: DriveFolderNode): ScannedLessonFolder | null {
  const segments = node.path.split('/').filter(Boolean)
  if (segments.length < 3) return null

  const lessonFolder = segments[segments.length - 1]!
  const lessonNumber = parseLessonNumber(lessonFolder)
  if (lessonNumber === null) return null

  const subject = detectSubjectFromPath(node.path)
  if (!subject) return null

  const subjectIndex = segments.findIndex(
    (s) => detectSubjectFromPath(s) === subject,
  )
  const curriculum =
    subjectIndex >= 0 && segments[subjectIndex + 1]
      ? segments[subjectIndex + 1]!
      : 'Unknown Program'

  return {
    subject,
    curriculum,
    lessonNumber,
    drivePath: node.path,
    files: node.files,
  }
}

/** Scan a Drive folder tree and return parsed lesson folders (pilot-filtered). */
export function scanDriveFolderTree(
  tree: DriveFolderTree,
  options: { pilotOnly?: boolean } = { pilotOnly: true },
): ScannedLessonFolder[] {
  const results: ScannedLessonFolder[] = []

  for (const node of tree.folders) {
    const parsed = parseLessonFolder(node)
    if (!parsed) continue
    if (options.pilotOnly && !isPilotLessonFolder(parsed)) continue
    results.push(parsed)
  }

  return results.sort((a, b) => a.lessonNumber - b.lessonNumber)
}

/** Find scanned folder matching subject + lesson number. */
export function findScannedLesson(
  scanned: readonly ScannedLessonFolder[],
  subject: CurriculumSubjectId,
  lessonNumber: number,
): ScannedLessonFolder | undefined {
  return scanned.find(
    (entry) => entry.subject === subject && entry.lessonNumber === lessonNumber,
  )
}

/** List available resource filenames for a scanned lesson. */
export function listAvailableResources(folder: ScannedLessonFolder): string[] {
  return [...folder.files]
}
