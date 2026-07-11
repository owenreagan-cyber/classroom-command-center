import type {
  AppMode,
  CardId,
  NoiseTrackerId,
  NoiseTrackerState,
  ScreenCardVisibility,
  ScreenContents,
  ScreenId,
} from '../data/types'
import { HomeroomScreen } from './HomeroomScreen'
import { MathScreen } from './MathScreen'
import { ReadingScreen } from './ReadingScreen'
import { ReadyPositionScreen } from './ReadyPositionScreen'
import { SnackLunchScreen } from './SnackLunchScreen'
import { SubjectScreen } from './SubjectScreen'
import { getNoiseTrackerIdForScreen } from '../lib/noiseTowers'

interface ActiveScreenProps {
  screenId: ScreenId
  mode: AppMode
  contents: ScreenContents
  cardVisibility: ScreenCardVisibility
  noiseTrackers: Record<NoiseTrackerId, NoiseTrackerState>
  onContentsChange: (contents: ScreenContents) => void
  onCardVisibleChange: (
    screenId: ScreenId,
    cardId: CardId,
    visible: boolean,
  ) => void
  onBeautify?: () => void
}

export function ActiveScreen({
  screenId,
  mode,
  contents,
  cardVisibility,
  noiseTrackers,
  onContentsChange,
  onCardVisibleChange,
  onBeautify,
}: ActiveScreenProps) {
  const trackerId = getNoiseTrackerIdForScreen(screenId)
  const noiseTracker = trackerId ? noiseTrackers[trackerId] : undefined

  switch (screenId) {
    case 'homeroom':
      return (
        <HomeroomScreen
          content={contents.homeroom}
          mode={mode}
          cardVisibility={cardVisibility.homeroom}
          noiseTracker={noiseTracker || noiseTrackers.homeroom}
          onContentChange={(homeroom) =>
            onContentsChange({ ...contents, homeroom })
          }
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
          onContentChange={(reading) =>
            onContentsChange({ ...contents, reading })
          }
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
          onContentChange={(writing) =>
            onContentsChange({ ...contents, writing })
          }
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
          onContentChange={(science) =>
            onContentsChange({ ...contents, science })
          }
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
          onContentChange={(socialStudies) =>
            onContentsChange({ ...contents, 'social-studies': socialStudies })
          }
          onCardVisibleChange={onCardVisibleChange}
          onBeautify={onBeautify}
        />
      )
    case 'intervention':
      return (
        <SubjectScreen
          content={contents.intervention}
          screenId="intervention"
          mode={mode}
          cardVisibility={cardVisibility.intervention}
          noiseTracker={noiseTracker}
          onContentChange={(intervention) =>
            onContentsChange({ ...contents, intervention })
          }
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
          onContentChange={(assessment) =>
            onContentsChange({ ...contents, assessment })
          }
          onCardVisibleChange={onCardVisibleChange}
          onBeautify={onBeautify}
        />
      )
    case 'flexible-groups':
      return (
        <SubjectScreen
          content={contents['flexible-groups']}
          screenId="flexible-groups"
          mode={mode}
          cardVisibility={cardVisibility['flexible-groups']}
          noiseTracker={noiseTracker}
          onContentChange={(flexibleGroups) =>
            onContentsChange({ ...contents, 'flexible-groups': flexibleGroups })
          }
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
          onContentChange={(centers) =>
            onContentsChange({ ...contents, centers })
          }
          onCardVisibleChange={onCardVisibleChange}
          onBeautify={onBeautify}
        />
      )
    case 'homework-packup':
      return (
        <SubjectScreen
          content={contents['homework-packup']}
          screenId="homework-packup"
          mode={mode}
          cardVisibility={cardVisibility['homework-packup']}
          noiseTracker={noiseTracker}
          onContentChange={(homeworkPackup) =>
            onContentsChange({ ...contents, 'homework-packup': homeworkPackup })
          }
          onCardVisibleChange={onCardVisibleChange}
          onBeautify={onBeautify}
        />
      )
    case 'snack-lunch':
      return (
        <SnackLunchScreen
          content={contents['snack-lunch']}
          mode={mode}
          cardVisibility={cardVisibility['snack-lunch']}
          noiseTracker={noiseTracker}
          onContentChange={(snackLunch) =>
            onContentsChange({ ...contents, 'snack-lunch': snackLunch })
          }
          onCardVisibleChange={onCardVisibleChange}
          onBeautify={onBeautify}
        />
      )
    case 'ready-position':
      return (
        <ReadyPositionScreen
          content={contents['ready-position']}
          mode={mode}
          cardVisibility={cardVisibility['ready-position']}
          noiseTracker={noiseTracker}
          onContentChange={(readyPosition) =>
            onContentsChange({ ...contents, 'ready-position': readyPosition })
          }
          onCardVisibleChange={onCardVisibleChange}
          onBeautify={onBeautify}
        />
      )
  }
}
