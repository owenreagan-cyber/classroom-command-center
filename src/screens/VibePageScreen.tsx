import type { VibePage, AppMode, ScreenContents, ScreenId, VibePageId, ScreenCardVisibility, NoiseTrackerState, NoiseTrackerId, CardId } from '../data/types'
import { HomeroomScreen } from './HomeroomScreen'
import { MathScreen } from './MathScreen'
import { ReadingScreen } from './ReadingScreen'
import { ReadyPositionScreen } from './ReadyPositionScreen'
import { SubjectScreen } from './SubjectScreen'
import { SnackLunchDisplayView } from './SnackLunchDisplayView'
import { getNoiseTrackerIdForScreen } from '../lib/noiseTowers'
import { PageNavigation } from '../components/routines/PageNavigation'

/** Map layout presets to CSS classes for the slide container */
function layoutPresetClass(preset: string): string {
  switch (preset) {
    case 'centered-message':
      return 'flex flex-col items-center justify-center text-center px-8'
    case 'message-plus-timer':
      return 'flex flex-col lg:flex-row items-center justify-center gap-8 px-8 w-full'
    case 'message-plus-materials':
      return 'flex flex-col lg:flex-row items-start justify-center gap-8 px-8 w-full'
    case 'split-content':
      return 'flex flex-col lg:flex-row items-start gap-8 px-8 w-full'
    case 'full-focus':
      return 'flex flex-col items-center justify-center text-center px-8'
    case 'cleanup-checklist':
      return 'flex flex-col items-center justify-center text-center px-8 max-w-2xl mx-auto'
    default:
      return 'flex flex-col items-center justify-center text-center px-8'
  }
}

interface VibePageScreenProps {
  screenId: ScreenId
  activePage: VibePage | null
  pages: VibePage[]
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

export function VibePageScreen({
  screenId,
  activePage,
  pages,
  mode,
  contents,
  cardVisibility,
  noiseTrackers,
  onContentsChange,
  onNavigateSuggestedScreen,
  onCardVisibleChange,
  onNavigateToPage,
  onNavigatePrevious,
  onNavigateNext,
  onBeautify,
}: VibePageScreenProps) {
  const trackerId = getNoiseTrackerIdForScreen(screenId)
  const noiseTracker = trackerId ? noiseTrackers[trackerId] : undefined

  const renderContent = () => {
    switch (screenId) {
      case 'homeroom':
        return (
          <HomeroomScreen
            content={contents.homeroom}
            mode={mode}
            cardVisibility={cardVisibility.homeroom}
            noiseTracker={noiseTracker || noiseTrackers.homeroom}
            onNavigateSuggestedScreen={onNavigateSuggestedScreen}
            onContentChange={(homeroom) => onContentsChange({ ...contents, homeroom })}
            onCardVisibleChange={onCardVisibleChange}
            onBeautify={onBeautify}
          />
        )
      case 'math':
        return (
          <MathScreen
            content={contents.math}
            mode={mode}
            cardVisibility={cardVisibility.math}
            noiseTracker={noiseTracker || noiseTrackers.math}
            onContentChange={(math) => onContentsChange({ ...contents, math })}
            onCardVisibleChange={onCardVisibleChange}
            onBeautify={onBeautify}
          />
        )
      case 'reading':
        return (
          <ReadingScreen
            content={contents.reading}
            mode={mode}
            cardVisibility={cardVisibility.reading}
            noiseTracker={noiseTracker || noiseTrackers.reading}
            onContentChange={(reading) => onContentsChange({ ...contents, reading })}
            onCardVisibleChange={onCardVisibleChange}
            onBeautify={onBeautify}
          />
        )
      case 'writing':
        return (
          <SubjectScreen
            content={contents.writing}
            screenId="writing"
            mode={mode}
            cardVisibility={cardVisibility.writing}
            noiseTracker={noiseTracker}
            onContentChange={(writing) => onContentsChange({ ...contents, writing })}
            onCardVisibleChange={onCardVisibleChange}
            onBeautify={onBeautify}
          />
        )
      case 'science':
        return (
          <SubjectScreen
            content={contents.science}
            screenId="science"
            mode={mode}
            cardVisibility={cardVisibility.science}
            noiseTracker={noiseTracker}
            onContentChange={(science) => onContentsChange({ ...contents, science })}
            onCardVisibleChange={onCardVisibleChange}
            onBeautify={onBeautify}
          />
        )
      case 'social-studies':
        return (
          <SubjectScreen
            content={contents['social-studies']}
            screenId="social-studies"
            mode={mode}
            cardVisibility={cardVisibility['social-studies']}
            noiseTracker={noiseTracker}
            onContentChange={(ss) => onContentsChange({ ...contents, 'social-studies': ss })}
            onCardVisibleChange={onCardVisibleChange}
            onBeautify={onBeautify}
          />
        )
      case 'assessment':
        return (
          <SubjectScreen
            content={contents.assessment}
            screenId="assessment"
            mode={mode}
            cardVisibility={cardVisibility.assessment}
            noiseTracker={noiseTracker}
            onContentChange={(a) => onContentsChange({ ...contents, assessment: a })}
            onCardVisibleChange={onCardVisibleChange}
            onBeautify={onBeautify}
          />
        )
      case 'centers':
        return (
          <SubjectScreen
            content={contents.centers}
            screenId="centers"
            mode={mode}
            cardVisibility={cardVisibility.centers}
            noiseTracker={noiseTracker}
            onContentChange={(c) => onContentsChange({ ...contents, centers: c })}
            onCardVisibleChange={onCardVisibleChange}
            onBeautify={onBeautify}
          />
        )
      case 'snack':
        return (
          <SnackLunchDisplayView
            content={contents.snack}
            snackKind="snack"
            mode={mode}
            cardVisibility={cardVisibility.snack}
            noiseTracker={noiseTracker}
            onContentChange={(snack) => onContentsChange({ ...contents, snack })}
            onCardVisibleChange={onCardVisibleChange}
            onBeautify={onBeautify}
          />
        )
      case 'lunch':
        return (
          <SnackLunchDisplayView
            content={contents.lunch}
            snackKind="lunch"
            mode={mode}
            cardVisibility={cardVisibility.lunch}
            noiseTracker={noiseTracker}
            onContentChange={(lunch) => onContentsChange({ ...contents, lunch })}
            onCardVisibleChange={onCardVisibleChange}
            onBeautify={onBeautify}
          />
        )
      case 'recess':
        return (
          <ReadyPositionScreen
            screenId="recess"
            content={contents.recess}
            mode={mode}
            cardVisibility={cardVisibility.recess}
            noiseTracker={noiseTracker}
            onContentChange={(recess) => onContentsChange({ ...contents, recess })}
            onCardVisibleChange={onCardVisibleChange}
            onBeautify={onBeautify}
          />
        )
      case 'homework':
        return (
          <SubjectScreen
            content={contents.homework}
            screenId="homework"
            mode={mode}
            cardVisibility={cardVisibility.homework}
            noiseTracker={noiseTracker}
            onContentChange={(hw) => onContentsChange({ ...contents, homework: hw })}
            onCardVisibleChange={onCardVisibleChange}
            onBeautify={onBeautify}
          />
        )
      case 'pack-up':
        return (
          <SubjectScreen
            content={contents['pack-up']}
            screenId="pack-up"
            mode={mode}
            cardVisibility={cardVisibility['pack-up']}
            noiseTracker={noiseTracker}
            onContentChange={(pu) => onContentsChange({ ...contents, 'pack-up': pu })}
            onCardVisibleChange={onCardVisibleChange}
            onBeautify={onBeautify}
          />
        )
      case 'spelling':
        return (
          <SubjectScreen
            content={contents.spelling}
            screenId="spelling"
            mode={mode}
            cardVisibility={cardVisibility.spelling}
            noiseTracker={noiseTracker}
            onContentChange={(s) => onContentsChange({ ...contents, spelling: s })}
            onCardVisibleChange={onCardVisibleChange}
            onBeautify={onBeautify}
          />
        )
      case 'ready-position':
        return (
          <ReadyPositionScreen
            screenId="ready-position"
            content={contents['ready-position']}
            mode={mode}
            cardVisibility={cardVisibility['ready-position']}
            noiseTracker={noiseTracker}
            onContentChange={(rp) => onContentsChange({ ...contents, 'ready-position': rp })}
            onCardVisibleChange={onCardVisibleChange}
            onBeautify={onBeautify}
          />
        )
      default:
        return <div className="text-white p-8">Unknown screen: {screenId}</div>
    }
  }

  const isDisplay = mode === 'display'

  // In display mode, render a clean slide view based on the active page
  if (isDisplay) {
    if (!activePage) {
      return <div className="text-white p-8">No page selected</div>
    }

    const layoutPreset = activePage.layoutPreset

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
        <div className="flex-1 min-h-0 flex items-center justify-center">
          <div className={layoutPresetClass(layoutPreset)} role="region" aria-label={activePage.title}>
            {/* Primary message - large and centered */}
            <div className="slide-primary-message">
              <p className="text-sm font-semibold uppercase tracking-widest text-cyan-300/70 mb-2">
                {activePage.title}
              </p>
              <p className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-white max-w-2xl">
                {activePage.primaryMessage}
              </p>
              {activePage.subtitle && (
                <p className="mt-3 text-lg md:text-xl text-white/70 max-w-xl">
                  {activePage.subtitle}
                </p>
              )}
            </div>

            {/* Supporting content */}
            {activePage.supportingContent && activePage.supportingContent.length > 0 && layoutPreset !== 'full-focus' && (
              <div className="slide-supporting mt-4">
                <ul className="space-y-2">
                  {activePage.supportingContent.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-white/80 text-base">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400/60" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      {!isDisplay && (
        <PageNavigation
          pages={pages}
          activePageId={activePage?.id ?? null}
          mode={mode}
          onNavigateToPage={onNavigateToPage}
          onNavigatePrevious={onNavigatePrevious}
          onNavigateNext={onNavigateNext}
        />
      )}
      <div className="flex-1 min-h-0">
        {activePage && !isDisplay && (
          <div className="mb-2 px-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300/70">
              Page {pages.findIndex(p => p.id === activePage.id) + 1} of {pages.length}
            </p>
          </div>
        )}
        {renderContent()}
      </div>
    </div>
  )
}
