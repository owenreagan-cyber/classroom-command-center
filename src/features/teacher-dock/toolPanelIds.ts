import type { ToolId } from './types'

/** Panel ids registered in toolPanels/index.ts — keep in sync with TOOL_PANEL_COMPONENTS. */
export const REGISTERED_TOOL_PANEL_IDS: readonly ToolId[] = [
  'dashboard',
  'timers',
  'classroom-atmosphere',
  'morning-message',
  'today-prep',
  'curriculum-sync',
  'materials',
  'display',
  'omninote',
  'mystery-star',
  'quick-picker',
  'prize-board',
  'random-number',
  'jobs',
  'noise',
  'board-control',
] as const
