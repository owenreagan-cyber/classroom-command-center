import type { DriveFolderTree } from '../types'
import { SAXON_MATH_DRIVE_FIXTURE } from '../fixtures/saxonMathLessons.fixture'
import type { DriveFileMetadata, DriveFolderEntry } from './types'

/** Provider contract for Google Drive folder discovery. OAuth not implemented yet. */
export interface DriveFolderProvider {
  /** List child folders under a parent (root when omitted). */
  listFolders(parentId?: string): Promise<DriveFolderEntry[]>
  /** List files in a folder by folder id. */
  listFiles(folderId: string): Promise<DriveFileMetadata[]>
  /** Fetch metadata for a single file. */
  getFileMetadata(fileId: string): Promise<DriveFileMetadata | null>
  /** Build full folder tree from library root. */
  getFolderTree(rootId?: string): Promise<DriveFolderTree>
  /** Whether the provider can reach Drive (false = offline/mock-fallback). */
  isAvailable(): Promise<boolean>
}

/** In-memory mock provider backed by Saxon Math fixture for tests and offline dev. */
export class MockDriveProvider implements DriveFolderProvider {
  private readonly tree: DriveFolderTree
  private readonly available: boolean

  constructor(tree: DriveFolderTree = SAXON_MATH_DRIVE_FIXTURE, available = true) {
    this.tree = tree
    this.available = available
  }

  async isAvailable(): Promise<boolean> {
    return this.available
  }

  async getFolderTree(): Promise<DriveFolderTree> {
    if (!this.available) throw new Error('Drive unavailable')
    return this.tree
  }

  async listFolders(): Promise<DriveFolderEntry[]> {
    if (!this.available) throw new Error('Drive unavailable')
    const seen = new Set<string>()
    const folders: DriveFolderEntry[] = []
    for (const node of this.tree.folders) {
      const segments = node.path.split('/').filter(Boolean)
      let current = ''
      for (const segment of segments) {
        current = current ? `${current}/${segment}` : segment
        if (!seen.has(current)) {
          seen.add(current)
          folders.push({ id: `folder-${current}`, name: segment, path: current })
        }
      }
    }
    return folders
  }

  async listFiles(folderId: string): Promise<DriveFileMetadata[]> {
    if (!this.available) throw new Error('Drive unavailable')
    const path = folderId.replace(/^folder-/, '')
    const node = this.tree.folders.find((f) => f.path === path)
    if (!node) return []
    return node.files.map((name, i) => ({
      id: `file-${path}-${i}`,
      name,
      mimeType: 'application/pdf',
      path: `${path}/${name}`,
    }))
  }

  async getFileMetadata(fileId: string): Promise<DriveFileMetadata | null> {
    if (!this.available) return null
    const match = fileId.match(/^file-(.+)-(\d+)$/)
    if (!match) return null
    const [, path, indexStr] = match
    const index = parseInt(indexStr!, 10)
    const node = this.tree.folders.find((f) => f.path === path)
    const name = node?.files[index]
    if (!name) return null
    return { id: fileId, name, mimeType: 'application/pdf', path: `${path}/${name}` }
  }
}

/** Default provider instance — mock until OAuth is wired. */
export function createDefaultDriveProvider(): DriveFolderProvider {
  return new MockDriveProvider()
}
