import type {
  AppMode,
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

interface ActiveScreenProps {
  screenId: ScreenId
  mode: AppMode
  contents: ScreenContents
  cardVisibility: ScreenCardVisibility
  onContentsChange: (contents: ScreenContents) => void
  onBeautify?: () => void
}

export function ActiveScreen({
  screenId,
  mode,
  contents,
  cardVisibility,
  onContentsChange,
  onBeautify,
}: ActiveScreenProps) {
  switch (screenId) {
    case 'homeroom':
      return (
        <HomeroomScreen
          content={contents.homeroom}
          mode={mode}
          cardVisibility={cardVisibility.homeroom}
          onContentChange={(homeroom) =>
            onContentsChange({ ...contents, homeroom })
          }
          onBeautify={onBeautify}
        />
      )
    case 'math':
      return (
        <MathScreen
          content={contents.math}
          mode={mode}
          cardVisibility={cardVisibility.math}
          onContentChange={(math) => onContentsChange({ ...contents, math })}
          onBeautify={onBeautify}
        />
      )
    case 'reading':
      return (
        <ReadingScreen
          content={contents.reading}
          mode={mode}
          cardVisibility={cardVisibility.reading}
          onContentChange={(reading) =>
            onContentsChange({ ...contents, reading })
          }
          onBeautify={onBeautify}
        />
      )
    case 'writing':
      return (
        <SubjectScreen
          content={contents.writing}
          mode={mode}
          cardVisibility={cardVisibility.writing}
          onContentChange={(writing) =>
            onContentsChange({ ...contents, writing })
          }
          onBeautify={onBeautify}
        />
      )
    case 'science':
      return (
        <SubjectScreen
          content={contents.science}
          mode={mode}
          cardVisibility={cardVisibility.science}
          onContentChange={(science) =>
            onContentsChange({ ...contents, science })
          }
          onBeautify={onBeautify}
        />
      )
    case 'social-studies':
      return (
        <SubjectScreen
          content={contents['social-studies']}
          mode={mode}
          cardVisibility={cardVisibility['social-studies']}
          onContentChange={(socialStudies) =>
            onContentsChange({ ...contents, 'social-studies': socialStudies })
          }
          onBeautify={onBeautify}
        />
      )
    case 'intervention':
      return (
        <SubjectScreen
          content={contents.intervention}
          mode={mode}
          cardVisibility={cardVisibility.intervention}
          onContentChange={(intervention) =>
            onContentsChange({ ...contents, intervention })
          }
          onBeautify={onBeautify}
        />
      )
    case 'assessment':
      return (
        <SubjectScreen
          content={contents.assessment}
          mode={mode}
          cardVisibility={cardVisibility.assessment}
          onContentChange={(assessment) =>
            onContentsChange({ ...contents, assessment })
          }
          onBeautify={onBeautify}
        />
      )
    case 'flexible-groups':
      return (
        <SubjectScreen
          content={contents['flexible-groups']}
          mode={mode}
          cardVisibility={cardVisibility['flexible-groups']}
          onContentChange={(flexibleGroups) =>
            onContentsChange({ ...contents, 'flexible-groups': flexibleGroups })
          }
          onBeautify={onBeautify}
        />
      )
    case 'centers':
      return (
        <SubjectScreen
          content={contents.centers}
          mode={mode}
          cardVisibility={cardVisibility.centers}
          onContentChange={(centers) =>
            onContentsChange({ ...contents, centers })
          }
          onBeautify={onBeautify}
        />
      )
    case 'homework-packup':
      return (
        <SubjectScreen
          content={contents['homework-packup']}
          mode={mode}
          cardVisibility={cardVisibility['homework-packup']}
          onContentChange={(homeworkPackup) =>
            onContentsChange({ ...contents, 'homework-packup': homeworkPackup })
          }
          onBeautify={onBeautify}
        />
      )
    case 'snack-lunch':
      return (
        <SnackLunchScreen
          content={contents['snack-lunch']}
          mode={mode}
          cardVisibility={cardVisibility['snack-lunch']}
          onContentChange={(snackLunch) =>
            onContentsChange({ ...contents, 'snack-lunch': snackLunch })
          }
          onBeautify={onBeautify}
        />
      )
    case 'ready-position':
      return (
        <ReadyPositionScreen
          content={contents['ready-position']}
          mode={mode}
          cardVisibility={cardVisibility['ready-position']}
          onContentChange={(readyPosition) =>
            onContentsChange({ ...contents, 'ready-position': readyPosition })
          }
          onBeautify={onBeautify}
        />
      )
  }
}
