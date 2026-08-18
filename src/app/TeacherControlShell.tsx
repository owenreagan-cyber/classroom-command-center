import { useMemo } from 'react'
import { useBoardStore } from '../store/boardStore'
import { useTimerStore } from '../store/timerStore'
import { usePickerStore } from '../features/student-picker/pickerStore'
import { TeacherCommandDock } from '../features/teacher-dock/TeacherCommandDock'
import { BoardWorkspace } from './BoardWorkspace'
import { PresentationHub } from '../features/presentation-hub/PresentationHub'
import { DisplayStudio } from '../features/display-studio/DisplayStudio'
import { DisplayStudioUIProvider } from '../features/display-studio/displayStudioContext'
import { TeachModeShell } from './TeachModeShell'
import {
  getEffectiveBoardMode,
  shouldAllowStudioEditActions,
} from './appRouteShell'

/** Teacher control route — delegates to Teach Mode or Editor/Dashboard Mode. */
export function TeacherControlShell() {
  const mode = useBoardStore((state) => state.mode)

  if (mode === 'teach') {
    return <TeachModeShell />
  }

  return <EditorModeShell />
}

/** Full editor/dashboard workspace — dock sidebar, board, and display studio. */
function EditorModeShell() {
  const mode = useBoardStore((state) => state.mode)
  const effectiveMode = getEffectiveBoardMode('control', mode)
  const activeScreen = useBoardStore((state) => state.activeScreen)
  const activePageId = useBoardStore((state) => state.activePageId)
  const classWorkspaces = useBoardStore((state) => state.classWorkspaces)
  const backgroundId = useBoardStore((state) => state.backgroundId)
  const contents = useBoardStore((state) => state.contents)
  const teacherNotes = useBoardStore((state) => state.teacherNotes)
  const todayPrep = useBoardStore((state) => state.todayPrep)
  const morningMessage = useBoardStore((state) => state.morningMessage)
  const cardVisibility = useBoardStore((state) => state.cardVisibility)
  const customPresets = useBoardStore((state) => state.customPresets)
  const noiseTrackers = useBoardStore((state) => state.noiseTrackers)
  const beautifyUndo = useBoardStore((state) => state.beautifyUndo)
  const setMode = useBoardStore((state) => state.setMode)
  const setActiveScreen = useBoardStore((state) => state.setActiveScreen)
  const setBackgroundId = useBoardStore((state) => state.setBackgroundId)
  const setCardVisible = useBoardStore((state) => state.setCardVisible)
  const updateContents = useBoardStore((state) => state.updateContents)
  const applyBoardPreset = useBoardStore((state) => state.applyBoardPreset)
  const saveCustomPreset = useBoardStore((state) => state.saveCustomPreset)
  const applyCustomPreset = useBoardStore((state) => state.applyCustomPreset)
  const deleteCustomPreset = useBoardStore((state) => state.deleteCustomPreset)
  const setNoiseVoiceLevel = useBoardStore((state) => state.setNoiseVoiceLevel)
  const resetNoiseTracker = useBoardStore((state) => state.resetNoiseTracker)
  const beautifyActiveScreen = useBoardStore((state) => state.beautifyActiveScreen)
  const undoBeautify = useBoardStore((state) => state.undoBeautify)
  const resetToDefaults = useBoardStore((state) => state.resetToDefaults)

  const simpleTimers = useTimerStore((state) => state.simpleTimers)
  const phaseTimer = useTimerStore((state) => state.phaseTimer)

  const pickerStudents = usePickerStore((state) => state.students)
  const pickerHistoryEntries = usePickerStore((state) => state.fairnessHistory)
  const pickerCoachingConfig = usePickerStore((state) => state.coachingConfig)
  const pickerSettings = usePickerStore((state) => state.settings)
  const pickerActiveMysterySessions = usePickerStore((state) => state.activeMysterySessions)

  const allowEditActions = shouldAllowStudioEditActions('control', mode)

  const boardState = useMemo(
    () => ({
      mode,
      activeScreen,
      activePageId,
      classWorkspaces,
      backgroundId,
      contents,
      teacherNotes,
      todayPrep,
      morningMessage,
      cardVisibility,
      customPresets,
      noiseTrackers,
    }),
    [
      mode,
      activeScreen,
      activePageId,
      classWorkspaces,
      backgroundId,
      contents,
      teacherNotes,
      todayPrep,
      morningMessage,
      cardVisibility,
      customPresets,
      noiseTrackers,
    ],
  )

  const dockContext = useMemo(
    () => ({
      mode,
      activeScreen,
      activePageId,
      classWorkspaces,
      backgroundId,
      teacherNotes,
      boardState,
      cardVisibility,
      canUndoBeautify: beautifyUndo !== null,
      onModeChange: setMode,
      onScreenChange: setActiveScreen,
      onBackgroundChange: setBackgroundId,
      onApplyPreset: applyBoardPreset,
      onSaveCustomPreset: saveCustomPreset,
      onApplyCustomPreset: applyCustomPreset,
      onDeleteCustomPreset: deleteCustomPreset,
      onContentsChange: updateContents,
      onNoiseVoiceLevelChange: setNoiseVoiceLevel,
      onResetNoiseTracker: resetNoiseTracker,
      onCardVisibleChange: setCardVisible,
      onBeautify: beautifyActiveScreen,
      onUndoBeautify: undoBeautify,
      onReset: resetToDefaults,
      timerSimpleTimers: simpleTimers,
      timerPhaseTimer: phaseTimer,
      pickerStudents,
      pickerHistoryEntries,
      pickerCoachingConfig,
      pickerSettings,
      pickerActiveMysterySessions,
    }),
    [
      mode,
      activeScreen,
      activePageId,
      classWorkspaces,
      backgroundId,
      teacherNotes,
      boardState,
      cardVisibility,
      beautifyUndo,
      setMode,
      setActiveScreen,
      setBackgroundId,
      applyBoardPreset,
      saveCustomPreset,
      applyCustomPreset,
      deleteCustomPreset,
      updateContents,
      setNoiseVoiceLevel,
      resetNoiseTracker,
      setCardVisible,
      beautifyActiveScreen,
      undoBeautify,
      resetToDefaults,
      simpleTimers,
      phaseTimer,
      pickerStudents,
      pickerHistoryEntries,
      pickerCoachingConfig,
      pickerSettings,
      pickerActiveMysterySessions,
    ],
  )

  return (
    <DisplayStudioUIProvider>
      <div className="flex h-dvh w-dvw overflow-hidden bg-slate-950">
        <TeacherCommandDock mode={mode} dockContext={dockContext} />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <PresentationHub
            boardWorkspace={
              <BoardWorkspace
                effectiveMode={effectiveMode}
                studentDisplay={false}
                onEnterEdit={() => setMode('edit')}
                onBeautify={allowEditActions ? beautifyActiveScreen : undefined}
                onPreviewClassroom={allowEditActions ? () => setMode('display') : undefined}
              />
            }
          />
        </div>
        <DisplayStudio />
      </div>
    </DisplayStudioUIProvider>
  )
}
