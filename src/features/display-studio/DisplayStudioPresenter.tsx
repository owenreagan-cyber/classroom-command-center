import { useCallback } from 'react'
import { useDisplayComposerStore } from '../display-composer/displayComposerStore'
import { useDisplayStudioUI } from './useDisplayStudioUI'
import { DisplayScreenRenderer } from '../display-composer/DisplayScreenRenderer'
import { toDisplaySafeScreen } from '../display-composer/displaySafe'
import { useAtmosphereStore, getDisplayMusicLabel } from '../classroom-atmosphere/atmosphereStore'
import { usePressYourLuckStore } from '../prize-board/pressYourLuck/pressYourLuckStore'
import { usePickerStore } from '../student-picker/pickerStore'
import { getMysteryDisplayStatus } from '../roster/displaySafe'
import { useTimerStore, ensureTransitionTimer } from '../../store/timerStore'

function useCurrentTime() {
  return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

export function DisplayStudioPresenter() {
  const { presenterMode, togglePresenterMode, selectScreen, selectedScreenId } = useDisplayStudioUI()
  const screens = useDisplayComposerStore((s) => s.screens)
  const order = useDisplayComposerStore((s) => s.order)
  const activeScreenId = useDisplayComposerStore((s) => s.activeScreenId)
  const displayBlanked = useDisplayComposerStore((s) => s.displayBlanked)
  const sendToDisplay = useDisplayComposerStore((s) => s.sendToDisplay)
  const clearDisplay = useDisplayComposerStore((s) => s.clearDisplay)
  const blankDisplay = useDisplayComposerStore((s) => s.blankDisplay)
  const unblankDisplay = useDisplayComposerStore((s) => s.unblankDisplay)

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

  const sendCurrentToDisplay = useCallback(() => {
    const id = activeId ?? order[0]
    if (id) sendToDisplay(id)
  }, [activeId, order, sendToDisplay])

  const sendNextToDisplay = useCallback(() => {
    if (nextId) {
      sendToDisplay(nextId)
      selectScreen(nextId)
    }
  }, [nextId, sendToDisplay, selectScreen])

  // Active tool status (hooks must be before conditional return)
  const musicMode = useAtmosphereStore((s) => s.activeMode)
  const isMusicPlaying = useAtmosphereStore((s) => s.isPlaying)
  const musicLabel = getDisplayMusicLabel(musicMode)

  const pylPhase = usePressYourLuckStore((s) => s.phase)
  const pylActive = pylPhase !== 'idle'

  const sessions = usePickerStore((s) => s.activeMysterySessions)
  const firstActive = Object.values(sessions).find((s) => s?.status === 'active' || s?.status?.startsWith('revealed-'))
  const mysteryStatus = getMysteryDisplayStatus(firstActive)

  const timeStr = useCurrentTime()

  // Check for any active timers on the current screen
  const currentScreen = activeId ? screens[activeId] : undefined
  const hasTimer = currentScreen?.timerWidget.kind !== 'none' && Boolean(currentScreen?.timerWidget.timerId)
  const timerState = useTimerStore((s) => {
    const tid = currentScreen?.timerWidget.timerId
    const kind = currentScreen?.timerWidget.kind
    if (!hasTimer || !tid) return null
    if (kind === 'routine') return ensureTransitionTimer(s.transitionTimers, tid)
    return ensureTransitionTimer(s.transitionTimers, tid)
  })
  const timerRunning = timerState?.status === 'running'
  const timerRemaining = timerState?.remainingMs ?? 0
  const timerMins = Math.floor(timerRemaining / 60000)
  const timerSecs = Math.floor((timerRemaining % 60000) / 1000)

  if (!presenterMode) return null

  const nextScreen = nextId ? screens[nextId] : undefined
  const safeCurrent = currentScreen ? toDisplaySafeScreen(currentScreen) : null
  const safeNext = nextScreen ? toDisplaySafeScreen(nextScreen) : null
  const isLive = currentScreen ? currentScreen.id === activeScreenId : false
  const hasActiveTools = musicLabel || pylActive || mysteryStatus.isActive || hasTimer

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-slate-950" data-display-studio-presenter>
      {/* Top bar */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-800 px-6 py-3">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-bold text-slate-100">Presenter View</h2>
          <span className="text-[11px] tabular-nums text-slate-400">{timeStr}</span>
          {displayBlanked && (
            <span className="rounded-md border border-amber-400/40 bg-amber-950/30 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
              Display Blanked
            </span>
          )}
          {isLive && !displayBlanked && (
            <span className="rounded-md border border-emerald-400/40 bg-emerald-950/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
              🟢 Live
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={togglePresenterMode}
          className="rounded-lg border border-slate-700 px-3 py-1.5 text-[11px] font-semibold text-slate-400 transition hover:text-slate-200 hover:border-slate-500"
        >
          Exit Presenter
        </button>
      </div>

      {/* Main area */}
      <div className="flex flex-1 min-h-0">
        {/* Left: Current screen preview – takes most space */}
        <div className="flex flex-1 flex-col p-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={goToPrevious}
                disabled={!prevId}
                className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ← Prev
              </button>
              <h3 className="text-xs font-semibold text-slate-300">
                {currentScreen?.title ?? 'No screen'}
                <span className="ml-2 text-slate-500">
                  {currentIndex >= 0 ? `${currentIndex + 1} / ${order.length}` : ''}
                </span>
              </h3>
              <button
                type="button"
                onClick={goToNext}
                disabled={!nextId}
                className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden rounded-xl border border-slate-700 shadow-lg">
            {displayBlanked ? (
              <div className="flex h-full flex-col items-center justify-center bg-black">
                <p className="text-4xl font-black text-slate-700">Screen Paused</p>
                <p className="mt-2 text-sm text-slate-600">Display is blanked</p>
              </div>
            ) : safeCurrent ? (
              <DisplayScreenRenderer screen={safeCurrent} variant="controlPreview" />
            ) : (
              <div className="flex h-full items-center justify-center bg-slate-900/60">
                <p className="text-sm text-slate-500">No screen selected</p>
              </div>
            )}
          </div>

          {/* Primary action buttons */}
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              className="rounded-lg border border-cyan-400/50 bg-cyan-950/40 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-900/50"
              onClick={sendCurrentToDisplay}
            >
              {isLive && !displayBlanked ? '🟢 Live on Display' : 'Send to Display'}
            </button>

            {nextId && (
              <button
                type="button"
                className="rounded-lg border border-indigo-400/50 bg-indigo-950/30 px-4 py-2 text-sm font-semibold text-indigo-100 transition hover:bg-indigo-900/40"
                onClick={sendNextToDisplay}
              >
                Next to Display →
              </button>
            )}

            {displayBlanked ? (
              <button
                type="button"
                className="rounded-lg border border-emerald-400/50 bg-emerald-950/30 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-900/40"
                onClick={unblankDisplay}
              >
                Restore Display
              </button>
            ) : (
              <button
                type="button"
                className="rounded-lg border border-amber-400/50 bg-amber-950/30 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-900/40"
                onClick={blankDisplay}
              >
                Blank Screen
              </button>
            )}

            {activeScreenId && !displayBlanked && (
              <button
                type="button"
                className="rounded-lg border border-slate-600 bg-slate-900/70 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                onClick={clearDisplay}
              >
                Clear Display
              </button>
            )}
          </div>

          {/* Quick Tools Status */}
          {hasActiveTools && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-600 mr-1">
                Active Tools
              </span>
              {musicLabel && (
                <span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${
                  isMusicPlaying ? 'border-emerald-400/40 bg-emerald-950/30 text-emerald-200' : 'border-slate-600 bg-slate-900/50 text-slate-400'
                }`}>
                  🎵 {musicLabel}{!isMusicPlaying ? ' (paused)' : ''}
                </span>
              )}
              {hasTimer && (
                <span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${
                  timerRunning ? 'border-cyan-400/40 bg-cyan-950/30 text-cyan-200' : 'border-slate-600 bg-slate-900/50 text-slate-400'
                }`}>
                  ⏱ {timerMins}:{timerSecs.toString().padStart(2, '0')}
                  {!timerRunning && ' (ready)'}
                </span>
              )}
              {pylActive && (
                <span className="rounded-md border border-amber-400/40 bg-amber-950/30 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
                  🎰 Press Your Luck Active
                </span>
              )}
              {mysteryStatus.isActive && (
                <span className="rounded-md border border-amber-400/40 bg-amber-950/30 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
                  🌟 {mysteryStatus.statusLabel}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right sidebar: Next preview + Notes + Quick Jump */}
        <div className="flex w-80 shrink-0 flex-col border-l border-slate-800 p-4">
          {/* Next screen preview */}
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Next Screen</p>
          <div className="aspect-video w-full overflow-hidden rounded-lg border border-slate-700 bg-slate-900/50">
            {!displayBlanked && safeNext ? (
              <DisplayScreenRenderer screen={safeNext} variant="controlPreview" />
            ) : (
              <div className="flex h-full items-center justify-center text-[10px] text-slate-600">
                {displayBlanked ? 'Display blanked' : 'No next screen'}
              </div>
            )}
          </div>
          {nextScreen && (
            <div className="mt-1.5 flex items-center justify-between">
              <p className="text-[11px] font-semibold text-slate-300">{nextScreen.title}</p>
              <button
                type="button"
                className="rounded border border-slate-600 px-1.5 py-0.5 text-[9px] font-semibold text-slate-400 hover:text-slate-200"
                onClick={sendNextToDisplay}
              >
                Send Next
              </button>
            </div>
          )}

          {/* Student message preview */}
          {currentScreen?.studentMessage && (
            <div className="mt-3 rounded-lg border border-slate-800 bg-slate-900/30 p-2">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-600 mb-0.5">Student Message</p>
              <p className="text-[11px] leading-snug text-slate-300 line-clamp-3">{currentScreen.studentMessage}</p>
            </div>
          )}

          {/* Teacher Notes */}
          {currentScreen && (
            <div className="mt-3 flex-1 overflow-hidden min-h-0">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Teacher Notes</p>
              <div className="h-full max-h-[180px] overflow-y-auto rounded-lg border border-slate-700 bg-slate-900/50 p-2">
                {currentScreen.teacherNotes ? (
                  <p className="text-[11px] text-slate-300 whitespace-pre-wrap leading-snug">{currentScreen.teacherNotes}</p>
                ) : (
                  <p className="text-[10px] text-slate-600 italic">No teacher notes for this screen.</p>
                )}
              </div>
              <p className="mt-1 text-[8px] text-slate-600">Notes are private — never shown on /display.</p>
            </div>
          )}

          {/* Quick Jump thumbnails */}
          <div className="mt-3 shrink-0 border-t border-slate-800 pt-3">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Quick Jump</p>
            <div className="flex max-h-[140px] flex-wrap gap-1 overflow-y-auto">
              {order.map((id) => {
                const s = screens[id]
                if (!s) return null
                const isCurrent = id === activeId
                const isOnDisplay = id === activeScreenId && !displayBlanked
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
    </div>
  )
}
