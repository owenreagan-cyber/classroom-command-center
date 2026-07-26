import { memo } from 'react'
import { TeacherDashboardPanel } from '../../../board/TeacherDashboardPanel'
import { useTeacherDockContext } from '../useTeacherDockContext'

export const DashboardToolPanel = memo(function DashboardToolPanel() {
  const { activeScreen, onScreenChange, onActivateTool } = useTeacherDockContext()

  return (
    <TeacherDashboardPanel
      activeScreen={activeScreen}
      onScreenChange={onScreenChange}
      onScrollToSection={(sectionId) => {
        const toolMap: Record<string, Parameters<typeof onActivateTool>[0]> = {
          'morning-message': 'morning-message',
          'today-prep': 'today-prep',
          'student-picker': 'mystery-star',
          'prize-board': 'prize-board',
        }
        const toolId = toolMap[sectionId]
        if (toolId) onActivateTool(toolId)
      }}
    />
  )
})
