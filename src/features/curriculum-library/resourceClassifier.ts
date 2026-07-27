import type { LibraryResource, LibraryResourceType } from './types'

const EXTENSION_TYPE_MAP: Record<string, LibraryResourceType> = {
  pdf: 'pdf',
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  webp: 'image',
  gif: 'image',
  mp4: 'video',
  mov: 'video',
  webm: 'video',
  mp3: 'audio',
  wav: 'audio',
  m4a: 'audio',
  pptx: 'presentation',
}

const FILENAME_PATTERN_RULES: Array<{ pattern: RegExp; type: LibraryResourceType }> = [
  { pattern: /blank|canvas/i, type: 'blank-canvas' },
  { pattern: /template/i, type: 'template' },
  { pattern: /answer|key/i, type: 'answer-key' },
  { pattern: /teacher|script|notes/i, type: 'teacher-notes' },
  { pattern: /practice|worksheet|\bws\b/i, type: 'worksheet' },
  { pattern: /slide|presentation|deck/i, type: 'presentation' },
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

/** Classify a Drive filename into a canonical resource type. */
export function classifyResourceFile(filename: string): LibraryResourceType {
  const baseName = getBaseName(filename)

  for (const rule of FILENAME_PATTERN_RULES) {
    if (rule.pattern.test(baseName)) return rule.type
  }

  const ext = getExtension(filename)
  if (ext in EXTENSION_TYPE_MAP) return EXTENSION_TYPE_MAP[ext]!

  return 'pdf'
}

/** Build a LibraryResource from a filename. */
export function buildResourceFromFile(
  filename: string,
  index: number,
  packageId: string,
): LibraryResource {
  const type = classifyResourceFile(filename)
  const baseName = getBaseName(filename)
  return {
    id: `${packageId}-resource-${index + 1}`,
    type,
    file: filename,
    title: formatResourceTitle(baseName, type),
  }
}

function formatResourceTitle(baseName: string, type: LibraryResourceType): string {
  const cleaned = baseName.replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim()
  if (cleaned.length > 0) return cleaned
  return type.replace(/-/g, ' ')
}

/** Pick the primary resource for lesson launch (presentation preferred). */
export function getPrimaryResource(
  resources: readonly LibraryResource[],
): LibraryResource | undefined {
  return (
    resources.find((r) => r.type === 'presentation') ??
    resources.find((r) => r.type === 'pdf') ??
    resources.find((r) => r.type === 'worksheet') ??
    resources[0]
  )
}

/** Pick teacher-facing resource (notes or answer key). */
export function getTeacherResource(
  resources: readonly LibraryResource[],
): LibraryResource | undefined {
  return (
    resources.find((r) => r.type === 'teacher-notes') ??
    resources.find((r) => r.type === 'answer-key')
  )
}

/** Student-safe resources suitable for display routing. */
export function getStudentSafeResources(
  resources: readonly LibraryResource[],
): LibraryResource[] {
  const teacherOnly: LibraryResourceType[] = ['teacher-notes', 'answer-key']
  return resources.filter((r) => !teacherOnly.includes(r.type))
}
