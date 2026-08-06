import { useDisplayComposerStore } from '../display-composer/displayComposerStore'
import { useDisplayStudioUI } from './useDisplayStudioUI'

const primaryBarBtn =
  'rounded-lg border border-cyan-400/50 bg-cyan-950/40 px-3 py-1.5 text-[11px] font-semibold text-cyan-100 transition hover:bg-cyan-900/50'

const barBtn =
  'rounded-lg border border-slate-700 px-3 py-1.5 text-[11px] font-semibold text-slate-300 transition hover:border-slate-500 hover:bg-slate-800/60 hover:text-slate-100'

export function DisplayStudioCommandBar() {
  const screens = useDisplayComposerStore((s) => s.screens)
  const order = useDisplayComposerStore((s) => s.order)
  const activeScreenId = useDisplayComposerStore((s) => s.activeScreenId)
  const displayBlanked = useDisplayComposerStore((s) => s.displayBlanked)
  const sendToDisplay = useDisplayComposerStore((s) => s.sendToDisplay)
  const clearDisplay = useDisplayComposerStore((s) => s.clearDisplay)
  const blankDisplay = useDisplayComposerStore((s) => s.blankDisplay)
  const unblankDisplay = useDisplayComposerStore((s) => s.unblankDisplay)
  const { selectedScreenId, close, togglePresenterMode } = useDisplayStudioUI()

  const activeId = selectedScreenId ?? order[0] ?? null
  const screen = activeId ? screens[activeId] : undefined
  const isLive = screen ? screen.id === activeScreenId && !displayBlanked : false

  return (
    <div className="flex items-center justify-between px-4 py-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-100">Display Studio</span>
        {screen && (
          <span className="text-[10px] text-slate-500">
            — {screen.title}
          </span>
        )}
        {displayBlanked && (
          <span className="rounded border border-amber-400/30 bg-amber-950/20 px-1.5 py-0.5 text-[9px] font-semibold text-amber-200">
            Display Blanked
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className={primaryBarBtn}
          onClick={() => {
            if (screen) sendToDisplay(screen.id)
          }}
          data-studio-action="send-to-display"
        >
          {isLive ? '🟢 Live on Display' : 'Send to Display'}
        </button>

        {activeScreenId && !displayBlanked && (
          <button
            type="button"
            className={barBtn}
            onClick={clearDisplay}
            data-studio-action="clear-display"
          >
            Clear Display
          </button>
        )}

        {displayBlanked ? (
          <button
            type="button"
            className={barBtn}
            onClick={unblankDisplay}
            data-studio-action="unblank-display"
          >
            Restore Display
          </button>
        ) : (
          <button
            type="button"
            className={barBtn}
            onClick={blankDisplay}
            data-studio-action="blank-display"
          >
            Blank Screen
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
          Close Studio
        </button>
      </div>
    </div>
  )
}
