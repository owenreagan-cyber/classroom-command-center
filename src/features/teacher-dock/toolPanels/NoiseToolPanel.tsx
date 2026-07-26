import { memo } from 'react'
import { NoiseControlPanel } from '../../../board/NoiseControlPanel'
import { useTeacherDockContext } from '../useTeacherDockContext'

export const NoiseToolPanel = memo(function NoiseToolPanel() {
  const { activeScreen, boardState, onNoiseVoiceLevelChange, onResetNoiseTracker } =
    useTeacherDockContext()

  return (
    <NoiseControlPanel
      noiseTrackers={boardState.noiseTrackers}
      activeScreen={activeScreen}
      onVoiceLevelChange={onNoiseVoiceLevelChange}
      onResetTracker={onResetNoiseTracker}
    />
  )
})
