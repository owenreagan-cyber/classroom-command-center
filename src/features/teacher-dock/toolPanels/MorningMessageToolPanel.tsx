import { memo } from 'react'
import { MorningMessageStudioPanel } from '../../morning-message/MorningMessageStudioPanel'
import { useTeacherDockContext } from '../useTeacherDockContext'

export const MorningMessageToolPanel = memo(function MorningMessageToolPanel() {
  const { activeScreen, activePageId, classWorkspaces } = useTeacherDockContext()

  return (
    <MorningMessageStudioPanel
      activeScreen={activeScreen}
      activePageId={activePageId}
      classWorkspaces={classWorkspaces}
    />
  )
})
