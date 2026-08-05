import { useMemo } from 'react'
import { useDisplayComposerStore } from '../display-composer/displayComposerStore'
import { DisplayScreenRenderer } from '../display-composer/DisplayScreenRenderer'
import { toDisplaySafeScreen } from '../display-composer/displaySafe'
import { useDisplayStudioUI } from './useDisplayStudioUI'

/**
 * Large 16:9 canvas displaying the selected screen's student-facing preview.
 * Edits are done through the Inspector panel on the right.
 */
export function DisplayStudioCanvas() {
  const screens = useDisplayComposerStore((s) => s.screens)
  const order = useDisplayComposerStore((s) => s.order)
  const { selectedScreenId } = useDisplayStudioUI()

  const activeId = selectedScreenId ?? order[0] ?? null
  const selected = activeId ? screens[activeId] : undefined

  const safeScreen = useMemo(() => {
    if (!selected) return null
    return toDisplaySafeScreen(selected)
  }, [selected])

  if (!selected) {
    return (
      <div className="flex items-center justify-center text-sm text-slate-400">
        <p>Select a screen from the left panel or create a new one.</p>
      </div>
    )
  }

  return (
    <div
      className="relative flex w-full max-w-5xl flex-col gap-2"
      style={{ aspectRatio: '16 / 9', maxHeight: 'min(100%, calc(100vh - 200px))' }}
      data-display-studio-canvas
    >
      {/* Screen label */}
      <div className="absolute -top-7 left-0 right-0 flex items-center justify-center">
        <span className="rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-0.5 text-[11px] font-semibold text-slate-400 backdrop-blur">
          {selected.mode} · {selected.studentSafe ? 'Student-safe' : 'Not student-safe'}
        </span>
      </div>

      {/* 16:9 canvas */}
      <div className="flex-1 overflow-hidden rounded-xl border border-slate-700 shadow-2xl">
        {safeScreen ? (
          <DisplayScreenRenderer screen={safeScreen} variant="controlPreview" />
        ) : (
          <div className="flex h-full items-center justify-center bg-slate-900/60">
            <div className="text-center">
              <p className="text-lg font-semibold text-slate-400">Screen not student-safe</p>
              <p className="mt-1 text-xs text-slate-500">
                Enable "Student-safe" in the Screen inspector section to preview.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
