import type { AppMode, ScreenContents, ScreenId } from '../data/types'
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
  onBeautify?: () => void
}

export function ActiveScreen({
  screenId,
  mode,
  contents,
  onBeautify,
}: ActiveScreenProps) {
  switch (screenId) {
    case 'homeroom':
      return (
        <HomeroomScreen
          content={contents.homeroom}
          mode={mode}
          onBeautify={onBeautify}
        />
      )
    case 'math':
      return (
        <MathScreen content={contents.math} mode={mode} onBeautify={onBeautify} />
      )
    case 'reading':
      return (
        <ReadingScreen
          content={contents.reading}
          mode={mode}
          onBeautify={onBeautify}
        />
      )
    case 'snack-lunch':
      return (
        <SnackLunchScreen
          content={contents['snack-lunch']}
          mode={mode}
          onBeautify={onBeautify}
        />
      )
    case 'writing':
      return (
        <SubjectScreen
          content={contents.writing}
          mode={mode}
          onBeautify={onBeautify}
        />
      )
    case 'science':
      return (
        <SubjectScreen
          content={contents.science}
          mode={mode}
          onBeautify={onBeautify}
        />
      )
    case 'social-studies':
      return (
        <SubjectScreen
          content={contents['social-studies']}
          mode={mode}
          onBeautify={onBeautify}
        />
      )
    case 'intervention':
      return (
        <SubjectScreen
          content={contents.intervention}
          mode={mode}
          onBeautify={onBeautify}
        />
      )
    case 'assessment':
      return (
        <SubjectScreen
          content={contents.assessment}
          mode={mode}
          onBeautify={onBeautify}
        />
      )
    case 'flexible-groups':
      return (
        <SubjectScreen
          content={contents['flexible-groups']}
          mode={mode}
          onBeautify={onBeautify}
        />
      )
    case 'centers':
      return (
        <SubjectScreen
          content={contents.centers}
          mode={mode}
          onBeautify={onBeautify}
        />
      )
    case 'homework-packup':
      return (
        <SubjectScreen
          content={contents['homework-packup']}
          mode={mode}
          onBeautify={onBeautify}
        />
      )
    case 'ready-position':
      return (
        <ReadyPositionScreen
          content={contents['ready-position']}
          mode={mode}
          onBeautify={onBeautify}
        />
      )
  }
}
