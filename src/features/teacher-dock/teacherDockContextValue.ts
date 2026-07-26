import { createContext } from 'react'
import type { SimpleTimerState, SimpleTimerScreenId, PhaseTimerState } from '../../data/timerTypes'
import type {
  Student,
  PickerClassId,
  MysterySession,
  FairnessEntry,
  CoachingState,
  PickerSettings,
} from '../student-picker/types'
import type {
  AppMode,
  BackgroundAssetId,
  BoardPresetId,
  BoardState,
  CardId,
  NoiseTrackerId,
  VoiceLevel,
  ScreenCardVisibility,
  ScreenId,
  ScreenContents,
  TeacherNote,
  VibePageId,
} from '../../data/types'
import type { ToolId } from './types'

export interface TeacherDockContextValue {
  mode: AppMode
  activeScreen: ScreenId
  activePageId: VibePageId | null
  classWorkspaces: BoardState['classWorkspaces']
  backgroundId: BackgroundAssetId
  teacherNotes: TeacherNote[]
  boardState: BoardState
  cardVisibility: ScreenCardVisibility
  canUndoBeautify: boolean
  onModeChange: (mode: AppMode) => void
  onScreenChange: (screen: ScreenId) => void
  onBackgroundChange: (backgroundId: BackgroundAssetId) => void
  onApplyPreset: (presetId: BoardPresetId) => void
  onSaveCustomPreset: (label: string) => void
  onApplyCustomPreset: (presetId: string) => void
  onDeleteCustomPreset: (presetId: string) => void
  onContentsChange: (contents: ScreenContents) => void
  onNoiseVoiceLevelChange: (trackerId: NoiseTrackerId, voiceLevel: VoiceLevel) => void
  onResetNoiseTracker: (trackerId: NoiseTrackerId) => void
  onCardVisibleChange: (screenId: ScreenId, cardId: CardId, visible: boolean) => void
  onBeautify: () => void
  onUndoBeautify: () => void
  onReset: () => void
  onActivateTool: (toolId: ToolId) => void
  timerSimpleTimers: Record<SimpleTimerScreenId, SimpleTimerState>
  timerPhaseTimer: PhaseTimerState
  pickerStudents: Student[]
  pickerHistoryEntries: FairnessEntry[]
  pickerCoachingConfig: CoachingState
  pickerSettings: PickerSettings
  pickerActiveMysterySessions: Record<PickerClassId, MysterySession | null>
}

export const TeacherDockContext = createContext<TeacherDockContextValue | null>(null)
