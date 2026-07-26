import { memo } from 'react'
import { TodayPrepPanel } from '../../../board/TodayPrepPanel'
import { useTeacherDockContext } from '../useTeacherDockContext'

/** Materials launcher — reuses Today Prep material links scoped to active screen. */
export const MaterialsToolPanel = memo(function MaterialsToolPanel() {
  const { activeScreen, activePageId, classWorkspaces } = useTeacherDockContext()

  return (
    <div className="space-y-3">
      <header>
        <h2 className="text-lg font-bold text-white">Materials</h2>
        <p className="mt-1 text-sm text-slate-400">
          Open lesson resources with safe Open With presets for the active screen.
        </p>
      </header>
      <TodayPrepPanel
        activeScreen={activeScreen}
        activePageId={activePageId}
        classWorkspaces={classWorkspaces}
        sections={['materials']}
      />
    </div>
  )
})
