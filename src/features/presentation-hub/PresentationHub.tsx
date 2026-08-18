import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useDisplayComposerStore } from '../display-composer/displayComposerStore'
import { toDisplaySafeScreen, type DisplaySafeScreen } from '../display-composer/displaySafe'
import { DisplayScreenRenderer } from '../display-composer/DisplayScreenRenderer'
import { useDisplayStudioUI } from '../display-studio/useDisplayStudioUI'
import { useBoardStore } from '../../store/boardStore'
import { useTimerStore } from '../../store/timerStore'
import { useAtmosphereStore, getDisplayMusicLabel } from '../classroom-atmosphere/atmosphereStore'
import { formatTimerMs } from '../../lib/timerFormat'
import {
  getNextScreenId,
  getPreviousScreenId,
  isScreenLive,
  resolveFallbackScreenId,
  resolvePresentationStatus,
} from './presentationHubLogic'

interface PresentationHubProps {
  /** Existing board editor surface, rendered when the "Board" segment is active. */
  boardWorkspace: ReactNode
}

const segBtn = 'rounded-lg px-3 py-1.5 text-xs font-semibold transition'
const segActive = 'bg-slate-700 text-white'
const segIdle = 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'

const primaryBtn =
  'rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_4px_16px_-4px_rgba(34,211,238,0.5)] transition hover:bg-cyan-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50'
const secondaryBtn =
  'rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-800/60 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40'

function useLiveClock(): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])
  return now
}

function formatClock(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

/**
 * Phase 15L.2 — Presentation Hub.
 *
 * Presentation-first home for /control (edit mode). A large live 16:9 preview
 * of the student display is the dominant object, supported by a compact status
 * strip, a compact scene rail, primary Send/Blank/Restore actions, and clear
 * entry points into Display Studio, Teach Mode, and the board editor.
 *
 * Teacher-side only. Never mounts on /display.
 */
export function PresentationHub({ boardWorkspace }: PresentationHubProps) {
  const screens = useDisplayComposerStore((s) => s.screens)
  const order = useDisplayComposerStore((s) => s.order)
  const activeScreenId = useDisplayComposerStore((s) => s.activeScreenId)
  const displayBlanked = useDisplayComposerStore((s) => s.displayBlanked)
  const sendToDisplay = useDisplayComposerStore((s) => s.sendToDisplay)
  const clearDisplay = useDisplayComposerStore((s) => s.clearDisplay)
  const blankDisplay = useDisplayComposerStore((s) => s.blankDisplay)
  const unblankDisplay = useDisplayComposerStore((s) => s.unblankDisplay)

  const { open, selectScreen } = useDisplayStudioUI()
  const setMode = useBoardStore((s) => s.setMode)

  const transitionTimers = useTimerStore((s) => s.transitionTimers)
  const taskTimers = useTimerStore((s) => s.taskTimers)
  const routineTimers = useTimerStore((s) => s.routineTimers)

  const musicMode = useAtmosphereStore((s) => s.activeMode)
  const musicPlaying = useAtmosphereStore((s) => s.isPlaying)

  const now = useLiveClock()

  const [selectedScreenId, setSelectedScreenId] = useState<string | null>(null)
  const [view, setView] = useState<'present' | 'board'>('present')

  const selectedId = useMemo(
    () => resolveFallbackScreenId(order, selectedScreenId, activeScreenId),
    [order, selectedScreenId, activeScreenId],
  )

  const status = resolvePresentationStatus({ activeScreenId, displayBlanked })

  const liveScreen = useMemo(() => {
    if (!activeScreenId) return undefined
    const screen = screens[activeScreenId]
    return screen?.studentSafe ? screen : undefined
  }, [screens, activeScreenId])

  const previewScreen: DisplaySafeScreen | null = useMemo(() => {
    if (status === 'blanked') return null
    if (status === 'live') return toDisplaySafeScreen(liveScreen)
    if (selectedId) return toDisplaySafeScreen(screens[selectedId])
    return null
  }, [status, liveScreen, selectedId, screens])

  const nextId = useMemo(
    () => getNextScreenId(order, activeScreenId ?? selectedId),
    [order, activeScreenId, selectedId],
  )
  const prevId = useMemo(
    () => getPreviousScreenId(order, activeScreenId ?? selectedId),
    [order, activeScreenId, selectedId],
  )

  const nextTitle = useMemo(() => (nextId ? screens[nextId]?.title : undefined), [nextId, screens])

  const timerChip = useMemo(() => {
    const screen = liveScreen
    if (!screen || screen.timerWidget.kind === 'none' || !screen.timerWidget.timerId) return null
    const { kind, timerId } = screen.timerWidget
    const timer =
      kind === 'task'
        ? taskTimers[timerId]
        : kind === 'routine'
          ? routineTimers[timerId]
          : transitionTimers[timerId]
    if (!timer || timer.status !== 'running') return null
    const label =
      'label' in timer && timer.label
        ? String(timer.label)
        : 'title' in timer && timer.title
          ? String(timer.title)
          : 'Timer'
    return `${label} ${formatTimerMs(timer.remainingMs)}`
  }, [liveScreen, transitionTimers, taskTimers, routineTimers])

  const musicLabel = useMemo(() => getDisplayMusicLabel(musicMode), [musicMode])

  const handleSend = () => {
    if (selectedId) sendToDisplay(selectedId)
  }

  const handleOpenStudio = () => {
    if (selectedId) selectScreen(selectedId)
    open()
  }

  const handleSelect = (id: string) => {
    setSelectedScreenId(id)
  }

  const statusPill = (() => {
    if (status === 'blanked') {
      return { label: 'Blanked', dot: 'bg-amber-400', text: 'text-amber-200 border-amber-400/30 bg-amber-950/20' }
    }
    if (status === 'live') {
      return { label: 'Live', dot: 'bg-emerald-400', text: 'text-emerald-200 border-emerald-400/30 bg-emerald-950/20' }
    }
    return { label: 'Ready', dot: 'bg-slate-500', text: 'text-slate-300 border-slate-600 bg-slate-800/40' }
  })()

  const liveTitle = liveScreen?.title ?? (selectedId ? screens[selectedId]?.title : undefined)

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-slate-950" data-presentation-hub>
      {/* Top bar: view segment + entry points */}
      <header className="flex shrink-0 items-center justify-between border-b border-slate-800 px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold uppercase tracking-wider text-slate-200">Presentation</span>
          <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900/60 p-0.5" role="tablist" aria-label="Presentation view">
            <button type="button" role="tab" aria-selected={view === 'present'} className={`${segBtn} ${view === 'present' ? segActive : segIdle}`} onClick={() => setView('present')}>
              Present
            </button>
            <button type="button" role="tab" aria-selected={view === 'board'} className={`${segBtn} ${view === 'board' ? segActive : segIdle}`} onClick={() => setView('board')}>
              Board
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button type="button" className={secondaryBtn} onClick={() => setMode('teach')} data-hub-action="teach-mode">
            Teach Mode
          </button>
          <button type="button" className={primaryBtn} onClick={handleOpenStudio} data-hub-action="open-studio">
            Display Studio
          </button>
        </div>
      </header>

      {view === 'board' ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{boardWorkspace}</div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* Status strip */}
          <div className="flex shrink-0 items-center gap-4 border-b border-slate-800/70 px-5 py-2.5">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusPill.text}`} data-hub-display-status>
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${statusPill.dot} ${status === 'live' ? 'animate-pulse' : ''}`} />
              {statusPill.label}
            </span>
            {liveTitle && <span className="truncate text-sm font-medium text-slate-300">{liveTitle}</span>}
            {status === 'live' && nextTitle && (
              <span className="hidden truncate text-xs text-slate-500 sm:inline">
                Next: <span className="text-slate-400">{nextTitle}</span>
              </span>
            )}
            <div className="ml-auto flex items-center gap-3">
              {timerChip && <span className="rounded-lg border border-slate-700 bg-slate-900/60 px-2 py-1 text-xs font-semibold tabular-nums text-slate-300">{timerChip}</span>}
              {musicLabel && (
                <span className="hidden rounded-lg border border-slate-700 bg-slate-900/60 px-2 py-1 text-xs font-medium text-slate-400 md:inline">
                  Music: {musicLabel}
                  {musicPlaying ? ' ▶' : ''}
                </span>
              )}
              <span className="text-xs font-medium tabular-nums text-slate-500">{formatClock(now)}</span>
            </div>
          </div>

          {/* Large live preview */}
          <main className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-5 sm:p-6">
            <div className="flex w-full max-w-5xl flex-col">
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-900 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_4px_48px_-12px_rgba(0,0,0,0.6)]">
                {status === 'blanked' ? (
                  <div className="flex h-full w-full flex-col items-center justify-center bg-black">
                    <p className="text-3xl font-black text-slate-700">Screen Paused</p>
                    <p className="mt-2 text-sm text-slate-600">The display has been blanked by the teacher</p>
                  </div>
                ) : previewScreen ? (
                  <PreviewStage screen={previewScreen} isLive={status === 'live'} />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center bg-slate-900/60">
                    <p className="text-lg font-semibold text-slate-500">No screen is live</p>
                    <p className="mt-1 text-sm text-slate-600">Select a screen below, then Send to Display.</p>
                  </div>
                )}
              </div>

              {/* Primary actions */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                <button type="button" className={secondaryBtn} onClick={() => prevId && handleSelect(prevId)} disabled={!prevId} data-hub-action="previous">
                  {'◀'} Prev
                </button>
                <button
                  type="button"
                  className={primaryBtn}
                  onClick={handleSend}
                  disabled={!selectedId}
                  data-hub-action="send-to-display"
                >
                  {status === 'live' && activeScreenId === selectedId ? 'On Display' : 'Send to Display'}
                </button>
                {status === 'blanked' ? (
                  <button type="button" className="rounded-xl border border-emerald-400/40 bg-emerald-950/30 px-4 py-2.5 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-900/40" onClick={unblankDisplay} data-hub-action="restore-display">
                    Restore Display
                  </button>
                ) : (
                  <button type="button" className="rounded-xl border border-amber-400/40 bg-amber-950/30 px-4 py-2.5 text-sm font-semibold text-amber-200 transition hover:bg-amber-900/40" onClick={blankDisplay} data-hub-action="blank-display">
                    Blank Screen
                  </button>
                )}
                {activeScreenId && !displayBlanked && (
                  <button type="button" className={secondaryBtn} onClick={clearDisplay} data-hub-action="clear-display">
                    Clear
                  </button>
                )}
                <button type="button" className={secondaryBtn} onClick={() => nextId && handleSelect(nextId)} disabled={!nextId} data-hub-action="next">
                  Next {'▶'}
                </button>
              </div>
            </div>
          </main>

          {/* Scene rail */}
          <footer className="shrink-0 border-t border-slate-800 px-5 py-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1" data-hub-scene-rail>
              {order.map((id) => {
                const screen = screens[id]
                if (!screen) return null
                const live = isScreenLive(id, activeScreenId, displayBlanked)
                const selected = id === selectedId
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleSelect(id)}
                    data-hub-scene={id}
                    aria-pressed={selected}
                    className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                      live
                        ? 'border-emerald-400/50 bg-emerald-950/30 text-emerald-200'
                        : selected
                          ? 'border-cyan-400/50 bg-cyan-950/30 text-cyan-200'
                          : 'border-slate-700 bg-slate-900/60 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                    }`}
                  >
                    {live && <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 align-middle" />}
                    {screen.title}
                  </button>
                )
              })}
            </div>
          </footer>
        </div>
      )}
    </div>
  )
}

/** Faithful, non-interactive render of what students see on /display. */
function PreviewStage({ screen, isLive }: { screen: DisplaySafeScreen; isLive: boolean }) {
  return (
    <div className="relative h-full w-full">
      <DisplayScreenRenderer screen={screen} variant="display" />
      {!isLive && (
        <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-lg border border-slate-500/40 bg-slate-950/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-300 backdrop-blur">
          Preview
        </div>
      )}
    </div>
  )
}
