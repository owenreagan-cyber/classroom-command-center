import { memo } from 'react'
import { StudentPickerPanel } from '../../student-picker/StudentPickerPanel'
import { useTeacherDockContext } from '../useTeacherDockContext'

export const MysteryStarToolPanel = memo(function MysteryStarToolPanel() {
  const { activeScreen } = useTeacherDockContext()
  return (
    <StudentPickerPanel
      activeScreen={activeScreen}
      initialTab="mystery"
      title="Mystery Star"
    />
  )
})

export const QuickPickerToolPanel = memo(function QuickPickerToolPanel() {
  const { activeScreen } = useTeacherDockContext()
  return (
    <StudentPickerPanel
      activeScreen={activeScreen}
      initialTab="quick"
      title="Quick Picker"
    />
  )
})
