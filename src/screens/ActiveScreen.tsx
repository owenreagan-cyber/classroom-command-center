import type { AppMode, ScreenContents, ScreenId } from '../data/types'
import { HomeroomScreen } from './HomeroomScreen'
import { MathScreen } from './MathScreen'
import { ReadingScreen } from './ReadingScreen'
import { ReadyPositionScreen } from './ReadyPositionScreen'
import { SnackLunchScreen } from './SnackLunchScreen'

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
