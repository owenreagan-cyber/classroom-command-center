import type { PressYourLuckState } from './types'
import { usePressYourLuckStore } from './pressYourLuckStore'

/** Dev/E2E hooks — imported from main.tsx in development only. */
if (import.meta.env.DEV && typeof window !== 'undefined') {
  const w = window as unknown as {
    __setPylState?: (partial: Partial<PressYourLuckState>) => void
    __getPylState?: () => PressYourLuckState
  }
  w.__setPylState = (partial) => {
    usePressYourLuckStore.setState(partial)
  }
  w.__getPylState = () => usePressYourLuckStore.getState()
}
