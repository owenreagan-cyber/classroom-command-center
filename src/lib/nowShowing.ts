import type { ResourceOpenPreset, TeacherMaterialLink } from '../data/types'
import { DEFAULT_RESOURCE_OPEN_PRESET, getResourcePresetMeta } from './resourcePresets'

/** Student-safe fields derived from a Now Showing resource selection. */
export interface NowShowingDisplayInfo {
  label: string
  presetLabel: string
  preset: ResourceOpenPreset
}

/**
 * Resolve the student-safe Now Showing label from persisted state.
 * Returns null when unset, deleted, or the label is empty.
 */
export function resolveNowShowingDisplay(
  nowShowingResourceId: string | null | undefined,
  resourceLinks: TeacherMaterialLink[],
): NowShowingDisplayInfo | null {
  if (!nowShowingResourceId) return null

  const link = resourceLinks.find((item) => item.id === nowShowingResourceId)
  if (!link) return null

  const label = link.label.trim()
  if (!label) return null

  const preset = link.preset ?? DEFAULT_RESOURCE_OPEN_PRESET
  const presetMeta = getResourcePresetMeta(preset)

  return {
    label,
    presetLabel: presetMeta.label,
    preset,
  }
}
