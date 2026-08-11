import { useCallback, useEffect, useMemo, useState } from 'react'
import { useBoardStore } from '../store/boardStore'
import { CleanClassroomScreenPreview } from './CleanClassroomScreenPreview'
import { QuickToolsPopover } from './QuickToolsPopover'
import { openStudentDisplay } from './displayLaunch'
import type { AppMode } from '../data/types'

function useLiveClock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  return now
}

/** Full Teach Mode shell — calm, slides-first, classroom-ready.
 *  Does NOT render BoardWorkspace, BoardFrame, TeacherCommandDock,
 *  or any edit/studio chrome. */
export function TeachModeShell() {
  const activeScreen = useBoardStore((state) => state.activeScreen)
  const setMode = useBoardStore((state) => state.setMode)
  const navigateToPreviousPage = useBoardStore((state) => state.navigateToPreviousPage)
  const navigateToNextPage = useBoardStore((state) => state.navigateToNextPage)
  const now = useLiveClock()

  const screenLabel = useMemo(() => {
    switch (activeScreen) {
      case 'homeroom': return 'Morning Arrival'
      case 'ready-position': return 'Ready Position'
      case 'snack': return 'Snack'
      case 'lunch': return 'Lunch'
      case 'recess': return 'Recess'
      case 'pack-up': return 'Pack Up'
      default: {
        const word = activeScreen.charAt(0).toUpperCase() + activeScreen.slice(1).replace(/-/g, ' ')
        if (word === 'Social studies') return 'Social Studies'
        return word
      }
    }
  }, [activeScreen])

  const routineBanner = useMemo(() => {
    const banners: Record<string, string> = {
      homeroom: 'Homeroom · Silent Work until Math',
      math: 'Math · Focused Problem Solving',
      reading: 'Reading · Independent Reading',
      writing: 'Writing · Quiet Workshop',
      science: 'Science · Hands-On Investigation',
      'social-studies': 'Social Studies · Collaborative Discussion',
      spelling: 'Spelling · Word Study',
      assessment: 'Assessment · Silent Testing',
      centers: 'Group Work · Rotating Stations',
      snack: 'Snack · Quiet Eating',
      lunch: 'Lunch · Cafeteria Routine',
      recess: 'Recess · Outdoor Play',
      'ready-position': 'Ready Position · Show What You Need',
      homework: 'Homework · Wrap Up Assignments',
      'pack-up': 'Pack Up · End of Day Routine',
    }
    return banners[activeScreen] ?? screenLabel
  }, [activeScreen, screenLabel])

  const timeStr = useMemo(
    () => now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    [now],
  )

  const handlePresent = useCallback(() => {
    openStudentDisplay(window, window.location)
  }, [])

  const handleOpenDashboard = useCallback(() => {
    setMode('edit' as AppMode)
  }, [setMode])

  const handleOpenEdit = useCallback(() => {
    setMode('edit' as AppMode)
  }, [setMode])

  return (
    <div
      className="flex h-dvh w-dvw flex-col overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(30,41,59,0.35) 0%, transparent 55%), ' +
          'linear-gradient(180deg, #0a0f1a 0%, #020617 100%)',
      }}
    >
      {/* ── Teaching Block Header ── */}
      <header className="relative z-30 shrink-0 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-6 px-8 py-5">
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex items-baseline gap-3">
              <h1 className="truncate text-3xl font-semibold tracking-tight text-white">
                {screenLabel}
              </h1>
              <span className="shrink-0 rounded-full bg-emerald-950/60 px-3 py-0.5 text-[11px] font-medium text-emerald-300/80 ring-1 ring-inset ring-emerald-700/30">
                Ready
              </span>
            </div>
            <p className="truncate text-sm text-slate-400/90">{routineBanner}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[1.65rem] font-mono font-medium tabular-nums tracking-tight text-white/90">
              {timeStr}
            </p>
          </div>
        </div>
      </header>

      {/* ── Clean Classroom Screen Preview ── */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <CleanClassroomScreenPreview />
      </div>

      {/* ── Bottom Bar: Navigation + Compact Controls ── */}
      <footer className="relative z-30 shrink-0 border-t border-slate-800/60 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-6 px-8 py-3.5">
          {/* Navigation */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={navigateToPreviousPage}
              className="rounded-xl border border-slate-700/70 bg-slate-900/70 px-4 py-2.5 text-sm font-medium text-slate-300 transition-all duration-150 hover:border-slate-500 hover:bg-slate-800 hover:text-white active:scale-[0.97]"
              aria-label="Previous slide"
            >
              ← Previous
            </button>
            <button
              type="button"
              onClick={handlePresent}
              className="rounded-xl border border-emerald-600/40 bg-emerald-950/40 px-5 py-2.5 text-sm font-semibold text-emerald-200 transition-all duration-150 hover:border-emerald-400/60 hover:bg-emerald-900/50 hover:text-emerald-50 active:scale-[0.97]"
              aria-label="Send to student display"
            >
              Send to Display / Present
            </button>
            <button
              type="button"
              onClick={navigateToNextPage}
              className="rounded-xl border border-slate-700/70 bg-slate-900/70 px-4 py-2.5 text-sm font-medium text-slate-300 transition-all duration-150 hover:border-slate-500 hover:bg-slate-800 hover:text-white active:scale-[0.97]"
              aria-label="Next slide"
            >
              Next →
            </button>
          </div>

          {/* Compact Secondary Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-xl border border-slate-700/60 bg-slate-900/60 px-3.5 py-2.5 text-sm font-medium text-slate-400 transition-all duration-150 hover:border-slate-500/80 hover:bg-slate-800/80 hover:text-slate-200 active:scale-[0.97]"
            >
              Resources
            </button>

            <QuickToolsPopover onActivateDashboard={handleOpenDashboard} />

            <button
              type="button"
              onClick={handleOpenDashboard}
              className="rounded-xl border border-slate-700/60 bg-slate-900/60 px-3.5 py-2.5 text-sm font-medium text-slate-400 transition-all duration-150 hover:border-slate-500/80 hover:bg-slate-800/80 hover:text-slate-200 active:scale-[0.97]"
            >
              Dashboard
            </button>

            <button
              type="button"
              onClick={handleOpenEdit}
              className="rounded-xl border border-cyan-700/40 bg-cyan-950/25 px-3.5 py-2.5 text-sm font-medium text-cyan-300/70 transition-all duration-150 hover:border-cyan-500/60 hover:bg-cyan-900/35 hover:text-cyan-200 active:scale-[0.97]"
            >
              Edit
            </button>
          </div>
        </div>
      </footer>
    </div>
  )
}
