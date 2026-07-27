import type { FetcherResourceType } from './types'

const EXTENSION_TYPE_MAP: Record<string, FetcherResourceType> = {
  pdf: 'pdf',
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  webp: 'image',
  gif: 'image',
  mp4: 'video',
  mov: 'video',
  webm: 'video',
  pptx: 'presentation',
}

/** Filename pattern rules — first match wins. */
const FILENAME_RULES: Array<{ pattern: RegExp; type: FetcherResourceType }> = [
  { pattern: /slideshow|slides|presentation|deck/i, type: 'presentation' },
  { pattern: /script|teacher|notes/i, type: 'teacher-notes' },
  { pattern: /worksheet|practice|\bws\b/i, type: 'worksheet' },
  { pattern: /assessment|quiz|test/i, type: 'assessment' },
  { pattern: /diagram|image|photo/i, type: 'image' },
]

function getExtension(filename: string): string {
  const dot = filename.lastIndexOf('.')
  return dot >= 0 ? filename.slice(dot + 1).toLowerCase() : ''
}

function getBaseName(filename: string): string {
  const slash = Math.max(filename.lastIndexOf('/'), filename.lastIndexOf('\\'))
  const name = slash >= 0 ? filename.slice(slash + 1) : filename
  const dot = name.lastIndexOf('.')
  return dot >= 0 ? name.slice(0, dot) : name
}

/** Classify a filename into a fetcher resource type. */
export function classifyResourceFilename(filename: string): FetcherResourceType {
  const baseName = getBaseName(filename)

  for (const rule of FILENAME_RULES) {
    if (rule.pattern.test(baseName)) return rule.type
  }

  const ext = getExtension(filename)
  if (ext in EXTENSION_TYPE_MAP) return EXTENSION_TYPE_MAP[ext]!

  return 'pdf'
}

/** Pick primary resource for lesson launch (presentation preferred). */
export function getPrimaryResource<T extends { type: FetcherResourceType }>(
  resources: readonly T[],
): T | undefined {
  return (
    resources.find((r) => r.type === 'presentation') ??
    resources.find((r) => r.type === 'pdf') ??
    resources.find((r) => r.type === 'worksheet') ??
    resources[0]
  )
}

/** Pick teacher materials resource. */
export function getTeacherResource<T extends { type: FetcherResourceType }>(
  resources: readonly T[],
): T | undefined {
  return (
    resources.find((r) => r.type === 'teacher-notes') ??
    resources.find((r) => r.type === 'assessment')
  )
}

/** Student-safe resources (excludes teacher-only types). */
export function getStudentSafeResources<T extends { type: FetcherResourceType }>(
  resources: readonly T[],
): T[] {
  const teacherOnly: FetcherResourceType[] = ['teacher-notes']
  return resources.filter((r) => !teacherOnly.includes(r.type))
}

/** Whether package has enough resources for OmniNote handoff. */
export function isOmniNoteReady(resources: readonly { type: FetcherResourceType }[]): boolean {
  const primary = getPrimaryResource(resources)
  return Boolean(primary && (primary.type === 'presentation' || primary.type === 'pdf' || primary.type === 'worksheet'))
}
