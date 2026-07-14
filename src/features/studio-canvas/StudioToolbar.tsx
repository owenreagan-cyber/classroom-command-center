interface StudioToolbarProps {
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  snapEnabled: boolean
  onToggleSnap: () => void
  onResetLayout: () => void
  selectedLocked: boolean | null
  onToggleLock: () => void
  onPreviewClassroom?: () => void
  pageLabel: string
}

const buttonClass =
  'rounded-lg border border-slate-700 bg-slate-900/70 px-2.5 py-1.5 text-xs font-semibold text-slate-200 shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40'

const activeButtonClass =
  'rounded-lg border border-cyan-400/60 bg-cyan-500/20 px-2.5 py-1.5 text-xs font-semibold text-cyan-100 shadow-sm transition hover:bg-cyan-500/30'

export function StudioToolbar({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  snapEnabled,
  onToggleSnap,
  onResetLayout,
  selectedLocked,
  onToggleLock,
  onPreviewClassroom,
  pageLabel,
}: StudioToolbarProps) {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2"
      role="toolbar"
      aria-label="Studio Canvas toolbar"
    >
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={buttonClass} onClick={onUndo} disabled={!canUndo} aria-label="Undo last layout change">
          Undo
        </button>
        <button type="button" className={buttonClass} onClick={onRedo} disabled={!canRedo} aria-label="Redo last undone layout change">
          Redo
        </button>
        <button
          type="button"
          className={snapEnabled ? activeButtonClass : buttonClass}
          onClick={onToggleSnap}
          aria-pressed={snapEnabled}
          aria-label="Toggle snap to grid"
        >
          Snap {snapEnabled ? 'On' : 'Off'}
        </button>
        <button type="button" className={buttonClass} onClick={onResetLayout} aria-label="Reset this page's layout to the default">
          Reset Page Layout
        </button>
        <button
          type="button"
          className={buttonClass}
          onClick={onToggleLock}
          disabled={selectedLocked === null}
          aria-label={selectedLocked ? 'Unlock selected widget' : 'Lock selected widget'}
        >
          {selectedLocked ? 'Unlock' : 'Lock'}
        </button>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{pageLabel}</span>
        {onPreviewClassroom && (
          <button type="button" className={buttonClass} onClick={onPreviewClassroom} aria-label="Preview Classroom Mode">
            Preview Classroom Mode
          </button>
        )}
      </div>
    </div>
  )
}
