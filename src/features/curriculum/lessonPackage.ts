import type {
  CurriculumSubjectId,
  LessonAnnotationMode,
  LessonDisplayMode,
  LessonPackage,
  LessonPlan,
  LessonResource,
  LessonResourceKind,
} from './types'
import { scoreLessonReadiness, toReadinessSummary } from '../curriculum-readiness/readinessScorer'
import type { FetcherResourceType } from '../curriculum-library-fetcher/types'

const DEFAULT_MATH_RESOURCES: Record<number, Omit<LessonResource, 'id'>[]> = {
  2: [
    { title: 'Presentation', kind: 'slides', source: 'math/lesson-2/presentation.pdf' },
    { title: 'Practice', kind: 'pdf', source: 'math/lesson-2/practice.pdf' },
    { title: 'Teacher Notes', kind: 'teacher-notes', source: 'math/lesson-2/teacher-notes.pdf' },
  ],
}

function defaultResourcesForPlan(plan: LessonPlan): LessonResource[] {
  const preset = DEFAULT_MATH_RESOURCES[plan.lessonNumber]
  if (plan.subjectId === 'math' && preset) {
    return preset.map((resource, index) => ({
      id: `${plan.id}-resource-${index + 1}`,
      ...resource,
    }))
  }

  return [
    {
      id: `${plan.id}-slides`,
      title: `${plan.displayTitle} Slides`,
      kind: 'slides',
      source: `${plan.subjectId}/lesson-${plan.lessonNumber}/presentation.pdf`,
    },
    {
      id: `${plan.id}-worksheet`,
      title: `${plan.displayTitle} Worksheet`,
      kind: 'worksheet',
      source: `${plan.subjectId}/lesson-${plan.lessonNumber}/worksheet.pdf`,
    },
  ]
}

function scoreCurriculumPackageReadiness(
  pkg: Omit<LessonPackage, 'readiness'>,
): LessonPackage['readiness'] {
  const mapped = pkg.resources.map((resource) => ({
    type: mapKindToFetcherType(resource.kind),
    path: resource.source ?? resource.title,
    filename: resource.title,
  }))
  return toReadinessSummary(
    scoreLessonReadiness({
      lessonId: pkg.id,
      subject: pkg.subject,
      resources: mapped,
    }),
  )
}

function mapKindToFetcherType(kind: LessonResourceKind): FetcherResourceType {
  switch (kind) {
    case 'slides':
      return 'presentation'
    case 'worksheet':
      return 'worksheet'
    case 'teacher-notes':
    case 'answer-key':
      return 'teacher-notes'
    case 'pdf':
    case 'image':
    default:
      return 'pdf'
  }
}

function withReadiness(pkg: LessonPackage): LessonPackage {
  return { ...pkg, readiness: scoreCurriculumPackageReadiness(pkg) }
}

export function createLessonPackageFromPlan(
  plan: LessonPlan,
  options: {
    resources?: LessonResource[]
    annotationMode?: LessonAnnotationMode
    displayMode?: LessonDisplayMode
  } = {},
): LessonPackage {
  const pkg: LessonPackage = {
    id: `package-${plan.id}`,
    title: plan.displayTitle,
    subject: plan.subjectId,
    curriculum: plan.program,
    lessonNumber: plan.lessonNumber,
    resources: options.resources ?? defaultResourcesForPlan(plan),
    annotationMode: options.annotationMode ?? 'annotate',
    displayMode: options.displayMode ?? 'student-safe',
  }
  return withReadiness(pkg)
}

export function createLessonPackage(input: {
  id?: string
  title: string
  subject: CurriculumSubjectId
  curriculum: LessonPackage['curriculum']
  lessonNumber: number
  resources: LessonResource[]
  annotationMode?: LessonAnnotationMode
  displayMode?: LessonDisplayMode
}): LessonPackage {
  return withReadiness({
    id: input.id ?? `package-${input.subject}-${input.lessonNumber}`,
    title: input.title,
    subject: input.subject,
    curriculum: input.curriculum,
    lessonNumber: input.lessonNumber,
    resources: input.resources,
    annotationMode: input.annotationMode ?? 'annotate',
    displayMode: input.displayMode ?? 'student-safe',
  })
}

export function getResourceByKind(
  pkg: LessonPackage,
  kind: LessonResourceKind,
): LessonResource | undefined {
  return pkg.resources.find((resource) => resource.kind === kind)
}
