import { ActiveScreen } from '../screens/ActiveScreen'
import { useBoardStore } from '../store/boardStore'
import { BoardFrame } from '../board/BoardFrame'
import type { AppMode } from '../data/types'

interface BoardWorkspaceProps {
  effectiveMode: AppMode
  studentDisplay: boolean
  onEnterEdit?: () => void
  onBeautify?: () => void
  onPreviewClassroom?: () => void
}

export function BoardWorkspace({
  effectiveMode,
  studentDisplay,
  onEnterEdit,
  onBeautify,
  onPreviewClassroom,
}: BoardWorkspaceProps) {
  const activeScreen = useBoardStore((state) => state.activeScreen)
  const activePageId = useBoardStore((state) => state.activePageId)
  const classWorkspaces = useBoardStore((state) => state.classWorkspaces)
  const backgroundId = useBoardStore((state) => state.backgroundId)
  const contents = useBoardStore((state) => state.contents)
  const setActivePageId = useBoardStore((state) => state.setActivePageId)
  const navigateToPreviousPage = useBoardStore((state) => state.navigateToPreviousPage)
  const navigateToNextPage = useBoardStore((state) => state.navigateToNextPage)
  const updateContents = useBoardStore((state) => state.updateContents)

  const classWorkspace = classWorkspaces[activeScreen]

  return (
    <BoardFrame
      mode={effectiveMode}
      activeScreen={activeScreen}
      backgroundId={backgroundId}
      studentDisplay={studentDisplay}
      onEnterEdit={onEnterEdit}
    >
      <ActiveScreen
        screenId={activeScreen}
        activePageId={activePageId}
        classWorkspace={classWorkspace}
        mode={effectiveMode}
        studentDisplay={studentDisplay}
        contents={contents}
        onContentsChange={updateContents}
        onNavigateToPage={setActivePageId}
        onNavigatePrevious={navigateToPreviousPage}
        onNavigateNext={navigateToNextPage}
        onBeautify={onBeautify}
        onPreviewClassroom={onPreviewClassroom}
      />
    </BoardFrame>
  )
}
