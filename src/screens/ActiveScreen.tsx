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
  onBeautify?: () => void
}

export function ActiveScreen({
  screenId,
  mode,
  contents,
  cardVisibility,
  onBeautify,
}: ActiveScreenProps) {
  switch (screenId) {
    case 'homeroom':
      return (
        <HomeroomScreen
          content={contents.homeroom}
          mode={mode}
          cardVisibility={cardVisibility.homeroom}
          onBeautify={onBeautify}
        />
      )
    case 'math':
      return (
        <MathScreen
          content={contents.math}
          mode={mode}
          cardVisibility={cardVisibility.math}
          onBeautify={onBeautify}
        />
      )
    case 'reading':
      return (
        <ReadingScreen
          content={contents.reading}
          mode={mode}
          cardVisibility={cardVisibility.reading}
          onBeautify={onBeautify}
        />
      )
    case 'writing':
      return (
        <SubjectScreen
          content={contents.writing}
          mode={mode}
          cardVisibility={cardVisibility.writing}
          onBeautify={onBeautify}
        />
      )
    case 'science':
      return (
        <SubjectScreen
          content={contents.science}
          mode={mode}
          cardVisibility={cardVisibility.science}
          onBeautify={onBeautify}
        />
      )
    case 'social-studies':
      return (
        <SubjectScreen
          content={contents['social-studies']}
          mode={mode}
          cardVisibility={cardVisibility['social-studies']}
          onBeautify={onBeautify}
        />
      )
    case 'intervention':
      return (
        <SubjectScreen
          content={contents.intervention}
          mode={mode}
          cardVisibility={cardVisibility.intervention}
          onBeautify={onBeautify}
        />
      )
    case 'assessment':
      return (
        <SubjectScreen
          content={contents.assessment}
          mode={mode}
          cardVisibility={cardVisibility.assessment}
          onBeautify={onBeautify}
        />
      )
    case 'flexible-groups':
      return (
        <SubjectScreen
          content={contents['flexible-groups']}
          mode={mode}
          cardVisibility={cardVisibility['flexible-groups']}
          onBeautify={onBeautify}
        />
      )
    case 'centers':
      return (
        <SubjectScreen
          content={contents.centers}
          mode={mode}
          cardVisibility={cardVisibility.centers}
          onBeautify={onBeautify}
        />
      )
    case 'homework-packup':
      return (
        <SubjectScreen
          content={contents['homework-packup']}
          mode={mode}
          cardVisibility={cardVisibility['homework-packup']}
          onBeautify={onBeautify}
        />
      )
    case 'snack-lunch':
      return (
        <SnackLunchScreen
          content={contents['snack-lunch']}
          mode={mode}
          cardVisibility={cardVisibility['snack-lunch']}
          onBeautify={onBeautify}
        />
      )
    case 'ready-position':
      return (
        <ReadyPositionScreen
          content={contents['ready-position']}
          mode={mode}
          cardVisibility={cardVisibility['ready-position']}
          onBeautify={onBeautify}
        />
      )
  }
}
