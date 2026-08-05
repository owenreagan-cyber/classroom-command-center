/**
 * Phase 15A — Display Studio test helpers.
 * Shared utility functions for display-studio tests.
 */

type InspectorSectionId = 'screen' | 'content' | 'widgets' | 'style' | 'teacher-notes' | 'display'

const VALID_INSPECTOR_SECTIONS = new Set<string>([
  'screen',
  'content',
  'widgets',
  'style',
  'teacher-notes',
  'display',
])

export function isInspectorSectionId(value: string): value is InspectorSectionId {
  return VALID_INSPECTOR_SECTIONS.has(value)
}
