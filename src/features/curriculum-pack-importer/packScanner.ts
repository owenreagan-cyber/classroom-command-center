import {
  PACK_SECTION_FOLDERS,
  SHURLEY_PILOT_CURRICULUM,
  type DetectedPackMetadata,
  type PackSectionFolder,
  type PackSectionNode,
  type TeacherResourcePackTree,
} from './types'

const SHURLEY_PACK_PATTERN = /Shurley_Chapter_(\d+)_Teacher_Resource_Pack/i

const SECTION_BY_FOLDER = new Map<string, PackSectionFolder>(
  PACK_SECTION_FOLDERS.map((section) => [section, section]),
)

/** Parse chapter number from pack root folder name. */
export function parseChapterFromPackName(rootName: string): number | null {
  const match = rootName.match(SHURLEY_PACK_PATTERN)
  if (!match?.[1]) return null
  const chapter = parseInt(match[1], 10)
  return Number.isFinite(chapter) && chapter > 0 ? chapter : null
}

/** Whether tree represents a Shurley Teacher Resource Pack. */
export function isShurleyTeacherResourcePack(tree: TeacherResourcePackTree): boolean {
  return parseChapterFromPackName(tree.rootName) !== null
}

/** Resolve a section folder name to canonical section id. */
export function resolvePackSection(folderName: string): PackSectionFolder | null {
  return SECTION_BY_FOLDER.get(folderName) ?? null
}

/** List section nodes that match the standard pack layout. */
export function listDetectedSections(tree: TeacherResourcePackTree): PackSectionNode[] {
  return tree.sections.filter((node) => resolvePackSection(node.folderName) !== null)
}

/** Scan pack tree and return curriculum metadata. */
export function scanTeacherResourcePack(
  tree: TeacherResourcePackTree,
): DetectedPackMetadata | null {
  const chapter = parseChapterFromPackName(tree.rootName)
  if (chapter === null) return null

  const sectionsFound = listDetectedSections(tree).map(
    (node) => resolvePackSection(node.folderName)!,
  )

  return {
    curriculum: SHURLEY_PILOT_CURRICULUM,
    chapter,
    packPath: tree.packPath,
    rootName: tree.rootName,
    sectionsFound,
  }
}

/** Get files for a pack section. */
export function getSectionFiles(
  tree: TeacherResourcePackTree,
  section: PackSectionFolder,
): string[] {
  const node = tree.sections.find((entry) => resolvePackSection(entry.folderName) === section)
  return node ? [...node.files] : []
}

/** Whether all required pilot sections are present. */
export function hasRequiredPackSections(tree: TeacherResourcePackTree): boolean {
  const required: PackSectionFolder[] = [
    '02_Teacher_Scripts',
    '03_Student_Resources',
    '04_Teacher_Keys',
    '05_Presentations',
  ]
  const found = new Set(listDetectedSections(tree).map((n) => resolvePackSection(n.folderName)))
  return required.every((section) => found.has(section))
}
