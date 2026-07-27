import { getSectionFiles, scanTeacherResourcePack } from './packScanner'
import {
  SHURLEY_PILOT_CHAPTER,
  SHURLEY_PILOT_LESSON_RANGE,
  SHURLEY_PILOT_SUBJECT,
  type DetectedLesson,
  type TeacherResourcePackTree,
} from './types'

const PRESENTATION_LESSON_PATTERN = /Lesson[_\s](\d+)/i
const START_HERE_LESSON_PATTERN = /Chapter_\d+_Lesson_(\d+)_/i

/** Extract lesson number from a presentation filename. */
export function parseLessonFromPresentation(filename: string): number | null {
  const match = filename.match(PRESENTATION_LESSON_PATTERN)
  if (!match?.[1]) return null
  const num = parseInt(match[1], 10)
  return Number.isFinite(num) && num > 0 ? num : null
}

/** Extract lesson number from Start Here filename. */
export function parseLessonFromStartHere(filename: string): number | null {
  const match = filename.match(START_HERE_LESSON_PATTERN)
  if (!match?.[1]) return null
  const num = parseInt(match[1], 10)
  return Number.isFinite(num) && num > 0 ? num : null
}

/** Derive human-readable lesson title from presentation filename. */
export function parseLessonTitleFromPresentation(filename: string): string | null {
  const match = filename.match(/Lesson_\d+_(.+)\.(pptx|pdf)$/i)
  if (!match?.[1]) return null
  return match[1].replace(/_/g, ' ').trim()
}

/** Whether lesson is in Shurley pilot scope (chapter 1, lessons 3–6). */
export function isPilotLesson(chapter: number, lessonNumber: number): boolean {
  return (
    chapter === SHURLEY_PILOT_CHAPTER &&
    lessonNumber >= SHURLEY_PILOT_LESSON_RANGE.min &&
    lessonNumber <= SHURLEY_PILOT_LESSON_RANGE.max
  )
}

/** Detect lesson numbers from presentation filenames in the pack. */
export function detectLessonsFromPresentations(tree: TeacherResourcePackTree): DetectedLesson[] {
  const meta = scanTeacherResourcePack(tree)
  if (!meta) return []

  const presentations = getSectionFiles(tree, '05_Presentations')
  const startHere = getSectionFiles(tree, '00_Teacher_Start_Here')

  const titleByLesson = new Map<number, string>()
  for (const file of startHere) {
    const lessonNum = parseLessonFromStartHere(file)
    if (lessonNum !== null) {
      titleByLesson.set(lessonNum, `Lesson ${lessonNum}`)
    }
  }

  const lessons = new Map<number, DetectedLesson>()

  for (const file of presentations) {
    const lessonNumber = parseLessonFromPresentation(file)
    if (lessonNumber === null) continue
    if (!isPilotLesson(meta.chapter, lessonNumber)) continue
    if (!/\.(pptx|pdf)$/i.test(file)) continue
    if (/Chapter_Review/i.test(file)) continue

    const title =
      parseLessonTitleFromPresentation(file) ??
      titleByLesson.get(lessonNumber) ??
      `Lesson ${lessonNumber}`

    lessons.set(lessonNumber, {
      lessonNumber,
      title,
      chapter: meta.chapter,
      curriculum: meta.curriculum,
      subject: SHURLEY_PILOT_SUBJECT,
    })
  }

  return [...lessons.values()].sort((a, b) => a.lessonNumber - b.lessonNumber)
}

/** Format display title for a detected lesson. */
export function formatLessonPackageTitle(lesson: DetectedLesson): string {
  return `Shurley Chapter ${lesson.chapter} Lesson ${lesson.lessonNumber} - ${lesson.title}`
}

/** Format Today Prep chapter label. */
export function formatChapterLessonLabel(lesson: DetectedLesson): string {
  return `Chapter ${lesson.chapter} Lesson ${lesson.lessonNumber}`
}
