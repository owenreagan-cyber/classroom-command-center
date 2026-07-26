import { memo } from 'react'
import { TodayPrepPanel } from '../../../board/TodayPrepPanel'
import { useTeacherDockContext } from '../useTeacherDockContext'

export const TodayPrepToolPanel = memo(function TodayPrepToolPanel() {
  const { activeScreen, activePageId, classWorkspaces } = useTeacherDockContext()

  return (
    <TodayPrepPanel
      activeScreen={activeScreen}
      activePageId={activePageId}
      classWorkspaces={classWorkspaces}
    />
  )
})
