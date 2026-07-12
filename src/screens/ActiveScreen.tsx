import type {
  AppMode,
  CardId,
  NoiseTrackerId,
  NoiseTrackerState,
  ScreenCardVisibility,
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
  cardVisibility: ScreenCardVisibility
  noiseTrackers: Record<NoiseTrackerId, NoiseTrackerState>
  onContentsChange: (contents: ScreenContents) => void
  onNavigateSuggestedScreen: (screenId: ScreenId) => void
  onCardVisibleChange: (screenId: ScreenId, cardId: CardId, visible: boolean) => void
  onNavigateToPage: (pageId: VibePageId) => void
  onNavigatePrevious: () => void
  onNavigateNext: () => void
  onBeautify?: () => void
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
      contents={props.contents}
      cardVisibility={props.cardVisibility}
      noiseTrackers={props.noiseTrackers}
      onContentsChange={props.onContentsChange}
      onNavigateSuggestedScreen={props.onNavigateSuggestedScreen}
      onCardVisibleChange={props.onCardVisibleChange}
      onNavigateToPage={props.onNavigateToPage}
      onNavigatePrevious={props.onNavigatePrevious}
      onNavigateNext={props.onNavigateNext}
      onBeautify={props.onBeautify}
    />
  )
}
