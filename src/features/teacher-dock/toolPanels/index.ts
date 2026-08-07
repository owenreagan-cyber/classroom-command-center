import type { ComponentType } from 'react'
import type { ToolId } from '../types'
import { DashboardToolPanel } from './DashboardToolPanel'
import { TimersToolPanel } from './TimersToolPanel'
import { AtmosphereToolPanel } from './AtmosphereToolPanel'
import { MorningMessageToolPanel } from './MorningMessageToolPanel'
import { TodayPrepToolPanel } from './TodayPrepToolPanel'
import { CurriculumSyncToolPanel } from './CurriculumSyncToolPanel'
import { MaterialsToolPanel } from './MaterialsToolPanel'
import { DisplayToolPanel } from './DisplayToolPanel'
import { DisplayComposerToolPanel } from './DisplayComposerToolPanel'
import { OmniNoteToolPanel } from './OmniNoteToolPanel'
import { MysteryStarToolPanel, QuickPickerToolPanel } from './StudentPickerToolPanels'
import { PrizeBoardToolPanel } from './PrizeBoardToolPanel'
import { RandomNumberToolPanel } from './RandomNumberToolPanel'
import { LottoBoardToolPanel } from './LottoBoardToolPanel'
import { JobsToolPanel } from './JobsToolPanel'
import { NoiseToolPanel } from './NoiseToolPanel'
import { BoardControlToolPanel } from './BoardControlToolPanel'

/** Maps tool ids to panel components — only the active tool mounts. */
export const TOOL_PANEL_COMPONENTS: Record<ToolId, ComponentType> = {
  dashboard: DashboardToolPanel,
  timers: TimersToolPanel,
  'classroom-atmosphere': AtmosphereToolPanel,
  'morning-message': MorningMessageToolPanel,
  'today-prep': TodayPrepToolPanel,
  'curriculum-sync': CurriculumSyncToolPanel,
  materials: MaterialsToolPanel,
  display: DisplayToolPanel,
  'display-composer': DisplayComposerToolPanel,
  omninote: OmniNoteToolPanel,
  'mystery-star': MysteryStarToolPanel,
  'quick-picker': QuickPickerToolPanel,
  'prize-board': PrizeBoardToolPanel,
  'random-number': RandomNumberToolPanel,
  'lotto-board': LottoBoardToolPanel,
  jobs: JobsToolPanel,
  noise: NoiseToolPanel,
  'board-control': BoardControlToolPanel,
}

export function getToolPanelComponent(toolId: ToolId): ComponentType | null {
  return TOOL_PANEL_COMPONENTS[toolId] ?? null
}
