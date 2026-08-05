import { useCallback } from 'react'
import { useDisplayComposerStore } from '../display-composer/displayComposerStore'
import { useDisplayStudioUI } from './useDisplayStudioUI'
import { DisplayScreenRenderer } from '../display-composer/DisplayScreenRenderer'
import { toDisplaySafeScreen } from '../display-composer/displaySafe'

export function DisplayStudioPresenter() {
  const { presenterMode, togglePresenterMode, selectScreen, selectedScreenId } = useDisplayStudioUI()
  const screens = useDisplayComposerStore((s) => s.screens)
  const order = useDisplayComposerStore((s) => s.order)
  const activeScreenId = useDisplayComposerStore((s) => s.activeScreenId)
  const sendToDisplay = useDisplayComposerStore((s) => s.sendToDisplay)
  const clearDisplay = useDisplayComposerStore((s) => s.clearDisplay)

  const activeId = selectedScreenId ?? order[0] ?? null
  const currentIndex = activeId ? order.indexOf(activeId) : -1
  const nextId = currentIndex >= 0 && currentIndex < order.length - 1 ? order[currentIndex + 1] : null
  const prevId = currentIndex > 0 ? order[currentIndex - 1] : null

  const goToPrevious = useCallback(() => {
    if (prevId) selectScreen(prevId)
  }, [prevId, selectScreen])

  const goToNext = useCallback(() => {
    if (nextId) selectScreen(nextId)
  }, [nextId, selectScreen])

  if (!presenterMode) return null

  const currentScreen = activeId ? screens[activeId] : undefined
  const nextScreen = nextId ? screens[nextId] : undefined

  const safeCurrent = currentScreen ? toDisplaySafeScreen(currentScreen) : null
  const safeNext = nextScreen ? toDisplaySafeScreen(nextScreen) : null
  const isLive = currentScreen ? currentScreen.id === activeScreenId : false

  return (
    <div className="fixed inset-0 z-[60] flex bg-slate-950" data-display-studio-presenter>
      {/* Left: Current screen + controls */}
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-100">Presenter View</h2>
          <button
            type="button"
            onClick={togglePresenterMode}
            className="rounded-lg border border-slate-700 px-2 py-1 text-[10px] font-semibold text-slate-400 hover:text-slate-200"
          >
            Exit Presenter
          </button>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <button
            type="button"
            onClick={goToPrevious}
            disabled={!prevId}
            className="rounded-lg border border-slate-700 bg-slate-900/70 px-2 py-1 text-[10px] font-semibold text-slate-300 transition hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Prev
          </button>
          <p className="flex-1 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Current Screen — {currentScreen?.title ?? 'None'}
          </p>
          <button
            type="button"
            onClick={goToNext}
            disabled={!nextId}
            className="rounded-lg border border-slate-700 bg-slate-900/70 px-2 py-1 text-[10px] font-semibold text-slate-300 transition hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>

        <div className="flex-1 overflow-hidden rounded-xl border border-cyan-400/30 shadow-lg">
          {safeCurrent ? (
            <DisplayScreenRenderer screen={safeCurrent} variant="controlPreview" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">
              No screen selected
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-cyan-400/50 bg-cyan-950/40 px-3 py-1.5 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-900/50"
            onClick={() => currentScreen && sendToDisplay(currentScreen.id)}
          >
            {isLive ? '🟢 Live' : 'Send to Display'}
          </button>
          {activeScreenId && (
            <button
              type="button"
              className="rounded-lg border border-slate-600 bg-slate-900/70 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-800"
              onClick={clearDisplay}
            >
              Clear Display
            </button>
          )}
          <button
            type="button"
            className="rounded-lg border border-slate-600 bg-slate-900/70 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-800"
            onClick={() => {
              // Blank screen: send a black screen or clear
              clearDisplay()
            }}
          >
            Blank Screen
          </button>
        </div>
      </div>

      {/* Right: Next screen + Notes + Quick Jump */}
      <div className="flex w-72 shrink-0 flex-col border-l border-slate-800 p-6">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1">Next Screen</p>
        <div className="aspect-video w-full overflow-hidden rounded-xl border border-slate-700 bg-slate-900/50">
          {safeNext ? (
            <DisplayScreenRenderer screen={safeNext} variant="controlPreview" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-slate-500">
              No next screen
            </div>
          )}
        </div>
        {nextScreen && (
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-300">{nextScreen.title}</p>
            <button
              type="button"
              className="rounded border border-slate-600 px-1.5 py-0.5 text-[9px] font-semibold text-slate-400 hover:text-slate-200"
              onClick={() => nextScreen && sendToDisplay(nextScreen.id)}
            >
              Send Next
            </button>
          </div>
        )}

        {currentScreen && (
          <div className="mt-4 flex-1 overflow-hidden">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1">Teacher Notes</p>
            <div className="h-full max-h-[200px] overflow-y-auto rounded-lg border border-slate-700 bg-slate-900/50 p-2">
              {currentScreen.teacherNotes ? (
                <p className="text-xs text-slate-300 whitespace-pre-wrap">{currentScreen.teacherNotes}</p>
              ) : (
                <p className="text-xs text-slate-600 italic">No teacher notes for this screen.</p>
              )}
            </div>
            <p className="mt-1 text-[9px] text-slate-600">Notes are private and do not appear on /display.</p>
          </div>
        )}

        {/* Thumbnail jump list */}
        <div className="mt-4 border-t border-slate-800 pt-3">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Quick Jump</p>
          <div className="flex max-h-[160px] flex-wrap gap-1 overflow-y-auto">
            {order.map((id) => {
              const s = screens[id]
              if (!s) return null
              const isCurrent = id === activeId
              const isOnDisplay = id === activeScreenId
              return (
                <button
                  key={id}
                  type="button"
                  className={`rounded-md border px-1.5 py-0.5 text-[9px] font-semibold transition ${
                    isCurrent
                      ? 'border-cyan-400/60 bg-cyan-950/40 text-cyan-100'
                      : 'border-slate-700 text-slate-400 hover:border-slate-500'
                  }`}
                  onClick={() => selectScreen(id)}
                >
                  {s.title.slice(0, 14)}
                  {isOnDisplay && <span className="ml-0.5 text-emerald-400">●</span>}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
