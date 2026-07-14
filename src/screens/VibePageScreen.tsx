import type { VibePage, AppMode, ScreenContents, ScreenId, VibePageId } from '../data/types'
import { PageNavigation } from '../components/routines/PageNavigation'
import { StudioCanvas } from '../features/studio-canvas/StudioCanvas'
import { ClassroomCanvas } from '../features/studio-canvas/ClassroomCanvas'

interface VibePageScreenProps {
  screenId: ScreenId
  activePage: VibePage | null
  pages: VibePage[]
  mode: AppMode
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
  contents,
  onContentsChange,
  onNavigateToPage,
  onNavigatePrevious,
  onNavigateNext,
  onBeautify,
  onPreviewClassroom,
}: VibePageScreenProps) {
  const isDisplay = mode === 'display'

  if (!activePage) {
    return <div className="text-white p-8">No page selected</div>
  }

  // Classroom Mode: clean, student-facing render of the persisted widget
  // geometry. No grid, drag handles, selection, alignment guides,
  // toolbar, or page-editing chrome inside the canvas itself.
  if (isDisplay) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-2">
        <PageNavigation
          pages={pages}
          activePageId={activePage.id}
          mode={mode}
          onNavigateToPage={onNavigateToPage}
          onNavigatePrevious={onNavigatePrevious}
          onNavigateNext={onNavigateNext}
        />
        <div className="flex-1 min-h-0">
          <ClassroomCanvas screenId={screenId} page={activePage} contents={contents} />
        </div>
      </div>
    )
  }

  // Studio Mode: the dedicated authoring canvas replaces the old
  // screen-specific dashboard editors.
  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <PageNavigation
        pages={pages}
        activePageId={activePage.id}
        mode={mode}
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
