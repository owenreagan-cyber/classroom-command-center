import type { ClassGroup, PickerPoolKey, ReadingSection } from './types'

export function getPoolKey(classGroup: ClassGroup, section?: ReadingSection | null): PickerPoolKey {
  if (classGroup === 'reading' && section) {
    return `reading:${section}`
  }
  return classGroup
}

export function parsePoolKey(poolKey: PickerPoolKey): { classGroup: ClassGroup; section?: ReadingSection } {
  if (poolKey.startsWith('reading:')) {
    const section = poolKey.slice('reading:'.length) as ReadingSection
    return { classGroup: 'reading', section }
  }
  return { classGroup: poolKey as ClassGroup }
}

export function isReadingPoolKey(poolKey: PickerPoolKey): poolKey is `reading:${ReadingSection}` {
  return poolKey.startsWith('reading:')
}
