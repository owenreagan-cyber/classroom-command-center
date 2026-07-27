import { getSectionFiles } from './packScanner'
import { parseLessonFromPresentation } from './lessonDetector'
import type {
  DetectedLesson,
  PackResource,
  PackResourceType,
  PackSectionFolder,
  TeacherResourcePackTree,
} from './types'

/** Map pack section folders to resource types. */
export const SECTION_RESOURCE_TYPE_MAP: Record<
  PackSectionFolder,
  PackResourceType | null
> = {
  '00_Teacher_Start_Here': null,
  '01_Lesson_Plans': null,
  '02_Teacher_Scripts': 'teacher-notes',
  '03_Student_Resources': 'student-resource',
  '04_Teacher_Keys': 'teacher-key',
  '05_Presentations': 'presentation',
  '06_Visual_References': null,
  '07_Assessments': 'assessment',
  '08_Teacher_Planning': null,
}

function buildResourceId(
  lessonNumber: number,
  type: PackResourceType,
  index: number,
): string {
  return `shurley-ch${lessonNumber}-${type}-${index + 1}`
}

function mapSectionResources(
  section: PackSectionFolder,
  files: readonly string[],
  lessonNumber: number,
  lessonFilter: (filename: string) => boolean,
): PackResource[] {
  const type = SECTION_RESOURCE_TYPE_MAP[section]
  if (!type) return []

  const matched = files.filter(lessonFilter)
  return matched.map((filename, index) => ({
    id: buildResourceId(lessonNumber, type, index),
    filename,
    type,
    path: `${section}/${filename}`,
    section,
  }))
}

/** Map pack sections to resources for a specific lesson. */
export function mapResourcesForLesson(
  tree: TeacherResourcePackTree,
  lesson: DetectedLesson,
): PackResource[] {
  const resources: PackResource[] = []

  for (const section of Object.keys(SECTION_RESOURCE_TYPE_MAP) as PackSectionFolder[]) {
    const type = SECTION_RESOURCE_TYPE_MAP[section]
    if (!type) continue

    const files = getSectionFiles(tree, section)

    if (section === '05_Presentations') {
      resources.push(
        ...mapSectionResources(section, files, lesson.lessonNumber, (filename) => {
          const num = parseLessonFromPresentation(filename)
          return num === lesson.lessonNumber && /\.(pptx|pdf)$/i.test(filename)
        }),
      )
      continue
    }

    if (section === '07_Assessments') {
      resources.push(
        ...mapSectionResources(section, files, lesson.lessonNumber, (filename) =>
          /chapter-\d+/i.test(filename),
        ),
      )
      continue
    }

    if (
      section === '02_Teacher_Scripts' ||
      section === '03_Student_Resources' ||
      section === '04_Teacher_Keys'
    ) {
      resources.push(
        ...mapSectionResources(section, files, lesson.lessonNumber, (filename) =>
          /chapter-\d+/i.test(filename),
        ),
      )
    }
  }

  return resources
}

/** Classify a filename within a section (for tests). */
export function classifySectionResource(
  section: PackSectionFolder,
  filename: string,
): PackResourceType | null {
  if (section === '05_Presentations' && parseLessonFromPresentation(filename) !== null) {
    return 'presentation'
  }
  return SECTION_RESOURCE_TYPE_MAP[section]
}
