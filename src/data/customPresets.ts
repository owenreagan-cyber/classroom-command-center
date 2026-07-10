import type { CustomBoardPreset, ScreenContents, ScreenId } from './types'

export function makeCustomPreset(
  contents: ScreenContents,
  screenId: ScreenId,
  label: string,
): CustomBoardPreset {
  const safeLabel = label.trim() || 'Custom Preset'

  return {
    id: `custom-${screenId}-${Date.now()}`,
    label: safeLabel,
    helperText: `Saved from ${screenId.replaceAll('-', ' ')}.`,
    screenId,
    content: structuredClone(contents[screenId]),
    createdAt: new Date().toISOString(),
  }
}

export function applyCustomPresetToContents(
  contents: ScreenContents,
  preset: CustomBoardPreset,
): ScreenContents {
  return {
    ...structuredClone(contents),
    [preset.screenId]: structuredClone(preset.content),
  }
}
