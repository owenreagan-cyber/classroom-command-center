import type { ResourceOpenPreset } from '../data/types'

export interface ResourcePresetMeta {
  id: ResourceOpenPreset
  label: string
  placeholder: string
}

export const RESOURCE_OPEN_PRESETS: ResourcePresetMeta[] = [
  {
    id: 'google-slides',
    label: 'Google Slides',
    placeholder: 'https://docs.google.com/presentation/d/...',
  },
  {
    id: 'google-docs',
    label: 'Google Docs',
    placeholder: 'https://docs.google.com/document/d/...',
  },
  {
    id: 'google-drive',
    label: 'Google Drive',
    placeholder: 'https://drive.google.com/file/d/...',
  },
  {
    id: 'youtube',
    label: 'YouTube',
    placeholder: 'https://www.youtube.com/watch?v=...',
  },
  {
    id: 'pdf',
    label: 'PDF / File Link',
    placeholder: 'https://example.com/lesson.pdf',
  },
  {
    id: 'website',
    label: 'Website',
    placeholder: 'https://example.com',
  },
  {
    id: 'other',
    label: 'Other',
    placeholder: 'https://...',
  },
]

const PRESET_BY_ID = new Map(RESOURCE_OPEN_PRESETS.map((preset) => [preset.id, preset]))

export const DEFAULT_RESOURCE_OPEN_PRESET: ResourceOpenPreset = 'website'

export function normalizeResourceOpenPreset(value: unknown): ResourceOpenPreset {
  if (typeof value === 'string' && PRESET_BY_ID.has(value as ResourceOpenPreset)) {
    return value as ResourceOpenPreset
  }
  return DEFAULT_RESOURCE_OPEN_PRESET
}

export function getResourcePresetMeta(preset: ResourceOpenPreset): ResourcePresetMeta {
  return PRESET_BY_ID.get(preset) ?? PRESET_BY_ID.get(DEFAULT_RESOURCE_OPEN_PRESET)!
}

/** Best-effort preset inference from a URL — used for suggestions only. */
export function inferResourceOpenPresetFromUrl(url: string): ResourceOpenPreset | null {
  const trimmed = url.trim()
  if (!trimmed) return null

  try {
    const parsed = new URL(trimmed)
    const host = parsed.hostname.replace(/^www\./, '')
    const path = parsed.pathname.toLowerCase()

    if (host === 'docs.google.com' && path.includes('/presentation/')) return 'google-slides'
    if (host === 'docs.google.com' && path.includes('/document/')) return 'google-docs'
    if (host === 'drive.google.com') return 'google-drive'
    if (host === 'youtube.com' || host === 'youtu.be' || host === 'm.youtube.com') return 'youtube'
    if (path.endsWith('.pdf')) return 'pdf'
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return 'website'
    return null
  } catch {
    return null
  }
}
