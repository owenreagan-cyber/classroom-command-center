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
  const beautifyUndo = useBoardStore((state) => state.beautifyUndo)
  const setMode = useBoardStore((state) => state.setMode)
  const setActiveScreen = useBoardStore((state) => state.setActiveScreen)
  const setBackgroundId = useBoardStore((state) => state.setBackgroundId)
  const setCardVisible = useBoardStore((state) => state.setCardVisible)
  const beautifyActiveScreen = useBoardStore((state) => state.beautifyActiveScreen)
  const undoBeautify = useBoardStore((state) => state.undoBeautify)
  const resetToDefaults = useBoardStore((state) => state.resetToDefaults)

  return (
    <div className="flex h-dvh w-dvw overflow-hidden bg-slate-950">
      <TeacherDock
        mode={mode}
        activeScreen={activeScreen}
        backgroundId={backgroundId}
        teacherNotes={teacherNotes}
        cardVisibility={cardVisibility}
        canUndoBeautify={beautifyUndo !== null}
        onModeChange={setMode}
        onScreenChange={setActiveScreen}
        onBackgroundChange={setBackgroundId}
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
          onBeautify={mode === 'edit' ? beautifyActiveScreen : undefined}
        />
      </BoardFrame>
    </div>
  )
}
