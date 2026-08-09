import { useDisplayComposerStore } from '../display-composer/displayComposerStore'
import { useDisplayStudioUI } from './useDisplayStudioUI'

const primaryBarBtn =
  'rounded-lg border border-cyan-400/50 bg-cyan-950/40 px-3 py-1.5 text-[11px] font-semibold text-cyan-100 transition hover:bg-cyan-900/50'

const barBtn =
  'rounded-lg border border-slate-700 px-3 py-1.5 text-[11px] font-semibold text-slate-300 transition hover:border-slate-500 hover:bg-slate-800/60 hover:text-slate-100'

const smallBtn =
  'rounded-md border border-slate-700 px-2 py-1 text-[10px] font-semibold text-slate-400 transition hover:border-slate-500 hover:text-slate-200'

export function DisplayStudioCommandBar() {
  const screens = useDisplayComposerStore((s) => s.screens)
  const order = useDisplayComposerStore((s) => s.order)
  const activeScreenId = useDisplayComposerStore((s) => s.activeScreenId)
  const displayBlanked = useDisplayComposerStore((s) => s.displayBlanked)
  const sendToDisplay = useDisplayComposerStore((s) => s.sendToDisplay)
  const clearDisplay = useDisplayComposerStore((s) => s.clearDisplay)
  const blankDisplay = useDisplayComposerStore((s) => s.blankDisplay)
  const unblankDisplay = useDisplayComposerStore((s) => s.unblankDisplay)
  const {
    selectedScreenId, close, togglePresenterMode,
    toggleQuickStart, quickStartOpen,
  } = useDisplayStudioUI()

  const activeId = selectedScreenId ?? order[0] ?? null
  const screen = activeId ? screens[activeId] : undefined
  const isLive = screen ? screen.id === activeScreenId && !displayBlanked : false
  const hasActiveDisplay = Boolean(activeScreenId) || displayBlanked

  return (
    <div className="flex items-center justify-between px-4 py-2">
      {/* Left: Title + tools */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-100">Display Studio</span>
        {screen && (
          <span className="text-[10px] text-slate-500">
            — {screen.title}
          </span>
        )}

        {/* Phase 15G: Active display indicator inline */}
        {isLive && (
          <span className="flex items-center gap-1 rounded border border-emerald-400/30 bg-emerald-950/20 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-200">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
        )}
        {displayBlanked && (
          <span className="flex items-center gap-1 rounded border border-amber-400/30 bg-amber-950/20 px-1.5 py-0.5 text-[9px] font-semibold text-amber-200">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
            Blanked
          </span>
        )}
        {hasActiveDisplay && !isLive && !displayBlanked && (
          <span className="flex items-center gap-1 rounded border border-slate-600 bg-slate-800/40 px-1.5 py-0.5 text-[9px] font-semibold text-slate-400">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-500" />
            Another screen live
          </span>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5">
        {/* Phase 15G: Template Gallery button — removed in 15L.2 (Browse Templates now only in ThumbnailRail) */}

        {/* Quick Start toggle */}
        <button
          type="button"
          className={`${smallBtn} ${quickStartOpen ? 'border-cyan-400/40 bg-cyan-950/30 text-cyan-200' : ''}`}
          onClick={toggleQuickStart}
        >
          ⚡ Quick Start
        </button>

        <div className="mx-1 h-5 w-px bg-slate-700" />

        <button
          type="button"
          className={primaryBarBtn}
          onClick={() => {
            if (screen) sendToDisplay(screen.id)
          }}
          data-studio-action="send-to-display"
        >
          {isLive ? 'On Display' : 'Send to Display'}
        </button>

        {activeScreenId && !displayBlanked && (
          <button
            type="button"
            className={barBtn}
            onClick={clearDisplay}
            data-studio-action="clear-display"
          >
            Clear
          </button>
        )}

        {displayBlanked ? (
          <button
            type="button"
            className="rounded-lg border border-emerald-400/40 bg-emerald-950/30 px-3 py-1.5 text-[11px] font-semibold text-emerald-200 transition hover:bg-emerald-900/40"
            onClick={unblankDisplay}
            data-studio-action="unblank-display"
          >
            Restore
          </button>
        ) : (
          <button
            type="button"
            className="rounded-lg border border-amber-400/40 bg-amber-950/30 px-3 py-1.5 text-[11px] font-semibold text-amber-200 transition hover:bg-amber-900/40"
            onClick={blankDisplay}
            data-studio-action="blank-display"
          >
            Blank
          </button>
        )}

        <button
          type="button"
          className={barBtn}
          onClick={togglePresenterMode}
        >
          Presenter
        </button>

        <div className="mx-1 h-5 w-px bg-slate-700" />

        <button
          type="button"
          className={barBtn}
          onClick={close}
        >
          Close
        </button>
      </div>
    </div>
  )
}
