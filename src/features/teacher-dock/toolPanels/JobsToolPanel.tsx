import { memo } from 'react'
import { DailyBriefPanel } from '../../../board/DailyBriefPanel'
import { useTeacherDockContext } from '../useTeacherDockContext'

export const JobsToolPanel = memo(function JobsToolPanel() {
  const { activeScreen, boardState, onContentsChange, onNoiseVoiceLevelChange } =
    useTeacherDockContext()

  return (
    <DailyBriefPanel
      activeScreen={activeScreen}
      contents={boardState.contents}
      onContentsChange={onContentsChange}
      onNoiseVoiceLevelChange={onNoiseVoiceLevelChange}
    />
  )
})
