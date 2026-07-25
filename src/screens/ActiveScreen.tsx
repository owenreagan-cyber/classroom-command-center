import type {
  AppMode,
  ScreenContents,
  ScreenId,
  VibePageId,
  ClassWorkspace,
} from '../data/types'
import { VibePageScreen } from './VibePageScreen'

interface ActiveScreenProps {
  screenId: ScreenId
  activePageId: VibePageId | null
  classWorkspace: ClassWorkspace | undefined
  mode: AppMode
  contents: ScreenContents
  studentDisplay?: boolean
  onContentsChange: (contents: ScreenContents) => void
  onNavigateToPage: (pageId: VibePageId) => void
  onNavigatePrevious: () => void
  onNavigateNext: () => void
  onBeautify?: () => void
  onPreviewClassroom?: () => void
}

export function ActiveScreen(props: ActiveScreenProps) {
  const pages = props.classWorkspace?.pages ?? []
  const activePage = pages.find(p => p.id === props.activePageId) ?? pages[0] ?? null

  return (
    <VibePageScreen
      screenId={props.screenId}
      activePage={activePage}
      pages={pages}
      mode={props.mode}
      studentDisplay={props.studentDisplay ?? false}
      contents={props.contents}
      onContentsChange={props.onContentsChange}
      onNavigateToPage={props.onNavigateToPage}
      onNavigatePrevious={props.onNavigatePrevious}
      onNavigateNext={props.onNavigateNext}
      onBeautify={props.onBeautify}
      onPreviewClassroom={props.onPreviewClassroom}
    />
  )
}
