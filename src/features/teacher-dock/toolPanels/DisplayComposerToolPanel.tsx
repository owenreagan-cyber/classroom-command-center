import { useEffect, memo } from 'react'
import { useDisplayStudioUI } from '../../display-studio/useDisplayStudioUI'

/**
 * Phase 15A — Display Screens tool now launches the full Display Studio overlay
 * instead of the small in-dock panel. The overlay gives the teacher a
 * PowerPoint/Classroomscreen-style slide editor with thumbnail rail, large
 * canvas, collapsible inspector, and widget library.
 *
 * The legacy DisplayComposerPanel is retained for backward compatibility
 * and can still be used if the overlay is unavailable.
 */
export const DisplayComposerToolPanel = memo(function DisplayComposerToolPanel() {
  const { open } = useDisplayStudioUI()

  useEffect(() => {
    open()
  }, [open])

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
      <p className="text-sm font-semibold text-slate-300">Display Studio is open</p>
      <p className="text-xs text-slate-500">
        Use the slide editor to build and manage your classroom display screens.
      </p>
      <button
        type="button"
        className="rounded-lg border border-cyan-400/50 bg-cyan-950/40 px-4 py-2 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-900/50"
        onClick={open}
      >
        Reopen Display Studio
      </button>
    </div>
  )
})
