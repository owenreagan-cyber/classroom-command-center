import { getPoolKey } from '../roster/poolKey'
import type { ClassGroup, PickerPoolKey, ReadingSection } from '../roster/types'

export interface PickerContext {
  classGroup: ClassGroup
  readingSection?: ReadingSection
  poolKey: PickerPoolKey
}

export function resolvePickerContext(
  classGroup: ClassGroup,
  readingSection?: ReadingSection | null,
): PickerContext {
  return {
    classGroup,
    readingSection: readingSection ?? undefined,
    poolKey: getPoolKey(classGroup, readingSection),
  }
}

export function classGroupFromScreen(screen: string): ClassGroup {
  if (screen === 'math' || screen === 'reading') return screen
  return 'homeroom'
}
