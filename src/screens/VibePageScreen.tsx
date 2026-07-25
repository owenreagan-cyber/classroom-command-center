import type { VibePage, AppMode, ScreenContents, ScreenId, VibePageId } from '../data/types'
import { PageNavigation } from '../components/routines/PageNavigation'
import { StudioCanvas } from '../features/studio-canvas/StudioCanvas'
import { ClassroomCanvas } from '../features/studio-canvas/ClassroomCanvas'

interface VibePageScreenProps {
  screenId: ScreenId
  activePage: VibePage | null
  pages: VibePage[]
  mode: AppMode
  studentDisplay: boolean
  contents: ScreenContents
  onContentsChange: (contents: ScreenContents) => void
  onNavigateToPage: (pageId: VibePageId) => void
  onNavigatePrevious: () => void
  onNavigateNext: () => void
  onBeautify?: () => void
  onPreviewClassroom?: () => void
}

export function VibePageScreen({
  screenId,
  activePage,
  pages,
  mode,
  studentDisplay,
  contents,
  onContentsChange,
  onNavigateToPage,
  onNavigatePrevious,
  onNavigateNext,
  onBeautify,
  onPreviewClassroom,
}: VibePageScreenProps) {
  const isDisplay = mode === 'display'
  const showPageControls = !studentDisplay

  if (!activePage) {
    return <div className="text-white p-8">No page selected</div>
  }

  if (isDisplay) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-2">
        <PageNavigation
          pages={pages}
          activePageId={activePage.id}
          showControls={showPageControls}
          onNavigateToPage={onNavigateToPage}
          onNavigatePrevious={onNavigatePrevious}
          onNavigateNext={onNavigateNext}
        />
        <div key={activePage.id} className="vibe-page-transition flex-1 min-h-0">
          <ClassroomCanvas screenId={screenId} page={activePage} contents={contents} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <PageNavigation
        pages={pages}
        activePageId={activePage.id}
        showControls={showPageControls}
        onNavigateToPage={onNavigateToPage}
        onNavigatePrevious={onNavigatePrevious}
        onNavigateNext={onNavigateNext}
      />
      <div className="mb-1 px-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300/70">
          Page {pages.findIndex((p) => p.id === activePage.id) + 1} of {pages.length}
        </p>
      </div>
      <div className="flex-1 min-h-0">
        <StudioCanvas
          key={`${screenId}-${activePage.id}`}
          screenId={screenId}
          page={activePage}
          contents={contents}
          onContentsChange={onContentsChange}
          onBeautify={onBeautify}
          onPreviewClassroom={onPreviewClassroom}
        />
      </div>
    </div>
  )
}
