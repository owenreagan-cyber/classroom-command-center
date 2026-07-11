import { ActiveScreen } from '../screens/ActiveScreen'
import { useBoardStore } from '../store/boardStore'
import { BoardFrame } from '../board/BoardFrame'
import { TeacherDock } from '../board/TeacherDock'

export function AppShell() {
  const mode = useBoardStore((state) => state.mode)
  const activeScreen = useBoardStore((state) => state.activeScreen)
  const backgroundId = useBoardStore((state) => state.backgroundId)
  const contents = useBoardStore((state) => state.contents)
  const teacherNotes = useBoardStore((state) => state.teacherNotes)
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
  const importBoardState = useBoardStore((state) => state.importBoardState)
  const setNoiseVoiceLevel = useBoardStore((state) => state.setNoiseVoiceLevel)
  const resetNoiseTracker = useBoardStore((state) => state.resetNoiseTracker)
  const beautifyActiveScreen = useBoardStore((state) => state.beautifyActiveScreen)
  const undoBeautify = useBoardStore((state) => state.undoBeautify)
  const resetToDefaults = useBoardStore((state) => state.resetToDefaults)

  const boardState = {
    mode,
    activeScreen,
    backgroundId,
    contents,
    teacherNotes,
    cardVisibility,
    customPresets,
    noiseTrackers,
  }

  return (
    <div className="flex h-dvh w-dvw overflow-hidden bg-slate-950">
      <TeacherDock
        mode={mode}
        activeScreen={activeScreen}
        backgroundId={backgroundId}
        teacherNotes={teacherNotes}
        boardState={boardState}
        cardVisibility={cardVisibility}
        canUndoBeautify={beautifyUndo !== null}
        onModeChange={setMode}
        onScreenChange={setActiveScreen}
        onBackgroundChange={setBackgroundId}
        onApplyPreset={applyBoardPreset}
        onSaveCustomPreset={saveCustomPreset}
        onApplyCustomPreset={applyCustomPreset}
        onDeleteCustomPreset={deleteCustomPreset}
        onImportBoardState={importBoardState}
        onNoiseVoiceLevelChange={setNoiseVoiceLevel}
        onResetNoiseTracker={resetNoiseTracker}
        onCardVisibleChange={setCardVisible}
        onBeautify={beautifyActiveScreen}
        onUndoBeautify={undoBeautify}
        onReset={resetToDefaults}
      />
      <BoardFrame
        mode={mode}
        activeScreen={activeScreen}
        backgroundId={backgroundId}
        onEnterEdit={() => setMode('edit')}
      >
        <ActiveScreen
          screenId={activeScreen}
          mode={mode}
          contents={contents}
          cardVisibility={cardVisibility}
          noiseTrackers={noiseTrackers}
          onContentsChange={updateContents}
          onCardVisibleChange={setCardVisible}
          onBeautify={mode === 'edit' ? beautifyActiveScreen : undefined}
        />
      </BoardFrame>
    </div>
  )
}
