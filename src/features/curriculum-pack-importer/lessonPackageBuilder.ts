import { detectLessonsFromPresentations, formatLessonPackageTitle } from './lessonDetector'
import { mapResourcesForLesson } from './resourceMapper'
import type {
  CurriculumLessonPackage,
  DetectedLesson,
  OmniNotePackPayload,
  PackResource,
  TeacherResourcePackTree,
} from './types'
import { SHURLEY_PILOT_WORKSPACE } from './types'

function buildPackageId(chapter: number, lessonNumber: number): string {
  return `shurley-ch${chapter}-lesson-${String(lessonNumber).padStart(2, '0')}`
}

function getPrimaryResource(resources: readonly PackResource[]): PackResource | undefined {
  return (
    resources.find((r) => r.type === 'presentation' && /\.pptx$/i.test(r.filename)) ??
    resources.find((r) => r.type === 'presentation') ??
    resources.find((r) => r.type === 'student-resource') ??
    resources[0]
  )
}

export function isOmniNoteReady(resources: readonly PackResource[]): boolean {
  const primary = getPrimaryResource(resources)
  return Boolean(primary && primary.type === 'presentation')
}

/** Build a single lesson package from detected lesson + mapped resources. */
export function buildLessonPackageFromDetection(
  tree: TeacherResourcePackTree,
  lesson: DetectedLesson,
): CurriculumLessonPackage {
  const resources = mapResourcesForLesson(tree, lesson)
  const omninoteReady = isOmniNoteReady(resources)

  return {
    id: buildPackageId(lesson.chapter, lesson.lessonNumber),
    title: formatLessonPackageTitle(lesson),
    subject: lesson.subject,
    curriculum: lesson.curriculum,
    chapter: lesson.chapter,
    lessonNumber: lesson.lessonNumber,
    workspace: SHURLEY_PILOT_WORKSPACE,
    resources,
    omninoteReady,
    packPath: tree.packPath,
  }
}

/** Scan pack tree and build all pilot lesson packages. */
export function buildLessonPackagesFromPack(
  tree: TeacherResourcePackTree,
): CurriculumLessonPackage[] {
  const lessons = detectLessonsFromPresentations(tree)
  return lessons.map((lesson) => buildLessonPackageFromDetection(tree, lesson))
}

/** Build OmniNote handoff payload from a pack lesson package. */
export function buildOmniNotePayload(pkg: CurriculumLessonPackage): OmniNotePackPayload {
  const primary = getPrimaryResource(pkg.resources) ?? null
  const studentSafe = pkg.resources.filter(
    (r) => r.type !== 'teacher-notes' && r.type !== 'teacher-key',
  )

  return {
    title: pkg.title,
    subject: pkg.subject,
    curriculum: pkg.curriculum,
    chapter: pkg.chapter,
    lessonNumber: pkg.lessonNumber,
    primaryResource: primary,
    resources: studentSafe,
    omninoteReady: pkg.omninoteReady,
  }
}

export function getFetcherReadinessLabel(omninoteReady: boolean): string {
  return omninoteReady ? 'Ready' : 'Partial'
}
